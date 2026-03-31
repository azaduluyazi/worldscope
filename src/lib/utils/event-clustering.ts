import type { IntelItem } from "@/types/intel";
import { SEVERITY_ORDER } from "@/types/intel";

export interface EventCluster {
  id: string;
  items: IntelItem[];
  primaryTitle: string;
  sourceCount: number;
  commonEntities: string[];
}

/** Stop-words excluded from title overlap calculation */
const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "to", "of", "in", "for",
  "on", "with", "at", "by", "from", "as", "into", "through", "during",
  "before", "after", "above", "below", "between", "and", "but", "or",
  "nor", "not", "no", "so", "if", "than", "that", "this", "it", "its",
  "up", "out", "about", "over", "new", "says", "said", "also", "more",
]);

/** Tokenize a title into meaningful lowercase words */
function tokenize(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/** Calculate word overlap ratio between two word sets */
function overlapRatio(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let shared = 0;
  for (const word of setA) {
    if (setB.has(word)) shared++;
  }
  const total = new Set([...setA, ...setB]).size;
  return total === 0 ? 0 : shared / total;
}

/** Union-Find data structure for merging clusters */
class UnionFind {
  private parent: number[];
  private rank: number[];

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }

  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(x: number, y: number): void {
    const px = this.find(x);
    const py = this.find(y);
    if (px === py) return;
    if (this.rank[px] < this.rank[py]) {
      this.parent[px] = py;
    } else if (this.rank[px] > this.rank[py]) {
      this.parent[py] = px;
    } else {
      this.parent[py] = px;
      this.rank[px]++;
    }
  }
}

/**
 * Cluster related events by title similarity within a time window.
 *
 * Algorithm:
 * 1. For each pair of items within 4h of each other, calculate title word overlap
 * 2. If overlap > 40%, they are related — union them
 * 3. Pick the highest-severity item as primary
 * 4. Extract common entities (words appearing in >50% of cluster titles)
 * 5. Filter clusters with >= 2 items (single-source = no comparison)
 * 6. Sort by cluster size descending
 * 7. Return top maxClusters (default 20)
 */
export function clusterRelatedEvents(
  items: IntelItem[],
  maxClusters = 20
): EventCluster[] {
  if (items.length === 0) return [];

  const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
  const OVERLAP_THRESHOLD = 0.4;

  // Pre-tokenize all titles
  const tokens = items.map((item) => tokenize(item.title));
  const timestamps = items.map((item) => new Date(item.publishedAt).getTime());

  // Build union-find structure
  const uf = new UnionFind(items.length);

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      // Check time proximity
      if (Math.abs(timestamps[i] - timestamps[j]) > FOUR_HOURS_MS) continue;

      // Check title similarity
      if (overlapRatio(tokens[i], tokens[j]) > OVERLAP_THRESHOLD) {
        uf.union(i, j);
      }
    }
  }

  // Group items by their cluster root
  const groups = new Map<number, number[]>();
  for (let i = 0; i < items.length; i++) {
    const root = uf.find(i);
    const group = groups.get(root);
    if (group) {
      group.push(i);
    } else {
      groups.set(root, [i]);
    }
  }

  // Build clusters
  const clusters: EventCluster[] = [];

  for (const indices of groups.values()) {
    // Filter out single-source clusters
    if (indices.length < 2) continue;

    const clusterItems = indices.map((i) => items[i]);

    // Pick highest-severity item as primary
    const primary = clusterItems.reduce((best, item) =>
      SEVERITY_ORDER[item.severity] < SEVERITY_ORDER[best.severity] ? item : best
    );

    // Extract common entities: words appearing in >50% of titles
    const allTokenSets = indices.map((i) => new Set(tokens[i]));
    const wordCounts = new Map<string, number>();
    for (const tokenSet of allTokenSets) {
      for (const word of tokenSet) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }

    const threshold = indices.length * 0.5;
    const commonEntities = [...wordCounts.entries()]
      .filter(([, count]) => count >= threshold)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);

    // Count unique sources
    const uniqueSources = new Set(clusterItems.map((item) => item.source));

    clusters.push({
      id: primary.id,
      items: clusterItems,
      primaryTitle: primary.title,
      sourceCount: uniqueSources.size,
      commonEntities,
    });
  }

  // Sort by cluster size descending
  clusters.sort((a, b) => b.items.length - a.items.length);

  return clusters.slice(0, maxClusters);
}
