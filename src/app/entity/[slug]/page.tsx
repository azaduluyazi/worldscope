import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getEntityBySlug,
  getEventsForEntity,
  type Entity,
} from "@/lib/db/entities";
import { fetchEventsByIds } from "@/lib/db/events";
import EntityHeader from "@/components/entity/EntityHeader";
import EntityEventsList from "@/components/entity/EntityEventsList";

// 1 hour ISR — entities evolve slowly; reduces Vercel bandwidth ~6x vs 10-min.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entity = await getEntityBySlug(slug);
  if (!entity) {
    return { title: "Entity not found — WorldScope" };
  }
  const desc = `Latest events, mentions, and connections involving ${entity.name}. ${entity.mention_count} mentions tracked across WorldScope's intelligence sources.`;
  return {
    title: `${entity.name} — WorldScope`,
    description: desc,
    alternates: { canonical: `/entity/${entity.slug}` },
    openGraph: {
      title: entity.name,
      description: desc,
      type: "profile",
      url: `https://troiamedia.com/entity/${entity.slug}`,
    },
  };
}

export default async function EntityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entity = await getEntityBySlug(slug);
  if (!entity) notFound();

  const eventLinks = await getEventsForEntity(entity.id, 50);
  const events = await fetchEventsByIds(eventLinks.map((l) => l.event_id));

  return (
    <main className="min-h-screen bg-black text-white">
      <EntityHeader entity={entity} />
      <EntityEventsList events={events} />
      <JsonLd entity={entity} eventCount={events.length} />
    </main>
  );
}

function JsonLd({
  entity,
  eventCount,
}: {
  entity: Entity;
  eventCount: number;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Thing",
    name: entity.name,
    url: `https://troiamedia.com/entity/${entity.slug}`,
    description: `Tracked entity with ${entity.mention_count} mentions and ${eventCount} recent linked events.`,
    additionalType: entity.type,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
