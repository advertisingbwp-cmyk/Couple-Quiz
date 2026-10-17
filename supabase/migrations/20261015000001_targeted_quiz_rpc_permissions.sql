-- =============================================================================
-- Migration: 20261015000001_targeted_quiz_rpc_permissions.sql
-- Description: Corrective migration targeting specifically the seven quiz RPC
--              functions with least-privilege EXECUTE permissions for service_role,
--              without broad schema-wide revokes that could impact unrelated functions.
-- =============================================================================

-- 1. Explicitly revoke execution on the 7 quiz RPC functions from PUBLIC, anon, authenticated
REVOKE EXECUTE ON FUNCTION public.save_quiz_with_questions(JSONB, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_quiz_attempt(JSONB, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_quiz_atomic(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_attempt_atomic(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_pin_rate_limit(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_pin_rate_limit_outcome(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.clear_pin_rate_limit(TEXT) FROM PUBLIC, anon, authenticated;

-- 2. Grant EXECUTE strictly to service_role
GRANT EXECUTE ON FUNCTION public.save_quiz_with_questions(JSONB, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_quiz_attempt(JSONB, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_quiz_atomic(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_attempt_atomic(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_pin_rate_limit(TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_pin_rate_limit_outcome(TEXT, TEXT, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.clear_pin_rate_limit(TEXT) TO service_role;

-- 3. Confirm table privileges: private to service_role, denied to public/anon/authenticated
REVOKE ALL ON TABLE public.quizzes FROM anon, authenticated, PUBLIC;
REVOKE ALL ON TABLE public.quiz_questions FROM anon, authenticated, PUBLIC;
REVOKE ALL ON TABLE public.quiz_attempts FROM anon, authenticated, PUBLIC;
REVOKE ALL ON TABLE public.quiz_attempt_answers FROM anon, authenticated, PUBLIC;
REVOKE ALL ON TABLE public.creator_auth_rate_limits FROM anon, authenticated, PUBLIC;

GRANT ALL ON TABLE public.quizzes TO service_role;
GRANT ALL ON TABLE public.quiz_questions TO service_role;
GRANT ALL ON TABLE public.quiz_attempts TO service_role;
GRANT ALL ON TABLE public.quiz_attempt_answers TO service_role;
GRANT ALL ON TABLE public.creator_auth_rate_limits TO service_role;
