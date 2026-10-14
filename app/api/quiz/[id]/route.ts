import { NextResponse } from "next/server";
import { getQuizPublicData, getQuizById, deleteQuiz } from "@/lib/quiz/storage";
import { verifyPin, checkPinRateLimit, timingSafeEqualString } from "@/lib/quiz/security";

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
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { pin, creatorToken } = body;

    const quiz = await getQuizById(id);
    if (!quiz) {
      return NextResponse.json(
        { success: false, error: "Quiz not found." },
        { status: 404 }
      );
    }

    // Rate limit brute-force attempts
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    if (!checkPinRateLimit(clientIp)) {
      return NextResponse.json(
        { success: false, error: "Too many attempts. Please try again in 10 minutes." },
        { status: 429 }
      );
    }

    // Authenticate via constant-time token comparison OR scrypt PIN verification
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

    const isDeleted = await deleteQuiz(id);
    if (!isDeleted) {
      return NextResponse.json(
        { success: false, error: "Failed to delete quiz from storage." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Quiz deleted successfully.",
    });
  } catch (err) {
    console.error("[API Quiz DELETE Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete quiz." },
      { status: 500 }
    );
  }
}
