import { NextResponse } from "next/server";
import { getQuizById, saveQuiz, recordAttempt } from "@/lib/quiz/storage";
import { PlayerAttempt, QuizData } from "@/lib/quiz/types";
import { decodeQuizPayload, decryptPayload } from "@/lib/quiz/security";

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

    const { playerName, answers, data: backupToken } = body;

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

    let quiz = await getQuizById(id);

    // If quiz is not in Redis or local tmp (stateless lambda instance), hydrate from backup token
    if (!quiz) {
      const { searchParams } = new URL(req.url);
      const token = backupToken || searchParams.get("data");
      if (token && typeof token === "string") {
        const decoded = decodeQuizPayload<{
          id: string;
          creatorName: string;
          gender: QuizData["gender"];
          sec?: string;
          questions: QuizData["questions"];
        }>(token);

        if (decoded && decoded.id === id) {
          let answersMap: Record<string, number> = {};
          let pinHash = "";

          if (decoded.sec) {
            const decrypted = decryptPayload<{
              id: string;
              pinHash: string;
              answers: Record<string, number>;
            }>(decoded.sec);

            if (decrypted && decrypted.id === id) {
              answersMap = decrypted.answers || {};
              pinHash = decrypted.pinHash || "";
            }
          }

          quiz = {
            id: decoded.id,
            slug: decoded.id,
            creatorName: decoded.creatorName || "Friend",
            gender: decoded.gender || "male",
            country: "PK",
            theme: "dont_block_me",
            pinHash: pinHash || "fallback_hash",
            creatorToken: "adm_fallback",
            createdAt: Date.now(),
            questions: (decoded.questions || []).map((q) => ({
              questionId: q.questionId,
              question: q.question,
              emoji: q.emoji,
              options: q.options,
              correctOptionId: answersMap[q.questionId] ?? 0,
            })),
          };

          // Cache in local tmp for current lambda
          await saveQuiz(quiz);
        }
      }
    }

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: "Quiz not found." },
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
      if (!ans || typeof ans !== "object") continue;
      const { questionId, selectedOptionId } = ans;

      if (!questionId || typeof questionId !== "string") continue;
      if (processedQuestionIds.has(questionId)) {
        // Skip duplicate submissions for the same question
        continue;
      }

      const targetQuestion = quiz.questions.find((q) => q.questionId === questionId);
      if (!targetQuestion) {
        // Unknown question ID submitted
        return NextResponse.json(
          { success: false, error: `Invalid question submitted: ${questionId}` },
          { status: 400 }
        );
      }

      processedQuestionIds.add(questionId);

      const optionIdNum = Number(selectedOptionId);
      if (!Number.isInteger(optionIdNum) || optionIdNum < 0 || optionIdNum > 3) {
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

    // Score can never exceed total questions
    const finalScore = Math.min(score, quiz.questions.length);

    const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const attempt: PlayerAttempt = {
      id: attemptId,
      quizId: id,
      playerName: cleanPlayerName,
      score: finalScore,
      totalQuestions: quiz.questions.length,
      answers: evaluatedAnswers,
      createdAt: Date.now(),
    };

    await recordAttempt(attempt);

    return NextResponse.json({
      success: true,
      score: finalScore,
      totalQuestions: quiz.questions.length,
      creatorName: quiz.creatorName,
      gender: quiz.gender,
      attemptId: attempt.id,
    });
  } catch (err) {
    console.error("[API Quiz Attempt Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to record attempt." },
      { status: 500 }
    );
  }
}
