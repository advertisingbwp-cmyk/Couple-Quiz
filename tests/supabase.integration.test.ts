import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createQuizStorage } from "../lib/quiz/storage";
import { _enableMockSupabase, getSupabaseClient } from "../lib/quiz/supabase";
import { recordFailedPinAttempt, checkPinRateLimit, clearPinRateLimit } from "../lib/quiz/security";
import type { QuizData, PlayerAttempt } from "../lib/quiz/types";

import { loadEnvConfig, resetEnv } from "@next/env";
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  resetEnv();
  const envMap = process.env as Record<string, string | undefined>;
  const prevEnv = envMap.NODE_ENV;
  envMap.NODE_ENV = "development";
  loadEnvConfig(process.cwd(), true);
  envMap.NODE_ENV = prevEnv;
}

const testUrl = process.env.QUIZ_TEST_SUPABASE_URL || process.env.SUPABASE_URL;
const testKey = process.env.QUIZ_TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const enabled =
  process.env.QUIZ_SUPABASE_INTEGRATION?.trim() === "1" &&
  Boolean(testUrl && testKey);

test(
  "REAL SUPABASE integration: schema verification, least-privilege, concurrent writes, cross-instance deletion, RPC rate limiting, and cascades",
  {
    skip: enabled
      ? false
      : "Requires explicit opt-in and a disposable Supabase test project (QUIZ_SUPABASE_INTEGRATION=1, SUPABASE_URL / QUIZ_TEST_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY / QUIZ_TEST_SUPABASE_SERVICE_ROLE_KEY)",
  },
  async () => {
    _enableMockSupabase(false);
    process.env.SUPABASE_URL = testUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = testKey;

    const client = getSupabaseClient();

    // 0. Verify Schema: All 5 tables exist
    const tables = [
      "quizzes",
      "quiz_questions",
      "quiz_attempts",
      "quiz_attempt_answers",
      "creator_auth_rate_limits",
    ] as const;
    for (const t of tables) {
      const { status, error } = await client.from(t).select("*", { count: "exact", head: true });
      assert.equal(status, 200, `Table ${t} must exist and be accessible to service_role`);
      assert.equal(error, null, `Table ${t} returned unexpected error: ${error?.message}`);
    }

    // 0b. Verify Least Privilege: Unauthenticated / anon requests must be denied (HTTP 401)
    for (const t of tables) {
      const res = await fetch(`${testUrl}/rest/v1/${t}`, {
        headers: { apikey: "dummy-unauthorized-key" },
      });
      assert.equal(res.status, 401, `Table ${t} direct anon access must be rejected with 401`);
    }

    const rpcs = [
      "save_quiz_with_questions",
      "record_quiz_attempt",
      "delete_quiz_atomic",
      "delete_attempt_atomic",
      "check_pin_rate_limit",
      "record_pin_rate_limit_outcome",
      "clear_pin_rate_limit",
    ] as const;
    for (const r of rpcs) {
      const res = await fetch(`${testUrl}/rest/v1/rpc/${r}`, {
        method: "POST",
        headers: { apikey: "dummy-unauthorized-key", "Content-Type": "application/json" },
        body: "{}",
      });
      assert.equal(res.status, 401, `RPC ${r} direct anon access must be rejected with 401`);
    }

    const id = "phase16_test_" + crypto.randomUUID();
    const authIp =
      "2001:db8:" +
      crypto.randomBytes(2).toString("hex") +
      ":" +
      crypto.randomBytes(2).toString("hex") +
      "::1";

    const storageA = createQuizStorage();
    const storageB = createQuizStorage();

    const quiz: QuizData = {
      id,
      slug: id,
      creatorName: "Integration Fixture",
      gender: "male",
      country: "PK",
      theme: "dont_block_me",
      pinHash: "$scrypt$test",
      creatorToken: crypto.randomBytes(32).toString("hex"),
      createdAt: Date.now(),
      questions: [
        {
          questionId: "q1",
          question: "Test question 1",
          options: [
            { id: 0, text: "A" },
            { id: 1, text: "B" },
          ],
          correctOptionId: 0,
        },
      ],
    };

    try {
      // 1. Save Quiz
      assert.equal(await storageA.saveQuiz(quiz), true, "Quiz must be created successfully");

      // 1b. Duplicate Rejection: Exact duplicate and overwrite attempts must return false
      assert.equal(await storageA.saveQuiz(quiz), false, "Duplicate quiz insertion must return false");
      assert.equal(
        await storageB.saveQuiz({ ...quiz, creatorName: "Compromised Name" }),
        false,
        "Overwriting existing quiz must return false"
      );

      // 1c. Quiz Retrieval & Data Integrity
      const retrieved = await storageB.getQuizById(id);
      assert.ok(retrieved, "Retrieved quiz must exist");
      assert.equal(retrieved.creatorName, "Integration Fixture");
      assert.equal(retrieved.questions.length, 1);
      assert.equal(retrieved.questions[0].correctOptionId, 0);

      // 1d. Public Data Sanitization (pinHash and answers never exposed)
      const publicData = await storageB.getQuizPublicData(id);
      assert.ok(publicData, "Public quiz data must exist");
      assert.equal((publicData as unknown as { pinHash?: unknown }).pinHash, undefined);
      assert.equal((publicData as unknown as { creatorToken?: unknown }).creatorToken, undefined);
      assert.equal((publicData.questions[0] as unknown as { correctOptionId?: unknown }).correctOptionId, undefined);

      // 2. 32 Simultaneous Submissions across two independent storage clients
      const results = await Promise.all(
        Array.from({ length: 32 }, (_, i) => {
          const entry: PlayerAttempt = {
            id: `${id}_att_${i}`,
            quizId: id,
            playerName: `Player_${i}`,
            score: i % 2 === 0 ? 1 : 0,
            totalQuestions: 1,
            answers: [
              {
                questionId: "q1",
                selectedOptionId: i % 2 === 0 ? 0 : 1,
                isCorrect: i % 2 === 0,
              },
            ],
            createdAt: Date.now() + i,
          };
          return (i % 2 === 0 ? storageA : storageB).recordAttempt(entry);
        })
      );
      assert.ok(results.every(Boolean), "All 32 concurrent writes must succeed");

      // 3. Scoreboard Verification & Ordering
      const scoreboard = await storageB.getScoreboard(id);
      assert.equal(scoreboard.length, 32);
      assert.ok(
        scoreboard[0].score >= scoreboard[scoreboard.length - 1].score,
        "Scoreboard must be sorted by score descending"
      );
      const details = await storageB.getScoreboardDetails(id);
      assert.equal(details.length, 32);
      assert.equal(details[0].answers.length, 1);
      assert.equal(details[0].answers[0].question, "Test question 1");

      // 4. Attempt Deletion & Cascade
      assert.equal(await storageA.deleteAttempt(id, `${id}_att_0`), true);
      assert.equal(await storageB.deleteAttempt(id, `${id}_att_0`), false, "Repeated deletion must return false");
      assert.equal((await storageB.getScoreboard(id)).length, 31);

      // 5. Creator PIN Rate Limiting & Atomic Window
      const failures = await Promise.all(
        Array.from({ length: 40 }, () => recordFailedPinAttempt(authIp))
      );
      assert.equal(failures.filter(Boolean).length, 5, "Exactly 5 failures allowed before rate limiting");
      assert.equal(await checkPinRateLimit(authIp), false, "Must be blocked after limit reached");

      // 6. Cascading Quiz Deletion
      assert.equal(await storageA.deleteQuiz(id), true);
      assert.equal(await storageB.deleteQuiz(id), false, "Repeated delete must return false");
      assert.equal(await storageB.getQuizById(id), null);
      assert.deepEqual(await storageB.getScoreboard(id), []);

      // 7. Verify Orphan Protection
      const orphanAttempt: PlayerAttempt = {
        id: `${id}_orphan`,
        quizId: id,
        playerName: "Orphan",
        score: 0,
        totalQuestions: 1,
        answers: [],
        createdAt: Date.now(),
      };
      assert.equal(
        await storageA.recordAttempt(orphanAttempt),
        false,
        "Cannot record attempt on deleted quiz"
      );
    } finally {
      // Clean up test data
      try {
        const client = getSupabaseClient();
        await client.from("quizzes").delete().eq("id", id);
      } catch {
        // ignore
      }
      await clearPinRateLimit(authIp).catch(() => {});
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    }
  }
);
