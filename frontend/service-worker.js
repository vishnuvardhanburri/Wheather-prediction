const CACHE_NAME = "weatherml-shell-v4";
const APP_SHELL = [
  "/",
  "/index.html",
  "/forecast.html",
  "/hourly.html",
  "/alerts.html",
  "/map.html",
  "/compare.html",
  "/favorites.html",
  "/models.html",
  "/pipeline.html",
  "/report.html",
  "/timeline.html",
  "/explanation.html",
  "/about.html",
  "/training.html",
  "/notes.html",
  "/styles.css",
  "/script.js",
  "/icon.svg",
  "/og-image.svg",
  "/manifest.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
  "/artifacts/training/model-card.md",
  "/artifacts/training/metrics.json",
  "/artifacts/training/predictions.csv",
  "/artifacts/training/feature_weights.csv",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ error: true, message: "Network unavailable." }), { headers: { "Content-Type": "application/json" }, status: 503 })));
    return;
  }

  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
      return cached || network;
    }),
  );
});
