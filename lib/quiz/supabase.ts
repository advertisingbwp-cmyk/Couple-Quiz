import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { QuizData, PlayerAttempt, QuizPublicData } from "./types";
import { hashCreatorToken } from "./security";

export class StorageUnavailableError extends Error {
  constructor(message = "Database storage unavailable") {
    super(message);
    this.name = "StorageUnavailableError";
  }
}

export function isProductionServerlessEnvironment(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    process.env.QUIZ_REQUIRE_DURABLE_STORAGE === "true"
  );
}

function canMock(): boolean {
  return process.env.NODE_ENV === "test" && !isProductionServerlessEnvironment();
}

export interface SupabaseConfig {
  url?: string;
  serviceRoleKey?: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = (
    process.env.QUIZ_TEST_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  ).trim().replace(/\/+$/, "");

  const serviceRoleKey = (
    process.env.QUIZ_TEST_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  ).trim();

  return { url: url || undefined, serviceRoleKey: serviceRoleKey || undefined };
}

export function isSupabaseConfigured(): boolean {
  if (canMock() && mockSupabaseStore) return true;
  const { url, serviceRoleKey } = getSupabaseConfig();
  return Boolean(url && serviceRoleKey);
}

// -----------------------------------------------------------------------------
// In-Memory Supabase Mock for Offline Isolated Unit Tests
// -----------------------------------------------------------------------------

export interface MockQuizRow {
  id: string;
  slug: string;
  creator_name: string;
  gender: string;
  country: string;
  theme: string;
  pin_hash: string;
  creator_token_hash: string;
  created_at: string;
  created_at_ms: number;
  updated_at: string;
}

export interface MockQuestionRow {
  id: string;
  quiz_id: string;
  question_id: string;
  question_text: string;
  emoji?: string;
  options: unknown;
  correct_option_id: number;
  display_order: number;
}

export interface MockAttemptRow {
  id: string;
  quiz_id: string;
  player_name: string;
  score: number;
  total_questions: number;
  created_at: string;
  created_at_ms: number;
}

export interface MockAnswerRow {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id: number;
  is_correct: boolean;
}

export interface MockRateLimitRow {
  rate_key: string;
  failed_count: number;
  window_expires_at: number; // absolute epoch ms
}

export interface InMemorySupabaseStore {
  quizzes: Map<string, MockQuizRow>;
  questions: Map<string, MockQuestionRow[]>; // quiz_id -> rows
  attempts: Map<string, MockAttemptRow>; // attempt_id -> row
  quizAttempts: Map<string, Set<string>>; // quiz_id -> Set of attempt_ids
  answers: Map<string, MockAnswerRow[]>; // attempt_id -> rows
  rateLimits: Map<string, MockRateLimitRow>;
}

let mockSupabaseStore: InMemorySupabaseStore | null = null;
let mockTimeOffset = 0;
let forceFailNextRpc: string | null = null;
let forceFailNextQuery = false;

export function _enableMockSupabase(enable: boolean): void {
  if (enable && !canMock()) {
    throw new Error("Mock Supabase is allowed only in isolated test mode.");
  }
  mockSupabaseStore = enable
    ? {
        quizzes: new Map(),
        questions: new Map(),
        attempts: new Map(),
        quizAttempts: new Map(),
        answers: new Map(),
        rateLimits: new Map(),
      }
    : null;
  mockTimeOffset = 0;
  forceFailNextRpc = null;
  forceFailNextQuery = false;
}

export function _getMockSupabaseStore(): InMemorySupabaseStore | null {
  if (!canMock()) throw new Error("Test mode required.");
  return mockSupabaseStore;
}

export function _advanceMockSupabaseTime(milliseconds: number): void {
  if (!canMock() || milliseconds < 0) throw new Error("Invalid test clock operation.");
  mockTimeOffset += milliseconds;
}

export function _setMockRpcFailure(rpcName: string | null): void {
  if (!canMock()) throw new Error("Test mode required.");
  forceFailNextRpc = rpcName;
}

export function _setMockQueryFailure(fail: boolean): void {
  if (!canMock()) throw new Error("Test mode required.");
  forceFailNextQuery = fail;
}

function getNowMs(): number {
  return Date.now() + mockTimeOffset;
}

// -----------------------------------------------------------------------------
// Server-Side Client Singleton
// -----------------------------------------------------------------------------

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = "";

export function getSupabaseClient(): SupabaseClient {
  if (isProductionServerlessEnvironment() && !isSupabaseConfigured()) {
    throw new StorageUnavailableError("Supabase credentials not configured in production");
  }

  const { url, serviceRoleKey } = getSupabaseConfig();
  if (!url || !serviceRoleKey) {
    throw new StorageUnavailableError("Supabase URL and Service Role Key required");
  }

  const currentKey = `${url}:${serviceRoleKey}`;
  if (!cachedClient || cachedConfigKey !== currentKey) {
    cachedClient = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    cachedConfigKey = currentKey;
  }

  return cachedClient;
}

// -----------------------------------------------------------------------------
// RPC Execution
// -----------------------------------------------------------------------------

export async function dbRpc<T>(
  fn: string,
  params: Record<string, unknown>
): Promise<{ data: T | null; error: Error | null }> {
  if (canMock() && mockSupabaseStore) {
    if (forceFailNextRpc === fn) {
      forceFailNextRpc = null;
      return { data: null, error: new Error(`Simulated failure in RPC ${fn}`) };
    }
    return executeMockRpc<T>(mockSupabaseStore, fn, params);
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.rpc(fn, params);
    if (error) {
      return { data: null, error: new Error(error.message) };
    }
    return { data: data as T, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

function executeMockRpc<T>(
  store: InMemorySupabaseStore,
  fn: string,
  params: Record<string, unknown>
): { data: T | null; error: Error | null } {
  switch (fn) {
    case "save_quiz_with_questions": {
      const pQuiz = params.p_quiz as Record<string, unknown>;
      const pQuestions = params.p_questions as Array<Record<string, unknown>>;
      const quizId = String(pQuiz.id || "");
      if (!quizId) return { data: null, error: new Error("Missing quiz id") };

      // Prevent unauthorized quiz overwrites: insert-only semantics
      if (store.quizzes.has(quizId)) {
        return { data: false as unknown as T, error: null };
      }

      const nowIso = new Date(getNowMs()).toISOString();
      const createdAtMs = Number(pQuiz.createdAt) || getNowMs();

      store.quizzes.set(quizId, {
        id: quizId,
        slug: String(pQuiz.slug || ""),
        creator_name: String(pQuiz.creatorName || ""),
        gender: String(pQuiz.gender || "male"),
        country: String(pQuiz.country || "PK"),
        theme: String(pQuiz.theme || "dont_block_me"),
        pin_hash: String(pQuiz.pinHash || ""),
        creator_token_hash: String(pQuiz.creatorTokenHash || ""),
        created_at: new Date(createdAtMs).toISOString(),
        created_at_ms: createdAtMs,
        updated_at: nowIso,
      });

      const questionRows: MockQuestionRow[] = pQuestions.map((q, idx) => ({
        id: `mock-q-${quizId}-${idx}`,
        quiz_id: quizId,
        question_id: String(q.questionId),
        question_text: String(q.question),
        emoji: q.emoji ? String(q.emoji) : undefined,
        options: q.options,
        correct_option_id: Number(q.correctOptionId),
        display_order: Number(q.displayOrder ?? idx),
      }));

      store.questions.set(quizId, questionRows);
      return { data: true as unknown as T, error: null };
    }

    case "record_quiz_attempt": {
      const pAttempt = params.p_attempt as Record<string, unknown>;
      const pAnswers = params.p_answers as Array<Record<string, unknown>>;
      const quizId = String(pAttempt.quizId || "");
      const attemptId = String(pAttempt.id || "");

      if (!store.quizzes.has(quizId)) {
        return { data: -1 as unknown as T, error: null }; // Parent quiz missing
      }

      if (store.attempts.has(attemptId)) {
        return { data: 0 as unknown as T, error: null }; // Duplicate attempt
      }

      const createdAtMs = Number(pAttempt.createdAt) || getNowMs();
      const attemptRow: MockAttemptRow = {
        id: attemptId,
        quiz_id: quizId,
        player_name: String(pAttempt.playerName || ""),
        score: Number(pAttempt.score || 0),
        total_questions: Number(pAttempt.totalQuestions || 0),
        created_at: new Date(createdAtMs).toISOString(),
        created_at_ms: createdAtMs,
      };

      store.attempts.set(attemptId, attemptRow);
      if (!store.quizAttempts.has(quizId)) {
        store.quizAttempts.set(quizId, new Set());
      }
      store.quizAttempts.get(quizId)!.add(attemptId);

      const answerRows: MockAnswerRow[] = pAnswers.map((ans, idx) => ({
        id: `mock-ans-${attemptId}-${idx}`,
        attempt_id: attemptId,
        question_id: String(ans.questionId),
        selected_option_id: Number(ans.selectedOptionId),
        is_correct: Boolean(ans.isCorrect),
      }));

      store.answers.set(attemptId, answerRows);
      return { data: 1 as unknown as T, error: null };
    }

    case "delete_quiz_atomic": {
      const quizId = String(params.p_quiz_id || "");
      if (!store.quizzes.has(quizId)) {
        return { data: false as unknown as T, error: null };
      }

      store.quizzes.delete(quizId);
      store.questions.delete(quizId);

      const attemptIds = store.quizAttempts.get(quizId) || new Set();
      for (const attId of attemptIds) {
        store.attempts.delete(attId);
        store.answers.delete(attId);
      }
      store.quizAttempts.delete(quizId);

      return { data: true as unknown as T, error: null };
    }

    case "delete_attempt_atomic": {
      const quizId = String(params.p_quiz_id || "");
      const attemptId = String(params.p_attempt_id || "");

      const attempt = store.attempts.get(attemptId);
      if (!attempt || attempt.quiz_id !== quizId) {
        return { data: false as unknown as T, error: null };
      }

      store.attempts.delete(attemptId);
      store.answers.delete(attemptId);
      store.quizAttempts.get(quizId)?.delete(attemptId);

      return { data: true as unknown as T, error: null };
    }

    case "check_pin_rate_limit": {
      const rateKey = String(params.p_rate_key || "");
      const maxAttempts = Number(params.p_max_attempts || 5);
      const row = store.rateLimits.get(rateKey);

      if (!row) return { data: true as unknown as T, error: null };
      if (getNowMs() >= row.window_expires_at) return { data: true as unknown as T, error: null };

      return { data: (row.failed_count < maxAttempts) as unknown as T, error: null };
    }

    case "record_pin_rate_limit_outcome": {
      const rateKey = String(params.p_rate_key || "");
      const outcome = String(params.p_outcome || "");
      const maxAttempts = Number(params.p_max_attempts || 5);
      const windowSeconds = Number(params.p_window_seconds || 600);
      const now = getNowMs();
      const newExpiry = now + windowSeconds * 1000;
      const row = store.rateLimits.get(rateKey);
      if (!row || now >= row.window_expires_at) {
        if (outcome === "success") {
          store.rateLimits.set(rateKey, { rate_key: rateKey, failed_count: 0, window_expires_at: newExpiry });
          return { data: 1 as unknown as T, error: null };
        } else {
          store.rateLimits.set(rateKey, { rate_key: rateKey, failed_count: 1, window_expires_at: newExpiry });
          return { data: -1 as unknown as T, error: null };
        }
      }

      if (row.failed_count >= maxAttempts) {
        return { data: 0 as unknown as T, error: null };
      }

      if (outcome === "success") {
        return { data: 1 as unknown as T, error: null };
      }

      row.failed_count++;
      return { data: -1 as unknown as T, error: null };
    }

    case "clear_pin_rate_limit": {
      const rateKey = String(params.p_rate_key || "");
      store.rateLimits.delete(rateKey);
      return { data: null as unknown as T, error: null };
    }

    default:
      return { data: null, error: new Error(`Unknown RPC ${fn}`) };
  }
}

// -----------------------------------------------------------------------------
// High-Level Typed Storage Operations
// -----------------------------------------------------------------------------

export async function dbSaveQuiz(quiz: QuizData): Promise<boolean> {
  const creatorTokenHash = hashCreatorToken(quiz.creatorToken);
  const pQuiz = {
    id: quiz.id,
    slug: quiz.slug,
    creatorName: quiz.creatorName,
    gender: quiz.gender,
    country: quiz.country,
    theme: quiz.theme,
    pinHash: quiz.pinHash,
    creatorTokenHash,
    createdAt: quiz.createdAt,
  };

  const pQuestions = quiz.questions.map((q, idx) => ({
    questionId: q.questionId,
    question: q.question,
    emoji: q.emoji,
    options: q.options,
    correctOptionId: q.correctOptionId,
    displayOrder: idx,
  }));

  const res = await dbRpc<boolean>("save_quiz_with_questions", {
    p_quiz: pQuiz,
    p_questions: pQuestions,
  });

  if (res.error) throw new StorageUnavailableError(res.error.message);
  return Boolean(res.data);
}

export async function dbGetQuiz(id: string): Promise<QuizData | null> {
  if (canMock() && mockSupabaseStore) {
    if (forceFailNextQuery) throw new StorageUnavailableError("Simulated query failure");
    const quizRow = mockSupabaseStore.quizzes.get(id);
    if (!quizRow) return null;
    const qRows = (mockSupabaseStore.questions.get(id) || []).slice().sort((a, b) => a.display_order - b.display_order);
    return {
      id: quizRow.id,
      slug: quizRow.slug,
      creatorName: quizRow.creator_name,
      gender: quizRow.gender as "male" | "female",
      country: quizRow.country,
      theme: quizRow.theme,
      pinHash: quizRow.pin_hash,
      creatorToken: quizRow.creator_token_hash,
      createdAt: quizRow.created_at_ms,
      questions: qRows.map((q) => ({
        questionId: q.question_id,
        question: q.question_text,
        emoji: q.emoji,
        options: q.options as QuizData["questions"][0]["options"],
        correctOptionId: q.correct_option_id,
      })),
    };
  }

  const client = getSupabaseClient();
  const { data: quizRow, error: quizError } = await client
    .from("quizzes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (quizError) throw new StorageUnavailableError(quizError.message);
  if (!quizRow) return null;

  const { data: qRows, error: qError } = await client
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", id)
    .order("display_order", { ascending: true });

  if (qError) throw new StorageUnavailableError(qError.message);

  return {
    id: quizRow.id,
    slug: quizRow.slug,
    creatorName: quizRow.creator_name,
    gender: quizRow.gender as "male" | "female",
    country: quizRow.country,
    theme: quizRow.theme,
    pinHash: quizRow.pin_hash,
    creatorToken: quizRow.creator_token_hash,
    createdAt: Number(quizRow.created_at_ms || new Date(quizRow.created_at).getTime()),
    questions: ((qRows as unknown as MockQuestionRow[]) || []).map((q) => ({
      questionId: q.question_id,
      question: q.question_text,
      emoji: q.emoji,
      options: q.options as QuizData["questions"][0]["options"],
      correctOptionId: q.correct_option_id,
    })),
  };
}

export async function dbGetQuizPublic(id: string): Promise<QuizPublicData | null> {
  if (canMock() && mockSupabaseStore) {
    if (forceFailNextQuery) throw new StorageUnavailableError("Simulated query failure");
    const quizRow = mockSupabaseStore.quizzes.get(id);
    if (!quizRow) return null;
    const qRows = (mockSupabaseStore.questions.get(id) || []).slice().sort((a, b) => a.display_order - b.display_order);
    return {
      id: quizRow.id,
      slug: quizRow.slug,
      creatorName: quizRow.creator_name,
      gender: quizRow.gender as "male" | "female",
      country: quizRow.country,
      theme: quizRow.theme,
      createdAt: quizRow.created_at_ms,
      totalQuestions: qRows.length,
      questions: qRows.map((q) => ({
        questionId: q.question_id,
        question: q.question_text,
        emoji: q.emoji,
        options: q.options as QuizPublicData["questions"][0]["options"],
      })),
    };
  }

  const client = getSupabaseClient();
  const { data: quizRow, error: quizError } = await client
    .from("quizzes")
    .select("id, slug, creator_name, gender, country, theme, created_at_ms, created_at")
    .eq("id", id)
    .maybeSingle();

  if (quizError) throw new StorageUnavailableError(quizError.message);
  if (!quizRow) return null;

  const { data: qRows, error: qError } = await client
    .from("quiz_questions")
    .select("question_id, question_text, emoji, options")
    .eq("quiz_id", id)
    .order("display_order", { ascending: true });

  if (qError) throw new StorageUnavailableError(qError.message);

  return {
    id: quizRow.id,
    slug: quizRow.slug,
    creatorName: quizRow.creator_name,
    gender: quizRow.gender as "male" | "female",
    country: quizRow.country,
    theme: quizRow.theme,
    createdAt: Number(quizRow.created_at_ms || new Date(quizRow.created_at).getTime()),
    totalQuestions: (qRows || []).length,
    questions: ((qRows as unknown as MockQuestionRow[]) || []).map((q) => ({
      questionId: q.question_id,
      question: q.question_text,
      emoji: q.emoji,
      options: q.options as QuizPublicData["questions"][0]["options"],
    })),
  };
}

export async function dbRecordAttempt(attempt: PlayerAttempt): Promise<boolean> {
  const pAttempt = {
    id: attempt.id,
    quizId: attempt.quizId,
    playerName: attempt.playerName,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    createdAt: attempt.createdAt,
  };

  const pAnswers = attempt.answers.map((ans) => ({
    questionId: ans.questionId,
    selectedOptionId: ans.selectedOptionId,
    isCorrect: ans.isCorrect,
  }));

  const res = await dbRpc<number>("record_quiz_attempt", {
    p_attempt: pAttempt,
    p_answers: pAnswers,
  });

  if (res.error) throw new StorageUnavailableError(res.error.message);
  if (res.data === -1) return false; // Parent quiz missing/deleted
  return res.data === 1 || res.data === 0;
}

export async function dbFetchAttempts(quizId: string): Promise<PlayerAttempt[]> {
  if (canMock() && mockSupabaseStore) {
    if (forceFailNextQuery) throw new StorageUnavailableError("Simulated query failure");
    const attemptIds = mockSupabaseStore.quizAttempts.get(quizId) || new Set();
    const list: PlayerAttempt[] = [];
    for (const id of attemptIds) {
      const att = mockSupabaseStore.attempts.get(id);
      if (att) {
        const answers = (mockSupabaseStore.answers.get(id) || []).map((ans) => ({
          questionId: ans.question_id,
          selectedOptionId: ans.selected_option_id,
          isCorrect: ans.is_correct,
        }));
        list.push({
          id: att.id,
          quizId: att.quiz_id,
          playerName: att.player_name,
          score: att.score,
          totalQuestions: att.total_questions,
          createdAt: att.created_at_ms,
          answers,
        });
      }
    }
    return list.sort((a, b) => b.score - a.score || a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  }

  const client = getSupabaseClient();
  const { data: attRows, error: attError } = await client
    .from("quiz_attempts")
    .select("*")
    .eq("quiz_id", quizId)
    .order("score", { ascending: false })
    .order("created_at_ms", { ascending: true })
    .order("id", { ascending: true });

  if (attError) throw new StorageUnavailableError(attError.message);
  if (!attRows || attRows.length === 0) return [];

  const typedAttRows = attRows as unknown as MockAttemptRow[];
  const attemptIds = typedAttRows.map((a) => a.id);
  const { data: ansRows, error: ansError } = await client
    .from("quiz_attempt_answers")
    .select("*")
    .in("attempt_id", attemptIds);

  if (ansError) throw new StorageUnavailableError(ansError.message);

  const typedAnsRows = (ansRows as unknown as MockAnswerRow[]) || [];
  const answersByAttempt = new Map<string, Array<{ questionId: string; selectedOptionId: number; isCorrect: boolean }>>();
  for (const ans of typedAnsRows) {
    if (!answersByAttempt.has(ans.attempt_id)) {
      answersByAttempt.set(ans.attempt_id, []);
    }
    answersByAttempt.get(ans.attempt_id)!.push({
      questionId: ans.question_id,
      selectedOptionId: ans.selected_option_id,
      isCorrect: ans.is_correct,
    });
  }

  return typedAttRows.map((att) => ({
    id: att.id,
    quizId: att.quiz_id,
    playerName: att.player_name,
    score: att.score,
    totalQuestions: att.total_questions,
    createdAt: Number(att.created_at_ms || new Date(att.created_at).getTime()),
    answers: answersByAttempt.get(att.id) || [],
  }));
}

export async function dbDeleteAttempt(quizId: string, attemptId: string): Promise<boolean> {
  const res = await dbRpc<boolean>("delete_attempt_atomic", {
    p_quiz_id: quizId,
    p_attempt_id: attemptId,
  });

  if (res.error) throw new StorageUnavailableError(res.error.message);
  return Boolean(res.data);
}

export async function dbDeleteQuiz(quizId: string): Promise<boolean> {
  const res = await dbRpc<boolean>("delete_quiz_atomic", {
    p_quiz_id: quizId,
  });

  if (res.error) throw new StorageUnavailableError(res.error.message);
  return Boolean(res.data);
}
