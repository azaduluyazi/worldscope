import { NextResponse, type NextRequest } from "next/server";
import { rateLimiters, getTierForPath, getClientId } from "./lib/ratelimit";

/**
 * Middleware: Rate limiting for API routes + security headers for all routes.
 *
 * - API routes (/api/*) get rate limiting via Upstash Redis
 * - Cron routes (/api/cron/*) are skipped (they use Bearer auth)
 * - All responses get security headers
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Rate limiting for API routes ──
  if (pathname.startsWith("/api/")) {
    const tier = getTierForPath(pathname);

    if (tier) {
      try {
        const clientId = getClientId(request);
        const limiter = rateLimiters[tier];
        const { success, limit, remaining, reset } = await limiter.limit(clientId);

        if (!success) {
          return new NextResponse(
            JSON.stringify({
              error: "Too many requests",
              retryAfter: Math.ceil((reset - Date.now()) / 1000),
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "X-RateLimit-Limit": String(limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": String(reset),
                "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
              },
            }
          );
        }

        // Attach rate limit headers to successful responses
        const response = NextResponse.next();
        response.headers.set("X-RateLimit-Limit", String(limit));
        response.headers.set("X-RateLimit-Remaining", String(remaining));
        response.headers.set("X-RateLimit-Reset", String(reset));
        return response;
      } catch {
        // If Redis is down, allow the request through (fail-open)
        return NextResponse.next();
      }
    }
  }

  // ── Security headers for all responses ──
  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)"
  );

  return response;
}

export const config = {
  matcher: [
    // Match all API routes
    "/api/:path*",
    // Match page routes (for security headers) but exclude static files
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|robots.txt|sitemap.xml).*)",
  ],
};
