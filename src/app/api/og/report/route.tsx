import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * GET /api/og/report?type=daily&date=2026-03-18
 * Generates Open Graph social sharing image for reports.
 * 1200x630 card with WorldScope branding.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") || "daily";
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const events = searchParams.get("events") || "—";
  const summary = searchParams.get("summary") || "Global intelligence analysis powered by AI";

  const dateStr = new Date(date + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isWeekly = type === "weekly";
  const accentColor = isWeekly ? "#ffd000" : "#00e5ff";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #050a12 0%, #0a1530 50%, #050a12 100%)",
          fontFamily: "monospace",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Corner brackets */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            width: 40,
            height: 40,
            borderTop: "3px solid rgba(0,229,255,0.4)",
            borderLeft: "3px solid rgba(0,229,255,0.4)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            width: 40,
            height: 40,
            borderBottom: "3px solid rgba(0,229,255,0.4)",
            borderRight: "3px solid rgba(0,229,255,0.4)",
          }}
        />

        {/* Top section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Logo & type badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: accentColor,
                  boxShadow: `0 0 20px ${accentColor}80`,
                }}
              />
              <span
                style={{
                  fontSize: 14,
                  letterSpacing: "4px",
                  color: "#5a7a9a",
                  textTransform: "uppercase",
                }}
              >
                WORLDSCOPE
              </span>
            </div>

            <div
              style={{
                fontSize: 12,
                letterSpacing: "3px",
                color: "#050a12",
                background: accentColor,
                padding: "4px 16px",
                borderRadius: "4px",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            >
              {type} report
            </div>
          </div>

          {/* Date */}
          <div
            style={{
              fontSize: 42,
              color: "#e0e8f0",
              fontWeight: "bold",
              letterSpacing: "1px",
              lineHeight: 1.2,
            }}
          >
            {dateStr}
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 16,
              color: "#5a7a9a",
              letterSpacing: "1px",
              maxWidth: "80%",
              lineHeight: 1.6,
            }}
          >
            {summary.slice(0, 150)}
          </div>
        </div>

        {/* Bottom section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
            {/* Events count */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: accentColor,
                }}
              >
                {events}
              </span>
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: "2px",
                  color: "#5a7a9a",
                  textTransform: "uppercase",
                }}
              >
                Events Analyzed
              </span>
            </div>

            {/* Separator */}
            <div
              style={{
                width: 1,
                height: 40,
                background: "rgba(0,229,255,0.2)",
              }}
            />

            {/* AI badge */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: "bold",
                  color: "#8a5cf6",
                }}
              >
                AI-POWERED
              </span>
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: "2px",
                  color: "#5a7a9a",
                  textTransform: "uppercase",
                }}
              >
                Intelligence Analysis
              </span>
            </div>
          </div>

          {/* Domain */}
          <span
            style={{
              fontSize: 12,
              letterSpacing: "2px",
              color: "#3a5a7a",
            }}
          >
            troiamedia.com
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
