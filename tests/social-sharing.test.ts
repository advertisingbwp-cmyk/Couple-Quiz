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
  assert.ok(String(res.headers.get("cache-control")).includes("max-age=3600"));

  // Verify image binary body was generated
  const arrayBuffer = await res.arrayBuffer();
  assert.ok(arrayBuffer.byteLength > 1000, "PNG image buffer must be non-empty binary payload");

  // 2. Default OG Image for route /api/og/quiz/default
  const defaultReq = new NextRequest("http://localhost:3000/api/og/quiz/default");
  const defaultRes = await getOgImage(defaultReq, { params: Promise.resolve({ id: "default" }) });
  assert.equal(defaultRes.status, 200);
  assert.equal(defaultRes.headers.get("content-type"), "image/png");

  // 3. Fallback OG Image for deleted/missing quiz
  const missingReq = new NextRequest("http://localhost:3000/api/og/quiz/nonexistent_id");
  const missingRes = await getOgImage(missingReq, { params: Promise.resolve({ id: "nonexistent_id" }) });
  assert.equal(missingRes.status, 200);
  assert.equal(missingRes.headers.get("content-type"), "image/png");
});

test("Phase 7: SEO Strategy, Robots Rules & Sitemap Generation", () => {
  // 1. Robots directives
  const robotsConfig = robots();
  assert.ok(robotsConfig.rules);
  const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;
  assert.equal(rules.userAgent, "*");
  assert.deepEqual(rules.allow, ["/", "/quiz", "/quiz/create"]);
  assert.deepEqual(rules.disallow, ["/api/", "/quiz/share/", "/quiz/result/"]);
  assert.ok(String(robotsConfig.sitemap).endsWith("/sitemap.xml"));

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
