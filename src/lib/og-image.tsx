import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

interface ModuleOgProps {
  title: string;
  subtitle: string;
  emoji: string;
  accentColor: string;
}

export function generateModuleOgImage({ title, subtitle, emoji, accentColor }: ModuleOgProps) {
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
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(0,229,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accentColor}25 0%, transparent 70%)`,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
        <div style={{ fontSize: 80, marginBottom: 20 }}>{emoji}</div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-1px",
            textAlign: "center",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 22,
            color: accentColor,
            marginTop: 12,
            letterSpacing: "3px",
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          {subtitle}
        </div>
        <div
          style={{
            display: "flex",
            gap: 40,
            marginTop: 40,
            color: "rgba(255,255,255,0.5)",
            fontSize: 16,
          }}
        >
          <span>WORLDSCOPE</span>
          <span style={{ color: `${accentColor}66` }}>|</span>
          <span>TROIAMEDIA</span>
        </div>
        {/* Stats bar — identical across all variants for Discover recognition */}
        <div
          style={{
            display: "flex",
            gap: 28,
            marginTop: 18,
            color: "rgba(255,255,255,0.42)",
            fontSize: 14,
            letterSpacing: "1px",
          }}
        >
          <span>689 SOURCES</span>
          <span style={{ color: `${accentColor}44` }}>·</span>
          <span>195 COUNTRIES</span>
          <span style={{ color: `${accentColor}44` }}>·</span>
          <span>30 LANGUAGES</span>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 30,
            fontSize: 18,
            color: `${accentColor}80`,
            letterSpacing: "2px",
          }}
        >
          troiamedia.com
        </div>
      </div>
    ),
    { ...ogSize }
  );
}
