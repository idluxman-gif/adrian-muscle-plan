// Service Worker for Adrian's Muscle Plan - offline support
const CACHE_NAME = "adrian-muscle-plan-v4";
const STATIC_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icon.svg",
  "/sounds/1.mpeg",
  "/sounds/2.mpeg",
  "/sounds/3.mpeg",
  "/sounds/4.mpeg",
  "/sounds/5.mpeg",
  "/sounds/6.mpeg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Precache static assets — best-effort
      await Promise.all(
        STATIC_ASSETS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => undefined)
        )
      );
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// Listen for messages from the page to cache additional URLs
self.addEventListener("message", (event) => {
  if (!event.data) return;
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (event.data.type === "CACHE_URLS") {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) =>
        Promise.all(
          urls.map((url) =>
            cache.add(new Request(url, { cache: "no-store" })).catch(() => undefined)
          )
        )
      )
    );
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigation: try network, fall back to cached "/"
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(
      (async () => {
        try {
          const resp = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put("/", resp.clone()).catch(() => {});
          return resp;
        } catch {
          const cached = await caches.match(req);
          return cached || (await caches.match("/")) || Response.error();
        }
      })()
    );
    return;
  }

  // Static assets: cache-first, then network, populate cache
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) {
        // Refresh in background
        fetch(req)
          .then((resp) => {
            if (resp && resp.status === 200) cache.put(req, resp.clone()).catch(() => {});
          })
          .catch(() => {});
        return cached;
      }
      try {
        const resp = await fetch(req);
        if (resp && resp.status === 200) {
          cache.put(req, resp.clone()).catch(() => {});
        }
        return resp;
      } catch {
        return Response.error();
      }
    })()
  );
});
