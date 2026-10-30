/* spunfor.me v2: items restored from v1 — demo frame Mobile|Desktop toggle, and the "Spin it" wheel.
   The wheel only PICKS INPUTS (destination, vibe, who's going) and drops them into the trip chat. No network beyond the city index, no invented places. */
"use strict";
(function(){
const $ = s => document.querySelector(s), esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const reduce = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- demo frame toggle (Mobile | Desktop) ---------- */
(function(){
  const fr = $("#nolaFrame"); if(!fr) return;
  const bm = $("#segMobile"), bd = $("#segDesktop"), mq = window.matchMedia ? matchMedia("(max-width:600px)") : {matches:false};
  function set(v){
    if(v === "desktop" && mq.matches) v = "mobile";
    fr.classList.toggle("is-mobile", v === "mobile"); fr.classList.toggle("is-desktop", v === "desktop");
    bm.setAttribute("aria-pressed", String(v === "mobile")); bd.setAttribute("aria-pressed", String(v === "desktop"));
  }
  function sync(){ bd.disabled = mq.matches; bd.title = mq.matches ? "Desktop view needs a wider screen" : ""; if(mq.matches) set("mobile"); }
  bm.addEventListener("click", () => set("mobile")); bd.addEventListener("click", () => set("desktop"));
  if(mq.addEventListener) mq.addEventListener("change", sync);
  sync(); set(mq.matches || window.innerWidth < 1000 ? "mobile" : "desktop");
})();

/* ---------- Spin it ---------- */
const btn = $("#spinBtn"); if(!btn) return;
let CITIES = ["Boston, MA", "Chicago, IL", "Austin, TX", "Nashville, TN", "Denver, CO", "Seattle, WA", "Portland, OR", "San Diego, CA"];
fetch("cities/index.json").then(r => r.ok ? r.json() : null).then(j => { if(j && j.rows){ const r = j.rows.filter(x => x[6]).map(x => x[1] + ", " + x[2]); if(r.length) CITIES = r; } }).catch(() => {});
const VIBES = [["Food-first", "We love food"], ["Nightlife", "We love cocktails and live music"], ["Slow and scenic", "We love parks and slow mornings"], ["Culture", "We love museums and history"], ["Family", "It's a family trip with the kids"], ["Outdoors", "We love parks and the outdoors"]];
const WHO = [["Solo · budget-friendly", "It's a solo trip, on a budget"], ["Couple · mid-range", "It's a couples getaway, mid-range budget"], ["Couple · splurge", "It's a couples getaway and we want to splurge"], ["Family · mid-range", "Family of four, mid-range budget"], ["Friends · mid-range", "It's a friends' weekend, mid-range budget"], ["Friends · splurge", "It's a friends' weekend and we want to splurge"]];
const STEPS = () => [
  {key:"dest", title:"Where to?", items:CITIES.concat(["Other…"]).map(c => ({label:c, say:"Going to " + c}))},
  {key:"vibe", title:"What’s the vibe?", items:VIBES.map(v => ({label:v[0], say:v[1]}))},
  {key:"who", title:"Who’s going, and the budget?", items:WHO.map(w => ({label:w[0], say:w[1]}))}
];
let res = {}, step = 0, rot = 0, spinning = false, wrap, modal, last = null;
function rnd(n){ try{ const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }catch(e){ return Math.floor(Math.random() * n); } }
function build(){
  wrap = document.createElement("div"); wrap.className = "wmodal-wrap"; wrap.id = "wheelWrap"; wrap.hidden = true;
  wrap.innerHTML = '<div class="wscrim" data-wclose></div><div class="wmodal" id="wheelModal" role="dialog" aria-modal="true" aria-labelledby="wTitle" tabindex="-1"></div>';
  document.body.appendChild(wrap); modal = $("#wheelModal");
  wrap.addEventListener("click", e => { if(e.target.closest("[data-wclose]")) close(); });
  document.addEventListener("keydown", e => {
    if(wrap.hidden) return;
    if(e.key === "Escape"){ close(); return; }
    if(e.key === "Tab"){ const f = [...modal.querySelectorAll("button,input,select,a[href]")].filter(n => !n.disabled && n.offsetParent); if(!f.length) return; const a = f[0], z = f[f.length - 1];
      if(e.shiftKey && (document.activeElement === a || document.activeElement === modal)){ e.preventDefault(); z.focus(); } else if(!e.shiftKey && document.activeElement === z){ e.preventDefault(); a.focus(); } }
  });
}
function draw(){
  const S = STEPS(), s = S[step], v = res[s.key], n = s.items.length, seg = 360 / n;
  const grad = s.items.map((_, i) => (i % 2 ? "var(--surface)" : "var(--accent)") + " " + (i * seg) + "deg " + ((i + 1) * seg) + "deg").join(",");
  modal.innerHTML = '<button class="wx" type="button" data-wclose aria-label="Close">×</button>'
    + '<p class="eyebrow">Spin ' + (step + 1) + ' of 3</p><h2 id="wTitle">' + esc(s.title) + '</h2>'
    + '<div class="wchips" role="group" aria-label="Your spins">' + S.map((x, i) => '<button type="button" class="wchip' + (i === step ? " cur" : "") + '" data-step="' + i + '">' + (i + 1) + '. ' + esc(res[x.key] ? res[x.key].label : "—") + '</button>').join("") + '</div>'
    + '<div class="wheel" aria-hidden="true"><div class="wdisc" id="wDisc" style="background:conic-gradient(' + grad + ');transform:rotate(' + rot + 'deg)"></div><i class="wptr"></i></div>'
    + '<p class="wres" id="wRes" aria-live="polite">' + (v ? "<b>" + esc(v.label) + "</b>" : "Tap Spin, or pick one yourself.") + '</p>'
    + '<label class="fl">Or pick<select id="wPick"><option value="">Choose…</option>' + s.items.map((it, i) => '<option value="' + i + '"' + (v && v.i === i ? " selected" : "") + '>' + esc(it.label) + '</option>').join("") + '</select></label>'
    + (s.key === "dest" && v && v.label === "Other…" ? '<label class="fl">Type a city or town<input id="wOther" type="text" maxlength="60" value="' + esc(res.other || "") + '"></label>' : "")
    + '<div class="wacts"><button class="btn" type="button" id="wSpin">Spin <span aria-hidden="true">↻</span></button>'
    + (step < 2 ? '<button class="btn ghost" type="button" id="wNext"' + (v ? "" : " disabled") + '>Next</button>' : '<button class="btn ghost" type="button" id="wUse"' + (Object.keys(res).filter(k => k !== "other").length === 3 ? "" : " disabled") + '>Use these in the chat</button>') + '</div>'
    + '<p class="fine">Spins only fill in the trip chat. Nothing is built until you send it.</p>';
  $("#wSpin").onclick = spin;
  $("#wPick").onchange = e => { const i = e.target.value; if(i === "") return; res[s.key] = {i:+i, label:s.items[+i].label, say:s.items[+i].say}; draw(); $("#wPick").focus(); };
  const o = $("#wOther"); if(o) o.oninput = () => { res.other = o.value; };
  const nx = $("#wNext"); if(nx) nx.onclick = () => { step++; draw(); $("#wSpin").focus(); };
  const u = $("#wUse"); if(u) u.onclick = use;
  modal.querySelectorAll("[data-step]").forEach(b => b.onclick = () => { step = +b.dataset.step; draw(); });
}
function spin(){
  if(spinning) return; const s = STEPS()[step], n = s.items.length, i = rnd(n), seg = 360 / n;
  spinning = true; rot += 1080 + (360 - (rot % 360)) + (360 - (i * seg + seg / 2));
  const d = $("#wDisc"); if(d){ d.style.transition = reduce() ? "none" : "transform 1.6s cubic-bezier(.2,.8,.2,1)"; d.style.transform = "rotate(" + rot + "deg)"; }
  setTimeout(() => { spinning = false; res[s.key] = {i, label:s.items[i].label, say:s.items[i].say}; draw(); $("#wSpin").focus(); }, reduce() ? 50 : 1650);
}
function use(){
  const d = res.dest.label === "Other…" ? (res.other || "").trim() : res.dest.label;
  const text = (d ? "Going to " + d + ". " : "") + res.vibe.say + ". " + res.who.say + ".";
  close(true);
  const t = $("#chatIn"), f = $("#chatForm");
  if(t){ t.value = text; $("#build").scrollIntoView({behavior:reduce() ? "auto" : "smooth", block:"start"}); t.focus(); if(f && d){ f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit", {cancelable:true})); } }
}
function open(){ if(!wrap) build(); last = document.activeElement; step = 0; wrap.hidden = false; document.body.style.overflow = "hidden"; draw(); modal.focus(); }
function close(silent){ wrap.hidden = true; document.body.style.overflow = ""; if(!silent && last && last.focus) last.focus(); }
btn.addEventListener("click", open);
window.SpunforWheel = {open, close, get:() => res};
})();
