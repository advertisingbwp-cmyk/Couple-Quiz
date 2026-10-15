"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  Trophy,
  ExternalLink,
  Sparkles,
  MessageCircle,
  Share2,
  AlertCircle,
  Play,
} from "lucide-react";
import { quizAudio } from "@/lib/quiz/audio";
import { triggerConfetti } from "@/lib/quiz/confetti";
import { QuizPublicData } from "@/lib/quiz/types";
import { BrandMark } from "@/components/quiz-home/Illustrations";
import {
  getChallengeUrl,
  sanitizeCreatorName,
  formatWhatsAppQuizShare,
  getWhatsAppShareUrl,
  getFacebookShareUrl,
  copyToClipboard,
} from "@/lib/quiz/sharing";

export default function QuizSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const quizId = resolvedParams.id;

  const [quiz, setQuiz] = useState<QuizPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [shareUrl, setShareUrl] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    fetch(`/api/quiz/${quizId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.quiz) {
          setQuiz(data.quiz);
          triggerConfetti();
          quizAudio.playCelebration();
        } else {
          setError(data.error || "Quiz not found.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Network error loading quiz.");
        setLoading(false);
      });

    const origin = typeof window !== "undefined" ? window.location.origin : undefined;
    setShareUrl(getChallengeUrl(quizId, origin));

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
  }, [quizId]);

  const creatorName = sanitizeCreatorName(quiz?.creatorName);

  const handleCopyLink = async () => {
    quizAudio.playPop();
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2500);
    } else {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 3000);
    }
  };

  const handleWhatsAppShare = () => {
    quizAudio.playPop();
    const origin = typeof window !== "undefined" ? window.location.origin : undefined;
    const text = formatWhatsAppQuizShare(creatorName, quizId, origin);
    window.open(getWhatsAppShareUrl(text), "_blank", "noopener,noreferrer");
  };

  const handleFacebookShare = () => {
    quizAudio.playPop();
    window.open(getFacebookShareUrl(shareUrl), "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    quizAudio.playPop();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `How well do you know ${creatorName}? 💖`,
          text: `Take ${creatorName}'s 10-question friendship dare on Click & Clique!`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or aborted sharing; safe to ignore
        if ((err as Error)?.name !== "AbortError") {
          handleCopyLink();
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4">
        <div className="text-center font-black text-slate-800 text-lg animate-pulse" role="status">
          Loading your quiz link... 🚀
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 border-4 border-slate-900 text-center shadow-xl">
          <AlertCircle size={40} className="text-red-500 mx-auto mb-2" />
          <h2 className="text-xl font-black text-slate-900 mb-1">Quiz Link Error</h2>
          <p className="text-xs text-slate-600 mb-4">{error || "Could not retrieve quiz details."}</p>
          <Link
            href="/quiz"
            className="inline-block py-3 px-6 bg-emerald-400 text-slate-950 font-black rounded-2xl border-2 border-slate-900 text-sm uppercase"
          >
            Create New Quiz
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#8AC0EF]/30 via-sky-50 to-amber-50/40 text-slate-900 flex flex-col font-sans relative overflow-x-hidden">
      {/* Background Clouds */}
      <div className="absolute top-0 left-0 right-0 h-44 bg-[url('/quiz/assets/img/player/clouds-bg.webp')] bg-repeat-x bg-contain opacity-40 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-xl mx-auto w-full px-4 pt-5 pb-2 flex items-center justify-between">
        <Link
          href="/quiz"
          className="inline-flex items-center gap-2.5 no-underline group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6650b7]"
          aria-label="Click & Clique homepage"
        >
          <BrandMark />
          <span className="text-xl font-black tracking-tight text-[#29324c]">
            click <span className="text-[#6650b7] font-medium">&amp;</span> clique
            <span className="text-[#bd4a66]">.</span>
          </span>
        </Link>
        <Link
          href={`/quiz/scoreboard/${quizId}`}
          className="text-xs font-black bg-[#ffce71] text-[#29324c] px-3.5 py-1.5 rounded-full border-2 border-[#29324c] shadow-[0_2px_0_#d6ad63] flex items-center gap-1.5 hover:bg-[#ffdb92] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#29324c]"
          aria-label="View quiz scoreboard"
        >
          <Trophy size={14} />
          <span>Scoreboard</span>
        </Link>
      </header>

      {/* Main Card */}
      <main className="relative z-10 flex-1 max-w-xl mx-auto w-full px-4 py-4 sm:py-6 flex flex-col items-center">
        <div className="w-full bg-white rounded-3xl p-5 sm:p-8 shadow-[0_12px_30px_rgba(56,189,248,0.18)] border-4 border-slate-900 text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 font-black text-xs uppercase px-3 py-1 rounded-full border border-emerald-300 mb-3">
            <Sparkles size={14} />
            Your Quiz Is Ready! 🎉
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
            {creatorName}&apos;s Challenge is live! ✨
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium">
            Apne doston ko challenge bhejein aur dekhein kon aapko sab se behtar janta hai!
          </p>

          {/* Social Link Preview Card */}
          <div className="mt-5 p-3.5 bg-sky-50/70 border-2 border-dashed border-sky-300 rounded-2xl text-left shadow-sm">
            <div className="text-[10px] font-black uppercase text-sky-800 mb-1.5 flex items-center justify-between">
              <span>Link Preview</span>
              <span className="text-slate-400 font-normal">Social link card</span>
            </div>
            <div className="bg-white rounded-xl border-2 border-slate-900 p-3 flex gap-3 items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ffce71] to-[#bd4a66] border-2 border-slate-900 shrink-0 flex items-center justify-center text-xl shadow-sm">
                🎯
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-slate-900 truncate">
                  How well do you know {creatorName}? 💖
                </div>
                <div className="text-[11px] text-slate-600 truncate mt-0.5 font-medium">
                  10-question friendship dare • Click &amp; Clique
                </div>
                <div className="text-[10px] text-sky-700 font-mono truncate mt-0.5">
                  {shareUrl || `.../quiz/play/${quizId}`}
                </div>
              </div>
            </div>
          </div>

          {/* Copy Box */}
          <div className="mt-4 p-3 bg-slate-50 border-2 border-slate-900 rounded-2xl flex items-center justify-between gap-2 shadow-inner">
            <span
              className="text-xs font-mono font-bold text-slate-700 truncate text-left pl-1"
              title={shareUrl}
            >
              {shareUrl}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              aria-label={copyStatus === "copied" ? "Link copied" : "Copy challenge link"}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              {copyStatus === "copied" ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : copyStatus === "error" ? (
                <>
                  <AlertCircle size={14} className="text-amber-400" />
                  <span>Failed</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="sr-only" aria-live="polite">
            {copyStatus === "copied"
              ? "Challenge link copied to clipboard!"
              : copyStatus === "error"
              ? "Failed to copy link. Please manually select and copy."
              : ""}
          </div>

          {/* Social Share Buttons */}
          <div className="mt-5 space-y-2.5">
            {/* Primary WhatsApp Share */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              aria-label="Share challenge on WhatsApp"
              className="w-full py-3.5 sm:py-4 px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-base sm:text-lg rounded-2xl border-2 border-slate-900 shadow-[0_5px_0_#0f172a] active:translate-y-1 transition-all flex items-center justify-center gap-2.5 cursor-pointer uppercase tracking-wider focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
            >
              <MessageCircle size={22} className="fill-white" />
              <span>Share on WhatsApp</span>
            </button>

            {/* Secondary Share Actions: Native Web Share & Facebook */}
            <div className="grid grid-cols-2 gap-2">
              {canNativeShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  aria-label="Open native device share menu"
                  className="py-3 px-3 bg-sky-400 hover:bg-sky-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl border-2 border-slate-900 shadow-[0_3px_0_#0f172a] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase"
                >
                  <Share2 size={16} />
                  <span>Share via App</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleFacebookShare}
                aria-label="Share challenge on Facebook"
                className={`py-3 px-3 bg-[#1877F2] hover:bg-[#166fe5] text-white font-black text-xs sm:text-sm rounded-xl border-2 border-slate-900 shadow-[0_3px_0_#0f172a] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase ${
                  !canNativeShare ? "col-span-2" : ""
                }`}
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook</span>
              </button>
            </div>

            {/* Check Scoreboard Button */}
            <Link
              href={`/quiz/scoreboard/${quizId}`}
              className="w-full py-3 px-6 bg-amber-300 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl border-2 border-slate-900 shadow-[0_3px_0_#0f172a] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            >
              <Trophy size={16} />
              <span>Check Friends Scoreboard</span>
            </Link>

            {/* Preview Challenge / Test Play */}
            <div className="pt-2">
              <Link
                href={`/quiz/play/${quizId}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 py-1 px-2 rounded-lg"
              >
                <Play size={13} className="fill-sky-700" />
                <span>Preview Challenge (Play test)</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        </div>

        {/* Growth Pro-Tip */}
        <div className="w-full mt-4 sm:mt-6 bg-sky-100/80 rounded-2xl p-3.5 sm:p-4 border-2 border-sky-300 text-center text-xs font-medium text-sky-950 shadow-sm">
          💡 <strong>Pro Tip:</strong> WhatsApp Status ya Instagram Story par yeh link lagayein taake sabhi dost test de sakein!
        </div>
      </main>
    </div>
  );
}
