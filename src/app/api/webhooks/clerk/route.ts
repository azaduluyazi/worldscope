/**
 * POST /api/webhooks/clerk
 *
 * Receives Clerk webhooks (user.created / user.updated / user.deleted)
 * and syncs them into Supabase's public.user_profiles table so every
 * sign-up gets a local profile row that the subscriptions + alert_rules
 * tables can foreign-key to.
 *
 * Signature: Svix signs all Clerk webhooks. We verify with the shared
 * CLERK_WEBHOOK_SIGNING_SECRET env var (value starts with `whsec_`).
 *
 * References:
 *   https://clerk.com/docs/integrations/webhooks
 *   https://docs.svix.com/receiving/verifying-payloads
 */

import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { createServerClient } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ClerkUser {
  id: string;
  email_addresses?: { id: string; email_address: string }[];
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  image_url?: string | null;
}

interface ClerkEvent {
  type: "user.created" | "user.updated" | "user.deleted" | string;
  data: ClerkUser;
}

function primaryEmail(user: ClerkUser): string | null {
  const list = user.email_addresses ?? [];
  if (list.length === 0) return null;
  if (user.primary_email_address_id) {
    const hit = list.find((e) => e.id === user.primary_email_address_id);
    if (hit) return hit.email_address;
  }
  return list[0].email_address;
}

function displayName(user: ClerkUser): string | null {
  if (user.username) return user.username;
  const parts = [user.first_name, user.last_name].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    console.error("[clerk-webhook] CLERK_WEBHOOK_SIGNING_SECRET missing");
    return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "missing svix headers" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: ClerkEvent;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch (err) {
    console.warn("[clerk-webhook] signature failed", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const db = createServerClient();
  const user = event.data;

  try {
    switch (event.type) {
      case "user.created":
      case "user.updated": {
        const email = primaryEmail(user);
        if (!email) {
          return NextResponse.json({ status: "skipped", reason: "no email" });
        }
        const { error } = await db
          .from("user_profiles")
          .upsert(
            {
              auth_id: user.id as unknown as string, // clerk user id stored as auth_id
              email,
              display_name: displayName(user),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "auth_id" },
          );
        if (error) throw new Error(error.message);
        return NextResponse.json({ status: "ok", event: event.type });
      }

      case "user.deleted": {
        const { error } = await db
          .from("user_profiles")
          .delete()
          .eq("auth_id", user.id as unknown as string);
        if (error) throw new Error(error.message);
        return NextResponse.json({ status: "ok", event: event.type });
      }

      default:
        return NextResponse.json({ status: "ignored", event: event.type });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[clerk-webhook] ${event.type} failed`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
