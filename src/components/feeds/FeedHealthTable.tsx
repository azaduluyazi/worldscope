"use client";

import { useState, useMemo } from "react";
import { FeedStatusBadge } from "./FeedStatusBadge";

interface Feed {
  id: string;
  name: string;
  url: string;
  category: string;
  is_active: boolean;
  error_count: number;
  last_fetched_at: string | null;
  created_at: string;
}

interface Props {
  feeds: Feed[];
}

type SortField = "name" | "category" | "error_count" | "last_fetched_at";

export function FeedHealthTable({ feeds }: Props) {
  const [sortField, setSortField] = useState<SortField>("error_count");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const categories = useMemo(() => {
    const cats = new Set(feeds.map((f) => f.category));
    return ["all", ...Array.from(cats).sort()];
  }, [feeds]);

  const filteredFeeds = useMemo(() => {
    let result = [...feeds];
    if (filterCategory !== "all")
      result = result.filter((f) => f.category === filterCategory);
    if (filterStatus === "active")
      result = result.filter((f) => f.is_active);
    if (filterStatus === "inactive")
      result = result.filter((f) => !f.is_active);
    if (filterStatus === "degraded")
      result = result.filter((f) => f.error_count >= 3 && f.is_active);

    result.sort((a, b) => {
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [feeds, filterCategory, filterStatus, sortField, sortAsc]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-hud-base border border-hud-border text-hud-muted text-xs font-mono rounded px-3 py-1.5 focus:border-hud-accent focus:outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c.toUpperCase()}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-hud-base border border-hud-border text-hud-muted text-xs font-mono rounded px-3 py-1.5 focus:border-hud-accent focus:outline-none"
        >
          <option value="all">ALL STATUS</option>
          <option value="active">ACTIVE</option>
          <option value="inactive">OFFLINE</option>
          <option value="degraded">DEGRADED</option>
        </select>
        <span className="text-xs font-mono text-hud-muted self-center ml-auto">
          {filteredFeeds.length} / {feeds.length} feeds
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-hud-border text-hud-muted uppercase">
              <th
                className="text-left py-2 px-2 cursor-pointer hover:text-hud-accent transition-colors"
                onClick={() => toggleSort("name")}
              >
                Name {sortField === "name" ? (sortAsc ? "▲" : "▼") : ""}
              </th>
              <th
                className="text-left py-2 px-2 cursor-pointer hover:text-hud-accent transition-colors"
                onClick={() => toggleSort("category")}
              >
                Category{" "}
                {sortField === "category" ? (sortAsc ? "▲" : "▼") : ""}
              </th>
              <th className="text-center py-2 px-2">Status</th>
              <th
                className="text-right py-2 px-2 cursor-pointer hover:text-hud-accent transition-colors"
                onClick={() => toggleSort("error_count")}
              >
                Errors{" "}
                {sortField === "error_count" ? (sortAsc ? "▲" : "▼") : ""}
              </th>
              <th
                className="text-right py-2 px-2 cursor-pointer hover:text-hud-accent transition-colors"
                onClick={() => toggleSort("last_fetched_at")}
              >
                Last Fetch{" "}
                {sortField === "last_fetched_at"
                  ? sortAsc
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredFeeds.map((feed) => (
              <tr
                key={feed.id}
                className="border-b border-hud-border/50 hover:bg-hud-panel/50 transition-colors"
              >
                <td
                  className="py-2 px-2 text-hud-text max-w-[200px] truncate"
                  title={feed.url}
                >
                  {feed.name}
                </td>
                <td className="py-2 px-2 text-hud-muted uppercase">
                  {feed.category}
                </td>
                <td className="py-2 px-2 text-center">
                  <FeedStatusBadge
                    errorCount={feed.error_count}
                    isActive={feed.is_active}
                    lastFetched={feed.last_fetched_at}
                  />
                </td>
                <td className="py-2 px-2 text-right text-hud-muted">
                  <span className={feed.error_count >= 3 ? "text-red-400" : ""}>
                    {feed.error_count}
                  </span>
                </td>
                <td className="py-2 px-2 text-right text-hud-muted">
                  {feed.last_fetched_at
                    ? new Date(feed.last_fetched_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
