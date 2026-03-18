"use client";

import { useState, useCallback } from "react";
import { useFeedHealth, useFeedList } from "@/hooks/useFeedHealth";
import { FeedAdminPanel } from "@/components/feeds/FeedAdminPanel";
import { FeedCategoryChart } from "@/components/feeds/FeedCategoryChart";
import Link from "next/link";

export default function AdminPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [keyError, setKeyError] = useState(false);
  const [loading, setLoading] = useState(false);
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
        <div className="w-full max-w-sm">
          <div className="bg-hud-surface border border-hud-border rounded-lg p-6">
            <div className="text-center mb-6">
              <div className="text-3xl mb-2">🔐</div>
              <h1 className="font-mono text-lg font-bold text-hud-accent tracking-wider">ADMIN PANEL</h1>
              <p className="font-mono text-[9px] text-hud-muted mt-1">WorldScope Control Center</p>
            </div>

            <div className="space-y-3">
              <input
                type="password"
                placeholder="Enter admin key..."
                value={adminKey}
                onChange={(e) => { setAdminKey(e.target.value); setKeyError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="w-full bg-hud-panel border border-hud-border rounded-md px-4 py-2.5 font-mono text-[11px] text-hud-text placeholder:text-hud-muted focus:outline-none focus:border-hud-accent"
              />
              <button
                onClick={handleVerify}
                disabled={loading || !adminKey.trim()}
                className="w-full font-mono text-[10px] px-4 py-2.5 rounded-md border border-hud-accent/50 bg-hud-accent/10 text-hud-accent hover:bg-hud-accent/20 transition-colors disabled:opacity-40"
              >
                {loading ? "VERIFYING..." : "UNLOCK"}
              </button>
              {keyError && (
                <p className="font-mono text-[9px] text-severity-critical text-center">Invalid admin key</p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-hud-border text-center">
              <Link href="/" className="font-mono text-[9px] text-hud-muted hover:text-hud-accent">
                ← Back to Dashboard
              </Link>
            </div>

            <div className="mt-4 bg-hud-panel border border-hud-border rounded-md p-3">
              <p className="font-mono text-[8px] text-hud-muted leading-relaxed">
                <span className="text-hud-accent">ℹ</span> Admin key = ADMIN_SECRET or CRON_SECRET env variable.
                Set it in Vercel Dashboard → Settings → Environment Variables.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-hud-base text-hud-text">
      <header className="border-b border-hud-border bg-hud-surface">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-[9px] font-mono text-hud-muted mb-3">
            <Link href="/" className="text-hud-accent hover:underline">WORLDSCOPE</Link>
            <span>/</span>
            <span className="text-hud-text">ADMIN</span>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-mono text-xl font-bold text-hud-accent tracking-wide">🔐 ADMIN PANEL</h1>
              <p className="font-mono text-[10px] text-hud-muted mt-0.5">Feed management, system health, configuration</p>
            </div>
            <button
              onClick={() => setIsVerified(false)}
              className="font-mono text-[8px] px-3 py-1 rounded border border-severity-critical/30 text-severity-critical hover:bg-severity-critical/10 transition-colors"
            >
              LOCK
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatBox label="TOTAL FEEDS" value={health?.total ?? 0} color="text-hud-accent" />
          <StatBox label="ACTIVE" value={health?.active ?? 0} color="text-severity-low" />
          <StatBox label="UNHEALTHY" value={health?.unhealthy ?? 0} color="text-severity-high" />
          <StatBox label="OFFLINE" value={health?.deactivated ?? 0} color="text-severity-critical" />
          <StatBox label="API CLIENTS" value={48} color="text-hud-accent" />
        </div>

        {/* System Info */}
        <div className="bg-hud-surface border border-hud-border rounded-md p-4">
          <h2 className="font-mono text-[10px] font-bold text-hud-accent tracking-wider mb-3">◆ SYSTEM STATUS</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-[9px]">
            <div><span className="text-hud-muted">Platform:</span> <span className="text-hud-text">Vercel</span></div>
            <div><span className="text-hud-muted">Framework:</span> <span className="text-hud-text">Next.js 16.1.7</span></div>
            <div><span className="text-hud-muted">Database:</span> <span className="text-hud-text">Supabase PostgreSQL</span></div>
            <div><span className="text-hud-muted">Cache:</span> <span className="text-hud-text">Upstash Redis</span></div>
            <div><span className="text-hud-muted">RSS Feeds:</span> <span className="text-hud-text">505</span></div>
            <div><span className="text-hud-muted">Telegram:</span> <span className="text-hud-text">18 channels</span></div>
            <div><span className="text-hud-muted">Live TV:</span> <span className="text-hud-text">64 channels</span></div>
            <div><span className="text-hud-muted">Languages:</span> <span className="text-hud-text">10</span></div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="bg-hud-surface border border-hud-border rounded-md p-4">
          <h2 className="font-mono text-[10px] font-bold text-hud-accent tracking-wider mb-3">◆ QUICK ACTIONS</h2>
          <div className="flex flex-wrap gap-2">
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
          <div className="bg-hud-surface border border-hud-border rounded-md p-4">
            <h2 className="font-mono text-[10px] font-bold text-hud-accent tracking-wider mb-3">◆ FEED DISTRIBUTION</h2>
            <FeedCategoryChart byCategory={health.byCategory} />
          </div>
        )}

        {/* Feed Management */}
        {feedList?.feeds && (
          <div>
            <h2 className="font-mono text-[10px] font-bold text-hud-accent tracking-wider mb-3">◆ FEED MANAGEMENT</h2>
            <FeedAdminPanel feeds={feedList.feeds} onRefresh={() => mutate()} />
          </div>
        )}
      </main>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-hud-surface border border-hud-border rounded-md p-3 text-center">
      <div className={`font-mono text-[20px] font-bold ${color}`}>{value}</div>
      <div className="font-mono text-[7px] text-hud-muted uppercase mt-1">{label}</div>
    </div>
  );
}

function AdminLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a
      href={href}
      target={href.startsWith("/api/") ? "_blank" : undefined}
      rel={href.startsWith("/api/") ? "noopener noreferrer" : undefined}
      className="font-mono text-[8px] px-3 py-1.5 rounded border border-hud-border bg-hud-panel text-hud-muted hover:text-hud-accent hover:border-hud-accent/30 transition-colors flex items-center gap-1.5"
    >
      <span className="text-sm">{icon}</span>
      {label}
    </a>
  );
}
