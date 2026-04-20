/**
 * POST /api/digest/test
 *
 * Admin-only test endpoint — fires a canned sample digest at the channels
 * supplied in the request body. Used to verify a Slack webhook URL, a
 * Discord integration, or a Telegram chat_id without waiting for the
 * daily cron.
 *
 * Auth: bearer ADMIN_KEY.
 *
 * Body:
 *   {
 *     channels: {
 *       slackWebhookUrl?: string;
 *       discordWebhookUrl?: string;
 *       telegramChatId?: string;
 *       webhook?: { url: string; sharedSecret?: string };
 *     }
 *   }
 *
 * Returns: { results: DispatchResult[] }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { dispatchDigest } from "@/lib/digest/dispatch";
import type { DigestItem, DigestMeta } from "@/lib/digest/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  channels: z.object({
    slackWebhookUrl: z.string().url().optional(),
    discordWebhookUrl: z.string().url().optional(),
    telegramChatId: z.union([z.string(), z.number()]).optional(),
    webhook: z
      .object({
        url: z.string().url(),
        sharedSecret: z.string().min(1).optional(),
      })
      .optional(),
  }),
});

const SAMPLE_ITEMS: DigestItem[] = [
  {
    title: "GPS Interference: Eastern Mediterranean (Syria/Lebanon)",
    severity: "critical",
    source: "Reuters",
    country: "LB",
    category: "Ares",
    score: 94,
    summary: "Commercial vessels report GPS spoofing in the corridor; AIS tracks cross-verify.",
    url: "https://troiamedia.com/events/sample-hormuz",
    publishedAt: new Date().toISOString(),
  },
  {
    title: "Supply chain: Nordstream repair window announced Q3",
    severity: "medium",
    source: "FT",
    country: "DE",
    category: "Zeus",
    score: 58,
    summary: "Gazprom press briefing indicates Q3 return-to-service, conditional on financing.",
    publishedAt: new Date().toISOString(),
  },
  {
    title: "Cerebras WSE-3 procurement order from sovereign fund",
    severity: "low",
    source: "Bloomberg",
    country: "AE",
    category: "Hephaestus",
    score: 64,
    summary: "Single-digit units reported; receiving entity undisclosed.",
    publishedAt: new Date().toISOString(),
  },
];

const SAMPLE_META: DigestMeta = {
  title: `WorldScope Digest · ${new Date().toISOString().slice(0, 10)} · TEST`,
  assessment:
    "Sample digest payload. In production this field contains an AI-generated short situation brief.",
  brandUrl: "https://troiamedia.com",
  tier: "Prometheus (Pro) · test",
};

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
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const results = await dispatchDigest(SAMPLE_ITEMS, SAMPLE_META, parsed.data.channels);
  const ok = results.every((r) => r.ok);
  return NextResponse.json({ ok, results }, { status: ok ? 200 : 207 });
}
