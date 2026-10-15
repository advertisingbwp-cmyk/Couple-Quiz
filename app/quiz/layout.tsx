import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Click & Clique — Viral Friendship Challenge & Quiz Dare",
  description: "Answer 10 fun questions to test how well your friends know you! Share your challenge on WhatsApp, Instagram & Snapchat to find your real besties.",
  alternates: {
    canonical: "/quiz",
  },
  openGraph: {
    title: "Click & Clique — Who Knows You Best? ✨",
    description: "Who knows you best? Create your 10-question friendship dare and check the leaderboard!",
    url: "https://couple-quiz-three.vercel.app/quiz",
    siteName: "Click & Clique",
    images: [
      {
        url: "/quiz/assets/img/logo-f.webp",
        width: 600,
        height: 600,
        alt: "Click & Clique Quiz",
      },
    ],
    type: "website",
  },
};

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
