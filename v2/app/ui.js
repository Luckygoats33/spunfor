/* spunfor.me app screens */
"use strict";
(function(){
const SF = window.SF, $ = SF.$, $$ = SF.$$, esc = SF.esc;
const S = SF.S = {tab:"home", cat:null, sub:"plan", q:"", f:"all", radius:15, mapOpen:false};
const CAT_COLOR = {coffee:"#8B5A2B", eat:"#E3000F", drink:"#7B2CBF", music:"#1D4ED8", art:"#DB2777", history:"#4B5563", nature:"#0B7A3E", attraction:"#EA580C", shop:"#0891B2", sports:"#65A30D", queer:"#C026D3"};
SF.CAT_COLOR = CAT_COLOR;

/* ---------- toast ---------- */
SF.toast = function(msg){ const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(SF.toast.t); SF.toast.t = setTimeout(() => { t.hidden = true; }, 3200); };

/* ---------- theme: traveler's accent + light/dark ---------- */
function applyTheme(){
  const r = document.documentElement, t = SF.trip;
  r.style.setProperty("--accent", t.color || "#E3000F");
  r.style.setProperty("--accent-ink", t.ink || "#FFFFFF");
  const mode = SF.store.get("sf.mode", "auto");
  if(mode === "auto") r.removeAttribute("data-mode"); else r.setAttribute("data-mode", mode);
}

/* ---------- boot ---------- */
async function boot(){
  SF.trip = SF.loadTrip();
  if(!SF.trip){ $("#main").innerHTML = '<div class="loading"><b>No trip yet.</b><span>Build one in two minutes.</span><a class="btn pri" href="../#build">Build my trip app</a></div>'; $(".tabs").hidden = true; $("#askFab").hidden = true; return; }
  applyTheme();
  const live = String(SF.trip.city).startsWith("live:");
  if(live){ $("#boot").innerHTML = '<b>Spinning up ' + esc(SF.trip.cityName) + '…</b><span id="bootMsg">Building it live from map data. About 30 seconds, only the first time.</span><div class="bar"><i></i></div>'; }
  SF.onLiveProgress = m => { const b = $("#bootMsg"); if(b) b.textContent = m; };
  try{ SF.city = await SF.loadCity(SF.trip); }catch(e){ $("#main").innerHTML = '<div class="loading"><b>Couldn\'t load ' + esc(SF.trip.cityName || "this city") + '.</b><span>' + esc(e.message || "Check your connection and try again.") + '</span><button class="btn pri" onclick="location.reload()">Try again</button></div>'; return; }
  SF.byId = Object.fromEntries(SF.city.P.map(p => [p.id, p]));
  document.title = (SF.trip.name || SF.city.city.name) + " · spunfor.me";
  const days = SF.tripDays();
  $("#tripName").textContent = SF.city.city.name + (days.length ? " · " + SF.dayLabel(days[0].ymd).replace(/^\w+, /, "") + (days.length > 1 ? "–" + SF.dayLabel(days[days.length - 1].ymd).replace(/^\w+, \w+ /, "") : "") : "");
  if(!SF.store.get("sf.me." + SF.trip.id, null) && (SF.trip.travelers || []).length > 1) setTimeout(askWho, 600);
  window.addEventListener("hashchange", route);
  route(); SF.startWatch();
  if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  if(SF.trip.likes === undefined) SF.trip.likes = [];
}

/* ---------- routing ---------- */
const TABS = {home:"home", now:"home", explore:"explore", cat:"explore", map:"map", saved:"saved", more:"more"};
function route(){
  const h = location.hash.slice(1) || "home", [tab, arg] = h.split(".");
  S.tab = TABS[tab] ? tab : "home";
  if(tab === "cat") S.cat = arg; if(tab === "saved" && arg) S.sub = arg;
  $$(".tabs a").forEach(a => a.setAttribute("aria-current", a.dataset.tab === TABS[S.tab] ? "page" : "false"));
  SF.render(); window.scrollTo(0, 0);
}
SF.render = function(){
  if(!SF.city) return;
  const V = {home:vHome, now:vNow, explore:vExplore, cat:vCat, map:vMap, saved:vSaved, more:vMore}[S.tab] || vHome;
  const keepY = window.scrollY;
  $("#main").innerHTML = '<div class="view">' + V() + '</div>';
  if(S.tab === "map") drawMap();
  if(S.tab === "home") fillWeather();
  window.scrollTo(0, keepY);
};

/* ---------- small renderers ---------- */
const stCls = st => st.state === "open" ? (st.closesSoon ? "later" : "open") : st.state;
const stShort = st => st.state === "open" ? (st.closesSoon ? "Closes " + SF.fmtM(st.until) : "Open") : st.state === "later" ? "Opens " + SF.fmtM(st.opens) : st.state === "closed" ? "Closed" : "Hours n/a";
function row(p, extra){
  const st = SF.statusAt(p), di = SF.distInfo(p), ph = SF.photoOf(p);
  const img = ph ? '<img class="th" src="' + esc(ph.src.replace(/width=\d+/, "width=160")) + '" alt="" loading="lazy" width="56" height="56">' : '<span class="ic" aria-hidden="true">' + (SF.CAT_ICON[p.c[0]] || "•") + '</span>';
  return '<button class="row" type="button" data-open="' + p.id + '">' + img + '<span class="rb"><span class="rn">' + esc(p.n) + '</span><span class="rs">' + esc([SF.city.CATS[p.c[0]], p.a, di && di.txt].filter(Boolean).join(" · ")) + (extra ? " · " + esc(extra) : "") + '</span></span><span class="st ' + stCls(st) + '">' + esc(stShort(st)) + '</span></button>';
}
const byDist = (a, b) => { const x = SF.distInfo(a), y = SF.distInfo(b); return (x ? x.m : 1e9) - (y ? y.m : 1e9); };
const greet = () => { const m = SF.cityNow().mins / 60; return m < 5 ? "Still up" : m < 12 ? "Good morning" : m < 17 ? "Good afternoon" : m < 22 ? "Good evening" : "Late night"; };
const names = () => { const t = SF.trip.travelers || []; return t.length ? (t.length === 1 ? t[0] : t.length === 2 ? t[0] + " & " + t[1] : t.slice(0, -1).join(", ") + " & " + t[t.length - 1]) : ""; };

/* ---------- HOME ---------- */
function vHome(){
  const N = SF.cityNow(), ts = SF.tripStatus();
  let h = '<section class="hero"><p class="k">' + esc(SF.city.city.name) + (SF.city.city.state ? ", " + esc(SF.city.city.state) : "") + (SF.city.live ? ' <span class="tag">live beta</span>' : "") + '</p>'
    + '<h1>' + greet() + (names() ? ',<br><em>' + esc(names()) + '.</em>' : '.') + '</h1>'
    + '<div class="meta"><span>Local time<b>' + esc(SF.DOWL[N.dow].slice(0, 3) + " " + SF.fmtM(N.mins)) + '</b></span>' + (ts ? '<span>Trip<b>' + esc(ts.txt) + '</b></span>' : '') + '<span id="wxNow">Weather<b>…</b></span></div></section>';
  /* next up */
  const plan = SF.tripDays().length ? SF.plan() : null;
  if(ts && ts.during){ const nx = SF.nextUp(); if(nx) h += '<section class="card acc"><span class="ck">Next up · ' + esc(nx.when) + '</span><h3>' + esc(nx.label) + '</h3>' + (nx.place ? '<div class="btns"><a class="btn pri" href="' + esc(SF.dirUrl(nx.place)) + '" target="_blank" rel="noopener">Directions</a><button class="btn" type="button" data-open="' + nx.place.id + '">Details</button></div>' : '') + '</section>'; }
  else if(ts && ts.before && plan && plan.days[0]){ const d = plan.days[0]; h += '<section class="card acc"><span class="ck">Day 1 · ' + esc(SF.dayLabel(d.ymd, true)) + '</span><h3>' + esc(d.items.filter(i => !i.fixed).slice(0, 3).map(i => i.h).join(" → ") || "Your plan is ready") + '</h3><a class="linky" href="#saved.plan">See the whole plan →</a></section>'; }
  /* flights */
  h += flightsCard();
  /* right now */
  const open = SF.city.P.filter(p => SF.statusAt(p).state === "open" && !(SF.trip.skip || []).some(c => p.c.includes(c))).sort(byDist).slice(0, 4);
  h += '<section class="sec"><div class="sec-h"><h2>Open right now</h2><a href="#now">See all</a></div>' + (open.length ? '<div class="list">' + open.map(p => row(p)).join("") + '</div>' : '<p class="empty">Nothing with listed hours is open right now. <a href="#explore">Browse everything</a>.</p>') + '</section>';
  /* tiles */
  const cats = Object.keys(SF.city.CATS).filter(c => !(SF.trip.skip || []).includes(c));
  h += '<section class="sec"><div class="sec-h"><h2>Jump to</h2></div><div class="tiles">'
    + '<a class="tile" href="#saved.plan"><span class="ti" aria-hidden="true">◷</span><b>Trip plan</b><span>' + (SF.tripDays().length ? SF.tripDays().length + " days, built for you" : "Add dates to get a plan") + '</span></a>'
    + '<a class="tile" href="#map"><span class="ti" aria-hidden="true">◎</span><b>Near me</b><span>Within a 15-min walk</span></a>'
    + cats.slice(0, 6).map(c => '<a class="tile" href="#cat.' + c + '"><span class="ti" aria-hidden="true">' + (SF.CAT_ICON[c] || "•") + '</span><b>' + esc(SF.city.CATS[c]) + '</b><span>' + SF.city.P.filter(p => p.c.includes(c)).length + ' places</span></a>').join("")
    + '</div></section>';
  h += '<section class="sec"><div class="sec-h"><h2>7-day weather</h2></div><div class="wx" id="wxDays"><div>Loading…</div></div></section>';
  h += '<section class="card"><h3>Traveling with someone?</h3><p class="muted small">Send them this app. They get the same trip and plan on their phone.</p><div class="btns"><button class="btn pri" type="button" data-act="shareTrip">Send the app</button><button class="btn" type="button" data-act="shareRecap">Share a recap</button></div></section>';
  return h;
}
function flightsCard(){
  const fl = SF.trip.flights || []; if(!fl.length) return "";
  const hotel = SF.trip.hotel;
  return fl.map(f => '<section class="card acc"><span class="ck">Flight · ' + esc(SF.dayLabel(f.date)) + '</span><h3>' + esc((f.who ? f.who + " lands " : "Lands ") + (f.arr || "")) + '</h3>'
    + '<div class="legs"><div class="leg"><b>' + esc(f.no || "Flight") + '</b><span>' + esc([f.route, f.dep && "departs " + f.dep, f.arr && "arrives " + f.arr].filter(Boolean).join(" · ")) + '</span></div></div>'
    + '<div class="btns">' + (f.no ? '<a class="btn" href="https://www.flightaware.com/live/flight/' + esc(f.no.replace(/\s+/g, "")) + '" target="_blank" rel="noopener">Live status</a>' : '') + (hotel && hotel.lat ? '<a class="btn pri" href="' + esc(SF.uberUrl(hotel.lat, hotel.lon, hotel.name, hotel.ad)) + '" target="_blank" rel="noopener">Uber to the hotel</a>' : '') + '</div></section>').join("");
}
async function fillWeather(){
  const w = await SF.weather(); const now = $("#wxNow"), days = $("#wxDays");
  if(!w){ if(now) now.innerHTML = "Weather<b>n/a</b>"; if(days) days.innerHTML = "<div>Weather unavailable</div>"; return; }
  if(now && w.current) now.innerHTML = "Weather<b>" + Math.round(w.current.temperature_2m) + "°F " + esc(SF.wxText(w.current.weather_code)) + "</b>";
  if(days && w.daily) days.innerHTML = w.daily.time.map((d, i) => '<div><span>' + esc(SF.dayLabel(d).split(",")[0]) + '</span><b>' + Math.round(w.daily.temperature_2m_max[i]) + '°</b><span class="muted">' + Math.round(w.daily.temperature_2m_min[i]) + '° · ' + (w.daily.precipitation_probability_max[i] ?? 0) + '% rain</span></div>').join("");
}

/* ---------- OPEN NOW ---------- */
function vNow(){
  const q = SF.lc(S.q), cats = Object.keys(SF.city.CATS);
  let ps = SF.city.P.filter(p => SF.statusAt(p).state === "open");
  if(S.f !== "all") ps = ps.filter(p => p.c.includes(S.f));
  if(q) ps = ps.filter(p => SF.lc(p.n + " " + (p.note || "") + " " + (p.a || "")).includes(q));
  ps.sort(byDist);
  const N = SF.cityNow();
  return '<section class="hero"><p class="k">Open now · ' + esc(SF.DOWL[N.dow].slice(0, 3) + " " + SF.fmtM(N.mins)) + ' in ' + esc(SF.city.city.name) + '</p><h1>What\'s open<br><em>right now.</em></h1></section>'
    + '<div class="search"><label class="sr" for="nowQ">Search open places</label><input id="nowQ" type="search" placeholder="Search open places" value="' + esc(S.q) + '"></div>'
    + '<div class="chips" role="group" aria-label="Filter by type"><button class="chip" type="button" data-f="all" aria-pressed="' + (S.f === "all") + '">All</button>' + cats.map(c => { const n = SF.city.P.filter(p => p.c.includes(c) && SF.statusAt(p).state === "open").length; return n ? '<button class="chip" type="button" data-f="' + c + '" aria-pressed="' + (S.f === c) + '">' + esc(SF.city.CATS[c]) + ' <span class="n">' + n + '</span></button>' : ""; }).join("") + '</div>'
    + (ps.length ? '<div class="list">' + ps.map(p => row(p)).join("") + '</div>' : '<p class="empty">Nothing matching is open right now. Try All, or check <a href="#explore">Explore</a>.</p>')
    + '<p class="src">Hours come from ' + (SF.city.live ? "OpenStreetMap" : "OpenStreetMap and Wikidata") + ' and can be out of date. Places without listed hours are not shown here.</p>';
}

/* ---------- EXPLORE ---------- */
function vExplore(){
  const cats = Object.keys(SF.city.CATS);
  const q = SF.lc(S.q);
  let h = '<section class="hero"><p class="k">Explore</p><h1>' + esc(SF.city.city.name) + ',<br><em>sorted.</em></h1></section>'
    + '<div class="search"><label class="sr" for="exQ">Search every place</label><input id="exQ" type="search" placeholder="Search ' + SF.city.P.length + ' places" value="' + esc(S.q) + '"></div>';
  if(q){ const ps = SF.city.P.filter(p => SF.lc(p.n + " " + (p.note || "") + " " + (p.a || "") + " " + p.c.map(c => SF.city.CATS[c]).join(" ")).includes(q)).sort(byDist); return h + (ps.length ? '<div class="list">' + ps.map(p => row(p)).join("") + '</div>' : '<p class="empty">Nothing in the guide matches "' + esc(S.q) + '". <button class="btn" type="button" data-askfor="' + esc(S.q) + '">Ask to find it nearby</button></p>'); }
  h += '<div class="cats">' + cats.map(c => {
    const ps = SF.city.P.filter(p => p.c.includes(c)), withPh = ps.find(p => SF.photoOf(p)), ph = withPh && SF.photoOf(withPh);
    return '<a class="cat' + (ph ? "" : " noimg") + '" href="#cat.' + c + '"' + (ph ? ' style="background-image:url(\'' + esc(ph.src.replace(/width=\d+/, "width=480")) + '\')"' : "") + '><b>' + esc(SF.city.CATS[c]) + '</b><span>' + ps.length + ' places' + ((SF.trip.likes || []).includes(c) ? " · you love this" : (SF.trip.skip || []).includes(c) ? " · you skip this" : "") + '</span></a>';
  }).join("") + '</div>';
  return h + (SF.city.live ? '<p class="src">Built live from OpenStreetMap. Photos and notes arrive when ' + esc(SF.city.city.name) + ' is fully curated.</p>' : '<p class="src">Photos from Wikimedia Commons, credited on each place.</p>');
}
function vCat(){
  const c = S.cat, label = SF.city.CATS[c] || "Places";
  const ps = SF.city.P.filter(p => p.c.includes(c)).sort((a, b) => { const sa = SF.statusAt(a).state === "open" ? 0 : 1, sb = SF.statusAt(b).state === "open" ? 0 : 1; return sa - sb || byDist(a, b); });
  return '<a class="linky" href="#explore">← Explore</a><section class="hero"><p class="k">' + ps.length + ' places · open first</p><h1>' + esc(label) + '</h1></section><div class="list">' + ps.map(p => row(p)).join("") + '</div>';
}

/* ---------- MAP ---------- */
let LMAP = null, LAYER = null;
function vMap(){
  const cats = Object.keys(SF.city.CATS);
  return '<section class="hero"><p class="k">Map · from ' + esc(SF.origin().from) + '</p><h1>What\'s within<br><em>' + S.radius + ' minutes.</em></h1></section>'
    + '<div class="maptools"><label class="sr" for="mRad">Walking time</label><select id="mRad">' + [5, 10, 15, 20, 30].map(m => '<option value="' + m + '"' + (S.radius === m ? " selected" : "") + '>' + m + ' min walk</option>').join("") + '<option value="0"' + (!S.radius ? " selected" : "") + '>Show everything</option></select>'
    + '<label class="sr" for="mCat">Type</label><select id="mCat"><option value="all">All types</option>' + cats.map(c => '<option value="' + c + '"' + (S.f === c ? " selected" : "") + '>' + esc(SF.city.CATS[c]) + '</option>').join("") + '</select>'
    + '<button class="chip" type="button" id="mOpen" aria-pressed="' + S.mapOpen + '">Open now</button><button class="chip" type="button" id="mLocate">Find me</button></div>'
    + '<div class="mapwrap"><div class="lmap" id="lmap" role="region" aria-label="Map of places"></div></div>'
    + '<div class="legend" aria-label="Map key">' + cats.map(c => '<span><i style="background:' + (CAT_COLOR[c] || "#111") + '"></i>' + esc(SF.city.CATS[c]) + '</span>').join("") + '</div>'
    + '<section class="sec"><div class="sec-h"><h2 id="mCount">In range</h2></div><div class="list" id="mList"></div></section>';
}
function mapPlaces(){
  const o = SF.origin(), rM = S.radius ? S.radius * 80 / 1.25 : Infinity;
  return SF.city.P.filter(p => SF.coordOf(p) && (S.f === "all" || p.c.includes(S.f)) && (!S.mapOpen || SF.statusAt(p).state === "open") && SF.meters(o.pt, SF.coordOf(p)) <= rM).sort(byDist);
}
function drawMap(){
  if(!window.L){ setTimeout(drawMap, 200); return; }
  const el = $("#lmap"); if(!el) return;
  if(LMAP){ LMAP.remove(); LMAP = null; }
  const o = SF.origin();
  LMAP = L.map(el, {zoomControl:true, scrollWheelZoom:false, tap:true}).setView(o.pt, 14);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom:19, attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(LMAP);
  LMAP.on("click", () => LMAP.scrollWheelZoom.enable());
  LAYER = L.layerGroup().addTo(LMAP);
  const ps = mapPlaces();
  if(S.radius) L.circle(o.pt, {radius:S.radius * 80 / 1.25, color:getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#E3000F", weight:2, dashArray:"6 6", fill:false}).addTo(LAYER);
  const h = SF.trip.hotel; if(h && h.lat) L.marker([h.lat, h.lon], {icon:L.divIcon({className:"", html:'<div class="mhotel" title="Hotel">H</div>', iconSize:[22, 22]}), title:h.name || "Hotel"}).addTo(LAYER);
  if(SF.here) L.marker([SF.here.lat, SF.here.lon], {icon:L.divIcon({className:"", html:'<div class="mhere"></div>', iconSize:[18, 18]}), title:"You"}).addTo(LAYER);
  ps.forEach(p => { const st = SF.statusAt(p); const m = L.marker(SF.coordOf(p), {icon:L.divIcon({className:"", html:'<div class="mpin' + (st.state === "open" ? " open" : "") + '" style="--pc:' + (CAT_COLOR[p.c[0]] || "#111") + '"></div>', iconSize:[16, 16]}), title:p.n, keyboard:true}); m.on("click", () => SF.openPlace(p.id)); m.bindTooltip(p.n); m.addTo(LAYER); });
  if(ps.length && !S.radius){ LMAP.fitBounds(L.latLngBounds(ps.map(p => SF.coordOf(p))).pad(.1)); }
  else if(S.radius){ LMAP.fitBounds(L.latLng(o.pt).toBounds(S.radius * 80 / 1.25 * 2.2)); }
  $("#mCount").textContent = ps.length + " in range" + (S.radius ? " · " + S.radius + " min walk" : "");
  $("#mList").innerHTML = ps.slice(0, 40).map(p => row(p)).join("") || '<p class="empty">Nothing here. Try a longer walk or "Show everything".</p>';
}

/* ---------- TRIP (saved) ---------- */
function vSaved(){
  const subs = [["plan", "Plan"], ["saved", "Saved"], ["journal", "Journal"], ["passport", "Passport"], ["list", "Checklist"]];
  const body = {plan:vPlan, saved:vSavedList, journal:vJournal, passport:vPassport, list:vChecklist}[S.sub] || vPlan;
  return '<section class="hero"><p class="k">' + esc(SF.trip.name || SF.city.city.name + " trip") + '</p><h1>Your trip.</h1></section>'
    + '<div class="subtabs" role="tablist" aria-label="Trip sections">' + subs.map(([k, l]) => '<button type="button" role="tab" data-sub="' + k + '" aria-selected="' + (S.sub === k) + '">' + l + '</button>').join("") + '</div><div class="sec">' + body() + '</div>';
}
function vPlan(){
  if(!SF.tripDays().length) return '<p class="empty">Add trip dates to get a day-by-day plan.</p>';
  const plan = SF.plan(), ts = SF.tripStatus();
  let h = '<p class="muted small">Built from what you love' + ((SF.trip.flights || []).length ? ", timed around your flights" : "") + ' and opening hours. Swap (↻) or remove (×) anything; add places from their details.</p>';
  plan.days.forEach(d => {
    h += '<div class="day"><div class="day-h"><b>Day ' + d.n + '</b><span class="muted small">' + esc(SF.dayLabel(d.ymd, true)) + (ts && ts.during && ts.day === d.n ? " · today" : "") + '</span></div>';
    if(!d.items.length) h += '<p class="empty">Open day. Add places from Explore or the map.</p>';
    let prev = null;
    d.items.forEach(it => {
      const p = it.p && SF.byId[it.p[0]];
      if(prev && p && SF.coordOf(prev) && SF.coordOf(p)){ const tr = SF.travel(SF.meters(SF.coordOf(prev), SF.coordOf(p))); h += '<div class="conn">' + esc(tr.txt) + '</div>'; }
      h += '<div class="item' + (it.fixed ? " fixed" : "") + '"><span class="t">' + esc(SF.fmtM(SF.toM(it.t))) + '</span><span class="what">' + (p ? '<button type="button" data-open="' + p.id + '">' + esc(it.h) + '</button><span class="rs">' + esc([SF.city.CATS[p.c[0]], p.a].filter(Boolean).join(" · ")) + '</span>' : '<b>' + esc(it.h) + '</b>') + '</span>'
        + (it.fixed ? '<span></span>' : '<span class="acts">' + (p ? '<button type="button" data-swap="' + d.n + '|' + it.k + '" aria-label="Swap ' + esc(it.h) + ' for something similar">↻</button>' : '') + '<button type="button" data-rm="' + d.n + '|' + it.k + '" aria-label="Remove ' + esc(it.h) + '">×</button></span>') + '</div>';
      if(p) prev = p;
    });
    h += '</div>';
  });
  return h + '<div class="btns"><button class="btn" type="button" data-act="rebuild">Rebuild the plan</button></div>';
}
function vSavedList(){
  const s = SF.saved(), ids = Object.keys(s).filter(id => SF.byId[id]).sort((a, b) => s[b].t - s[a].t);
  return ids.length ? '<div class="list">' + ids.map(id => row(SF.byId[id], s[id].by ? "saved by " + s[id].by : "")).join("") + '</div>' : '<p class="empty">Nothing saved yet. Tap Save on any place.</p>';
}
function autoCard(){
  const on = SF.autoOn();
  return '<div class="card"><div class="switchrow"><div><h3>Auto check-in</h3><p class="muted small">' + (on ? "On. Spend a minute at a place and it lands here, earns stamps and shows what's next." : "Let GPS add places as you visit them. Only while the app is open; your location never leaves the phone.") + '</p></div><button class="switch" type="button" role="switch" aria-checked="' + on + '" aria-label="Auto check-in" data-act="auto"><i></i></button></div>'
    + '<div class="btns"><button class="btn pri" type="button" data-act="shareRecap">Share recap</button><button class="btn" type="button" data-act="sendLoc">Send my location</button></div></div>';
}
function vJournal(){
  const v = SF.visited(), ids = Object.keys(v).filter(id => SF.byId[id]).sort((a, b) => v[b].t - v[a].t);
  return autoCard() + (ids.length ? ids.map(id => { const p = SF.byId[id], e = v[id];
    return '<div class="sec" style="border-bottom:1px solid var(--hair);padding-bottom:12px"><button class="row" type="button" data-open="' + id + '" style="border:0"><span class="ic" aria-hidden="true">' + (SF.CAT_ICON[p.c[0]] || "•") + '</span><span class="rb"><span class="rn">' + esc(p.n) + '</span><span class="rs">' + esc(new Date(e.t).toLocaleString("en-US", {weekday:"short", hour:"numeric", minute:"2-digit", timeZone:SF.city.city.timezone})) + (e.auto ? " · auto check-in" : "") + (e.by ? " · " + esc(e.by) : "") + '</span></span><span></span></button>'
      + '<div class="hearts" role="group" aria-label="Rate ' + esc(p.n) + '">' + [1, 2, 3, 4, 5].map(n => '<button type="button" class="' + (n <= (e.r || 0) ? "on" : "") + '" data-rate="' + id + '|' + n + '" aria-label="' + n + ' of 5">♥</button>').join("") + '</div>'
      + '<label class="sr" for="n-' + id + '">Memory</label><input class="note" id="n-' + id + '" data-note="' + id + '" placeholder="A memory from here…" value="' + esc(e.n || "") + '" maxlength="400"><button class="linky" type="button" data-visit="' + id + '" style="border:0;background:none;cursor:pointer;padding:0">Remove from journal</button></div>'; }).join("") : '<p class="empty">Your journal fills in as you go. Turn on auto check-in, or tap Mark visited on a place.</p>');
}
function vPassport(){
  const got = SF.stampsFor(SF.visited()).map(s => s.k);
  return '<p class="muted small">' + got.length + ' of ' + SF.STAMPS.length + ' stamps. They fill in as you check in.</p><div class="prog"><i style="width:' + (got.length / SF.STAMPS.length * 100) + '%"></i></div>'
    + '<div class="stamps">' + SF.STAMPS.map(s => '<div class="stamp' + (got.includes(s.k) ? " got" : "") + '"><span class="g" aria-hidden="true">' + esc(s.g) + '</span><b>' + esc(s.t) + '</b><span class="small">' + (got.includes(s.k) ? "Collected" : "Not yet") + '</span></div>').join("") + '</div>' + autoCard();
}
function vChecklist(){
  const c = SF.checks(), extra = SF.tget("myChecks", []), all = SF.city.CHECKS.concat(extra);
  const groups = {}; all.forEach(x => (groups[x.group || "packing"] = groups[x.group || "packing"] || []).push(x));
  return Object.keys(groups).map(g => '<div class="sec"><div class="sec-h"><h3>' + esc(g[0].toUpperCase() + g.slice(1)) + '</h3></div>' + groups[g].map(x => '<button class="check" type="button" role="checkbox" aria-checked="' + !!c[x.id] + '" data-check="' + x.id + '"><span class="box" aria-hidden="true">' + (c[x.id] ? "✓" : "") + '</span><span class="lbl">' + esc(x.t) + '</span></button>').join("") + '</div>').join("")
    + '<form class="search" id="addCheck"><label class="sr" for="ckIn">Add to checklist</label><input id="ckIn" placeholder="Add something to remember" maxlength="80"><button class="btn pri" type="submit">Add</button></form>';
}

/* ---------- MORE ---------- */
function vMore(){
  const t = SF.trip, mode = SF.store.get("sf.mode", "auto");
  const photos = Object.entries(SF.city.PHOTOS || {});
  return '<section class="hero"><p class="k">More</p><h1>Settings<br><em>&amp; help.</em></h1></section>'
    + '<section class="sec"><div class="sec-h"><h2>Your trip</h2></div><dl class="kv"><dt>City</dt><dd>' + esc(SF.city.city.name) + (SF.city.live ? " (live beta)" : "") + '</dd><dt>Dates</dt><dd>' + (SF.tripDays().length ? esc(SF.dayLabel(t.arrive, true)) + (t.depart && t.depart !== t.arrive ? " to " + esc(SF.dayLabel(t.depart, true)) : "") : "Not set") + '</dd><dt>Travelers</dt><dd>' + esc(names() || "Just you") + '</dd><dt>Hotel</dt><dd>' + esc(t.hotel ? (t.hotel.name + (t.hotel.ad ? ", " + t.hotel.ad : "")) : "Not set") + '</dd><dt>This phone</dt><dd>' + esc(SF.me()) + ((t.travelers || []).length > 1 ? ' <button class="linky" type="button" data-act="who" style="border:0;background:none;cursor:pointer;padding:0 0 0 6px">change</button>' : "") + '</dd></dl>'
    + '<div class="btns"><button class="btn pri" type="button" data-act="shareTrip">Send this app to someone</button><a class="btn" href="../#build">Plan another trip</a></div></section>'
    + '<section class="sec"><div class="sec-h"><h2>Look</h2></div><div class="chips" role="radiogroup" aria-label="Light or dark">' + [["auto", "Match phone"], ["light", "Light"], ["dark", "Dark"]].map(([k, l]) => '<button class="chip" type="button" role="radio" data-mode="' + k + '" aria-checked="' + (mode === k) + '" aria-pressed="' + (mode === k) + '">' + l + '</button>').join("") + '</div>'
    + '<div class="chips" role="radiogroup" aria-label="Accent color">' + ["#E3000F", "#111111", "#1D4ED8", "#0B7A3E", "#C8F31D", "#DB2777", "#D9A441"].map(c => '<button class="swatch" type="button" role="radio" data-color="' + c + '" aria-checked="' + (SF.trip.color === c) + '" aria-label="Accent ' + c + '" style="background:' + c + '"></button>').join("") + '</div></section>'
    + '<section class="sec"><div class="sec-h"><h2>How it works</h2></div><div class="list">'
    + [["Open now", "The button at the top shows only what's open this minute, in " + SF.city.city.name + " time."], ["Trip", "Your day-by-day plan, saves, journal, passport and checklist."], ["Ask", "Ask anything. If it isn't in the guide, it finds real places nearby with hours and directions."], ["Auto check-in", "Turn it on in Trip → Journal. GPS works only while the app is open."], ["Add to home screen", "iPhone: Share → Add to Home Screen. Android: menu → Install app."]].map(([a, b]) => '<div class="row" style="cursor:default;grid-template-columns:1fr"><span class="rb"><span class="rn">' + a + '</span><span class="rs" style="white-space:normal">' + b + '</span></span></div>').join("") + '</div></section>'
    + '<section class="sos"><h3>Emergency</h3><p class="small">In an emergency call 911. For a mental health crisis, call or text 988.</p><div class="btns"><a class="btn" href="tel:911">Call 911</a><a class="btn" href="tel:988">Call 988</a><button class="btn" type="button" data-act="sendLoc">Send my location</button></div></section>'
    + '<section class="sec"><div class="sec-h"><h2>Sources</h2></div><p class="small muted">' + esc(SF.city.sources.join(" · ")) + '. Hours and details can be wrong; check before you go.</p>'
    + (photos.length ? '<details><summary class="linky" style="cursor:pointer">Photo credits (' + photos.length + ')</summary><div class="credits">' + photos.map(([id, p]) => '<span>' + esc((SF.byId[id] || {}).n || id) + ': <a href="' + esc(p.page) + '" target="_blank" rel="noopener">' + esc(p.credit.replace(/^Photo: /, "")) + '</a></span>').join("") + '</div></details>' : '') + '</section>'
    + '<section class="sec"><button class="btn" type="button" data-act="reset">Reset this phone\'s saves for this trip</button></section>';
}

/* ---------- place sheet ---------- */
SF.openPlace = function(id){
  const p = SF.byId[id]; if(!p) return;
  const st = SF.statusAt(p), di = SF.distInfo(p), ph = SF.photoOf(p), rows = SF.hoursRows(p), N = SF.cityNow(), c = SF.coordOf(p);
  const saved = !!SF.saved()[id], vis = !!SF.visited()[id], days = SF.tripDays();
  const src = (SF.city.HRS[id] || {}).src;
  const html = '<div class="scrim" id="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="shT">'
    + (ph ? '<img class="ph" src="' + esc(ph.src) + '" alt="' + esc(p.n) + '" width="640" height="360"><p class="cr"><a href="' + esc(ph.page) + '" target="_blank" rel="noopener">' + esc(ph.credit) + '</a></p>' : '')
    + '<div class="sheet-in"><div class="sheet-h"><div><p class="k">' + esc(p.c.map(x => SF.city.CATS[x]).filter(Boolean).join(" · ")) + '</p><h2 id="shT">' + esc(p.n) + '</h2>' + (p.a ? '<p class="muted small">' + esc(p.a) + '</p>' : '') + '</div><button class="x" type="button" data-close aria-label="Close">×</button></div>'
    + '<p class="st ' + stCls(st) + '" style="text-align:left;font-size:.95rem">' + esc(SF.statusText(st)) + (di ? '<span class="muted" style="font-weight:400"> · ' + esc(di.txt + " · " + SF.miles(di.m) + " from " + di.from) + '</span>' : '') + '</p>'
    + '<div class="btns"><a class="btn pri" href="' + esc(SF.dirUrl(p, di && di.mode === "car" ? "driving" : "walking")) + '" target="_blank" rel="noopener">Directions</a><a class="btn" href="' + esc(SF.appleUrl(p)) + '" target="_blank" rel="noopener">Apple Maps</a>' + (c ? '<a class="btn" href="' + esc(SF.uberUrl(c[0], c[1], p.n, p.ad)) + '" target="_blank" rel="noopener">Uber</a><a class="btn" href="' + esc(SF.lyftUrl(c[0], c[1])) + '" target="_blank" rel="noopener">Lyft</a>' : '') + '</div>'
    + '<div class="btns"><button class="btn" type="button" data-save="' + id + '" aria-pressed="' + saved + '">' + (saved ? "Saved ✓" : "Save") + '</button><button class="btn" type="button" data-visit="' + id + '" aria-pressed="' + vis + '">' + (vis ? "Visited ✓" : "Mark visited") + '</button><button class="btn" type="button" data-shareplace="' + id + '">Share</button></div>'
    + (days.length ? '<div class="dayline" role="group" aria-label="Add to a day"><span class="small muted" style="align-self:center">Add to</span>' + days.map(d => '<button class="chip" type="button" data-addday="' + id + '|' + d.n + '">Day ' + d.n + '</button>').join("") + '</div>' : '')
    + (p.note ? '<p>' + esc(p.note.replace(/Hours: [^.]*\.?/, "").trim()) + '</p>' : '')
    + (rows ? '<table class="hrs"><caption class="sr">Opening hours</caption>' + rows.map(([d, t, i]) => '<tr' + (i === N.dow ? ' class="today"' : '') + '><td>' + d + '</td><td>' + esc(t) + '</td></tr>').join("") + '</table><p class="src">Hours from ' + esc(src === "osm" ? "OpenStreetMap" : (src || "map data")) + '. Check before you go.</p>' : (p.hoursRaw ? '<p class="small">Listed hours: ' + esc(p.hoursRaw) + '</p>' : '<p class="small muted">No hours listed. Call ahead.</p>'))
    + '<dl class="kv">' + (p.ad ? '<dt>Address</dt><dd>' + esc(p.ad) + '</dd>' : '') + (p.ph ? '<dt>Phone</dt><dd><a href="tel:' + esc(p.ph.replace(/[^\d+]/g, "")) + '">' + esc(p.ph) + '</a></dd>' : '') + (p.url ? '<dt>Website</dt><dd><a href="' + esc(/^https?:/.test(p.url) ? p.url : "https://" + p.url) + '" target="_blank" rel="noopener">' + esc(p.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")) + '</a></dd>' : '') + (p.wp_url ? '<dt>More</dt><dd><a href="' + esc(p.wp_url) + '" target="_blank" rel="noopener">Wikipedia</a></dd>' : '') + '</dl>'
    + '</div></div></div>';
  $("#sheetRoot").innerHTML = html;
  SF.lastFocus = document.activeElement;
  $("#scrim").addEventListener("click", e => { if(e.target.id === "scrim" || e.target.closest("[data-close]")) SF.closeSheet(); });
  $(".sheet [data-close]").focus();
};
SF.closeSheet = () => { $("#sheetRoot").innerHTML = ""; if(SF.lastFocus && SF.lastFocus.focus) SF.lastFocus.focus(); };
document.addEventListener("keydown", e => { if(e.key === "Escape" && $("#scrim")) SF.closeSheet(); });

/* ---------- check-in banner ---------- */
SF.banner = function(p, stamp, nx){
  $$(".banner").forEach(b => b.remove());
  const b = document.createElement("div"); b.className = "banner"; b.setAttribute("role", "status");
  b.innerHTML = '<button class="bx" type="button" aria-label="Close">×</button><span class="bk">Checked in</span><b class="bt">You made it to ' + esc(p.n) + '!</b>'
    + '<span class="small">' + (stamp ? "Passport stamp: " + esc(stamp.g + " " + stamp.t) : "Added to your journal.") + '</span>'
    + (nx ? '<div class="nx"><span>Next up</span><b>' + esc(nx.label) + '</b><span style="text-transform:none;letter-spacing:0">' + esc(nx.when) + (nx.place ? " · " + esc(SF.travel(SF.meters(SF.coordOf(p), SF.coordOf(nx.place))).txt) : "") + '</span></div>' : '')
    + '<div class="btns">' + (nx && nx.place ? '<a class="btn pri" href="' + esc(SF.dirUrl(nx.place)) + '" target="_blank" rel="noopener">Directions</a>' : '') + '<button class="btn" type="button" data-b="loc">Send my location</button><button class="btn" type="button" data-b="undo">Undo</button></div>';
  b.querySelector(".bx").onclick = () => b.remove();
  b.querySelector('[data-b="loc"]').onclick = () => SF.sendLocation();
  b.querySelector('[data-b="undo"]').onclick = () => { SF.undoCheckIn(p.id); b.remove(); SF.toast("Undone. I won't check you in there again today."); };
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 30000);
};

/* ---------- who is this phone ---------- */
function askWho(){
  const t = SF.trip.travelers || []; if(t.length < 2) return;
  $("#sheetRoot").innerHTML = '<div class="scrim" id="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="whoT"><div class="sheet-in"><p class="k">Quick one</p><h2 id="whoT">Who\'s this phone?</h2><p class="muted small">So saves and check-ins say who did them.</p><div class="btns">' + t.map(n => '<button class="btn" type="button" data-me="' + esc(n) + '">' + esc(n) + '</button>').join("") + '</div></div></div></div>';
  $("#scrim").addEventListener("click", e => { const b = e.target.closest("[data-me]"); if(b){ SF.store.set("sf.me." + SF.trip.id, b.dataset.me); SF.closeSheet(); SF.toast("Hi, " + b.dataset.me + "!"); SF.render(); } });
}

/* ---------- events ---------- */
document.addEventListener("click", e => {
  const t = e.target.closest("[data-open],[data-f],[data-sub],[data-save],[data-visit],[data-addday],[data-swap],[data-rm],[data-rate],[data-check],[data-act],[data-mode],[data-color],[data-shareplace],[data-askfor]");
  if(!t) return;
  const d = t.dataset;
  if(d.open){ SF.openPlace(d.open); return; }
  if(d.f){ S.f = d.f; SF.render(); return; }
  if(d.sub){ S.sub = d.sub; history.replaceState(null, "", "#saved." + d.sub); SF.render(); return; }
  if(d.save){ const on = SF.toggleSave(d.save); SF.toast(on ? "Saved." : "Removed from saved."); if($("#scrim")) SF.openPlace(d.save); SF.render(); return; }
  if(d.visit){ const r = SF.toggleVisit(d.visit); SF.toast(r.won.length ? "Stamp earned: " + r.won[0].t + "!" : r.on ? "Marked visited." : "Removed from your journal."); if($("#scrim")) SF.openPlace(d.visit); SF.render(); return; }
  if(d.addday){ const [id, n] = d.addday.split("|"); SF.addToDay(id, +n); SF.toast("Added to day " + n + "."); return; }
  if(d.swap){ const [n, k] = d.swap.split("|"); const r = SF.swapItem(+n, k); SF.toast(r ? "Swapped for " + r.n + "." : "Nothing similar open then."); SF.render(); return; }
  if(d.rm){ const [n, k] = d.rm.split("|"); SF.removeItem(+n, k); SF.render(); return; }
  if(d.rate){ const [id, n] = d.rate.split("|"); SF.rate(id, +n); SF.render(); return; }
  if(d.check){ SF.toggleCheck(d.check); SF.render(); return; }
  if(d.mode){ SF.store.set("sf.mode", d.mode); applyTheme(); SF.render(); return; }
  if(d.color){ SF.trip.color = d.color; SF.trip.ink = ["#C8F31D", "#D9A441"].includes(d.color) ? "#111111" : "#FFFFFF"; SF.store.set("sf.lastTrip", SF.trip); applyTheme(); SF.render(); return; }
  if(d.shareplace){ const p = SF.byId[d.shareplace]; SF.shareText(p.n, p.n + (p.ad ? ", " + p.ad : "") + "\n" + SF.dirUrl(p)); return; }
  if(d.askfor){ SF.openAsk && SF.openAsk("where can I find " + d.askfor); return; }
  if(d.act === "shareTrip") SF.shareTrip();
  else if(d.act === "shareRecap") SF.shareRecap();
  else if(d.act === "sendLoc") SF.sendLocation();
  else if(d.act === "auto") SF.setAuto(!SF.autoOn());
  else if(d.act === "rebuild"){ SF.tset("plan", SF.buildPlan()); SF.toast("Fresh plan, built from what's open."); SF.render(); }
  else if(d.act === "who") askWho();
  else if(d.act === "reset"){ if(confirm("Clear this phone's saves, journal and checklist for this trip?")){ ["saved", "visited", "checks", "plan", "myChecks"].forEach(k => SF.store.del("sf." + SF.trip.id + "." + k)); SF.toast("Cleared."); SF.render(); } }
});
document.addEventListener("input", e => {
  if(e.target.id === "nowQ" || e.target.id === "exQ"){ S.q = e.target.value; const id = e.target.id, pos = e.target.selectionStart; clearTimeout(S.qt); S.qt = setTimeout(() => { SF.render(); const el = $("#" + id); if(el){ el.focus(); el.setSelectionRange(pos, pos); } }, 220); }
  if(e.target.dataset.note) SF.note(e.target.dataset.note, e.target.value);
});
document.addEventListener("change", e => {
  if(e.target.id === "mRad"){ S.radius = +e.target.value; SF.render(); }
  if(e.target.id === "mCat"){ S.f = e.target.value; SF.render(); }
});
document.addEventListener("submit", e => {
  if(e.target.id === "addCheck"){ e.preventDefault(); const v = $("#ckIn").value.trim(); if(!v) return; const l = SF.tget("myChecks", []); l.push({id:"m" + Date.now(), t:v, group:"my list"}); SF.tset("myChecks", l); SF.render(); }
});
document.addEventListener("click", e => {
  if(e.target.id === "mOpen"){ S.mapOpen = !S.mapOpen; SF.render(); }
  if(e.target.id === "mLocate"){ if(!navigator.geolocation) return SF.toast("Location isn't available here."); navigator.geolocation.getCurrentPosition(pos => { SF.here = {lat:pos.coords.latitude, lon:pos.coords.longitude, acc:pos.coords.accuracy, ts:Date.now()}; if(SF.meters([SF.here.lat, SF.here.lon], SF.city.city.center) > 60000) SF.toast("You're not in " + SF.city.city.name + " yet, so the map starts from " + SF.origin().from + "."); SF.render(); }, () => SF.toast("Couldn't get your location."), {enableHighAccuracy:true, timeout:12000}); }
});
/* Ask button tucks away while scrolling down */
(function(){ let y = 0, t = null; window.addEventListener("scroll", () => { const f = $("#askFab"), ny = window.scrollY; if(!f) return; if(ny - y > 6 && ny > 120) f.classList.add("away"); else if(ny - y < -6) f.classList.remove("away"); y = ny; clearTimeout(t); t = setTimeout(() => f.classList.remove("away"), 900); }, {passive:true}); })();

boot();
})();
