import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import {
  _enableMockSupabase,
  _getMockSupabaseStore,
  _advanceMockSupabaseTime,
  _setMockRpcFailure,
  isSupabaseConfigured,
  dbRpc,
} from "../lib/quiz/supabase";
import {
  createQuizStorage,
  saveQuiz,
  recordAttempt,
  deleteAttempt,
  deleteQuiz,
  _setStorageWriteFailureSimulation,
  StorageUnavailableError,
} from "../lib/quiz/storage";
import {
  hashPin,
  generateCreatorToken,
  extractClientIp,
  normalizeClientIp,
  checkPinRateLimit,
  recordFailedPinAttempt,
  clearPinRateLimit,
  authenticateCreator,
  RateLimitUnavailableError,
} from "../lib/quiz/security";
import { DEFAULT_QUIZ_QUESTIONS } from "../lib/quiz/questions";
import type { QuizData, PlayerAttempt } from "../lib/quiz/types";
import { POST as createQuiz } from "../app/api/quiz/route";
import { GET as readQuiz, DELETE as removeQuiz } from "../app/api/quiz/[id]/route";
import { POST as submit } from "../app/api/quiz/[id]/attempt/route";
import { GET as scoreboard, POST as details, DELETE as removeAttempt } from "../app/api/quiz/[id]/scoreboard/route";
import { migrateLegacyData } from "../scripts/migrate-legacy-data";

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
let directories: string[] = [];

beforeEach(() => {
  _enableMockSupabase(true);
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
  _setStorageWriteFailureSimulation(false);
  _enableMockSupabase(false);
  for (const dir of directories) fs.rmSync(dir, { recursive: true, force: true });
  directories = [];
});

const pin = String(crypto.randomInt(1000, 10000));
const wrongPin = pin === "1000" ? "1001" : "1000";
const pinHash = hashPin(pin);

function fixture(): QuizData {
  return {
    id: "test_" + crypto.randomUUID(),
    slug: "fixture",
    creatorName: "Test Creator",
    gender: "male",
    country: "PK",
    theme: "dont_block_me",
    pinHash,
    creatorToken: generateCreatorToken(),
    createdAt: Date.now(),
    questions: DEFAULT_QUIZ_QUESTIONS.slice(0, 5).map((q) => ({
      questionId: q.id,
      question: q.question,
      emoji: q.emoji,
      options: q.options,
      correctOptionId: 0,
    })),
  };
}

const attempt = (q: QuizData, id = crypto.randomUUID()): PlayerAttempt => ({
  id,
  quizId: q.id,
  playerName: "Test Player",
  score: 5,
  totalQuestions: 5,
  createdAt: Date.now(),
  answers: q.questions.map((quest) => ({
    questionId: quest.questionId,
    selectedOptionId: 0,
    isCorrect: true,
  })),
});

const params = (id: string) => ({ params: Promise.resolve({ id }) });
const request = (method: string, body?: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/quiz", {
    method,
    headers: { "content-type": "application/json", ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

function tempFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "couple-quiz-test-"));
  directories.push(dir);
  return path.join(dir, "store.json");
}

test("mock opt-in activates Supabase branch, never activates in production", async () => {
  assert.equal(isSupabaseConfigured(), true);
  Object.assign(process.env, { NODE_ENV: "production" });
  assert.equal(isSupabaseConfigured(), false);
  assert.throws(() => _enableMockSupabase(true), /test mode/);

  Object.assign(process.env, { NODE_ENV: "test", VERCEL: "1" });
  assert.equal(isSupabaseConfigured(), false);
  assert.throws(() => _enableMockSupabase(true), /test mode/);
  delete process.env.VERCEL;
});

test("Supabase mock models atomic RPC operations and cascades accurately", async () => {
  const q = fixture();
  // save quiz with questions
  const saveRes = await dbRpc<boolean>("save_quiz_with_questions", {
    p_quiz: {
      id: q.id,
      slug: q.slug,
      creatorName: q.creatorName,
      gender: q.gender,
      country: q.country,
      theme: q.theme,
      pinHash: q.pinHash,
      creatorTokenHash: "hash123",
      createdAt: q.createdAt,
    },
    p_questions: q.questions.map((item, idx) => ({
      questionId: item.questionId,
      question: item.question,
      emoji: item.emoji,
      options: item.options,
      correctOptionId: item.correctOptionId,
      displayOrder: idx,
    })),
  });
  assert.equal(saveRes.data, true);
  assert.equal(_getMockSupabaseStore()!.quizzes.has(q.id), true);
  assert.equal(_getMockSupabaseStore()!.questions.get(q.id)!.length, 5);

  // record attempt
  const att = attempt(q);
  const recRes = await dbRpc<number>("record_quiz_attempt", {
    p_attempt: {
      id: att.id,
      quizId: att.quizId,
      playerName: att.playerName,
      score: att.score,
      totalQuestions: att.totalQuestions,
      createdAt: att.createdAt,
    },
    p_answers: att.answers,
  });
  assert.equal(recRes.data, 1);
  assert.equal(_getMockSupabaseStore()!.attempts.has(att.id), true);

  // record duplicate attempt returns 0
  const dupRes = await dbRpc<number>("record_quiz_attempt", {
    p_attempt: { id: att.id, quizId: att.quizId, playerName: "Dup", score: 0, totalQuestions: 5, createdAt: Date.now() },
    p_answers: [],
  });
  assert.equal(dupRes.data, 0);

  // delete attempt
  const delAttRes = await dbRpc<boolean>("delete_attempt_atomic", {
    p_quiz_id: q.id,
    p_attempt_id: att.id,
  });
  assert.equal(delAttRes.data, true);
  assert.equal(_getMockSupabaseStore()!.attempts.has(att.id), false);

  // delete quiz cascades questions and attempts
  const delQuizRes = await dbRpc<boolean>("delete_quiz_atomic", {
    p_quiz_id: q.id,
  });
  assert.equal(delQuizRes.data, true);
  assert.equal(_getMockSupabaseStore()!.quizzes.has(q.id), false);
  assert.equal(_getMockSupabaseStore()!.questions.has(q.id), false);
});

test("32 simultaneous writes persist across independent storage instances", async () => {
  const a = createQuizStorage(tempFile());
  const b = createQuizStorage(tempFile());
  const q = fixture();

  assert.equal(await a.saveQuiz(q), true);
  const attempts = Array.from({ length: 32 }, () => attempt(q));

  const results = await Promise.all(
    attempts.map((entry, i) => (i % 2 ? a : b).recordAttempt(entry))
  );
  assert.ok(results.every(Boolean));
  assert.equal(_getMockSupabaseStore()!.attempts.size, 32);

  const freshStorage = createQuizStorage(tempFile());
  assert.equal((await freshStorage.getScoreboard(q.id)).length, 32);

  // Delete attempt
  assert.equal(await a.deleteAttempt(q.id, attempts[0].id), true);
  assert.equal(await b.deleteAttempt(q.id, attempts[0].id), false);
  assert.equal((await a.getScoreboard(q.id)).length, 31);
  assert.equal((await b.getScoreboard(q.id)).length, 31);

  // Delete quiz cascades all
  assert.equal(await a.deleteQuiz(q.id), true);
  assert.equal(await b.deleteQuiz(q.id), false);
  assert.equal(await a.getQuizById(q.id), null);
  assert.equal(await b.getQuizById(q.id), null);
  assert.deepEqual(await a.getScoreboard(q.id), []);

  // Cannot create orphan attempts on deleted quiz
  assert.equal(
    await b.recordAttempt(attempt(q)),
    false,
    "Cannot recreate orphan attempts after quiz deletion"
  );
});

test("deletion reports missing IDs and already-deleted quizzes truthfully", async () => {
  const q = fixture();
  const att = attempt(q);
  await saveQuiz(q);
  await recordAttempt(att);

  assert.equal(await deleteAttempt(q.id, "absent"), false);
  assert.equal(await deleteAttempt(q.id, att.id), true);
  assert.equal(await deleteAttempt(q.id, att.id), false);
  assert.equal(await deleteQuiz(q.id), true);
  assert.equal(await deleteQuiz(q.id), false);
});

test("local persistence failure does not mutate cache or report a successful delete", async () => {
  _enableMockSupabase(false);
  const file = tempFile();
  const storage = createQuizStorage(file);
  const q = fixture();
  const att = attempt(q);

  await storage.saveQuiz(q);
  await storage.recordAttempt(att);

  _setStorageWriteFailureSimulation(true);
  await assert.rejects(storage.deleteAttempt(q.id, att.id), StorageUnavailableError);
  await assert.rejects(storage.deleteQuiz(q.id), StorageUnavailableError);
  assert.equal(await storage.saveQuiz({ ...q, creatorName: "Not saved" }), false);
  assert.equal((await storage.getQuizById(q.id))!.creatorName, q.creatorName);
  assert.equal((await storage.getScoreboard(q.id)).length, 1);

  _setStorageWriteFailureSimulation(false);
  assert.equal(await storage.deleteAttempt(q.id, att.id), true);
  assert.equal(await storage.deleteAttempt(q.id, att.id), false);
  assert.equal(await storage.deleteQuiz(q.id), true);
  assert.equal(await storage.deleteQuiz(q.id), false);
});

test("proxy identity rejects spoofed headers and normalizes IPv4/IPv6", () => {
  const headers = {
    "x-forwarded-for": "192.0.2.1",
    "x-real-ip": "192.0.2.2",
    "x-vercel-forwarded-for": "192.0.2.3",
    "cf-connecting-ip": "192.0.2.4",
  };
  try {
    delete process.env.VERCEL;
    delete process.env.QUIZ_TRUSTED_PROXY;
    assert.equal(extractClientIp(request("GET", undefined, headers)), "unknown");
    assert.equal(extractClientIp(request("GET", undefined, { "x-forwarded-for": "198.51.100.1" })), "unknown");

    // Vercel deployment strictly trusts only x-vercel-forwarded-for
    process.env.VERCEL = "1";
    assert.equal(extractClientIp(request("GET", undefined, headers)), "192.0.2.3");
    assert.equal(
      extractClientIp(
        request("GET", undefined, {
          "cf-connecting-ip": "198.51.100.99",
          "x-forwarded-for": "198.51.100.88",
          "x-vercel-forwarded-for": "192.0.2.3",
        })
      ),
      "192.0.2.3"
    );
    assert.equal(extractClientIp(request("GET", undefined, { ...headers, "x-vercel-forwarded-for": "bad,192.0.2.9" })), "unknown");

    // Cloudflare deployment strictly trusts only cf-connecting-ip
    delete process.env.VERCEL;
    process.env.QUIZ_TRUSTED_PROXY = "cloudflare";
    assert.equal(extractClientIp(request("GET", undefined, headers)), "192.0.2.4");
    assert.equal(
      extractClientIp(
        request("GET", undefined, {
          "x-vercel-forwarded-for": "198.51.100.99",
          "x-forwarded-for": "198.51.100.88",
          "cf-connecting-ip": "192.0.2.4",
        })
      ),
      "192.0.2.4"
    );

    // IP canonicalization and validation
    assert.equal(normalizeClientIp("2001:0DB8:0000:0000:0000:0000:0000:0001"), "2001:db8::1");
    assert.equal(normalizeClientIp("::ffff:192.0.2.1"), "192.0.2.1");
    for (const ip of ["127.1", "1.2.3.4:80", "999.1.1.1", "fe80::1%eth0", "1.2.3.4,5.6.7.8", "localhost", "evil.com"]) {
      assert.equal(normalizeClientIp(ip), null);
    }
  } finally {
    delete process.env.VERCEL;
    delete process.env.QUIZ_TRUSTED_PROXY;
  }
});

test("fixed Supabase failure window blocks sixth failure and does not extend or charge successes", async () => {
  const q = fixture();
  const req = request("POST");
  for (let i = 0; i < 3; i++) {
    assert.equal(await authenticateCreator(req, q, { creatorToken: q.creatorToken }), 200);
  }

  for (let i = 0; i < 5; i++) {
    assert.equal(await authenticateCreator(req, q, { pin: wrongPin }), 403);
    if (i === 2) {
      assert.equal(await authenticateCreator(req, q, { pin }), 200);
    }
    _advanceMockSupabaseTime(1000);
  }

  assert.equal(await authenticateCreator(req, q, { pin: wrongPin }), 429);
  assert.equal(await authenticateCreator(req, q, { pin }), 429);

  // Advance time past the 10-minute window (600s)
  _advanceMockSupabaseTime(595_001);
  assert.equal(await authenticateCreator(req, q, { pin }), 200);
});

test("40 concurrent spoofed brute-force requests share one atomic failure allowance", async () => {
  const q = fixture();
  const requests = Array.from({ length: 40 }, () =>
    request("POST", undefined, { "x-forwarded-for": crypto.randomBytes(4).join(".") })
  );
  const results = await Promise.all(
    requests.map((req) => authenticateCreator(req, q, { pin: wrongPin }))
  );
  assert.equal(results.filter((s) => s === 403).length, 5);
  assert.equal(results.filter((s) => s === 429).length, 35);
});

test("authentication fails closed on query and clear errors in production", async () => {
  _enableMockSupabase(false);
  Object.assign(process.env, {
    NODE_ENV: "production",
    SUPABASE_URL: "https://db.invalid",
    SUPABASE_SERVICE_ROLE_KEY: "secret",
  });
  globalThis.fetch = async () => {
    throw new Error("network down");
  };
  await assert.rejects(checkPinRateLimit("192.0.2.1"), RateLimitUnavailableError);
  await assert.rejects(recordFailedPinAttempt("192.0.2.1"), RateLimitUnavailableError);
  await assert.rejects(clearPinRateLimit("192.0.2.1"), RateLimitUnavailableError);
});

test("API create, answer, scoreboard, private details, deletion and repeat deletion", async () => {
  const payload = {
    creatorName: "Ayesha",
    gender: "female",
    country: "PK",
    secretPin: pin,
    questions: DEFAULT_QUIZ_QUESTIONS.slice(0, 10).map((q) => ({
      questionId: q.id,
      correctOptionId: 1,
    })),
  };

  const createRes = await createQuiz(request("POST", payload));
  assert.equal(createRes.status, 200);
  const created = await createRes.json();
  assert.ok(created.quizId);
  assert.ok(created.creatorToken);

  const getRes = await readQuiz(request("GET"), params(created.quizId));
  assert.equal(getRes.status, 200);
  const publicData = (await getRes.json()).quiz;
  assert.equal(publicData.creatorName, "Ayesha");
  assert.equal(publicData.questions.length, 10);
  assert.equal("pinHash" in publicData, false);
  assert.equal("creatorToken" in publicData, false);
  for (const q of publicData.questions) {
    assert.equal("correctOptionId" in q, false);
  }

  // Answer quiz
  const answerPayload = {
    playerName: "Bilal",
    answers: publicData.questions.map((q: { questionId: string }) => ({
      questionId: q.questionId,
      selectedOptionId: 1,
    })),
  };
  const submitRes = await submit(request("POST", answerPayload), params(created.quizId));
  assert.equal(submitRes.status, 200);
  const answerResult = await submitRes.json();
  assert.equal(answerResult.score, 10);

  // Scoreboard
  const boardRes = await scoreboard(request("GET"), params(created.quizId));
  assert.equal(boardRes.status, 200);
  const boardData = (await boardRes.json()).scoreboard;
  assert.equal(boardData.length, 1);
  assert.equal(boardData[0].playerName, "Bilal");
  assert.equal(boardData[0].score, 10);

  // Creator details with creatorToken
  const detailsRes = await details(
    request("POST", { creatorToken: created.creatorToken }),
    params(created.quizId)
  );
  assert.equal(detailsRes.status, 200);
  const detailData = (await detailsRes.json()).scoreboard;
  assert.equal(detailData.length, 1);
  assert.equal(detailData[0].answers.length, 10);

  // Remove attempt
  const removeAttemptRes = await removeAttempt(
    request("DELETE", { attemptId: answerResult.attemptId, creatorToken: created.creatorToken }),
    params(created.quizId)
  );
  assert.equal(removeAttemptRes.status, 200);

  // Quiz deletion with token-only is rejected with 403 (Phase 9.3)
  const tokenOnlyDel = await removeQuiz(
    request("DELETE", { creatorToken: created.creatorToken }),
    params(created.quizId)
  );
  assert.equal(tokenOnlyDel.status, 403);

  // Remove quiz with PIN
  const delRes = await removeQuiz(
    request("DELETE", { pin }),
    params(created.quizId)
  );
  assert.equal(delRes.status, 200);

  // Repeat delete returns 404
  const repeatDel = await removeQuiz(
    request("DELETE", { pin }),
    params(created.quizId)
  );
  assert.equal(repeatDel.status, 404);
});

test("API concurrent wrong authentication returns five 403s then 429s", async () => {
  const q = fixture();
  await saveQuiz(q);
  const calls = Array.from({ length: 12 }, () =>
    details(request("POST", { pin: wrongPin }), params(q.id))
  );
  const statuses = (await Promise.all(calls)).map((res) => res.status);
  assert.equal(statuses.filter((s) => s === 403).length, 5);
  assert.equal(statuses.filter((s) => s === 429).length, 7);
});

test("API returns 503 on Supabase failure", async () => {
  _setMockRpcFailure("save_quiz_with_questions");
  const payload = {
    creatorName: "Ayesha",
    gender: "female",
    country: "PK",
    secretPin: pin,
    questions: DEFAULT_QUIZ_QUESTIONS.slice(0, 10).map((q) => ({
      questionId: q.id,
      correctOptionId: 1,
    })),
  };
  const res = await createQuiz(request("POST", payload));
  assert.equal(res.status, 503);
});

test("Data migration utility: dry-run, validation, and idempotent import", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "migration-test-"));
  directories.push(dir);
  const filePath = path.join(dir, "legacy.json");

  const q1 = fixture();
  const q2 = fixture();
  const att1 = attempt(q1);

  const legacyData = {
    quizzes: { [q1.id]: q1, [q2.id]: q2 },
    attempts: { [q1.id]: [att1], [q2.id]: [] },
  };

  fs.writeFileSync(filePath, JSON.stringify(legacyData), "utf8");

  // 1. Dry run
  const drySummary = await migrateLegacyData({ filePath, dryRun: true });
  assert.equal(drySummary.status, "DRY_RUN");
  assert.equal(drySummary.quizzesFound, 2);
  assert.equal(drySummary.attemptsFound, 1);
  assert.equal(drySummary.quizzesImported, 0);

  // 2. Real import
  const realSummary = await migrateLegacyData({ filePath, dryRun: false });
  assert.equal(realSummary.status, "COMPLETED");
  assert.equal(realSummary.quizzesImported, 2);
  assert.equal(realSummary.attemptsImported, 1);

  // 3. Idempotent re-run
  const rerunSummary = await migrateLegacyData({ filePath, dryRun: false });
  assert.equal(rerunSummary.status, "COMPLETED");
  assert.equal(rerunSummary.quizzesImported, 0); // 0 new quizzes imported on re-run because insert-only rejects duplicates

  // 4. Missing file
  const missingSummary = await migrateLegacyData({ filePath: path.join(dir, "none.json") });
  assert.equal(missingSummary.status, "SKIPPED_NO_DATA");
});

test("Security: save_quiz_with_questions enforces strict insert-only semantics, rejecting overwrites", async () => {
  const q = fixture();
  const originalPinHash = "scrypt:salt_original:hash_original";
  const originalTokenHash = "token_hash_original";
  
  // 1. Initial creation succeeds
  const initialRes = await dbRpc<boolean>("save_quiz_with_questions", {
    p_quiz: {
      id: q.id,
      slug: q.slug,
      creatorName: "Original Creator",
      gender: q.gender,
      country: q.country,
      theme: q.theme,
      pinHash: originalPinHash,
      creatorTokenHash: originalTokenHash,
      createdAt: q.createdAt,
    },
    p_questions: q.questions.map((item, idx) => ({
      questionId: item.questionId,
      question: item.question,
      emoji: item.emoji,
      options: item.options,
      correctOptionId: item.correctOptionId,
      displayOrder: idx,
    })),
  });
  assert.equal(initialRes.data, true);
  
  const originalStored = _getMockSupabaseStore()!.quizzes.get(q.id);
  assert.equal(originalStored?.creator_name, "Original Creator");
  assert.equal(originalStored?.pin_hash, originalPinHash);
  assert.equal(originalStored?.creator_token_hash, originalTokenHash);

  // 2. Malicious overwrite attempt with altered credentials and questions MUST be rejected (returns false)
  const overwriteRes = await dbRpc<boolean>("save_quiz_with_questions", {
    p_quiz: {
      id: q.id,
      slug: "malicious-takeover",
      creatorName: "Attacker",
      gender: "male",
      country: "US",
      theme: "hacked",
      pinHash: "scrypt:salt_evil:hash_evil",
      creatorTokenHash: "token_hash_evil",
      createdAt: Date.now(),
    },
    p_questions: [
      {
        questionId: "q_evil",
        question: "Compromised Question",
        options: [{ id: 1, text: "Compromised" }],
        correctOptionId: 1,
        displayOrder: 0,
      },
    ],
  });
  assert.equal(overwriteRes.data, false);

  // 3. Confirm original quiz state, questions, and hashes remain completely untampered
  const afterAttempt = _getMockSupabaseStore()!.quizzes.get(q.id);
  assert.equal(afterAttempt?.creator_name, "Original Creator");
  assert.equal(afterAttempt?.pin_hash, originalPinHash);
  assert.equal(afterAttempt?.creator_token_hash, originalTokenHash);
  assert.equal(_getMockSupabaseStore()!.questions.get(q.id)!.length, 5);
  assert.notEqual(_getMockSupabaseStore()!.questions.get(q.id)![0].question_id, "q_evil");
});

test("Security: SQL migration defines explicit least-privilege revokes and service_role grants", async () => {
  const migrationPath = path.join(process.cwd(), "supabase", "migrations", "20261014000001_create_quiz_schema.sql");
  const sql = fs.readFileSync(migrationPath, "utf8");

  // Verify explicit targeted revoke from PUBLIC, anon, and authenticated on the 7 quiz functions
  assert.match(sql, /REVOKE EXECUTE ON FUNCTION public\.save_quiz_with_questions\(JSONB, JSONB\) FROM PUBLIC, anon, authenticated;/);
  assert.match(sql, /REVOKE EXECUTE ON FUNCTION public\.record_quiz_attempt\(JSONB, JSONB\) FROM PUBLIC, anon, authenticated;/);
  assert.match(sql, /REVOKE EXECUTE ON FUNCTION public\.delete_quiz_atomic\(TEXT\) FROM PUBLIC, anon, authenticated;/);
  assert.match(sql, /REVOKE EXECUTE ON FUNCTION public\.delete_attempt_atomic\(TEXT, TEXT\) FROM PUBLIC, anon, authenticated;/);
  assert.match(sql, /REVOKE EXECUTE ON FUNCTION public\.check_pin_rate_limit\(TEXT, INTEGER\) FROM PUBLIC, anon, authenticated;/);
  assert.match(sql, /REVOKE EXECUTE ON FUNCTION public\.record_pin_rate_limit_outcome\(TEXT, TEXT, INTEGER, INTEGER\) FROM PUBLIC, anon, authenticated;/);
  assert.match(sql, /REVOKE EXECUTE ON FUNCTION public\.clear_pin_rate_limit\(TEXT\) FROM PUBLIC, anon, authenticated;/);

  // Verify RPC grants strictly to service_role
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.save_quiz_with_questions\(JSONB, JSONB\) TO service_role;/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.record_quiz_attempt\(JSONB, JSONB\) TO service_role;/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.delete_quiz_atomic\(TEXT\) TO service_role;/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.delete_attempt_atomic\(TEXT, TEXT\) TO service_role;/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.check_pin_rate_limit\(TEXT, INTEGER\) TO service_role;/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.record_pin_rate_limit_outcome\(TEXT, TEXT, INTEGER, INTEGER\) TO service_role;/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.clear_pin_rate_limit\(TEXT\) TO service_role;/);

  // Verify direct table access is revoked from anon and authenticated
  assert.match(sql, /REVOKE ALL ON TABLE public\.quizzes FROM anon, authenticated, PUBLIC;/);
  assert.match(sql, /REVOKE ALL ON TABLE public\.creator_auth_rate_limits FROM anon, authenticated, PUBLIC;/);

  // Verify strict insert-only existence check in SQL
  assert.match(sql, /IF EXISTS \(SELECT 1 FROM public\.quizzes WHERE id = v_quiz_id\) THEN\s+RETURN FALSE;\s+END IF;/);
});

