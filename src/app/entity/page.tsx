import type { Metadata } from "next";
import Link from "next/link";
import { getTopEntities, type Entity } from "@/lib/db/entities";

// Skip build prerender: getTopEntities runs 4 parallel Supabase queries and
// has intermittently exceeded the 60s build worker limit. Render on request
// with CDN cache via ISR-style revalidation.
export const dynamic = "force-dynamic";
export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Entities — WorldScope",
  description:
    "Most mentioned people, organizations, countries, and topics across WorldScope's intelligence sources.",
  alternates: { canonical: "/entity" },
};

const TYPE_LABEL: Record<Entity["type"], string> = {
  person: "People",
  organization: "Organizations",
  country: "Countries",
  topic: "Topics",
};

const TYPE_ORDER: Entity["type"][] = [
  "person",
  "organization",
  "country",
  "topic",
];

const TYPE_ACCENT: Record<Entity["type"], string> = {
  person: "border-cyan-500/20",
  organization: "border-purple-500/20",
  country: "border-yellow-500/20",
  topic: "border-green-500/20",
};

export default async function EntityIndex() {
  const buckets = await Promise.all(
    TYPE_ORDER.map((t) => getTopEntities(t, 30).then((e) => [t, e] as const))
  );

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 text-white bg-black min-h-screen">
      <header className="mb-8">
        <nav className="flex items-center gap-2 text-[10px] font-mono text-white/50 mb-3">
          <Link href="/" className="text-cyan-400 hover:underline">
            WORLDSCOPE
          </Link>
          <span>/</span>
          <span>ENTITIES</span>
        </nav>
        <h1 className="text-3xl font-bold font-mono">Entities</h1>
        <p className="text-sm text-white/60 mt-2 font-mono">
          Top mentioned across all intelligence sources.
        </p>
      </header>

      {buckets.map(([type, items]) => (
        <section key={type} className="mb-10">
          <h2 className="text-xs uppercase tracking-widest text-white/60 mb-4 font-mono">
            {TYPE_LABEL[type]}
          </h2>
          {items.length === 0 ? (
            <p className="text-xs text-white/30 font-mono">
              No entities of this type yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {items.map((e) => (
                <Link
                  key={e.id}
                  href={`/entity/${e.slug}`}
                  className={`px-3 py-1.5 border rounded font-mono text-xs hover:bg-white/5 transition-colors ${TYPE_ACCENT[type]}`}
                >
                  {e.name}{" "}
                  <span className="text-white/40">({e.mention_count})</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      ))}
    </main>
  );
}
