"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useFeedHealth, useFeedList } from "@/hooks/useFeedHealth";
import { FeedAdminPanel } from "@/components/feeds/FeedAdminPanel";
import { FeedCategoryChart } from "@/components/feeds/FeedCategoryChart";
import { SourcesPanel } from "@/components/admin/SourcesPanel";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { SignalMixPanel } from "@/components/admin/SignalMixPanel";
import type { ApiRegistryEntry } from "@/config/api-registry";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [keyError, setKeyError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<"overview" | "signal-mix" | "sources" | "feeds" | "registry" | "users">("overview");
  const { data: health } = useFeedHealth();
  const { data: feedList, mutate } = useFeedList(undefined, false);

  const handleVerify = useCallback(async () => {
    if (!adminKey.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: adminKey.trim() }),
      });
      const data = await res.json();
      if (data.verified) {
        setIsVerified(true);
        setKeyError(false);
      } else {
        setKeyError(true);
      }
    } catch {
      setKeyError(true);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  // Login gate
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-hud-base text-hud-text flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-hud-surface border border-hud-border rounded-lg p-8">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🔐</div>
              <h1 className="font-mono text-2xl font-bold text-hud-accent tracking-wider">ADMIN PANEL</h1>
              <p className="font-mono text-sm text-hud-muted mt-2">WorldScope Control Center</p>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                placeholder="Enter admin key..."
                value={adminKey}
                onChange={(e) => { setAdminKey(e.target.value); setKeyError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="w-full bg-hud-panel border border-hud-border rounded-md px-4 py-3 font-mono text-sm text-hud-text placeholder:text-hud-muted focus:outline-none focus:border-hud-accent"
              />
              <button
                onClick={handleVerify}
                disabled={loading || !adminKey.trim()}
                className="w-full font-mono text-sm px-4 py-3 rounded-md border border-hud-accent/50 bg-hud-accent/10 text-hud-accent hover:bg-hud-accent/20 transition-colors disabled:opacity-40"
              >
                {loading ? "VERIFYING..." : "UNLOCK"}
              </button>
              {keyError && (
                <p className="font-mono text-sm text-severity-critical text-center">Invalid admin key</p>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-hud-border text-center">
              <Link href="/" className="font-mono text-sm text-hud-muted hover:text-hud-accent">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-hud-base text-hud-text overflow-y-auto">
      {/* Header */}
      <header className="border-b border-hud-border bg-hud-surface">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <nav className="flex items-center gap-2 text-sm font-mono text-hud-muted mb-3">
            <Link href="/" className="text-hud-accent hover:underline">WORLDSCOPE</Link>
            <span>/</span>
            <span className="text-hud-text">ADMIN</span>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-mono text-2xl font-bold text-hud-accent tracking-wide">🔐 ADMIN PANEL</h1>
              <p className="font-mono text-sm text-hud-muted mt-1">Feed management, system health, sources configuration</p>
            </div>
            <button
              onClick={() => setIsVerified(false)}
              className="font-mono text-xs px-4 py-2 rounded border border-severity-critical/30 text-severity-critical hover:bg-severity-critical/10 transition-colors"
            >
              LOCK
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-hud-border bg-hud-surface/50">
        <div className="max-w-7xl mx-auto px-6 flex gap-0">
          {([
            { key: "overview", label: "📊 Overview", icon: "" },
            { key: "signal-mix", label: "🧭 Signal Mix", icon: "" },
            { key: "sources", label: "📡 Sources", icon: "" },
            { key: "feeds", label: "📰 Feeds", icon: "" },
            { key: "registry", label: "🔗 API Registry", icon: "" },
            { key: "users", label: "👥 Users", icon: "" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`font-mono text-sm px-5 py-3 border-b-2 transition-colors ${
                activeSection === key
                  ? "border-hud-accent text-hud-accent"
                  : "border-transparent text-hud-muted hover:text-hud-text"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Overview Section */}
        {activeSection === "overview" && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatBox label="TOTAL FEEDS" value={health?.total ?? 0} color="text-hud-accent" />
              <StatBox label="ACTIVE" value={health?.active ?? 0} color="text-severity-low" />
              <StatBox label="UNHEALTHY" value={health?.unhealthy ?? 0} color="text-severity-high" />
              <StatBox label="OFFLINE" value={health?.deactivated ?? 0} color="text-severity-critical" />
              <StatBox label="API CLIENTS" value={48} color="text-hud-accent" />
            </div>

            {/* System Info */}
            <div className="bg-hud-surface border border-hud-border rounded-lg p-6">
              <h2 className="font-mono text-base font-bold text-hud-accent tracking-wider mb-4">SYSTEM STATUS</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-sm">
                <div><span className="text-hud-muted">Platform:</span> <span className="text-hud-text">Vercel</span></div>
                <div><span className="text-hud-muted">Framework:</span> <span className="text-hud-text">Next.js 16.1.7</span></div>
                <div><span className="text-hud-muted">Database:</span> <span className="text-hud-text">Supabase PostgreSQL</span></div>
                <div><span className="text-hud-muted">Cache:</span> <span className="text-hud-text">Upstash Redis</span></div>
                <div><span className="text-hud-muted">RSS Feeds:</span> <span className="text-hud-text">{health?.total ?? 505}</span></div>
                <div><span className="text-hud-muted">Telegram:</span> <span className="text-hud-text">18 channels</span></div>
                <div><span className="text-hud-muted">Live TV:</span> <span className="text-hud-text">64 channels</span></div>
                <div><span className="text-hud-muted">Languages:</span> <span className="text-hud-text">10</span></div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-hud-surface border border-hud-border rounded-lg p-6">
              <h2 className="font-mono text-base font-bold text-hud-accent tracking-wider mb-4">QUICK ACTIONS</h2>
              <div className="flex flex-wrap gap-3">
                <AdminLink href="/feeds" icon="📡" label="Feed Health Monitor" />
                <AdminLink href="/analytics" icon="📊" label="Analytics Dashboard" />
                <AdminLink href="/api-docs" icon="📖" label="API Documentation" />
                <AdminLink href="/api/health" icon="💚" label="Health Check API" />
                <AdminLink href="/api/feeds/health" icon="🔍" label="Feed Health API" />
                <AdminLink href="/api/intel?limit=5" icon="📰" label="Intel API (test)" />
                <AdminLink href="/api/flights" icon="✈️" label="Flights API" />
                <AdminLink href="/api/vessels" icon="🚢" label="Vessels API" />
                <AdminLink href="/api/predictions" icon="🔮" label="Predictions API" />
                <AdminLink href="/api/cyber-threats" icon="🛡️" label="Cyber Threats API" />
              </div>
            </div>

            {/* Category Distribution */}
            {health?.byCategory && (
              <div className="bg-hud-surface border border-hud-border rounded-lg p-6">
                <h2 className="font-mono text-base font-bold text-hud-accent tracking-wider mb-4">FEED DISTRIBUTION</h2>
                <FeedCategoryChart byCategory={health.byCategory} />
              </div>
            )}
          </>
        )}

        {/* Signal Mix Section */}
        {activeSection === "signal-mix" && (
          <SignalMixPanel adminKey={adminKey} />
        )}

        {/* Sources Section */}
        {activeSection === "sources" && (
          <SourcesPanel adminKey={adminKey} />
        )}

        {/* Feeds Section */}
        {activeSection === "feeds" && feedList?.feeds && (
          <FeedAdminPanel feeds={feedList.feeds} onRefresh={() => mutate()} />
        )}

        {/* API Registry Section */}
        {activeSection === "registry" && (
          <ApiRegistryTable />
        )}

        {/* Users Section */}
        {activeSection === "users" && <UsersPanel adminKey={adminKey} />}
      </main>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-hud-surface border border-hud-border rounded-lg p-4 text-center">
      <div className={`font-mono text-3xl font-bold ${color}`}>{value}</div>
      <div className="font-mono text-xs text-hud-muted uppercase mt-2 tracking-wider">{label}</div>
    </div>
  );
}

function AdminLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a
      href={href}
      target={href.startsWith("/api/") ? "_blank" : undefined}
      rel={href.startsWith("/api/") ? "noopener noreferrer" : undefined}
      className="font-mono text-xs px-4 py-2 rounded-md border border-hud-border bg-hud-panel text-hud-muted hover:text-hud-accent hover:border-hud-accent/30 transition-colors flex items-center gap-2"
    >
      <span className="text-base">{icon}</span>
      {label}
    </a>
  );
}

function ApiRegistryTable() {
  const { data, isLoading } = useSWR<{ apis: ApiRegistryEntry[]; summary: { total: number; active: number; noKey: number; open: number; keyed: number } }>(
    "/api/admin/apis",
    fetcher
  );
  const [filter, setFilter] = useState<string>("all");

  if (isLoading || !data) {
    return (
      <div className="bg-hud-surface border border-hud-border rounded-lg p-6">
        <span className="font-mono text-sm text-hud-accent animate-pulse">Loading API Registry...</span>
      </div>
    );
  }

  const { apis, summary } = data;
  const categories = [...new Set(apis.map((a) => a.category))].sort();
  const filtered = filter === "all" ? apis : filter === "no_key" ? apis.filter((a) => a.status === "no_key") : apis.filter((a) => a.category === filter);

  const planColors: Record<string, string> = {
    open: "text-severity-low",
    free: "text-hud-accent",
    freemium: "text-severity-high",
    paid: "text-severity-critical",
  };

  const statusColors: Record<string, string> = {
    active: "bg-severity-low/15 text-severity-low border-severity-low/30",
    no_key: "bg-severity-high/15 text-severity-high border-severity-high/30",
    expired: "bg-severity-critical/15 text-severity-critical border-severity-critical/30",
  };

  return (
    <div className="bg-hud-surface border border-hud-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-base font-bold text-hud-accent tracking-wider">
          API REGISTRY — {summary.total} sources
        </h2>
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-severity-low">● {summary.active} active</span>
          <span className="text-severity-high">● {summary.noKey} no key</span>
          <span className="text-hud-muted">● {summary.open} open / {summary.keyed} keyed</span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setFilter("all")} className={`font-mono text-xs px-3 py-1 rounded border transition-all ${filter === "all" ? "bg-hud-accent/15 border-hud-accent/40 text-hud-accent" : "border-hud-border text-hud-muted hover:text-hud-text"}`}>ALL</button>
        <button onClick={() => setFilter("no_key")} className={`font-mono text-xs px-3 py-1 rounded border transition-all ${filter === "no_key" ? "bg-severity-high/15 border-severity-high/40 text-severity-high" : "border-hud-border text-hud-muted hover:text-hud-text"}`}>NO KEY</button>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)} className={`font-mono text-xs px-3 py-1 rounded border transition-all ${filter === cat ? "bg-hud-accent/15 border-hud-accent/40 text-hud-accent" : "border-hud-border text-hud-muted hover:text-hud-text"}`}>{cat.toUpperCase()}</button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-hud-border text-hud-muted uppercase text-xs">
              <th className="text-left py-3 px-3">Status</th>
              <th className="text-left py-3 px-3">API Name</th>
              <th className="text-left py-3 px-3">Provider</th>
              <th className="text-left py-3 px-3">Category</th>
              <th className="text-left py-3 px-3">Plan</th>
              <th className="text-left py-3 px-3">Rate Limit</th>
              <th className="text-left py-3 px-3">Env Key</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((api) => (
              <tr key={api.name} className="border-b border-hud-border/30 hover:bg-hud-panel/30 transition-colors">
                <td className="py-2.5 px-3">
                  <span className={`text-xs px-2 py-1 rounded border ${statusColors[api.status]}`}>
                    {api.status === "active" ? "✓ LIVE" : api.status === "no_key" ? "⚠ NO KEY" : "✕ EXPIRED"}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-hud-text">
                  <a href={api.url} target="_blank" rel="noopener noreferrer" className="hover:text-hud-accent transition-colors">
                    {api.name}
                  </a>
                  {api.notes && <div className="text-xs text-hud-muted mt-0.5 truncate max-w-xs">{api.notes}</div>}
                </td>
                <td className="py-2.5 px-3 text-hud-muted text-xs">{api.provider}</td>
                <td className="py-2.5 px-3 text-hud-muted text-xs">{api.category}</td>
                <td className={`py-2.5 px-3 text-xs ${planColors[api.plan] || "text-hud-muted"}`}>{api.plan.toUpperCase()}</td>
                <td className="py-2.5 px-3 text-hud-muted text-xs">{api.rateLimit}</td>
                <td className="py-2.5 px-3">
                  {api.envKey === "-" ? (
                    <span className="text-hud-muted/40 text-xs">—</span>
                  ) : (
                    <code className="text-xs text-hud-accent/70 bg-hud-panel px-1.5 py-0.5 rounded">{api.envKey}</code>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
