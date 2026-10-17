import type { Metadata } from "next";
import "./globals.css";
import { getBaseUrl } from "@/lib/quiz/sharing";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: "Click & Clique — Viral Friendship Challenge & Couple Dare",
    template: "%s",
  },
  description:
    "Answer 10 fun questions to test how well your friends know you! Create your quiz, share on WhatsApp, and see who makes the top of your leaderboard.",
  icons: {
    icon: "/quiz/assets/img/logo-f.webp",
  },
  openGraph: {
    title: "Click & Clique — Viral Friendship Challenge & Couple Dare",
    description:
      "Answer 10 fun questions to test how well your friends know you! Create your quiz, share on WhatsApp, and see who makes the top of your leaderboard.",
    siteName: "Click & Clique",
    type: "website",
    images: [
      {
        url: "/api/og/quiz/default",
        width: 1200,
        height: 630,
        alt: "Click & Clique — Friendship & Couple Quiz Challenge",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Click & Clique — Viral Friendship Challenge & Couple Dare",
    description:
      "Answer 10 fun questions to test how well your friends know you! Create your quiz, share on WhatsApp, and see who makes the top of your leaderboard.",
    images: ["/api/og/quiz/default"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
