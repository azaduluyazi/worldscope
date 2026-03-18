"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { Category } from "@/types/intel";

const CATEGORIES: Category[] = [
  "conflict", "finance", "cyber", "tech", "natural",
  "aviation", "energy", "diplomacy", "protest", "health",
];

interface Feed {
  id: string;
  name: string;
  url: string;
  category: string;
  language?: string;
  is_active: boolean;
  error_count: number;
}

interface FeedAdminPanelProps {
  feeds: Feed[];
  onRefresh: () => void;
}

export function FeedAdminPanel({ feeds, onRefresh }: FeedAdminPanelProps) {
  const t = useTranslations("admin");
  const [adminKey, setAdminKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [keyError, setKeyError] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Add feed form state
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState<string>("conflict");
  const [newLanguage, setNewLanguage] = useState("en");

  const showMessage = useCallback((type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const handleUnlock = useCallback(() => {
    // Simple client-side check — real protection is on API side via CRON_SECRET
    const key = adminKey.trim();
    if (key.length >= 4) {
      setUnlocked(true);
      setKeyError(false);
    } else {
      setKeyError(true);
    }
  }, [adminKey]);

  const apiCall = useCallback(async (url: string, options: RequestInit) => {
    setLoading(true);
    try {
      const res = await fetch(url, options);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddFeed = useCallback(async () => {
    if (!newName || !newUrl) return;
    try {
      await apiCall("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, url: newUrl, category: newCategory, language: newLanguage }),
      });
      showMessage("success", "Feed added");
      setShowAddForm(false);
      setNewName(""); setNewUrl(""); setNewCategory("conflict"); setNewLanguage("en");
      onRefresh();
    } catch (e) {
      showMessage("error", (e as Error).message);
    }
  }, [newName, newUrl, newCategory, newLanguage, apiCall, showMessage, onRefresh]);

  const handleToggle = useCallback(async (id: string, currentActive: boolean) => {
    try {
      await apiCall(`/api/feeds?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      onRefresh();
    } catch (e) {
      showMessage("error", (e as Error).message);
    }
  }, [apiCall, onRefresh, showMessage]);

  const handleResetErrors = useCallback(async (id: string) => {
    try {
      await apiCall(`/api/feeds?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset_errors: true }),
      });
      onRefresh();
    } catch (e) {
      showMessage("error", (e as Error).message);
    }
  }, [apiCall, onRefresh, showMessage]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await apiCall(`/api/feeds?id=${id}`, { method: "DELETE" });
      showMessage("success", "Feed deleted");
      onRefresh();
    } catch (e) {
      showMessage("error", (e as Error).message);
    }
  }, [apiCall, showMessage, onRefresh, t]);

  const handleBulkAction = useCallback(async (action: "activate" | "deactivate" | "delete") => {
    if (selected.size === 0) return;
    const ids = [...selected];

    if (action === "delete") {
      if (!confirm(t("confirmBulkDelete", { count: ids.length }))) return;
      try {
        await apiCall(`/api/feeds?ids=${ids.join(",")}`, { method: "DELETE" });
        showMessage("success", `${ids.length} feeds deleted`);
        setSelected(new Set());
        onRefresh();
      } catch (e) { showMessage("error", (e as Error).message); }
      return;
    }

    try {
      await Promise.all(ids.map((id) =>
        apiCall(`/api/feeds?id=${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: action === "activate" }),
        })
      ));
      showMessage("success", `${ids.length} feeds updated`);
      setSelected(new Set());
      onRefresh();
    } catch (e) { showMessage("error", (e as Error).message); }
  }, [selected, apiCall, showMessage, onRefresh, t]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selected.size === feeds.length) setSelected(new Set());
    else setSelected(new Set(feeds.map((f) => f.id)));
  }, [feeds, selected.size]);

  // Unlock gate
  if (!unlocked) {
    return (
      <div className="bg-hud-surface border border-hud-border rounded-md p-4">
        <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-3">
          ◆ {t("adminMode")}
        </div>
        <div className="flex gap-2">
          <input
            type="password"
            placeholder={t("enterKey")}
            value={adminKey}
            onChange={(e) => { setAdminKey(e.target.value); setKeyError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            className="flex-1 bg-hud-panel border border-hud-border rounded px-3 py-1.5 font-mono text-[10px] text-hud-text placeholder:text-hud-muted focus:outline-none focus:border-hud-accent"
          />
          <button
            onClick={handleUnlock}
            className="font-mono text-[9px] px-3 py-1.5 rounded border border-hud-accent/40 bg-hud-accent/10 text-hud-accent hover:bg-hud-accent/20 transition-colors"
          >
            {t("unlock")}
          </button>
        </div>
        {keyError && <p className="font-mono text-[8px] text-severity-critical mt-1">{t("invalidKey")}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Message toast */}
      {message && (
        <div className={`font-mono text-[9px] px-3 py-2 rounded border ${
          message.type === "success"
            ? "bg-severity-low/10 border-severity-low/30 text-severity-low"
            : "bg-severity-critical/10 border-severity-critical/30 text-severity-critical"
        }`}>
          {message.text}
        </div>
      )}

      {/* Admin toolbar */}
      <div className="bg-hud-surface border border-hud-accent/30 rounded-md p-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] font-bold text-hud-accent tracking-wider">◆ {t("adminMode")}</span>
            {loading && <span className="font-mono text-[8px] text-hud-accent animate-pulse">●</span>}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="font-mono text-[8px] px-2.5 py-1 rounded border border-severity-low/40 bg-severity-low/10 text-severity-low hover:bg-severity-low/20 transition-colors"
            >
              + {t("addFeed")}
            </button>

            {selected.size > 0 && (
              <>
                <span className="font-mono text-[8px] text-hud-muted">
                  {t("selected", { count: selected.size })}
                </span>
                <button onClick={() => handleBulkAction("activate")} className="font-mono text-[7px] px-2 py-0.5 rounded border border-severity-low/30 text-severity-low hover:bg-severity-low/10">
                  {t("activateSelected")}
                </button>
                <button onClick={() => handleBulkAction("deactivate")} className="font-mono text-[7px] px-2 py-0.5 rounded border border-severity-high/30 text-severity-high hover:bg-severity-high/10">
                  {t("deactivateSelected")}
                </button>
                <button onClick={() => handleBulkAction("delete")} className="font-mono text-[7px] px-2 py-0.5 rounded border border-severity-critical/30 text-severity-critical hover:bg-severity-critical/10">
                  {t("deleteSelected")}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Add feed form */}
        {showAddForm && (
          <div className="mt-3 pt-3 border-t border-hud-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <input
              placeholder={t("feedName")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-hud-panel border border-hud-border rounded px-2 py-1 font-mono text-[9px] text-hud-text placeholder:text-hud-muted focus:outline-none focus:border-hud-accent"
            />
            <input
              placeholder={t("feedUrl")}
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="bg-hud-panel border border-hud-border rounded px-2 py-1 font-mono text-[9px] text-hud-text placeholder:text-hud-muted focus:outline-none focus:border-hud-accent lg:col-span-2"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="bg-hud-panel border border-hud-border rounded px-2 py-1 font-mono text-[9px] text-hud-muted focus:border-hud-accent focus:outline-none"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
            </select>
            <div className="flex gap-1">
              <select
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                className="bg-hud-panel border border-hud-border rounded px-2 py-1 font-mono text-[9px] text-hud-muted focus:border-hud-accent focus:outline-none flex-1"
              >
                <option value="en">EN</option>
                <option value="tr">TR</option>
                <option value="multi">MULTI</option>
              </select>
              <button onClick={handleAddFeed} disabled={!newName || !newUrl} className="font-mono text-[8px] px-3 py-1 rounded bg-hud-accent/20 border border-hud-accent/40 text-hud-accent hover:bg-hud-accent/30 disabled:opacity-40 transition-colors">
                {t("save")}
              </button>
              <button onClick={() => setShowAddForm(false)} className="font-mono text-[8px] px-2 py-1 rounded border border-hud-border text-hud-muted hover:text-hud-text transition-colors">
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin feed table with actions */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-hud-border text-hud-muted uppercase">
              <th className="py-2 px-1 w-8">
                <input
                  type="checkbox"
                  checked={selected.size === feeds.length && feeds.length > 0}
                  onChange={toggleSelectAll}
                  className="accent-hud-accent"
                />
              </th>
              <th className="text-left py-2 px-2">Name</th>
              <th className="text-left py-2 px-2">Category</th>
              <th className="text-center py-2 px-2">Status</th>
              <th className="text-right py-2 px-2">Errors</th>
              <th className="text-right py-2 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {feeds.map((feed) => (
              <tr key={feed.id} className={`border-b border-hud-border/50 hover:bg-hud-panel/50 transition-colors ${selected.has(feed.id) ? "bg-hud-accent/5" : ""}`}>
                <td className="py-1.5 px-1">
                  <input
                    type="checkbox"
                    checked={selected.has(feed.id)}
                    onChange={() => toggleSelect(feed.id)}
                    className="accent-hud-accent"
                  />
                </td>
                <td className="py-1.5 px-2 text-hud-text max-w-[200px] truncate" title={feed.url}>
                  {feed.name}
                </td>
                <td className="py-1.5 px-2 text-hud-muted uppercase text-[9px]">{feed.category}</td>
                <td className="py-1.5 px-2 text-center">
                  <span className={`text-[8px] px-1.5 py-0.5 rounded ${feed.is_active ? "bg-severity-low/10 text-severity-low" : "bg-severity-critical/10 text-severity-critical"}`}>
                    {feed.is_active ? "ACTIVE" : "OFF"}
                  </span>
                </td>
                <td className="py-1.5 px-2 text-right">
                  <span className={feed.error_count >= 3 ? "text-severity-critical" : "text-hud-muted"}>
                    {feed.error_count}
                  </span>
                </td>
                <td className="py-1.5 px-2 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => handleToggle(feed.id, feed.is_active)} className="text-[7px] px-1.5 py-0.5 rounded border border-hud-border text-hud-muted hover:text-hud-accent hover:border-hud-accent/30 transition-colors" title={t("toggleActive")}>
                      {feed.is_active ? "⏸" : "▶"}
                    </button>
                    {feed.error_count > 0 && (
                      <button onClick={() => handleResetErrors(feed.id)} className="text-[7px] px-1.5 py-0.5 rounded border border-hud-border text-hud-muted hover:text-severity-low hover:border-severity-low/30 transition-colors" title={t("resetErrors")}>
                        ↻
                      </button>
                    )}
                    <button onClick={() => handleDelete(feed.id)} className="text-[7px] px-1.5 py-0.5 rounded border border-hud-border text-hud-muted hover:text-severity-critical hover:border-severity-critical/30 transition-colors" title={t("deleteFeed")}>
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
