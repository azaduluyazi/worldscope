"use client";

import useSWR from "swr";
import type { ConfidenceBucket } from "@/lib/convergence/telemetry";
import type { CalibrationRecord } from "@/lib/convergence/calibration";

// ═══════════════════════════════════════════════════════════════════
//  Convergence Calibration Dashboard (Admin)
// ═══════════════════════════════════════════════════════════════════
//
//  Shows the current state of the Bayesian prior calibration loop.
//  This is the moat — every click the users make feeds back into
//  these numbers, which feed back into the scorer.
//
//  Auth: local storage key `worldscope_admin_key` OR ?key= query param.
//  The API route validates against process.env.ADMIN_KEY.
//
//  Implementation notes:
//    - useAdminKey() is a lazy initializer — reads localStorage and
//      the URL synchronously on first render (no useEffect setState).
//    - Data fetching uses SWR so there's no manual useEffect either.
//      React 19's stricter effect rules flag setState-in-effect.
//
// ═══════════════════════════════════════════════════════════════════

interface CalibrationData {
  currentPrior: number;
  buckets: ConfidenceBucket[];
  anomalies: Array<{
    lowBucket: ConfidenceBucket;
    highBucket: ConfidenceBucket;
    gap: number;
  }>;
  history: CalibrationRecord[];
  timestamp: string;
}

/**
 * Read the admin key from the URL or localStorage synchronously.
 * Also persists a fresh ?key= query param into localStorage.
 * No useState / useEffect involved — safe for React 19 strict effect rules.
 */
function readAdminKey(): string | null {
  if (typeof window === "undefined") return null;
  const urlKey = new URLSearchParams(window.location.search).get("key");
  if (urlKey) {
    try {
      localStorage.setItem("worldscope_admin_key", urlKey);
    } catch {
      /* ignore quota / private mode errors */
    }
    return urlKey;
  }
  try {
    return localStorage.getItem("worldscope_admin_key");
  } catch {
    return null;
  }
}

interface CalibrationResponse {
  status: "success" | "error";
  data?: CalibrationData;
  error?: string;
}

const calibrationFetcher = async ([url, adminKey]: [string, string]): Promise<CalibrationData> => {
  const res = await fetch(url, { headers: { "x-admin-key": adminKey } });
  const json = (await res.json()) as CalibrationResponse;
  if (json.status !== "success" || !json.data) {
    throw new Error(json.error ?? "Unknown error");
  }
  return json.data;
};

export default function CalibrationDashboardPage() {
  const adminKey = readAdminKey();

  const { data, error, isLoading } = useSWR<CalibrationData, Error>(
    adminKey ? ["/api/admin/convergence-calibration", adminKey] : null,
    calibrationFetcher,
    { refreshInterval: 60_000, revalidateOnFocus: true }
  );

  const loading = isLoading;
  const errorMessage = error?.message ?? null;

  if (!adminKey) {
    return (
      <div className="min-h-screen bg-hud-base text-hud-text p-8 font-mono">
        <h1 className="text-2xl mb-4">CALIBRATION DASHBOARD</h1>
        <p className="text-hud-muted text-sm">
          Pass admin key via <code>?key=...</code> query param.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-hud-base text-hud-text p-8 font-mono">
        <p className="text-hud-muted animate-pulse">Loading calibration data…</p>
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div className="min-h-screen bg-hud-base text-hud-text p-8 font-mono">
        <h1 className="text-2xl mb-4 text-severity-critical">ERROR</h1>
        <p className="text-hud-muted text-sm">{errorMessage ?? "No data"}</p>
      </div>
    );
  }

  const totalShown = data.buckets.reduce((s, b) => s + b.shown, 0);
  const totalClicked = data.buckets.reduce((s, b) => s + b.clicked, 0);
  const overallCtr = totalShown > 0 ? totalClicked / totalShown : 0;

  return (
    <div className="min-h-screen bg-hud-base text-hud-text p-6 font-mono text-sm">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">CONVERGENCE CALIBRATION</h1>
          <span className="text-xs text-hud-muted">
            Updated {new Date(data.timestamp).toLocaleString()}
          </span>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="CURRENT PRIOR"
            value={data.currentPrior.toFixed(3)}
            hint="0.30 = default"
          />
          <MetricCard
            label="TOTAL SHOWN"
            value={totalShown.toLocaleString()}
            hint="rolling 7d"
          />
          <MetricCard
            label="TOTAL CLICKED"
            value={totalClicked.toLocaleString()}
            hint="rolling 7d"
          />
          <MetricCard
            label="OVERALL CTR"
            value={`${(overallCtr * 100).toFixed(1)}%`}
            hint="click/shown"
          />
        </div>

        {/* CTR buckets */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-hud-accent mb-2">
            CTR BY CONFIDENCE BUCKET
          </h2>
          <div className="border border-hud-border rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-hud-surface/50 text-hud-muted">
                <tr>
                  <th className="px-3 py-2 text-left">BUCKET</th>
                  <th className="px-3 py-2 text-right">SHOWN</th>
                  <th className="px-3 py-2 text-right">CLICKED</th>
                  <th className="px-3 py-2 text-right">CTR</th>
                  <th className="px-3 py-2 text-right">BAR</th>
                </tr>
              </thead>
              <tbody>
                {data.buckets.map((b) => {
                  const barWidth = Math.min(100, b.ctr * 100);
                  return (
                    <tr
                      key={`${b.min}-${b.max}`}
                      className="border-t border-hud-border/30"
                    >
                      <td className="px-3 py-2">
                        {b.min.toFixed(1)} – {Math.min(b.max, 1).toFixed(1)}
                      </td>
                      <td className="px-3 py-2 text-right">{b.shown}</td>
                      <td className="px-3 py-2 text-right">{b.clicked}</td>
                      <td className="px-3 py-2 text-right">
                        {(b.ctr * 100).toFixed(1)}%
                      </td>
                      <td className="px-3 py-2">
                        <div className="h-2 w-full bg-hud-border/20 rounded">
                          <div
                            className="h-full bg-hud-accent rounded"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Anomalies */}
        {data.anomalies.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold text-severity-critical mb-2">
              ⚠ CALIBRATION ANOMALIES — {data.anomalies.length}
            </h2>
            <div className="space-y-2">
              {data.anomalies.map((a, i) => (
                <div
                  key={i}
                  className="border border-severity-critical/40 rounded-md p-3 bg-severity-critical/10"
                >
                  <div className="text-xs">
                    Bucket {a.lowBucket.min.toFixed(1)}–
                    {Math.min(a.lowBucket.max, 1).toFixed(1)} has CTR{" "}
                    <span className="font-bold">
                      {(a.lowBucket.ctr * 100).toFixed(1)}%
                    </span>{" "}
                    but higher bucket {a.highBucket.min.toFixed(1)}–
                    {Math.min(a.highBucket.max, 1).toFixed(1)} has LOWER CTR{" "}
                    <span className="font-bold">
                      {(a.highBucket.ctr * 100).toFixed(1)}%
                    </span>{" "}
                    (gap {(a.gap * 100).toFixed(1)}%)
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Calibration history */}
        {data.history.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-hud-accent mb-2">
              RECENT CALIBRATION ADJUSTMENTS
            </h2>
            <div className="border border-hud-border rounded-md overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-hud-surface/50 text-hud-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">WHEN</th>
                    <th className="px-3 py-2 text-right">OLD PRIOR</th>
                    <th className="px-3 py-2 text-right">NEW PRIOR</th>
                    <th className="px-3 py-2 text-right">AVG ERROR</th>
                    <th className="px-3 py-2 text-right">SAMPLES</th>
                    <th className="px-3 py-2 text-left">REASON</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.slice(0, 12).map((h) => (
                    <tr
                      key={h.timestamp}
                      className="border-t border-hud-border/30"
                    >
                      <td className="px-3 py-2">
                        {new Date(h.timestamp).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {h.oldPrior.toFixed(3)}
                      </td>
                      <td className="px-3 py-2 text-right font-bold">
                        {h.newPrior.toFixed(3)}
                      </td>
                      <td
                        className="px-3 py-2 text-right"
                        style={{
                          color: h.avgError >= 0 ? "#00ff88" : "#ff4757",
                        }}
                      >
                        {(h.avgError * 100).toFixed(1)}%
                      </td>
                      <td className="px-3 py-2 text-right">{h.sampleSize}</td>
                      <td className="px-3 py-2 text-xs text-hud-muted">
                        {h.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="bg-hud-surface/40 border border-hud-border rounded-md p-3">
      <div className="text-xs text-hud-muted uppercase tracking-wider">
        {label}
      </div>
      <div className="text-xl font-bold text-hud-accent mt-1">{value}</div>
      <div className="text-xs text-hud-muted mt-1">{hint}</div>
    </div>
  );
}
