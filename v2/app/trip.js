/* spunfor.me trip logic: plan builder, saves, journal, passport, GPS check-in, sharing, flights */
"use strict";
(function(){
const SF = window.SF;

/* ---------- flights: arrival and departure shape day 1 and the last day ---------- */
SF.parseTime = s => { const m = String(s || "").trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?/); if(!m) return null; let h = +m[1] % 24; const mm = +(m[2] || 0); if(m[3]){ if(/^p/.test(m[3]) && h < 12) h += 12; if(/^a/.test(m[3]) && h === 12) h = 0; } return h * 60 + mm; };
SF.arrivalMins = function(){
  const fl = (SF.trip.flights || []).filter(f => f.date === SF.trip.arrive && f.arr);
  const t = fl.map(f => SF.parseTime(f.arr)).filter(x => x != null).sort((a, b) => b - a)[0];
  return t == null ? null : t;
};
SF.departMins = function(){
  const fl = (SF.trip.flights || []).filter(f => f.date === SF.trip.depart && f.dep);
  const t = fl.map(f => SF.parseTime(f.dep)).filter(x => x != null).sort((a, b) => a - b)[0];
  return t == null ? null : t;
};

/* ---------- plan builder ---------- */
const SLOTS = [
  {t:9 * 60, cats:["coffee"], label:"Coffee"},
  {t:10 * 60 + 30, cats:["attraction", "history", "art"], label:"Morning"},
  {t:12 * 60 + 30, cats:["eat"], label:"Lunch"},
  {t:14 * 60 + 30, cats:["nature", "art", "shop", "history", "attraction", "sports"], label:"Afternoon"},
  {t:16 * 60 + 30, cats:["coffee", "shop", "nature"], label:"Break"},
  {t:18 * 60 + 30, cats:["eat"], label:"Dinner"},
  {t:20 * 60 + 30, cats:["music", "drink", "queer"], label:"Night"}
];
/* pace changes how many stops a day gets; getting around and accessibility change how far apart they can be; kids drop nightlife */
const PACE_SLOTS = {relaxed:[0, 1, 2, 3, 5], balanced:[0, 1, 2, 3, 5, 6], adventure:[0, 1, 2, 3, 4, 5, 6, 7]};
const LATE = {t:22 * 60 + 30, cats:["music", "drink"], label:"Late"};
SF.planRules = function(){
  const t = SF.trip, a = SF.lc((t.access || []).join(" ") + " " + (t.notes || []).join(" "));
  const limited = /limited walking|wheelchair|step.free|mobility|stroller|cane/.test(a);
  const kids = (t.kids || []).length > 0 || /kid|family/.test(SF.lc(t.name || ""));
  const maxLeg = limited ? 900 : t.move === "car" ? 12000 : t.move === "transit" ? 6000 : 2200;
  const skipNight = kids || /sober|no alcohol/.test(a);
  return {limited, kids, maxLeg, skipNight, slots:(PACE_SLOTS[t.pace] || PACE_SLOTS.balanced).map(i => i === 7 ? LATE : SLOTS[i]).filter(s => !(skipNight && /Night|Late/.test(s.label)))};
};
SF.buildPlan = function(keepLocked){
  const days = SF.tripDays(); if(!days.length) return {days:[]};
  const likes = SF.trip.likes || [], R = SF.planRules(), used = new Set();
  const skip = (SF.trip.skip || []).concat(R.skipNight ? ["drink", "queer"] : []);
  const P = SF.city.P.filter(p => SF.coordOf(p) && !p.c.some(c => skip.includes(c)));
  const must = (SF.trip.must || []).map(m => SF.lc(m)).filter(m => m.length > 3);
  const mustIds = new Set(P.filter(p => must.some(m => SF.lc(p.n).includes(m) || m.includes(SF.lc(p.n)))).map(p => p.id));
  const arr = SF.arrivalMins(), dep = SF.departMins();
  const old = keepLocked ? (SF.tget("plan", null) || {days:[]}) : {days:[]};
  old.days.forEach(d => d.items.filter(i => i.lock).forEach(i => (i.p || []).forEach(id => used.add(id))));
  const out = [];
  days.forEach((d, i) => {
    const dow = SF.ymdDow(d.ymd), locked = ((old.days.find(x => x.n === d.n) || {}).items || []).filter(it => it.lock), items = locked.slice();
    const start = i === 0 && arr != null ? arr + 75 : 0, end = i === days.length - 1 && dep != null ? dep - 180 : 24 * 60;
    if(i === 0 && arr != null) items.push({k:"arrive", t:SF.hhmm(arr), h:"Land and head to " + (SF.trip.hotel && SF.trip.hotel.name || "the hotel"), fixed:true});
    let prev = SF.trip.hotel && SF.trip.hotel.lat ? [SF.trip.hotel.lat, SF.trip.hotel.lon] : SF.city.city.center;
    for(const s of R.slots){
      if(s.t < start || s.t > end - 30) continue;
      if(locked.some(l => Math.abs(SF.toM(l.t) - s.t) < 60)) continue;
      const cats = s.cats.filter(c => !skip.includes(c));
      const cand = P.filter(p => !used.has(p.id) && p.c.some(c => cats.includes(c)));
      let best = null, bs = -1e9;
      for(const p of cand){
        const st = SF.statusAt(p, {dow, mins:s.t + 15});
        if(st.state === "closed" || st.state === "later") continue;
        const m = SF.meters(prev, SF.coordOf(p));
        let sc = 0;
        if(p.c.some(c => likes.includes(c))) sc += 40;
        if(mustIds.has(p.id)) sc += 150;
        if(st.state === "open") sc += 15;
        if(SF.photoOf(p)) sc += 8;
        if(p.rating) sc += (p.rating - 4) * 10;
        if(R.kids && p.c.some(c => ["nature", "attraction", "history"].includes(c))) sc += 10;
        sc -= Math.min(m, 8000) / 200;
        if(m > R.maxLeg) sc -= 60 + (m - R.maxLeg) / 50;
        if(sc > bs){ bs = sc; best = p; }
      }
      if(best){ used.add(best.id); items.push({k:"s" + d.n + "-" + s.t, t:SF.hhmm(s.t), h:best.n, p:[best.id], c:best.c[0], slot:s.label}); prev = SF.coordOf(best); }
    }
    if(i === days.length - 1 && dep != null) items.push({k:"depart", t:SF.hhmm(dep - 150), h:"Head to the airport", fixed:true});
    items.sort((a, b) => SF.toM(a.t) - SF.toM(b.t));
    out.push({n:d.n, ymd:d.ymd, items});
  });
  return {days:out, built:Date.now()};
};
/* what could go wrong at that time: closed, not open yet, or no listed hours */
SF.itemIssue = function(p, dow, mins){
  const st = SF.statusAt(p, {dow, mins:mins + 10});
  if(st.state === "unknown") return "Hours unknown, call ahead";
  if(st.state === "closed") return "Listed as closed then";
  if(st.state === "later") return "Opens " + SF.fmtM(st.opens);
  if(st.until - mins < 45) return "Closes " + SF.fmtM(st.until);
  return "";
};
/* must-sees that aren't in the guide: look them up inside the city and add them as places (once per trip) */
SF.resolveMust = async function(){
  const must = (SF.trip.must || []).filter(m => m.length > 3), have = SF.tget("mustPlaces", null);
  const add = list => list.forEach(x => { if(!SF.byId[x.id]){ SF.city.P.push(x.p); SF.city.COORD[x.id] = x.c; SF.byId[x.id] = x.p; } });
  if(have){ add(have); return false; }
  if(!must.length){ SF.tset("mustPlaces", []); return false; }
  const missing = must.filter(m => !SF.city.P.some(p => SF.lc(p.n).includes(SF.lc(m)) || SF.lc(m).includes(SF.lc(p.n))));
  const c = SF.city.city.center, found = [];
  for(const m of missing){
    const j = await SF.getJSON("https://nominatim.openstreetmap.org/search?q=" + encodeURIComponent(m + ", " + SF.city.city.name) + "&format=jsonv2&limit=1&addressdetails=1&bounded=1&viewbox=" + [c[1] - .4, c[0] + .3, c[1] + .4, c[0] - .3].join(","), 7000);
    if(j && j[0]){ const a = j[0].address || {}, id = "M" + found.length; found.push({id, c:[+j[0].lat, +j[0].lon], p:{id, n:j[0].name || m, c:["attraction"], a:a.suburb || a.neighbourhood || "", ad:[a.house_number && a.road ? a.house_number + " " + a.road : a.road, a.city || a.town].filter(Boolean).join(", "), note:"Your must-see. Added from OpenStreetMap; hours not listed, so check before you go.", must:true}}); }
    await SF.sleep(1100);
  }
  SF.tset("mustPlaces", found); add(found);
  return found.length > 0;
};

/* reorder: trade time slots with the neighbour (fixed stops like flights never move) */
SF.moveItem = function(n, k, dir){
  const p = SF.plan(), d = p.days.find(x => x.n === n); if(!d) return;
  const mv = d.items.filter(i => !i.fixed), i = mv.findIndex(x => x.k === k), j = i + dir;
  if(i < 0 || j < 0 || j >= mv.length) return;
  const a = mv[i], b = mv[j], t = a.t; a.t = b.t; b.t = t; SF.savePlan(p);
};
SF.toggleLock = (n, k) => { const p = SF.plan(), d = p.days.find(x => x.n === n), it = d && d.items.find(i => i.k === k); if(it){ it.lock = !it.lock; SF.savePlan(p); return it.lock; } };
SF.hhmm = m => String(Math.floor(m / 60) % 24).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
SF.plan = () => { let p = SF.tget("plan", null); if(!p || !p.days || p.days.length !== SF.tripDays().length){ p = SF.buildPlan(); SF.tset("plan", p); } return p; };
SF.savePlan = p => { p.days.forEach(d => d.items.sort((a, b) => SF.toM(a.t) - SF.toM(b.t))); SF.tset("plan", p); };
SF.addToDay = function(id, n){
  const p = SF.plan(), d = p.days.find(x => x.n === n); if(!d) return;
  const last = d.items.filter(i => !i.fixed).map(i => SF.toM(i.t)).sort((a, b) => b - a)[0];
  const t = last != null ? Math.min(last + 90, 23 * 60) : 11 * 60;
  const pl = SF.byId[id];
  d.items.push({k:"u" + Date.now(), t:SF.hhmm(t), h:pl.n, p:[id], c:pl.c[0]}); SF.savePlan(p);
};
SF.swapItem = function(n, k){
  const p = SF.plan(), d = p.days.find(x => x.n === n), it = d && d.items.find(i => i.k === k); if(!it || !it.p) return;
  const usedIds = new Set(p.days.flatMap(x => x.items.flatMap(i => i.p || [])));
  const dow = SF.ymdDow(d.ymd), at = SF.coordOf(SF.byId[it.p[0]]);
  const cand = SF.city.P.filter(x => !usedIds.has(x.id) && x.c.includes(it.c) && SF.coordOf(x) && !(SF.trip.skip || []).some(s => x.c.includes(s)))
    .filter(x => { const st = SF.statusAt(x, {dow, mins:SF.toM(it.t) + 15}); return st.state === "open" || st.state === "unknown"; })
    .sort((a, b) => SF.meters(at, SF.coordOf(a)) - SF.meters(at, SF.coordOf(b)));
  if(!cand.length) return false;
  it.p = [cand[0].id]; it.h = cand[0].n; SF.savePlan(p); return cand[0];
};
SF.removeItem = (n, k) => { const p = SF.plan(), d = p.days.find(x => x.n === n); if(d){ d.items = d.items.filter(i => i.k !== k); SF.savePlan(p); } };

/* ---------- saves, journal, checklist ---------- */
SF.saved = () => SF.tget("saved", {});
SF.toggleSave = id => { const s = SF.saved(); if(s[id]) delete s[id]; else s[id] = {t:Date.now(), by:SF.me()}; SF.tset("saved", s); return !!s[id]; };
SF.visited = () => SF.tget("visited", {});
SF.me = () => SF.store.get("sf.me." + SF.trip.id, (SF.trip.travelers || [])[0] || "Me");
SF.toggleVisit = function(id, auto){
  const v = SF.visited(), before = SF.stampsFor(v).map(s => s.k);
  if(v[id]) delete v[id]; else v[id] = {t:Date.now(), r:0, n:"", auto:auto ? 1 : 0, by:SF.me()};
  SF.tset("visited", v);
  return {on:!!v[id], won:SF.stampsFor(v).filter(s => !before.includes(s.k))};
};
SF.rate = (id, r) => { const v = SF.visited(); if(v[id]){ v[id].r = v[id].r === r ? 0 : r; SF.tset("visited", v); } };
SF.note = (id, n) => { const v = SF.visited(); if(v[id]){ v[id].n = String(n).slice(0, 400); SF.tset("visited", v); } };
SF.checks = () => SF.tget("checks", {});
SF.toggleCheck = id => { const c = SF.checks(); c[id] = !c[id]; SF.tset("checks", c); };

/* ---------- passport stamps (work for any city) ---------- */
SF.STAMPS = [
  {k:"first", t:"First stop", g:"✦", f:(v) => Object.keys(v).length >= 1},
  {k:"coffee", t:"Caffeinated", g:"☕", cat:"coffee"},
  {k:"eat", t:"Fed & happy", g:"🍽", cat:"eat"},
  {k:"night", t:"Night owl", g:"☾", cats:["drink", "music", "queer"]},
  {k:"culture", t:"Culture vulture", g:"🏛", cats:["art", "history"]},
  {k:"green", t:"Into the green", g:"✿", cat:"nature"},
  {k:"landmark", t:"Landmark hunter", g:"📍", cat:"attraction"},
  {k:"shop", t:"Souvenir seeker", g:"🛍", cat:"shop"},
  {k:"five", t:"Five stops", g:"5", f:(v) => Object.keys(v).length >= 5},
  {k:"ten", t:"Seen it all", g:"10", f:(v) => Object.keys(v).length >= 10}
];
SF.stampsFor = function(v){
  const ps = Object.keys(v).map(id => SF.byId[id]).filter(Boolean);
  return SF.STAMPS.filter(s => s.f ? s.f(v) : ps.some(p => p.c.some(c => (s.cats || [s.cat]).includes(c))));
};

/* ---------- next up: next plan stop today, else closest open place not visited ---------- */
SF.nextUp = function(fromId){
  const N = SF.cityNow(), ts = SF.tripStatus(), vis = SF.visited();
  if(ts && ts.during){
    const d = SF.plan().days.find(x => x.n === ts.day);
    const it = d && d.items.find(i => SF.toM(i.t) > N.mins - 20 && !(i.p || []).includes(fromId) && !(i.p || []).some(id => vis[id]));
    if(it) return {label:it.h, when:SF.fmtM(SF.toM(it.t)), place:it.p ? SF.byId[it.p[0]] : null};
  }
  const at = fromId && SF.coordOf(SF.byId[fromId]) || (SF.here ? [SF.here.lat, SF.here.lon] : SF.origin().pt);
  const open = SF.city.P.filter(p => p.id !== fromId && !vis[p.id] && SF.coordOf(p) && SF.statusAt(p).state === "open")
    .sort((a, b) => SF.meters(at, SF.coordOf(a)) - SF.meters(at, SF.coordOf(b)));
  return open[0] ? {label:open[0].n, when:"open now", place:open[0]} : null;
};

/* ---------- GPS auto check-in (only while the app is open; nothing leaves the phone) ---------- */
const DWELL = 60000, MAX_ACC = 80;
let watchId = null, cand = null;
SF.autoOn = () => SF.store.get("sf.auto." + SF.trip.id, false);
const big = p => p.c.includes("nature") || /park|cemetery|garden|square|street|market|zoo|beach|campus|stadium/i.test(p.n);
function nearest(lat, lon, maxM){
  let best = null;
  for(const p of SF.city.P){ const c = SF.coordOf(p); if(!c) continue; const m = SF.meters([lat, lon], c); if(m <= (maxM || (big(p) ? 130 : 55)) && (!best || m < best.m)) best = {p, m}; }
  return best;
}
SF.nearestPlace = nearest;
function onPos(pos){
  const c = pos.coords; SF.here = {lat:c.latitude, lon:c.longitude, acc:c.accuracy, ts:Date.now()};
  if(c.accuracy > MAX_ACC || !SF.autoOn()) return;
  const hit = nearest(c.latitude, c.longitude); if(!hit){ cand = null; return; }
  const id = hit.p.id, skipped = SF.store.get("sf.skip." + SF.trip.id + "." + SF.cityNow().ymd, []);
  if(SF.visited()[id] || skipped.includes(id)){ cand = null; return; }
  if(!cand || cand.id !== id){ cand = {id, since:Date.now()}; return; }
  if(Date.now() - cand.since >= DWELL){ cand = null; SF.checkIn(id); }
}
SF.startWatch = function(){
  if(watchId !== null || !SF.autoOn() || !navigator.geolocation) return;
  try{ watchId = navigator.geolocation.watchPosition(onPos, err => { if(err && err.code === 1){ SF.store.set("sf.auto." + SF.trip.id, false); SF.stopWatch(); SF.toast("Location is off for this app, so auto check-in is paused."); SF.render(); } }, {enableHighAccuracy:true, maximumAge:15000, timeout:30000}); }catch(e){ watchId = null; }
};
SF.stopWatch = () => { if(watchId !== null){ try{ navigator.geolocation.clearWatch(watchId); }catch(e){} } watchId = null; cand = null; };
document.addEventListener("visibilitychange", () => document.visibilityState === "visible" ? SF.startWatch() : SF.stopWatch());
SF.setAuto = function(on){
  if(!on){ SF.store.set("sf.auto." + SF.trip.id, false); SF.stopWatch(); SF.toast("Auto check-in is off."); SF.render(); return; }
  if(!navigator.geolocation){ SF.toast("Location isn't available in this browser."); return; }
  navigator.geolocation.getCurrentPosition(pos => {
    SF.here = {lat:pos.coords.latitude, lon:pos.coords.longitude, acc:pos.coords.accuracy, ts:Date.now()};
    SF.store.set("sf.auto." + SF.trip.id, true); SF.startWatch(); SF.toast("Auto check-in is on. Go see something."); SF.render();
  }, err => SF.toast(err && err.code === 1 ? "Location was declined, so auto check-in stays off." : "Couldn't get your location right now."), {enableHighAccuracy:true, timeout:15000, maximumAge:60000});
};
SF.checkIn = function(id){
  const p = SF.byId[id]; if(!p) return;
  const r = SF.toggleVisit(id, true); if(!r.on) return;
  SF.render();
  SF.banner(p, r.won[0], SF.nextUp(id));
  try{ navigator.vibrate && navigator.vibrate([90, 50, 90]); }catch(e){}
};
SF.undoCheckIn = function(id){
  const k = "sf.skip." + SF.trip.id + "." + SF.cityNow().ymd; SF.store.set(k, SF.store.get(k, []).concat(id));
  if(SF.visited()[id]) SF.toggleVisit(id); SF.render();
};

/* ---------- sharing ---------- */
SF.shareText = async function(title, text, url){
  if(navigator.share){ try{ await navigator.share(url ? {title, text, url} : {title, text}); return; }catch(e){ if(e && e.name === "AbortError") return; } }
  try{ await navigator.clipboard.writeText(text + (url ? "\n" + url : "")); SF.toast("Copied. Paste it into a text."); }catch(e){ SF.toast("Couldn't share from this browser."); }
};
SF.recapText = function(){
  const v = SF.visited(), ids = Object.keys(v).filter(id => SF.byId[id]).sort((a, b) => v[a].t - v[b].t), st = SF.stampsFor(v), by = {};
  ids.forEach(id => { const k = new Date(v[id].t).toLocaleDateString("en-US", {weekday:"short", month:"short", day:"numeric", timeZone:SF.city.city.timezone}); (by[k] = by[k] || []).push(SF.byId[id].n + (v[id].r ? " " + "♥".repeat(v[id].r) : "") + (v[id].n ? ' ("' + v[id].n + '")' : "")); });
  let t = (SF.trip.name || SF.city.city.name + " trip") + "\n" + ids.length + " place" + (ids.length === 1 ? "" : "s") + " so far · " + st.length + " of " + SF.STAMPS.length + " passport stamps\n";
  Object.keys(by).forEach(k => { t += "\n" + k + ": " + by[k].join(", "); });
  if(st.length) t += "\n\nStamps: " + st.map(s => s.t).join(", ");
  if(!ids.length) t += "\nNothing checked in yet. Stay tuned.";
  return t + "\n\nMade with spunfor.me";
};
SF.shareRecap = () => SF.shareText("Our trip so far", SF.recapText());
SF.shareTrip = () => SF.shareText((SF.trip.name || "Our trip") + " on spunfor.me", "Here's our trip app for " + SF.city.city.name + ". Open it, then add it to your home screen:", SF.shareLink(SF.trip));
SF.publicLink = () => SF.shareLink(Object.assign({}, SF.trip, {hotel:null, flights:[], travelers:[], name:"", id:SF.trip.id + "p"}));
SF.shareTripPublic = () => SF.shareText("A trip app for " + SF.city.city.name, "Here's a " + SF.city.city.name + " trip app (no personal details in this link):", SF.publicLink());
SF.backupData = () => { const keys = ["saved", "visited", "checks", "plan", "myChecks"], data = {}; keys.forEach(k => { data[k] = SF.tget(k, null); }); return {kind:"spunfor-trip", v:1, at:new Date().toISOString(), trip:SF.trip, data}; };
SF.downloadBackup = function(){
  const blob = new Blob([JSON.stringify(SF.backupData(), null, 1)], {type:"application/json"}), a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "spunfor-" + String(SF.trip.cityName || "trip").toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + (SF.trip.arrive || "trip") + ".json";
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  SF.toast("Saved a backup file. Keep it somewhere safe.");
};
SF.restoreBackup = function(file){
  const r = new FileReader();
  r.onload = () => { try{ const j = JSON.parse(r.result); if(j.kind !== "spunfor-trip" || !j.trip || !j.trip.city) throw 0; const id = j.trip.id; Object.keys(j.data || {}).forEach(k => { if(j.data[k] != null) SF.store.set("sf." + id + "." + k, j.data[k]); }); location.href = SF.shareLink(j.trip); }catch(e){ SF.toast("That file isn't a spunfor.me trip backup."); } };
  r.readAsText(file);
};
SF.sendLocation = function(){
  if(!navigator.geolocation){ SF.toast("Location isn't available in this browser."); return; }
  SF.toast("Finding you…");
  navigator.geolocation.getCurrentPosition(pos => {
    const c = pos.coords, hit = nearest(c.latitude, c.longitude, 90), map = "https://maps.google.com/?q=" + c.latitude.toFixed(5) + "," + c.longitude.toFixed(5);
    const text = (hit ? "I'm at " + hit.p.n + (hit.p.ad ? ", " + hit.p.ad : "") + ". " : "Here's where I am: ") + map;
    if(navigator.share) SF.shareText("My location", text); else { try{ location.href = "sms:?&body=" + encodeURIComponent(text); }catch(e){ SF.shareText("My location", text); } }
  }, err => SF.toast(err && err.code === 1 ? "Location is off for this app. Turn it on in your phone's settings to send it." : "Couldn't find you just now. Try again outside."), {enableHighAccuracy:true, timeout:15000, maximumAge:20000});
};
})();
