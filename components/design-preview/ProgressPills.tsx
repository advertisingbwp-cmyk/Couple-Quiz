import React from "react";
import { Check } from "lucide-react";

interface ProgressPillsProps {
  total?: number;
  current: number; // 1-based index (1..10)
  onSelectStep?: (step: number) => void;
  className?: string;
}

/**
 * Top Game-like Numbered Progress Tracker
 * Features 10 numbered pills with completed checkmarks, current highlight, and clean 320px fitting.
 */
export function ProgressPills({
  total = 10,
  current,
  onSelectStep,
  className = "",
}: ProgressPillsProps) {
  const steps = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <nav aria-label="Quiz Progress" className={`w-full ${className}`}>
      {/* Container with soft frosted glass backing */}
      <div className="flex items-center justify-between gap-1 sm:gap-1.5 p-1.5 sm:p-2 bg-white/45 backdrop-blur-md rounded-2xl border border-white/70 shadow-[0_4px_16px_rgba(102,80,183,0.06)]">
        {steps.map((step) => {
          const isCompleted = step < current;
          const isCurrent = step === current;

          let pillStyles = "";
          let label = `Question ${step}`;

          if (isCompleted) {
            pillStyles =
              "bg-emerald-400 text-emerald-950 font-bold border border-emerald-300 shadow-[0_2px_8px_rgba(16,185,129,0.25)] hover:bg-emerald-300";
            label += " (Completed)";
          } else if (isCurrent) {
            pillStyles =
              "bg-sky-400 text-sky-950 font-black scale-105 border-2 border-white shadow-[0_0_12px_rgba(56,189,248,0.55)] ring-2 ring-sky-300";
            label += " (Current)";
          } else {
            pillStyles =
              "bg-white/50 text-slate-400 font-semibold border border-white/80 hover:bg-white/80 hover:text-slate-600";
            label += " (Upcoming)";
          }

          return (
            <button
              key={step}
              type="button"
              onClick={() => onSelectStep?.(step)}
              aria-label={label}
              aria-current={isCurrent ? "step" : undefined}
              className={`flex-1 min-w-[24px] max-w-[38px] h-7 sm:h-8 rounded-xl flex items-center justify-center text-[11px] sm:text-xs transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 focus-visible:outline-offset-1 ${pillStyles}`}
            >
              {isCompleted ? (
                <Check size={13} strokeWidth={3.5} className="text-emerald-950" />
              ) : (
                <span>{step}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
