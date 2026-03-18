/**
 * Tomorrow.io — Weather API powered by proprietary technology
 */
import type { IntelItem } from "@/types/intel";

export async function fetchTomorrowAlerts(): Promise<IntelItem[]> {
  const apiKey = process.env.TOMORROW_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://api.tomorrow.io/v4/events?location=42.3478,-71.0466&apikey=${apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data?.events || []).slice(0, 10).map((e: Record<string, unknown>, i: number): IntelItem => ({
      id: `tomorrow-${i}-${Date.now()}`,
      title: String(e.title || e.eventType || "Weather Event"),
      summary: String(e.description || ""),
      url: "https://www.tomorrow.io/",
      source: "Tomorrow.io",
      category: "natural",
      severity: String(e.severity || "").toLowerCase().includes("severe") ? "high" : "medium",
      publishedAt: String(e.startTime || new Date().toISOString()),
    }));
  } catch { return []; }
}
