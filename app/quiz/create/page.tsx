"use client";

import React, { useState, useEffect, Suspense } from "react";
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
} from "lucide-react";
import { DEFAULT_QUIZ_QUESTIONS } from "@/lib/quiz/questions";
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
import {
  VisualOptionCard,
  getVisualOptionGridClasses,
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
    initQuizDeck(DEFAULT_QUIZ_QUESTIONS, TOTAL_QUESTIONS_TARGET)
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
      setHasSetup(true);
    } else {
      setHasSetup(false);
    }
  }, []);

  const currentQuestion = getCurrentQuestion(deck) || deck.availableQuestions[0] || DEFAULT_QUIZ_QUESTIONS[0];
  const answeredCount = deck.answers.length;
  const progressPercent = Math.min(100, Math.round((answeredCount / deck.targetCount) * 100));

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

  const handleEditCompleted = () => {
    // When editing from the PIN modal or complete state, reopen the last answered question
    // with its previous selection restored so the user is editing question 10 of 10.
    if (deck.answers.length > 0) {
      const { nextState, previousOptionId } = stepBackQuestion(deck);
      setDeck(nextState);
      setSelectedOptionId(previousOptionId);
    }
    setShowPinModal(false);
    setSubmitError("");
    setPinError("");
  };

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
      <div className="min-h-screen bg-[#edf7ff] flex items-center justify-center p-4 font-sans text-[#29324c]">
        <div className="flex items-center gap-3 font-extrabold text-base animate-pulse">
          <Loader2 size={24} className="animate-spin text-[#6650b7]" />
          <span>Setting up your quiz deck...</span>
        </div>
      </div>
    );
  }

  // Graceful fallback card if creatorName was missing or session expired
  if (hasSetup === false) {
    return (
      <div className="min-h-screen bg-[#edf7ff] text-[#29324c] flex flex-col font-sans">
        <header className="max-w-xl mx-auto w-full px-4 pt-6 pb-2 flex items-center justify-between">
          <Link href="/quiz" className="inline-flex items-center gap-2.5 no-underline group focus-visible:outline-[#6650b7]">
            <BrandMark />
            <span className="text-xl font-black tracking-tight text-[#29324c]">
              click <span className="text-[#6650b7] font-medium">&amp;</span> clique
              <span className="text-[#bd4a66]">.</span>
            </span>
          </Link>
        </header>

        <main className="flex-1 max-w-md mx-auto w-full px-4 py-8 flex flex-col justify-center">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#29324c] shadow-[0_6px_0_#d6ad63]">
            <div className="w-12 h-12 rounded-2xl bg-[#ffce71] border-2 border-[#29324c] flex items-center justify-center mx-auto mb-4 shadow-[0_3px_0_#d6ad63]">
              <Sparkles size={24} className="text-[#29324c]" />
            </div>

            <h1 className="text-2xl font-black text-center text-[#29324c] tracking-tight leading-snug mb-2">
              Let&apos;s start with your name
            </h1>
            <p className="text-sm text-center text-[#536079] mb-6">
              Your name or nickname will appear on the quiz for your friends.
            </p>

            <form onSubmit={handleFallbackSubmit} noValidate>
              <label htmlFor="fallback-creator-name" className="block text-xs font-black uppercase tracking-wider text-[#29324c] mb-1.5">
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
                className="w-full py-3.5 px-4 text-base font-bold bg-[#fffefa] border-2 border-[#29324c] rounded-2xl mb-4 focus:ring-4 focus:ring-[#6650b7]/20 focus:outline-none"
              />

              <fieldset className="mb-6">
                <legend className="text-xs font-black uppercase tracking-wider text-[#29324c] mb-2">
                  Question wording
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  {(["male", "female"] as const).map((v) => (
                    <label
                      key={v}
                      className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-[#29324c] font-black text-sm cursor-pointer transition-all ${
                        fallbackGender === v
                          ? "bg-[#ffce71] shadow-[0_3px_0_#d6ad63] translate-y-[-1px]"
                          : "bg-[#fffefa] hover:bg-slate-50 text-[#536079]"
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
                      <span>{v === "male" ? "Male wording" : "Female wording"}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {fallbackError && (
                <div className="p-3 bg-red-50 border-2 border-[#a52938] rounded-xl text-xs font-bold text-[#a52938] mb-4 flex items-center gap-2" role="alert">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{fallbackError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 px-6 bg-[#ffce71] hover:bg-[#ffdb92] text-[#29324c] font-black text-base rounded-2xl border-2 border-[#29324c] shadow-[0_4px_0_#d6ad63] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
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

        {/* Counter Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-black bg-[#ffce71] text-[#29324c] px-3.5 py-1.5 rounded-full border-2 border-[#29324c] shadow-[0_2px_0_#d6ad63]">
            {answeredCount} of {deck.targetCount} selected
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-xl mx-auto w-full px-4 py-3 flex flex-col justify-center">
        {/* Progress Bar */}
        <div className="w-full bg-white h-3.5 rounded-full border-2 border-[#29324c] overflow-hidden mb-4 p-0.5 shadow-[0_2px_0_#d7e1e8]">
          <div
            className="bg-gradient-to-r from-[#6650b7] to-[#ffce71] h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Quiz creation progress"
          />
        </div>

        {/* Question Card */}
        <article className="w-full bg-white rounded-3xl p-6 sm:p-7 shadow-[0_6px_0_#d6ad63] border-2 border-[#29324c] relative transition-all">
          {/* Header Metadata */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#6650b7] bg-[#edf7ff] px-3 py-1 rounded-lg border border-[#d7e6ef]">
              Question {answeredCount + 1} of {deck.targetCount}
            </span>
            <span className="text-2xl" aria-hidden="true">
              {currentQuestion.emoji || "✦"}
            </span>
          </div>

          {/* Question Title */}
          <h1 className="text-xl sm:text-2xl font-black text-[#29324c] tracking-tight leading-snug mb-5">
            {currentQuestion.question}
          </h1>

          <p className="text-xs font-bold text-[#536079] mb-4">
            Select the answer that describes <span className="text-[#6650b7] font-black">{creatorName}</span> best:
          </p>

          {/* Options Grid */}
          <div
            className={getVisualOptionGridClasses(currentQuestion.options.length)}
            role="radiogroup"
            aria-label={currentQuestion.question}
          >
            {currentQuestion.options.map((option) => (
              <VisualOptionCard
                key={option.id}
                option={option}
                isSelected={selectedOptionId === option.id}
                onSelect={handleSelectOption}
                totalOptions={currentQuestion.options.length}
              />
            ))}
          </div>

          {/* Action Row */}
          <div className="mt-6 pt-2 flex items-center gap-2.5 sm:gap-3">
            {/* Back Button */}
            <button
              type="button"
              disabled={answeredCount === 0}
              onClick={handleBack}
              aria-label="Previous question"
              className="py-3.5 px-3.5 sm:px-4 bg-[#fffefa] hover:bg-slate-100 disabled:opacity-35 text-[#29324c] font-black text-xs sm:text-sm rounded-2xl border-2 border-[#29324c] flex items-center justify-center gap-1.5 transition-all shadow-[0_2px_0_#d7e1e8] active:translate-y-0.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <ArrowLeft size={16} className="stroke-[2.5]" />
              <span className="hidden xs:inline">Back</span>
            </button>

            {/* Skip Button */}
            <button
              type="button"
              onClick={handleSkip}
              className="py-3.5 px-3.5 sm:px-4 bg-[#fffefa] hover:bg-slate-100 text-[#536079] hover:text-[#29324c] font-black text-xs sm:text-sm rounded-2xl border-2 border-[#29324c] flex items-center justify-center gap-1.5 transition-all shadow-[0_2px_0_#d7e1e8] active:translate-y-0.5 cursor-pointer"
            >
              <SkipForward size={16} />
              <span>Skip</span>
            </button>

            {/* Next / Finish Button */}
            <button
              type="button"
              disabled={selectedOptionId === null}
              onClick={handleNext}
              className="flex-1 py-3.5 px-4 sm:px-6 bg-[#ffce71] hover:bg-[#ffdb92] disabled:opacity-40 text-[#29324c] font-black text-sm sm:text-base rounded-2xl border-2 border-[#29324c] shadow-[0_4px_0_#d6ad63] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:cursor-not-allowed"
            >
              <span>{answeredCount === deck.targetCount - 1 ? "Review & Set PIN ✦" : "Next Question"}</span>
              <ArrowRight size={18} className="stroke-[3]" />
            </button>
          </div>
        </article>
      </main>

      {/* Secret PIN Modal */}
      {showPinModal && (
        <div
          className="fixed inset-0 z-50 bg-[#29324c]/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pin-modal-title"
        >
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 border-2 border-[#29324c] shadow-[0_12px_32px_rgba(41,50,76,0.2)] animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-[#ffce71] border-2 border-[#29324c] flex items-center justify-center mx-auto mb-3.5 shadow-[0_3px_0_#d6ad63]">
              <KeyRound size={24} className="text-[#29324c]" />
            </div>

            <h2 id="pin-modal-title" className="text-xl font-black text-center text-[#29324c] tracking-tight">
              Protect your scoreboard
            </h2>
            <p className="text-xs text-center text-[#536079] mt-1.5 mb-5 leading-relaxed">
              Choose a 4 to 6 digit secret PIN so only <span className="font-bold text-[#29324c]">{creatorName}</span> can view private answers and edit attempts:
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
              className="w-full py-3.5 text-center text-2xl font-black tracking-widest bg-[#fffefa] border-2 border-[#29324c] rounded-2xl mb-2 focus:ring-4 focus:ring-[#6650b7]/20 focus:outline-none placeholder:text-slate-300"
            />

            {pinError && (
              <p className="text-xs font-bold text-[#a52938] text-center mb-3" role="alert">
                {pinError}
              </p>
            )}

            {submitError && (
              <div className="p-3 bg-red-50 border-2 border-[#a52938] rounded-xl text-xs font-bold text-[#a52938] mb-3 flex items-start gap-2" role="alert">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="space-y-2 mt-4">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="w-full py-4 bg-[#ffce71] hover:bg-[#ffdb92] text-[#29324c] font-black text-base rounded-2xl border-2 border-[#29324c] shadow-[0_4px_0_#d6ad63] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-[#29324c]" />
                    <span>Creating your quiz...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Get My Share Link!</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleEditCompleted}
                className="w-full py-2.5 text-xs font-bold text-[#536079] hover:text-[#29324c] hover:underline cursor-pointer text-center"
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
