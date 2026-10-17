import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_QUIZ_QUESTIONS,
  CURATED_QUIZ_QUESTIONS,
  CURATED_UNIVERSAL_QUESTIONS,
  CURATED_HIM_QUESTIONS,
  CURATED_HER_QUESTIONS,
  getCuratedQuestionsByTheme,
  getQuestionById,
  QUIZ_QUESTION_CATEGORIES,
} from "../lib/quiz/questions";
import {
  initQuizDeck,
  selectQuestionOption,
  skipQuestion,
  isDeckComplete,
  getCurrentQuestion,
} from "../lib/quiz/deck";
import {
  getVisualOptionGridClasses,
  getGlassOptionGridClasses,
} from "../components/quiz/VisualOptionCard";
import { POST as createQuiz } from "../app/api/quiz/route";
import { GET as getQuiz } from "../app/api/quiz/[id]/route";
import { POST as submitAttempt } from "../app/api/quiz/[id]/attempt/route";
import { GET as getScoreboardRoute, POST as getScoreboardDetailsRoute } from "../app/api/quiz/[id]/scoreboard/route";

test("Phase 10.3: Curated 30-question bank integrity and theme partitioning", () => {
  assert.equal(CURATED_QUIZ_QUESTIONS.length, 30, "Curated bank must contain exactly 30 questions");
  assert.equal(CURATED_UNIVERSAL_QUESTIONS.length, 10, "Universal theme must contain exactly 10 questions");
  assert.equal(CURATED_HIM_QUESTIONS.length, 10, "Him theme must contain exactly 10 questions");
  assert.equal(CURATED_HER_QUESTIONS.length, 10, "Her theme must contain exactly 10 questions");

  const categorySet = new Set<string>(QUIZ_QUESTION_CATEGORIES);
  const seenIds = new Set<string>();

  for (const q of CURATED_QUIZ_QUESTIONS) {
    assert.ok(q.id.startsWith("curated_"), `Question ID must start with curated_: ${q.id}`);
    assert.ok(!seenIds.has(q.id), `Duplicate curated question ID: ${q.id}`);
    seenIds.add(q.id);

    assert.ok(q.question && q.question.trim().length > 0, `Question ${q.id} text must not be empty`);
    assert.ok(categorySet.has(q.category || ""), `Question ${q.id} must have a valid category: ${q.category}`);
    assert.ok(q.options.length >= 2 && q.options.length <= 9, `Question ${q.id} options count out of bounds: ${q.options.length}`);

    // Verify 0-indexed sequential option IDs
    for (let i = 0; i < q.options.length; i++) {
      const opt = q.options[i];
      assert.equal(opt.id, i, `Question ${q.id} option ID must be sequential 0-indexed: expected ${i}, got ${opt.id}`);
      assert.ok(opt.text && opt.text.trim().length > 0, `Option ${opt.id} in ${q.id} has empty text`);
    }
  }
});

test("Phase 10.3: Legacy question bank preservation and cross-lookup compatibility", () => {
  // Legacy 105 questions must remain completely intact
  assert.equal(DEFAULT_QUIZ_QUESTIONS.length, 105, "Default legacy questions must retain all 105 entries");

  // Verify non-collision between curated and legacy questions
  const legacyIdSet = new Set(DEFAULT_QUIZ_QUESTIONS.map((q) => q.id));
  for (const q of CURATED_QUIZ_QUESTIONS) {
    assert.ok(!legacyIdSet.has(q.id), `Curated question ID ${q.id} collides with legacy question!`);
  }

  // Verify getQuestionById resolves both curated and legacy questions
  const curatedMatch = getQuestionById("curated_u01");
  assert.ok(curatedMatch, "getQuestionById must resolve curated_u01");
  assert.equal(curatedMatch?.category, "food");

  const legacyMatch = getQuestionById("q1");
  assert.ok(legacyMatch, "getQuestionById must resolve legacy q1");
  assert.equal(legacyMatch?.id, "q1");

  const legacyEndMatch = getQuestionById("q105");
  assert.ok(legacyEndMatch, "getQuestionById must resolve legacy q105");

  assert.equal(getQuestionById("nonexistent_id"), undefined);
});

test("Phase 10.3: Theme helper partition counts", () => {
  assert.equal(getCuratedQuestionsByTheme("universal").length, 10);
  assert.equal(getCuratedQuestionsByTheme("him").length, 10);
  assert.equal(getCuratedQuestionsByTheme("her").length, 10);
  assert.equal(getCuratedQuestionsByTheme("all").length, 30);
});

test("Phase 10.3: Every referenced photographic asset exists on disk in public/", () => {
  const publicDir = path.join(process.cwd(), "public");

  for (const q of CURATED_QUIZ_QUESTIONS) {
    for (const opt of q.options) {
      if (opt.imageUrl) {
        const fullPath = path.join(publicDir, opt.imageUrl);
        assert.ok(fs.existsSync(fullPath), `Referenced image asset does not exist on disk: ${opt.imageUrl} in ${q.id}`);
        const stat = fs.statSync(fullPath);
        assert.ok(stat.size > 100, `Image asset file is empty: ${opt.imageUrl}`);
      }
    }
  }
});

test("Phase 10.3: Curated questions image integration (12 photographic, 18 authentic text-first pending dedicated assets)", () => {
  const photoQuestions = CURATED_QUIZ_QUESTIONS.filter((q) =>
    q.options.every((opt) => opt.imageUrl && opt.imageUrl.endsWith(".webp"))
  );
  assert.equal(photoQuestions.length, 12, "Must have exactly 12 questions with all authentic real photographic options");

  const textOnlyQuestions = CURATED_QUIZ_QUESTIONS.filter((q) =>
    q.options.every((opt) => !opt.imageUrl)
  );
  assert.equal(textOnlyQuestions.length, 18, "Must have exactly 18 text-only authentic questions");
  assert.equal(photoQuestions.length + textOnlyQuestions.length, 30, "All 30 questions must be accounted for");
});

test("Phase 10.3: Exactly-10 invariant and creator deck state machine with curated questions", () => {
  let deck = initQuizDeck(CURATED_QUIZ_QUESTIONS, 10);
  assert.equal(deck.targetCount, 10);
  assert.equal(deck.answers.length, 0);

  // Skip the first question to test progression wrap
  const firstQ = getCurrentQuestion(deck)!;
  deck = skipQuestion(deck);
  const secondQ = getCurrentQuestion(deck)!;
  assert.notEqual(firstQ.id, secondQ.id, "skipQuestion must advance to a different question");

  // Answer 10 questions sequentially
  for (let step = 0; step < 10; step++) {
    assert.equal(isDeckComplete(deck), false, `Deck should not be complete at step ${step}`);
    const q = getCurrentQuestion(deck)!;
    assert.ok(q, `Should have a current question at step ${step}`);
    deck = selectQuestionOption(deck, q.options[0].id);
  }

  assert.equal(deck.answers.length, 10, "Deck must have exactly 10 recorded answers");
  assert.equal(isDeckComplete(deck), true, "Deck must be complete after exactly 10 answers");
  assert.equal(getCurrentQuestion(deck), null, "getCurrentQuestion must return null when complete");

  // Attempting to add an 11th answer must be rejected
  const overflowDeck = selectQuestionOption(deck, 0);
  assert.equal(overflowDeck.answers.length, 10, "Deck must reject answers exceeding targetCount");
});

test("Phase 10.3: Option grid class helpers maintain exact signatures and glass responsive layouts", () => {
  // Backward compatibility test for getVisualOptionGridClasses
  assert.ok(getVisualOptionGridClasses(2).includes("sm:grid-cols-2"));
  assert.ok(getVisualOptionGridClasses(4).includes("grid-cols-2"));
  assert.ok(getVisualOptionGridClasses(6).includes("grid-cols-2") && getVisualOptionGridClasses(6).includes("sm:grid-cols-3"));
  assert.ok(getVisualOptionGridClasses(9).includes("grid-cols-3"));

  // Photographic glass grid
  const photoGrid2 = getGlassOptionGridClasses(2, true);
  assert.ok(photoGrid2.includes("grid-cols-2"));

  const photoGrid4 = getGlassOptionGridClasses(4, true);
  assert.ok(photoGrid4.includes("grid-cols-2"));

  // Text-first glass grid
  const textGrid2 = getGlassOptionGridClasses(2, false);
  assert.ok(textGrid2.includes("grid-cols-1 sm:grid-cols-2"));

  const textGrid4 = getGlassOptionGridClasses(4, false);
  assert.ok(textGrid4.includes("grid-cols-1 sm:grid-cols-2"));
});

import { deleteQuiz } from "../lib/quiz/storage";

test("Phase 10.3: End-to-End API creation and attempt submission for a Curated Quiz", async () => {
  const chosenQuestions = CURATED_UNIVERSAL_QUESTIONS.map((q) => ({
    questionId: q.id,
    correctOptionId: q.options[0].id,
  }));

  assert.equal(chosenQuestions.length, 10);

  // 1. Create a quiz with 10 curated questions
  const createReq = new Request("http://localhost:3000/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creatorName: "Hamza Curated",
      gender: "male",
      secretPin: "8899",
      questions: chosenQuestions,
    }),
  });

  const createRes = await createQuiz(createReq);
  assert.equal(createRes.status, 200);
  const createData = await createRes.json();
  assert.ok(createData.success);
  assert.ok(createData.quizId);

  const quizId = createData.quizId;

  try {
    // 2. Fetch the public quiz
    const getReq = new Request(`http://localhost:3000/api/quiz/${quizId}`, { method: "GET" });
    const getRes = await getQuiz(getReq, { params: Promise.resolve({ id: quizId }) });
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.ok(getData.success);
    assert.equal(getData.quiz.totalQuestions, 10);
    assert.equal(getData.quiz.questions.length, 10);
    assert.equal(getData.quiz.questions[0].questionId, "curated_u01");

    // 3. Submit a player attempt
    const attemptAnswers = getData.quiz.questions.map((q: { questionId: string; options: Array<{ id: number }> }, index: number) => ({
      questionId: q.questionId,
      // Match 8 out of 10 answers
      selectedOptionId: index < 8 ? q.options[0].id : q.options[1].id,
    }));

    const attemptReq = new Request(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerName: "Amina Friend",
        answers: attemptAnswers,
        attemptId: `att_curated_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      }),
    });

    const attemptRes = await submitAttempt(attemptReq, { params: Promise.resolve({ id: quizId }) });
    assert.equal(attemptRes.status, 200);
    const attemptData = await attemptRes.json();
    assert.ok(attemptData.success);
    assert.equal(attemptData.score, 8);
    assert.equal(attemptData.totalQuestions, 10);
    assert.equal(attemptData.creatorName, "Hamza Curated");

    // 4. Public Scoreboard shows the result
    const boardReq = new Request(`http://localhost:3000/api/quiz/${quizId}/scoreboard`, { method: "GET" });
    const boardRes = await getScoreboardRoute(boardReq, { params: Promise.resolve({ id: quizId }) });
    assert.equal(boardRes.status, 200);
    const boardData = await boardRes.json();
    assert.ok(boardData.success);
    assert.equal(boardData.creatorName, "Hamza Curated");
    assert.equal(boardData.scoreboard.length, 1);
    assert.equal(boardData.scoreboard[0].playerName, "Amina Friend");
    assert.equal(boardData.scoreboard[0].score, 8);

    // 5. Creator Mode and Secret PIN Authentication works
    // Invalid PIN must be rejected
    const wrongPinReq = new Request(`http://localhost:3000/api/quiz/${quizId}/scoreboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: "0000" }),
    });
    const wrongPinRes = await getScoreboardDetailsRoute(wrongPinReq, { params: Promise.resolve({ id: quizId }) });
    assert.equal(wrongPinRes.status, 403);

    // Valid PIN must succeed and unlock creator answers breakdown
    const validPinReq = new Request(`http://localhost:3000/api/quiz/${quizId}/scoreboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: "8899" }),
    });
    const validPinRes = await getScoreboardDetailsRoute(validPinReq, { params: Promise.resolve({ id: quizId }) });
    assert.equal(validPinRes.status, 200);
    const validPinData = await validPinRes.json();
    assert.ok(validPinData.success);
    assert.ok(validPinData.creatorToken);
    assert.equal(validPinData.scoreboard.length, 1);
    assert.equal(validPinData.scoreboard[0].playerName, "Amina Friend");
    assert.equal(validPinData.scoreboard[0].score, 8);
  } finally {
    await deleteQuiz(quizId);
  }
});
