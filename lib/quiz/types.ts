export type Gender = "male" | "female";

export interface QuizQuestionOption {
  id: number;
  text: string;
  emoji?: string;
  imageUrl?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  emoji?: string;
  category?: string;
  options: QuizQuestionOption[];
}

export interface QuizData {
  id: string;
  slug: string;
  creatorName: string;
  gender: Gender;
  country: string;
  theme: string;
  pinHash: string;
  creatorToken: string;
  createdAt: number;
  questions: Array<{
    questionId: string;
    question: string;
    emoji?: string;
    options: QuizQuestionOption[];
    correctOptionId: number;
  }>;
}

export interface PlayerAttempt {
  id: string;
  quizId: string;
  playerName: string;
  score: number;
  totalQuestions: number;
  answers: Array<{
    questionId: string;
    selectedOptionId: number;
    isCorrect: boolean;
  }>;
  createdAt: number;
}

export interface QuizPublicData {
  id: string;
  slug: string;
  creatorName: string;
  gender: Gender;
  country: string;
  theme: string;
  createdAt: number;
  totalQuestions: number;
  questions: Array<{
    questionId: string;
    question: string;
    emoji?: string;
    options: QuizQuestionOption[];
  }>;
}

export interface ScoreboardEntry {
  id: string;
  playerName: string;
  score: number;
  totalQuestions: number;
  createdAt: number;
  statusBadge: "bestie" | "friend" | "fake";
}

export interface ScoreboardDetailEntry extends ScoreboardEntry {
  answers: Array<{
    questionId: string;
    question: string;
    theirAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}
