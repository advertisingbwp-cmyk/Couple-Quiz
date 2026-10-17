"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  SkipForward,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  KeyRound,
  AlertCircle,
  X,
} from "lucide-react";
import {
  CURATED_QUIZ_QUESTIONS,
} from "@/lib/quiz/questions";
import { quizAudio } from "@/lib/quiz/audio";
import {
  initQuizDeck,
  getCurrentQuestion,
  skipQuestion,
  selectQuestionOption,
  stepBackQuestion,
  isDeckComplete,
  DeckState,
} from "@/lib/quiz/deck";
import { BrandMark } from "@/components/quiz-home/Illustrations";
import { MascotScene } from "@/components/design-preview/MascotScene";
import { ProgressPills } from "@/components/design-preview/ProgressPills";
import {
  VisualOptionCard,
  getGlassOptionGridClasses,
} from "@/components/quiz/VisualOptionCard";

const TOTAL_QUESTIONS_TARGET = 10;

function QuizCreateContent() {
  const router = useRouter();

  const [creatorName, setCreatorName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [hasSetup, setHasSetup] = useState<boolean | null>(null);

  // Fallback setup form state if sessionStorage is unavailable / blocked
  const [fallbackName, setFallbackName] = useState("");
  const [fallbackGender, setFallbackGender] = useState<"male" | "female">("male");
  const [fallbackError, setFallbackError] = useState("");

  const [deck, setDeck] = useState<DeckState>(() =>
    initQuizDeck(CURATED_QUIZ_QUESTIONS, TOTAL_QUESTIONS_TARGET)
  );
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [secretPin, setSecretPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  // Initialize creator info from sessionStorage (zero PII in URL query strings)
  useEffect(() => {
    let name = "";
    let gen: "male" | "female" = "male";

    try {
      const storedName = sessionStorage.getItem("creator_name");
      const storedGender = sessionStorage.getItem("creator_gender");
      if (storedName && storedName.trim()) {
        name = storedName.trim();
        if (storedGender === "female" || storedGender === "male") {
          gen = storedGender;
        }
      }
    } catch {
      // Storage unavailable / blocked
    }

    if (name) {
      setCreatorName(name);
      setGender(gen);
      setDeck(initQuizDeck(CURATED_QUIZ_QUESTIONS, TOTAL_QUESTIONS_TARGET));
      setHasSetup(true);
    } else {
      setHasSetup(false);
    }
  }, []);

  const currentQuestion =
    getCurrentQuestion(deck) ||
    deck.availableQuestions[0] ||
    CURATED_QUIZ_QUESTIONS[0];
  const answeredCount = deck.answers.length;

  const handleSelectOption = (optionId: number) => {
    quizAudio.playPop();
    setSelectedOptionId(optionId);
  };

  const handleNext = () => {
    if (selectedOptionId === null) return;
    quizAudio.playCorrect();

    const nextDeck = selectQuestionOption(deck, selectedOptionId);
    setDeck(nextDeck);

    if (isDeckComplete(nextDeck)) {
      setSelectedOptionId(null);
      setShowPinModal(true);
    } else {
      // Check if the next question was previously answered (e.g. if we stepped back)
      const nextQ = getCurrentQuestion(nextDeck);
      const existing = nextDeck.answers.find((a) => a.questionId === nextQ?.id);
      setSelectedOptionId(existing !== undefined ? existing.correctOptionId : null);
    }
  };

  const handleBack = () => {
    if (deck.answers.length === 0) return;
    quizAudio.playPop();

    const { nextState, previousOptionId } = stepBackQuestion(deck);
    setDeck(nextState);
    setSelectedOptionId(previousOptionId);
    setShowPinModal(false);
    setSubmitError("");
  };

  const handleEditCompleted = useCallback(() => {
    setDeck((prevDeck) => {
      if (prevDeck.answers.length > 0) {
        const { nextState, previousOptionId } = stepBackQuestion(prevDeck);
        setSelectedOptionId(previousOptionId);
        return nextState;
      }
      return prevDeck;
    });
    setShowPinModal(false);
    setSubmitError("");
    setPinError("");
  }, []);

  useEffect(() => {
    if (!showPinModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleEditCompleted();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPinModal, handleEditCompleted]);

  const handleSkip = () => {
    quizAudio.playPop();
    const nextDeck = skipQuestion(deck);
    setDeck(nextDeck);

    const nextQ = getCurrentQuestion(nextDeck);
    const existing = nextDeck.answers.find((a) => a.questionId === nextQ?.id);
    setSelectedOptionId(existing !== undefined ? existing.correctOptionId : null);
  };

  const handleFallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = fallbackName.trim();
    if (!clean) {
      setFallbackError("Please enter your name or a nickname.");
      return;
    }
    if (clean.length > 30) {
      setFallbackError("Keep your name to 30 characters or less.");
      return;
    }

    try {
      sessionStorage.setItem("creator_name", clean);
      sessionStorage.setItem("creator_gender", fallbackGender);
    } catch {
      // ignore storage failure
    }

    setCreatorName(clean);
    setGender(fallbackGender);
    setDeck(initQuizDeck(CURATED_QUIZ_QUESTIONS, TOTAL_QUESTIONS_TARGET));
    setHasSetup(true);
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;

    if (deck.answers.length !== TOTAL_QUESTIONS_TARGET) {
      setSubmitError(`Please select exactly ${TOTAL_QUESTIONS_TARGET} questions before publishing.`);
      quizAudio.playWrong();
      return;
    }

    const trimmedPin = secretPin.trim();
    if (!trimmedPin || !/^\d{4,6}$/.test(trimmedPin)) {
      setPinError("Please enter a 4 to 6 digit PIN (numbers only).");
      quizAudio.playWrong();
      return;
    }

    setPinError("");
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorName,
          gender,
          country: "PK",
          secretPin: trimmedPin,
          questions: deck.answers.map((a) => ({
            questionId: a.questionId,
            correctOptionId: a.correctOptionId,
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success && data.quizId) {
        quizAudio.playCelebration();
        if (data.creatorToken) {
          try {
            localStorage.setItem(`creator_token_${data.quizId}`, data.creatorToken);
          } catch {
            // Storage quota/disabled fallback
          }
        }
        router.push(data.shareUrl || `/quiz/share/${data.quizId}`);
      } else {
        quizAudio.playWrong();
        setSubmitError(
          data.error || "Unable to save your quiz right now. Please try again in a moment."
        );
        setIsSubmitting(false);
      }
    } catch {
      quizAudio.playWrong();
      setSubmitError("Network connectivity issue. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  // Loading state while checking setup
  if (hasSetup === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e3f2fd] via-[#f3e8ff] to-[#fce7f3] flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/90 shadow-sm flex items-center gap-3 font-extrabold text-sm">
          <Loader2 size={20} className="animate-spin text-purple-600" />
          <span>Setting up your quiz deck...</span>
        </div>
      </div>
    );
  }

  // Graceful fallback card if creatorName was missing or session expired
  if (hasSetup === false) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e3f2fd] via-[#f3e8ff] to-[#fce7f3] text-slate-800 flex flex-col font-sans">
        <header className="max-w-xl mx-auto w-full px-4 pt-4 pb-2 flex items-center justify-between">
          <Link href="/quiz" className="inline-flex items-center gap-2 group focus-visible:outline-purple-500">
            <BrandMark />
            <span className="text-lg font-black tracking-tight text-slate-900">
              click <span className="text-purple-600 font-medium">&amp;</span> clique
              <span className="text-pink-500">.</span>
            </span>
          </Link>
        </header>

        <main className="flex-1 max-w-md mx-auto w-full px-4 py-3 sm:py-6 flex flex-col justify-start">
          <div className="bg-white/85 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/90 shadow-[0_12px_36px_rgba(102,80,183,0.12)] mt-1 sm:mt-3">
            <div className="w-full flex justify-center -mb-2 z-10 relative">
              <MascotScene mood="happy" />
            </div>

            <h1 className="text-2xl font-black text-center text-slate-900 tracking-tight leading-snug mb-2">
              Let&apos;s start with your name
            </h1>
            <p className="text-xs sm:text-sm text-center text-slate-600 mb-5">
              Your name will appear on the quiz for your friends.
            </p>

            <form onSubmit={handleFallbackSubmit} noValidate>
              <label htmlFor="fallback-creator-name" className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Your name or nickname
              </label>
              <input
                id="fallback-creator-name"
                type="text"
                value={fallbackName}
                onChange={(e) => {
                  setFallbackName(e.target.value);
                  setFallbackError("");
                }}
                maxLength={30}
                placeholder="e.g. Ali or Sara"
                className="w-full py-3 px-4 text-base font-bold bg-white border border-slate-300 rounded-xl mb-4 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none"
              />

              <fieldset className="mb-5">
                <legend className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Question Theme
                </legend>
                <div className="grid grid-cols-2 gap-2.5">
                  {(["male", "female"] as const).map((v) => (
                    <label
                      key={v}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-black text-xs cursor-pointer transition-all ${
                        fallbackGender === v
                          ? "bg-purple-100/90 text-purple-900 border-purple-400 shadow-xs"
                          : "bg-white/70 hover:bg-white text-slate-600 border-white/90"
                      }`}
                    >
                      <input
                        type="radio"
                        name="fallback-gender"
                        value={v}
                        checked={fallbackGender === v}
                        onChange={() => setFallbackGender(v)}
                        className="sr-only"
                      />
                      <span>{v === "male" ? "Guy Vibes 🧢" : "Girl Vibes 🎀"}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {fallbackError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-700 mb-4 flex items-center gap-2" role="alert">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{fallbackError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 to-sky-500 hover:from-purple-500 hover:to-sky-400 text-white font-black text-sm rounded-xl shadow-[0_4px_16px_rgba(102,80,183,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <span>Continue to Questions</span>
                <ArrowRight size={18} className="stroke-[3]" />
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  const isPhotographic = currentQuestion.options.every(
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

        {/* Counter Badge */}
        <span className="text-[11px] font-black bg-white/80 text-purple-700 px-3 py-1 rounded-full border border-purple-200 shadow-xs">
          {answeredCount} of {deck.targetCount} selected
        </span>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-xl mx-auto w-full px-3 sm:px-4 py-1.5 flex flex-col justify-between">
        <div className="w-full space-y-2 sm:space-y-2.5">
          {/* Top Progress Tracker (10 Numbered Pills) */}
          <ProgressPills
            total={deck.targetCount}
            current={Math.min(answeredCount + 1, deck.targetCount)}
          />

          {/* Mascot Duo positioned snug above the card */}
          <div className="w-full flex justify-center -mb-2.5 z-10 relative">
            <MascotScene mood="happy" />
          </div>

          {/* Question Card */}
          <article className="w-full bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-white/90 shadow-[0_8px_24px_rgba(102,80,183,0.08)] text-center relative overflow-hidden transition-all duration-300">
            {/* Soft decorative line across top of card */}
            <div className="absolute top-0 inset-x-8 h-1 bg-gradient-to-r from-transparent via-purple-300/40 to-transparent" />

            {/* Question Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300/80 font-black text-[10px] sm:text-xs uppercase tracking-wider mb-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>
                Question {answeredCount + 1} of {deck.targetCount}
              </span>
            </div>

            {/* Question Title */}
            <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-snug px-1">
              {currentQuestion.question}
            </h1>

            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-1">
              Select what describes <span className="text-purple-600 font-bold">{creatorName}</span> best:
            </p>
          </article>

          {/* Options Grid */}
          <section aria-label="Answer Options" className="w-full pt-0.5">
            <div
              className={getGlassOptionGridClasses(
                currentQuestion.options.length,
                isPhotographic
              )}
              role="radiogroup"
              aria-label={currentQuestion.question}
            >
              {currentQuestion.options.map((option, index) => (
                <VisualOptionCard
                  key={option.id}
                  option={option}
                  optionIndex={index}
                  isSelected={selectedOptionId === option.id}
                  onSelect={handleSelectOption}
                  totalOptions={currentQuestion.options.length}
                  forceTextCard={!isPhotographic && !option.imageUrl?.endsWith(".svg")}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Action Row */}
        <div className="w-full pt-3 pb-2 space-y-2">
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Back Button */}
            <button
              type="button"
              disabled={answeredCount === 0}
              onClick={handleBack}
              aria-label="Previous question"
              className="py-2 px-3 sm:px-3.5 bg-white/80 hover:bg-white disabled:opacity-40 text-slate-800 font-black text-xs sm:text-sm rounded-xl border border-white/90 flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>

            {/* Skip Button */}
            <button
              type="button"
              onClick={handleSkip}
              className="py-2 px-3 sm:px-3.5 bg-white/80 hover:bg-white text-slate-600 hover:text-slate-800 font-black text-xs sm:text-sm rounded-xl border border-white/90 flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <SkipForward size={15} />
              <span>Skip</span>
            </button>

            {/* Next / Finish Button */}
            <button
              type="button"
              disabled={selectedOptionId === null}
              onClick={handleNext}
              className="flex-1 py-2 px-4 sm:px-5 bg-gradient-to-r from-purple-600 to-sky-500 hover:from-purple-500 hover:to-sky-400 disabled:opacity-40 text-white font-black text-xs sm:text-sm rounded-xl shadow-[0_3px_12px_rgba(102,80,183,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider disabled:cursor-not-allowed"
            >
              <span>{answeredCount === deck.targetCount - 1 ? "Review & Set PIN ✦" : "Next Question"}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </main>

      {/* Secret PIN Modal */}
      {showPinModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pin-modal-title"
        >
          <div className="relative w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-white/90 shadow-[0_16px_48px_rgba(102,80,183,0.2)] animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={handleEditCompleted}
              aria-label="Close PIN modal and edit questions"
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <KeyRound size={22} />
            </div>

            <h2 id="pin-modal-title" className="text-lg sm:text-xl font-black text-center text-slate-900 tracking-tight">
              Protect your scoreboard
            </h2>
            <p className="text-xs text-center text-slate-600 mt-1.5 mb-4 leading-relaxed">
              Choose a 4 to 6 digit secret PIN so only <span className="font-bold text-purple-700">{creatorName}</span> can view private answers and edit attempts:
            </p>

            <label htmlFor="secret-pin-input" className="sr-only">
              Secret PIN (4 to 6 digits)
            </label>
            <input
              id="secret-pin-input"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={secretPin}
              onChange={(e) => {
                setSecretPin(e.target.value.replace(/[^0-9]/g, ""));
                if (pinError) setPinError("");
                if (submitError) setSubmitError("");
              }}
              placeholder="••••"
              autoFocus
              className="w-full py-3 text-center text-2xl font-black tracking-widest bg-white border border-slate-300 rounded-xl mb-2 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none placeholder:text-slate-300 shadow-xs"
            />

            {pinError && (
              <p className="text-xs font-bold text-rose-600 text-center mb-3" role="alert">
                {pinError}
              </p>
            )}

            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-700 mb-3 flex items-start gap-2" role="alert">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="space-y-2 mt-4">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-sky-500 hover:from-purple-500 hover:to-sky-400 text-white font-black text-sm rounded-xl shadow-[0_4px_16px_rgba(102,80,183,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>Creating your quiz...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Get My Share Link!</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleEditCompleted}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer text-center"
              >
                ← Edit questions before publishing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuizCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#edf7ff] flex items-center justify-center p-4 font-sans text-[#29324c]">
          <div className="flex items-center gap-3 font-extrabold text-base animate-pulse">
            <Loader2 size={24} className="animate-spin text-[#6650b7]" />
            <span>Loading quiz creator...</span>
          </div>
        </div>
      }
    >
      <QuizCreateContent />
    </Suspense>
  );
}
