"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UnifiedSource {
  id: string;
  name: string;
  type: "api" | "rss";
  url: string;
  category: string;
  variants: string[];
  status: "active" | "disabled" | "no_key" | "error";
  enabled: boolean;
  tags: string[];
  provider: string;
  plan?: string;
  rateLimit?: string;
  envKey?: string;
  language?: string;
  region?: string;
  errorCount?: number;
}

interface SourcesData {
  sources: UnifiedSource[];
  summary: {
    total: number;
    api: number;
    rss: number;
    active: number;
    disabled: number;
    noKey: number;
    error: number;
    byCategory: Record<string, number>;
  };
}

type FilterTab = "all" | "api" | "rss" | "active" | "disabled" | string;

const STATUS_STYLES: Record<string, string> = {
  active: "bg-severity-low/15 text-severity-low border-severity-low/30",
  disabled: "bg-hud-muted/15 text-hud-muted border-hud-border",
  no_key: "bg-severity-high/15 text-severity-high border-severity-high/30",
  error: "bg-severity-critical/15 text-severity-critical border-severity-critical/30",
};

const STATUS_LABEL: Record<string, string> = {
  active: "LIVE",
  disabled: "OFF",
  no_key: "NO KEY",
  error: "ERROR",
};

const VARIANT_COLORS: Record<string, string> = {
  WorldScope: "text-hud-accent border-hud-accent/30 bg-hud-accent/10",
  FinScope: "text-severity-high border-severity-high/30 bg-severity-high/10",
  ConflictScope: "text-severity-critical border-severity-critical/30 bg-severity-critical/10",
  CyberScope: "text-[#8a5cf6] border-[#8a5cf6]/30 bg-[#8a5cf6]/10",
  TechScope: "text-[#8a5cf6] border-[#8a5cf6]/30 bg-[#8a5cf6]/10",
  WeatherScope: "text-[#4ecdc4] border-[#4ecdc4]/30 bg-[#4ecdc4]/10",
  EnergyScope: "text-[#f39c12] border-[#f39c12]/30 bg-[#f39c12]/10",
  CommodityScope: "text-[#ff9f43] border-[#ff9f43]/30 bg-[#ff9f43]/10",
  HealthScope: "text-[#e74c3c] border-[#e74c3c]/30 bg-[#e74c3c]/10",
  SportsScope: "text-[#22c55e] border-[#22c55e]/30 bg-[#22c55e]/10",
  GoodScope: "text-severity-low border-severity-low/30 bg-severity-low/10",
};

interface SourcesPanelProps {
  adminKey: string;
}

export function SourcesPanel({ adminKey }: SourcesPanelProps) {
  const { data, isLoading, mutate } = useSWR<SourcesData>("/api/admin/sources", fetcher, {
    refreshInterval: 60_000,
  });
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const categories = useMemo(() => {
    if (!data?.summary.byCategory) return [];
    return Object.keys(data.summary.byCategory).sort();
  }, [data?.summary.byCategory]);

  const filtered = useMemo(() => {
    if (!data?.sources) return [];
    let list = data.sources;

    if (activeTab === "api") list = list.filter((s) => s.type === "api");
    else if (activeTab === "rss") list = list.filter((s) => s.type === "rss");
    else if (activeTab === "active") list = list.filter((s) => s.enabled && s.status === "active");
    else if (activeTab === "disabled") list = list.filter((s) => !s.enabled || s.status === "disabled");
    else if (activeTab !== "all") list = list.filter((s) => s.category.toLowerCase() === activeTab);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.provider.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.tags.some((t) => t.includes(q))
      );
    }

    return list;
  }, [data?.sources, activeTab, search]);

  const toggleSource = useCallback(
    async (sourceId: string, enabled: boolean) => {
      setToggling((prev) => new Set(prev).add(sourceId));
      try {
        await fetch("/api/admin/sources/toggle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": adminKey,
          },
          body: JSON.stringify({ sourceId, enabled }),
        });
        await mutate();
      } catch {
        // ignore
      } finally {
        setToggling((prev) => {
          const next = new Set(prev);
          next.delete(sourceId);
          return next;
        });
      }
    },
    [adminKey, mutate]
  );

  const handleBulkAction = useCallback(
    async (enable: boolean) => {
      if (selected.size === 0) return;
      setBulkLoading(true);
      const promises = [...selected].map((id) =>
        fetch("/api/admin/sources/toggle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": adminKey,
          },
          body: JSON.stringify({ sourceId: id, enabled: enable }),
        })
      );
      await Promise.allSettled(promises);
      setSelected(new Set());
      await mutate();
      setBulkLoading(false);
    },
    [selected, adminKey, mutate]
  );

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((s) => s.id)));
    }
  }, [filtered, selected.size]);

  if (isLoading || !data) {
    return (
      <div className="bg-hud-surface border border-hud-border rounded-lg p-6">
        <span className="font-mono text-sm text-hud-accent animate-pulse">
          Loading Sources...
        </span>
      </div>
    );
  }

  const { summary } = data;

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
        <MiniStat label="TOTAL" value={summary.total} color="text-hud-accent" />
        <MiniStat label="API" value={summary.api} color="text-hud-accent" />
        <MiniStat label="RSS" value={summary.rss} color="text-hud-accent" />
        <MiniStat label="ACTIVE" value={summary.active} color="text-severity-low" />
        <MiniStat label="DISABLED" value={summary.disabled} color="text-hud-muted" />
        <MiniStat label="NO KEY" value={summary.noKey} color="text-severity-high" />
        <MiniStat label="ERRORS" value={summary.error} color="text-severity-critical" />
      </div>

      {/* Main Panel */}
      <div className="bg-hud-surface border border-hud-border rounded-lg p-6">
        {/* Search */}
        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Search sources by name, provider, category, tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-hud-panel border border-hud-border rounded-md px-4 py-2.5 font-mono text-sm text-hud-text placeholder:text-hud-muted focus:outline-none focus:border-hud-accent/50"
          />
          <span className="font-mono text-xs text-hud-muted whitespace-nowrap">
            {filtered.length} / {summary.total}
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: "all", label: `ALL (${summary.total})` },
            { key: "api", label: `API (${summary.api})` },
            { key: "rss", label: `RSS (${summary.rss})` },
            { key: "active", label: `ACTIVE (${summary.active})` },
            { key: "disabled", label: `DISABLED (${summary.disabled})` },
          ].map(({ key, label }) => (
            <TabButton key={key} active={activeTab === key} onClick={() => setActiveTab(key)}>
              {label}
            </TabButton>
          ))}
          <span className="w-px bg-hud-border mx-1 self-stretch" />
          {categories.map((cat) => (
            <TabButton key={cat} active={activeTab === cat} onClick={() => setActiveTab(cat)}>
              {cat.toUpperCase()} ({summary.byCategory[cat] || 0})
            </TabButton>
          ))}
        </div>

        {/* Bulk Actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-hud-panel border border-hud-accent/20 rounded-lg">
            <span className="font-mono text-sm text-hud-accent font-bold">{selected.size} selected</span>
            <button
              onClick={() => handleBulkAction(true)}
              disabled={bulkLoading}
              className="font-mono text-xs px-3 py-1.5 rounded border border-severity-low/40 text-severity-low hover:bg-severity-low/10 transition-colors disabled:opacity-40"
            >
              {bulkLoading ? "..." : "ENABLE ALL"}
            </button>
            <button
              onClick={() => handleBulkAction(false)}
              disabled={bulkLoading}
              className="font-mono text-xs px-3 py-1.5 rounded border border-severity-critical/40 text-severity-critical hover:bg-severity-critical/10 transition-colors disabled:opacity-40"
            >
              {bulkLoading ? "..." : "DISABLE ALL"}
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="font-mono text-xs px-3 py-1.5 rounded border border-hud-border text-hud-muted hover:text-hud-text transition-colors"
            >
              CLEAR
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto overflow-x-auto rounded-md border border-hud-border">
          <table className="w-full font-mono">
            <thead className="bg-hud-surface">
              <tr className="border-b border-hud-border text-hud-muted uppercase text-xs">
                <th className="text-left py-3 px-2 w-8">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={selectAll}
                    className="accent-hud-accent w-4 h-4"
                  />
                </th>
                <th className="text-left py-3 px-3">Status</th>
                <th className="text-left py-3 px-3">Source Name</th>
                <th className="text-left py-3 px-3">Type</th>
                <th className="text-left py-3 px-3">Category</th>
                <th className="text-left py-3 px-3">Variants</th>
                <th className="text-left py-3 px-3">Provider</th>
                <th className="text-left py-3 px-3">Tags</th>
                <th className="text-center py-3 px-3">On/Off</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((source) => (
                <tr
                  key={source.id}
                  className={`border-b border-hud-border/30 hover:bg-hud-panel/30 transition-colors ${
                    selected.has(source.id) ? "bg-hud-accent/5" : ""
                  } ${!source.enabled ? "opacity-50" : ""}`}
                >
                  <td className="py-2.5 px-2">
                    <input
                      type="checkbox"
                      checked={selected.has(source.id)}
                      onChange={() => toggleSelect(source.id)}
                      className="accent-hud-accent w-4 h-4"
                    />
                  </td>

                  <td className="py-2.5 px-3">
                    <span className={`text-xs px-2 py-1 rounded border ${STATUS_STYLES[source.status] || STATUS_STYLES.disabled}`}>
                      {STATUS_LABEL[source.status] || source.status.toUpperCase()}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 max-w-[220px]">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-hud-text hover:text-hud-accent transition-colors truncate block font-medium"
                      title={source.url}
                    >
                      {source.name}
                    </a>
                  </td>

                  <td className="py-2.5 px-3">
                    <span className={`text-xs px-2 py-1 rounded border ${
                      source.type === "api"
                        ? "bg-hud-accent/10 text-hud-accent border-hud-accent/30"
                        : "bg-severity-high/10 text-severity-high border-severity-high/30"
                    }`}>
                      {source.type.toUpperCase()}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-xs text-hud-muted uppercase">{source.category}</td>

                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      {source.variants.slice(0, 3).map((v) => (
                        <span
                          key={v}
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${VARIANT_COLORS[v] || "text-hud-muted border-hud-border"}`}
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-xs text-hud-muted truncate max-w-[140px]">
                    {source.provider}
                  </td>

                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {source.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-hud-panel text-hud-muted border border-hud-border/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => toggleSource(source.id, !source.enabled)}
                      disabled={toggling.has(source.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                        source.enabled
                          ? "bg-severity-low/30 border border-severity-low/50"
                          : "bg-hud-panel border border-hud-border"
                      } ${toggling.has(source.id) ? "opacity-40 cursor-wait" : ""}`}
                      title={source.enabled ? "Click to disable" : "Click to enable"}
                    >
                      <span
                        className={`inline-block h-3 w-3 rounded-full transition-transform ${
                          source.enabled
                            ? "translate-x-4.5 bg-severity-low"
                            : "translate-x-1 bg-hud-muted"
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <span className="font-mono text-sm text-hud-muted">No sources match your filter.</span>
          </div>
        )}

        <p className="font-mono text-xs text-hud-muted mt-3">
          Toggle switches disable sources from the intel feed in real-time via Redis. Disabled sources will not be fetched by /api/intel.
        </p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-hud-surface border border-hud-border rounded-lg p-3 text-center">
      <div className={`font-mono text-2xl font-bold ${color}`}>{value}</div>
      <div className="font-mono text-[10px] text-hud-muted uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`font-mono text-xs px-3 py-1.5 rounded border transition-all ${
        active
          ? "bg-hud-accent/15 border-hud-accent/40 text-hud-accent"
          : "border-hud-border text-hud-muted hover:text-hud-text"
      }`}
    >
      {children}
    </button>
  );
}
