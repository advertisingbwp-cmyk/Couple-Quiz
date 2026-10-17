import { NextResponse } from "next/server";
import { authenticateCreator } from "./security";
import type { QuizData } from "./types";

export async function creatorAuthResponse(req: Request, quiz: QuizData, credentials: { pin?: unknown; creatorToken?: unknown }) {
  const status = await authenticateCreator(req, quiz, credentials);
  if (status === 200) return null;
  return NextResponse.json({ success: false, error: status === 429
    ? "Too many attempts. Please try again in 10 minutes."
    : "Incorrect Secret PIN or authorization token." },
  { status, ...(status === 429 ? { headers: { "Retry-After": "600" } } : {}) });
}
