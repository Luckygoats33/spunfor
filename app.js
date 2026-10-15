/* Spunfor landing: chat -> personalized preview -> unlock modal -> TEST-mode checkout (or promo) -> demo app.
   No analytics, no cookies, no third-party requests. Card details are validated in-page only and are never stored or sent anywhere. */
(function(){
'use strict';
document.documentElement.classList.remove('no-js');
var CFG=window.SPUNFOR_CONFIG||{};
var PRICE=(CFG.price||9.99), PRICE_TXT='$'+PRICE.toFixed(2);
var STEPS=[
 {k:'flight',q:"Hi, I'm Spunfor. Let's spin your trip app. First: what are your flight details? (Airline, flight number, departure/arrival airports and times, or just \"not booked yet\".)",ph:'e.g. Flight AB123, arrives 3:40pm',quick:['Not booked yet','Driving / train instead']},
 {k:'dates',q:'What are your travel dates?',ph:'e.g. 12 Mar – 19 Mar',quick:[]},
 {k:'dest',q:'Where are you going? City, region or country, anywhere in the world.',ph:'e.g. New Orleans',quick:['New Orleans']},
 {k:'likes',q:'What do you like? Food, jazz, museums, quiet parks, markets, slow mornings… (separate with commas)',ph:'e.g. jazz, coffee, history',quick:[]},
 {k:'dislikes',q:'And what do you dislike or want to avoid? (crowds, early starts, tourist traps, loud bars…)',ph:'e.g. crowds, early mornings',quick:['Nothing in particular'],},
 {k:'budget',q:'Optional: budget? Type "skip" to pass.',ph:'e.g. mid-range, or $150/day',quick:['Skip','Budget-friendly','Mid-range','Splurge'],opt:true},
 {k:'group',q:"Optional: who's traveling?",ph:'e.g. 2 adults',quick:['Skip','Solo','Couple','Family','Friends'],opt:true},
 {k:'needs',q:'Optional: any dietary, health, accessibility or other needs we should plan around?',ph:'e.g. vegetarian, step-free access',quick:['Skip','None'],opt:true}
];
var data,idx,busy,unlockState=null,modalState='offer',promoOk=false,lastFocus=null;
var $=function(id){return document.getElementById(id)};
var log=$('log'),form=$('form'),input=$('input'),quick=$('quick'),result=$('result'),prog=$('progress'),bar=$('bar'),gate=$('gate');
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ls(k,v){try{if(v===undefined){var x=localStorage.getItem('spunfor.'+k);return x?JSON.parse(x):null}if(v===null)localStorage.removeItem('spunfor.'+k);else localStorage.setItem('spunfor.'+k,JSON.stringify(v))}catch(e){return null}}

/* ---------- chat ---------- */
function add(text,who){var d=document.createElement('div');d.className='msg '+who;d.textContent=text;log.appendChild(d);log.scrollTop=log.scrollHeight;return d}
function ask(){
  var s=STEPS[idx];prog.textContent='Step '+(idx+1)+' / '+STEPS.length;bar.style.width=(idx/STEPS.length*100)+'%';gate.textContent=String(idx+1);
  busy=true;var t=add('…','bot typing');
  setTimeout(function(){t.classList.remove('typing');t.textContent=s.q;busy=false;input.placeholder=s.ph;renderQuick(s);input.focus({preventScroll:true});log.scrollTop=log.scrollHeight},350);
}
function renderQuick(s){quick.innerHTML='';(s.quick||[]).forEach(function(q){var b=document.createElement('button');b.type='button';b.textContent=q;b.onclick=function(){submit(q)};quick.appendChild(b)})}
function submit(val){
  if(busy)return;val=(val||'').trim();if(!val)return;if(val.length>600)val=val.slice(0,600);
  add(val,'user');input.value='';resize();quick.innerHTML='';
  var s=STEPS[idx],skip=/^(skip|none|no|n\/a)$/i.test(val);
  data[s.k]=(s.opt&&skip)?'':val;
  if(s.k==='dislikes'&&/^nothing in particular$/i.test(val))data[s.k]='';
  idx++;if(idx<STEPS.length)ask();else finish();
}
function list(s){return (s||'').split(/[,;\n]| and |&/i).map(function(x){return x.trim()}).filter(Boolean).slice(0,10)}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}

/* ---------- personalized preview (phone mockup) ---------- */
function previewHtml(d,unlocked){
  var likes=list(d.likes).slice(0,4),avoid=list(d.dislikes).slice(0,3);
  var rowsRows=[['Flight',d.flight],['Dates',d.dates],['Likes',d.likes],['Avoid',d.dislikes||'None given'],['Budget',d.budget||'Not specified'],['Group',d.group||'Not specified'],['Needs',d.needs||'None given']];
  var tk='<div class="ticket"><div class="top"><span>Trip pass</span><span>'+(unlocked?'Unlocked':'Preview')+'</span></div><div class="body"><p class="k">Boarding &rarr;</p><div class="route">Home &rarr; <em>'+esc(d.dest)+'</em></div>'+
   '<dl>'+rowsRows.map(function(r){return '<div><dt>'+r[0]+'</dt><dd>'+esc(r[1])+'</dd></div>'}).join('')+'</dl></div><div class="perf"></div>'+
   '<div class="stubrow"><span class="barcode"></span><span class="k">'+likes.map(function(l){return esc(cap(l))}).join(' · ')+(avoid.length?'<br>Skip: '+avoid.map(esc).join(', '):'')+'</span></div>'+
   '<span class="stamp'+(unlocked?' ok':'')+'">'+(unlocked?'Unlocked':'Locked preview')+'</span></div>';
  var copy='<div class="pv-copy"><p class="k"><b>Your preview</b></p><h3>Your '+esc(d.dest)+' app, stitched from your answers.</h3><p class="sub">'+(unlocked?'Unlocked. Open it and try Holla Holla, Surprise Me, the map, your passport and the theme picker.':'This is a preview of the shell. Unlock it to open the full interactive app with a map, open-now filter, Surprise Me itineraries, passport and themes.')+'</p>'+
   '<div class="pv-strip" aria-hidden="true"><span class="on">Home</span><span>Map</span><span>Explore</span><span>Saved</span><span>Help</span></div>'+
   (unlocked?'':'<div class="pv-lockrow" aria-hidden="true"><span>Open now: nearby picks</span><span>Surprise Me</span><span>Passport</span></div>')+
   '<div class="actions" id="pvActions">'+(unlocked?'<a class="btn big" href="'+esc(CFG.demoPath||'demo/index.html')+'#home">Open my app</a>':'<button class="btn big" type="button" id="unlockBtn">Unlock your app · '+PRICE_TXT+'</button>')+'<button class="btn ghost dk big" type="button" id="again">Start over</button></div>'+
   '<p class="fine" style="margin-top:18px">The demo app is seeded with New Orleans sample places'+(/new orleans|nola/i.test(d.dest)?'.':'; your destination isn’t in the demo dataset yet, so your answers personalize the shell, personas and preferences.')+'</p></div>';
  return '<div class="pv">'+tk+copy+'</div>';
}
function renderPreview(){
  result.hidden=false;result.innerHTML=previewHtml(data,!!unlockState);
  var ub=$('unlockBtn');if(ub)ub.onclick=function(){openModal('offer')};
  $('again').onclick=restart;
  result.scrollIntoView({behavior:'smooth',block:'start'});
}
function finish(){
  prog.textContent='Boarded';bar.style.width='100%';gate.textContent='OK';
  add('Thanks! Spinning your personalized app preview…','bot');
  unlockState=ls('unlock');
  renderPreview();
  if(!unlockState)setTimeout(function(){if(!unlockState&&modalWrap.hidden)openModal('offer')},1500);
}
function restart(){data={};idx=0;busy=false;log.innerHTML='';result.hidden=true;result.innerHTML='';ls('trip',null);closeModal(true);ask();$('chat').scrollIntoView({behavior:'smooth'})}

/* ---------- unlock modal + TEST checkout ---------- */
var modalWrap=$('modalWrap'),modal=$('modal');
function testBanner(){return '<div class="testbanner"><span>TEST MODE</span> no real charge</div>'}
function openModal(state){lastFocus=document.activeElement;modalState=state;promoOk=false;draw();modalWrap.hidden=false;document.body.style.overflow='hidden';requestAnimationFrame(function(){modalWrap.classList.add('on');modal.focus()})}
function closeModal(silent){modalWrap.classList.remove('on');document.body.style.overflow='';setTimeout(function(){modalWrap.hidden=true},200);if(!silent&&lastFocus&&lastFocus.focus)try{lastFocus.focus()}catch(e){}}
function setState(s){modalState=s;draw();modal.focus()}
function draw(){
  var x='<button class="m-x" data-close aria-label="Close">×</button>',h='';
  if(modalState==='offer'){
    h=x+'<div class="m-top">'+testBanner()+'<p class="k" style="margin-top:14px">Admit one · Personalized trip app</p><h2 id="mTitle">Unlock your personalized app — '+PRICE_TXT+'</h2><p class="sub">One-time. Your '+esc((data&&data.dest)||'trip')+' app, ready to use on your phone.</p>'+
     '<ul class="perks"><li>Holla Holla open-now filter, Surprise Me and a walking-radius map</li><li>Editable plan with route to Google Maps</li><li>Saved places, votes, passport stamps and journal (stored on your device)</li><li>Your colors: Generic, City or Custom, light and dark</li></ul></div>'+
     '<div class="m-perf"></div><div class="m-stub"><div class="price"><b>'+(promoOk?'$0.00':PRICE_TXT)+'</b><span>'+(promoOk?'promo applied':'one-time · USD · test price')+'</span></div>'+
     '<div class="promo"><label class="sr" for="promo">Promo code</label><input id="promo" type="text" placeholder="Promo code" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="40"><button type="button" id="applyPromo">Apply</button></div><div class="msgline" id="promoMsg" aria-live="polite"></div>'+
     (promoOk?'<button class="btn m-btn" type="button" id="freeBtn">Unlock for free</button>':'<button class="btn m-btn" type="button" id="buyBtn">Buy now · '+PRICE_TXT+' (test)</button>')+
     '<button class="m-sub" type="button" data-close>Maybe later</button></div>';
  }else if(modalState==='checkout'){
    h=x+'<div class="m-top">'+testBanner()+'<p class="k" style="margin-top:14px">Order stub</p><h2 id="mTitle">Checkout</h2><div class="order"><div><span>Spunfor personalized app<br><small>'+esc((data&&data.dest)||'Trip')+' · one-time</small></span><b>'+PRICE_TXT+'</b></div><div><span>Tax</span><span>$0.00</span></div><div class="tot"><span>Total (test)</span><span>'+PRICE_TXT+'</span></div></div>'+
     '<p class="hint">Use test card <code>4242 4242 4242 4242</code>, any future expiry, any CVC. <code>4000 0000 0000 0002</code> is declined. <b>Never enter a real card.</b> Nothing is stored or sent anywhere.</p></div><div class="m-perf"></div><div class="m-stub">'+
     '<form id="payForm" novalidate autocomplete="off"><div class="fld"><label for="em">Email (for the test receipt; not sent or stored)</label><input id="em" type="email" inputmode="email" autocomplete="off" placeholder="you@example.com"></div>'+
     '<div class="fld card"><label for="cn">Card number (test)</label><input id="cn" type="text" inputmode="numeric" autocomplete="off" placeholder="4242 4242 4242 4242" maxlength="23"></div>'+
     '<div class="fld two"><div><label for="ex">Expiry</label><input id="ex" type="text" inputmode="numeric" autocomplete="off" placeholder="MM / YY" maxlength="7"></div><div><label for="cv">CVC</label><input id="cv" type="text" inputmode="numeric" autocomplete="off" placeholder="123" maxlength="4"></div></div>'+
     '<div class="msgline err" id="payMsg" role="alert"></div><button class="btn m-btn" type="submit" id="payBtn">Pay '+PRICE_TXT+' (test)</button></form><button class="m-sub" type="button" id="backOffer">← Back</button></div>';
  }else if(modalState==='processing'){
    h='<div class="m-body center-t">'+testBanner()+'<div class="spinner" role="status" aria-label="Processing" style="margin-top:22px"></div><h2 id="mTitle" style="font-size:2.4rem">Processing test payment…</h2><p class="sub" style="margin:0 auto">Simulated in your browser. No real charge is being made and no card data leaves this page.</p></div>';
  }else if(modalState==='success'){
    var u=unlockState||{};
    h='<div class="m-top center-t">'+testBanner()+'<div><span class="okmark" aria-hidden="true">Unlocked</span></div><h2 id="mTitle" style="margin-right:0">'+(u.via==='promo'?'You’re in — unlocked free':'Payment successful (test)')+'</h2><p class="sub">Your personalized app is unlocked.</p></div><div class="m-perf"></div><div class="m-stub">'+
     '<div class="receipt"><div><span>Receipt</span><code>'+esc(u.receipt||'')+'</code></div><div><span>Item</span><span>Personalized trip app</span></div><div><span>Paid</span><b>'+(u.via==='promo'?'$0.00 (promo)':PRICE_TXT+' (TEST – not charged)')+'</b></div><div><span>Date</span><span>'+new Date(u.ts||Date.now()).toLocaleString()+'</span></div></div>'+
     '<a class="btn m-btn" id="openApp" href="'+esc(CFG.demoPath||'demo/index.html')+'#home">Open my app</a><button class="m-sub" type="button" data-close>Stay on this page</button></div>';
  }
  modal.innerHTML=h;bind();
}
function bind(){
  var q=function(i){return $(i)};
  if(q('applyPromo')){
    var apply=function(){var c=q('promo').value.trim().toLowerCase(),codes=CFG.promoCodes||{},m=q('promoMsg');
      if(c&&Object.prototype.hasOwnProperty.call(codes,c)&&codes[c]>=100){promoOk=true;draw();q('promoMsg').className='msgline ok';q('promoMsg').textContent='Promo applied: your app is free.';q('promo').value=c}
      else{m.className='msgline err';m.textContent=c?'That code isn’t valid.':'Enter a promo code first.'}};
    q('applyPromo').onclick=apply;q('promo').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();apply()}});
  }
  if(q('freeBtn'))q('freeBtn').onclick=function(){grant('promo')};
  if(q('buyBtn'))q('buyBtn').onclick=function(){
    if(CFG.checkoutUrl){ /* Production hook: send the visitor to a hosted Stripe Checkout session (see README). */
      var sep=CFG.checkoutUrl.indexOf('?')>-1?'&':'?';location.href=CFG.checkoutUrl+sep+'client_reference_id='+encodeURIComponent('spunfor-'+Date.now());return}
    setState('checkout')};
  if(q('backOffer'))q('backOffer').onclick=function(){setState('offer')};
  if(q('payForm')){
    var cn=q('cn'),ex=q('ex'),cv=q('cv');
    cn.addEventListener('input',function(){var d=cn.value.replace(/\D/g,'').slice(0,19);cn.value=d.replace(/(.{4})/g,'$1 ').trim()});
    ex.addEventListener('input',function(){var d=ex.value.replace(/\D/g,'').slice(0,4);ex.value=d.length>2?d.slice(0,2)+' / '+d.slice(2):d});
    cv.addEventListener('input',function(){cv.value=cv.value.replace(/\D/g,'').slice(0,4)});
    q('payForm').addEventListener('submit',function(e){e.preventDefault();pay()});
  }
}
function pay(){
  var msg=$('payMsg'),em=$('em').value.trim(),num=$('cn').value.replace(/\D/g,''),ex=$('ex').value.replace(/\D/g,''),cv=$('cv').value;
  function err(t,id){msg.textContent=t;if(id)$(id).focus()}
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))return err('Enter a valid email for your test receipt.','em');
  if(num.length<12)return err('Enter a test card number: 4242 4242 4242 4242.','cn');
  var mm=+ex.slice(0,2),yy=+ex.slice(2),now=new Date(),cy=now.getFullYear()%100,cm=now.getMonth()+1;
  if(ex.length!==4||mm<1||mm>12)return err('Enter the expiry as MM / YY.','ex');
  if(yy<cy||(yy===cy&&mm<cm))return err('That expiry date is in the past. Use any future date.','ex');
  if(!/^\d{3,4}$/.test(cv))return err('Enter a 3 or 4 digit CVC (any number works in test mode).','cv');
  var isOk=num==='4242424242424242',isDecl=num==='4000000000000002';
  if(!isOk&&!isDecl){$('cn').value='';return err('Test mode only accepts test cards. Use 4242 4242 4242 4242. This number was not stored or sent anywhere.','cn')}
  msg.textContent='';var keepEm=em,keepEx=$('ex').value,keepCv=cv;
  // Card fields are discarded immediately; nothing is stored or transmitted.
  setState('processing');
  setTimeout(function(){
    if(isDecl){setState('checkout');$('em').value=keepEm;$('ex').value=keepEx;$('cv').value=keepCv;$('payMsg').textContent='Your card was declined (test card 4000 0000 0000 0002 always declines). Try 4242 4242 4242 4242.';$('cn').focus()}
    else grant('test-card')
  },1800);
}
function grant(via){
  var id='TEST-'+Math.random().toString(36).slice(2,8).toUpperCase()+'-'+Date.now().toString(36).toUpperCase();
  unlockState={via:via,receipt:via==='promo'?'PROMO-'+id.slice(5):id,ts:Date.now(),test:true};
  ls('unlock',unlockState);ls('trip',data);
  if(via==='promo'){setState('processing');setTimeout(function(){renderPreview2();setState('success')},900)}
  else{renderPreview2();setState('success')}
}
function renderPreview2(){result.hidden=false;result.innerHTML=previewHtml(data,true);$('again').onclick=restart}
modalWrap.addEventListener('click',function(e){if(e.target.closest('[data-close]'))closeModal()});
document.addEventListener('keydown',function(e){
  if(modalWrap.hidden)return;
  if(e.key==='Escape'){if(modalState!=='processing')closeModal();return}
  if(e.key==='Tab'){var f=modal.querySelectorAll('button,input,a[href],textarea'),a=[].filter.call(f,function(n){return !n.disabled&&n.offsetParent});if(!a.length)return;var first=a[0],last=a[a.length-1];
    if(e.shiftKey&&(document.activeElement===first||document.activeElement===modal)){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
});

/* ---------- misc ---------- */
function resize(){input.style.height='auto';input.style.height=Math.min(input.scrollHeight,140)+'px'}
form.addEventListener('submit',function(e){e.preventDefault();submit(input.value)});
input.addEventListener('input',resize);
input.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit(input.value)}});
$('restart').addEventListener('click',restart);
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}})},{threshold:.12});document.querySelectorAll('.reveal').forEach(function(n){io.observe(n)})}else document.querySelectorAll('.reveal').forEach(function(n){n.classList.add('in')});
/* ---------- the thread: SVG path drawn by scroll; needle rides the end ---------- */
(function(){
  var svg=$('thread'),mask=$('tpath'),needle=$('needle'),main=document.getElementById('top');
  if(!svg||!mask)return;
  var still=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches,len=1;
  if(still){mask.style.strokeDashoffset='0';document.documentElement.classList.add('js-static');return}
  var tick=false;
  function upd(){
    tick=false;var r=main.getBoundingClientRect(),h=r.height,vh=window.innerHeight;
    var p=Math.max(0,Math.min(1,(vh*.62-r.top)/h*1.02));
    mask.style.strokeDashoffset=String(1-p);
    try{var L=mask.getTotalLength(),pt=mask.getPointAtLength(L*p),w=r.width;
      needle.style.left=(pt.x/1000*w)+'px';needle.style.top=(pt.y/4200*h)+'px';needle.style.opacity=p>0.003&&p<0.995?1:0}catch(e){}
  }
  function req(){if(!tick){tick=true;requestAnimationFrame(upd)}}
  window.addEventListener('scroll',req,{passive:true});window.addEventListener('resize',req);upd();
})();
data={};idx=0;busy=false;ask();
})();
