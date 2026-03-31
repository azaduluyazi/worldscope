"use client";

import { useState, useCallback } from "react";
import { useAlertRules, type AlertRule } from "@/hooks/useAlertRules";
import type { Category } from "@/types/intel";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "conflict", label: "CONFLICT" },
  { value: "finance", label: "FINANCE" },
  { value: "cyber", label: "CYBER" },
  { value: "tech", label: "TECH" },
  { value: "natural", label: "NATURAL" },
  { value: "aviation", label: "AVIATION" },
  { value: "energy", label: "ENERGY" },
  { value: "diplomacy", label: "DIPLOMACY" },
  { value: "protest", label: "PROTEST" },
  { value: "health", label: "HEALTH" },
  { value: "sports", label: "SPORTS" },
];

const SEVERITY_OPTIONS: { value: AlertRule["minSeverity"]; label: string; color: string }[] = [
  { value: "critical", label: "CRITICAL", color: "#ff4757" },
  { value: "high", label: "HIGH", color: "#ffd000" },
  { value: "medium", label: "MEDIUM", color: "#00e5ff" },
];

export function AlertRulesPanel() {
  const { rules, addRule, removeRule, toggleRule } = useAlertRules();

  const [category, setCategory] = useState<Category | "">("");
  const [minSeverity, setMinSeverity] = useState<AlertRule["minSeverity"]>("high");
  const [keyword, setKeyword] = useState("");

  const handleAdd = useCallback(() => {
    addRule({
      category: category || undefined,
      minSeverity,
      keyword: keyword.trim() || undefined,
      enabled: true,
    });
    setCategory("");
    setKeyword("");
    setMinSeverity("high");
  }, [addRule, category, minSeverity, keyword]);

  return (
    <div className="flex flex-col gap-3 p-3 bg-hud-surface border border-hud-border rounded-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] text-hud-accent tracking-wider uppercase">
          ◆ CUSTOM ALERT RULES
        </span>
        <span className="font-mono text-[7px] text-hud-muted">
          {rules.length} rule{rules.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Add Rule Form */}
      <div className="flex flex-col gap-1.5 bg-hud-base/50 border border-hud-border rounded p-2">
        {/* Category */}
        <div className="flex items-center gap-2">
          <label className="font-mono text-[7px] text-hud-muted w-14 shrink-0">CATEGORY</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | "")}
            className="flex-1 bg-hud-base border border-hud-border rounded px-1.5 py-0.5 font-mono text-[8px] text-hud-text focus:border-hud-accent focus:outline-none"
          >
            <option value="">ANY</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Severity */}
        <div className="flex items-center gap-2">
          <label className="font-mono text-[7px] text-hud-muted w-14 shrink-0">MIN SEV</label>
          <select
            value={minSeverity}
            onChange={(e) => setMinSeverity(e.target.value as AlertRule["minSeverity"])}
            className="flex-1 bg-hud-base border border-hud-border rounded px-1.5 py-0.5 font-mono text-[8px] text-hud-text focus:border-hud-accent focus:outline-none"
          >
            {SEVERITY_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Keyword */}
        <div className="flex items-center gap-2">
          <label className="font-mono text-[7px] text-hud-muted w-14 shrink-0">KEYWORD</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="optional..."
            className="flex-1 bg-hud-base border border-hud-border rounded px-1.5 py-0.5 font-mono text-[8px] text-hud-text placeholder:text-hud-muted/50 focus:border-hud-accent focus:outline-none"
          />
        </div>

        {/* Add Button */}
        <button
          type="button"
          onClick={handleAdd}
          className="mt-1 w-full py-1 bg-hud-accent/20 border border-hud-accent/40 rounded font-mono text-[8px] text-hud-accent hover:bg-hud-accent/30 transition-colors cursor-pointer"
        >
          + ADD RULE
        </button>
      </div>

      {/* Rules List */}
      {rules.length > 0 && (
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded border transition-opacity ${
                rule.enabled
                  ? "bg-hud-base/50 border-hud-border"
                  : "bg-hud-base/20 border-hud-border/50 opacity-50"
              }`}
            >
              {/* Toggle */}
              <button
                type="button"
                onClick={() => toggleRule(rule.id)}
                title={rule.enabled ? "Disable rule" : "Enable rule"}
                className={`text-[8px] cursor-pointer transition-colors ${
                  rule.enabled ? "text-[#00ff88]" : "text-hud-muted"
                }`}
              >
                {rule.enabled ? "●" : "○"}
              </button>

              {/* Rule description */}
              <span className="flex-1 font-mono text-[7px] text-hud-text truncate">
                {rule.category?.toUpperCase() || "ANY"}{" "}
                <span className="text-hud-muted">≥</span>{" "}
                <span
                  style={{
                    color: SEVERITY_OPTIONS.find((s) => s.value === rule.minSeverity)?.color,
                  }}
                >
                  {rule.minSeverity.toUpperCase()}
                </span>
                {rule.keyword && (
                  <span className="text-hud-muted">
                    {" "}
                    &quot;{rule.keyword}&quot;
                  </span>
                )}
              </span>

              {/* Delete */}
              <button
                type="button"
                onClick={() => removeRule(rule.id)}
                title="Delete rule"
                className="text-[8px] text-hud-muted hover:text-[#ff4757] cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {rules.length === 0 && (
        <p className="font-mono text-[7px] text-hud-muted/60 text-center py-2">
          No rules yet. Add a rule to get custom alerts.
        </p>
      )}
    </div>
  );
}
