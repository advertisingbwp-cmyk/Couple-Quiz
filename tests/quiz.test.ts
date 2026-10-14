import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_QUIZ_QUESTIONS } from "../lib/quiz/questions";
import {
  saveQuiz,
  getQuizById,
  getQuizPublicData,
  recordAttempt,
  getScoreboard,
  getScoreboardDetails,
  deleteAttempt,
  deleteQuiz,
} from "../lib/quiz/storage";
import { QuizData, PlayerAttempt } from "../lib/quiz/types";
import {
  hashPin,
  verifyPin,
  checkPinRateLimit,
  encodeQuizPayload,
  decodeQuizPayload,
  encryptPayload,
  decryptPayload,
} from "../lib/quiz/security";

test("Quiz Domain: Questions bank has valid structure and unique IDs", () => {
  assert.ok(DEFAULT_QUIZ_QUESTIONS.length >= 10, "Should have at least 10 questions");
  const idSet = new Set<string>();

  for (const q of DEFAULT_QUIZ_QUESTIONS) {
    assert.ok(q.id, "Question must have an id");
    assert.ok(!idSet.has(q.id), `Duplicate question id: ${q.id}`);
    idSet.add(q.id);

    assert.ok(q.question.trim().length > 5, "Question text must be meaningful");
    assert.equal(q.options.length, 4, "Every question must have 4 options");
    const optionIds = q.options.map((o) => o.id);
    assert.deepEqual(optionIds, [0, 1, 2, 3], "Option IDs must be 0, 1, 2, 3");
  }
});

test("Quiz Security: PIN hashing, verification, rate limiting, and backup tokens", () => {
  const pin = "7890";
  const hashed = hashPin(pin);
  assert.notEqual(hashed, pin, "PIN must be hashed");
  assert.ok(verifyPin("7890", hashed), "Valid PIN must verify");
  assert.ok(!verifyPin("1111", hashed), "Invalid PIN must fail");
  assert.ok(!verifyPin("", hashed), "Empty PIN must fail");

  // Rate limiter test
  const testIp = "192.0.2.1";
  for (let i = 0; i < 5; i++) {
    assert.ok(checkPinRateLimit(testIp), `Attempt ${i + 1} should be permitted`);
  }
  assert.equal(checkPinRateLimit(testIp), false, "6th attempt must be rate limited");

  // Backup payload token test
  const samplePayload = { id: "q_test_123", creatorName: "Sara" };
  const token = encodeQuizPayload(samplePayload);
  assert.ok(typeof token === "string" && token.length > 10);
  const decoded = decodeQuizPayload<typeof samplePayload>(token);
  assert.deepEqual(decoded, samplePayload);

  // Authenticated encryption test
  const secretData = { quizId: "q_123", answers: { q1: 2, q2: 0 } };
  const encrypted = encryptPayload(secretData);
  assert.ok(typeof encrypted === "string" && encrypted.length > 20);
  const decrypted = decryptPayload<typeof secretData>(encrypted);
  assert.deepEqual(decrypted, secretData);
  assert.equal(decryptPayload("invalid_tampered_token"), null);
});

test("Quiz Storage & Ranking: Public scoreboard hides answers and ranks highest score first", async () => {
  const quizId = "test_quiz_ranking_102";
  const mockQuiz: QuizData = {
    id: quizId,
    slug: "sara-challenge-102",
    creatorName: "Sara",
    gender: "female",
    country: "PK",
    theme: "dont_block_me",
    pinHash: hashPin("5555"),
    creatorToken: "adm_secret_token_123",
    createdAt: Date.now(),
    questions: [
      {
        questionId: "q1",
        question: "Secret talent?",
        emoji: "🎭",
        options: [
          { id: 0, text: "Singer" },
          { id: 1, text: "Cook" },
          { id: 2, text: "Sleep" },
          { id: 3, text: "Gamer" },
        ],
        correctOptionId: 1,
      },
      {
        questionId: "q2",
        question: "Food?",
        emoji: "🍕",
        options: [
          { id: 0, text: "Biryani" },
          { id: 1, text: "Pizza" },
          { id: 2, text: "Chai" },
          { id: 3, text: "Burger" },
        ],
        correctOptionId: 0,
      },
    ],
  };

  await saveQuiz(mockQuiz);

  // Older attempt with LOW score (0/2) submitted first
  await recordAttempt({
    id: "att_low",
    quizId,
    playerName: "Bilal",
    score: 0,
    totalQuestions: 2,
    answers: [
      { questionId: "q1", selectedOptionId: 0, isCorrect: false },
      { questionId: "q2", selectedOptionId: 1, isCorrect: false },
    ],
    createdAt: Date.now(),
  });

  // Newer attempt with HIGH score (2/2) submitted later
  await recordAttempt({
    id: "att_high",
    quizId,
    playerName: "Hamza",
    score: 2,
    totalQuestions: 2,
    answers: [
      { questionId: "q1", selectedOptionId: 1, isCorrect: true },
      { questionId: "q2", selectedOptionId: 0, isCorrect: true },
    ],
    createdAt: Date.now() + 5000,
  });

  // Public Scoreboard Audit:
  const publicBoard = await getScoreboard(quizId);
  assert.equal(publicBoard.length, 2);

  // Audit finding fix: Highest score MUST be rank #1 (Hamza over Bilal)
  assert.equal(publicBoard[0].playerName, "Hamza", "Highest score must rank 1st");
  assert.equal(publicBoard[0].score, 2);
  assert.equal(publicBoard[1].playerName, "Bilal", "Lowest score must rank 2nd");
  assert.equal(publicBoard[1].score, 0);

  // Audit finding fix: Public scoreboard must NOT contain answers array
  assert.equal((publicBoard[0] as unknown as Record<string, unknown>).answers, undefined, "Public scoreboard must omit answers");
  assert.equal((publicBoard[1] as unknown as Record<string, unknown>).answers, undefined, "Public scoreboard must omit answers");

  // Authenticated Creator Scoreboard Audit:
  const detailedBoard = await getScoreboardDetails(quizId);
  assert.equal(detailedBoard.length, 2);
  assert.ok(detailedBoard[0].answers, "Detailed scoreboard must provide answers");
  assert.equal(detailedBoard[0].answers[0].isCorrect, true);

  // Cleanup
  await deleteQuiz(quizId);
  assert.equal(await getQuizById(quizId), null);
});
