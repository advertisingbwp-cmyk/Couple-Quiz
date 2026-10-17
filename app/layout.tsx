import type { Metadata } from "next";
import "./globals.css";
import { getBaseUrl } from "@/lib/quiz/sharing";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: "Friendship Quiz 2026: BFF Test & How Well Do You Know Me? | Click & Clique",
    template: "%s",
  },
  description:
    "Create a free 10-question friendship quiz or BFF test in seconds. Share your friend quiz link on WhatsApp and see who really knows you best on the live leaderboard!",
  icons: {
    icon: "/quiz/assets/img/logo-f.webp",
  },
  openGraph: {
    title: "Friendship Quiz 2026: BFF Test & How Well Do You Know Me? | Click & Clique",
    description:
      "Create a free 10-question friendship quiz or BFF test in seconds. Share your friend quiz link on WhatsApp and see who really knows you best on the live leaderboard!",
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
    title: "Friendship Quiz 2026: BFF Test & How Well Do You Know Me? | Click & Clique",
    description:
      "Create a free 10-question friendship quiz or BFF test in seconds. Share your friend quiz link on WhatsApp and see who really knows you best on the live leaderboard!",
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
