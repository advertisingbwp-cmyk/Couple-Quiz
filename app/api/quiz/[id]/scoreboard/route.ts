import { NextResponse } from "next/server";
import { getScoreboard, getScoreboardDetails, getQuizById, deleteAttempt } from "@/lib/quiz/storage";
import { creatorAuthResponse } from "@/lib/quiz/authResponse";
import { RateLimitUnavailableError, generateCreatorSessionToken } from "@/lib/quiz/security";
import { StorageUnavailableError } from "@/lib/quiz/storage";
import { readJsonWithLimit } from "@/lib/quiz/requestBody";

export const dynamic = "force-dynamic";

/**
 * Public Scoreboard GET:
 * Returns ONLY names, scores, and status badges.
 * NEVER leaks answers or correct answers.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quiz = await getQuizById(id);

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: "Quiz not found or may have been deleted." },
        { status: 404 }
      );
    }

    const leaderboard = await getScoreboard(id);

    return NextResponse.json({
      success: true,
      creatorName: quiz.creatorName,
      totalQuestions: quiz.questions.length,
      scoreboard: leaderboard,
    });
  } catch (err) {
    if (err instanceof StorageUnavailableError || err instanceof RateLimitUnavailableError)
      return NextResponse.json({ success: false, error: "Service temporarily unavailable." }, { status: 503 });
    console.error("[API Quiz Scoreboard Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load scoreboard." },
      { status: 500 }
    );
  }
}

/**
 * Creator Authenticated Details POST:
 * Returns full question-by-question breakdown ONLY with valid PIN or creatorToken.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const parseResult = await readJsonWithLimit<{
      pin?: unknown;
      creatorToken?: unknown;
    }>(req, 32 * 1024);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error },
        { status: parseResult.status }
      );
    }

    const { id } = await params;
    const { pin, creatorToken } = parseResult.data;

    const quiz = await getQuizById(id);
    if (!quiz) {
      return NextResponse.json({ success: false, error: "Quiz not found." }, { status: 404 });
    }

    const authFailure = await creatorAuthResponse(req, quiz, { pin, creatorToken });
    if (authFailure) return authFailure;
    const detailedLeaderboard = await getScoreboardDetails(id);

    return NextResponse.json({
      success: true,
      creatorName: quiz.creatorName,
      totalQuestions: quiz.questions.length,
      scoreboard: detailedLeaderboard,
      creatorToken:
        typeof creatorToken === "string" && creatorToken.startsWith("adm_") && !creatorToken.startsWith("adm_cts_")
          ? creatorToken
          : generateCreatorSessionToken(quiz.id, quiz.pinHash),
    });
  } catch (err) {
    if (err instanceof StorageUnavailableError || err instanceof RateLimitUnavailableError)
      return NextResponse.json({ success: false, error: "Service temporarily unavailable." }, { status: 503 });
    console.error("[API Quiz Scoreboard Details Error]:", err);
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}

/**
 * Delete a specific player's attempt (Creator only)
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const parseResult = await readJsonWithLimit<{
      attemptId?: unknown;
      pin?: unknown;
      creatorToken?: unknown;
    }>(req, 32 * 1024);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error },
        { status: parseResult.status }
      );
    }

    const { id } = await params;
    const { attemptId, pin, creatorToken } = parseResult.data;

    if (!attemptId || typeof attemptId !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing attempt ID." },
        { status: 400 }
      );
    }

    const quiz = await getQuizById(id);
    if (!quiz) {
      return NextResponse.json(
        { success: false, error: "Quiz not found." },
        { status: 404 }
      );
    }

    const authFailure = await creatorAuthResponse(req, quiz, { pin, creatorToken });
    if (authFailure) return authFailure;
    const deleted = await deleteAttempt(id, attemptId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Attempt not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Attempt removed.",
    });
  } catch (err) {
    if (err instanceof StorageUnavailableError || err instanceof RateLimitUnavailableError)
      return NextResponse.json({ success: false, error: "Service temporarily unavailable." }, { status: 503 });
    console.error("[API Quiz Scoreboard DELETE Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete attempt." },
      { status: 500 }
    );
  }
}
