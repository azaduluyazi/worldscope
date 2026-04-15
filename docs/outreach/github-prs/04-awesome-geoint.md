# PR — `awesome-geoint` (and similar geo lists)

**Candidate repos (PR each that's actively maintained):**
- https://github.com/giswqs/awesome-gis
- https://github.com/sshuair/awesome-gis (large list, many forks)
- https://github.com/sacridini/Awesome-Geospatial
- https://github.com/Robinlovelace/Comprehensive-list-of-Geocomputation-Resources
- (any active "awesome-osint-geoint" fork)

---

## Branch

`add-worldscope-realtime-globe`

## File to edit

`README.md`

## Insertion

Find a section like **Web Maps**, **Real-Time Visualization**, or **Open Data Portals**. Add:

```markdown
- [WorldScope](https://troiamedia.com) - Real-time 3D interactive globe + 2D Mapbox dashboard visualizing global intelligence events from 689 sources across 195 countries. Per-country dashboards, embeddable globe widget (CC BY 4.0), free API at /api-docs, no signup. Built with Next.js, Mapbox GL JS, react-globe.gl.
```

## PR Title

```
Add WorldScope — real-time global intelligence globe + dashboard
```

## PR Body

```markdown
### What this adds

[WorldScope](https://troiamedia.com) — a real-time geospatial intelligence dashboard combining a 3D interactive globe (react-globe.gl) and a 2D tactical Mapbox view.

### Geo features
- **3D globe** with live event pins (conflict, cyber, weather, health, finance, energy)
- **2D Mapbox** tactical view with variant overlays
- **Per-country pages** for all 195 countries — `/country/{ISO}`
- **Heatmap layers** for severity and density
- **Embeddable globe widget** — https://troiamedia.com/embed/globe — drop into any site
- **Open data API** with JSON endpoints documented at https://troiamedia.com/api-docs
- **Free**, no signup, CC BY 4.0

### Tech stack (educational value for the list)
- Next.js 16 SSR
- Mapbox GL JS (2D tactical view)
- react-globe.gl + Three.js (3D globe)
- Supabase Postgres for event store
- Upstash Redis for cache + rate limiting
- Vercel AI SDK for narrative generation

### Disclosure
I am the maintainer.
```

## Notes

- For each list, check if there's a "Tools" / "Resources" / "Visualization" subsection more specific than the generic top-level
- One PR per list — don't bundle
- Wait for one to merge before submitting the next; it lets you cite the merged PR as social proof
