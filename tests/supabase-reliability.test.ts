import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { NextRequest } from "next/server";
import {
  generateCreatorToken,
  hashCreatorToken,
  generateCreatorSessionToken,
  verifyCreatorSessionToken,
  verifyCreatorToken,
  hashPin,
  _resetPinRateLimit,
} from "@/lib/quiz/security";
import { createQuizStorage } from "@/lib/quiz/storage";
import { DEFAULT_QUIZ_QUESTIONS } from "@/lib/quiz/questions";
import { POST as createQuiz } from "@/app/api/quiz/route";
import { GET as getQuiz, DELETE as deleteQuiz } from "@/app/api/quiz/[id]/route";
import { POST as submitAttempt } from "@/app/api/quiz/[id]/attempt/route";
import {
  POST as getDetailedScoreboard,
  DELETE as deleteScoreboardAttempt,
} from "@/app/api/quiz/[id]/scoreboard/route";
import type { QuizData, PlayerAttempt } from "@/lib/quiz/types";

test("Phase 5: HMAC creator session token generation, verification, clock-skew and expiration", () => {
  const quizId = "q_test_session_123";
  const pinHash = hashPin("1234");

  // 1. Valid token generation
  const token = generateCreatorSessionToken(quizId, pinHash);
  assert.ok(token.startsWith("adm_cts_"), "Session token must start with adm_cts_");
  assert.equal(verifyCreatorSessionToken(token, quizId, pinHash), true);

  // 2. Reject with different quiz ID
  assert.equal(verifyCreatorSessionToken(token, "q_other_quiz", pinHash), false);

  // 3. Reject with different PIN hash (e.g. after PIN change)
  const otherPinHash = hashPin("5678");
  assert.equal(verifyCreatorSessionToken(token, quizId, otherPinHash), false);

  // 4. Reject tampered signature
  const parts = token.split("_");
  const tamperedToken = `${parts[0]}_${parts[1]}_${parts[2]}_${parts[3]}deadbeef`;
  assert.equal(verifyCreatorSessionToken(tamperedToken, quizId, pinHash), false);

  // 5. Reject expired token (older than 7 days)
  const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
  const expiredSig = crypto
    .createHmac("sha256", pinHash)
    .update(`${quizId}:${eightDaysAgo}`)
    .digest("hex");
  const expiredToken = `adm_cts_${eightDaysAgo}_${expiredSig}`;
  assert.equal(verifyCreatorSessionToken(expiredToken, quizId, pinHash), false);

  // 6. Reject future token (clock skew > 60 seconds)
  const futureTime = Date.now() + 120_000;
  const futureSig = crypto
    .createHmac("sha256", pinHash)
    .update(`${quizId}:${futureTime}`)
    .digest("hex");
  const futureToken = `adm_cts_${futureTime}_${futureSig}`;
  assert.equal(verifyCreatorSessionToken(futureToken, quizId, pinHash), false);

  // 7. Reject malformed tokens
  assert.equal(verifyCreatorSessionToken("not_a_session_token", quizId, pinHash), false);
  assert.equal(verifyCreatorSessionToken("adm_cts_invalid", quizId, pinHash), false);
  assert.equal(verifyCreatorSessionToken("", quizId, pinHash), false);
});

test("Phase 5.1: verifyCreatorToken requires original raw token and strictly rejects pass-the-hash digest submission", () => {
  const rawToken = generateCreatorToken();
  const storedDigest = hashCreatorToken(rawToken);
  const quizId = "q_verify_ctx";
  const pinHash = hashPin("4321");
  const ctx = { quizId, pinHash };

  // 1. Original raw creator token succeeds
  assert.equal(verifyCreatorToken(rawToken, storedDigest, ctx), true, "Original raw creator token must be accepted");

  // 2. Pass-the-hash defense: Stored SHA-256 token digest submitted directly as bearer credential is REJECTED
  assert.equal(
    verifyCreatorToken(storedDigest, storedDigest, ctx),
    false,
    "Stored SHA-256 digest submitted directly MUST be rejected (pass-the-hash defense)"
  );

  // 3. Invalid raw token is rejected
  assert.equal(verifyCreatorToken("adm_invalid_token_1234567890", storedDigest, ctx), false);
  assert.equal(verifyCreatorToken("wrong_token", rawToken, ctx), false);
  assert.equal(verifyCreatorToken("", storedDigest, ctx), false);

  // 4. Valid signed session token succeeds
  const sessionToken = generateCreatorSessionToken(quizId, pinHash);
  assert.equal(verifyCreatorToken(sessionToken, storedDigest, ctx), true, "Valid signed session token must succeed");

  // 5. Expired session token is rejected
  const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
  const expiredSig = crypto
    .createHmac("sha256", pinHash)
    .update(`${quizId}:${eightDaysAgo}`)
    .digest("hex");
  const expiredSessionToken = `adm_cts_${eightDaysAgo}_${expiredSig}`;
  assert.equal(
    verifyCreatorToken(expiredSessionToken, storedDigest, ctx),
    false,
    "Expired session token must be rejected"
  );

  // 6. Forged session token is rejected
  assert.equal(
    verifyCreatorToken("adm_cts_1234567890_deadbeefbadsignature", storedDigest, ctx),
    false,
    "Forged session token must be rejected"
  );

  // 7. Legitimate existing raw creator tokens in local/test storage (where storedToken is raw secret) succeed
  assert.equal(
    verifyCreatorToken(rawToken, rawToken, ctx),
    true,
    "Legitimate raw creator token in local storage must succeed"
  );
  assert.equal(
    verifyCreatorToken("wrong_raw", rawToken, ctx),
    false,
    "Wrong raw token in local storage must be rejected"
  );
});

test("Phase 5: Server-side creator authorization workflow with session token lifecycle", async () => {
  const ip = "198.51.100.1";
  _resetPinRateLimit(ip);

  // Pick 10 valid questions
  const tenQuestions = DEFAULT_QUIZ_QUESTIONS.slice(0, 10).map((q) => ({
    questionId: q.id,
    correctOptionId: q.options[0].id,
  }));

  // 1. Create a quiz
  const createReq = new NextRequest("http://localhost:3000/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({
      creatorName: "Session Creator",
      gender: "female",
      secretPin: "7777",
      questions: tenQuestions,
    }),
  });
  const createRes = await createQuiz(createReq);
  assert.equal(createRes.status, 200);
  const { quizId, creatorToken: initialRawToken } = await createRes.json();
  assert.ok(quizId);
  assert.ok(initialRawToken.startsWith("adm_"));

  // 2. Submit a player attempt
  const attemptReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      playerName: "Ayesha",
      answers: tenQuestions.map((q) => ({
        questionId: q.questionId,
        selectedOptionId: q.correctOptionId,
      })),
    }),
  });
  const attemptRes = await submitAttempt(attemptReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(attemptRes.status, 200);
  const { attemptId } = await attemptRes.json();
  assert.ok(attemptId);

  // 3. Creator logs into scoreboard using PIN
  const pinLoginReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/scoreboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ pin: "7777" }),
  });
  const pinLoginRes = await getDetailedScoreboard(pinLoginReq, {
    params: Promise.resolve({ id: quizId }),
  });
  assert.equal(pinLoginRes.status, 200);
  const pinLoginData = await pinLoginRes.json();
  assert.ok(pinLoginData.success);
  assert.ok(pinLoginData.creatorToken, "PIN login must return creatorToken");
  assert.ok(pinLoginData.creatorToken.startsWith("adm_cts_"), "Returned token must be an HMAC session token");

  const sessionToken = pinLoginData.creatorToken;

  // 4. Use the session token to view detailed answers without providing PIN
  const detailReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/scoreboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ creatorToken: sessionToken }),
  });
  const detailRes = await getDetailedScoreboard(detailReq, {
    params: Promise.resolve({ id: quizId }),
  });
  assert.equal(detailRes.status, 200);
  const detailData = await detailRes.json();
  assert.ok(detailData.success);
  assert.equal(detailData.scoreboard.length, 1);
  assert.ok(Array.isArray(detailData.scoreboard[0].answers));

  // 5. Use session token to delete attempt without providing PIN
  const deleteAttReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/scoreboard`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ attemptId, creatorToken: sessionToken }),
  });
  const deleteAttRes = await deleteScoreboardAttempt(deleteAttReq, {
    params: Promise.resolve({ id: quizId }),
  });
  assert.equal(deleteAttRes.status, 200);

  // 6. Forged token is rejected with 403
  const forgedReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/scoreboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ creatorToken: "adm_cts_123456789_forgedsignature" }),
  });
  const forgedRes = await getDetailedScoreboard(forgedReq, {
    params: Promise.resolve({ id: quizId }),
  });
  assert.equal(forgedRes.status, 403);

  // 6b. Pass-the-hash attack: Submitting the SHA-256 digest directly to API is rejected with 403
  const rawTokenHash = hashCreatorToken(initialRawToken);
  const pthReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/scoreboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ creatorToken: rawTokenHash }),
  });
  const pthRes = await getDetailedScoreboard(pthReq, {
    params: Promise.resolve({ id: quizId }),
  });
  assert.equal(pthRes.status, 403, "Pass-the-hash submission to scoreboard POST must return 403");

  const pthDeleteReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ creatorToken: rawTokenHash }),
  });
  const pthDeleteRes = await deleteQuiz(pthDeleteReq, {
    params: Promise.resolve({ id: quizId }),
  });
  assert.equal(pthDeleteRes.status, 403, "Pass-the-hash submission to quiz DELETE must return 403");

  // 7. Token-only deletion is rejected (Phase 9.3: PIN is strictly required for whole-quiz deletion)
  const tokenOnlyDeleteReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ creatorToken: sessionToken }),
  });
  const tokenOnlyDeleteRes = await deleteQuiz(tokenOnlyDeleteReq, {
    params: Promise.resolve({ id: quizId }),
  });
  assert.equal(tokenOnlyDeleteRes.status, 403, "Token-only submission to quiz DELETE must return 403");

  // 7b. Authorized quiz deletion strictly using PIN
  const deleteQuizReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ pin: "7777" }),
  });
  const deleteQuizRes = await deleteQuiz(deleteQuizReq, {
    params: Promise.resolve({ id: quizId }),
  });
  assert.equal(deleteQuizRes.status, 200);

  // 8. Subsequent fetch returns 404
  const getReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}`);
  const getRes = await getQuiz(getReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(getRes.status, 404);

  _resetPinRateLimit(ip);
});

test("Phase 5: Attempt validation enforces non-empty, well-formed answers and prevents score inflation", async () => {
  const tenQuestions = DEFAULT_QUIZ_QUESTIONS.slice(0, 10).map((q) => ({
    questionId: q.id,
    correctOptionId: q.options[0].id,
  }));

  const createReq = new NextRequest("http://localhost:3000/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creatorName: "Attempt Auditor",
      gender: "male",
      secretPin: "9999",
      questions: tenQuestions,
    }),
  });
  const createRes = await createQuiz(createReq);
  const { quizId } = await createRes.json();
  assert.ok(quizId);

  // 1. Rejects missing playerName
  const noNameRes = await submitAttempt(
    new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "", answers: [{ questionId: "q1", selectedOptionId: 0 }] }),
    }),
    { params: Promise.resolve({ id: quizId }) }
  );
  assert.equal(noNameRes.status, 400);

  // 2. Rejects empty answers array
  const emptyRes = await submitAttempt(
    new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "Player", answers: [] }),
    }),
    { params: Promise.resolve({ id: quizId }) }
  );
  assert.equal(emptyRes.status, 400);

  // 3. Rejects malformed answer elements (e.g. null, missing questionId, missing selectedOptionId)
  const malformedRes = await submitAttempt(
    new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "Player", answers: [null] }),
    }),
    { params: Promise.resolve({ id: quizId }) }
  );
  assert.equal(malformedRes.status, 400);

  // 4. Rejects invalid question ID not in quiz
  const wrongQRes = await submitAttempt(
    new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerName: "Player",
        answers: [{ questionId: "nonexistent_q", selectedOptionId: 0 }],
      }),
    }),
    { params: Promise.resolve({ id: quizId }) }
  );
  assert.equal(wrongQRes.status, 400);

  // 5. Rejects unsupported option ID
  const invalidOptRes = await submitAttempt(
    new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerName: "Player",
        answers: [{ questionId: tenQuestions[0].questionId, selectedOptionId: 9999 }],
      }),
    }),
    { params: Promise.resolve({ id: quizId }) }
  );
  assert.equal(invalidOptRes.status, 400);

  // 6. Duplicate questions within submission are deduplicated without inflating score
  const dupQAnswers = [
    { questionId: tenQuestions[0].questionId, selectedOptionId: tenQuestions[0].correctOptionId },
    { questionId: tenQuestions[0].questionId, selectedOptionId: tenQuestions[0].correctOptionId },
    { questionId: tenQuestions[1].questionId, selectedOptionId: tenQuestions[1].correctOptionId },
  ];
  const dupRes = await submitAttempt(
    new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "Dedup Player", answers: dupQAnswers }),
    }),
    { params: Promise.resolve({ id: quizId }) }
  );
  assert.equal(dupRes.status, 200);
  const dupData = await dupRes.json();
  assert.equal(dupData.score, 2, "Duplicate question answers must not inflate score");
  assert.equal(dupData.totalQuestions, 10);
});

test("Phase 5: Storage reliability, atomic transactions, insertion-only semantics and public sanitization", async () => {
  const storage = createQuizStorage();

  const id = "q_atomic_verify_" + Date.now();
  const rawToken = generateCreatorToken();
  const quiz: QuizData = {
    id,
    slug: id,
    creatorName: "Reliability Tester",
    gender: "female",
    country: "PK",
    theme: "dont_block_me",
    pinHash: hashPin("5555"),
    creatorToken: rawToken,
    createdAt: Date.now(),
    questions: [
      {
        questionId: "q40", // 2 options
        question: "2 Options Test",
        options: [
          { id: 0, text: "Early Bird", imageUrl: "/illustrations/early_bird.svg" },
          { id: 1, text: "Night Owl", imageUrl: "/illustrations/night_owl.svg" },
        ],
        correctOptionId: 1,
      },
      {
        questionId: "q1", // 4 options
        question: "4 Options Test",
        options: [
          { id: 0, text: "Chai", imageUrl: "/illustrations/chai.svg" },
          { id: 1, text: "Coffee", imageUrl: "/illustrations/coffee.svg" },
          { id: 2, text: "Fresh Juice", imageUrl: "/illustrations/juice.svg" },
          { id: 3, text: "Boba Tea", imageUrl: "/illustrations/boba.svg" },
        ],
        correctOptionId: 0,
      },
    ],
  };

  try {
    // 1. Initial save succeeds
    const saved = await storage.saveQuiz(quiz);
    assert.equal(saved, true);

    // 2. Insert-only semantics: duplicate insertion returns false
    const duplicateSave = await storage.saveQuiz(quiz);
    assert.equal(duplicateSave, false);

    // 3. Overwrite attempt returns false
    const overwrite = await storage.saveQuiz({ ...quiz, creatorName: "Evil Overwrite" });
    assert.equal(overwrite, false);

    // 4. Public data sanitization: pinHash, creatorToken, and correctOptionId are NEVER exposed
    const publicData = await storage.getQuizPublicData(id);
    assert.ok(publicData);
    assert.equal("pinHash" in (publicData as unknown as Record<string, unknown>), false);
    assert.equal("creatorToken" in (publicData as unknown as Record<string, unknown>), false);
    for (const q of publicData.questions) {
      assert.equal("correctOptionId" in (q as unknown as Record<string, unknown>), false);
      assert.ok(q.options.length >= 2);
      // Image and text persist intact
      for (const opt of q.options) {
        assert.ok(opt.text);
        assert.ok(opt.imageUrl);
      }
    }

    // 5. Deterministic tie-breaking on scoreboard
    const att1: PlayerAttempt = {
      id: `${id}_att_early`,
      quizId: id,
      playerName: "SameScoreEarly",
      score: 2,
      totalQuestions: 2,
      answers: [],
      createdAt: 1000,
    };
    const att2: PlayerAttempt = {
      id: `${id}_att_late`,
      quizId: id,
      playerName: "SameScoreLate",
      score: 2,
      totalQuestions: 2,
      answers: [],
      createdAt: 2000,
    };
    const att3: PlayerAttempt = {
      id: `${id}_att_low`,
      quizId: id,
      playerName: "LowScore",
      score: 1,
      totalQuestions: 2,
      answers: [],
      createdAt: 500,
    };

    await storage.recordAttempt(att2);
    await storage.recordAttempt(att1);
    await storage.recordAttempt(att3);

    const scoreboard = await storage.getScoreboard(id);
    assert.equal(scoreboard.length, 3);
    assert.equal(scoreboard[0].playerName, "SameScoreEarly", "Earlier timestamp breaks score tie");
    assert.equal(scoreboard[1].playerName, "SameScoreLate");
    assert.equal(scoreboard[2].playerName, "LowScore");
  } finally {
    // 6. Cleanup
    await storage.deleteQuiz(id);
  }
});

test("Phase 5: Backward compatibility with older 5-question text-only quiz records", async () => {
  const storage = createQuizStorage();
  const legacyId = "q_legacy_record_5q";

  // Older stored quiz with 5 questions and no imageUrl
  const legacyQuiz: QuizData = {
    id: legacyId,
    slug: legacyId,
    creatorName: "Legacy Creator",
    gender: "male",
    country: "PK",
    theme: "dont_block_me",
    pinHash: hashPin("3333"),
    creatorToken: generateCreatorToken(),
    createdAt: Date.now() - 100_000,
    questions: [
      {
        questionId: "old_q1",
        question: "Old Text Question 1",
        options: [
          { id: 0, text: "Alpha" },
          { id: 1, text: "Beta" },
        ],
        correctOptionId: 0,
      },
      {
        questionId: "old_q2",
        question: "Old Text Question 2",
        options: [
          { id: 0, text: "Gamma" },
          { id: 1, text: "Delta" },
        ],
        correctOptionId: 1,
      },
    ],
  };

  await storage.saveQuiz(legacyQuiz);

  // Retrieval succeeds and respects 2 total questions dynamically
  const retrieved = await storage.getQuizPublicData(legacyId);
  assert.ok(retrieved);
  assert.equal(retrieved.totalQuestions, 2);
  assert.equal(retrieved.questions[0].options[0].text, "Alpha");
  assert.equal(retrieved.questions[0].options[0].imageUrl, undefined);

  // Player attempt succeeds on legacy quiz
  const attempt: PlayerAttempt = {
    id: "att_legacy_player",
    quizId: legacyId,
    playerName: "Legacy Player",
    score: 2,
    totalQuestions: 2,
    answers: [
      { questionId: "old_q1", selectedOptionId: 0, isCorrect: true },
      { questionId: "old_q2", selectedOptionId: 1, isCorrect: true },
    ],
    createdAt: Date.now(),
  };
  assert.equal(await storage.recordAttempt(attempt), true);

  // Scoreboard calculation works with 100% ratio (bestie badge)
  const board = await storage.getScoreboard(legacyId);
  assert.equal(board.length, 1);
  assert.equal(board[0].statusBadge, "bestie");
  assert.equal(board[0].score, 2);
  assert.equal(board[0].totalQuestions, 2);

  // Scoreboard details maps properly
  const details = await storage.getScoreboardDetails(legacyId);
  assert.equal(details.length, 1);
  assert.equal(details[0].answers[0].theirAnswer, "Alpha");
  assert.equal(details[0].answers[0].correctAnswer, "Alpha");

  await storage.deleteQuiz(legacyId);
});
