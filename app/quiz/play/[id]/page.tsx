"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, Sparkles, AlertCircle, RefreshCw, Trophy } from "lucide-react";
import { quizAudio } from "@/lib/quiz/audio";
import { QuizPublicData } from "@/lib/quiz/types";
import { BrandMark } from "@/components/quiz-home/Illustrations";
import { MascotScene } from "@/components/design-preview/MascotScene";
import { ProgressPills } from "@/components/design-preview/ProgressPills";
import {
  VisualOptionCard,
  getGlassOptionGridClasses,
} from "@/components/quiz/VisualOptionCard";
import AdsterraFooter from "@/components/ads/AdsterraFooter";

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
  const [clientAttemptId, setClientAttemptId] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [savedAttempt, setSavedAttempt] = useState<{
    attemptId: string;
    playerName: string;
    completedAt?: number;
    playerToken?: string;
    score?: number;
    totalQuestions?: number;
  } | null>(null);
  const [isPlayAgain, setIsPlayAgain] = useState(false);

  const loadQuiz = React.useCallback(() => {
    setLoading(true);
    setError("");
    fetch(`/api/quiz/${quizId}`)
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
        setError("Network error loading quiz. Please check your connection.");
        setLoading(false);
      });
  }, [quizId]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  // Check for existing player attempt in this browser (returning player flow)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(`quiz_player_attempt_${quizId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.attemptId === "string") {
          setSavedAttempt(parsed);
          setPlayerName(parsed.playerName || "");
        }
      }
    } catch {
      // Storage unavailable or disabled
    }
  }, [quizId]);

  // Preload all quiz option images in background for zero-latency question transitions
  useEffect(() => {
    if (!quiz || typeof window === "undefined") return;
    const urls = new Set<string>();
    quiz.questions.forEach((q) => {
      q.options.forEach((opt) => {
        if (opt.imageUrl) urls.add(opt.imageUrl);
      });
    });
    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [quiz]);

  const handleStartPlay = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = playerName.trim();
    if (!clean) {
      setError("Please enter your name to play!");
      quizAudio.playWrong();
      return;
    }
    if (clean.length > 40) {
      setError("Player name must be 40 characters or less.");
      quizAudio.playWrong();
      return;
    }

    setError("");
    quizAudio.playPop();

    // Generate unique client attempt ID for robust server-side idempotency
    const attemptId = `att_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
    setClientAttemptId(attemptId);
    setIsStarted(true);
  };

  const handleSelectOption = (optionId: number) => {
    if (!quiz || isSubmitting || isTransitioning) return;
    quizAudio.playPop();

    const currentQ = quiz.questions[currentIndex];
    const updatedMap = {
      ...selectedAnswersMap,
      [currentQ.questionId]: optionId,
    };
    setSelectedAnswersMap(updatedMap);
    setIsTransitioning(true);

    // Support reduced motion preference
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const transitionDelay = prefersReducedMotion ? 40 : 220;

    setTimeout(() => {
      if (currentIndex + 1 < quiz.questions.length) {
        setCurrentIndex((prev) => prev + 1);
        setIsTransitioning(false);
      } else {
        setIsTransitioning(false);
        submitAttempt(updatedMap, clientAttemptId);
      }
    }, transitionDelay);
  };

  const submitAttempt = async (map: Record<string, number>, attemptId: string) => {
    setIsSubmitting(true);
    setSubmissionError("");
    quizAudio.playCelebration();

    const formattedAnswers = Object.entries(map).map(([questionId, selectedOptionId]) => ({
      questionId,
      selectedOptionId,
    }));

    try {
      const res = await fetch(`/api/quiz/${quizId}/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": attemptId,
        },
        body: JSON.stringify({
          playerName: playerName.trim(),
          answers: formattedAnswers,
          attemptId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Scoped key prevents collision with other quizzes
        sessionStorage.setItem(`quiz_result_${quizId}`, JSON.stringify(data));
        try {
          localStorage.setItem(
            `quiz_player_attempt_${quizId}`,
            JSON.stringify({
              attemptId: data.attemptId,
              playerName: data.playerName || playerName.trim(),
              completedAt: Date.now(),
              playerToken: data.playerToken,
              score: data.score,
              totalQuestions: data.totalQuestions,
            })
          );
        } catch {
          // localStorage disabled / full
        }
        router.push(`/quiz/result/${quizId}`);
      } else {
        setSubmissionError(data.error || "Failed to submit attempt. Please try again.");
        setIsSubmitting(false);
        quizAudio.playWrong();
      }
    } catch {
      setSubmissionError("Connection interrupted! We couldn't send your answers. Tap below to retry without losing progress.");
      setIsSubmitting(false);
      quizAudio.playWrong();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e3f2fd] via-[#f3e8ff] to-[#fce7f3] flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/90 shadow-sm text-center font-black text-slate-800 text-sm flex items-center gap-2.5">
          <Loader2 className="animate-spin text-purple-600" size={20} />
          <span>Loading challenge... ✦</span>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e3f2fd] via-[#f3e8ff] to-[#fce7f3] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white/85 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/90 shadow-[0_10px_30px_rgba(102,80,183,0.1)] text-center">
          <AlertCircle size={44} className="text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1.5 tracking-tight">
            Quiz Unavailable
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 mb-5 leading-relaxed">
            {error || "This quiz may have been deleted, or could not be reached right now."}
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
            <button
              type="button"
              onClick={loadQuiz}
              className="py-2.5 px-5 bg-white hover:bg-slate-50 text-slate-800 font-black rounded-xl border border-slate-200 shadow-xs text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>
            <Link
              href="/quiz"
              className="py-2.5 px-5 bg-gradient-to-r from-purple-600 to-sky-500 hover:from-purple-500 hover:to-sky-400 text-white font-black rounded-xl shadow-[0_3px_12px_rgba(102,80,183,0.25)] text-xs sm:text-sm transition-all text-center inline-flex items-center justify-center"
            >
              Create Your Own Quiz
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const creatorName = quiz.creatorName;
  const currentQ = quiz.questions[currentIndex];
  const isPhotographic = currentQ.options.every(
    (opt) =>
      opt.imageUrl &&
      (opt.imageUrl.endsWith(".webp") ||
        opt.imageUrl.endsWith(".jpg") ||
        opt.imageUrl.endsWith(".png"))
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e3f2fd] via-[#f3e8ff] to-[#fce7f3] text-slate-800 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-200">
      {/* Ambient background light orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-300/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-purple-300/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-pink-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <header className="relative z-10 max-w-xl mx-auto w-full px-3.5 sm:px-4 pt-2.5 pb-1 flex items-center justify-between">
        <Link
          href="/quiz"
          className="inline-flex items-center gap-1.5 group focus-visible:outline-2 focus-visible:outline-purple-500 rounded-lg"
          aria-label="Click & Clique homepage"
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <BrandMark />
          </div>
          <span className="text-sm sm:text-base font-black tracking-tight text-slate-900">
            click <span className="text-purple-600 font-medium">&amp;</span> clique
            <span className="text-pink-500">.</span>
          </span>
        </Link>
        {isStarted ? (
          <span className="text-[11px] font-black bg-white/80 text-purple-700 px-3 py-1 rounded-full border border-purple-200 shadow-xs">
            {currentIndex + 1} of {quiz.questions.length}
          </span>
        ) : (
          <Link
            href={`/quiz/scoreboard/${quizId}`}
            className="inline-flex items-center gap-1.5 text-xs font-black text-purple-700 bg-white/85 hover:bg-white px-3 py-1.5 rounded-full border border-purple-200/80 shadow-xs hover:border-purple-300 transition-all cursor-pointer"
            aria-label="View Leaderboard"
          >
            <Trophy size={13} className="text-amber-500" />
            <span>Leaderboard</span>
          </Link>
        )}
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-xl mx-auto w-full px-3 sm:px-4 py-2 flex flex-col justify-start">
        {!isStarted ? (
          savedAttempt && !isPlayAgain ? (
            /* Returning Player Screen */
            <div className="w-full max-w-md mx-auto bg-white/85 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-[0_12px_36px_rgba(102,80,183,0.12)] border border-white/90 text-center relative mt-2 sm:mt-4">
              <div className="w-full flex justify-center -mb-2 z-10 relative">
                <MascotScene mood="happy" />
              </div>

              <div className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 font-black text-xs uppercase px-3 py-1 rounded-full border border-purple-200/80 mb-3 shadow-xs">
                <Sparkles size={13} className="text-purple-600" />
                <span>Welcome Back!</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                Hey{" "}
                <span className="text-purple-600 underline decoration-amber-300 decoration-4 underline-offset-4">
                  {savedAttempt.playerName}
                </span>
                ! ✦
              </h1>
              {typeof savedAttempt.score === "number" && typeof savedAttempt.totalQuestions === "number" && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200/80 rounded-full text-xs font-black text-purple-800">
                  <span>Your Previous Score:</span>
                  <span className="text-purple-700 font-black text-sm">{savedAttempt.score}/{savedAttempt.totalQuestions}</span>
                </div>
              )}
              <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium">
                You&apos;ve already completed {creatorName}&apos;s challenge. What would you like to do?
              </p>

              <div className="mt-6 space-y-3">
                <Link
                  href={`/quiz/result/${quizId}?from=returning`}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 to-sky-500 hover:from-purple-500 hover:to-sky-400 text-white font-black text-sm rounded-xl shadow-[0_4px_16px_rgba(102,80,183,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  <span>View My Result</span>
                  <ArrowRight size={18} className="stroke-[3]" />
                </Link>

                <Link
                  href={`/quiz/scoreboard/${quizId}`}
                  className="w-full py-3 px-6 bg-white hover:bg-slate-50 text-slate-800 font-black text-sm rounded-xl border border-slate-200 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  <Trophy size={16} className="text-amber-500" />
                  <span>View Leaderboard</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    quizAudio.playPop();
                    setIsPlayAgain(true);
                  }}
                  className="w-full py-2.5 px-6 text-purple-700 hover:text-purple-900 hover:bg-purple-50/60 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Play Again (Retake Challenge)
                </button>
              </div>
            </div>
          ) : (
            /* Step 1: Friend Name Input Screen */
            <div className="w-full max-w-md mx-auto bg-white/85 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-[0_12px_36px_rgba(102,80,183,0.12)] border border-white/90 text-center relative mt-2 sm:mt-4">
              <div className="w-full flex justify-center -mb-2 z-10 relative">
                <MascotScene mood="happy" />
              </div>

              <div className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 font-black text-xs uppercase px-3 py-1 rounded-full border border-purple-200/80 mb-3 shadow-xs">
                <Sparkles size={13} className="text-purple-600" />
                <span>Friendship Challenge</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                How well do you know{" "}
                <span className="text-purple-600 underline decoration-amber-300 decoration-4 underline-offset-4">
                  {creatorName}
                </span>
                ? ✦
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium">
                Answer {quiz.questions.length} questions to reveal your match score!
              </p>

              <form onSubmit={handleStartPlay} className="mt-5 space-y-3.5 text-left">
                <div>
                  <label
                    htmlFor="player-name-input"
                    className="block text-xs font-black uppercase text-slate-700 tracking-wider mb-1.5"
                  >
                    Enter Your Name
                  </label>
                  <input
                    id="player-name-input"
                    type="text"
                    value={playerName}
                    onChange={(e) => {
                      setPlayerName(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="e.g. Zainab or Hamza"
                    maxLength={40}
                    className="w-full px-4 py-3 text-sm sm:text-base font-bold bg-white text-slate-800 rounded-xl border border-slate-300 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-xs"
                  />
                  {error && (
                    <p className="text-xs font-bold text-rose-600 mt-1.5 ml-1" role="alert">
                      {error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 to-sky-500 hover:from-purple-500 hover:to-sky-400 text-white font-black text-sm sm:text-base rounded-xl shadow-[0_4px_16px_rgba(102,80,183,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  <span>Accept Challenge</span>
                  <ArrowRight size={18} className="stroke-[3]" />
                </button>
              </form>

              {/* Requirement 4: Clear View Leaderboard link on challenge landing page, available even without playing */}
              <div className="mt-4 pt-3.5 border-t border-slate-200/60 text-center">
                <Link
                  href={`/quiz/scoreboard/${quizId}`}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-purple-700 hover:text-purple-800 transition-colors py-1 px-3 rounded-lg hover:bg-purple-50/60"
                >
                  <Trophy size={14} className="text-amber-500" />
                  <span>View Challenge Leaderboard</span>
                </Link>
              </div>
            </div>
          )
        ) : isSubmitting ? (
          <div className="w-full max-w-md mx-auto bg-white/85 backdrop-blur-xl rounded-3xl p-8 border border-white/90 shadow-[0_12px_36px_rgba(102,80,183,0.12)] text-center">
            <div className="w-full flex justify-center -mb-2 z-10 relative">
              <MascotScene mood="happy" />
            </div>
            <Loader2 size={36} className="animate-spin text-purple-600 mx-auto mb-3" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Calculating your score...
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              Checking how well you matched {creatorName}! 🎯
            </p>
          </div>
        ) : (
          <div className="w-full space-y-2 sm:space-y-3">
            {/* Top Progress Tracker (10 Numbered Pills) */}
            <ProgressPills
              total={quiz.questions.length}
              current={currentIndex + 1}
            />

            {/* Mascot Duo positioned snug above the card */}
            <div className="w-full flex justify-center -mb-2.5 z-10 relative">
              <MascotScene mood={isTransitioning ? "thinking" : "happy"} />
            </div>

            {/* Submission Error Banner */}
            {submissionError && (
              <div
                className="bg-rose-50 border border-rose-300 text-rose-700 p-3.5 rounded-2xl shadow-xs text-center"
                role="alert"
              >
                <p className="text-xs sm:text-sm font-black mb-2">{submissionError}</p>
                <button
                  type="button"
                  onClick={() => submitAttempt(selectedAnswersMap, clientAttemptId)}
                  className="py-2 px-4 bg-rose-600 text-white font-black text-xs uppercase rounded-xl shadow-xs hover:bg-rose-500 transition-all cursor-pointer"
                >
                  Retry Submission 🚀
                </button>
              </div>
            )}

            {/* Question Card */}
            <article className="w-full bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-white/90 shadow-[0_8px_24px_rgba(102,80,183,0.08)] text-center relative overflow-hidden transition-all duration-300">
              {/* Soft decorative line across top of card */}
              <div className="absolute top-0 inset-x-8 h-1 bg-gradient-to-r from-transparent via-purple-300/40 to-transparent" />

              {/* Question Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300/80 font-black text-[10px] sm:text-xs uppercase tracking-wider mb-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>
                  Question {currentIndex + 1} of {quiz.questions.length}
                </span>
              </div>

              {/* Question Title */}
              <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-snug px-1">
                {currentQ.question}
              </h2>

              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-1">
                What do you think{" "}
                <span className="text-purple-600 font-bold">{creatorName}</span> picked?
              </p>
            </article>

            {/* Visual Options Grid */}
            <section aria-label="Answer Options" className="w-full pt-0.5">
              <div
                className={getGlassOptionGridClasses(
                  currentQ.options.length,
                  isPhotographic
                )}
                role="radiogroup"
                aria-label={currentQ.question}
              >
                {currentQ.options.map((option, index) => (
                  <VisualOptionCard
                    key={option.id}
                    option={option}
                    optionIndex={index}
                    isSelected={
                      selectedAnswersMap[currentQ.questionId] === option.id
                    }
                    onSelect={handleSelectOption}
                    disabled={isTransitioning || isSubmitting}
                    totalOptions={currentQ.options.length}
                    forceTextCard={!isPhotographic && !option.imageUrl?.endsWith(".svg")}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
      <AdsterraFooter />
    </div>
  );
}

