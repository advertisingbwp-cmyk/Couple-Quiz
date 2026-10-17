import React from "react";
import { Sliders, Sparkles, AlertCircle, CheckCircle } from "lucide-react";

export type OptionCountType = 2 | 4 | 6 | 9;
export type FeedbackType = "none" | "correct" | "incorrect";
export type MoodType = "happy" | "thinking";

interface PrototypeControlsProps {
  optionCount: OptionCountType;
  onChangeOptionCount: (count: OptionCountType) => void;
  feedbackState: FeedbackType;
  onChangeFeedbackState: (state: FeedbackType) => void;
  mascotMood: MoodType;
  onChangeMascotMood: (mood: MoodType) => void;
  className?: string;
}

export function PrototypeControls({
  optionCount,
  onChangeOptionCount,
  feedbackState,
  onChangeFeedbackState,
  mascotMood,
  onChangeMascotMood,
  className = "",
}: PrototypeControlsProps) {
  const counts: OptionCountType[] = [2, 4, 6, 9];

  return (
    <aside
      aria-label="Prototype Evaluation Controls"
      className={`w-full bg-white/75 backdrop-blur-md rounded-2xl border border-white/80 p-3 shadow-[0_6px_20px_rgba(102,80,183,0.08)] ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Option Count Switcher */}
        <div className="flex items-center gap-2">
          <span className="font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Sliders size={13} className="text-purple-600" />
            <span>Options:</span>
          </span>
          <div className="inline-flex rounded-xl p-0.5 bg-slate-100/90 border border-slate-200">
            {counts.map((count) => {
              const active = optionCount === count;
              return (
                <button
                  key={count}
                  type="button"
                  onClick={() => onChangeOptionCount(count)}
                  aria-pressed={active}
                  className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                    active
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {count}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Demo States */}
        <div className="flex items-center gap-2">
          <span className="font-black text-slate-700 uppercase tracking-wider text-[11px]">
            Feedback:
          </span>
          <div className="inline-flex rounded-xl p-0.5 bg-slate-100/90 border border-slate-200">
            <button
              type="button"
              onClick={() => onChangeFeedbackState("none")}
              className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                feedbackState === "none"
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => onChangeFeedbackState("correct")}
              className={`px-2 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                feedbackState === "correct"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <CheckCircle size={12} />
              <span>Correct</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeFeedbackState("incorrect")}
              className={`px-2 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                feedbackState === "incorrect"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-rose-700 hover:bg-rose-50"
              }`}
            >
              <AlertCircle size={12} />
              <span>Incorrect</span>
            </button>
          </div>
        </div>

        {/* Mascot Mood Switcher */}
        <div className="flex items-center gap-2">
          <span className="font-black text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1">
            <Sparkles size={12} className="text-amber-500" />
            <span>Mascot:</span>
          </span>
          <div className="inline-flex rounded-xl p-0.5 bg-slate-100/90 border border-slate-200">
            <button
              type="button"
              onClick={() => onChangeMascotMood("happy")}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                mascotMood === "happy"
                  ? "bg-amber-400 text-slate-950 font-black shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Happy
            </button>
            <button
              type="button"
              onClick={() => onChangeMascotMood("thinking")}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                mascotMood === "thinking"
                  ? "bg-sky-400 text-slate-950 font-black shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Thinking
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
