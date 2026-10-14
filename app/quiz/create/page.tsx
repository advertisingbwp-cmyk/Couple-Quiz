"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Check, SkipForward, ArrowRight, Loader2, Sparkles, KeyRound } from "lucide-react";
import { DEFAULT_QUIZ_QUESTIONS } from "@/lib/quiz/questions";
import { quizAudio } from "@/lib/quiz/audio";

const TOTAL_QUESTIONS_TARGET = 10;

export default function QuizCreatePage() {
  const router = useRouter();
  const [creatorName, setCreatorName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [currentPoolIndex, setCurrentPoolIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<{
    questionId: string;
    question: string;
    emoji?: string;
    options: Array<{ id: number; text: string }>;
    correctOptionId: number;
  }>>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [secretPin, setSecretPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  useEffect(() => {
    const storedName = sessionStorage.getItem("creator_name");
    const storedGender = sessionStorage.getItem("creator_gender") as "male" | "female";
    if (!storedName) {
      router.replace("/quiz");
      return;
    }
    setCreatorName(storedName);
    if (storedGender) setGender(storedGender);
  }, [router]);

  // Use questions pool avoiding duplicate question IDs
  const availableQuestions = DEFAULT_QUIZ_QUESTIONS.filter(
    (q) => !answers.some((a) => a.questionId === q.id)
  );
  const currentQuestion = availableQuestions[currentPoolIndex % Math.max(1, availableQuestions.length)] || DEFAULT_QUIZ_QUESTIONS[0];
  const progressPercent = Math.round((answers.length / TOTAL_QUESTIONS_TARGET) * 100);

  const handleSelectOption = (optionId: number) => {
    quizAudio.playPop();
    setSelectedOptionId(optionId);
  };

  const handleNext = () => {
    if (selectedOptionId === null) return;
    quizAudio.playCorrect();

    const newAnswers = [
      ...answers,
      {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        emoji: currentQuestion.emoji,
        options: currentQuestion.options,
        correctOptionId: selectedOptionId,
      },
    ];
    setAnswers(newAnswers);
    setSelectedOptionId(null);

    if (newAnswers.length >= TOTAL_QUESTIONS_TARGET) {
      setShowPinModal(true);
    } else {
      setCurrentPoolIndex((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    quizAudio.playPop();
    setSelectedOptionId(null);
    setCurrentPoolIndex((prev) => prev + 1);
  };

  const handleFinalSubmit = async () => {
    const trimmedPin = secretPin.trim();
    if (!trimmedPin || !/^\d{4,6}$/.test(trimmedPin)) {
      setPinError("Please enter a 4 to 6 digit PIN (numbers only).");
      quizAudio.playWrong();
      return;
    }
    setPinError("");
    setIsSubmitting(true);
    quizAudio.playCelebration();

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorName,
          gender,
          country: "PK",
          secretPin: trimmedPin,
          questions: answers,
        }),
      });

      const data = await res.json();
      if (data.success && data.quizId) {
        if (data.creatorToken) {
          localStorage.setItem(`creator_token_${data.quizId}`, data.creatorToken);
        }
        router.push(data.shareUrl || `/quiz/share/${data.quizId}`);
      } else {
        alert(data.error || "Failed to create quiz. Please try again.");
        setIsSubmitting(false);
      }
    } catch {
      alert("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#8AC0EF]/30 via-sky-50 to-amber-50/40 text-slate-900 flex flex-col font-sans relative overflow-x-hidden">
      {/* Background Top Clouds */}
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
        <span className="text-xs font-black bg-amber-300 text-slate-900 px-3 py-1 rounded-full border-2 border-slate-900 shadow-[0_2px_0_#0f172a]">
          {Math.min(answers.length + 1, TOTAL_QUESTIONS_TARGET)} / {TOTAL_QUESTIONS_TARGET} Qs
        </span>
      </header>

      {/* Main Body */}
      <main className="relative z-10 flex-1 max-w-xl mx-auto w-full px-4 py-4 flex flex-col justify-center">
        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-3 rounded-full border-2 border-slate-900 overflow-hidden mb-4 p-0.5 shadow-inner">
          <div
            className="bg-gradient-to-r from-sky-400 to-emerald-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Card (Hidden once all 10 are completed) */}
        {!showPinModal && (
          <div className="w-full bg-white rounded-3xl p-6 sm:p-7 shadow-[0_12px_30px_rgba(56,189,248,0.18)] border-4 border-slate-900 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-lg border border-sky-200">
                Question {answers.length + 1} of {TOTAL_QUESTIONS_TARGET}
              </span>
              <span className="text-xl">{currentQuestion.emoji || "❓"}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug mb-6">
              {currentQuestion.question}
            </h1>

            {/* Options Grid */}
            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectOption(option.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 border-slate-900 font-bold text-sm sm:text-base transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-amber-300 text-slate-950 shadow-[0_4px_0_#0f172a] -translate-y-0.5 scale-[1.01]"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-800"
                    }`}
                  >
                    <span className="flex-1 pr-2">{option.text}</span>
                    <div
                      className={`w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-emerald-500 text-white" : "bg-white"
                      }`}
                    >
                      {isSelected && <Check size={14} className="stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="mt-7 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSkip}
                className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl border-2 border-slate-900 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_3px_0_#0f172a] active:translate-y-0.5"
              >
                <SkipForward size={16} />
                <span>Skip Question</span>
              </button>

              <button
                type="button"
                disabled={selectedOptionId === null}
                onClick={handleNext}
                className="flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 disabled:opacity-40 text-slate-950 font-black text-sm sm:text-base rounded-2xl border-2 border-slate-900 shadow-[0_5px_0_#0f172a] active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <span>{answers.length === TOTAL_QUESTIONS_TARGET - 1 ? "Finish Quiz" : "Next"}</span>
                <ArrowRight size={18} className="stroke-[3]" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Secret PIN Modal (Replaces question UI cleanly) */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 border-4 border-slate-900 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-300 border-2 border-slate-900 flex items-center justify-center mx-auto mb-3 shadow-[0_3px_0_#0f172a]">
              <KeyRound size={24} className="text-slate-900" />
            </div>
            <h2 className="text-xl font-black text-center text-slate-900">Set Secret PIN</h2>
            <p className="text-xs text-center text-slate-600 mt-1 mb-4">
              Apne doston ke detailed answers aur scores dekhne ke liye 4-6 digit PIN rakhein:
            </p>

            <label htmlFor="secret-pin-input" className="sr-only">Secret PIN (4 to 6 digits)</label>
            <input
              id="secret-pin-input"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={secretPin}
              onChange={(e) => {
                setSecretPin(e.target.value.replace(/[^0-9]/g, ""));
                if (pinError) setPinError("");
              }}
              placeholder="Enter 4-6 digits (e.g. 7890)"
              className="w-full py-3.5 text-center text-xl font-black tracking-widest bg-slate-50 border-2 border-slate-900 rounded-2xl mb-1 focus:ring-4 focus:ring-sky-200 focus:outline-none"
            />
            {pinError && <p className="text-xs font-bold text-red-600 text-center mb-3">{pinError}</p>}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="w-full mt-3 py-4 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black text-base rounded-2xl border-2 border-slate-900 shadow-[0_5px_0_#0f172a] active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Generating Link...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Get My Share Link!</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
