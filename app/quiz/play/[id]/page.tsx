"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { quizAudio } from "@/lib/quiz/audio";
import { QuizPublicData } from "@/lib/quiz/types";

export default function QuizPlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const quizId = resolvedParams.id;
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswersMap, setSelectedAnswersMap] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const dataToken = searchParams.get("data");
    if (dataToken) setToken(dataToken);

    const endpoint = dataToken
      ? `/api/quiz/${quizId}?data=${encodeURIComponent(dataToken)}`
      : `/api/quiz/${quizId}`;

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.quiz) {
          setQuiz(data.quiz);
        } else {
          setError(data.error || "Quiz not found or has been deleted.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Network error loading quiz.");
        setLoading(false);
      });
  }, [quizId]);

  const handleStartPlay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError("Please enter your name to play!");
      quizAudio.playWrong();
      return;
    }
    setError("");
    quizAudio.playPop();
    setIsStarted(true);
  };

  const handleSelectOption = (optionId: number) => {
    if (!quiz) return;
    quizAudio.playPop();

    const currentQ = quiz.questions[currentIndex];
    const updatedMap = {
      ...selectedAnswersMap,
      [currentQ.questionId]: optionId,
    };
    setSelectedAnswersMap(updatedMap);

    if (currentIndex + 1 < quiz.questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // All questions completed, submit map
      submitAttempt(updatedMap);
    }
  };

  const submitAttempt = async (map: Record<string, number>) => {
    setIsSubmitting(true);
    quizAudio.playCelebration();

    const formattedAnswers = Object.entries(map).map(([questionId, selectedOptionId]) => ({
      questionId,
      selectedOptionId,
    }));

    try {
      const res = await fetch(`/api/quiz/${quizId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: playerName.trim(),
          answers: formattedAnswers,
          data: token,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Scoped key prevents collision with other quizzes
        sessionStorage.setItem(`quiz_result_${quizId}`, JSON.stringify(data));
        const redirectUrl = token
          ? `/quiz/result/${quizId}?data=${encodeURIComponent(token)}`
          : `/quiz/result/${quizId}`;
        router.push(redirectUrl);
      } else {
        alert(data.error || "Failed to submit. Try again.");
        setIsSubmitting(false);
      }
    } catch {
      alert("Network error submitting quiz.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4">
        <div className="text-center font-black text-slate-800 text-lg animate-pulse flex items-center gap-2">
          <Loader2 className="animate-spin text-sky-600" />
          <span>Loading challenge... 🎯</span>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 border-4 border-slate-900 text-center shadow-xl">
          <AlertCircle size={40} className="text-red-500 mx-auto mb-2" />
          <h2 className="text-xl font-black text-slate-900 mb-1">Quiz Not Found</h2>
          <p className="text-xs text-slate-600 mb-4">{error || "This quiz may have been deleted or expired."}</p>
          <Link
            href="/quiz"
            className="inline-block py-3 px-6 bg-emerald-400 text-slate-950 font-black rounded-2xl border-2 border-slate-900 text-sm uppercase"
          >
            Create Your Own Quiz
          </Link>
        </div>
      </div>
    );
  }

  const creatorName = quiz.creatorName;
  const currentQ = quiz.questions[currentIndex];
  const progressPercent = Math.round(((currentIndex) / quiz.questions.length) * 100);

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
        {isStarted && (
          <span className="text-xs font-black bg-amber-300 text-slate-900 px-3 py-1 rounded-full border-2 border-slate-900 shadow-[0_2px_0_#0f172a]">
            {currentIndex + 1} / {quiz.questions.length} Qs
          </span>
        )}
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-xl mx-auto w-full px-4 py-4 flex flex-col justify-center">
        {!isStarted ? (
          /* Step 1: Friend Name Input Screen */
          <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-[0_12px_30px_rgba(56,189,248,0.18)] border-4 border-slate-900 text-center relative animate-in zoom-in-95 duration-200">
            <div className="inline-flex items-center gap-1.5 bg-red-100 text-red-800 font-black text-xs uppercase px-3 py-1 rounded-full border border-red-300 mb-3">
              <Sparkles size={14} />
              Friendship Dare Challenge
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              Will <span className="text-sky-600 bg-sky-100 px-2 rounded-lg">{creatorName}</span> block you? 🚫📱
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium">
              Prove that you are a real friend! Answer {quiz.questions.length} questions to reveal your friendship score!
            </p>

            <form onSubmit={handleStartPlay} className="mt-6 space-y-4 text-left">
              <div>
                <label htmlFor="player-name-input" className="block text-xs font-black uppercase text-slate-700 tracking-wider mb-1.5">
                  Enter Your Name:
                </label>
                <input
                  id="player-name-input"
                  type="text"
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Your full or nickname..."
                  maxLength={30}
                  className="w-full px-4 py-3.5 text-base font-bold bg-slate-50 text-slate-900 rounded-2xl border-2 border-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-200 focus:bg-white transition-all shadow-inner"
                />
                {error && <p className="text-xs font-bold text-red-600 mt-1.5 ml-1">{error}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-slate-950 font-black text-base sm:text-lg rounded-2xl border-2 border-slate-900 shadow-[0_5px_0_#0f172a] active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <span>Accept Challenge</span>
                <ArrowRight size={20} className="stroke-[3]" />
              </button>
            </form>
          </div>
        ) : isSubmitting ? (
          <div className="w-full bg-white rounded-3xl p-8 border-4 border-slate-900 text-center shadow-xl">
            <Loader2 size={36} className="animate-spin text-sky-600 mx-auto mb-3" />
            <h2 className="text-xl font-black text-slate-900">Calculating your score...</h2>
            <p className="text-xs text-slate-500 mt-1">Dekhein {creatorName} aapko block karta hai ya nahi! 😂</p>
          </div>
        ) : (
          <div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-200 h-3 rounded-full border-2 border-slate-900 overflow-hidden mb-4 p-0.5 shadow-inner">
              <div
                className="bg-gradient-to-r from-sky-400 to-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Question Card */}
            <div className="w-full bg-white rounded-3xl p-6 sm:p-7 shadow-[0_12px_30px_rgba(56,189,248,0.18)] border-4 border-slate-900 relative animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-lg border border-sky-200">
                  Question {currentIndex + 1} of {quiz.questions.length}
                </span>
                <span className="text-xl">{currentQ.emoji || "❓"}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug mb-6">
                {currentQ.question}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectOption(option.id)}
                    className="w-full text-left p-4 rounded-2xl border-2 border-slate-900 font-bold text-sm sm:text-base bg-slate-50 hover:bg-amber-300 text-slate-900 shadow-[0_3px_0_#0f172a] active:translate-y-1 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>{option.text}</span>
                    <span className="text-xs font-black uppercase text-slate-400">
                      Tap
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
