/* Spunfor demo app, V3 structure: Home · Map · Explore · Saved · Help.
   Data-driven from window.SPUNFOR_DEMO_CONFIG (config.js), the landing-page chat answers (localStorage spunfor.trip) and the theme picker.
   No analytics. Network use: OpenStreetMap tiles; live weather only if you tap "Load live weather". */
(function(){
'use strict';
const C = window.SPUNFOR_DEMO_CONFIG, V = C.venues, BY = {};
V.forEach(v => BY[v.id] = v);
const DOW = ['sun','mon','tue','wed','thu','fri','sat'], DOWL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], DS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const CATL = C.catLabels, OUTDOOR = ['garden','cdmpark'];
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => ('0' + n).slice(-2);

/* ---------- storage ---------- */
const ld = (k, d) => { try { const x = localStorage.getItem('spunfor.' + k); return x == null ? d : JSON.parse(x); } catch (e) { return d; } };
const sv = (k, v) => { try { localStorage.setItem('spunfor.' + k, JSON.stringify(v)); } catch (e) {} };
const S = {
  tab: 'home', view: 'home', col: null, persona: null, savedTab: 'plan', day: 0, person: 'all', tm: 0, fcat: 'all',
  saved: ld('saved', []), votes: ld('votes', {}), people: ld('people', ['You']), me: ld('me', 'You'),
  visited: ld('visited2', {}), plans: ld('plans', null), theme: ld('theme', {mode: 'city', accent: '#F04E28'}), scheme: ld('scheme', 'auto'),
  persOv: ld('persOv', {}), modules: ld('modules', {celebrate: null}), dates: ld('dates', null), planB: ld('planB', false),
  base: ld('base', C.center), radius: ld('radius', 15), trip: ld('trip', null),
  holla: false, hollaTab: null, hq: '', hcat: 'all', sim: null, q: '', surp: {mood: null, hrs: null, mode: null, seed: 1}, surpRes: null,
  mapCol: 'all', mapOpen: false, mapSaved: false, mapColor: 'type', mapTips: false, me_pt: null, sheet: null, wx: null, quip: {}
};
if (!S.theme || !S.theme.mode) S.theme = {mode: 'city', accent: '#F04E28'};
if (S.modules.celebrate === null) S.modules.celebrate = !!(S.trip && /birthday|anniversary|honeymoon|celebrat|proposal|bachelor/i.test([S.trip.group, S.trip.likes, S.trip.needs, S.trip.flight].join(' ')));
function mkPlan(){ const n = cityNow0(); return {mode: 'walk', startDow: n.dow, startMins: 10 * 60, base: null, stops: []}; }
if (!S.plans || !S.plans.length) S.plans = [mkPlan()];

/* ---------- personas (customizable) ---------- */
const PERS = () => C.personas.map(p => Object.assign({}, p, S.persOv[p.key] || {}));
const P_BY = k => PERS().find(p => p.key === k) || PERS()[0];
function approver(v){ const ps = PERS(); for (const c of v.cats) { const p = ps.find(x => x.cats.indexOf(c) > -1); if (p) return p; } return ps[0]; }
function leadPersona(){
  const liked = likedCollections(), ps = PERS(); let best = ps[0], bs = -1;
  ps.forEach(p => { let s = 0; liked.forEach(k => { const col = C.collections.find(c => c.key === k); if (col && (col.cats || []).some(c => p.cats.indexOf(c) > -1)) s++; }); if (s > bs) { bs = s; best = p; } });
  return best;
}
function quip(key, line){ const p = P_BY(key); return '<div class="quip" style="--pc:' + p.color + '"><span class="badge" aria-hidden="true">' + esc(p.name[0]) + '</span><div><q>' + esc(line) + '</q><span class="who">— ' + esc(p.name) + '</span></div></div>'; }
function talk(tab){
  const arr = C.quips[tab] || C.quips.home; let i = S.quip[tab];
  if (i == null) { i = tab === 'home' ? Math.max(0, arr.findIndex(q => q[0] === leadPersona().key)) : 0; S.quip[tab] = i; }
  const q = arr[i % arr.length], p = P_BY(q[0]);
  return '<div class="quip talk" style="--pc:' + p.color + '"><span class="badge" aria-hidden="true">' + esc(p.name[0]) + '</span><div><q>' + esc(q[1]) + '</q><span class="who">— ' + esc(p.name) + '</span></div><button class="again" data-act="quip" data-k="' + tab + '">Another one</button></div>';
}

/* ---------- city clock + hours ---------- */
function cityNow0(){
  const p = new Intl.DateTimeFormat('en-US', {timeZone: C.tz, weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false, year: 'numeric', month: 'numeric', day: 'numeric'}).formatToParts(new Date()), o = {};
  p.forEach(x => o[x.type] = x.value);
  return {dow: DS.indexOf(o.weekday), mins: (+o.hour % 24) * 60 + +o.minute, y: +o.year, m: +o.month, d: +o.day};
}
const cityNow = () => { const n = cityNow0(); return S.sim ? Object.assign(n, {dow: S.sim.dow, mins: S.sim.mins}) : n; };
const tm = s => { const a = s.split(':'); return +a[0] * 60 + +a[1]; };
const ivs = (v, dow) => (v.hours[DOW[((dow % 7) + 7) % 7]] || []).map(x => { const o = tm(x[0]); let c = tm(x[1]); if (c <= o) c += 1440; return [o, c]; });
function openAt(v, dow, mins){
  const a = ivs(v, dow); let i;
  for (i = 0; i < a.length; i++) if (mins >= a[i][0] && mins < a[i][1]) return a[i][1];
  const y = ivs(v, dow - 1);
  for (i = 0; i < y.length; i++) if (y[i][1] > 1440 && mins + 1440 < y[i][1]) return y[i][1] - 1440;
  return 0;
}
function fmt(m){ m = ((m % 1440) + 1440) % 1440; let h = Math.floor(m / 60); const mm = m % 60, ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return h + (mm ? ':' + pad(mm) : '') + ' ' + ap; }
function nextOpen(v, dow, mins){
  for (let d = 0; d < 8; d++) { const a = ivs(v, dow + d); for (let i = 0; i < a.length; i++) { const o = a[i][0]; if (d > 0 || o > mins) return {d, o, dow: (dow + d) % 7}; } }
  return null;
}
function status(v, at){
  at = at || cityNow(); const c = openAt(v, at.dow, at.mins);
  if (c) { const left = c - at.mins; return {open: true, left, soon: left <= 60, txt: 'Open · until ' + fmt(c)}; }
  const n = nextOpen(v, at.dow, at.mins);
  if (!n) return {open: false, txt: 'Closed · hours unclear'};
  return {open: false, txt: 'Closed · opens ' + (n.d === 0 ? '' : n.d === 1 ? 'tomorrow ' : DS[n.dow] + ' ') + fmt(n.o)};
}
const isOpen = (v, dow, mins) => !!openAt(v, dow, mins);

/* ---------- geo ---------- */
function km(a, b){ const R = 6371, r = Math.PI / 180, dl = (b[0] - a[0]) * r, dn = (b[1] - a[1]) * r, x = Math.sin(dl / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); }
/* planning ESTIMATES: street detour factor 1.3, walking 4.8 km/h, rideshare ~22 km/h plus ~5 min pickup */
const travelMin = (a, b, mode) => { const d = km(a, b) * 1.3; return mode === 'walk' ? Math.max(1, Math.round(d / C.walkSpeedKmh * 60)) : Math.round(d / 22 * 60) + 5; };
const walkRadiusM = min => min * (C.walkSpeedKmh * 1000 / 60) / 1.3;
const stay = v => (C.stopMinutes && C.stopMinutes[v.cats[0]]) || 60;
const isOut = v => OUTDOOR.indexOf(v.id) > -1;
const origin = () => S.me_pt || S.base;
const distKm = v => km(origin(), v.coords);
const distTxt = v => { const k = distKm(v), mn = Math.max(1, Math.round(k * 1.3 / C.walkSpeedKmh * 60)); return mn <= 40 ? '~' + mn + ' min walk' : '~' + k.toFixed(1) + ' km'; };
const near = (a, b) => distKm(a) - distKm(b);

/* ---------- chat answers -> preferences ---------- */
const AVOIDMAP = [[/bourbon|party|club|nightlife|rowdy|drunk|loud/i, ['party']], [/museum|history/i, ['history', 'spooky']], [/jazz|music/i, ['jazz']], [/bar|alcohol|drink/i, ['drink', 'party', 'sports']], [/shop|antique/i, ['shop']]];
function avoidCats(){ let out = []; if (S.trip && S.trip.dislikes) AVOIDMAP.forEach(r => { if (r[0].test(S.trip.dislikes)) out = out.concat(r[1]); }); return out; }
const LIKEMAP = [[/jazz|music|band/i, 'jazz'], [/coffee|beignet|brunch|cafe|café/i, 'coffee'], [/veg|plant/i, 'veg'], [/food|eat|dinner|restaurant|street food/i, 'eat'], [/romantic|date|couple/i, 'romantic'], [/museum|history|art|antique|culture/i, 'history'], [/nature|hik|park|outdoor|quiet/i, 'nature'], [/local|hidden/i, 'locals']];
function likedCollections(){ const l = [S.trip && S.trip.likes, S.trip && S.trip.needs, S.trip && S.trip.group].join(' '), o = []; LIKEMAP.forEach(r => { if (r[0].test(l) && o.indexOf(r[1]) < 0) o.push(r[1]); }); return o; }
const inMood = (v, m) => (m.cats || []).some(c => v.cats.indexOf(c) > -1) || (m.tags || []).some(t => (v.tags || []).indexOf(t) > -1);
const inCol = (v, c) => (c.cats || []).some(k => v.cats.indexOf(k) > -1) || (c.tags || []).some(t => (v.tags || []).indexOf(t) > -1);
const colPlaces = c => V.filter(v => inCol(v, c));
const isIndoor = v => !isOut(v);

/* ---------- trip dates / countdown ---------- */
const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
function parseDates(t){
  if (!t) return null; const n = cityNow0(), found = [];
  const re1 = /(\d{1,2})(?:st|nd|rd|th)?\s*(?:of\s+)?([A-Za-z]{3,9})/g, re2 = /([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?/g; let m;
  while ((m = re1.exec(t))) { const mi = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()); if (mi > -1) found.push([m.index, mi, +m[1]]); }
  while ((m = re2.exec(t))) { const mi = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()); if (mi > -1) found.push([m.index, mi, +m[2]]); }
  found.sort((a, b) => a[0] - b[0]); if (!found.length) return null;
  const mk = f => { let d = new Date(Date.UTC(n.y, f[1], f[2])); if (d < new Date(Date.UTC(n.y, n.m - 1, n.d - 1))) d = new Date(Date.UTC(n.y + 1, f[1], f[2])); return d.toISOString().slice(0, 10); };
  const a = mk(found[0]), b = found[1] ? mk(found[1]) : a; return {start: a, end: b < a ? a : b};
}
if (!S.dates && S.trip) S.dates = parseDates(S.trip.dates);
function tripStatus(){
  if (!S.dates || !S.dates.start) return null; const n = cityNow0(), T = Date.UTC(n.y, n.m - 1, n.d), A = Date.parse(S.dates.start), D = Date.parse(S.dates.end || S.dates.start), day = 86400000, until = Math.round((A - T) / day);
  if (until > 0) return {txt: until === 1 ? 'Tomorrow!' : until + ' days to go'};
  if (T <= D) { const k = Math.round((T - A) / day) + 1; return {txt: 'Day ' + k + ' of the trip', day: k}; }
  return {txt: 'Hope it was a good one'};
}
const nDays = () => S.dates && S.dates.start ? Math.min(14, Math.max(1, Math.round((Date.parse(S.dates.end || S.dates.start) - Date.parse(S.dates.start)) / 86400000) + 1)) : 1;
function dayLabel(i){ if (!S.dates || !S.dates.start) return 'Day ' + (i + 1); return new Date(Date.parse(S.dates.start) + i * 86400000).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC'}); }

/* ---------- sunset (for Auto light/dark) ---------- */
function sunsetMins(){
  const n = cityNow0(), lat = C.center[0], lng = C.center[1], rad = Math.PI / 180;
  const doy = Math.round((Date.UTC(n.y, n.m - 1, n.d) - Date.UTC(n.y, 0, 0)) / 86400000), g = 2 * Math.PI / 365 * (doy - 1);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const x = Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl)) - Math.tan(lat * rad) * Math.tan(decl); if (x > 1 || x < -1) return 1080;
  const ha = Math.acos(x) / rad, utcSet = 720 - 4 * (lng + ha) - eq;
  const d = new Date(Date.UTC(n.y, n.m - 1, n.d, 12)), off = Math.round((new Date(d.toLocaleString('en-US', {timeZone: C.tz})) - new Date(d.toLocaleString('en-US', {timeZone: 'UTC'}))) / 60000);
  return ((utcSet + off) % 1440 + 1440) % 1440;
}
const nightNow = () => { const m = cityNow0().mins; return m >= sunsetMins() - 20 || m < 6 * 60 + 30; };

/* ---------- theme (CSS variables) ---------- */
const hex2rgb = h => { h = h.replace('#', ''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const lum = h => { const c = hex2rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const validHex = h => /^#[0-9a-f]{6}$/i.test(h);
const toHex = c => '#' + c.map(v => pad(Math.max(0, Math.min(255, Math.round(v))).toString(16))).join('');
const mix = (a, b, t) => { const x = hex2rgb(a), y = hex2rgb(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
function legible(col, bg, min){ let c = col, i = 0; const tgt = lum(bg) > .5 ? '#000000' : '#ffffff'; while (contrast(c, bg) < min && i++ < 40) c = mix(c, tgt, .06); return c; }
function themeAccent(){ const t = S.theme; if (t.mode === 'generic') return '#1D4ED8'; if (t.mode === 'custom' && validHex(t.accent)) return t.accent; return C.palette.accent; }
const isDark = () => S.scheme === 'dark' || (S.scheme === 'auto' && nightNow());
const surfaceBg = (mode, dark) => mode === 'generic' ? (dark ? '#0F141B' : '#F5F7FA') : (dark ? '#161917' : '#F2EBDD');
function applyTheme(){
  const r = document.documentElement, a = themeAccent(), dark = isDark(), mode = S.theme.mode, bg = surfaceBg(mode, dark);
  r.setAttribute('data-scheme', dark ? 'dark' : 'light'); r.setAttribute('data-theme-mode', mode);
  const a2 = mode === 'city' ? C.palette.accent2 : mode === 'generic' ? '#64748B' : mix(a, dark ? '#ffffff' : '#000000', .35);
  r.style.setProperty('--accent', a); r.style.setProperty('--accent2', a2);
  r.style.setProperty('--on-accent', contrast(a, '#17140F') >= contrast(a, '#FFFFFF') ? '#17140F' : '#FFFFFF');
  r.style.setProperty('--accent-text', legible(a, bg, dark ? 6.3 : 4.7)); r.style.setProperty('--accent2-text', legible(a2, bg, dark ? 6.3 : 4.7));
  const lg = $('#brand img'); if (lg) lg.setAttribute('src', dark ? '../logo-mark-light.svg' : '../logo-mark.svg');
  const m = $('meta[name=theme-color]'); if (m) m.content = bg;
  if (map) map.getContainer().classList.toggle('dark', dark);
}

/* ---------- icons (stroked glyphs, not emoji) ---------- */
const I = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>', map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
  explore: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>', saved: '<path d="M6 3h12v18l-6-4-6 4z"/>', help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
  pin: '<path d="M12 21c-5-4.5-7-8-7-11a7 7 0 0 1 14 0c0 3-2 6.5-7 11z"/><circle cx="12" cy="10" r="2.5"/>', up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  walk: '<circle cx="13" cy="4.5" r="1.5"/><path d="M9 21l2-7-2-2 1-4 3 1 2 3 3 1M11 14l3 2 1 5"/>', car: '<path d="M5 16V11l2-5h10l2 5v5zM5 16v2M19 16v2"/><circle cx="8" cy="13" r=".8" fill="currentColor"/><circle cx="16" cy="13" r=".8" fill="currentColor"/>',
  rain: '<path d="M7 16a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a3.5 3.5 0 0 1-.5 7zM9 19l-1 2M13 19l-1 2M17 19l-1 2"/>', ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  theme: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>', dl: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>', heart: '<path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.4-7 10-7 10z"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>', gem: '<path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18M9 4l3 16M15 4l-3 16"/>', clockb: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l-3 3"/>',
  ticket: '<path d="M3 8a2 2 0 0 0 0 8v2h18v-2a2 2 0 0 1 0-8V6H3z"/><path d="M14 6v12" stroke-dasharray="2 2"/>'
};
const ic = (n, sz) => '<svg viewBox="0 0 24 24" width="' + (sz || 20) + '" height="' + (sz || 20) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[n] + '</svg>';

/* ---------- toast + sheet ---------- */
let tt; function toast(m){ const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2600); }
let lastFocus;
function openSheet(html){ const w = $('#sheetWrap'); if (w.hidden) lastFocus = document.activeElement; $('#sheet').innerHTML = html; w.hidden = false; document.body.classList.add('noscroll'); requestAnimationFrame(() => { w.classList.add('on'); if (!$('#tour')) $('#sheet').focus(); }); }
function closeSheet(){ const w = $('#sheetWrap'); w.classList.remove('on'); document.body.classList.remove('noscroll'); S.sheet = null; setTimeout(() => { if (!w.classList.contains('on')) w.hidden = true; }, 180); if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {} }
const sheetOpen = () => !$('#sheetWrap').hidden && $('#sheetWrap').classList.contains('on');
const openVenue = id => { S.sheet = id; openSheet(venueSheet(id)); };
const refreshSheet = () => { if (sheetOpen() && S.sheet) $('#sheet').innerHTML = venueSheet(S.sheet); };

/* ---------- venue pieces ---------- */
const gm = v => 'https://www.google.com/maps/search/?api=1&query=' + v.coords[0] + ',' + v.coords[1];
const dirUrl = v => 'https://www.google.com/maps/dir/?api=1&destination=' + v.coords[0] + ',' + v.coords[1] + '&travelmode=walking';
const priceTxt = v => /^\$+(–\$+)?$/.test(v.price) ? esc(v.price) + ' <small>est.</small>' : esc(v.price);
const catLine = v => v.cats.slice(0, 2).map(c => CATL[c] || c).join(' · ');
const isSaved = id => S.saved.indexOf(id) > -1;
const myVote = id => (S.votes[S.me] || {})[id] || '';
const pill = st => '<span class="st ' + (st.open ? (st.soon ? 'closing' : 'open') : 'closed') + '">' + (st.open ? (st.soon ? 'Closing soon' : 'Open') : 'Closed') + '</span>';
function heart(v, bare){ const on = isSaved(v.id); return '<button class="heartbtn" data-act="save" data-id="' + v.id + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Unsave ' : 'Save ') + esc(v.name) + '">' + ic('saved', 20) + (bare ? '' : '<span>' + (on ? 'Saved' : 'Save') + '</span>') + '</button>'; }
function card(v){
  const st = status(v), ap = approver(v), vis = S.visited[v.id];
  return '<article class="tk' + (st.open ? '' : ' closed') + '" style="--pc:' + ap.color + '"><button class="tk-main" data-act="venue" data-id="' + v.id + '"><span class="k">' + esc(catLine(v)) + ' · ' + esc(v.area) + '</span><h3>' + esc(v.name) + '</h3>' +
    (v.why ? '<span class="why">' + esc(v.why.split('. ')[0].replace(/\.$/, '') + '.') + '</span>' : '') + '<span class="tk-meta"><span class="ap">' + esc(ap.name) + ' approves</span><span>' + priceTxt(v) + '</span><span>' + esc(distTxt(v)) + '</span>' + (vis ? '<span class="vis">Visited</span>' : '') + '</span></button>' +
    '<div class="tk-stub">' + pill(st) + '<small>' + esc(st.txt.replace(/^(Open|Closed) · /, '')) + '</small>' + heart(v) + '<button class="chip-btn" data-act="addplan" data-id="' + v.id + '" aria-label="Add ' + esc(v.name) + ' to the plan">' + ic('plus', 16) + '<span>Plan</span></button></div></article>';
}
function resRow(v){
  const st = status(v);
  return '<div class="res"><button class="nm" data-act="venue" data-id="' + v.id + '">' + esc(v.name) + '</button><span class="right">' + pill(st) + heart(v, true) + '</span><span class="sub2"><span>' + esc(st.txt) + '</span><span>' + esc(v.area) + '</span><span>' + esc(distTxt(v)) + '</span></span></div>';
}
const openList = () => { const a = cityNow(); return V.filter(v => isOpen(v, a.dow, a.mins)); };

/* ---------- itinerary engine ---------- */
const plan = () => S.plans[Math.min(S.day, S.plans.length - 1)];
function recompute(it){
  let t = it.startMins, prev = it.base || S.base;
  it.stops.forEach((s, i) => { const v = BY[s.id]; s.travel = i === 0 && !it.base ? 0 : travelMin(prev, v.coords, it.mode); t += s.travel; s.arrive = t; s.leave = t + s.stay; t = s.leave; prev = v.coords; });
  return it;
}
const stopOpenOK = (v, it, s) => isOpen(v, (it.startDow + Math.floor(s.arrive / 1440)) % 7, s.arrive % 1440);
const savePlans = () => sv('plans', S.plans);
function rng(seed){ let x = seed * 9301 + 49297; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; }; }
const dwellOf = v => v.cats.indexOf('coffee') > -1 ? 40 : v.cats.some(c => ['eat', 'jazz', 'drink', 'party', 'date'].indexOf(c) > -1) ? 60 : 45;
function surpDefaults(){ const s = S.surp, hr = Math.floor(cityNow().mins / 60), lk = likedCollections()[0], mk = (lk && C.moods.some(m => m.key === lk)) ? lk : (hr >= 17 || hr < 3 ? 'jazz' : hr < 11 ? 'locals' : 'hidden'); return {mood: s.mood || mk, hrs: s.hrs || 2, mode: s.mode || 'walk'}; }
function runSurprise(startW, d){
  const W = startW || cityNow(), o = origin(), avoid = avoidCats(), mood = C.moods.find(m => m.key === d.mood) || C.moods[0], r = rng(S.surp.seed + d.hrs * 7 + mood.key.length);
  const maxLegKm = d.mode === 'walk' ? 1.6 : 9, total = d.hrs * 60, pool = V.filter(v => inMood(v, mood) && !v.cats.some(c => avoid.indexOf(c) > -1) && !((S.planB || (S.wx && wxBad())) && isOut(v)));
  const stops = []; let cur = o, t = W.mins;
  for (let k = 0; k < 4; k++) {
    const left = total - (t - W.mins); if (left < 35) break;
    const cands = pool.filter(v => !stops.some(s => s.v.id === v.id)).map(v => {
      const dk = km(cur, v.coords) * 1.3; if (dk > maxLegKm) return null;
      const leg = travelMin(cur, v.coords, d.mode), at = t + leg, dw = Math.min(dwellOf(v), left - leg); if (dw < 25) return null;
      if (!(isOpen(v, W.dow, at % 1440) && isOpen(v, W.dow, (at + Math.min(30, dw)) % 1440))) return null;
      const varied = stops.length && stops[stops.length - 1].v.cats[0] === v.cats[0] ? 1.6 : 1;
      return {v, leg, at, dw, score: (dk + .3) * varied * (0.6 + r() * 0.9)};
    }).filter(Boolean).sort((a, b) => a.score - b.score);
    if (!cands.length) break;
    const pk = cands[Math.floor(r() * Math.min(3, cands.length))];
    stops.push({v: pk.v, at: pk.at, dw: pk.dw, leg: pk.leg}); cur = pk.v.coords; t = pk.at + pk.dw;
  }
  return {stops, end: t, later: !!startW, startMins: W.mins, used: d};
}
function surpriseNow(){
  const d = surpDefaults(); let R = runSurprise(null, d); if (R.stops.length) return R;
  const N = cityNow(), tries = [N.mins < 600 ? {dow: N.dow, mins: 600} : null, N.mins < 1080 ? {dow: N.dow, mins: 1080} : null, {dow: (N.dow + 1) % 7, mins: 600}].filter(Boolean);
  for (const W of tries) { R = runSurprise(W, d); if (R.stops.length) { R.tomorrow = W.dow !== N.dow; return R; } }
  return R;
}

/* ---------- views ---------- */
function simUI(){
  const a = cityNow(), opts = DOWL.map((d, i) => '<option value="' + i + '"' + (a.dow === i ? ' selected' : '') + '>' + d + '</option>').join(''), tv = pad(Math.floor(a.mins / 60)) + ':' + pad(a.mins % 60);
  return '<div class="sim"><span class="k">' + (S.sim ? 'Pretending it is' : 'Pretend it is…') + '</span><label class="sr" for="simDay">Day</label><select id="simDay" class="field" data-sim>' + opts + '</select><label class="sr" for="simTime">Time</label><input id="simTime" class="field" type="time" value="' + tv + '" data-sim>' + (S.sim ? '<button class="btn sm" data-act="simLive">Right now</button>' : '') + '</div>';
}
const wxBad = () => !!(S.wx && (S.wx.rain >= 50 || S.wx.temp >= 90 || S.wx.code >= 61));
const WXL = c => c === 0 ? 'Clear' : c <= 3 ? 'Partly cloudy' : c <= 48 ? 'Foggy' : c <= 67 ? 'Rain' : c <= 77 ? 'Wintry mix' : c <= 82 ? 'Showers' : 'Thunderstorms';
function wxBox(){
  let h = '';
  if (S.wx) {
    const bad = wxBad(), why = S.wx.rain >= 50 || S.wx.code >= 61 ? 'Rain is likely in the next few hours' : S.wx.temp >= 90 ? 'It is hot out there' : '';
    h += '<section class="wx' + (bad ? ' alert' : '') + '"><span class="deg">' + S.wx.temp + '°</span><div><b>' + esc(WXL(S.wx.code)) + ' in ' + esc(C.city) + '</b><div class="small muted">Rain chance next 3 hrs: ' + S.wx.rain + '%' + (bad ? ' · ' + why + ', so indoor picks come first.' : '') + '</div></div></section>';
    if (bad) { const a = cityNow(), ins = V.filter(v => isIndoor(v) && isOpen(v, a.dow, a.mins)).sort(near).slice(0, 4); if (ins.length) h += '<div class="links">' + ins.map(v => '<button class="plink" data-act="venue" data-id="' + v.id + '">' + esc(v.name) + '</button>').join('') + '</div>'; }
  } else h += '<section class="wx"><span class="deg">--°</span><div><b>Weather</b><div class="small muted">Not loaded. Live weather comes from open-meteo.com only when you tap the button.</div></div><button class="btn sm" data-act="loadwx">Load live weather</button></section>';
  return h + planBToggle();
}
const planBToggle = () => '<div class="planb"><button class="switch' + (S.planB ? ' on' : '') + '" role="switch" aria-checked="' + S.planB + '" aria-label="Plan B for rain or heat: indoor places first" data-act="planb"><i></i></button><div><b>' + ic('rain', 16) + ' Plan B (rain / heat)</b><small>' + (S.planB ? 'On: outdoor places are left out of Surprise Me and sorted last.' : 'Off. Turn on to prefer indoor places.') + '</small></div></div>';
function loadWX(){
  const w = C.weather; toast('Loading weather from open-meteo.com…');
  fetch('https://api.open-meteo.com/v1/forecast?latitude=' + w.lat + '&longitude=' + w.lng + '&current=temperature_2m,weather_code&hourly=precipitation_probability&temperature_unit=fahrenheit&timezone=' + encodeURIComponent(C.tz) + '&forecast_days=2')
    .then(r => r.json()).then(j => { const t = j.current.time.slice(0, 13), H = j.hourly, i0 = Math.max(0, H.time.findIndex(x => x.slice(0, 13) >= t)); S.wx = {temp: Math.round(j.current.temperature_2m), code: j.current.weather_code, rain: Math.max(0, ...H.precipitation_probability.slice(i0, i0 + 3))}; render(true); })
    .catch(() => toast('Could not load weather. Plan B still works by hand.'));
}
function tilesRow(ts){
  const t = [['plan', ic('ticket', 22), ts && ts.day ? "Today's plan" : 'Trip plan', ts && ts.day ? 'Day ' + ts.day + ' itinerary' : 'Your itinerary'], ['nearme', ic('pin', 22), 'Near me', 'Within a 15-min walk'], ['col:hidden', ic('gem', 22), 'Hidden gems', 'Local discoveries'], ['col:tonight', ic('moon', 22), 'Tonight', 'Jazz, bars & more']];
  return '<div class="tiles">' + t.map(x => '<button class="tile" ' + (x[0] === 'nearme' ? 'data-act="nearme"' : x[0] === 'plan' ? 'data-act="go" data-v="saved" data-st="plan"' : 'data-act="go" data-v="col" data-k="' + x[0].split(':')[1] + '"') + '><span class="ti">' + x[1] + '</span><b>' + esc(x[2]) + '</b><span>' + esc(x[3]) + '</span></button>').join('') + '</div>';
}
function girlsPicker(){
  return '<div class="sh"><h3>Who\'s leading tonight?</h3></div><div class="girls">' + PERS().map(p => { const n = V.filter(v => approver(v).key === p.key).length; return '<button class="girl" data-act="go" data-v="persona" data-k="' + p.key + '" style="--pc:' + p.color + '"><span class="g-badge" aria-hidden="true">' + esc(p.name[0]) + '</span><b>' + esc(p.name) + '</b><span class="g-k">' + esc(p.tag) + '</span><span class="g-n">' + n + ' picks</span></button>'; }).join('') + '</div>';
}
function surpriseCard(){
  const s = S.surp, d0 = surpDefaults();
  let h = '<section class="surprise" id="surprise"><div class="sh"><h3>Surprise me</h3></div><p class="small muted">A mini-adventure from places open when you would arrive. Answer any of these, or skip them all and we\'ll pick for the hour.</p>';
  h += '<div class="sstep"><span class="snum">1</span><div class="sbody"><b>What\'s the vibe?</b><span class="shint">' + (s.mood ? 'Tap again to clear' : 'Optional · we\'d pick ' + esc((C.moods.find(m => m.key === d0.mood) || {label: ''}).label) + ' right now') + '</span><div class="seg" role="group" aria-label="Vibe">' + C.moods.map(m => '<button class="chip" data-surp="mood:' + m.key + '" aria-pressed="' + (s.mood === m.key) + '">' + esc(m.label) + '</button>').join('') + '</div></div></div>';
  h += '<div class="sstep"><span class="snum">2</span><div class="sbody"><b>How long have you got?</b><span class="shint">' + (s.hrs ? 'Tap again to clear' : 'Optional · 2 hours if you skip') + '</span><div class="seg" role="group" aria-label="Time">' + [1, 2, 3, 4].map(n => '<button class="chip" data-surp="hrs:' + n + '" aria-pressed="' + (s.hrs === n) + '">' + n + ' hr' + (n > 1 ? 's' : '') + '</button>').join('') + '</div></div></div>';
  h += '<div class="sstep"><span class="snum">3</span><div class="sbody"><b>How are you getting around?</b><span class="shint">' + (s.mode ? 'Tap again to clear' : 'Optional · walking if you skip') + '</span><div class="seg" role="group" aria-label="Getting around">' + [['walk', 'Walking'], ['ride', 'Rideshare']].map(x => '<button class="chip" data-surp="mode:' + x[0] + '" aria-pressed="' + (s.mode === x[0]) + '">' + x[1] + '</button>').join('') + '</div></div></div>';
  h += '<div class="row"><button class="btn primary big" data-act="surprun">Find our adventure</button>' + (S.surpRes ? '<button class="btn" data-act="surpagain">Spin again</button>' : '') + ((s.mood || s.hrs || s.mode) ? '<button class="btn" data-act="surpclear">Clear choices</button>' : '') + '</div>';
  const R = S.surpRes;
  if (R) {
    if (!R.stops.length) h += '<div class="empty">Nothing in that mood fits in the next day. Try another mood, more time, or Rideshare.</div>';
    else {
      const u = R.used, mo = C.moods.find(m => m.key === u.mood) || C.moods[0], mq = C.moodQuips[u.mood] || ['sage', 'Trust me, this is a good plan.'];
      h += '<div class="adv" id="adv">' + quip(mq[0], mq[1]) + '<p class="adv-head"><b>' + esc(mo.label) + (!s.mood ? ' (our pick)' : '') + ' · ' + u.hrs + ' hr' + (u.hrs > 1 ? 's' : '') + ' · ' + (u.mode === 'walk' ? 'walking' : 'rideshare') + '</b></p>' +
        (R.later ? '<p class="small">Nothing in this mood is open right now, so here is the next good window: starting at ' + fmt(R.startMins) + (R.tomorrow ? ' tomorrow' : ' today') + '.</p>' : '') + '<p class="small muted">Starting from ' + (S.me_pt ? 'your location' : 'the start point') + ' · back by about ' + fmt(R.end) + ' <span class="est">(estimates)</span></p>';
      R.stops.forEach(st => { h += '<div class="adv-leg">' + ic(u.mode === 'walk' ? 'walk' : 'car', 14) + ' ~' + st.leg + ' min ' + (u.mode === 'walk' ? 'walk' : 'rideshare') + '</div><div class="adv-stop"><span class="t">' + fmt(st.at) + '</span><div class="what"><button class="plink" data-act="venue" data-id="' + st.v.id + '">' + esc(st.v.name) + '</button>' + (st.v.why ? '<span class="why">' + esc(st.v.why) + '</span>' : '') + '<span class="small muted">About ' + st.dw + ' min · ' + esc(st.v.area) + '</span></div></div>'; });
      const seq = [origin()].concat(R.stops.map(x => x.v.coords)), ll = p => p[0] + ',' + p[1];
      const url = 'https://www.google.com/maps/dir/?api=1&origin=' + ll(seq[0]) + '&destination=' + ll(seq[seq.length - 1]) + '&travelmode=' + (u.mode === 'walk' ? 'walking' : 'driving') + (seq.length > 2 ? '&waypoints=' + seq.slice(1, -1).map(ll).join('%7C') : '');
      h += '<div class="actions"><a class="btn primary" href="' + esc(url) + '" target="_blank" rel="noopener">Route it</a><button class="btn" data-act="surpadd">Add to the plan</button></div></div>';
    }
  }
  return h + '</section>';
}
function vHome(){
  const N = cityNow(), hr = N.mins / 60, greet = hr < 5 ? 'Still up' : hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : hr < 22 ? 'Good evening' : 'Late night', ts = tripStatus(), tr = S.trip, who = (tr && tr.dest) || C.trip.title;
  const liked = likedCollections(), av = avoidCats();
  let h = '<section class="hero"><span class="k">' + esc(who) + (tr && tr.dates ? ' · ' + esc(tr.dates) : '') + '</span><h2>' + greet + ',<br><em>' + esc(S.me && S.me !== 'You' ? S.me : 'traveler') + '.</em></h2>' +
    '<div class="chips"><span class="hchip" id="clock"><span class="mono">' + DS[N.dow] + ' ' + fmt(N.mins) + '</span> in ' + esc(C.city) + '</span>' + (ts ? '<span class="hchip">' + esc(ts.txt) + '</span>' : '<button class="hchip lnk" data-act="dates">Add your dates</button>') + (S.wx ? '<span class="hchip">' + S.wx.temp + '° ' + esc(WXL(S.wx.code)) + '</span>' : '') + '</div>' +
    (tr && (tr.likes || tr.dislikes) ? '<div class="chips prefs">' + (liked.length ? '<span class="hchip on">Prioritizing: ' + liked.map(k => esc((C.collections.find(c => c.key === k) || {title: k}).title)).join(', ') + '</span>' : '') + (av.length ? '<span class="hchip">Avoiding: ' + esc(tr.dislikes) + '</span>' : '') + '</div>' : '') + '</section>';
  if (tr && tr.dest && !/new orleans|nola/i.test(tr.dest)) h += '<p class="note-bar">Your destination is <b>' + esc(tr.dest) + '</b>. This demo ships with New Orleans sample places; your answers still drive the personas, priorities, avoid list and dates.</p>';
  h += talk('home') + wxBox() + tilesRow(ts) + girlsPicker();
  h += '<div class="sh"><h3>What\'s your vibe?</h3><button class="lnk" data-act="go" data-v="explore">See all</button></div><div class="moods">' + C.moods.map(m => '<button class="mood" data-act="mood" data-k="' + m.key + '">' + esc(m.label) + '</button>').join('') + '</div>';
  h += surpriseCard();
  const open = openList().sort(near).slice(0, 5);
  h += '<div class="sh"><h3>Open right now</h3><button class="lnk" data-act="holla">See everything open</button></div>' + (open.length ? open.map(resRow).join('') : quip('sage', 'Everything decent is closed at this hour. Tonight and Hidden gems will still be there tomorrow.'));
  const got = stampsFor(S.visited).length, tl = [['time', 'Time Machine', C.eras.length + ' chapters of local history', 'clockb'], ['saved:passport', 'Passport', got + ' of ' + C.stamps.length + ' stamps collected', 'gem']];
  if (S.modules.celebrate) tl.unshift(['celebrate', C.celebration.title, C.celebration.sub, 'ticket']);
  return h + '<div class="two">' + tl.map(x => '<button class="tile wide" data-act="go" data-v="' + x[0].split(':')[0] + '"' + (x[0].indexOf(':') > 0 ? ' data-st="' + x[0].split(':')[1] + '"' : '') + '><span class="ti">' + ic(x[3], 22) + '</span><b>' + esc(x[1]) + '</b><span>' + esc(x[2]) + '</span></button>').join('') + '</div>';
}
function hollaPool(){
  const t = S.hollaTab;
  if (t === 'col') { const c = C.collections.find(x => x.key === S.col); return {label: c ? c.title : 'This collection', sub: 'this collection', list: c ? colPlaces(c) : V}; }
  if (t === 'persona') return {label: P_BY(S.persona).name + "'s picks", sub: 'those picks', list: V.filter(v => approver(v).key === S.persona)};
  if (t === 'saved') { const ids = new Set(S.saved); Object.keys(S.votes).forEach(k => Object.keys(S.votes[k]).forEach(i => ids.add(i))); plan().stops.forEach(s => ids.add(s.id)); return {label: 'Saved', sub: 'your saved and planned places', list: Array.from(ids).map(i => BY[i]).filter(Boolean)}; }
  if (t === 'explore' || t === 'all') return {label: 'Explore', sub: 'every place', list: V};
  return {label: 'Everywhere', sub: 'every place', list: V};
}
const hay = v => (v.name + ' ' + v.note + ' ' + (v.why || '') + ' ' + v.area + ' ' + v.address + ' ' + v.cats.map(c => CATL[c]).join(' ') + ' ' + approver(v).name + ' ' + (v.hoursText || '') + ' ' + (v.music || '')).toLowerCase();
function vHolla(){
  const N = cityNow(), pool = hollaPool(), open = pool.list.filter(v => isOpen(v, N.dow, N.mins)), q = S.hq.trim().toLowerCase();
  const head = '<section class="holla-head"><span class="k">Holla Holla · ' + esc(pool.label) + '</span><h2>' + open.length + ' open ' + (S.sim ? 'then' : 'right now') + '</h2><p>Showing only ' + esc(pool.sub) + ' you can walk into ' + (S.sim ? 'at ' + DS[N.dow] + ' ' + fmt(N.mins) : 'this minute') + '. <button class="holla-off" data-act="holla">Show everything again</button></p></section>';
  if (S.hollaTab === 'map') return head + vMap();
  const cats = Array.from(new Set(open.flatMap(v => v.cats))).filter(c => CATL[c]), shown = open.filter(v => (S.hcat === 'all' || v.cats.indexOf(S.hcat) > -1) && (!q || hay(v).indexOf(q) > -1)).sort(near);
  let h = head + simUI() + '<div class="row"><input class="field search" id="hq" type="search" placeholder="Search what\'s open: food, jazz, parks…" value="' + esc(S.hq) + '" aria-label="Search places open right now"></div>';
  if (cats.length > 1) h += '<div class="row" role="group" aria-label="Type of place"><button class="chip" data-act="hcat" data-k="all" aria-pressed="' + (S.hcat === 'all') + '">All <span class="cn">' + open.length + '</span></button>' + cats.map(c => '<button class="chip" data-act="hcat" data-k="' + c + '" aria-pressed="' + (S.hcat === c) + '">' + esc(CATL[c]) + '</button>').join('') + '</div>';
  if (!open.length) return h + quip('sage', 'Nothing in ' + pool.sub + ' is open then. Tap Show everything again, or try another time above.');
  if (!shown.length) return h + quip('scout', 'Nothing open matches that. Try another word or tap All.');
  return h + shown.map(resRow).join('');
}
function vExplore(){
  const q = S.q.trim().toLowerCase();
  let h = talk('explore') + '<div class="head"><span class="k">Discover</span><h2>Explore ' + esc(C.city) + '</h2></div>';
  h += '<div class="row"><input class="field search" id="uq" type="search" placeholder="Search places, food, history…" value="' + esc(S.q) + '" aria-label="Search everything">' + (q ? '<button class="btn" data-act="clearq">Clear</button>' : '') + '</div>';
  if (q) {
    const places = V.filter(v => hay(v).indexOf(q) > -1).slice(0, 30), eras = C.eras.map((e, i) => ({e, i})).filter(x => (x.e.y + ' ' + x.e.t + ' ' + x.e.x).toLowerCase().indexOf(q) > -1);
    h += '<div class="sh"><h3>Places</h3><span class="count">' + places.length + '</span></div>' + (places.length ? places.map(resRow).join('') : '<p class="small muted">No places match.</p>');
    if (eras.length) h += '<div class="sh"><h3>History</h3></div><div class="links">' + eras.map(x => '<button class="plink" data-act="era" data-k="' + x.i + '">' + esc(x.e.y + ' · ' + x.e.t) + '</button>').join('') + '</div>';
    return h;
  }
  const liked = likedCollections(), order = C.collections.slice().sort((a, b) => (liked.indexOf(b.key) > -1) - (liked.indexOf(a.key) > -1));
  h += '<div class="cols">' + order.map((c, i) => '<button class="colcard c' + (i % 5) + '" data-act="go" data-v="col" data-k="' + c.key + '"><span class="n2">' + colPlaces(c).length + ' places' + (liked.indexOf(c.key) > -1 ? ' · for you' : '') + '</span><b>' + esc(c.title) + '</b><span>' + esc(c.sub) + '</span></button>').join('') + '</div>';
  return h + '<div class="row"><button class="btn" data-act="go" data-v="all">All places with filters</button><button class="btn" data-act="holla">Everything open now</button><button class="btn" data-act="go" data-v="time">Time Machine</button>' + (S.modules.celebrate ? '<button class="btn" data-act="go" data-v="celebrate">' + esc(C.celebration.title) + '</button>' : '') + '</div>';
}
function vAll(){
  const counts = {all: V.length}; V.forEach(v => v.cats.forEach(c => counts[c] = (counts[c] || 0) + 1));
  const list = V.filter(v => S.fcat === 'all' || v.cats.indexOf(S.fcat) > -1).sort((a, b) => (status(b).open ? 1 : 0) - (status(a).open ? 1 : 0) || near(a, b));
  let h = '<div class="row"><button class="btn" data-act="go" data-v="explore">← Explore</button></div><div class="head"><span class="k">Everything</span><h2>All places</h2></div>';
  h += '<div class="fgroups" role="group" aria-label="Filter by type"><div class="fg"><span class="fg-l">Show</span><div class="fg-c"><button class="chip" data-act="fcat" data-k="all" aria-pressed="' + (S.fcat === 'all') + '">Everything <span class="cn">' + counts.all + '</span></button></div></div>' + C.catGroups.map(g => '<div class="fg"><span class="fg-l">' + esc(g[0]) + '</span><div class="fg-c">' + g[1].map(c => '<button class="chip' + (counts[c] ? '' : ' zero') + '" data-act="fcat" data-k="' + c + '" aria-pressed="' + (S.fcat === c) + '">' + esc(CATL[c]) + ' <span class="cn">' + (counts[c] || 0) + '</span></button>').join('') + '</div></div>').join('') + '</div>';
  if (S.fcat !== 'all' && C.catWhy[S.fcat]) { const ap = PERS().find(p => p.cats.indexOf(S.fcat) > -1) || PERS()[0]; h += '<div class="whybox" style="--pc:' + ap.color + '"><span class="ok">' + esc(ap.name) + ' approves</span><p><b>Why ' + esc(CATL[S.fcat].toLowerCase()) + ':</b> ' + esc(C.catWhy[S.fcat]) + '</p></div>'; }
  return h + '<div class="grid">' + list.map(card).join('') + '</div>';
}
function vCol(){
  const c = C.collections.find(x => x.key === S.col) || C.collections[0], N = cityNow(), list = colPlaces(c);
  const rank = v => (isOpen(v, N.dow, N.mins) ? 0 : 1e7) + ((wxBad() || S.planB) && !isIndoor(v) ? 5e6 : 0) + distKm(v) * 1000;
  list.sort((a, b) => rank(a) - rank(b));
  let h = '<div class="row"><button class="btn" data-act="go" data-v="explore">← Explore</button></div><section class="colhead"><span class="k">Collection · ' + list.length + ' places</span><h2>' + esc(c.title) + '</h2><p>' + esc(c.intro) + '</p><div class="row"><button class="btn primary" data-act="mapcol" data-k="' + c.key + '">See on the map</button><button class="btn" data-act="surpcol" data-k="' + c.key + '">Surprise me from these</button></div></section>';
  h += talk('col'); if (wxBad() || S.planB) h += '<p class="small muted">Weather or Plan B says indoors, so indoor places are listed first.</p>';
  return h + '<div class="grid">' + list.map(card).join('') + '</div>';
}
function vPersona(){
  const p = P_BY(S.persona || PERS()[0].key), N = cityNow();
  const list = V.filter(v => approver(v).key === p.key).sort((a, b) => (isOpen(b, N.dow, N.mins) ? 1 : 0) - (isOpen(a, N.dow, N.mins) ? 1 : 0) || near(a, b));
  return '<div class="row"><button class="btn" data-act="go" data-v="home">← Home</button>' + PERS().filter(x => x.key !== p.key).map(x => '<button class="chip" data-act="go" data-v="persona" data-k="' + x.key + '">' + esc(x.name) + '\'s picks</button>').join('') + '</div>' +
    '<section class="colhead" style="--pc:' + p.color + '"><span class="k">' + esc(p.tag) + '</span><h2>' + esc(p.name) + '\'s picks</h2><p class="story">“' + esc(p.line) + '”</p><div class="row"><button class="btn primary" data-act="surppers" data-k="' + p.key + '">Surprise me, ' + esc(p.name) + '</button></div></section><div class="grid">' + list.map(card).join('') + '</div>';
}
function eraIds(e){ const byName = q => V.filter(v => v.name.toLowerCase().indexOf(q.toLowerCase()) > -1).map(v => v.id); return Array.from(new Set((e.ids || []).concat((e.q || []).flatMap(byName)))).filter(i => BY[i]); }
function vTime(){
  const e = C.eras[S.tm] || C.eras[0], ids = eraIds(e);
  let h = '<div class="row"><button class="btn" data-act="go" data-v="explore">← Explore</button></div>' + talk('time') + '<div class="head"><span class="k">' + esc(C.city) + ' Time Machine</span><h2>What happened here</h2><p class="small muted">Pick a chapter. Each one points to places where you can still feel it. Short summaries for context.</p></div>';
  h += '<div class="tm-bar" role="tablist" aria-label="Chapters">' + C.eras.map((x, i) => '<button class="chip" data-act="era" data-k="' + i + '" aria-pressed="' + (i === S.tm) + '">' + esc(x.y) + '</button>').join('') + '</div>';
  return h + '<section class="tm-card"><span class="yr">' + esc(e.y) + '</span><h3>' + esc(e.t) + '</h3><p>' + esc(e.x) + '</p>' + (ids.length ? '<span class="k">Where to feel it</span><div class="links">' + ids.map(id => '<button class="plink" data-act="venue" data-id="' + id + '">' + esc(BY[id].name) + '</button>').join('') + '</div>' : '') +
    '<div class="row"><button class="btn" data-act="era" data-k="' + Math.max(0, S.tm - 1) + '"' + (S.tm === 0 ? ' disabled' : '') + '>← Earlier</button><button class="btn primary" data-act="era" data-k="' + Math.min(C.eras.length - 1, S.tm + 1) + '"' + (S.tm === C.eras.length - 1 ? ' disabled' : '') + '>Later →</button></div></section>';
}
function vCelebrate(){
  const c = C.celebration;
  return '<div class="row"><button class="btn" data-act="go" data-v="explore">← Explore</button></div><section class="colhead"><span class="k">Optional module</span><h2>' + esc(c.title) + '</h2><p>' + esc(c.sub) + '. Turn this module off in Help → Settings.</p></section><ol class="route">' + c.steps.map(s => '<li><span class="t">' + fmt(tm(s[0])) + '</span><div class="what"><b>' + esc(s[1]) + '</b><span class="links">' + s[2].filter(i => BY[i]).map(i => '<button class="plink" data-act="venue" data-id="' + i + '">' + esc(BY[i].name) + '</button>').join('') + '</span><span class="small muted">' + esc(s[3]) + '</span></div></li>').join('') + '</ol>';
}

/* ---------- map ---------- */
let map = null, layer = null, clusters = null;
const mkIcon = (cls, txt) => L.divIcon({className: '', html: '<div class="mk ' + cls + '">' + (txt || '') + '</div>', iconSize: [28, 28], iconAnchor: [14, 14]});
function mapPlaces(){
  const a = cityNow(); let l = V;
  if (S.mapCol !== 'all') { const c = C.collections.find(x => x.key === S.mapCol); if (c) l = colPlaces(c); }
  if (S.mapOpen || (S.holla && S.hollaTab === 'map')) l = l.filter(v => isOpen(v, a.dow, a.mins));
  if (S.mapSaved) l = l.filter(v => isSaved(v.id));
  if (S.radius) l = l.filter(v => km(origin(), v.coords) * 1.3 <= walkRadiusM(S.radius) / 1000);
  return l;
}
function vMap(){
  let h = '<div class="mapctl"><button class="btn primary" data-act="nearme">' + ic('pin', 16) + ' Near me</button><label class="mapsel"><span>Jump to</span><select class="field" id="areasel" aria-label="Jump to an area"><option value="">Pick an area…</option>' + C.areas.map((a, i) => '<option value="' + i + '">' + esc(a[0]) + '</option>').join('') + '</select></label></div>';
  h += '<div class="mapwrap"><div id="map" class="leafmap" role="application" aria-label="Map of places"></div><button class="mapshield" id="mapshield" aria-label="Tap here to move the map"><span>Tap here to move the map</span></button></div>';
  h += '<div class="mapctl"><label class="mapsel wide"><span>Show</span><select class="field" id="mapcolsel" aria-label="Which places to show on the map"><option value="all"' + (S.mapCol === 'all' ? ' selected' : '') + '>All places</option>' + C.collections.map(c => '<option value="' + c.key + '"' + (S.mapCol === c.key ? ' selected' : '') + '>' + esc(c.title) + '</option>').join('') + '</select></label></div>';
  h += '<div class="row" role="group" aria-label="Walking radius"><span class="small muted">Within</span>' + [0, 5, 10, 15, 30].map(m => '<button class="chip" data-act="radius" data-k="' + m + '" aria-pressed="' + ((S.radius || 0) === m) + '">' + (m ? m + ' min walk' : 'Any distance') + '</button>').join('') + '</div>';
  h += '<div class="row"><button class="chip" data-act="mapopen" aria-pressed="' + S.mapOpen + '">Open now</button><button class="chip" data-act="mapsaved" aria-pressed="' + S.mapSaved + '">Saved</button><button class="chip" data-act="mapcolor" aria-pressed="' + (S.mapColor === 'open') + '">Color by open now</button><button class="chip" data-act="maptips" aria-pressed="' + S.mapTips + '">Night travel tips</button></div>';
  if (S.mapTips) h += '<div class="safety"><h3>Getting around after dark</h3><ul class="tips"><li>Stick to busy, lit streets and keep your group together.</li><li>Order rideshares from inside and meet the car at the door.</li><li>Take a car for anything outside the main walking areas after dark.</li><li class="muted">General tips only: this demo has no neighborhood-level safety ratings.</li></ul></div>';
  if (!(S.holla && S.hollaTab === 'map')) h += talk('map');
  h += '<details class="cat" open><summary><span class="t2">Places in this view</span><span class="c" id="maplistcount"></span></summary><div class="body" id="maplist"></div></details>';
  return h + '<p class="muted small">Walking ring and travel times are estimates (street detour 1.3×, 4.8 km/h). Tap the map to move your start point. Map data © OpenStreetMap contributors; tiles load from openstreetmap.org (the only third-party request).</p>';
}
function drawMap(){
  if (!window.L) return; const el = $('#map'); if (!el) return;
  if (map && map._container !== el) { map.remove(); map = null; clusters = null; }
  if (!map) {
    map = L.map(el, {zoomControl: true, attributionControl: true}).setView(S.base, 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19, attribution: '© OpenStreetMap contributors'}).addTo(map);
    layer = L.layerGroup().addTo(map);
    clusters = L.markerClusterGroup ? L.markerClusterGroup({showCoverageOnHover: false, maxClusterRadius: 36, iconCreateFunction: c => L.divIcon({className: '', html: '<div class="clu">' + c.getChildCount() + '</div>', iconSize: [34, 34]})}).addTo(map) : L.layerGroup().addTo(map);
    map.on('click', e => { S.base = [+e.latlng.lat.toFixed(5), +e.latlng.lng.toFixed(5)]; sv('base', S.base); S.me_pt = null; drawMap(); toast('Start point moved'); });
    map.on('moveend', updateMapList);
    const sh = $('#mapshield'); if (sh) { if (window.matchMedia('(pointer:coarse)').matches || window.innerWidth < 700) sh.onclick = () => sh.remove(); else sh.remove(); }
    if (S.mapFocus) { map.setView(S.mapFocus[0], S.mapFocus[1]); S.mapFocus = null; }
  }
  layer.clearLayers(); clusters.clearLayers(); const a = cityNow(), o = origin();
  map.getContainer().classList.toggle('dark', isDark());
  if (S.radius) L.circle(o, {radius: walkRadiusM(S.radius), color: themeAccent(), weight: 2, fillOpacity: .07, dashArray: '4 6', interactive: false}).addTo(layer);
  L.marker(o, {icon: mkIcon('me', 'YOU'), zIndexOffset: 900, keyboard: false, interactive: false}).addTo(layer);
  const list = mapPlaces();
  list.forEach(v => {
    const op = isOpen(v, a.dow, a.mins), cls = (op ? 'on' : 'off') + (S.mapColor === 'open' ? '' : ' t-' + approver(v).key) + (isSaved(v.id) ? ' sv' : '');
    const m = L.marker(v.coords, {icon: mkIcon(cls, isSaved(v.id) ? 'S' : ''), title: v.name, alt: v.name}); m.on('click', () => openVenue(v.id)); clusters.addLayer(m);
  });
  const it = plan();
  if (it && it.stops.length) {
    const pts = (it.base ? [it.base] : []).concat(it.stops.map(s => BY[s.id].coords));
    L.polyline(pts, {color: themeAccent(), weight: 4, dashArray: '2 9', lineCap: 'round', interactive: false}).addTo(layer);
    it.stops.forEach((s, i) => L.marker(BY[s.id].coords, {icon: mkIcon('stop', i + 1), zIndexOffset: 700, interactive: false, keyboard: false}).addTo(layer));
  }
  setTimeout(() => { if (map) { map.invalidateSize(); updateMapList(); } }, 60);
}
function updateMapList(){
  const box = $('#maplist'); if (!box || !map) return; const b = map.getBounds(), l = mapPlaces().filter(v => b.contains(v.coords)).sort(near);
  $('#maplistcount').textContent = l.length + ' place' + (l.length === 1 ? '' : 's'); box.innerHTML = l.length ? l.slice(0, 30).map(resRow).join('') : '<p class="small muted">Nothing here with these filters. Move or zoom the map, or widen the radius.</p>';
}
function locate(cb){
  if (!navigator.geolocation) { toast('Location is not available on this device.'); return; }
  toast('Finding you…');
  navigator.geolocation.getCurrentPosition(p => { S.me_pt = [p.coords.latitude, p.coords.longitude]; toast('Using your location'); cb && cb(); }, () => toast('Could not get your location. Tap the map to set a start point instead.'), {timeout: 8000, maximumAge: 60000});
}

/* ---------- saved ---------- */
function vSaved(){
  const tabs = [['plan', 'Trip plan'], ['picks', 'Group picks'], ['passport', 'Passport'], ['journal', 'Journal']];
  const h = talk('saved') + '<div class="head"><span class="k">The kitchen table</span><h2>Saved</h2></div><div class="seg" role="tablist" aria-label="Saved sections">' + tabs.map(t => '<button class="chip" data-act="stab" data-k="' + t[0] + '" aria-pressed="' + (S.savedTab === t[0]) + '">' + t[1] + (t[0] === 'picks' && S.saved.length ? ' <span class="cn">' + S.saved.length + '</span>' : '') + '</button>').join('') + '</div>';
  return h + ({plan: vPlan, picks: vPicks, passport: vPassport, journal: vJournal}[S.savedTab] || vPlan)();
}
function itinList(it, edit){
  return '<div class="itin">' + it.stops.map((s, i) => {
    const v = BY[s.id], okk = stopOpenOK(v, it, s), out = isOut(v);
    return (i > 0 || it.base ? '<div class="leg">' + ic(it.mode === 'walk' ? 'walk' : 'car', 14) + ' ~' + s.travel + ' min ' + (it.mode === 'walk' ? 'walk' : 'rideshare') + ' <small>(estimate)</small></div>' : '') +
      '<div class="stop"><span class="num">' + (i + 1) + '</span><div class="sbody"><button class="slink" data-act="venue" data-id="' + v.id + '"><b>' + esc(v.name) + '</b></button><small>' + fmt(s.arrive) + ' – ' + fmt(s.leave) + ' · ' + s.stay + ' min (est.)</small>' + (!okk ? '<em class="bad">May be closed on arrival</em>' : '') + (out && S.planB ? '<em class="bad">Outdoor: Plan B is on</em>' : '') + '</div>' +
      (edit ? '<div class="sctl"><button aria-label="Move up" data-act="mv" data-i="' + i + '" data-d="-1"' + (i === 0 ? ' disabled' : '') + '>' + ic('up', 16) + '</button><button aria-label="Move down" data-act="mv" data-i="' + i + '" data-d="1"' + (i === it.stops.length - 1 ? ' disabled' : '') + '>' + ic('down', 16) + '</button><button aria-label="Less time" data-act="stay" data-i="' + i + '" data-d="-15">−15</button><button aria-label="More time" data-act="stay" data-i="' + i + '" data-d="15">+15</button><button aria-label="Remove stop" data-act="rm" data-i="' + i + '">' + ic('x', 16) + '</button></div>' : '') + '</div>';
  }).join('') + '</div>';
}
function gmapsRoute(it){
  const pts = it.stops.map(s => BY[s.id].coords), ll = p => p[0] + ',' + p[1], o = it.base || S.base, dest = pts[pts.length - 1], wp = pts.slice(0, -1).slice(0, 9);
  let u = 'https://www.google.com/maps/dir/?api=1&origin=' + ll(o) + '&destination=' + ll(dest) + '&travelmode=' + (it.mode === 'walk' ? 'walking' : 'driving'); if (wp.length) u += '&waypoints=' + wp.map(ll).join('%7C'); return u;
}
function vPlan(){
  const nd = Math.max(nDays(), S.plans.length); while (S.plans.length < nd) S.plans.push(mkPlan());
  const it = plan();
  let h = '<div class="seg days" role="tablist" aria-label="Trip days">' + S.plans.map((p, i) => '<button class="chip" data-act="day" data-k="' + i + '" aria-pressed="' + (S.day === i) + '">' + esc(dayLabel(i)) + (p.stops.length ? ' <span class="cn">' + p.stops.length + '</span>' : '') + '</button>').join('') + '<button class="chip" data-act="addday">+ Day</button></div>';
  if (!it.stops.length) return h + '<div class="emptybox"><h3>Nothing planned for ' + esc(dayLabel(S.day)) + '</h3><p class="muted">Use Surprise Me on Home, or tap Plan on any place to start.</p><button class="btn" data-act="go" data-v="home">Go to Surprise Me</button></div>' + planBToggle();
  const tot = it.stops.reduce((a, s) => a + s.travel + s.stay, 0);
  const addSel = '<select id="addsel" class="field" aria-label="Add a stop"><option value="">+ Add a stop…</option>' + V.filter(v => !it.stops.some(s => s.id === v.id)).map(v => '<option value="' + v.id + '">' + esc(v.name) + '</option>').join('') + '</select>';
  h += '<div class="head"><h3>' + esc(dayLabel(S.day)) + '</h3><p class="muted small">' + it.stops.length + ' stops · about ' + Math.floor(tot / 60) + ' h ' + tot % 60 + ' min (estimate)</p></div>';
  h += '<div class="row plan-set"><label class="mapsel"><span>Start</span><input id="pstart" class="field" type="time" value="' + pad(Math.floor(it.startMins / 60)) + ':' + pad(it.startMins % 60) + '" data-pstart></label><div class="seg"><button class="chip" data-act="pmode" data-k="walk" aria-pressed="' + (it.mode === 'walk') + '">' + ic('walk', 16) + ' Walk</button><button class="chip" data-act="pmode" data-k="ride" aria-pressed="' + (it.mode === 'ride') + '">' + ic('car', 16) + ' Ride</button></div></div>';
  h += planBToggle() + itinList(it, true) + '<div class="row">' + addSel + '</div>' + (it.stops.length > 9 ? '<p class="note">Google Maps accepts about 9 stops; extra stops are trimmed from the link.</p>' : '');
  return h + '<div class="actions"><a class="btn primary" target="_blank" rel="noopener" href="' + esc(gmapsRoute(it)) + '">' + ic('ext', 16) + ' Route this day in Google Maps</a><button class="btn" data-act="swapin">Swap outdoor for indoor</button><button class="btn" data-act="clearplan">Clear day</button></div><p class="muted small">Opens Google Maps only when you tap. Travel and stay times are estimates; verify hours before you go.</p>';
}
const wants = (k, id) => { const v = (S.votes[k] || {})[id]; return v === 'must' || v === 'maybe'; };
function tally(id){ const t = {must: 0, maybe: 0, skip: 0}; S.people.forEach(p => { const v = (S.votes[p] || {})[id]; if (v) t[v]++; }); return t.must + ' must · ' + t.maybe + ' maybe · ' + t.skip + ' skip'; }
const votesRow = id => { const cur = myVote(id); return '<div class="votes" role="group" aria-label="Your vote for ' + esc(BY[id].name) + '">' + [['must', 'Must'], ['maybe', 'Maybe'], ['skip', 'Skip']].map(x => '<button class="vote v-' + x[0] + '" data-act="vote" data-id="' + id + '" data-k="' + x[0] + '" aria-pressed="' + (cur === x[0]) + '">' + x[1] + '</button>').join('') + '</div>'; };
function vPicks(){
  const ids = Array.from(new Set(S.saved.concat(Object.keys(S.votes).flatMap(k => Object.keys(S.votes[k]))))).filter(i => BY[i]);
  let h = '<section class="crew"><span class="k">Voting as</span><div class="seg" role="group" aria-label="Who is voting">' + S.people.map(p => '<button class="chip" data-act="me" data-k="' + esc(p) + '" aria-pressed="' + (S.me === p) + '">' + esc(p) + '</button>').join('') + '</div><form class="addperson" data-form="addperson"><label class="sr" for="np">Add a traveler</label><input id="np" class="field" maxlength="24" placeholder="Add a traveler (name)"><button class="btn sm" type="submit">Add</button></form><p class="small muted">Everyone votes on this device. Pass the phone around; "Everyone\'s in" shows places all travelers want.</p></section>';
  if (S.people.length >= 2) h += '<div class="seg" role="group" aria-label="Filter picks"><button class="chip" data-act="person" data-k="all" aria-pressed="' + (S.person === 'all') + '">Everyone\'s saves</button><button class="chip" data-act="person" data-k="every" aria-pressed="' + (S.person === 'every') + '">Everyone\'s in</button>' + S.people.map(p => '<button class="chip" data-act="person" data-k="' + esc(p) + '" aria-pressed="' + (S.person === p) + '">' + esc(p) + '\'s picks</button>').join('') + '</div>';
  const every = id => S.people.length >= 2 && S.people.every(k => wants(k, id));
  let list = ids; if (S.person === 'every') list = ids.filter(every); else if (S.person !== 'all') list = ids.filter(id => wants(S.person, id));
  if (!ids.length) return h + '<div class="emptybox"><h3>Nothing saved yet</h3><p class="muted">Tap Save on a place, or vote Must / Maybe / Skip in its details. Saved places stay in this browser.</p></div>';
  if (!list.length) return h + '<div class="empty">Nothing here yet.</div>';
  return h + list.map(id => { const v = BY[id], st = status(v); return '<div class="res pick"><button class="nm" data-act="venue" data-id="' + id + '">' + esc(v.name) + '</button><span class="right">' + (every(id) ? '<span class="every">Everyone\'s in</span>' : '') + pill(st) + '</span><span class="sub2"><span>' + esc(st.txt) + '</span><span>' + esc(tally(id)) + '</span></span>' + votesRow(id) + '</div>'; }).join('');
}
const stampHit = (s, v) => (s.ids && s.ids.indexOf(v.id) > -1) || (s.cats && s.cats.some(c => v.cats.indexOf(c) > -1)) || (s.tags && s.tags.some(t => (v.tags || []).indexOf(t) > -1));
const stampsFor = vis => C.stamps.filter(s => Object.keys(vis).some(id => BY[id] && stampHit(s, BY[id])));
function vPassport(){
  const got = stampsFor(S.visited).map(s => s.k);
  let h = '<p class="small muted">Mark places visited from their details to earn stamps. ' + got.length + ' of ' + C.stamps.length + ' collected.</p><div class="prog" role="progressbar" aria-label="Stamps collected" aria-valuemin="0" aria-valuemax="' + C.stamps.length + '" aria-valuenow="' + got.length + '"><span style="width:' + (got.length / C.stamps.length * 100) + '%"></span></div>';
  h += '<div class="stamps">' + C.stamps.map((s, i) => '<div class="stamp' + (got.indexOf(s.k) > -1 ? ' got' : '') + '" style="--r:' + ((i % 3) - 1) * 5 + 'deg"><div><span class="g">' + esc(s.g) + '</span><b>' + esc(s.t) + '</b>' + (got.indexOf(s.k) > -1 ? '<span class="small">collected</span>' : '<span class="small">not yet</span>') + '</div></div>').join('') + '</div>';
  const next = C.stamps.filter(s => got.indexOf(s.k) < 0).slice(0, 3);
  if (next.length) h += '<div class="box"><h3>Easy stamps to get next</h3><ul>' + next.map(s => { const v = V.filter(x => stampHit(s, x)).sort(near)[0]; return '<li><b>' + esc(s.t) + ':</b> ' + (v ? '<button class="plink" data-act="venue" data-id="' + v.id + '">' + esc(v.name) + '</button>' : '') + '</li>'; }).join('') + '</ul></div>';
  return h;
}
const hearts = (id, r) => '<div class="hearts" role="group" aria-label="Your rating">' + [1, 2, 3, 4, 5].map(n => '<button class="' + (n <= (r || 0) ? 'on' : '') + '" data-act="rate" data-id="' + id + '" data-k="' + n + '" aria-label="' + n + ' of 5" aria-pressed="' + (n <= (r || 0)) + '">' + ic('heart', 22) + '</button>').join('') + '</div>';
function vJournal(){
  const ids = Object.keys(S.visited).filter(i => BY[i]).sort((a, b) => S.visited[b].t - S.visited[a].t);
  if (!ids.length) return '<div class="emptybox"><h3>Your journal is empty</h3><p class="muted">Open any place and tap Mark visited.</p></div>';
  return ids.map(id => { const v = BY[id], x = S.visited[id]; return '<div class="res"><button class="nm" data-act="venue" data-id="' + id + '">' + esc(v.name) + '</button><span class="small muted">' + new Date(x.t).toLocaleString('en-US', {weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'}) + '</span>' + hearts(id, x.r) + '<input class="field wide" data-jn="' + id + '" placeholder="A memory from this place…" value="' + esc(x.n || '') + '" aria-label="Journal note for ' + esc(v.name) + '"><div class="sub2"><button class="btn sm" data-act="visit" data-id="' + id + '">Remove from journal</button></div></div>'; }).join('');
}

/* ---------- help + settings + tours ---------- */
const HELP = [
 ['start', 'Start here', [['What this is', 'Your trip in one place: what is open right now, a real map, the day-by-day plan, places to vote on, a passport and journal, and your personas cheering you on. It is built from your answers in the Spunfor chat.'], ['The 3-second version', 'Use the bar to move around. Tap any place to see why it is worth it, when it is open and how to get there. Tap Save to keep it.'], ['Take the tour', 'Tap <b>Take the full tour</b> at the top of this page for a step-by-step walk through every screen. It moves around the app for you.']]],
 ['top', 'The top of the screen', [['Holla Holla', 'The button at the top right, on every screen. It shows <b>only what is open this very minute</b> in the section you are on: Home the whole city, Map only open places, Explore every open place, Saved your open saves. You can also "pretend it is" another day or time.'], ['The title', 'Tap the trip title any time to jump back to Home.'], ['Install app', 'Puts the app on your home screen. It opens full screen and keeps working with weak signal. On iPhone: Safari → Share → Add to Home Screen.'], ['Light, dark, auto', 'Auto switches to the dark look after sunset in ' + C.city + '. Change it in Settings → Look and feel.']]],
 ['bar', 'The bottom bar', [['Home', 'Greeting, local time, countdown, weather, personas, quick tiles, Surprise Me and what is open now.'], ['Map', 'Every place on a real map with your location, a walking ring, collections and an open-now filter.'], ['Explore', 'Search, collections, all places with filters and the Time Machine.'], ['Saved', 'Your <b>Trip plan</b> by day, <b>Group picks</b> with Must / Maybe / Skip votes, your <b>Passport</b> of stamps and your <b>Journal</b> with heart ratings.'], ['Help', 'This guide, the tour and your settings.']]],
 ['places', 'Places and honesty labels', [['Hours', 'Each place lists a source and a confidence level. Hours change: always confirm with the venue.'], ['Prices and times', 'Price tiers ($ to $$$$) are estimates. Travel and stay times are estimates.'], ['Your data', 'Saves, votes, visits, journal, plan and theme live only in this browser. Nothing is uploaded. The map loads tiles from OpenStreetMap; weather loads only when you tap the button.']]]
];
function vHelp(){
  let h = '<div class="head"><span class="k">How it works</span><h2>Help & guide</h2><p class="small muted">Everything the app can do, and how to use it.</p></div>' + talk('help');
  h += '<div class="row"><button class="btn primary" data-tour="1">Take the full tour (' + TOURS.full.length + ' steps)</button><button class="btn" data-act="settings">Settings</button><button class="btn" data-act="install">' + ic('dl', 16) + ' Install app</button></div>';
  h += '<nav class="help-toc" aria-label="Guide sections">' + HELP.map(s => '<a href="#help" data-helpjump="' + s[0] + '">' + esc(s[1]) + '</a>').join('') + '</nav>';
  h += HELP.map(s => '<section class="help-sec" id="help-' + s[0] + '"><h3>' + esc(s[1]) + '</h3><dl>' + s[2].map(i => '<dt>' + esc(i[0]) + '</dt><dd>' + i[1] + '</dd>').join('') + '</dl></section>').join('');
  const tr = S.trip;
  if (tr) h += '<section class="help-sec"><h3>Your trip</h3><dl class="dl"><dt>Destination</dt><dd>' + esc(tr.dest) + '</dd><dt>Dates</dt><dd>' + esc(tr.dates) + '</dd><dt>Flight</dt><dd>' + esc(tr.flight) + '</dd><dt>Likes</dt><dd>' + esc(tr.likes) + '</dd><dt>Avoid</dt><dd>' + esc(tr.dislikes || 'None given') + '</dd><dt>Budget · group · needs</dt><dd>' + esc([tr.budget, tr.group, tr.needs].filter(Boolean).join(' · ') || 'Not specified') + '</dd></dl></section>';
  return h + '<section class="help-sec"><h3>Demo data</h3><p class="muted">Seeded with ' + V.length + ' ' + esc(C.city) + ' places. Edit <code>demo/config.js</code> to change city, palette, personas, collections, eras and venues.</p><button class="btn" data-act="reset">Reset my demo data</button></section>';
}
function settingsSheet(){
  const m = S.theme.mode, sc = S.scheme, presets = ['#F04E28', '#B8326A', '#2F6F8F', '#2E7D4F', '#A8641A', '#6B4FD8', '#0E7C86', '#334155'], acc = validHex(S.theme.accent) ? S.theme.accent : '#F04E28';
  const modes = [['generic', 'Generic', 'Blue, white & gray', '#1D4ED8'], ['city', 'City colors', C.palette.name, C.palette.accent], ['custom', 'Custom', 'Pick your accent', acc]].map(x => '<button class="mode" data-act="tmode" data-k="' + x[0] + '" aria-pressed="' + (m === x[0]) + '"><i style="background:' + x[3] + '"></i><b>' + x[1] + '</b><small>' + x[2] + '</small></button>').join('');
  const custom = m === 'custom' ? '<div class="custom"><label for="accent">Accent color</label><div class="row"><input id="accent" type="color" value="' + acc + '" data-accent><div class="presets">' + presets.map(p => '<button style="background:' + p + '" aria-label="Use ' + p + '" data-act="preset" data-k="' + p + '"></button>').join('') + '</div></div></div>' : '';
  const sch = [['auto', 'Auto (after sunset)'], ['light', 'Light'], ['dark', 'Dark']].map(x => '<button class="chip" data-act="scheme" data-k="' + x[0] + '" aria-pressed="' + (sc === x[0]) + '">' + x[1] + '</button>').join('');
  const crew = PERS().map(p => '<div class="pedit" style="--pc:' + p.color + '"><label>Name<input class="field" data-pers="' + p.key + ':name" maxlength="16" value="' + esc(p.name) + '"></label><label>Their line<input class="field" data-pers="' + p.key + ':line" maxlength="120" value="' + esc(p.line) + '"></label></div>').join('');
  const d = S.dates || {start: '', end: ''};
  return '<div class="grab"></div><div class="rowb"><h2 id="sheetTitle">Settings</h2><button class="icon-btn" data-act="closeSheet" aria-label="Close">' + ic('x') + '</button></div>' +
    '<h3 class="sec-t">Look and feel</h3><div class="modes">' + modes + '</div>' + custom + '<div class="seg" role="group" aria-label="Light, dark or auto">' + sch + '</div>' +
    '<h3 class="sec-t">Trip dates</h3><div class="row"><label class="mapsel"><span>From</span><input type="date" class="field" id="dFrom" value="' + esc(d.start) + '" data-dates></label><label class="mapsel"><span>To</span><input type="date" class="field" id="dTo" value="' + esc(d.end) + '" data-dates></label></div>' +
    '<h3 class="sec-t">Your crew (personas)</h3><p class="small muted">Rename the four voices and change what they say. They appear on every screen and approve places by category.</p>' + crew +
    '<h3 class="sec-t">Optional modules</h3><div class="planb"><button class="switch' + (S.modules.celebrate ? ' on' : '') + '" role="switch" aria-checked="' + !!S.modules.celebrate + '" aria-label="Celebration night module" data-act="modcel"><i></i></button><div><b>' + esc(C.celebration.title) + '</b><small>A special-occasion evening route on Home and Explore. Off unless your answers mention a celebration.</small></div></div><p class="muted small">Saved in this browser.</p>';
}
const TOURS = {
 quick: [
  {go: 'home', sel: '#tabs', p: 'scout', t: 'Get around with the bottom bar', b: '<b>Home</b> is your start, <b>Map</b> shows everything nearby, <b>Explore</b> has collections and search, <b>Saved</b> holds your plan, picks, passport and journal.'},
  {go: 'home', sel: '.top .holla', p: 'muse', t: 'Holla Holla!', b: 'Tap <b>Holla Holla</b> on any screen to see only what is open this very minute in that section. Tap it again to see everything.'},
  {go: 'home', sel: '#tabs [data-v="help"]', p: 'sage', t: 'Stuck? Tap Help', b: '<b>Help</b> has the full guide and a longer tour. Tap the title any time to come back Home.', last: '<button class="btn" type="button" data-tourfull="1">Take the full tour</button>'}
 ],
 full: [
  {go: 'home', sel: '#view .hero', p: 'gourmand', t: 'Welcome', b: 'This card shows the local time, your countdown and the weather. The app knows what is open at any hour, so you never walk up to a locked door.'},
  {go: 'home', sel: '.top .holla', p: 'muse', t: 'Holla Holla', b: 'Narrows what you are looking at to <b>only what is open this very minute</b>. On Home that is the whole city; on Map, Explore and Saved it is just that section. Search and filter there, then tap it again.'},
  {go: 'home', sel: '#tabs', p: 'scout', t: 'The bottom bar', b: 'Five buttons: <b>Home</b>, <b>Map</b>, <b>Explore</b>, <b>Saved</b> and <b>Help</b>. The filled one is where you are.'},
  {go: 'home', sel: '#view .talk', p: 'sage', t: 'Your personas', b: 'Four voices chime in on every screen. Tap <b>Another one</b> for a new line. Rename them or change what they say in Settings.'},
  {go: 'home', sel: '#view .tiles', p: 'scout', t: 'Quick tiles', b: '<b>Trip plan</b>, <b>Near me</b> (about a 15-minute walk), <b>Hidden gems</b> and <b>Tonight</b>. One tap each.'},
  {go: 'home', sel: '#view .girls', p: 'sage', t: 'Who is leading tonight?', b: 'Can\'t decide? Let a persona choose. Each has a page of their picks, open ones first.'},
  {go: 'home', sel: '#view .surprise', p: 'gourmand', t: 'Surprise me', b: 'Pick a vibe, how many hours, and walk or ride, then tap <b>Find our adventure</b>. You get a route of places that are actually open. <b>Spin again</b> for another, <b>Add to the plan</b> to keep it.'},
  {go: 'explore', sel: '#uq', p: 'sage', t: 'Search everything', b: 'Type a place, a food, a neighborhood or a bit of history. Results appear as you type.'},
  {go: 'explore', sel: '#view .cols', p: 'muse', t: 'Collections', b: 'Hand-picked lists. Each has <b>See on the map</b> and <b>Surprise me from these</b>. Lists that match your answers are marked "for you".'},
  {go: 'explore', sheet: 'cdm', sel: '#sheet', p: 'scout', t: 'Inside a place', b: 'Open or closed right now, full hours with their source, why you will love it, address and phone. <b>Save</b>, vote, <b>Add to day</b>, <b>Mark visited</b> and <b>Copy link</b>.'},
  {go: 'map', sel: '#view .mapwrap', p: 'sage', t: 'The map', b: 'Every place, your start point and (if you allow it) you. On phones tap <b>Tap here to move the map</b> to pan and zoom. The dotted ring is your walking radius; your plan is drawn as a thread.'},
  {go: 'saved', st: 'plan', sel: '#view .seg.days', p: 'gourmand', t: 'The plan', b: 'Day by day. Add, move or remove stops, switch on <b>Plan B</b> for rain, and tap <b>Route this day in Google Maps</b>.'},
  {go: 'saved', st: 'passport', sel: '#view .stamps', p: 'muse', t: 'Passport and journal', b: 'Mark places visited to earn stamps. The journal keeps heart ratings and a memory for each place.'},
  {go: 'help', sel: '#tabs [data-v="help"]', p: 'scout', t: 'You are ready', b: '<b>Help</b> has the written guide and this tour any time. Tap <b>Install app</b> to put it on your home screen. Now go have a beignet.'}
 ]
};
let tourList = 'quick', tourStep = -1;
function tourClear(){ $$('.tour-hi').forEach(e => e.classList.remove('tour-hi')); const t = $('#tour'); if (t) t.remove(); }
function tourEnd(){ tourClear(); tourStep = -1; if (sheetOpen() && tourList === 'full') closeSheet(); sv('tourDone', 1); }
function tourShow(i, list){
  if (list) tourList = list; const Ls = TOURS[tourList];
  if (i < 0 || i >= Ls.length) { tourEnd(); return; }
  tourClear(); tourStep = i; const s = Ls[i];
  if (s.sheet) { if (S.sheet !== s.sheet) openVenue(s.sheet); } else if (sheetOpen()) closeSheet();
  if (s.st) S.savedTab = s.st;
  S.holla = false; S.hollaTab = null;
  if (S.view !== s.go) setView(s.go, true); else if (!s.sheet) render(true);
  setTimeout(() => {
    if (tourStep !== i) return; const el = $(s.sel);
    if (el) { el.classList.add('tour-hi'); if (!s.sheet && s.sel.indexOf('#tabs') !== 0 && s.sel.indexOf('.top') !== 0) el.scrollIntoView({block: 'center', behavior: 'auto'}); }
    const p = P_BY(s.p), d = document.createElement('div'); d.id = 'tour'; d.className = 'tour' + (s.sheet ? ' tour-up' : ''); d.setAttribute('role', 'dialog'); d.setAttribute('aria-labelledby', 'tourT');
    d.innerHTML = '<div class="tour-top"><span class="badge" aria-hidden="true">' + esc(p.name[0]) + '</span><span class="tour-n">' + (tourList === 'full' ? 'Tour · ' : '') + 'Step ' + (i + 1) + ' of ' + Ls.length + '</span><button class="tour-x" type="button" data-tourgo="skip" aria-label="Close the walkthrough">×</button></div><h2 id="tourT">' + s.t + '</h2><p>' + s.b + '</p><div class="tour-dots" aria-hidden="true">' + Ls.map((_, k) => '<i' + (k === i ? ' class="on"' : '') + '></i>').join('') + '</div><div class="tour-acts">' + (i > 0 ? '<button class="btn" type="button" data-tourgo="back">Back</button>' : '<button class="btn" type="button" data-tourgo="skip">Skip</button>') + (s.last || '') + '<button class="btn primary" type="button" data-tourgo="next">' + (i === Ls.length - 1 ? 'Done' : 'Next') + '</button></div>';
    document.body.appendChild(d); d.querySelector('[data-tourgo="next"]').focus({preventScroll: true});
  }, 180);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-tourgo],[data-tour],[data-tourfull],[data-helpjump]'); if (!b) return;
  if (b.dataset.tour || b.dataset.tourfull) { e.preventDefault(); e.stopPropagation(); tourClear(); tourShow(0, 'full'); return; }
  if (b.dataset.helpjump) { e.preventDefault(); const t = $('#help-' + b.dataset.helpjump); t && t.scrollIntoView({block: 'start'}); return; }
  e.stopPropagation(); const g = b.dataset.tourgo; if (g === 'next') tourShow(tourStep + 1); else if (g === 'back') tourShow(tourStep - 1); else tourEnd();
}, true);

/* ---------- venue sheet ---------- */
function venueSheet(id){
  const v = BY[id], st = status(v), vis = S.visited[id], ap = approver(v), now = cityNow();
  const rows = [1, 2, 3, 4, 5, 6, 0].map(d => '<tr' + (d === now.dow ? ' class="is-today"' : '') + '><td>' + DOWL[d] + '</td><td>' + esc(ivs(v, d).map(x => fmt(x[0]) + '–' + fmt(x[1])).join(', ') || 'Closed') + '</td></tr>').join('');
  return '<div class="grab"></div><div class="rowb top"><div><span class="k">' + esc(v.cats.map(c => CATL[c] || c).join(' · ')) + '</span><h2 id="sheetTitle">' + esc(v.name) + '</h2></div><button class="icon-btn" data-act="closeSheet" aria-label="Close">' + ic('x') + '</button></div>' +
    '<div class="status-row">' + pill(st) + '<span>' + esc(st.txt) + '</span></div>' + (v.why ? '<div class="whybox" style="--pc:' + ap.color + '"><span class="ok">' + esc(ap.name) + ' approves</span><p><b>Why you\'ll love it:</b> ' + esc(v.why) + '</p></div>' : '') + '<p>' + esc(v.note) + '</p>' +
    '<details class="more"><summary>All hours</summary><table class="hrs"><tbody>' + rows + '</tbody></table></details><p class="small">' + esc(v.hoursText) + '</p>' +
    '<dl class="kv"><dt>Area</dt><dd>' + esc(v.area) + '</dd><dt>Address</dt><dd>' + esc(v.address) + '</dd><dt>Distance</dt><dd>' + esc(distTxt(v)) + ' <span class="small muted">(estimate)</span></dd><dt>Price</dt><dd>' + priceTxt(v) + '</dd>' + (v.reserve ? '<dt>Booking</dt><dd>' + esc(v.reserve) + '</dd>' : '') + (v.music ? '<dt>Music</dt><dd>' + esc(v.music) + '</dd>' : '') + (v.phone ? '<dt>Phone</dt><dd><a class="mono" href="tel:' + esc(v.phone.replace(/[^0-9+]/g, '')) + '">' + esc(v.phone) + '</a></dd>' : '') + '</dl>' +
    '<div class="box"><b>Vote as ' + esc(S.me) + '</b>' + votesRow(id) + '</div>' +
    (vis ? '<div class="box"><b>In your journal</b>' + hearts(id, vis.r) + '<input class="field wide" data-jn="' + id + '" placeholder="A memory from this place…" value="' + esc(vis.n || '') + '" aria-label="Journal note"></div>' : '') +
    '<p class="srcline">Hours source: ' + (v.source ? '<a href="' + esc(v.source) + '" target="_blank" rel="noopener">' + esc(v.source.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]) + '</a>' : 'not published') + ' · confidence ' + esc(v.confidence) + '. Price tier is an estimate. Hours can change; confirm with the venue.</p>' +
    '<div class="stickybar">' + heart(v) + '<a class="btn primary" href="' + esc(dirUrl(v)) + '" target="_blank" rel="noopener">Directions</a><button class="btn" data-act="addplan" data-id="' + id + '">Add to day</button><button class="btn" data-act="visit" data-id="' + id + '">' + (vis ? 'Visited (undo)' : 'Mark visited') + '</button>' + (v.url ? '<a class="btn" href="' + esc(v.url) + '" target="_blank" rel="noopener">Website</a>' : '') + '<a class="btn" href="' + esc(gm(v)) + '" target="_blank" rel="noopener">Google Maps</a><button class="btn" data-act="copylink" data-id="' + id + '">Copy link</button></div>';
}

/* ---------- render + routing ---------- */
const TABS = [['home', 'Home'], ['map', 'Map'], ['explore', 'Explore'], ['saved', 'Saved'], ['help', 'Help']];
const NAV_OF = {persona: 'home', col: 'explore', time: 'explore', all: 'explore', celebrate: 'explore'};
const renderTabs = () => { $('#tabs').innerHTML = TABS.map(t => '<button data-act="go" data-v="' + t[0] + '" class="tab' + (S.tab === t[0] ? ' on' : '') + '" role="tab" aria-selected="' + (S.tab === t[0]) + '" aria-current="' + (S.tab === t[0] ? 'page' : 'false') + '">' + ic(t[0], 22) + '<span>' + t[1] + '</span>' + (t[0] === 'saved' && S.saved.length ? '<em class="n" aria-label="' + S.saved.length + ' saved">' + S.saved.length + '</em>' : '') + '</button>').join(''); };
const currentHtml = () => S.holla ? vHolla() : ({home: vHome, map: vMap, explore: vExplore, saved: vSaved, help: vHelp, col: vCol, persona: vPersona, time: vTime, all: vAll, celebrate: vCelebrate}[S.view] || vHome)();
function render(keep){
  const y = window.scrollY, mapOn = S.holla ? S.hollaTab === 'map' : S.view === 'map';
  if (!mapOn && map) { map.remove(); map = null; clusters = null; }
  const f = document.activeElement, fid = f && f.id && $('#view').contains(f) ? f.id : null;
  $('#view').innerHTML = '<div class="page" data-p="' + (S.holla ? 'holla' : S.view) + '">' + currentHtml() + '</div>'; renderTabs();
  const tr = S.trip; $('#tripTitle').textContent = (tr && tr.dest) || C.trip.title; $('#tripSub').textContent = (tr && tr.dates) || C.trip.dates;
  $('#btnHolla').setAttribute('aria-pressed', S.holla);
  if (mapOn) drawMap();
  document.title = ({home: 'Home', map: 'Map', explore: 'Explore', saved: 'Saved', help: 'Help'}[S.tab] || 'Home') + ' · ' + ((tr && tr.dest) || C.trip.title) + ' · Spunfor demo';
  window.scrollTo(0, keep ? y : 0);
}
function setView(v, noHash, arg){
  S.view = v; S.tab = NAV_OF[v] || v; if (arg) { if (v === 'col') S.col = arg; if (v === 'persona') S.persona = arg; }
  if (S.holla) S.hollaTab = v;
  if (!noHash) { const h = v === 'col' ? 'col.' + S.col : v === 'persona' ? 'persona.' + S.persona : v; try { history.replaceState(null, '', '#' + h); } catch (e) {} }
  render();
}
function hollaToggle(){
  if (S.holla) { S.holla = false; S.hollaTab = null; }
  else { if (sheetOpen()) closeSheet(); S.holla = true; S.hollaTab = S.view; S.sim = null; S.hq = ''; S.hcat = 'all'; }
  window.scrollTo(0, 0); render();
}
function toggleSaved(id){ const i = S.saved.indexOf(id); if (i > -1) S.saved.splice(i, 1); else S.saved.push(id); sv('saved', S.saved); toast(i > -1 ? 'Removed from saved' : 'Saved'); }
function addPlan(id){
  const it = plan(); if (it.stops.some(s => s.id === id)) { toast('Already in ' + dayLabel(S.day)); return; }
  it.stops.push({id, stay: stay(BY[id])}); recompute(it); savePlans(); toast('Added to ' + dayLabel(S.day));
}
function toggleVisit(id){
  const before = stampsFor(S.visited).map(s => s.k), was = !!S.visited[id];
  if (was) delete S.visited[id]; else S.visited[id] = {t: Date.now(), r: 0, n: ''};
  sv('visited2', S.visited); const won = stampsFor(S.visited).filter(s => before.indexOf(s.k) < 0);
  toast(won.length ? 'Stamp earned: ' + won[0].t + '!' : was ? 'Removed from your journal.' : 'Marked visited. Rate it in your journal.');
}
function swapOutdoor(){
  const it = plan(); let n = 0;
  it.stops.forEach(s => { const v = BY[s.id]; if (!isOut(v)) return; const alt = V.filter(x => !isOut(x) && !it.stops.some(t => t.id === x.id) && x.cats.some(c => v.cats.indexOf(c) > -1)).sort((a, b) => km(a.coords, v.coords) - km(b.coords, v.coords))[0]; if (alt) { s.id = alt.id; s.stay = stay(alt); n++; } });
  recompute(it); savePlans(); toast(n ? n + ' outdoor stop' + (n > 1 ? 's' : '') + ' swapped for indoor' : 'No outdoor stops to swap'); render(true);
}
function surpToPlan(R){
  const it = plan(), fresh = !it.stops.length; it.mode = R.used.mode;
  R.stops.forEach(s => { if (!it.stops.some(x => x.id === s.v.id)) it.stops.push({id: s.v.id, stay: Math.round(s.dw / 15) * 15 || 30}); });
  if (fresh) { it.startMins = Math.round((R.stops[0].at - R.stops[0].leg) / 15) * 15; it.startDow = cityNow().dow; it.base = origin(); }
  recompute(it); savePlans(); toast('Added to ' + dayLabel(S.day));
}
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
window.addEventListener('appinstalled', () => { deferredInstall = null; toast('Installed. Open it from your home screen.'); });
function doInstall(){
  if (deferredInstall) { deferredInstall.prompt(); deferredInstall.userChoice.finally(() => { deferredInstall = null; }); return; }
  openSheet('<div class="grab"></div><div class="rowb"><h2 id="sheetTitle">Install this app</h2><button class="icon-btn" data-act="closeSheet" aria-label="Close">' + ic('x') + '</button></div><p>Installing puts it on your home screen, opens it full screen and keeps it working with weak signal.</p><dl class="kv"><dt>iPhone</dt><dd>Safari → Share → <b>Add to Home Screen</b>.</dd><dt>Android</dt><dd>Chrome menu → <b>Install app</b> (or Add to Home screen).</dd><dt>Desktop</dt><dd>Chrome or Edge: install icon in the address bar.</dd></dl><p class="small muted">Install needs the app to be served over https (or localhost). Opened as a plain file it cannot install.</p>');
}

/* ---------- events ---------- */
const reSettings = () => { $('#sheet').innerHTML = settingsSheet(); };
document.addEventListener('click', e => {
  const sp = e.target.closest('[data-surp]');
  if (sp) { const kv = sp.dataset.surp.split(':'), k = kv[0], val = k === 'hrs' ? +kv[1] : kv[1]; S.surp[k] = S.surp[k] === val ? null : val; render(true); return; }
  const b = e.target.closest('[data-act]'); if (!b || b.tagName === 'A') return;
  const a = b.dataset.act, id = b.dataset.id, k = b.dataset.k;
  switch (a) {
   case 'go': if (sheetOpen()) closeSheet(); if (b.dataset.st) S.savedTab = b.dataset.st; if (b.dataset.v === 'all') S.fcat = 'all'; if (b.dataset.v === 'home') { S.holla = false; S.hollaTab = null; } setView(b.dataset.v, false, k); break;
   case 'holla': hollaToggle(); break;
   case 'quip': S.quip[k] = ((S.quip[k] || 0) + 1) % (C.quips[k] || C.quips.home).length; render(true); break;
   case 'simLive': S.sim = null; render(true); break;
   case 'mood': S.surp.mood = k; S.surpRes = null; S.holla = false; S.view = 'home'; S.tab = 'home'; render(); { const s = $('#surprise'); s && s.scrollIntoView({block: 'start'}); } break;
   case 'surprun': case 'surpagain': S.surp.seed++; S.surpRes = surpriseNow(); render(true); { const s = $('#adv') || $('#surprise .empty'); s && s.scrollIntoView({block: 'nearest'}); } break;
   case 'surpclear': S.surp.mood = S.surp.hrs = S.surp.mode = null; S.surpRes = null; render(true); break;
   case 'surpadd': if (S.surpRes && S.surpRes.stops.length) { surpToPlan(S.surpRes); render(true); } break;
   case 'surpcol': { const c = C.collections.find(x => x.key === k), mm = C.moods.find(m => m.key === k) || C.moods.find(m => (m.cats || []).some(x => (c.cats || []).indexOf(x) > -1) || (m.tags || []).some(x => (c.tags || []).indexOf(x) > -1)); S.surp.mood = mm ? mm.key : null; S.surpRes = null; S.holla = false; setView('home'); const s = $('#surprise'); s && s.scrollIntoView({block: 'start'}); break; }
   case 'surppers': S.surp.mood = P_BY(k).mood; S.surpRes = surpriseNow(); S.holla = false; setView('home'); { const s = $('#adv'); s && s.scrollIntoView({block: 'start'}); } break;
   case 'planb': S.planB = !S.planB; sv('planB', S.planB); render(true); break;
   case 'loadwx': loadWX(); break;
   case 'nearme': locate(() => { S.radius = 15; sv('radius', 15); if (S.view !== 'map') { S.holla = false; setView('map'); } else render(true); }); break;
   case 'venue': openVenue(id); break;
   case 'closeSheet': closeSheet(); break;
   case 'save': toggleSaved(id); refreshSheet(); render(true); break;
   case 'addplan': addPlan(id); render(true); break;
   case 'visit': toggleVisit(id); refreshSheet(); render(true); break;
   case 'rate': S.visited[id].r = S.visited[id].r === +k ? 0 : +k; sv('visited2', S.visited); refreshSheet(); render(true); break;
   case 'vote': { const m = S.votes[S.me] = S.votes[S.me] || {}; if (m[id] === k) delete m[id]; else m[id] = k; sv('votes', S.votes); refreshSheet(); render(true); break; }
   case 'copylink': { const u = location.href.split('#')[0] + '#place.' + id; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => toast('Link copied'), () => toast(u)); break; }
   case 'me': S.me = k; sv('me', k); render(true); break;
   case 'person': S.person = k; render(true); break;
   case 'stab': S.savedTab = k; render(true); break;
   case 'day': S.day = +k; render(true); break;
   case 'addday': S.plans.push(mkPlan()); S.day = S.plans.length - 1; savePlans(); render(true); break;
   case 'hcat': S.hcat = k; render(true); break;
   case 'fcat': S.fcat = k; render(true); break;
   case 'clearq': S.q = ''; render(true); break;
   case 'era': S.tm = +k; if (sheetOpen()) closeSheet(); if (S.view !== 'time') { S.holla = false; setView('time'); } else render(true); break;
   case 'radius': S.radius = +k; sv('radius', S.radius); render(true); break;
   case 'mapopen': S.mapOpen = !S.mapOpen; render(true); break;
   case 'mapsaved': S.mapSaved = !S.mapSaved; render(true); break;
   case 'mapcolor': S.mapColor = S.mapColor === 'open' ? 'type' : 'open'; render(true); break;
   case 'maptips': S.mapTips = !S.mapTips; render(true); break;
   case 'mapcol': S.mapCol = k; S.holla = false; setView('map'); break;
   case 'mv': { const i = +b.dataset.i, d = +b.dataset.d, st = plan().stops; if (st[i + d]) { const t = st[i]; st[i] = st[i + d]; st[i + d] = t; recompute(plan()); savePlans(); render(true); } break; }
   case 'stay': { const s = plan().stops[+b.dataset.i]; s.stay = Math.max(15, Math.min(240, s.stay + +b.dataset.d)); recompute(plan()); savePlans(); render(true); break; }
   case 'rm': plan().stops.splice(+b.dataset.i, 1); recompute(plan()); savePlans(); render(true); break;
   case 'pmode': plan().mode = k; recompute(plan()); savePlans(); render(true); break;
   case 'clearplan': plan().stops = []; savePlans(); render(true); break;
   case 'swapin': swapOutdoor(); break;
   case 'dates': case 'settings': openSheet(settingsSheet()); break;
   case 'install': doInstall(); break;
   case 'tmode': S.theme.mode = k; sv('theme', S.theme); applyTheme(); reSettings(); render(true); break;
   case 'preset': S.theme.accent = k; S.theme.mode = 'custom'; sv('theme', S.theme); applyTheme(); reSettings(); render(true); break;
   case 'scheme': S.scheme = k; sv('scheme', k); applyTheme(); reSettings(); render(true); break;
   case 'modcel': S.modules.celebrate = !S.modules.celebrate; sv('modules', S.modules); reSettings(); render(true); break;
   case 'reset': if (confirm('Clear saved places, votes, visits, journal, plan, personas and theme in this browser?')) { ['saved', 'votes', 'people', 'me', 'visited2', 'plans', 'theme', 'scheme', 'persOv', 'modules', 'dates', 'planB', 'base', 'radius', 'tourDone'].forEach(x => { try { localStorage.removeItem('spunfor.' + x); } catch (er) {} }); location.reload(); } break;
  }
});
document.addEventListener('submit', e => { const f = e.target.closest('[data-form=addperson]'); if (!f) return; e.preventDefault(); const n = $('#np').value.trim().slice(0, 24); if (n && S.people.indexOf(n) < 0) { S.people.push(n); S.me = n; sv('people', S.people); sv('me', n); render(true); } });
const refocus = id => { const n = $('#' + id); if (n) { const p = n.value.length; n.focus(); n.setSelectionRange(p, p); } };
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'uq') { S.q = t.value; render(true); refocus('uq'); }
  else if (t.id === 'hq') { S.hq = t.value; render(true); refocus('hq'); }
  else if (t.dataset && t.dataset.jn) { const x = S.visited[t.dataset.jn]; if (x) { x.n = t.value; sv('visited2', S.visited); } }
  else if (t.dataset && t.dataset.pers) { const kv = t.dataset.pers.split(':'), o = S.persOv[kv[0]] = S.persOv[kv[0]] || {}; if (t.value) o[kv[1]] = t.value; else delete o[kv[1]]; sv('persOv', S.persOv); }
  else if (t.matches('[data-accent]')) { if (validHex(t.value)) { S.theme.accent = t.value; S.theme.mode = 'custom'; sv('theme', S.theme); applyTheme(); } }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.matches('[data-sim]')) { const d = +$('#simDay').value, tv = $('#simTime').value.split(':'); if (tv.length === 2) { S.sim = {dow: d, mins: +tv[0] * 60 + +tv[1]}; render(true); } }
  else if (t.matches('[data-pstart]')) { const p = t.value.split(':'); if (p.length === 2) { plan().startMins = +p[0] * 60 + +p[1]; recompute(plan()); savePlans(); render(true); } }
  else if (t.id === 'addsel' && t.value) { addPlan(t.value); render(true); }
  else if (t.id === 'areasel' && t.value !== '' && map) { const a = C.areas[+t.value]; map.setView(a[1], a[2]); }
  else if (t.id === 'mapcolsel') { S.mapCol = t.value; render(true); }
  else if (t.matches('[data-dates]')) { const f = $('#dFrom').value, to = $('#dTo').value; if (f) { S.dates = {start: f, end: to && to >= f ? to : f}; sv('dates', S.dates); render(true); } }
  else if (t.matches('[data-accent]')) { reSettings(); render(true); }
  else if (t.dataset && t.dataset.pers) { render(true); }
});
$('#btnHolla').addEventListener('click', hollaToggle);
$('#btnTheme').addEventListener('click', () => openSheet(settingsSheet()));
$('#btnInstall').addEventListener('click', doInstall);
$('#brand').addEventListener('click', () => { S.holla = false; S.hollaTab = null; setView('home'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (tourStep >= 0) tourEnd(); else if (sheetOpen()) closeSheet(); } });
setInterval(() => { const c = $('#clock'); if (c) { const N = cityNow(); c.innerHTML = '<span class="mono">' + DS[N.dow] + ' ' + fmt(N.mins) + '</span> in ' + esc(C.city); } if (S.scheme === 'auto') applyTheme(); }, 30000);

/* ---------- boot ---------- */
(function(){
  const p = new URLSearchParams(location.search);
  if (p.get('reset') === '1') { try { localStorage.removeItem('spunfor.trip'); } catch (e) {} S.trip = null; }
  S.plans.forEach(it => { it.stops = it.stops.filter(s => BY[s.id]); recompute(it); });
  S.saved = S.saved.filter(id => BY[id]); if (S.people.indexOf(S.me) < 0) S.me = S.people[0];
  const h = (location.hash || '').slice(1).split('.'), views = ['home', 'map', 'explore', 'saved', 'help', 'col', 'persona', 'time', 'all', 'celebrate'];
  let openId = null;
  if (h[0] === 'place' && BY[h[1]]) openId = h[1];
  else if (views.indexOf(h[0]) > -1) { S.view = h[0]; S.tab = NAV_OF[h[0]] || h[0]; if (h[0] === 'col' && h[1]) S.col = h[1]; if (h[0] === 'persona' && h[1]) S.persona = h[1]; }
  if (!S.col || !C.collections.some(c => c.key === S.col)) S.col = C.collections[0].key; if (!S.persona || !PERS().some(x => x.key === S.persona)) S.persona = PERS()[0].key;
  applyTheme(); render();
  if (openId) setTimeout(() => openVenue(openId), 80);
  try { if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
  const seen = ld('tourDone', 0); sv('tourDone', 1);
  if (!seen && S.view === 'home' && !openId && location.hash !== '#notour') setTimeout(() => { if (!sheetOpen() && tourStep < 0) tourShow(0, 'quick'); }, 900);
  if (location.hash === '#tour') setTimeout(() => tourShow(0, 'full'), 700);
})();
})();
