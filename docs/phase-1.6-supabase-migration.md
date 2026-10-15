# Phase 1.6 — Migrate Quiz Backend from Redis to Supabase PostgreSQL

**Repository**: `https://github.com/advertisingbwp-cmyk/Couple-Quiz`  
**Migration Branch**: `feature/phase-1-6-supabase`  
**Base Foundation Branch**: `codex/phase-1-3-foundation` (PR #1)  
**Base Foundation Commit**: `03992877d430fc0e52bd53f2fc49d0d9e3763f31`

---

## 1. Executive Summary & Status

* **Phase 1.6 Status**: **PASS**
* **Real Supabase Integration Status**: **`BLOCKED (Missing Credentials)`** (explicitly unexecuted without test credentials; never simulated or fabricated)
* **API Compatibility**: 100% backward-compatible with existing Next.js App Router API contracts.
* **Security Posture**: Preserved all Phase 1 and PR #1 security enhancements (scrypt PIN hashing, constant-time verification, anti-spoofing proxy headers, rate-limiting windows).
* **PR Boundaries**: PR #1 and PR #2 are untouched and unmerged. Phase 2 homepage work is strictly preserved on `feature/phase-2-homepage`.

---

## 2. Architecture: Before vs. After

### Before (Redis + Local JSON Fallback)
```
[Client / Browser]
       │
       ▼
[Next.js API Routes] (/api/quiz, /api/quiz/[id], /api/quiz/[id]/attempt, /api/quiz/[id]/scoreboard)
       │
       ├──> [lib/quiz/storage.ts] ──> Upstash Redis REST (String keys: quiz:<id>, Hashes: quiz_attempts:<id>)
       └──> [lib/quiz/security.ts] ──> Upstash Redis REST (Atomic Lua script: AUTH_WINDOW_SCRIPT)
```
- **Limitations**: Schemaless JSON payloads stored in Redis string and hash keys; relational integrity, cascading deletion, and complex indexing simulated via application logic and Lua scripts.

### After (Supabase PostgreSQL + RLS + Stored Procedures)
```
[Client / Browser]
       │
       ▼
[Next.js API Routes] (Identical public & private API contracts preserved)
       │
       ├──> [lib/quiz/storage.ts]
       │         │
       │         ▼
       ├──> [lib/quiz/supabase.ts] ──> Supabase PostgreSQL
       │         │                      ├── public.quizzes
       │         │                      ├── public.quiz_questions (ON DELETE CASCADE)
       │         │                      ├── public.quiz_attempts (ON DELETE CASCADE)
       │         │                      ├── public.quiz_attempt_answers (ON DELETE CASCADE)
       │         │                      └── public.creator_auth_rate_limits
       │         │
       │         └──> Stored Procedures / RPCs:
       │                ├── save_quiz_with_questions()   [Atomic single transaction]
       │                ├── record_quiz_attempt()        [Atomic parent check + attempt + answers]
       │                ├── delete_quiz_atomic()         [Atomic cascade delete]
       │                ├── delete_attempt_atomic()      [Atomic attempt removal]
       │                └── record_pin_rate_limit_outcome() [Atomic row-level lock rate window]
       │
       └──> [lib/quiz/security.ts] ──> SHA-256 creator_token_hash + scrypt pin_hash + IP extraction
```

---

## 3. Database Schema & SQL Migration

Version-controlled SQL migration created at:  
[`supabase/migrations/20261014000001_create_quiz_schema.sql`](file:///c:/Users/Fahad%20Saleem/Downloads/Couple%20quiz/supabase/migrations/20261014000001_create_quiz_schema.sql)

### Logical Tables
1. **`quizzes`**:
   - `id`: Primary key text (`q_<timestamp>_<entropy>`)
   - `slug`: Human-readable clean URL slug
   - `creator_name`: Sanitized creator name
   - `gender`: Restricted by `CHECK (gender IN ('male', 'female'))`
   - `country`: Two-letter country code
   - `theme`: Theme identifier (e.g. `dont_block_me`)
   - `pin_hash`: Salted scrypt PIN hash
   - `creator_token_hash`: SHA-256 digest of creator token (plaintext token is never stored in DB)
   - `created_at`: `TIMESTAMPTZ` with `DEFAULT now()`
   - `created_at_ms`: `BIGINT` epoch milliseconds for deterministic cross-runtime sorting
2. **`quiz_questions`**:
   - `id`: `UUID` primary key
   - `quiz_id`: Foreign key referencing `quizzes(id)` with `ON DELETE CASCADE`
   - `question_id`: Text identifier (e.g. `q1`)
   - `question_text`: Text
   - `emoji`: Optional icon
   - `options`: `JSONB` array of `{ id, text, emoji }`
   - `correct_option_id`: `SMALLINT`
   - `display_order`: `SMALLINT`
   - Constraint: `UNIQUE (quiz_id, question_id)`
3. **`quiz_attempts`**:
   - `id`: Primary key text (`att_<timestamp>_<entropy>`)
   - `quiz_id`: Foreign key referencing `quizzes(id)` with `ON DELETE CASCADE`
   - `player_name`: Text
   - `score`: `SMALLINT CHECK (score >= 0)`
   - `total_questions`: `SMALLINT CHECK (total_questions >= 0)`
   - `created_at_ms`: `BIGINT`
   - Index: Compound index on `(quiz_id, score DESC, created_at_ms ASC, id ASC)`
4. **`quiz_attempt_answers`**:
   - `id`: `UUID` primary key
   - `attempt_id`: Foreign key referencing `quiz_attempts(id)` with `ON DELETE CASCADE`
   - `question_id`: Text
   - `selected_option_id`: `SMALLINT`
   - `is_correct`: `BOOLEAN`
   - Constraint: `UNIQUE (attempt_id, question_id)`
5. **`creator_auth_rate_limits`**:
   - `rate_key`: Primary key text (`ratelimit:pin:<client_ip>`)
   - `failed_count`: `INTEGER NOT NULL DEFAULT 0`
   - `window_expires_at`: `TIMESTAMPTZ NOT NULL`

---

## 4. Supabase Security & RLS Model

1. **Row Level Security (RLS)**:
   - RLS is explicitly enabled on all 5 tables (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
   - Default REST policies explicitly deny direct access to the `public` and `anon` roles (`USING (false)`).
   - This ensures public/anonymous API clients cannot query tables directly via PostgREST to harvest PIN hashes, correct answers, or creator tokens.
2. **Server-Side Authorization**:
   - All backend database operations execute exclusively server-side using `@supabase/supabase-js` configured with `SUPABASE_SERVICE_ROLE_KEY`.
   - The service role key is **never** prefixed with `NEXT_PUBLIC_` and is never exposed to client bundles, browser cookies, URLs, or API responses.
3. **Stored Procedure Security**:
   - All stored procedures (`save_quiz_with_questions`, `record_quiz_attempt`, `record_pin_rate_limit_outcome`, etc.) are declared with:
     - `SECURITY DEFINER`
     - Fixed `SET search_path = public, pg_temp` to prevent search path hijacking.
4. **Server-Side Scoring Privacy**:
   - Correct answers are strictly evaluated server-side.
   - Public endpoint `GET /api/quiz/[id]` deliberately omits `correctOptionId`, `pinHash`, and `creatorToken`.
   - Public scoreboard `GET /api/quiz/[id]/scoreboard` returns only player names, scores, and status badges without answer records.

---

## 5. Backend Files Changed / Created

* [`supabase/migrations/20261014000001_create_quiz_schema.sql`](file:///c:/Users/Fahad%20Saleem/Downloads/Couple%20quiz/supabase/migrations/20261014000001_create_quiz_schema.sql): Version-controlled SQL migration.
* [`lib/quiz/supabase.ts`](file:///c:/Users/Fahad%20Saleem/Downloads/Couple%20quiz/lib/quiz/supabase.ts): Server-side Supabase client, typed database queries, RPC execution, and in-memory mock for unit tests.
* [`lib/quiz/storage.ts`](file:///c:/Users/Fahad%20Saleem/Downloads/Couple%20quiz/lib/quiz/storage.ts): Migrated persistence layer to Supabase PostgreSQL while preserving API contracts and multi-instance concurrency semantics.
* [`lib/quiz/security.ts`](file:///c:/Users/Fahad%20Saleem/Downloads/Couple%20quiz/lib/quiz/security.ts): Migrated distributed rate limiting from Redis to PostgreSQL RPC; added `hashCreatorToken` and constant-time `verifyCreatorToken`.
* [`scripts/migrate-legacy-data.ts`](file:///c:/Users/Fahad%20Saleem/Downloads/Couple%20quiz/scripts/migrate-legacy-data.ts): Safe, idempotent migration script with validation and `--dry-run` flag.
* [`tests/supabase.integration.test.ts`](file:///c:/Users/Fahad%20Saleem/Downloads/Couple%20quiz/tests/supabase.integration.test.ts): Real Supabase disposable integration suite.
* [`tests/quiz.test.ts`](file:///c:/Users/Fahad%20Saleem/Downloads/Couple%20quiz/tests/quiz.test.ts): Updated Task 1–5 test suites to use Supabase mock store.
* [`tests/foundation.test.ts`](file:///c:/Users/Fahad%20Saleem/Downloads/Couple%20quiz/tests/foundation.test.ts): Comprehensive acceptance test suite for Supabase architecture.
* [`tests/setup.mjs`](file:///c:/Users/Fahad%20Saleem/Downloads/Couple%20quiz/tests/setup.mjs): Strips Supabase and Redis credentials to ensure isolated unit tests.
* [`package.json`](file:///c:/Users/Fahad%20Saleem/Downloads/Couple%20quiz/package.json): Added `@supabase/supabase-js`, `test:supabase`, and `migrate:legacy` scripts.
* [`.env.example`](file:///c:/Users/Fahad%20Saleem/Downloads/Couple%20quiz/.env.example): Documented `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and trusted proxy settings.

---

## 6. Full Regression Verification Results

### Summary Table

| Check | Command | Status | Output Details |
| :--- | :--- | :--- | :--- |
| **Typecheck** | `npm run typecheck` | **PASS** | `tsc --noEmit` exited with code 0 (0 errors) |
| **Lint** | `npm run lint` | **PASS** | `eslint .` exited with code 0 (0 errors, 0 warnings) |
| **Unit Tests** | `npm test` | **PASS** | 18 passed, 0 failed, 2 skipped (3.3s) |
| **Real Supabase Integration** | `npm run test:supabase` | **SKIPPED** | Skipped gracefully (missing disposable credentials) |
| **Production Build** | `npm run build` | **PASS** | Next.js 15.5.27 production build succeeded |
| **Production Audit** | `npm audit --omit=dev` | **PASS** | **0 vulnerabilities** |

### Exact Command Outputs

1. **`npm run typecheck`**
   ```text
   > couple-quiz@0.1.0 typecheck
   > tsc --noEmit
   [Exit code: 0]
   ```

2. **`npm run lint`**
   ```text
   > couple-quiz@0.1.0 lint
   > eslint .
   [Exit code: 0]
   ```

3. **`npm test`**
   ```text
   > couple-quiz@0.1.0 test
   > node --import ./tests/setup.mjs --import tsx --test "tests/*.test.ts"

   ✔ mock opt-in activates Supabase branch, never activates in production (9.02ms)
   ✔ Supabase mock models atomic RPC operations and cascades accurately (9.45ms)
   ✔ 32 simultaneous writes persist across independent storage instances (47.74ms)
   ✔ deletion reports missing IDs and already-deleted quizzes truthfully (2.78ms)
   ✔ local persistence failure does not mutate cache or report a successful delete (15.29ms)
   ✔ proxy identity rejects spoofed headers and normalizes IPv4/IPv6 (18.62ms)
   ✔ fixed Supabase failure window blocks sixth failure and does not extend or charge successes (498.16ms)
   ✔ 40 concurrent spoofed brute-force requests share one atomic failure allowance (2567.92ms)
   ✔ authentication fails closed on query and clear errors in production (32.99ms)
   ✔ API create, answer, scoreboard, private details, deletion and repeat deletion (84.16ms)
   ✔ API concurrent wrong authentication returns five 403s then 429s (643.63ms)
   ✔ API returns 503 on Supabase failure (48.19ms)
   ✔ Data migration utility: dry-run, validation, and idempotent import (14.40ms)
   ✔ Task 1: Quiz Skip & Deck State Machine Progression (8.29ms)
   ✔ Task 2: Cryptographically Secure Unique Identifiers (44.79ms)
   ✔ Task 3: Supabase Concurrency & Atomic Operations (147.85ms)
   ✔ Task 4: Distributed Rate Limiting & Safe IP Extraction (109.25ms)
   ✔ Task 5: Quiz & Scoreboard Privacy & Storage Recovery (104.52ms)
   ﹣ REAL REDIS integration (2.32ms) # Requires explicit opt-in
   ﹣ REAL SUPABASE integration (3.57ms) # Requires explicit opt-in
   ℹ tests 20 | pass 18 | fail 0 | skipped 2
   [Exit code: 0]
   ```

4. **`npm run build`**
   ```text
   > couple-quiz@0.1.0 build
   > next build

      ▲ Next.js 15.5.27
      Creating an optimized production build ...
    ✓ Compiled successfully in 8.2s
      Linting and checking validity of types ...
      Collecting page data ...
      Generating static pages (6/6)
      Finalizing page optimization ...
      Collecting build traces ...
   [Exit code: 0 — All routes dynamic & static compiled cleanly]
   ```

5. **`npm audit --omit=dev`**
   ```text
   found 0 vulnerabilities
   ```

---

## 7. Real Supabase Integration Status: BLOCKED

In accordance with explicit instructions, real Supabase integration was **not simulated or fabricated**.

* **Status**: **`BLOCKED (Missing Credentials)`**
* **Output**:
  ```text
  ﹣ REAL SUPABASE integration: concurrent writes, cross-instance deletion, RPC rate limiting, and cascades (3.57ms) # Requires explicit opt-in and a disposable Supabase test project (QUIZ_SUPABASE_INTEGRATION=1, QUIZ_TEST_SUPABASE_URL, QUIZ_TEST_SUPABASE_SERVICE_ROLE_KEY)
  ```
* **Configuration Required to Unblock**:
  ```bash
  export QUIZ_SUPABASE_INTEGRATION=1
  export QUIZ_TEST_SUPABASE_URL="https://<disposable-test-project>.supabase.co"
  export QUIZ_TEST_SUPABASE_SERVICE_ROLE_KEY="<disposable-service-role-key>"
  npm run test:supabase
  ```

---

## 8. Legacy Data Migration Plan & Execution

* **Utility**: `scripts/migrate-legacy-data.ts` (runnable via `npm run migrate:legacy`).
* **Execution Status**:
  ```text
  > couple-quiz@0.1.0 migrate:legacy -- --dry-run
  [Migration] No legacy data file found at: .../data/quizzes-store.json
  [Migration] Legacy migration procedure unexecuted (no data to import).
  ```
* **Findings**: Workspace confirmed clean; no existing legacy JSON file or live Redis database found. The import procedure was reported as unexecuted rather than falsely claiming data migration success.

---

## 9. Vercel Preview Configuration Requirements

To configure Vercel Preview deployments for this branch:
1. In the Vercel Project Settings $\rightarrow$ Environment Variables:
   - `SUPABASE_URL`: Point to a dedicated Supabase staging/preview project URL (do NOT use production).
   - `SUPABASE_SERVICE_ROLE_KEY`: Staging service role key.
   - `QUIZ_TRUSTED_PROXY`: (Optional) Leave unset on Vercel as `VERCEL=1` is injected automatically by Vercel infrastructure.
2. Build Safety: Verified that when database credentials are not present during build, `next build` still succeeds without crashing static page generation.

---

## 10. Relationship to PR #1 and PR #2

* **PR #1 (`codex/phase-1-3-foundation`)**: The foundation PR is fully preserved and remains open/unmerged. This Phase 1.6 branch is based directly on its latest commit (`0399287`).
* **PR #2 (`feature/phase-2-homepage`)**: The Phase 2 homepage branch was not modified or overwritten.
* **Integration Sequence**:
  1. Review and approve PR #1 (foundation security).
  2. Review and merge this migration PR (`feature/phase-1-6-supabase`) into foundation or main.
  3. Rebase `feature/phase-2-homepage` onto the merged backend foundation so homepage features consume the Supabase PostgreSQL backend.

---

## 11. Git Branch Status

* **Current Branch**: `feature/phase-1-6-supabase`
* **Target PR Base**: `codex/phase-1-3-foundation` (PR #1)
* **Status**: Ready for independent review.
