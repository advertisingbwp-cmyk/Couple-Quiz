import type { Metadata } from "next";
import { createQuizStorage } from "@/lib/quiz/storage";
import { buildQuizPlayMetadata } from "@/lib/quiz/sharing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const quizId = resolvedParams.id;

  try {
    const storage = createQuizStorage();
    const quiz = await storage.getQuizPublicData(quizId);
    return buildQuizPlayMetadata(quiz, quizId);
  } catch {
    return buildQuizPlayMetadata(null, quizId);
  }
}

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
