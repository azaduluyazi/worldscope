import { NextRequest, NextResponse } from "next/server";
import { getEmbeddingProvider } from "@/lib/convergence/embedding";
import { createServerClient } from "@/lib/db/supabase";
import { fetchEventsByIds } from "@/lib/db/events";

// 60s edge cache — semantic results are stable for short windows
export const revalidate = 60;
export const runtime = "nodejs";

/**
 * GET /api/search/semantic?q=...&limit=20&threshold=0.3
 *
 * Returns events semantically similar to the query. Uses the existing
 * convergence_embeddings cache (populated by the 5-min convergence cron
 * — no backfill needed here).
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json(
      { error: "q must be at least 3 characters" },
      { status: 400 }
    );
  }

  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get("limit") || "20", 10),
    50
  );
  const threshold = Math.max(
    0,
    Math.min(
      1,
      parseFloat(request.nextUrl.searchParams.get("threshold") || "0.3")
    )
  );

  // Generate query embedding. Provider throws if GEMINI_API_KEY missing.
  let embedding: number[];
  try {
    const provider = getEmbeddingProvider();
    embedding = await provider.embed(q);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `embedding unavailable: ${msg}` },
      { status: 503 }
    );
  }

  // Query HNSW index via RPC
  const db = createServerClient();
  const { data: matches, error } = await db.rpc("search_events_semantic", {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const matchArr = (matches ?? []) as Array<{
    event_id: string;
    similarity: number;
  }>;
  if (matchArr.length === 0) {
    return NextResponse.json({ query: q, count: 0, results: [] });
  }

  const events = await fetchEventsByIds(matchArr.map((m) => m.event_id));
  // Build similarity lookup and preserve semantic ranking
  const simMap = new Map<string, number>();
  for (const m of matchArr) {
    // event IDs in the RPC output may or may not have the db- prefix,
    // so we store both forms for safe lookup
    simMap.set(m.event_id, m.similarity);
    if (m.event_id.startsWith("db-")) {
      simMap.set(m.event_id.slice(3), m.similarity);
    } else {
      simMap.set(`db-${m.event_id}`, m.similarity);
    }
  }
  const enriched = events
    .map((e) => ({ ...e, similarity: simMap.get(e.id) ?? 0 }))
    .sort((a, b) => b.similarity - a.similarity);

  return NextResponse.json({
    query: q,
    count: enriched.length,
    results: enriched,
  });
}
