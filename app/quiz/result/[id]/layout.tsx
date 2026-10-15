import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz Results | Click & Clique",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResultLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
