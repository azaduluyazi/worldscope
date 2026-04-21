import { NextResponse, type NextRequest } from "next/server";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { rateLimiters, getTierForPath, getClientId } from "./lib/ratelimit";
import {
  BRIEFING_COOKIE,
  BRIEFING_COOKIE_MAX_AGE,
  pickVariant,
} from "./lib/ab/briefing-headline";

/**
 * Middleware: Supabase session refresh + Rate limiting + CORS + A/B cookie +
 * security headers.
 *
 * Responsibilities (in order, gated by `matcher` below):
 * - API routes: CORS, rate limiting, preflight handling. Auth is enforced
 *   per-route by `getCurrentUser()` — the middleware just keeps the cookie
 *   session fresh.
 * - Page routes: Supabase session refresh (required on every request so the
 *   JWT cookie stays under its 1h TTL), A/B cookie for /briefing, standard
 *   security headers.
 * - Protected pages (`/account`, `/settings`): redirect to `/sign-in` if the
 *   user is anonymous. Replaces `auth.protect()` from the old Clerk setup.
 *
 * Switched from Clerk to Supabase Auth on 2026-04-21 — see migration 021
 * (handle_new_auth_user trigger) which replaces the external Clerk webhook
 * with an in-database sync of auth.users → public.user_profiles.
 */

const PROTECTED_PREFIXES = ["/account", "/settings"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Wraps a NextResponse with Supabase's cookie-writing hooks so that when
 * `supabase.auth.getUser()` refreshes the access token, the new cookie is
 * propagated back to both the response (for the browser) and the request
 * (for anything downstream in the same request).
 */
async function withSupabaseSession(
  request: NextRequest,
  response: NextResponse,
): Promise<{ response: NextResponse; userId: string | null }> {
  const supabase = createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  return { response, userId: data.user?.id ?? null };
}

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
    const response = NextResponse.next();

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
            },
          );
        }

        response.headers.set("X-RateLimit-Limit", String(limit));
        response.headers.set("X-RateLimit-Remaining", String(remaining));
        response.headers.set("X-RateLimit-Reset", String(reset));
      } catch {
        // Rate limiter down — fail open to avoid denial of service.
      }
    }

    response.headers.set("Access-Control-Allow-Origin", corsOrigin);

    // Refresh Supabase cookie so API routes can read the current user.
    const wrapped = await withSupabaseSession(request, response);
    return wrapped.response;
  }

  // ── Page routes ──
  let response = NextResponse.next();

  // Refresh session first — this also tells us if the user is signed in
  // so we can redirect on protected paths.
  const { response: sessionResponse, userId } = await withSupabaseSession(
    request,
    response,
  );
  response = sessionResponse;

  if (isProtectedPath(pathname) && !userId) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect_to", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // A/B test: briefing headline variant
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

  // Standard security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)",
  );

  return response;
}

export default async function middleware(request: NextRequest) {
  return runPipeline(request);
}

export const config = {
  matcher: [
    // Match all API routes
    "/api/:path*",
    // Match page routes (excluding static + Next.js internals)
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|robots.txt|sitemap.xml|sw.js).*)",
  ],
};
