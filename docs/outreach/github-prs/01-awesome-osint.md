# PR — `awesome-osint` (jivoi/awesome-osint)

**Repo:** https://github.com/jivoi/awesome-osint
**Section:** `## Tools` → `### Multi-tool` (or `### Visualization` if a Maps subsection exists)

---

## Branch

`add-worldscope-troiamedia`

## File to edit

`README.md`

## Insertion (single line, alphabetical order — find the `W` block)

```markdown
- [WorldScope](https://troiamedia.com) - Real-time global intelligence dashboard aggregating 689 sources across 195 countries. Live conflict, cyber, finance, weather and health pins on a 3D globe; AI-curated daily/weekly briefings; per-country pages; free public API at /developers. SSR, no signup. ([Source](https://github.com/AzadUluyazi/worldscope))
```

## PR Title

```
Add WorldScope — real-time global intelligence dashboard
```

## PR Body

```markdown
### What this adds
[WorldScope](https://troiamedia.com) — a free, real-time OSINT dashboard built by an independent publisher.

### Why it fits awesome-osint
- **689 monitored sources** (RSS, Telegram channels, government feeds, USGS, ESA Copernicus, OpenSky, MarineTraffic, GDACS, ReliefWeb, ACLED, IAEA, regional newswires)
- **195 countries** with dedicated per-country dashboards and risk scoring
- **No signup required** — full feature set free, no API key for read endpoints
- **AI-curated briefings** — daily and weekly intelligence digests with semantic dedup across sources
- **3D interactive globe** + 2D Mapbox tactical view with variant overlays (conflict, cyber, finance, weather, health, energy)
- **Open API** at https://troiamedia.com/api-docs — JSON endpoints for events, intel, country risk, threat ticker
- **Embeddable widgets** — drop a live globe or threat ticker on any site (CC BY 4.0 with attribution)
- **30 languages**, SSR for full search-engine indexing, accessible

### Source / transparency
- Public editorial policy: https://troiamedia.com/editorial-policy
- Ownership & funding: https://troiamedia.com/ownership
- Corrections log: https://troiamedia.com/corrections
- Tech: Next.js + Supabase + Mapbox + Vercel AI SDK
- Disclosure: I am the maintainer.

### Where I added it
Alphabetical order under the existing tools list. Single line, matches surrounding format.
```

## Notes for submitter (you)

- Fork `jivoi/awesome-osint`, create branch, edit `README.md`
- Confirm awesome-list section conventions before placing the line — some lists use sub-categories. If this list has a "Visualization" or "Geo" subsection, `WorldScope` belongs there.
- Don't include screenshots — awesome-list maintainers reject them.
- Be honest about being the maintainer in the PR body. Lists tolerate self-promotion when transparent.
