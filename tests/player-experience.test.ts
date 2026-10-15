import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as createQuiz } from "@/app/api/quiz/route";
import { POST as submitAttempt } from "@/app/api/quiz/[id]/attempt/route";
import { GET as getPublicScoreboard, POST as getDetailedScoreboard } from "@/app/api/quiz/[id]/scoreboard/route";
import { DEFAULT_QUIZ_QUESTIONS } from "@/lib/quiz/questions";
import { generateAttemptId } from "@/lib/quiz/security";
import { _enableMockSupabase } from "@/lib/quiz/supabase";
import { triggerConfetti } from "@/lib/quiz/confetti";

beforeEach(() => {
  _enableMockSupabase(true);
});

afterEach(() => {
  _enableMockSupabase(false);
});

test("Phase 6: Player Attempt Idempotency & Network Retry Safety", async () => {
  const tenQuestions = DEFAULT_QUIZ_QUESTIONS.slice(0, 10).map((q) => ({
    questionId: q.id,
    correctOptionId: q.options[0].id,
  }));

  // Create a quiz
  const createReq = new NextRequest("http://localhost:3000/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creatorName: "Idempotency Host",
      gender: "female",
      secretPin: "1234",
      questions: tenQuestions,
    }),
  });
  const createRes = await createQuiz(createReq);
  const { quizId } = await createRes.json();
  assert.ok(quizId);

  // Client generates an attempt ID
  const clientAttemptId = generateAttemptId();
  const answers = tenQuestions.map((q) => ({
    questionId: q.questionId,
    selectedOptionId: q.correctOptionId,
  }));

  // 1. Initial submission succeeds
  const subReq1 = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attemptId: clientAttemptId,
      playerName: "Zara",
      answers,
    }),
  });
  const res1 = await submitAttempt(subReq1, { params: Promise.resolve({ id: quizId }) });
  assert.equal(res1.status, 200);
  const data1 = await res1.json();
  assert.equal(data1.success, true);
  assert.equal(data1.score, 10);
  assert.equal(data1.totalQuestions, 10);
  assert.equal(data1.attemptId, clientAttemptId);
  assert.equal(data1.alreadyRecorded, undefined);

  // 2. Retry / Duplicate submission with the same attemptId returns 200 with identical score and alreadyRecorded=true
  const subReq2 = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attemptId: clientAttemptId,
      playerName: "Zara",
      answers,
    }),
  });
  const res2 = await submitAttempt(subReq2, { params: Promise.resolve({ id: quizId }) });
  assert.equal(res2.status, 200);
  const data2 = await res2.json();
  assert.equal(data2.success, true);
  assert.equal(data2.score, 10);
  assert.equal(data2.alreadyRecorded, true);

  // 3. Scoreboard contains only 1 entry for Zara, not 2
  const scoreReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/scoreboard`);
  const scoreRes = await getPublicScoreboard(scoreReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(scoreRes.status, 200);
  const scoreData = await scoreRes.json();
  assert.equal(scoreData.scoreboard.length, 1);
  assert.equal(scoreData.scoreboard[0].id, clientAttemptId);
  assert.equal(scoreData.scoreboard[0].playerName, "Zara");

  // 4. Header-based idempotency (x-attempt-id and Idempotency-Key)
  const headerAttemptId = generateAttemptId();
  const subReqHeader = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-attempt-id": headerAttemptId,
    },
    body: JSON.stringify({
      playerName: "Ali",
      answers,
    }),
  });
  const resHeader = await submitAttempt(subReqHeader, { params: Promise.resolve({ id: quizId }) });
  assert.equal(resHeader.status, 200);
  const dataHeader = await resHeader.json();
  assert.equal(dataHeader.attemptId, headerAttemptId);

  // 5. Malformed attempt ID is rejected
  const badAttemptReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attemptId: "invalid/attempt/id!",
      playerName: "Hacker",
      answers,
    }),
  });
  const resBadAttempt = await submitAttempt(badAttemptReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(resBadAttempt.status, 400);
});

test("Phase 6: Player Name Validation & Whitespace Trimming", async () => {
  const tenQuestions = DEFAULT_QUIZ_QUESTIONS.slice(0, 10).map((q) => ({
    questionId: q.id,
    correctOptionId: q.options[0].id,
  }));

  const createReq = new NextRequest("http://localhost:3000/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creatorName: "Name Checker",
      gender: "male",
      secretPin: "1234",
      questions: tenQuestions,
    }),
  });
  const createRes = await createQuiz(createReq);
  const { quizId } = await createRes.json();

  const answers = tenQuestions.map((q) => ({
    questionId: q.questionId,
    selectedOptionId: q.correctOptionId,
  }));

  // 1. Whitespace is trimmed
  const subReqTrim = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      playerName: "   Fatima Noor   ",
      answers,
    }),
  });
  const resTrim = await submitAttempt(subReqTrim, { params: Promise.resolve({ id: quizId }) });
  assert.equal(resTrim.status, 200);

  // Check scoreboard has trimmed name
  const scoreReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/scoreboard`);
  const scoreRes = await getPublicScoreboard(scoreReq, { params: Promise.resolve({ id: quizId }) });
  const scoreData = await scoreRes.json();
  assert.equal(scoreData.scoreboard[0].playerName, "Fatima Noor");

  // 2. Empty or only whitespace name is rejected
  const subReqEmpty = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      playerName: "    ",
      answers,
    }),
  });
  const resEmpty = await submitAttempt(subReqEmpty, { params: Promise.resolve({ id: quizId }) });
  assert.equal(resEmpty.status, 400);

  // 3. Oversized name (>40 chars) is rejected
  const subReqLong = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      playerName: "A".repeat(41),
      answers,
    }),
  });
  const resLong = await submitAttempt(subReqLong, { params: Promise.resolve({ id: quizId }) });
  assert.equal(resLong.status, 400);
});

test("Phase 6: Question Count Validation & Score Invariants", async () => {
  const tenQuestions = DEFAULT_QUIZ_QUESTIONS.slice(0, 10).map((q) => ({
    questionId: q.id,
    correctOptionId: q.options[0].id,
  }));

  const createReq = new NextRequest("http://localhost:3000/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creatorName: "Count Checker",
      gender: "male",
      secretPin: "1234",
      questions: tenQuestions,
    }),
  });
  const createRes = await createQuiz(createReq);
  const { quizId } = await createRes.json();

  // 1. Empty answers rejected
  const resEmpty = await submitAttempt(
    new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerName: "Empty Answers",
        answers: [],
      }),
    }),
    { params: Promise.resolve({ id: quizId }) }
  );
  assert.equal(resEmpty.status, 400);

  // 2. Unknown question ID rejected
  const resUnknown = await submitAttempt(
    new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerName: "Bad Question",
        answers: [{ questionId: "nonexistent_question_id", selectedOptionId: 0 }],
      }),
    }),
    { params: Promise.resolve({ id: quizId }) }
  );
  assert.equal(resUnknown.status, 400);

  // 3. Out-of-bounds option ID rejected
  const resBadOpt = await submitAttempt(
    new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerName: "Bad Option",
        answers: [{ questionId: tenQuestions[0].questionId, selectedOptionId: 99999 }],
      }),
    }),
    { params: Promise.resolve({ id: quizId }) }
  );
  assert.equal(resBadOpt.status, 400);

  // 4. More than total questions rejected
  const extraAnswers = [
    ...tenQuestions.map((q) => ({
      questionId: q.questionId,
      selectedOptionId: q.correctOptionId,
    })),
    { questionId: "extra_question", selectedOptionId: 0 },
  ];
  const resOver = await submitAttempt(
    new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerName: "Over Limit",
        answers: extraAnswers,
      }),
    }),
    { params: Promise.resolve({ id: quizId }) }
  );
  assert.equal(resOver.status, 400);

  // 5. Valid 10 unique questions accepted
  const validAnswers = tenQuestions.map((q) => ({
    questionId: q.questionId,
    selectedOptionId: q.correctOptionId,
  }));
  const resValid = await submitAttempt(
    new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerName: "All Ten Answered",
        answers: validAnswers,
      }),
    }),
    { params: Promise.resolve({ id: quizId }) }
  );
  assert.equal(resValid.status, 200);
  const dataValid = await resValid.json();
  assert.equal(dataValid.score, 10);
  assert.equal(dataValid.totalQuestions, 10);
});

test("Phase 6: Deterministic Scoreboard Ranking, Badges & Creator Privacy", async () => {
  const tenQuestions = DEFAULT_QUIZ_QUESTIONS.slice(0, 10).map((q) => ({
    questionId: q.id,
    correctOptionId: q.options[0].id,
  }));

  const createReq = new NextRequest("http://localhost:3000/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creatorName: "Rank Host",
      gender: "female",
      secretPin: "8888",
      questions: tenQuestions,
    }),
  });
  const createRes = await createQuiz(createReq);
  const { quizId, creatorToken } = await createRes.json();

  // Submit attempt with 10/10 (Bestie)
  await submitAttempt(
    new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerName: "Player 10",
        answers: tenQuestions.map((q) => ({
          questionId: q.questionId,
          selectedOptionId: q.correctOptionId,
        })),
      }),
    }),
    { params: Promise.resolve({ id: quizId }) }
  );

  // Submit attempt with 6/10 (Friend)
  await submitAttempt(
    new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerName: "Player 6",
        answers: tenQuestions.map((q, idx) => ({
          questionId: q.questionId,
          // Correct for first 6, wrong for last 4 (use option 1 which is not correctOptionId 0)
          selectedOptionId: idx < 6 ? q.correctOptionId : (q.correctOptionId === 0 ? 1 : 0),
        })),
      }),
    }),
    { params: Promise.resolve({ id: quizId }) }
  );

  // Submit attempt with 2/10 (Friend in Training / Fake)
  await submitAttempt(
    new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerName: "Player 2",
        answers: tenQuestions.map((q, idx) => ({
          questionId: q.questionId,
          // Correct for first 2, wrong for last 8
          selectedOptionId: idx < 2 ? q.correctOptionId : (q.correctOptionId === 0 ? 1 : 0),
        })),
      }),
    }),
    { params: Promise.resolve({ id: quizId }) }
  );

  // 1. Verify Public Scoreboard
  const pubReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/scoreboard`);
  const pubRes = await getPublicScoreboard(pubReq, { params: Promise.resolve({ id: quizId }) });
  const pubData = await pubRes.json();

  assert.equal(pubData.scoreboard.length, 3);
  // Ranked highest first
  assert.equal(pubData.scoreboard[0].playerName, "Player 10");
  assert.equal(pubData.scoreboard[0].score, 10);
  assert.equal(pubData.scoreboard[0].statusBadge, "bestie");

  assert.equal(pubData.scoreboard[1].playerName, "Player 6");
  assert.equal(pubData.scoreboard[1].score, 6);
  assert.equal(pubData.scoreboard[1].statusBadge, "friend");

  assert.equal(pubData.scoreboard[2].playerName, "Player 2");
  assert.equal(pubData.scoreboard[2].score, 2);
  assert.equal(pubData.scoreboard[2].statusBadge, "fake");

  // Public scoreboard must NOT contain answers or correct answers
  for (const entry of pubData.scoreboard) {
    assert.equal(entry.answers, undefined, "Public scoreboard must never leak answers");
  }

  // 2. Creator Detailed Scoreboard with valid creatorToken
  const detailReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/scoreboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creatorToken }),
  });
  const detailRes = await getDetailedScoreboard(detailReq, { params: Promise.resolve({ id: quizId }) });
  const detailData = await detailRes.json();
  assert.equal(detailData.success, true);
  assert.equal(detailData.scoreboard.length, 3);
  assert.ok(detailData.scoreboard[0].answers, "Authorized creator must receive detailed question breakdown");
  assert.equal(detailData.scoreboard[0].answers.length, 10);
});

test("Phase 6: Accessibility reduced-motion in triggerConfetti", () => {
  // Test that triggerConfetti safely handles environment
  // In Node/non-browser environment, it safely returns without throwing
  assert.doesNotThrow(() => {
    triggerConfetti();
  });
});
