"use client";

import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function AdsterraFooter() {
  const [dismissed, setDismissed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dismissed) return;

    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      if (container.querySelector("iframe") || container.querySelector("script")) return;

      try {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.async = true;
        script.setAttribute("data-cfasync", "false");
        script.src = "https://pl31875259.profitableratecpmnetwork.com/02da181a227c44f7ec62c1f7cc893206/invoke.js";
        container.appendChild(script);
      } catch {
        // Fallback if blocked
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [dismissed]);

  return (
    <footer className="w-full mt-10 pt-6 pb-8 border-t border-slate-200/40 bg-slate-50/70 backdrop-blur-sm flex flex-col items-center justify-center text-center px-4">
      {!dismissed && (
        <div className="w-full max-w-md mx-auto mb-4 bg-white/60 backdrop-blur-md rounded-2xl p-2.5 border border-slate-200/80 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between px-1 mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            <span>Sponsored</span>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="flex items-center gap-0.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded cursor-pointer"
              aria-label="Hide advertisement"
            >
              <X size={12} />
              <span>Hide Ad</span>
            </button>
          </div>
          <div
            id="container-02da181a227c44f7ec62c1f7cc893206"
            ref={containerRef}
            className="w-full flex justify-center min-h-[60px]"
          />
        </div>
      )}

      <p className="text-xs font-semibold text-slate-500">
        Click &amp; Clique • Fun, Safe Friendship &amp; Couple Quizzes
      </p>
      <p className="text-[10px] text-slate-400 mt-0.5">
        Share with friends • Keep it light • Free forever
      </p>
    </footer>
  );
}
