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
  _setStorageWriteFailureSimulation,
} from "../lib/quiz/storage";
import { QuizData } from "../lib/quiz/types";
import {
  hashPin,
  verifyPin,
  checkPinRateLimit,
  timingSafeEqualString,
  generateCreatorToken,
  _resetPinRateLimit,
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

test("Security Task 1 & 2: scrypt PIN hashing with per-record salt & strict PIN validation", () => {
  const pin = "7890";
  const hash1 = hashPin(pin);
  const hash2 = hashPin(pin);

  // Per-record salt requirement: Two hashes of the same PIN must NOT match
  assert.notEqual(hash1, hash2, "scrypt hashes must use unique per-record salts");
  assert.ok(hash1.startsWith("scrypt:"), "Hash format must start with scrypt algorithm identifier");

  // Constant-time verification
  assert.ok(verifyPin("7890", hash1), "Valid PIN must verify successfully");
  assert.ok(verifyPin("7890", hash2), "Valid PIN must verify against second salt");
  assert.ok(!verifyPin("1111", hash1), "Incorrect PIN must fail");
  assert.ok(!verifyPin("", hash1), "Empty PIN must fail");
  assert.ok(!verifyPin("abcd", hash1), "Non-numeric PIN must fail");

  // Invalid PIN rejection (Never accept default PINs, non-numeric, or invalid lengths)
  assert.throws(() => hashPin(""), /PIN must be 4 to 6 digits/);
  assert.throws(() => hashPin("12"), /PIN must be 4 to 6 digits/);
  assert.throws(() => hashPin("123"), /PIN must be 4 to 6 digits/);
  assert.throws(() => hashPin("1234567"), /PIN must be 4 to 6 digits/);
  assert.throws(() => hashPin("abcd"), /PIN must be 4 to 6 digits/);
  assert.throws(() => hashPin("12ab"), /PIN must be 4 to 6 digits/);

  // Constant-time token comparisons
  const token = generateCreatorToken();
  assert.ok(token.startsWith("adm_") && token.length > 20);
  assert.ok(timingSafeEqualString(token, token), "Identical tokens must match");
  assert.ok(!timingSafeEqualString(token, "adm_wrong_token_1234"), "Mismatched tokens must fail");
  assert.ok(!timingSafeEqualString(token, ""), "Empty token must fail");

  // Brute-force rate limiting: 5 allowed, 6th rate-limited
  const testIp = "192.0.2.99";
  _resetPinRateLimit(testIp);
  for (let i = 0; i < 5; i++) {
    assert.ok(checkPinRateLimit(testIp), `Attempt ${i + 1} should be permitted`);
  }
  assert.equal(checkPinRateLimit(testIp), false, "6th attempt must be rate limited");
  _resetPinRateLimit(testIp);
});

test("Security Task 3: Storage-backed quiz retrieval & immunity to untrusted URL hydration", async () => {
  const quizId = "test_quiz_security_001";
  const pinHash = hashPin("4321");
  const creatorToken = generateCreatorToken();

  const mockQuiz: QuizData = {
    id: quizId,
    slug: "security-test-001",
    creatorName: "Ayesha",
    gender: "female",
    country: "PK",
    theme: "dont_block_me",
    pinHash,
    creatorToken,
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
    ],
  };

  // Normal quiz creation
  const saved = await saveQuiz(mockQuiz);
  assert.equal(saved, true, "Valid quiz must be persisted");

  // Normal quiz retrieval
  const retrieved = await getQuizById(quizId);
  assert.ok(retrieved, "Quiz must be retrievable from storage");
  assert.equal(retrieved.creatorName, "Ayesha");

  // Public data must omit PIN hash, creatorToken, and correctOptionId
  const publicData = await getQuizPublicData(quizId);
  assert.ok(publicData);
  assert.equal(publicData.creatorName, "Ayesha");
  assert.equal((publicData as unknown as Record<string, unknown>).pinHash, undefined);
  assert.equal((publicData as unknown as Record<string, unknown>).creatorToken, undefined);
  assert.equal((publicData.questions[0] as unknown as Record<string, unknown>).correctOptionId, undefined);

  // Nonexistent quiz must strictly return null (no untrusted URL fallback hydration)
  const nonexistent = await getQuizById("nonexistent_quiz_999");
  assert.equal(nonexistent, null, "Nonexistent quiz must fail closed with null");

  // Cleanup
  await deleteQuiz(quizId);
  assert.equal(await getQuizById(quizId), null);
});

test("Security Task 4: Storage failure resilience & fail-closed behavior", async () => {
  const quizId = "test_quiz_failure_simulation";
  const mockQuiz: QuizData = {
    id: quizId,
    slug: "failure-sim-001",
    creatorName: "TestFail",
    gender: "male",
    country: "PK",
    theme: "dont_block_me",
    pinHash: hashPin("6543"),
    creatorToken: generateCreatorToken(),
    createdAt: Date.now(),
    questions: [],
  };

  // Simulate storage failure
  _setStorageWriteFailureSimulation(true);

  // Must NOT report success when persistence fails
  const saveResult = await saveQuiz(mockQuiz);
  assert.equal(saveResult, false, "saveQuiz must fail closed and return false when persistence fails");

  const attemptResult = await recordAttempt({
    id: "att_fail",
    quizId,
    playerName: "PlayerFail",
    score: 0,
    totalQuestions: 1,
    answers: [],
    createdAt: Date.now(),
  });
  assert.equal(attemptResult, false, "recordAttempt must return false when persistence fails");

  // Restore normal storage
  _setStorageWriteFailureSimulation(false);
  const normalSave = await saveQuiz(mockQuiz);
  assert.equal(normalSave, true, "saveQuiz succeeds when storage write succeeds");

  await deleteQuiz(quizId);
});

test("Security Task 5: Scoreboard privacy & ranking integrity", async () => {
  const quizId = "test_quiz_scoreboard_privacy";
  const pinHash = hashPin("9876");
  const creatorToken = generateCreatorToken();

  const mockQuiz: QuizData = {
    id: quizId,
    slug: "privacy-test-001",
    creatorName: "Usman",
    gender: "male",
    country: "PK",
    theme: "dont_block_me",
    pinHash,
    creatorToken,
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
        correctOptionId: 2,
      },
      {
        questionId: "q2",
        question: "Favourite food?",
        emoji: "🍕",
        options: [
          { id: 0, text: "Biryani" },
          { id: 1, text: "Pizza" },
          { id: 2, text: "Burger" },
          { id: 3, text: "Nihari" },
        ],
        correctOptionId: 0,
      },
    ],
  };

  await saveQuiz(mockQuiz);

  // Attempt 1: Low score
  await recordAttempt({
    id: "att_low_score",
    quizId,
    playerName: "Zaid",
    score: 0,
    totalQuestions: 2,
    answers: [
      { questionId: "q1", selectedOptionId: 0, isCorrect: false },
      { questionId: "q2", selectedOptionId: 1, isCorrect: false },
    ],
    createdAt: 1000,
  });

  // Attempt 2: High score
  await recordAttempt({
    id: "att_high_score",
    quizId,
    playerName: "Fatima",
    score: 2,
    totalQuestions: 2,
    answers: [
      { questionId: "q1", selectedOptionId: 2, isCorrect: true },
      { questionId: "q2", selectedOptionId: 0, isCorrect: true },
    ],
    createdAt: 2000,
  });

  // 1. Public scoreboard privacy: answers are strictly omitted
  const publicBoard = await getScoreboard(quizId);
  assert.equal(publicBoard.length, 2);
  assert.equal(publicBoard[0].playerName, "Fatima", "Highest score must rank 1st");
  assert.equal(publicBoard[0].score, 2);
  assert.equal(publicBoard[0].statusBadge, "bestie");
  assert.equal(publicBoard[1].playerName, "Zaid", "Lowest score must rank 2nd");
  assert.equal(publicBoard[1].score, 0);
  assert.equal(publicBoard[1].statusBadge, "fake");

  // Verify private answers are omitted from public payload
  assert.equal((publicBoard[0] as unknown as Record<string, unknown>).answers, undefined);
  assert.equal((publicBoard[1] as unknown as Record<string, unknown>).answers, undefined);

  // 2. Creator detailed scoreboard: contains answers breakdown
  const detailedBoard = await getScoreboardDetails(quizId);
  assert.equal(detailedBoard.length, 2);
  assert.ok(detailedBoard[0].answers, "Detailed board must provide answers");
  assert.equal(detailedBoard[0].answers.length, 2);
  assert.equal(detailedBoard[0].answers[0].isCorrect, true);

  // 3. Creator deletion
  const deletedAttempt = await deleteAttempt(quizId, "att_low_score");
  assert.equal(deletedAttempt, true, "Attempt deletion succeeds");
  const boardAfterDelete = await getScoreboard(quizId);
  assert.equal(boardAfterDelete.length, 1);
  assert.equal(boardAfterDelete[0].playerName, "Fatima");

  // Cleanup
  await deleteQuiz(quizId);
  assert.equal(await getQuizById(quizId), null);
});
