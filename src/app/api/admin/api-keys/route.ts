import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import {
  generateApiKey,
  invalidateKeyCache,
} from "@/lib/api-keys";
import { sendMail } from "@/lib/mail/sender";

export const runtime = "nodejs";

/**
 * Verify admin authorization via X-Admin-Key header.
 */
function isAdmin(request: Request): boolean {
  const key = request.headers.get("x-admin-key");
  const adminSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
  return !!adminSecret && key === adminSecret;
}

/**
 * GET /api/admin/api-keys
 * List all API key records (pending, approved, denied, revoked).
 */
export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServerClient();
  const { data, error } = await db
    .from("api_keys")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch keys" }, { status: 500 });
  }

  // Compute summary stats
  const stats = {
    total: data.length,
    pending: data.filter((k) => k.status === "pending").length,
    approved: data.filter((k) => k.status === "approved").length,
    denied: data.filter((k) => k.status === "denied").length,
    revoked: data.filter((k) => k.status === "revoked").length,
    totalRequests: data.reduce(
      (sum: number, k: { request_count: number }) => sum + (k.request_count || 0),
      0
    ),
  };

  return NextResponse.json({ keys: data, stats });
}

/**
 * POST /api/admin/api-keys
 * Actions: approve, deny, revoke an API key request.
 */
export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, requestId, rateLimit } = body as {
      action: "approve" | "deny" | "revoke";
      requestId: string;
      rateLimit?: number;
    };

    if (!action || !requestId) {
      return NextResponse.json(
        { error: "action and requestId are required" },
        { status: 400 }
      );
    }

    const db = createServerClient();

    // Fetch the record
    const { data: record, error: fetchError } = await db
      .from("api_keys")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !record) {
      return NextResponse.json(
        { error: "API key request not found" },
        { status: 404 }
      );
    }

    switch (action) {
      case "approve": {
        if (record.status !== "pending") {
          return NextResponse.json(
            { error: `Cannot approve a ${record.status} request` },
            { status: 400 }
          );
        }

        // Generate the key
        const { key, hash, prefix } = generateApiKey();
        const limit = rateLimit || 100;

        // Store hash (NEVER the raw key)
        const { error: updateError } = await db
          .from("api_keys")
          .update({
            key_hash: hash,
            key_prefix: prefix,
            status: "approved",
            rate_limit: limit,
            approved_at: new Date().toISOString(),
          })
          .eq("id", requestId);

        if (updateError) {
          return NextResponse.json(
            { error: "Failed to approve key" },
            { status: 500 }
          );
        }

        // Send key to developer via email (only time raw key is shown)
        await sendMail({
          to: record.email,
          subject: "Your WorldScope API Key Has Been Approved",
          html: buildApprovalEmail(record.name, key, limit),
        });

        return NextResponse.json({
          success: true,
          message: `Approved. API key sent to ${record.email}`,
          prefix,
        });
      }

      case "deny": {
        if (record.status !== "pending") {
          return NextResponse.json(
            { error: `Cannot deny a ${record.status} request` },
            { status: 400 }
          );
        }

        await db
          .from("api_keys")
          .update({ status: "denied" })
          .eq("id", requestId);

        return NextResponse.json({
          success: true,
          message: "Application denied",
        });
      }

      case "revoke": {
        if (record.status !== "approved") {
          return NextResponse.json(
            { error: `Cannot revoke a ${record.status} key` },
            { status: 400 }
          );
        }

        await db
          .from("api_keys")
          .update({ status: "revoked" })
          .eq("id", requestId);

        // Invalidate from Redis cache
        if (record.key_hash) {
          await invalidateKeyCache(record.key_hash);
        }

        return NextResponse.json({
          success: true,
          message: "API key revoked",
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: approve, deny, revoke" },
          { status: 400 }
        );
    }
  } catch (e) {
    console.error("[Admin API Keys] Error:", e);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}

/* ─── Email Template ─── */

function buildApprovalEmail(
  name: string,
  apiKey: string,
  rateLimit: number
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;color:#e0e0e0;font-family:'Courier New',monospace;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="border:1px solid #00e5ff33;border-radius:8px;padding:32px;background:#0d1117;">
      <h1 style="color:#00e5ff;font-size:20px;margin:0 0 8px;letter-spacing:2px;">WORLDSCOPE DEVELOPER API</h1>
      <p style="color:#8b949e;margin:0 0 24px;font-size:13px;">API Key Approved</p>

      <p style="color:#c9d1d9;font-size:14px;">Hello ${name},</p>
      <p style="color:#c9d1d9;font-size:14px;">Your API key application has been approved. Here is your key:</p>

      <div style="background:#161b22;border:1px solid #30363d;border-radius:6px;padding:16px;margin:20px 0;word-break:break-all;">
        <code style="color:#00ff88;font-size:14px;letter-spacing:0.5px;">${apiKey}</code>
      </div>

      <div style="background:#1c1c2e;border-left:3px solid #ff4757;padding:12px 16px;margin:20px 0;border-radius:0 4px 4px 0;">
        <p style="color:#ff4757;font-size:13px;margin:0;font-weight:bold;">IMPORTANT: Save this key now.</p>
        <p style="color:#8b949e;font-size:12px;margin:4px 0 0;">This is the only time your full API key will be shown. We store only a hashed version and cannot recover it.</p>
      </div>

      <div style="margin:20px 0;">
        <p style="color:#8b949e;font-size:13px;margin:4px 0;"><strong style="color:#c9d1d9;">Rate Limit:</strong> ${rateLimit} requests/hour</p>
        <p style="color:#8b949e;font-size:13px;margin:4px 0;"><strong style="color:#c9d1d9;">Base URL:</strong> https://troiamedia.com/api/v1</p>
        <p style="color:#8b949e;font-size:13px;margin:4px 0;"><strong style="color:#c9d1d9;">Auth Header:</strong> Authorization: Bearer YOUR_KEY</p>
      </div>

      <div style="margin:24px 0;">
        <p style="color:#c9d1d9;font-size:13px;font-weight:bold;">Available Endpoints:</p>
        <p style="color:#8b949e;font-size:12px;margin:4px 0;"><code style="color:#00e5ff;">GET /api/v1/events</code> &mdash; Global events feed</p>
        <p style="color:#8b949e;font-size:12px;margin:4px 0;"><code style="color:#00e5ff;">GET /api/v1/countries/:code</code> &mdash; Country risk data</p>
      </div>

      <hr style="border:none;border-top:1px solid #21262d;margin:24px 0;">
      <p style="color:#484f58;font-size:11px;margin:0;">WorldScope &mdash; Real-Time Global Intelligence Platform</p>
    </div>
  </div>
</body>
</html>`;
}
