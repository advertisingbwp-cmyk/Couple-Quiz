import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createQuizStorage } from "../lib/quiz/storage";
import { _enableMockSupabase, getSupabaseClient } from "../lib/quiz/supabase";
import { createClient } from "@supabase/supabase-js";
import {
  recordFailedPinAttempt,
  checkPinRateLimit,
  clearPinRateLimit,
  hashPin,
  generateCreatorToken,
  generateCreatorSessionToken,
  verifyCreatorSessionToken,
  verifyCreatorToken,
} from "../lib/quiz/security";
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
const testAnonKey =
  process.env.QUIZ_TEST_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

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

test(
  "REAL SUPABASE security: valid anonymous / publishable key access to private tables and privileged RPCs is denied",
  {
    skip: enabled && Boolean(testAnonKey)
      ? false
      : "BLOCKED: Requires a valid Supabase publishable/anon key (set SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, or QUIZ_TEST_SUPABASE_ANON_KEY in .env.local). When unset, anonymous role authorization cannot be distinguished from missing credentials.",
  },
  async () => {
    assert.ok(testUrl, "SUPABASE_URL must be configured");
    assert.ok(testAnonKey, "Valid publishable/anon key must be configured");

    _enableMockSupabase(false);
    process.env.SUPABASE_URL = testUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = testKey;

    const anonClient = createClient(testUrl, testAnonKey);

    const tables = [
      "quizzes",
      "quiz_questions",
      "quiz_attempts",
      "quiz_attempt_answers",
      "creator_auth_rate_limits",
    ] as const;

    // 1. Verify anonymous client cannot read private quiz tables
    for (const t of tables) {
      // Direct REST query with valid anon key
      const res = await fetch(`${testUrl}/rest/v1/${t}`, {
        headers: {
          apikey: testAnonKey,
          Authorization: `Bearer ${testAnonKey}`,
        },
      });

      // Verify the gateway accepted the API key (did NOT return "Invalid API key")
      const body = await res.json().catch(() => null);
      if (typeof body === "object" && body !== null && "message" in body) {
        assert.notEqual(
          (body as { message: string }).message,
          "Invalid API key",
          `Table ${t}: API key was rejected as invalid instead of testing anonymous role permissions`
        );
      }

      // Must be denied (401/403) or return empty array if filtered by RLS
      const isDeniedOrEmpty =
        res.status === 401 ||
        res.status === 403 ||
        (res.status === 200 && Array.isArray(body) && body.length === 0);
      assert.ok(
        isDeniedOrEmpty,
        `Table ${t} read access must be denied or return empty to anonymous client (status: ${res.status})`
      );

      // Verify client-level select denial / empty return
      const clientRes = await anonClient.from(t).select("*");
      if (clientRes.error) {
        assert.notEqual(
          clientRes.error.message,
          "Invalid API key",
          `Table ${t}: Client error was "Invalid API key" rather than PostgreSQL permission denial`
        );
      } else {
        assert.deepEqual(clientRes.data, [], `Table ${t} returned data to anonymous client`);
      }
    }

    // 2. Verify anonymous client cannot write to private quiz tables
    const insertRes = await anonClient.from("quizzes").insert({
      id: "anon_forbidden_probe",
      slug: "anon-probe",
      creator_name: "Attacker",
      gender: "male",
      country: "US",
      theme: "default",
      pin_hash: "hash",
      creator_token_hash: "hash",
      created_at: new Date().toISOString(),
      created_at_ms: Date.now(),
    });
    assert.ok(insertRes.error, "Anonymous user must NOT be permitted to insert into quizzes");
    assert.notEqual(
      insertRes.error?.message,
      "Invalid API key",
      "Insert error must be permission denial, not invalid API key"
    );

    // 3. Verify anonymous client cannot execute the seven privileged quiz RPC functions
    const rpcs = [
      { name: "save_quiz_with_questions", args: { p_quiz: {}, p_questions: [] } },
      { name: "record_quiz_attempt", args: { p_attempt: {}, p_answers: [] } },
      { name: "delete_quiz_atomic", args: { p_quiz_id: "probe" } },
      { name: "delete_attempt_atomic", args: { p_quiz_id: "probe", p_attempt_id: "probe" } },
      { name: "check_pin_rate_limit", args: { p_rate_key: "probe", p_max_attempts: 5 } },
      {
        name: "record_pin_rate_limit_outcome",
        args: { p_rate_key: "probe", p_outcome: "success", p_max_attempts: 5, p_window_seconds: 600 },
      },
      { name: "clear_pin_rate_limit", args: { p_rate_key: "probe" } },
    ] as const;

    for (const { name, args } of rpcs) {
      // Direct REST RPC call with valid anon key
      const rpcRes = await fetch(`${testUrl}/rest/v1/rpc/${name}`, {
        method: "POST",
        headers: {
          apikey: testAnonKey,
          Authorization: `Bearer ${testAnonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(args),
      });

      const rpcBody = await rpcRes.json().catch(() => null);
      if (typeof rpcBody === "object" && rpcBody !== null && "message" in rpcBody) {
        assert.notEqual(
          (rpcBody as { message: string }).message,
          "Invalid API key",
          `RPC ${name}: API key was rejected as invalid instead of testing anonymous role permissions`
        );
      }

      // Unprivileged role must receive 401, 403, or 404 (hidden from PostgREST schema cache for unprivileged role)
      assert.ok(
        [401, 403, 404].includes(rpcRes.status),
        `RPC ${name} execution must be denied to anonymous role (got HTTP ${rpcRes.status})`
      );

      // Client-level RPC call
      const clientRpcRes = await anonClient.rpc(name, args as unknown as Record<string, unknown>);
      assert.ok(clientRpcRes.error, `Anonymous execution of RPC ${name} must return an error`);
      assert.notEqual(
        clientRpcRes.error?.message,
        "Invalid API key",
        `RPC ${name}: Client error was "Invalid API key" rather than PostgreSQL permission denial`
      );
    }

    // 4. Verify service_role access continues to work
    _enableMockSupabase(false);
    process.env.SUPABASE_URL = testUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = testKey;
    const serviceClient = getSupabaseClient();
    const serviceHealth = await serviceClient.from("quizzes").select("*", { count: "exact", head: true });
    assert.equal(serviceHealth.status, 200, "service_role client must retain full healthy access to quizzes");
    assert.equal(serviceHealth.error, null, "service_role client returned unexpected error");
  }
);

test(
  "REAL SUPABASE Phase 5: Image + text option persistence, variable option counts (2, 4, 6, 9), and public sanitization",
  {
    skip: enabled
      ? false
      : "Requires explicit opt-in and a disposable Supabase test project (QUIZ_SUPABASE_INTEGRATION=1, SUPABASE_URL / QUIZ_TEST_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY / QUIZ_TEST_SUPABASE_SERVICE_ROLE_KEY)",
  },
  async () => {
    _enableMockSupabase(false);
    process.env.SUPABASE_URL = testUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = testKey;

    const storage = createQuizStorage();
    const quizId = "phase5_visual_" + crypto.randomUUID();
    const pin = "7890";
    const pinHash = hashPin(pin);
    const rawCreatorToken = generateCreatorToken();

    // 10 questions covering 2, 4, 6, and 9 options with image and text
    const sampleQuestions: QuizData["questions"] = [
      {
        questionId: "v_q2_opt",
        question: "2-Option Morning Routine",
        emoji: "🌅",
        options: [
          { id: 0, text: "Early Bird", imageUrl: "/illustrations/early_bird.svg" },
          { id: 1, text: "Night Owl", imageUrl: "/illustrations/night_owl.svg" },
        ],
        correctOptionId: 0,
      },
      {
        questionId: "v_q4_opt",
        question: "4-Option Favorite Drink",
        emoji: "☕",
        options: [
          { id: 0, text: "Chai", imageUrl: "/illustrations/chai.svg" },
          { id: 1, text: "Coffee", imageUrl: "/illustrations/coffee.svg" },
          { id: 2, text: "Fresh Juice", imageUrl: "/illustrations/juice.svg" },
          { id: 3, text: "Boba Tea", imageUrl: "/illustrations/boba.svg" },
        ],
        correctOptionId: 1,
      },
      {
        questionId: "v_q6_opt",
        question: "6-Option Weekend Vibe",
        emoji: "🏖️",
        options: [
          { id: 0, text: "Mountain Hike", imageUrl: "/illustrations/mountain_hike.svg" },
          { id: 1, text: "Beach Chill", imageUrl: "/illustrations/beach.svg" },
          { id: 2, text: "City Walk", imageUrl: "/illustrations/city_walk.svg" },
          { id: 3, text: "Binge Shows", imageUrl: "/illustrations/binge_shows.svg" },
          { id: 4, text: "Gaming All Day", imageUrl: "/illustrations/gaming_night.svg" },
          { id: 5, text: "Reading in Cafe", imageUrl: "/illustrations/reading.svg" },
        ],
        correctOptionId: 4,
      },
      {
        questionId: "v_q9_opt",
        question: "9-Option Dream Trip",
        emoji: "✈️",
        options: [
          { id: 0, text: "Tokyo, Japan", imageUrl: "/illustrations/tokyo.svg" },
          { id: 1, text: "Paris, France", imageUrl: "/illustrations/paris.svg" },
          { id: 2, text: "New York, USA", imageUrl: "/illustrations/new_york.svg" },
          { id: 3, text: "Rome, Italy", imageUrl: "/illustrations/rome.svg" },
          { id: 4, text: "Cairo, Egypt", imageUrl: "/illustrations/cairo.svg" },
          { id: 5, text: "London, UK", imageUrl: "/illustrations/london.svg" },
          { id: 6, text: "Sydney, Australia", imageUrl: "/illustrations/sydney.svg" },
          { id: 7, text: "Rio, Brazil", imageUrl: "/illustrations/rio.svg" },
          { id: 8, text: "Istanbul, Turkey", imageUrl: "/illustrations/istanbul.svg" },
        ],
        correctOptionId: 8,
      },
      // 6 more standard questions to make exactly 10
      ...Array.from({ length: 6 }, (_, i) => ({
        questionId: `v_extra_${i + 5}`,
        question: `Question ${i + 5} Topic`,
        options: [
          { id: 0, text: `Option A for Q${i + 5}`, imageUrl: "/illustrations/chai.svg" },
          { id: 1, text: `Option B for Q${i + 5}`, imageUrl: "/illustrations/coffee.svg" },
        ],
        correctOptionId: 0,
      })),
    ];

    const quiz: QuizData = {
      id: quizId,
      slug: quizId,
      creatorName: "Supabase Visual Tester",
      gender: "female",
      country: "PK",
      theme: "dont_block_me",
      pinHash,
      creatorToken: rawCreatorToken,
      createdAt: Date.now(),
      questions: sampleQuestions,
    };

    try {
      // 1. Save quiz in PostgreSQL
      const saveResult = await storage.saveQuiz(quiz);
      assert.equal(saveResult, true, "Quiz must be saved to Supabase PostgreSQL");

      // 2. Fetch full quiz (creator/admin)
      const retrieved = await storage.getQuizById(quizId);
      assert.ok(retrieved, "Retrieved quiz must exist");
      assert.equal(retrieved.questions.length, 10, "Must have exactly 10 questions");

      // Check 2-option question
      const q2 = retrieved.questions.find((q) => q.questionId === "v_q2_opt")!;
      assert.equal(q2.options.length, 2);
      assert.equal(q2.options[0].text, "Early Bird");
      assert.equal(q2.options[0].imageUrl, "/illustrations/early_bird.svg");
      assert.equal(q2.correctOptionId, 0);

      // Check 4-option question
      const q4 = retrieved.questions.find((q) => q.questionId === "v_q4_opt")!;
      assert.equal(q4.options.length, 4);
      assert.equal(q4.options[1].text, "Coffee");
      assert.equal(q4.options[1].imageUrl, "/illustrations/coffee.svg");
      assert.equal(q4.correctOptionId, 1);

      // Check 6-option question
      const q6 = retrieved.questions.find((q) => q.questionId === "v_q6_opt")!;
      assert.equal(q6.options.length, 6);
      assert.equal(q6.options[4].text, "Gaming All Day");
      assert.equal(q6.options[4].imageUrl, "/illustrations/gaming_night.svg");
      assert.equal(q6.correctOptionId, 4);

      // Check 9-option question
      const q9 = retrieved.questions.find((q) => q.questionId === "v_q9_opt")!;
      assert.equal(q9.options.length, 9);
      assert.equal(q9.options[8].text, "Istanbul, Turkey");
      assert.equal(q9.options[8].imageUrl, "/illustrations/istanbul.svg");
      assert.equal(q9.correctOptionId, 8);

      // 3. Fetch public quiz (player)
      const publicData = await storage.getQuizPublicData(quizId);
      assert.ok(publicData, "Public quiz data must exist");
      assert.equal(publicData.totalQuestions, 10);
      assert.equal("pinHash" in (publicData as unknown as Record<string, unknown>), false, "pinHash must never be exposed publicly");
      assert.equal("creatorToken" in (publicData as unknown as Record<string, unknown>), false, "creatorToken must never be exposed publicly");

      for (const pq of publicData.questions) {
        assert.equal("correctOptionId" in (pq as unknown as Record<string, unknown>), false, "correctOptionId must never be exposed publicly");
        assert.ok(pq.options.length >= 2, "Question options must be present");
        for (const opt of pq.options) {
          assert.ok(opt.text, "Option text must persist");
          assert.ok(opt.imageUrl, "Option imageUrl must persist");
        }
      }
    } finally {
      // Cleanup
      try {
        await storage.deleteQuiz(quizId);
      } catch {
        // ignore
      }
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    }
  }
);

test(
  "REAL SUPABASE Phase 5: Creator session token authorization, deterministic scoring, and attempt cleanup",
  {
    skip: enabled
      ? false
      : "Requires explicit opt-in and a disposable Supabase test project (QUIZ_SUPABASE_INTEGRATION=1, SUPABASE_URL / QUIZ_TEST_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY / QUIZ_TEST_SUPABASE_SERVICE_ROLE_KEY)",
  },
  async () => {
    _enableMockSupabase(false);
    process.env.SUPABASE_URL = testUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = testKey;

    const storage = createQuizStorage();
    const quizId = "phase5_scoring_" + crypto.randomUUID();
    const pin = "6543";
    const pinHash = hashPin(pin);
    const rawCreatorToken = generateCreatorToken();

    const quiz: QuizData = {
      id: quizId,
      slug: quizId,
      creatorName: "Deterministic Scorer",
      gender: "male",
      country: "PK",
      theme: "dont_block_me",
      pinHash,
      creatorToken: rawCreatorToken,
      createdAt: Date.now(),
      questions: [
        {
          questionId: "q1",
          question: "Question 1",
          options: [
            { id: 0, text: "Option A" },
            { id: 1, text: "Option B" },
          ],
          correctOptionId: 0,
        },
        {
          questionId: "q2",
          question: "Question 2",
          options: [
            { id: 0, text: "Option C" },
            { id: 1, text: "Option D" },
          ],
          correctOptionId: 1,
        },
      ],
    };

    try {
      await storage.saveQuiz(quiz);

      // 1. Submit attempts with tie-breaking conditions
      const att1: PlayerAttempt = {
        id: `${quizId}_att1`,
        quizId,
        playerName: "PlayerOne_Early",
        score: 2,
        totalQuestions: 2,
        answers: [
          { questionId: "q1", selectedOptionId: 0, isCorrect: true },
          { questionId: "q2", selectedOptionId: 1, isCorrect: true },
        ],
        createdAt: 1000,
      };

      const att2: PlayerAttempt = {
        id: `${quizId}_att2`,
        quizId,
        playerName: "PlayerTwo_Late",
        score: 2,
        totalQuestions: 2,
        answers: [
          { questionId: "q1", selectedOptionId: 0, isCorrect: true },
          { questionId: "q2", selectedOptionId: 1, isCorrect: true },
        ],
        createdAt: 2000,
      };

      const att3: PlayerAttempt = {
        id: `${quizId}_att3`,
        quizId,
        playerName: "PlayerThree_Lower",
        score: 1,
        totalQuestions: 2,
        answers: [
          { questionId: "q1", selectedOptionId: 0, isCorrect: true },
          { questionId: "q2", selectedOptionId: 0, isCorrect: false },
        ],
        createdAt: 500,
      };

      assert.equal(await storage.recordAttempt(att2), true);
      assert.equal(await storage.recordAttempt(att1), true);
      assert.equal(await storage.recordAttempt(att3), true);

      // 2. Scoreboard ordering verification: score DESC, created_at_ms ASC, id ASC
      const scoreboard = await storage.getScoreboard(quizId);
      assert.equal(scoreboard.length, 3);
      assert.equal(scoreboard[0].playerName, "PlayerOne_Early");
      assert.equal(scoreboard[0].score, 2);
      assert.equal(scoreboard[1].playerName, "PlayerTwo_Late");
      assert.equal(scoreboard[1].score, 2);
      assert.equal(scoreboard[2].playerName, "PlayerThree_Lower");
      assert.equal(scoreboard[2].score, 1);

      // 3. Creator detailed answers breakdown
      const details = await storage.getScoreboardDetails(quizId);
      assert.equal(details.length, 3);
      assert.equal(details[0].answers.length, 2);
      assert.equal(details[0].answers[0].theirAnswer, "Option A");
      assert.equal(details[0].answers[0].correctAnswer, "Option A");
      assert.equal(details[0].answers[0].isCorrect, true);

      // 4. Creator session token & pass-the-hash defense against live PostgreSQL record
      const storedQuiz = await storage.getQuizById(quizId);
      assert.ok(storedQuiz);
      const storedDigest = storedQuiz.creatorToken; // 64-char SHA-256 hash in PostgreSQL
      assert.match(storedDigest, /^[0-9a-f]{64}$/i, "Supabase must store a 64-char SHA-256 hex digest");

      // Original raw token succeeds
      assert.equal(
        verifyCreatorToken(rawCreatorToken, storedDigest, { quizId, pinHash }),
        true,
        "Original raw creator token must succeed against Supabase digest"
      );

      // Pass-the-hash attack is rejected: submitting the stored SHA-256 digest directly fails
      assert.equal(
        verifyCreatorToken(storedDigest, storedDigest, { quizId, pinHash }),
        false,
        "Stored SHA-256 digest submitted directly MUST be rejected (pass-the-hash defense)"
      );

      // Invalid raw token is rejected
      assert.equal(
        verifyCreatorToken("adm_fake_raw_token_1234567890", storedDigest, { quizId, pinHash }),
        false,
        "Invalid raw token must be rejected"
      );

      // Session token succeeds
      const sessionToken = generateCreatorSessionToken(quizId, pinHash);
      assert.ok(sessionToken.startsWith("adm_cts_"));
      assert.equal(verifyCreatorSessionToken(sessionToken, quizId, pinHash), true);
      assert.equal(
        verifyCreatorToken(sessionToken, storedDigest, { quizId, pinHash }),
        true,
        "Session token must be accepted"
      );

      // 5. Authorized attempt deletion
      const deletedAtt = await storage.deleteAttempt(quizId, `${quizId}_att3`);
      assert.equal(deletedAtt, true, "Attempt must be deleted from Supabase");

      const remainingScoreboard = await storage.getScoreboard(quizId);
      assert.equal(remainingScoreboard.length, 2);
      assert.equal(remainingScoreboard.some((a) => a.id === `${quizId}_att3`), false);

      // 6. Authorized quiz deletion
      const deletedQuiz = await storage.deleteQuiz(quizId);
      assert.equal(deletedQuiz, true, "Quiz must be deleted from Supabase");
      assert.equal(await storage.getQuizById(quizId), null);
      assert.deepEqual(await storage.getScoreboard(quizId), []);
    } finally {
      try {
        await storage.deleteQuiz(quizId);
      } catch {
        // ignore
      }
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    }
  }
);

