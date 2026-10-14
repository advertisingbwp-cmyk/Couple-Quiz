import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { _enableMockRedis, _getMockRedisStore, _advanceMockRedisTime, isRedisConfigured, executeRedisCommand as command, executeRedisPipeline } from "../lib/quiz/redis";
import { createQuizStorage, saveQuiz, recordAttempt, getQuizById, getScoreboard, deleteAttempt, deleteQuiz, _setStorageWriteFailureSimulation, StorageUnavailableError } from "../lib/quiz/storage";
import { hashPin, generateCreatorToken, extractClientIp, normalizeClientIp, checkPinRateLimit, recordFailedPinAttempt, clearPinRateLimit, authenticateCreator, RateLimitUnavailableError } from "../lib/quiz/security";
import { DEFAULT_QUIZ_QUESTIONS } from "../lib/quiz/questions";
import type { QuizData, PlayerAttempt } from "../lib/quiz/types";
import { POST as createQuiz } from "../app/api/quiz/route";
import { GET as readQuiz, DELETE as removeQuiz } from "../app/api/quiz/[id]/route";
import { POST as submit } from "../app/api/quiz/[id]/attempt/route";
import { GET as scoreboard, POST as details, DELETE as removeAttempt } from "../app/api/quiz/[id]/scoreboard/route";

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
let directories: string[] = [];
beforeEach(() => { _enableMockRedis(true); });
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
  Object.assign(process.env, originalEnv);
  _setStorageWriteFailureSimulation(false); _enableMockRedis(false);
  for (const dir of directories) fs.rmSync(dir, { recursive: true, force: true });
  directories = [];
});
const pin = String(crypto.randomInt(1000, 10000));
const wrongPin = pin === "1000" ? "1001" : "1000";
const pinHash = hashPin(pin);
function fixture(): QuizData {
  return { id: "test_" + crypto.randomUUID(), slug: "fixture", creatorName: "Test Creator", gender: "male",
    country: "PK", theme: "dont_block_me", pinHash, creatorToken: generateCreatorToken(), createdAt: Date.now(),
    questions: DEFAULT_QUIZ_QUESTIONS.slice(0, 5).map(q => ({ questionId: q.id, question: q.question, emoji: q.emoji, options: q.options, correctOptionId: 0 })) };
}
const attempt = (q: QuizData, id = crypto.randomUUID()): PlayerAttempt => ({ id, quizId: q.id,
  playerName: "Test Player", score: 5, totalQuestions: 5, createdAt: Date.now(),
  answers: q.questions.map(q => ({ questionId: q.questionId, selectedOptionId: 0, isCorrect: true })) });
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const request = (method: string, body?: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/quiz", { method, headers: { "content-type": "application/json", ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
function tempFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "couple-quiz-test-")); directories.push(dir);
  return path.join(dir, "store.json");
}

test("mock opt-in activates Redis branch, never activates in production or a production deployment", async () => {
  assert.equal(isRedisConfigured(), true);
  Object.assign(process.env, { NODE_ENV: "production" });
  assert.equal(isRedisConfigured(), false);
  assert.throws(() => _enableMockRedis(true), /test mode/);
  assert.equal((await command(["SET", "not-written", "value"])).ok, false);
  Object.assign(process.env, { NODE_ENV: "test", VERCEL: "1" });
  assert.equal(isRedisConfigured(), false);
  assert.throws(() => _enableMockRedis(true), /test mode/);
  delete process.env.VERCEL;
  assert.equal(_getMockRedisStore()!.strings.has("not-written"), false);
});

test("Redis mock models HSET updates, HVALS, HDEL, DEL and TTL accurately", async () => {
  assert.equal((await command(["HSET", "hash", "one", "a"])).result, 1);
  assert.equal((await command(["HSET", "hash", "one", "b"])).result, 0);
  assert.deepEqual((await command(["HVALS", "hash"])).result, ["b"]);
  assert.equal((await command(["EXPIRE", "hash", 2])).result, 1);
  assert.equal((await command(["HDEL", "hash", "missing"])).result, 0);
  assert.equal((await command(["HDEL", "hash", "one"])).result, 1);
  assert.equal((await command(["TTL", "hash"])).result, -2);
  await command(["SET", "counter", "0"]);
  assert.equal((await command(["INCR", "counter"])).result, 1);
  await command(["EXPIRE", "counter", 10]);
  await command(["INCR", "counter"]);
  _advanceMockRedisTime(10_001);
  assert.equal((await command(["GET", "counter"])).result, null);
  assert.equal((await command(["EXPIRE", "absent", 5])).result, 0);
  await command(["HSET", "expires", "one", "x"]); await command(["EXPIRE", "expires", 1]);
  _advanceMockRedisTime(1001);
  assert.deepEqual((await command(["HVALS", "expires"])).result, []);
  await command(["SET", "replace", "x"]); await command(["EXPIRE", "replace", 1]); await command(["SET", "replace", "y"]);
  assert.equal((await command(["TTL", "replace"])).result, -1);
  assert.equal((await command(["DEL", "replace", "replace", "absent"])).result, 1);
  await command(["SET", "bad", "abc"]);
  assert.equal((await command(["INCR", "bad"])).ok, false);
  assert.equal((await command(["HSET", "bad", "x", "y"])).ok, false);
  assert.equal((await command(["GET"])).ok, false);
  assert.equal((await command(["HDEL", "hash"])).ok, false);
  await command(["SET", "bad", "01"]);
  assert.equal((await command(["INCR", "bad"])).ok, false);
});

test("mock pipelines propagate individual command errors without pretending to roll back", async () => {
  const result = await executeRedisPipeline([["SET", "counter", "not-number"], ["INCR", "counter"], ["SET", "after", "yes"]]);
  assert.equal(result.ok, false);
  assert.equal((await command(["GET", "after"])).result, "yes");
});

test("REST client rejects HTTP, command-level, malformed and pipeline errors", async () => {
  _enableMockRedis(false);
  process.env.UPSTASH_REDIS_REST_URL = "https://redis.invalid";
  process.env.UPSTASH_REDIS_REST_TOKEN = crypto.randomUUID();
  for (const body of [{ error: "ERR" }, {}, null]) {
    globalThis.fetch = async () => Response.json(body);
    assert.equal((await command(["GET", "x"])).ok, false);
  }
  globalThis.fetch = async () => new Response("", { status: 503 });
  assert.equal((await command(["GET", "x"])).ok, false);
  globalThis.fetch = async () => { throw new Error("offline"); };
  assert.equal((await executeRedisPipeline([["GET", "x"]])).ok, false);
  for (const body of [[{ result: "OK" }, { error: "ERR" }], [{ result: "OK" }], {}]) {
    globalThis.fetch = async () => Response.json(body);
    assert.equal((await executeRedisPipeline([["SET", "x", "v"], ["INCR", "x"]])).ok, false);
  }
  globalThis.fetch = async () => Response.json([{ result: 1 }, { result: null }]);
  assert.deepEqual(await executeRedisPipeline([["INCR", "x"], ["GET", "missing"]]), { ok: true, results: [1, null] });
});

test("32 simultaneous Redis writes persist across independent storage instances", async () => {
  const a = createQuizStorage(tempFile()), b = createQuizStorage(tempFile()), q = fixture();
  assert.equal(await a.saveQuiz(q), true);
  const attempts = Array.from({ length: 32 }, () => attempt(q));
  assert.ok((await Promise.all(attempts.map((entry, i) => (i % 2 ? a : b).recordAttempt(entry)))).every(Boolean));
  assert.equal(_getMockRedisStore()!.hashes.get(`quiz_attempts:${q.id}`)!.size, 32);
  assert.equal((await createQuizStorage(tempFile()).getScoreboard(q.id)).length, 32);
  await command(["HDEL", `quiz_attempts:${q.id}`, attempts[0].id]);
  assert.equal((await a.getScoreboard(q.id)).length, 31);
  assert.equal((await b.getScoreboard(q.id)).length, 31);
  await command(["DEL", `quiz:${q.id}`, `quiz_attempts:${q.id}`]);
  assert.equal(await a.getQuizById(q.id), null);
  assert.equal(await b.getQuizById(q.id), null);
  assert.deepEqual(await a.getScoreboard(q.id), []);
  assert.equal(await b.recordAttempt(attempt(q)), false, "Cannot recreate orphan attempts after quiz deletion");
});

test("pre-existing local caches never override remote absence or remote failures", async () => {
  _enableMockRedis(false);
  const q = fixture(), a = createQuizStorage(tempFile()), b = createQuizStorage(tempFile());
  await a.saveQuiz(q); await b.saveQuiz(q);
  await a.recordAttempt(attempt(q)); await b.recordAttempt(attempt(q));
  _enableMockRedis(true);
  assert.equal(await a.getQuizById(q.id), null); assert.equal(await b.getQuizById(q.id), null);
  assert.deepEqual(await a.getScoreboard(q.id), []); assert.deepEqual(await b.getScoreboard(q.id), []);
  await a.saveQuiz(q); await a.getQuizById(q.id); await b.getQuizById(q.id);
  await b.deleteQuiz(q.id);
  assert.equal(await a.getQuizById(q.id), null);
  _enableMockRedis(false);
  process.env.UPSTASH_REDIS_REST_URL = "https://redis.invalid"; process.env.UPSTASH_REDIS_REST_TOKEN = crypto.randomUUID();
  globalThis.fetch = async () => Response.json({ error: "ERR unavailable" });
  await assert.rejects(a.getQuizById(q.id), StorageUnavailableError);
  await assert.rejects(a.getScoreboard(q.id), StorageUnavailableError);
});

test("deletion reports missing IDs and already-deleted quizzes truthfully", async () => {
  const q = fixture(), att = attempt(q);
  await saveQuiz(q); await recordAttempt(att);
  assert.equal(await deleteAttempt(q.id, "absent"), false);
  assert.equal(await deleteAttempt(q.id, att.id), true);
  assert.equal(await deleteAttempt(q.id, att.id), false);
  assert.equal(await deleteQuiz(q.id), true);
  assert.equal(await deleteQuiz(q.id), false);
  await command(["HSET", `quiz_attempts:${q.id}`, "orphan", JSON.stringify(att)]);
  assert.equal(await deleteQuiz(q.id), false, "Removing orphan attempts does not mean the quiz existed");
});

test("local persistence failure does not mutate cache or report a successful delete", async () => {
  _enableMockRedis(false);
  const file = tempFile(), storage = createQuizStorage(file), q = fixture(), att = attempt(q);
  await storage.saveQuiz(q); await storage.recordAttempt(att);
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
  // Exercise a genuine filesystem failure, not only the simulation flag.
  const blocked = tempFile(), blockedStore = createQuizStorage(blocked);
  assert.equal(await blockedStore.saveQuiz(q), true);
  fs.unlinkSync(blocked); fs.mkdirSync(blocked);
  await assert.rejects(blockedStore.deleteQuiz(q.id), StorageUnavailableError);
  assert.equal((await blockedStore.getQuizById(q.id))!.id, q.id);
});

test("proxy identity rejects spoofed headers and normalizes IPv4/IPv6", () => {
  const headers = { "x-forwarded-for": "192.0.2.1", "x-real-ip": "192.0.2.2",
    "x-vercel-forwarded-for": "192.0.2.3", "cf-connecting-ip": "192.0.2.4" };
  assert.equal(extractClientIp(request("GET", undefined, headers)), "unknown");
  process.env.VERCEL = "1";
  assert.equal(extractClientIp(request("GET", undefined, headers)), "192.0.2.3");
  assert.equal(extractClientIp(request("GET", undefined, { ...headers, "x-vercel-forwarded-for": "bad,192.0.2.9" })), "unknown");
  delete process.env.VERCEL; process.env.QUIZ_TRUSTED_PROXY = "cloudflare";
  assert.equal(extractClientIp(request("GET", undefined, headers)), "192.0.2.4");
  assert.equal(normalizeClientIp("2001:0DB8:0000:0000:0000:0000:0000:0001"), "2001:db8::1");
  assert.equal(normalizeClientIp("::ffff:192.0.2.1"), "192.0.2.1");
  for (const ip of ["127.1", "1.2.3.4:80", "999.1.1.1", "fe80::1%eth0", "1.2.3.4,5.6.7.8"])
    assert.equal(normalizeClientIp(ip), null);
});

test("fixed Redis failure window blocks sixth failure and does not extend or charge successes", async () => {
  const q = fixture(), req = request("POST");
  for (let i = 0; i < 3; i++) assert.equal(await authenticateCreator(req, q, { creatorToken: q.creatorToken }), 200);
  assert.equal((await command(["GET", "ratelimit:pin:unknown"])).result, null);
  for (let i = 0; i < 5; i++) {
    assert.equal(await authenticateCreator(req, q, { pin: wrongPin }), 403);
    if (i === 2) {
      assert.equal(await authenticateCreator(req, q, { pin }), 200);
      assert.equal((await command(["GET", "ratelimit:pin:unknown"])).result, "3");
    }
    _advanceMockRedisTime(1000);
  }
  assert.equal((await command(["GET", "ratelimit:pin:unknown"])).result, "5");
  assert.equal(await authenticateCreator(req, q, { pin: "wrong" }), 429);
  assert.ok(Number((await command(["TTL", "ratelimit:pin:unknown"])).result) <= 595);
  _advanceMockRedisTime(595_001);
  assert.equal(await authenticateCreator(req, q, { pin }), 200);
  assert.equal((await command(["GET", "ratelimit:pin:unknown"])).result, null);
});

test("40 concurrent spoofed brute-force requests share one atomic failure allowance", async () => {
  const q = fixture();
  const results = await Promise.all(Array.from({ length: 40 }, (_, i) =>
    authenticateCreator(request("POST", {}, { "x-forwarded-for": `192.0.2.${i + 1}` }), q, { pin: wrongPin })));
  assert.equal(results.filter(r => r === 403).length, 5);
  assert.equal(results.filter(r => r === 429).length, 35);
  assert.equal((await command(["GET", "ratelimit:pin:unknown"])).result, "5");
});

test("authentication fails closed on read, atomic-write and clear errors in production", async () => {
  _enableMockRedis(false);
  Object.assign(process.env, { NODE_ENV: "production" });
  await assert.rejects(checkPinRateLimit("192.0.2.1"), RateLimitUnavailableError);
  process.env.UPSTASH_REDIS_REST_URL = "https://redis.invalid"; process.env.UPSTASH_REDIS_REST_TOKEN = crypto.randomUUID();
  globalThis.fetch = async (_input, init) => {
    const args = JSON.parse(String(init?.body));
    return Response.json(args[0] === "GET" ? { result: null } : { error: "ERR" });
  };
  await assert.rejects(authenticateCreator(request("POST"), fixture(), { pin: "bad" }), RateLimitUnavailableError);
  await assert.rejects(recordFailedPinAttempt("192.0.2.1"), RateLimitUnavailableError);
  await assert.rejects(clearPinRateLimit("192.0.2.1"), RateLimitUnavailableError);
});

test("API create, answer, scoreboard, private details, deletion and repeat deletion", async () => {
  const q = fixture();
  const created = await createQuiz(request("POST", { creatorName: q.creatorName, gender: q.gender, secretPin: pin, questions: q.questions }));
  assert.equal(created.status, 200);
  const body = await created.json();
  assert.ok(body.shareUrl && !body.shareUrl.includes("?"));
  const id = body.quizId;
  const publicData = await (await readQuiz(request("GET"), params(id))).json();
  assert.equal(publicData.quiz.pinHash, undefined);
  assert.equal(publicData.quiz.questions[0].correctOptionId, undefined);
  const submitted = await submit(request("POST", { playerName: "Player", answers: q.questions.map(q => ({ questionId: q.questionId, selectedOptionId: 0 })) }), params(id));
  assert.equal(submitted.status, 200);
  const score = await submitted.json(); assert.equal(score.score, 5);
  const board = await (await scoreboard(request("GET"), params(id))).json();
  assert.equal(board.scoreboard.length, 1); assert.equal(board.scoreboard[0].answers, undefined);
  assert.equal((await details(request("POST", { pin: "bad" }), params(id))).status, 403);
  const privateData = await details(request("POST", { pin }), params(id));
  assert.equal(privateData.status, 200);
  assert.equal((await privateData.json()).scoreboard[0].answers.length, 5);
  const credentials = { creatorToken: body.creatorToken, attemptId: score.attemptId };
  assert.equal((await removeAttempt(request("DELETE", credentials), params(id))).status, 200);
  assert.equal((await removeAttempt(request("DELETE", credentials), params(id))).status, 404);
  assert.equal((await removeQuiz(request("DELETE", credentials), params(id))).status, 200);
  assert.equal((await removeQuiz(request("DELETE", credentials), params(id))).status, 404);
  assert.equal((await readQuiz(request("GET"), params(id))).status, 404);
});

test("API concurrent wrong authentication returns five 403s then 429s", async () => {
  const q = fixture(); await saveQuiz(q);
  const responses = await Promise.all(Array.from({ length: 32 }, () => details(request("POST", { pin: "bad" }), params(q.id))));
  assert.equal(responses.filter(r => r.status === 403).length, 5);
  assert.equal(responses.filter(r => r.status === 429).length, 27);
});

test("API failures never return successful creation or deletion", async () => {
  const q = fixture(), att = attempt(q); await saveQuiz(q); await recordAttempt(att);
  _setStorageWriteFailureSimulation(true);
  const credentials = { creatorToken: q.creatorToken, attemptId: att.id };
  assert.equal((await removeAttempt(request("DELETE", credentials), params(q.id))).status, 503);
  assert.equal((await removeQuiz(request("DELETE", credentials), params(q.id))).status, 503);
  assert.equal((await createQuiz(request("POST", { creatorName: q.creatorName, secretPin: pin, questions: q.questions }))).status, 503);
  assert.equal((await submit(request("POST", { playerName: "Player", answers: att.answers }), params(q.id))).status, 503);
  assert.ok(await getQuizById(q.id)); assert.equal((await getScoreboard(q.id)).length, 1);
});

test("API returns 503 on Redis read and authentication finalization failures", async () => {
  _enableMockRedis(false);
  const q = fixture();
  Object.assign(process.env, { NODE_ENV: "production",
    UPSTASH_REDIS_REST_URL: "https://redis.invalid", UPSTASH_REDIS_REST_TOKEN: crypto.randomUUID() });
  globalThis.fetch = async () => Response.json({ error: "ERR" });
  assert.equal((await readQuiz(request("GET"), params(q.id))).status, 503);
  assert.equal((await scoreboard(request("GET"), params(q.id))).status, 503);
  globalThis.fetch = async (_input, init) => {
    const args = JSON.parse(String(init?.body));
    if (args[0] === "GET") return Response.json({ result: args[1] === `quiz:${q.id}` ? JSON.stringify(q) : null });
    return Response.json({ error: "ERR" });
  };
  const response = await details(request("POST", { creatorToken: q.creatorToken }), params(q.id));
  assert.equal(response.status, 503, "Valid credentials cannot bypass failed atomic limiter storage");
  assert.equal((await response.json()).success, false);
});

test("REST HDEL/DEL command failures propagate without false success", async () => {
  _enableMockRedis(false);
  process.env.UPSTASH_REDIS_REST_URL = "https://redis.invalid"; process.env.UPSTASH_REDIS_REST_TOKEN = crypto.randomUUID();
  globalThis.fetch = async () => Response.json({ error: "ERR" });
  await assert.rejects(deleteAttempt("q", "a"), StorageUnavailableError);
  await assert.rejects(deleteQuiz("q"), StorageUnavailableError);
});
