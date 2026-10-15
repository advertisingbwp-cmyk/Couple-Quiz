import React from "react";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createQuizStorage } from "@/lib/quiz/storage";
import { sanitizeCreatorName } from "@/lib/quiz/sharing";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const quizId = resolvedParams.id;

  let creatorName = "Your Friend";
  let isCustom = false;

  if (quizId && quizId !== "default") {
    try {
      const storage = createQuizStorage();
      const quiz = await storage.getQuizPublicData(quizId);
      if (quiz && quiz.creatorName) {
        creatorName = sanitizeCreatorName(quiz.creatorName);
        isCustom = true;
      }
    } catch {
      // Graceful fallback to default brand image
    }
  }

  const headline = isCustom
    ? `How well do you really know ${creatorName}?`
    : "How well do your friends really know you?";

  const subline = isCustom
    ? `${creatorName} created a 10-question challenge. Can you score 10/10?`
    : "Create your 10-question friendship dare & share on WhatsApp!";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #cbe5ff 0%, #edf7ff 50%, #fff6e0 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "40px",
        }}
      >
        {/* Main Card */}
        <div
          style={{
            width: "1120px",
            height: "550px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#ffffff",
            borderRadius: "36px",
            border: "6px solid #29324c",
            boxShadow: "0 24px 48px rgba(41, 50, 76, 0.18)",
            padding: "48px 56px",
            position: "relative",
          }}
        >
          {/* Top Brand Bar */}
          <div
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Logo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  backgroundColor: "#ffce71",
                  border: "3px solid #29324c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "26px",
                  fontWeight: 900,
                  color: "#29324c",
                }}
              >
                ✨
              </div>
              <div
                style={{
                  fontSize: "34px",
                  fontWeight: 900,
                  color: "#29324c",
                  letterSpacing: "-1px",
                  display: "flex",
                }}
              >
                click{" "}
                <span style={{ color: "#6650b7", margin: "0 6px" }}>&amp;</span>
                clique
                <span style={{ color: "#bd4a66" }}>.</span>
              </div>
            </div>

            {/* Pill Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#ffce71",
                color: "#29324c",
                padding: "10px 22px",
                borderRadius: "999px",
                border: "3px solid #29324c",
                fontSize: "18px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              <span>Friendship Dare</span>
              <span>🎯</span>
            </div>
          </div>

          {/* Center Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              margin: "auto 0",
              maxWidth: "980px",
            }}
          >
            <div
              style={{
                fontSize: "56px",
                fontWeight: 900,
                color: "#29324c",
                lineHeight: 1.15,
                letterSpacing: "-1.5px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              {headline}
            </div>

            <div
              style={{
                fontSize: "24px",
                fontWeight: 600,
                color: "#475569",
                lineHeight: 1.4,
                textAlign: "center",
                maxWidth: "800px",
              }}
            >
              {subline}
            </div>
          </div>

          {/* Bottom Badges */}
          <div
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              gap: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "#e0f2fe",
                color: "#0369a1",
                padding: "12px 24px",
                borderRadius: "20px",
                border: "2px solid #bae6fd",
                fontSize: "18px",
                fontWeight: 800,
              }}
            >
              <span>⚡</span>
              <span>10 Fast Questions</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "#fef3c7",
                color: "#b45309",
                padding: "12px 24px",
                borderRadius: "20px",
                border: "2px solid #fde68a",
                fontSize: "18px",
                fontWeight: 800,
              }}
            >
              <span>🏆</span>
              <span>Live Friends Leaderboard</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "#dcfce7",
                color: "#15803d",
                padding: "12px 24px",
                borderRadius: "20px",
                border: "2px solid #bbf7d0",
                fontSize: "18px",
                fontWeight: 800,
              }}
            >
              <span>💖</span>
              <span>Find Your Real Besties</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      },
    }
  );
}
