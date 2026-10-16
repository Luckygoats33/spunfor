/* Spunfor home: intake chat -> saves answers (localStorage spunfor.trip) -> opens preview.html (unlock + TEST checkout live in preview.js).
   No analytics, no cookies, no third-party requests. Card details are validated in-page only and are never stored or sent anywhere. */
(function(){
'use strict';
document.documentElement.classList.remove('no-js');
var CFG=window.SPUNFOR_CONFIG||{};
var PRICE=(CFG.price||29.99), PRICE_TXT='$'+PRICE.toFixed(2);
var STEPS=[
 {k:'flight',q:"Hi, I'm Spunfor. Let's spin your trip app together. First: what are your flight details? (Airline, flight number, departure/arrival airports and times, or just \"not booked yet\".)",ph:'e.g. Flight AB123, arrives 3:40pm',quick:['Not booked yet','Driving / train instead']},
 {k:'dates',q:'What are your travel dates?',ph:'e.g. 12 Mar – 19 Mar',quick:[]},
 {k:'dest',q:'Where are you going? City, region or country, anywhere in the world.',ph:'e.g. New Orleans',quick:['New Orleans']},
 {k:'likes',q:'What do you like? Food, jazz, museums, quiet parks, markets, slow mornings… (separate with commas)',ph:'e.g. jazz, coffee, history',quick:[]},
 {k:'dislikes',q:'And what do you dislike or want to avoid? (crowds, early starts, tourist traps, loud bars…)',ph:'e.g. crowds, early mornings',quick:['Nothing in particular'],},
 {k:'budget',q:'Optional: budget? Type "skip" to pass.',ph:'e.g. mid-range, or $150/day',quick:['Skip','Budget-friendly','Mid-range','Splurge'],opt:true},
 {k:'group',q:"Optional: who's traveling?",ph:'e.g. 2 adults',quick:['Skip','Solo','Couple','Family','Friends'],opt:true},
 {k:'needs',q:'Optional: any dietary, health, accessibility or other needs we should plan around?',ph:'e.g. vegetarian, step-free access',quick:['Skip','None'],opt:true}
];
var data,idx,busy;
var $=function(id){return document.getElementById(id)};
var log=$('log'),form=$('form'),input=$('input'),quick=$('quick'),prog=$('progress'),ring=$('ringFill'),dialNo=$('dialNo');
function setRing(f,label){ring.style.strokeDashoffset=String(100-f*100);dialNo.textContent=label}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ls(k,v){try{if(v===undefined){var x=localStorage.getItem('spunfor.'+k);return x?JSON.parse(x):null}if(v===null)localStorage.removeItem('spunfor.'+k);else localStorage.setItem('spunfor.'+k,JSON.stringify(v))}catch(e){return null}}

/* ---------- chat ---------- */
function add(text,who){var d=document.createElement('div');d.className='msg '+who;d.textContent=text;log.appendChild(d);log.scrollTop=log.scrollHeight;return d}
function ask(){
  var s=STEPS[idx];prog.textContent='Step '+(idx+1)+' / '+STEPS.length;setRing(idx/STEPS.length,String(idx+1));
  busy=true;var t=add('…','bot typing');
  setTimeout(function(){t.classList.remove('typing');t.textContent=s.q;busy=false;input.placeholder=s.ph;renderQuick(s);input.focus({preventScroll:true});log.scrollTop=log.scrollHeight},350);
}
function renderQuick(s){quick.innerHTML='';(s.quick||[]).forEach(function(q){var b=document.createElement('button');b.type='button';b.textContent=q;b.onclick=function(){submit(q)};quick.appendChild(b)})}
/* ---------- intake: each question keeps only its own answer ---------- */
var CUE={
  dislikes:/\b(avoid|hate|dislike|don'?t like|do not like|can'?t stand|skip|sick of)\b\s*(.*)$/i,
  needs:/\b(vegetarian|vegan|gluten|allerg\w*|wheelchair|accessib\w*|step-free|mobility|dietary|kosher|halal|need[s]?)\b/i,
  flight:/\b[A-Z]{2}\s?\d{2,4}\b|\b(flight|airline|airport|lands?|landing|arrives?|arriving|departs?|departing|not booked)\b/i,
  dates:/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*\d{1,2}|\b\d{1,2}\s*(?:st|nd|rd|th)?\s*(?:–|-|to|through|until)\s*\d{1,2}\b|\b\d{1,2}\/\d{1,2}\b/i,
  likes:/\b(love|loves|like|likes|into|enjoy|enjoys|obsessed with|want to see|craving)\b\s*(.*)$/i
};
var DEST=/\b(?:going to|trip to|travel(?:l?ing)? to|visiting|heading to|headed to|fly(?:ing)? to|off to)\s+([A-Z][\w'’.-]*(?:\s+[A-Z][\w'’.-]*){0,3})/;
function stripLead(c){return c.replace(/^\s*(and|but|also|then|plus)\s+/i,'').trim()}
function extract(text){
  var out={},clauses=text.split(/[.;!\n]+|,\s*(?=(?:and\s+)?(?:i|we|also|but)\b)/i).map(stripLead).filter(Boolean);
  clauses.forEach(function(c){
    var m,dm=c.match(DEST);if(dm&&!out.dest)out.dest=dm[1].trim();
    if((m=c.match(CUE.dislikes))&&m[2]){out.dislikes=m[2].replace(/^(?:to|going|doing)\s+/i,'').trim();return}
    if(CUE.needs.test(c)){out.needs=out.needs?out.needs+'; '+c:c;return}
    if(CUE.flight.test(c)&&!/\b(love|like|enjoy)\b/i.test(c)){out.flight=c;return}
    if(CUE.dates.test(c)){out.dates=c.replace(/^(?:we|i)(?:'re| am| are)?\s*(?:travel(?:l?ing)?|going|there|away)?\s*(?:from|on)?\s*/i,'').trim()||c;return}
    if((m=c.match(CUE.likes))&&m[2]){out.likes=m[2].trim();return}
  });
  return out;
}
function nextIdx(from){while(from<STEPS.length&&Object.prototype.hasOwnProperty.call(data,STEPS[from].k))from++;return from}
function submit(val){
  if(busy)return;val=(val||'').trim();if(!val)return;if(val.length>600)val=val.slice(0,600);
  add(val,'user');input.value='';resize();quick.innerHTML='';
  var s=STEPS[idx],skip=/^(skip|none|no|n\/a)$/i.test(val);
  var ex=(idx===0&&val.length>50)?extract(val):null,keys=ex?Object.keys(ex):[];
  if(keys.length>=2){
    /* One long sentence answered several questions: split it, each field gets only its own part. */
    data.flight=ex.flight||'';
    ['dates','dest','likes','dislikes','needs'].forEach(function(k){if(ex[k])data[k]=ex[k]});
    add('Got it, I picked up: '+keys.map(function(k){return {flight:'flight',dates:'dates',dest:'destination',likes:'likes',dislikes:'things to skip',needs:'needs'}[k]}).join(', ')+'. A few more questions.','bot');
  }else{
    data[s.k]=(s.opt&&skip)?'':val;
    if(s.k==='dislikes'&&/^nothing in particular$/i.test(val))data[s.k]='';
    if(s.k==='flight'&&/^(not booked yet|driving \/ train instead)$/i.test(val))data[s.k]=val;
  }
  idx=nextIdx(idx+1);if(idx<STEPS.length)ask();else finish();
}
function list(s){return (s||'').split(/[,;\n]| and |&/i).map(function(x){return x.trim()}).filter(Boolean).slice(0,10)}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}

/* ---------- finish: save answers, open the preview page in a new tab (same tab if a popup blocker stops it) ---------- */
function clean(d){var o={};Object.keys(d).forEach(function(k){var v=String(d[k]==null?'':d[k]).trim();if(v)o[k]=v});return o}
function finish(){
  prog.textContent='Spun';setRing(1,'✓');
  data=clean(data);ls('trip',data);try{sessionStorage.setItem('spunfor.trip',JSON.stringify(data))}catch(e){}
  var url='preview.html',w=null;
  try{w=window.open(url,'_blank')}catch(e){w=null}
  if(w&&!w.closed){try{w.opener=null}catch(e){}
    add('Thanks! Your preview opened in a new tab.','bot');
    quick.innerHTML='<a class="btn small" id="pvLink" href="'+url+'" target="_blank" rel="noopener">Open my preview again</a>';
  }else{
    add('Thanks! Taking you to your preview…','bot');
    setTimeout(function(){location.href=url},350);
  }
}
function restart(){data={};idx=0;busy=false;log.innerHTML='';quick.innerHTML='';ls('trip',null);ask();$('chat').scrollIntoView({behavior:'smooth'})}

/* ---------- misc ---------- */
function resize(){input.style.height='auto';input.style.height=Math.min(input.scrollHeight,140)+'px'}
if(form)form.addEventListener('submit',function(e){e.preventDefault();submit(input.value)});
if(input)input.addEventListener('input',resize);
if(input)input.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit(input.value)}});
var tb=$('talkBtn');if(tb)tb.addEventListener('click',function(e){e.preventDefault();var f=$('talk');f.hidden=!f.hidden;if(!f.hidden)$('tName').focus()});
var tm=$('tMail');if(tm)tm.addEventListener('click',function(){tm.href='mailto:business@spunfor.example?subject='+encodeURIComponent('Spunfor Business enquiry')+'&body='+encodeURIComponent(($('tName').value||'')+'\n\n'+($('tMsg').value||''))});
if($('restart'))$('restart').addEventListener('click',restart);
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}})},{threshold:.12});document.querySelectorAll('.reveal').forEach(function(n){io.observe(n)})}else document.querySelectorAll('.reveal').forEach(function(n){n.classList.add('in')});
/* ---------- spiral geometry + scroll spin ---------- */
function spiral(cx,cy,r0,r1,turns,n,start){var p=[];for(var i=0;i<=n;i++){var t=i/n,a=(start||-90)*Math.PI/180+t*turns*2*Math.PI,r=r0+(r1-r0)*t;p.push((cx+r*Math.cos(a)).toFixed(2)+' '+(cy+r*Math.sin(a)).toFixed(2))}return 'M'+p.join(' L')}
(function(){
  var hs=document.querySelector('.hubspiral');if(hs)hs.setAttribute('d',spiral(32,25.5,2.2,15.5,2.6,140));
  var bd=$('bdPath');if(bd)bd.setAttribute('d',spiral(0,0,2,92,5.5,420));
  var disc=$('bigdisc');if(!disc)return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var tick=false;
  function upd(){tick=false;disc.style.setProperty('--spin',(window.scrollY*0.12)+'deg')}
  function req(){if(!tick){tick=true;requestAnimationFrame(upd)}}
  window.addEventListener('scroll',req,{passive:true});upd();
})();
data={};idx=0;busy=false;if(log)ask();
})();
