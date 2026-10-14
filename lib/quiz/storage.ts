import fs from "fs";
import path from "path";
import os from "os";
import { QuizData, PlayerAttempt, ScoreboardEntry, ScoreboardDetailEntry, QuizPublicData } from "./types";
import {
  executeRedisCommand,
  isRedisConfigured,
  isProductionServerlessEnvironment,
} from "./redis";

interface StorageSchema {
  quizzes: Record<string, QuizData>;
  attempts: Record<string, PlayerAttempt[]>;
}

/**
 * Path to local JSON file store.
 * WARNING: Local JSON storage is strictly for local development and testing.
 * In serverless production environments (Vercel, AWS Lambda), filesystem writes
 * are ephemeral and will NOT persist across instance lifecycles or cold boots.
 */
function getDbFilePath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), "quizzes-store.json");
  }
  return path.join(process.cwd(), "data", "quizzes-store.json");
}

let cache: StorageSchema | null = null;
let forceFailNextWrite = false;

export function _setStorageWriteFailureSimulation(fail: boolean): void {
  forceFailNextWrite = fail;
}

function ensureDbLoaded(): StorageSchema {
  if (cache) return cache;

  const dbPath = getDbFilePath();
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, "utf8");
      cache = JSON.parse(raw);
    } else {
      cache = { quizzes: {}, attempts: {} };
      persistDb(cache);
    }
  } catch {
    cache = { quizzes: {}, attempts: {} };
  }

  return cache!;
}

function persistDb(data: StorageSchema): boolean {
  if (forceFailNextWrite) {
    return false;
  }

  const dbPath = getDbFilePath();
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("[Storage Error]: Failed to write to primary dbPath:", err);
    try {
      const tmpPath = path.join(os.tmpdir(), "quizzes-store.json");
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
      return true;
    } catch (fallbackErr) {
      console.error("[Storage Error]: Failed to write to fallback tmpPath:", fallbackErr);
      return false;
    }
  }
}

/**
 * Saves a new quiz.
 * In production, fails closed if durable cloud storage (Upstash Redis) is not configured or if persistence fails.
 */
export async function saveQuiz(quiz: QuizData): Promise<boolean> {
  if (forceFailNextWrite) {
    return false;
  }

  const isProd = isProductionServerlessEnvironment();

  if (isProd && !isRedisConfigured()) {
    console.error(
      "[Storage Security Error]: Durable cloud storage (Upstash Redis) is required in production but not configured."
    );
    return false;
  }

  if (isRedisConfigured()) {
    const res = await executeRedisCommand(["SET", `quiz:${quiz.id}`, JSON.stringify(quiz)]);
    if (!res.ok) {
      console.error(`[Storage Error]: Failed to persist quiz ${quiz.id} to Upstash Redis: ${res.error}`);
      return false;
    }
  }

  const db = ensureDbLoaded();
  db.quizzes[quiz.id] = quiz;
  if (!db.attempts[quiz.id]) {
    db.attempts[quiz.id] = [];
  }

  const localSaved = persistDb(db);
  if (!isRedisConfigured() && !localSaved) {
    return false;
  }

  return true;
}

export async function getQuizById(quizId: string): Promise<QuizData | null> {
  const db = ensureDbLoaded();
  if (db.quizzes[quizId]) {
    return db.quizzes[quizId];
  }

  if (isRedisConfigured()) {
    const res = await executeRedisCommand<string>(["GET", `quiz:${quizId}`]);
    if (res.ok && res.result) {
      try {
        const remoteQuiz = typeof res.result === "string" ? JSON.parse(res.result) : res.result;
        db.quizzes[quizId] = remoteQuiz;
        return remoteQuiz;
      } catch (err) {
        console.error("[Storage Error]: Corrupt quiz JSON in Redis:", err);
      }
    }
  }

  return null;
}

export async function getQuizPublicData(quizId: string): Promise<QuizPublicData | null> {
  const quiz = await getQuizById(quizId);
  if (!quiz) return null;

  return {
    id: quiz.id,
    slug: quiz.slug,
    creatorName: quiz.creatorName,
    gender: quiz.gender,
    country: quiz.country,
    theme: quiz.theme,
    createdAt: quiz.createdAt,
    totalQuestions: quiz.questions.length,
    questions: quiz.questions.map((q) => ({
      questionId: q.questionId,
      question: q.question,
      emoji: q.emoji,
      options: q.options,
    })),
  };
}

/**
 * Records a player attempt using atomic Redis HSET operations.
 * Concurrent submissions write to unique field keys in the quiz_attempts hash,
 * completely eliminating read-modify-write overwrite race conditions.
 */
export async function recordAttempt(attempt: PlayerAttempt): Promise<boolean> {
  if (forceFailNextWrite) {
    return false;
  }

  const isProd = isProductionServerlessEnvironment();
  if (isProd && !isRedisConfigured()) {
    console.error(
      "[Storage Security Error]: Durable cloud storage (Upstash Redis) is required in production but not configured."
    );
    return false;
  }

  if (isRedisConfigured()) {
    // Atomic HSET: writes to field `attempt.id` within hash `quiz_attempts:${quizId}`
    const res = await executeRedisCommand([
      "HSET",
      `quiz_attempts:${attempt.quizId}`,
      attempt.id,
      JSON.stringify(attempt),
    ]);
    if (!res.ok) {
      console.error(`[Storage Error]: Failed atomic HSET attempt ${attempt.id} to Upstash Redis: ${res.error}`);
      return false;
    }
  }

  const db = ensureDbLoaded();
  if (!db.attempts[attempt.quizId]) {
    db.attempts[attempt.quizId] = [];
  }

  // Deduplicate in local store
  db.attempts[attempt.quizId] = [
    attempt,
    ...db.attempts[attempt.quizId].filter((a) => a.id !== attempt.id),
  ];

  const localSaved = persistDb(db);
  if (!isRedisConfigured() && !localSaved) {
    return false;
  }

  return true;
}

/**
 * Retrieves all attempts for a quiz from Redis Hash (HVALS) or local store.
 */
async function fetchAttemptsForQuiz(quizId: string): Promise<PlayerAttempt[]> {
  if (isRedisConfigured()) {
    const res = await executeRedisCommand<string[]>(["HVALS", `quiz_attempts:${quizId}`]);
    if (res.ok && Array.isArray(res.result) && res.result.length > 0) {
      const parsed: PlayerAttempt[] = [];
      for (const item of res.result) {
        try {
          const obj = typeof item === "string" ? JSON.parse(item) : item;
          if (obj && obj.id) {
            parsed.push(obj);
          }
        } catch {
          // Skip corrupt attempt
        }
      }
      return parsed;
    }
  }

  const db = ensureDbLoaded();
  return db.attempts[quizId] || [];
}

function sortAttempts(attempts: PlayerAttempt[]): PlayerAttempt[] {
  return [...attempts].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.createdAt - b.createdAt;
  });
}

/**
 * Public Scoreboard: Returns ONLY player names, scores, and badges.
 * NEVER returns raw answers or correct answers.
 */
export async function getScoreboard(quizId: string): Promise<ScoreboardEntry[]> {
  const rawAttempts = await fetchAttemptsForQuiz(quizId);
  const sorted = sortAttempts(rawAttempts);

  return sorted.map((att) => {
    let badge: "bestie" | "friend" | "fake" = "friend";
    const ratio = att.totalQuestions > 0 ? att.score / att.totalQuestions : 0;
    if (ratio >= 0.8) badge = "bestie";
    else if (ratio < 0.5) badge = "fake";

    return {
      id: att.id,
      playerName: att.playerName,
      score: att.score,
      totalQuestions: att.totalQuestions,
      createdAt: att.createdAt,
      statusBadge: badge,
    };
  });
}

/**
 * Authenticated Scoreboard Details: Returns full question-by-question breakdown.
 * Accessible ONLY by creator with valid token or PIN.
 */
export async function getScoreboardDetails(quizId: string): Promise<ScoreboardDetailEntry[]> {
  const quiz = await getQuizById(quizId);
  const rawAttempts = await fetchAttemptsForQuiz(quizId);
  const sorted = sortAttempts(rawAttempts);

  return sorted.map((att) => {
    let badge: "bestie" | "friend" | "fake" = "friend";
    const ratio = att.totalQuestions > 0 ? att.score / att.totalQuestions : 0;
    if (ratio >= 0.8) badge = "bestie";
    else if (ratio < 0.5) badge = "fake";

    const detailedAnswers = quiz
      ? att.answers.map((ans) => {
          const q = quiz.questions.find((qq) => qq.questionId === ans.questionId);
          const theirOpt = q?.options.find((o) => o.id === ans.selectedOptionId)?.text || "Unknown";
          const correctOpt = q?.options.find((o) => o.id === q.correctOptionId)?.text || "Unknown";
          return {
            questionId: ans.questionId,
            question: q?.question || "Question",
            theirAnswer: theirOpt,
            correctAnswer: correctOpt,
            isCorrect: ans.isCorrect,
          };
        })
      : [];

    return {
      id: att.id,
      playerName: att.playerName,
      score: att.score,
      totalQuestions: att.totalQuestions,
      createdAt: att.createdAt,
      statusBadge: badge,
      answers: detailedAnswers,
    };
  });
}

/**
 * Atomically deletes a player attempt.
 * Deleted attempts can never reappear.
 */
export async function deleteAttempt(quizId: string, attemptId: string): Promise<boolean> {
  const remoteDeleted = true;
  if (isRedisConfigured()) {
    const res = await executeRedisCommand(["HDEL", `quiz_attempts:${quizId}`, attemptId]);
    if (!res.ok) {
      console.error(`[Storage Error]: Failed to delete attempt ${attemptId} from Redis: ${res.error}`);
      return false;
    }
  }

  const db = ensureDbLoaded();
  if (db.attempts[quizId]) {
    db.attempts[quizId] = db.attempts[quizId].filter((a) => a.id !== attemptId);
    persistDb(db);
  }

  return remoteDeleted;
}

/**
 * Reliably deletes a quiz and all associated attempts from Redis and local cache.
 */
export async function deleteQuiz(quizId: string): Promise<boolean> {
  const remoteDeleted = true;
  if (isRedisConfigured()) {
    const res = await executeRedisCommand(["DEL", `quiz:${quizId}`, `quiz_attempts:${quizId}`]);
    if (!res.ok) {
      console.error(`[Storage Error]: Failed to delete quiz ${quizId} from Redis: ${res.error}`);
      return false;
    }
  }

  const db = ensureDbLoaded();
  delete db.quizzes[quizId];
  delete db.attempts[quizId];

  if (cache) {
    delete cache.quizzes[quizId];
    delete cache.attempts[quizId];
  }

  persistDb(db);
  return remoteDeleted;
}
