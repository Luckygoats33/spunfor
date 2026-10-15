const V='spunfor-demo-v1',F=['./','index.html','demo.css','demo.js','config.js','manifest.webmanifest','vendor/leaflet/leaflet.css','vendor/leaflet/leaflet.js','vendor/markercluster/MarkerCluster.css','vendor/markercluster/leaflet.markercluster.js','../fonts/bricolage.woff2','../fonts/instrument-serif.woff2','../fonts/instrument-serif-italic.woff2','../fonts/dm-mono.woff2','../logo-mark.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(F)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET')return;
 if(u.origin===location.origin){e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(V).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))}
 else if(/tile\.openstreetmap\.org/.test(u.host)){e.respondWith(caches.open(V+'-tiles').then(c=>c.match(e.request).then(m=>m||fetch(e.request).then(r=>{c.put(e.request,r.clone());return r}).catch(()=>m))))}});
