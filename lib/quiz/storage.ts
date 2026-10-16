import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { QuizData, PlayerAttempt, ScoreboardEntry, ScoreboardDetailEntry, QuizPublicData, RecordAttemptOutcome } from "./types";
import {
  dbSaveQuiz,
  dbGetQuiz,
  dbGetQuizPublic,
  dbRecordAttemptAtomic,
  dbFetchAttempts,
  dbDeleteAttempt,
  dbDeleteQuiz,
  isSupabaseConfigured,
  isProductionServerlessEnvironment,
  StorageUnavailableError,
} from "./supabase";
import { computeAttemptFingerprint } from "./security";

export { StorageUnavailableError };

interface StorageSchema {
  quizzes: Record<string, QuizData>;
  attempts: Record<string, PlayerAttempt[]>;
}

let forceFailWrite = false;

export function _setStorageWriteFailureSimulation(fail: boolean): void {
  if (process.env.NODE_ENV !== "test" || isProductionServerlessEnvironment()) {
    throw new Error("Test mode required");
  }
  forceFailWrite = fail;
}

/**
 * Creates a QuizStorage instance.
 * When Supabase is configured, it operates authoritatively against PostgreSQL.
 * Otherwise, local files provide zero-config development support.
 */
export function createQuizStorage(filePath = path.join(process.cwd(), "data", "quizzes-store.json")) {
  let cache: StorageSchema | null = null;

  function local(): StorageSchema {
    if (isProductionServerlessEnvironment()) throw new StorageUnavailableError();
    if (cache) return cache;
    try {
      cache = fs.existsSync(filePath)
        ? JSON.parse(fs.readFileSync(filePath, "utf8"))
        : { quizzes: {}, attempts: {} };
      if (!cache?.quizzes || !cache.attempts) throw new Error("Corrupt local store");
      return cache;
    } catch {
      throw new StorageUnavailableError();
    }
  }

  function persist(next: StorageSchema): void {
    if (forceFailWrite) throw new StorageUnavailableError();
    const temporary = filePath + "." + crypto.randomUUID() + ".tmp";
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(temporary, JSON.stringify(next), "utf8");
      fs.renameSync(temporary, filePath);
      cache = next;
    } catch {
      throw new StorageUnavailableError();
    } finally {
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
  }

  async function saveQuiz(quiz: QuizData): Promise<boolean> {
    if (forceFailWrite) return false;
    if (isSupabaseConfigured()) {
      return await dbSaveQuiz(quiz);
    }
    try {
      const next = structuredClone(local());
      if (next.quizzes[quiz.id]) {
        return false;
      }
      next.quizzes[quiz.id] = structuredClone(quiz);
      next.attempts[quiz.id] ??= [];
      persist(next);
      return true;
    } catch {
      return false;
    }
  }

  async function getQuizById(id: string): Promise<QuizData | null> {
    if (isSupabaseConfigured()) {
      return await dbGetQuiz(id);
    }
    return structuredClone(local().quizzes[id] ?? null);
  }

  async function getQuizPublicData(id: string): Promise<QuizPublicData | null> {
    if (isSupabaseConfigured()) {
      return await dbGetQuizPublic(id);
    }
    const quiz = await getQuizById(id);
    if (!quiz) return null;
    return {
      id: quiz.id,
      slug: quiz.slug,
      creatorName: quiz.creatorName,
      gender: quiz.gender,
      country: quiz.country,
      theme: quiz.theme,
      createdAt: quiz.createdAt,
      totalQuestions: quiz.questions.length,
      questions: quiz.questions.map(({ questionId, question, emoji, options }) => ({
        questionId,
        question,
        emoji,
        options,
      })),
    };
  }

  async function recordAttemptAtomic(attempt: PlayerAttempt): Promise<RecordAttemptOutcome> {
    if (forceFailWrite) throw new StorageUnavailableError();
    if (isSupabaseConfigured()) {
      return await dbRecordAttemptAtomic(attempt);
    }
    const next = structuredClone(local());
    if (!next.quizzes[attempt.quizId]) {
      return { status: "quiz_not_found" };
    }

    // Check if an attempt with this ID already exists across active quizzes in storage
    let existingAnywhere: PlayerAttempt | undefined;
    for (const qId of Object.keys(next.attempts)) {
      if (!next.quizzes[qId]) continue; // Skip orphaned attempts from deleted quizzes (mirrors ON DELETE CASCADE)
      const found = next.attempts[qId]?.find((a) => a.id === attempt.id);
      if (found) {
        existingAnywhere = found;
        break;
      }
    }

    if (existingAnywhere) {
      const incomingFp = computeAttemptFingerprint(attempt.quizId, attempt.playerName, attempt.answers);
      const existingFp = computeAttemptFingerprint(existingAnywhere.quizId, existingAnywhere.playerName, existingAnywhere.answers);
      if (incomingFp === existingFp) {
        return { status: "duplicate", attempt: existingAnywhere };
      } else {
        return { status: "conflict", existingAttempt: existingAnywhere };
      }
    }

    next.attempts[attempt.quizId] = [
      structuredClone(attempt),
      ...(next.attempts[attempt.quizId] || []).filter((a) => a.id !== attempt.id),
    ];
    persist(next);
    return { status: "recorded", attempt };
  }

  async function recordAttempt(attempt: PlayerAttempt): Promise<boolean> {
    try {
      const res = await recordAttemptAtomic(attempt);
      return res.status === "recorded" || res.status === "duplicate";
    } catch {
      return false;
    }
  }

  async function fetchAttempts(id: string): Promise<PlayerAttempt[]> {
    if (isSupabaseConfigured()) {
      return await dbFetchAttempts(id);
    }
    return structuredClone(local().attempts[id] || []);
  }

  const sort = (attempts: PlayerAttempt[]) =>
    attempts.sort(
      (a, b) => b.score - a.score || a.createdAt - b.createdAt || a.id.localeCompare(b.id)
    );

  const publicEntry = (att: PlayerAttempt): ScoreboardEntry => {
    const ratio = att.totalQuestions > 0 ? att.score / att.totalQuestions : 0;
    return {
      id: att.id,
      playerName: att.playerName,
      score: att.score,
      totalQuestions: att.totalQuestions,
      createdAt: att.createdAt,
      statusBadge: ratio >= 0.8 ? "bestie" : ratio < 0.5 ? "fake" : "friend",
    };
  };

  async function getScoreboard(id: string): Promise<ScoreboardEntry[]> {
    return sort(await fetchAttempts(id)).map(publicEntry);
  }

  async function getScoreboardDetails(id: string): Promise<ScoreboardDetailEntry[]> {
    const quiz = await getQuizById(id);
    if (!quiz) return [];
    return sort(await fetchAttempts(id)).map((att) => ({
      ...publicEntry(att),
      answers: att.answers.map((ans) => {
        const q = quiz.questions.find((question) => question.questionId === ans.questionId);
        return {
          questionId: ans.questionId,
          question: q?.question || "Question",
          theirAnswer: q?.options.find((option) => option.id === ans.selectedOptionId)?.text || "Unknown",
          correctAnswer: q?.options.find((option) => option.id === q.correctOptionId)?.text || "Unknown",
          isCorrect: ans.isCorrect,
        };
      }),
    }));
  }

  async function deleteAttempt(id: string, attemptId: string): Promise<boolean> {
    if (forceFailWrite) throw new StorageUnavailableError();
    if (isSupabaseConfigured()) {
      return await dbDeleteAttempt(id, attemptId);
    }
    const next = structuredClone(local());
    if (!next.attempts[id]?.some((a) => a.id === attemptId)) return false;
    next.attempts[id] = next.attempts[id].filter((a) => a.id !== attemptId);
    persist(next);
    return true;
  }

  async function deleteQuiz(id: string): Promise<boolean> {
    if (forceFailWrite) throw new StorageUnavailableError();
    if (isSupabaseConfigured()) {
      return await dbDeleteQuiz(id);
    }
    const next = structuredClone(local());
    if (!next.quizzes[id]) return false;
    delete next.quizzes[id];
    delete next.attempts[id];
    persist(next);
    return true;
  }

  return {
    saveQuiz,
    getQuizById,
    getQuizPublicData,
    recordAttempt,
    recordAttemptAtomic,
    getScoreboard,
    getScoreboardDetails,
    deleteAttempt,
    deleteQuiz,
  };
}

export const {
  saveQuiz,
  getQuizById,
  getQuizPublicData,
  recordAttempt,
  recordAttemptAtomic,
  getScoreboard,
  getScoreboardDetails,
  deleteAttempt,
  deleteQuiz,
} = createQuizStorage();
