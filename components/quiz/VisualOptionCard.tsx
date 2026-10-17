"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { QuizOption } from "@/lib/quiz/types";

interface VisualOptionCardProps {
  option: QuizOption;
  isSelected?: boolean;
  onSelect: (optionId: number) => void;
  disabled?: boolean;
  totalOptions?: number;
  role?: string;
  className?: string;
  optionIndex?: number;
  forceTextCard?: boolean;
}

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

/**
 * Returns grid classes dynamically tailored to option counts (2, 4, 6, 9).
 * Maintains exact class signatures for backward compatibility.
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

/**
 * Enhanced grid layout tailored for compact glass styling:
 * Photographic tiles vs Text-first horizontal rows.
 */
export function getGlassOptionGridClasses(
  optionCount: number,
  isPhotographic = false
): string {
  if (isPhotographic) {
    switch (optionCount) {
      case 2:
        return "grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto";
      case 6:
        return "grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-w-lg mx-auto";
      case 9:
        return "grid grid-cols-3 gap-1.5 sm:gap-2.5 max-w-xl mx-auto";
      case 4:
      default:
        return "grid grid-cols-2 gap-2.5 sm:gap-3.5 max-w-md mx-auto";
    }
  }

  // Text-first glass layout: 1 col on mobile, 2 cols on tablet/desktop for 2/4/6 options
  switch (optionCount) {
    case 2:
      return "grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 max-w-lg mx-auto";
    case 6:
      return "grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 max-w-xl mx-auto";
    case 9:
      return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2 max-w-xl mx-auto";
    case 4:
    default:
      return "grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 max-w-xl mx-auto";
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
  optionIndex = 0,
  forceTextCard = false,
}: VisualOptionCardProps) {
  const [imgError, setImgError] = useState(false);

  const hasPhoto = Boolean(
    option.imageUrl &&
      (option.imageUrl.endsWith(".webp") ||
        option.imageUrl.endsWith(".jpg") ||
        option.imageUrl.endsWith(".png")) &&
      !imgError
  );
  const isPhotographic = hasPhoto && !forceTextCard;
  const isSvg = Boolean(
    option.imageUrl && option.imageUrl.endsWith(".svg") && !forceTextCard && !imgError
  );

  const letter = LETTERS[optionIndex] || String(optionIndex + 1);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (role !== "radio") return;
    const currentTarget = e.currentTarget;
    const parent = currentTarget.parentElement;
    if (!parent) return;

    const buttons = Array.from(
      parent.querySelectorAll<HTMLButtonElement>('button[role="radio"]:not([disabled])')
    );
    const index = buttons.indexOf(currentTarget);
    if (index === -1) return;

    let nextIndex: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      nextIndex = (index + 1) % buttons.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      nextIndex = (index - 1 + buttons.length) % buttons.length;
    }

    if (nextIndex !== null && buttons[nextIndex]) {
      buttons[nextIndex].focus();
      buttons[nextIndex].click();
    }
  };

  // Case 1: Photographic Option Card (Real WebP Photos)
  if (isPhotographic) {
    return (
      <button
        type="button"
        role={role}
        aria-checked={isSelected}
        aria-label={option.text}
        disabled={disabled}
        onClick={() => onSelect(option.id)}
        onKeyDown={handleKeyDown}
        className={`group relative w-full flex flex-col items-center justify-between text-center rounded-2xl border-2 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-purple-500 disabled:opacity-40 disabled:cursor-not-allowed select-none p-2 sm:p-2.5 backdrop-blur-md ${
          isSelected
            ? "border-purple-600 bg-purple-50/90 shadow-[0_4px_16px_rgba(102,80,183,0.22)] -translate-y-0.5"
            : "border-white/90 bg-white/80 hover:bg-white text-slate-800 shadow-xs hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
        } ${className}`}
      >
        {/* Checkmark or Letter Badge */}
        <div
          className={`absolute top-2.5 right-2.5 z-10 w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] transition-all shadow-xs pointer-events-none ${
            isSelected
              ? "bg-purple-600 text-white shadow-[0_2px_8px_rgba(102,80,183,0.4)]"
              : "bg-white/90 text-slate-700 border border-slate-200"
          }`}
          aria-hidden="true"
        >
          {isSelected ? <Check size={11} className="stroke-[3]" /> : letter}
        </div>

        {/* Real Photographic Container */}
        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 relative mb-1.5 shadow-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={option.imageUrl}
            alt={option.text}
            width={240}
            height={180}
            decoding="async"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
            loading="lazy"
          />
        </div>

        {/* Clean text label */}
        <span className="w-full text-xs sm:text-sm font-black text-slate-800 px-1 py-0.5 leading-snug line-clamp-1">
          {option.text}
        </span>
      </button>
    );
  }

  // Case 2: Legacy Illustrated SVG Card
  if (isSvg) {
    const isCompact = totalOptions >= 9;
    return (
      <button
        type="button"
        role={role}
        aria-checked={isSelected}
        aria-label={option.text}
        disabled={disabled}
        onClick={() => onSelect(option.id)}
        onKeyDown={handleKeyDown}
        className={`group relative w-full flex flex-col items-center justify-between text-center rounded-2xl border-2 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-purple-500 disabled:opacity-40 disabled:cursor-not-allowed select-none p-2 sm:p-2.5 backdrop-blur-md ${
          isSelected
            ? "border-purple-600 bg-purple-50/90 shadow-[0_4px_16px_rgba(102,80,183,0.22)] -translate-y-0.5"
            : "border-white/90 bg-white/80 hover:bg-white text-slate-800 shadow-xs hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
        } ${className}`}
      >
        <div
          className={`absolute top-2 right-2 z-10 w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] pointer-events-none ${
            isSelected
              ? "bg-purple-600 text-white"
              : "bg-white/80 text-slate-600 border border-slate-200"
          }`}
          aria-hidden="true"
        >
          {isSelected ? <Check size={11} className="stroke-[3]" /> : letter}
        </div>

        <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-white/70 rounded-xl p-1 mb-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={option.imageUrl}
            alt={option.text}
            width={64}
            height={64}
            decoding="async"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain pointer-events-none"
            loading="lazy"
          />
        </div>

        <span
          className={`w-full text-slate-800 px-1 leading-snug font-black ${
            isCompact ? "text-[11px] sm:text-xs line-clamp-1" : "text-xs sm:text-sm"
          }`}
        >
          {option.text}
        </span>
      </button>
    );
  }

  // Case 3: Consistent Text-First Glass Card (Situational / Behavioral Options)
  return (
    <button
      type="button"
      role={role}
      aria-checked={isSelected}
      aria-label={option.text}
      disabled={disabled}
      onClick={() => onSelect(option.id)}
      onKeyDown={handleKeyDown}
      className={`group relative w-full flex items-center justify-between text-left rounded-2xl border-2 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-purple-500 disabled:opacity-40 disabled:cursor-not-allowed select-none p-3 sm:p-3.5 backdrop-blur-md gap-2.5 ${
        isSelected
          ? "border-purple-600 bg-purple-50/95 shadow-[0_4px_16px_rgba(102,80,183,0.2)] -translate-y-0.5"
          : "border-white/90 bg-white/80 hover:bg-white text-slate-800 shadow-xs hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
      } ${className}`}
    >
      {/* Letter Identifier Chip */}
      <div
        className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 transition-colors ${
          isSelected
            ? "bg-purple-600 text-white shadow-xs"
            : "bg-purple-100/90 text-purple-700 border border-purple-200/80"
        }`}
        aria-hidden="true"
      >
        {letter}
      </div>

      {/* Readable Answer Text */}
      <span className="flex-1 text-xs sm:text-sm font-black text-slate-800 leading-snug">
        {option.text}
      </span>

      {/* Radio Selection Indicator */}
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
          isSelected
            ? "border-purple-600 bg-purple-600 text-white shadow-xs"
            : "border-slate-300 bg-white/60 text-transparent group-hover:border-purple-400"
        }`}
        aria-hidden="true"
      >
        {isSelected && <Check size={11} className="stroke-[3]" />}
      </div>
    </button>
  );
}

