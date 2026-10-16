import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as createQuiz } from "../app/api/quiz/route";
import { GET as getQuiz, DELETE as deleteQuizRoute } from "../app/api/quiz/[id]/route";
import { GET as getPublicScoreboard, POST as getScoreboardDetails, DELETE as deleteScoreboardAttempt } from "../app/api/quiz/[id]/scoreboard/route";
import { POST as submitAttempt } from "../app/api/quiz/[id]/attempt/route";
import { _enableMockSupabase } from "../lib/quiz/supabase";
import { _resetPinRateLimit } from "../lib/quiz/security";
import { DEFAULT_QUIZ_QUESTIONS } from "../lib/quiz/questions";

const originalEnv = { ...process.env };

beforeEach(() => {
  _enableMockSupabase(true);
});

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
  _enableMockSupabase(false);
});

async function createTestQuiz(pin = "1234", name = "Test Creator") {
  const req = new NextRequest("http://localhost:3000/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creatorName: name,
      gender: "female",
      country: "PK",
      secretPin: pin,
      questions: DEFAULT_QUIZ_QUESTIONS.slice(0, 10).map((q) => ({
        questionId: q.id,
        correctOptionId: 0,
      })),
    }),
  });

  const res = await createQuiz(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.quizId);
  return data.quizId as string;
}

test("Phase 9.3: Whole-quiz deletion strictly rejects token-only requests (HTTP 403)", async () => {
  const ip = "192.168.10.1";
  _resetPinRateLimit(ip);

  const quizId = await createTestQuiz("2468");

  // Creator authenticates via scoreboard PIN to obtain a valid creatorToken
  const authReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/scoreboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ pin: "2468" }),
  });
  const authRes = await getScoreboardDetails(authReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(authRes.status, 200);
  const { creatorToken } = await authRes.json();
  assert.ok(creatorToken, "Server should issue creatorToken for valid PIN");

  // Attempting to delete whole quiz with creatorToken alone MUST be rejected with 403
  const tokenDeleteReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ creatorToken }),
  });
  const tokenDeleteRes = await deleteQuizRoute(tokenDeleteReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(tokenDeleteRes.status, 403, "Token-only delete request must return HTTP 403 Forbidden");
  const tokenDeleteData = await tokenDeleteRes.json();
  assert.equal(tokenDeleteData.success, false);
  assert.match(tokenDeleteData.error, /Creator Secret PIN is required/i);

  // Verify quiz is NOT deleted
  const getReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}`);
  const getRes = await getQuiz(getReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(getRes.status, 200, "Quiz must still exist after rejected token-only delete");

  _resetPinRateLimit(ip);
});

test("Phase 9.3: Missing both PIN and token returns HTTP 400", async () => {
  const quizId = await createTestQuiz("1234");

  const emptyReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const emptyRes = await deleteQuizRoute(emptyReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(emptyRes.status, 400);
  const emptyData = await emptyRes.json();
  assert.equal(emptyData.success, false);
  assert.match(emptyData.error, /Creator Secret PIN is required/i);
});

test("Phase 9.3: Incorrect PIN returns HTTP 403 and enforces rate limiting after 5 attempts", async () => {
  const ip = "192.168.10.2";
  _resetPinRateLimit(ip);

  const quizId = await createTestQuiz("5555");

  // 5 failed attempts return HTTP 403
  for (let i = 1; i <= 5; i++) {
    const wrongReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({ pin: "0000" }),
    });
    const wrongRes = await deleteQuizRoute(wrongReq, { params: Promise.resolve({ id: quizId }) });
    assert.equal(wrongRes.status, 403, `Attempt ${i} should return 403`);
    const data = await wrongRes.json();
    assert.equal(data.success, false);
    assert.match(data.error, /Incorrect Secret PIN/i);
  }

  // 6th attempt triggers rate limit (HTTP 429)
  const sixthReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ pin: "0000" }),
  });
  const sixthRes = await deleteQuizRoute(sixthReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(sixthRes.status, 429, "6th attempt after 5 failures must trigger 429 rate limit");
  const sixthData = await sixthRes.json();
  assert.match(sixthData.error, /Too many attempts/i);

  // Even the correct PIN is now rate-limited on this IP
  const blockedReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ pin: "5555" }),
  });
  const blockedRes = await deleteQuizRoute(blockedReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(blockedRes.status, 429);

  _resetPinRateLimit(ip);
});

test("Phase 9.3: Correct PIN successfully deletes quiz (HTTP 200) and repeated deletion returns 404", async () => {
  const ip = "192.168.10.3";
  _resetPinRateLimit(ip);

  const quizId = await createTestQuiz("7890");

  // Deletion with correct PIN succeeds
  const deleteReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ pin: "7890" }),
  });
  const deleteRes = await deleteQuizRoute(deleteReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(deleteRes.status, 200);
  const deleteData = await deleteRes.json();
  assert.equal(deleteData.success, true);
  assert.match(deleteData.message, /Quiz deleted successfully/i);

  // Verify quiz is no longer found (HTTP 404)
  const getReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}`);
  const getRes = await getQuiz(getReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(getRes.status, 404);

  // Repeated deletion returns HTTP 404
  const repeatDeleteReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ pin: "7890" }),
  });
  const repeatDeleteRes = await deleteQuizRoute(repeatDeleteReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(repeatDeleteRes.status, 404);

  _resetPinRateLimit(ip);
});

test("Phase 9.3: Zero-player quiz can be deleted cleanly", async () => {
  const ip = "192.168.10.4";
  _resetPinRateLimit(ip);

  const quizId = await createTestQuiz("4321");

  // Verify scoreboard has 0 players
  const scoreReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/scoreboard`);
  const scoreRes = await getPublicScoreboard(scoreReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(scoreRes.status, 200);
  const scoreData = await scoreRes.json();
  assert.equal(scoreData.scoreboard.length, 0);

  // Delete zero-player quiz
  const deleteReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ pin: "4321" }),
  });
  const deleteRes = await deleteQuizRoute(deleteReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(deleteRes.status, 200);

  // Scoreboard fetch now returns 404
  const scoreVerifyRes = await getPublicScoreboard(scoreReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(scoreVerifyRes.status, 404);

  _resetPinRateLimit(ip);
});

test("Phase 9.3: Attempt deletion vs Whole-quiz deletion authorization isolation", async () => {
  const ip = "192.168.10.5";
  _resetPinRateLimit(ip);

  const quizId = await createTestQuiz("9988");

  // A player answers the quiz
  const playerSubmitReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      playerName: "Friend Player",
      answers: DEFAULT_QUIZ_QUESTIONS.slice(0, 10).map((q) => ({
        questionId: q.id,
        selectedOptionId: 0,
      })),
    }),
  });
  const playerSubmitRes = await submitAttempt(playerSubmitReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(playerSubmitRes.status, 200);
  const { attemptId } = await playerSubmitRes.json();
  assert.ok(attemptId);

  // Creator authenticates via PIN and receives creatorToken
  const authReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/scoreboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ pin: "9988" }),
  });
  const authRes = await getScoreboardDetails(authReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(authRes.status, 200);
  const { creatorToken } = await authRes.json();
  assert.ok(creatorToken);

  // 1. Whole-quiz DELETE with token-only is FORBIDDEN (403)
  const quizDeleteReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ creatorToken }),
  });
  const quizDeleteRes = await deleteQuizRoute(quizDeleteReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(quizDeleteRes.status, 403, "Whole-quiz deletion must forbid token-only requests");

  // 2. Individual player attempt DELETE allows token authorization when server-validated
  const attemptDeleteReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/scoreboard`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ attemptId, creatorToken }),
  });
  const attemptDeleteRes = await deleteScoreboardAttempt(attemptDeleteReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(attemptDeleteRes.status, 200);

  _resetPinRateLimit(ip);
});
