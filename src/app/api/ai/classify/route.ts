import { generateObject } from "ai";
import { z } from "zod";
import { briefModel } from "@/lib/ai/providers";
import { NextResponse } from "next/server";
import { checkStrictRateLimit } from "@/lib/middleware/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 15;

const ClassificationSchema = z.object({
  items: z.array(z.object({
    index: z.number(),
    category: z.enum(["conflict", "finance", "cyber", "tech", "natural", "aviation", "energy", "diplomacy", "protest", "health"]),
    severity: z.enum(["critical", "high", "medium", "low", "info"]),
    confidence: z.number().min(0).max(1),
  })),
});

/**
 * POST /api/ai/classify
 * AI-powered event classification using LLM.
 * Accepts: { items: [{ index, title, summary }] }
 * Returns reclassified categories and severities.
 */
export async function POST(request: Request) {
  const rl = await checkStrictRateLimit(request);
  if (rl) return rl;
  try {
    if (!briefModel) {
      return NextResponse.json({ error: "No AI provider" }, { status: 503 });
    }

    const body = await request.json();
    const items = (body.items || []).slice(0, 20); // Max 20 items per batch

    if (items.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const itemList = items
      .map((i: { index: number; title: string; summary?: string }, idx: number) =>
        `[${idx}] ${i.title}${i.summary ? " — " + i.summary.slice(0, 100) : ""}`
      )
      .join("\n");

    const result = await generateObject({
      model: briefModel,
      schema: ClassificationSchema,
      prompt: `Classify these news items by category and severity. Be precise.

Categories: conflict (war, military, attacks), finance (markets, economy), cyber (hacking, breaches), tech (AI, startups, innovation), natural (earthquakes, storms, disasters), aviation (flights, crashes), energy (oil, gas, nuclear), diplomacy (UN, treaties, sanctions), protest (demonstrations, unrest), health (pandemic, outbreak, disease).

Severity: critical (active mass-casualty event), high (escalation, major incident), medium (notable development), low (routine news), info (background).

Items:
${itemList}`,
    });

    return NextResponse.json(result.object);
  } catch (err) {
    console.error("[ai/classify] unexpected:", err);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
