import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { briefModel } from "@/lib/ai/providers";
import { buildScenarioPrompt, parseScenarioResponse } from "@/lib/ai/scenario-engine";
import type { ScenarioResult } from "@/lib/ai/scenario-engine";
import type { IntelItem } from "@/types/intel";
import { checkRateLimit } from "@/lib/middleware/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/scenarios/analyze
 * AI-powered "What If" scenario analysis.
 * Accepts a geopolitical scenario and returns consequence chains.
 */
export async function POST(request: NextRequest) {
  // Strict rate limit — prevent abuse of LLM calls
  const rateLimited = await checkRateLimit(request);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json().catch(() => ({}));
    const scenario = typeof body.scenario === "string" ? body.scenario.trim() : "";

    // Validate scenario length
    if (scenario.length < 10) {
      return NextResponse.json(
        { error: "Scenario must be at least 10 characters" },
        { status: 400 }
      );
    }
    if (scenario.length > 500) {
      return NextResponse.json(
        { error: "Scenario must be 500 characters or less" },
        { status: 400 }
      );
    }

    // Fetch recent events for context
    const baseUrl = new URL(request.url).origin;
    let recentEvents: IntelItem[] = [];
    try {
      const intelRes = await fetch(`${baseUrl}/api/intel?limit=30`);
      if (intelRes.ok) {
        const intelData = await intelRes.json();
        recentEvents = (intelData.items || []).slice(0, 20);
      }
    } catch (err) {
      console.error("[scenarios/analyze]", err);
      // Continue without context — AI can still analyze the scenario
    }

    // Build prompt and call LLM
    const prompt = buildScenarioPrompt(scenario, recentEvents);

    const { text } = await generateText({
      model: briefModel,
      prompt,
    });

    // Parse the response
    const parsed = parseScenarioResponse(text);

    // Build final result with defaults
    const result: ScenarioResult = {
      scenario,
      immediateEffects: parsed.immediateEffects || ["Analysis unavailable"],
      shortTermEffects: parsed.shortTermEffects || [],
      longTermEffects: parsed.longTermEffects || [],
      affectedRegions: parsed.affectedRegions || [],
      riskLevel: parsed.riskLevel || "medium",
      confidence: parsed.confidence ?? 50,
      relatedEvents: parsed.relatedEvents || [],
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[scenario-analyze]", err);
    return NextResponse.json(
      { error: "AI analysis failed. Please try again." },
      { status: 503 }
    );
  }
}
