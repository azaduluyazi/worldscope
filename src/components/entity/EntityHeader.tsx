import type { Entity } from "@/lib/db/entities";

const TYPE_COLORS: Record<Entity["type"], string> = {
  person: "text-cyan-400 border-cyan-500/30",
  organization: "text-purple-400 border-purple-500/30",
  country: "text-yellow-400 border-yellow-500/30",
  topic: "text-green-400 border-green-500/30",
};

const TYPE_LABEL: Record<Entity["type"], string> = {
  person: "PERSON",
  organization: "ORGANIZATION",
  country: "COUNTRY",
  topic: "TOPIC",
};

export default function EntityHeader({ entity }: { entity: Entity }) {
  return (
    <header className="border-b border-white/10 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <span
          className={`text-[10px] uppercase tracking-widest px-2 py-1 border font-mono ${TYPE_COLORS[entity.type]}`}
        >
          {TYPE_LABEL[entity.type]}
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold mt-3 font-mono">
          {entity.name}
        </h1>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-xs text-white/60 font-mono">
          <span>
            <strong className="text-white">{entity.mention_count}</strong>{" "}
            mentions
          </span>
          <span>
            First seen:{" "}
            {new Date(entity.first_seen).toLocaleDateString("en-GB")}
          </span>
          <span>
            Last seen:{" "}
            {new Date(entity.last_seen).toLocaleDateString("en-GB")}
          </span>
        </div>
      </div>
    </header>
  );
}
