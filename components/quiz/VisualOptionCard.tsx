"use client";

import React, { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { QuizOption } from "@/lib/quiz/types";

interface VisualOptionCardProps {
  option: QuizOption;
  isSelected?: boolean;
  onSelect: (optionId: number) => void;
  disabled?: boolean;
  totalOptions?: number;
  role?: string;
  className?: string;
}

/**
 * Returns grid classes dynamically tailored to option counts (2, 4, 6, 9).
 */
export function getVisualOptionGridClasses(optionCount: number): string {
  switch (optionCount) {
    case 2:
      return "grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-md mx-auto";
    case 6:
      return "grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3";
    case 9:
      return "grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3";
    case 4:
    default:
      return "grid grid-cols-2 gap-3 sm:gap-3.5";
  }
}

export function VisualOptionCard({
  option,
  isSelected = false,
  onSelect,
  disabled = false,
  totalOptions = 4,
  role = "radio",
  className = "",
}: VisualOptionCardProps) {
  const [imgError, setImgError] = useState(false);

  // Responsive sizing tailored to 2, 4, 6, or 9 options
  const isCompact = totalOptions >= 9;
  const isMedium = totalOptions === 6;
  const isLarge = totalOptions <= 2;

  const imageSizeClasses = isCompact
    ? "w-12 h-12 sm:w-14 sm:h-14"
    : isMedium
    ? "w-14 h-14 sm:w-16 sm:h-16"
    : isLarge
    ? "w-20 h-20 sm:w-24 sm:h-24"
    : "w-16 h-16 sm:w-20 sm:h-20";

  const textSizeClasses = isCompact
    ? "text-[11px] sm:text-xs font-black break-normal hyphens-none leading-snug"
    : isMedium
    ? "text-xs sm:text-sm font-black break-normal hyphens-none leading-snug"
    : isLarge
    ? "text-sm sm:text-base font-black break-normal hyphens-none leading-snug"
    : "text-xs sm:text-sm font-black break-normal hyphens-none leading-snug";

  const cardPaddingClasses = isCompact
    ? "p-2 sm:p-2.5 h-auto min-h-[105px] sm:min-h-[120px]"
    : isMedium
    ? "p-2.5 sm:p-3 h-auto min-h-[115px] sm:min-h-[130px]"
    : isLarge
    ? "p-4 sm:p-5 h-auto min-h-[145px] sm:min-h-[160px]"
    : "p-3 sm:p-3.5 h-auto min-h-[125px] sm:min-h-[140px]";

  const badgeSizeClasses = isCompact
    ? "w-4 h-4 top-1.5 right-1.5"
    : "w-5 h-5 sm:w-6 sm:h-6 top-2 right-2";

  return (
    <button
      type="button"
      role={role}
      aria-checked={isSelected}
      aria-label={option.text}
      disabled={disabled}
      onClick={() => onSelect(option.id)}
      className={`group relative w-full flex flex-col items-center justify-between text-center rounded-2xl border-2 border-[#29324c] transition-all cursor-pointer focus-visible:outline-3 focus-visible:outline-[#6650b7] disabled:opacity-40 disabled:cursor-not-allowed select-none ${cardPaddingClasses} ${
        isSelected
          ? "bg-[#ffce71] text-[#29324c] shadow-[0_4px_0_#d6ad63] -translate-y-0.5"
          : "bg-[#fffefa] hover:bg-[#edf7ff] text-[#29324c] shadow-[0_2px_0_#d7e1e8] hover:shadow-[0_4px_0_#d7e1e8] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_1px_0_#d7e1e8]"
      } ${className}`}
    >
      {/* Selection Checkmark Badge */}
      <div
        className={`absolute rounded-full border-2 border-[#29324c] flex items-center justify-center shrink-0 transition-colors pointer-events-none ${badgeSizeClasses} ${
          isSelected
            ? "bg-[#29324c] text-white"
            : "bg-white/80 text-transparent opacity-60 group-hover:opacity-100"
        }`}
        aria-hidden="true"
      >
        {isSelected && (
          <Check
            size={isCompact ? 10 : 13}
            className="stroke-[3]"
          />
        )}
      </div>

      {/* Visual Image / Illustration Container */}
      <div
        className={`flex items-center justify-center rounded-xl bg-white/70 border border-[#29324c]/10 mb-1.5 sm:mb-2 p-1.5 overflow-hidden transition-transform duration-200 group-hover:scale-105 ${imageSizeClasses}`}
      >
        {option.imageUrl && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={option.imageUrl}
            alt={option.text}
            onError={() => setImgError(true)}
            className="w-full h-full object-contain pointer-events-none"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-[#6650b7]">
            <Sparkles size={isCompact ? 18 : 24} />
          </div>
        )}
      </div>

      {/* Readable Answer Text */}
      <span
        className={`w-full tracking-tight text-[#29324c] px-1 leading-snug break-normal hyphens-none ${textSizeClasses}`}
      >
        {option.text}
      </span>
    </button>
  );
}
