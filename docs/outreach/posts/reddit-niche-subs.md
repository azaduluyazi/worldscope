# Reddit — Niche subs (value-first, 9:1 rule)

⚠️ Her sub'da farklı ton. Account ≥90 gün, karma ≥500 olmalı. Yorumdan başla, sonra post.

---

## r/OSINT (~190K) — Tools-friendly ama no spam

**Strategy:** Önce 1–2 hafta yorum cevapla. "Soruyu cevapla, link gerekliyse comment'te ver."

**Trigger post idea (only after 2 weeks of contributing):**

Title: `I built a multi-source convergence dashboard — looking for OSINT analyst feedback`

Body:
```
Background: I've been frustrated with OSINT aggregation tools because they either dump raw feeds (too noisy) or paywall the good signals.

Built WorldScope (https://troiamedia.com) over 6 months as a free SSR dashboard that pulls from 689 sources — USGS, ESA Copernicus, OpenSky, MarineTraffic, GDACS, ReliefWeb, ACLED, IAEA, regional newswires, plus verified Telegram and Mastodon accounts.

The piece I want feedback on: a semantic-dedup convergence engine that clusters reports across sources and surfaces stories where 3+ independents agree. Designed to cut the noise without losing single-source breaking events (those get a "unconfirmed" badge).

Asks for the community:
1. What sources should I add that I'm probably missing?
2. Any edge cases where convergence-based scoring would mislead an analyst?
3. Source verification methodology — how would you score a feed's reliability programmatically?

Open API at /api-docs, no signup. Code is closed but happy to share architecture details.
```

---

## r/geopolitics (~1.1M) — Long-form analysis only, NO link drops

**Strategy:** Asla doğrudan tool tanıtımı yapma. Bunun yerine veriyle bir analiz yaz, comment'lerde tool'a referans ver.

**Post format:**

Title: `Convergence analysis: 5 underreported tension shifts of the past 30 days [data inside]`

Body: Write a real, original 800-1200 word analysis using WorldScope data. Cite specific events, sources, and let the conclusions speak. Mention your tool ONCE in a final paragraph: "I run a real-time OSINT dashboard at troiamedia.com that aggregates the sources behind this analysis."

⚠️ Mods will delete the post if it reads like an ad. The analysis must be the value.

---

## r/CredibleDefense (~450K) — Source-cited only

**Strategy:** Daily megathread'e katkı ver. Her gün 2-3 substantive comment with WorldScope data. Don't post own threads for 30 days.

When you finally post:

Title: `Open-source convergence tracking — 30 days of cross-source verification methodology`

Body: Methodology-focused write-up. Here's how WorldScope decides when 3 sources agreeing is signal vs. echo. Share the stats. Mods respect rigor.

---

## r/dataisbeautiful (~22M) — OC tag required

**Strategy:** Post a screenshot/visualization, not a link.

Title: `[OC] 30 days of global earthquakes mapped from USGS + regional seismic networks (689 sources total)`

Submit type: **Image**, with the OC tag and source citation in the comments. Tool/methodology only when asked.

```
[Visualization made from data I collect on troiamedia.com — full source list and methodology in the comments below.]
```

---

## r/MapPorn (~3M) — Image-first

**Strategy:** Same as dataisbeautiful. One visually striking globe screenshot per post. Don't drop more than 1/month.

Title: `World cyber attack frequency — 30 days, plotted on a globe`

---

## r/cybersecurity (~700K) — Discussion-friendly

Title: `Free real-time cyber threat aggregator I built — looking for SOC analyst feedback on signal-to-noise tuning`

Body:
```
I've been running WorldScope for the past 6 months and the cyber variant (https://troiamedia.com/cyber) aggregates from CISA KEV, NVD, AlienVault OTX, AbuseIPDB, Have I Been Pwned, ransomware leak sites, and verified researcher Telegram channels.

Engineering question for SOC people: how would you tune a convergence threshold for cyber events? My current heuristic is 2+ independent sources for "confirmed" status, but I'm finding it over-flags during sectoral campaigns (one IOC reported by everyone) and under-flags during stealth campaigns (one good source, weeks before the wire).

Looking for opinions on better signal-to-noise heuristics. Free, no signup, no API key.
```

---

## r/Turkey (~1M) + r/turkey

Title: `Türkiye'den bir gelistiricinin yaptığı küresel istihbarat panosu — 689 kaynak, ücretsiz`

Body:
```
Selam — yaklaşık 6 aydır WorldScope adında bir proje üzerinde çalışıyorum. Tek kişilik bir yan-proje olarak başladı, şu an 689 kaynaktan veri çekiyor: çatışma, siber saldırı, deprem, salgın, enerji altyapısı, finans olayları, hepsi tek bir 3D globe üzerinde.

troiamedia.com — kayıt yok, ücretsiz, Türkçe destekli.

Türkiye'nin underserved olduğu bir alan: 17 Türk kaynak entegre, deprem haritası TR sismograf ağıyla birleşik, ekonomik göstergeler TÜFE ve TCMB verilerini çekiyor.

Geri bildirim için açığım. Ne eksik, hangi Türk kaynak eklenmeli, UI'da ne karışık?

Stack: Next.js, Supabase, Mapbox, Vercel — açık OSINT meraklıları için tüm API'lar /api-docs altında.
```

---

## Cross-post strategy

- **Day 1:** r/InternetIsBeautiful (single big shot)
- **Day 2 (if Day 1 went well):** Show HN
- **Day 3:** r/OSINT (after 2+ weeks of comment contributions in advance)
- **Day 5:** r/dataisbeautiful (image post)
- **Day 7:** r/cybersecurity discussion
- **Day 10:** r/Turkey (TR audience)
- **Days 14–30:** r/geopolitics analysis post + r/CredibleDefense methodology post
