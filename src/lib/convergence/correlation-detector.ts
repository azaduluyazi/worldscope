import type { IntelItem, Category } from "@/types/intel";
import type { GeoCluster, ClusterEvent } from "./types";
import { getBulkReliability } from "./source-reliability";

// ── Configuration ──────────────────────────────────────

const GEO_RADIUS_KM = 50;           // Max distance for geo-clustering
const TIME_WINDOW_MS = 2 * 60 * 60 * 1000; // ±2 hours
const MIN_CATEGORIES = 2;           // Minimum different categories for convergence
const MIN_SIGNALS = 2;              // Minimum signals in a cluster

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

// ── Geo Clustering ─────────────────────────────────────

/**
 * Group geo-tagged events into clusters within GEO_RADIUS_KM.
 * Uses single-linkage clustering: if event is within radius of any
 * existing cluster member, it joins that cluster.
 */
function clusterByProximity(events: ClusterEvent[]): GeoCluster[] {
  const clusters: GeoCluster[] = [];

  for (const event of events) {
    let merged = false;

    for (const cluster of clusters) {
      const dist = haversineKm(
        cluster.centroid.lat,
        cluster.centroid.lng,
        event.lat,
        event.lng
      );

      if (dist <= GEO_RADIUS_KM) {
        cluster.events.push(event);
        // Update centroid as running average
        const n = cluster.events.length;
        cluster.centroid.lat = ((cluster.centroid.lat * (n - 1)) + event.lat) / n;
        cluster.centroid.lng = ((cluster.centroid.lng * (n - 1)) + event.lng) / n;
        cluster.radius = Math.max(cluster.radius, dist);
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

// ── Time Window Filter ─────────────────────────────────

/**
 * Within a geo-cluster, find sub-groups where events fall within ±2h of each other.
 * Returns groups that have events from MIN_CATEGORIES different categories.
 */
function findTemporalGroups(cluster: GeoCluster): ClusterEvent[][] {
  const sorted = [...cluster.events].sort(
    (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );

  const groups: ClusterEvent[][] = [];

  for (let i = 0; i < sorted.length; i++) {
    const anchor = new Date(sorted[i].publishedAt).getTime();
    const group: ClusterEvent[] = [sorted[i]];

    for (let j = i + 1; j < sorted.length; j++) {
      const t = new Date(sorted[j].publishedAt).getTime();
      if (Math.abs(t - anchor) <= TIME_WINDOW_MS) {
        group.push(sorted[j]);
      }
    }

    if (group.length >= MIN_SIGNALS) {
      const categories = new Set(group.map((e) => e.category));
      if (categories.size >= MIN_CATEGORIES) {
        // Check we haven't already captured a superset of this group
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
  centroid: { lat: number; lng: number };
  categories: Category[];
  timeSpan: { start: string; end: string };
}

/**
 * Detect correlated event groups from raw intel items.
 *
 * Algorithm:
 * 1. Filter to geo-tagged events within the last 6 hours
 * 2. Enrich with source reliability scores
 * 3. Cluster by geographic proximity (50km)
 * 4. Within each cluster, find temporal groups (±2h window)
 * 5. Filter to groups with 2+ different categories
 */
export function detectCorrelations(
  items: IntelItem[],
  hoursBack = 6
): CorrelationGroup[] {
  const cutoff = Date.now() - hoursBack * 60 * 60 * 1000;

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
  const clusterEvents: ClusterEvent[] = geoEvents.map((item) => ({
    eventId: item.id,
    sourceId: item.source,
    category: item.category,
    severity: item.severity,
    reliability: reliabilityMap.get(item.source)?.dynamicScore ?? 0.45,
    title: item.title,
    lat: item.lat!,
    lng: item.lng!,
    publishedAt: item.publishedAt,
  }));

  // Step 3: Geo-cluster
  const geoClusters = clusterByProximity(clusterEvents);

  // Step 4 & 5: Find temporal multi-category groups
  const correlations: CorrelationGroup[] = [];

  for (const cluster of geoClusters) {
    const temporalGroups = findTemporalGroups(cluster);

    for (const group of temporalGroups) {
      const categories = [...new Set(group.map((e) => e.category))];
      const times = group.map((e) => new Date(e.publishedAt).getTime());

      correlations.push({
        events: group,
        centroid: cluster.centroid,
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
 * Quick check: does a single new event correlate with existing recent events?
 * Used for instant trigger on critical/high events.
 */
export function checkEventCorrelation(
  newEvent: IntelItem,
  recentEvents: IntelItem[]
): CorrelationGroup | null {
  if (!newEvent.lat || !newEvent.lng) return null;

  const cutoff = Date.now() - TIME_WINDOW_MS;
  const nearby = recentEvents.filter((item) => {
    if (!item.lat || !item.lng) return false;
    if (item.id === newEvent.id) return false;
    if (new Date(item.publishedAt).getTime() < cutoff) return false;
    if (item.category === newEvent.category) return false; // Need different category

    const dist = haversineKm(newEvent.lat!, newEvent.lng!, item.lat!, item.lng!);
    return dist <= GEO_RADIUS_KM;
  });

  if (nearby.length === 0) return null;

  const sourceIds = [newEvent.source, ...nearby.map((e) => e.source)];
  const reliabilityMap = getBulkReliability([...new Set(sourceIds)]);

  const allEvents: ClusterEvent[] = [newEvent, ...nearby].map((item) => ({
    eventId: item.id,
    sourceId: item.source,
    category: item.category,
    severity: item.severity,
    reliability: reliabilityMap.get(item.source)?.dynamicScore ?? 0.45,
    title: item.title,
    lat: item.lat!,
    lng: item.lng!,
    publishedAt: item.publishedAt,
  }));

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
