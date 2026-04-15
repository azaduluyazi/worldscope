import { ImageResponse } from "next/og";
import { createServerClient } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const alt = "WorldScope event detail";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CATEGORY_ACCENT: Record<string, string> = {
  conflict: "#ff4757",
  cyber: "#8a5cf6",
  finance: "#00ff88",
  weather: "#00e5ff",
  health: "#ffd000",
  energy: "#ffd000",
  commodity: "#ffa500",
  sports: "#00ff88",
  happy: "#ff69b4",
  default: "#00e5ff",
};

const CATEGORY_EMOJI: Record<string, string> = {
  conflict: "⚔️",
  cyber: "🛡️",
  finance: "📊",
  weather: "🌪️",
  health: "🏥",
  energy: "⚡",
  commodity: "📦",
  sports: "⚽",
  happy: "✨",
  default: "🛰️",
};

interface EventLite {
  title: string | null;
  category: string | null;
  severity: string | null;
  country_code: string | null;
  published_at: string | null;
}

async function getEventLite(id: string): Promise<EventLite | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    const db = createServerClient();
    const { data } = await db
      .from("events")
      .select("title, category, severity, country_code, published_at")
      .eq("id", id)
      .maybeSingle();
    return data as EventLite | null;
  } catch {
    return null;
  }
}

export default async function EventOg({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventLite(id);

  const title =
    event?.title?.slice(0, 140) || "WorldScope — Intelligence Event";
  const category = event?.category || "default";
  const accent = CATEGORY_ACCENT[category] || CATEGORY_ACCENT.default;
  const emoji = CATEGORY_EMOJI[category] || CATEGORY_EMOJI.default;
  const severity = event?.severity || "info";
  const country = event?.country_code || "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "60px",
          background: `linear-gradient(135deg, #050a12 0%, #0a1628 50%, ${accent}15 100%)`,
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(${accent}10 1px, transparent 1px), linear-gradient(90deg, ${accent}10 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
        {/* Top badge */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            fontSize: 16,
            letterSpacing: "3px",
            color: accent,
          }}
        >
          <span
            style={{
              background: `${accent}22`,
              border: `1px solid ${accent}55`,
              borderRadius: 6,
              padding: "6px 14px",
              textTransform: "uppercase",
            }}
          >
            {category}
          </span>
          <span
            style={{
              border: `1px solid ${accent}40`,
              borderRadius: 6,
              padding: "6px 14px",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {severity}
          </span>
          {country && (
            <span
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 6,
                padding: "6px 14px",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {country}
            </span>
          )}
        </div>

        {/* Headline area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 1000,
          }}
        >
          <div style={{ fontSize: 70, marginBottom: 12 }}>{emoji}</div>
          <div
            style={{
              fontSize: title.length > 80 ? 42 : 52,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-1px",
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            alignItems: "center",
            fontSize: 16,
            color: `${accent}99`,
            letterSpacing: "2px",
          }}
        >
          <span>TROIAMEDIA · WORLDSCOPE</span>
          <span>689 SOURCES · 195 COUNTRIES</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
