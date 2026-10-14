"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { Copy, Check, Trophy, ExternalLink, Sparkles, MessageCircle, AlertCircle } from "lucide-react";
import { quizAudio } from "@/lib/quiz/audio";
import { triggerConfetti } from "@/lib/quiz/confetti";
import { QuizPublicData } from "@/lib/quiz/types";

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
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

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

    // Share URL points directly to play page
    const playBase = `${window.location.origin}/quiz/play/${quizId}`;
    setShareUrl(playBase);
  }, [quizId]);

  const handleCopyLink = () => {
    quizAudio.playPop();
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const creatorName = quiz?.creatorName || "Your Friend";
  const pronoun = quiz?.gender === "female" ? "her" : "his";
  const pronounSubject = quiz?.gender === "female" ? "she" : "he";

  const whatsappText = `🎭\n\n${creatorName} is *blocking* 🚫📱 ${pronoun} _fake_ friends!\n\nWill ${pronounSubject} *block* you as well? 😂\n\nLet's see 👇\n${shareUrl}`;

  const handleWhatsAppShare = () => {
    quizAudio.playPop();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4">
        <div className="text-center font-black text-slate-800 text-lg animate-pulse">
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
        <Link href="/quiz" className="flex items-center gap-2 group">
          <div className="w-9 h-9 relative rounded-xl bg-white shadow-sm flex items-center justify-center p-1 border-2 border-slate-900">
            <Image
              src="/quiz/assets/img/logo-f.webp"
              alt="Logo"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900">
            Don&apos;t Block Me!
          </span>
        </Link>
        <Link
          href={`/quiz/scoreboard/${quizId}`}
          className="text-xs font-black bg-amber-300 text-slate-900 px-3.5 py-1.5 rounded-full border-2 border-slate-900 shadow-[0_2px_0_#0f172a] flex items-center gap-1.5 hover:bg-amber-400 transition-all cursor-pointer"
        >
          <Trophy size={14} />
          <span>Scoreboard</span>
        </Link>
      </header>

      {/* Main Card */}
      <main className="relative z-10 flex-1 max-w-xl mx-auto w-full px-4 py-6 flex flex-col items-center">
        <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-[0_12px_30px_rgba(56,189,248,0.18)] border-4 border-slate-900 text-center relative">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 font-black text-xs uppercase px-3 py-1 rounded-full border border-emerald-300 mb-3">
            <Sparkles size={14} />
            Quiz Ready! 🎉
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
            Share your link &amp; find your <span className="line-through decoration-red-500 decoration-4">fake</span> friends!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium">
            Apne doston ko challenge bhejein aur dekhein kon aapko sab se behtar janta hai!
          </p>

          {/* Copy Box */}
          <div className="mt-5 p-3 bg-slate-50 border-2 border-slate-900 rounded-2xl flex items-center justify-between gap-2 shadow-inner">
            <span className="text-xs font-mono font-bold text-slate-700 truncate text-left pl-1">
              {shareUrl}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Social Share Buttons */}
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-base sm:text-lg rounded-2xl border-2 border-slate-900 shadow-[0_5px_0_#0f172a] active:translate-y-1 transition-all flex items-center justify-center gap-2.5 cursor-pointer uppercase tracking-wider"
            >
              <MessageCircle size={22} className="fill-white" />
              <span>Share on WhatsApp</span>
            </button>

            <Link
              href={`/quiz/scoreboard/${quizId}`}
              className="w-full py-3.5 px-6 bg-amber-300 hover:bg-amber-400 text-slate-950 font-black text-sm sm:text-base rounded-2xl border-2 border-slate-900 shadow-[0_4px_0_#0f172a] active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <Trophy size={18} />
              <span>Check Friends Scoreboard</span>
            </Link>

            <Link
              href={shareUrl}
              className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:underline pt-2"
            >
              <span>Test Play your own quiz</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>

        <div className="w-full mt-6 bg-sky-100/70 rounded-2xl p-4 border border-sky-300 text-center text-xs font-medium text-sky-900">
          💡 <strong>Pro Tip:</strong> WhatsApp Status ya Instagram Story par yeh link lagayein taake sabhi dost test de sakein!
        </div>
      </main>
    </div>
  );
}
