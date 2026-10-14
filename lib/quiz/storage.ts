import fs from "fs";
import path from "path";
import os from "os";
import { QuizData, PlayerAttempt, ScoreboardEntry, ScoreboardDetailEntry, QuizPublicData } from "./types";

interface StorageSchema {
  quizzes: Record<string, QuizData>;
  attempts: Record<string, PlayerAttempt[]>;
}

function getDbFilePath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), "quizzes-store.json");
  }
  return path.join(process.cwd(), "data", "quizzes-store.json");
}

let cache: StorageSchema | null = null;

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, "");
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

async function syncWithUpstashGet(key: string): Promise<unknown | null> {
  if (!upstashUrl || !upstashToken) return null;
  try {
    const res = await fetch(`${upstashUrl}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${upstashToken}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.result) {
      return typeof json.result === "string" ? JSON.parse(json.result) : json.result;
    }
  } catch (err) {
    console.warn("[Quiz Storage Upstash GET Warning]:", err);
  }
  return null;
}

async function syncWithUpstashSet(key: string, value: unknown): Promise<boolean> {
  if (!upstashUrl || !upstashToken) return false;
  try {
    const res = await fetch(`${upstashUrl}/set/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${upstashToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(typeof value === "string" ? value : JSON.stringify(value)),
    });
    return res.ok;
  } catch (err) {
    console.warn("[Quiz Storage Upstash SET Warning]:", err);
    return false;
  }
}

function ensureDbLoaded(): StorageSchema {
  if (cache) return cache;

  const dbPath = getDbFilePath();
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, "utf8");
      cache = JSON.parse(raw);
    } else {
      cache = { quizzes: {}, attempts: {} };
      persistDb(cache);
    }
  } catch {
    cache = { quizzes: {}, attempts: {} };
  }

  return cache!;
}

function persistDb(data: StorageSchema): void {
  const dbPath = getDbFilePath();
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
  } catch {
    try {
      const tmpPath = path.join(os.tmpdir(), "quizzes-store.json");
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
    } catch {
      // In-memory fallback
    }
  }
}

export async function saveQuiz(quiz: QuizData): Promise<boolean> {
  const db = ensureDbLoaded();
  db.quizzes[quiz.id] = quiz;
  if (!db.attempts[quiz.id]) {
    db.attempts[quiz.id] = [];
  }
  persistDb(db);

  if (upstashUrl && upstashToken) {
    const saved = await syncWithUpstashSet(`quiz:${quiz.id}`, quiz);
    return saved;
  }
  return true;
}

export async function getQuizById(quizId: string): Promise<QuizData | null> {
  const db = ensureDbLoaded();
  if (db.quizzes[quizId]) {
    return db.quizzes[quizId];
  }

  if (upstashUrl && upstashToken) {
    const remoteQuiz = (await syncWithUpstashGet(`quiz:${quizId}`)) as QuizData | null;
    if (remoteQuiz) {
      db.quizzes[quizId] = remoteQuiz;
      return remoteQuiz;
    }
  }

  return null;
}

export async function getQuizPublicData(quizId: string): Promise<QuizPublicData | null> {
  const quiz = await getQuizById(quizId);
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
    questions: quiz.questions.map((q) => ({
      questionId: q.questionId,
      question: q.question,
      emoji: q.emoji,
      options: q.options,
    })),
  };
}

export async function recordAttempt(attempt: PlayerAttempt): Promise<void> {
  const db = ensureDbLoaded();
  if (!db.attempts[attempt.quizId]) {
    db.attempts[attempt.quizId] = [];
  }

  // Remote merge if Redis is present
  if (upstashUrl && upstashToken) {
    const remoteAttempts = (await syncWithUpstashGet(`quiz_attempts:${attempt.quizId}`)) as PlayerAttempt[] | null;
    if (remoteAttempts && Array.isArray(remoteAttempts)) {
      const mergedMap = new Map<string, PlayerAttempt>();
      for (const a of remoteAttempts) mergedMap.set(a.id, a);
      for (const a of db.attempts[attempt.quizId]) mergedMap.set(a.id, a);
      mergedMap.set(attempt.id, attempt);
      db.attempts[attempt.quizId] = Array.from(mergedMap.values());
    } else {
      db.attempts[attempt.quizId].unshift(attempt);
    }
    await syncWithUpstashSet(`quiz_attempts:${attempt.quizId}`, db.attempts[attempt.quizId]);
  } else {
    db.attempts[attempt.quizId].unshift(attempt);
  }

  persistDb(db);
}

/**
 * Helper to sort attempts:
 * 1. Score DESC (Highest score first)
 * 2. createdAt ASC (Earlier attempt wins tie-breaker)
 */
function sortAttempts(attempts: PlayerAttempt[]): PlayerAttempt[] {
  return [...attempts].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.createdAt - b.createdAt;
  });
}

/**
 * Public Scoreboard: Returns ONLY player names, scores, and badges.
 * NEVER returns raw answers or correct answers.
 */
export async function getScoreboard(quizId: string): Promise<ScoreboardEntry[]> {
  const db = ensureDbLoaded();
  let rawAttempts = db.attempts[quizId] || [];

  if (rawAttempts.length === 0 && upstashUrl && upstashToken) {
    const remoteAttempts = (await syncWithUpstashGet(`quiz_attempts:${quizId}`)) as PlayerAttempt[] | null;
    if (remoteAttempts && Array.isArray(remoteAttempts)) {
      db.attempts[quizId] = remoteAttempts;
      rawAttempts = remoteAttempts;
    }
  }

  const sorted = sortAttempts(rawAttempts);

  return sorted.map((att) => {
    let badge: "bestie" | "friend" | "fake" = "friend";
    const ratio = att.totalQuestions > 0 ? att.score / att.totalQuestions : 0;
    if (ratio >= 0.8) badge = "bestie";
    else if (ratio < 0.5) badge = "fake";

    return {
      id: att.id,
      playerName: att.playerName,
      score: att.score,
      totalQuestions: att.totalQuestions,
      createdAt: att.createdAt,
      statusBadge: badge,
    };
  });
}

/**
 * Authenticated Scoreboard Details: Returns full question-by-question breakdown.
 * Accessible ONLY by creator with valid token or PIN.
 */
export async function getScoreboardDetails(quizId: string): Promise<ScoreboardDetailEntry[]> {
  const db = ensureDbLoaded();
  const quiz = await getQuizById(quizId);
  let rawAttempts = db.attempts[quizId] || [];

  if (rawAttempts.length === 0 && upstashUrl && upstashToken) {
    const remoteAttempts = (await syncWithUpstashGet(`quiz_attempts:${quizId}`)) as PlayerAttempt[] | null;
    if (remoteAttempts && Array.isArray(remoteAttempts)) {
      db.attempts[quizId] = remoteAttempts;
      rawAttempts = remoteAttempts;
    }
  }

  const sorted = sortAttempts(rawAttempts);

  return sorted.map((att) => {
    let badge: "bestie" | "friend" | "fake" = "friend";
    const ratio = att.totalQuestions > 0 ? att.score / att.totalQuestions : 0;
    if (ratio >= 0.8) badge = "bestie";
    else if (ratio < 0.5) badge = "fake";

    const detailedAnswers = quiz
      ? att.answers.map((ans) => {
          const q = quiz.questions.find((qq) => qq.questionId === ans.questionId);
          const theirOpt = q?.options.find((o) => o.id === ans.selectedOptionId)?.text || "Unknown";
          const correctOpt = q?.options.find((o) => o.id === q.correctOptionId)?.text || "Unknown";
          return {
            questionId: ans.questionId,
            question: q?.question || "Question",
            theirAnswer: theirOpt,
            correctAnswer: correctOpt,
            isCorrect: ans.isCorrect,
          };
        })
      : [];

    return {
      id: att.id,
      playerName: att.playerName,
      score: att.score,
      totalQuestions: att.totalQuestions,
      createdAt: att.createdAt,
      statusBadge: badge,
      answers: detailedAnswers,
    };
  });
}

export async function deleteAttempt(quizId: string, attemptId: string): Promise<boolean> {
  const db = ensureDbLoaded();
  if (!db.attempts[quizId]) return false;

  const initialLength = db.attempts[quizId].length;
  db.attempts[quizId] = db.attempts[quizId].filter((a) => a.id !== attemptId);

  if (db.attempts[quizId].length !== initialLength) {
    persistDb(db);
    if (upstashUrl && upstashToken) {
      await syncWithUpstashSet(`quiz_attempts:${quizId}`, db.attempts[quizId]);
    }
    return true;
  }
  return false;
}

export async function deleteQuiz(quizId: string): Promise<boolean> {
  const db = ensureDbLoaded();
  if (db.quizzes[quizId]) {
    delete db.quizzes[quizId];
    delete db.attempts[quizId];
    persistDb(db);
    if (upstashUrl && upstashToken) {
      await syncWithUpstashSet(`quiz:${quizId}`, null);
      await syncWithUpstashSet(`quiz_attempts:${quizId}`, null);
    }
    return true;
  }
  return false;
}
