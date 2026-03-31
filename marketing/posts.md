# WorldScope Marketing Posts

## Platform: Reddit

### r/OSINT Post

**Title:** I built a free real-time global intelligence dashboard with 37 live sources, 232 TV channels, and AI analysis

**Body:**

Hey r/OSINT community,

I've been working on **WorldScope** (https://troiamedia.com) — a free, real-time global intelligence dashboard that aggregates data from 37+ live sources into a single tactical interface.

**What it does:**

- **25 map layers** on an interactive 3D globe and 2D tactical map — conflict zones, earthquakes, wildfires (NASA FIRMS), dark vessels, satellite tracking, GPS jamming zones, radiation levels, cyber threats, and more
- **549 curated RSS feeds** across 15 categories (conflict, cyber, finance, energy, health, tech, weather, sports)
- **37 live intel sources** including ACLED conflict data, USGS earthquakes, ADS-B flight tracking, AIS vessel monitoring, WHO disease alerts, Safecast radiation, and Cloudflare outage detection
- **Country Instability Index (CII)** — a composite risk score (0-100) for 50+ countries using 12 weighted signals
- **Cross-stream correlation engine** — automatically detects patterns like military buildup + economic sanctions happening simultaneously
- **AI-powered analysis** with 3 geopolitical frameworks (Grand Chessboard, Prisoners of Geography, Central Bank tracker)
- **232 live TV channels** from around the world
- **7-signal market composite** — fear/greed gauge combining VIX, gold, oil, USD, bonds, crypto dominance

**Tech highlights for the curious:**

- Built with Next.js 16, Mapbox GL, react-globe.gl
- Circuit breaker pattern on all 37 data sources (auto-recovery if a source goes down)
- 30 languages supported (including RTL Arabic/Farsi)
- 20 HUD themes (Military, Cyberpunk, Bloomberg Terminal, Arctic, etc.)
- Cmd+K command palette with fuzzy search across 198 countries

It's completely free — no paywall, no signup required. Just open and explore.

I'd love to hear feedback from the OSINT community. What sources would you want to see added? What features are missing?

**Link:** https://troiamedia.com

---

### r/geopolitics Post

**Title:** Free tool: Real-time geopolitical intelligence dashboard with conflict tracking, country risk scoring, and AI analysis

**Body:**

I wanted to share a tool I've been building that might be useful for this community.

**WorldScope** (https://troiamedia.com) is a free real-time dashboard that tracks:

- **Armed conflicts** — ACLED + UCDP data visualized on an interactive globe with severity-weighted markers
- **Country Instability Index** — composite risk score for 50+ countries using 12 signals (conflict frequency, protest intensity, fatality count, economic instability, cyber threats, health alerts, diplomatic tension, etc.)
- **Cross-stream correlation** — automatically flags when military buildup coincides with economic sanctions, or disease outbreaks overlap with travel restrictions
- **AI geopolitical analysis** using 3 frameworks:
  - Brzezinski's Grand Chessboard (geostrategic pivots)
  - Tim Marshall's Prisoners of Geography (geographic constraints)
  - Central Bank policy tracker
- **232 live news channels** from conflict zones and major capitals
- **Dark vessel detection** — ships that turned off AIS transponders in high-risk zones (Strait of Hormuz, Gulf of Guinea, South China Sea, etc.)

All data is aggregated in real-time from 37+ open sources. No login required, completely free.

I built this because I was frustrated switching between 15 different tabs to track global events. Now it's all in one place.

Would love feedback from this community — especially on the Country Instability Index methodology. What signals would you add or remove?

---

### r/SideProject Post

**Title:** I built a real-time global intelligence dashboard as a side project — 37 API sources, 25 map layers, 30 languages, 20 themes

**Body:**

After months of building, here's my side project: **WorldScope** — a free global intelligence monitoring platform.

**The numbers:**
- 549 RSS feeds
- 137 API clients
- 37 live intel sources
- 25 map layers
- 232 live TV channels
- 30 languages
- 20 dashboard themes
- 198 countries with instant search

**Stack:** Next.js 16 + Mapbox GL + react-globe.gl + Supabase + Upstash Redis + Vercel AI SDK (Groq/OpenAI/Anthropic failover) + Sentry

**What I learned:**
1. Circuit breaker pattern is essential when you depend on 37 external APIs — any of them can go down at any time
2. Lazy loading is crucial — three.js + mapbox-gl alone are 3.5MB. Dynamic imports cut initial load by ~50%
3. RSS is still incredibly powerful as a data source — 549 feeds give broader coverage than most paid APIs

**Revenue model:** AdSense + $1/month premium email briefing (AI-generated daily intelligence digest)

Check it out: https://troiamedia.com

Happy to answer any technical questions about the architecture!

---

### r/webdev Post

**Title:** Built a Next.js 16 dashboard with 25 real-time map layers, 3D globe, and circuit breaker pattern for 37 APIs

**Body:**

Sharing a technical deep-dive on my project **WorldScope** — a global intelligence dashboard.

**Architecture highlights:**

**Data layer:**
- 37 live data sources behind a circuit breaker gateway (5 failures = auto-disable, 1min cooldown, half-open retry)
- Upstash Redis for caching (5min-1hr TTL depending on source)
- Supabase PostgreSQL for persistence + Realtime for live updates

**Frontend:**
- Next.js 16 App Router with 18 dynamic() imports (cut initial JS ~50%)
- react-globe.gl for 5 3D globe modes (intel, flights, ships, weather, cables)
- Mapbox GL JS for 2D tactical map with custom SVG markers per category
- SWR for data fetching with smart refresh intervals (30s for breaking alerts, 5min for vessels, 1hr for economics)
- 20 themes with extended properties (fontMode, cardRadius, cardShadow, glassmorphism effects)

**AI:**
- Vercel AI SDK with 3-provider failover chain: Groq (fast) -> OpenAI (reliable) -> Anthropic (quality)
- BYOK support — users can bring their own API keys
- Geopolitical analysis with 3 prompt frameworks

**Map layers (25):**
Conflict zones, protests, earthquakes, wildfires (NASA FIRMS), radiation (Safecast), dark vessels (AIS gap detection), satellite tracking (CelesTrak TLE), GPS jamming, submarine cables, ransomware incidents, power outages, disease outbreaks, air quality, weather alerts, space launches, crypto volume heatmap, military flights, energy grid status...

**Cmd+K command palette** with fuzzy search across 198 countries, 10 variants, and all map layers.

Live: https://troiamedia.com

Would love technical feedback. The codebase handles 37 external APIs — any tips on improving resilience?

---

## Platform: Hacker News

### Show HN Post

**Title:** Show HN: WorldScope – Free real-time global intelligence dashboard (37 sources, 25 map layers, AI analysis)

**Text:**

WorldScope is a free, real-time global intelligence dashboard that aggregates 37+ live data sources into a single tactical interface.

Features: 3D globe with 25 map layers (conflicts, earthquakes, wildfires, dark vessels, satellites, GPS jamming), Country Instability Index (0-100 composite risk score), cross-stream correlation engine, AI geopolitical analysis (3 frameworks), 232 live TV channels, 549 RSS feeds, 30 languages, 20 themes.

Tech: Next.js 16, Mapbox GL, react-globe.gl, Supabase, Redis, Vercel AI SDK with Groq/OpenAI/Anthropic failover, circuit breaker on all data sources.

No signup required. Free.

https://troiamedia.com

---

## Platform: Twitter/X

### Launch Thread

**Tweet 1 (Hook):**
I just shipped a free real-time global intelligence dashboard.

37 live data sources. 25 map layers. 232 TV channels. AI analysis.

No signup. No paywall. Just open it.

https://troiamedia.com

Thread below with what it can do:

**Tweet 2 (Map):**
The interactive 3D globe shows conflict zones, earthquakes, wildfires, dark vessels, satellite positions, GPS jamming zones, and more — all updated in real-time.

25 toggleable map layers. Switch between 2D tactical and 5 globe modes.

**Tweet 3 (Intelligence):**
Country Instability Index scores 50+ countries on a 0-100 scale using 12 signals:

- Conflict frequency
- Protest intensity
- Natural disasters
- Cyber threats
- Economic instability
- Diplomatic tension

Updated in real-time as events unfold.

**Tweet 4 (AI):**
AI-powered geopolitical analysis using 3 frameworks:

- Brzezinski's Grand Chessboard
- Tim Marshall's Prisoners of Geography
- Central Bank policy tracker

Pick a country, pick a framework, get instant analysis.

**Tweet 5 (Tech):**
Built with:
- Next.js 16 + React 19
- Mapbox GL + react-globe.gl
- Circuit breaker on all 37 APIs
- 549 RSS feeds
- 30 languages (including RTL Arabic)
- 20 HUD themes

**Tweet 6 (CTA):**
Try it free: https://troiamedia.com

If you find it useful, a retweet helps a lot. Building this solo and every share counts.

---

## Platform: Product Hunt

### Tagline:
Free real-time global intelligence dashboard with 37 live sources

### Description:
WorldScope aggregates 37+ live data sources into a single tactical dashboard. Track conflicts, earthquakes, dark vessels, cyber threats, and financial markets on an interactive 3D globe with 25 map layers.

Features include a Country Instability Index (composite risk scoring), AI geopolitical analysis, 232 live TV channels, cross-stream correlation engine, and Cmd+K command palette.

30 languages. 20 themes. No signup required. Completely free.

### Maker Comment:
Hi Product Hunt! I built WorldScope because I was tired of switching between 15 tabs to track global events.

The dashboard pulls from 37+ live sources (ACLED conflicts, USGS earthquakes, NASA FIRMS wildfires, ADS-B flights, AIS vessels, WHO disease alerts, and more) and presents everything on a single interactive globe.

My favorite feature is the dark vessel detection — it flags ships that turn off their AIS transponders in high-risk zones like the Strait of Hormuz or Gulf of Guinea.

Built solo with Next.js 16, Mapbox, and a circuit breaker pattern that handles API failures gracefully.

Would love your feedback!

---

## Platform: Indie Hackers

### Title: Building a global intelligence dashboard — from 0 to 37 live data sources

### Body:

**What I built:** WorldScope — a free real-time global intelligence monitoring platform.

**The problem:** As someone interested in geopolitics and global events, I was constantly switching between OSINT sources, news feeds, flight trackers, and market dashboards. I wanted everything in one place.

**Revenue model:**
- Google AdSense (display ads)
- $1/month premium email briefing (AI-generated daily intelligence digest)
- Future: Affiliate links for financial tools

**Current metrics:**
- 37 live data sources
- 549 RSS feeds aggregated
- 25 interactive map layers
- 232 live TV channels
- 30 language support

**Tech stack:** Next.js 16 + Mapbox GL + Supabase + Redis + Vercel

**What's working:**
- The 3D globe visualization gets the most engagement
- Live TV integration is a unique differentiator
- Circuit breaker pattern keeps the dashboard stable even when APIs go down

**What I'm struggling with:**
- Getting initial traffic (this is my first marketing attempt)
- SEO takes time with a JavaScript-heavy SPA
- Balancing feature development with marketing

Would love to hear from other indie hackers who've marketed similar tools!

https://troiamedia.com

---

## Platform: Dev.to / Medium

### Title: How I Built a Real-Time Intelligence Dashboard with 37 Live APIs and a Circuit Breaker Pattern

### Tags: nextjs, javascript, webdev, opensource

### Body: [Technical blog post about architecture — 1500 words, to be written as separate content]

---

## Comment Response Templates

### Positive feedback:
"Thank you so much! Really glad you found it useful. If you have any feature requests, I'm all ears — the roadmap is driven by community feedback."

### Technical question:
"Great question! [Answer the specific technical detail]. The codebase uses [relevant tech]. Happy to go deeper if you're curious about the implementation."

### Bug report:
"Thank you for catching that! I'll look into it right away. Could you share your browser/device so I can reproduce? Really appreciate the report."

### Feature request:
"Love that idea! Adding it to the backlog. The [related existing feature] already does something similar — have you tried it? But your suggestion would definitely improve the experience."

### Skepticism/criticism:
"Totally fair point! You're right that [acknowledge the concern]. I've been thinking about [how you plan to address it]. Would love to hear your suggestions on the best approach."

### "Is this open source?":
"The dashboard is free to use at troiamedia.com. I'm considering open-sourcing parts of the architecture — what specific parts would be most useful to the community?"

### "How does this compare to [competitor]?":
"Great question! I actually looked at [competitor] closely. We share some features like [common features], but WorldScope focuses specifically on [unique differentiator like live TV, 20 themes, sports data]. Both tools have their strengths — the best choice depends on your use case."
