# Phase 1.3 — foundation remediation

Reviewed base: `63747f77b3e349793b1048e397c4e812c55830dd`.
Scope: the five verified foundation issues. No Phase 2 features or UI redesign.

## Root causes and changes

| Issue | Root cause | Implementation |
| --- | --- | --- |
| Redis tests missed Redis | Configuration ignored the test mock; tests exercised the local fallback. | Explicit mock opt-in is recognized only with NODE_ENV=test and no production deployment flags. Runtime guards also prevent a previously enabled mock from operating after the environment becomes production. Tests inspect the Redis hash and read through fresh storage instances. |
| False deletion success | Success was unconditional after transport success; local write results were ignored. | HDEL must return 1 to report removal. Atomic quiz deletion returns the quiz key's DEL count, independently of orphan attempts. Missing/repeated deletion returns false/HTTP 404. Storage/command errors throw a typed error and produce HTTP 503. Local writes replace the file before publishing the changed cache. |
| Stale cache | Quiz reads preferred memory, and an empty/failed Redis HVALS fell back to local attempts. | Configured Redis is the sole source of truth for reads and writes. Empty Redis results remain empty; failures do not fall back. Separate storage instances retain independent caches only in local development. |
| IP and rate limiting | Any supplied proxy header was trusted. Separate GET/INCR operations raced; pipeline expiry reset on every failure. | Only explicitly trusted deployment headers are considered; addresses are validated/canonicalized. Lua atomically rechecks and records an authentication outcome. First failure starts a fixed 600-second window; at five failures further requests are blocked. Successful authentication neither consumes allowance nor erases concurrent failures. Storage failure blocks authentication. |
| Mock/transport semantics | HTTP 200 was treated as command success; mock expiry was a no-op and deletion/update counts were inaccurate. | Parse command errors, malformed payloads and each pipeline reply. Mock models relevant key types, integer errors, overwrite/deletion counts, expiry and the known application Lua scripts. Pipelines are documented as transport batching, not atomic transactions. |

Attempt writes additionally check that the parent quiz still exists in the same Lua operation as HSET. A submission racing with quiz deletion cannot recreate orphan attempts afterward.

## Modified files

- `lib/quiz/redis.ts`: production guards, REST validation, timeout, mock semantics.
- `lib/quiz/redisScripts.ts`: atomic authentication, quiz deletion and attempt-write scripts.
- `lib/quiz/storage.ts`: authoritative Redis path, truthful deletion, isolated local persistence.
- `lib/quiz/security.ts`: trusted proxy identity, normalization, atomic failure limiter.
- `lib/quiz/authResponse.ts`: shared protected-route authentication response.
- `app/api/quiz/route.ts`
- `app/api/quiz/[id]/route.ts`
- `app/api/quiz/[id]/attempt/route.ts`
- `app/api/quiz/[id]/scoreboard/route.ts`: route error/status integration.
- `package.json`: noninteractive ESLint command and explicit test setup/discovery.
- `tests/setup.mjs`: isolated test mode; strips inherited production Redis credentials.
- `tests/quiz.test.ts`: existing deck/identifier/privacy tests now assert the Redis path.
- `tests/foundation.test.ts`: 17 new regression cases.
- `tests/redis.integration.test.ts`: opt-in real Redis integration case.
- This report.

## Execution evidence

On 14 October 2026:

| Command | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed; one existing anonymous-default-export warning in postcss.config.mjs |
| `npm test` | 23 tests: 22 passed, 0 failed, 1 integration test explicitly skipped |
| `npm run build` | Passed; existing metadataBase warning uses localhost for social image resolution |

The sandbox initially prevented Next build workers from spawning (EPERM); the production build was rerun outside the sandbox. No application workaround or disabled validation was used.

Executed regression coverage:

- Deck skipping, wraparound, unique answered questions and pool exhaustion.
- Quiz creation through the actual route handler and sanitized public reads.
- Answer submission, server score, public scoreboard and creator-only details.
- Correct PIN and creator token; successes do not consume or reset failure allowance.
- Sixth failed authentication is denied; fixed expiry releases the window.
- 40 concurrent wrong-PIN calls: 5 failures recorded and 35 rate-limited.
- 32 concurrent protected-route calls: 5 HTTP 403 and 27 HTTP 429.
- 32 concurrent storage submissions across independent instances, with Redis hash assertions and fresh-instance reads.
- HSET/HVALS/HDEL/DEL/GET/INCR/EXPIRE/TTL behavior, wrong types, integer errors and pipeline partial failure.
- Nonexistent attempt, repeat deletion, nonexistent quiz and orphan cleanup.
- Real local filesystem write failure and simulated failure leave cached data unchanged.
- Cross-instance quiz and leaderboard deletion; stale local caches cannot hide remote absence/errors.
- Redis HTTP errors, command errors, malformed replies, read errors and final-authentication write errors.
- Production without Redis and production with failing Redis deny authentication.
- Spoofed generic proxy headers, trusted deployment modes, invalid addresses and IPv4/IPv6 canonicalization.

These are executed domain and route-handler tests. They are not a browser/device certification or deployed-provider verification.

## Mock versus real Redis

The 22 passing tests use local logic, the explicit in-process Redis mock, or mocked REST responses. The mock implements the application's three known Lua operations; it does not execute arbitrary Lua and cannot prove actual provider Lua behavior.

No test Redis REST credentials were supplied. Redis, Docker and WSL executables were not available on the inspected PATH. Therefore real Redis integration was **not executed**, and its test is explicitly skipped rather than reported as passed.

To run against a disposable Upstash-compatible REST Redis test database:

1. Supply `QUIZ_TEST_REDIS_REST_URL` and `QUIZ_TEST_REDIS_REST_TOKEN` securely in the local/CI environment.
2. Set `QUIZ_REDIS_INTEGRATION=1`.
3. Run `npm run test:redis`.

The integration case disables the mock, performs concurrent writes from separate storage instances, checks actual Redis hash results, runs the Lua limiter concurrently, checks TTL expiry and pipeline errors, and cleans up only its randomly namespaced records. Never point it at production. No credentials are committed.

## Deployment contract and remaining risks

- Production (including NODE_ENV=production) requires configured, working Redis. Missing storage now returns an explicit failure rather than temporary-file success.
- Vercel trust is enabled only by VERCEL=1, using x-vercel-forwarded-for. Generic x-forwarded-for and x-real-ip are ignored.
- A custom Cloudflare deployment may explicitly set QUIZ_TRUSTED_PROXY=cloudflare only when the origin is restricted to Cloudflare and the edge replaces the header. The application cannot verify that network restriction itself.
- Unknown/invalid client identities share a conservative bucket. This prevents header spoofing but can rate-limit multiple legitimate users behind an unconfigured proxy. Configure the trusted ingress before production use.
- The local JSON backend is single-process development storage, not a distributed database.
- Real Redis/provider behavior, latency and deployment-specific proxy handling still require the opt-in integration test and independent review.
- Dependency installation reported 12 existing audit findings (2 moderate, 9 high, 1 critical), including a warning for Next.js 15.2.1. Dependency versions were not changed in this bounded foundation pass. This is not a claim that the whole repository is production-secure.
- Existing metadataBase and PostCSS lint warnings remain; UI/SEO redesign is outside Phase 1.3.

Pipelining semantics follow [Upstash's pipeline/transaction documentation](https://upstash.com/docs/redis/sdks/ts/pipelining/pipeline-transaction): pipeline commands can interleave. The required multi-command decisions use Lua instead.

Stop after Phase 1.3. Independent ChatGPT review is required before Phase 2; do not merge/deploy this review branch as part of this task.
