"use strict";
const CACHE_NAME = "equal-love-photo-manager-public-v10104";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css?v=1.01.04",
  "./js/app.js?v=1.01.04",
  "./js/bootstrap.js?v=1.01.04",
  "./data/events.json?v=1.01.04",
  "./data/members.json?v=1.01.04",
  "./data/positions.json?v=1.01.04",
  "./data/config.json?v=1.01.04",
  "./manifest.webmanifest?v=1.01.04",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];
// Ver1.01.02：あとから追加した生写真セットのファイル。
// アプリのバージョンを上げずに反映させるため、常に通信を先に試し、
// オフラインのときだけ前回の内容を使う（他のファイルとは扱いを分ける）。
const FRESH_DATA = ["./data/events-add.json"];
const SCOPE_PATH = new URL("./", self.registration.scope).pathname;
const ALLOWED_ASSET_URLS = new Set(
  APP_SHELL
    .filter(item => item !== "./" && item !== "./index.html")
    .map(item => new URL(item, self.registration.scope).href)
);
const FRESH_DATA_URLS = new Set(FRESH_DATA.map(item => new URL(item, self.registration.scope).href));

function isAppShellDocument(request, url) {
  if (request.mode !== "navigate" || url.origin !== self.location.origin) return false;
  return url.pathname === SCOPE_PATH || url.pathname === `${SCOPE_PATH}index.html`;
}

function canCache(request, response) {
  if (!response || !response.ok || response.type !== "basic") return false;
  const url = new URL(request.url);
  const isAllowedAsset = ALLOWED_ASSET_URLS.has(url.href) || FRESH_DATA_URLS.has(url.href);
  if (!isAppShellDocument(request, url) && !isAllowedAsset) return false;
  const type = response.headers.get("content-type") || "";
  if (url.pathname.endsWith(".js")) return type.includes("javascript") || type.includes("text/plain");
  if (url.pathname.endsWith(".json") || url.pathname.endsWith(".webmanifest")) return type.includes("json") || type.includes("manifest") || type.includes("text/plain");
  if (url.pathname.endsWith(".css")) return type.includes("text/css") || type.includes("text/plain");
  if (/\.(png|jpg|jpeg|webp)$/.test(url.pathname)) return type.startsWith("image/");
  return url.pathname.endsWith("/") || url.pathname.endsWith("index.html") || type.includes("text/html");
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await cache.addAll(APP_SHELL);
      // 追加ファイルは未作成でも構わないため、失敗してもインストールを止めない
      await Promise.all(FRESH_DATA.map(item => cache.add(item).catch(() => {})));
    })
  );
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

  // Ver1.01.02：アプリ本体のページ以外（管理ツールなど）は、
  // オフライン用のindex.htmlとして保存しないよう対象を限定する
  if (isAppShellDocument(event.request, url)) {
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
  if (event.request.mode === "navigate") return;

  // 追加データは通信優先。オフラインで前回の内容も無い場合は空として扱う
  if (FRESH_DATA_URLS.has(url.href)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (canCache(event.request, response)) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || new Response('{"events":[]}', {headers: {"content-type": "application/json"}})))
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
