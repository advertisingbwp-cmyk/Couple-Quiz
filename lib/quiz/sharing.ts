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
 * Application runtime environment categories.
 */
export type AppEnvironment = "development" | "preview" | "production";

export interface EnvironmentInfo {
  environment: AppEnvironment;
  isLocal: boolean;
  isPreview: boolean;
  isProduction: boolean;
  host: string;
}

/**
 * Options for generating challenge URLs.
 */
export interface ChallengeUrlOptions {
  /**
   * If true, allows routing to production domain ONLY when verified to exist there.
   * Defaults to false, guaranteeing preview quizzes are NEVER silently redirected to unverified production URLs.
   */
  verifiedOnProduction?: boolean;
}

/**
 * Accurately detects whether the application is running in local development,
 * a protected Vercel Preview deployment, or public Production.
 */
export function detectEnvironment(originOrHost?: string): EnvironmentInfo {
  let host = "";
  if (originOrHost) {
    try {
      if (originOrHost.startsWith("http://") || originOrHost.startsWith("https://")) {
        host = new URL(originOrHost).hostname.toLowerCase();
      } else {
        host = originOrHost.split(":")[0].toLowerCase().trim();
      }
    } catch {
      host = "";
    }
  }

  // 1. Local development check
  const isLocalHost =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local");

  if (isLocalHost || (!host && process.env.NODE_ENV === "development" && !process.env.VERCEL_ENV)) {
    return {
      environment: "development",
      isLocal: true,
      isPreview: false,
      isProduction: false,
      host: host || "localhost",
    };
  }

  // 2. Canonical production hostname check
  let prodHost = "couple-quiz-three.vercel.app";
  try {
    prodHost = new URL(getBaseUrl()).hostname.toLowerCase();
  } catch {
    // fallback
  }

  if (host && host === prodHost) {
    return {
      environment: "production",
      isLocal: false,
      isPreview: false,
      isProduction: true,
      host,
    };
  }

  // 3. Vercel Preview check:
  // If host is on vercel.app and does NOT match the canonical production host,
  // or VERCEL_ENV is "preview"
  const isVercelPreviewHost = host.endsWith(".vercel.app") && host !== prodHost;
  const isVercelEnvPreview = process.env.VERCEL_ENV === "preview";

  if (isVercelPreviewHost || (!host && isVercelEnvPreview)) {
    return {
      environment: "preview",
      isLocal: false,
      isPreview: true,
      isProduction: false,
      host: host || (process.env.VERCEL_URL?.toLowerCase() ?? "preview.vercel.app"),
    };
  }

  // 4. Default: Production
  return {
    environment: "production",
    isLocal: false,
    isPreview: false,
    isProduction: true,
    host: host || prodHost,
  };
}

/**
 * Generates the challenge URL for players.
 * Guaranteed to point to /quiz/play/[quizId] without tokens or secrets.
 *
 * SAFETY INVARIANTS:
 * - Localhost is preserved for local development and testing.
 * - Preview environments NEVER silently redirect to unverified Production URLs.
 *   They preserve the preview host for internal testing unless explicitly verified.
 * - Production uses the canonical public domain.
 */
export function getChallengeUrl(
  quizId: string,
  origin?: string,
  options?: ChallengeUrlOptions
): string {
  const env = detectEnvironment(origin);
  const cleanId = encodeURIComponent(quizId);

  // If in Preview environment:
  if (env.isPreview) {
    // NEVER silently replace a preview URL with production unless explicitly verified
    if (options?.verifiedOnProduction) {
      return `${getBaseUrl()}/quiz/play/${cleanId}`;
    }

    // Retain preview origin for safe internal testing
    if (origin) {
      try {
        const parsed = new URL(origin);
        return `${parsed.origin}/quiz/play/${cleanId}`;
      } catch {
        // Fall through
      }
    }

    if (process.env.VERCEL_URL) {
      const vercelUrl = process.env.VERCEL_URL.replace(/\/+$/, "");
      const proto = vercelUrl.startsWith("http") ? "" : "https://";
      return `${proto}${vercelUrl}/quiz/play/${cleanId}`;
    }

    return `/quiz/play/${cleanId}`;
  }

  // If in Local development:
  if (env.isLocal) {
    if (origin) {
      try {
        const parsed = new URL(origin);
        return `${parsed.origin}/quiz/play/${cleanId}`;
      } catch {
        // Fall through
      }
    }
    return `http://localhost:3000/quiz/play/${cleanId}`;
  }

  // In Production:
  if (origin && env.isProduction) {
    try {
      const parsed = new URL(origin);
      return `${parsed.origin}/quiz/play/${cleanId}`;
    } catch {
      // Fall through
    }
  }

  return `${getBaseUrl()}/quiz/play/${cleanId}`;
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
export function formatWhatsAppQuizShare(
  creatorName: string,
  quizId: string,
  origin?: string,
  options?: ChallengeUrlOptions
): string {
  const safeName = sanitizeCreatorName(creatorName);
  const shareUrl = getChallengeUrl(quizId, origin, options);
  const env = detectEnvironment(origin);

  if (env.isPreview) {
    return `⚠️ *Preview / Testing Environment* (Authorized Testers Only)\n\n✨ *Click & Clique Friendship Challenge* ✨\n\n${safeName} created a 10-question test quiz! 🎯\nNote: This link requires team access on Vercel Preview.\n\nTest the challenge here 👇\n${shareUrl}`;
  }

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
  origin?: string,
  options?: ChallengeUrlOptions
): string {
  const safeName = sanitizeCreatorName(creatorName);
  const shareUrl = getChallengeUrl(quizId, origin, options);
  const safeScore = Math.max(0, Math.floor(score));
  const safeTotal = Math.max(1, Math.floor(total));
  const env = detectEnvironment(origin);

  if (env.isPreview) {
    return `⚠️ *Preview / Testing Environment* (Authorized Testers Only)\n\n🎉 I scored ${safeScore}/${safeTotal} on ${safeName}'s Test Challenge!\n\nTest URL 👇\n${shareUrl}`;
  }

  return `🎉 I scored ${safeScore}/${safeTotal} on ${safeName}'s Friendship Challenge!\n\nCan you beat my score on the Click & Clique leaderboard? 🏆\n\nTry here 👇\n${shareUrl}`;
}

/**
 * WhatsApp message for sharing the challenge leaderboard.
 */
export function formatWhatsAppScoreboardShare(
  creatorName: string,
  entries: { playerName: string; score: number; totalQuestions: number }[],
  quizId: string,
  origin?: string,
  options?: ChallengeUrlOptions
): string {
  const safeName = sanitizeCreatorName(creatorName);
  const shareUrl = getChallengeUrl(quizId, origin, options);
  const env = detectEnvironment(origin);

  let text = env.isPreview
    ? `⚠️ *Preview / Testing Environment* (Authorized Testers Only)\n\n👑 *${safeName}'s Test Leaderboard*\n\n`
    : `👑 *${safeName}'s Challenge Leaderboard*\n\n`;

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
