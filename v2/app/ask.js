/* spunfor.me Ask: answers from the trip's own data first; anything else searched live on OpenStreetMap with in-app results */
"use strict";
(function(){
const SF = window.SF, $ = SF.$, esc = SF.esc, lc = SF.lc;
const VIBES = {
  friendly:{hi:"Hi! Ask me anything about {city}: what's open, where to eat, your plan, rides.", ok:"Here's what I've got:", none:"That's not in the guide, so I looked around:", miss:"I couldn't find that one. Try asking another way, like \"coffee near me\" or \"is {ex} open?\"", look:"Looking around for {t}…"},
  sassy:{hi:"Well, look who needs a local. Go on, ask.", ok:"Fine. Here you go:", none:"Not in my guide, and believe me, I checked. So I went looking:", miss:"Nothing. Try again in plain English, like \"coffee near me\".", look:"Hold your horses, looking for {t}…"},
  hype:{hi:"Let's GO! What do you need in {city}?", ok:"Ooh, good ones:", none:"Not in the guide but I found these, let's go:", miss:"Hmm, nothing yet! Try \"coffee near me\" or \"is {ex} open?\"", look:"On it! Finding {t}…"},
  calm:{hi:"Ask me anything about {city}.", ok:"Here:", none:"Not in the guide. Nearby:", miss:"No match. Try \"coffee near me\".", look:"Searching for {t}…"}
};
const V = () => VIBES[SF.trip.vibe] || VIBES.friendly;
const fill = s => s.replace("{city}", SF.city.city.name).replace("{ex}", (SF.city.P[0] || {}).n || "a place");

/* ---------- words → categories ---------- */
const CATW = [
  ["coffee", /\b(coffee|cafe|café|espresso|latte|bakery|bakeries|pastr(y|ies)|breakfast spot)\b/],
  ["eat", /\b(food|eat|eats|dinner|lunch|brunch|restaurant|restaurants|hungry|bite|meal)\b/],
  ["drink", /\b(bar|bars|drink|drinks|cocktail|cocktails|beer|wine|brewery|pub|happy hour)\b/],
  ["music", /\b(music|jazz|live|concert|band|bands|club|dancing)\b/],
  ["art", /\b(art|arts|gallery|galleries|mural|murals)\b/],
  ["history", /\b(history|historic|museum|museums|monument|memorial|old)\b/],
  ["nature", /\b(park|parks|nature|garden|gardens|hike|hiking|trail|outdoors|outside|green)\b/],
  ["attraction", /\b(landmark|landmarks|sight|sights|attraction|attractions|see|tourist|must.see)\b/],
  ["shop", /\b(shop|shops|shopping|market|markets|store|boutique|souvenir)\b/],
  ["sports", /\b(game|games|stadium|sports|ballpark)\b/],
  ["queer", /\b(gay|queer|lgbt|lgbtq|drag)\b/]
];
const catsIn = q => CATW.filter(([c, re]) => re.test(q) && SF.city.CATS[c]).map(([c]) => c);

/* ---------- find a guide place by name ---------- */
const norm = s => lc(s).replace(/[’']/g, "").replace(/&/g, " and ").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const STOP = new Set("the a an of at in on and is are it open close closed what when where how hours address phone number call does do today tonight now right near me us we i can get to go for best good place spot".split(" "));
function findPlaces(q){
  const nq = norm(q);
  const exact = SF.city.P.filter(p => { const n = norm(p.n); return n.length > 3 && nq.includes(n); });
  if(exact.length) return exact.sort((a, b) => b.n.length - a.n.length).slice(0, 2);
  const words = nq.split(" ").filter(w => w.length > 2 && !STOP.has(w) && !CATW.some(([c, re]) => re.test(w)));
  if(!words.length) return [];
  const scored = SF.city.P.map(p => { const nw = norm(p.n).split(" ").filter(w => !STOP.has(w)); const hit = words.filter(w => nw.some(x => x === w || (w.length > 4 && x.startsWith(w)))).length; return {p, s:nw.length ? hit / Math.max(2, nw.length) : 0, hit}; })
    .filter(x => x.hit >= Math.min(2, words.length) || x.s >= .67).sort((a, b) => b.s - a.s);
  return scored.slice(0, 2).map(x => x.p);
}

/* ---------- answers ---------- */
const listOf = (ps, n) => ps.slice(0, n || 6);
function placeAnswer(p, q){
  const st = SF.statusAt(p), di = SF.distInfo(p), N = SF.cityNow(), rows = SF.hoursRows(p);
  const parts = [p.n + ": " + SF.statusText(st) + "."];
  if(/hour|open|close|when/.test(q) && rows) parts.push("Today: " + rows[N.dow][1] + ".");
  if(p.ad) parts.push(p.ad + ".");
  if(di) parts.push(di.txt + " (" + SF.miles(di.m) + ") from " + di.from + ".");
  if(/phone|call|number/.test(q)) parts.push(p.ph ? "Phone: " + p.ph : "No phone listed.");
  const c = SF.coordOf(p), acts = [{label:"Directions", href:SF.dirUrl(p), pri:true}, {label:"Details", open:p.id}];
  if(p.ph) acts.push({label:"Call", href:"tel:" + p.ph.replace(/[^\d+]/g, "")});
  if(c) acts.push({label:"Uber", href:SF.uberUrl(c[0], c[1], p.n, p.ad)});
  return {text:parts.join(" "), acts};
}
function planAnswer(q){
  const days = SF.tripDays(); if(!days.length) return {text:"There are no trip dates yet, so there's no plan. Add dates in More → Plan another trip."};
  const plan = SF.plan(), ts = SF.tripStatus();
  let n = +((q.match(/day (\d+)/) || [])[1] || 0);
  if(!n) n = /tomorrow/.test(q) ? (ts && ts.during ? ts.day + 1 : 2) : (ts && ts.during ? ts.day : 1);
  const d = plan.days.find(x => x.n === n); if(!d) return {text:"Your plan runs day 1 to " + plan.days.length + "."};
  return {text:"Day " + d.n + ", " + SF.dayLabel(d.ymd, true) + ":\n" + d.items.map(i => "• " + SF.fmtM(SF.toM(i.t)) + "  " + i.h).join("\n"), acts:[{label:"Open the plan", href:"#saved.plan"}]};
}
function rideAnswer(q){
  const h = SF.trip.hotel, toHotel = /hotel|home|back|room/.test(q);
  if(toHotel && h && h.lat) return {text:"Uber or Lyft back to " + h.name + (h.ad ? " (" + h.ad + ")" : "") + ". Pickup is wherever you are.", acts:[{label:"Uber to the hotel", href:SF.uberUrl(h.lat, h.lon, h.name, h.ad), pri:true}, {label:"Lyft", href:SF.lyftUrl(h.lat, h.lon)}]};
  const ps = findPlaces(q.replace(/\b(uber|lyft|ride|car|taxi|cab|get me|take me|to)\b/g, " "));
  if(ps[0]){ const c = SF.coordOf(ps[0]); if(c) return {text:"Ride to " + ps[0].n + ". Pickup is wherever you are; check the price before you book.", acts:[{label:"Uber to " + ps[0].n, href:SF.uberUrl(c[0], c[1], ps[0].n, ps[0].ad), pri:true}, {label:"Lyft", href:SF.lyftUrl(c[0], c[1])}]}; }
  if(toHotel) return {text:"I don't have your hotel's location. Add it when you plan a trip, or open Uber and type it in.", acts:[{label:"Open Uber", href:"https://m.uber.com/ul/"}]};
  return {text:"Where to? Say something like \"Uber to " + ((SF.city.P.find(p => p.c.includes("attraction")) || SF.city.P[0]).n) + "\" or \"ride back to the hotel\"."};
}
function flightsAnswer(){
  const fl = SF.trip.flights || []; if(!fl.length) return {text:"No flights saved for this trip."};
  return {text:fl.map(f => (f.who ? f.who + ": " : "") + [f.no, f.route].filter(Boolean).join(" ") + ", " + SF.dayLabel(f.date) + (f.dep ? ", departs " + f.dep : "") + (f.arr ? ", lands " + f.arr : "")).join("\n"), acts:fl.filter(f => f.no).map(f => ({label:"Live status: " + f.no, href:"https://www.flightaware.com/live/flight/" + f.no.replace(/\s+/g, "")}))};
}
function categoryAnswer(cats, q){
  const wantOpen = /open|now|right now|tonight/.test(q);
  let ps = SF.city.P.filter(p => p.c.some(c => cats.includes(c)));
  const byD = (a, b) => { const x = SF.distInfo(a), y = SF.distInfo(b); return (x ? x.m : 1e9) - (y ? y.m : 1e9); };
  const open = ps.filter(p => SF.statusAt(p).state === "open").sort(byD);
  if(wantOpen && !open.length){ const later = ps.filter(p => SF.statusAt(p).state === "later").sort((a, b) => SF.statusAt(a).opens - SF.statusAt(b).opens); return later.length ? {text:"No " + SF.city.CATS[cats[0]].toLowerCase() + " open right now. Next to open:", places:listOf(later, 4)} : {text:"No " + SF.city.CATS[cats[0]].toLowerCase() + " open right now. Here are the spots and when they open:", places:listOf(ps.sort(byD), 6)}; }
  const list = (wantOpen ? open : open.concat(ps.filter(p => !open.includes(p)).sort(byD)));
  return {text:V().ok, places:listOf(list, 6)};
}

/* "where can I get X" / "X near me": the thing they want */
const VAGUE = /^(something|anything|stuff|things?|places?|fun|food|to eat|a bite|drinks?|a drink|dinner|lunch|breakfast|brunch|snacks?|open|to do|go|help)$/;
function termOf(q){
  let s = lc(q).replace(/[’`]/g, "'").replace(/[?!.]+$/, "").trim();
  let m = s.match(/(?:where (?:can|could|do|should|would) (?:i|we|you) (?:get|find|buy|grab|eat|have|pick up)|where(?:'s| is| are) (?:the |a |an )?(?:nearest|closest)|(?:^| )find (?:me |us )?|i(?:'m| am)? (?:want|need|craving)|craving|looking for|is there (?:a|an|any)|are there (?:any)?|get me)\s+(.+)$/);
  if(!m) m = s.match(/^(.+?)\s+(?:near me|nearby|close by|around here|near us|near the hotel)$/);
  if(!m) return null;
  const t = m[1].replace(/\s+(?:near(?:by| me| here| us| the hotel)?|around(?: here)?|close by|tonight|today|right now|now|open now|please)\b.*$/, "").replace(/^(?:a|an|some|the|good|great|best|nearby|nearest|closest|cheap)\s+/g, "").replace(/^(?:a|an|some|the)\s+/, "").trim();
  if(!t || t.length < 3 || VAGUE.test(t) || /^(what|whats|what's|anything|something|where|how|is |are )/.test(t) || t.split(" ").length > 4) return null;
  return t;
}
const sing = w => w.replace(/ies$/, "y").replace(/(ch|sh|x|ss)es$/, "$1").replace(/([^s])s$/, "$1");
function guideHas(t){ const ws = lc(t).split(/\s+/).filter(w => w.length >= 3).map(sing); return !ws.length || SF.city.P.some(p => { const h = lc(p.n + " " + (p.note || "") + " " + p.c.map(c => SF.city.CATS[c]).join(" ")); return ws.every(w => h.includes(w)); }); }

/* live search: Photon + Nominatim around the city */
const SKIPKEY = /^(place|boundary|highway|landuse|railway|natural|waterway|route|building)$/, SKIPVAL = /^(university|school|college|yes|house|residential|apartments|bus_stop|parking)$/;
const KIND = {bakery:"Bakery", fast_food:"Quick bite", restaurant:"Restaurant", cafe:"Café", ice_cream:"Ice cream", bar:"Bar", pub:"Pub", nightclub:"Club", beauty:"Beauty salon", hairdresser:"Hair salon", pharmacy:"Pharmacy", supermarket:"Grocery", convenience:"Corner store", alcohol:"Liquor store", atm:"ATM", bank:"Bank", clinic:"Clinic", doctors:"Doctor", hospital:"Hospital", laundry:"Laundromat", clothes:"Clothing", books:"Bookstore", tattoo:"Tattoo", fuel:"Gas station", deli:"Deli", toilets:"Restroom", cinema:"Movies", spa:"Spa", museum:"Museum", park:"Park"};
async function liveSearch(term){
  const o = SF.origin(), c = SF.city.city.center, bb = [c[1] - .25, c[0] - .2, c[1] + .25, c[0] + .2], q = encodeURIComponent(term);
  const [ph, nm] = await Promise.all([
    SF.getJSON("https://photon.komoot.io/api/?q=" + q + "&bbox=" + bb.join(",") + "&lat=" + o.pt[0] + "&lon=" + o.pt[1] + "&limit=15&lang=en", 8000),
    SF.getJSON("https://nominatim.openstreetmap.org/search?q=" + q + "&format=jsonv2&limit=15&bounded=1&viewbox=" + [bb[0], bb[3], bb[2], bb[1]].join(",") + "&addressdetails=1", 8000)]);
  const out = [];
  ((ph && ph.features) || []).forEach(f => { const p = f.properties || {}; if(!p.name || SKIPKEY.test(p.osm_key) || SKIPVAL.test(p.osm_value)) return; out.push({n:p.name, v:p.osm_value, lat:f.geometry.coordinates[1], lon:f.geometry.coordinates[0], ad:[p.housenumber && p.street ? p.housenumber + " " + p.street : p.street, p.city].filter(Boolean).join(", "), osm:(p.osm_type || "N")[0].toUpperCase() + p.osm_id}); });
  (Array.isArray(nm) ? nm : []).forEach(x => { if(!x.name || SKIPKEY.test(x.category) || SKIPVAL.test(x.type)) return; const a = x.address || {}; out.push({n:x.name, v:x.type, lat:+x.lat, lon:+x.lon, ad:[a.house_number && a.road ? a.house_number + " " + a.road : a.road, a.city || a.town].filter(Boolean).join(", "), osm:(x.osm_type || "node")[0].toUpperCase() + x.osm_id}); });
  const words = lc(term).split(/\s+/).filter(w => w.length >= 3 && !/^(the|and|for|with|good|best|near|place|shop|store|spot)$/.test(w)).map(sing);
  const rel = r => !words.length || words.some(w => lc(r.n).includes(w) || lc(r.v).replace(/_/g, " ").includes(w) || (w === "nail" && r.v === "beauty") || (w === "grocery" && /supermarket|convenience/.test(r.v)));
  const seen = {};
  return out.filter(rel).map(r => Object.assign(r, {m:SF.meters(o.pt, [r.lat, r.lon]), from:o.from, kind:KIND[r.v] || (r.v || "Place").replace(/_/g, " ").replace(/^./, x => x.toUpperCase())}))
    .sort((a, b) => a.m - b.m).filter(r => { const k = lc(r.n).replace(/[^a-z0-9]/g, ""); if(seen[k]) return false; seen[k] = 1; return true; }).slice(0, 6);
}

/* ---------- the brain ---------- */
async function answer(q0){
  const q = lc(q0).replace(/[’`]/g, "'").trim();
  if(/^(hi|hey|hello|yo|sup)\b/.test(q) && q.length < 12) return {text:fill(V().hi)};
  if(/\b(help|what can you do|how does this work)\b/.test(q)) return {text:"Try: \"what's open near me\", \"coffee\", \"is " + ((SF.city.P[0] || {}).n || "a place") + " open?\", \"what's the plan today\", \"ride back to the hotel\", \"bagels near me\", \"send my location\"."};
  if(/\b(send|share|text)\b.*\b(location|where i am)\b/.test(q)) return {text:"Tap below and I'll put your spot in a text.", acts:[{label:"Send my location", fn:"sendLoc", pri:true}]};
  if(/\b(share|send)\b.*\b(recap|journal|trip so far)\b/.test(q)) return {text:SF.recapText(), acts:[{label:"Share recap", fn:"shareRecap", pri:true}]};
  if(/\b(uber|lyft|ride|taxi|cab)\b|take me (to|back)|get me (to|back)/.test(q)) return rideAnswer(q);
  if(/\b(flight|flights|land|lands|landing|arrive|arrives|arrival|plane)\b/.test(q) && (SF.trip.flights || []).length) return flightsAnswer();
  if(/\b(hotel|where are we staying|staying)\b/.test(q) && !/near/.test(q)){ const h = SF.trip.hotel; return h ? {text:"You're staying at " + h.name + (h.ad ? ", " + h.ad : "") + ".", acts:h.lat ? [{label:"Directions", href:"https://www.google.com/maps/dir/?api=1&destination=" + h.lat + "," + h.lon, pri:true}, {label:"Uber there", href:SF.uberUrl(h.lat, h.lon, h.name, h.ad)}] : []} : {text:"No hotel saved for this trip."}; }
  if(/\b(weather|rain|temperature|cold|hot outside|umbrella)\b/.test(q)){ const w = await SF.weather(); if(w && w.daily) return {text:"Today: " + Math.round(w.daily.temperature_2m_max[0]) + "° high, " + Math.round(w.daily.temperature_2m_min[0]) + "° low, " + (w.daily.precipitation_probability_max[0] ?? 0) + "% chance of rain. Right now " + Math.round(w.current.temperature_2m) + "°F, " + SF.wxText(w.current.weather_code).toLowerCase() + "."}; return {text:"Weather isn't loading right now."}; }
  if(/\b(plan|itinerary|schedule|agenda|today|tomorrow|day \d)\b/.test(q) && !/open/.test(q)) return planAnswer(q);
  const ps = findPlaces(q);
  if(ps.length && !/near me|nearby/.test(q)) return ps.length === 1 ? placeAnswer(ps[0], q) : {text:V().ok, places:ps};
  const cats = catsIn(q);
  const t = termOf(q);
  if(t && !guideHas(t)) return {find:t};
  if(t && !cats.length){
    const ws = lc(t).split(/\s+/).filter(w => w.length >= 3).map(sing);
    const hits = SF.city.P.filter(p => { const h = lc(p.n + " " + (p.note || "")); return ws.every(w => h.includes(w)); }).sort((a, b) => { const x = SF.distInfo(a), y = SF.distInfo(b); return (x ? x.m : 1e9) - (y ? y.m : 1e9); });
    if(hits.length) return {text:V().ok, places:hits.slice(0, 6), acts:[{label:"Search more nearby", fn:"find:" + t}]};
  }
  if(cats.length) return categoryAnswer(cats, q);
  if(/\b(open|now|right now|near me|nearby|close by|what('| i)?s (good|around)|anything)\b/.test(q)){
    const open = SF.city.P.filter(p => SF.statusAt(p).state === "open" && !(SF.trip.skip || []).some(c => p.c.includes(c)));
    const byD = (a, b) => { const x = SF.distInfo(a), y = SF.distInfo(b); return (x ? x.m : 1e9) - (y ? y.m : 1e9); };
    return open.length ? {text:"Open right now, closest first:", places:listOf(open.sort(byD), 6), acts:[{label:"See everything open", href:"#now"}]} : {text:"Nothing with listed hours is open right now.", acts:[{label:"Browse everything", href:"#explore"}]};
  }
  if(t) return {find:t};
  const words = q.replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 3 && !STOP.has(w));
  if(words.length && words.length <= 3) return {find:words.join(" ")};
  return {text:fill(V().miss)};
}

/* ---------- panel ---------- */
let panel = null, log = null;
function bubble(who, text){ const d = document.createElement("div"); d.className = "msg " + who; d.textContent = text || ""; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; }
function acts(d, list){
  if(!list || !list.length) return;
  const a = document.createElement("div"); a.className = "acts";
  list.forEach(x => {
    let el;
    if(x.href){ el = document.createElement("a"); el.href = x.href; if(!/^(#|tel:)/.test(x.href)){ el.target = "_blank"; el.rel = "noopener"; } if(/^#/.test(x.href)) el.addEventListener("click", () => close()); }
    else { el = document.createElement("button"); el.type = "button"; el.addEventListener("click", () => { if(x.open) SF.openPlace(x.open); else if(x.fn === "sendLoc") SF.sendLocation(); else if(x.fn === "shareRecap") SF.shareRecap(); else if(x.fn && x.fn.startsWith("find:")) runFind(x.fn.slice(5)); }); }
    el.textContent = x.label; if(x.pri) el.className = "pri"; a.appendChild(el);
  });
  d.appendChild(a); log.scrollTop = log.scrollHeight;
}
function placeList(d, ps){
  const r = document.createElement("div"); r.className = "res";
  ps.forEach(p => { const b = document.createElement("button"); b.type = "button"; const st = SF.statusAt(p), di = SF.distInfo(p);
    b.innerHTML = '<b>' + esc(p.n) + '</b><span>' + esc([SF.statusText(st), di && di.txt, SF.city.CATS[p.c[0]]].filter(Boolean).join(" · ")) + '</span>';
    b.addEventListener("click", () => SF.openPlace(p.id)); r.appendChild(b); });
  d.appendChild(r);
}
function liveList(d, rs){
  const r = document.createElement("div"); r.className = "res";
  rs.forEach(x => { const b = document.createElement("button"); b.type = "button"; b.innerHTML = '<b>' + esc(x.n) + '</b><span>' + esc([x.kind, SF.travel(x.m).txt, SF.miles(x.m), x.ad].filter(Boolean).join(" · ")) + '</span>'; b.addEventListener("click", () => detail(x)); r.appendChild(b); });
  d.appendChild(r);
}
async function detail(x){
  panel.querySelectorAll(".detail").forEach(e => e.remove());
  const c = document.createElement("div"); c.className = "detail"; c.setAttribute("role", "dialog"); c.setAttribute("aria-label", x.n);
  const dest = encodeURIComponent(x.ad ? x.n + ", " + x.ad : x.lat + "," + x.lon);
  c.innerHTML = '<button class="linky" type="button" data-back style="border:0;background:none;cursor:pointer;padding:0">‹ Back to results</button><p class="k">' + esc(x.kind) + '</p><h2>' + esc(x.n) + '</h2>'
    + '<p><b>' + esc(SF.travel(x.m).txt) + '</b> · ' + esc(SF.miles(x.m)) + ' from ' + esc(x.from) + '</p>' + (x.ad ? '<p class="muted">' + esc(x.ad) + '</p>' : '')
    + '<div class="more"><p class="small muted">Checking hours and phone…</p></div>'
    + '<div class="btns"><a class="btn pri block" href="https://www.google.com/maps/dir/?api=1&destination=' + dest + '&travelmode=' + (x.m <= 2600 ? "walking" : "driving") + '" target="_blank" rel="noopener">Directions</a><a class="btn" href="https://maps.apple.com/?daddr=' + x.lat + ',' + x.lon + '&q=' + encodeURIComponent(x.n) + '" target="_blank" rel="noopener">Apple Maps</a><a class="btn" href="' + esc(SF.uberUrl(x.lat, x.lon, x.n, x.ad)) + '" target="_blank" rel="noopener">Uber</a><a class="btn" href="' + esc(SF.lyftUrl(x.lat, x.lon)) + '" target="_blank" rel="noopener">Lyft</a></div>'
    + '<p class="src">From OpenStreetMap. Hours can change; call ahead if it matters.</p>';
  c.querySelector("[data-back]").onclick = () => c.remove();
  panel.appendChild(c); c.querySelector("[data-back]").focus();
  const j = await SF.getJSON("https://nominatim.openstreetmap.org/lookup?osm_ids=" + encodeURIComponent(x.osm) + "&format=jsonv2&extratags=1", 6000);
  const e = Array.isArray(j) && j[0] ? (j[0].extratags || {}) : {}, more = c.querySelector(".more"); if(!more) return;
  const ph = e.phone || e["contact:phone"], web = e.website || e["contact:website"], h = SF.parseOSMHours(e.opening_hours);
  const DW = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], DL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  more.innerHTML = (h ? '<table class="hrs"><caption class="sr">Hours</caption>' + DW.map((d, i) => '<tr><td>' + DL[i] + '</td><td>' + esc((h[d] || []).map(([o, cl]) => SF.fmtM(SF.toM(o)) + "–" + SF.fmtM(SF.toM(cl))).join(", ") || (h[d] ? "Closed" : "—")) + '</td></tr>').join("") + '</table>' : e.opening_hours ? '<p class="small">Hours: ' + esc(e.opening_hours) + '</p>' : '')
    + ((ph || web) ? '<div class="btns">' + (ph ? '<a class="btn" href="tel:' + esc(ph.replace(/[^\d+]/g, "")) + '">Call ' + esc(ph) + '</a>' : '') + (web ? '<a class="btn" href="' + esc(/^https?:/.test(web) ? web : "https://" + web) + '" target="_blank" rel="noopener">Website</a>' : '') + '</div>' : '')
    || '<p class="small muted">No hours or phone listed. Directions will still get you there.</p>';
}
async function runFind(t){
  const wait = bubble("bot", V().look.replace("{t}", t)); const rs = await liveSearch(t).catch(() => []); wait.remove();
  if(rs.length){ const d = bubble("bot", "Nearby:"); liveList(d, rs); } else bubble("bot", "Nothing else close by for " + t + ".");
}
async function ask(q){
  q = String(q || "").trim(); if(!q) return;
  bubble("me", q); $("#askIn").value = "";
  let a; try{ a = await answer(q); }catch(e){ a = {text:fill(V().miss)}; }
  if(a.find){
    const wait = bubble("bot", V().look.replace("{t}", a.find));
    const rs = await liveSearch(a.find).catch(() => []);
    wait.remove();
    if(rs.length){ const d = bubble("bot", V().none); liveList(d, rs); log.scrollTop = log.scrollHeight; return; }
    const d = bubble("bot", "I couldn't find " + a.find + " close by."); acts(d, [{label:"Search maps for " + a.find, href:"https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(a.find + " near " + SF.city.city.name)}]); return;
  }
  const d = bubble("bot", a.text || V().ok);
  if(a.places && a.places.length) placeList(d, a.places);
  acts(d, a.acts);
  log.scrollTop = log.scrollHeight;
}
function open(prefill){
  if(panel){ close(); return; }
  panel = document.createElement("div"); panel.className = "ask"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.setAttribute("aria-labelledby", "askT");
  const h = SF.trip.hotel, SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const quick = ["What's open near me?", h && h.lat ? "Ride back to the hotel" : "What's the plan today?"];
  panel.innerHTML = '<div class="ask-h"><b id="askT">Ask ' + esc(SF.trip.bot || "Spun") + '<small>Answers from your ' + esc(SF.city.city.name) + ' guide, plus anything nearby</small></b><button class="x" type="button" data-askx aria-label="Close">×</button></div>'
    + '<div class="ask-log" aria-live="polite"></div>'
    + '<div class="ask-q">' + quick.map(t => '<button type="button" data-q="' + esc(t) + '">' + esc(t) + '</button>').join("") + '</div>'
    + '<form class="ask-in"><label class="sr" for="askIn">Your question</label><input id="askIn" type="text" autocomplete="off" placeholder="Ask anything…">' + (SR ? '<button class="mic" type="button" aria-label="Ask by voice">🎤</button>' : '') + '<button type="submit" aria-label="Send">→</button></form>';
  document.body.appendChild(panel); log = panel.querySelector(".ask-log");
  bubble("bot", fill(V().hi));
  panel.querySelector("[data-askx]").onclick = close;
  panel.querySelector(".ask-in").addEventListener("submit", e => { e.preventDefault(); ask($("#askIn").value); });
  panel.querySelectorAll("[data-q]").forEach(b => b.addEventListener("click", () => ask(b.dataset.q)));
  const mic = panel.querySelector(".mic");
  if(mic) mic.addEventListener("click", () => { try{ const r = new SR(); r.lang = "en-US"; r.interimResults = true; mic.classList.add("on"); let fin = ""; r.onresult = ev => { let t = ""; for(const x of ev.results){ t += x[0].transcript; if(x.isFinal) fin = t; } $("#askIn").value = t; }; r.onend = () => { mic.classList.remove("on"); if(fin) ask(fin); }; r.onerror = () => mic.classList.remove("on"); r.start(); }catch(e){ mic.classList.remove("on"); } });
  document.documentElement.style.overflow = "hidden";
  if(prefill) ask(prefill); else if(window.innerWidth >= 900) $("#askIn").focus();
}
function close(){ if(!panel) return; panel.remove(); panel = null; document.documentElement.style.overflow = ""; $("#askFab").focus(); }
document.addEventListener("keydown", e => { if(e.key === "Escape" && panel && !$("#scrim")){ const dt = panel.querySelector(".detail"); if(dt) dt.remove(); else close(); } });
$("#askFab").addEventListener("click", () => open());
SF.openAsk = open;
SF.askAnswer = answer;
const setFab = () => { if(SF.trip) $("#askFabTxt").textContent = "Ask " + (SF.trip.bot || "Spun"); };
setTimeout(setFab, 50);
})();
