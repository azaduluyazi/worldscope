"use client";

import useSWR from "swr";
import { useState } from "react";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════
//  Settings · Subscription (user-facing)
// ═══════════════════════════════════════════════════════════════════
//
//  Signed-in user's control surface for their own Gaia subscription.
//  No admin key — auth'd via the Supabase cookie the user already has.
//
//  Actions:
//   - View plan + next renewal + payment method
//   - Switch cycle (monthly ↔ annual) — pro-rated by Lemon
//   - Cancel (keeps access until period end)
//   - Resume (undo pending cancel before ends_at)
//   - Deep-link to Lemon's customer portal for payment-method updates
//     & invoice history (Lemon handles its own auth via magic link)
//
// ═══════════════════════════════════════════════════════════════════

interface SubscriptionRow {
  id: string;
  status: string | null;
  plan: string | null;
  billing_cycle: string | null;
  price_cents: number | null;
  currency: string | null;
  renews_at: string | null;
  ends_at: string | null;
  trial_ends_at: string | null;
  email: string | null;
  lemon_subscription_id: string | null;
  created_at: string | null;
}

interface LemonMeta {
  urls: {
    update_payment_method?: string;
    customer_portal?: string;
    customer_portal_update_subscription?: string;
  };
  status: string | null;
}

interface MeResponse {
  subscription: SubscriptionRow | null;
  lemon: LemonMeta | null;
}

async function fetcher(url: string): Promise<MeResponse> {
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 401) {
    const body = (await res.json().catch(() => ({}))) as { redirect?: string };
    window.location.href = body.redirect ?? "/sign-in";
    throw new Error("redirecting…");
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

function dollars(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

function humanDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function SettingsSubscriptionPage() {
  const { data, error, isLoading, mutate } = useSWR<MeResponse>(
    "/api/me/subscription",
    fetcher,
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function act(path: string, label: string, body?: Record<string, unknown>) {
    setBusy(label);
    setMessage(null);
    try {
      const res = await fetch(`/api/me/subscription${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage({ tone: "err", text: payload.error ?? `HTTP ${res.status}` });
      } else {
        setMessage({ tone: "ok", text: "Done. It can take a few seconds for Lemon to reflect the change." });
        await mutate();
      }
    } catch (e) {
      setMessage({ tone: "err", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(null);
    }
  }

  if (isLoading) {
    return <Shell><p className="text-hud-muted text-sm">Loading…</p></Shell>;
  }
  if (error) {
    return <Shell><p className="text-red-400 text-sm">Error: {String(error.message || error)}</p></Shell>;
  }

  const sub = data?.subscription ?? null;
  const lemonUrls = data?.lemon?.urls ?? {};

  if (!sub) {
    return (
      <Shell>
        <p className="text-hud-muted text-sm mb-4">
          You&apos;re on the free tier. Upgrade to Gaia for the weekly
          Sunday Convergence Report.
        </p>
        <Link
          href="/pricing#gaia"
          className="inline-block px-5 py-2 bg-amber-400 text-[#060509] font-mono text-xs font-bold tracking-wider rounded hover:bg-amber-300"
        >
          SEE GAIA →
        </Link>
      </Shell>
    );
  }

  const status = sub.status ?? "unknown";
  const isActive = status === "active" || status === "on_trial" || status === "past_due";
  const isPendingCancel = status === "cancelled" && sub.ends_at && Date.parse(sub.ends_at) > Date.now();
  const isPaused = status === "paused";
  const cycle = sub.billing_cycle;

  const upgradeAvailable = cycle === "monthly";

  return (
    <Shell>
      {message && (
        <div
          className={`mb-4 p-3 border rounded text-xs ${
            message.tone === "ok"
              ? "border-green-500/50 bg-green-500/10 text-green-300"
              : "border-red-500/50 bg-red-500/10 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Plan card */}
      <section className="border border-hud-border rounded-lg p-5 bg-hud-panel/40 mb-4">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-amber-300 uppercase mb-1">
              Γαῖα · Gaia
            </div>
            <div className="text-xl font-mono font-bold text-hud-text">
              {cycle === "annual" ? "$90/year" : cycle === "monthly" ? "$9/month" : dollars(sub.price_cents)}
            </div>
          </div>
          <StatusBadge status={status} pendingCancel={Boolean(isPendingCancel)} />
        </div>

        <dl className="grid grid-cols-2 gap-y-2 gap-x-6 text-[11px] mt-4">
          <KV label="Cycle" value={cycle ?? "—"} />
          <KV label="Email" value={sub.email ?? "—"} />
          <KV
            label={isPendingCancel ? "Ends" : "Renews"}
            value={humanDate(isPendingCancel ? sub.ends_at : sub.renews_at)}
          />
          {sub.trial_ends_at && (
            <KV label="Trial ends" value={humanDate(sub.trial_ends_at)} />
          )}
          <KV label="Started" value={humanDate(sub.created_at)} />
        </dl>
      </section>

      {/* Upgrade CTA — only when on monthly */}
      {upgradeAvailable && isActive && (
        <section className="border border-amber-400/40 bg-amber-400/5 rounded-lg p-5 mb-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="text-[10px] tracking-[0.3em] uppercase text-amber-300 mb-1">
                ◈ Save 17%
              </div>
              <h3 className="font-mono text-sm font-bold text-hud-text mb-1">
                Switch to annual — get 2 months free
              </h3>
              <p className="text-[11px] text-hud-muted leading-relaxed">
                $90 once a year instead of $108 billed monthly. Lemon Squeezy
                pro-rates the difference — you&apos;ll be billed the delta now
                and renew yearly after that.
              </p>
            </div>
            <button
              onClick={() => act("/change-plan", "upgrade", { cycle: "annual" })}
              disabled={busy !== null}
              className="shrink-0 px-4 py-2 bg-amber-400 text-[#060509] font-mono text-[11px] font-bold tracking-wider rounded hover:bg-amber-300 disabled:opacity-60 whitespace-nowrap"
            >
              {busy === "upgrade" ? "SWITCHING…" : "SWITCH →"}
            </button>
          </div>
        </section>
      )}

      {/* Pending cancel — let the user reverse it */}
      {isPendingCancel && (
        <section className="border border-orange-400/40 bg-orange-400/5 rounded-lg p-5 mb-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="font-mono text-sm font-bold text-hud-text mb-1">
                Cancellation scheduled
              </h3>
              <p className="text-[11px] text-hud-muted">
                You still have access until {humanDate(sub.ends_at)}. Changed
                your mind? Resume anytime before then — no new payment.
              </p>
            </div>
            <button
              onClick={() => act("/resume", "resume")}
              disabled={busy !== null}
              className="shrink-0 px-4 py-2 border border-green-500/50 text-green-300 font-mono text-[11px] font-bold tracking-wider rounded hover:bg-green-500/10 disabled:opacity-60"
            >
              {busy === "resume" ? "RESUMING…" : "RESUME"}
            </button>
          </div>
        </section>
      )}

      {/* Action row */}
      <section className="border border-hud-border rounded-lg p-5 bg-hud-panel/40 mb-4">
        <h3 className="text-[10px] tracking-[0.3em] uppercase text-hud-muted mb-3">
          Manage
        </h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/preferences"
            className="px-3 py-1.5 border border-hud-border text-hud-text font-mono text-[11px] rounded hover:border-hud-accent"
          >
            Briefing preferences
          </Link>

          {lemonUrls.update_payment_method && (
            <a
              href={lemonUrls.update_payment_method}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 border border-hud-border text-hud-text font-mono text-[11px] rounded hover:border-hud-accent"
            >
              Update payment method ↗
            </a>
          )}
          {lemonUrls.customer_portal && (
            <a
              href={lemonUrls.customer_portal}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 border border-hud-border text-hud-text font-mono text-[11px] rounded hover:border-hud-accent"
            >
              Billing history ↗
            </a>
          )}

          {isActive && !isPendingCancel && (
            <button
              onClick={() => {
                if (!confirm("Cancel Gaia? You'll keep access until the end of the current period.")) return;
                act("/cancel", "cancel");
              }}
              disabled={busy !== null}
              className="ml-auto px-3 py-1.5 border border-orange-500/50 text-orange-300 font-mono text-[11px] rounded hover:bg-orange-500/10 disabled:opacity-60"
            >
              {busy === "cancel" ? "CANCELLING…" : "Cancel subscription"}
            </button>
          )}
        </div>
      </section>

      {/* Paused info — only shows when actually paused */}
      {isPaused && (
        <p className="text-[11px] text-hud-muted">
          Your subscription is paused. Contact support or use the billing
          portal to unpause.
        </p>
      )}

      <p className="text-[10px] text-hud-muted mt-6">
        Billing handled by Lemon Squeezy (merchant of record). Receipts
        and tax invoices come from lemonsqueezy.com.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-hud-base text-hud-text">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <nav className="text-[10px] font-mono text-hud-muted mb-4">
          <Link href="/" className="hover:text-hud-accent">Home</Link>
          {" / "}
          <span className="text-hud-text">Subscription</span>
        </nav>
        <h1 className="font-mono text-xl font-bold text-hud-accent uppercase tracking-wider mb-6">
          Subscription
        </h1>
        {children}
      </div>
    </main>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-hud-muted uppercase tracking-wider text-[10px]">{label}</dt>
      <dd className="text-hud-text">{value}</dd>
    </>
  );
}

function StatusBadge({
  status,
  pendingCancel,
}: {
  status: string;
  pendingCancel: boolean;
}) {
  if (pendingCancel) {
    return (
      <span className="px-2 py-1 text-[10px] font-mono rounded border border-orange-500/50 bg-orange-500/10 text-orange-300 uppercase">
        ends soon
      </span>
    );
  }
  const color: Record<string, string> = {
    active: "border-green-500/50 bg-green-500/10 text-green-300",
    on_trial: "border-cyan-500/50 bg-cyan-500/10 text-cyan-300",
    past_due: "border-amber-500/50 bg-amber-500/10 text-amber-300",
    paused: "border-slate-500/50 bg-slate-500/10 text-slate-300",
    cancelled: "border-orange-500/50 bg-orange-500/10 text-orange-300",
    expired: "border-red-500/50 bg-red-500/10 text-red-300",
    unpaid: "border-red-500/50 bg-red-500/10 text-red-300",
  };
  return (
    <span className={`px-2 py-1 text-[10px] font-mono rounded border uppercase ${color[status] ?? "border-hud-border bg-hud-panel text-hud-muted"}`}>
      {status}
    </span>
  );
}
