# Faz 12: Advanced Analytics & Reporting — Design Spec

## Goal
Add a dedicated `/analytics` page with rich visualizations (Recharts), time-range filtering, trend analysis, and CSV/PDF/JSON export capabilities.

## Architecture
Server page with client dashboard shell. Reuses existing `/api/intel` and `/api/threat` endpoints with new `?hours=` param for time-range filtering. New `/api/analytics/export` endpoint handles CSV/PDF/JSON generation server-side. Recharts for all chart components, styled to match HUD theme.

## Tech Stack
- Recharts (charting)
- jsPDF + jsPDF-AutoTable (PDF export)
- next-intl (i18n)
- Existing: SWR, Supabase, Tailwind

## Components

### Pages
- `/analytics` — Main analytics dashboard

### New Components (src/components/analytics/)
- `AnalyticsDashboard.tsx` — Client shell, time range state, data orchestration
- `TimeRangeSelector.tsx` — 6h/24h/7d/30d toggle buttons
- `SeverityTrendChart.tsx` — Line chart: severity counts over time buckets
- `CategoryBreakdownChart.tsx` — Horizontal bar chart: events per category
- `TopSourcesChart.tsx` — Bar chart: top 10 sources by event count
- `TrendIndicators.tsx` — Rising/declining categories using existing trend-detection.ts
- `GeoHotspots.tsx` — Top regions by event density (table with sparklines)
- `ExportPanel.tsx` — CSV/PDF/JSON download buttons

### New Hooks
- `useAnalytics.ts` — SWR hook fetching `/api/intel?hours=X&limit=500`, computes all chart data client-side

### New API Routes
- `/api/analytics/export` — POST, accepts { format: csv|pdf|json, hours: number }, returns file

### Modified Files
- `/api/intel/route.ts` — Add `?hours=` param (filter by publishedAt age)
- `src/i18n/en.json` — Add `analytics.*` namespace
- `src/i18n/tr.json` — Add `analytics.*` namespace

## Data Flow
1. User selects time range (6h/24h/7d/30d)
2. `useAnalytics` fetches `/api/intel?hours=X&limit=500`
3. Client-side computation: severity trend buckets, category counts, source ranking, geo density, trend detection
4. Charts render from computed data
5. Export: POST to `/api/analytics/export` with current time range → download file

## Chart Styling (HUD Theme)
- Background: transparent (inherits hud-surface)
- Grid lines: #1a2a4a (hud-border)
- Text: #5a7a9a (hud-muted), font-mono 8-9px
- Colors: severity palette (critical=#ff4757, high=#ffd000, medium=#00e5ff, low=#00ff88, info=#8a5cf6)
- No default Recharts tooltips — custom HUD-styled tooltips
- Accent: #00e5ff

## i18n Keys (analytics.*)
- title, subtitle, timeRange, last6h, last24h, last7d, last30d
- severityTrend, categoryBreakdown, topSources, trendIndicators, geoHotspots
- rising, declining, stable, noData
- export, exportCSV, exportPDF, exportJSON, exporting, exportReady
- events, sources, regions, categories

## Export Formats
- **CSV**: id, title, category, severity, source, publishedAt, countryCode, lat, lng
- **PDF**: Summary stats + severity chart + category table + top sources (jsPDF)
- **JSON**: Raw filtered items array

## Testing
- Unit tests for chart data computation functions
- Unit tests for export formatting (CSV generation, JSON structure)
- Existing trend-detection tests already cover trend logic
