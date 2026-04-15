/**
 * One-time script to publish 3 Bluesky feed generator records.
 *
 * Usage:
 *   BSKY_HANDLE="troiamedia.bsky.social" \
 *   BSKY_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx" \
 *   npx tsx scripts/publish-bluesky-feeds.ts
 *
 * The handle must own did:web:troiamedia.com — Bluesky verifies this
 * by fetching /.well-known/did.json from your domain.
 *
 * Safe to re-run: `putRecord` updates existing records in place.
 */

import { FEEDS } from "../src/lib/bluesky/feed-queries";

const BSKY_SERVICE = "https://bsky.social";
const DID = "did:web:troiamedia.com";

async function main() {
  const handle = process.env.BSKY_HANDLE;
  const appPassword = process.env.BSKY_APP_PASSWORD;

  if (!handle || !appPassword) {
    console.error(
      "ERROR: BSKY_HANDLE and BSKY_APP_PASSWORD environment variables are required.",
    );
    process.exit(1);
  }

  // 1. Create an auth session
  const authRes = await fetch(
    `${BSKY_SERVICE}/xrpc/com.atproto.server.createSession`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: handle, password: appPassword }),
    },
  );

  if (!authRes.ok) {
    console.error("Auth failed:", authRes.status, await authRes.text());
    process.exit(1);
  }

  const auth = (await authRes.json()) as {
    accessJwt: string;
    did: string;
    handle: string;
  };

  console.log(`✓ Authenticated as ${auth.handle} (${auth.did})`);

  // 2. For each feed, putRecord it on the user's repo under the feed rkey
  for (const feed of Object.values(FEEDS)) {
    const record = {
      $type: "app.bsky.feed.generator",
      did: DID,
      displayName: feed.displayName,
      description: feed.description,
      createdAt: new Date().toISOString(),
    };

    const res = await fetch(
      `${BSKY_SERVICE}/xrpc/com.atproto.repo.putRecord`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.accessJwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo: auth.did,
          collection: "app.bsky.feed.generator",
          rkey: feed.rkey,
          record,
        }),
      },
    );

    if (!res.ok) {
      console.error(
        `✗ Failed to publish ${feed.rkey}:`,
        res.status,
        await res.text(),
      );
      continue;
    }

    const body = (await res.json()) as { uri: string; cid: string };
    console.log(`✓ Published ${feed.rkey}`);
    console.log(`    ${body.uri}`);
  }

  console.log("\nNext steps:");
  console.log("  1. Open Bluesky app → Feeds → Search 'OSINT Firehose'");
  console.log("  2. Pin the feed to your profile");
  console.log("  3. Share the feed URL from @Troiamediacom");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
