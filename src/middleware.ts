import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { rateLimiters, getTierForPath, getClientId } from "./lib/ratelimit";
import {
  BRIEFING_COOKIE,
  BRIEFING_COOKIE_MAX_AGE,
  pickVariant,
} from "./lib/ab/briefing-headline";

/**
 * Middleware: Clerk auth + Rate limiting + CORS + A/B cookie + security
 * headers.
 *
 * - Clerk wraps everything so `auth()` is available inside pages / API.
 * - Protected routes (currently /account, /settings) force sign-in.
 * - All API routes get rate limiting + CORS. Cron routes skip the rate
 *   limiter (they use Bearer CRON_SECRET).
 * - /briefing visits get an A/B variant cookie.
 * - All responses get the standard security header set.
 */

const isProtectedRoute = createRouteMatcher([
  "/account(.*)",
  "/settings(.*)",
]);

async function runPipeline(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // ── CORS: restrict API origins to our domain ──
  const ALLOWED_ORIGINS = [
    "https://troiamedia.com",
    "https://www.troiamedia.com",
    process.env.NODE_ENV === "development" ? "http://localhost:3000" : "",
  ].filter(Boolean);

  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin") || "";

    // v1 Developer API: allow any origin (authenticated by API key)
    const isV1 = pathname.startsWith("/api/v1/");
    const corsOrigin = isV1
      ? (origin || "*")
      : (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]);

    // Preflight OPTIONS
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

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
                "Access-Control-Allow-Origin": corsOrigin,
                "X-RateLimit-Limit": String(limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": String(reset),
                "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
              },
            }
          );
        }

        const response = NextResponse.next();
        response.headers.set("X-RateLimit-Limit", String(limit));
        response.headers.set("X-RateLimit-Remaining", String(remaining));
        response.headers.set("X-RateLimit-Reset", String(reset));
        response.headers.set("Access-Control-Allow-Origin", corsOrigin);
        return response;
      } catch {
        const response = NextResponse.next();
        response.headers.set("Access-Control-Allow-Origin", corsOrigin);
        return response;
      }
    }

    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", corsOrigin);
    return response;
  }

  // ── A/B test: briefing headline variant assignment ──
  const response = NextResponse.next();

  if (pathname === "/briefing" || pathname === "/briefing/") {
    const existing = request.cookies.get(BRIEFING_COOKIE)?.value;
    if (!existing) {
      const variant = pickVariant();
      response.cookies.set(BRIEFING_COOKIE, variant, {
        maxAge: BRIEFING_COOKIE_MAX_AGE,
        path: "/",
        sameSite: "lax",
        secure: true,
        httpOnly: false,
      });
      response.headers.set("x-briefing-variant", variant);
    } else {
      response.headers.set("x-briefing-variant", existing);
    }
  }

  // ── Security headers for all page responses ──
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

export default clerkMiddleware(async (auth, request) => {
  // Protect auth-required routes. `auth.protect()` redirects to sign-in
  // if the visitor is not signed in.
  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  return runPipeline(request);
});

export const config = {
  matcher: [
    // Match all API routes
    "/api/:path*",
    // Match page routes (for security headers + Clerk session) but exclude
    // static files and the Next.js internals.
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|robots.txt|sitemap.xml|sw.js).*)",
  ],
};
