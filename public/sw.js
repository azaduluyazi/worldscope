/// <reference lib="webworker" />

const CACHE_NAME = "worldscope-v1";
const STATIC_CACHE = "worldscope-static-v1";
const DATA_CACHE = "worldscope-data-v1";

// Static assets to precache on install
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.svg",
];

// API routes to cache with network-first strategy
const API_CACHE_ROUTES = [
  "/api/intel",
  "/api/market",
  "/api/threat",
];

// ─── Install: Precache static shell ───
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ─── Activate: Clean old caches ───
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DATA_CACHE && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch: Strategy-based caching ───
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin requests (mapbox tiles, external APIs)
  if (url.origin !== self.location.origin) return;

  // API routes: Network-first with data cache fallback
  if (url.pathname.startsWith("/api/")) {
    if (API_CACHE_ROUTES.some((route) => url.pathname.startsWith(route))) {
      event.respondWith(networkFirstWithCache(request, DATA_CACHE));
    }
    return;
  }

  // Static assets: Cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json"
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Pages: Network-first (for fresh i18n content)
  event.respondWith(networkFirstWithCache(request, CACHE_NAME));
});

// ─── Cache Strategies ───

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Offline fallback for navigation requests
    if (request.mode === "navigate") {
      const fallback = await caches.match("/");
      if (fallback) return fallback;
    }

    return new Response(
      JSON.stringify({ error: "Offline", cached: false }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
