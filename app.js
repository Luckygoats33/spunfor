/* Spunfor home: intake chat -> saves answers (localStorage spunfor.trip) -> opens preview.html (unlock + TEST checkout live in preview.js).
   No analytics, no cookies, no third-party requests. Card details are validated in-page only and are never stored or sent anywhere. */
(function(){
'use strict';
document.documentElement.classList.remove('no-js');
var CFG=window.SPUNFOR_CONFIG||{};
var PRICE=(CFG.price||29.99), PRICE_TXT='$'+PRICE.toFixed(2);
var STEPS=[
 {k:'flight',q:"Hi, I'm Spunfor. Let's put your trip app together. Tell me about the trip in a sentence or two (where, when, your flight if you have one), or just share your flight details. I'll only ask about what's missing.",ph:'e.g. leaving Friday to Portland, back Sunday',quick:['Not booked yet','Driving / train instead']},
 {k:'dates',q:'What are your travel dates?',ph:'e.g. 12 Mar – 19 Mar, or next weekend',quick:['Not sure yet']},
 {k:'dest',q:'Where are you going? City, region or country, anywhere in the world.',ph:'e.g. Portland, OR',quick:[]},
 {k:'likes',q:'What do you like? Food, jazz, museums, quiet parks, markets, slow mornings… (separate with commas)',ph:'e.g. jazz, coffee, history',quick:['Skip']},
 {k:'dislikes',q:'And what do you dislike or want to avoid? (crowds, early starts, tourist traps, loud bars…)',ph:'e.g. crowds, early mornings',quick:['Nothing in particular']},
 {k:'budget',q:'Optional: budget? Type "skip" to pass.',ph:'e.g. mid-range, or $150/day',quick:['Skip','Budget-friendly','Mid-range','Splurge'],opt:true},
 {k:'group',q:"Optional: who's traveling?",ph:'e.g. 2 adults',quick:['Skip','Solo','Couple','Family','Friends'],opt:true},
 {k:'needs',q:'Optional: any dietary, health, accessibility or other needs we should plan around?',ph:'e.g. vegetarian, step-free access',quick:['Skip','None'],opt:true}
];
var LABEL={flight:'Flight',dates:'Dates',dest:'Going to',likes:'Likes',dislikes:'Avoid',budget:'Budget',group:'Group',needs:'Needs'};
var CHIP_ORDER=['dest','dates','flight','likes','dislikes','budget','group','needs'];
var P=window.SpunforParse||{parseTrip:function(){return {}},answer:function(k,v){return v},IDK:/^$/};
var data,idx,busy,editKey=null,destAsked=0,finished=false;
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
/* ---------- intake: parse the first answer, pre-fill every field found, only ask what is missing ---------- */
var chipsEl=$('chips');
function has(k){return Object.prototype.hasOwnProperty.call(data,k)}
function nextIdx(from){while(from<STEPS.length&&has(STEPS[from].k))from++;return from}
function shortV(v){v=String(v);return v.length>42?v.slice(0,40)+'…':v}
function renderChips(){
  if(!chipsEl)return;chipsEl.innerHTML='';
  var ks=CHIP_ORDER.filter(function(k){return data[k]});
  chipsEl.hidden=!ks.length;if(!ks.length)return;
  var l=document.createElement('span');l.className='chips-l';l.textContent='Your answers · tap to edit';chipsEl.appendChild(l);
  ks.forEach(function(k){var b=document.createElement('button');b.type='button';b.className='chip';b.dataset.k=k;b.setAttribute('aria-label','Edit '+LABEL[k]+': '+data[k]);b.innerHTML='<b>'+esc(LABEL[k])+'</b> '+esc(shortV(data[k]));b.onclick=function(){editField(k)};chipsEl.appendChild(b)});
}
function editField(k){
  if(busy)return;editKey=k;
  add('Edit '+LABEL[k].toLowerCase()+':','bot');
  quick.innerHTML='';var rm=document.createElement('button');rm.type='button';rm.textContent='Remove';rm.onclick=function(){submit('',true)};quick.appendChild(rm);
  input.value=data[k]||'';input.placeholder='Type the new '+LABEL[k].toLowerCase();resize();input.focus({preventScroll:true});input.select&&input.select();
}
function summary(ex){return CHIP_ORDER.filter(function(k){return ex[k]&&k!=='flight'}).map(function(k){return ex[k]}).join(' · ')}
function submit(val,remove){
  if(busy)return;val=(val||'').trim();if(!val&&!remove)return;if(val.length>600)val=val.slice(0,600);
  if(val)add(val,'user');input.value='';resize();quick.innerHTML='';
  if(editKey){
    var ek=editKey;editKey=null;var nv=remove?'':(ek==='flight'?val:P.answer(ek,val)||(ek==='dest'||ek==='dates'?'':val));
    if(nv)data[ek]=nv;else data[ek]='';
    renderChips();add(nv?'Updated '+LABEL[ek].toLowerCase()+'.':'Removed '+LABEL[ek].toLowerCase()+'.','bot');
    if(finished){ls('trip',clean(data));quick.innerHTML='<a class="btn small" id="pvLink" href="preview.html" target="_blank" rel="noopener">Open my preview</a>'}
    else{var s2=STEPS[idx];if(s2){input.placeholder=s2.ph;renderQuick(s2)}}
    return;
  }
  var s=STEPS[idx];
  if(idx<=1){
    /* First (or second) free-text answer: pull everything out of it. Fields that matched nothing stay empty and get asked. */
    var ex=P.parseTrip(val),keys=Object.keys(ex),other=keys.filter(function(k){return k!=='flight'});
    if(P.IDK.test(val)){data[s.k]='';if(s.k==='flight'&&idx===0)data.flight=''}
    else if(idx===0&&!keys.length)data.flight=val;           /* e.g. "Driving / train instead": it is the flight answer */
    else if(idx===1&&!ex.dates&&!other.length)data.dates=P.answer('dates',val);
    else{
      if(idx===0)data.flight=ex.flight||'';
      if(idx===1&&!has('dates'))data.dates=ex.dates||'';
      other.forEach(function(k){if(!has(k)||!data[k])data[k]=ex[k]});
      if(other.filter(function(k){return !(idx===1&&k==='dates')}).length){
        add('Got it: '+summary(ex)+'. Tap a chip below to fix anything.','bot')}
    }
  }else if(s.k==='dest'){
    var dv=P.answer('dest',val);
    if(!dv&&destAsked<1){destAsked++;renderChips();return askAgain('I need a place to build your preview. Which city or region?',s)}
    data.dest=dv;
  }else{
    var skip=P.IDK.test(val),own=val,extra='';
    if(!skip&&(s.k==='likes'||s.k==='dislikes')){ /* a late answer can also carry a need, budget or group: keep it out of this field */
      var cut=val.search(/,?\s+(?:and\s+)?(?:i am|i'm|we are|we're|i|we)\s/i);
      if(cut>0){own=val.slice(0,cut).trim();extra=val.slice(cut)}}
    data[s.k]=skip?'':(s.k==='dates'?P.answer('dates',own):own);
    if(!skip&&idx>=3){var e2=P.parseTrip(extra||val);['needs','budget','group'].forEach(function(k){if(k!==s.k&&e2[k]&&!has(k))data[k]=e2[k]})}
  }
  renderChips();
  idx=nextIdx(idx+1);if(idx<STEPS.length)ask();else finish();
}
function askAgain(q,s){busy=true;var t=add('…','bot typing');setTimeout(function(){t.classList.remove('typing');t.textContent=q;busy=false;input.placeholder=s.ph;renderQuick(s);input.focus({preventScroll:true});log.scrollTop=log.scrollHeight},300)}
function list(s){return (s||'').split(/[,;\n]| and |&/i).map(function(x){return x.trim()}).filter(Boolean).slice(0,10)}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}

/* ---------- finish: save answers, open the preview page in a new tab (same tab if a popup blocker stops it) ---------- */
function clean(d){var o={};Object.keys(d).forEach(function(k){var v=String(d[k]==null?'':d[k]).trim();if(v)o[k]=v});return o}
function finish(){
  prog.textContent='Spun';setRing(1,'✓');
  finished=true;data=clean(data);try{var rd=data.dates&&P.resolveDates?P.resolveDates(data.dates):null;if(rd){if(rd.start){data.start=rd.start;data.end=rd.end}data.dateLabel=rd.label;if(rd.approx)data.approxDates=true}}catch(e){}ls('trip',data);renderChips();try{sessionStorage.setItem('spunfor.trip',JSON.stringify(data))}catch(e){}
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
function restart(){data={};idx=0;busy=false;editKey=null;destAsked=0;finished=false;renderChips();log.innerHTML='';quick.innerHTML='';ls('trip',null);ask();$('chat').scrollIntoView({behavior:'smooth'})}

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
/* ---------- demo frame toggle (Mobile | Desktop) ---------- */
(function(){
  var fr=$('demoFrame');if(!fr)return;
  var bm=$('segMobile'),bd=$('segDesktop'),mq=window.matchMedia?matchMedia('(max-width:600px)'):{matches:false};
  function set(v){
    if(v==='desktop'&&mq.matches)v='mobile';
    fr.classList.toggle('is-mobile',v==='mobile');fr.classList.toggle('is-desktop',v==='desktop');
    bm.setAttribute('aria-pressed',v==='mobile');bd.setAttribute('aria-pressed',v==='desktop');
  }
  function sync(){bd.disabled=mq.matches;bd.title=mq.matches?'Desktop view needs a wider screen':'';if(mq.matches)set('mobile')}
  bm.addEventListener('click',function(){set('mobile')});bd.addEventListener('click',function(){set('desktop')});
  if(mq.addEventListener)mq.addEventListener('change',sync);
  sync();set(mq.matches||window.innerWidth<1000?'mobile':'desktop');
})();
data={};idx=0;busy=false;if(log)ask();
})();
