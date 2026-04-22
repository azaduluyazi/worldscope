import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { briefModel } from "@/lib/ai/providers";
import { fetchPersistedEvents } from "@/lib/db/events";
import { checkStrictRateLimit } from "@/lib/middleware/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/ai/sitrep — Generate an on-demand situation report.
 *
 * Unlike daily/weekly reports, SITREPs are generated on-demand for
 * a specific region, topic, or event cluster. This enables analysts
 * to get instant structured intelligence for any crisis.
 *
 * Body: {
 *   region?: string,     // e.g., "Middle East", "Ukraine", country code
 *   topic?: string,      // e.g., "Iran nuclear", "GPS jamming"
 *   category?: string,   // conflict, cyber, finance, etc.
 *   hours?: number,      // lookback window (default: 48)
 *   lang?: "en" | "tr"
 * }
 *
 * Returns: streaming text response (SITREP markdown)
 */
export async function POST(request: NextRequest) {
  const rl = await checkStrictRateLimit(request);
  if (rl) return rl;
  try {
    const body = await request.json().catch(() => ({}));
    const region = body.region || "";
    const topic = body.topic || "";
    const category = body.category || "";
    const hours = Math.min(body.hours || 48, 168); // max 7 days
    const lang: string = body.lang === "tr" ? "tr" : "en";

    // Fetch events for the specified window
    const allEvents = await fetchPersistedEvents({ limit: 200, hoursBack: hours });

    // Filter by region/topic/category if provided
    let events = allEvents;
    if (category) {
      events = events.filter((e) => e.category === category);
    }
    if (region) {
      const r = region.toLowerCase();
      events = events.filter(
        (e) =>
          e.countryCode?.toLowerCase() === r ||
          e.title.toLowerCase().includes(r) ||
          (e.summary && e.summary.toLowerCase().includes(r))
      );
    }
    if (topic) {
      const t = topic.toLowerCase();
      events = events.filter(
        (e) =>
          e.title.toLowerCase().includes(t) ||
          (e.summary && e.summary.toLowerCase().includes(t))
      );
    }

    // Fall back to all events if filters are too restrictive
    if (events.length < 3) {
      events = allEvents.slice(0, 50);
    }

    // Build context
    const catCount: Record<string, number> = {};
    const sevCount: Record<string, number> = {};
    events.forEach((e) => {
      catCount[e.category] = (catCount[e.category] || 0) + 1;
      sevCount[e.severity] = (sevCount[e.severity] || 0) + 1;
    });

    const headlines = events
      .slice(0, 30)
      .map(
        (e, i) =>
          `${i + 1}. [${e.severity.toUpperCase()}/${e.category}] ${e.title} (${e.source})`
      )
      .join("\n");

    const focus = [region, topic, category].filter(Boolean).join(", ") || "Global overview";

    const systemPrompt =
      lang === "tr"
        ? `Sen WorldScope kıdemli istihbarat analistisin. Aşağıdaki verilere dayalı yapılandırılmış bir DURUM RAPORU (SITREP) yaz. Odak: ${focus}

Rapor şu bölümleri içermeli:
## DURUM ÖZETİ (2-3 cümle)
## ARKA PLAN
## MEVCUT DURUM
## TEMEL AKTÖRLER
## ETKİ ANALİZİ
## TAHMİN VE SENARYOLAR

400-600 kelime, profesyonel ve analitik ton.`
        : `You are a WorldScope senior intelligence analyst. Write a structured SITUATION REPORT (SITREP) based on the data below. Focus: ${focus}

Structure:
## SITUATION SUMMARY (2-3 sentences)
## BACKGROUND
## CURRENT SITUATION
## KEY ACTORS
## IMPACT ANALYSIS
## FORECAST & SCENARIOS

400-600 words, professional analytical tone.`;

    const statsBlock = `Focus: ${focus}
Period: Last ${hours} hours
Events analyzed: ${events.length}
Severity: ${Object.entries(sevCount).map(([k, v]) => `${k}=${v}`).join(", ")}
Categories: ${Object.entries(catCount).sort(([, a], [, b]) => b - a).map(([k, v]) => `${k}=${v}`).join(", ")}`;

    const result = streamText({
      model: briefModel,
      system: systemPrompt,
      prompt: `Generate a SITREP based on:\n\n${statsBlock}\n\nKey events:\n${headlines}`,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error("[ai/sitrep]", err);
    return NextResponse.json(
      { error: "SITREP generation failed" },
      { status: 500 }
    );
  }
}
