import type { IntelItem, Category } from "@/types/intel";

// ── Types ──────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;          // country code (ISO 3166-1 alpha-2)
  label: string;       // country name
  region: string;
  size: number;        // based on event count
  x: number;
  y: number;
}

export interface GraphEdge {
  source: string;      // country code
  target: string;      // country code
  weight: number;      // co-occurrence count
  type: "conflict" | "trade" | "alliance" | "diplomatic";
}

export interface RelationshipGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ── Country code → name + region mapping ────────────────────────────

const COUNTRY_INFO: Record<string, { name: string; region: string }> = {
  US: { name: "United States", region: "americas" },
  CA: { name: "Canada", region: "americas" },
  MX: { name: "Mexico", region: "americas" },
  BR: { name: "Brazil", region: "americas" },
  AR: { name: "Argentina", region: "americas" },
  CO: { name: "Colombia", region: "americas" },
  CL: { name: "Chile", region: "americas" },
  PE: { name: "Peru", region: "americas" },
  GB: { name: "United Kingdom", region: "europe" },
  DE: { name: "Germany", region: "europe" },
  FR: { name: "France", region: "europe" },
  IT: { name: "Italy", region: "europe" },
  ES: { name: "Spain", region: "europe" },
  PL: { name: "Poland", region: "europe" },
  NL: { name: "Netherlands", region: "europe" },
  SE: { name: "Sweden", region: "europe" },
  NO: { name: "Norway", region: "europe" },
  FI: { name: "Finland", region: "europe" },
  UA: { name: "Ukraine", region: "europe" },
  RO: { name: "Romania", region: "europe" },
  GR: { name: "Greece", region: "europe" },
  PT: { name: "Portugal", region: "europe" },
  CZ: { name: "Czech Republic", region: "europe" },
  HU: { name: "Hungary", region: "europe" },
  AT: { name: "Austria", region: "europe" },
  CH: { name: "Switzerland", region: "europe" },
  BE: { name: "Belgium", region: "europe" },
  DK: { name: "Denmark", region: "europe" },
  RU: { name: "Russia", region: "asia" },
  CN: { name: "China", region: "asia" },
  JP: { name: "Japan", region: "asia" },
  KR: { name: "South Korea", region: "asia" },
  KP: { name: "North Korea", region: "asia" },
  IN: { name: "India", region: "asia" },
  PK: { name: "Pakistan", region: "asia" },
  BD: { name: "Bangladesh", region: "asia" },
  TH: { name: "Thailand", region: "asia" },
  VN: { name: "Vietnam", region: "asia" },
  ID: { name: "Indonesia", region: "asia" },
  MY: { name: "Malaysia", region: "asia" },
  PH: { name: "Philippines", region: "asia" },
  TW: { name: "Taiwan", region: "asia" },
  MM: { name: "Myanmar", region: "asia" },
  AF: { name: "Afghanistan", region: "asia" },
  TR: { name: "Turkey", region: "middle_east" },
  IL: { name: "Israel", region: "middle_east" },
  IR: { name: "Iran", region: "middle_east" },
  IQ: { name: "Iraq", region: "middle_east" },
  SA: { name: "Saudi Arabia", region: "middle_east" },
  AE: { name: "UAE", region: "middle_east" },
  SY: { name: "Syria", region: "middle_east" },
  YE: { name: "Yemen", region: "middle_east" },
  LB: { name: "Lebanon", region: "middle_east" },
  JO: { name: "Jordan", region: "middle_east" },
  PS: { name: "Palestine", region: "middle_east" },
  EG: { name: "Egypt", region: "africa" },
  ZA: { name: "South Africa", region: "africa" },
  NG: { name: "Nigeria", region: "africa" },
  KE: { name: "Kenya", region: "africa" },
  ET: { name: "Ethiopia", region: "africa" },
  SD: { name: "Sudan", region: "africa" },
  LY: { name: "Libya", region: "africa" },
  SO: { name: "Somalia", region: "africa" },
  CD: { name: "DR Congo", region: "africa" },
  ML: { name: "Mali", region: "africa" },
  AU: { name: "Australia", region: "oceania" },
  NZ: { name: "New Zealand", region: "oceania" },
};

// ── Category → edge type mapping ────────────────────────────────────

function categoryToEdgeType(cat: Category): GraphEdge["type"] {
  switch (cat) {
    case "conflict":
    case "protest":
      return "conflict";
    case "finance":
    case "energy":
      return "trade";
    case "diplomacy":
      return "diplomatic";
    default:
      return "alliance";
  }
}

// ── Simple force-directed layout ────────────────────────────────────

function applyForceLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  iterations = 50
): void {
  const W = 800;
  const H = 600;
  const REPULSION = 5000;
  const ATTRACTION = 0.005;
  const DAMPING = 0.9;
  const MIN_DIST = 40;

  // Initialize positions in a circle
  const cx = W / 2;
  const cy = H / 2;
  const radius = Math.min(W, H) * 0.35;
  for (let i = 0; i < nodes.length; i++) {
    const angle = (2 * Math.PI * i) / nodes.length;
    nodes[i].x = cx + radius * Math.cos(angle);
    nodes[i].y = cy + radius * Math.sin(angle);
  }

  // Build edge lookup
  const edgeLookup = new Map<string, string[]>();
  for (const edge of edges) {
    if (!edgeLookup.has(edge.source)) edgeLookup.set(edge.source, []);
    if (!edgeLookup.has(edge.target)) edgeLookup.set(edge.target, []);
    edgeLookup.get(edge.source)!.push(edge.target);
    edgeLookup.get(edge.target)!.push(edge.source);
  }

  // Node index lookup
  const nodeIdx = new Map<string, number>();
  for (let i = 0; i < nodes.length; i++) nodeIdx.set(nodes[i].id, i);

  const vx = new Float64Array(nodes.length);
  const vy = new Float64Array(nodes.length);

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all node pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        let dx = nodes[j].x - nodes[i].x;
        let dy = nodes[j].y - nodes[i].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), MIN_DIST);
        const force = REPULSION / (dist * dist);
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        vx[i] -= dx;
        vy[i] -= dy;
        vx[j] += dx;
        vy[j] += dy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const si = nodeIdx.get(edge.source);
      const ti = nodeIdx.get(edge.target);
      if (si === undefined || ti === undefined) continue;

      const dx = nodes[ti].x - nodes[si].x;
      const dy = nodes[ti].y - nodes[si].y;
      const force = ATTRACTION * edge.weight;
      vx[si] += dx * force;
      vy[si] += dy * force;
      vx[ti] -= dx * force;
      vy[ti] -= dy * force;
    }

    // Apply velocities with damping and boundary clamping
    for (let i = 0; i < nodes.length; i++) {
      vx[i] *= DAMPING;
      vy[i] *= DAMPING;
      nodes[i].x += vx[i];
      nodes[i].y += vy[i];
      // Keep within bounds (with padding)
      nodes[i].x = Math.max(40, Math.min(W - 40, nodes[i].x));
      nodes[i].y = Math.max(40, Math.min(H - 40, nodes[i].y));
    }
  }
}

// ── Main builder ────────────────────────────────────────────────────

/**
 * Build a relationship graph from intelligence events.
 *
 * Nodes = countries (by countryCode) with >= 3 events.
 * Edges = co-occurrence of two countries in same category within 2h window,
 *         with weight >= 2.
 */
export function buildRelationshipGraph(items: IntelItem[]): RelationshipGraph {
  // 1. Count events per country
  const countryCounts = new Map<string, number>();
  for (const item of items) {
    const cc = item.countryCode?.toUpperCase();
    if (!cc || !COUNTRY_INFO[cc]) continue;
    countryCounts.set(cc, (countryCounts.get(cc) || 0) + 1);
  }

  // 2. Build co-occurrence edges
  //    Two countries co-occur if they appear in events of the same category
  //    within a 2-hour window.
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const edgeCounts = new Map<string, { weight: number; type: GraphEdge["type"] }>();

  // Group items by category for efficiency
  const byCategory = new Map<Category, IntelItem[]>();
  for (const item of items) {
    if (!item.countryCode) continue;
    const list = byCategory.get(item.category) || [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  for (const [category, catItems] of byCategory) {
    // Sort by time for sliding window
    const sorted = catItems
      .filter((it) => it.countryCode)
      .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());

    for (let i = 0; i < sorted.length; i++) {
      const tA = new Date(sorted[i].publishedAt).getTime();
      const ccA = sorted[i].countryCode!.toUpperCase();

      for (let j = i + 1; j < sorted.length; j++) {
        const tB = new Date(sorted[j].publishedAt).getTime();
        if (tB - tA > TWO_HOURS) break; // outside window

        const ccB = sorted[j].countryCode!.toUpperCase();
        if (ccA === ccB) continue;
        if (!COUNTRY_INFO[ccA] || !COUNTRY_INFO[ccB]) continue;

        // Canonical edge key (alphabetical order)
        const key = ccA < ccB ? `${ccA}:${ccB}` : `${ccB}:${ccA}`;
        const existing = edgeCounts.get(key);
        if (existing) {
          existing.weight++;
        } else {
          edgeCounts.set(key, { weight: 1, type: categoryToEdgeType(category) });
        }
      }
    }
  }

  // 3. Filter: nodes with >= 3 events, edges with weight >= 2
  const MIN_EVENTS = 3;
  const MIN_WEIGHT = 2;

  const validCountries = new Set<string>();
  for (const [cc, count] of countryCounts) {
    if (count >= MIN_EVENTS) validCountries.add(cc);
  }

  const edges: GraphEdge[] = [];
  for (const [key, data] of edgeCounts) {
    if (data.weight < MIN_WEIGHT) continue;
    const [source, target] = key.split(":");
    if (!validCountries.has(source) || !validCountries.has(target)) continue;
    edges.push({ source, target, weight: data.weight, type: data.type });
  }

  // Ensure nodes referenced by edges are included
  const nodesInEdges = new Set<string>();
  for (const e of edges) {
    nodesInEdges.add(e.source);
    nodesInEdges.add(e.target);
  }
  for (const cc of nodesInEdges) validCountries.add(cc);

  // 4. Build nodes
  const nodes: GraphNode[] = [];
  for (const cc of validCountries) {
    const info = COUNTRY_INFO[cc];
    if (!info) continue;
    nodes.push({
      id: cc,
      label: info.name,
      region: info.region,
      size: countryCounts.get(cc) || 1,
      x: 0,
      y: 0,
    });
  }

  // 5. Apply force-directed layout
  if (nodes.length > 0) {
    applyForceLayout(nodes, edges);
  }

  return { nodes, edges };
}
