const CACHE_NAME = "fittrack-cache-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./pages/dashboard.html",
  "./manifest.json",
  "./public/styles/style.css",
  "./public/js/app.js",
  "./public/icons/icon-192.png",
  "./public/icons/icon-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function (cacheName) {
            return cacheName !== CACHE_NAME;
          })
          .map(function (cacheName) {
            return caches.delete(cacheName);
          })
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then(function (networkResponse) {
          const responseClone = networkResponse.clone();

          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, responseClone);
          });

          return networkResponse;
        })
        .catch(function () {
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }

          return new Response("Offline", {
            status: 503,
            statusText: "Offline"
          });
        });
    })
  );
});
