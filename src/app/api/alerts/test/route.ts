/**
 * POST /api/alerts/test
 *
 * Admin-only. Runs the alert engine over a single hand-crafted IntelItem
 * to verify rule matching, quiet-hours logic, and channel dispatch
 * before wiring the engine to live cron input.
 *
 * Body: { item: Partial<IntelItem> }  (at minimum title + severity)
 * Returns: { evaluated, fired, suppressed, errors }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { runEngine } from "@/lib/alerts/engine";
import type { IntelItem, Severity } from "@/types/intel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  category: z.string().optional(),
  country: z.string().length(2).optional(),
  source: z.string().optional(),
  url: z.string().url().optional(),
  publishedAt: z.string().optional(),
  score: z.number().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const BodySchema = z.object({
  items: z.array(ItemSchema).min(1).max(50),
});

export async function POST(req: Request) {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token !== adminKey) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (err) {
    console.error("[alerts/test]", err);
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const items: IntelItem[] = parsed.data.items.map((it) => ({
    id: it.id ?? crypto.randomUUID(),
    title: it.title,
    summary: "",
    severity: it.severity as Severity,
    category: (it.category as IntelItem["category"]) ?? "intel",
    countryCode: it.country,
    source: it.source ?? "test",
    url: it.url ?? "",
    publishedAt: it.publishedAt ?? new Date().toISOString(),
    lat: it.lat,
    lng: it.lng,
    ...(it.score != null ? { score: it.score } : {}),
  })) as IntelItem[];

  try {
    const result = await runEngine(items);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[alerts-test] engine failed", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
