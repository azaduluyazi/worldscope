/**
 * Cyber threat intelligence feeds — all free, no API key required.
 * - Feodo Tracker: Malware Command & Control servers
 * - URLhaus: Malicious URL distribution
 * - OTX AlienVault: Open Threat Exchange pulses
 */

import type { IntelItem } from "@/types/intel";

/** Fetch active C2 botnet servers from Feodo Tracker (abuse.ch) */
export async function fetchFeodoTracker(): Promise<IntelItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch("https://feodotracker.abuse.ch/downloads/ipblocklist_recommended.json", {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.slice(0, 30).map((entry: Record<string, string>, i: number): IntelItem => ({
      id: `feodo-${entry.ip_address || i}-${Date.now()}`,
      title: `C2 Botnet Server Detected: ${entry.ip_address || "Unknown"} (${entry.malware || "Unknown"})`,
      summary: `Port: ${entry.port || "?"} | Status: ${entry.status || "?"} | First seen: ${entry.first_seen || "?"}`,
      url: "https://feodotracker.abuse.ch/",
      source: "Feodo Tracker",
      category: "cyber",
      severity: entry.status === "online" ? "high" : "medium",
      publishedAt: entry.last_online || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

/** Fetch recent malicious URLs from URLhaus (abuse.ch) */
export async function fetchURLhaus(): Promise<IntelItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch("https://urlhaus-api.abuse.ch/v1/urls/recent/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "limit=30",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data?.urls) return [];

    return data.urls.slice(0, 20).map((entry: Record<string, string>, i: number): IntelItem => ({
      id: `urlhaus-${entry.id || i}-${Date.now()}`,
      title: `Malicious URL: ${entry.threat || "malware"} distribution via ${entry.url_status || "active"} site`,
      summary: `Tags: ${entry.tags || "none"} | Reporter: ${entry.reporter || "anonymous"} | Host: ${entry.host || "?"}`,
      url: entry.urlhaus_reference || "https://urlhaus.abuse.ch/",
      source: "URLhaus",
      category: "cyber",
      severity: entry.url_status === "online" ? "high" : "low",
      publishedAt: entry.date_added || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

/** Fetch latest OTX AlienVault threat pulses */
export async function fetchOTXPulses(): Promise<IntelItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(
      "https://otx.alienvault.com/api/v1/pulses/subscribed?limit=20&modified_since=2026-03-01",
      {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      }
    );
    clearTimeout(timeout);

    // OTX may require auth for subscribed; fallback to activity feed
    if (!res.ok) {
      const fallback = await fetch(
        "https://otx.alienvault.com/api/v1/pulses/activity?limit=15",
        { signal: controller.signal, headers: { Accept: "application/json" } }
      );
      if (!fallback.ok) return [];
      const fbData = await fallback.json();
      return mapOTXPulses(fbData?.results || []);
    }

    const data = await res.json();
    return mapOTXPulses(data?.results || []);
  } catch {
    return [];
  }
}

function mapOTXPulses(pulses: Array<Record<string, unknown>>): IntelItem[] {
  return pulses.slice(0, 15).map((pulse, i): IntelItem => {
    const tags = Array.isArray(pulse.tags) ? (pulse.tags as string[]).join(", ") : "";
    const adversary = pulse.adversary ? String(pulse.adversary) : "";

    return {
      id: `otx-${pulse.id || i}-${Date.now()}`,
      title: String(pulse.name || "OTX Threat Pulse"),
      summary: `${adversary ? `Adversary: ${adversary} | ` : ""}Tags: ${tags || "none"} | IoCs: ${pulse.indicator_count || 0}`,
      url: `https://otx.alienvault.com/pulse/${pulse.id}`,
      source: "OTX AlienVault",
      category: "cyber",
      severity: Number(pulse.indicator_count || 0) > 50 ? "high" : "medium",
      publishedAt: String(pulse.created || new Date().toISOString()),
    };
  });
}

/** Fetch all cyber threat feeds */
export async function fetchAllCyberThreats(): Promise<IntelItem[]> {
  const [feodo, urlhaus, otx] = await Promise.allSettled([
    fetchFeodoTracker(),
    fetchURLhaus(),
    fetchOTXPulses(),
  ]);

  return [
    ...(feodo.status === "fulfilled" ? feodo.value : []),
    ...(urlhaus.status === "fulfilled" ? urlhaus.value : []),
    ...(otx.status === "fulfilled" ? otx.value : []),
  ];
}
