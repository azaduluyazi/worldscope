"use client";

import { useState, useCallback } from "react";
import type { IntelItem } from "@/types/intel";
import type { Severity, Category } from "@/types/intel";

const ALERT_RULES_KEY = "ws_alert_rules";

export interface AlertRule {
  id: string;
  category?: Category;
  country?: string;
  keyword?: string;
  minSeverity: "critical" | "high" | "medium";
  enabled: boolean;
  createdAt: string;
}

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

function loadRules(): AlertRule[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ALERT_RULES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistRules(rules: AlertRule[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ALERT_RULES_KEY, JSON.stringify(rules));
}

/**
 * Custom alert rules stored in localStorage.
 * Users define category/severity/keyword rules to get notified
 * when matching intel items appear.
 */
export function useAlertRules() {
  const [rules, setRules] = useState<AlertRule[]>(() => loadRules());

  const addRule = useCallback((rule: Omit<AlertRule, "id" | "createdAt">) => {
    setRules((prev) => {
      const newRule: AlertRule = {
        ...rule,
        id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
      };
      const next = [...prev, newRule];
      persistRules(next);
      return next;
    });
  }, []);

  const removeRule = useCallback((id: string) => {
    setRules((prev) => {
      const next = prev.filter((r) => r.id !== id);
      persistRules(next);
      return next;
    });
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRules((prev) => {
      const next = prev.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      );
      persistRules(next);
      return next;
    });
  }, []);

  const matchesRules = useCallback(
    (item: IntelItem): AlertRule | null => {
      for (const rule of rules) {
        if (!rule.enabled) continue;

        // Check severity threshold
        const itemRank = SEVERITY_RANK[item.severity] ?? 0;
        const minRank = SEVERITY_RANK[rule.minSeverity] ?? 0;
        if (itemRank < minRank) continue;

        // Check category match (if specified)
        if (rule.category && item.category !== rule.category) continue;

        // Check country match (if specified)
        if (rule.country && item.countryCode !== rule.country) continue;

        // Check keyword match (if specified)
        if (rule.keyword) {
          const kw = rule.keyword.toLowerCase();
          const inTitle = item.title.toLowerCase().includes(kw);
          const inSummary = item.summary?.toLowerCase().includes(kw);
          if (!inTitle && !inSummary) continue;
        }

        return rule;
      }
      return null;
    },
    [rules]
  );

  return { rules, addRule, removeRule, toggleRule, matchesRules };
}
