# Hacker News — Show HN

⚠️ **TEK ATIŞ.** 90 gün repost yasak.

## Title (HN limit: 80 chars)

```
Show HN: WorldScope – Real-time global intelligence dashboard, 689 sources
```

Alternatives (test on a notes file first):
- `Show HN: A 3D globe of every breaking world event from 689 OSINT sources`
- `Show HN: WorldScope – I built a real-time intelligence dashboard for OSINT`

## URL

```
https://troiamedia.com
```

## Best time
Tuesday–Thursday, **08:00–10:00 ET** (13:00–15:00 UTC). Avoid Mondays (deluge) and Fridays (low velocity).

## First comment (post within 60 seconds of submission)

```
Hi HN — maker here. Quick technical context since "Show HN" guidelines suggest a comment from the author.

WorldScope is a free real-time intelligence dashboard. The interesting parts engineering-wise:

1. **Convergence engine.** 689 sources produce a lot of noise. I built a semantic-dedup pipeline using Gemini embeddings (free tier, 1500 RPM) plus a clustering layer that surfaces stories where 3+ independent sources agree. The cluster confidence score determines whether something gets a "live" badge or sits as "single-source unconfirmed". Source: `src/lib/convergence/` in the repo.

2. **SSR-first.** Most existing OSINT dashboards (looking at WorldMonitor, Liveuamap clones) are SPAs and invisible to search engines. WorldScope is Next.js 16 App Router, every event has a unique URL, country pages are statically generated with revalidation, sitemap-news is published per Google News spec. Result: long-tail organic traffic that compounds.

3. **Multi-layer cache.** Upstash Redis with 6 TTL tiers — from 30s for breaking events to 24h for country metadata. Cron jobs refresh sources every 5 minutes via `vercel.json`.

4. **AI summaries are byline-attributed and labeled.** Every model-generated summary links back to the underlying primary sources. Models never invent citations; if they do, it's treated as a critical bug.

5. **Free API + embeddable widgets.** Anyone can drop a live globe iframe (CC BY 4.0) on their site. https://troiamedia.com/embed/globe

Stack: Next.js 16, React 19, Supabase Postgres, Upstash Redis, Mapbox GL JS, react-globe.gl, Vercel AI SDK (Groq + Gemini + Anthropic with failover), Resend for email.

It's ad-supported and free forever. No paywall. Independent — see https://troiamedia.com/ownership for funding transparency.

Happy to answer questions about the convergence engine, source onboarding, or how I keep the source health monitor honest (currently via a private Telegram bot that pages me when feeds rot).
```

## After posting

- **Stay glued to the thread for 4 hours.** Engagement velocity is the only HN ranking signal that matters.
- Reply to every top-level comment with substance. No "thanks!" or one-liners.
- Acknowledge legitimate criticism without defensive language. "You're right, X is broken — fixing now."
- If someone posts a competing project, upvote them and link both ways.
- **Track:** screenshot the front-page position every 30 min for the case study.

## If it ranks

- Don't add the URL to your X bio yet — wait until the spike is over to avoid attribution loss
- Prepare a follow-up Dev.to / Hashnode technical article on the convergence engine within 48h while the attention is still warm
- Submit to other engineering communities (Lobsters, /r/programming) only AFTER HN ranks — those communities police re-promotion

## If it flops

- Don't take it personally — HN is fickle. Wait 90 days, refine the hook, try again with a different angle (e.g., "Show HN: How I built a 689-source convergence engine on $0 infrastructure")
