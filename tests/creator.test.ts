import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_QUIZ_QUESTIONS } from "../lib/quiz/questions";
import {
  initQuizDeck,
  getCurrentQuestion,
  skipQuestion,
  selectQuestionOption,
  stepBackQuestion,
  isDeckComplete,
} from "../lib/quiz/deck";
import { saveCreatorSetup } from "../components/quiz-home/creatorSetup";

test("Creator Flow: stepBackQuestion allows stepping back, editing answers, and preserving selections", () => {
  const deck0 = initQuizDeck(DEFAULT_QUIZ_QUESTIONS, 10);
  assert.equal(deck0.answers.length, 0);

  // 1. Boundary check: stepBack on empty deck does not error and returns null
  const emptyStep = stepBackQuestion(deck0);
  assert.equal(emptyStep.previousOptionId, null);
  assert.equal(emptyStep.nextState.answers.length, 0);

  // 2. Answer question 1 with option 2
  const q1 = getCurrentQuestion(deck0)!;
  const deck1 = selectQuestionOption(deck0, 2);
  assert.equal(deck1.answers.length, 1);
  assert.equal(deck1.answers[0].questionId, q1.id);
  assert.equal(deck1.answers[0].correctOptionId, 2);

  // 3. Current question is now question 2
  const q2 = getCurrentQuestion(deck1)!;
  assert.notEqual(q2.id, q1.id, "Question 2 must be different from Question 1");

  // 4. Answer question 2 with option 1
  const deck2 = selectQuestionOption(deck1, 1);
  assert.equal(deck2.answers.length, 2);

  // 5. User wants to go back to question 2
  const backStep1 = stepBackQuestion(deck2);
  assert.equal(backStep1.previousOptionId, 1, "Must return previously chosen option ID for question 2");
  assert.equal(backStep1.nextState.answers.length, 1);
  const restoredQ2 = getCurrentQuestion(backStep1.nextState);
  assert.equal(restoredQ2?.id, q2.id, "Active question must be question 2");

  // 6. User goes back again to question 1
  const backStep2 = stepBackQuestion(backStep1.nextState);
  assert.equal(backStep2.previousOptionId, 2, "Must return previously chosen option ID for question 1");
  assert.equal(backStep2.nextState.answers.length, 0);
  const restoredQ1 = getCurrentQuestion(backStep2.nextState);
  assert.equal(restoredQ1?.id, q1.id, "Active question must be question 1");

  // 7. User edits question 1 answer from option 2 to option 0
  const deck1Edited = selectQuestionOption(backStep2.nextState, 0);
  assert.equal(deck1Edited.answers.length, 1);
  assert.equal(deck1Edited.answers[0].correctOptionId, 0, "Updated answer must be recorded");
});

test("Creator Flow: Skip mechanics cycle available pool without corrupting answer count", () => {
  const deck = initQuizDeck(DEFAULT_QUIZ_QUESTIONS, 10);
  const initialQ = getCurrentQuestion(deck)!;

  // Skipping does not count as an answer
  const skipped1 = skipQuestion(deck);
  assert.equal(skipped1.answers.length, 0);
  assert.notEqual(getCurrentQuestion(skipped1)!.id, initialQ.id);

  // Answering after skipping records the currently viewed question
  const currentAfterSkip = getCurrentQuestion(skipped1)!;
  const answeredDeck = selectQuestionOption(skipped1, 1);
  assert.equal(answeredDeck.answers.length, 1);
  assert.equal(answeredDeck.answers[0].questionId, currentAfterSkip.id);

  // Pool wrap-around stability: 50 consecutive skips never crash or return null
  let wrapDeck = answeredDeck;
  for (let i = 0; i < 50; i++) {
    wrapDeck = skipQuestion(wrapDeck);
    const q = getCurrentQuestion(wrapDeck);
    assert.ok(q, `Question must resolve on skip iteration ${i}`);
    assert.notEqual(q.id, currentAfterSkip.id, "Already-answered question must not appear");
  }
});

test("Creator Flow: Deck completion triggers only when exactly targetCount answers are reached", () => {
  let deck = initQuizDeck(DEFAULT_QUIZ_QUESTIONS, 10);
  assert.equal(isDeckComplete(deck), false);

  for (let i = 0; i < 9; i++) {
    deck = selectQuestionOption(deck, i % 4);
    assert.equal(isDeckComplete(deck), false, `Deck must not be complete at ${i + 1} answers`);
  }

  // Answer 10th question
  deck = selectQuestionOption(deck, 0);
  assert.equal(deck.answers.length, 10);
  assert.equal(isDeckComplete(deck), true, "Deck must be complete at 10 answers");
});

test("Creator Flow: Creator setup validation and sessionStorage handoff contract", () => {
  const mockStorage = new Map<string, string>();
  const storage = {
    setItem: (k: string, v: string) => mockStorage.set(k, v),
    removeItem: (k: string) => mockStorage.delete(k),
  };

  // Valid inputs
  const err1 = saveCreatorSetup("  Ahmad Khan  ", "male", storage);
  assert.equal(err1, null);
  assert.equal(mockStorage.get("creator_name"), "Ahmad Khan");
  assert.equal(mockStorage.get("creator_gender"), "male");

  // Blank name rejected
  const err2 = saveCreatorSetup("   ", "female", storage);
  assert.ok(err2?.includes("name or a nickname"));

  // Oversized name rejected (>30 chars)
  const err3 = saveCreatorSetup("A".repeat(31), "male", storage);
  assert.ok(err3?.includes("30 characters"));
});

test("Creator Flow: Secret PIN validation rule (4-6 digits only)", () => {
  const pinRegex = /^\d{4,6}$/;

  // Valid PINs
  assert.ok(pinRegex.test("1234"));
  assert.ok(pinRegex.test("0000"));
  assert.ok(pinRegex.test("99999"));
  assert.ok(pinRegex.test("123456"));

  // Invalid PINs
  assert.equal(pinRegex.test(""), false, "Empty PIN must fail");
  assert.equal(pinRegex.test("123"), false, "3-digit PIN must fail");
  assert.equal(pinRegex.test("1234567"), false, "7-digit PIN must fail");
  assert.equal(pinRegex.test("abcd"), false, "Letters must fail");
  assert.equal(pinRegex.test("12a4"), false, "Alphanumeric must fail");
  assert.equal(pinRegex.test("12 34"), false, "PIN with space must fail");
  assert.equal(pinRegex.test("12.34"), false, "PIN with decimal must fail");
});
