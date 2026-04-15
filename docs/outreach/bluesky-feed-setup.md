# Bluesky Custom Feed — Setup Guide

## What this does

WorldScope now exposes 3 Bluesky custom feeds that Bluesky users can subscribe to directly from their app. Each feed curates existing Bluesky posts matching a theme; the feed description credits WorldScope and drives traffic back to troiamedia.com.

| Feed rkey | Name | Theme |
|---|---|---|
| `osint-firehose` | OSINT Firehose | `OSINT OR geolocated OR #OSINT OR verified` |
| `breaking-world` | Breaking World | `breaking OR BREAKING` |
| `turkiye-focus` | Türkiye Intelligence | `Türkiye OR Turkey OR Türkiye` |

## What's deployed automatically

These endpoints are now live on troiamedia.com:

- **`https://troiamedia.com/.well-known/did.json`** — AT Protocol DID document declaring `did:web:troiamedia.com` as a Bluesky feed generator service endpoint.
- **`https://troiamedia.com/xrpc/app.bsky.feed.describeFeedGenerator`** — Tells Bluesky which feed URIs this service hosts.
- **`https://troiamedia.com/xrpc/app.bsky.feed.getFeedSkeleton`** — Returns the AT-URIs Bluesky should show for a given feed.

The feed-generator logic itself is in `src/lib/bluesky/feed-queries.ts` and queries Bluesky's public search API (no auth, no firehose, no local index).

## What YOU need to do — one-time manual step

Bluesky needs a **feed record** published on the account that owns `did:web:troiamedia.com`. You have to run a one-time script with your personal Bluesky app password.

### Step 1 — Create an App Password

1. Log in to https://bsky.app
2. Go to Settings → Privacy and security → App passwords
3. Create a new app password named `worldscope-feed-publisher`
4. Copy the password (shown only once)

### Step 2 — Run the publish script

From the repo root:

```bash
cd worldscope
BSKY_HANDLE="troiamedia.bsky.social" \
BSKY_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx" \
npx tsx scripts/publish-bluesky-feeds.ts
```

⚠️ **The handle must own `did:web:troiamedia.com`.** Bluesky verifies this by fetching `/.well-known/did.json` from your domain when the feed record is published. Since the DID doc is already served, this works automatically.

The script publishes 3 feed records at:

- `at://did:web:troiamedia.com/app.bsky.feed.generator/osint-firehose`
- `at://did:web:troiamedia.com/app.bsky.feed.generator/breaking-world`
- `at://did:web:troiamedia.com/app.bsky.feed.generator/turkiye-focus`

### Step 3 — Verify

1. Open Bluesky → Feeds → Search
2. Type `OSINT Firehose`
3. Your feed should appear with the WorldScope description
4. Pin it to your profile for immediate social proof

### Step 4 — Promote

- Add a link to the feed on your `/briefing` page
- Tweet the feed URL from @Troiamediacom
- Post it in the **Bluesky Feeds Directory**: https://bluesky-feeds.com/
- Submit to the **Bluesky Feed Aggregator** in Skyfeed: https://skyfeed.app/

## Troubleshooting

**Feed shows 0 posts in Bluesky app**
- Bluesky's public search API sometimes rate-limits. The `getFeedSkeleton` endpoint returns `[]` on error — check the Vercel runtime logs for "feed empty" entries.
- Try changing the search query in `src/lib/bluesky/feed-queries.ts` — too narrow = empty results.

**"Feed record not found" error**
- The publish script hasn't been run OR the handle doesn't own `did:web:troiamedia.com`
- Check that `https://troiamedia.com/.well-known/did.json` is reachable

**Bluesky publishes the feed but it's empty in the app**
- Public search has a cold start — wait 60 seconds, refresh the feed in the app
- Check `https://troiamedia.com/xrpc/app.bsky.feed.getFeedSkeleton?feed=at://did:web:troiamedia.com/app.bsky.feed.generator/osint-firehose` directly — it should return `{feed: [...]}`

## Future work

- **Stateful index:** instead of querying Bluesky search every request, subscribe to the Bluesky firehose (Jetstream) and build a local Postgres index. Way better latency and unlimited query flexibility.
- **More feeds:** cyber-only, Europe-only, weather-disasters.
- **Mixing WorldScope events:** inject our own convergence events as pinned posts at the top of the feed (requires posting from a bot account).
