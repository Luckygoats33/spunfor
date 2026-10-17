/* spunfor.me extras: collections, Holla Holla picks, Surprise me, quips, first-visit tour, install, 33-second nudge */
"use strict";
(function(){
const SF = window.SF, $ = SF.$, $$ = SF.$$, esc = SF.esc;

/* ---------- collections built from any city's data ---------- */
const at = (p, mins, dayOff) => { const N = SF.cityNow(); return SF.statusAt(p, {dow:(N.dow + (dayOff || 0)) % 7, mins}).state === "open"; };
SF.COLLECTIONS = [
  {k:"tonight", t:"Tonight", s:"Bars, music and late dinners", i:"☾", f:p => p.c.some(c => ["drink", "music", "eat", "queer"].includes(c)) && at(p, 21 * 60)},
  {k:"late", t:"After midnight", s:"Still open at 12:30 am", i:"✦", f:p => at(p, 30, 1)},
  {k:"morning", t:"Morning coffee", s:"Open by 8 am", i:"☕", f:p => p.c.includes("coffee") && at(p, 8 * 60)},
  {k:"rainy", t:"Rainy day", s:"Indoors: art, history, shops", i:"☂", f:p => p.c.some(c => ["art", "history", "shop", "coffee"].includes(c))},
  {k:"outside", t:"Get outside", s:"Parks, views, landmarks", i:"✿", f:p => p.c.some(c => ["nature", "attraction"].includes(c))},
  {k:"gems", t:"Hidden gems", s:"Good spots without the crowds", i:"◆", f:p => !p.wp_url && p.c.some(c => ["art", "history", "nature", "shop", "coffee", "music"].includes(c))},
  {k:"close", t:"Under 10 minutes", s:"Walkable from " + "here", i:"◎", f:p => { const d = SF.distInfo(p); return d && d.mode === "walk" && d.mins <= 10; }}
];
SF.colPlaces = k => { const c = SF.COLLECTIONS.find(x => x.k === k); return c ? SF.city.P.filter(p => c.f(p) && !(SF.trip.skip || []).some(s => p.c.includes(s))) : []; };

/* ---------- Holla Holla: rated picks for this minute, matching the screen you're on ---------- */
const SCALE = ["", "Meh", "Fine", "Good", "Great", "Must-go"];
SF.rateNow = function(p){
  const st = SF.statusAt(p), di = SF.distInfo(p), why = [];
  let s = 0;
  if(st.state === "open"){ s += 2; if(st.closesSoon){ s -= 1; why.push("listed to close " + SF.fmtM(st.until)); } else why.push("listed open until " + SF.fmtM(st.until)); }
  else if(st.state === "later" && st.soon){ s += 1; why.push("opens " + SF.fmtM(st.opens)); }
  if(di){ if(di.mode === "walk" && di.mins <= 10){ s += 1.5; why.push(di.txt + " from " + di.from); } else if(di.mode === "walk"){ s += .7; why.push(di.txt); } else why.push(di.txt); }
  if(p.c.some(c => (SF.trip.likes || []).includes(c))){ s += 1.2; why.push("you love " + SF.lc(SF.city.CATS[p.c.find(c => (SF.trip.likes || []).includes(c))])); }
  if(SF.photoOf(p)) s += .3;
  if(p.rating){ s += (p.rating - 4) * 1.5; why.push(p.rating + "★"); }
  if(SF.saved()[p.id]){ s += .5; why.push("you saved it"); }
  if(SF.visited()[p.id]){ s -= 1; why.push("you've been"); }
  return {score:Math.max(1, Math.min(5, Math.round(1 + s * .8))), why};
};
function hollaPool(){
  const tab = SF.S.tab;
  let pool = SF.city.P, ctx = "Everywhere";
  if(tab === "cat" && SF.city.CATS[SF.S.cat]){ pool = pool.filter(p => p.c.includes(SF.S.cat)); ctx = SF.city.CATS[SF.S.cat]; }
  else if(tab === "col" && SF.S.col){ pool = SF.colPlaces(SF.S.col); ctx = (SF.COLLECTIONS.find(c => c.k === SF.S.col) || {}).t || ctx; }
  else if(tab === "map"){ const o = SF.origin(), r = SF.S.radius ? SF.S.radius * 80 / 1.25 : Infinity; pool = pool.filter(p => SF.coordOf(p) && SF.meters(o.pt, SF.coordOf(p)) <= r); ctx = SF.S.radius ? "Within " + SF.S.radius + " min" : "On the map"; }
  else if(tab === "saved"){ const s = SF.saved(), planIds = new Set(SF.tripDays().length ? SF.plan().days.flatMap(d => d.items.flatMap(i => i.p || [])) : []); const mine = pool.filter(p => s[p.id] || planIds.has(p.id)); if(mine.length){ pool = mine; ctx = "Your saves & plan"; } }
  return {pool:pool.filter(p => !(SF.trip.skip || []).some(c => p.c.includes(c))), ctx};
}
let H = {q:"", f:"all", ask:""};
/* quick asks: one tap answers the questions people actually have at night in a new city */
const ASKS = [
  {k:"music", t:"Live music near the hotel", f:x => x.p.c.includes("music") && (!SF.trip.hotel || !SF.trip.hotel.lat || SF.meters([SF.trip.hotel.lat, SF.trip.hotel.lon], SF.coordOf(x.p) || [0, 0]) < 3000)},
  {k:"late", t:"Late food", f:x => x.p.c.includes("eat") && SF.statusAt(x.p).until >= 22 * 60},
  {k:"drink", t:"Drinks within 10 min", f:x => x.p.c.includes("drink") && (d => d && d.mode === "walk" && d.mins <= 10)(SF.distInfo(x.p))},
  {k:"coffee", t:"Coffee now", f:x => x.p.c.includes("coffee")},
  {k:"sunset", t:"Before sunset", f:x => x.p.c.some(c => ["nature", "attraction"].includes(c)) && (SF.sunsetM == null || SF.cityNow().mins < SF.sunsetM)}
];
SF.loadSunset = () => { if(SF.sunsetM != null || !SF.city) return; SF.weather().then(w => { try{ SF.sunsetM = SF.toM(w.daily.sunset[0].slice(11, 16)); }catch(e){} }); };
SF.openHolla = function(){
  SF.loadSunset();
  const {pool, ctx} = hollaPool();
  const N = SF.cityNow();
  const rated = pool.map(p => Object.assign({p}, SF.rateNow(p))).filter(x => SF.statusAt(x.p).state === "open" || (SF.statusAt(x.p).state === "later" && SF.statusAt(x.p).soon));
  const cats = [...new Set(rated.flatMap(x => x.p.c))].filter(c => SF.city.CATS[c]);
  const draw = () => {
    const q = SF.lc(H.q);
    const qa = ASKS.find(a => a.k === H.ask);
    const list = rated.filter(x => (H.f === "all" || x.p.c.includes(H.f)) && (!qa || qa.f(x)) && (!q || SF.lc(x.p.n + " " + (x.p.note || "") + " " + (x.p.a || "")).includes(q))).sort((a, b) => b.score - a.score || (SF.distInfo(a.p) || {m:1e9}).m - (SF.distInfo(b.p) || {m:1e9}).m).slice(0, 12);
    $("#hlList").innerHTML = list.length ? list.map((x, i) => '<li><button type="button" class="hl-row" data-open="' + x.p.id + '"><span class="hl-n">' + (i + 1) + '</span><span class="hl-b"><b>' + esc(x.p.n) + '</b><span class="hl-why">' + esc(x.why.join(" · ")) + '</span></span><span class="hl-score" aria-label="' + x.score + ' of 5, ' + SCALE[x.score] + '"><span class="hl-bar"><i style="width:' + (x.score * 20) + '%"></i></span><b>' + SCALE[x.score] + '</b></span></button></li>').join("") : '<li class="empty">Nothing ' + (H.q ? 'matching "' + esc(H.q) + '" ' : "") + 'is open right now here. Try Everywhere on Home, or come back later.</li>';
  };
  $("#sheetRoot").innerHTML = '<div class="scrim" id="scrim"><div class="sheet holla-sheet" role="dialog" aria-modal="true" aria-labelledby="hlT"><div class="sheet-in">'
    + '<div class="sheet-h"><div><p class="k">Holla Holla · ' + esc(ctx) + '</p><h2 id="hlT">Top picks right now</h2><p class="muted small">' + esc(SF.DOWL[N.dow].slice(0, 3) + " " + SF.fmtM(N.mins)) + ' in ' + esc(SF.city.city.name) + '. Rated for this minute: listed hours, distance, your taste. Hours aren\'t confirmed with venues.</p></div><button class="x" type="button" data-close aria-label="Close">×</button></div>'
    + '<div class="chips hl-asks" role="group" aria-label="Quick asks">' + ASKS.map(a => '<button class="chip" type="button" data-ha="' + a.k + '" aria-pressed="' + (H.ask === a.k) + '">' + esc(a.t) + (a.k === "sunset" && SF.sunsetM != null ? " (" + SF.fmtM(SF.sunsetM) + ")" : "") + '</button>').join("") + '</div>'
    + '<div class="hl-scale" aria-hidden="true"><span>Meh</span><span class="hl-grad"></span><span>Must-go</span></div>'
    + '<div class="search"><label class="sr" for="hlQ">Search picks</label><input id="hlQ" type="search" placeholder="Search what\'s open" value="' + esc(H.q) + '"></div>'
    + '<div class="chips" role="group" aria-label="Filter"><button class="chip" type="button" data-hf="all" aria-pressed="' + (H.f === "all") + '">All</button>' + cats.map(c => '<button class="chip" type="button" data-hf="' + c + '" aria-pressed="' + (H.f === c) + '">' + esc(SF.city.CATS[c]) + '</button>').join("") + '</div>'
    + '<ol class="hl-list" id="hlList"></ol>'
    + '<div class="btns"><a class="btn pri" href="#now" data-close>See everything open</a><button class="btn" type="button" data-hask>Ask ' + esc(SF.trip.bot || "Spun") + '</button></div></div></div></div>';
  draw();
  SF.lastFocus = document.activeElement;
  const sc = $("#scrim");
  sc.addEventListener("click", e => {
    if(e.target.id === "scrim" || e.target.closest("[data-close]")){ SF.closeSheet(); return; }
    const qa = e.target.closest("[data-ha]"); if(qa){ H.ask = H.ask === qa.dataset.ha ? "" : qa.dataset.ha; $$("[data-ha]", sc).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.ha === H.ask))); draw(); return; }
    const f = e.target.closest("[data-hf]"); if(f){ H.f = f.dataset.hf; $$("[data-hf]", sc).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.hf === H.f))); draw(); return; }
    if(e.target.closest("[data-hask]")){ SF.closeSheet(); SF.openAsk(); }
  });
  $("#hlQ").addEventListener("input", e => { H.q = e.target.value; draw(); });
  $(".holla-sheet [data-close]").focus();
};

/* ---------- Surprise me: a mini adventure from what's open ---------- */
SF.surprise = function(hours, mode, vibe){
  const N = SF.cityNow(), endM = N.mins + hours * 60, used = new Set(), stops = [];
  let here = SF.origin().pt, t = N.mins;
  const vibeCats = {food:["eat", "coffee"], night:["drink", "music", "queer"], culture:["art", "history"], outside:["nature", "attraction"], any:null}[vibe || "any"];
  const maxLeg = mode === "walk" ? 1400 : 9000;
  while(t < endM - 30 && stops.length < Math.max(2, hours + 1)){
    const cand = SF.city.P.filter(p => !used.has(p.id) && SF.coordOf(p) && !(SF.trip.skip || []).some(c => p.c.includes(c)) && (!vibeCats || p.c.some(c => vibeCats.includes(c))))
      .map(p => ({p, m:SF.meters(here, SF.coordOf(p))})).filter(x => x.m <= maxLeg)
      .filter(x => { const arr = t + SF.travel(x.m).mins; const st = SF.statusAt(x.p, {dow:N.dow, mins:arr % 1440}); return st.state === "open" && (st.until - arr) >= 30; })
      .map(x => Object.assign(x, {sc:(x.p.c.some(c => (SF.trip.likes || []).includes(c)) ? 3 : 0) + (SF.photoOf(x.p) ? .5 : 0) - x.m / 600 + Math.random() * 1.2 + (stops.length && x.p.c[0] === stops[stops.length - 1].p.c[0] ? -2 : 0)}))
      .sort((a, b) => b.sc - a.sc);
    const pick = cand[0]; if(!pick) break;
    const travel = SF.travel(pick.m); t += travel.mins;
    const stay = pick.p.c.some(c => ["eat", "music", "art", "history"].includes(c)) ? 60 : pick.p.c.includes("drink") ? 50 : 35;
    stops.push({p:pick.p, at:t, travel:stops.length || SF.origin().from !== "the city center" ? travel.txt : ""});
    used.add(pick.p.id); here = SF.coordOf(pick.p); t += stay;
  }
  return stops;
};
SF.renderSurprise = function(){
  const S = SF.S; S.sur = S.sur || {h:2, mode:"walk", vibe:"any"};
  const s = S.sur;
  const stops = s.result || [];
  return '<section class="sec"><div class="sec-h"><h2>Surprise me</h2></div><p class="muted small">Pick how long and how you\'re getting around. You get a route through places open the whole way.</p>'
    + '<div class="chips" role="group" aria-label="How long">' + [1, 2, 3, 4].map(h => '<button class="chip" type="button" data-sh="' + h + '" aria-pressed="' + (s.h === h) + '">' + h + ' hr' + (h > 1 ? "s" : "") + '</button>').join("") + '</div>'
    + '<div class="chips" role="group" aria-label="Getting around">' + [["walk", "Walking"], ["ride", "Rideshare"]].map(([k, l]) => '<button class="chip" type="button" data-sm="' + k + '" aria-pressed="' + (s.mode === k) + '">' + l + '</button>').join("") + '</div>'
    + '<div class="chips" role="group" aria-label="Vibe">' + [["any", "Anything"], ["food", "Food"], ["night", "Night out"], ["culture", "Culture"], ["outside", "Outside"]].map(([k, l]) => '<button class="chip" type="button" data-sv="' + k + '" aria-pressed="' + (s.vibe === k) + '">' + l + '</button>').join("") + '</div>'
    + '<button class="btn pri block" type="button" data-surprise>Spin me an adventure ↻</button>'
    + (s.ran ? (stops.length ? '<ol class="route">' + stops.map((x, i) => '<li><span class="rt-n">' + (i + 1) + '</span><span class="rt-b"><button type="button" data-open="' + x.p.id + '"><b>' + esc(x.p.n) + '</b></button><span class="rs">' + esc(SF.fmtM(x.at) + (x.travel ? " · " + x.travel : "") + " · " + (SF.city.CATS[x.p.c[0]] || "")) + '</span></span><a class="btn" href="' + esc(SF.dirUrl(x.p, s.mode === "walk" ? "walking" : "driving")) + '" target="_blank" rel="noopener">Go</a></li>').join("") + '</ol><div class="btns"><button class="btn" type="button" data-surprise>Spin again</button><button class="btn" type="button" data-surplan>Add to today\'s plan</button></div>' : '<p class="empty">Not enough open right now for that. Try Rideshare, a longer window or Anything.</p>') : '')
    + '</section>';
};

/* ---------- assistant quips (by vibe), "Another one" ---------- */
const QUIPS = {
  friendly:["Hydrate, wear the comfy shoes, say yes to the detour.", "The best spot is usually two blocks off the main drag.", "Ask a bartender where they eat. Thank me later.", "Golden hour is the free attraction. Plan around it.", "Save a place now, decide later. That's what the bookmark is for."],
  sassy:["You came all this way to look at your phone? Go outside.", "If the line's around the block, it's either worth it or a trap. Ask me.", "Nobody ever regretted dessert. Lunch, maybe.", "Comfortable shoes. I won't say it twice. Fine, I'll say it twice.", "Tourist traps exist so the good places can breathe."],
  hype:["Today is a GREAT day to try something new!", "Main character energy. Let's find your scene.", "One more stop. Trust the process.", "You're gonna want photos of this. Charge your phone!", "Spin an adventure and let the city surprise you!"],
  calm:["One good meal beats five rushed ones.", "Leave room in the plan. That's where the trip happens.", "Check hours before you go. Then go.", "Walk when you can. You see more.", "Rest is part of the itinerary."]
};
SF.quip = () => { const q = QUIPS[SF.trip.vibe] || QUIPS.friendly; SF.S.qi = ((SF.S.qi == null ? Math.floor(Math.random() * q.length) : SF.S.qi + 1)) % q.length; return q[SF.S.qi]; };

/* ---------- first-visit tour ---------- */
const TOUR = [
  ["Welcome to your trip app", "Everything for " + "{city}" + " lives here: what's open, your plan, a map and answers. Here's the 20-second tour."],
  ["Holla Holla", "The red button up top. It shows the best picks open this minute, rated Meh to Must-go, for whatever screen you're on."],
  ["Your plan", "Trip has a day-by-day plan built around your flights and opening hours. Swap anything with ↻."],
  ["Ask anything", "The Ask button answers from your guide and finds anything else nearby, with directions, without leaving the app."],
  ["Check in as you go", "Turn on Auto check-in in Trip → Journal. Places land in your journal, stamps fill in, and it tells you what's next."],
  ["Put it on your phone", "Add it to your home screen so it opens like an app, even with bad signal."]
];
SF.tour = function(i){
  i = i || 0; const st = TOUR[i]; if(!st){ SF.closeSheet(); return; }
  $("#sheetRoot").innerHTML = '<div class="scrim" id="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="tT"><div class="sheet-in"><p class="k">' + (i + 1) + ' of ' + TOUR.length + '</p><h2 id="tT">' + esc(st[0]) + '</h2><p>' + esc(st[1].replace("{city}", SF.city.city.name)) + '</p><div class="prog"><i style="width:' + ((i + 1) / TOUR.length * 100) + '%"></i></div><div class="btns"><button class="btn pri" type="button" data-tn>' + (i === TOUR.length - 1 ? "Let's go" : "Next") + '</button><button class="btn" type="button" data-tskip>Skip</button></div></div></div></div>';
  const sc = $("#scrim"); sc.querySelector("[data-tn]").focus();
  sc.addEventListener("click", e => { if(e.target.closest("[data-tn]")){ if(i === TOUR.length - 1) finish(); else SF.tour(i + 1); } else if(e.target.closest("[data-tskip]") || e.target.id === "scrim") finish(); });
  function finish(){ SF.store.set("sf.toured", true); SF.closeSheet(); if(!SF.installed()) setTimeout(SF.installHelp, 400); }
};

/* ---------- install ---------- */
let deferred = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; });
SF.installed = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
SF.installHelp = async function(){
  if(SF.installed()){ SF.toast("It's already on your home screen."); return; }
  if(deferred){ deferred.prompt(); try{ await deferred.userChoice; }catch(e){} deferred = null; return; }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  $("#sheetRoot").innerHTML = '<div class="scrim" id="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="iT"><div class="sheet-in"><div class="sheet-h"><div><p class="k">Install</p><h2 id="iT">Put it on your home screen</h2></div><button class="x" type="button" data-close aria-label="Close">×</button></div>'
    + (ios ? '<ol class="steps-i"><li>Tap the <b>Share</b> button at the bottom of Safari.</li><li>Scroll and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>. Open it from your home screen from now on.</li></ol>' : '<ol class="steps-i"><li>Open your browser menu (⋮).</li><li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li><li>Open it from your home screen from now on.</li></ol>')
    + '<p class="muted small">Your trip stays on this phone. Send the link to whoever is coming so they get it too.</p><div class="btns"><button class="btn pri" type="button" data-close>Got it</button></div></div></div></div>';
  $("#scrim").addEventListener("click", e => { if(e.target.id === "scrim" || e.target.closest("[data-close]")) SF.closeSheet(); });
};

/* ---------- weather Plan B: suggest indoor swaps for outdoor stops when rain is likely (never automatic) ---------- */
SF.swapIndoor = function(n, k){
  const p = SF.plan(), d = p.days.find(x => x.n === n), it = d && d.items.find(i => i.k === k); if(!it || !it.p) return null;
  const used = new Set(p.days.flatMap(x => x.items.flatMap(i => i.p || []))), dow = SF.ymdDow(d.ymd), at = SF.coordOf(SF.byId[it.p[0]]);
  const c = SF.city.P.filter(x => !used.has(x.id) && SF.coordOf(x) && x.c.some(cc => ["art", "history", "shop"].includes(cc)) && !x.c.includes("nature"))
    .filter(x => SF.statusAt(x, {dow, mins:SF.toM(it.t) + 15}).state === "open")
    .sort((a, b) => SF.meters(at, SF.coordOf(a)) - SF.meters(at, SF.coordOf(b)))[0];
  if(!c) return null; it.p = [c.id]; it.h = c.n; it.c = c.c[0]; SF.savePlan(p); return c;
};
SF.fillPlanB = async function(){
  const slots = SF.$$("[data-planb]"); if(!slots.length) return;
  const w = await SF.weather(); if(!w || !w.daily) return;
  const plan = SF.plan();
  slots.forEach(el => {
    const d = plan.days.find(x => x.n === +el.dataset.planb); if(!d) return;
    const i = w.daily.time.indexOf(d.ymd); if(i < 0) return;
    const rain = w.daily.precipitation_probability_max[i] || 0;
    const outdoor = d.items.filter(it => it.p && SF.byId[it.p[0]] && SF.byId[it.p[0]].c.some(c => ["nature", "attraction"].includes(c)) && !it.lock);
    if(rain < 50) return;
    if(!outdoor.length){ el.innerHTML = '<p class="pb ok">☂ ' + rain + '% chance of rain. Your stops are mostly indoors.</p>'; return; }
    el.innerHTML = '<div class="pb"><b>☂ Rain likely (' + rain + '%)</b><span>Plan B for the outdoor stops? Nothing changes unless you tap.</span><div class="btns">'
      + outdoor.map(it => '<button class="btn" type="button" data-planbswap="' + d.n + '|' + it.k + '">Indoor instead of ' + SF.esc(it.h) + '</button>').join("") + '</div></div>';
  });
};

/* ---------- 33-second nudge (once per visit, never on top of another sheet) ---------- */
const NUDGE = {friendly:"Still deciding? Here's what's good right now.", sassy:"What is taking you so long? Pick something. I'll help.", hype:"Can't choose?! Let me show you the best stuff open RIGHT NOW!", calm:"Need a hand choosing? Here are a few open picks."};
let nudged = false, nt = null;
SF.armNudge = function(){
  clearTimeout(nt); if(nudged || SF.store.get("sf.noNudge", false)) return;
  nt = setTimeout(() => {
    if(nudged || $("#scrim") || $(".ask") || document.visibilityState !== "visible") return;
    nudged = true;
    const b = document.createElement("div"); b.className = "nudge"; b.setAttribute("role", "status");
    b.innerHTML = '<b>' + esc(SF.trip.bot || "Spun") + '</b><span>' + esc(NUDGE[SF.trip.vibe] || NUDGE.friendly) + '</span><div class="btns"><button class="btn pri" type="button" data-nh>Show me</button><button class="btn" type="button" data-nx>Not now</button><button class="linky" type="button" data-nn style="border:0;background:none;cursor:pointer">Don\'t nudge me</button></div>';
    b.addEventListener("click", e => { if(e.target.closest("[data-nh]")){ b.remove(); SF.openHolla(); } else if(e.target.closest("[data-nx]")) b.remove(); else if(e.target.closest("[data-nn]")){ SF.store.set("sf.noNudge", true); b.remove(); } });
    document.body.appendChild(b); setTimeout(() => b.remove(), 20000);
  }, 33000);
};
["click", "keydown", "touchstart"].forEach(ev => document.addEventListener(ev, () => { if(!nudged) SF.armNudge(); }, {passive:true}));
})();
