import React from "react";
import Image from "next/image";
import { Check, X } from "lucide-react";

export interface PrototypeOption {
  id: string | number;
  label: string;
  imageSrc: string;
  altText: string;
}

interface PhotographicOptionCardProps {
  option: PrototypeOption;
  isSelected: boolean;
  onSelect: (option: PrototypeOption) => void;
  disabled?: boolean;
  feedbackState?: "none" | "correct" | "incorrect";
  compact?: boolean; // For 6 or 9 option layouts
}

/**
 * Photographic MCQ Option Card
 * Modern frosted glass container housing real photography with rounded corners,
 * accessible keyboard interactions, and vibrant selected & feedback states.
 */
export function PhotographicOptionCard({
  option,
  isSelected,
  onSelect,
  disabled = false,
  feedbackState = "none",
  compact = false,
}: PhotographicOptionCardProps) {
  const isCorrect = feedbackState === "correct";
  const isIncorrect = feedbackState === "incorrect";

  // Base glass styles
  let stateClasses = "bg-white/70 border-white/80 shadow-[0_4px_16px_rgba(102,80,183,0.08)] text-slate-800";

  if (isCorrect) {
    stateClasses =
      "bg-emerald-50/90 border-emerald-400 ring-4 ring-emerald-300 shadow-[0_8px_28px_rgba(16,185,129,0.35)] text-emerald-950 scale-[1.02]";
  } else if (isIncorrect) {
    stateClasses =
      "bg-rose-50/90 border-rose-400 ring-4 ring-rose-300 shadow-[0_8px_28px_rgba(244,63,94,0.35)] text-rose-950 scale-[0.98]";
  } else if (isSelected) {
    stateClasses =
      "bg-white/95 border-sky-400 ring-4 ring-sky-300 shadow-[0_8px_24px_rgba(56,189,248,0.35)] text-sky-950 scale-[1.02]";
  } else {
    stateClasses += " hover:bg-white/90 hover:border-white hover:scale-[1.01] hover:shadow-[0_8px_20px_rgba(102,80,183,0.12)]";
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(option);
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isSelected}
      aria-disabled={disabled}
      onClick={() => !disabled && onSelect(option)}
      onKeyDown={handleKeyDown}
      className={`group relative flex flex-col items-center justify-between p-2 sm:p-2.5 rounded-2xl border backdrop-blur-md transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-purple-400 ${
        disabled ? "opacity-60 cursor-not-allowed pointer-events-none" : ""
      } ${stateClasses}`}
    >
      {/* Selection / Feedback Badge (Top-Right) */}
      <div className="absolute top-2 right-2 z-10">
        {isCorrect ? (
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md animate-bounce">
            <Check size={12} strokeWidth={3.5} />
          </div>
        ) : isIncorrect ? (
          <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md animate-pulse">
            <X size={12} strokeWidth={3.5} />
          </div>
        ) : isSelected ? (
          <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md">
            <Check size={12} strokeWidth={3} />
          </div>
        ) : (
          <div className="w-4 h-4 rounded-full bg-white/70 border border-slate-300 group-hover:border-sky-400 transition-colors" />
        )}
      </div>

      {/* Real-photo Image Container */}
      <div
        className="w-full relative overflow-hidden rounded-xl bg-slate-100 shadow-inner aspect-[4/3] sm:aspect-[16/11]"
      >
        <Image
          src={option.imageSrc}
          alt={option.altText}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Soft subtle gradient overlay for visual depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Option Text Label */}
      <div className="w-full mt-1.5 sm:mt-2 text-center px-0.5">
        <span
          className={`block font-extrabold tracking-tight leading-snug line-clamp-1 ${
            compact ? "text-[11px] sm:text-xs" : "text-xs sm:text-sm"
          }`}
        >
          {option.label}
        </span>
      </div>
    </div>
  );
}
