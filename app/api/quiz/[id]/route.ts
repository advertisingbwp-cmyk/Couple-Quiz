import { NextResponse } from "next/server";
import { getQuizPublicData, getQuizById, deleteQuiz } from "@/lib/quiz/storage";
import { creatorAuthResponse } from "@/lib/quiz/authResponse";
import { RateLimitUnavailableError } from "@/lib/quiz/security";
import { StorageUnavailableError } from "@/lib/quiz/storage";
import { readJsonWithLimit } from "@/lib/quiz/requestBody";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const publicData = await getQuizPublicData(id);

    if (!publicData) {
      return NextResponse.json(
        { success: false, error: "Quiz not found or may have been deleted." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      quiz: publicData,
    });
  } catch (err) {
    if (err instanceof StorageUnavailableError || err instanceof RateLimitUnavailableError)
      return NextResponse.json({ success: false, error: "Service temporarily unavailable." }, { status: 503 });
    console.error("[API Quiz GET Error]:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Phase 9.3 Security Requirement:
    // Whole-quiz deletion ALWAYS requires the creator PIN.
    // A valid creator token alone must NOT authorize whole-quiz deletion.
    if (!pin || typeof pin !== "string" || !/^\d{4,6}$/.test(pin.trim())) {
      return NextResponse.json(
        {
          success: false,
          error: "Creator Secret PIN is required to delete the quiz.",
        },
        { status: creatorToken ? 403 : 400 }
      );
    }

    const quiz = await getQuizById(id);
    if (!quiz) {
      return NextResponse.json(
        { success: false, error: "Quiz not found." },
        { status: 404 }
      );
    }

    // Rate-limited authentication strictly verifying PIN against quiz.pinHash.
    // Even if creatorToken is present in the payload, authenticate ONLY via PIN.
    const authFailure = await creatorAuthResponse(req, quiz, { pin: pin.trim() });
    if (authFailure) return authFailure;
    const isDeleted = await deleteQuiz(id);
    if (!isDeleted) {
      return NextResponse.json(
        { success: false, error: "Quiz not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Quiz deleted successfully.",
    });
  } catch (err) {
    if (err instanceof StorageUnavailableError || err instanceof RateLimitUnavailableError)
      return NextResponse.json({ success: false, error: "Service temporarily unavailable." }, { status: 503 });
    console.error("[API Quiz DELETE Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete quiz." },
      { status: 500 }
    );
  }
}
