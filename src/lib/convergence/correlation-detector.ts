import type { IntelItem, Category } from "@/types/intel";
import type { GeoCluster, ClusterEvent } from "./types";
import { getBulkReliability } from "./source-reliability";
import {
  CATEGORY_GEO_RADIUS_KM,
  CATEGORY_TIME_WINDOWS,
  getGeoRadiusForSet,
  getTimeWindowForSet,
} from "./time-windows";

// ═══════════════════════════════════════════════════════════════════
//  Correlation Detector (v2 — Category-Aware Windows)
// ═══════════════════════════════════════════════════════════════════
//
//  v1 → v2 changes:
//  ----------------
//    OLD: GEO_RADIUS_KM = 50, TIME_WINDOW_MS = 2h (constants for all)
//    NEW: per-category radii from time-windows.ts. The dominant
//         category in a cluster sets the effective window/radius.
//
//  Key implication: an earthquake (radius 500km) can correlate with a
//  finance reaction 400km away within its 4h window. Previously this
//  pair was IMPOSSIBLE to detect (50km / 2h was way too tight for the
//  natural-disaster cascade case).
//
// ═══════════════════════════════════════════════════════════════════

const MIN_CATEGORIES = 2;
const MIN_SIGNALS = 2;

// Maximum geo radius across all categories — used as the upper bound
// for the initial geo-clustering pass. Tighter per-cluster filtering
// happens later when categories are known.
const MAX_GEO_RADIUS_KM = Math.max(...Object.values(CATEGORY_GEO_RADIUS_KM));
// Maximum time window — same logic
const MAX_TIME_WINDOW_MS = Math.max(...Object.values(CATEGORY_TIME_WINDOWS));

// ── Haversine Distance ─────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Geo Clustering (broad pass — uses MAX radius) ───────────────────

/**
 * First-pass geo clustering using the MAXIMUM possible radius (1000km
 * for cyber/diplomacy/tech). This produces "candidate" clusters that
 * are then narrowed down by the category-specific radius in step 2.
 *
 * Single-linkage clustering: an event joins a cluster if it's within
 * the radius of ANY existing member of that cluster.
 */
function clusterByProximity(events: ClusterEvent[]): GeoCluster[] {
  const clusters: GeoCluster[] = [];

  for (const event of events) {
    let merged = false;

    for (const cluster of clusters) {
      // Check distance to all members (not just centroid) for tighter clustering
      const minDist = Math.min(
        ...cluster.events.map((e) => haversineKm(e.lat, e.lng, event.lat, event.lng))
      );

      if (minDist <= MAX_GEO_RADIUS_KM) {
        cluster.events.push(event);
        // Update centroid as running average
        const n = cluster.events.length;
        cluster.centroid.lat = ((cluster.centroid.lat * (n - 1)) + event.lat) / n;
        cluster.centroid.lng = ((cluster.centroid.lng * (n - 1)) + event.lng) / n;
        cluster.radius = Math.max(cluster.radius, minDist);
        merged = true;
        break;
      }
    }

    if (!merged) {
      clusters.push({
        centroid: { lat: event.lat, lng: event.lng },
        events: [event],
        radius: 0,
      });
    }
  }

  return clusters;
}

// ── Temporal Sub-grouping (category-aware) ──────────────────────────

/**
 * Within a geo-cluster, find sub-groups whose events fall within the
 * effective time window for their categories AND whose pairwise
 * distances respect each pair's category geo radius.
 */
function findTemporalGroups(cluster: GeoCluster): ClusterEvent[][] {
  const sorted = [...cluster.events].sort(
    (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );

  const groups: ClusterEvent[][] = [];

  for (let i = 0; i < sorted.length; i++) {
    const anchor = sorted[i];
    const anchorTime = new Date(anchor.publishedAt).getTime();
    const group: ClusterEvent[] = [anchor];

    for (let j = i + 1; j < sorted.length; j++) {
      const cand = sorted[j];
      const candTime = new Date(cand.publishedAt).getTime();

      // Determine effective window for this anchor+candidate pair (max of their categories)
      const pairWindow = getTimeWindowForSet([anchor.category, cand.category]);
      if (Math.abs(candTime - anchorTime) > pairWindow) continue;

      // Determine effective radius for this pair
      const pairRadius = getGeoRadiusForSet([anchor.category, cand.category]);
      const dist = haversineKm(anchor.lat, anchor.lng, cand.lat, cand.lng);
      if (dist > pairRadius) continue;

      group.push(cand);
    }

    if (group.length >= MIN_SIGNALS) {
      const categories = new Set(group.map((e) => e.category));
      if (categories.size >= MIN_CATEGORIES) {
        // Dedup: skip if a superset of this group already exists
        const ids = new Set(group.map((e) => e.eventId));
        const isDuplicate = groups.some((existing) => {
          const existingIds = new Set(existing.map((e) => e.eventId));
          return [...ids].every((id) => existingIds.has(id));
        });
        if (!isDuplicate) {
          groups.push(group);
        }
      }
    }
  }

  return groups;
}

// ── Main Detector ──────────────────────────────────────

export interface CorrelationGroup {
  events: ClusterEvent[];
  /**
   * Geographic centroid of the cluster. For topic-only clusters (where
   * events lack lat/lng and are grouped by semantic similarity instead
   * of Haversine), this is set to the sentinel { lat: 0, lng: 0 } —
   * downstream consumers should check `isTopic` before treating it as
   * a real location.
   */
  centroid: { lat: number; lng: number };
  categories: Category[];
  timeSpan: { start: string; end: string };
  /**
   * True when this cluster was produced by the topic-detector track
   * instead of the geographic track. Topic clusters contain events
   * without lat/lng and are grouped by embedding similarity.
   */
  isTopic?: boolean;
}

/**
 * Detect correlated event groups from raw intel items.
 *
 * Algorithm v2:
 * 1. Filter to geo-tagged events within the maximum-needed lookback
 * 2. Enrich with source reliability scores
 * 3. Coarse geo-clustering with MAX radius (catches all candidates)
 * 4. Within each cluster, find temporal sub-groups using
 *    category-specific time windows AND category-specific geo radii
 * 5. Filter to groups with 2+ different categories
 */
export function detectCorrelations(
  items: IntelItem[],
  hoursBack?: number
): CorrelationGroup[] {
  // If hoursBack not specified, use the largest possible window so we
  // don't accidentally chop off slow-cascading events (diplomacy 24h).
  const lookbackMs = hoursBack
    ? hoursBack * 60 * 60 * 1000
    : MAX_TIME_WINDOW_MS;
  const cutoff = Date.now() - lookbackMs;

  // Step 1: Filter geo-tagged + recent events
  const geoEvents = items.filter(
    (item) =>
      item.lat != null &&
      item.lng != null &&
      new Date(item.publishedAt).getTime() >= cutoff
  );

  if (geoEvents.length < MIN_SIGNALS) return [];

  // Step 2: Get bulk reliability scores
  const sourceIds = [...new Set(geoEvents.map((e) => e.source))];
  const reliabilityMap = getBulkReliability(sourceIds);

  // Convert to ClusterEvent
  const clusterEvents: ClusterEvent[] = geoEvents.map((item) => {
    const rel = reliabilityMap.get(item.source);
    return {
      eventId: item.id,
      sourceId: item.source,
      category: item.category,
      severity: item.severity,
      reliability: rel?.dynamicScore ?? 0.45,
      tier: rel?.tier ?? 3, // default to T3 for unknown sources
      title: item.title,
      lat: item.lat!,
      lng: item.lng!,
      publishedAt: item.publishedAt,
    };
  });

  // Step 3: Coarse geo-cluster
  const geoClusters = clusterByProximity(clusterEvents);

  // Step 4 & 5: Find temporal multi-category groups with category-aware constraints
  const correlations: CorrelationGroup[] = [];

  for (const cluster of geoClusters) {
    const temporalGroups = findTemporalGroups(cluster);

    for (const group of temporalGroups) {
      const categories = [...new Set(group.map((e) => e.category))];
      const times = group.map((e) => new Date(e.publishedAt).getTime());

      // Recompute centroid from this specific group (not the broad cluster)
      const groupCentroid = {
        lat: group.reduce((s, e) => s + e.lat, 0) / group.length,
        lng: group.reduce((s, e) => s + e.lng, 0) / group.length,
      };

      correlations.push({
        events: group,
        centroid: groupCentroid,
        categories,
        timeSpan: {
          start: new Date(Math.min(...times)).toISOString(),
          end: new Date(Math.max(...times)).toISOString(),
        },
      });
    }
  }

  // Sort by number of signals (more signals = higher priority)
  return correlations.sort((a, b) => b.events.length - a.events.length);
}

/**
 * Quick check: does a single new event correlate with existing recent
 * events? Used for instant trigger on critical/high events.
 *
 * v2: uses category-specific windows just like the batch detector.
 */
export function checkEventCorrelation(
  newEvent: IntelItem,
  recentEvents: IntelItem[]
): CorrelationGroup | null {
  if (!newEvent.lat || !newEvent.lng) return null;

  // Find candidates within the WIDEST possible window (we'll narrow per-pair)
  const newTime = new Date(newEvent.publishedAt).getTime();
  const cutoff = newTime - MAX_TIME_WINDOW_MS;

  const candidates = recentEvents.filter((item) => {
    if (!item.lat || !item.lng) return false;
    if (item.id === newEvent.id) return false;

    const itemTime = new Date(item.publishedAt).getTime();
    if (itemTime < cutoff) return false;

    // Apply pair-specific time window
    const pairWindow = getTimeWindowForSet([newEvent.category, item.category]);
    if (Math.abs(itemTime - newTime) > pairWindow) return false;

    // Apply pair-specific geo radius
    const pairRadius = getGeoRadiusForSet([newEvent.category, item.category]);
    const dist = haversineKm(newEvent.lat!, newEvent.lng!, item.lat!, item.lng!);
    if (dist > pairRadius) return false;

    // Need DIFFERENT category to count as cross-signal correlation
    if (item.category === newEvent.category) return false;

    return true;
  });

  if (candidates.length === 0) return null;

  const sourceIds = [newEvent.source, ...candidates.map((e) => e.source)];
  const reliabilityMap = getBulkReliability([...new Set(sourceIds)]);

  const allEvents: ClusterEvent[] = [newEvent, ...candidates].map((item) => {
    const rel = reliabilityMap.get(item.source);
    return {
      eventId: item.id,
      sourceId: item.source,
      category: item.category,
      severity: item.severity,
      reliability: rel?.dynamicScore ?? 0.45,
      tier: rel?.tier ?? 3,
      title: item.title,
      lat: item.lat!,
      lng: item.lng!,
      publishedAt: item.publishedAt,
    };
  });

  const categories = [...new Set(allEvents.map((e) => e.category))];
  if (categories.length < MIN_CATEGORIES) return null;

  const times = allEvents.map((e) => new Date(e.publishedAt).getTime());

  return {
    events: allEvents,
    centroid: { lat: newEvent.lat!, lng: newEvent.lng! },
    categories,
    timeSpan: {
      start: new Date(Math.min(...times)).toISOString(),
      end: new Date(Math.max(...times)).toISOString(),
    },
  };
}
