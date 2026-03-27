import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "WorldScope — Global Intelligence Dashboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #050a12 0%, #0a1628 40%, #0d1f3c 100%)",
          fontFamily: "monospace",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(0,229,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glow circle */}
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,229,255,0.15) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Globe emoji */}
        <div style={{ fontSize: 80, marginBottom: 20 }}>🌍</div>

        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-1px",
            textAlign: "center",
          }}
        >
          WorldScope
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: "#00e5ff",
            marginTop: 12,
            letterSpacing: "3px",
            textTransform: "uppercase",
          }}
        >
          Global Intelligence Dashboard
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: "flex",
            gap: 40,
            marginTop: 40,
            color: "rgba(255,255,255,0.6)",
            fontSize: 16,
          }}
        >
          <span>37 LIVE SOURCES</span>
          <span style={{ color: "rgba(0,229,255,0.4)" }}>|</span>
          <span>195 COUNTRIES</span>
          <span style={{ color: "rgba(0,229,255,0.4)" }}>|</span>
          <span>25 MAP LAYERS</span>
          <span style={{ color: "rgba(0,229,255,0.4)" }}>|</span>
          <span>30 LANGUAGES</span>
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            fontSize: 18,
            color: "rgba(0,229,255,0.5)",
            letterSpacing: "2px",
          }}
        >
          troiamedia.com
        </div>
      </div>
    ),
    { ...size }
  );
}
