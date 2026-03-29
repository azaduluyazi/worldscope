import { NextRequest, NextResponse } from "next/server";
import { edgeTts } from "@/lib/api/edge-tts";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Edge-TTS voice mapping for 30 supported locales.
 * Each locale maps to the best available neural voice.
 * News category voices preferred where available.
 */
const VOICE_MAP: Record<string, string> = {
  en: "en-US-AriaNeural",
  tr: "tr-TR-EmelNeural",
  ar: "ar-SA-ZariyahNeural",
  de: "de-DE-KatjaNeural",
  es: "es-ES-ElviraNeural",
  fr: "fr-FR-DeniseNeural",
  ja: "ja-JP-NanamiNeural",
  ko: "ko-KR-SunHiNeural",
  ru: "ru-RU-SvetlanaNeural",
  zh: "zh-CN-XiaoxiaoNeural",
  pt: "pt-BR-FranciscaNeural",
  it: "it-IT-ElsaNeural",
  nl: "nl-NL-ColetteNeural",
  pl: "pl-PL-ZofiaNeural",
  uk: "uk-UA-PolinaNeural",
  cs: "cs-CZ-VlastaNeural",
  sv: "sv-SE-SofieNeural",
  da: "da-DK-ChristelNeural",
  fi: "fi-FI-NooraNeural",
  no: "nb-NO-PernilleNeural",
  el: "el-GR-AthinaNeural",
  hu: "hu-HU-NoemiNeural",
  ro: "ro-RO-AlinaNeural",
  hi: "hi-IN-SwaraNeural",
  bn: "bn-IN-TanishaaNeural",
  th: "th-TH-PremwadeeNeural",
  vi: "vi-VN-HoaiMyNeural",
  id: "id-ID-GadisNeural",
  ms: "ms-MY-YasminNeural",
  fa: "fa-IR-DilaraNeural",
};

/** Map TTSSpeed (0.75|1|1.25|1.5) to Edge-TTS rate format */
function speedToRate(speed: number): string {
  const pct = Math.round((speed - 1) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

/**
 * POST /api/tts
 * Body: { text: string, lang?: string, speed?: number }
 * Returns: audio/mpeg MP3 stream
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, lang = "en", speed = 1 } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    // Limit text length to prevent abuse (max ~5000 chars = ~5min audio)
    const trimmed = text.slice(0, 5000);

    // Sanitize text for SSML (remove XML-special chars)
    const sanitized = trimmed
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

    const voice = VOICE_MAP[lang] || VOICE_MAP.en;
    const rate = speedToRate(speed);

    const audioBuffer = await edgeTts(sanitized, {
      voice,
      rate,
      pitch: "+0Hz",
      volume: "+0%",
    });

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audioBuffer.length),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[TTS] Edge-TTS error:", err);
    return NextResponse.json(
      { error: "TTS generation failed" },
      { status: 500 }
    );
  }
}
