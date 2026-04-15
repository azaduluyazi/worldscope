import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * GET /.well-known/did.json — AT Protocol DID document.
 *
 * Declares `did:web:troiamedia.com` as a service endpoint for the
 * Bluesky custom feed generator. Bluesky resolves this when looking
 * up who owns `at://did:web:troiamedia.com/app.bsky.feed.generator/<rkey>`.
 *
 * Per did:web spec, this file must be served at /.well-known/did.json
 * with `application/json` content type.
 */
export async function GET() {
  return NextResponse.json(
    {
      "@context": ["https://www.w3.org/ns/did/v1"],
      id: "did:web:troiamedia.com",
      service: [
        {
          id: "#bsky_fg",
          type: "BskyFeedGenerator",
          serviceEndpoint: "https://troiamedia.com",
        },
      ],
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    },
  );
}
