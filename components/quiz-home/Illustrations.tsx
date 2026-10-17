import React from "react";

/** Original vector artwork. Decorative: adjacent text communicates the content. */
export function BrandMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" width="44" height="44">
      <rect x="3" y="5" width="31" height="29" rx="12" fill="#7660cf" />
      <path d="m10 29-3 12 15-9" fill="#7660cf" />
      <rect
        x="18"
        y="18"
        width="27"
        height="25"
        rx="10"
        fill="#ffce71"
        stroke="#28314c"
        strokeWidth="2"
      />
      <circle cx="27" cy="29" r="2" fill="#28314c" />
      <circle cx="36" cy="29" r="2" fill="#28314c" />
      <path
        d="M27 35q4 4 8 0"
        fill="none"
        stroke="#28314c"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FriendsArt({ couple = false }: { couple?: boolean }) {
  return (
    <svg viewBox="0 0 520 390" aria-hidden="true" focusable="false">
      <ellipse
        cx="265"
        cy="220"
        rx="210"
        ry="153"
        fill={couple ? "#e8dafa" : "#d2e9ff"}
      />
      <g fill="white">
        <path d="M37 137q-20-30 6-38 8-39 39-18 28-9 30 21 33 17 11 35Z" />
        <path d="M386 95q-20-24 4-35 11-30 33-12 27-7 27 18 33 7 18 29Z" />
      </g>
      <g
        stroke="#30334e"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="m89 205-38-23-12 8 17 19 38 19M394 199l40-40 14 3-10 26-37 35"
          fill="none"
        />
        <path
          d="m149 315-8 35-25 3m100-34 8 31 23 3m70-34-8 31-22 4m93-37 13 33 23 2"
          fill="none"
          strokeWidth="9"
        />
        <g transform="rotate(-9 166 225)">
          <rect
            x="91"
            y="126"
            width="153"
            height="203"
            rx="70"
            fill={couple ? "#ff9eae" : "#ffd575"}
          />
          <path
            d="M110 151q30-62 82-25"
            fill="none"
            stroke="#fff5d8"
            strokeWidth="8"
          />
          <ellipse
            cx="132"
            cy="216"
            rx="14"
            ry="8"
            fill="#ef957e"
            stroke="none"
          />
          <ellipse
            cx="207"
            cy="216"
            rx="14"
            ry="8"
            fill="#ef957e"
            stroke="none"
          />
          <path d="M143 195v9m48-9v9M155 217q14 18 29 0" fill="none" />
          <path d="m181 264 57 9 20-14" fill="none" strokeWidth="8" />
        </g>
        <g transform="rotate(10 335 227)">
          <rect
            x="258"
            y="137"
            width="151"
            height="194"
            rx="65"
            fill={couple ? "#b7a0ed" : "#a99be7"}
          />
          <path
            d="M280 161q31-46 76-23"
            fill="none"
            stroke="#ddd4fa"
            strokeWidth="8"
          />
          <ellipse
            cx="292"
            cy="218"
            rx="13"
            ry="8"
            fill="#ec99bf"
            stroke="none"
          />
          <ellipse
            cx="368"
            cy="218"
            rx="13"
            ry="8"
            fill="#ec99bf"
            stroke="none"
          />
          <path d="M303 199v9m45-9v9M316 222q12 12 25-1" fill="none" />
          <path d="m293 264-41 12" fill="none" strokeWidth="8" />
        </g>
        <g transform="rotate(-8 260 274)">
          <rect x="233" y="235" width="45" height="67" rx="8" fill="#fffdf8" />
          <path d="M247 243h17" />
          <path d="m244 272 8 8 16-18" fill="none" stroke="#7660cf" />
        </g>
        <path
          d="m252 99-27-25c-18-21 8-38 27-17 20-21 46-4 27 17Z"
          fill="#f993ad"
        />
        <path
          d="m431 235 6 17 18 2-14 11 4 18-15-9-16 9 4-18-13-12 19-1Z"
          fill="#ffce71"
        />
        <path
          d="m90 49 4 12 13 3-10 8 1 13-10-7-12 5 4-13-8-10 13 1Z"
          fill="#ffce71"
        />
      </g>
      <g fill="#7660cf">
        <circle cx="54" cy="276" r="5" />
        <circle cx="465" cy="139" r="5" />
        <path d="m162 58 7-11 6 11-6 11Z" />
      </g>
      <path
        d="m391 109 9 9m-3-28 14 2M53 237l-11 6"
        stroke="#e77b7d"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StepIcon({ kind }: { kind: "write" | "share" | "results" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width="52"
      height="52"
      aria-hidden="true"
      fill="none"
      stroke="#30334e"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {kind === "write" ? (
        <>
          <rect x="14" y="9" width="34" height="46" rx="8" fill="#fff" />
          <path d="M23 20h16M23 29h10M23 38h7" />
          <path d="m33 43 4-12 15-15 7 7-15 15Z" fill="#ffce71" />
        </>
      ) : kind === "share" ? (
        <>
          <path d="m6 27 51-18-16 47-12-18Z" fill="#fff" />
          <path d="m29 38 28-29M29 38v13l8-7" />
        </>
      ) : (
        <>
          <path d="M19 12h27v14c0 20-27 20-27 0Z" fill="#ffce71" />
          <path d="M19 17H9v9q0 10 12 10m25-19h9v9q0 10-12 10M32 42v12m-11 0h23" />
          <path
            d="m32 19 3 6 7 1-5 4 1 7-6-4-6 4 1-7-5-4 7-1Z"
            fill="white"
            stroke="none"
          />
        </>
      )}
    </svg>
  );
}
