import { Metadata } from "next";
import { PrototypeQuestionScreen } from "@/components/design-preview/PrototypeQuestionScreen";

export const metadata: Metadata = {
  title: "Glassmorphism Question Screen Prototype • Click & Clique",
  description: "Phase 10.1 mobile-first glassmorphism question card design prototype with original mascots and real-photo option cards.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function DesignPreviewQuestionPage() {
  return <PrototypeQuestionScreen />;
}
