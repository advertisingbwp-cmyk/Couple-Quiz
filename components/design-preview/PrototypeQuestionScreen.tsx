"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/quiz-home/Illustrations";
import { MascotScene } from "./MascotScene";
import { ProgressPills } from "./ProgressPills";
import { PhotographicOptionCard, PrototypeOption } from "./PhotographicOptionCard";
import { PrototypeControls, OptionCountType, FeedbackType, MoodType } from "./PrototypeControls";

// All 9 real-photo prototype options
const ALL_OPTIONS: PrototypeOption[] = [
  {
    id: "pizza",
    label: "Pizza Night",
    imageSrc: "/prototype/photos/pizza.webp",
    altText: "Delicious cheesy pepperoni pizza slice on ceramic plate",
  },
  {
    id: "burger",
    label: "Burger & Fries",
    imageSrc: "/prototype/photos/burger.webp",
    altText: "Juicy gourmet cheeseburger with lettuce and brioche bun",
  },
  {
    id: "sleeping",
    label: "Sleeping In",
    imageSrc: "/prototype/photos/sleeping.webp",
    altText: "Peaceful morning sleep under cozy duvet and soft pillows",
  },
  {
    id: "studying",
    label: "Late Studying",
    imageSrc: "/prototype/photos/studying.webp",
    altText: "Aesthetic wooden study desk with open book and warm tea",
  },
  {
    id: "coffee",
    label: "Coffee Date",
    imageSrc: "/prototype/photos/coffee.webp",
    altText: "Fresh artisan cappuccino with latte art in ceramic cup",
  },
  {
    id: "roadtrip",
    label: "Road Trip",
    imageSrc: "/prototype/photos/roadtrip.webp",
    altText: "Scenic winding mountain highway view during road trip",
  },
  {
    id: "beach",
    label: "Beach Sunset",
    imageSrc: "/prototype/photos/beach.webp",
    altText: "Serene tropical beach with turquoise waves at sunset",
  },
  {
    id: "gaming",
    label: "Gaming Night",
    imageSrc: "/prototype/photos/gaming.webp",
    altText: "Modern sleek video game controller on illuminated desk",
  },
  {
    id: "concert",
    label: "Live Concert",
    imageSrc: "/prototype/photos/concert.webp",
    altText: "Vibrant live music concert stage with lights and cheering crowd",
  },
];

// Sample questions designed to naturally showcase 2, 4, 6, and 9 options
const SAMPLE_QUESTIONS = [
  {
    id: 1,
    title: "What's our ultimate weekend comfort food?",
    category: "Food & Cravings",
    defaultCount: 2 as OptionCountType,
  },
  {
    id: 2,
    title: "What is your ideal chill Sunday plan?",
    category: "Weekend Vibes",
    defaultCount: 4 as OptionCountType,
  },
  {
    id: 3,
    title: "How would we spend an unexpected free afternoon?",
    category: "Adventure",
    defaultCount: 6 as OptionCountType,
  },
  {
    id: 4,
    title: "Pick your absolute dream hangout vibe!",
    category: "Hangouts",
    defaultCount: 9 as OptionCountType,
  },
  {
    id: 5,
    title: "What is your go-to late night craving?",
    category: "Midnight Snacks",
    defaultCount: 2 as OptionCountType,
  },
  {
    id: 6,
    title: "Where would we escape for a spontaneous trip?",
    category: "Getaways",
    defaultCount: 4 as OptionCountType,
  },
  {
    id: 7,
    title: "What describes our energy together best?",
    category: "Friendship Dynamic",
    defaultCount: 6 as OptionCountType,
  },
  {
    id: 8,
    title: "Which activity makes you completely lose track of time?",
    category: "Passions",
    defaultCount: 9 as OptionCountType,
  },
  {
    id: 9,
    title: "What's our morning coffee routine?",
    category: "Daily Life",
    defaultCount: 2 as OptionCountType,
  },
  {
    id: 10,
    title: "The grand finale: Which memory would you relive?",
    category: "Core Memories",
    defaultCount: 4 as OptionCountType,
  },
];

export function PrototypeQuestionScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string | number>>({
    1: "pizza", // Pre-select for initial preview
  });

  // Prototype evaluation controls
  const [overrideOptionCount, setOverrideOptionCount] = useState<OptionCountType | null>(null);
  const [feedbackState, setFeedbackState] = useState<FeedbackType>("none");
  const [mascotMood, setMascotMood] = useState<MoodType>("happy");

  const question = SAMPLE_QUESTIONS[currentStep - 1] || SAMPLE_QUESTIONS[0];
  const effectiveOptionCount = overrideOptionCount || question.defaultCount;
  const currentOptions = ALL_OPTIONS.slice(0, effectiveOptionCount);
  const selectedOptionId = selectedOptions[currentStep];

  const handleSelectOption = (option: PrototypeOption) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [currentStep]: option.id,
    }));
  };

  const handleNext = () => {
    if (currentStep < 10) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Determine responsive grid layout depending on option count
  let gridLayoutClass = "";
  let isCompact = false;

  if (effectiveOptionCount === 2) {
    gridLayoutClass = "grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto";
  } else if (effectiveOptionCount === 4) {
    gridLayoutClass = "grid grid-cols-2 gap-2.5 sm:gap-3.5 max-w-md mx-auto";
  } else if (effectiveOptionCount === 6) {
    // 2 columns on very small mobile, 3 columns on tablet/desktop
    gridLayoutClass = "grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 max-w-lg mx-auto";
    isCompact = true;
  } else {
    // 9 options: 3 columns on mobile (with compact padding) and 3 columns on desktop
    gridLayoutClass = "grid grid-cols-3 gap-1.5 sm:gap-2.5 max-w-xl mx-auto";
    isCompact = true;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e3f2fd] via-[#f3e8ff] to-[#fce7f3] text-slate-800 flex flex-col font-sans relative overflow-x-hidden selection:bg-purple-200">
      {/* Decorative ambient background light orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-300/25 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-purple-300/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-pink-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* Floating subtle background star shapes */}
      <div className="absolute top-20 right-8 text-amber-300/60 animate-twinkle pointer-events-none select-none text-xl">
        ✦
      </div>
      <div className="absolute top-44 left-6 text-purple-300/60 animate-twinkle pointer-events-none select-none text-sm" style={{ animationDelay: "1.5s" }}>
        ★
      </div>
      <div className="absolute top-80 right-12 text-pink-300/60 animate-twinkle pointer-events-none select-none text-base" style={{ animationDelay: "0.8s" }}>
        ❤
      </div>

      {/* Top Header */}
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

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/70 backdrop-blur-md rounded-full border border-white/80 shadow-xs text-[11px] font-bold text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <span>Prototype</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-xl mx-auto w-full px-3 sm:px-4 py-1.5 flex flex-col justify-between">
        <div className="w-full space-y-2 sm:space-y-3">
          {/* 1. Top Progress Tracker (10 Numbered Pills) */}
          <ProgressPills
            total={10}
            current={currentStep}
            onSelectStep={(step) => setCurrentStep(step)}
          />

          {/* 2. Original Mascot Duo Hero - positioned snug above the question card */}
          <div className="w-full flex justify-center -mb-2.5 z-10 relative">
            <MascotScene mood={mascotMood} />
          </div>

          {/* 3. Glass Question Card */}
          <section
            aria-labelledby="question-heading"
            className="w-full bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-white/90 shadow-[0_8px_24px_rgba(102,80,183,0.08)] text-center relative overflow-hidden transition-all duration-300"
          >
            {/* Soft decorative line across top of card */}
            <div className="absolute top-0 inset-x-8 h-1 bg-gradient-to-r from-transparent via-purple-300/40 to-transparent" />

            {/* Question Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300/80 font-black text-[10px] sm:text-xs uppercase tracking-wider mb-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Question {currentStep} of 10</span>
            </div>

            {/* Question Title */}
            <h1
              id="question-heading"
              className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-snug px-1"
            >
              {question.title}
            </h1>
          </section>

          {/* 4. Real Photographic Answer Grid */}
          <section aria-label="Answer Options" className="w-full pt-0.5">
            <div className={gridLayoutClass}>
              {currentOptions.map((opt) => (
                <PhotographicOptionCard
                  key={opt.id}
                  option={opt}
                  isSelected={selectedOptionId === opt.id}
                  onSelect={handleSelectOption}
                  feedbackState={
                    feedbackState !== "none" && selectedOptionId === opt.id
                      ? feedbackState
                      : "none"
                  }
                  compact={isCompact}
                />
              ))}
            </div>
          </section>
        </div>

        {/* 5. Action Buttons & Navigation */}
        <div className="w-full pt-3 pb-2 space-y-2">
          <div className="flex items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className={`py-2 px-3.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 border backdrop-blur-md transition-all cursor-pointer ${
                currentStep === 1
                  ? "bg-white/40 text-slate-400 border-white/40 cursor-not-allowed opacity-50"
                  : "bg-white/80 hover:bg-white text-slate-800 border-white/90 shadow-xs hover:scale-[1.02]"
              }`}
              aria-label="Previous question"
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>

            <span className="text-[11px] sm:text-xs font-bold text-slate-500">
              {selectedOptionId ? "1 selected" : "Tap an option to select"}
            </span>

            <button
              type="button"
              onClick={handleNext}
              className="py-2 px-5 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-sky-500 hover:from-purple-500 hover:to-sky-400 text-white border border-white/40 shadow-[0_3px_12px_rgba(102,80,183,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
              aria-label={currentStep === 10 ? "Finish Prototype" : "Next question"}
            >
              <span>{currentStep === 10 ? "Finish" : "Next"}</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* 6. Evaluation Switcher Toolbar */}
          <PrototypeControls
            optionCount={effectiveOptionCount}
            onChangeOptionCount={(cnt) => setOverrideOptionCount(cnt)}
            feedbackState={feedbackState}
            onChangeFeedbackState={(st) => setFeedbackState(st)}
            mascotMood={mascotMood}
            onChangeMascotMood={(md) => setMascotMood(md)}
          />
        </div>
      </main>
    </div>
  );
}
