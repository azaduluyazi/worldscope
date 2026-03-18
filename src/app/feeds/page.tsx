"use client";

import { useFeedHealth, useFeedList } from "@/hooks/useFeedHealth";
import { FeedHealthTable } from "@/components/feeds/FeedHealthTable";
import { FeedCategoryChart } from "@/components/feeds/FeedCategoryChart";
import Link from "next/link";

export default function FeedsPage() {
  const { data: health, isLoading: healthLoading } = useFeedHealth();
  const { data: feedList, isLoading: listLoading } = useFeedList();

  return (
    <div className="min-h-screen bg-hud-base text-hud-text">
      {/* Header */}
      <header className="border-b border-hud-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-hud-accent hover:text-hud-accent/80 text-sm font-mono transition-colors"
            >
              ← DASHBOARD
            </Link>
            <h1 className="text-lg font-mono font-bold tracking-wider text-hud-accent">
              FEED HEALTH MONITOR
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-hud-muted">
              LAST UPDATE:{" "}
              {health?.timestamp
                ? new Date(health.timestamp).toLocaleTimeString()
                : "—"}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="TOTAL FEEDS"
            value={health?.total ?? 0}
            loading={healthLoading}
          />
          <StatCard
            label="ACTIVE"
            value={health?.active ?? 0}
            color="text-emerald-400"
            loading={healthLoading}
          />
          <StatCard
            label="UNHEALTHY"
            value={health?.unhealthy ?? 0}
            color="text-yellow-400"
            loading={healthLoading}
          />
          <StatCard
            label="OFFLINE"
            value={health?.deactivated ?? 0}
            color="text-red-400"
            loading={healthLoading}
          />
        </div>

        {/* Category Distribution */}
        {health?.byCategory && (
          <div className="bg-hud-surface/50 border border-hud-border rounded-lg p-4">
            <FeedCategoryChart byCategory={health.byCategory} />
          </div>
        )}

        {/* Feed Table */}
        <div className="bg-hud-surface/50 border border-hud-border rounded-lg p-4">
          <h3 className="text-xs font-mono text-hud-accent uppercase tracking-wider mb-4">
            All Feeds
          </h3>
          {listLoading ? (
            <div className="text-center py-8 text-hud-muted font-mono text-sm animate-pulse">
              LOADING FEED DATA...
            </div>
          ) : feedList?.feeds ? (
            <FeedHealthTable feeds={feedList.feeds} />
          ) : (
            <div className="text-center py-8 text-hud-muted font-mono text-sm">
              NO FEED DATA AVAILABLE
            </div>
          )}
        </div>
      </div>

      {/* Footer scan line */}
      <div className="px-6 py-4">
        <div className="h-px bg-gradient-to-r from-transparent via-hud-accent/30 to-transparent" />
        <p className="font-mono text-[9px] text-hud-muted/50 mt-2 tracking-widest text-center">
          WORLDSCOPE // FEED HEALTH MONITOR // REAL-TIME
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color = "text-hud-accent",
  loading,
}: {
  label: string;
  value: number;
  color?: string;
  loading: boolean;
}) {
  return (
    <div className="bg-hud-surface/50 border border-hud-border rounded-lg p-4">
      <div className="text-xs font-mono text-hud-muted uppercase tracking-wider">
        {label}
      </div>
      <div
        className={`text-2xl font-mono font-bold mt-1 ${
          loading ? "animate-pulse text-hud-muted/30" : color
        }`}
      >
        {loading ? "—" : value}
      </div>
    </div>
  );
}
