// Service Worker for Adrian's Muscle Plan - offline support
const CACHE_NAME = "adrian-muscle-plan-v3";
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

// On install, precache static assets AND parse the homepage to discover
// and cache all _next chunked JS/CSS so the app works offline immediately.
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Precache static assets
      await Promise.all(
        STATIC_ASSETS.map((url) =>
          cache
            .add(new Request(url, { cache: "reload" }))
            .catch(() => undefined)
        )
      );
      // Fetch the homepage and discover chunked assets
      try {
        const resp = await fetch("/", { cache: "reload" });
        if (resp.ok) {
          const text = await resp.text();
          const matches = text.match(/\/_next\/[^"'\s)]+\.(?:js|css|woff2?|ttf)/g) || [];
          const unique = Array.from(new Set(matches));
          await Promise.all(
            unique.map((url) =>
              cache
                .add(new Request(url, { cache: "reload" }))
                .catch(() => undefined)
            )
          );
        }
      } catch {
        // Best-effort
      }
      self.skipWaiting();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
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

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigation: network-first, fallback to cached "/"
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches
            .open(CACHE_NAME)
            .then((c) => c.put("/", copy))
            .catch(() => {});
          return resp;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // Other assets: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((resp) => {
            if (resp && resp.status === 200) {
              cache.put(req, resp.clone()).catch(() => {});
            }
            return resp;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    )
  );
});
