# PR — `awesome-public-datasets` (awesomedata/awesome-public-datasets)

**Repo:** https://github.com/awesomedata/awesome-public-datasets
**Section:** `## GeoSpatial Data` (or `## Government & World Government Data` for the events stream)

---

## Branch

`add-worldscope-events-dataset`

## File to edit

`README.rst`

## Insertion

Find the `GeoSpatial Data` section. Add (RST format, mind the indentation):

```rst
- `WorldScope Live Events API <https://troiamedia.com/api-docs>`__ - Real-time global event stream aggregated from 689 verified sources across 195 countries. JSON endpoints for conflict, cyber, weather, health, energy, finance and commodity events. Free, no API key required, CC BY 4.0 license, regularly updated.
```

## PR Title

```
Add WorldScope Live Events dataset (real-time, 689 sources, 195 countries)
```

## PR Body

```markdown
### Dataset description

The **WorldScope Live Events API** provides a real-time JSON stream of global intelligence events aggregated from 689 verified open sources across 195 countries.

### Coverage
- **Categories:** conflict, cyber, weather, health, energy, finance, commodity, sports
- **Geographic:** 195 countries with per-country endpoints
- **Update frequency:** continuous (cron every 5 minutes)
- **Volume:** ~5,000–15,000 events per day (varies by world activity)

### Format
- JSON (REST endpoints)
- RSS feed for syndication: https://troiamedia.com/feed.xml
- Embeddable iframe widgets

### License
- **CC BY 4.0** — free for any use with attribution
- No API key required for read access
- Rate limit: 60 req/min anonymous

### Why it fits this list
- **Free and open** ✓
- **Programmatically accessible** ✓
- **Documented schema** at https://troiamedia.com/api-docs
- **Long-running maintenance** — independent publisher, ad-supported, no shutdown risk

### Disclosure
I am the maintainer of WorldScope. Editorial policy and funding transparency at https://troiamedia.com/editorial-policy and https://troiamedia.com/ownership.
```

## Notes for submitter (you)

- This list uses `.rst` (reStructuredText) — be careful with indentation.
- The list is alphabetical within sections. Find the right `W` slot.
- This list is more demanding than awesome-osint — make sure the API endpoints actually return data when the maintainer tests them.
