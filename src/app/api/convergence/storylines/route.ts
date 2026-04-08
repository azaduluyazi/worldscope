import { NextRequest, NextResponse } from "next/server";
import { fetchActiveStorylines, fetchStorylineById } from "@/lib/db/storylines";

export const runtime = "nodejs";
export const maxDuration = 15;

/**
 * GET /api/convergence/storylines
 *   Returns active storylines, sorted by recency.
 *   Query params:
 *     - id     → fetch a single storyline
 *     - limit  → max storylines to return (default 50)
 *
 * Storylines are the long-lived narrative layer above convergences.
 * Each storyline groups multiple convergence snapshots about the same
 * ongoing situation. See src/lib/convergence/storyline.ts.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const story = await fetchStorylineById(id);
      if (!story) {
        return NextResponse.json(
          { status: "error", error: "Storyline not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ status: "success", data: story });
    }

    const limit = Math.min(200, parseInt(searchParams.get("limit") || "50", 10));
    const stories = await fetchActiveStorylines(limit);
    return NextResponse.json({
      status: "success",
      data: {
        storylines: stories,
        count: stories.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[storylines API] error:", err);
    return NextResponse.json(
      { status: "error", error: "Failed to fetch storylines" },
      { status: 500 }
    );
  }
}
