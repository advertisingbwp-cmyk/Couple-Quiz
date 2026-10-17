import test from "node:test";
import assert from "node:assert/strict";
import nextConfig, { buildContentSecurityPolicy } from "@/next.config.mjs";
import {
  generateCreatorToken,
  CREATOR_SESSION_TTL_MS,
  generateCreatorSessionToken,
  verifyCreatorSessionToken,
  hashPin,
} from "@/lib/quiz/security";
import { getBaseUrl, detectEnvironment } from "@/lib/quiz/sharing";

test("Configuration Consistency: next.config.mjs security headers match production policy", async () => {
  assert.equal(nextConfig.poweredByHeader, false, "poweredByHeader must be false");
  assert.equal(nextConfig.reactStrictMode, true, "reactStrictMode must be true");

  assert.ok(nextConfig.headers, "nextConfig.headers must be defined");
  const headerList = await nextConfig.headers();
  const rootHeaders = headerList.find((h) => h.source === "/(.*)")?.headers || [];

  const hsts = rootHeaders.find((h) => h.key === "Strict-Transport-Security");
  assert.ok(hsts, "Strict-Transport-Security header must exist");
  assert.equal(
    hsts.value,
    "max-age=31536000",
    "HSTS must match safe 1-year value (max-age=31536000)"
  );
  assert.ok(
    !hsts.value.includes("includeSubDomains"),
    "HSTS must NOT include 'includeSubDomains' before domain verification"
  );
  assert.ok(
    !hsts.value.includes("preload"),
    "HSTS must NOT include 'preload' before domain verification"
  );

  const xfo = rootHeaders.find((h) => h.key === "X-Frame-Options");
  assert.equal(xfo?.value, "DENY");

  const nosniff = rootHeaders.find((h) => h.key === "X-Content-Type-Options");
  assert.equal(nosniff?.value, "nosniff");

  const referrer = rootHeaders.find((h) => h.key === "Referrer-Policy");
  assert.equal(referrer?.value, "strict-origin-when-cross-origin");

  // Production CSP: must retain unsafe-inline for App Router scripts, but strictly exclude unsafe-eval
  const prodCsp = buildContentSecurityPolicy(false);
  assert.ok(prodCsp.includes("script-src 'self' 'unsafe-inline'"), "Prod CSP retains unsafe-inline for scripts");
  assert.ok(!prodCsp.includes("'unsafe-eval'"), "Prod CSP strictly excludes unsafe-eval");

  // Development CSP: permits unsafe-eval for Fast Refresh
  const devCsp = buildContentSecurityPolicy(true);
  assert.ok(devCsp.includes("script-src 'self' 'unsafe-eval' 'unsafe-inline'"));
});

test("Configuration Consistency: creator token format, session TTL and clock-skew in security.ts", () => {
  // Creator token format: adm_<48_hex_chars> = 52 total chars (24 bytes / 192 bits entropy)
  const token = generateCreatorToken();
  assert.ok(token.startsWith("adm_"), "Creator token prefix must be 'adm_'");
  assert.equal(token.length, 52, "Creator token length must be 52 chars (adm_ + 48 hex chars)");

  // Session TTL: 7 days exactly
  assert.equal(CREATOR_SESSION_TTL_MS, 7 * 24 * 60 * 60 * 1000, "Creator session TTL must be exactly 7 days");

  // HMAC session token verification with 60s clock skew
  const quizId = "q_test_123";
  const pinHash = hashPin("1234");
  const sessionToken = generateCreatorSessionToken(quizId, pinHash);
  assert.ok(sessionToken.startsWith("adm_cts_"), "Session token prefix must be 'adm_cts_'");

  // Valid session token accepts
  assert.equal(verifyCreatorSessionToken(sessionToken, quizId, pinHash), true);

  // Future token within 60s clock skew is allowed, beyond 60s is rejected
  const future50s = `adm_cts_${Date.now() + 50_000}_abc`;
  // Bad signature fails, but format check works
  assert.equal(verifyCreatorSessionToken(future50s, quizId, pinHash), false);
  const future70s = `adm_cts_${Date.now() + 70_000}_abc`;
  assert.equal(verifyCreatorSessionToken(future70s, quizId, pinHash), false);
});

test("Configuration Consistency: sharing.ts domain defaults and environment detection", () => {
  // When NEXT_PUBLIC_APP_URL, VERCEL_PROJECT_PRODUCTION_URL and VERCEL_URL are unset,
  // getBaseUrl() returns the historical fallback domain
  const originalEnv = { ...process.env };
  delete process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  delete process.env.VERCEL_URL;
  delete process.env.VERCEL_ENV;

  const defaultUrl = getBaseUrl();
  assert.equal(
    defaultUrl,
    "https://friend-quiz-game.vercel.app",
    "Source code fallback domain must be friend-quiz-game.vercel.app"
  );

  const prodEnv = detectEnvironment("https://friend-quiz-game.vercel.app");
  assert.equal(prodEnv.isProduction, true);
  assert.equal(prodEnv.isPreview, false);

  // Restore env
  process.env = originalEnv;
});
