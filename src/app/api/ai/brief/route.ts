import { streamText } from "ai";
import { briefModel } from "@/lib/ai/providers";
import type { IntelItem } from "@/types/intel";
import { checkStrictRateLimit } from "@/lib/middleware/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPTS: Record<string, string> = {
  en: `You are WorldScope AI, a strategic intelligence analyst. Provide a concise, tactical briefing based on current global events. Use a military/intelligence briefing style. Be direct and analytical. Structure your response with:

## SITUATION OVERVIEW
2-3 sentences on the current global picture.

## KEY THREATS
- Bullet points, max 4. Include severity (CRITICAL/HIGH/MEDIUM) and category.

## REGIONAL HOTSPOTS
- Name 2-3 geographic areas with elevated activity.

## MARKET IMPACT
1-2 sentences on financial implications.

## WATCH LIST
- 2-3 emerging situations to monitor in the next 24h.

Keep total response under 300 words. Use bold for severity levels.`,

  tr: `Sen WorldScope AI, stratejik bir istihbarat analistisin. Mevcut küresel olaylara dayalı kısa ve taktik bir brifing sun. Askeri/istihbarat brifing tarzı kullan. Doğrudan ve analitik ol. Yanıtını şu şekilde yapılandır:

## DURUM DEĞERLENDİRMESİ
Mevcut küresel tablo hakkında 2-3 cümle.

## ANA TEHDİTLER
- Madde işaretleri, maks 4. Ciddiyet seviyesi (KRİTİK/YÜKSEK/ORTA) ve kategori dahil.

## BÖLGESEL SICAK NOKTALAR
- Yoğun aktivite gösteren 2-3 coğrafi bölge.

## PİYASA ETKİSİ
Finansal sonuçlar hakkında 1-2 cümle.

## İZLEME LİSTESİ
- Önümüzdeki 24 saat içinde izlenmesi gereken 2-3 gelişen durum.

Toplam yanıtı 300 kelimenin altında tut. Ciddiyet seviyeleri için kalın yazı kullan.`,
};

export async function POST(request: Request) {
  const rl = await checkStrictRateLimit(request);
  if (rl) return rl;
  try {
    // Determine language from request
    const body = await request.json().catch(() => ({}));
    const lang: string = body.lang === "tr" ? "tr" : "en";
    const category: string | undefined = body.category;

    const baseUrl = new URL(request.url).origin;

    // Fetch intel data (from cache ideally)
    const intelUrl = category
      ? `${baseUrl}/api/intel?category=${category}&limit=30`
      : `${baseUrl}/api/intel?limit=30`;

    const intelRes = await fetch(intelUrl);
    const intelData = await intelRes.json();
    const topItems: IntelItem[] = (intelData.items || []).slice(0, 20);

    if (topItems.length === 0) {
      return new Response(
        lang === "tr" ? "Analiz edilecek istihbarat verisi yok." : "No intelligence data available for analysis.",
        { status: 200 }
      );
    }

    // Build category summary
    const catSummary: Record<string, number> = {};
    const sevSummary: Record<string, number> = {};
    topItems.forEach((item) => {
      catSummary[item.category] = (catSummary[item.category] || 0) + 1;
      sevSummary[item.severity] = (sevSummary[item.severity] || 0) + 1;
    });

    const headlines = topItems
      .map(
        (item, i) =>
          `${i + 1}. [${item.severity.toUpperCase()}/${item.category.toUpperCase()}] ${item.title} (${item.source})${item.lat ? ` [${item.lat.toFixed(1)}°, ${item.lng?.toFixed(1)}°]` : ""}`
      )
      .join("\n");

    const metadata = `Distribution: ${Object.entries(sevSummary).map(([k, v]) => `${k}=${v}`).join(", ")}
Categories: ${Object.entries(catSummary).map(([k, v]) => `${k}=${v}`).join(", ")}
Total events tracked: ${intelData.total || topItems.length}`;

    const systemPrompt = SYSTEM_PROMPTS[lang] || SYSTEM_PROMPTS.en;

    const result = streamText({
      model: briefModel,
      system: systemPrompt,
      prompt: `${lang === "tr" ? "Bu istihbarat raporlarını analiz et ve stratejik brifing hazırla" : "Analyze these intelligence reports and provide a strategic briefing"}:\n\n${metadata}\n\n${headlines}`,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error("[ai/brief] unexpected:", err);
    return new Response("AI service unavailable", { status: 503 });
  }
}
