import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Quiz Is Ready! | Click & Clique",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
