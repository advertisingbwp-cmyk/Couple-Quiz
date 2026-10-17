import test from "node:test";
import assert from "node:assert/strict";
import { buildContentSecurityPolicy } from "@/next.config.mjs";
import { readJsonWithLimit } from "@/lib/quiz/requestBody";
import { POST as createQuiz } from "@/app/api/quiz/route";
import { POST as submitAttempt } from "@/app/api/quiz/[id]/attempt/route";
import { POST as unlockScoreboard, DELETE as deleteAttempt } from "@/app/api/quiz/[id]/scoreboard/route";
import { DELETE as deleteQuiz } from "@/app/api/quiz/[id]/route";

test("Phase 8.1 Finding 1: Content Security Policy separates dev and prod environments", () => {
  // Production CSP: strictly removes 'unsafe-eval'
  const prodCsp = buildContentSecurityPolicy(false);
  assert.ok(
    !prodCsp.includes("'unsafe-eval'"),
    "Production CSP must NEVER contain 'unsafe-eval'"
  );
  assert.ok(
    prodCsp.includes("script-src 'self' 'unsafe-inline'"),
    "Production CSP must specify script-src 'self' 'unsafe-inline'"
  );
  assert.ok(prodCsp.includes("default-src 'self'"), "CSP must include default-src 'self'");
  assert.ok(prodCsp.includes("object-src 'none'"), "CSP must block object tags with object-src 'none'");
  assert.ok(prodCsp.includes("frame-ancestors 'none'"), "CSP must prevent framing with frame-ancestors 'none'");
  assert.ok(prodCsp.includes("base-uri 'self'"), "CSP must restrict base-uri to 'self'");
  assert.ok(prodCsp.includes("form-action 'self'"), "CSP must restrict form submissions to 'self'");

  // Development CSP: permits 'unsafe-eval' for Fast Refresh / source maps
  const devCsp = buildContentSecurityPolicy(true);
  assert.ok(
    devCsp.includes("'unsafe-eval'"),
    "Development CSP permits 'unsafe-eval' for Webpack HMR"
  );
});

test("Phase 8.1 Finding 2: readJsonWithLimit handles valid JSON", async () => {
  const payload = { test: "valid", count: 42 };
  const req = new Request("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await readJsonWithLimit<{ test: string; count: number }>(req, 1024);
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.test, "valid");
    assert.equal(result.data.count, 42);
  }
});

test("Phase 8.1 Finding 2: readJsonWithLimit rejects oversized payload with Content-Length (HTTP 413)", async () => {
  const req = new Request("http://localhost/test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": "100000",
    },
    body: JSON.stringify({ a: "x".repeat(100000) }),
  });

  const result = await readJsonWithLimit(req, 1024);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.status, 413);
    assert.ok(result.error.includes("Payload too large"));
  }
});

test("Phase 8.1 Finding 2: readJsonWithLimit rejects oversized payload WITHOUT Content-Length header (HTTP 413)", async () => {
  // Create a ReadableStream without setting Content-Length
  const largeData = new TextEncoder().encode(JSON.stringify({ huge: "x".repeat(5000) }));
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(largeData);
      controller.close();
    },
  });

  const req = new Request("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: stream,
    // @ts-expect-error duplex required by node fetch for stream body
    duplex: "half",
  });

  const result = await readJsonWithLimit(req, 1024);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.status, 413);
    assert.ok(result.error.includes("Payload too large"));
  }
});

test("Phase 8.1 Finding 2: readJsonWithLimit cancels chunked streaming transfer immediately when byte limit exceeded", async () => {
  let streamCancelled = false;
  const chunk1 = new TextEncoder().encode('{"stream": "');
  const chunk2 = new TextEncoder().encode("a".repeat(2000));
  const chunk3 = new TextEncoder().encode('"}');

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(chunk1);
      controller.enqueue(chunk2);
      controller.enqueue(chunk3);
      controller.close();
    },
    cancel() {
      streamCancelled = true;
    },
  });

  const req = new Request("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: stream,
    // @ts-expect-error duplex required
    duplex: "half",
  });

  const result = await readJsonWithLimit(req, 500);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.status, 413);
  }
  assert.equal(streamCancelled, true, "ReadableStream must be explicitly cancelled when threshold exceeded");
});

test("Phase 8.1 Finding 2: readJsonWithLimit handles incorrect/forged Content-Length header (HTTP 413)", async () => {
  // Attacker sends Content-Length: 10, but actual stream sends 5000 bytes
  const largeData = new TextEncoder().encode(JSON.stringify({ forged: "x".repeat(5000) }));
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(largeData);
      controller.close();
    },
  });

  const req = new Request("http://localhost/test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": "10",
    },
    body: stream,
    // @ts-expect-error duplex required by node fetch for stream body
    duplex: "half",
  });

  const result = await readJsonWithLimit(req, 1024);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.status, 413);
  }
});

test("Phase 8.1 Finding 2: readJsonWithLimit handles malformed Content-Length safely", async () => {
  // Malformed non-numeric Content-Length header
  const validData = JSON.stringify({ key: "val" });
  const req = new Request("http://localhost/test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": "not-a-number-xyz",
    },
    body: validData,
  });

  const result = await readJsonWithLimit<{ key: string }>(req, 1024);
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.key, "val");
  }
});

test("Phase 8.1 Finding 2: readJsonWithLimit rejects malformed JSON with HTTP 400", async () => {
  const req = new Request("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{ broken json: true,",
  });

  const result = await readJsonWithLimit(req, 1024);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.status, 400);
    assert.equal(result.error, "Invalid JSON format.");
  }
});

test("Phase 8.1 Finding 2: readJsonWithLimit rejects empty or non-object payloads with HTTP 400", async () => {
  // Empty body
  const emptyReq = new Request("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "   ",
  });
  const emptyRes = await readJsonWithLimit(emptyReq, 1024);
  assert.equal(emptyRes.success, false);
  if (!emptyRes.success) {
    assert.equal(emptyRes.status, 400);
  }

  // Array instead of object
  const arrayReq = new Request("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "[1, 2, 3]",
  });
  const arrayRes = await readJsonWithLimit(arrayReq, 1024);
  assert.equal(arrayRes.success, false);
  if (!arrayRes.success) {
    assert.equal(arrayRes.status, 400);
  }
});

test("Phase 8.1 Finding 2: readJsonWithLimit enforces exact boundary sizes", async () => {
  const maxBytes = 100;
  // Construct payload with exact length
  const prefix = '{"msg":"';
  const suffix = '"}';
  const paddingNeeded = maxBytes - prefix.length - suffix.length;
  const exactPayload = prefix + "a".repeat(paddingNeeded) + suffix;

  assert.equal(Buffer.byteLength(exactPayload, "utf-8"), maxBytes);

  // Exact boundary should succeed
  const exactReq = new Request("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: exactPayload,
  });
  const exactRes = await readJsonWithLimit(exactReq, maxBytes);
  assert.equal(exactRes.success, true);

  // maxBytes + 1 must fail with 413
  const overPayload = prefix + "a".repeat(paddingNeeded + 1) + suffix;
  const overReq = new Request("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: overPayload,
  });
  const overRes = await readJsonWithLimit(overReq, maxBytes);
  assert.equal(overRes.success, false);
  if (!overRes.success) {
    assert.equal(overRes.status, 413);
  }
});

test("Phase 8.1 Finding 2: API routes consistently enforce payload size limits (HTTP 413)", async () => {
  const hugePayload = JSON.stringify({ data: "x".repeat(120 * 1024) });

  // 1. POST /api/quiz (limit 100KB)
  const quizReq = new Request("http://localhost/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: hugePayload,
  });
  const quizRes = await createQuiz(quizReq);
  assert.equal(quizRes.status, 413);

  // 2. POST /api/quiz/[id]/attempt (limit 64KB)
  const attemptReq = new Request("http://localhost/api/quiz/q123/attempt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: hugePayload,
  });
  const attemptRes = await submitAttempt(attemptReq, {
    params: Promise.resolve({ id: "q123" }),
  });
  assert.equal(attemptRes.status, 413);

  // 3. POST /api/quiz/[id]/scoreboard (limit 32KB)
  const sbReq = new Request("http://localhost/api/quiz/q123/scoreboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: hugePayload,
  });
  const sbRes = await unlockScoreboard(sbReq, {
    params: Promise.resolve({ id: "q123" }),
  });
  assert.equal(sbRes.status, 413);

  // 4. DELETE /api/quiz/[id] (limit 32KB)
  const delQuizReq = new Request("http://localhost/api/quiz/q123", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: hugePayload,
  });
  const delQuizRes = await deleteQuiz(delQuizReq, {
    params: Promise.resolve({ id: "q123" }),
  });
  assert.equal(delQuizRes.status, 413);

  // 5. DELETE /api/quiz/[id]/scoreboard (limit 32KB)
  const delAttemptReq = new Request("http://localhost/api/quiz/q123/scoreboard", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: hugePayload,
  });
  const delAttemptRes = await deleteAttempt(delAttemptReq, {
    params: Promise.resolve({ id: "q123" }),
  });
  assert.equal(delAttemptRes.status, 413);
});

test("Phase 8.1 Finding 2: API routes consistently reject malformed JSON with HTTP 400", async () => {
  const malformed = "{ broken: json";

  const quizReq = new Request("http://localhost/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: malformed,
  });
  const quizRes = await createQuiz(quizReq);
  assert.equal(quizRes.status, 400);

  const attemptReq = new Request("http://localhost/api/quiz/q123/attempt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: malformed,
  });
  const attemptRes = await submitAttempt(attemptReq, {
    params: Promise.resolve({ id: "q123" }),
  });
  assert.equal(attemptRes.status, 400);

  const sbReq = new Request("http://localhost/api/quiz/q123/scoreboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: malformed,
  });
  const sbRes = await unlockScoreboard(sbReq, {
    params: Promise.resolve({ id: "q123" }),
  });
  assert.equal(sbRes.status, 400);

  const delQuizReq = new Request("http://localhost/api/quiz/q123", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: malformed,
  });
  const delQuizRes = await deleteQuiz(delQuizReq, {
    params: Promise.resolve({ id: "q123" }),
  });
  assert.equal(delQuizRes.status, 400);

  const delAttemptReq = new Request("http://localhost/api/quiz/q123/scoreboard", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: malformed,
  });
  const delAttemptRes = await deleteAttempt(delAttemptReq, {
    params: Promise.resolve({ id: "q123" }),
  });
  assert.equal(delAttemptRes.status, 400);
});
