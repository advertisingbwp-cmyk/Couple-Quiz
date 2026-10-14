"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight, HelpCircle, Shield } from "lucide-react";
import { quizAudio } from "@/lib/quiz/audio";

export default function QuizLandingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [error, setError] = useState("");

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name to start! 📝");
      quizAudio.playWrong();
      return;
    }
    setError("");
    quizAudio.playPop();

    sessionStorage.setItem("creator_name", name.trim());
    sessionStorage.setItem("creator_gender", gender);
    router.push("/quiz/create");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#8AC0EF]/30 via-sky-50 to-amber-50/40 text-slate-900 flex flex-col font-sans relative overflow-x-hidden">
      {/* Background Doodles & Clouds */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-[url('/quiz/assets/img/player/clouds-bg.webp')] bg-repeat-x bg-contain opacity-40 pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-10 max-w-4xl mx-auto w-full px-4 pt-6 pb-2 flex items-center justify-between">
        <Link href="/quiz" className="flex items-center gap-2.5 group">
          <div className="w-11 h-11 relative rounded-2xl bg-white shadow-md flex items-center justify-center p-1.5 border-2 border-slate-900 group-hover:rotate-6 transition-transform">
            <Image
              src="/quiz/assets/img/logo-f.webp"
              alt="Don't Block Me Logo"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 block leading-tight">
              Don&apos;t Block Me!
            </span>
            <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider block">
              Find Fake Friends 🕵️
            </span>
          </div>
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold text-slate-600 bg-white/80 hover:bg-white px-3 py-1.5 rounded-full border border-slate-300 shadow-sm transition-all"
        >
          Tools Home
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-xl mx-auto w-full px-4 py-6 flex flex-col items-center">
        {/* Hero Card */}
        <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-[0_12px_30px_rgba(56,189,248,0.15)] border-4 border-slate-900 relative">
          
          {/* Top Non-overlapping Badge */}
          <div className="mb-4 flex justify-center">
            <span className="bg-amber-300 text-slate-950 font-black text-xs uppercase px-4 py-1.5 rounded-full border-2 border-slate-900 shadow-[0_2px_0_#0f172a] tracking-wider inline-flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-700 animate-spin" />
              2026 Viral Friendship Challenge
            </span>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              Find your <span className="line-through decoration-red-500 decoration-4">Fake</span> Friends &amp;{" "}
              <span className="text-sky-600 inline-block bg-sky-100 px-2 rounded-lg">Block</span> Them! 🚫📱
            </h1>
            <p className="text-slate-600 text-sm mt-2 font-medium">
              Create your custom quiz in 60 seconds. Dekhein kon sach me aapka dost hai aur kon block list me jayega! 😂
            </p>
          </div>

          {/* Creation Form */}
          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label htmlFor="creator-name" className="block text-xs font-black uppercase text-slate-700 tracking-wider mb-1.5">
                What is your Name?
              </label>
              <input
                id="creator-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. Ali, Sara, Hamza..."
                maxLength={30}
                className="w-full px-4 py-3.5 text-base font-bold bg-slate-50 text-slate-900 rounded-2xl border-2 border-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-200 focus:bg-white transition-all shadow-inner"
              />
              {error && <p className="text-xs font-bold text-red-600 mt-1.5 ml-1">{error}</p>}
            </div>

            <div>
              <span className="block text-xs font-black uppercase text-slate-700 tracking-wider mb-1.5">
                Choose your Gender:
              </span>
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Gender selection">
                <button
                  type="button"
                  role="radio"
                  aria-checked={gender === "male"}
                  onClick={() => {
                    quizAudio.playPop();
                    setGender("male");
                  }}
                  className={`py-3 px-4 rounded-2xl border-2 border-slate-900 font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    gender === "male"
                      ? "bg-sky-400 text-white shadow-[0_4px_0_#0f172a] -translate-y-0.5"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span aria-hidden="true">👦</span> Male
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={gender === "female"}
                  onClick={() => {
                    quizAudio.playPop();
                    setGender("female");
                  }}
                  className={`py-3 px-4 rounded-2xl border-2 border-slate-900 font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    gender === "female"
                      ? "bg-pink-400 text-white shadow-[0_4px_0_#0f172a] -translate-y-0.5"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span aria-hidden="true">👧</span> Female
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-4 px-6 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-slate-950 font-black text-base sm:text-lg rounded-2xl border-2 border-slate-900 shadow-[0_6px_0_#0f172a] active:shadow-[0_2px_0_#0f172a] active:translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <span>Create My Quiz</span>
              <ArrowRight size={20} className="stroke-[3]" />
            </button>
          </form>
        </div>

        {/* How It Works Section */}
        <section aria-labelledby="how-to-play-heading" className="w-full mt-8 bg-white/70 backdrop-blur-md rounded-3xl p-6 border-2 border-slate-200 shadow-sm">
          <h2 id="how-to-play-heading" className="text-base font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <HelpCircle size={18} className="text-sky-600" />
            How to play?
          </h2>

          <div className="space-y-3.5">
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-sky-200 text-sky-900 font-black text-xs flex items-center justify-center shrink-0 border border-sky-400">
                1
              </span>
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase">1. Create Your Quiz</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Answer 10 fun questions about yourself so others can test their knowledge.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-emerald-200 text-emerald-900 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-400">
                2
              </span>
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase">2. Share with Friends</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Send via WhatsApp, Instagram Story, or Snapchat status with 1 click.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-amber-200 text-amber-900 font-black text-xs flex items-center justify-center shrink-0 border border-amber-400">
                3
              </span>
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase">3. Find Fake Friends &amp; Block!</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Check your live scoreboard to see who got high scores and who needs to be blocked! 😂
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy & Entertainment Notice */}
        <div className="mt-6 text-center text-xs text-slate-500 font-medium max-w-sm">
          <p className="flex items-center justify-center gap-1.5 mb-1">
            <Shield size={14} className="text-emerald-600" />
            <span>100% Free &amp; Private Entertainment Quiz</span>
          </p>
          <p>We do not store passwords or personal identity data. Made just for fun with friends!</p>
        </div>
      </main>
    </div>
  );
}
