import React from "react";

interface MascotSceneProps {
  mood?: "happy" | "thinking";
  className?: string;
}

/**
 * Click & Clique Original Mascot Duo (Yellow Friend & Lavender Friend)
 * Lightweight vector illustration with subtle floating animations.
 */
export function MascotScene({ mood = "happy", className = "" }: MascotSceneProps) {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      aria-hidden="true"
    >
      {/* Ambient background glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-amber-200/40 via-pink-200/30 to-purple-200/40 rounded-full blur-xl pointer-events-none" />

      {/* Floating decorative elements */}
      <div className="absolute -top-1 -left-2 text-amber-400 animate-twinkle pointer-events-none">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.2L12 17l-6.3 4.2 2.3-7.2-6-4.6h7.6z" />
        </svg>
      </div>

      <div className="absolute top-1 right-0 text-pink-400 animate-pulse-glow pointer-events-none">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>

      <div className="absolute -bottom-1 -right-3 text-sky-400 animate-twinkle pointer-events-none" style={{ animationDelay: "1.2s" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l1.8 5.6H19l-4.5 3.5 1.7 5.5L12 13.5l-4.2 3.1 1.7-5.5L5 7.6h5.2z" />
        </svg>
      </div>

      {/* Main Mascot Duo SVG */}
      <svg
        viewBox="0 0 260 160"
        className="w-48 sm:w-56 h-auto drop-shadow-[0_8px_20px_rgba(102,80,183,0.18)] animate-float-gentle"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Yellow Friend Gradient */}
          <linearGradient id="yellowFriendGrad" x1="40" y1="30" x2="110" y2="150" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF1AA" />
            <stop offset="0.6" stopColor="#FFD363" />
            <stop offset="1" stopColor="#F5BD34" />
          </linearGradient>

          {/* Lavender Friend Gradient */}
          <linearGradient id="lavenderFriendGrad" x1="120" y1="35" x2="200" y2="150" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E2D4FD" />
            <stop offset="0.6" stopColor="#BBA2FA" />
            <stop offset="1" stopColor="#9C77ED" />
          </linearGradient>

          {/* Shadow Filter */}
          <radialGradient id="charShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4A347A" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#4A347A" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft Floor Shadow */}
        <ellipse cx="85" cy="150" rx="48" ry="7" fill="url(#charShadow)" />
        <ellipse cx="165" cy="150" rx="46" ry="7" fill="url(#charShadow)" />

        {/* ===================== YELLOW FRIEND (Left) ===================== */}
        <g transform="rotate(-3 85 90)">
          {/* Main Body */}
          <rect
            x="42"
            y="42"
            width="88"
            height="102"
            rx="42"
            fill="url(#yellowFriendGrad)"
            stroke="#FFFFFF"
            strokeWidth="3.5"
          />

          {/* Glossy Head Highlight */}
          <path
            d="M58 56C68 47 98 48 108 58"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Cheeks */}
          <ellipse cx="58" cy="100" rx="9" ry="5.5" fill="#FF8D7E" opacity="0.6" />
          <ellipse cx="114" cy="100" rx="9" ry="5.5" fill="#FF8D7E" opacity="0.6" />

          {/* Eyes & Mouth depending on Mood */}
          {mood === "thinking" ? (
            <>
              {/* Thinking expression: Looking slightly upward */}
              <circle cx="68" cy="85" r="4.5" fill="#202A44" />
              <circle cx="70" cy="83" r="1.5" fill="#FFFFFF" />
              <circle cx="104" cy="85" r="4.5" fill="#202A44" />
              <circle cx="106" cy="83" r="1.5" fill="#FFFFFF" />
              {/* Thoughtful curved mouth */}
              <path
                d="M80 105C84 102 90 102 94 105"
                stroke="#202A44"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              {/* Tiny hand resting under chin */}
              <ellipse cx="98" cy="112" rx="6" ry="5" fill="#FFC93A" stroke="#FFFFFF" strokeWidth="2" />
            </>
          ) : (
            <>
              {/* Happy expression: Sparkly open eyes & wide smile */}
              <circle cx="68" cy="87" r="4.5" fill="#202A44" />
              <circle cx="69.5" cy="85" r="1.8" fill="#FFFFFF" />
              <circle cx="104" cy="87" r="4.5" fill="#202A44" />
              <circle cx="105.5" cy="85" r="1.8" fill="#FFFFFF" />
              {/* Happy Smile */}
              <path
                d="M78 98C82 108 90 108 94 98"
                stroke="#202A44"
                strokeWidth="3"
                strokeLinecap="round"
                fill="#ED5C6D"
              />
              {/* Tiny waving hand */}
              <path
                d="M38 98C32 90 32 82 39 77C44 74 48 80 44 88"
                fill="#FFC93A"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </>
          )}
        </g>

        {/* ===================== LAVENDER FRIEND (Right) ===================== */}
        <g transform="rotate(4 165 92)">
          {/* Main Body */}
          <rect
            x="122"
            y="48"
            width="84"
            height="98"
            rx="40"
            fill="url(#lavenderFriendGrad)"
            stroke="#FFFFFF"
            strokeWidth="3.5"
          />

          {/* Glossy Head Highlight */}
          <path
            d="M138 60C148 53 176 54 186 63"
            stroke="#FFFFFF"
            strokeWidth="4.5"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Cheeks */}
          <ellipse cx="137" cy="104" rx="8" ry="5" fill="#E876A9" opacity="0.65" />
          <ellipse cx="191" cy="104" rx="8" ry="5" fill="#E876A9" opacity="0.65" />

          {/* Eyes & Mouth depending on Mood */}
          {mood === "thinking" ? (
            <>
              {/* Supportive friend smiling */}
              <circle cx="147" cy="91" r="4.5" fill="#202A44" />
              <circle cx="148.5" cy="89" r="1.8" fill="#FFFFFF" />
              {/* Winking right eye */}
              <path
                d="M178 91C182 87 188 87 192 91"
                stroke="#202A44"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Sweet smile */}
              <path
                d="M156 103C161 109 171 109 176 103"
                stroke="#202A44"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              {/* Happy eyes */}
              <circle cx="147" cy="91" r="4.5" fill="#202A44" />
              <circle cx="148.5" cy="89" r="1.8" fill="#FFFFFF" />
              <circle cx="181" cy="91" r="4.5" fill="#202A44" />
              <circle cx="182.5" cy="89" r="1.8" fill="#FFFFFF" />
              {/* Big happy mouth */}
              <path
                d="M155 101C159 110 169 110 173 101"
                stroke="#202A44"
                strokeWidth="3"
                strokeLinecap="round"
                fill="#ED5C6D"
              />
            </>
          )}
        </g>

        {/* Center Floating Friendship Heart */}
        <g transform="translate(120, 22)">
          <path
            d="M9 16.5L7.9 15.5C4 12 1.5 9.5 1.5 6.5C1.5 4 3.5 2 6 2C7.4 2 8.7 2.6 9.5 3.6C10.3 2.6 11.6 2 13 2C15.5 2 17.5 4 17.5 6.5C17.5 9.5 15 12 11.1 15.5L9 16.5Z"
            fill="#FF6B93"
            stroke="#FFFFFF"
            strokeWidth="1.8"
          />
        </g>
      </svg>
    </div>
  );
}
