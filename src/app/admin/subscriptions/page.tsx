"use client";

import useSWR from "swr";
import { useState, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════════
//  Admin: Subscriptions (Gaia tier)
// ═══════════════════════════════════════════════════════════════════
//
//  Full control surface for paid subscribers:
//    - Summary: MRR, ARR, active, paused, cancelled-pending, churn30d
//    - Filterable table: status, email search
//    - Row actions: cancel, resume, pause, unpause, change cycle
//    - Detail drawer: local row + events timeline + live Lemon state
//      + invoice list + refund button
//
//  Auth: `worldscope_admin_key` localStorage (set via ?key=<key>) is
//  used for every /api/admin/subscriptions/* fetch as a Bearer token.
//
// ═══════════════════════════════════════════════════════════════════

interface SubscriptionRow {
  id: string;
  user_id: string | null;
  lemon_subscription_id: string | null;
  lemon_customer_id: string | null;
  lemon_variant_id: string | null;
  email: string | null;
  status: string | null;
  plan: string | null;
  billing_cycle: string | null;
  price_cents: number | null;
  currency: string | null;
  renews_at: string | null;
  ends_at: string | null;
  trial_ends_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface Summary {
  total: number;
  active: number;
  paused: number;
  cancelled_pending: number;
  churned_30d: number;
  new_30d: number;
  mrr_cents: number;
  arr_cents: number;
  by_cycle: Record<string, number>;
}

interface ListResponse {
  subscriptions: SubscriptionRow[];
  summary: Summary;
}

interface SubscriptionEvent {
  id: string;
  event_type: string;
  previous_status: string | null;
  new_status: string | null;
  metadata: unknown;
  created_at: string;
}

interface Invoice {
  id: string;
  attributes: {
    status: string;
    total: number;
    total_usd: number;
    currency: string;
    refunded: boolean;
    refunded_at: string | null;
    created_at: string;
  };
}

interface DetailResponse {
  subscription: SubscriptionRow;
  events: SubscriptionEvent[];
  lemon: unknown;
  invoices: Invoice[] | null;
  lemon_error: string | null;
}

function readAdminKey(): string | null {
  if (typeof window === "undefined") return null;
  const urlKey = new URLSearchParams(window.location.search).get("key");
  if (urlKey) {
    try { localStorage.setItem("worldscope_admin_key", urlKey); } catch { /* noop */ }
    return urlKey;
  }
  try { return localStorage.getItem("worldscope_admin_key"); } catch { return null; }
}

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const key = readAdminKey();
  if (!key) throw new Error("Admin key missing — add ?key=<key> to URL once");
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string })?.error ?? `HTTP ${res.status}`);
  }
  return body as T;
}

function dollars(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

function shortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    year: "2-digit", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatusPill({ status }: { status: string | null }) {
  const color: Record<string, string> = {
    active: "bg-green-500/20 text-green-400 border-green-500/40",
    on_trial: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
    past_due: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    paused: "bg-slate-500/20 text-slate-300 border-slate-500/40",
    cancelled: "bg-orange-500/20 text-orange-400 border-orange-500/40",
    expired: "bg-red-500/20 text-red-400 border-red-500/40",
    unpaid: "bg-red-500/20 text-red-400 border-red-500/40",
  };
  const s = status ?? "unknown";
  return (
    <span className={`px-2 py-0.5 text-[10px] font-mono rounded border ${color[s] ?? "bg-hud-panel text-hud-muted border-hud-border"}`}>
      {s}
    </span>
  );
}

export default function AdminSubscriptionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (statusFilter) p.set("status", statusFilter);
    if (search.trim()) p.set("q", search.trim());
    return p.toString();
  }, [statusFilter, search]);

  const { data, error, isLoading, mutate } = useSWR<ListResponse>(
    `/api/admin/subscriptions${qs ? `?${qs}` : ""}`,
    adminFetch,
    { refreshInterval: 30_000 },
  );

  const { data: detail, mutate: mutateDetail } = useSWR<DetailResponse>(
    selectedId ? `/api/admin/subscriptions/${selectedId}` : null,
    adminFetch,
  );

  async function runAction(
    id: string,
    action: "cancel" | "resume" | "pause" | "unpause",
  ) {
    setActionError(null);
    setActionBusy(`${action}:${id}`);
    try {
      await adminFetch(`/api/admin/subscriptions/${id}/${action}`, { method: "POST" });
      await mutate();
      if (selectedId === id) await mutateDetail();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionBusy(null);
    }
  }

  async function changePlan(id: string, cycle: "monthly" | "annual") {
    setActionError(null);
    setActionBusy(`change:${id}`);
    try {
      await adminFetch(`/api/admin/subscriptions/${id}/change-plan`, {
        method: "POST",
        body: JSON.stringify({ cycle }),
      });
      await mutate();
      if (selectedId === id) await mutateDetail();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionBusy(null);
    }
  }

  async function refundInvoice(id: string, invoiceId: string) {
    if (!confirm(`Refund invoice ${invoiceId}? This cannot be undone.`)) return;
    setActionError(null);
    setActionBusy(`refund:${invoiceId}`);
    try {
      await adminFetch(`/api/admin/subscriptions/${id}/refund`, {
        method: "POST",
        body: JSON.stringify({ invoice_id: invoiceId }),
      });
      await mutateDetail();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionBusy(null);
    }
  }

  if (error) {
    return (
      <main className="min-h-screen bg-hud-base text-hud-text p-8 font-mono">
        <h1 className="text-xl mb-4">Admin Subscriptions</h1>
        <p className="text-red-400">Error: {String(error.message || error)}</p>
        <p className="text-xs text-hud-muted mt-4">
          Add <code>?key=&lt;ADMIN_KEY&gt;</code> to the URL once. The value is
          cached in <code>localStorage.worldscope_admin_key</code>.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-hud-base text-hud-text p-4 md:p-8 font-mono">
      <header className="mb-6 flex items-baseline gap-4">
        <h1 className="text-xl font-bold tracking-wider uppercase text-hud-accent">
          Admin · Subscriptions
        </h1>
        <span className="text-[10px] text-hud-muted">
          Gaia tier control · Lemon Squeezy
        </span>
      </header>

      {/* Summary cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="MRR" value={dollars(data?.summary.mrr_cents)} sub={`ARR ${dollars(data?.summary.arr_cents)}`} />
        <SummaryCard label="Active" value={String(data?.summary.active ?? "…")} sub={`total ${data?.summary.total ?? "—"}`} />
        <SummaryCard label="Paused" value={String(data?.summary.paused ?? "…")} sub={`pending cancel ${data?.summary.cancelled_pending ?? 0}`} />
        <SummaryCard label="Churn 30d" value={String(data?.summary.churned_30d ?? "…")} sub={`new 30d ${data?.summary.new_30d ?? 0}`} accent="red" />
      </section>

      {/* Filters */}
      <section className="mb-4 flex flex-wrap gap-3 items-center">
        <label className="flex items-center gap-2 text-[11px]">
          <span className="text-hud-muted">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-hud-panel border border-hud-border rounded px-2 py-1 text-xs"
          >
            <option value="">All</option>
            {["active", "on_trial", "past_due", "paused", "cancelled", "expired", "unpaid"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-[11px]">
          <span className="text-hud-muted">Email</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="substring…"
            className="bg-hud-panel border border-hud-border rounded px-2 py-1 text-xs w-48"
          />
        </label>
        <button
          onClick={() => mutate()}
          disabled={isLoading}
          className="px-3 py-1 text-[11px] border border-hud-border rounded hover:border-hud-accent disabled:opacity-50"
        >
          Refresh
        </button>
      </section>

      {actionError && (
        <div className="mb-3 p-2 border border-red-500/50 bg-red-500/10 text-red-300 text-[11px] rounded">
          Action error: {actionError}
        </div>
      )}

      {/* Table */}
      <section className="border border-hud-border rounded overflow-hidden">
        <table className="w-full text-[11px]">
          <thead className="bg-hud-panel text-hud-muted uppercase tracking-wider">
            <tr>
              <th className="text-left px-3 py-2">Email</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Cycle</th>
              <th className="text-right px-3 py-2">Price</th>
              <th className="text-left px-3 py-2">Renews</th>
              <th className="text-left px-3 py-2">Created</th>
              <th className="text-right px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-hud-muted">Loading…</td></tr>
            )}
            {!isLoading && (data?.subscriptions.length ?? 0) === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-hud-muted">
                No subscriptions match the current filters.
              </td></tr>
            )}
            {data?.subscriptions.map((s) => {
              const canCancel = s.status === "active" || s.status === "on_trial" || s.status === "past_due";
              const canResume = s.status === "cancelled" && s.ends_at && Date.parse(s.ends_at) > Date.now();
              const canPause = s.status === "active";
              const canUnpause = s.status === "paused";
              return (
                <tr
                  key={s.id}
                  className={`border-t border-hud-border/40 hover:bg-hud-panel/40 ${selectedId === s.id ? "bg-hud-panel/70" : ""}`}
                >
                  <td className="px-3 py-2 text-hud-text">{s.email ?? "—"}</td>
                  <td className="px-3 py-2"><StatusPill status={s.status} /></td>
                  <td className="px-3 py-2 text-hud-muted">{s.billing_cycle ?? "—"}</td>
                  <td className="px-3 py-2 text-right">{dollars(s.price_cents)}</td>
                  <td className="px-3 py-2 text-hud-muted">{shortDate(s.renews_at)}</td>
                  <td className="px-3 py-2 text-hud-muted">{shortDate(s.created_at)}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-end flex-wrap">
                      <ActionBtn onClick={() => setSelectedId(s.id)} label="View" />
                      {canCancel && (
                        <ActionBtn
                          onClick={() => confirm(`Cancel subscription for ${s.email}?`) && runAction(s.id, "cancel")}
                          label={actionBusy === `cancel:${s.id}` ? "…" : "Cancel"}
                          disabled={actionBusy !== null}
                          tone="orange"
                        />
                      )}
                      {canResume && (
                        <ActionBtn
                          onClick={() => runAction(s.id, "resume")}
                          label={actionBusy === `resume:${s.id}` ? "…" : "Resume"}
                          disabled={actionBusy !== null}
                          tone="green"
                        />
                      )}
                      {canPause && (
                        <ActionBtn
                          onClick={() => runAction(s.id, "pause")}
                          label={actionBusy === `pause:${s.id}` ? "…" : "Pause"}
                          disabled={actionBusy !== null}
                        />
                      )}
                      {canUnpause && (
                        <ActionBtn
                          onClick={() => runAction(s.id, "unpause")}
                          label={actionBusy === `unpause:${s.id}` ? "…" : "Unpause"}
                          disabled={actionBusy !== null}
                          tone="green"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Detail drawer */}
      {selectedId && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setSelectedId(null)}
        >
          <aside
            className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-hud-base border-l border-hud-border overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-hud-panel border-b border-hud-border px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-hud-accent">
                Subscription · {detail?.subscription.email ?? "…"}
              </h2>
              <button
                onClick={() => setSelectedId(null)}
                className="text-hud-muted hover:text-hud-text text-lg"
              >
                ×
              </button>
            </div>
            {!detail ? (
              <div className="p-4 text-hud-muted text-xs">Loading…</div>
            ) : (
              <div className="p-4 space-y-5 text-[11px]">
                <KV label="Status" value={<StatusPill status={detail.subscription.status} />} />
                <KV label="Plan" value={detail.subscription.plan ?? "—"} />
                <KV label="Cycle" value={detail.subscription.billing_cycle ?? "—"} />
                <KV label="Price" value={dollars(detail.subscription.price_cents)} />
                <KV label="Renews" value={shortDate(detail.subscription.renews_at)} />
                <KV label="Ends" value={shortDate(detail.subscription.ends_at)} />
                <KV label="Trial ends" value={shortDate(detail.subscription.trial_ends_at)} />
                <KV label="Lemon sub" value={detail.subscription.lemon_subscription_id ?? "—"} />
                <KV label="Lemon customer" value={detail.subscription.lemon_customer_id ?? "—"} />
                <KV label="App user_id" value={detail.subscription.user_id ?? "—"} />

                {/* Plan change */}
                <div>
                  <div className="uppercase tracking-wider text-hud-muted text-[10px] mb-1">
                    Change Plan
                  </div>
                  <div className="flex gap-2">
                    <ActionBtn
                      onClick={() => changePlan(detail.subscription.id, "monthly")}
                      label={actionBusy === `change:${detail.subscription.id}` ? "…" : "→ Monthly"}
                      disabled={actionBusy !== null || detail.subscription.billing_cycle === "monthly"}
                    />
                    <ActionBtn
                      onClick={() => changePlan(detail.subscription.id, "annual")}
                      label={actionBusy === `change:${detail.subscription.id}` ? "…" : "→ Annual"}
                      disabled={actionBusy !== null || detail.subscription.billing_cycle === "annual"}
                    />
                  </div>
                </div>

                {/* Events timeline */}
                <div>
                  <div className="uppercase tracking-wider text-hud-muted text-[10px] mb-2">
                    Event Timeline
                  </div>
                  <div className="space-y-1 border-l-2 border-hud-border pl-3">
                    {detail.events.length === 0 && (
                      <div className="text-hud-muted">No events logged.</div>
                    )}
                    {detail.events.map((e) => (
                      <div key={e.id} className="text-[10px]">
                        <div className="text-hud-accent">{e.event_type}</div>
                        <div className="text-hud-muted">
                          {shortDate(e.created_at)}
                          {e.previous_status && e.new_status && e.previous_status !== e.new_status && (
                            <> · {e.previous_status} → {e.new_status}</>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invoices + refund */}
                <div>
                  <div className="uppercase tracking-wider text-hud-muted text-[10px] mb-2">
                    Invoices
                  </div>
                  {detail.lemon_error && (
                    <div className="text-red-400 text-[10px] mb-2">Lemon: {detail.lemon_error}</div>
                  )}
                  {(!detail.invoices || detail.invoices.length === 0) && !detail.lemon_error && (
                    <div className="text-hud-muted">No invoices.</div>
                  )}
                  {detail.invoices?.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between py-1 border-b border-hud-border/30">
                      <div>
                        <div>
                          {inv.attributes.currency} {(inv.attributes.total / 100).toFixed(2)}
                          {inv.attributes.refunded && (
                            <span className="ml-2 text-orange-400">refunded</span>
                          )}
                        </div>
                        <div className="text-hud-muted text-[10px]">
                          {shortDate(inv.attributes.created_at)} · {inv.attributes.status}
                        </div>
                      </div>
                      {!inv.attributes.refunded && inv.attributes.status === "paid" && (
                        <ActionBtn
                          onClick={() => refundInvoice(detail.subscription.id, inv.id)}
                          label={actionBusy === `refund:${inv.id}` ? "…" : "Refund"}
                          disabled={actionBusy !== null}
                          tone="orange"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: "red";
}) {
  return (
    <div className={`border border-hud-border rounded p-3 bg-hud-panel/40 ${accent === "red" ? "border-red-500/30" : ""}`}>
      <div className="text-[9px] tracking-wider uppercase text-hud-muted">{label}</div>
      <div className={`text-xl font-bold ${accent === "red" ? "text-red-400" : "text-hud-text"}`}>{value}</div>
      <div className="text-[10px] text-hud-muted mt-0.5">{sub}</div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-28 text-hud-muted text-[10px] uppercase tracking-wider pt-0.5">{label}</div>
      <div className="flex-1 text-hud-text">{value}</div>
    </div>
  );
}

function ActionBtn({
  onClick,
  label,
  disabled,
  tone,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  tone?: "orange" | "green";
}) {
  const toneClass =
    tone === "orange"
      ? "border-orange-500/50 text-orange-300 hover:bg-orange-500/10"
      : tone === "green"
        ? "border-green-500/50 text-green-300 hover:bg-green-500/10"
        : "border-hud-border text-hud-text hover:border-hud-accent";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2 py-0.5 text-[10px] border rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${toneClass}`}
    >
      {label}
    </button>
  );
}
