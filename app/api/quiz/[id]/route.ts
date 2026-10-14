import { NextResponse } from "next/server";
import { getQuizPublicData, getQuizById, deleteQuiz } from "@/lib/quiz/storage";
import { verifyPin, checkPinRateLimit, decodeQuizPayload } from "@/lib/quiz/security";
import { QuizPublicData } from "@/lib/quiz/types";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const dataToken = url.searchParams.get("data");

    let publicData = await getQuizPublicData(id);

    // If not found in primary storage (e.g. cold lambda instance without Redis), hydrate from verified backup payload
    if (!publicData && dataToken) {
      const decoded = decodeQuizPayload<QuizPublicData>(dataToken);
      if (decoded && decoded.id === id) {
        publicData = decoded;
      }
    }

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

    // Authenticate via creatorToken OR hashed PIN
    const isTokenMatch = creatorToken && typeof creatorToken === "string" && creatorToken === quiz.creatorToken;
    const isPinMatch = pin && typeof pin === "string" && verifyPin(pin, quiz.pinHash);

    if (!isTokenMatch && !isPinMatch) {
      return NextResponse.json(
        { success: false, error: "Incorrect Secret PIN or authorization token." },
        { status: 403 }
      );
    }

    await deleteQuiz(id);

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
