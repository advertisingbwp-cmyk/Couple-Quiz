-- =============================================================================
-- Migration: 20261014000001_create_quiz_schema.sql
-- Description: Core schema, indexes, RLS policies, and atomic RPC functions
--              for Couple & Friendship Quiz backend migration from Redis to Supabase
-- =============================================================================

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Table: quizzes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quizzes (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL,
    creator_name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    country TEXT NOT NULL DEFAULT 'PK',
    theme TEXT NOT NULL DEFAULT 'dont_block_me',
    pin_hash TEXT NOT NULL,
    creator_token_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at_ms BIGINT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_slug ON public.quizzes(slug);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON public.quizzes(created_at_ms DESC);

-- -----------------------------------------------------------------------------
-- 2. Table: quiz_questions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    emoji TEXT,
    options JSONB NOT NULL,
    correct_option_id SMALLINT NOT NULL,
    display_order SMALLINT NOT NULL,
    CONSTRAINT unique_quiz_question UNIQUE (quiz_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_order 
    ON public.quiz_questions(quiz_id, display_order ASC);

-- -----------------------------------------------------------------------------
-- 3. Table: quiz_attempts
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    score SMALLINT NOT NULL CHECK (score >= 0),
    total_questions SMALLINT NOT NULL CHECK (total_questions >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at_ms BIGINT NOT NULL
);

-- Compound index optimized for leaderboard ranking: high score first, then earliest created_at, then ID
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_leaderboard 
    ON public.quiz_attempts(quiz_id, score DESC, created_at_ms ASC, id ASC);

-- -----------------------------------------------------------------------------
-- 4. Table: quiz_attempt_answers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_attempt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id TEXT NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    selected_option_id SMALLINT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    CONSTRAINT unique_attempt_question UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_attempt 
    ON public.quiz_attempt_answers(attempt_id);

-- -----------------------------------------------------------------------------
-- 5. Table: creator_auth_rate_limits
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creator_auth_rate_limits (
    rate_key TEXT PRIMARY KEY,
    failed_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
    window_expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_creator_auth_rate_limits_expiry 
    ON public.creator_auth_rate_limits(window_expires_at);

-- -----------------------------------------------------------------------------
-- 6. Row Level Security (RLS) Configuration
-- -----------------------------------------------------------------------------
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Deny direct access to public/anon clients; privileged server uses service_role key
DROP POLICY IF EXISTS "Deny public direct access to quizzes" ON public.quizzes;
CREATE POLICY "Deny public direct access to quizzes" 
    ON public.quizzes FOR ALL TO public USING (false);

DROP POLICY IF EXISTS "Deny public direct access to quiz_questions" ON public.quiz_questions;
CREATE POLICY "Deny public direct access to quiz_questions" 
    ON public.quiz_questions FOR ALL TO public USING (false);

DROP POLICY IF EXISTS "Deny public direct access to quiz_attempts" ON public.quiz_attempts;
CREATE POLICY "Deny public direct access to quiz_attempts" 
    ON public.quiz_attempts FOR ALL TO public USING (false);

DROP POLICY IF EXISTS "Deny public direct access to quiz_attempt_answers" ON public.quiz_attempt_answers;
CREATE POLICY "Deny public direct access to quiz_attempt_answers" 
    ON public.quiz_attempt_answers FOR ALL TO public USING (false);

DROP POLICY IF EXISTS "Deny public direct access to creator_auth_rate_limits" ON public.creator_auth_rate_limits;
CREATE POLICY "Deny public direct access to creator_auth_rate_limits" 
    ON public.creator_auth_rate_limits FOR ALL TO public USING (false);

-- -----------------------------------------------------------------------------
-- 7. Atomic PostgreSQL RPC Functions
-- -----------------------------------------------------------------------------

-- Save a quiz and all questions atomically in a single transaction
CREATE OR REPLACE FUNCTION public.save_quiz_with_questions(
    p_quiz JSONB,
    p_questions JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_quiz_id TEXT;
    q RECORD;
BEGIN
    v_quiz_id := p_quiz->>'id';
    IF v_quiz_id IS NULL OR v_quiz_id = '' THEN
        RETURN FALSE;
    END IF;

    -- Prevent unauthorized quiz overwrites: enforce strict insert-only semantics.
    -- If a quiz with this ID already exists, reject the creation immediately.
    IF EXISTS (SELECT 1 FROM public.quizzes WHERE id = v_quiz_id) THEN
        RETURN FALSE;
    END IF;

    -- Strict insert quiz row
    INSERT INTO public.quizzes (
        id, slug, creator_name, gender, country, theme,
        pin_hash, creator_token_hash, created_at, created_at_ms, updated_at
    ) VALUES (
        v_quiz_id,
        p_quiz->>'slug',
        p_quiz->>'creatorName',
        p_quiz->>'gender',
        COALESCE(p_quiz->>'country', 'PK'),
        COALESCE(p_quiz->>'theme', 'dont_block_me'),
        p_quiz->>'pinHash',
        p_quiz->>'creatorTokenHash',
        to_timestamp((p_quiz->>'createdAt')::DOUBLE PRECISION / 1000.0),
        (p_quiz->>'createdAt')::BIGINT,
        now()
    );

    FOR q IN SELECT * FROM jsonb_to_recordset(p_questions) AS x(
        "questionId" TEXT,
        "question" TEXT,
        "emoji" TEXT,
        "options" JSONB,
        "correctOptionId" SMALLINT,
        "displayOrder" SMALLINT
    )
    LOOP
        INSERT INTO public.quiz_questions (
            quiz_id, question_id, question_text, emoji, options, correct_option_id, display_order
        ) VALUES (
            v_quiz_id,
            q."questionId",
            q."question",
            q."emoji",
            q."options",
            q."correctOptionId",
            q."displayOrder"
        );
    END LOOP;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
        RETURN FALSE;
END;
$$;

-- Record attempt and its answers atomically, strictly checking parent quiz existence
CREATE OR REPLACE FUNCTION public.record_quiz_attempt(
    p_attempt JSONB,
    p_answers JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_quiz_id TEXT;
    v_attempt_id TEXT;
    ans RECORD;
BEGIN
    v_quiz_id := p_attempt->>'quizId';
    v_attempt_id := p_attempt->>'id';

    -- Parent existence check is mandatory to prevent orphan attempts on concurrently deleted quizzes
    IF NOT EXISTS (SELECT 1 FROM public.quizzes WHERE id = v_quiz_id) THEN
        RETURN -1;
    END IF;

    -- Insert attempt header
    INSERT INTO public.quiz_attempts (
        id, quiz_id, player_name, score, total_questions, created_at, created_at_ms
    ) VALUES (
        v_attempt_id,
        v_quiz_id,
        p_attempt->>'playerName',
        (p_attempt->>'score')::SMALLINT,
        (p_attempt->>'totalQuestions')::SMALLINT,
        to_timestamp((p_attempt->>'createdAt')::DOUBLE PRECISION / 1000.0),
        (p_attempt->>'createdAt')::BIGINT
    )
    ON CONFLICT (id) DO NOTHING;

    IF NOT FOUND THEN
        -- Attempt already recorded
        RETURN 0;
    END IF;

    -- Insert answers
    FOR ans IN SELECT * FROM jsonb_to_recordset(p_answers) AS x(
        "questionId" TEXT,
        "selectedOptionId" SMALLINT,
        "isCorrect" BOOLEAN
    )
    LOOP
        INSERT INTO public.quiz_attempt_answers (
            attempt_id, question_id, selected_option_id, is_correct
        ) VALUES (
            v_attempt_id,
            ans."questionId",
            ans."selectedOptionId",
            ans."isCorrect"
        );
    END LOOP;

    RETURN 1;
END;
$$;

-- Atomic quiz deletion
CREATE OR REPLACE FUNCTION public.delete_quiz_atomic(
    p_quiz_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    DELETE FROM public.quizzes WHERE id = p_quiz_id;
    RETURN FOUND;
END;
$$;

-- Atomic attempt deletion
CREATE OR REPLACE FUNCTION public.delete_attempt_atomic(
    p_quiz_id TEXT,
    p_attempt_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    DELETE FROM public.quiz_attempts WHERE id = p_attempt_id AND quiz_id = p_quiz_id;
    RETURN FOUND;
END;
$$;

-- Rate limit verification (read only)
CREATE OR REPLACE FUNCTION public.check_pin_rate_limit(
    p_rate_key TEXT,
    p_max_attempts INTEGER DEFAULT 5
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_failed INTEGER;
    v_expires TIMESTAMPTZ;
BEGIN
    SELECT failed_count, window_expires_at
    INTO v_failed, v_expires
    FROM public.creator_auth_rate_limits
    WHERE rate_key = p_rate_key;

    IF NOT FOUND THEN
        RETURN TRUE;
    END IF;

    IF now() >= v_expires THEN
        RETURN TRUE;
    END IF;

    RETURN v_failed < p_max_attempts;
END;
$$;

-- Rate limit update with row-level locking (matching the Redis Lua AUTH_WINDOW_SCRIPT)
-- Returns:
--   1: allowed
--   0: limited (HTTP 429)
--  -1: invalid PIN recorded (HTTP 403)
CREATE OR REPLACE FUNCTION public.record_pin_rate_limit_outcome(
    p_rate_key TEXT,
    p_outcome TEXT,
    p_max_attempts INTEGER DEFAULT 5,
    p_window_seconds INTEGER DEFAULT 600
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_failed INTEGER;
    v_expires TIMESTAMPTZ;
    v_new_expires TIMESTAMPTZ;
BEGIN
    v_new_expires := now() + (p_window_seconds * INTERVAL '1 second');

    -- Ensure key exists
    INSERT INTO public.creator_auth_rate_limits (rate_key, failed_count, window_expires_at)
    VALUES (p_rate_key, 0, v_new_expires)
    ON CONFLICT (rate_key) DO NOTHING;

    -- Lock row for atomic decision
    SELECT failed_count, window_expires_at
    INTO v_failed, v_expires
    FROM public.creator_auth_rate_limits
    WHERE rate_key = p_rate_key
    FOR UPDATE;

    -- If previous window expired, reset counter
    IF now() >= v_expires THEN
        IF p_outcome = 'success' THEN
            UPDATE public.creator_auth_rate_limits
            SET failed_count = 0, window_expires_at = v_new_expires
            WHERE rate_key = p_rate_key;
            RETURN 1;
        ELSE
            UPDATE public.creator_auth_rate_limits
            SET failed_count = 1, window_expires_at = v_new_expires
            WHERE rate_key = p_rate_key;
            RETURN -1;
        END IF;
    END IF;

    -- Window is active
    IF v_failed >= p_max_attempts THEN
        RETURN 0; -- limited
    END IF;

    IF p_outcome = 'success' THEN
        RETURN 1; -- allowed, success does not charge or reset concurrent failures in active window
    END IF;

    -- Increment failure counter
    UPDATE public.creator_auth_rate_limits
    SET failed_count = failed_count + 1
    WHERE rate_key = p_rate_key;

    IF v_failed + 1 >= p_max_attempts THEN
        -- This was the 5th failure
        RETURN -1;
    END IF;

    RETURN -1;
END;
$$;

-- Clear rate limit
CREATE OR REPLACE FUNCTION public.clear_pin_rate_limit(
    p_rate_key TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    DELETE FROM public.creator_auth_rate_limits WHERE rate_key = p_rate_key;
END;
$$;

-- -----------------------------------------------------------------------------
-- 8. Least Privilege Permissions & RPC Access Control
-- -----------------------------------------------------------------------------

-- Revoke execution privileges targeting explicitly this project's seven quiz RPC functions
REVOKE EXECUTE ON FUNCTION public.save_quiz_with_questions(JSONB, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_quiz_attempt(JSONB, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_quiz_atomic(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_attempt_atomic(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_pin_rate_limit(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_pin_rate_limit_outcome(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.clear_pin_rate_limit(TEXT) FROM PUBLIC, anon, authenticated;

-- Grant EXECUTE only to service_role for privileged backend RPC functions
GRANT EXECUTE ON FUNCTION public.save_quiz_with_questions(JSONB, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_quiz_attempt(JSONB, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_quiz_atomic(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_attempt_atomic(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_pin_rate_limit(TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_pin_rate_limit_outcome(TEXT, TEXT, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.clear_pin_rate_limit(TEXT) TO service_role;

-- Revoke all direct table access from public, anon, and authenticated
REVOKE ALL ON TABLE public.quizzes FROM anon, authenticated, PUBLIC;
REVOKE ALL ON TABLE public.quiz_questions FROM anon, authenticated, PUBLIC;
REVOKE ALL ON TABLE public.quiz_attempts FROM anon, authenticated, PUBLIC;
REVOKE ALL ON TABLE public.quiz_attempt_answers FROM anon, authenticated, PUBLIC;
REVOKE ALL ON TABLE public.creator_auth_rate_limits FROM anon, authenticated, PUBLIC;

-- Ensure service_role has necessary table access
GRANT ALL ON TABLE public.quizzes TO service_role;
GRANT ALL ON TABLE public.quiz_questions TO service_role;
GRANT ALL ON TABLE public.quiz_attempts TO service_role;
GRANT ALL ON TABLE public.quiz_attempt_answers TO service_role;
GRANT ALL ON TABLE public.creator_auth_rate_limits TO service_role;

