import { NextRequest, NextResponse } from "next/server";
import { cachedFetch, TTL } from "@/lib/cache/redis";

export const runtime = "edge";

/**
 * GET /api/widget — Embeddable news widget for external sites.
 *
 * Returns HTML/JSON for embedding WorldScope intel feed on other websites.
 * Generates backlinks to WorldScope.
 *
 * Query params:
 * - format: "html" | "json" (default: "json")
 * - category: filter by category (optional)
 * - limit: max events (default: 5, max: 10)
 * - theme: "dark" | "light" (default: "dark")
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format") || "json";
  const category = searchParams.get("category");
  const limit = Math.min(10, parseInt(searchParams.get("limit") || "5", 10));
  const theme = searchParams.get("theme") || "dark";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://worldscope.app";

  // Fetch cached intel data
  const events = await cachedFetch(
    `widget:${category || "all"}:${limit}`,
    async () => {
      try {
        const res = await fetch(`${siteUrl}/api/intel?limit=${limit}${category ? `&category=${category}` : ""}`, {
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.items || []).slice(0, limit).map((item: any) => ({
          title: item.title,
          source: item.source,
          severity: item.severity,
          category: item.category,
          publishedAt: item.publishedAt,
          url: item.url,
        }));
      } catch {
        return [];
      }
    },
    TTL.NEWS // 10 min cache
  );

  // JSON format
  if (format === "json") {
    return NextResponse.json(
      { events, attribution: { name: "WorldScope", url: siteUrl } },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=600",
        },
      }
    );
  }

  // HTML widget format
  const bgColor = theme === "dark" ? "#0a0f1a" : "#ffffff";
  const textColor = theme === "dark" ? "#e0e0e0" : "#1a1a1a";
  const mutedColor = theme === "dark" ? "#666" : "#999";
  const accentColor = "#00e5ff";
  const borderColor = theme === "dark" ? "#1a2035" : "#e0e0e0";

  const severityColors: Record<string, string> = {
    critical: "#ff4757",
    high: "#ffd000",
    medium: "#00e5ff",
    low: "#00ff88",
    info: "#8a5cf6",
  };

  const eventsHtml = (events as any[])
    .map(
      (e) => `
    <div style="padding:8px 0;border-bottom:1px solid ${borderColor}">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
        <span style="width:6px;height:6px;border-radius:50%;background:${severityColors[e.severity] || accentColor}"></span>
        <span style="font-size:9px;font-family:monospace;color:${severityColors[e.severity] || accentColor};text-transform:uppercase">${e.severity}</span>
        <span style="font-size:8px;color:${mutedColor}">${e.category}</span>
      </div>
      <a href="${e.url}" target="_blank" rel="noopener" style="font-size:11px;color:${textColor};text-decoration:none;line-height:1.3;display:block">${e.title.slice(0, 100)}</a>
      <span style="font-size:8px;color:${mutedColor}">${e.source}</span>
    </div>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:10px;background:${bgColor};font-family:-apple-system,sans-serif">
  <div style="border:1px solid ${borderColor};border-radius:8px;padding:12px;max-width:320px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <span style="font-family:monospace;font-size:10px;font-weight:bold;color:${accentColor};letter-spacing:2px">WORLDSCOPE</span>
      <span style="font-size:8px;color:${mutedColor}">LIVE</span>
    </div>
    ${eventsHtml}
    <div style="text-align:center;padding-top:8px">
      <a href="${siteUrl}" target="_blank" rel="noopener" style="font-size:8px;color:${accentColor};text-decoration:none;font-family:monospace">
        Powered by WorldScope ↗
      </a>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=600",
      "X-Frame-Options": "ALLOWALL",
    },
  });
}
