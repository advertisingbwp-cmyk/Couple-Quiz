import { QuizQuestion } from "./types";
import { DEFAULT_QUIZ_QUESTIONS } from "./questions";

export interface DeckAnswer {
  questionId: string;
  question: string;
  emoji?: string;
  options: Array<{ id: number; text: string }>;
  correctOptionId: number;
}

export interface DeckState {
  targetCount: number;
  availableQuestions: QuizQuestion[];
  answers: DeckAnswer[];
  currentPoolIndex: number;
}

/**
 * Initializes a new quiz creation deck.
 * Gracefully sets target count to not exceed the pool size.
 */
export function initQuizDeck(
  pool: QuizQuestion[] = DEFAULT_QUIZ_QUESTIONS,
  targetCount = 10
): DeckState {
  const effectiveTarget = Math.max(1, Math.min(targetCount, pool.length));
  return {
    targetCount: effectiveTarget,
    availableQuestions: [...pool],
    answers: [],
    currentPoolIndex: 0,
  };
}

/**
 * Returns all questions in the pool that have not yet been answered.
 */
export function getRemainingUnanswered(state: DeckState): QuizQuestion[] {
  const answeredIds = new Set(state.answers.map((a) => a.questionId));
  return state.availableQuestions.filter((q) => !answeredIds.has(q.id));
}

/**
 * Returns the currently active question to display.
 * Returns null if all questions have been answered.
 */
export function getCurrentQuestion(state: DeckState): QuizQuestion | null {
  if (state.answers.length >= state.targetCount) return null;
  const remaining = getRemainingUnanswered(state);
  if (remaining.length === 0) return null;
  const safeIndex = ((state.currentPoolIndex % remaining.length) + remaining.length) % remaining.length;
  return remaining[safeIndex];
}

/**
 * Skips the current question and advances to the next available question in the pool.
 * Wraps around safely without infinite loops or duplicate displays.
 */
export function skipQuestion(state: DeckState): DeckState {
  if (state.answers.length >= state.targetCount) return state;
  const remaining = getRemainingUnanswered(state);
  if (remaining.length <= 1) {
    return { ...state, currentPoolIndex: 0 };
  }
  return {
    ...state,
    currentPoolIndex: (state.currentPoolIndex + 1) % remaining.length,
  };
}

/**
 * Records the creator's answer for the current question and advances.
 * Strictly prevents recording duplicate question IDs or exceeding targetCount.
 */
export function selectQuestionOption(
  state: DeckState,
  optionId: number
): DeckState {
  if (state.answers.length >= state.targetCount) {
    return state;
  }

  const current = getCurrentQuestion(state);
  if (!current) return state;

  if (state.answers.some((a) => a.questionId === current.id)) {
    return state;
  }

  if (!current.options.some((opt) => opt.id === optionId)) {
    return state;
  }

  const newAnswers: DeckAnswer[] = [
    ...state.answers,
    {
      questionId: current.id,
      question: current.question,
      emoji: current.emoji,
      options: current.options,
      correctOptionId: optionId,
    },
  ];

  const answeredIds = new Set(newAnswers.map((a) => a.questionId));
  const remaining = state.availableQuestions.filter((q) => !answeredIds.has(q.id));

  return {
    ...state,
    answers: newAnswers,
    currentPoolIndex: remaining.length > 0 ? state.currentPoolIndex % remaining.length : 0,
  };
}

/**
 * Checks whether the target number of questions has been completed or pool is exhausted.
 */
export function isDeckComplete(state: DeckState): boolean {
  return state.answers.length >= state.targetCount || getRemainingUnanswered(state).length === 0;
}

/**
 * Steps back to the previous answered question, removing it from answers
 * and placing it back as the currently active question with its previously
 * chosen option ID. Returns { nextState, previousOptionId }.
 */
export function stepBackQuestion(state: DeckState): {
  nextState: DeckState;
  previousOptionId: number | null;
} {
  if (state.answers.length === 0) {
    return { nextState: state, previousOptionId: null };
  }

  const lastAnswer = state.answers[state.answers.length - 1];
  const nextAnswers = state.answers.slice(0, -1);
  const remainingIds = new Set(nextAnswers.map((a) => a.questionId));
  const remaining = state.availableQuestions.filter((q) => !remainingIds.has(q.id));
  const restoredIndex = remaining.findIndex((q) => q.id === lastAnswer.questionId);

  return {
    nextState: {
      ...state,
      answers: nextAnswers,
      currentPoolIndex: restoredIndex >= 0 ? restoredIndex : 0,
    },
    previousOptionId: lastAnswer.correctOptionId,
  };
}

