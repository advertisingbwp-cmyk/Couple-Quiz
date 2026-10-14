import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createQuizStorage } from "../lib/quiz/storage";
import { executeRedisCommand as command, executeRedisPipeline, _enableMockRedis } from "../lib/quiz/redis";
import { recordFailedPinAttempt, checkPinRateLimit, clearPinRateLimit } from "../lib/quiz/security";
import type { QuizData, PlayerAttempt } from "../lib/quiz/types";

const enabled = process.env.QUIZ_REDIS_INTEGRATION === "1" &&
  Boolean(process.env.QUIZ_TEST_REDIS_REST_URL && process.env.QUIZ_TEST_REDIS_REST_TOKEN);
test("REAL REDIS integration: concurrent writes, cross-instance deletion, Lua failures and TTL", {
  skip: enabled ? false : "Requires explicit opt-in and a disposable Upstash-compatible REST Redis test database",
}, async () => {
  _enableMockRedis(false);
  process.env.UPSTASH_REDIS_REST_URL = process.env.QUIZ_TEST_REDIS_REST_URL;
  process.env.UPSTASH_REDIS_REST_TOKEN = process.env.QUIZ_TEST_REDIS_REST_TOKEN;
  const id = "phase13_test_" + crypto.randomUUID();
  const authIp = "2001:db8:" + crypto.randomBytes(2).toString("hex") + ":" + crypto.randomBytes(2).toString("hex") + "::1";
  const extraKey = id + ":ttl", wrongKey = id + ":wrong";
  const a = createQuizStorage(), b = createQuizStorage();
  const quiz: QuizData = { id, slug: id, creatorName: "Integration Fixture", gender: "male", country: "PK",
    theme: "dont_block_me", pinHash: "", creatorToken: crypto.randomBytes(32).toString("hex"), createdAt: Date.now(), questions: [] };
  try {
    assert.equal(await a.saveQuiz(quiz), true);
    const results = await Promise.all(Array.from({ length: 32 }, (_, i) => {
      const entry: PlayerAttempt = { id: id + i, quizId: id, playerName: "Fixture", score: 0, totalQuestions: 0, answers: [], createdAt: i };
      return (i % 2 ? a : b).recordAttempt(entry);
    }));
    assert.ok(results.every(Boolean));
    assert.equal((await command<string[]>(["HVALS", "quiz_attempts:" + id])).result!.length, 32);
    assert.equal((await b.getScoreboard(id)).length, 32);
    assert.equal(await a.deleteAttempt(id, id + "0"), true);
    assert.equal(await b.deleteAttempt(id, id + "0"), false);
    assert.equal((await b.getScoreboard(id)).length, 31);
    const failures = await Promise.all(Array.from({ length: 40 }, () => recordFailedPinAttempt(authIp)));
    assert.equal(failures.filter(Boolean).length, 5);
    assert.equal(await checkPinRateLimit(authIp), false);
    await command(["SET", extraKey, "1"]); await command(["EXPIRE", extraKey, 1]);
    await new Promise(resolve => setTimeout(resolve, 1100));
    assert.equal((await command(["GET", extraKey])).result, null);
    await command(["SET", wrongKey, "not-an-integer"]);
    assert.equal((await executeRedisPipeline([["INCR", wrongKey]])).ok, false);
    await a.getQuizById(id); await b.getQuizById(id);
    assert.equal(await a.deleteQuiz(id), true); assert.equal(await b.deleteQuiz(id), false);
    assert.equal(await b.getQuizById(id), null);
    assert.deepEqual(await b.getScoreboard(id), []);
  } finally {
    await command(["DEL", "quiz:" + id, "quiz_attempts:" + id, extraKey, wrongKey]);
    await clearPinRateLimit(authIp);
    delete process.env.UPSTASH_REDIS_REST_URL; delete process.env.UPSTASH_REDIS_REST_TOKEN;
  }
});
