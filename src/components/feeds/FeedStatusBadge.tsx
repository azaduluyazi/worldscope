"use client";

interface Props {
  errorCount: number;
  isActive: boolean;
  lastFetched: string | null;
}

export function FeedStatusBadge({ errorCount, isActive, lastFetched }: Props) {
  if (!isActive) {
    return (
      <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400 font-mono">
        OFFLINE
      </span>
    );
  }
  if (errorCount >= 3) {
    return (
      <span className="px-2 py-0.5 text-xs rounded bg-yellow-500/20 text-yellow-400 font-mono">
        DEGRADED
      </span>
    );
  }
  if (!lastFetched) {
    return (
      <span className="px-2 py-0.5 text-xs rounded bg-gray-500/20 text-gray-400 font-mono">
        PENDING
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 text-xs rounded bg-emerald-500/20 text-emerald-400 font-mono">
      ACTIVE
    </span>
  );
}
