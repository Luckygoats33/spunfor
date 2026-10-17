/* spunfor.me v2 site: style switcher, live phone preview, city search, trip builder */
"use strict";
(function(){
const SF = window.SF, $ = SF.$, $$ = SF.$$, esc = SF.esc;
const toast = msg => { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 3200); };

/* ---------- style switcher (top bar) ---------- */
const root = document.documentElement;
function setStyle(s, save){
  root.setAttribute("data-style", s);
  $$(".sb-opts button").forEach(b => b.setAttribute("aria-checked", String(b.dataset.s === s)));
  if(save){ try{ localStorage.setItem("sf.siteStyle", s); }catch(e){} const u = new URL(location.href); u.searchParams.set("s", s); history.replaceState(null, "", u); }
}
$$(".sb-opts button").forEach(b => b.addEventListener("click", () => setStyle(b.dataset.s, true)));
setStyle(root.getAttribute("data-style") || "swiss", false);
window.SFsetStyle = setStyle;

/* ---------- city index (1,129 cities; r=1 means curated file is ready) ---------- */
let CITIES = [];
const ready = () => CITIES.filter(c => c.r);
async function loadIndex(){
  const j = await SF.getJSON("cities/index.json", 10000);
  CITIES = (j && j.cities) || [];
  $("#nReady").textContent = ready().length;
  renderCityGrid();
}
function findCities(q, n){
  q = SF.lc(q).trim(); if(q.length < 2) return [];
  const [name, st] = q.split(/\s*,\s*/);
  return CITIES.filter(c => SF.lc(c.n).startsWith(name) && (!st || SF.lc(c.st).startsWith(st)))
    .concat(CITIES.filter(c => !SF.lc(c.n).startsWith(name) && SF.lc(c.n).includes(name)))
    .slice(0, n || 7);
}
function renderCityGrid(){
  const r = ready().sort((a, b) => a.n.localeCompare(b.n));
  $("#cityGrid").innerHTML = r.map(c => '<button type="button" class="city" data-slug="' + esc(c.s) + '"><b>' + esc(c.n) + '</b><span>' + esc(c.st) + ' · curated</span></button>').join("")
    + '<div class="city more"><b>+ ' + (CITIES.length - r.length).toLocaleString() + ' more</b><span>being curated now, and they work live today</span></div>';
}
$("#cityGrid").addEventListener("click", e => { const b = e.target.closest("[data-slug]"); if(!b) return; const c = CITIES.find(x => x.s === b.dataset.slug); pickCity(c); $("#build").scrollIntoView({behavior:"smooth"}); });

/* autocomplete used by both the hero box and the builder */
function autocomplete(input, list, onPick){
  let items = [], idx = -1;
  const close = () => { list.hidden = true; idx = -1; input.setAttribute("aria-expanded", "false"); };
  input.addEventListener("input", () => {
    items = findCities(input.value);
    if(!items.length){ close(); return; }
    list.innerHTML = items.map((c, i) => '<li role="option" id="' + list.id + '-' + i + '" data-i="' + i + '"><b>' + esc(c.n) + '</b>, ' + esc(c.st) + (c.r ? ' <span class="badge">curated</span>' : ' <span class="badge live">live</span>') + '</li>').join("");
    list.hidden = false; input.setAttribute("aria-expanded", "true");
  });
  input.addEventListener("keydown", e => {
    if(list.hidden) return;
    if(e.key === "ArrowDown" || e.key === "ArrowUp"){ e.preventDefault(); idx = (idx + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length; $$("li", list).forEach((li, i) => li.setAttribute("aria-selected", String(i === idx))); input.setAttribute("aria-activedescendant", list.id + "-" + idx); }
    else if(e.key === "Enter" && idx >= 0){ e.preventDefault(); onPick(items[idx]); close(); }
    else if(e.key === "Escape") close();
  });
  list.addEventListener("mousedown", e => { const li = e.target.closest("li"); if(li){ e.preventDefault(); onPick(items[+li.dataset.i]); close(); } });
  input.addEventListener("blur", () => setTimeout(close, 150));
}

/* ---------- live phone preview: real Boston places open right now ---------- */
async function mock(){
  const j = await SF.getJSON("cities/boston.json", 10000); if(!j) return;
  /* destination photography for the photo-led styles (Cinematic, After Dark): a credited Commons landmark shot */
  const hero = j.P.filter(p => j.PHOTOS[p.id] && p.c.some(c => ["attraction", "nature", "history"].includes(c)))[0];
  if(hero){ const ph = j.PHOTOS[hero.id]; document.documentElement.style.setProperty("--hero-img", 'url("' + ph.src.replace(/width=\d+/, "width=1600") + '")'); const cr = document.createElement("a"); cr.className = "hero-credit"; cr.href = ph.page; cr.target = "_blank"; cr.rel = "noopener"; cr.textContent = hero.n + " · " + ph.credit.replace(/^Photo: /, "").slice(0, 80); const hs = document.querySelector(".hero"); if(hs) hs.appendChild(cr); }
  const keep = SF.city; SF.city = j;
  const N = SF.cityNow(), hr = N.mins / 60;
  ($("#mockGreet") || {}).textContent = hr < 12 ? "morning" : hr < 17 ? "afternoon" : "evening";
  ($("#mockTime") || {}).textContent = SF.DOWL[N.dow].slice(0, 3) + " " + SF.fmtM(N.mins);
  const open = j.P.filter(p => SF.statusAt(p).state === "open").slice(0, 3);
  const list = open.length ? open : j.P.slice(0, 3);
  ($("#mockList") || {}).innerHTML = list.map(p => { const st = SF.statusAt(p); return '<li><b>' + esc(p.n) + '</b><span>' + esc(j.CATS[p.c[0]] || "") + ' · ' + esc(SF.statusText(st)) + '</span></li>'; }).join("");
  const nx = j.P.find(p => p.c.includes("eat") && !list.includes(p));
  if(nx) ($("#mockNext") || {}).textContent = nx.n;
  SF.city = keep;
}

/* ---------- builder ---------- */
const CATS = [["coffee","Coffee"],["eat","Food"],["drink","Cocktails"],["music","Live music"],["art","Art"],["history","History"],["nature","Parks & outdoors"],["attraction","Landmarks"],["shop","Shopping"],["sports","Game day"],["queer","Queer nights"]];
const COLORS = [["#E3000F","#FFFFFF","Red"],["#C8F31D","#0D0D0C","Lime"],["#FF4A1C","#FFFFFF","Tomato"],["#2F6FEB","#FFFFFF","Blue"],["#0F8B6E","#FFFFFF","Green"],["#7B2446","#FFFFFF","Burgundy"],["#D9A441","#23172C","Gold"],["#E25C9A","#FFFFFF","Pink"]];
const B = {city:null, people:[], flights:[], likes:{}, color:COLORS[0][0], hotel:null};

function pickCity(c, raw){
  if(c){ B.city = c; $("#bCity").value = c.n + ", " + c.st; $("#cityInfo").textContent = c.r ? "Curated city: hand-checked places, photos and hours." : "Live city: built from OpenStreetMap the first time you open the app (about 30 seconds)."; }
  else if(raw){ B.city = {n:raw, st:"", live:true}; $("#cityInfo").textContent = "We'll build " + raw + " live from map data when you open the app."; }
}
autocomplete($("#bCity"), $("#bCityList"), c => pickCity(c));
$("#bCity").addEventListener("change", () => { if(!B.city || !$("#bCity").value.startsWith(B.city.n)){ const m = findCities($("#bCity").value, 1)[0]; if(m && SF.lc($("#bCity").value).startsWith(SF.lc(m.n))) pickCity(m); else if($("#bCity").value.trim()) pickCity(null, $("#bCity").value.trim()); } });

/* the hero box starts the trip chat with the city filled in */
const toChat = v => { $("#build").scrollIntoView({behavior:"smooth"}); setTimeout(() => { if(v && SF.chatSay) SF.chatSay(v); const ci = $("#chatIn"); if(ci) ci.focus({preventScroll:true}); }, 500); };
autocomplete($("#whereIn"), $("#whereList"), c => { $("#whereIn").value = c.n + ", " + c.st; pickCity(c); toChat(c.n + ", " + c.st); });
$("#whereForm").addEventListener("submit", e => {
  e.preventDefault(); const v = $("#whereIn").value.trim();
  if(v){ const m = findCities(v, 1)[0]; if(m && SF.lc(v).startsWith(SF.lc(m.n))) pickCity(m); else pickCity(null, v); }
  toChat(v);
});

/* people */
function renderPeople(){ $("#bPeople").innerHTML = B.people.map((p, i) => '<span class="tag">' + esc(p) + '<button type="button" data-rm="' + i + '" aria-label="Remove ' + esc(p) + '">×</button></span>').join("") || '<span class="fine">Just you? Add names so the app can greet everyone.</span>'; }
function addPerson(){ const v = $("#bPerson").value.trim(); if(v && B.people.length < 8 && !B.people.includes(v)){ B.people.push(v); renderPeople(); } $("#bPerson").value = ""; $("#bPerson").focus(); }
$("#bAddPerson").addEventListener("click", addPerson);
$("#bPerson").addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); addPerson(); } });
$("#bPeople").addEventListener("click", e => { const b = e.target.closest("[data-rm]"); if(b){ B.people.splice(+b.dataset.rm, 1); renderPeople(); } });

/* hotel: look it up near the city (free Nominatim), optional */
let hotelT = null;
$("#bHotel").addEventListener("change", async () => {
  const v = $("#bHotel").value.trim(); B.hotel = null; $("#hotelInfo").textContent = "";
  if(!v) return;
  const near = B.city && B.city.c ? "&viewbox=" + [B.city.c[1] - 0.3, B.city.c[0] + 0.3, B.city.c[1] + 0.3, B.city.c[0] - 0.3].join(",") + "&bounded=1" : "";
  $("#hotelInfo").textContent = "Looking it up…";
  const j = await SF.getJSON("https://nominatim.openstreetmap.org/search?q=" + encodeURIComponent(v + (B.city ? ", " + B.city.n : "")) + "&format=jsonv2&limit=1&addressdetails=1" + near, 8000);
  if(j && j[0]){ const a = j[0].address || {}; B.hotel = {name:v, lat:+(+j[0].lat).toFixed(6), lon:+(+j[0].lon).toFixed(6), ad:[a.house_number && a.road ? a.house_number + " " + a.road : a.road, a.city || a.town, a.state, a.postcode].filter(Boolean).join(", ")}; $("#hotelInfo").textContent = "Found: " + (B.hotel.ad || j[0].display_name); }
  else { B.hotel = {name:v}; $("#hotelInfo").textContent = "Couldn't pin it on the map; we'll still show the name. Distances will use the city center."; }
});

/* flights */
function renderFlights(){
  $("#bFlights").innerHTML = B.flights.map((f, i) => '<div class="flight" data-i="' + i + '"><div class="row3">'
    + '<label class="fl">Who<input data-f="who" value="' + esc(f.who) + '" placeholder="Name" maxlength="24"></label>'
    + '<label class="fl">Date<input data-f="date" type="date" value="' + esc(f.date) + '"></label>'
    + '<label class="fl">Flight<input data-f="no" value="' + esc(f.no) + '" placeholder="WN 1715" maxlength="12"></label></div><div class="row3">'
    + '<label class="fl">From → to<input data-f="route" value="' + esc(f.route) + '" placeholder="DEN → MSY" maxlength="30"></label>'
    + '<label class="fl">Departs<input data-f="dep" value="' + esc(f.dep) + '" placeholder="10:50 am" maxlength="10"></label>'
    + '<label class="fl">Arrives<input data-f="arr" value="' + esc(f.arr) + '" placeholder="2:25 pm" maxlength="10"></label></div>'
    + '<button class="linkbtn" type="button" data-rmf="' + i + '">Remove flight</button></div>').join("");
}
$("#bAddFlight").addEventListener("click", () => { B.flights.push({who:B.people[0] || "", date:$("#bArrive").value || "", no:"", route:"", dep:"", arr:""}); renderFlights(); });
$("#bFlights").addEventListener("input", e => { const i = e.target.closest(".flight"); if(i && e.target.dataset.f) B.flights[+i.dataset.i][e.target.dataset.f] = e.target.value; });
$("#bFlights").addEventListener("click", e => { const b = e.target.closest("[data-rmf]"); if(b){ B.flights.splice(+b.dataset.rmf, 1); renderFlights(); } });

/* likes: tap = love, tap again = skip, again = neutral */
function renderLikes(){ $("#bLikes").innerHTML = CATS.map(([k, l]) => { const s = B.likes[k] || 0; return '<button type="button" class="like s' + s + '" data-k="' + k + '" aria-pressed="' + (s ? "true" : "false") + '"><span aria-hidden="true">' + (s === 1 ? "♥ " : s === 2 ? "✕ " : "") + '</span>' + esc(l) + '<span class="sr">' + (s === 1 ? " (love)" : s === 2 ? " (skip)" : "") + '</span></button>'; }).join(""); }
$("#bLikes").addEventListener("click", e => { const b = e.target.closest("[data-k]"); if(!b) return; B.likes[b.dataset.k] = ((B.likes[b.dataset.k] || 0) + 1) % 3; renderLikes(); });

/* colors */
function renderColors(){ $("#bColors").innerHTML = COLORS.map(([c, ink, n]) => '<button type="button" role="radio" class="sw" style="--c:' + c + ';--ci:' + ink + '" data-c="' + c + '" aria-checked="' + (B.color === c) + '" aria-label="' + n + '"><span aria-hidden="true"></span>' + n + '</button>').join(""); }
$("#bColors").addEventListener("click", e => { const b = e.target.closest("[data-c]"); if(b){ B.color = b.dataset.c; renderColors(); } });

/* build */
$("#builder").addEventListener("submit", e => {
  e.preventDefault(); $("#bErr").textContent = "";
  if(!B.city && $("#bCity").value.trim()) pickCity(null, $("#bCity").value.trim());
  if(!B.city){ $("#bErr").textContent = "Pick a city first."; $("#bCity").focus(); return; }
  const arrive = $("#bArrive").value, depart = $("#bDepart").value || arrive;
  if(!arrive){ $("#bErr").textContent = "Add your arrival date."; $("#bArrive").focus(); return; }
  if(depart < arrive){ $("#bErr").textContent = "Your leave date is before your arrival date."; $("#bDepart").focus(); return; }
  const ink = (COLORS.find(c => c[0] === B.color) || COLORS[0])[1];
  const trip = {
    v:1, city:B.city.s && B.city.r ? B.city.s : "live:" + B.city.n, cityName:B.city.n, state:B.city.st || "", center:B.city.c || null,
    name:$("#bName").value.trim() || "", arrive, depart, travelers:B.people.slice(),
    hotel:B.hotel, flights:B.flights.filter(f => f.date && (f.arr || f.dep)).map(f => ({who:f.who, date:f.date, no:f.no, route:f.route, dep:f.dep, arr:f.arr})),
    likes:Object.keys(B.likes).filter(k => B.likes[k] === 1), skip:Object.keys(B.likes).filter(k => B.likes[k] === 2),
    color:B.color, ink, bot:$("#bBot").value.trim() || "Spun", vibe:$("#bVibe").value
  };
  const url = new URL("app/", location.href); url.search = "?t=" + SF.encodeTrip(trip);
  B.link = url.href;
  try{ const mine = JSON.parse(localStorage.getItem("sf.myTrips") || "[]"); mine.unshift({at:Date.now(), city:trip.cityName, arrive, link:B.link}); localStorage.setItem("sf.myTrips", JSON.stringify(mine.slice(0, 10))); }catch(_){}
  $("#bOpen").href = B.link;
  $("#bDoneTxt").textContent = (trip.name || trip.cityName + " trip") + ", " + new Date(arrive + "T12:00:00Z").toLocaleDateString("en-US", {month:"short", day:"numeric", timeZone:"UTC"}) + (depart !== arrive ? " to " + new Date(depart + "T12:00:00Z").toLocaleDateString("en-US", {month:"short", day:"numeric", timeZone:"UTC"}) : "") + (B.city.r ? ". Curated city." : ". Built live the first time it opens.");
  $("#bDone").hidden = false; $("#bDone").scrollIntoView({behavior:"smooth", block:"center"});
});
$("#bShare").addEventListener("click", async () => { if(!B.link) return; const text = "Our trip app is ready. Open it, then add it to your home screen:"; if(navigator.share){ try{ await navigator.share({title:"Our trip app", text, url:B.link}); return; }catch(e){ if(e.name === "AbortError") return; } } try{ await navigator.clipboard.writeText(text + " " + B.link); toast("Link copied. Paste it into a text."); }catch(e){ toast("Copy the link from the Open button."); } });
$("#bCopy").addEventListener("click", async () => { try{ await navigator.clipboard.writeText(B.link); toast("Link copied."); }catch(e){ toast("Couldn't copy here."); } });

/* ---------- live demo in the hero phone: a real Boston trip app (demo mode: no tour, no saving) ---------- */
(function(){
  const fr = $("#demoFrame"); if(!fr) return;
  const sat = new Date(); sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7 || 7));
  const a = sat.toISOString().slice(0, 10);
  const demo = {v:1, city:"boston", cityName:"Boston", state:"MA", center:[42.3603, -71.0578], name:"Boston weekend", arrive:a, depart:SF.ymdAdd(a, 2), travelers:["Sam", "Alex"], hotel:{name:"Omni Parker House", lat:42.357837, lon:-71.060236, ad:"60 School Street, Boston, MA 02108"}, flights:[], likes:["music", "history", "eat"], skip:["sports"], color:"#E3000F", ink:"#FFFFFF", bot:"Spun", vibe:"friendly", id:"demo-boston"};
  const url = "app/?demo=1&t=" + SF.encodeTrip(demo);
  fr.src = url; $("#demoOpen").href = url;
  const fit = () => { const ph = $("#demoPhone"); if(ph) ph.style.setProperty("--ps", (ph.clientWidth / 375).toFixed(4)); };
  fit(); window.addEventListener("resize", fit);
})();
/* ---------- trip-type starters feed the chat ---------- */
document.querySelectorAll("[data-start]").forEach(b => b.addEventListener("click", () => toChat(b.dataset.start)));
/* ---------- your trips (this browser only) ---------- */
(function(){
  let mine = []; try{ mine = JSON.parse(localStorage.getItem("sf.myTrips") || "[]").filter(t => t && t.link); }catch(e){}
  const el = $("#myTrips"); if(!el || !mine.length) return;
  el.hidden = false;
  el.innerHTML = '<p class="fine"><b>Your trips on this device</b></p>' + mine.slice(0, 4).map(t => '<a class="mytrip" href="' + esc(t.link) + '">' + esc(t.city || "Trip") + (t.arrive ? ' · ' + esc(new Date(t.arrive + "T12:00:00Z").toLocaleDateString("en-US", {month:"short", day:"numeric", timeZone:"UTC"})) : '') + ' →</a>').join("");
})();

/* defaults: arrive two weeks out */
const d = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
$("#bArrive").value = d; $("#bDepart").value = SF.ymdAdd(d, 3);
renderPeople(); renderLikes(); renderColors(); renderFlights();
loadIndex(); mock();
})();
