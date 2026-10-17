import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_QUIZ_QUESTIONS } from "../lib/quiz/questions";
import {
  saveQuiz,
  getQuizById,
  getQuizPublicData,
  recordAttempt,
  getScoreboard,
  deleteAttempt,
  deleteQuiz,
  _setStorageWriteFailureSimulation,
} from "../lib/quiz/storage";
import { QuizData, PlayerAttempt } from "../lib/quiz/types";
import {
  hashPin,
  checkPinRateLimit,
  recordFailedPinAttempt,
  clearPinRateLimit,
  generateCreatorToken,
  generateQuizId,
  generateAttemptId,
  generateQuizSlug,
  extractClientIp,
  _resetPinRateLimit,
} from "../lib/quiz/security";
import {
  initQuizDeck,
  getCurrentQuestion,
  skipQuestion,
  selectQuestionOption,
  isDeckComplete,
  getRemainingUnanswered,
} from "../lib/quiz/deck";
import { _enableMockSupabase, _getMockSupabaseStore, isSupabaseConfigured } from "../lib/quiz/supabase";

beforeEach(() => { _enableMockSupabase(true); });
afterEach(() => { _setStorageWriteFailureSimulation(false); _enableMockSupabase(false); });

test("Task 1: Quiz Skip & Deck State Machine Progression", () => {
  // 1. Initial State
  const deck0 = initQuizDeck(DEFAULT_QUIZ_QUESTIONS, 10);
  assert.equal(deck0.targetCount, 10);
  assert.equal(deck0.answers.length, 0);
  assert.equal(isDeckComplete(deck0), false);

  const q1 = getCurrentQuestion(deck0);
  assert.ok(q1, "Initial question must exist");
  assert.equal(q1.id, DEFAULT_QUIZ_QUESTIONS[0].id);

  // 2. Skipping questions advances to next available without adding to answers
  const deck1 = skipQuestion(deck0);
  assert.equal(deck1.answers.length, 0, "Skipping must not add an answer");
  const q2 = getCurrentQuestion(deck1);
  assert.ok(q2);
  assert.notEqual(q2.id, q1.id, "Skipping must show a different question");
  assert.equal(q2.id, DEFAULT_QUIZ_QUESTIONS[1].id);

  // 3. Skip wrap-around without infinite loop
  let deckWrap = deck0;
  for (let i = 0; i < 30; i++) {
    deckWrap = skipQuestion(deckWrap);
    const q = getCurrentQuestion(deckWrap);
    assert.ok(q, "Question must always resolve during repeated skips");
  }

  // 4. Selecting answers removes question from remaining pool and tracks progress accurately
  let activeDeck = deck0;
  const answeredIds = new Set<string>();

  for (let i = 0; i < 10; i++) {
    const curQ = getCurrentQuestion(activeDeck)!;
    assert.ok(!answeredIds.has(curQ.id), "Should never present an already-answered question");
    answeredIds.add(curQ.id);

    activeDeck = selectQuestionOption(activeDeck, 0);
    assert.equal(activeDeck.answers.length, i + 1, "Answers count must accurately represent progress");
  }

  assert.equal(activeDeck.answers.length, 10);
  assert.equal(isDeckComplete(activeDeck), true, "Deck must be complete once target is reached");
  assert.equal(answeredIds.size, 10, "Creator must select exactly 10 unique questions");

  // 5. Pool exhaustion handling: small pool with 3 questions and target 10
  const smallPool = DEFAULT_QUIZ_QUESTIONS.slice(0, 3);
  let smallDeck = initQuizDeck(smallPool, 10);
  assert.equal(smallDeck.targetCount, 3, "Target count must clamp to available pool size");

  smallDeck = selectQuestionOption(smallDeck, 1);
  smallDeck = selectQuestionOption(smallDeck, 2);
  smallDeck = selectQuestionOption(smallDeck, 3);
  assert.equal(isDeckComplete(smallDeck), true, "Deck must gracefully complete when pool is exhausted");
  assert.equal(getRemainingUnanswered(smallDeck).length, 0);
  assert.equal(getCurrentQuestion(smallDeck), null);
});

test("Task 2: Cryptographically Secure Unique Identifiers", () => {
  // Test quiz ID format and collision resistance
  const quizIds = new Set<string>();
  for (let i = 0; i < 500; i++) {
    const qid = generateQuizId();
    assert.match(qid, /^q_\d+_[a-f0-9]{12}$/, "Quiz ID must match secure format q_<timestamp>_<12_hex_chars>");
    assert.ok(!quizIds.has(qid), `Collision detected on quiz ID: ${qid}`);
    quizIds.add(qid);
  }

  // Test attempt ID format and collision resistance
  const attemptIds = new Set<string>();
  for (let i = 0; i < 500; i++) {
    const aid = generateAttemptId();
    assert.match(aid, /^att_\d+_[a-f0-9]{12}$/, "Attempt ID must match secure format att_<timestamp>_<12_hex_chars>");
    assert.ok(!attemptIds.has(aid), `Collision detected on attempt ID: ${aid}`);
    attemptIds.add(aid);
  }

  // Test slug generation
  const slug = generateQuizSlug("Ali & Sara's Quiz! 2026");
  assert.match(slug, /^[a-z0-9-]+-[a-f0-9]{8}$/, "Slug must be clean URL-safe alphanumeric with hex entropy");
});

test("Task 3: Supabase Concurrency & Atomic Operations", async () => {
  // Enable Supabase mock to verify atomic RPC execution and store updates
  _enableMockSupabase(true);
  assert.equal(isSupabaseConfigured(), true);

  const quizId = generateQuizId();
  const mockQuiz: QuizData = {
    id: quizId,
    slug: generateQuizSlug("Concurrency Test"),
    creatorName: "Hamza",
    gender: "male",
    country: "PK",
    theme: "dont_block_me",
    pinHash: hashPin("9999"),
    creatorToken: generateCreatorToken(),
    createdAt: Date.now(),
    questions: [
      {
        questionId: "q1",
        question: "Best game?",
        emoji: "🎮",
        options: [
          { id: 0, text: "PUBG" },
          { id: 1, text: "GTA" },
          { id: 2, text: "FIFA" },
          { id: 3, text: "Minecraft" },
        ],
        correctOptionId: 2,
      },
    ],
  };

  await saveQuiz(mockQuiz);

  // Simulate 30 simultaneous concurrent player submissions
  const concurrentAttempts: PlayerAttempt[] = [];
  for (let i = 0; i < 30; i++) {
    concurrentAttempts.push({
      id: generateAttemptId(),
      quizId,
      playerName: `Player_${i}`,
      score: i % 2 === 0 ? 1 : 0,
      totalQuestions: 1,
      answers: [{ questionId: "q1", selectedOptionId: i % 2 === 0 ? 2 : 0, isCorrect: i % 2 === 0 }],
      createdAt: 1000 + i,
    });
  }

  // Fire all 30 submissions concurrently
  const results = await Promise.all(concurrentAttempts.map((att) => recordAttempt(att)));
  assert.ok(results.every((r) => r === true), "All concurrent attempts must succeed");
  assert.equal(_getMockSupabaseStore()!.attempts.size, 30, "Must write the Supabase store, not local memory");

  // Verify all 30 attempts were recorded atomically with zero lost writes
  const scoreboard = await getScoreboard(quizId);
  assert.equal(scoreboard.length, 30, "All 30 concurrent attempts must be preserved without overwriting");

  // Score ordering check: highest score (1) must appear before score (0)
  assert.equal(scoreboard[0].score, 1, "First ranked player must have highest score");
  assert.equal(scoreboard[scoreboard.length - 1].score, 0, "Last ranked player must have lowest score");

  // Tie-breaker check: among equal scores, earlier createdAt comes first
  const highScorers = scoreboard.filter((s) => s.score === 1);
  for (let i = 0; i < highScorers.length - 1; i++) {
    assert.ok(highScorers[i].createdAt <= highScorers[i + 1].createdAt, "Tie breaker must order earlier attempts first");
  }

  // Atomic attempt deletion: deleting an attempt must remove it atomically
  const targetAttempt = concurrentAttempts[0];
  const deleteRes = await deleteAttempt(quizId, targetAttempt.id);
  assert.equal(deleteRes, true, "Attempt deletion must succeed");

  const scoreboardAfterDelete = await getScoreboard(quizId);
  assert.equal(scoreboardAfterDelete.length, 29);
  assert.ok(!scoreboardAfterDelete.some((s) => s.id === targetAttempt.id), "Deleted attempt must never reappear");

  // Quiz deletion: removes quiz and all remaining attempts
  const deleteQuizRes = await deleteQuiz(quizId);
  assert.equal(deleteQuizRes, true, "Quiz deletion must succeed");
  assert.equal(await getQuizById(quizId), null, "Deleted quiz must return null");

  _enableMockSupabase(false);
});

test("Task 4: Distributed Rate Limiting & Safe IP Extraction", async () => {
  _enableMockSupabase(true);

  // Safe client IP extraction
  const req1 = new Request("http://localhost:3000/api", {
    headers: { "x-vercel-forwarded-for": "203.0.113.195, 10.0.0.1" },
  });
  assert.equal(extractClientIp(req1), "unknown", "Untrusted deployment must ignore supplied proxy headers");

  const req2 = new Request("http://localhost:3000/api", {
    headers: { "cf-connecting-ip": "198.51.100.42" },
  });
  assert.equal(extractClientIp(req2), "unknown", "Untrusted deployment must ignore supplied proxy headers");

  const testIp = "192.0.2.177";
  _resetPinRateLimit(testIp);
  await clearPinRateLimit(testIp);

  // Initial check: permitted
  assert.equal(await checkPinRateLimit(testIp), true);

  // Record 5 failed PIN attempts
  for (let i = 0; i < 5; i++) {
    await recordFailedPinAttempt(testIp);
  }

  // 6th attempt must be blocked by distributed rate limit
  assert.equal(await checkPinRateLimit(testIp), false, "6th attempt must be rate limited");

  // Successful auth clears rate limit
  await clearPinRateLimit(testIp);
  assert.equal(await checkPinRateLimit(testIp), true, "Successful authentication clears rate limit");

  _enableMockSupabase(false);
});

test("Task 5: Quiz & Scoreboard Privacy & Storage Recovery", async () => {
  const quizId = generateQuizId();
  const mockQuiz: QuizData = {
    id: quizId,
    slug: generateQuizSlug("Privacy Check"),
    creatorName: "Sana",
    gender: "female",
    country: "PK",
    theme: "dont_block_me",
    pinHash: hashPin("1122"),
    creatorToken: generateCreatorToken(),
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

  await saveQuiz(mockQuiz);

  // Storage failure simulation
  _setStorageWriteFailureSimulation(true);
  assert.equal(await saveQuiz(mockQuiz), false, "saveQuiz must return false on storage write failure");
  _setStorageWriteFailureSimulation(false);

  // Public data must never leak correctOptionId or PIN hash
  const pub = await getQuizPublicData(quizId);
  assert.ok(pub);
  assert.equal((pub as unknown as Record<string, unknown>).pinHash, undefined);
  assert.equal((pub.questions[0] as unknown as Record<string, unknown>).correctOptionId, undefined);

  await deleteQuiz(quizId);
});
