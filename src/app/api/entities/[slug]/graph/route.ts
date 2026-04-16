import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { getEntityBySlug } from "@/lib/db/entities";

export const runtime = "nodejs";
// 1 hour — co-occurrence graph changes slowly; reduces DB load significantly
export const revalidate = 3600;

type GraphNode = {
  id: number;
  slug: string;
  name: string;
  type: string;
  val: number;
};

type GraphLink = {
  source: number;
  target: number;
  value: number;
};

/**
 * GET /api/entities/:slug/graph
 * Returns a root-centered co-occurrence graph (top 30 neighbors).
 * Consumed by the EntityGraph client component.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const root = await getEntityBySlug(slug);
  if (!root) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const db = createServerClient();

  // Fetch top co-occurrences (either direction) for the root entity.
  // We query the view twice with an OR — cleaner and faster than
  // joining once with CASE expressions.
  const { data: cooccurrences, error } = await db
    .from("entity_cooccurrence")
    .select("entity_a, entity_b, shared_events")
    .or(`entity_a.eq.${root.id},entity_b.eq.${root.id}`)
    .order("shared_events", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const neighborIds = new Set<number>();
  for (const co of cooccurrences ?? []) {
    const otherId = co.entity_a === root.id ? co.entity_b : co.entity_a;
    if (otherId !== root.id) neighborIds.add(otherId);
  }

  // Hydrate neighbor details in a single query
  const neighborMap = new Map<number, { id: number; slug: string; name: string; type: string }>();
  if (neighborIds.size > 0) {
    const { data: neighbors } = await db
      .from("entities")
      .select("id, slug, name, type")
      .in("id", Array.from(neighborIds));
    for (const n of neighbors ?? []) {
      neighborMap.set(n.id, n);
    }
  }

  const nodes: GraphNode[] = [
    {
      id: root.id,
      slug: root.slug,
      name: root.name,
      type: root.type,
      val: 10,
    },
  ];
  const links: GraphLink[] = [];

  for (const co of cooccurrences ?? []) {
    const otherId = co.entity_a === root.id ? co.entity_b : co.entity_a;
    if (otherId === root.id) continue;
    const neighbor = neighborMap.get(otherId);
    if (!neighbor) continue;
    nodes.push({
      id: neighbor.id,
      slug: neighbor.slug,
      name: neighbor.name,
      type: neighbor.type,
      val: Math.log(co.shared_events + 1) * 2,
    });
    links.push({
      source: root.id,
      target: neighbor.id,
      value: co.shared_events,
    });
  }

  return NextResponse.json({ nodes, links });
}
