import type { Metadata } from "next";
import Homepage from "@/components/quiz-home/Homepage";
export const metadata: Metadata = {
  title: "Click & Clique | How well do your friends know you?",
  description:
    "Make a friendship quiz, share your link, and find out who knows you best. Ten questions. One very fun group chat.",
  icons: { icon: "/quiz/clique-mark.svg" },
  openGraph: {
    title: "Click & Clique | Your friendship quiz starts here",
    description:
      "Ten questions. One very fun group chat. Find out who knows you best.",
    siteName: "Click & Clique",
    type: "website",
    images: [],
  },
};
export default function QuizLandingPage() {
  return <Homepage />;
}
