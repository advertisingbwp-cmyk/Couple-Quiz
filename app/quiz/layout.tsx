import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Click & Clique — Viral Friendship Challenge & Quiz Dare",
  description:
    "Answer 10 fun questions to test how well your friends know you! Share your challenge on WhatsApp, Instagram & Snapchat to find your real besties.",
  alternates: {
    canonical: "/quiz",
  },
  openGraph: {
    title: "Click & Clique — Who Knows You Best? ✨",
    description:
      "Who knows you best? Create your 10-question friendship dare and check the leaderboard!",
    url: "/quiz",
    siteName: "Click & Clique",
    images: [
      {
        url: "/api/og/quiz/default",
        width: 1200,
        height: 630,
        alt: "Click & Clique Quiz Dare",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Click & Clique — Who Knows You Best? ✨",
    description:
      "Who knows you best? Create your 10-question friendship dare and check the leaderboard!",
    images: ["/api/og/quiz/default"],
  },
};

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
