/* Spunfor preview bar: switch between versions and design styles from any page.
   Included on every page (v1 site, planners page, preview, trip page, v2 site, v2 app). Self-contained. */
(function(){
  "use strict";
  if(document.getElementById("sfbar")) return;
  try{ if(window.self !== window.top) return; }catch(e){ return; } /* not inside the homepage's embedded demo */
  var me = document.currentScript && document.currentScript.src;
  var root = me ? new URL(".", me).href : location.origin + "/spunfor/";
  var path = location.pathname;
  var here = /\/v2\/app\//.test(path) ? "app" : /\/v2\//.test(path) ? "v2" : "v1";
  var STYLES = [["spun", "Spun"], ["postcard", "Postcard"], ["night", "Night Out"], ["swiss", "Swiss"], ["field", "Field Guide"], ["cinema", "Cinematic"], ["editorial", "Editorial"], ["urban", "After Dark"]];
  var cur = "swiss";
  try{ cur = new URLSearchParams(location.search).get("s") || localStorage.getItem("sf.siteStyle") || "swiss"; }catch(e){}
  var lastTrip = "";
  try{ var mine = JSON.parse(localStorage.getItem("sf.myTrips") || "[]"); if(mine[0] && mine[0].link) lastTrip = mine[0].link; }catch(e){}
  var appHref = lastTrip || root + "v2/#build";

  var css = "#sfbar{position:" + (here === "v2" ? "sticky" : "relative") + ";top:0;z-index:2147483000;display:flex;align-items:center;gap:10px;padding:6px 12px;background:#111;color:#eee;font:600 13px/1.2 system-ui,-apple-system,Segoe UI,sans-serif;overflow-x:auto;scrollbar-width:none;white-space:nowrap;min-height:52px;box-sizing:border-box}"
    + "#sfbar::-webkit-scrollbar{display:none}"
    + "#sfbar .g{display:flex;align-items:center;gap:6px;flex-shrink:0}"
    + "#sfbar .l{font-size:11px;text-transform:uppercase;letter-spacing:.12em;opacity:.65;margin-right:2px}"
    + "#sfbar a,#sfbar button{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 12px;border-radius:999px;border:1px solid #444;color:#eee;position:relative;box-sizing:border-box}"
    + "#sfbar a::after,#sfbar button::after{content:'';position:absolute;left:0;right:0;top:50%;height:48px;transform:translateY(-50%)}"
    + "#sfbar [aria-current='page'],#sfbar [aria-checked='true']{background:#fff;color:#111;border-color:#fff}"
    + "#sfbar a:focus-visible,#sfbar button:focus-visible{outline:2px solid #fff;outline-offset:2px}"
    + "#sfbar b{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#333;color:#fff;font-size:11px}"
    + "#sfbar [aria-checked='true'] b{background:#111}"
    + "#sfbar .sep{width:1px;height:24px;background:#444;flex-shrink:0}"
    + "#sfbar .pk{font-size:10px;text-transform:uppercase;letter-spacing:.08em;background:#E3000F;color:#fff;padding:1px 6px;border-radius:99px}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var bar = document.createElement("div"); bar.id = "sfbar"; bar.setAttribute("role", "navigation"); bar.setAttribute("aria-label", "Versions and styles");
  function link(href, label, on){ return '<a href="' + href + '"' + (on ? ' aria-current="page"' : '') + '>' + label + '</a>'; }
  bar.innerHTML = '<div class="g"><span class="l">Version</span>'
    + link(root, "V1", here === "v1") + link(root + "v2/", "V2 site", here === "v2") + link(appHref, "V2 app", here === "app")
    + '</div><span class="sep" aria-hidden="true"></span><div class="g" role="radiogroup" aria-label="Design style"><span class="l">Style</span>'
    + STYLES.map(function(s, i){ return '<button type="button" role="radio" data-sfs="' + s[0] + '" aria-checked="' + (here === "v2" && cur === s[0]) + '"><b>' + (i + 1) + '</b>' + s[1] + (s[0] === "swiss" ? ' <span class="pk">picked</span>' : '') + '</button>'; }).join("")
    + '</div>';
  document.body.insertBefore(bar, document.body.firstChild);

  bar.addEventListener("click", function(e){
    var b = e.target.closest("[data-sfs]"); if(!b) return;
    var s = b.getAttribute("data-sfs");
    try{ localStorage.setItem("sf.siteStyle", s); }catch(err){}
    if(here === "v2" && window.SFsetStyle){ window.SFsetStyle(s, true); [].forEach.call(bar.querySelectorAll("[data-sfs]"), function(x){ x.setAttribute("aria-checked", String(x === b)); }); return; }
    location.href = root + "v2/?s=" + encodeURIComponent(s);
  });
})();
