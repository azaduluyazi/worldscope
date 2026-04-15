import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * GET /xrpc/app.bsky.feed.describeFeedGenerator
 *
 * AT Protocol XRPC endpoint — tells Bluesky which feed URIs this
 * service hosts. Each feed has a record on the publisher account
 * (did:web:troiamedia.com) at
 *   at://did:web:troiamedia.com/app.bsky.feed.generator/<rkey>
 *
 * We publish three feeds:
 *   - osint-firehose  : curated OSINT / intelligence posts
 *   - breaking-world  : breaking world news signals
 *   - turkiye-focus   : Türkiye-focused intelligence stream
 */

const DID = "did:web:troiamedia.com";

export async function GET() {
  return NextResponse.json(
    {
      did: DID,
      feeds: [
        { uri: `at://${DID}/app.bsky.feed.generator/osint-firehose` },
        { uri: `at://${DID}/app.bsky.feed.generator/breaking-world` },
        { uri: `at://${DID}/app.bsky.feed.generator/turkiye-focus` },
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    },
  );
}
