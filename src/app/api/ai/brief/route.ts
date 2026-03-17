import { streamText } from "ai";
import { briefModel } from "@/lib/ai/providers";
import type { IntelItem } from "@/types/intel";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const baseUrl = new URL(request.url).origin;

    const intelRes = await fetch(`${baseUrl}/api/intel`);
    const intelData = await intelRes.json();
    const topItems: IntelItem[] = (intelData.items || []).slice(0, 15);

    const headlines = topItems
      .map((item, i) => `${i + 1}. [${item.severity.toUpperCase()}] ${item.title} (${item.source})`)
      .join("\n");

    const result = streamText({
      model: briefModel,
      system: `You are WorldScope AI, a strategic intelligence analyst. Provide a concise, tactical briefing based on current global events. Use a military/intelligence briefing style. Be direct and analytical. Structure your response with:
1. SITUATION OVERVIEW (2-3 sentences)
2. KEY THREATS (bullet points, max 3)
3. MARKET IMPACT (1-2 sentences)
4. WATCH LIST (emerging situations to monitor)

Keep total response under 250 words.`,
      prompt: `Analyze these current intelligence reports and provide a strategic briefing:\n\n${headlines}`,
    });

    return result.toTextStreamResponse();
  } catch {
    return new Response("AI service unavailable", { status: 503 });
  }
}
