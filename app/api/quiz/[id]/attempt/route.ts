import { StorageUnavailableError } from "@/lib/quiz/storage";
import { NextResponse } from "next/server";
import { getQuizById, recordAttempt } from "@/lib/quiz/storage";
import { PlayerAttempt } from "@/lib/quiz/types";
import { generateAttemptId } from "@/lib/quiz/security";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid payload." }, { status: 400 });
    }

    const { playerName, answers } = body;

    if (!playerName || typeof playerName !== "string" || !playerName.trim()) {
      return NextResponse.json(
        { success: false, error: "Please enter your name." },
        { status: 400 }
      );
    }

    const cleanPlayerName = playerName.trim();
    if (cleanPlayerName.length > 40) {
      return NextResponse.json(
        { success: false, error: "Player name must be 40 characters or less." },
        { status: 400 }
      );
    }

    // Retrieve quiz strictly from verified durable storage
    const quiz = await getQuizById(id);
    if (!quiz) {
      return NextResponse.json(
        { success: false, error: "Quiz not found or may have been deleted." },
        { status: 404 }
      );
    }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { success: false, error: "Answers list must not be empty." },
        { status: 400 }
      );
    }

    // Deduplicate answers by questionId to prevent duplicate answer score inflation
    const processedQuestionIds = new Set<string>();
    const evaluatedAnswers: PlayerAttempt["answers"] = [];
    let score = 0;

    for (const ans of answers) {
      if (!ans || typeof ans !== "object" || typeof ans.questionId !== "string" || ans.selectedOptionId === undefined) {
        return NextResponse.json(
          { success: false, error: "Malformed answer entry detected." },
          { status: 400 }
        );
      }
      const { questionId, selectedOptionId } = ans;

      if (processedQuestionIds.has(questionId)) {
        // Skip duplicate submissions for the same question
        continue;
      }

      const targetQuestion = quiz.questions.find((q) => q.questionId === questionId);
      if (!targetQuestion) {
        return NextResponse.json(
          { success: false, error: `Invalid question submitted: ${questionId}` },
          { status: 400 }
        );
      }

      processedQuestionIds.add(questionId);

      const optionIdNum = Number(selectedOptionId);
      const optionExists = targetQuestion.options.some((opt) => opt.id === optionIdNum);
      if (!Number.isInteger(optionIdNum) || !optionExists) {
        return NextResponse.json(
          { success: false, error: "Invalid option selected." },
          { status: 400 }
        );
      }

      const isCorrect = targetQuestion.correctOptionId === optionIdNum;
      if (isCorrect) {
        score++;
      }

      evaluatedAnswers.push({
        questionId,
        selectedOptionId: optionIdNum,
        isCorrect,
      });
    }

    if (evaluatedAnswers.length === 0) {
      return NextResponse.json(
        { success: false, error: "Answers list must contain at least one valid question answer." },
        { status: 400 }
      );
    }

    // Score can never exceed total questions
    const finalScore = Math.min(score, quiz.questions.length);

    const attemptId = generateAttemptId();
    const attempt: PlayerAttempt = {
      id: attemptId,
      quizId: id,
      playerName: cleanPlayerName,
      score: finalScore,
      totalQuestions: quiz.questions.length,
      answers: evaluatedAnswers,
      createdAt: Date.now(),
    };

    const isRecorded = await recordAttempt(attempt);
    if (!isRecorded) {
      return NextResponse.json(
        { success: false, error: "Failed to save attempt to storage. Please try again." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      score: finalScore,
      totalQuestions: quiz.questions.length,
      creatorName: quiz.creatorName,
      gender: quiz.gender,
      attemptId: attempt.id,
    });
  } catch (err) {
    if (err instanceof StorageUnavailableError)
      return NextResponse.json({ success: false, error: "Storage temporarily unavailable." }, { status: 503 });
    console.error("[API Quiz Attempt Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to record attempt." },
      { status: 500 }
    );
  }
}
