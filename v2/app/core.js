/* spunfor.me app core: trip config, city data (curated file or built live from OpenStreetMap), time, hours, distance, storage.
   No accounts, no tracking. Everything personal stays in this browser unless the traveler shares it. */
"use strict";
const SF = window.SF = {};

/* ---------- small helpers ---------- */
SF.esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
SF.$ = (sel, root) => (root || document).querySelector(sel);
SF.$$ = (sel, root) => [...(root || document).querySelectorAll(sel)];
SF.lc = s => String(s || "").toLowerCase();
SF.sleep = ms => new Promise(r => setTimeout(r, ms));
SF.store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};
async function getJSON(url, ms, opts){
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms || 9000);
  try{ const r = await fetch(url, Object.assign({signal:c.signal}, opts || {})); return r.ok ? await r.json() : null; }catch(e){ return null; } finally{ clearTimeout(t); }
}
SF.getJSON = getJSON;

/* ---------- trip config: lives in the link (?t=...) so a travel partner opens the same trip ---------- */
const b64 = {
  enc: o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  dec: s => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))))
};
SF.encodeTrip = b64.enc;
SF.loadTrip = function(){
  const q = new URLSearchParams(location.search).get("t");
  let t = null;
  if(q){ try{ t = b64.dec(q); }catch(e){ t = null; } }
  if(!t) t = SF.store.get("sf.lastTrip", null);
  if(!t || !t.city) return null;
  t.id = t.id || ("t" + Math.abs([...JSON.stringify([t.city, t.arrive, t.travelers])].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)).toString(36));
  SF.store.set("sf.lastTrip", t);
  return t;
};
SF.shareLink = t => location.origin + location.pathname + "?t=" + b64.enc(Object.assign({}, t, {id:t.id}));
/* per-trip storage so two trips on one phone never mix */
SF.tget = (k, d) => SF.store.get("sf." + SF.trip.id + "." + k, d);
SF.tset = (k, v) => SF.store.set("sf." + SF.trip.id + "." + k, v);

/* ---------- time in the destination's own time zone ---------- */
const DOW = ["sun","mon","tue","wed","thu","fri","sat"];
SF.DOWL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
SF.cityNow = function(date){
  const d = date || new Date(), tz = (SF.city && SF.city.city.timezone) || undefined;
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {timeZone:tz, hourCycle:"h23", weekday:"short", year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit"}).formatToParts(d).map(p => [p.type, p.value]));
  const dow = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(parts.weekday);
  return {dow, mins:(+parts.hour % 24) * 60 + +parts.minute, ymd:parts.year + "-" + parts.month + "-" + parts.day};
};
SF.toM = s => { const m = String(s || "").match(/(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : null; };
SF.fmtM = m => { m = ((m % 1440) + 1440) % 1440; const h = Math.floor(m / 60), mm = m % 60, ap = h < 12 ? "am" : "pm", hh = h % 12 || 12; return (h === 0 && mm === 0) ? "midnight" : (h === 12 && mm === 0) ? "noon" : hh + (mm ? ":" + String(mm).padStart(2, "0") : "") + " " + ap; };
SF.ymdAdd = (ymd, n) => { const d = new Date(ymd + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
SF.ymdDow = ymd => new Date(ymd + "T12:00:00Z").getUTCDay();
SF.dayLabel = (ymd, long) => new Date(ymd + "T12:00:00Z").toLocaleDateString("en-US", {weekday: long ? "long" : "short", month:"short", day:"numeric", timeZone:"UTC"});
SF.tripDays = function(){
  const t = SF.trip; if(!t.arrive) return [];
  const end = t.depart && t.depart >= t.arrive ? t.depart : t.arrive, out = [];
  for(let d = t.arrive, i = 1; d <= end && i <= 14; d = SF.ymdAdd(d, 1), i++) out.push({n:i, ymd:d});
  return out;
};
SF.tripStatus = function(){
  const days = SF.tripDays(); if(!days.length) return null;
  const today = SF.cityNow().ymd, first = days[0].ymd, last = days[days.length - 1].ymd;
  if(today < first){ const n = Math.round((new Date(first) - new Date(today)) / 864e5); return {before:true, n, txt: n === 1 ? "Tomorrow!" : n + " days to go"}; }
  if(today <= last){ const d = days.find(x => x.ymd === today); return {during:true, day:d.n, txt:"Day " + d.n + " of " + days.length}; }
  return {after:true, txt:"Trip complete"};
};

/* ---------- hours: {mon:[["09:00","17:00"]], ...}; a close earlier than open runs past midnight ---------- */
SF.hoursOf = p => (SF.city.HRS[p.id] || {}).h || null;
SF.statusAt = function(p, at){
  const h = SF.hoursOf(p); if(!h) return {state:"unknown"};
  const W = at || SF.cityNow(), today = DOW[W.dow], yest = DOW[(W.dow + 6) % 7];
  for(const [o, c] of (h[yest] || [])){ const om = SF.toM(o), cm = SF.toM(c); if(cm <= om && W.mins < cm) return {state:"open", until:cm, closesSoon: cm - W.mins <= 45}; }
  let next = null;
  for(const [o, c] of (h[today] || [])){
    const om = SF.toM(o); let cm = SF.toM(c); if(cm === 0 || cm <= om) cm += 1440;
    if(W.mins >= om && W.mins < cm) return {state:"open", until:cm, closesSoon: cm - W.mins <= 45};
    if(W.mins < om && (next == null || om < next)) next = om;
  }
  if(next != null) return {state:"later", opens:next, soon: next - W.mins <= 60};
  for(let i = 1; i <= 7; i++){ const dd = DOW[(W.dow + i) % 7], sl = h[dd]; if(sl && sl.length) return {state:"closed", opensDay:(W.dow + i) % 7, opens:SF.toM(sl[0][0]), inDays:i}; }
  return {state:"closed"};
};
SF.statusText = function(st){
  if(st.state === "open") return "Open · until " + SF.fmtM(st.until);
  if(st.state === "later") return "Opens " + SF.fmtM(st.opens) + (st.soon ? " (soon)" : "");
  if(st.state === "closed") return st.inDays === 1 ? "Closed · opens tomorrow " + SF.fmtM(st.opens) : st.opens != null ? "Closed · opens " + SF.DOWL[st.opensDay].slice(0, 3) + " " + SF.fmtM(st.opens) : "Closed";
  return "Hours not listed";
};
SF.hoursRows = function(p){
  const h = SF.hoursOf(p); if(!h) return null;
  return DOW.map((d, i) => [SF.DOWL[i].slice(0, 3), (h[d] || []).map(([o, c]) => SF.fmtM(SF.toM(o)) + "–" + SF.fmtM(SF.toM(c))).join(", ") || "Closed", i]);
};

/* ---------- distance ---------- */
SF.meters = (a, b) => { const r = x => x * Math.PI / 180, dLa = r(b[0] - a[0]), dLo = r(b[1] - a[1]); const s = Math.sin(dLa / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLo / 2) ** 2; return 6371000 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)); };
SF.coordOf = p => SF.city.COORD[p.id] || null;
SF.here = null; /* {lat,lon,acc,ts} from GPS while the app is open */
SF.origin = function(){
  const c = SF.city.city.center;
  if(SF.here && SF.meters([SF.here.lat, SF.here.lon], c) < 60000) return {pt:[SF.here.lat, SF.here.lon], from:"you"};
  const h = SF.trip.hotel; if(h && h.lat) return {pt:[h.lat, h.lon], from:h.name || "your hotel"};
  return {pt:c, from:"the city center"};
};
SF.travel = m => { if(m <= 2600){ const w = Math.max(1, Math.round(m * 1.25 / 80)); return {mode:"walk", mins:w, txt:w + " min walk"}; } const d = Math.round(m * 1.3 / 420) + 5; return {mode:"car", mins:d, txt:"~" + d + " min by car"}; };
SF.miles = m => (m / 1609.34 < 0.1 ? "under 0.1" : (m / 1609.34).toFixed(1)) + " mi";
SF.distInfo = function(p, from){ const o = from ? {pt:from, from:""} : SF.origin(), c = SF.coordOf(p); if(!c) return null; const m = SF.meters(o.pt, c); return Object.assign({m, from:o.from}, SF.travel(m)); };

/* ---------- photos: curated cities hotlink Wikimedia Commons (credited) ---------- */
SF.photoOf = p => (SF.city.PHOTOS || {})[p.id] || null;

/* ---------- links out ---------- */
SF.dirUrl = (p, mode) => { const c = SF.coordOf(p), dest = p.ad ? p.n + ", " + p.ad : c ? c.join(",") : p.n; return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(dest) + "&travelmode=" + (mode || "walking"); };
SF.appleUrl = p => { const c = SF.coordOf(p); return "https://maps.apple.com/?daddr=" + (c ? c.join(",") : encodeURIComponent(p.ad || p.n)) + "&q=" + encodeURIComponent(p.n); };
SF.uberUrl = (lat, lon, name, addr, from) => "https://m.uber.com/ul/?action=setPickup&" + (from ? "pickup[latitude]=" + from[0] + "&pickup[longitude]=" + from[1] + "&pickup[nickname]=" + encodeURIComponent(from[2] || "Pickup") : "pickup=my_location") + "&dropoff[latitude]=" + lat + "&dropoff[longitude]=" + lon + "&dropoff[nickname]=" + encodeURIComponent(name) + (addr ? "&dropoff[formatted_address]=" + encodeURIComponent(addr) : "");
SF.lyftUrl = (lat, lon) => "https://lyft.com/ride?id=lyft&destination[latitude]=" + lat + "&destination[longitude]=" + lon;

/* ---------- city data ---------- */
SF.CAT_ICON = {coffee:"☕", eat:"🍽", drink:"🍸", music:"🎷", art:"🎨", history:"🏛", nature:"🌳", attraction:"📍", shop:"🛍", sports:"🏟", queer:"🏳️‍🌈", family:"🧸", nightlife:"🌙"};
SF.loadCity = async function(trip){
  if(trip.city && !String(trip.city).startsWith("live:")){
    const cached = SF.store.get("sf.city." + trip.city, null);
    const fresh = await getJSON("../cities/" + trip.city + ".json", 12000);
    if(fresh){ SF.store.set("sf.city." + trip.city, fresh); return fresh; }
    if(cached) return cached;
  }
  return SF.buildLiveCity(trip);
};

/* ---------- live mode: build a city in the browser from free OpenStreetMap data (Photon + Nominatim) ---------- */
const LIVE_CATS = [
  ["coffee", "Coffee & bakeries", [["amenity:cafe", "cafe"], ["shop:bakery", "bakery"]]],
  ["eat", "Eats", [["amenity:restaurant", "restaurant"]]],
  ["drink", "Cocktails & bars", [["amenity:bar", "bar"], ["amenity:pub", "pub"]]],
  ["music", "Live music", [["amenity:music_venue", "music"], ["amenity:nightclub", "club"]]],
  ["art", "Art & galleries", [["tourism:gallery", "gallery"], ["tourism:museum", "art"]]],
  ["history", "History", [["tourism:museum", "museum"], ["historic:monument", "monument"], ["historic:memorial", "memorial"]]],
  ["nature", "Parks & outdoors", [["leisure:park", "park"], ["leisure:garden", "garden"], ["tourism:viewpoint", "viewpoint"]]],
  ["attraction", "Landmarks", [["tourism:attraction", "attraction"]]],
  ["shop", "Shops & markets", [["amenity:marketplace", "market"], ["shop:books", "books"]]]
];
SF.parseOSMHours = function(raw){
  if(!raw) return null; raw = String(raw).trim();
  if(raw === "24/7") return Object.fromEntries(DOW.map(d => [d, [["00:00", "24:00"]]]));
  const O = {Mo:"mon", Tu:"tue", We:"wed", Th:"thu", Fr:"fri", Sa:"sat", Su:"sun"}, ORD = ["Mo","Tu","We","Th","Fr","Sa","Su"];
  const out = {}; let any = false;
  for(const rule of raw.split(/\s*;\s*/)){
    const m = rule.match(/^((?:(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(?:Mo|Tu|We|Th|Fr|Sa|Su))?\s*,?\s*)+)\s+(.+)$/) || (/^\d/.test(rule) ? ["", "Mo-Su", rule] : null);
    if(!m) continue;
    const days = [];
    for(const part of m[1].split(/\s*,\s*/).filter(Boolean)){ const r = part.split(/\s*-\s*/); const a = ORD.indexOf(r[0]), b = ORD.indexOf(r[1] || r[0]); if(a < 0 || b < 0) continue; for(let i = a; ; i = (i + 1) % 7){ days.push(ORD[i]); if(i === b) break; } }
    const spec = m[2].trim();
    if(/^off|closed$/i.test(spec)){ days.forEach(d => { out[O[d]] = []; }); any = true; continue; }
    const slots = [...spec.matchAll(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\+?/g)].map(x => [x[1].padStart(5, "0"), x[2].padStart(5, "0")]);
    if(!slots.length) continue;
    days.forEach(d => { out[O[d]] = slots; }); any = true;
  }
  return any ? out : null;
};
SF.buildLiveCity = async function(trip, onProgress){
  const key = "sf.live." + SF.lc(trip.cityName || trip.city).replace(/[^a-z0-9]+/g, "-");
  const cached = SF.store.get(key, null);
  if(cached && Date.now() - (cached._at || 0) < 7 * 864e5) return cached;
  const prog = onProgress || SF.onLiveProgress || (() => {});
  let center = trip.center, name = trip.cityName || String(trip.city).replace(/^live:/, ""), tz = trip.tz;
  if(!center){
    prog("Finding " + name + " on the map…");
    const g = await getJSON("https://nominatim.openstreetmap.org/search?q=" + encodeURIComponent(name) + "&format=jsonv2&limit=1&countrycodes=us", 9000);
    if(!g || !g[0]) throw new Error("Couldn't find that city.");
    center = [+g[0].lat, +g[0].lon];
  }
  if(!tz){ const w = await getJSON("https://api.open-meteo.com/v1/forecast?latitude=" + center[0] + "&longitude=" + center[1] + "&timezone=auto&forecast_days=1&daily=sunset", 8000); tz = (w && w.timezone) || "America/Chicago"; }
  const bb = [center[1] - 0.09, center[0] - 0.07, center[1] + 0.09, center[0] + 0.07].map(x => x.toFixed(4)).join(",");
  const P = [], COORD = {}, seen = {}, CATS = {};
  let n = 0;
  for(const [cid, label, tags] of LIVE_CATS){
    prog("Spinning up " + label.toLowerCase() + "…");
    let got = 0;
    for(const [tag, word] of tags){
      const j = await getJSON("https://photon.komoot.io/api/?q=" + encodeURIComponent(word) + "&osm_tag=" + encodeURIComponent(tag) + "&bbox=" + bb + "&lat=" + center[0] + "&lon=" + center[1] + "&limit=14&lang=en", 9000);
      for(const f of (j && j.features) || []){
        const pr = f.properties || {}; if(!pr.name) continue;
        const k = SF.lc(pr.name).replace(/[^a-z0-9]/g, ""); if(seen[k]) { const ex = P.find(p => p.k === k); if(ex && !ex.c.includes(cid)) ex.c.push(cid); continue; }
        seen[k] = 1; const id = "L" + (++n);
        P.push({id, k, n:pr.name, c:[cid], a:pr.district || pr.locality || "", ad:[pr.housenumber && pr.street ? pr.housenumber + " " + pr.street : pr.street, pr.city].filter(Boolean).join(", "), osm:(pr.osm_type || "N")[0].toUpperCase() + pr.osm_id});
        COORD[id] = [f.geometry.coordinates[1], f.geometry.coordinates[0]]; got++;
      }
      await SF.sleep(250);
    }
    if(got) CATS[cid] = label;
  }
  /* hours, phone and website from Nominatim, 50 places per request (polite: one request per second) */
  const HRS = {};
  for(let i = 0; i < P.length; i += 50){
    prog("Checking opening hours (" + Math.min(P.length, i + 50) + " of " + P.length + ")…");
    const batch = P.slice(i, i + 50);
    const j = await getJSON("https://nominatim.openstreetmap.org/lookup?osm_ids=" + batch.map(p => p.osm).join(",") + "&format=jsonv2&extratags=1", 12000);
    for(const x of (Array.isArray(j) ? j : [])){
      const p = batch.find(b => b.osm === (x.osm_type || "")[0].toUpperCase() + x.osm_id); if(!p) continue;
      const e = x.extratags || {};
      if(e.phone || e["contact:phone"]) p.ph = e.phone || e["contact:phone"];
      if(e.website || e["contact:website"]) p.url = e.website || e["contact:website"];
      const h = SF.parseOSMHours(e.opening_hours); if(h) HRS[p.id] = {h, t:e.opening_hours, src:"osm"};
      else if(e.opening_hours) p.hoursRaw = e.opening_hours;
    }
    await SF.sleep(1100);
  }
  P.forEach(p => { delete p.k; });
  const city = {v:1, slug:"live", live:true, built:new Date().toISOString(), _at:Date.now(),
    city:{slug:"live", name, state:trip.state || "", timezone:tz, center, home_base:{name:name + " center", coord:center}},
    sources:["OpenStreetMap contributors (ODbL), via Photon and Nominatim"], CATS, HOODS:[], P, COORD, HRS,
    CHECKS:[{id:"p1", t:"ID / wallet / phone charger", group:"packing"}, {id:"p2", t:"Comfortable walking shoes", group:"packing"}, {id:"v1", t:"Re-check hours before you go (map hours can be out of date)", group:"before you go"}], PHOTOS:{}};
  SF.store.set(key, city);
  return city;
};

/* ---------- weather (live, free) ---------- */
SF.weather = async function(){
  const c = SF.city.city.center, k = "sf.wx." + c.join(",");
  const hit = SF.store.get(k, null); if(hit && Date.now() - hit.at < 3 * 3600e3) return hit.w;
  const j = await getJSON("https://api.open-meteo.com/v1/forecast?latitude=" + c[0] + "&longitude=" + c[1] + "&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunset&temperature_unit=fahrenheit&timezone=auto&forecast_days=7", 8000);
  if(!j) return null; SF.store.set(k, {at:Date.now(), w:j}); return j;
};
SF.wxText = code => code == null ? "" : code === 0 ? "Clear" : code <= 3 ? "Partly cloudy" : code <= 48 ? "Foggy" : code <= 67 ? "Rain" : code <= 77 ? "Snow" : code <= 82 ? "Showers" : "Storms";
