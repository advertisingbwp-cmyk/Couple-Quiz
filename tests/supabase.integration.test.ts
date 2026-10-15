import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createQuizStorage } from "../lib/quiz/storage";
import { _enableMockSupabase, getSupabaseClient } from "../lib/quiz/supabase";
import { recordFailedPinAttempt, checkPinRateLimit, clearPinRateLimit } from "../lib/quiz/security";
import type { QuizData, PlayerAttempt } from "../lib/quiz/types";

const enabled =
  process.env.QUIZ_SUPABASE_INTEGRATION === "1" &&
  Boolean(process.env.QUIZ_TEST_SUPABASE_URL && process.env.QUIZ_TEST_SUPABASE_SERVICE_ROLE_KEY);

test(
  "REAL SUPABASE integration: concurrent writes, cross-instance deletion, RPC rate limiting, and cascades",
  {
    skip: enabled
      ? false
      : "Requires explicit opt-in and a disposable Supabase test project (QUIZ_SUPABASE_INTEGRATION=1, QUIZ_TEST_SUPABASE_URL, QUIZ_TEST_SUPABASE_SERVICE_ROLE_KEY)",
  },
  async () => {
    _enableMockSupabase(false);
    process.env.SUPABASE_URL = process.env.QUIZ_TEST_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.QUIZ_TEST_SUPABASE_SERVICE_ROLE_KEY;

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
      assert.equal(await storageA.saveQuiz(quiz), true);

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

      // 3. Scoreboard Verification
      const scoreboard = await storageB.getScoreboard(id);
      assert.equal(scoreboard.length, 32);

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
