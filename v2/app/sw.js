/* spunfor.me offline: keep the app shell and city files; always try the network first for pages and city data */
const CACHE = "spunfor-app-v1";
const SHELL = ["./", "index.html", "app.css", "core.js", "trip.js", "ui.js", "ask.js", "manifest.webmanifest", "vendor/leaflet/leaflet.js", "vendor/leaflet/leaflet.css", "vendor/markercluster/leaflet.markercluster.js", "vendor/markercluster/MarkerCluster.css"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if(e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request, {cache:"no-cache"}).then(r => { if(r.ok){ const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; }).catch(() => caches.match(e.request, {ignoreSearch:e.request.mode === "navigate"})));
});
