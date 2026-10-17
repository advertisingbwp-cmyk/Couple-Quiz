"use client";

import React, { useEffect, useRef } from "react";

export default function AdsterraNativeBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    try {
      const container = containerRef.current;
      if (!container) return;

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      script.src = "https://pl31875259.profitableratecpmnetwork.com/02da181a227c44f7ec62c1f7cc893206/invoke.js";

      container.appendChild(script);
    } catch {
      // Graceful fallback if ad blocker blocks the script
    }
  }, []);

  return (
    <div className="w-full my-3 flex flex-col items-center justify-center overflow-hidden">
      <div
        id="container-02da181a227c44f7ec62c1f7cc893206"
        ref={containerRef}
        className="w-full flex justify-center min-h-[50px]"
      />
    </div>
  );
}
