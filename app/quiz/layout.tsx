import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Don't Block Me! Find & Block Your Fake Friends | 2026 Friendship Challenge",
  description: "Answer 10 hilarious questions to test how well your friends know you! Share your challenge on WhatsApp, Instagram & Snapchat to find your real besties.",
  alternates: {
    canonical: "/quiz",
  },
  openGraph: {
    title: "Don't Block Me! Find Your Fake Friends 🚫📱",
    description: "Who knows you best? Create your 10-question friendship dare and find out who to block!",
    url: "https://ai-text-utility.vercel.app/quiz",
    siteName: "AI Text Utility & Friendship Dare",
    images: [
      {
        url: "/quiz/assets/img/logo-f.webp",
        width: 600,
        height: 600,
        alt: "Don't Block Me Quiz",
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
