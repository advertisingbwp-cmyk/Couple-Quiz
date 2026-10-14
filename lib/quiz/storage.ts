import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { QuizData, PlayerAttempt, ScoreboardEntry, ScoreboardDetailEntry, QuizPublicData } from "./types";
import { executeRedisCommand, isRedisConfigured, isProductionServerlessEnvironment } from "./redis";
import { DELETE_QUIZ_SCRIPT, RECORD_ATTEMPT_SCRIPT } from "./redisScripts";

interface StorageSchema { quizzes: Record<string, QuizData>; attempts: Record<string, PlayerAttempt[]> }
export class StorageUnavailableError extends Error {
  constructor() { super("Quiz storage unavailable"); this.name = "StorageUnavailableError"; }
}
let forceFailWrite = false;
export function _setStorageWriteFailureSimulation(fail: boolean): void {
  if (process.env.NODE_ENV !== "test" || isProductionServerlessEnvironment()) throw new Error("Test mode required");
  forceFailWrite = fail;
}

/** Each instance has its own local cache. Configured Redis never uses that cache.
 * Local files are for single-process development only; writes publish cache state
 * only after the atomic file replacement succeeds.
 */
export function createQuizStorage(filePath = path.join(process.cwd(), "data", "quizzes-store.json")) {
  let cache: StorageSchema | null = null;
  function local(): StorageSchema {
    if (isProductionServerlessEnvironment()) throw new StorageUnavailableError();
    if (cache) return cache;
    try {
      cache = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : { quizzes: {}, attempts: {} };
      if (!cache?.quizzes || !cache.attempts) throw new Error("Corrupt local store");
      return cache;
    } catch { throw new StorageUnavailableError(); }
  }
  function persist(next: StorageSchema): void {
    if (forceFailWrite) throw new StorageUnavailableError();
    const temporary = filePath + "." + crypto.randomUUID() + ".tmp";
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(temporary, JSON.stringify(next), "utf8");
      fs.renameSync(temporary, filePath);
      cache = next;
    } catch { throw new StorageUnavailableError(); }
    finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  }
  async function saveQuiz(quiz: QuizData): Promise<boolean> {
    if (forceFailWrite) return false;
    if (isRedisConfigured()) {
      const res = await executeRedisCommand(["SET", `quiz:${quiz.id}`, JSON.stringify(quiz)]);
      return res.ok && res.result === "OK";
    }
    try {
      const next = structuredClone(local());
      next.quizzes[quiz.id] = structuredClone(quiz);
      next.attempts[quiz.id] ??= [];
      persist(next); return true;
    } catch { return false; }
  }
  async function getQuizById(id: string): Promise<QuizData | null> {
    if (isRedisConfigured()) {
      const res = await executeRedisCommand<string>(["GET", `quiz:${id}`]);
      if (!res.ok) throw new StorageUnavailableError();
      if (res.result === null) return null;
      try {
        const quiz = JSON.parse(res.result);
        if (!quiz || quiz.id !== id || !Array.isArray(quiz.questions)) throw new Error("Corrupt quiz");
        return quiz;
      } catch { throw new StorageUnavailableError(); }
    }
    return structuredClone(local().quizzes[id] ?? null);
  }
  async function getQuizPublicData(id: string): Promise<QuizPublicData | null> {
    const quiz = await getQuizById(id);
    if (!quiz) return null;
    return {
      id: quiz.id, slug: quiz.slug, creatorName: quiz.creatorName, gender: quiz.gender,
      country: quiz.country, theme: quiz.theme, createdAt: quiz.createdAt, totalQuestions: quiz.questions.length,
      questions: quiz.questions.map(({ questionId, question, emoji, options }) => ({ questionId, question, emoji, options })),
    };
  }
  async function recordAttempt(attempt: PlayerAttempt): Promise<boolean> {
    if (forceFailWrite) return false;
    if (isRedisConfigured()) {
      // Parent existence and HSET must be indivisible with deletion of the quiz.
      const res = await executeRedisCommand(["EVAL", RECORD_ATTEMPT_SCRIPT, 2,
        `quiz:${attempt.quizId}`, `quiz_attempts:${attempt.quizId}`, attempt.id, JSON.stringify(attempt)]);
      return res.ok && (res.result === 0 || res.result === 1);
    }
    try {
      const next = structuredClone(local());
      if (!next.quizzes[attempt.quizId]) return false;
      next.attempts[attempt.quizId] = [structuredClone(attempt), ...(next.attempts[attempt.quizId] || []).filter(a => a.id !== attempt.id)];
      persist(next); return true;
    } catch { return false; }
  }
  async function fetchAttempts(id: string): Promise<PlayerAttempt[]> {
    if (isRedisConfigured()) {
      const res = await executeRedisCommand<string[]>(["HVALS", `quiz_attempts:${id}`]);
      if (!res.ok || !Array.isArray(res.result)) throw new StorageUnavailableError();
      try {
        return res.result.map(item => {
          const attempt = JSON.parse(item);
          if (!attempt?.id || attempt.quizId !== id) throw new Error("Corrupt attempt");
          return attempt;
        });
      } catch { throw new StorageUnavailableError(); }
    }
    return structuredClone(local().attempts[id] || []);
  }
  const sort = (attempts: PlayerAttempt[]) => attempts.sort((a, b) => b.score - a.score || a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  const publicEntry = (att: PlayerAttempt): ScoreboardEntry => {
    const ratio = att.totalQuestions > 0 ? att.score / att.totalQuestions : 0;
    return {
      id: att.id, playerName: att.playerName, score: att.score, totalQuestions: att.totalQuestions,
      createdAt: att.createdAt, statusBadge: ratio >= 0.8 ? "bestie" : ratio < 0.5 ? "fake" : "friend",
    };
  };
  async function getScoreboard(id: string): Promise<ScoreboardEntry[]> {
    return sort(await fetchAttempts(id)).map(publicEntry);
  }
  async function getScoreboardDetails(id: string): Promise<ScoreboardDetailEntry[]> {
    const quiz = await getQuizById(id);
    if (!quiz) return [];
    return sort(await fetchAttempts(id)).map(att => ({
      ...publicEntry(att),
      answers: att.answers.map(ans => {
        const q = quiz.questions.find(question => question.questionId === ans.questionId);
        return { questionId: ans.questionId, question: q?.question || "Question",
          theirAnswer: q?.options.find(option => option.id === ans.selectedOptionId)?.text || "Unknown",
          correctAnswer: q?.options.find(option => option.id === q.correctOptionId)?.text || "Unknown", isCorrect: ans.isCorrect };
      }),
    }));
  }
  // False means absent; errors mean storage unavailable. Never conflate the two.
  async function deleteAttempt(id: string, attemptId: string): Promise<boolean> {
    if (forceFailWrite) throw new StorageUnavailableError();
    if (isRedisConfigured()) {
      const res = await executeRedisCommand(["HDEL", `quiz_attempts:${id}`, attemptId]);
      if (!res.ok || (res.result !== 0 && res.result !== 1)) throw new StorageUnavailableError();
      return res.result === 1;
    }
    const next = structuredClone(local());
    if (!next.attempts[id]?.some(a => a.id === attemptId)) return false;
    next.attempts[id] = next.attempts[id].filter(a => a.id !== attemptId);
    persist(next); return true;
  }
  async function deleteQuiz(id: string): Promise<boolean> {
    if (forceFailWrite) throw new StorageUnavailableError();
    if (isRedisConfigured()) {
      const res = await executeRedisCommand(["EVAL", DELETE_QUIZ_SCRIPT, 2, `quiz:${id}`, `quiz_attempts:${id}`]);
      if (!res.ok || (res.result !== 0 && res.result !== 1)) throw new StorageUnavailableError();
      return res.result === 1;
    }
    const next = structuredClone(local());
    if (!next.quizzes[id]) return false;
    delete next.quizzes[id]; delete next.attempts[id];
    persist(next); return true;
  }
  return { saveQuiz, getQuizById, getQuizPublicData, recordAttempt, getScoreboard, getScoreboardDetails, deleteAttempt, deleteQuiz };
}
export const { saveQuiz, getQuizById, getQuizPublicData, recordAttempt, getScoreboard, getScoreboardDetails, deleteAttempt, deleteQuiz } = createQuizStorage();
