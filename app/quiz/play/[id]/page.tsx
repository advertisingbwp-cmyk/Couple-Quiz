"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { quizAudio } from "@/lib/quiz/audio";
import { QuizPublicData } from "@/lib/quiz/types";
import { BrandMark } from "@/components/quiz-home/Illustrations";
import {
  VisualOptionCard,
  getVisualOptionGridClasses,
} from "@/components/quiz/VisualOptionCard";

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
      <div className="min-h-screen bg-[#edf7ff] flex items-center justify-center p-4">
        <div className="text-center font-black text-[#29324c] text-base flex items-center gap-2.5">
          <Loader2 className="animate-spin text-[#6650b7]" size={24} />
          <span>Loading challenge... ✦</span>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-[#edf7ff] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#29324c] shadow-[0_6px_0_#d6ad63] text-center">
          <AlertCircle size={44} className="text-[#a52938] mx-auto mb-3" />
          <h2 className="text-xl sm:text-2xl font-black text-[#29324c] mb-1.5 tracking-tight">
            Quiz Unavailable
          </h2>
          <p className="text-xs sm:text-sm font-bold text-[#536079] mb-5 leading-relaxed">
            {error || "This quiz may have been deleted, or could not be reached right now."}
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
            <button
              type="button"
              onClick={loadQuiz}
              className="py-3 px-5 bg-white hover:bg-[#edf7ff] text-[#29324c] font-black rounded-2xl border-2 border-[#29324c] shadow-[0_2px_0_#d7e1e8] text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={15} />
              <span>Try Again</span>
            </button>
            <Link
              href="/quiz"
              className="py-3 px-5 bg-[#ffce71] hover:bg-[#ffdb92] text-[#29324c] font-black rounded-2xl border-2 border-[#29324c] shadow-[0_3px_0_#d6ad63] text-xs sm:text-sm uppercase tracking-wider transition-all text-center inline-flex items-center justify-center"
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
  const progressPercent = Math.min(
    100,
    Math.round(((currentIndex) / quiz.questions.length) * 100)
  );

  return (
    <div className="min-h-screen bg-[#edf7ff] text-[#29324c] flex flex-col font-sans relative overflow-x-hidden">
      {/* Brand Header */}
      <header className="relative z-10 max-w-xl mx-auto w-full px-4 pt-5 pb-3 flex items-center justify-between">
        <Link
          href="/quiz"
          className="inline-flex items-center gap-2.5 no-underline group focus-visible:outline-3 focus-visible:outline-[#6650b7]"
          aria-label="Click & Clique homepage"
        >
          <BrandMark />
          <span className="text-xl font-black tracking-tight text-[#29324c]">
            click <span className="text-[#6650b7] font-medium">&amp;</span> clique
            <span className="text-[#bd4a66]">.</span>
          </span>
        </Link>
        {isStarted && (
          <span className="text-xs font-black bg-[#ffce71] text-[#29324c] px-3.5 py-1.5 rounded-full border-2 border-[#29324c] shadow-[0_2px_0_#d6ad63]">
            {currentIndex + 1} of {quiz.questions.length}
          </span>
        )}
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-xl mx-auto w-full px-4 py-4 flex flex-col justify-center">
        {!isStarted ? (
          /* Step 1: Friend Name Input Screen */
          <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-[0_6px_0_#d6ad63] border-2 border-[#29324c] text-center relative">
            <div className="inline-flex items-center gap-1.5 bg-[#edf7ff] text-[#6650b7] font-black text-xs uppercase px-3 py-1 rounded-full border border-[#d7e6ef] mb-3">
              <Sparkles size={14} />
              Friendship Challenge
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#29324c] tracking-tight leading-snug">
              How well do you know{" "}
              <span className="text-[#6650b7] underline decoration-[#ffce71] decoration-4 underline-offset-4">
                {creatorName}
              </span>
              ? ✦
            </h1>
            <p className="text-xs sm:text-sm text-[#536079] mt-2 font-medium">
              Answer {quiz.questions.length} questions to reveal your friendship score!
            </p>

            <form onSubmit={handleStartPlay} className="mt-6 space-y-4 text-left">
              <div>
                <label
                  htmlFor="player-name-input"
                  className="block text-xs font-black uppercase text-[#29324c] tracking-wider mb-1.5"
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
                  className="w-full px-4 py-3.5 text-base font-bold bg-[#fffefa] text-[#29324c] rounded-2xl border-2 border-[#29324c] focus:outline-none focus:ring-4 focus:ring-[#6650b7]/20 transition-all shadow-[0_2px_0_#d7e1e8]"
                />
                {error && <p className="text-xs font-bold text-[#a52938] mt-1.5 ml-1" role="alert">{error}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-4 px-6 bg-[#ffce71] hover:bg-[#ffdb92] text-[#29324c] font-black text-base sm:text-lg rounded-2xl border-2 border-[#29324c] shadow-[0_4px_0_#d6ad63] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <span>Accept Challenge</span>
                <ArrowRight size={20} className="stroke-[3]" />
              </button>
            </form>
          </div>
        ) : isSubmitting ? (
          <div className="w-full bg-white rounded-3xl p-8 border-2 border-[#29324c] shadow-[0_6px_0_#d6ad63] text-center">
            <Loader2 size={40} className="animate-spin text-[#6650b7] mx-auto mb-3" />
            <h2 className="text-xl font-black text-[#29324c]">Calculating your score...</h2>
            <p className="text-xs text-[#536079] mt-1 font-medium">Checking how well you matched {creatorName}! 🎯</p>
          </div>
        ) : (
          <div>
            {/* Progress Bar */}
            <div className="w-full bg-white h-3.5 rounded-full border-2 border-[#29324c] overflow-hidden mb-4 p-0.5 shadow-[0_2px_0_#d7e1e8]">
              <div
                className="bg-gradient-to-r from-[#6650b7] to-[#ffce71] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Quiz progress"
              />
            </div>

            {/* Submission Error Banner */}
            {submissionError && (
              <div className="mb-4 bg-[#fff1f2] border-2 border-[#a52938] text-[#a52938] p-4 rounded-2xl shadow-[0_3px_0_#a52938] text-center" role="alert">
                <p className="text-xs sm:text-sm font-black mb-2">{submissionError}</p>
                <button
                  type="button"
                  onClick={() => submitAttempt(selectedAnswersMap, clientAttemptId)}
                  className="py-2.5 px-5 bg-[#ffce71] hover:bg-[#ffdb92] text-[#29324c] font-black text-xs uppercase rounded-xl border-2 border-[#29324c] shadow-[0_2px_0_#d6ad63] transition-all cursor-pointer"
                >
                  Retry Submission 🚀
                </button>
              </div>
            )}

            {/* Question Card */}
            <article className="w-full bg-white rounded-3xl p-6 sm:p-7 shadow-[0_6px_0_#d6ad63] border-2 border-[#29324c] relative transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-[#6650b7] bg-[#edf7ff] px-3 py-1 rounded-lg border border-[#d7e6ef]">
                  Question {currentIndex + 1} of {quiz.questions.length}
                </span>
                <span className="text-2xl" aria-hidden="true">{currentQ.emoji || "✦"}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#29324c] tracking-tight leading-snug mb-3">
                {currentQ.question}
              </h2>

              <p className="text-xs font-bold text-[#536079] mb-5">
                What do you think <span className="text-[#6650b7] font-black">{creatorName}</span> picked?
              </p>

              {/* Visual Options Grid */}
              <div
                className={getVisualOptionGridClasses(currentQ.options.length)}
                role="radiogroup"
                aria-label={currentQ.question}
              >
                {currentQ.options.map((option) => (
                  <VisualOptionCard
                    key={option.id}
                    option={option}
                    isSelected={selectedAnswersMap[currentQ.questionId] === option.id}
                    onSelect={handleSelectOption}
                    disabled={isTransitioning || isSubmitting}
                    totalOptions={currentQ.options.length}
                  />
                ))}
              </div>
            </article>
          </div>
        )}
      </main>
    </div>
  );
}
