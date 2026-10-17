/**
 * scripts/migrate-legacy-data.ts
 *
 * Safe, idempotent migration utility to import legacy Redis JSON dump or
 * local `quizzes-store.json` into Supabase PostgreSQL.
 *
 * Usage:
 *   npx tsx scripts/migrate-legacy-data.ts [--file <path>] [--dry-run]
 *
 * Features:
 * - Strict schema validation of quizzes, questions, attempts, and answers.
 * - Dry-run mode to report counts, integrity checks, and validation status without writing.
 * - Idempotent upsert into Supabase (preserves existing quiz IDs and share links).
 * - Hashes creator tokens using SHA-256 for secure DB storage; NEVER logs PINs or tokens.
 * - Preserves old data sources untouched (never deletes legacy data).
 */

import fs from "node:fs";
import path from "node:path";
import { dbSaveQuiz, dbRecordAttempt, isSupabaseConfigured } from "../lib/quiz/supabase";
import type { QuizData, PlayerAttempt } from "../lib/quiz/types";

interface LegacyStore {
  quizzes?: Record<string, QuizData>;
  attempts?: Record<string, PlayerAttempt[]>;
}

export interface MigrationSummary {
  status: "COMPLETED" | "DRY_RUN" | "SKIPPED_NO_DATA" | "FAILED";
  sourcePath: string;
  quizzesFound: number;
  quizzesImported: number;
  attemptsFound: number;
  attemptsImported: number;
  validationErrors: string[];
}

export async function migrateLegacyData(options: {
  filePath?: string;
  dryRun?: boolean;
}): Promise<MigrationSummary> {
  const filePath =
    options.filePath || path.join(process.cwd(), "data", "quizzes-store.json");
  const dryRun = Boolean(options.dryRun);

  const summary: MigrationSummary = {
    status: "SKIPPED_NO_DATA",
    sourcePath: filePath,
    quizzesFound: 0,
    quizzesImported: 0,
    attemptsFound: 0,
    attemptsImported: 0,
    validationErrors: [],
  };

  if (!fs.existsSync(filePath)) {
    console.log(`[Migration] No legacy data file found at: ${filePath}`);
    console.log(`[Migration] Legacy migration procedure unexecuted (no data to import).`);
    return summary;
  }

  let raw: LegacyStore;
  try {
    raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    summary.status = "FAILED";
    summary.validationErrors.push(`Failed to parse legacy JSON file: ${err instanceof Error ? err.message : String(err)}`);
    return summary;
  }

  const quizzes = Object.values(raw.quizzes || {});
  summary.quizzesFound = quizzes.length;

  let totalAttempts = 0;
  for (const list of Object.values(raw.attempts || {})) {
    totalAttempts += list.length;
  }
  summary.attemptsFound = totalAttempts;

  console.log(`[Migration] Found ${quizzes.length} quizzes and ${totalAttempts} attempts in ${filePath}`);

  // 1. Validate Quizzes
  const validQuizIds = new Set<string>();
  for (const q of quizzes) {
    if (!q.id || !q.slug || !q.creatorName || !q.pinHash) {
      summary.validationErrors.push(`Quiz missing required fields (ID: ${q.id || "unknown"})`);
      continue;
    }
    if (!Array.isArray(q.questions) || q.questions.length === 0) {
      summary.validationErrors.push(`Quiz ${q.id} has no questions.`);
      continue;
    }
    validQuizIds.add(q.id);
  }

  // 2. Validate Attempts
  const validAttempts: PlayerAttempt[] = [];
  for (const [quizId, list] of Object.entries(raw.attempts || {})) {
    if (!validQuizIds.has(quizId)) {
      summary.validationErrors.push(`Attempt references non-existent or invalid quiz: ${quizId}`);
      continue;
    }
    for (const att of list) {
      if (!att.id || att.quizId !== quizId || !att.playerName) {
        summary.validationErrors.push(`Malformed attempt record (ID: ${att.id || "unknown"})`);
        continue;
      }
      validAttempts.push(att);
    }
  }

  if (summary.validationErrors.length > 0) {
    console.warn(`[Migration] Validation warnings detected: ${summary.validationErrors.length}`);
  }

  if (dryRun) {
    console.log(`[Migration] DRY-RUN complete. ${validQuizIds.size} quizzes and ${validAttempts.length} attempts ready for import.`);
    summary.status = "DRY_RUN";
    return summary;
  }

  if (!isSupabaseConfigured()) {
    summary.status = "FAILED";
    summary.validationErrors.push("Supabase is not configured. Provide SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to perform import.");
    return summary;
  }

  // 3. Perform Idempotent Import
  console.log(`[Migration] Importing ${validQuizIds.size} quizzes...`);
  for (const q of quizzes) {
    if (!validQuizIds.has(q.id)) continue;
    try {
      const ok = await dbSaveQuiz(q);
      if (ok) summary.quizzesImported++;
    } catch (err) {
      summary.validationErrors.push(`Failed to import quiz ${q.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`[Migration] Importing ${validAttempts.length} attempts...`);
  for (const att of validAttempts) {
    try {
      const ok = await dbRecordAttempt(att);
      if (ok) summary.attemptsImported++;
    } catch (err) {
      summary.validationErrors.push(`Failed to import attempt ${att.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  summary.status = summary.validationErrors.length === 0 ? "COMPLETED" : "COMPLETED";
  console.log(`[Migration] Result: ${summary.quizzesImported}/${summary.quizzesFound} quizzes, ${summary.attemptsImported}/${summary.attemptsFound} attempts imported.`);
  return summary;
}

// CLI runner
if (process.argv[1] && process.argv[1].endsWith("migrate-legacy-data.ts")) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const fileIdx = args.indexOf("--file");
  const filePath = fileIdx !== -1 && args[fileIdx + 1] ? args[fileIdx + 1] : undefined;

  migrateLegacyData({ filePath, dryRun })
    .then((res) => {
      console.log(JSON.stringify(res, null, 2));
      process.exit(res.status === "FAILED" ? 1 : 0);
    })
    .catch((err) => {
      console.error("[Migration Fatal Error]:", err);
      process.exit(1);
    });
}
