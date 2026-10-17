/* Spunfor trip app: renders a personalized STARTER PLAN from the intake answers (localStorage spunfor.trip).
   Honest by design: slots are category prompts built from the visitor's likes; links are plain search URLs.
   No venue names, addresses, hours or ratings are invented. Edits persist in localStorage keyed by trip id. No network except map tiles + search links the visitor clicks. */
(function(){
'use strict';
document.documentElement.classList.remove('no-js');
var $=function(id){return document.getElementById(id)};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ls(k,v){try{if(v===undefined){var x=localStorage.getItem('spunfor.'+k);return x?JSON.parse(x):null}if(v===null)localStorage.removeItem('spunfor.'+k);else localStorage.setItem('spunfor.'+k,JSON.stringify(v))}catch(e){return null}}
var P=window.SpunforParse,C=window.SpunforCities;
var MODS=['Ink / tattoos','Nature','Nightlife','History / Time Machine','Celebration','Animals','Food / dietary'];
var SECTIONS=[['map','Map'],['itinerary','Itinerary'],['checklist','Checklist'],['notes','Notes']];
var trip=ls('trip'),main=$('main'),tabs=$('tabs'),city=null,tid='',S={checks:{},done:{},places:[],extra:[],notes:''};

/* ---------- categories: prompts only, never place names ---------- */
var CATS=[
 {id:'coffee',p:'Pick a coffee spot',q:'coffee shops',slots:['morning'],kw:/coffee|cafe|caf[eé]|espresso|latte/},
 {id:'breakfast',p:'Pick a breakfast or brunch spot',q:'breakfast and brunch',slots:['morning'],kw:/breakfast|brunch|beignet|pastr|bakery/},
 {id:'museum',p:'Pick a museum or gallery',q:'museums and galleries',slots:['morning','afternoon'],kw:/museum|art\b|gallery|exhibit/},
 {id:'history',mod:'History / Time Machine',p:'Pick a historic site or walking tour',q:'historic sites',slots:['morning','afternoon'],kw:/histor|heritage|landmark|architecture/},
 {id:'outdoors',mod:'Nature',p:'Pick a park, trail or green space',q:'parks and trails',slots:['morning','afternoon'],kw:/park|nature|hik|trail|outdoor|garden|walk|beach|waterfront|view/},
 {id:'market',p:'Browse a market or food carts',q:'markets and food carts',slots:['afternoon'],kw:/market|food cart|farmers/},
 {id:'books',p:'Browse a bookstore',q:'bookstores',slots:['afternoon'],kw:/book/},
 {id:'shops',p:'Browse local shops',q:'local shops',slots:['afternoon'],kw:/shop|vintage|thrift|boutique|record/},
 {id:'ink',mod:'Ink / tattoos',p:'Look at tattoo shops',q:'tattoo shops',slots:['afternoon'],kw:/tattoo|\bink\b/},
 {id:'animals',mod:'Animals',p:'Visit some animals',q:'zoos and animal sanctuaries',slots:['morning','afternoon'],kw:/animal|zoo|aquarium|\bcats?\b|\bdogs?\b|\bpets?\b/},
 {id:'spa',p:'Pick a spa or slow wellness spot',q:'spas and wellness',slots:['afternoon'],kw:/spa\b|yoga|wellness|massage|relax/},
 {id:'kids',p:'Pick a family-friendly activity',q:'family friendly activities',slots:['morning','afternoon'],kw:/kid|family|children/},
 {id:'food',p:'Pick a place to eat',q:'restaurants',slots:['afternoon','evening'],kw:/food|eat|restaurant|dinner|lunch|foodie|taco|pizza|ramen|sushi|bbq|cuisine|noodle|burger/},
 {id:'music',mod:'Nightlife',p:'Find live music',q:'live music venues',slots:['evening'],kw:/jazz|music|concert|band|blues|\bshow\b/},
 {id:'celebrate',mod:'Celebration',p:'Plan a celebration spot',q:'celebration venues',slots:['evening'],kw:/birthday|anniversary|celebrat|party/},
 {id:'bars',mod:'Nightlife',p:'Pick a bar, brewery or wine spot',q:'bars and breweries',slots:['evening'],kw:/\bbars?\b|cocktail|beer|brewer|wine|nightlife|\bpubs?\b|drinks/}
];
var FILL={morning:{id:'f-m',p:'Pick a coffee or breakfast spot',q:'coffee and breakfast'},afternoon:{id:'f-a',p:'Pick something to explore',q:'things to do'},evening:{id:'f-e',p:'Pick dinner',q:'restaurants'}};
var WHEN={morning:'Morning',afternoon:'Afternoon',evening:'Evening'};
function list(s){return (s||'').split(/[,;\n]| and |&/i).map(function(x){return x.trim()}).filter(Boolean).slice(0,12)}
function hash(s){var h=5381,i;for(i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36)}
function modsOn(){var m=ls('modules');return Array.isArray(m)?m:MODS.slice()}
function secOn(){var s=ls('sections');var o={};SECTIONS.forEach(function(x){o[x[0]]=!(s&&s[x[0]]===false)});return o}
function cityName(){return city?city.name+(city.state&&city.state!=='DC'?', '+city.state:(city.state==='DC'?', DC':'')):(trip&&trip.dest)||'your destination'}
function cityShort(){return city?city.name:(trip&&trip.dest)||'your destination'}
function dietNeed(){return /vegetarian|vegan|gluten|allerg|kosher|halal|pescatarian|lactose|celiac|dietary/i.test((trip&&trip.needs)||'')}
function mapsUrl(q){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q+' in '+cityName())}
function nearUrl(q){return 'https://www.google.com/maps/search/'+encodeURIComponent(q+' near '+cityName())}

/* ---------- itinerary frame ---------- */
function dayList(){
  var rd=null,n=3,days=[];
  if(trip.start&&trip.end){var a=P.fromIso(trip.start),b=P.fromIso(trip.end);if(a&&b&&b>=a){n=Math.min(14,Math.round((b-a)/864e5)+1);for(var i=0;i<n;i++){var d=new Date(a.getFullYear(),a.getMonth(),a.getDate()+i);days.push({n:i+1,date:P.fmt(d)})}return days}}
  var r=P.resolveDates&&trip.dates?P.resolveDates(trip.dates):null;
  if(r&&r.start){var a2=P.fromIso(r.start);n=Math.min(14,r.days);for(var j=0;j<n;j++){var d2=new Date(a2.getFullYear(),a2.getMonth(),a2.getDate()+j);days.push({n:j+1,date:r.approx?'':P.fmt(d2)})}return days}
  if(r&&r.days)n=Math.min(14,r.days);
  for(var k=0;k<n;k++)days.push({n:k+1,date:''});
  return days;
}
function likeCats(){
  var on=modsOn(),out=[],seen={},likes=list(trip.likes),custom=[];
  likes.forEach(function(l){
    var hit=null;CATS.forEach(function(c){if(!hit&&c.kw.test(l))hit=c});
    if(hit){if(hit.mod&&on.indexOf(hit.mod)<0)return;if(!seen[hit.id]){seen[hit.id]=1;out.push(hit)}}
    else custom.push({id:'c-'+hash(l),p:'Find something for: '+l,q:l,slots:['afternoon','evening'],custom:true});
  });
  if(/kid|family|children/i.test(trip.group||'')&&!seen.kids)out.push(CATS.filter(function(c){return c.id==='kids'})[0]);
  return out.concat(custom.slice(0,4));
}
function buildPlan(){
  var cats=likeCats(),days=dayList(),ptr={morning:0,afternoon:0,evening:0},diet=dietNeed();
  return days.map(function(d){
    d.slots=['morning','afternoon','evening'].map(function(sl){
      var cand=cats.filter(function(c){return c.slots.indexOf(sl)>-1}),pick;
      if(cand.length){pick=cand[ptr[sl]%cand.length];ptr[sl]++}else pick=FILL[sl];
      var q=pick.q;if(diet&&(pick.id==='food'||pick.id==='f-e'||pick.id==='market'))q='vegetarian-friendly '+q;
      return {id:'d'+d.n+sl,when:sl,p:pick.p,q:q};
    });
    return d;
  });
}
/* ---------- guardrails + checklist ---------- */
function guardrails(){
  var g=[];
  list(trip.dislikes).forEach(function(x){g.push(['Avoid',x+(/crowd|busy|touris/i.test(x)?'. Plan popular things at quieter times and check each place’s own listed hours.':/early|morning/i.test(x)?'. No early starts planned: mornings are easy.':'.')])});
  if(trip.budget)g.push(['Budget',trip.budget+'. Check prices on each place’s own site; none are shown here.']);
  if(trip.group)g.push(['Group',trip.group+'.']);
  if(trip.needs)g.push(['Needs',trip.needs+'. Confirm with each place before you go.']);
  if(trip.flight)g.push(['Flight',trip.flight+'.']);
  return g;
}
function checklist(){
  var items=[],n=trip.needs||'',add=function(id,t,src){items.push({id:id,t:t,src:src||'starter'})};
  if(/vegetarian|vegan|pescatarian/i.test(n))add('n-veg','Look for vegetarian or vegan options near where you’re staying','your needs');
  if(/gluten|celiac/i.test(n))add('n-glu','Note gluten-free needs to share with restaurants','your needs');
  if(/allerg/i.test(n))add('n-all','Carry a list of your allergies and any medication','your needs');
  if(/kosher|halal|lactose|dietary/i.test(n))add('n-diet','Write down your dietary rules to show restaurants','your needs');
  if(/wheelchair|accessib|step[- ]free|mobility/i.test(n))add('n-acc','Ask each place about step-free access before you go','your needs');
  if(n&&!items.length)add('n-gen','Plan around: '+n,'your needs');
  if(/kid|family|children/i.test(trip.group||''))add('g-kids','Pack snacks and anything the kids need for a long day','your group');
  if(/crowd/i.test(trip.dislikes||''))add('a-crowd','Look up quieter times for busy places','your avoid list');
  [['s-id','Photo ID and payment cards'],['s-chg','Phone charger and a battery pack'],['s-hrs','Check each place’s own website for hours before heading out'],['s-wx','Check the forecast the day before'],['s-save','Save your lodging address offline']].forEach(function(x){add(x[0],x[1])});
  return items.concat(S.extra.map(function(e){return {id:e.id,t:e.t,src:'yours'}}));
}
/* ---------- state ---------- */
function load(){var s=ls('app.'+tid);if(s&&typeof s==='object'){S.checks=s.checks||{};S.done=s.done||{};S.places=s.places||[];S.extra=s.extra||[];S.notes=s.notes||''}}
function save(){ls('app.'+tid,S)}
/* ---------- theme ---------- */
function themeCss(T){
  if(!T||T.mode==='city')return '';
  if(T.mode==='generic')return ':root{--bg:#F5F7FA;--surface:#FFFFFF;--sunk:#E9EDF2;--ink:#111827;--muted:#566070;--line:#D5DBE3;--accent:#1D4ED8;--accent-ink:#FFFFFF;--accent-soft:#DBE6FD;--coral:#1D4ED8;--coral-soft:#E5E7EB;--warn:#7F1D1D;--warn-soft:#FDE8E8}';
  if(T.mode==='custom'&&/^#[0-9a-f]{6}$/i.test(T.accent||'')){
    var h=T.accent.replace('#',''),r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),b=parseInt(h.substr(4,2),16);
    var lum=function(c){c/=255;return c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4)},L=.2126*lum(r)+.7152*lum(g)+.0722*lum(b);
    var dk=function(c){return Math.round(c*.62)},mixw=function(c,t){return Math.round(c+(255-c)*t)},hex=function(a,b2,c){return '#'+[a,b2,c].map(function(v){return ('0'+Math.max(0,Math.min(255,v)).toString(16)).slice(-2)}).join('')};
    var acc=T.accent,ink=L>.4?'#111111':'#FFFFFF';
    if(L>.3)acc=hex(dk(r),dk(g),dk(b)),ink='#FFFFFF'; /* keep text on accent legible */
    return ':root{--accent:'+acc+';--accent-ink:'+ink+';--accent-soft:'+hex(mixw(r,.85),mixw(g,.85),mixw(b,.85))+';--coral:'+acc+';--coral-soft:'+hex(mixw(r,.88),mixw(g,.88),mixw(b,.88))+'}';
  }
  return '';
}
var themeEl=document.createElement('style');themeEl.id='trip-theme';document.head.appendChild(themeEl);
function applyTheme(){var T=ls('theme')||{mode:'city',accent:'#E4572E'};themeEl.textContent=themeCss(T);document.documentElement.setAttribute('data-spun-theme',T.mode||'city');var m=document.querySelector('meta[name=theme-color]');if(m){var c=getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();if(c)m.content=c}}
/* ---------- render ---------- */
function render(){
  applyTheme();
  if(!trip||(!trip.dest&&!trip.dates&&!trip.likes)){
    main.innerHTML='<section class="hero"><p class="eyebrow">Spunfor</p><h1>No trip yet</h1><p class="sub" style="margin-top:8px">Tell us about your trip on the home page and your starter plan shows up here.</p><p style="margin-top:14px"><a class="btn" href="index.html#chat">Start my trip</a></p></section>';tabs.hidden=true;return}
  var on=secOn(),mods=modsOn(),nm=cityName(),sn=cityShort(),plan=buildPlan(),g=guardrails(),cl=checklist();
  var html='';
  var facts=[];
  if(trip.dateLabel||trip.dates)facts.push('<li class="mono">'+esc(trip.dateLabel||trip.dates)+(trip.approxDates?' <span title="approximate">≈</span>':'')+'</li>');
  if(trip.group)facts.push('<li>'+esc(trip.group)+'</li>');
  if(trip.budget)facts.push('<li>'+esc(trip.budget)+'</li>');
  html+='<section class="hero" id="top"><p class="eyebrow">Your trip</p><h1 id="tripTitle">'+esc(nm)+'</h1>'+(facts.length?'<ul class="facts" aria-label="Trip facts">'+facts.join('')+'</ul>':'')+
   '<p class="honest" id="starterNote" role="note">Starter plan: add real places as we build out '+esc(sn)+'. These are category prompts from your answers, not recommendations of specific places.</p>'+
   (city&&!city.demo?'':(city&&city.demo?'':'<p class="note-card" id="unsupported">'+esc(sn)+' isn’t a launch city yet, so this is a starter plan only and there’s no map.</p>'))+'</section>';
  if(city&&city.demo)html+='<div class="demo-card" id="nolaCard"><b>New Orleans has a full interactive app.</b> <a class="btn small" id="nolaLink" href="demo/index.html#home" target="_blank" rel="noopener">Open the New Orleans demo</a><p class="fine" style="margin-top:6px">The demo is a hand-built sample trip, not generated from your answers. Your starter plan is below.</p></div>';
  html+='<section class="sec" id="sec-itinerary" data-sec="itinerary"><p class="eyebrow">Plan</p><h2>Itinerary frame</h2>';
  if(g.length)html+='<div class="card" id="guards"><h3>Guardrails</h3><ul class="guards" style="margin-top:10px">'+g.map(function(x){return '<li><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></li>'}).join('')+'</ul></div>';
  html+=plan.map(function(d){
    return '<div class="day card" data-day="'+d.n+'"><h3>Day '+d.n+(d.date?'<span>'+esc(d.date)+'</span>':'')+'</h3>'+d.slots.map(function(s){
      var mine=S.places.filter(function(p){return p.slot===s.id});
      return '<div class="slot'+(S.done[s.id]?' is-done':'')+'" data-slot="'+s.id+'"><div class="slot-h"><span class="when">'+WHEN[s.when]+'</span></div>'+
       '<label class="done"><input type="checkbox" data-done="'+s.id+'"'+(S.done[s.id]?' checked':'')+'><span class="prompt">'+esc(s.p)+'</span></label>'+
       '<div class="links"><a href="'+mapsUrl(s.q)+'" target="_blank" rel="noopener">Find on Google Maps</a><a href="'+nearUrl(s.q)+'" target="_blank" rel="noopener">Search nearby</a></div>'+
       (mine.length?'<ul class="places">'+mine.map(function(p){return '<li><span>'+esc(p.name)+'</span><button type="button" data-delplace="'+p.id+'" aria-label="Remove '+esc(p.name)+'">×</button></li>'}).join('')+'</ul>':'')+
       '<form class="add" data-addplace="'+s.id+'"><input type="text" maxlength="80" placeholder="Add your own place" aria-label="Add your own place to '+esc(WHEN[s.when])+' of day '+d.n+'"><button type="submit">Add</button></form></div>';
    }).join('')+'</div>';
  }).join('');
  html+='<p class="fine">Search links open Google Maps with a plain search for the category and city. We don’t show venue names, addresses, hours or ratings here.</p>';
  var ex=[['Ink / tattoos','Tattoo shops','tattoo shops'],['Nature','Parks and trails','parks and trails'],['Nightlife','Live music and bars','live music and bars'],['History / Time Machine','Historic sites','historic sites'],['Celebration','Celebration venues','celebration venues'],['Animals','Animals and sanctuaries','zoos and animal sanctuaries'],['Food / dietary',dietNeed()?'Dietary-friendly food':'Restaurants',(dietNeed()?'vegetarian-friendly ':'')+'restaurants']].filter(function(e){return mods.indexOf(e[0])>-1});
  html+='<div class="card" id="explore"><h3>Explore by interest</h3><p class="sub" style="margin:4px 0 10px">Turn these on or off under Customize.</p><div class="explore">'+ex.map(function(e){return '<a href="'+mapsUrl(e[2])+'" target="_blank" rel="noopener" data-mod="'+esc(e[0])+'">'+esc(e[1])+'<small>Search in '+esc(sn)+'</small></a>'}).join('')+(ex.length?'':'<p class="fine">All interest modules are off.</p>')+'</div></div></section>';
  html+='<section class="sec" id="sec-map" data-sec="map"><p class="eyebrow">Map</p><h2>'+esc(sn)+' map</h2>'+(city?'<div id="map" role="region" aria-label="Map centered on '+esc(sn)+'"></div><p class="fine" style="margin-top:6px">Centered on the middle of '+esc(sn)+'. Map data © OpenStreetMap contributors.</p>':'<div class="nomap" id="nomap"><b>No map for '+esc(sn)+' yet.</b><p class="sub" style="margin:4px 0 10px">Maps are only set up for launch cities. You can still search it:</p><a class="btn small" href="'+mapsUrl('things to do')+'" target="_blank" rel="noopener">Search '+esc(sn)+' on Google Maps</a></div>')+'</section>';
  html+='<section class="sec" id="sec-checklist" data-sec="checklist"><p class="eyebrow">Checklist</p><h2>Before you go</h2><div class="card"><ul class="check" id="checklist">'+cl.map(function(i){return '<li class="'+(S.checks[i.id]?'is-done':'')+'"><label><input type="checkbox" data-check="'+i.id+'"'+(S.checks[i.id]?' checked':'')+'><span>'+esc(i.t)+'<span class="src">'+esc(i.src)+'</span></span></label></li>'}).join('')+'</ul><form class="add" id="addItem"><input type="text" maxlength="100" placeholder="Add your own item" aria-label="Add your own checklist item"><button type="submit">Add</button></form></div></section>';
  html+='<section class="sec" id="sec-notes" data-sec="notes"><p class="eyebrow">Notes</p><h2>Your notes</h2><div class="card"><label class="fine" for="notes">Saved on this device as you type.</label><textarea id="notes" maxlength="4000" placeholder="Reservations, ideas, things to remember…">'+esc(S.notes)+'</textarea></div></section>';
  var T=ls('theme')||{mode:'city',accent:'#E4572E'},sc=on;
  html+='<section class="sec" id="sec-custom"><p class="eyebrow">Customize</p><h2>Make it yours</h2><div class="card"><h3>Theme</h3><div class="seg" role="group" aria-label="Color theme">'+[['generic','Generic (blue, white, gray)'],['city','City colors'],['custom','Custom']].map(function(m){return '<button type="button" data-theme="'+m[0]+'" aria-pressed="'+(T.mode===m[0])+'">'+m[1]+'</button>'}).join('')+'</div><label class="fine" id="accRow" style="display:'+(T.mode==='custom'?'flex':'none')+';gap:10px;align-items:center;margin-top:8px">Accent color <input type="color" id="accent" value="'+esc(T.accent||'#E4572E')+'" aria-label="Custom accent color"></label>'+
   '<h3 style="margin-top:16px">Sections</h3><div class="mods" role="group" aria-label="Sections">'+SECTIONS.map(function(s){return '<label><input type="checkbox" data-sec-toggle="'+s[0]+'"'+(sc[s[0]]?' checked':'')+'><span>'+s[1]+'</span></label>'}).join('')+'</div>'+
   '<h3>Interest modules</h3><div class="mods" role="group" aria-label="Interest modules">'+MODS.map(function(m){return '<label><input type="checkbox" data-mod-toggle="'+esc(m)+'"'+(mods.indexOf(m)>-1?' checked':'')+'><span>'+esc(m)+'</span></label>'}).join('')+'</div>'+
   '<p class="fine">Theme and modules are shared with the New Orleans demo. <a href="index.html#chat">Change your answers</a> · <a href="index.html">Back to Spunfor</a></p></div></section>';
  main.innerHTML=html;
  SECTIONS.forEach(function(s){var el=$('sec-'+s[0]);if(el)el.classList.toggle('hidden-sec',!on[s[0]])});
  /* explore card lives inside the itinerary section; also hide when no module is on */
  var tb=[['sec-itinerary','Plan'],['sec-map','Map'],['sec-checklist','Checklist'],['sec-notes','Notes'],['sec-custom','Customize']].filter(function(t){var k=t[0].replace('sec-','');return k==='custom'||on[k]});
  tabs.hidden=false;tabs.innerHTML=tb.map(function(t){return '<button type="button" data-go="'+t[0]+'">'+t[1]+'</button>'}).join('');
  if(city&&on.map)initMap();
}
/* ---------- map (Leaflet is vendored with the demo; tiles from OpenStreetMap, same as the demo) ---------- */
var mapObj=null;
function initMap(){
  var el=$('map');if(!el)return;
  function go(){
    if(!window.L||!el)return;
    try{
      if(mapObj){mapObj.remove();mapObj=null}
      mapObj=L.map(el,{scrollWheelZoom:false}).setView([city.lat,city.lon],12);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(mapObj);
      L.circleMarker([city.lat,city.lon],{radius:9,weight:3,color:getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#2F7F73',fillOpacity:.35}).addTo(mapObj).bindTooltip(city.name+' city center');
    }catch(e){}
  }
  if(window.L)go();else{var s=document.createElement('script');s.src='demo/vendor/leaflet/leaflet.js';s.onload=go;document.head.appendChild(s)}
}
/* ---------- events ---------- */
document.addEventListener('change',function(e){
  var t=e.target,k;
  if((k=t.getAttribute&&t.getAttribute('data-done'))){S.done[k]=t.checked;save();var sl=t.closest('.slot');if(sl)sl.classList.toggle('is-done',t.checked)}
  else if((k=t.getAttribute&&t.getAttribute('data-check'))){S.checks[k]=t.checked;save();var li=t.closest('li');if(li)li.classList.toggle('is-done',t.checked)}
  else if((k=t.getAttribute&&t.getAttribute('data-sec-toggle'))){var s=ls('sections')||{};s[k]=t.checked;ls('sections',s);render();keepScroll('sec-custom')}
  else if((k=t.getAttribute&&t.getAttribute('data-mod-toggle'))){var m=modsOn().slice(),i=m.indexOf(k);if(t.checked&&i<0)m.push(k);if(!t.checked&&i>-1)m.splice(i,1);ls('modules',m);render();keepScroll('sec-custom')}
});
function keepScroll(id){var el=$(id);if(el)el.scrollIntoView({block:'start'})}
document.addEventListener('input',function(e){
  if(e.target.id==='notes'){S.notes=e.target.value;save()}
  if(e.target.id==='accent'){var T=ls('theme')||{};T.mode='custom';T.accent=e.target.value;ls('theme',T);applyTheme();var b=document.querySelectorAll('[data-theme]');[].forEach.call(b,function(x){x.setAttribute('aria-pressed',String(x.getAttribute('data-theme')==='custom'))})}
});
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('[data-theme]');
  if(b){var T=ls('theme')||{accent:'#E4572E'};T.mode=b.getAttribute('data-theme');ls('theme',T);applyTheme();[].forEach.call(document.querySelectorAll('[data-theme]'),function(x){x.setAttribute('aria-pressed',String(x===b))});var r=$('accRow');if(r)r.style.display=T.mode==='custom'?'flex':'none';return}
  var g=e.target.closest&&e.target.closest('[data-go]');
  if(g){var el=$(g.getAttribute('data-go'));if(el&&!el.classList.contains('hidden-sec')){el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});[].forEach.call(tabs.children,function(x){x.classList.toggle('on',x===g)})}return}
  var d=e.target.closest&&e.target.closest('[data-delplace]');
  if(d){var id=d.getAttribute('data-delplace');S.places=S.places.filter(function(p){return p.id!==id});save();render()}
});
document.addEventListener('submit',function(e){
  var f=e.target,sl=f.getAttribute&&f.getAttribute('data-addplace');
  if(sl){e.preventDefault();var v=f.querySelector('input').value.trim();if(!v)return;S.places.push({id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),slot:sl,name:v.slice(0,80)});save();var y=window.scrollY;render();window.scrollTo(0,y);return}
  if(f.id==='addItem'){e.preventDefault();var t=f.querySelector('input').value.trim();if(!t)return;S.extra.push({id:'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),t:t.slice(0,100)});save();var y2=window.scrollY;render();window.scrollTo(0,y2)}
});
/* ---------- boot ---------- */
if(trip){
  city=(C&&trip.dest)?(C.find(trip.dest)||C.findIn(trip.dest)):null;
  tid=hash([trip.dest,trip.start||trip.dates,trip.end||'',trip.likes].join('|'));
  load();
}
render();
window.SpunforTrip={id:tid,city:city&&city.name,plan:function(){return trip?buildPlan():[]}};
})();
