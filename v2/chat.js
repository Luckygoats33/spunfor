/* spunfor.me trip chat: one box like a chat app. Type or talk everything at once; it fills in what it understood,
   then asks short follow-ups only for what's missing. Nothing leaves the browser except the hotel lookup (OpenStreetMap). */
"use strict";
(function(){
const SF = window.SF, $ = SF.$, esc = SF.esc, lc = SF.lc, PARSE = window.SpunforParse;
let CITIES = [];
SF.getJSON("cities/index.json", 10000).then(j => { CITIES = (j && j.rows ? j.rows.map(r => ({s:r[0], n:r[1], st:r[2], c:[r[3], r[4]], pop:Math.round(r[5] * 1000), r:r[6]})) : (j && j.cities) || []); });

/* ---------- vocab ---------- */
const CATS = {coffee:"Coffee", eat:"Food", drink:"Cocktails", music:"Live music", art:"Art", history:"History", nature:"Parks & outdoors", attraction:"Landmarks", shop:"Shopping", sports:"Game day", queer:"Queer nights"};
const CATW = [
  ["coffee", /\b(coffee|cafes?|cafés?|espresso|bakery|bakeries|pastr(y|ies))\b/],
  ["eat", /\b(food|foodie|eating|restaurants?|dining|brunch|dinners?|eats|bbq|barbecue|tacos?|pizza|seafood)\b/],
  ["drink", /\b(bars?|drinks?|drinking|cocktails?|beer|breweries|brewery|wine|nightlife|happy hour)\b/],
  ["music", /\b(music|jazz|blues|concerts?|bands?|live shows?|clubs?|dancing|karaoke)\b/],
  ["art", /\b(art|arts|galler(y|ies)|murals?|museums? of art)\b/],
  ["history", /\b(history|historic|historical|museums?|monuments?|architecture|ghost tours?)\b/],
  ["nature", /\b(nature|parks?|outdoors?|hik(e|es|ing)|trails?|gardens?|beach(es)?|kayak\w*|views?)\b/],
  ["attraction", /\b(landmarks?|sights?|sightseeing|attractions?|touristy|must.sees?|tours?)\b/],
  ["shop", /\b(shop(s|ping)?|markets?|boutiques?|thrift\w*|vintage|souvenirs?|antiques?)\b/],
  ["sports", /\b(sports?|games?|baseball|football|basketball|hockey|soccer|stadiums?)\b/],
  ["queer", /\b(gay|queer|lgbt\w*|drag)\b/]
];
const NEG = /\b(hate|hates|dislike|don'?t (?:like|want|care)|do not like|not into|no|skip|avoid|can'?t stand|not a fan of|without|except)\b/;
const POS = /\b(love|loves|like|likes|into|enjoy|enjoys|want|wants|obsessed|big on|fan of|craving|interested in|looking for|show us|mostly)\b/;
const AIRLINES = {southwest:"WN", delta:"DL", united:"UA", american:"AA", alaska:"AS", jetblue:"B6", spirit:"NK", frontier:"F9", hawaiian:"HA", allegiant:"G4", "sun country":"SY", breeze:"MX"};
const COLORS = [["red", "#E3000F", "#FFFFFF"], ["lime", "#C8F31D", "#0D0D0C"], ["blue", "#2F6FEB", "#FFFFFF"], ["green", "#0F8B6E", "#FFFFFF"], ["purple", "#7B2CBF", "#FFFFFF"], ["pink", "#E25C9A", "#FFFFFF"], ["gold", "#D9A441", "#23172C"], ["black", "#111111", "#FFFFFF"], ["orange", "#FF4A1C", "#FFFFFF"], ["burgundy", "#7B2446", "#FFFFFF"]];
const VIBES = [["friendly", /\b(friendly|nice|warm|sweet|helpful)\b/, "Friendly local"], ["sassy", /\b(sassy|sarcastic|funny|snarky|dry|golden girls|witty|savage)\b/, "Dry and sassy"], ["hype", /\b(hype|hyped|excited|energetic|fun|bubbly|party)\b/, "Hype friend"], ["calm", /\b(calm|chill|simple|to the point|brief|serious|minimal)\b/, "Calm and brief"]];
const NAME_STOP = new Set("I Me My We Us Our The A An And With Plus Staying Flying Landing Love Hate Like Want Trip Hotel Inn Airport Southwest Delta United American Alaska Jetblue Spirit Frontier Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July August September October November December Jan Feb Mar Apr Jun Jul Aug Sep Sept Oct Nov Dec Weekend Next This Just Mom Dad Kids Family Friends Girls Guys Boys Husband Wife Partner Boyfriend Girlfriend Sister Brother Daughter Son Aunt Uncle Niece Nephew Grandma Grandpa Spun Ok Okay Yes No Yeah Nope".split(" "));

/* ---------- parsing ---------- */
const NICK = [[/\bvegas\b/, "las vegas"], [/\bnyc\b|\bnew york\b(?! state)/, "new york city"], [/\bnola\b/, "new orleans"], [/\bphilly\b/, "philadelphia"], [/\bsan fran\b|\bsf\b|\bfrisco\b/, "san francisco"], [/\bd\.?c\.?\b(?!\s*\d)/, "washington"], [/\bchi-?town\b/, "chicago"], [/\batl\b/, "atlanta"], [/\bh-?town\b/, "houston"], [/\bmotor city\b/, "detroit"], [/\bnashvegas\b/, "nashville"], [/\bthe big easy\b/, "new orleans"], [/\bpdx\b/, "portland, or"], [/\bsea-?tac\b/, "seattle"], [/\bslc\b/, "salt lake city"], [/\bokc\b/, "oklahoma city"], [/\bkc\b/, "kansas city"]];
function findCity(text, names, strict){
  let low = lc(text); if(!/\blas vegas\b/.test(low)) NICK.forEach(([re, to]) => { low = low.replace(re, to); });
  const t = " " + low.replace(/[^a-z0-9.,' -]/g, " ") + " ";
  let best = null;
  for(const c of CITIES){
    const n = lc(c.n); if(n.length < 3) continue;
    const i = t.indexOf(" " + n + " ") >= 0 ? t.indexOf(" " + n + " ") : t.indexOf(" " + n + ",") >= 0 ? t.indexOf(" " + n + ",") : t.indexOf(" " + n + ".");
    if(i < 0) continue;
    const after = t.slice(i + n.length + 1, i + n.length + 30);
    const stHit = new RegExp("^[, ]+(" + lc(c.st) + "|" + lc(STATE[c.st] || "~~") + ")\\b").test(after);
    const cue = /(?:\bto|\bin|visiting|visit|trip to|headed to|heading to|going to|actually|instead|city is|destination is)\s+$/.test(t.slice(Math.max(0, i - 22), i + 1));
    if((names || []).includes(c.n) && !stHit && !cue) continue;
    if(strict && !stHit && !cue) continue;
    const score = n.length * 10 + (stHit ? 500 : 0) + Math.log10((c.pop || 1) + 1) + (c.r ? 2 : 0);
    if(!best || score > best.score) best = {c, score, stHit};
  }
  if(!best) return null;
  const same = CITIES.filter(x => lc(x.n) === lc(best.c.n));
  return {city:best.c, ambiguous:!best.stHit && same.length > 1 ? same.sort((a, b) => b.pop - a.pop).slice(0, 4) : null};
}
const STATE = {AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"District of Columbia"};
function findDates(text){
  if(!PARSE) return null;
  const today = new Date();
  const m = text.match(/\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*\d{1,2}(?:st|nd|rd|th)?(?:\s*(?:-|–|—|to|through|thru|until|till)\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*)?\d{1,2}(?:st|nd|rd|th)?)?|\d{1,2}\/\d{1,2}(?:\s*(?:-|–|to)\s*\d{1,2}\/\d{1,2})?|(?:this|next) (?:weekend|week)|tomorrow|(?:a|one|two|three|four|five|\d+) (?:days?|nights?|weekend|weeks?))\b/i);
  if(!m) return null;
  let s = m[1].replace(/(\d)(st|nd|rd|th)/gi, "$1");
  const sl = s.match(/^(\d{1,2})\/(\d{1,2})(?:\s*(?:-|–|to)\s*(\d{1,2})\/(\d{1,2}))?$/);
  if(sl){ const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; s = M[+sl[1] - 1] + " " + sl[2] + (sl[3] ? " to " + M[+sl[3] - 1] + " " + sl[4] : ""); }
  const r = PARSE.resolveDates(s, today);
  if(!r || !r.start) return r && r.days ? {lenOnly:r.days} : null;
  /* "lands/flight ... 2:25" times must not be read as dates; resolveDates only sees the date phrase */
  return {start:r.start, end:r.end || r.start};
}
function findNames(text, asked){
  const out = [];
  const grab = s => { (s.match(/\b[A-Z][a-z]{1,15}\b/g) || []).forEach(n => { if(!NAME_STOP.has(n) && !out.includes(n)) out.push(n); }); };
  const m = text.match(/\b(?:with|me and|myself and|and me|for|travelers?:?|going:?|it'?s|its|names?:?|crew:?)\s+((?:[A-Z][a-z]+(?:,?\s*(?:and|&|\+)?\s*)?){1,6})/g);
  (m || []).forEach(x => grab(x.replace(/^\w+\s+/, "")));
  const mine = text.match(/\b(?:i'?m|i am|my name is|this is)\s+([A-Z][a-z]+)/); if(mine && !NAME_STOP.has(mine[1]) && !out.includes(mine[1])) out.unshift(mine[1]);
  (text.match(/\b(?:[Mm]e|[Mm]yself|[Ii])\s+(?:and|&)\s+((?:[A-Z][a-z]+(?:,?\s*(?:and|&)?\s*)?){1,4})/g) || []).forEach(x => grab(x.replace(/^\w+\s+(?:and|&)\s+/, "")));
  (text.match(/\b(?:wife|husband|partner|girlfriend|boyfriend|fianc[ée]e?|friend|bestie|bff|sister|brother|mom|dad|mother|father|daughter|son|aunt|uncle|niece|nephew|cousin|grandma|grandpa)\s+([A-Z][a-z]+)/g) || []).forEach(x => grab(x.replace(/^\w+\s+/, "")));
  if(asked && !out.length) grab(text);
  return out;
}
function findHotel(text){
  const m = text.match(/\b(?:staying (?:at|in)|stay at|hotel(?: is)?|booked (?:at|the)|airbnb (?:at|in|on)|our place is)\s+(?:the\s+)?([^,.;!\n]{3,60}?)(?=\s+(?:and|but|from|on|for|with|landing|flying|we|i)\b|[,.;!\n]|$)/i);
  return m ? m[1].trim().replace(/^the\s+/i, "") : null;
}
function findFlights(text, names){
  const out = [], t = text;
  const re = /\b(?:(southwest|delta|united|american|alaska|jetblue|spirit|frontier|hawaiian|allegiant|sun country|breeze)\s+(?:flight\s+)?(?:#\s*)?(\d{1,4})|([A-Z]{2}|[A-Z]\d|\d[A-Z])\s?(\d{1,4}))\b/gi;
  let m;
  while((m = re.exec(t))){
    const code = m[1] ? AIRLINES[lc(m[1])] : m[3].toUpperCase(), num = m[2] || m[4];
    if(!m[1] && !/^(WN|DL|UA|AA|AS|B6|NK|F9|HA|G4|SY|MX|AC|WS|BA|LH|AF|KL)$/.test(code)) continue;
    const near = t.slice(m.index, m.index + 120);
    const arr = (near.match(/\b(?:land(?:s|ing)?|arriv(?:e|es|ing)|gets? in|getting in)\s+(?:at\s+|around\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|a|p)?)/i) || [])[1];
    const dep = (near.match(/\b(?:depart(?:s|ing)?|leav(?:e|es|ing)|takes? off|fly(?:ing)? out)\s+(?:at\s+|around\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|a|p)?)/i) || [])[1];
    const before = t.slice(Math.max(0, m.index - 40), m.index);
    const who = (before.match(/\b([A-Z][a-z]+)(?:'s| is| flies| flying)/) || [])[1];
    out.push({no:code + " " + num, arr:arr ? arr.replace(/\s*(a|p)$/i, " $1m") : "", dep:dep ? dep.replace(/\s*(a|p)$/i, " $1m") : "", who:who && !NAME_STOP.has(who) ? who : ((names || [])[0] || "")});
  }
  if(!out.length){ const arr = (t.match(/\b(?:land(?:s|ing)?|arriv(?:e|es|ing)|gets? in|getting in)\s+(?:at\s+|around\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i) || [])[1]; if(arr) out.push({no:"", arr, dep:"", who:(names || [])[0] || ""}); }
  return out;
}
function findTastes(text){
  const likes = new Set(), skip = new Set(), notes = [];
  /* clause by clause: "love jazz and history, hate sports" → jazz+history loved, sports skipped.
     A clause with no cue word inherits the one before it ("love jazz, history and art"). */
  let mood = 0;
  lc(text).split(/[.;!\n,]|\bbut\b|\band (?=(?:not|no|hate|skip|avoid)\b)/).forEach(part => {
    const ni = part.search(NEG), pi = part.search(POS);
    if(ni >= 0 && (pi < 0 || ni > pi)) mood = -1; else if(pi >= 0) mood = 1;
    CATW.forEach(([c, re]) => { if(re.test(part)){ if(mood < 0) skip.add(c); else likes.add(c); } });
  });
  const need = lc(text).match(/\b(vegetarian|vegan|gluten[- ]free|celiac|kosher|halal|pescatarian|wheelchair|accessible|step[- ]free|sober|no alcohol|kid[- ]friendly|dog[- ]friendly)\b/g);
  if(need) notes.push(...new Set(need));
  skip.forEach(c => likes.delete(c));
  /* "bar" inside "sober"/"no alcohol" never counts as loving bars */
  if(notes.some(n => /sober|no alcohol/.test(n))){ likes.delete("drink"); skip.add("drink"); }
  return {likes:[...likes], skip:[...skip], notes};
}
function findStyle(text){
  const l = lc(text), out = {};
  const col = COLORS.find(([n]) => new RegExp("\\b" + n + "\\b").test(l) && /\b(color|colour|theme|make it|in|accent)\b/.test(l));
  if(col){ out.color = col[1]; out.ink = col[2]; }
  const hex = text.match(/#[0-9a-f]{6}\b/i); if(hex){ out.color = hex[0].toUpperCase(); out.ink = "#FFFFFF"; }
  const v = VIBES.find(([, re]) => re.test(l) && /\b(vibe|assistant|tone|personality|be|sound|style)\b/.test(l)); if(v) out.vibe = v[0];
  const bn = text.match(/\b(?:call (?:it|the assistant|my assistant|her|him)|name (?:it|the assistant)|assistant(?:'s)? name(?: is)?)\s+["“]?([A-Z][a-zA-Z]{1,18})/); if(bn) out.bot = bn[1];
  const tn = text.match(/\b(girls'? trip|guys'? trip|bachelorette|bachelor party|honeymoon|anniversary|birthday trip|babymoon|family trip|road trip|work trip|reunion|couples'? getaway|romantic getaway|solo trip|friends'? weekend)\b/i); if(tn) out.name = tn[1].replace(/^./, c => c.toUpperCase());
  return out;
}

function findExtras(text){
  const l = lc(text), o = {};
  if(/\b(relaxed|relax|chill|slow|lazy|easy ?going|laid.?back)\b/.test(l)) o.pace = "relaxed";
  else if(/\b(packed|adventure|see everything|go go|non.?stop|busy|jam.?packed|max(?:imum)?)\b/.test(l)) o.pace = "adventure";
  else if(/\b(balanced|moderate pace|in between|medium)\b/.test(l)) o.pace = "balanced";
  if(/\b(moderate|mid.?range|reasonable|normal budget)\b/.test(l)) o.budget = "moderate";
  else if(/\b(splurge|luxury|premium|fancy|bougie|high.?end|treat ourselves)\b/.test(l)) o.budget = "premium";
  else if(/\b(cheap|budget|affordable|frugal|broke|shoestring|free stuff)\b/.test(l)) o.budget = "budget";
  if(/\b(walk|walking|on foot)\b/.test(l) && !/limited walking|can'?t walk|not much walking/.test(l)) o.move = "walk";
  if(/\b(transit|subway|metro|bus|streetcar|train|light rail)\b/.test(l)) o.move = "transit";
  if(/\b(car|rental|renting a car|drive|driving|uber|lyft|rideshare)\b/.test(l)) o.move = "car";
  const acc = [];
  if(/\b(wheelchair|step.?free|accessible)\b/.test(l)) acc.push("wheelchair / step-free");
  if(/\b(limited walking|bad knees?|can'?t walk (?:far|much)|mobility|cane|walker|not much walking)\b/.test(l)) acc.push("limited walking");
  if(/\b(stroller|pram)\b/.test(l)) acc.push("stroller");
  if(acc.length) o.access = acc;
  const ages = (l.match(/\b(?:kids?|children)\s+(?:are\s+|aged?\s+|ages?\s+)((?:\d{1,2}(?:\s*(?:,|and|&)\s*)?)+)/) || [])[1] || ((l.match(/\d{1,2}\s*(?:years?|yrs?)[- ]old/g) || []).join(" ") || null);
  if(ages) o.kids = ages.match(/\d{1,2}/g).map(Number).filter(n => n < 18);
  else if(/\b(toddler|baby|infant)\b/.test(l)) o.kids = [2];
  if(/\b(kids?|children|family)\b/.test(l)) o.family = true;
  const must = text.match(/\b(?:must see|must-see|have to see|need to see|definitely (?:want to see|visit)|can'?t miss)\s+([^.;!\n]{3,80})/i);
  if(must) o.must = must[1].split(/\s*(?:,|and)\s*/).map(x => x.trim()).filter(Boolean).slice(0, 6);
  return o;
}

/* ---------- state + flow ---------- */
const T = {pace:"", budget:"", move:"", access:[], kids:[], must:[], family:false, fineAsked:false, fine:false, fineDone:{}, city:null, cityLive:null, arrive:"", depart:"", travelers:[], hotel:null, hotelAsked:false, flights:[], flightsAsked:false, likes:[], skip:[], notes:[], tasteAsked:false, peopleAsked:false, styleAsked:false, color:"#E3000F", ink:"#FFFFFF", vibe:"friendly", bot:"Spun", name:""};
let asking = null, log = null, built = null;
function merge(text){
  const got = [];
  const ns0 = findNames(text, asking === "people");
  const fc = /\bsurprise me\b/i.test(text) ? null : findCity(text, ns0, !!T.city && asking !== "city");
  if(fc && (!T.city || asking === "city" || !lc(text).includes(lc(T.city.n)))){
    if(fc.ambiguous && !(T.city && lc(T.city.n) === lc(fc.city.n))){ T.ambig = fc.ambiguous; }
    else { T.city = fc.city; T.cityLive = null; T.ambig = null; got.push("city"); }
  } else if(asking === "city" && !fc && text.trim().length > 1 && !/^(idk|not sure)/i.test(text)){ T.city = null; T.cityLive = text.trim().replace(/^(to|in)\s+/i, "").replace(/[.!?]+$/, "").replace(/\b\w/g, c => c.toUpperCase()); got.push("city"); }
  const d = findDates(text);
  if(d && d.start){ T.arrive = d.start; T.depart = d.end < d.start ? d.start : d.end; got.push("dates");
    const len = Math.round((new Date(T.depart) - new Date(T.arrive)) / 864e5) + 1;
    T.dateNote = len > 14 ? "That's " + len + " days; I'll plan the first 14 in detail." : "";
  }
  else if(d && d.lenOnly && T.arrive){ T.depart = SF.ymdAdd(T.arrive, d.lenOnly - 1); got.push("dates"); }
  const ns = findNames(text, asking === "people");
  if(ns.length){ ns.forEach(n => { if(!T.travelers.includes(n)) T.travelers.push(n); }); got.push("people"); }
  if(asking === "people" && /\b(just me|only me|solo|by myself|alone)\b/i.test(text)){ T.peopleAsked = true; got.push("people"); }
  const h = findHotel(text) || (asking === "hotel" && !/^(skip|no|not yet|idk|none|nope|not sure|don'?t know)/i.test(text.trim()) && text.trim().length > 2 ? text.trim().replace(/[.!]+$/, "").replace(/^(?:we're |we are |i'm |im )?(?:staying )?(?:at |in )?(?:the )?/i, "") : null);
  if(h){ T.hotel = {name:h}; got.push("hotel"); lookupHotel(h); }
  const fl = findFlights(text, T.travelers);
  if(fl.length){ fl.forEach(f => { if(!T.flights.some(x => x.no && x.no === f.no)) T.flights.push(Object.assign({date:T.arrive}, f)); }); got.push("flights"); }
  const ta = findTastes(text);
  if(ta.likes.length || ta.skip.length || ta.notes.length){ ta.likes.forEach(c => { if(!T.likes.includes(c)) T.likes.push(c); T.skip = T.skip.filter(x => x !== c); }); ta.skip.forEach(c => { if(!T.skip.includes(c)) T.skip.push(c); T.likes = T.likes.filter(x => x !== c); }); ta.notes.forEach(n => { if(!T.notes.includes(n)) T.notes.push(n); }); got.push("tastes"); }
  const ex = findExtras(text);
  if(Object.keys(ex).length){ if(ex.pace) T.pace = ex.pace; if(ex.budget) T.budget = ex.budget; if(ex.move) T.move = ex.move; if(ex.access) ex.access.forEach(a => { if(!T.access.includes(a)) T.access.push(a); }); if(ex.kids) T.kids = ex.kids; if(ex.family) T.family = true; if(ex.must) ex.must.forEach(m => { if(!T.must.includes(m)) T.must.push(m); }); got.push("extras"); }
  if(asking === "must" && !/^(skip|no|nope|none|nothing|nah)/i.test(text.trim()) && !ex.must){ text.split(/\s*(?:,|\band\b)\s*/).map(x => x.trim().replace(/[.!]+$/, "")).filter(x => x.length > 2).slice(0, 6).forEach(m => { if(!T.must.includes(m)) T.must.push(m); }); got.push("extras"); }
  const st = findStyle(text);
  Object.assign(T, st); if(st.color) T.colorSet = true; if(st.vibe) T.vibeSet = true; if(Object.keys(st).length) got.push("style");
  return got;
}
async function lookupHotel(name){
  const c = T.city ? T.city.c : null;
  const near = c ? "&viewbox=" + [c[1] - .35, c[0] + .3, c[1] + .35, c[0] - .3].join(",") + "&bounded=1" : "";
  const j = await SF.getJSON("https://nominatim.openstreetmap.org/search?q=" + encodeURIComponent(name + (T.city ? ", " + T.city.n : T.cityLive ? ", " + T.cityLive : "")) + "&format=jsonv2&limit=1&addressdetails=1" + near, 8000);
  if(j && j[0] && T.hotel && T.hotel.name === name){ const a = j[0].address || {}; T.hotel = {name, lat:+(+j[0].lat).toFixed(6), lon:+(+j[0].lon).toFixed(6), ad:[a.house_number && a.road ? a.house_number + " " + a.road : a.road, a.city || a.town, a.state, a.postcode].filter(Boolean).join(", ")}; renderSummary(); }
}
function nextQuestion(){
  if(T.ambig) return {k:"city", q:"Which " + T.ambig[0].n + "?", chips:T.ambig.map(c => c.n + ", " + c.st)};
  if(!T.city && !T.cityLive) return {k:"city", q:"Where are you headed?", chips:["Boston", "Chicago", "Nashville", "Las Vegas"]};
  if(!T.arrive) return {k:"dates", q:"When are you going? Something like \"Nov 4 to 8\" or \"next weekend\".", chips:["This weekend", "Next weekend"]};
  if(!T.travelers.length && !T.peopleAsked) return {k:"people", q:"Who's going? Names make the app greet everyone.", chips:["Just me"]};
  if(!T.hotel && !T.hotelAsked) return {k:"hotel", q:"Where are you staying? A hotel name or address works. Walk times start there.", chips:["Not booked yet"]};
  if(!T.flights.length && !T.flightsAsked) return {k:"flights", q:"Flying in? Give me the flight and landing time, like \"Southwest 1715 lands 2:25 pm\". Day one gets planned around it.", chips:["Driving", "Not booked yet"]};
  if(!T.likes.length && !T.tasteAsked) return {k:"tastes", q:"What are you into, and what should I skip? Like \"love jazz and history, no sports\".", chips:["Food", "Live music", "Cocktails", "Parks & outdoors", "Art", "History", "Surprise me"]};
  if(!T.fineAsked) return {k:"fine", q:"That's enough to build a great app. Want to fine-tune it? Pace, budget, how you get around, accessibility and must-sees. All optional.", chips:["Fine-tune it", "Build it now"]};
  if(T.fine){
    if(!T.pace && !T.fineDone.pace) return {k:"pace", q:"What pace? Relaxed is 2 or 3 big stops a day, adventure packs it in.", chips:["Relaxed", "Balanced", "Adventure"]};
    if(!T.budget && !T.fineDone.budget) return {k:"budget", q:"Daily spending per person on food and fun?", chips:["Budget-friendly", "Moderate", "Premium"]};
    if(!T.move && !T.fineDone.move) return {k:"move", q:"How are you getting around?", chips:["Walking", "Transit", "Car & rideshare"]};
    if(!T.access.length && !T.fineDone.access) return {k:"access", q:"Anything that makes getting around harder? I'll keep stops close and step-free where I can.", chips:["Nothing", "Wheelchair / step-free", "Limited walking", "Stroller"]};
    if(T.family && !T.kids.length && !T.fineDone.kids) return {k:"kids", q:"How old are the kids? I'll skip the late-night stuff.", chips:["Under 5", "5 to 12", "Teens"]};
    if(!T.must.length && !T.fineDone.must) return {k:"must", q:"Anything you have to see, or want to avoid? Name the places.", chips:["Nothing specific"]};
  }
  if(!T.styleAsked){
    if(T.colorSet && !T.vibeSet) return {k:"style", q:"Nice. And your assistant's personality?", chips:["Friendly", "Sassy", "Hype", "Calm", "Looks good"]};
    if(T.vibeSet && !T.colorSet) return {k:"style", q:"Love it. Pick a color for the app.", chips:["Red", "Lime", "Blue", "Pink", "Gold", "Looks good"]};
    return {k:"style", q:"Last one: pick a color and your assistant's personality. Or just say \"looks good\".", chips:["Red", "Lime", "Blue", "Pink", "Gold", "Sassy", "Hype", "Calm", "Looks good"]};
  }
  return null;
}
function markAsked(k, text){
  const no = /^(skip|no|nope|none|not (booked )?yet|idk|not sure|don'?t know|driving|n\/a|just me|surprise me|looks good|that'?s (it|all)|done)\b/i.test(text.trim());
  if(k === "people") T.peopleAsked = true;
  if(k === "hotel" && (no || T.hotel)) T.hotelAsked = true;
  if(k === "flights" && (no || T.flights.length)) T.flightsAsked = true;
  if(k === "tastes") T.tasteAsked = true;
  if(k === "style" && (no || (T.colorSet && T.vibeSet))) T.styleAsked = true;
  if(k === "fine"){ T.fineAsked = true; T.fine = /fine|tune|yes|sure|ok/i.test(text) && !/build it now|no\b|skip/i.test(text); }
  if(["pace", "budget", "move", "access", "kids", "must"].includes(k)) T.fineDone[k] = true;
  if(k === "tastes" && /surprise me/i.test(text)) T.tasteAsked = true;
}
const chipToText = (k, c) => {
  if(k === "pace") return c.toLowerCase() + " pace";
  if(k === "budget") return {"Budget-friendly":"budget", "Moderate":"moderate budget", "Premium":"premium, treat ourselves"}[c] || c;
  if(k === "move") return {"Walking":"walking", "Transit":"transit", "Car & rideshare":"car and rideshare"}[c] || c;
  if(k === "access") return c === "Nothing" ? "nothing" : c === "Wheelchair / step-free" ? "wheelchair, step-free" : c.toLowerCase();
  if(k === "kids") return {"Under 5":"kids ages 3", "5 to 12":"kids ages 8", "Teens":"kids ages 15"}[c] || c;
  if(k === "must") return "skip";
  if(k === "tastes"){ const m = {"Food":"love food", "Live music":"love live music", "Cocktails":"love cocktails", "Parks & outdoors":"love parks", "Art":"love art", "History":"love history"}; return m[c] || c; }
  if(k === "style"){ return /^(red|lime|blue|pink|gold)$/i.test(c) ? "make it " + c + " color" : /^(friendly|sassy|hype|calm)$/i.test(c) ? c + " assistant vibe" : c; }
  return c;
};

/* ---------- UI ---------- */
function bubble(who, html){ const d = document.createElement("div"); d.className = "cmsg " + who; d.innerHTML = html; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; }
function ask(){
  const nq = nextQuestion(); asking = nq ? nq.k : null;
  $("#chatChips").innerHTML = "";
  if(!nq){ finish(); return; }
  bubble("bot", esc(nq.q));
  $("#chatChips").innerHTML = nq.chips.map(c => '<button type="button" class="cchip" data-c="' + esc(c) + '">' + esc(c) + '</button>').join("") + (["people", "hotel", "flights", "tastes", "style"].includes(nq.k) ? '<button type="button" class="cchip ghost" data-c="skip">Skip</button>' : "");
}
function said(text){
  text = String(text || "").trim(); if(!text) return;
  bubble("me", esc(text));
  $("#chatIn").value = "";
  const k = asking;
  if(k === "city" && T.ambig){ const pick = T.ambig.find(c => lc(text).includes(lc(c.st)) || lc(text) === lc(c.n + ", " + c.st)); if(pick){ T.city = pick; T.ambig = null; } }
  const got = merge(text);
  if(k) markAsked(k, text);
  if(k === "dates" && !T.arrive) bubble("bot", "I couldn't read a date in that. Try \"Nov 4 to 8\" or \"Dec 12-15\".");
  else if(got.length){ bubble("bot", ack(got)); if(got.includes("dates") && T.dateNote) bubble("bot", esc(T.dateNote)); }
  renderSummary();
  setTimeout(ask, 250);
}
function ack(got){
  const bits = [];
  if(got.includes("city")) bits.push(T.city ? T.city.n + (T.city.st ? ", " + T.city.st : "") + (T.city.r ? " (curated)" : " (built live)") : T.cityLive + " (built live)");
  if(got.includes("dates") && T.arrive) bits.push(SF.dayLabel(T.arrive) + (T.depart && T.depart !== T.arrive ? " to " + SF.dayLabel(T.depart) : ""));
  if(got.includes("people") && T.travelers.length) bits.push(T.travelers.join(", "));
  if(got.includes("hotel") && T.hotel) bits.push("staying at " + T.hotel.name);
  if(got.includes("flights") && T.flights.length) bits.push(T.flights.map(f => (f.no || "flight") + (f.arr ? " landing " + f.arr : "")).join(", "));
  if(got.includes("tastes")){ if(T.likes.length) bits.push("love " + T.likes.map(c => CATS[c].toLowerCase()).join(", ")); if(T.skip.length) bits.push("skip " + T.skip.map(c => CATS[c].toLowerCase()).join(", ")); if(T.notes.length) bits.push(T.notes.join(", ")); }
  if(got.includes("extras")){ if(T.pace) bits.push(T.pace + " pace"); if(T.budget) bits.push(T.budget + " budget"); if(T.move) bits.push({walk:"walking", transit:"transit", car:"car & rideshare"}[T.move]); if(T.access.length) bits.push(T.access.join(", ")); if(T.kids.length) bits.push("kids " + T.kids.join(", ")); if(T.must.length) bits.push("must see: " + T.must.join(", ")); }
  if(got.includes("style")){ const cn = (COLORS.find(c => c[1] === T.color) || [""])[0], vn = (VIBES.find(v => v[0] === T.vibe) || ["", "", ""])[2]; if(T.colorSet && cn) bits.push(cn + " app"); if(T.vibeSet && vn) bits.push(vn.toLowerCase() + " assistant"); if(T.name) bits.push(T.name); if(T.bot && T.bot !== "Spun") bits.push("assistant named " + T.bot); }
  return bits.length ? "Got it: " + esc(bits.join(" · ")) + "." : "Noted.";
}
function renderSummary(){
  const rows = [
    ["Where", T.city ? T.city.n + ", " + T.city.st + (T.city.r ? " · curated" : " · built live") : T.cityLive ? T.cityLive + " · built live" : ""],
    ["When", T.arrive ? SF.dayLabel(T.arrive) + (T.depart && T.depart !== T.arrive ? " → " + SF.dayLabel(T.depart) : "") : ""],
    ["Who", T.travelers.join(", ")],
    ["Staying", T.hotel ? T.hotel.name + (T.hotel.ad ? " · " + T.hotel.ad : "") : ""],
    ["Flights", T.flights.map(f => [f.who, f.no, f.arr && "lands " + f.arr].filter(Boolean).join(" ")).join("; ")],
    ["Loves", T.likes.map(c => CATS[c]).join(", ")],
    ["Skips", T.skip.map(c => CATS[c]).join(", ")],
    ["Notes", T.notes.join(", ")],
    ["Pace", T.pace], ["Budget", T.budget], ["Getting around", {walk:"Walking", transit:"Transit", car:"Car & rideshare"}[T.move] || ""],
    ["Access", T.access.join(", ")], ["Kids", T.kids.length ? "ages " + T.kids.join(", ") : ""], ["Must see", T.must.join(", ")]
  ].filter(r => r[1]);
  $("#chatSum").innerHTML = rows.length ? '<p class="cs-h">So far</p><dl>' + rows.map(([k, v]) => '<dt>' + k + '</dt><dd>' + esc(v) + '</dd>').join("") + '</dl><p class="fine">Say anything to change it, like "actually Nov 5" or "add Sam".</p>' : '<p class="fine">Your trip details show up here as you chat.</p>';
}
function finish(){
  const trip = {v:1, city:T.city && T.city.r ? T.city.s : "live:" + (T.city ? T.city.n : T.cityLive), cityName:T.city ? T.city.n : T.cityLive, state:T.city ? T.city.st : "", center:T.city ? T.city.c : null,
    name:T.name || "", arrive:T.arrive, depart:T.depart || T.arrive, travelers:T.travelers.slice(), hotel:T.hotel && T.hotel.name ? T.hotel : null,
    flights:T.flights.map(f => ({who:f.who, date:f.date || T.arrive, no:f.no, route:"", dep:f.dep, arr:f.arr})), likes:T.likes, skip:T.skip, notes:T.notes, pace:T.pace || "", budget:T.budget || "", move:T.move || "", access:T.access, kids:T.kids, must:T.must, color:T.color, ink:T.ink, bot:T.bot, vibe:T.vibe};
  const url = new URL("app/", location.href); url.search = "?t=" + SF.encodeTrip(trip); built = url.href;
  try{ const mine = JSON.parse(localStorage.getItem("sf.myTrips") || "[]"); mine.unshift({at:Date.now(), city:trip.cityName, arrive:trip.arrive, link:built}); localStorage.setItem("sf.myTrips", JSON.stringify(mine.slice(0, 10))); }catch(_){}
  const d = bubble("bot", "That's everything. Your " + esc(trip.cityName) + " app is ready" + (T.city && T.city.r ? "." : ". It builds itself from map data the first time it opens (about 30 seconds).") + '<div class="cdone"><a class="btn" href="' + esc(built) + '" target="_blank" rel="noopener">Open my app <span class="arr" aria-hidden="true">→</span></a><button class="btn ghost" type="button" data-share>Text it to my travel partner</button><button class="btn ghost" type="button" data-copy>Copy link</button></div><p class="fine">On your phone: open it, then Share → Add to Home Screen. Anyone with the link gets the same trip.</p>');
  d.querySelector("[data-share]").onclick = async () => { const text = "Our trip app is ready. Open it, then add it to your home screen:"; if(navigator.share){ try{ await navigator.share({title:"Our trip app", text, url:built}); return; }catch(e){ if(e.name === "AbortError") return; } } try{ await navigator.clipboard.writeText(text + " " + built); toast("Link copied. Paste it into a text."); }catch(e){} };
  d.querySelector("[data-copy]").onclick = async () => { try{ await navigator.clipboard.writeText(built); toast("Link copied."); }catch(e){} };
  $("#chatChips").innerHTML = '<button type="button" class="cchip ghost" data-c="restart">Start over</button>';
}
const toast = msg => { const t = $("#toast"); if(!t) return; t.textContent = msg; t.hidden = false; setTimeout(() => { t.hidden = true; }, 3000); };

function init(){
  log = $("#chatLog"); if(!log) return;
  bubble("bot", "Tell me about your trip, all in one go if you like: where, when, who's going, where you're staying, flights, and what you love or want to skip. Type it or tap the mic. I'll ask about anything I'm missing.");
  bubble("bot ex", '<span class="fine">Example:</span> "Boston Nov 4–8 with Emily, staying at the Omni Parker House, Southwest 1715 lands 2:25 pm, love jazz and history, skip sports."');
  asking = null; renderSummary();
  $("#chatForm").addEventListener("submit", e => { e.preventDefault(); said($("#chatIn").value); });
  $("#chatIn").addEventListener("keydown", e => { if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); said($("#chatIn").value); } });
  $("#chatChips").addEventListener("click", e => {
    const b = e.target.closest("[data-c]"); if(!b) return; const c = b.dataset.c;
    if(c === "restart"){ location.hash = ""; location.reload(); return; }
    if(c === "skip"){ bubble("me", "Skip"); markAsked(asking, "skip"); setTimeout(ask, 150); return; }
    if(asking === "city" && T.ambig){ const pick = T.ambig.find(x => x.n + ", " + x.st === c); if(pick){ bubble("me", esc(c)); T.city = pick; T.ambig = null; bubble("bot", ack(["city"])); renderSummary(); setTimeout(ask, 200); return; } }
    if(asking === "dates" && /weekend/i.test(c)){ said(c.toLowerCase()); return; }
    said(chipToText(asking, c));
  });
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition, mic = $("#chatMic");
  if(!SR){ mic.hidden = true; }
  else mic.addEventListener("click", () => {
    if(mic.classList.contains("on")){ try{ mic._r.stop(); }catch(e){} return; }
    try{ const r = new SR(); mic._r = r; r.lang = "en-US"; r.interimResults = true; r.continuous = false; let fin = ""; mic.classList.add("on"); mic.setAttribute("aria-pressed", "true");
      r.onresult = ev => { let t = ""; for(const x of ev.results){ t += x[0].transcript; if(x.isFinal) fin = t; } $("#chatIn").value = t; };
      r.onend = () => { mic.classList.remove("on"); mic.setAttribute("aria-pressed", "false"); if(fin.trim()) said(fin); };
      r.onerror = () => { mic.classList.remove("on"); mic.setAttribute("aria-pressed", "false"); };
      r.start(); }catch(e){ mic.classList.remove("on"); }
  });
  /* the hero "Where are you going?" box hands its city to the chat */
  SF.chatSay = t => { said(t); };
}
SF.chatParse = text => { const keep = JSON.parse(JSON.stringify(T)); merge(text); const out = JSON.parse(JSON.stringify(T)); Object.keys(T).forEach(k => { T[k] = keep[k]; }); return out; };
SF.chatReady = () => CITIES.length > 0;
init();
})();
