import { StorageUnavailableError } from "@/lib/quiz/storage";
import { NextResponse } from "next/server";
import { saveQuiz } from "@/lib/quiz/storage";
import { QuizData, Gender } from "@/lib/quiz/types";
import { hashPin, generateCreatorToken, generateQuizId, generateQuizSlug } from "@/lib/quiz/security";
import { DEFAULT_QUIZ_QUESTIONS } from "@/lib/quiz/questions";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request payload." },
        { status: 400 }
      );
    }

    const { creatorName, gender, country, secretPin, questions } = body;

    // 1. Strict Name Validation
    if (!creatorName || typeof creatorName !== "string" || !creatorName.trim()) {
      return NextResponse.json(
        { success: false, error: "Please enter your name." },
        { status: 400 }
      );
    }

    const cleanCreatorName = creatorName.trim();
    if (cleanCreatorName.length > 40) {
      return NextResponse.json(
        { success: false, error: "Name must be 40 characters or less." },
        { status: 400 }
      );
    }

    // 2. Strict Questions Validation
    if (!questions || !Array.isArray(questions) || questions.length < 5 || questions.length > 15) {
      return NextResponse.json(
        { success: false, error: "Quiz must have between 5 and 15 questions." },
        { status: 400 }
      );
    }

    const validQuestionIds = new Set(DEFAULT_QUIZ_QUESTIONS.map((q) => q.id));
    const seenQuestionIds = new Set<string>();

    const validatedQuestions: QuizData["questions"] = [];

    for (const q of questions) {
      if (!q || typeof q !== "object") {
        return NextResponse.json({ success: false, error: "Malformed question data." }, { status: 400 });
      }

      if (!q.questionId || typeof q.questionId !== "string" || !validQuestionIds.has(q.questionId)) {
        return NextResponse.json({ success: false, error: `Invalid question id: ${q.questionId}` }, { status: 400 });
      }

      if (seenQuestionIds.has(q.questionId)) {
        return NextResponse.json({ success: false, error: `Duplicate question detected: ${q.questionId}` }, { status: 400 });
      }
      seenQuestionIds.add(q.questionId);

      const originalQuestion = DEFAULT_QUIZ_QUESTIONS.find((def) => def.id === q.questionId)!;

      const correctOptionId = Number(q.correctOptionId);
      if (
        !Number.isInteger(correctOptionId) ||
        !originalQuestion.options.some((opt) => opt.id === correctOptionId)
      ) {
        return NextResponse.json({ success: false, error: "Invalid option selected." }, { status: 400 });
      }

      validatedQuestions.push({
        questionId: q.questionId,
        question: originalQuestion.question,
        emoji: originalQuestion.emoji,
        options: originalQuestion.options,
        correctOptionId,
      });
    }

    // 3. Strict Secret PIN Validation (No default fallback allowed)
    if (!secretPin || typeof secretPin !== "string" || !/^\d{4,6}$/.test(secretPin.trim())) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 4 to 6 digit secret PIN (numbers only)." },
        { status: 400 }
      );
    }

    const pin = secretPin.trim();
    const pinHash = hashPin(pin);
    const creatorToken = generateCreatorToken();

    // 4. Generate Cryptographically Secure Identifiers
    const slug = generateQuizSlug(cleanCreatorName);
    const id = generateQuizId();

    const quiz: QuizData = {
      id,
      slug,
      creatorName: cleanCreatorName,
      gender: (gender === "female" ? "female" : "male") as Gender,
      country: country || "PK",
      theme: "dont_block_me",
      pinHash,
      creatorToken,
      createdAt: Date.now(),
      questions: validatedQuestions,
    };

    // 5. Save in durable database and verify storage success
    const isSaved = await saveQuiz(quiz);
    if (!isSaved) {
      return NextResponse.json(
        { success: false, error: "Failed to persist quiz to durable storage. Please try again." },
        { status: 503 }
      );
    }

    // 6. Return response with clean share URL (no untrusted URL payload attached)
    return NextResponse.json({
      success: true,
      quizId: quiz.id,
      slug: quiz.slug,
      creatorToken: quiz.creatorToken,
      shareUrl: `/quiz/share/${quiz.id}`,
    });
  } catch (err) {
    if (err instanceof StorageUnavailableError)
      return NextResponse.json({ success: false, error: "Storage temporarily unavailable." }, { status: 503 });
    console.error("[API Quiz POST Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create quiz." },
      { status: 500 }
    );
  }
}
