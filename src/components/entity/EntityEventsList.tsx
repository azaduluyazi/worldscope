import type { IntelItem } from "@/types/intel";
import { timeAgo } from "@/lib/utils/date";

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-cyan-500",
  info: "bg-white/30",
};

export default function EntityEventsList({
  events,
}: {
  events: IntelItem[];
}) {
  if (events.length === 0) {
    return (
      <section className="max-w-6xl mx-auto px-6 py-8">
        <p className="text-white/40 font-mono text-sm">
          No recent events linked to this entity yet.
        </p>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-8">
      <h2 className="text-sm uppercase tracking-widest text-white/60 mb-4 font-mono">
        Recent events
      </h2>
      <ul className="divide-y divide-white/10">
        {events.map((e) => (
          <li key={e.id} className="py-4">
            <a
              href={e.url || "#"}
              target={e.url ? "_blank" : undefined}
              rel={e.url ? "noopener noreferrer" : undefined}
              className="block group hover:bg-white/[0.02] -mx-3 px-3 py-1 rounded transition-colors"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-2 size-2 rounded-full shrink-0 ${
                    SEVERITY_DOT[e.severity] || "bg-white/30"
                  }`}
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium group-hover:text-cyan-400 transition-colors">
                    {e.title}
                  </h3>
                  <p className="text-xs text-white/50 mt-1 font-mono">
                    {e.source} · {timeAgo(e.publishedAt)}
                  </p>
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
