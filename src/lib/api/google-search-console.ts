/**
 * Google Search Console API client — zero dependencies.
 *
 * Uses a GCP Service Account to fetch search performance data.
 * Auth flow: sign a JWT with the service account private key,
 * exchange it for an access token, then call the searchAnalytics API.
 *
 * Required env vars:
 *   GSC_SERVICE_ACCOUNT_EMAIL — e.g. gsc-reader@my-project.iam.gserviceaccount.com
 *   GSC_PRIVATE_KEY           — PEM private key (newlines escaped as \n in env)
 *   GSC_SITE_URL              — e.g. sc-domain:troiamedia.com
 */

import crypto from "crypto";

// ── Types ──────────────────────────────────────────────────
export interface GscRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscPerformance {
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
  topQueries: GscRow[];
  topPages: GscRow[];
}

// ── JWT / Auth ─────────────────────────────────────────────
function createJwt(email: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");

  const unsigned = `${encode(header)}.${encode(payload)}`;
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(unsigned);
  const signature = sign.sign(privateKey, "base64url");

  return `${unsigned}.${signature}`;
}

async function getAccessToken(
  email: string,
  privateKey: string
): Promise<string> {
  const jwt = createJwt(email, privateKey);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} — ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// ── GSC Query ──────────────────────────────────────────────
async function querySearchAnalytics(
  accessToken: string,
  siteUrl: string,
  options: {
    startDate: string; // YYYY-MM-DD
    endDate: string;
    dimensions: string[];
    rowLimit?: number;
  }
): Promise<GscRow[]> {
  const encodedSite = encodeURIComponent(siteUrl);
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate: options.startDate,
      endDate: options.endDate,
      dimensions: options.dimensions,
      rowLimit: options.rowLimit ?? 10,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GSC API error: ${res.status} — ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { rows?: GscRow[] };
  return data.rows ?? [];
}

// ── Public API ─────────────────────────────────────────────
/**
 * Fetch last 7 days of search performance for the configured site.
 * Returns null if env vars are missing (graceful degradation).
 */
export async function fetchGscPerformance(): Promise<GscPerformance | null> {
  const email = process.env.GSC_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GSC_PRIVATE_KEY;
  const siteUrl = process.env.GSC_SITE_URL;

  if (!email || !rawKey || !siteUrl) {
    console.warn("[GSC] Missing env vars — skipping");
    return null;
  }

  // Env vars often have literal \n — convert to real newlines
  const privateKey = rawKey.replace(/\\n/g, "\n");

  const accessToken = await getAccessToken(email, privateKey);

  // Date range: last 7 days (GSC data has ~2 day delay)
  const end = new Date();
  end.setDate(end.getDate() - 2); // GSC data delay
  const start = new Date(end);
  start.setDate(start.getDate() - 7);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const startDate = fmt(start);
  const endDate = fmt(end);

  // Parallel: top queries + top pages
  const [queryRows, pageRows] = await Promise.all([
    querySearchAnalytics(accessToken, siteUrl, {
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit: 10,
    }),
    querySearchAnalytics(accessToken, siteUrl, {
      startDate,
      endDate,
      dimensions: ["page"],
      rowLimit: 10,
    }),
  ]);

  // Aggregate totals from query rows
  const totalClicks = queryRows.reduce((s, r) => s + r.clicks, 0);
  const totalImpressions = queryRows.reduce((s, r) => s + r.impressions, 0);
  const avgCtr =
    totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const avgPosition =
    queryRows.length > 0
      ? queryRows.reduce((s, r) => s + r.position, 0) / queryRows.length
      : 0;

  return {
    totalClicks,
    totalImpressions,
    avgCtr,
    avgPosition,
    topQueries: queryRows,
    topPages: pageRows,
  };
}
