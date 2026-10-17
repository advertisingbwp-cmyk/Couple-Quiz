import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  generatePlayerSessionToken,
  verifyPlayerSessionToken,
  generateQuizId,
  generateAttemptId,
} from "@/lib/quiz/security";
import { POST as createQuiz } from "@/app/api/quiz/route";
import { POST as recordAttempt } from "@/app/api/quiz/[id]/attempt/route";
import { GET as getPlayerResult } from "@/app/api/quiz/[id]/player-result/route";
import { deleteAttempt } from "@/lib/quiz/storage";
import { DEFAULT_QUIZ_QUESTIONS } from "@/lib/quiz/questions";

test("Player Session Tokens: Cryptographic generation and verification invariants", () => {
  const quizId = generateQuizId();
  const attemptId = generateAttemptId();

  // 1. Valid token verification
  const token = generatePlayerSessionToken(quizId, attemptId);
  assert.ok(token.startsWith("ply_ses_"));
  assert.equal(verifyPlayerSessionToken(token, quizId, attemptId), true);

  // 2. Reject wrong attempt ID
  const otherAttemptId = generateAttemptId();
  assert.equal(verifyPlayerSessionToken(token, quizId, otherAttemptId), false);

  // 3. Reject wrong quiz ID
  const otherQuizId = generateQuizId();
  assert.equal(verifyPlayerSessionToken(token, otherQuizId, attemptId), false);

  // 4. Reject tampered signature
  const tamperedToken = token.slice(0, -4) + "abcd";
  assert.equal(verifyPlayerSessionToken(tamperedToken, quizId, attemptId), false);

  // 5. Reject malformed tokens
  assert.equal(verifyPlayerSessionToken("invalid_token", quizId, attemptId), false);
  assert.equal(verifyPlayerSessionToken("ply_ses_notanumber_sig", quizId, attemptId), false);
  assert.equal(verifyPlayerSessionToken("", quizId, attemptId), false);

  // 6. Reject expired tokens
  assert.equal(verifyPlayerSessionToken(token, quizId, attemptId, -1), false);

  // 7. Reject future tokens (> 60s skew)
  const futureTimestamp = Date.now() + 120_000;
  const futureToken = `ply_ses_${futureTimestamp}_dummy`;
  assert.equal(verifyPlayerSessionToken(futureToken, quizId, attemptId), false);
});

test("Player Session API: Attempt submission sets HttpOnly cookie and returns playerToken", async () => {
  const tenQuestions = DEFAULT_QUIZ_QUESTIONS.slice(0, 10).map((q) => ({
    questionId: q.id,
    correctOptionId: q.options[0].id,
  }));

  // Create quiz
  const createReq = new NextRequest("http://localhost:3000/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creatorName: "Sara Khan",
      gender: "female",
      secretPin: "1234",
      questions: tenQuestions,
    }),
  });
  const createRes = await createQuiz(createReq);
  const { quizId } = await createRes.json();
  assert.ok(quizId);

  // Submit attempt
  const attemptId = generateAttemptId();
  const attemptReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      playerName: "Amina",
      attemptId,
      answers: [
        { questionId: "q1", selectedOptionId: 0 },
        { questionId: "q2", selectedOptionId: 0 },
      ],
    }),
  });

  const attemptRes = await recordAttempt(attemptReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(attemptRes.status, 200);

  const attemptData = await attemptRes.json();
  assert.equal(attemptData.success, true);
  assert.equal(attemptData.attemptId, attemptId);
  assert.equal(attemptData.playerName, "Amina");
  assert.ok(attemptData.playerToken);
  assert.equal(verifyPlayerSessionToken(attemptData.playerToken, quizId, attemptId), true);

  // Verify Set-Cookie header contains HttpOnly, SameSite=Lax, and Secure in prod
  const setCookie = attemptRes.headers.get("set-cookie");
  assert.ok(setCookie, "Response must include Set-Cookie header");
  assert.ok(setCookie.includes(`ply_ses_${quizId}`));
  assert.ok(setCookie.toLowerCase().includes("httponly"));
  assert.ok(setCookie.toLowerCase().includes("samesite=lax"));
});

test("Player Result Retrieval: Secure credential verification and privacy protection", async () => {
  const tenQuestions = DEFAULT_QUIZ_QUESTIONS.slice(0, 10).map((q) => ({
    questionId: q.id,
    correctOptionId: q.options[0].id,
  }));

  // Create quiz
  const createReq = new NextRequest("http://localhost:3000/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creatorName: "Bilal",
      gender: "male",
      secretPin: "9999",
      questions: tenQuestions,
    }),
  });
  const createRes = await createQuiz(createReq);
  const { quizId } = await createRes.json();

  // Submit attempt
  const attemptId = generateAttemptId();
  const attemptReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      playerName: "Danish",
      attemptId,
      answers: [{ questionId: "q1", selectedOptionId: 0 }],
    }),
  });
  const attemptRes = await recordAttempt(attemptReq, { params: Promise.resolve({ id: quizId }) });
  const { playerToken } = await attemptRes.json();
  assert.ok(playerToken);

  // 1. Missing attemptId param returns 400
  const reqNoParam = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/player-result`);
  const resNoParam = await getPlayerResult(reqNoParam, { params: Promise.resolve({ id: quizId }) });
  assert.equal(resNoParam.status, 400);

  // 2. Unauthenticated request (no cookie, no token header) returns 401
  const reqUnauth = new NextRequest(
    `http://localhost:3000/api/quiz/${quizId}/player-result?attemptId=${attemptId}`
  );
  const resUnauth = await getPlayerResult(reqUnauth, { params: Promise.resolve({ id: quizId }) });
  assert.equal(resUnauth.status, 401);

  // 3. Forged attempt ID with stolen or mismatched token returns 401 (Requirement 6)
  const otherAttemptId = generateAttemptId();
  const reqMismatched = new NextRequest(
    `http://localhost:3000/api/quiz/${quizId}/player-result?attemptId=${otherAttemptId}`,
    {
      headers: { "x-player-token": playerToken },
    }
  );
  const resMismatched = await getPlayerResult(reqMismatched, {
    params: Promise.resolve({ id: quizId }),
  });
  assert.equal(resMismatched.status, 401);

  // 4. Authenticated request via x-player-token header returns 200 with sanitized result
  const reqWithHeader = new NextRequest(
    `http://localhost:3000/api/quiz/${quizId}/player-result?attemptId=${attemptId}`,
    {
      headers: { "x-player-token": playerToken },
    }
  );
  const resWithHeader = await getPlayerResult(reqWithHeader, {
    params: Promise.resolve({ id: quizId }),
  });
  assert.equal(resWithHeader.status, 200);
  const data = await resWithHeader.json();
  assert.equal(data.success, true);
  assert.equal(data.attempt.id, attemptId);
  assert.equal(data.attempt.playerName, "Danish");
  assert.equal(data.creatorName, "Bilal");
  assert.equal(data.gender, "male");

  // Requirement 5: Never expose creator answers, PIN hash, or detailed questions
  assert.equal(data.pinHash, undefined);
  assert.equal(data.creatorToken, undefined);
  assert.equal(data.attempt.answers, undefined);

  // 5. Authenticated request via Cookie header returns 200
  const reqWithCookie = new NextRequest(
    `http://localhost:3000/api/quiz/${quizId}/player-result?attemptId=${attemptId}`,
    {
      headers: { cookie: `ply_ses_${quizId}=${playerToken}` },
    }
  );
  const resWithCookie = await getPlayerResult(reqWithCookie, {
    params: Promise.resolve({ id: quizId }),
  });
  assert.equal(resWithCookie.status, 200);

  // 6. Graceful handling of deleted attempt returns 404 (Requirement 8)
  await deleteAttempt(quizId, attemptId);
  const reqDeleted = new NextRequest(
    `http://localhost:3000/api/quiz/${quizId}/player-result?attemptId=${attemptId}`,
    {
      headers: { "x-player-token": playerToken },
    }
  );
  const resDeleted = await getPlayerResult(reqDeleted, { params: Promise.resolve({ id: quizId }) });
  assert.equal(resDeleted.status, 404);
});
