import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { DEFAULT_QUIZ_QUESTIONS } from "../lib/quiz/questions";
import { getVisualOptionGridClasses } from "../components/quiz/VisualOptionCard";
import { POST as createQuiz } from "../app/api/quiz/route";
import { GET as getQuiz } from "../app/api/quiz/[id]/route";
import { POST as submitAttempt } from "../app/api/quiz/[id]/attempt/route";

test("Phase 4: Every option in 105-question bank has both non-empty text and valid imageUrl", () => {
  assert.equal(DEFAULT_QUIZ_QUESTIONS.length, 105);

  let totalOptionsCount = 0;
  for (const q of DEFAULT_QUIZ_QUESTIONS) {
    assert.ok(q.id, "Question must have an ID");
    assert.ok(q.question && q.question.trim().length > 0, `Question ${q.id} must have question text`);
    assert.ok(Array.isArray(q.options) && q.options.length >= 2, `Question ${q.id} must have at least 2 options`);

    for (const opt of q.options) {
      totalOptionsCount++;
      assert.ok(typeof opt.id === "number", `Question ${q.id} option must have numeric id`);
      assert.ok(opt.text && opt.text.trim().length > 0, `Question ${q.id} option ${opt.id} text must not be empty`);
      assert.ok(opt.imageUrl && opt.imageUrl.startsWith("/quiz/options/"), `Question ${q.id} option ${opt.id} must have imageUrl starting with /quiz/options/`);
    }
  }

  assert.equal(totalOptionsCount, 440, "Expected exactly 440 options across all 105 questions");
});

test("Phase 4: Every referenced option illustration asset exists on disk and is a valid SVG", () => {
  const publicDir = path.join(process.cwd(), "public");

  for (const q of DEFAULT_QUIZ_QUESTIONS) {
    for (const opt of q.options) {
      assert.ok(opt.imageUrl, `Option ${opt.id} in ${q.id} missing imageUrl`);
      const diskPath = path.join(publicDir, opt.imageUrl);
      assert.ok(fs.existsSync(diskPath), `Asset file missing on disk: ${opt.imageUrl} for ${q.id}`);

      const stat = fs.statSync(diskPath);
      assert.ok(stat.size > 50, `Asset file is too small or empty (${stat.size} bytes): ${opt.imageUrl}`);

      const content = fs.readFileSync(diskPath, "utf-8");
      assert.ok(content.includes("<svg") && content.includes("</svg>"), `File must be a valid SVG: ${opt.imageUrl}`);
    }
  }
});

test("Phase 4: Variable option counts are properly distributed (2, 4, 6, 9 options)", () => {
  const counts = { 2: 0, 4: 0, 6: 0, 9: 0, other: 0 };

  for (const q of DEFAULT_QUIZ_QUESTIONS) {
    const len = q.options.length;
    if (len === 2) counts[2]++;
    else if (len === 4) counts[4]++;
    else if (len === 6) counts[6]++;
    else if (len === 9) counts[9]++;
    else counts.other++;
  }

  assert.equal(counts.other, 0, "All questions must have either 2, 4, 6, or 9 options");
  assert.equal(counts[2], 6, "Expected 6 binary/versus questions (2 options)");
  assert.equal(counts[6], 6, "Expected 6 questions with 6 options");
  assert.equal(counts[9], 4, "Expected 4 questions with 9 options");
  assert.equal(counts[4], 89, "Expected 89 questions with 4 options");
  assert.equal(counts[2] + counts[4] + counts[6] + counts[9], 105);
});

test("Phase 4: Responsive grid class helper returns appropriate classes for variable option counts", () => {
  const grid2 = getVisualOptionGridClasses(2);
  assert.ok(grid2.includes("sm:grid-cols-2") || grid2.includes("grid-cols-2"), "2-option grid should support 2 columns");

  const grid4 = getVisualOptionGridClasses(4);
  assert.ok(grid4.includes("grid-cols-2"), "4-option grid should be 2x2");

  const grid6 = getVisualOptionGridClasses(6);
  assert.ok(grid6.includes("grid-cols-2") && grid6.includes("sm:grid-cols-3"), "6-option grid should be responsive 2 or 3 cols");

  const grid9 = getVisualOptionGridClasses(9);
  assert.ok(grid9.includes("grid-cols-3"), "9-option grid should be 3x3");
});

test("Phase 4: Quiz Creator API creates quiz with variable option questions (2, 4, 6, 9)", async () => {
  // Select 10 questions including 2-option, 6-option, 9-option and 4-option questions
  // 2 options: q40, q42
  // 6 options: q8, q13
  // 9 options: q1, q6
  // 4 options: q2, q3, q4, q5
  const selectedQuestionConfigs = [
    { questionId: "q40", correctOptionId: 1 }, // 2 options: opt 1
    { questionId: "q42", correctOptionId: 0 }, // 2 options: opt 0
    { questionId: "q8", correctOptionId: 4 },  // 6 options: opt 4
    { questionId: "q13", correctOptionId: 5 }, // 6 options: opt 5
    { questionId: "q1", correctOptionId: 7 },  // 9 options: opt 7
    { questionId: "q6", correctOptionId: 8 },  // 9 options: opt 8
    { questionId: "q2", correctOptionId: 2 },  // 4 options: opt 2
    { questionId: "q3", correctOptionId: 0 },  // 4 options: opt 0
    { questionId: "q4", correctOptionId: 3 },  // 4 options: opt 3
    { questionId: "q5", correctOptionId: 1 },  // 4 options: opt 1
  ];

  const payload = {
    creatorName: "Ayesha Visual",
    gender: "female",
    country: "PK",
    secretPin: "7861",
    questions: selectedQuestionConfigs,
  };

  const req = new NextRequest("http://localhost:3000/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const res = await createQuiz(req);
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.ok(data.success);
  assert.ok(data.quizId);

  const quizId = data.quizId;

  // Retrieve public quiz data and verify privacy (no correctOptionId leaked)
  const getReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}`);
  const getRes = await getQuiz(getReq, { params: Promise.resolve({ id: quizId }) });
  const getData = await getRes.json();

  assert.equal(getRes.status, 200);
  assert.ok(getData.success);
  assert.equal(getData.quiz.questions.length, 10);

  // Assert NO question leaks correctOptionId or pinHash
  for (const q of getData.quiz.questions) {
    const rawQ = q as Record<string, unknown>;
    assert.equal(rawQ.correctOptionId, undefined, "correctOptionId must NOT be exposed to players");
    assert.equal(rawQ.pinHash, undefined, "pinHash must NOT be exposed to players");
    // Assert all options have text and imageUrl
    for (const opt of q.options) {
      assert.ok(opt.text, "Option text must be present");
      assert.ok(opt.imageUrl, "Option imageUrl must be present");
    }
  }

  // Attempt quiz scoring with variable options (testing 2, 6, and 9 option correctness)
  const attemptAnswers = [
    { questionId: "q40", selectedOptionId: 1 }, // Correct (2-option)
    { questionId: "q42", selectedOptionId: 1 }, // Wrong (picked 1, correct is 0)
    { questionId: "q8", selectedOptionId: 4 },  // Correct (6-option, opt 4)
    { questionId: "q13", selectedOptionId: 2 }, // Wrong (picked 2, correct is 5)
    { questionId: "q1", selectedOptionId: 7 },  // Correct (9-option, opt 7)
    { questionId: "q6", selectedOptionId: 8 },  // Correct (9-option, opt 8)
    { questionId: "q2", selectedOptionId: 2 },  // Correct (4-option)
    { questionId: "q3", selectedOptionId: 0 },  // Correct (4-option)
    { questionId: "q4", selectedOptionId: 3 },  // Correct (4-option)
    { questionId: "q5", selectedOptionId: 0 },  // Wrong (picked 0, correct is 1)
  ]; // Total correct: 7 out of 10

  const attemptReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      playerName: "Bilal Player",
      answers: attemptAnswers,
    }),
  });

  const attemptRes = await submitAttempt(attemptReq, { params: Promise.resolve({ id: quizId }) });
  const attemptData = await attemptRes.json();

  assert.equal(attemptRes.status, 200);
  assert.ok(attemptData.success);
  assert.equal(attemptData.score, 7);
  assert.equal(attemptData.totalQuestions, 10);
  assert.equal(attemptData.creatorName, "Ayesha Visual");
  assert.ok(attemptData.attemptId);
});

test("Phase 4: Attempt API rejects option IDs outside variable option bounds", async () => {
  // Create quiz with a 2-option question and a 4-option question
  const selectedQuestionConfigs = [
    { questionId: "q40", correctOptionId: 0 }, // 2 options (0, 1)
    { questionId: "q42", correctOptionId: 1 },
    { questionId: "q2", correctOptionId: 2 },
    { questionId: "q3", correctOptionId: 0 },
    { questionId: "q4", correctOptionId: 3 },
    { questionId: "q5", correctOptionId: 1 },
    { questionId: "q7", correctOptionId: 2 },
    { questionId: "q9", correctOptionId: 0 },
    { questionId: "q10", correctOptionId: 1 },
    { questionId: "q11", correctOptionId: 3 },
  ];

  const payload = {
    creatorName: "Bounds Tester",
    gender: "male",
    country: "PK",
    secretPin: "9999",
    questions: selectedQuestionConfigs,
  };

  const req = new NextRequest("http://localhost:3000/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const res = await createQuiz(req);
  const data = await res.json();
  const quizId = data.quizId;

  // Try submitting option 3 for q40 (which only has options 0 and 1)
  const invalidAttemptReq = new NextRequest(`http://localhost:3000/api/quiz/${quizId}/attempt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      playerName: "Cheater",
      answers: [
        { questionId: "q40", selectedOptionId: 3 }, // Invalid for a 2-option question!
        { questionId: "q42", selectedOptionId: 1 },
        { questionId: "q2", selectedOptionId: 2 },
        { questionId: "q3", selectedOptionId: 0 },
        { questionId: "q4", selectedOptionId: 3 },
        { questionId: "q5", selectedOptionId: 1 },
        { questionId: "q7", selectedOptionId: 2 },
        { questionId: "q9", selectedOptionId: 0 },
        { questionId: "q10", selectedOptionId: 1 },
        { questionId: "q11", selectedOptionId: 3 },
      ],
    }),
  });

  const invalidAttemptRes = await submitAttempt(invalidAttemptReq, { params: Promise.resolve({ id: quizId }) });
  assert.equal(invalidAttemptRes.status, 400);
  const errData = await invalidAttemptRes.json();
  assert.equal(errData.success, false);
  assert.equal(errData.error, "Invalid option selected.");
});
