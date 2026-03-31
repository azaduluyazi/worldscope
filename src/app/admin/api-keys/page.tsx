"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";

interface ApiKeyRecord {
  id: string;
  email: string;
  name: string;
  purpose: string;
  website?: string;
  key_hash: string;
  key_prefix: string;
  status: "pending" | "approved" | "denied" | "revoked";
  rate_limit: number;
  created_at: string;
  approved_at?: string;
  last_used_at?: string;
  request_count: number;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  denied: number;
  revoked: number;
  totalRequests: number;
}

export default function AdminApiKeysPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [keyError, setKeyError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "denied" | "revoked">("all");

  const handleVerify = useCallback(async () => {
    if (!adminKey.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: adminKey.trim() }),
      });
      const data = await res.json();
      if (data.verified) {
        setIsVerified(true);
        setKeyError(false);
      } else {
        setKeyError(true);
      }
    } catch {
      setKeyError(true);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/api-keys", {
        headers: { "x-admin-key": adminKey.trim() },
      });
      const data = await res.json();
      if (data.keys) {
        setKeys(data.keys);
        setStats(data.stats);
      }
    } catch (e) {
      console.error("Failed to fetch keys:", e);
    }
  }, [adminKey]);

  useEffect(() => {
    if (isVerified) fetchKeys();
  }, [isVerified, fetchKeys]);

  const handleAction = async (
    action: "approve" | "deny" | "revoke",
    requestId: string
  ) => {
    setActionLoading(requestId);
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey.trim(),
        },
        body: JSON.stringify({ action, requestId }),
      });

      if (res.ok) {
        await fetchKeys();
      } else {
        const data = await res.json();
        alert(data.error || "Action failed");
      }
    } catch {
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredKeys = filter === "all" ? keys : keys.filter((k) => k.status === filter);

  // Login gate
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#e0e0e0] flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-[#0d1117] border border-[#1a1a2e] rounded-lg p-8">
            <div className="text-center mb-8">
              <h1 className="font-mono text-2xl font-bold text-[#00e5ff] tracking-wider">
                API KEY ADMIN
              </h1>
              <p className="font-mono text-sm text-[#8b949e] mt-2">
                Developer API Management Console
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                placeholder="Enter admin key"
                value={adminKey}
                onChange={(e) => {
                  setAdminKey(e.target.value);
                  setKeyError(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-4 py-3 text-sm font-mono text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#00e5ff]"
              />
              {keyError && (
                <p className="text-[#ff4757] text-xs font-mono">Invalid admin key</p>
              )}
              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full bg-[#00e5ff] hover:bg-[#00d4ee] disabled:opacity-50 text-[#0a0a0f] font-mono font-bold text-sm py-3 rounded-md transition-colors"
              >
                {loading ? "VERIFYING..." : "AUTHENTICATE"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e0e0e0]">
      {/* Header */}
      <header className="border-b border-[#1a1a2e]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="font-mono text-sm text-[#8b949e] hover:text-[#00e5ff] transition-colors"
            >
              &larr; Admin
            </Link>
            <h1 className="font-mono text-lg font-bold text-[#00e5ff] tracking-wider">
              API KEY MANAGEMENT
            </h1>
          </div>
          <button
            onClick={fetchKeys}
            className="px-3 py-1.5 text-xs font-mono bg-[#161b22] border border-[#30363d] rounded hover:border-[#00e5ff33] text-[#8b949e] hover:text-[#00e5ff] transition-colors"
          >
            REFRESH
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <StatCard label="TOTAL" value={stats.total} color="#c9d1d9" />
            <StatCard label="PENDING" value={stats.pending} color="#ffd000" />
            <StatCard label="ACTIVE" value={stats.approved} color="#00ff88" />
            <StatCard label="DENIED" value={stats.denied} color="#ff4757" />
            <StatCard label="API CALLS" value={stats.totalRequests} color="#00e5ff" />
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "pending", "approved", "denied", "revoked"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                filter === f
                  ? "bg-[#00e5ff20] text-[#00e5ff] border border-[#00e5ff33]"
                  : "bg-[#161b22] text-[#8b949e] border border-[#30363d] hover:border-[#484f58]"
              }`}
            >
              {f.toUpperCase()}
              {f !== "all" && stats && (
                <span className="ml-1 opacity-60">
                  ({stats[f as keyof Omit<Stats, "total" | "totalRequests">]})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-[#0d1117] border border-[#1a1a2e] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a1a2e] text-left">
                  <th className="px-4 py-3 text-xs font-mono text-[#8b949e] font-normal uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-4 py-3 text-xs font-mono text-[#8b949e] font-normal uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-4 py-3 text-xs font-mono text-[#8b949e] font-normal uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-mono text-[#8b949e] font-normal uppercase tracking-wider">
                    Key / Usage
                  </th>
                  <th className="px-4 py-3 text-xs font-mono text-[#8b949e] font-normal uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-xs font-mono text-[#8b949e] font-normal uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredKeys.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#484f58] font-mono">
                      No API key records found
                    </td>
                  </tr>
                ) : (
                  filteredKeys.map((k) => (
                    <tr key={k.id} className="border-b border-[#1a1a2e33] hover:bg-[#161b2233]">
                      <td className="px-4 py-3">
                        <div className="text-sm font-mono text-[#c9d1d9]">{k.name}</div>
                        <div className="text-xs text-[#8b949e]">{k.email}</div>
                        {k.website && (
                          <div className="text-xs text-[#484f58] truncate max-w-[200px]">
                            {k.website}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-[#8b949e] max-w-[250px] line-clamp-2">
                          {k.purpose}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={k.status} />
                      </td>
                      <td className="px-4 py-3">
                        {k.status === "approved" && (
                          <div>
                            <code className="text-xs font-mono text-[#00ff88]">
                              {k.key_prefix}...
                            </code>
                            <div className="text-xs text-[#8b949e] mt-0.5">
                              {k.request_count.toLocaleString()} calls &middot; {k.rate_limit}/hr
                            </div>
                            {k.last_used_at && (
                              <div className="text-xs text-[#484f58]">
                                Last: {formatDate(k.last_used_at)}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-[#484f58]">
                        {formatDate(k.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {k.status === "pending" && (
                            <>
                              <ActionButton
                                label="APPROVE"
                                color="green"
                                loading={actionLoading === k.id}
                                onClick={() => handleAction("approve", k.id)}
                              />
                              <ActionButton
                                label="DENY"
                                color="red"
                                loading={actionLoading === k.id}
                                onClick={() => handleAction("deny", k.id)}
                              />
                            </>
                          )}
                          {k.status === "approved" && (
                            <ActionButton
                              label="REVOKE"
                              color="red"
                              loading={actionLoading === k.id}
                              onClick={() => handleAction("revoke", k.id)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─── Sub-components ─── */

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-[#0d1117] border border-[#1a1a2e] rounded-lg p-4">
      <div className="text-xs font-mono text-[#8b949e] mb-1">{label}</div>
      <div className="text-2xl font-mono font-bold" style={{ color }}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    pending: { bg: "#ffd00020", text: "#ffd000" },
    approved: { bg: "#00ff8820", text: "#00ff88" },
    denied: { bg: "#ff475720", text: "#ff4757" },
    revoked: { bg: "#8b949e20", text: "#8b949e" },
  };
  const s = styles[status] || styles.pending;

  return (
    <span
      className="inline-block px-2 py-0.5 text-xs font-mono font-bold rounded uppercase"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {status}
    </span>
  );
}

function ActionButton({
  label,
  color,
  loading,
  onClick,
}: {
  label: string;
  color: "green" | "red";
  loading: boolean;
  onClick: () => void;
}) {
  const colors = {
    green: "bg-[#00ff8815] text-[#00ff88] border-[#00ff8833] hover:bg-[#00ff8825]",
    red: "bg-[#ff475715] text-[#ff4757] border-[#ff475733] hover:bg-[#ff475725]",
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-2.5 py-1 text-xs font-mono font-bold border rounded transition-colors disabled:opacity-50 ${colors[color]}`}
    >
      {loading ? "..." : label}
    </button>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
