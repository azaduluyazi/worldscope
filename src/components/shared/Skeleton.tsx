"use client";

/** HUD-styled skeleton pulse animation */
function Pulse({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-hud-panel rounded ${className}`}
      style={{ animationDuration: "1.5s" }}
    />
  );
}

/** Skeleton for a single intel card in the feed */
export function IntelCardSkeleton() {
  return (
    <div className="bg-hud-surface border border-hud-border rounded-md p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Pulse className="w-12 h-3" />
        <Pulse className="w-16 h-3" />
        <div className="flex-1" />
        <Pulse className="w-10 h-3" />
      </div>
      <Pulse className="w-full h-4" />
      <Pulse className="w-3/4 h-3" />
      <div className="flex items-center gap-2 pt-1">
        <Pulse className="w-14 h-2.5" />
        <Pulse className="w-8 h-2.5" />
      </div>
    </div>
  );
}

/** Skeleton for the intel feed panel */
export function IntelFeedSkeleton() {
  return (
    <div className="h-full bg-hud-surface border-l border-hud-border p-3 space-y-3">
      {/* Tab bar */}
      <div className="flex gap-2">
        <Pulse className="w-16 h-6 rounded-md" />
        <Pulse className="w-16 h-6 rounded-md" />
        <Pulse className="w-16 h-6 rounded-md" />
      </div>
      {/* Cards */}
      {Array.from({ length: 6 }).map((_, i) => (
        <IntelCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Skeleton for the map area */
export function MapSkeleton() {
  return (
    <div className="relative w-full h-full bg-hud-base flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="relative w-16 h-16 mx-auto">
          <div
            className="absolute inset-0 border-2 border-hud-accent/30 rounded-full animate-spin"
            style={{ animationDuration: "3s", borderTopColor: "var(--color-hud-accent)" }}
          />
          <div className="absolute inset-2 border border-hud-border rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl">🌍</span>
          </div>
        </div>
        <p className="font-mono text-[10px] text-hud-muted tracking-wider animate-pulse">
          INITIALIZING MAP...
        </p>
      </div>
    </div>
  );
}

/** Skeleton for the threat index */
export function ThreatIndexSkeleton() {
  return (
    <div className="bg-hud-surface border border-hud-border rounded-md p-3 space-y-2">
      <Pulse className="w-20 h-3" />
      <Pulse className="w-full h-8 rounded-md" />
      <Pulse className="w-16 h-2.5" />
    </div>
  );
}

/** Skeleton for the AI brief */
export function AIBriefSkeleton() {
  return (
    <div className="space-y-2 p-3">
      <Pulse className="w-24 h-3" />
      <Pulse className="w-full h-3" />
      <Pulse className="w-full h-3" />
      <Pulse className="w-5/6 h-3" />
      <Pulse className="w-full h-3" />
      <Pulse className="w-2/3 h-3" />
    </div>
  );
}

export { Pulse };
