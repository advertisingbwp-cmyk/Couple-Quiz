"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trophy, MessageCircle, RefreshCw, Sparkles, AlertCircle } from "lucide-react";
import { quizAudio } from "@/lib/quiz/audio";
import { triggerConfetti } from "@/lib/quiz/confetti";

export default function QuizResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const quizId = resolvedParams.id;

  const [result, setResult] = useState<{
    score: number;
    totalQuestions: number;
    creatorName: string;
    gender: "male" | "female";
  } | null>(null);

  const [dialogueStep, setDialogueStep] = useState(0);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  useEffect(() => {
    // Read scoped session result
    const raw = sessionStorage.getItem(`quiz_result_${quizId}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setResult(parsed);
      } catch {
        // Corrupt session data
      }
    }
    setHasCheckedSession(true);
  }, [quizId]);

  useEffect(() => {
    if (!result) return;
    if (dialogueStep < 4) {
      const timer = setTimeout(() => {
        quizAudio.playPop();
        setDialogueStep((prev) => prev + 1);
      }, 900);
      return () => clearTimeout(timer);
    } else {
      triggerConfetti();
      quizAudio.playCelebration();
    }
  }, [dialogueStep, result]);

  if (hasCheckedSession && !result) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 border-4 border-slate-900 text-center shadow-xl">
          <AlertCircle size={40} className="text-amber-500 mx-auto mb-2" />
          <h2 className="text-xl font-black text-slate-900 mb-1">No Active Result Found</h2>
          <p className="text-xs text-slate-600 mb-4">
            Aapne shayad abhi tak yeh quiz complete nahi kiya ya session expire ho chuka hai.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href={`/quiz/play/${quizId}`}
              className="py-3 px-6 bg-sky-400 hover:bg-sky-500 text-slate-950 font-black rounded-2xl border-2 border-slate-900 text-xs sm:text-sm uppercase tracking-wider"
            >
              Play Challenge Now
            </Link>
            <Link
              href="/quiz"
              className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl border border-slate-300 text-xs sm:text-sm uppercase"
            >
              Create My Own Quiz
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const score = result?.score ?? 0;
  const total = result?.totalQuestions ?? 10;
  const creatorName = result?.creatorName || "Your Friend";
  const ratio = total > 0 ? score / total : 0;

  let reactionText = "";
  let reactionEmoji = "";
  let badgeColor = "";

  if (ratio >= 0.8) {
    reactionText = "You made me smile! 😆 I'll never block you!";
    reactionEmoji = "❤️ True Bestie!";
    badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300";
  } else if (ratio >= 0.5) {
    reactionText = "I won't block you... but please leave me alone 😕";
    reactionEmoji = "🙂 Average Friend";
    badgeColor = "bg-amber-100 text-amber-800 border-amber-300";
  } else {
    reactionText = "BYE! BYE! … I will block you… huh! 🤬";
    reactionEmoji = "🚨 FAKE FRIEND ALERT!";
    badgeColor = "bg-red-100 text-red-800 border-red-300";
  }

  const handleShareResultWhatsApp = () => {
    quizAudio.playPop();
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/quiz/play/${quizId}` : "";
    const msg = `🎉 I scored ${score}/${total} on ${creatorName}'s Friendship Challenge!\n\nCan you beat my score or will ${creatorName} block you? 😂\n\nTry here 👇\n${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

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
          className="text-xs font-black bg-amber-300 text-slate-900 px-3 py-1 rounded-full border-2 border-slate-900 shadow-[0_2px_0_#0f172a] flex items-center gap-1.5"
        >
          <Trophy size={14} />
          <span>Scores</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-xl mx-auto w-full px-4 py-5 flex flex-col justify-center">
        {/* Comic Dialogue Stage */}
        <div className="w-full bg-slate-900 text-white rounded-3xl p-5 mb-4 shadow-xl border-4 border-slate-900">
          <span className="text-[10px] font-black tracking-widest text-amber-300 uppercase block mb-3">
            🎭 Friendship Conversation
          </span>

          <div className="space-y-2.5 text-xs sm:text-sm font-bold">
            <div className="flex items-center gap-2 animate-in fade-in">
              <span className="bg-red-500 text-white px-2 py-0.5 rounded-lg text-[10px] shrink-0 font-black">
                {creatorName}
              </span>
              <span>&ldquo;Should I block you? 🤬&rdquo;</span>
            </div>

            {dialogueStep >= 1 && (
              <div className="flex items-center gap-2 animate-in fade-in">
                <span className="bg-sky-500 text-white px-2 py-0.5 rounded-lg text-[10px] shrink-0 font-black">
                  You
                </span>
                <span>&ldquo;Wait... I&apos;m not your fake friend! 🥺&rdquo;</span>
              </div>
            )}

            {dialogueStep >= 2 && (
              <div className="flex items-center gap-2 animate-in fade-in">
                <span className="bg-red-500 text-white px-2 py-0.5 rounded-lg text-[10px] shrink-0 font-black">
                  {creatorName}
                </span>
                <span>&ldquo;Then prove you&apos;re a real friend! 😏&rdquo;</span>
              </div>
            )}

            {dialogueStep >= 3 && (
              <div className="flex items-center gap-2 animate-in fade-in">
                <span className="bg-sky-500 text-white px-2 py-0.5 rounded-lg text-[10px] shrink-0 font-black">
                  You
                </span>
                <span>&ldquo;Just look at my score! 🫣&rdquo;</span>
              </div>
            )}

            {dialogueStep >= 4 && (
              <div className="flex items-center gap-2 animate-in fade-in text-amber-300">
                <span className="bg-red-500 text-white px-2 py-0.5 rounded-lg text-[10px] shrink-0 font-black">
                  {creatorName}
                </span>
                <span>&ldquo;Okay... let&apos;s see! 👀&rdquo;</span>
              </div>
            )}
          </div>
        </div>

        {/* Score Card */}
        {dialogueStep >= 4 && (
          <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-[0_12px_30px_rgba(56,189,248,0.18)] border-4 border-slate-900 text-center relative animate-in zoom-in-95 duration-200">
            <div className={`inline-flex items-center gap-1.5 font-black text-xs uppercase px-3 py-1 rounded-full border mb-3 ${badgeColor}`}>
              <Sparkles size={14} />
              {reactionEmoji}
            </div>

            <div className="my-2">
              <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">
                {score}
              </span>
              <span className="text-2xl font-black text-slate-400"> / {total}</span>
            </div>

            <p className="text-sm sm:text-base font-extrabold text-slate-800 mt-2 px-2">
              &ldquo;{reactionText}&rdquo;
            </p>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleShareResultWhatsApp}
                className="w-full py-3.5 px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-sm sm:text-base rounded-2xl border-2 border-slate-900 shadow-[0_4px_0_#0f172a] active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <MessageCircle size={18} className="fill-white" />
                <span>Share Score on WhatsApp</span>
              </button>

              <Link
                href={`/quiz/scoreboard/${quizId}`}
                className="w-full py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs sm:text-sm rounded-2xl border-2 border-slate-900 shadow-[0_3px_0_#0f172a] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <Trophy size={16} />
                <span>See Leaderboard ({creatorName})</span>
              </Link>

              <div className="pt-2">
                <Link
                  href="/quiz"
                  className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-sm sm:text-base rounded-2xl border-2 border-slate-900 shadow-[0_6px_0_#0f172a] active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  <RefreshCw size={18} className="stroke-[3]" />
                  <span>Now, Create Your Own Quiz! 🔥</span>
                </Link>
                <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                  Challenge {creatorName} &amp; all your other friends to see who knows you!
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
