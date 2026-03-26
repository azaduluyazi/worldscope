# Convergence Engine Design

## Overview
Multi-signal convergence system that correlates events across 60+ data sources to detect when multiple independent signals point to the same geopolitical, economic, or security event. Replaces the need for external APIs like worldmonitor.app.

## Architecture
Hybrid approach: rule-based correlation (instant, on every critical event) + LLM narrative synthesis (cron, every 5 minutes for confirmed convergences).

### Layers
1. **Source Reliability** — Static baseline per source + dynamic modifier from gateway health
2. **Correlation Detector** — Time-window (±2h), geo-proximity (50km), cross-category matching
3. **Impact Chain** — Predefined causal rules (conflict→energy→finance) with confidence scores
4. **Convergence Scorer** — Weighted average of signal reliabilities × correlation strength
5. **LLM Narrative** — Groq/OpenAI summary for convergences with confidence > 0.7

### Trigger Mechanism
- **Instant:** Every critical/high severity event triggers a correlation check against recent events
- **Cron (5min):** Full sweep of all events in the last 6 hours, generates/updates convergences

### Data Flow
```
Intel Route (60+ sources) → IntelItem[]
  → Source Reliability scoring
  → Correlation Detector (time + geo + category matching)
  → Impact Chain resolution
  → Convergence Scorer (confidence calculation)
  → LLM Narrative (if confidence > 0.7)
  → Redis cache (5min TTL) + Supabase persist (6h TTL)
  → ConvergencePanel UI + Map markers
```

## Data Models

### Convergence
```typescript
interface Convergence {
  id: string;
  type: ConvergenceType;
  confidence: number;          // 0.0-1.0
  signals: ConvergenceSignal[];
  impactChain: ImpactLink[];
  narrative?: string;
  timeline: { start: string; end: string };
  location: { lat: number; lng: number };
  affectedRegions: string[];
  createdAt: string;
  expiresAt: string;           // 6h TTL
}

interface ConvergenceSignal {
  sourceId: string;
  eventId: string;
  category: Category;
  severity: Severity;
  reliability: number;
  role: "trigger" | "consequence" | "reaction";
  title: string;
}

interface ImpactLink {
  from: Category;
  to: Category;
  confidence: number;
  description: string;
}
```

### Source Reliability Tiers
- Tier 1 (0.90-0.95): oref, usgs, gdacs, nasa-eonet, who
- Tier 2 (0.75-0.85): gdelt, reliefweb, cloudflare-radar, entsoe, eia
- Tier 3 (0.60-0.70): cyber-threats, espn-sports, hackernews, nvd-cve
- Tier 4 (0.40-0.55): crisis-news, crypto-news, good-news, RSS feeds
- Dynamic modifier: gateway uptime >95% → +0.05, circuit open → -0.20

### Impact Chain Rules
- conflict → energy (0.85)
- conflict → finance (0.80)
- energy → finance (0.90)
- cyber → finance (0.75)
- cyber → energy (0.70)
- natural → health (0.80)
- natural → energy (0.65)
- conflict → health (0.70)
- conflict → diplomacy (0.85)

## File Structure
```
src/lib/convergence/
  ├── engine.ts              // Main orchestrator
  ├── source-reliability.ts  // Static + dynamic source scores
  ├── correlation-detector.ts // Time-geo-category matching
  ├── impact-chain.ts        // Cross-category causality
  ├── scorer.ts              // Confidence calculation
  ├── narrative.ts           // LLM summary via Vercel AI SDK
  └── types.ts               // TypeScript types

src/app/api/convergence/route.ts    // GET endpoint
src/app/api/cron/convergence/route.ts // 5min cron
src/components/dashboard/ConvergencePanel.tsx // Replaces LiveWebcams
src/hooks/useConvergence.ts          // SWR data hook
```

## UI: ConvergencePanel
Replaces LiveWebcams component in DashboardShell.
- Header: "SIGNAL CONVERGENCE" with pulse indicator and count
- Cards: confidence bar, signal list, impact chain arrows, AI narrative
- Map integration: click card → zoom to convergence location
- Color coding: >0.85 red, >0.7 yellow, >0.5 cyan

## Correlation Algorithm
1. Group events by 50km geo-proximity (haversine distance)
2. Within each geo-group, filter to ±2h time window
3. Require minimum 2 different categories
4. Score = weighted average of (signal_reliability × severity_weight)
5. Apply impact chain bonus if matching causal rule exists
6. Confidence = min(1.0, score × chain_bonus)
