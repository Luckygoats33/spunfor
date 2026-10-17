/* Spunfor preview page: reads the intake answers saved by the home page chat (localStorage spunfor.trip), shows the preview,
   unlock modal (promo + TEST checkout) and the Open my app button. No analytics, no cookies, no third-party requests. Card details are never stored or sent. */
(function(){
'use strict';
document.documentElement.classList.remove('no-js');
var CFG=window.SPUNFOR_CONFIG||{};
var PRICE=(CFG.price||29.99), PRICE_TXT='$'+PRICE.toFixed(2);
var MODS=['Ink / tattoos','Nature','Nightlife','History / Time Machine','Celebration','Animals','Food / dietary'];
var SCHEMES=[['generic','Generic (blue, white, gray)'],['city','City colors'],['custom','Custom colors']];
var SECS=[['map','Map'],['itinerary','Itinerary'],['checklist','Checklist'],['notes','Notes']];
var custom={scheme:'city',accent:'#E4572E',modules:MODS.slice(),sections:{map:true,itinerary:true,checklist:true,notes:true}};
var data=null,unlockState=null,modalState='offer',promoOk=false,lastFocus=null;
var $=function(id){return document.getElementById(id)};
var result=$('result');
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ls(k,v){try{if(v===undefined){var x=localStorage.getItem('spunfor.'+k);return x?JSON.parse(x):null}if(v===null)localStorage.removeItem('spunfor.'+k);else localStorage.setItem('spunfor.'+k,JSON.stringify(v))}catch(e){return null}}
function list(s){return (s||'').split(/[,;\n]| and |&/i).map(function(x){return x.trim()}).filter(Boolean).slice(0,10)}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function appHref(d){var c=window.SpunforCities&&SpunforCities.find(destName(d)||'');return (c&&c.demo)||!destName(d)?esc(CFG.demoPath||'demo/index.html')+'#home':'trip.html'}
function destName(d){return (d&&d.dest&&String(d.dest).trim())||''}
function isNola(d){return /new orleans|nola/i.test(destName(d))}
function honestyNote(d){
  var n=destName(d);
  if(!n||isNola(d))return '<b>Sample trip:</b> the full demo is a sample New Orleans trip, so you can try every feature. Your answers also build a starter plan.';
  var c=window.SpunforCities&&SpunforCities.find(n);
  return '<b>Starter plan:</b> '+esc(n)+' opens as an app built from your answers (category prompts and search links). Real venue data for '+esc(n)+' is still to come'+(c?'.':', and it is not a launch city yet, so there is no map.');
}
function previewHtml(d,unlocked){
  var likes=list(d.likes).slice(0,4),avoid=list(d.dislikes).slice(0,3),dest=destName(d);
  var rowsRows=[['Flight',d.flight],['Dates',d.dates],['Likes',d.likes],['Avoid',d.dislikes],['Budget',d.budget],['Group',d.group],['Needs',d.needs]].filter(function(r){return r[1]&&String(r[1]).trim()});
  var tk='<div class="spec"><span class="sticker'+(unlocked?' ok':'')+'">'+(unlocked?'Unlocked':'Locked preview')+'</span><div class="top"><span>Your trip, spun</span><span>'+(unlocked?'Unlocked':'Preview')+'</span></div><div class="route">Home &rarr; <em>'+esc(dest||'Your trip')+'</em></div>'+
   (rowsRows.length?'<dl>'+rowsRows.map(function(r){return '<div><dt>'+r[0]+'</dt><dd>'+esc(r[1])+'</dd></div>'}).join('')+'</dl>':'')+
   (likes.length?'<div class="mods-row">'+likes.map(function(l){return '<span>'+esc(cap(l))+'</span>'}).join('')+'</div>':'')+(avoid.length?'<p class="fine" style="margin:12px 0 0">Skip: '+avoid.map(esc).join(', ')+'</p>':'')+'</div>';
  var copy='<div class="pv-copy"><p class="k"><b>Your preview</b></p><h3>Your '+esc(dest||'trip')+' app, spun together from your answers.</h3><p class="honest-note" id="honestNote" role="note">'+honestyNote(d)+'</p><p class="sub">'+(unlocked?(appHref(d).indexOf('trip.html')===0?'Unlocked. Open your starter plan: itinerary frame, map, checklist, notes and the theme picker.':'Unlocked. Open it and try Holla Holla, Surprise Me, the map, your passport and the theme picker.'):'This is a preview. Unlock it to open the full interactive app with a map, open-now filter, Surprise Me itineraries, passport and themes.')+'</p>'+
   '<div class="pv-strip" aria-hidden="true"><span class="on">Home</span><span>Map</span><span>Explore</span><span>Saved</span><span>Help</span></div>'+
   (unlocked?'':'<div class="pv-lockrow" aria-hidden="true"><span>Open now: nearby picks</span><span>Surprise Me</span><span>Passport</span></div>')+
   '<div class="actions" id="pvActions">'+(unlocked?'<a class="btn big" id="openMy" href="'+appHref(d)+'" target="_blank" rel="noopener">Open my app</a>':'<button class="btn big" type="button" id="unlockBtn">Unlock your app · '+PRICE_TXT+'</button>')+'<a class="btn ghost dk big" id="again" href="index.html#chat">Start over</a></div></div>';
  return '<div class="pv">'+tk+copy+'</div>';
}
function renderPreview(){
  if(!data||!destName(data)){
    result.hidden=false;result.innerHTML='<div class="pv-empty"><h3>No trip answers yet</h3><p class="sub">Answer a few quick questions on the home page and your preview will show up here.</p><div class="actions"><a class="btn big" id="again" href="index.html#chat">Start my trip chat</a></div></div>';return}
  result.hidden=false;result.innerHTML=previewHtml(data,!!unlockState);
  var ub=$('unlockBtn');if(ub)ub.onclick=function(){openModal('offer')};
}
/* ---------- unlock modal + TEST checkout ---------- */
var modalWrap=$('modalWrap'),modal=$('modal');
function testBanner(){return '<div class="testbanner"><span>TEST MODE</span> no real charge</div>'}
function openModal(state){lastFocus=document.activeElement;modalState=state;promoOk=false;draw();modalWrap.hidden=false;document.body.style.overflow='hidden';requestAnimationFrame(function(){modalWrap.classList.add('on');modal.focus()})}
function closeModal(silent){modalWrap.classList.remove('on');document.body.style.overflow='';setTimeout(function(){modalWrap.hidden=true},200);if(!silent&&lastFocus&&lastFocus.focus)try{lastFocus.focus()}catch(e){}}
function setState(s){modalState=s;draw();modal.focus()}
function draw(){
  var x='<button class="m-x" data-close aria-label="Close">×</button>',h='';
  if(modalState==='offer'){
    h=x+'<div class="m-top">'+testBanner()+'<p class="k" style="margin:14px 0 6px">One-time unlock</p><h2 id="mTitle">Unlock your personalized app — '+PRICE_TXT+'</h2><p class="sub">One-time. Your '+esc((data&&data.dest)||'trip')+' app, ready to use on your phone.</p>'+
     '<ul class="perks"><li>Holla Holla open-now filter, Surprise Me and a walking-radius map</li><li>Editable plan with route to Google Maps</li><li>Saved places, votes, passport stamps and journal (stored on your device)</li><li>Full customization: your color scheme plus the modules you want</li></ul>'+
     '<div class="cust" id="cust"><fieldset><legend>Color scheme</legend>'+SCHEMES.map(function(s){return '<label class="opt"><input type="radio" name="scheme" value="'+s[0]+'"'+(custom.scheme===s[0]?' checked':'')+'> '+s[1]+'</label>'}).join('')+'<label class="opt colorrow" id="accRow"'+(custom.scheme==='custom'?'':' hidden')+'>Accent <input type="color" id="accent" value="'+custom.accent+'" aria-label="Custom accent color"></label></fieldset>'+
     '<fieldset><legend>Optional modules</legend>'+MODS.map(function(m,i){return '<label class="opt"><input type="checkbox" name="mod" value="'+m+'"'+(custom.modules.indexOf(m)>-1?' checked':'')+'> '+m+'</label>'}).join('')+'</fieldset><fieldset><legend>App sections</legend>'+SECS.map(function(s){return '<label class="opt"><input type="checkbox" name="sec" value="'+s[0]+'"'+(custom.sections[s[0]]?' checked':'')+'> '+s[1]+'</label>'}).join('')+'</fieldset><p class="fine">Colors and modules also apply to the New Orleans demo. Choices apply to your app when you unlock, and you can change them later in the app.</p></div></div>'+
     '<div class="m-stub"><div class="price"><b>'+(promoOk?'$0.00':PRICE_TXT)+'</b><span>'+(promoOk?'promo applied':'one-time · USD · test price')+'</span></div>'+
     '<div class="promo"><label class="sr" for="promo">Promo code</label><input id="promo" type="text" placeholder="Promo code" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="40"><button type="button" id="applyPromo">Apply</button></div><div class="msgline" id="promoMsg" aria-live="polite"></div>'+
     (promoOk?'<button class="btn m-btn" type="button" id="freeBtn">Unlock for free</button>':'<button class="btn m-btn" type="button" id="buyBtn">Buy now · '+PRICE_TXT+' (test)</button>')+
     '<button class="m-sub" type="button" data-close>Maybe later</button></div>';
  }else if(modalState==='checkout'){
    h=x+'<div class="m-top">'+testBanner()+'<p class="k" style="margin:14px 0 6px">Your order</p><h2 id="mTitle">Checkout</h2><div class="order"><div><span>Spunfor personalized app<br><small>'+esc((data&&data.dest)||'Trip')+' · one-time</small></span><b>'+PRICE_TXT+'</b></div><div><span>Tax</span><span>$0.00</span></div><div class="tot"><span>Total (test)</span><span>'+PRICE_TXT+'</span></div></div>'+
     '<p class="hint">Use test card <code>4242 4242 4242 4242</code>, any future expiry, any CVC. <code>4000 0000 0000 0002</code> is declined. <b>Never enter a real card.</b> Nothing is stored or sent anywhere.</p></div><div class="m-stub">'+
     '<form id="payForm" novalidate autocomplete="off"><div class="fld"><label for="em">Email (for the test receipt; not sent or stored)</label><input id="em" type="email" inputmode="email" autocomplete="off" placeholder="you@example.com"></div>'+
     '<div class="fld card"><label for="cn">Card number (test)</label><input id="cn" type="text" inputmode="numeric" autocomplete="off" placeholder="4242 4242 4242 4242" maxlength="23"></div>'+
     '<div class="fld two"><div><label for="ex">Expiry</label><input id="ex" type="text" inputmode="numeric" autocomplete="off" placeholder="MM / YY" maxlength="7"></div><div><label for="cv">CVC</label><input id="cv" type="text" inputmode="numeric" autocomplete="off" placeholder="123" maxlength="4"></div></div>'+
     '<div class="msgline err" id="payMsg" role="alert"></div><button class="btn m-btn" type="submit" id="payBtn">Pay '+PRICE_TXT+' (test)</button></form><button class="m-sub" type="button" id="backOffer">← Back</button></div>';
  }else if(modalState==='processing'){
    h='<div class="m-body center-t">'+testBanner()+'<div class="spinner" role="status" aria-label="Processing" style="margin-top:22px"></div><h2 id="mTitle" style="font-size:2.4rem">Processing test payment…</h2><p class="sub" style="margin:0 auto">Simulated in your browser. No real charge is being made and no card data leaves this page.</p></div>';
  }else if(modalState==='success'){
    var u=unlockState||{},cu=u.custom||custom;
    h='<div class="m-top center-t">'+testBanner()+'<div><span class="okmark" aria-hidden="true">Unlocked</span></div><h2 id="mTitle" style="margin-right:0">'+(u.via==='promo'?'You’re in — unlocked free':'Payment successful (test)')+'</h2><p class="sub">Your personalized app is unlocked.</p></div><div class="m-stub">'+
     '<div class="receipt"><div><span>Receipt</span><code>'+esc(u.receipt||'')+'</code></div><div><span>Item</span><span>Personalized trip app (one-time)</span></div><div><span>Colors</span><span>'+esc((SCHEMES.filter(function(s){return s[0]===cu.scheme})[0]||SCHEMES[1])[1])+'</span></div><div><span>Modules</span><span>'+esc((cu.modules||[]).join(', ')||'None selected')+'</span></div><div><span>Paid</span><b>'+(u.via==='promo'?'$0.00 (promo)':PRICE_TXT+' (TEST – not charged)')+'</b></div><div><span>Date</span><span>'+new Date(u.ts||Date.now()).toLocaleString()+'</span></div></div>'+
     '<a class="btn m-btn" id="openApp" href="'+appHref(data)+'" target="_blank" rel="noopener">Open my app</a><button class="m-sub" type="button" data-close>Stay on this page</button></div>';
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
  var cs=modal.querySelectorAll('input[name=scheme]');[].forEach.call(cs,function(r){r.onchange=function(){custom.scheme=r.value;var ar=q('accRow');if(ar)ar.hidden=r.value!=='custom'}});
  if(q('accent'))q('accent').oninput=function(){custom.accent=q('accent').value};
  [].forEach.call(modal.querySelectorAll('input[name=mod]'),function(c){c.onchange=function(){var i=custom.modules.indexOf(c.value);if(c.checked&&i<0)custom.modules.push(c.value);if(!c.checked&&i>-1)custom.modules.splice(i,1)}});
  [].forEach.call(modal.querySelectorAll('input[name=sec]'),function(c){c.onchange=function(){custom.sections[c.value]=c.checked}});
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
  unlockState={via:via,receipt:via==='promo'?'PROMO-'+id.slice(5):id,ts:Date.now(),test:true,custom:{scheme:custom.scheme,accent:custom.accent,modules:custom.modules.slice(),sections:Object.assign({},custom.sections)}};
  ls('unlock',unlockState);ls('trip',data);ls('modules',custom.modules.slice());ls('sections',Object.assign({},custom.sections));ls('theme',{mode:custom.scheme,accent:custom.accent}); /* demo reads spunfor.theme; modules are saved for the build */
  if(via==='promo'){setState('processing');setTimeout(function(){renderPreview();setState('success')},900)}
  else{renderPreview();setState('success')}
}
modalWrap.addEventListener('click',function(e){if(e.target.closest('[data-close]'))closeModal()});
document.addEventListener('keydown',function(e){
  if(modalWrap.hidden)return;
  if(e.key==='Escape'){if(modalState!=='processing')closeModal();return}
  if(e.key==='Tab'){var f=modal.querySelectorAll('button,input,a[href],textarea'),a=[].filter.call(f,function(n){return !n.disabled&&n.offsetParent});if(!a.length)return;var first=a[0],last=a[a.length-1];
    if(e.shiftKey&&(document.activeElement===first||document.activeElement===modal)){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
});
data=ls('trip');unlockState=ls('unlock');
renderPreview();
if(data&&destName(data)&&!unlockState)setTimeout(function(){if(!unlockState&&modalWrap.hidden)openModal('offer')},1500);
})();
