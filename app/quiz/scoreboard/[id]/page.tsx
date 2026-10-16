"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { Trophy, Share2, Trash2, Eye, X, RefreshCw, AlertCircle, MessageCircle, Lock } from "lucide-react";
import { BrandMark } from "@/components/quiz-home/Illustrations";
import { quizAudio } from "@/lib/quiz/audio";
import { ScoreboardEntry, ScoreboardDetailEntry } from "@/lib/quiz/types";

export default function QuizScoreboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const quizId = resolvedParams.id;

  const [creatorName, setCreatorName] = useState("Friend");
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<ScoreboardDetailEntry | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [targetDetailId, setTargetDetailId] = useState<string | null>(null);
  const [enteredPin, setEnteredPin] = useState("");
  const [pinPrompt, setPinPrompt] = useState<{ open: boolean; attemptId: string; playerName?: string }>({ open: false, attemptId: "", playerName: "" });
  const [deleting, setDeleting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem(`creator_token_${quizId}`) : null;
    if (token) {
      setIsCreator(true);
    }
  }, [quizId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showAuthModal) {
          setShowAuthModal(false);
          setEnteredPin("");
          setAuthError("");
        }
        if (selectedEntry) {
          setSelectedEntry(null);
        }
        if (pinPrompt.open) {
          setPinPrompt({ open: false, attemptId: "", playerName: "" });
          setEnteredPin("");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAuthModal, selectedEntry, pinPrompt.open]);

  const fetchPublicScoreboard = React.useCallback(() => {
    setLoading(true);
    fetch(`/api/quiz/${quizId}/scoreboard`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCreatorName(data.creatorName || "Friend");
          setScoreboard(data.scoreboard || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [quizId]);

  useEffect(() => {
    fetchPublicScoreboard();
  }, [fetchPublicScoreboard]);

  // Request detailed answers with authorization (creatorToken or PIN)
  const handleOpenAnswers = async (entry: ScoreboardEntry) => {
    const creatorToken = typeof window !== "undefined" ? localStorage.getItem(`creator_token_${quizId}`) : null;

    // If local creatorToken exists, try automatic unlock
    if (creatorToken) {
      try {
        const res = await fetch(`/api/quiz/${quizId}/scoreboard`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creatorToken }),
        });
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem(`creator_token_${quizId}`);
          setIsCreator(false);
          setAuthError("Creator session expired. Please enter your PIN.");
          setTargetDetailId(entry.id);
          setShowAuthModal(true);
          return;
        }
        const data = await res.json();
        if (data.success && data.scoreboard) {
          const detail = data.scoreboard.find((s: ScoreboardDetailEntry) => s.id === entry.id);
          if (detail) {
            setSelectedEntry(detail);
            quizAudio.playPop();
            return;
          }
        }
      } catch {
        // Fall back to manual PIN modal
      }
    }

    // Open PIN prompt
    setTargetDetailId(entry.id);
    setShowAuthModal(true);
  };

  const handleVerifyPinForAnswers = async () => {
    if (!enteredPin.trim()) return;
    setAuthError("");

    try {
      const res = await fetch(`/api/quiz/${quizId}/scoreboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: enteredPin.trim() }),
      });
      const data = await res.json();
      if (data.success && data.scoreboard) {
        setIsCreator(true);
        if (data.creatorToken) {
          localStorage.setItem(`creator_token_${quizId}`, data.creatorToken);
        }
        if (targetDetailId) {
          const detail = data.scoreboard.find((s: ScoreboardDetailEntry) => s.id === targetDetailId);
          if (detail) {
            setSelectedEntry(detail);
          }
        }
        setShowAuthModal(false);
        setEnteredPin("");
        setTargetDetailId(null);
        quizAudio.playCorrect();
      } else {
        setAuthError(data.error || "Incorrect Secret PIN.");
        quizAudio.playWrong();
      }
    } catch {
      setAuthError("Network error.");
    }
  };

  const handleDeleteAttempt = async () => {
    if (!pinPrompt.attemptId) return;
    setDeleting(true);
    const creatorToken = typeof window !== "undefined" ? localStorage.getItem(`creator_token_${quizId}`) : null;

    try {
      const res = await fetch(`/api/quiz/${quizId}/scoreboard`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: pinPrompt.attemptId,
          pin: enteredPin.trim() || undefined,
          creatorToken: creatorToken || undefined,
        }),
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem(`creator_token_${quizId}`);
        setIsCreator(false);
        setPinPrompt({ open: false, attemptId: "", playerName: "" });
        setAuthError("Creator session expired or invalid PIN. Please log in again.");
        setShowAuthModal(true);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setScoreboard((prev) => prev.filter((item) => item.id !== pinPrompt.attemptId));
        setPinPrompt({ open: false, attemptId: "", playerName: "" });
        setEnteredPin("");
        quizAudio.playPop();
      } else {
        alert(data.error || "Could not delete player attempt.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setDeleting(false);
    }
  };

  const handleShareScoreboardWhatsApp = () => {
    quizAudio.playPop();
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/quiz/play/${quizId}` : "";
    let text = `👑 *${creatorName}'s Challenge Leaderboard*\n\n`;
    if (scoreboard.length > 0) {
      scoreboard.slice(0, 5).forEach((entry, idx) => {
        const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🔹";
        text += `${medal} ${entry.playerName}: ${entry.score}/${entry.totalQuestions} points\n`;
      });
    } else {
      text += "No one has played yet. Be the first!\n";
    }
    text += `\nCan you beat them? Try here 👇\n${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#edf7ff] text-[#29324c] flex flex-col font-sans relative overflow-x-hidden">
      {/* Header */}
      <header className="relative z-10 max-w-xl mx-auto w-full px-4 pt-5 pb-3 flex items-center justify-between">
        <Link
          href="/quiz"
          className="inline-flex items-center gap-2.5 no-underline group focus-visible:outline-3 focus-visible:outline-[#6650b7]"
          aria-label="Click & Clique homepage"
        >
          <BrandMark />
          <span className="text-xl font-black tracking-tight text-[#29324c]">
            click <span className="text-[#6650b7] font-medium">&amp;</span> clique
            <span className="text-[#bd4a66]">.</span>
          </span>
        </Link>
        <Link
          href={`/quiz/share/${quizId}`}
          className="text-xs font-black bg-[#ffce71] text-[#29324c] px-3.5 py-1.5 rounded-full border-2 border-[#29324c] shadow-[0_2px_0_#d6ad63] flex items-center gap-1.5 hover:bg-[#ffdb92] transition-all"
        >
          <Share2 size={13} />
          <span>Share Quiz</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-xl mx-auto w-full px-4 py-5 flex flex-col">
        {/* Title Card */}
        <div className="w-full bg-white rounded-3xl p-6 shadow-[0_12px_30px_rgba(56,189,248,0.18)] border-4 border-slate-900 text-center mb-5">
          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 font-black text-xs uppercase px-3 py-1 rounded-full border border-amber-300 mb-2">
            <Trophy size={14} />
            Official Scoreboard
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {creatorName}&apos;s Friends Leaderboard
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Total {scoreboard.length} friend{scoreboard.length === 1 ? "" : "s"} took this challenge!
          </p>

          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleShareScoreboardWhatsApp}
              className="py-2.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs rounded-xl border-2 border-slate-900 shadow-[0_2px_0_#0f172a] active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer uppercase"
            >
              <MessageCircle size={15} className="fill-white" />
              <span>Share Leaderboard</span>
            </button>
            <button
              type="button"
              onClick={fetchPublicScoreboard}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border-2 border-slate-900 shadow-[0_2px_0_#0f172a] active:translate-y-0.5 transition-all cursor-pointer"
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Score List (Ranked Highest Score First) */}
        <div className="w-full bg-white rounded-3xl p-5 border-4 border-slate-900 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Ranked Players
            </h2>
            {isCreator ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full">
                👑 Creator Mode
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTargetDetailId(null);
                  setShowAuthModal(true);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900 hover:underline cursor-pointer"
              >
                <Lock size={12} />
                <span>Creator Access</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs font-bold text-slate-500 animate-pulse">
              Loading player scores...
            </div>
          ) : scoreboard.length === 0 ? (
            <div className="py-8 text-center text-slate-600">
              <span className="text-4xl block mb-2">🎯</span>
              <p className="font-extrabold text-sm text-slate-900">No friends have played this quiz yet!</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Share your challenge link on WhatsApp or play it yourself to see scores here!
              </p>
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
                <Link
                  href={`/quiz/play/${quizId}`}
                  className="w-full sm:w-auto py-2.5 px-5 bg-sky-400 hover:bg-sky-500 text-slate-950 font-black text-xs uppercase rounded-xl border-2 border-slate-900 shadow-[0_2px_0_#0f172a] active:translate-y-0.5"
                >
                  Play Challenge Now
                </Link>
                <Link
                  href={`/quiz/share/${quizId}`}
                  className="w-full sm:w-auto py-2.5 px-5 bg-[#ffce71] hover:bg-[#ffdb92] text-slate-950 font-black text-xs uppercase rounded-xl border-2 border-slate-900 shadow-[0_2px_0_#d6ad63] active:translate-y-0.5"
                >
                  Share Link Now
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {scoreboard.map((entry, idx) => {
                const rankBadge = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
                const isBestie = entry.statusBadge === "bestie";
                const isFake = entry.statusBadge === "fake";

                return (
                  <div
                    key={entry.id}
                    className={`p-3.5 rounded-2xl border-2 border-slate-900 flex items-center justify-between gap-2 transition-all ${
                      idx === 0
                        ? "bg-amber-100/90 shadow-[0_3px_0_#0f172a]"
                        : idx === 1
                        ? "bg-slate-100 shadow-[0_3px_0_#0f172a]"
                        : idx === 2
                        ? "bg-orange-50 shadow-[0_3px_0_#0f172a]"
                        : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black w-6 text-center">{rankBadge}</span>
                      <div>
                        <span className="font-black text-sm text-slate-900 block leading-tight">
                          {entry.playerName}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border inline-block mt-0.5 ${
                            isBestie
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : isFake
                              ? "bg-sky-100 text-sky-800 border-sky-300"
                              : "bg-amber-100 text-amber-800 border-amber-300"
                          }`}
                        >
                          {isBestie ? "Bestie Alert! ❤️" : isFake ? "Friend in Training 🌱" : "Great Friend 🙂"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right pr-1">
                        <span className="text-base font-black text-slate-900">
                          {entry.score}
                        </span>
                        <span className="text-xs font-bold text-slate-400">/{entry.totalQuestions}</span>
                      </div>

                      {/* Creator-only controls: view answers or delete attempt */}
                      {isCreator && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenAnswers(entry)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="View Answers (Creator Only)"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setPinPrompt({ open: true, attemptId: entry.id, playerName: entry.playerName })}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                            title="Delete Player (Creator Only)"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Creator PIN Unlock Modal for Detailed Answers */}
      {showAuthModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="creator-auth-title" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 border-4 border-slate-900 shadow-2xl text-center">
            <Lock size={32} className="text-amber-500 mx-auto mb-2" />
            <h3 id="creator-auth-title" className="font-black text-lg text-slate-900">Creator Verification</h3>
            <p className="text-xs text-slate-600 mt-1 mb-4">
              Enter your Creator Secret PIN to view {creatorName}&apos;s friends answers:
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={enteredPin}
              onChange={(e) => {
                setEnteredPin(e.target.value);
                if (authError) setAuthError("");
              }}
              placeholder="Enter PIN (e.g. 7890)"
              className="w-full py-3 text-center text-xl font-bold bg-slate-50 border-2 border-slate-900 rounded-2xl mb-2 focus:outline-none"
            />
            {authError && <p className="text-xs font-bold text-red-600 mb-3">{authError}</p>}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  setEnteredPin("");
                  setAuthError("");
                }}
                className="flex-1 py-3 bg-slate-100 font-bold text-xs rounded-xl border border-slate-300 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyPinForAnswers}
                className="flex-1 py-3 bg-emerald-400 hover:bg-emerald-500 font-black text-xs rounded-xl text-slate-950 border-2 border-slate-900 uppercase tracking-wider"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Answers Modal (Authorized) */}
      {selectedEntry && (
        <div role="dialog" aria-modal="true" aria-labelledby="answers-modal-title" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border-4 border-slate-900 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100 mb-4">
              <div>
                <h3 id="answers-modal-title" className="font-black text-base text-slate-900">
                  {selectedEntry.playerName}&apos;s Answers
                </h3>
                <span className="text-xs font-bold text-sky-600">
                  Score: {selectedEntry.score} / {selectedEntry.totalQuestions}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="p-1 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer"
                aria-label="Close answers modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {selectedEntry.answers && selectedEntry.answers.length > 0 ? (
                selectedEntry.answers.map((ans, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border-2 text-xs font-medium ${
                      ans.isCorrect
                        ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                        : "bg-red-50 border-red-300 text-red-950"
                    }`}
                  >
                    <p className="font-black mb-1">
                      {idx + 1}. {ans.question}
                    </p>
                    <p>
                      <strong>Their choice:</strong> {ans.theirAnswer}{" "}
                      {ans.isCorrect ? "✅" : "❌"}
                    </p>
                    {!ans.isCorrect && (
                      <p className="text-slate-500 mt-0.5">
                        <strong>Correct answer:</strong> {ans.correctAnswer}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">Detailed answers not available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pinPrompt.open && (
        <div role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 border-4 border-slate-900 shadow-2xl text-center">
            <AlertCircle size={32} className="text-red-500 mx-auto mb-2" />
            <h3 id="delete-modal-title" className="font-black text-base text-slate-900">Remove Player?</h3>
            <p className="text-xs text-slate-600 mt-1 mb-3">
              {typeof window !== "undefined" && localStorage.getItem(`creator_token_${quizId}`) ? (
                <>
                  Are you sure you want to remove <strong>{pinPrompt.playerName || "this player"}</strong> from {creatorName}&apos;s leaderboard?
                </>
              ) : (
                <>Enter Creator PIN to confirm deletion of <strong>{pinPrompt.playerName || "this player"}</strong>:</>
              )}
            </p>
            {!(typeof window !== "undefined" && localStorage.getItem(`creator_token_${quizId}`)) && (
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                placeholder="PIN (e.g. 7890)"
                className="w-full py-2.5 text-center text-xl font-bold bg-slate-50 border-2 border-slate-900 rounded-xl mb-3 focus:outline-none"
              />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPinPrompt({ open: false, attemptId: "", playerName: "" })}
                className="flex-1 py-2.5 bg-slate-100 font-bold text-xs rounded-xl border border-slate-300 text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAttempt}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 font-black text-xs rounded-xl text-white border-2 border-slate-900 uppercase cursor-pointer"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
