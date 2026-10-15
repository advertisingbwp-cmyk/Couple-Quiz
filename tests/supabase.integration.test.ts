import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createQuizStorage } from "../lib/quiz/storage";
import { _enableMockSupabase, getSupabaseClient } from "../lib/quiz/supabase";
import { createClient } from "@supabase/supabase-js";
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

