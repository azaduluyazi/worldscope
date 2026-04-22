import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import { SEED_OSINT_RESOURCES } from "@/config/osint-resources";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * POST /api/admin/seed-osint
 * Upserts all SEED_OSINT_RESOURCES into the `osint_resources` table.
 * Safe to call multiple times — uses upsert on slug. Requires migration
 * 027_osint_resources.sql to have been applied.
 *
 * Current UI (/osint) reads directly from SEED_OSINT_RESOURCES; this
 * endpoint exists so admins can migrate the page to DB-reads later
 * without losing the seeded state.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const db = createServerClient();

  const rows = SEED_OSINT_RESOURCES.map((r) => ({
    slug: r.slug,
    name: r.name,
    url: r.url,
    description: r.description,
    description_tr: r.descriptionTr ?? null,
    integration_type: r.integrationType,
    category: r.category,
    scope: r.scope,
    region: r.region ?? null,
    country_code: r.countryCode ?? null,
    city: r.city ?? null,
    cost: r.cost,
    required_tier: r.requiredTier,
    embed_url: r.embedUrl ?? null,
    embed_height: r.embedHeight ?? 600,
    tags: r.tags,
    priority: r.priority,
    is_active: true,
  }));

  const CHUNK = 50;
  let inserted = 0;
  const errors: string[] = [];

  // `osint_resources` was added in migration 027 after the last
  // `supabase gen types` run, so the generated Database type doesn't
  // know about it yet. Casting the builder unblocks the push; the next
  // type regen will make this redundant and we can drop the cast.
  const osintTable = (db as unknown as {
    from: (table: string) => {
      upsert: (
        rows: Record<string, unknown>[],
        opts: { onConflict: string; ignoreDuplicates: boolean },
      ) => { select: (cols: string) => Promise<{ data: { id: string }[] | null; error: { message: string } | null }> };
    };
  }).from("osint_resources");

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { data, error } = await osintTable
      .upsert(chunk, { onConflict: "slug", ignoreDuplicates: false })
      .select("id");

    if (error) {
      errors.push(error.message);
    } else if (data) {
      inserted += data.length;
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    totalResources: SEED_OSINT_RESOURCES.length,
    inserted,
    errors,
    durationMs: Date.now() - startTime,
  });
}
