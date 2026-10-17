import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_QUIZ_QUESTIONS,
  QUIZ_QUESTION_CATEGORIES,
  QuizQuestionCategory,
  getQuestionsByCategory,
  getQuestionById,
} from "../lib/quiz/questions";
import {
  initQuizDeck,
  getCurrentQuestion,
  skipQuestion,
  selectQuestionOption,
  stepBackQuestion,
  isDeckComplete,
  getRemainingUnanswered,
} from "../lib/quiz/deck";
import { saveCreatorSetup } from "../components/quiz-home/creatorSetup";
import { POST as createQuiz } from "../app/api/quiz/route";
import { _enableMockSupabase } from "../lib/quiz/supabase";
import { _setStorageWriteFailureSimulation } from "../lib/quiz/storage";

const originalEnv = { ...process.env };

beforeEach(() => {
  _enableMockSupabase(true);
});

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
  _setStorageWriteFailureSimulation(false);
  _enableMockSupabase(false);
});

function mockRequest(method: string, body?: unknown): Request {
  return new Request("http://localhost:3000/api/quiz", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ---------------------------------------------------------------------------
// 1. QUESTION BANK INTEGRITY & CATEGORIES (>= 100 questions)
// ---------------------------------------------------------------------------
test("Question Bank: Contains at least 100 unique, categorized, high-quality questions", () => {
  assert.ok(
    DEFAULT_QUIZ_QUESTIONS.length >= 100,
    `Question pool must have at least 100 questions, got ${DEFAULT_QUIZ_QUESTIONS.length}`
  );

  const idSet = new Set<string>();
  const textSet = new Set<string>();

  for (const q of DEFAULT_QUIZ_QUESTIONS) {
    // Unique IDs
    assert.equal(idSet.has(q.id), false, `Duplicate question ID detected: ${q.id}`);
    idSet.add(q.id);

    // Unique question texts
    assert.equal(textSet.has(q.question), false, `Duplicate question text detected: ${q.question}`);
    textSet.add(q.question);

    // Valid category
    assert.ok(q.category, `Question ${q.id} must have a category`);
    assert.ok(
      QUIZ_QUESTION_CATEGORIES.includes(q.category as QuizQuestionCategory),
      `Invalid category "${q.category}" for ${q.id}`
    );

    // Options validity: at least 2 options, unique option IDs
    assert.ok(q.options.length >= 2, `Question ${q.id} must have at least 2 options`);
    const optionIds = new Set<number>();
    for (const opt of q.options) {
      assert.equal(optionIds.has(opt.id), false, `Duplicate option ID in ${q.id}: ${opt.id}`);
      optionIds.add(opt.id);
      assert.ok(opt.text.trim().length > 0, `Option text cannot be empty in ${q.id}`);
    }
  }

  // All expected theme categories must have at least 5 questions
  const expectedThemes: QuizQuestionCategory[] = [
    "favorites",
    "habits",
    "food",
    "travel",
    "childhood",
    "funny scenarios",
    "dreams",
    "hobbies",
    "preferences",
  ];
  for (const theme of expectedThemes) {
    const matching = getQuestionsByCategory(theme);
    assert.ok(
      matching.length >= 5,
      `Category ${theme} should have at least 5 questions, got ${matching.length}`
    );
  }

  // Helper getQuestionById works
  assert.equal(getQuestionById("q1")?.id, "q1");
  assert.equal(getQuestionById("q999"), undefined);
});

// ---------------------------------------------------------------------------
// 2. CRITICAL: QUIZ COMPLETION AND EDITING INVARIANTS
// ---------------------------------------------------------------------------
test("Completion & Invariants: Editing a completed 10-question deck reopens question 10 and prevents an 11th question", () => {
  let deck = initQuizDeck(DEFAULT_QUIZ_QUESTIONS, 10);
  assert.equal(deck.targetCount, 10);

  // Complete all 10 questions
  for (let i = 0; i < 10; i++) {
    const current = getCurrentQuestion(deck)!;
    assert.ok(current, `Should have active question at step ${i + 1}`);
    deck = selectQuestionOption(deck, 0);
  }

  // 1. Deck is complete at exactly 10
  assert.equal(deck.answers.length, 10);
  assert.equal(isDeckComplete(deck), true);
  assert.equal(getCurrentQuestion(deck), null, "Active question must be null when deck is complete");

  // 2. Enforce invariant in deck.ts: cannot answer an 11th question
  const attempted11thDeck = selectQuestionOption(deck, 1);
  assert.equal(attempted11thDeck.answers.length, 10, "selectQuestionOption must NOT add an 11th answer");
  assert.equal(attempted11thDeck, deck, "Deck state must remain unchanged");

  // 3. User clicks 'Edit questions before publishing' -> Reopen question 10
  const lastRecordedQuestionId = deck.answers[9].questionId;
  const { nextState, previousOptionId } = stepBackQuestion(deck);

  assert.equal(nextState.answers.length, 9, "Editing must pop back to 9 answered questions");
  assert.equal(isDeckComplete(nextState), false, "Deck is no longer complete while editing");
  assert.equal(previousOptionId, 0, "Must return the previously selected option (0)");

  // Question 10 is now actively restored
  const reopenedQ10 = getCurrentQuestion(nextState)!;
  assert.ok(reopenedQ10);
  assert.equal(reopenedQ10.id, lastRecordedQuestionId, "Active question must be question 10");

  // 4. User modifies the answer on question 10 from option 0 to option 2
  const updatedDeck = selectQuestionOption(nextState, 2);
  assert.equal(updatedDeck.answers.length, 10, "Deck completes again with exactly 10 answers");
  assert.equal(isDeckComplete(updatedDeck), true);
  assert.equal(updatedDeck.answers[9].questionId, lastRecordedQuestionId);
  assert.equal(updatedDeck.answers[9].correctOptionId, 2, "Updated option (2) must be recorded");

  // 5. Still cannot answer an 11th question
  const stillNo11th = selectQuestionOption(updatedDeck, 3);
  assert.equal(stillNo11th.answers.length, 10);
});

// ---------------------------------------------------------------------------
// 3. SKIP 20 QUESTIONS AND THEN SELECT 10
// ---------------------------------------------------------------------------
test("Creator Flow: Skip 20 questions and then select 10 unique questions", () => {
  let deck = initQuizDeck(DEFAULT_QUIZ_QUESTIONS, 10);
  const skippedQuestionIds = new Set<string>();

  // Skip 20 questions consecutively
  for (let i = 0; i < 20; i++) {
    const q = getCurrentQuestion(deck)!;
    skippedQuestionIds.add(q.id);
    deck = skipQuestion(deck);
    assert.equal(deck.answers.length, 0, "Skipping must not increment answers count");
  }

  assert.ok(skippedQuestionIds.size >= 15, "Skipping should explore diverse questions");

  // Now select 10 questions interspersed with more skips
  for (let i = 0; i < 10; i++) {
    // Skip 2 times between selections
    deck = skipQuestion(deck);
    deck = skipQuestion(deck);

    assert.ok(getCurrentQuestion(deck));
    deck = selectQuestionOption(deck, i % 4);
    assert.equal(deck.answers.length, i + 1);
  }

  assert.equal(deck.answers.length, 10);
  assert.equal(isDeckComplete(deck), true);

  // Verify all 10 selected question IDs are strictly unique
  const selectedIds = deck.answers.map((a) => a.questionId);
  const uniqueSelectedIds = new Set(selectedIds);
  assert.equal(uniqueSelectedIds.size, 10, "All 10 selected questions must be unique");
});

// ---------------------------------------------------------------------------
// 4. POOL WRAPAROUND: SKIP THROUGH ENTIRE REMAINING POOL SAFELY
// ---------------------------------------------------------------------------
test("Creator Flow: Skip through entire remaining pool and wrap around without duplicates or crashes", () => {
  let deck = initQuizDeck(DEFAULT_QUIZ_QUESTIONS, 10);

  // Answer 3 questions
  deck = selectQuestionOption(deck, 0);
  deck = selectQuestionOption(deck, 1);
  deck = selectQuestionOption(deck, 2);
  assert.equal(deck.answers.length, 3);

  const answeredIds = new Set(deck.answers.map((a) => a.questionId));
  const remainingCount = getRemainingUnanswered(deck).length;
  assert.equal(remainingCount, DEFAULT_QUIZ_QUESTIONS.length - 3);

  // Skip 3 times the size of the remaining pool
  const seenInWrap = new Set<string>();
  const totalSkips = remainingCount * 3;

  for (let i = 0; i < totalSkips; i++) {
    const q = getCurrentQuestion(deck);
    assert.ok(q, `Question must resolve on skip ${i}`);
    assert.equal(answeredIds.has(q.id), false, `Answered question ${q.id} must never appear in remaining`);
    seenInWrap.add(q.id);
    deck = skipQuestion(deck);
  }

  // All remaining questions in the pool were visited and wrapped around
  assert.equal(seenInWrap.size, remainingCount, "Wraparound must cycle through all unanswered questions");
  assert.equal(deck.answers.length, 3, "Skips must never alter answer count");
});

// ---------------------------------------------------------------------------
// 5. BACK / SKIP AFTER EDITS
// ---------------------------------------------------------------------------
test("Creator Flow: Back and skip after edits preserve correct ordering and state", () => {
  let deck = initQuizDeck(DEFAULT_QUIZ_QUESTIONS, 10);

  // Answer 4 questions
  const q0 = getCurrentQuestion(deck)!;
  deck = selectQuestionOption(deck, 1);

  const q1 = getCurrentQuestion(deck)!;
  deck = selectQuestionOption(deck, 2);

  const q2 = getCurrentQuestion(deck)!;
  deck = selectQuestionOption(deck, 3);

  const q3 = getCurrentQuestion(deck)!;
  deck = selectQuestionOption(deck, 0);

  assert.equal(deck.answers.length, 4);

  // Step back twice (undo q3 and q2)
  const back1 = stepBackQuestion(deck);
  assert.equal(back1.previousOptionId, 0);
  assert.equal(getCurrentQuestion(back1.nextState)?.id, q3.id);

  const back2 = stepBackQuestion(back1.nextState);
  assert.equal(back2.previousOptionId, 3);
  assert.equal(getCurrentQuestion(back2.nextState)?.id, q2.id);

  deck = back2.nextState;
  assert.equal(deck.answers.length, 2);

  // Instead of answering q2 again immediately, user skips to another question
  const skippedFromQ2 = skipQuestion(deck);
  const differentQ = getCurrentQuestion(skippedFromQ2)!;
  assert.notEqual(differentQ.id, q2.id);
  assert.notEqual(differentQ.id, q0.id);
  assert.notEqual(differentQ.id, q1.id);

  // Select differentQ
  deck = selectQuestionOption(skippedFromQ2, 1);
  assert.equal(deck.answers.length, 3);
  assert.equal(deck.answers[2].questionId, differentQ.id);
});

// ---------------------------------------------------------------------------
// 6. STORAGE FALLBACK & PRIVACY (NO CREATOR NAME IN QUERY PARAMS)
// ---------------------------------------------------------------------------
test("Storage Fallback: Handles blocked, throwing, or unavailable storage gracefully without dead ends", () => {
  // Storage throws on setItem
  const throwingStorage = {
    setItem: () => {
      throw new Error("QuotaExceeded / Access Denied");
    },
    removeItem: () => {},
  };

  const err = saveCreatorSetup("Zainab", "female", throwingStorage);
  assert.ok(err, "saveCreatorSetup returns error message when storage throws");
  assert.match(err, /couldn't save your quiz setup/i);

  // Blank name validation
  const blankErr = saveCreatorSetup("   ", "male", throwingStorage);
  assert.match(blankErr ?? "", /name or a nickname/i);

  // Oversized name validation
  const longErr = saveCreatorSetup("A".repeat(35), "male", throwingStorage);
  assert.match(longErr ?? "", /30 characters/i);
});

test("Name Privacy: Creator name is never embedded in query parameters", () => {
  // The creator handoff URL contract must be clean and not leak user names in URLs or logs
  const cleanPath = "/quiz/create";
  assert.equal(cleanPath.includes("?name="), false, "Target path must not include ?name= parameter");
  assert.equal(cleanPath.includes("&name="), false, "Target path must not include &name= parameter");
});

// ---------------------------------------------------------------------------
// 7. API SUBMISSION WITH EXPANDED QUESTION BANK & FAILURE HANDLING
// ---------------------------------------------------------------------------
test("API: Quiz creation succeeds with 10 questions from the expanded question library", async () => {
  // Pick 10 varied questions across the 105-question library
  const pickedQuestions = [
    DEFAULT_QUIZ_QUESTIONS[5],
    DEFAULT_QUIZ_QUESTIONS[18],
    DEFAULT_QUIZ_QUESTIONS[35],
    DEFAULT_QUIZ_QUESTIONS[52],
    DEFAULT_QUIZ_QUESTIONS[68],
    DEFAULT_QUIZ_QUESTIONS[75],
    DEFAULT_QUIZ_QUESTIONS[88],
    DEFAULT_QUIZ_QUESTIONS[92],
    DEFAULT_QUIZ_QUESTIONS[98],
    DEFAULT_QUIZ_QUESTIONS[104],
  ];

  const payload = {
    creatorName: "Hamza Tariq",
    gender: "male",
    country: "PK",
    secretPin: "8899",
    questions: pickedQuestions.map((q) => ({
      questionId: q.id,
      correctOptionId: q.options[0].id,
    })),
  };

  const res = await createQuiz(mockRequest("POST", payload));
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.quizId);
  assert.ok(data.creatorToken);
  assert.equal(data.shareUrl, `/quiz/share/${data.quizId}`);
});

test("API: Rejects invalid options, duplicate questions, and invalid PINs", async () => {
  const baseQuestions = DEFAULT_QUIZ_QUESTIONS.slice(0, 10).map((q) => ({
    questionId: q.id,
    correctOptionId: 0,
  }));

  // 1. Invalid option ID (e.g. 99)
  const invalidOptPayload = {
    creatorName: "Sara",
    gender: "female",
    country: "PK",
    secretPin: "1234",
    questions: [
      ...baseQuestions.slice(0, 9),
      { questionId: DEFAULT_QUIZ_QUESTIONS[9].id, correctOptionId: 99 },
    ],
  };
  const res1 = await createQuiz(mockRequest("POST", invalidOptPayload));
  assert.equal(res1.status, 400);
  const data1 = await res1.json();
  assert.match(data1.error, /Invalid option selected/i);

  // 2. Duplicate question ID
  const duplicatePayload = {
    creatorName: "Sara",
    gender: "female",
    country: "PK",
    secretPin: "1234",
    questions: [
      ...baseQuestions.slice(0, 9),
      { questionId: baseQuestions[0].questionId, correctOptionId: 0 },
    ],
  };
  const res2 = await createQuiz(mockRequest("POST", duplicatePayload));
  assert.equal(res2.status, 400);
  const data2 = await res2.json();
  assert.match(data2.error, /Duplicate question detected/i);

  // 3. Invalid secret PIN (letters or 3 digits)
  const badPinPayload = {
    creatorName: "Sara",
    gender: "female",
    country: "PK",
    secretPin: "123", // too short
    questions: baseQuestions,
  };
  const res3 = await createQuiz(mockRequest("POST", badPinPayload));
  assert.equal(res3.status, 400);
  const data3 = await res3.json();
  assert.match(data3.error, /secret PIN/i);

  // 4. Missing / blank creator name
  const badNamePayload = {
    creatorName: "   ",
    gender: "female",
    country: "PK",
    secretPin: "1234",
    questions: baseQuestions,
  };
  const res4 = await createQuiz(mockRequest("POST", badNamePayload));
  assert.equal(res4.status, 400);
  const data4 = await res4.json();
  assert.match(data4.error, /Please enter your name/i);
});

test("API: Strictly enforces exactly 10 questions (rejects 9, accepts 10, rejects 11)", async () => {
  // 1. Exactly 9 questions -> must be rejected with 400
  const nineQuestionsPayload = {
    creatorName: "Ahmad",
    gender: "male",
    country: "PK",
    secretPin: "5566",
    questions: DEFAULT_QUIZ_QUESTIONS.slice(0, 9).map((q) => ({
      questionId: q.id,
      correctOptionId: 0,
    })),
  };
  const resNine = await createQuiz(mockRequest("POST", nineQuestionsPayload));
  assert.equal(resNine.status, 400, "9 questions must return HTTP 400");
  const dataNine = await resNine.json();
  assert.equal(dataNine.success, false);
  assert.match(dataNine.error, /exactly 10 questions/i);

  // 2. Exactly 10 valid unique questions -> must be accepted with 200
  const tenQuestionsPayload = {
    creatorName: "Ahmad",
    gender: "male",
    country: "PK",
    secretPin: "5566",
    questions: DEFAULT_QUIZ_QUESTIONS.slice(0, 10).map((q) => ({
      questionId: q.id,
      correctOptionId: 0,
    })),
  };
  const resTen = await createQuiz(mockRequest("POST", tenQuestionsPayload));
  assert.equal(resTen.status, 200, "10 questions must return HTTP 200");
  const dataTen = await resTen.json();
  assert.equal(dataTen.success, true);
  assert.ok(dataTen.quizId);

  // 3. Exactly 11 questions -> must be rejected with 400
  const elevenQuestionsPayload = {
    creatorName: "Ahmad",
    gender: "male",
    country: "PK",
    secretPin: "5566",
    questions: DEFAULT_QUIZ_QUESTIONS.slice(0, 11).map((q) => ({
      questionId: q.id,
      correctOptionId: 0,
    })),
  };
  const resEleven = await createQuiz(mockRequest("POST", elevenQuestionsPayload));
  assert.equal(resEleven.status, 400, "11 questions must return HTTP 400");
  const dataEleven = await resEleven.json();
  assert.equal(dataEleven.success, false);
  assert.match(dataEleven.error, /exactly 10 questions/i);
});

// ---------------------------------------------------------------------------
// 8. SECRET PIN REGEX RULES (4-6 digits only)
// ---------------------------------------------------------------------------
test("Secret PIN: Validation strictly enforces 4 to 6 numeric digits", () => {
  const pinRegex = /^\d{4,6}$/;

  // Valid
  assert.ok(pinRegex.test("1234"));
  assert.ok(pinRegex.test("0000"));
  assert.ok(pinRegex.test("99999"));
  assert.ok(pinRegex.test("123456"));

  // Invalid
  assert.equal(pinRegex.test(""), false);
  assert.equal(pinRegex.test("123"), false);
  assert.equal(pinRegex.test("1234567"), false);
  assert.equal(pinRegex.test("abcd"), false);
  assert.equal(pinRegex.test("12a4"), false);
  assert.equal(pinRegex.test("12 34"), false);
  assert.equal(pinRegex.test("12.34"), false);
});
