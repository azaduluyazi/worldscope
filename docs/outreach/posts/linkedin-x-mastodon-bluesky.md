# Sosyal Medya — LinkedIn / X / Mastodon / Bluesky

## LinkedIn — Vertical Carousel (8 slide)

**Format:** PDF carousel, 1080×1350 portrait. Tools: Canva (zaten skill var), Figma.

**Slide 1 — HOOK**
```
3 patterns WorldScope saw this week
that didn't make the wire.
```

**Slide 2 — PATTERN 1**
```
Pattern 01:
[short title — e.g., "Quiet escalation in [region]"]

3 sources from 3 different language families
flagged the same shift, 18 hours apart.
None of the major outlets covered it yet.
```

**Slide 3 — DATA VIZ**
- Globe screenshot focused on the region
- 3 source pins highlighted
- Timestamp label

**Slide 4 — PATTERN 2** (same format)

**Slide 5 — DATA VIZ**

**Slide 6 — PATTERN 3** (same format)

**Slide 7 — METHOD**
```
How:
689 sources → semantic dedup → cluster → confidence score
3+ independent sources = "convergent signal"
1 source = "single-source, unconfirmed"

We surface convergent signals before the wire because
the wire waits for an English-language press release.
We don't.
```

**Slide 8 — CTA**
```
Free weekly briefing, every Sunday 07:00 UTC.
troiamedia.com/briefing
```

**LinkedIn post copy (above the carousel):**

```
This week WorldScope's convergence engine flagged 3 stories that hadn't hit the wire yet — all from cross-language source clusters that English outlets typically pick up 18-72 hours later.

I publish the strongest convergent signals every Sunday at 07:00 UTC as a free PDF briefing. Used by analysts, traders and journalists who can't wait for the wire.

→ Subscribe (free): troiamedia.com/briefing

Built and run independently. Editorial policy and funding transparency at troiamedia.com/editorial-policy.

#OSINT #intelligence #geopolitics #convergence
```

**Best time:** Tue–Thu, 08:00–10:00 local. LinkedIn algorithm rewards comments in first hour — pre-arrange 3 friends to comment.

**Frequency:** 1 carousel/week, max. More than that and the algo throttles.

---

## X / Twitter — Reply-strategy + Periodic Drops

X organic reach is dead UNLESS you reply with substance to active conversations.

### Reply playbook (daily, 30 min total)

1. Open accounts: @bellingcat, @OSINTtechnical, @GeoConfirmed, @sentdefender, @intelschizo, @warmonitors
2. Wait for breaking events (you'll see them in real-time on troiamedia.com)
3. Reply with one of:
   - A **convergence count**: "WorldScope counted N independent sources reporting this in the last 4 hours, mostly from [language families]."
   - A **map screenshot** with timestamp
   - A **counter-claim** with sources from a different region

Goal: 3 substantive replies/day. After 30 days you start getting follows from the OSINT community, after 90 days you're cited.

### Periodic drops (weekly)

```
🛰️ Sunday Convergence Report → troiamedia.com/briefing

This week: [3 short bullets, one per pattern]

Free, weekly, PDF, no signup beyond email. 689 sources, 195 countries.
```

Pin this thread Sunday morning every week. Update the bullets each time.

### X Spaces (test monthly)

Title: "Open-Source Weekly — what convergence signals say about [topic]"

- Co-host with one OSINT account if possible
- 30 min max, 15 min talk + 15 min Q&A
- Promote 24h in advance with the carousel above

---

## Mastodon

### Account: @worldscope@infosec.exchange

infosec.exchange specifically — the OSINT/intel overlap there is strongest.

### Bot account (separate)

Set up @worldscope_signals as a bot account that posts every high-convergence event automatically. Feed: existing /api/intel filtered to confidence ≥0.85.

Toot format:
```
🔴 [variant] [country flag] [headline, 200 chars]

🔗 Sources: N | Confidence: NN%
📍 [region] · [timestamp UTC]
🛰️ More: troiamedia.com/events/[id]

#OSINT #breaking
```

### Manual account etiquette

- Boost (= retweet) other OSINT accounts daily
- Reply with substance, not links
- One self-promo toot per week max
- Use CW (content warning) for graphic content per Mastodon norms

---

## Bluesky

### Custom feed generator

This is the killer move. Build a Bluesky feed generator at `https://feed.troiamedia.com` that pulls high-confidence events into a Bluesky-format feed people can subscribe to.

Tutorial: https://github.com/bluesky-social/feed-generator

Once live:
- Submit to "Bluesky Feeds Directory"
- Pin to your profile
- Cross-post the feed link to OSINT starter packs

### Account: @troiamedia.bsky.social (already in schema)

Post format:
```
WorldScope Convergence Report — Week of [date]

Top 3 signals the wire missed:
1. ...
2. ...
3. ...

Full PDF: troiamedia.com/briefing
```

Bluesky has higher engagement-per-follower than X right now for journalism/intel niches. Post 3-5×/week.
