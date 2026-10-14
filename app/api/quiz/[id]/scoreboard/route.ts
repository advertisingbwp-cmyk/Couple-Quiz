import { NextResponse } from "next/server";
import { getScoreboard, getScoreboardDetails, getQuizById, deleteAttempt } from "@/lib/quiz/storage";
import { verifyPin, checkPinRateLimit, timingSafeEqualString } from "@/lib/quiz/security";

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
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { pin, creatorToken } = body;

    const quiz = await getQuizById(id);
    if (!quiz) {
      return NextResponse.json({ success: false, error: "Quiz not found." }, { status: 404 });
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    if (!checkPinRateLimit(clientIp)) {
      return NextResponse.json(
        { success: false, error: "Too many attempts. Please try again in 10 minutes." },
        { status: 429 }
      );
    }

    const isTokenMatch =
      typeof creatorToken === "string" && timingSafeEqualString(creatorToken, quiz.creatorToken);
    const isPinMatch =
      typeof pin === "string" && /^\d{4,6}$/.test(pin.trim()) && verifyPin(pin.trim(), quiz.pinHash);

    if (!isTokenMatch && !isPinMatch) {
      return NextResponse.json(
        { success: false, error: "Incorrect Secret PIN or authorization token." },
        { status: 403 }
      );
    }

    const detailedLeaderboard = await getScoreboardDetails(id);

    return NextResponse.json({
      success: true,
      creatorName: quiz.creatorName,
      totalQuestions: quiz.questions.length,
      scoreboard: detailedLeaderboard,
    });
  } catch (err) {
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
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { attemptId, pin, creatorToken } = body;

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

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    if (!checkPinRateLimit(clientIp)) {
      return NextResponse.json(
        { success: false, error: "Too many attempts. Please wait." },
        { status: 429 }
      );
    }

    const isTokenMatch =
      typeof creatorToken === "string" && timingSafeEqualString(creatorToken, quiz.creatorToken);
    const isPinMatch =
      typeof pin === "string" && /^\d{4,6}$/.test(pin.trim()) && verifyPin(pin.trim(), quiz.pinHash);

    if (!isTokenMatch && !isPinMatch) {
      return NextResponse.json(
        { success: false, error: "Incorrect Secret PIN or authorization token." },
        { status: 403 }
      );
    }

    const deleted = await deleteAttempt(id, attemptId);

    return NextResponse.json({
      success: deleted,
      message: deleted ? "Attempt removed." : "Attempt not found.",
    });
  } catch (err) {
    console.error("[API Quiz Scoreboard DELETE Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete attempt." },
      { status: 500 }
    );
  }
}
