import { NextResponse } from "next/server";
import { getQuizById, getAttemptById, StorageUnavailableError } from "@/lib/quiz/storage";
import { verifyPlayerSessionToken } from "@/lib/quiz/security";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params;
    const url = new URL(req.url);
    const attemptId = url.searchParams.get("attemptId")?.trim();

    if (!attemptId) {
      return NextResponse.json(
        { success: false, error: "Attempt reference required." },
        { status: 400 }
      );
    }

    // 1. Extract player session credential: check HttpOnly cookie, then Authorization / X-Player-Token header
    const cookieHeader = req.headers.get("cookie") || "";
    const cookieMatch = cookieHeader.match(new RegExp(`(?:^|;\\s*)ply_ses_${quizId}=([^;]+)`));
    const cookieToken = cookieMatch ? decodeURIComponent(cookieMatch[1].trim()) : null;

    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const customHeaderToken = req.headers.get("x-player-token")?.trim() || null;

    const candidateToken = cookieToken || customHeaderToken || bearerToken;

    if (!candidateToken) {
      return NextResponse.json(
        { success: false, error: "Player session required." },
        { status: 401 }
      );
    }

    // 2. Cryptographically verify player session credential (Requirement 6: do not treat name or attempt ID as auth)
    const isValid = verifyPlayerSessionToken(candidateToken, quizId, attemptId);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired player session." },
        { status: 401 }
      );
    }

    // 3. Verify quiz exists
    const quiz = await getQuizById(quizId);
    if (!quiz) {
      return NextResponse.json(
        { success: false, error: "Quiz not found or may have been deleted." },
        { status: 404 }
      );
    }

    // 4. Retrieve saved attempt (Requirement 8: handle deleted attempts)
    const attempt = await getAttemptById(quizId, attemptId);
    if (!attempt) {
      return NextResponse.json(
        { success: false, error: "Saved attempt was not found or has been deleted." },
        { status: 404 }
      );
    }

    // 5. Return ONLY this player's own result summary (Requirement 5: Never expose creator answers, PIN, or other players)
    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        playerName: attempt.playerName,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        createdAt: attempt.createdAt,
      },
      creatorName: quiz.creatorName,
      gender: quiz.gender,
    });
  } catch (err) {
    if (err instanceof StorageUnavailableError) {
      return NextResponse.json(
        { success: false, error: "Storage temporarily unavailable." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to retrieve player result." },
      { status: 500 }
    );
  }
}
