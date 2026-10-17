import type { Metadata } from "next";
import Homepage from "@/components/quiz-home/Homepage";
export const metadata: Metadata = {
  title: "Friendship Quiz 2026: BFF Test & How Well Do You Know Me? | Click & Clique",
  description:
    "Create a free 10-question friendship quiz or BFF test in seconds. Share your friend quiz link on WhatsApp and discover who knows you best on the live leaderboard!",
  alternates: {
    canonical: "/",
  },
  icons: { icon: "/quiz/clique-mark.svg" },
  openGraph: {
    title: "Friendship Quiz 2026: BFF Test & How Well Do You Know Me? | Click & Clique",
    description:
      "Answer 10 fun questions to test how well your friends know you. Share on WhatsApp and see the live scoreboard!",
    siteName: "Click & Clique",
    type: "website",
    url: "/",
    images: [
      {
        url: "/api/og/quiz/default",
        width: 1200,
        height: 630,
        alt: "Click & Clique — Friendship Quiz 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Friendship Quiz 2026: BFF Test & How Well Do You Know Me? | Click & Clique",
    description:
      "Answer 10 fun questions to test how well your friends know you. Share on WhatsApp and see the live scoreboard!",
    images: ["/api/og/quiz/default"],
  },
};
export default function QuizLandingPage() {
  return <Homepage />;
}
