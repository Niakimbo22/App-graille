// Service worker de Miam — cache l'app pour un usage hors-ligne, sans backend.
// ROOT s'adapte automatiquement au basePath (local "/" ou GitHub Pages "/App-graille/").
const VERSION = "miam-v2";
const ROOT = new URL("./", self.location).href;
const SHELL = [ROOT, ROOT + "manifest.json", ROOT + "icon.svg"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(VERSION).then((cache) =>
      Promise.all(
        SHELL.map((url) =>
          fetch(url, { cache: "no-store" })
            .then((res) => (res.ok ? cache.put(url, res) : null))
            .catch(() => null)
        )
      )
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // navigation (changement de page) : réseau d'abord, cache en secours, app shell en dernier recours
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(VERSION).then((cache) => cache.put(request, res.clone()));
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(ROOT)))
    );
    return;
  }

  // reste (JS/CSS/images…) : cache d'abord (rapide), rafraîchi en tâche de fond
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok) caches.open(VERSION).then((cache) => cache.put(request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
