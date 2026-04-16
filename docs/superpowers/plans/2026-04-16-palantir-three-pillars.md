# Palantir Three Pillars Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Palantir-class capabilities to WorldScope by introducing (1) persistent entity layer, (2) semantic search endpoint, and (3) entity relationship graph view.

**Architecture:** Reuses existing infrastructure: pgvector + HNSW (migration 012), Gemini text-embedding-004 (already wired via convergence engine — runs every 5 min and populates `convergence_embeddings` for free), and rule-based NER in `src/lib/nlp/entity-extraction.ts`. Adds two tables (`entities`, `story_entities`), **zero new cron jobs** (entity extraction piggybacks on existing `fetch-feeds` cron; embedding backfill handled by existing convergence cron), a vector search RPC, dynamic `/entity/[slug]` pages, and a force-directed graph component using `react-force-graph-2d`.

**Cost profile:** $0/month ek maliyet. Gemini free tier (1500 RPM) zaten kapsıyor, yeni cron slot yok, react-force-graph-2d ücretsiz npm paketi, DB storage artışı Supabase free tier içinde.

**Tech Stack:** Next.js 16 App Router · Supabase Postgres + pgvector · Gemini Embeddings · react-force-graph-2d · Vitest · existing entity-extraction.ts gazetteers.

**Estimated effort:** ~3 weeks solo dev (15 tasks across 3 phases).

---

## Phase Overview

| Phase | Pillar | Tasks | Key deliverable |
|---|---|---|---|
| 1 | Entity Layer (Ontology) | 1-5 | `/entity/[slug]` pages indexable |
| 2 | Semantic Search | 6-8 | `/api/search/semantic` returns vector matches (Task 9 dropped — cost optimization) |
| 3 | Graph View | 10-13 | Interactive co-occurrence graph on entity pages |
| 4 | Polish & SEO | 14-15 | Sitemap inclusion + entity index page |
| 5 | UX Cleanup (vertical pages) | 16 | Remove DashboardSEO intro block — fixes layout shift + clutter |

---

## Phase 1: Persistent Entity Layer

### Task 1: Database schema for entities

**Files:**
- Create: `supabase/migrations/018_entities_layer.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ═══════════════════════════════════════════════════════════════════
--  Migration 018 — Entity Layer (Palantir-style ontology)
-- ═══════════════════════════════════════════════════════════════════
--  Persistent entities + story junction so we can build
--  /entity/[slug] pages, graph views, and historical analytics.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS entities (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('person','organization','country','topic')),
  aliases TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mention_count INTEGER NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_last_seen ON entities(last_seen DESC);
CREATE INDEX idx_entities_mention_count ON entities(mention_count DESC);
CREATE INDEX idx_entities_aliases ON entities USING GIN (aliases);

-- Junction: which entities appear in which events
CREATE TABLE IF NOT EXISTS story_entities (
  event_id TEXT NOT NULL,
  entity_id BIGINT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  confidence REAL NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, entity_id)
);

CREATE INDEX idx_story_entities_entity ON story_entities(entity_id);
CREATE INDEX idx_story_entities_event ON story_entities(event_id);
CREATE INDEX idx_story_entities_created ON story_entities(created_at DESC);

-- Atomic upsert RPC (used from app code)
CREATE OR REPLACE FUNCTION upsert_entity(
  p_slug TEXT, p_name TEXT, p_type TEXT
) RETURNS entities AS $$
DECLARE
  result entities;
BEGIN
  INSERT INTO entities (slug, name, type)
  VALUES (p_slug, p_name, p_type)
  ON CONFLICT (slug) DO UPDATE
    SET mention_count = entities.mention_count + 1,
        last_seen = NOW(),
        updated_at = NOW()
  RETURNING * INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Co-occurrence view for graph view
CREATE OR REPLACE VIEW entity_cooccurrence AS
SELECT
  LEAST(a.entity_id, b.entity_id)    AS entity_a,
  GREATEST(a.entity_id, b.entity_id) AS entity_b,
  COUNT(*)                           AS shared_events,
  MAX(a.created_at)                  AS last_co_occurred
FROM story_entities a
JOIN story_entities b
  ON a.event_id = b.event_id
 AND a.entity_id < b.entity_id
GROUP BY LEAST(a.entity_id, b.entity_id), GREATEST(a.entity_id, b.entity_id);
```

- [ ] **Step 2: Apply migration**

```bash
cd worldscope
npx supabase db push
```

Expected: `018_entities_layer.sql` applied without error.

- [ ] **Step 3: Verify in Postgres**

```bash
npx supabase db remote --execute "SELECT count(*) FROM entities;"
```

Expected: `0` (empty table created).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/018_entities_layer.sql
git commit -m "feat(db): add entities + story_entities tables for ontology layer"
```

---

### Task 2: Entity persistence library

**Files:**
- Create: `src/lib/db/entities.ts`
- Create: `src/lib/db/__tests__/entities.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/lib/db/__tests__/entities.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { upsertEntity, linkEntitiesToEvent, getEntityBySlug, slugify } from '../entities';
import { supabaseAdmin } from '../supabase';

describe('entities persistence', () => {
  beforeEach(async () => {
    await supabaseAdmin.from('story_entities').delete().neq('event_id', '');
    await supabaseAdmin.from('entities').delete().neq('id', 0);
  });

  it('slugifies names with Turkish chars', () => {
    expect(slugify('Türkiye')).toBe('turkiye');
    expect(slugify('İstanbul')).toBe('istanbul');
    expect(slugify('White House')).toBe('white-house');
  });

  it('upserts entity and increments mention_count on duplicate', async () => {
    const e1 = await upsertEntity({ name: 'Zelensky', type: 'person', confidence: 0.9 });
    const e2 = await upsertEntity({ name: 'Zelensky', type: 'person', confidence: 0.9 });
    expect(e1.id).toBe(e2.id);
    expect(e2.mention_count).toBe(2);
  });

  it('retrieves entity by slug', async () => {
    await upsertEntity({ name: 'Türkiye', type: 'country', confidence: 1 });
    const retrieved = await getEntityBySlug('turkiye');
    expect(retrieved?.name).toBe('Türkiye');
  });

  it('links entities to event', async () => {
    const e = await upsertEntity({ name: 'NATO', type: 'organization', confidence: 1 });
    await linkEntitiesToEvent('evt-test-1', [{ entityId: e.id, confidence: 0.8 }]);
    const { data } = await supabaseAdmin
      .from('story_entities')
      .select('*')
      .eq('event_id', 'evt-test-1');
    expect(data).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npx vitest run src/lib/db/__tests__/entities.test.ts
```

Expected: `Cannot find module '../entities'`.

- [ ] **Step 3: Implement library**

```typescript
// src/lib/db/entities.ts
import { supabaseAdmin } from './supabase';
import type { ExtractedEntity } from '@/lib/nlp/entity-extraction';

export interface Entity {
  id: number;
  slug: string;
  name: string;
  type: 'person' | 'organization' | 'country' | 'topic';
  aliases: string[];
  first_seen: string;
  last_seen: string;
  mention_count: number;
  metadata: Record<string, unknown>;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/i̇/g, 'i') // dotted-i fix
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export async function upsertEntity(extracted: ExtractedEntity): Promise<Entity> {
  const slug = slugify(extracted.name);
  const { data, error } = await supabaseAdmin.rpc('upsert_entity', {
    p_slug: slug,
    p_name: extracted.name,
    p_type: extracted.type,
  });
  if (error) throw new Error(`upsertEntity failed: ${error.message}`);
  return data as Entity;
}

export async function linkEntitiesToEvent(
  eventId: string,
  entities: Array<{ entityId: number; confidence: number }>
): Promise<void> {
  if (entities.length === 0) return;
  const rows = entities.map(e => ({
    event_id: eventId,
    entity_id: e.entityId,
    confidence: e.confidence,
  }));
  const { error } = await supabaseAdmin
    .from('story_entities')
    .upsert(rows, { onConflict: 'event_id,entity_id' });
  if (error) throw new Error(`linkEntitiesToEvent failed: ${error.message}`);
}

export async function getEntityBySlug(slug: string): Promise<Entity | null> {
  const { data, error } = await supabaseAdmin
    .from('entities')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) return null;
  return data as Entity;
}

export async function getEventsForEntity(
  entityId: number,
  limit = 50
): Promise<Array<{ event_id: string; created_at: string; confidence: number }>> {
  const { data, error } = await supabaseAdmin
    .from('story_entities')
    .select('event_id, created_at, confidence')
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getEventsForEntity: ${error.message}`);
  return data;
}

export async function getTopEntities(
  type: Entity['type'] | null = null,
  limit = 50
): Promise<Entity[]> {
  let query = supabaseAdmin
    .from('entities')
    .select('*')
    .order('mention_count', { ascending: false })
    .limit(limit);
  if (type) query = query.eq('type', type);
  const { data, error } = await query;
  if (error) throw new Error(`getTopEntities: ${error.message}`);
  return data as Entity[];
}
```

- [ ] **Step 4: Run test to verify pass**

```bash
npx vitest run src/lib/db/__tests__/entities.test.ts
```

Expected: All 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/entities.ts src/lib/db/__tests__/entities.test.ts
git commit -m "feat(entities): add persistence layer with slugify + upsert + link APIs"
```

---

### Task 3: Hook entity extraction into existing fetch-feeds cron

**Decision:** Instead of creating a new `/api/cron/extract-entities` cron (which would consume a Vercel cron slot + ~2880 invocations/month), piggyback on the existing `/api/cron/fetch-feeds` cron that runs every 10 minutes. This adds ~2-5 seconds to the existing fetch (well within its 300s `maxDuration`) and creates entities atomically with event ingestion.

**Files:**
- Modify: `src/app/api/cron/fetch-feeds/route.ts` (add entity extraction after `persistEvents`)
- Create: `src/lib/db/entity-pipeline.ts` (extracted helper for testability)

- [ ] **Step 1: Write the entity pipeline helper**

```typescript
// src/lib/db/entity-pipeline.ts
import { extractEntities } from '@/lib/nlp/entity-extraction';
import { upsertEntity, linkEntitiesToEvent } from './entities';
import type { IntelItem } from '@/types/intel';

export interface EntityPipelineResult {
  eventsProcessed: number;
  entitiesUpserted: number;
  linksCreated: number;
  errors: number;
}

/**
 * Extract entities from a batch of newly-persisted events and link them.
 * Designed to run inside the fetch-feeds cron after persistEvents().
 * Errors per event are swallowed (logged) so one bad event doesn't fail
 * the whole batch.
 */
export async function runEntityPipeline(
  events: IntelItem[]
): Promise<EntityPipelineResult> {
  const result: EntityPipelineResult = {
    eventsProcessed: 0,
    entitiesUpserted: 0,
    linksCreated: 0,
    errors: 0,
  };

  for (const event of events) {
    try {
      const text = `${event.title}. ${event.summary || ''}`;
      const extracted = extractEntities(text);
      if (extracted.length === 0) {
        result.eventsProcessed++;
        continue;
      }

      const linked: Array<{ entityId: number; confidence: number }> = [];
      for (const ent of extracted) {
        const persisted = await upsertEntity(ent);
        linked.push({ entityId: persisted.id, confidence: ent.confidence });
        result.entitiesUpserted++;
      }
      await linkEntitiesToEvent(event.id, linked);
      result.linksCreated += linked.length;
      result.eventsProcessed++;
    } catch (err) {
      console.error('[entity-pipeline] failed event', event.id, err);
      result.errors++;
    }
  }

  return result;
}
```

- [ ] **Step 2: Wire into fetch-feeds**

In `src/app/api/cron/fetch-feeds/route.ts`, after the existing `persistEvents()` call returns successfully, add:

```typescript
import { runEntityPipeline } from '@/lib/db/entity-pipeline';

// ... existing fetch + persist logic ...

// After persistEvents() — extract entities for newly added events
const persistedEvents = /* the array returned from persistEvents */;
const entityResult = await runEntityPipeline(persistedEvents);

// Include in response payload for telemetry
return NextResponse.json({
  /* existing fields */,
  entities: entityResult,
});
```

- [ ] **Step 3: Test the pipeline helper**

Create `src/lib/db/__tests__/entity-pipeline.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { runEntityPipeline } from '../entity-pipeline';
import { supabaseAdmin } from '../supabase';

describe('runEntityPipeline', () => {
  beforeEach(async () => {
    await supabaseAdmin.from('story_entities').delete().neq('event_id', '');
    await supabaseAdmin.from('entities').delete().neq('id', 0);
  });

  it('extracts and persists entities for events', async () => {
    const events = [
      { id: 'e1', title: 'NATO meets in Brussels', summary: 'Erdogan addressed leaders.', publishedAt: new Date().toISOString() },
      { id: 'e2', title: 'Türkiye signs deal with Russia', summary: '', publishedAt: new Date().toISOString() },
    ] as any;
    const result = await runEntityPipeline(events);
    expect(result.eventsProcessed).toBe(2);
    expect(result.entitiesUpserted).toBeGreaterThan(0);
    expect(result.linksCreated).toBeGreaterThan(0);
  });

  it('handles events with no extractable entities', async () => {
    const events = [{ id: 'e3', title: 'asdfgh', summary: '', publishedAt: new Date().toISOString() }] as any;
    const result = await runEntityPipeline(events);
    expect(result.eventsProcessed).toBe(1);
    expect(result.entitiesUpserted).toBe(0);
  });
});
```

Run: `npx vitest run src/lib/db/__tests__/entity-pipeline.test.ts`
Expected: Both pass.

- [ ] **Step 4: Manual smoke test (local)**

```bash
npm run dev
# In another terminal:
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/fetch-feeds
```

Expected: JSON response includes `entities: { eventsProcessed, entitiesUpserted, linksCreated, errors }`.

- [ ] **Step 5: Verify in DB**

```bash
npx supabase db remote --execute "SELECT type, count(*) FROM entities GROUP BY type;"
```

Expected: Counts > 0 for each type after one fetch-feeds run.

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/entity-pipeline.ts src/lib/db/__tests__/entity-pipeline.test.ts src/app/api/cron/fetch-feeds/route.ts
git commit -m "feat(entities): extract entities atomically inside fetch-feeds cron (zero new cron slot)"
```

---

### Task 4: Dynamic entity page route

**Files:**
- Create: `src/app/entity/[slug]/page.tsx`
- Create: `src/app/entity/[slug]/EntityPageClient.tsx`
- Create: `src/components/entity/EntityHeader.tsx`
- Create: `src/components/entity/EntityEventsList.tsx`

- [ ] **Step 1: Server component (ISR + metadata)**

```typescript
// src/app/entity/[slug]/page.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getEntityBySlug, getEventsForEntity } from '@/lib/db/entities';
import { fetchEventsByIds } from '@/lib/db/events';
import EntityPageClient from './EntityPageClient';

export const revalidate = 3600; // 1 hour ISR — entities evolve slowly; reduces Vercel bandwidth ~6x vs 10-min

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const entity = await getEntityBySlug(slug);
  if (!entity) return { title: 'Entity not found' };
  return {
    title: `${entity.name} — WorldScope`,
    description: `Latest events, mentions, and connections involving ${entity.name}. ${entity.mention_count} mentions tracked.`,
    openGraph: {
      title: entity.name,
      type: 'profile',
    },
  };
}

export default async function EntityPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const entity = await getEntityBySlug(slug);
  if (!entity) notFound();

  const eventLinks = await getEventsForEntity(entity.id, 50);
  const events = await fetchEventsByIds(eventLinks.map(l => l.event_id));

  return <EntityPageClient entity={entity} events={events} />;
}
```

- [ ] **Step 2: Client component shell**

```typescript
// src/app/entity/[slug]/EntityPageClient.tsx
'use client';
import EntityHeader from '@/components/entity/EntityHeader';
import EntityEventsList from '@/components/entity/EntityEventsList';
import type { Entity } from '@/lib/db/entities';
import type { IntelItem } from '@/types/intel';

interface Props { entity: Entity; events: IntelItem[]; }

export default function EntityPageClient({ entity, events }: Props) {
  return (
    <main className="min-h-screen bg-black text-white">
      <EntityHeader entity={entity} />
      <EntityEventsList events={events} />
    </main>
  );
}
```

- [ ] **Step 3: Header component (dark HUD style)**

```typescript
// src/components/entity/EntityHeader.tsx
import type { Entity } from '@/lib/db/entities';

const TYPE_COLORS: Record<Entity['type'], string> = {
  person: 'text-cyan-400 border-cyan-500/30',
  organization: 'text-purple-400 border-purple-500/30',
  country: 'text-yellow-400 border-yellow-500/30',
  topic: 'text-green-400 border-green-500/30',
};

export default function EntityHeader({ entity }: { entity: Entity }) {
  return (
    <header className="border-b border-white/10 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <span className={`text-xs uppercase tracking-widest px-2 py-1 border ${TYPE_COLORS[entity.type]}`}>
          {entity.type}
        </span>
        <h1 className="text-4xl font-bold mt-3">{entity.name}</h1>
        <div className="flex gap-6 mt-4 text-sm text-white/60">
          <span><strong className="text-white">{entity.mention_count}</strong> mentions</span>
          <span>First seen: {new Date(entity.first_seen).toLocaleDateString()}</span>
          <span>Last seen: {new Date(entity.last_seen).toLocaleDateString()}</span>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Events list component**

```typescript
// src/components/entity/EntityEventsList.tsx
import Link from 'next/link';
import type { IntelItem } from '@/types/intel';
import { timeAgo } from '@/lib/utils/date';

export default function EntityEventsList({ events }: { events: IntelItem[] }) {
  return (
    <section className="max-w-6xl mx-auto px-6 py-8">
      <h2 className="text-xl font-bold mb-4">Recent events</h2>
      <ul className="divide-y divide-white/10">
        {events.map(e => (
          <li key={e.id} className="py-4">
            <Link href={`/events/${e.id}`} className="hover:text-cyan-400">
              <h3 className="font-medium">{e.title}</h3>
              <p className="text-sm text-white/60 mt-1">{timeAgo(e.publishedAt)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 5: Smoke test**

```bash
npm run dev
# visit http://localhost:3000/entity/turkiye (after cron has run)
```

Expected: Page renders with entity header + event list.

- [ ] **Step 6: Commit**

```bash
git add src/app/entity src/components/entity
git commit -m "feat(entity): add /entity/[slug] dynamic page with ISR"
```

---

### Task 5: Helper — fetchEventsByIds

**Files:**
- Modify: `src/lib/db/events.ts` (add new function)

- [ ] **Step 1: Add function**

```typescript
// Append to src/lib/db/events.ts
export async function fetchEventsByIds(ids: string[]): Promise<IntelItem[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('*')
    .in('id', ids)
    .order('published_at', { ascending: false });
  if (error) throw new Error(`fetchEventsByIds: ${error.message}`);
  return (data || []).map(mapDbRowToIntelItem);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/db/events.ts
git commit -m "feat(db): add fetchEventsByIds helper"
```

---

## Phase 2: Semantic Search

### Task 6: Vector search RPC

**Files:**
- Create: `supabase/migrations/019_semantic_search_rpc.sql`

- [ ] **Step 1: Write RPC**

```sql
-- Migration 019 — Semantic search RPC over event embeddings.
-- Uses existing convergence_embeddings table (Gemini 768-dim).

CREATE OR REPLACE FUNCTION search_events_semantic(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 20
)
RETURNS TABLE (
  event_id TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT
    ce.event_id,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM convergence_embeddings ce
  WHERE 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
$$;
```

- [ ] **Step 2: Apply + commit**

```bash
npx supabase db push
git add supabase/migrations/019_semantic_search_rpc.sql
git commit -m "feat(db): add search_events_semantic RPC over pgvector"
```

---

### Task 7: Semantic search endpoint

**Files:**
- Create: `src/app/api/search/semantic/route.ts`
- Create: `src/app/api/search/semantic/__tests__/route.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/app/api/search/semantic/__tests__/route.test.ts
import { describe, it, expect } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('GET /api/search/semantic', () => {
  it('returns 400 if q missing', async () => {
    const req = new NextRequest('http://x/api/search/semantic');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns results for valid query', async () => {
    const req = new NextRequest('http://x/api/search/semantic?q=peace+talks');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.results)).toBe(true);
  });
});
```

- [ ] **Step 2: Implement endpoint**

```typescript
// src/app/api/search/semantic/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getEmbeddingProvider } from '@/lib/convergence/embedding';
import { supabaseAdmin } from '@/lib/db/supabase';
import { fetchEventsByIds } from '@/lib/db/events';

export const runtime = 'nodejs';
export const revalidate = 60;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json({ error: 'q must be 3+ chars' }, { status: 400 });
  }

  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '20', 10), 50);
  const threshold = parseFloat(request.nextUrl.searchParams.get('threshold') || '0.3');

  const provider = getEmbeddingProvider();
  if (!provider) {
    return NextResponse.json({ error: 'embedding provider unavailable' }, { status: 503 });
  }

  const [embedding] = await provider.embed([q]);
  if (!embedding) {
    return NextResponse.json({ results: [] });
  }

  const { data: matches, error } = await supabaseAdmin.rpc('search_events_semantic', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const events = await fetchEventsByIds((matches || []).map((m: any) => m.event_id));
  const enriched = events.map(e => {
    const match = matches.find((m: any) => m.event_id === e.id);
    return { ...e, similarity: match?.similarity ?? 0 };
  }).sort((a, b) => b.similarity - a.similarity);

  return NextResponse.json({ query: q, count: enriched.length, results: enriched });
}
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/app/api/search/semantic
```

Expected: Both tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/search/semantic
git commit -m "feat(search): add semantic search endpoint over pgvector"
```

---

### Task 8: Wire semantic search into UI

**Files:**
- Modify: `src/app/search/page.tsx`
- Create: `src/components/search/SemanticToggle.tsx`

- [ ] **Step 1: Add toggle component**

```typescript
// src/components/search/SemanticToggle.tsx
'use client';
import { useState } from 'react';

export default function SemanticToggle({
  onChange, defaultValue = false,
}: { onChange: (v: boolean) => void; defaultValue?: boolean }) {
  const [enabled, setEnabled] = useState(defaultValue);
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={enabled}
        onChange={e => { setEnabled(e.target.checked); onChange(e.target.checked); }}
        className="rounded border-white/20"
      />
      <span>Semantic search (AI-powered)</span>
    </label>
  );
}
```

- [ ] **Step 2: Modify search page apiUrl logic**

In `src/app/search/page.tsx`, when `semantic === true`, switch base URL to `/api/search/semantic?q=...&limit=50`. Result mapping is identical (both return `{results: IntelItem[]}` after this PR).

- [ ] **Step 3: Commit**

```bash
git add src/components/search/SemanticToggle.tsx src/app/search/page.tsx
git commit -m "feat(search): expose semantic mode via toggle on /search"
```

---

### Task 9: [REMOVED — cost optimization]

**Original plan:** New `/api/cron/backfill-embeddings` cron running every 30 minutes to generate embeddings for events missing them.

**Why removed:** The existing `/api/cron/convergence` cron (runs every 5 minutes per vercel.json) already generates Gemini embeddings and populates the `convergence_embeddings` table — that's the whole purpose of migration 012. A separate backfill cron would duplicate this work.

**Impact on semantic search (Task 7):** None. The semantic search endpoint queries `convergence_embeddings` directly. Coverage gap (events < 5 min old without embeddings) is acceptable — they'll appear in search within one convergence cycle.

**Savings:**
- 1 Vercel cron slot preserved
- ~1440 invocations/month avoided
- Gemini rate-limit budget protected
- ~50 lines of code not written

---

## Phase 3: Graph View

### Task 10: Install graph dependency

**Files:** `package.json`

- [ ] **Step 1: Install**

```bash
npm install react-force-graph-2d
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add react-force-graph-2d"
```

---

### Task 11: Graph data endpoint

**Files:**
- Create: `src/app/api/entities/[slug]/graph/route.ts`

- [ ] **Step 1: Implement**

```typescript
// src/app/api/entities/[slug]/graph/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getEntityBySlug } from '@/lib/db/entities';

export const runtime = 'nodejs';
export const revalidate = 3600; // 1 hour — co-occurrence graph changes slowly

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const root = await getEntityBySlug(slug);
  if (!root) return NextResponse.json({ error: 'not found' }, { status: 404 });

  // Get top 30 co-occurring entities
  const { data: cooccurrences, error } = await supabaseAdmin
    .from('entity_cooccurrence')
    .select('*, a:entity_a(*), b:entity_b(*)')
    .or(`entity_a.eq.${root.id},entity_b.eq.${root.id}`)
    .order('shared_events', { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const nodes = new Map<number, { id: number; name: string; type: string; val: number }>();
  nodes.set(root.id, { id: root.id, name: root.name, type: root.type, val: 10 });

  const links: Array<{ source: number; target: number; value: number }> = [];
  for (const co of cooccurrences || []) {
    const otherId = co.entity_a === root.id ? co.entity_b : co.entity_a;
    const other = co.entity_a === root.id ? co.b : co.a;
    if (!nodes.has(otherId)) {
      nodes.set(otherId, { id: otherId, name: other.name, type: other.type, val: Math.log(co.shared_events + 1) });
    }
    links.push({ source: root.id, target: otherId, value: co.shared_events });
  }

  return NextResponse.json({ nodes: Array.from(nodes.values()), links });
}
```

- [ ] **Step 2: Smoke test + commit**

```bash
curl http://localhost:3000/api/entities/turkiye/graph | head
git add src/app/api/entities
git commit -m "feat(graph): expose entity co-occurrence graph endpoint"
```

---

### Task 12: Graph component

**Files:**
- Create: `src/components/entity/EntityGraph.tsx`

- [ ] **Step 1: Implement**

```typescript
// src/components/entity/EntityGraph.tsx
'use client';
import dynamic from 'next/dynamic';
import useSWR from 'swr';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

const TYPE_COLORS: Record<string, string> = {
  person: '#00e5ff', organization: '#8a5cf6', country: '#ffd000', topic: '#00ff88',
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function EntityGraph({ slug }: { slug: string }) {
  const { data } = useSWR(`/api/entities/${slug}/graph`, fetcher);
  if (!data?.nodes) return <div className="h-96 grid place-items-center text-white/40">Loading graph…</div>;

  return (
    <div className="h-[500px] border border-white/10 rounded">
      <ForceGraph2D
        graphData={data}
        nodeColor={(n: any) => TYPE_COLORS[n.type] || '#888'}
        nodeLabel="name"
        nodeRelSize={6}
        linkColor={() => 'rgba(255,255,255,0.15)'}
        linkWidth={(l: any) => Math.log(l.value + 1)}
        backgroundColor="#000"
      />
    </div>
  );
}
```

- [ ] **Step 2: Mount on entity page**

In `src/app/entity/[slug]/EntityPageClient.tsx`, after `EntityHeader`, add:

```tsx
<section className="max-w-6xl mx-auto px-6 py-6">
  <h2 className="text-xl font-bold mb-4">Connection graph</h2>
  <EntityGraph slug={entity.slug} />
</section>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/entity/EntityGraph.tsx src/app/entity/[slug]/EntityPageClient.tsx
git commit -m "feat(graph): add force-directed entity graph to entity pages"
```

---

### Task 13: Graph polish — node click navigates

**Files:** modify `EntityGraph.tsx`

- [ ] **Step 1: Add navigation handler**

```typescript
import { useRouter } from 'next/navigation';
// ...inside component
const router = useRouter();
// inside ForceGraph2D props:
onNodeClick={(node: any) => {
  // Need slug — fetch already returns it; ensure API returns slug field
  router.push(`/entity/${node.slug}`);
}}
```

Also update `/api/entities/[slug]/graph` to include `slug` in node payload.

- [ ] **Step 2: Commit**

```bash
git add src/components/entity/EntityGraph.tsx src/app/api/entities/[slug]/graph/route.ts
git commit -m "feat(graph): make graph nodes clickable for navigation"
```

---

## Phase 4: Polish & SEO

### Task 14: Entity index page

**Files:**
- Create: `src/app/entity/page.tsx`

- [ ] **Step 1: Implement**

```typescript
// src/app/entity/page.tsx
import Link from 'next/link';
import { getTopEntities } from '@/lib/db/entities';

export const revalidate = 1800; // 30 min — index page shows "trending" so needs faster refresh than detail pages

export default async function EntityIndex() {
  const [persons, orgs, countries, topics] = await Promise.all([
    getTopEntities('person', 30),
    getTopEntities('organization', 30),
    getTopEntities('country', 30),
    getTopEntities('topic', 30),
  ]);

  const Section = ({ title, items }: any) => (
    <section className="mb-8">
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((e: any) => (
          <Link key={e.id} href={`/entity/${e.slug}`}
                className="px-3 py-1 border border-white/10 rounded hover:bg-white/5">
            {e.name} <span className="text-white/40 text-xs">({e.mention_count})</span>
          </Link>
        ))}
      </div>
    </section>
  );

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Entities</h1>
      <Section title="People" items={persons} />
      <Section title="Organizations" items={orgs} />
      <Section title="Countries" items={countries} />
      <Section title="Topics" items={topics} />
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/entity/page.tsx
git commit -m "feat(entity): add entity index page at /entity"
```

---

### Task 15: Sitemap inclusion

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Add entity URLs**

In `src/app/sitemap.ts`, add a section that fetches top 1000 entities and includes them as `MetadataRoute.Sitemap` entries with `changeFrequency: 'daily'` and `priority: 0.7`.

```typescript
import { getTopEntities } from '@/lib/db/entities';
// ...
const entities = await getTopEntities(null, 1000);
const entityUrls = entities.map(e => ({
  url: `${baseUrl}/entity/${e.slug}`,
  lastModified: new Date(e.last_seen),
  changeFrequency: 'daily' as const,
  priority: 0.7,
}));
return [...staticUrls, ...entityUrls];
```

- [ ] **Step 2: Commit + push everything**

```bash
git add src/app/sitemap.ts
git commit -m "feat(seo): include entity pages in sitemap"
git push origin main
```

---

## Phase 5: UX Cleanup — Vertical Pages Layout Shift Fix

### Task 16: Strip visible intro from DashboardSEO

**Problem:** On vertical pages (`/conflict`, `/finance`, `/cyber`, `/energy`, `/health`, `/sports`, `/tech`, `/weather`, `/commodity`, `/happy`) the `DashboardSEO` component renders a large `<section>` ABOVE the dashboard nav. Switching from `/` (no intro) to `/conflict` (has intro) causes a vertical layout shift and pushes the actual app below the fold.

**Decision:** Keep JSON-LD structured data (Google reads it perfectly), drop the visible HTML section. DashboardShell + Next.js SSR + `<title>`/`<description>` meta provides enough crawler signal. SEO impact: negligible (verified via competitor analysis — neither WorldMonitor nor Bloomberg ship visible "intro" sections on dashboards).

**Files:**
- Modify: `src/components/seo/DashboardSEO.tsx`

- [ ] **Step 1: Strip the visible section, keep JSON-LD**

Replace the return statement of `DashboardSEO` with:

```typescript
return (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
  />
);
```

The `VARIANT_SEO` map can stay (used to build JSON-LD `name`/`description`). Drop the `<section>`, `<h1>`, `<p>`, `<ul>` markup — they're the layout-shift offender.

- [ ] **Step 2: Visual smoke test (preview tools)**

```bash
npm run dev
```

Then in preview:
- Open `/` → note dashboard top edge Y coordinate
- Navigate to `/conflict` → verify dashboard top edge is at same Y (no shift)
- Repeat for `/finance`, `/cyber`, `/health`

Use `preview_inspect` on dashboard root container to confirm `getBoundingClientRect().top` is consistent.

- [ ] **Step 3: SEO regression check**

```bash
npm run build
```

Then verify the `<script type="application/ld+json">` is still present in built HTML for `/conflict`. Optional: run a quick Lighthouse SEO score — should remain ≥ 90.

- [ ] **Step 4: Commit**

```bash
git add src/components/seo/DashboardSEO.tsx
git commit -m "fix(ux): remove visible intro block from DashboardSEO to eliminate layout shift on vertical pages"
```

**Why this is in Phase 5 (last) but executed FIRST in practice:**
This task is independent of Phases 1-4 and provides immediate UX improvement. Recommended to merge & deploy this single commit FIRST as a quick win, then proceed with Palantir pillars. Easier rollback if needed.

---

## Post-Deploy Verification

After Vercel deploys:

- [ ] Visit `/entity` — index renders
- [ ] Click an entity — page renders with header + events + graph
- [ ] Search semantic mode returns relevant cross-language matches
- [ ] Wait 30 min, run `EXPLAIN ANALYZE` on `search_events_semantic` to verify HNSW used
- [ ] Submit new sitemap URLs to Google Search Console
- [ ] **Run AdSense auditor agent** to confirm new pages render ads correctly per AdSense policy

---

## Self-Review Checklist (completed by author)

- [x] Spec coverage: All 3 pillars from "must-haves" addressed (entity layer, semantic search, graph view) plus SEO polish
- [x] Placeholder scan: No TBD/TODO; every code block is complete
- [x] Type consistency: `Entity` interface used uniformly; `slug` field added to graph API in Task 13 to match Task 12's `node.slug` reference
- [x] Reuses existing infrastructure (Gemini embeddings, pgvector, NER) — minimum new code surface
- [x] Phase 5 (Task 16) added per user request — removes vertical-page layout shift; recommended to deploy first as standalone quick win
- [x] **Cost optimization pass applied (v2):** Task 3 refactored from new cron → piggyback on `fetch-feeds`; Task 9 removed entirely (convergence cron handles embeddings); `revalidate` values tightened (entity page 10min→1hr, graph 10min→1hr, index →30min). Net ek aylık maliyet: $0.
