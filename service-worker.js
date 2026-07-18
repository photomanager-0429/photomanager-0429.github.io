"use strict";
const CACHE_NAME = "equal-love-photo-manager-public-v1004";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css?v=1.00.4",
  "./js/app.js?v=1.00.4",
  "./js/bootstrap.js?v=1.00.4",
  "./data/events.json?v=1.00.4",
  "./data/members.json?v=1.0.0",
  "./data/positions.json?v=1.0.0-orderfix",
  "./data/config.json?v=1.00.4",
  "./manifest.webmanifest?v=1.0.4",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];
const ALLOWED_ASSET_URLS = new Set(
  APP_SHELL
    .filter(item => item !== "./" && item !== "./index.html")
    .map(item => new URL(item, self.registration.scope).href)
);

function canCache(request, response) {
  if (!response || !response.ok || response.type !== "basic") return false;
  const url = new URL(request.url);
  const isNavigationDocument = request.mode === "navigate" && url.origin === self.location.origin;
  const isAllowedAsset = ALLOWED_ASSET_URLS.has(url.href);
  if (!isNavigationDocument && !isAllowedAsset) return false;
  const type = response.headers.get("content-type") || "";
  if (url.pathname.endsWith(".js")) return type.includes("javascript") || type.includes("text/plain");
  if (url.pathname.endsWith(".json") || url.pathname.endsWith(".webmanifest")) return type.includes("json") || type.includes("manifest") || type.includes("text/plain");
  if (url.pathname.endsWith(".css")) return type.includes("text/css") || type.includes("text/plain");
  if (/\.(png|jpg|jpeg|webp)$/.test(url.pathname)) return type.startsWith("image/");
  return url.pathname.endsWith("/") || url.pathname.endsWith("index.html") || type.includes("text/html");
}

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, {cache: "no-store"})
        .then(response => {
          if (canCache(event.request, response)) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
          }
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  if (!ALLOWED_ASSET_URLS.has(url.href)) return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request)
        .then(response => {
          if (canCache(event.request, response)) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
