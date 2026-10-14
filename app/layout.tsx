import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Don't Block Me! Viral Friendship & Couple Quiz Challenge",
  description: "Test how well your partner and friends really know you! Create fun viral quizzes, share on WhatsApp, and view scoreboards.",
  icons: {
    icon: "/quiz/assets/img/logo-f.webp",
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
