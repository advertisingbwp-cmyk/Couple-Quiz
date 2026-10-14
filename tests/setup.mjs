// Never point unit tests at an inherited production database.
if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME)
  throw new Error("Run tests in an isolated local or CI environment.");
process.env.NODE_ENV = "test";
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.QUIZ_REQUIRE_DURABLE_STORAGE;
delete process.env.QUIZ_TRUSTED_PROXY;
