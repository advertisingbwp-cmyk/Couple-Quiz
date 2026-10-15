import type { Metadata } from "next";
import type { QuizPublicData } from "./types";

/**
 * Returns the canonical base URL for the application.
 * Prioritizes explicitly configured NEXT_PUBLIC_APP_URL, then Vercel production domain,
 * avoiding protected preview domains so social crawlers and search engines always target production.
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/+$/, "")}`;
  }
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, "")}`;
  }
  return "https://couple-quiz-three.vercel.app";
}

/**
 * Generates the canonical challenge URL for players.
 * Guaranteed to point to /quiz/play/[quizId] without tokens or secrets.
 * Avoids generating shared URLs pointing to protected Vercel preview domains.
 */
export function getChallengeUrl(quizId: string, origin?: string): string {
  if (origin) {
    try {
      const parsed = new URL(origin);
      const host = parsed.hostname.toLowerCase();
      // If running on a protected Vercel preview deployment, point shared links to canonical public domain
      if (host.endsWith(".vercel.app") && host.includes("-git-")) {
        return `${getBaseUrl()}/quiz/play/${encodeURIComponent(quizId)}`;
      }
      return `${parsed.origin}/quiz/play/${encodeURIComponent(quizId)}`;
    } catch {
      // Fall through to canonical base
    }
  }
  return `${getBaseUrl()}/quiz/play/${encodeURIComponent(quizId)}`;
}

/**
 * Sanitizes creator names for safe rendering in Open Graph tags and HTML.
 * Strips HTML tags, trims whitespace, removes control characters, and limits length.
 */
export function sanitizeCreatorName(name: unknown): string {
  if (typeof name !== "string") return "Your Friend";
  const stripped = name
    .replace(/<[^>]*>?/gm, "") // Strip HTML tags
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Strip control characters
    .trim();
  if (!stripped) return "Your Friend";
  return stripped.slice(0, 30);
}

/**
 * WhatsApp message for quiz creators inviting friends to play.
 */
export function formatWhatsAppQuizShare(creatorName: string, quizId: string, origin?: string): string {
  const safeName = sanitizeCreatorName(creatorName);
  const shareUrl = getChallengeUrl(quizId, origin);
  return `✨ *Click & Clique Friendship Challenge* ✨\n\n${safeName} created a 10-question quiz! 🎯\nHow well do you REALLY know ${safeName}?\n\nTake the challenge and see your rank on the leaderboard! 👇\n${shareUrl}`;
}

/**
 * WhatsApp message for players sharing their results.
 */
export function formatWhatsAppResultShare(
  creatorName: string,
  score: number,
  total: number,
  quizId: string,
  origin?: string
): string {
  const safeName = sanitizeCreatorName(creatorName);
  const shareUrl = getChallengeUrl(quizId, origin);
  const safeScore = Math.max(0, Math.floor(score));
  const safeTotal = Math.max(1, Math.floor(total));
  return `🎉 I scored ${safeScore}/${safeTotal} on ${safeName}'s Friendship Challenge!\n\nCan you beat my score on the Click & Clique leaderboard? 🏆\n\nTry here 👇\n${shareUrl}`;
}

/**
 * WhatsApp message for sharing the challenge leaderboard.
 */
export function formatWhatsAppScoreboardShare(
  creatorName: string,
  entries: { playerName: string; score: number; totalQuestions: number }[],
  quizId: string,
  origin?: string
): string {
  const safeName = sanitizeCreatorName(creatorName);
  const shareUrl = getChallengeUrl(quizId, origin);
  let text = `👑 *${safeName}'s Challenge Leaderboard*\n\n`;

  if (entries && entries.length > 0) {
    entries.slice(0, 5).forEach((entry, idx) => {
      const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🔹";
      const cleanPlayer = sanitizeCreatorName(entry.playerName);
      text += `${medal} ${cleanPlayer}: ${entry.score}/${entry.totalQuestions} pts\n`;
    });
  } else {
    text += "No one has played yet. Be the first!\n";
  }

  text += `\nThink you can beat them? Take the challenge 👇\n${shareUrl}`;
  return text;
}

/**
 * Returns a web-safe WhatsApp share link.
 */
export function getWhatsAppShareUrl(text: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

/**
 * Returns a web-safe Facebook share link.
 */
export function getFacebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

/**
 * Asynchronously copies text to clipboard with graceful textarea fallback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // Try modern Clipboard API first
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback for older browsers or restricted permissions
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.setAttribute("aria-hidden", "true");
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

/**
 * Server-side metadata builder for public challenge routes (/quiz/play/[id]).
 */
export function buildQuizPlayMetadata(quiz: QuizPublicData | null, quizId: string): Metadata {
  const baseUrl = getBaseUrl();
  const playUrl = `${baseUrl}/quiz/play/${quizId}`;
  const ogImageUrl = `${baseUrl}/api/og/quiz/${quizId}`;

  if (!quiz) {
    const fallbackTitle = "Friendship Challenge | Click & Clique";
    const fallbackDesc = "Take the viral 10-question friendship challenge on Click & Clique!";
    return {
      title: fallbackTitle,
      description: fallbackDesc,
      alternates: {
        canonical: playUrl,
      },
      robots: {
        index: false,
        follow: false,
      },
      openGraph: {
        title: fallbackTitle,
        description: fallbackDesc,
        url: playUrl,
        siteName: "Click & Clique",
        type: "website",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: fallbackTitle,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: fallbackTitle,
        description: fallbackDesc,
        images: [ogImageUrl],
      },
    };
  }

  const safeCreator = sanitizeCreatorName(quiz.creatorName);
  const title = `How well do you know ${safeCreator}? 💖 | Click & Clique`;
  const description = `${safeCreator} created a 10-question friendship challenge. Think you know them? Take the quiz!`;

  return {
    title,
    description,
    alternates: {
      canonical: playUrl,
    },
    robots: {
      index: false,
      follow: true, // Social crawlers respect OpenGraph even with noindex, while preventing search engine junk indexing
    },
    openGraph: {
      title,
      description,
      url: playUrl,
      siteName: "Click & Clique",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Friendship Challenge by ${safeCreator} — Click & Clique`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}
