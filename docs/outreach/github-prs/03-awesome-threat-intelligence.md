# PR — `awesome-threat-intelligence` (hslatman/awesome-threat-intelligence)

**Repo:** https://github.com/hslatman/awesome-threat-intelligence
**Section:** `## Sources` → `### Other Threat Intelligence Resources`

---

## Branch

`add-worldscope`

## File to edit

`README.md`

## Insertion

Find `## Sources` → likely under "Other Threat Intelligence Resources" or similar. Add in alphabetical order:

```markdown
- [WorldScope](https://troiamedia.com) - Real-time threat intelligence dashboard tracking cyber attacks, ransomware leaks, CVE alerts, vulnerability disclosures and infrastructure outages alongside conflict and geopolitical events. Aggregates 689 sources across 195 countries; free, no signup. Includes a dedicated `/cyber` variant with cyber-only feeds, dataset endpoint at `/api/cyber-threats`, and embeddable threat ticker for SOC dashboards.
```

## PR Title

```
Add WorldScope — real-time multi-source threat intelligence aggregator
```

## PR Body

```markdown
### What this adds

[WorldScope](https://troiamedia.com) is a free, real-time threat intelligence aggregation dashboard with a dedicated cyber variant at https://troiamedia.com/cyber.

### Cyber-relevant features
- **Live cyber threat feed** — CVE disclosures, ransomware leak posts, infrastructure outages, supply-chain compromise reports
- **Sources include:** CISA KEV, NVD, AlienVault OTX, AbuseIPDB, Have I Been Pwned, ransomware leak sites, security researcher Telegram channels, regional CERTs
- **API:** https://troiamedia.com/api/cyber-threats — JSON, free
- **Threat ticker widget:** https://troiamedia.com/embed
- **Convergence engine:** automatic deduplication and confidence scoring across sources
- **Free, no API key**, CC BY 4.0

### Why it fits awesome-threat-intelligence
This repo is for resources that help defenders gather and act on threat data. WorldScope is a free aggregation layer on top of many sources already on this list, plus regional and OSINT sources that are otherwise hard to monitor.

### Disclosure
I am the maintainer. Editorial policy: https://troiamedia.com/editorial-policy
```
