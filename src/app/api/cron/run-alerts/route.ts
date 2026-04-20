/**
 * Cron: run the alert engine against the newest events.
 *
 * Runs every 10 minutes offset 3 from the fetch-feeds cron so any rows
 * inserted in the last cycle get evaluated against user rules.
 *
 * Auth: bearer CRON_SECRET (same as every /api/cron/* route).
 *
 * Not mutating anything outside the alert engine — which itself writes
 * alert_fires rows and updates last_fired_at on matched rules.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { runEngine } from "@/lib/alerts/engine";
import type { IntelItem } from "@/types/intel";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token === secret;
}

interface EventRow {
  id: string;
  title: string;
  source: string;
  url: string;
  severity: string;
  published_at: string;
  country_code: string | null;
  category: string | null;
  summary?: string | null;
  lat?: number | null;
  lng?: number | null;
}

function toIntel(row: EventRow): IntelItem {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary ?? "",
    source: row.source,
    url: row.url,
    severity: row.severity as IntelItem["severity"],
    publishedAt: row.published_at,
    category: (row.category as IntelItem["category"]) ?? "intel",
    countryCode: row.country_code ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
  } as IntelItem;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Window: events inserted/published in the last 15 minutes. Slight
  // overlap with the previous run is OK — the rule engine's cooldown
  // window prevents duplicate fires.
  const since = new Date(Date.now() - 15 * 60_000).toISOString();

  const db = createServerClient();
  const { data, error } = await db
    .from("events")
    .select("id, title, source, url, severity, published_at, country_code, category, summary, lat, lng")
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[run-alerts] events query failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []).map((r) => toIntel(r as EventRow));
  if (items.length === 0) {
    return NextResponse.json({ status: "empty", evaluated: 0 });
  }

  try {
    const result = await runEngine(items);
    return NextResponse.json({ status: "ok", windowStart: since, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[run-alerts] engine failed", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
