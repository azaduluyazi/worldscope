"use client";

import { useEffect, useState } from "react";
import {
  progressToNext,
  buildReferralUrl,
  REFERRAL_TIERS,
  type TierDefinition,
} from "@/lib/newsletter/referral-tiers";

/**
 * ReferralDashboard — Client component for /briefing/referrals.
 *
 * Flow:
 *  1. Email form → GET /api/newsletter/me?email=
 *  2. On success, show referral code, progress bar, share buttons, rank
 *  3. Load /api/newsletter/leaderboard for top-20 masked board
 *
 * The email is a soft-identifier (no password). Knowing the email is
 * enough to see public referral stats — intentional UX trade-off.
 */

interface MeResponse {
  found: boolean;
  email: string;
  referralCode: string;
  referralCount: number;
  rank: number;
  subscribedAt: string;
}

interface LeaderboardEntry {
  rank: number;
  maskedEmail: string;
  referralCount: number;
  tier: string;
}

export function ReferralDashboard() {
  const [email, setEmail] = useState("");
  const [me, setMe] = useState<MeResponse | null>(null);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ok">(
    "idle",
  );
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/newsletter/leaderboard")
      .then((r) => r.json())
      .then((j: { entries?: LeaderboardEntry[] }) => {
        if (j.entries) setBoard(j.entries);
      })
      .catch(() => {});
  }, []);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Enter a valid email");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(
        `/api/newsletter/me?email=${encodeURIComponent(email)}`,
      );
      if (res.ok) {
        const data = (await res.json()) as MeResponse;
        setMe(data);
        setStatus("ok");
      } else if (res.status === 404) {
        setError(
          "No subscription found for that email. Subscribe first at /briefing.",
        );
        setStatus("error");
      } else {
        setError("Lookup failed. Try again.");
        setStatus("error");
      }
    } catch {
      setError("Network error");
      setStatus("error");
    }
  };

  const copyLink = async () => {
    if (!me) return;
    const url = buildReferralUrl(me.referralCode);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fall back to prompt
      window.prompt("Copy your referral link:", url);
    }
  };

  return (
    <div className="space-y-12">
      {/* Lookup form */}
      {!me && (
        <section>
          <h2 className="font-display text-xl font-bold mb-3">
            Find your referral link
          </h2>
          <p className="font-mono text-xs text-hud-muted mb-4 leading-relaxed">
            Enter the email you subscribed with. We&apos;ll surface your
            personal referral link and show where you stand on the
            leaderboard. No password.
          </p>
          <form
            onSubmit={handleLookup}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
              className="flex-1 bg-hud-panel/80 border border-hud-border rounded px-4 py-3 font-mono text-sm text-hud-text placeholder:text-hud-muted/60 focus:border-hud-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              lang="en"
              className="px-6 py-3 bg-hud-accent text-hud-base font-mono font-bold tracking-wider rounded hover:bg-hud-accent/80 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {status === "loading" ? "..." : "LOOK UP"}
            </button>
          </form>
          {status === "error" && error && (
            <div className="font-mono text-[10px] text-red-400 mt-2">
              {error}
            </div>
          )}
        </section>
      )}

      {/* Referral card */}
      {me && <ReferralCard me={me} copied={copied} onCopy={copyLink} />}

      {/* Leaderboard */}
      <Leaderboard entries={board} />
    </div>
  );
}

function ReferralCard({
  me,
  copied,
  onCopy,
}: {
  me: MeResponse;
  copied: boolean;
  onCopy: () => void;
}) {
  const url = buildReferralUrl(me.referralCode);
  const { current, next, remaining, pct } = progressToNext(me.referralCount);
  const shareText = `I'm reading The Sunday Convergence Report — free weekly intelligence briefing from 689 global sources. Join me:`;

  const shareLinks = {
    x: `https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`,
    email: `mailto:?subject=${encodeURIComponent("The Sunday Convergence Report")}&body=${encodeURIComponent(`${shareText}\n\n${url}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`,
  };

  return (
    <section className="border border-hud-accent/30 rounded-xl p-6 bg-gradient-to-br from-hud-panel/60 to-hud-panel/20">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <div className="font-mono text-[10px] text-hud-accent uppercase tracking-[0.2em] mb-1">
            YOUR REFERRAL CARD
          </div>
          <div className="font-mono text-xs text-hud-muted">
            {me.email} · Rank #{me.rank} · {me.referralCount} referral
            {me.referralCount === 1 ? "" : "s"}
          </div>
        </div>
        <div className="font-mono text-[10px] text-hud-accent border border-hud-accent/40 px-3 py-1 rounded uppercase tracking-wider">
          TIER · {current.label}
        </div>
      </div>

      {/* Progress bar */}
      {next && (
        <div className="mb-5">
          <div className="flex justify-between font-mono text-[10px] text-hud-muted mb-1">
            <span>
              {current.label} → {next.label}
            </span>
            <span>
              {remaining} more to unlock {next.label}
            </span>
          </div>
          <div className="h-2 bg-hud-panel rounded overflow-hidden border border-hud-border/50">
            <div
              className="h-full bg-hud-accent transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="font-mono text-[9px] text-hud-muted/70 mt-1">
            Next unlock: {next.benefit}
          </div>
        </div>
      )}

      {/* Referral link + copy */}
      <div className="mb-5">
        <div className="font-mono text-[10px] text-hud-muted uppercase tracking-wider mb-2">
          YOUR REFERRAL LINK
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <code className="flex-1 font-mono text-[11px] text-hud-text bg-hud-base border border-hud-border rounded px-3 py-2 overflow-x-auto whitespace-nowrap">
            {url}
          </code>
          <button
            type="button"
            onClick={onCopy}
            lang="en"
            className="px-4 py-2 bg-hud-accent text-hud-base font-mono text-[11px] font-bold tracking-wider rounded hover:bg-hud-accent/80 whitespace-nowrap"
          >
            {copied ? "✓ COPIED" : "COPY LINK"}
          </button>
        </div>
      </div>

      {/* Share buttons */}
      <div>
        <div className="font-mono text-[10px] text-hud-muted uppercase tracking-wider mb-2">
          SHARE
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["x", "X / Twitter"],
              ["linkedin", "LinkedIn"],
              ["whatsapp", "WhatsApp"],
              ["telegram", "Telegram"],
              ["email", "Email"],
            ] as const
          ).map(([k, label]) => (
            <a
              key={k}
              href={shareLinks[k]}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] text-hud-accent border border-hud-accent/40 px-3 py-1.5 rounded hover:bg-hud-accent/10"
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Tiers */}
      <div className="mt-6 border-t border-hud-border/30 pt-4">
        <div className="font-mono text-[10px] text-hud-muted uppercase tracking-wider mb-2">
          UNLOCK TIERS
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {REFERRAL_TIERS.filter((t) => t.threshold > 0).map((t) => (
            <TierLine
              key={t.id}
              tier={t}
              unlocked={me.referralCount >= t.threshold}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function TierLine({
  tier,
  unlocked,
}: {
  tier: TierDefinition;
  unlocked: boolean;
}) {
  return (
    <li
      className={`font-mono text-[10px] px-3 py-2 rounded border ${
        unlocked
          ? "border-hud-accent/50 bg-hud-accent/10 text-hud-text"
          : "border-hud-border/40 bg-hud-panel/30 text-hud-muted/70"
      }`}
    >
      <span className="text-hud-accent">{tier.threshold} refs</span> ·{" "}
      <strong>{tier.label}</strong> — {tier.benefit}
    </li>
  );
}

function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold mb-3">
        Top referrers this month
      </h2>
      {entries.length === 0 ? (
        <div className="font-mono text-xs text-hud-muted border border-hud-border/40 rounded px-4 py-3 bg-hud-panel/30">
          Leaderboard is quiet right now. Be the first on it.
        </div>
      ) : (
        <ol className="space-y-1">
          {entries.map((e) => (
            <li
              key={`${e.rank}-${e.maskedEmail}`}
              className="flex items-center justify-between font-mono text-[11px] text-hud-text border border-hud-border/40 rounded px-3 py-2 bg-hud-panel/30"
            >
              <span className="flex items-center gap-3">
                <span className="text-hud-accent w-6 text-right">
                  #{e.rank}
                </span>
                <span>{e.maskedEmail}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-hud-muted">{e.tier}</span>
                <span className="text-hud-accent">{e.referralCount}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
