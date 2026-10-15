import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as createQuiz } from "@/app/api/quiz/route";
import { GET as getOgImage } from "@/app/api/og/quiz/[id]/route";
import { generateMetadata as generatePlayMetadata } from "@/app/quiz/play/[id]/layout";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { DEFAULT_QUIZ_QUESTIONS } from "@/lib/quiz/questions";
import { _enableMockSupabase } from "@/lib/quiz/supabase";
import {
  getBaseUrl,
  getChallengeUrl,
  sanitizeCreatorName,
  formatWhatsAppQuizShare,
  formatWhatsAppResultShare,
  formatWhatsAppScoreboardShare,
  getWhatsAppShareUrl,
  getFacebookShareUrl,
  buildQuizPlayMetadata,
  detectEnvironment,
} from "@/lib/quiz/sharing";

beforeEach(() => {
  _enableMockSupabase(true);
});

afterEach(() => {
  _enableMockSupabase(false);
});

test("Phase 7: getBaseUrl, getChallengeUrl, and sanitizeCreatorName", () => {
  // Canonical base URL resolution
  const defaultUrl = getBaseUrl();
  assert.ok(defaultUrl.startsWith("http"), "Base URL must be valid HTTP(S) URL");

  // Challenge URL formatting points strictly to /quiz/play/[id]
  const challengeUrl = getChallengeUrl("quiz_abc123");
  assert.equal(challengeUrl, `${defaultUrl}/quiz/play/quiz_abc123`);
  assert.ok(!challengeUrl.includes("token"), "Must never include token parameter");
  assert.ok(!challengeUrl.includes("pin"), "Must never include PIN parameter");

  // Creator name sanitization
  assert.equal(sanitizeCreatorName("Ayesha"), "Ayesha");
  assert.equal(sanitizeCreatorName("  Hamza  \n\t"), "Hamza");
  assert.equal(sanitizeCreatorName("<script>alert('xss')</script>Bilal"), "alert('xss')Bilal");
  assert.equal(sanitizeCreatorName("A".repeat(50)), "A".repeat(30), "Must clamp length to max 30 chars");
  assert.equal(sanitizeCreatorName(""), "Your Friend", "Fallback on empty string");
  assert.equal(sanitizeCreatorName(null), "Your Friend", "Fallback on null");
  assert.equal(sanitizeCreatorName(undefined), "Your Friend", "Fallback on undefined");
  assert.equal(sanitizeCreatorName("\u0000\u001F"), "Your Friend", "Fallback on control chars only");
});

test("Phase 7: WhatsApp and Social Share Message Formatting", () => {
  const quizId = "q_share_test_123";
  const origin = "https://clickandclique.test";

  // 1. Creator Share Message
  const creatorMsg = formatWhatsAppQuizShare("Ayesha <Admin>", quizId, origin);
  assert.ok(creatorMsg.includes("Ayesha"), "Must preserve clean text");
  assert.ok(!creatorMsg.includes("<Admin>"), "Must strip HTML tag");
  assert.ok(creatorMsg.includes("https://clickandclique.test/quiz/play/q_share_test_123"));
  assert.ok(!creatorMsg.includes("token"), "No token in creator share message");
  assert.ok(!creatorMsg.includes("pin"), "No PIN in creator share message");

  // WhatsApp link encoding
  const waCreatorUrl = getWhatsAppShareUrl(creatorMsg);
  assert.ok(waCreatorUrl.startsWith("https://api.whatsapp.com/send?text="));
  assert.ok(waCreatorUrl.includes(encodeURIComponent(creatorMsg)));

  // 2. Player Result Share Message
  const resultMsg = formatWhatsAppResultShare("Fatima", 9, 10, quizId, origin);
  assert.ok(resultMsg.includes("9/10"));
  assert.ok(resultMsg.includes("Fatima"));
  assert.ok(resultMsg.includes("https://clickandclique.test/quiz/play/q_share_test_123"));

  // 3. Leaderboard Share Message
  const boardEntries = [
    { playerName: "Ali", score: 10, totalQuestions: 10 },
    { playerName: "Zainab", score: 8, totalQuestions: 10 },
  ];
  const boardMsg = formatWhatsAppScoreboardShare("Hassan", boardEntries, quizId, origin);
  assert.ok(boardMsg.includes("🥇 Ali: 10/10 pts"));
  assert.ok(boardMsg.includes("🥈 Zainab: 8/10 pts"));
  assert.ok(boardMsg.includes("https://clickandclique.test/quiz/play/q_share_test_123"));

  // 4. Facebook Share Link
  const fbUrl = getFacebookShareUrl(getChallengeUrl(quizId, origin));
  assert.equal(
    fbUrl,
    "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fclickandclique.test%2Fquiz%2Fplay%2Fq_share_test_123"
  );
});

test("Phase 7: Dynamic Open Graph Metadata Generation", async () => {
  const tenQuestions = DEFAULT_QUIZ_QUESTIONS.slice(0, 10).map((q) => ({
    questionId: q.id,
    correctOptionId: q.options[0].id,
  }));

  // Create real mock quiz
  const createReq = new NextRequest("http://localhost:3000/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creatorName: "Ayesha Malik",
      gender: "female",
      secretPin: "4567",
      questions: tenQuestions,
    }),
  });
  const createRes = await createQuiz(createReq);
  const { quizId } = await createRes.json();
  assert.ok(quizId);

  // Generate metadata for valid quiz
  const meta = await generatePlayMetadata({
    params: Promise.resolve({ id: quizId }),
  });

  assert.equal(meta.title, "How well do you know Ayesha Malik? 💖 | Click & Clique");
  assert.ok(String(meta.description).includes("Ayesha Malik"));
  assert.ok(String(meta.description).includes("10-question friendship challenge"));

  // Open Graph validation
  const og = meta.openGraph as Record<string, unknown> | undefined;
  assert.ok(og);
  assert.equal(og?.title, "How well do you know Ayesha Malik? 💖 | Click & Clique");
  assert.equal(og?.siteName, "Click & Clique");
  assert.equal(og?.type, "website");
  assert.ok(Array.isArray(og?.images));
  const ogImage = (og?.images as Array<{ url: string; width: number; height: number }>)[0];
  assert.ok(ogImage.url.includes(`/api/og/quiz/${quizId}`));
  assert.equal(ogImage.width, 1200);
  assert.equal(ogImage.height, 630);

  // Twitter card validation
  const tw = meta.twitter as Record<string, unknown> | undefined;
  assert.ok(tw);
  assert.equal(tw?.card, "summary_large_image");
  assert.equal(tw?.title, "How well do you know Ayesha Malik? 💖 | Click & Clique");

  // Canonical and robots
  assert.ok(String(meta.alternates?.canonical).includes(`/quiz/play/${quizId}`));
  assert.deepEqual(meta.robots, { index: false, follow: true });

  // Direct test of buildQuizPlayMetadata utility
  const directFallbackMeta = buildQuizPlayMetadata(null, "fallback_123");
  assert.equal(directFallbackMeta.title, "Friendship Challenge | Click & Clique");
  assert.deepEqual(directFallbackMeta.robots, { index: false, follow: false });

  // Missing or deleted quiz metadata fallback
  const missingMeta = await generatePlayMetadata({
    params: Promise.resolve({ id: "nonexistent_quiz_id_999" }),
  });
  assert.equal(missingMeta.title, "Friendship Challenge | Click & Clique");
  assert.deepEqual(missingMeta.robots, { index: false, follow: false });
});

test("Phase 7: Branded Open Graph Image Route (/api/og/quiz/[id])", async () => {
  const tenQuestions = DEFAULT_QUIZ_QUESTIONS.slice(0, 10).map((q) => ({
    questionId: q.id,
    correctOptionId: q.options[0].id,
  }));

  const createReq = new NextRequest("http://localhost:3000/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creatorName: "Hamza OG",
      gender: "male",
      secretPin: "8888",
      questions: tenQuestions,
    }),
  });
  const createRes = await createQuiz(createReq);
  const { quizId } = await createRes.json();

  // 1. Customized OG Image for existing quiz
  const req = new NextRequest(`http://localhost:3000/api/og/quiz/${quizId}`);
  const res = await getOgImage(req, { params: Promise.resolve({ id: quizId }) });

  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "image/png");
  assert.ok(String(res.headers.get("cache-control")).includes("max-age=900"));
  assert.ok(String(res.headers.get("cache-control")).includes("s-maxage=3600"));

  // Verify image binary body was generated
  const arrayBuffer = await res.arrayBuffer();
  assert.ok(arrayBuffer.byteLength > 1000, "PNG image buffer must be non-empty binary payload");

  // 2. Default OG Image for route /api/og/quiz/default
  const defaultReq = new NextRequest("http://localhost:3000/api/og/quiz/default");
  const defaultRes = await getOgImage(defaultReq, { params: Promise.resolve({ id: "default" }) });
  assert.equal(defaultRes.status, 200);
  assert.equal(defaultRes.headers.get("content-type"), "image/png");
  assert.ok(String(defaultRes.headers.get("cache-control")).includes("no-cache"));

  // 3. Fallback OG Image for deleted/missing quiz (must NOT cache stale deleted quiz)
  const missingReq = new NextRequest("http://localhost:3000/api/og/quiz/nonexistent_id");
  const missingRes = await getOgImage(missingReq, { params: Promise.resolve({ id: "nonexistent_id" }) });
  assert.equal(missingRes.status, 200);
  assert.equal(missingRes.headers.get("content-type"), "image/png");
  assert.ok(String(missingRes.headers.get("cache-control")).includes("no-cache"));
  assert.ok(String(missingRes.headers.get("cache-control")).includes("no-store"));
});

test("Phase 7: SEO Strategy, Robots Rules & Sitemap Generation", () => {
  // 1. Robots directives
  const robotsConfig = robots();
  assert.ok(robotsConfig.rules);
  const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;
  assert.equal(rules.userAgent, "*");
  assert.ok(Array.isArray(rules.allow));
  assert.ok(rules.allow.includes("/api/og/quiz/"), "Must explicitly permit /api/og/quiz/ for social crawlers");
  assert.ok(rules.allow.includes("/api/og/quiz"), "Must permit /api/og/quiz without trailing slash");
  assert.ok(rules.allow.includes("/"));
  assert.ok(rules.allow.includes("/quiz"));
  assert.ok(rules.allow.includes("/quiz/create"));

  assert.ok(Array.isArray(rules.disallow));
  assert.ok(rules.disallow.includes("/api/"), "Must disallow general /api/ routes");
  assert.ok(rules.disallow.includes("/quiz/share/"));
  assert.ok(rules.disallow.includes("/quiz/result/"));
  assert.ok(String(robotsConfig.sitemap).endsWith("/sitemap.xml"));

  // Path precedence simulation (RFC 9309 longest prefix match)
  const isAllowedByRobots = (path: string): boolean => {
    let longestAllow = -1;
    for (const a of rules.allow as string[]) {
      if (path.startsWith(a) && a.length > longestAllow) longestAllow = a.length;
    }
    let longestDisallow = -1;
    for (const d of rules.disallow as string[]) {
      if (path.startsWith(d) && d.length > longestDisallow) longestDisallow = d.length;
    }
    // Longest match wins; Allow wins tie
    return longestAllow >= longestDisallow;
  };

  assert.equal(isAllowedByRobots("/api/og/quiz/q_12345"), true, "/api/og/quiz/ images must be crawlable");
  assert.equal(isAllowedByRobots("/api/og/quiz/default"), true, "/api/og/quiz/default must be crawlable");
  assert.equal(isAllowedByRobots("/api/quiz"), false, "/api/quiz must be blocked by robots.txt");
  assert.equal(isAllowedByRobots("/api/quiz/123/scoreboard"), false, "/api/quiz/scoreboard must be blocked");
  assert.equal(isAllowedByRobots("/quiz/share/123"), false, "/quiz/share must be blocked");
  assert.equal(isAllowedByRobots("/quiz/result/123"), false, "/quiz/result must be blocked");
  assert.equal(isAllowedByRobots("/quiz/play/123"), true, "/quiz/play must be crawlable for social previews");

  // 2. Sitemap generation
  const sitemapConfig = sitemap();
  assert.ok(Array.isArray(sitemapConfig));
  const urls = sitemapConfig.map((item) => item.url);
  assert.ok(urls.some((u) => u.endsWith("/quiz")));
  assert.ok(urls.some((u) => u.endsWith("/quiz/create")));

  // Must NOT contain dynamic or secret quiz paths
  for (const item of sitemapConfig) {
    assert.ok(!item.url.includes("/api/"), "Sitemap must never index /api/");
    assert.ok(!item.url.includes("/share/"), "Sitemap must never index /quiz/share/");
    assert.ok(!item.url.includes("/result/"), "Sitemap must never index /quiz/result/");
    assert.ok(!item.url.includes("token"), "Sitemap must never index tokens");
  }
});

test("Phase 7.2: detectEnvironment identifies local, preview, and production environments accurately", () => {
  // Local development
  assert.equal(detectEnvironment("http://localhost:3000").environment, "development");
  assert.equal(detectEnvironment("http://127.0.0.1:3000").isLocal, true);
  assert.equal(detectEnvironment("http://my-machine.localhost:3000").isLocal, true);
  assert.equal(detectEnvironment("http://box.local:3000").isLocal, true);

  // Vercel Preview deployments (git branch, preview hashes)
  const previewGit = detectEnvironment("https://couple-quiz-git-feature-phase-7-social-sharing.vercel.app");
  assert.equal(previewGit.environment, "preview");
  assert.equal(previewGit.isPreview, true);
  assert.equal(previewGit.isProduction, false);

  const previewHash = detectEnvironment("https://couple-quiz-9ab12cd-advertisings-projects.vercel.app");
  assert.equal(previewHash.environment, "preview");
  assert.equal(previewHash.isPreview, true);

  // Production deployments
  const prodCanonical = detectEnvironment("https://couple-quiz-three.vercel.app");
  assert.equal(prodCanonical.environment, "production");
  assert.equal(prodCanonical.isProduction, true);
  assert.equal(prodCanonical.isPreview, false);
});

test("Phase 7.2: Preview-created quizzes are NEVER silently redirected to unverified Production URLs", () => {
  const previewOrigin = "https://couple-quiz-git-feature-phase-7-social-sharing.vercel.app";
  const challengeFromPreview = getChallengeUrl("q_preview_test", previewOrigin);

  // MUST keep the preview origin so testers stay in the preview environment
  assert.equal(
    challengeFromPreview,
    "https://couple-quiz-git-feature-phase-7-social-sharing.vercel.app/quiz/play/q_preview_test",
    "Must preserve preview URL for authorized testing"
  );
  assert.notEqual(
    challengeFromPreview,
    "https://couple-quiz-three.vercel.app/quiz/play/q_preview_test",
    "Must NEVER silently redirect a preview quiz to unverified production"
  );

  // Only with explicit verifiedOnProduction: true can it target production
  const verifiedProductionUrl = getChallengeUrl("q_preview_test", previewOrigin, {
    verifiedOnProduction: true,
  });
  assert.equal(
    verifiedProductionUrl,
    "https://couple-quiz-three.vercel.app/quiz/play/q_preview_test",
    "Target production ONLY when verifiedOnProduction is explicitly true"
  );
});

test("Phase 7.2: Localhost and Production URL preservation", () => {
  // Localhost origin preserved for local automation and dev
  const localOrigin = "http://localhost:3005";
  const challengeFromLocal = getChallengeUrl("q_local_test", localOrigin);
  assert.equal(
    challengeFromLocal,
    "http://localhost:3005/quiz/play/q_local_test",
    "Localhost origin preserved for local automation"
  );

  // Production URL preservation
  const prodOrigin = "https://couple-quiz-three.vercel.app";
  const challengeFromProd = getChallengeUrl("q_prod_test", prodOrigin);
  assert.equal(
    challengeFromProd,
    "https://couple-quiz-three.vercel.app/quiz/play/q_prod_test",
    "Production origin uses canonical public domain"
  );

  // Default fallback (no origin provided)
  const defaultChallenge = getChallengeUrl("q_default_test");
  assert.equal(
    defaultChallenge,
    "https://couple-quiz-three.vercel.app/quiz/play/q_default_test",
    "Fallback without origin uses canonical base domain"
  );
});

test("Phase 7.2: WhatsApp formatting adapts safely between preview and production", () => {
  const previewOrigin = "https://couple-quiz-git-feature-phase-7-social-sharing.vercel.app";
  const previewWa = formatWhatsAppQuizShare("Sara", "q_123", previewOrigin);

  // Preview WhatsApp message must indicate testing status
  assert.ok(
    previewWa.includes("Preview / Testing Environment"),
    "Preview share must declare Preview / Testing Environment"
  );
  assert.ok(
    previewWa.includes("Authorized Testers Only"),
    "Preview share must warn that access requires team credentials"
  );
  assert.ok(
    previewWa.includes(previewOrigin),
    "Preview share must link to the preview deployment"
  );
  assert.ok(
    !previewWa.includes("couple-quiz-three.vercel.app"),
    "Preview share must not leak unverified production domain"
  );

  // Production WhatsApp message contains clean social invite
  const prodOrigin = "https://couple-quiz-three.vercel.app";
  const prodWa = formatWhatsAppQuizShare("Sara", "q_123", prodOrigin);
  assert.ok(
    !prodWa.includes("Preview / Testing Environment"),
    "Production share must not show preview warnings"
  );
  assert.ok(
    prodWa.includes("✨ *Click & Clique Friendship Challenge* ✨"),
    "Production share has standard invite copy"
  );
  assert.ok(
    prodWa.includes("https://couple-quiz-three.vercel.app/quiz/play/q_123"),
    "Production share links to canonical domain"
  );
});

test("Phase 7.3: Custom-domain Preview deployments are NEVER silently classified as public Production", () => {
  // 1. Custom preview/staging subdomains
  const customPreview = detectEnvironment("https://preview.clickandclique.com");
  assert.equal(customPreview.environment, "preview", "preview.* custom domain must be preview");
  assert.equal(customPreview.isPreview, true);
  assert.equal(customPreview.isProduction, false);

  const customStaging = detectEnvironment("https://staging.cliquequiz.net");
  assert.equal(customStaging.environment, "preview", "staging.* custom domain must be preview");
  assert.equal(customStaging.isPreview, true);
  assert.equal(customStaging.isProduction, false);

  const customDev = detectEnvironment("https://dev-branch.cliquequiz.net");
  assert.equal(customDev.environment, "preview", "dev-* custom domain must be preview");
  assert.equal(customDev.isPreview, true);

  // 2. Challenge URLs on custom preview domains preserve the custom preview origin
  const customPreviewChallenge = getChallengeUrl("q_cust_prev", "https://preview.clickandclique.com");
  assert.equal(
    customPreviewChallenge,
    "https://preview.clickandclique.com/quiz/play/q_cust_prev",
    "Must preserve custom preview domain and NEVER redirect to production"
  );
  assert.notEqual(
    customPreviewChallenge,
    "https://couple-quiz-three.vercel.app/quiz/play/q_cust_prev",
    "Must NEVER leak production domain for custom preview"
  );

  // 3. VERCEL_ENV=preview with arbitrary custom host
  const originalVercelEnv = process.env.VERCEL_ENV;
  try {
    process.env.VERCEL_ENV = "preview";
    const customBranchEnv = detectEnvironment("https://arbitrary-custom-host.org");
    assert.equal(
      customBranchEnv.environment,
      "preview",
      "VERCEL_ENV=preview must classify arbitrary custom host as preview"
    );
    assert.equal(customBranchEnv.isPreview, true);
    assert.equal(customBranchEnv.isProduction, false);
  } finally {
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = originalVercelEnv;
    }
  }
});
