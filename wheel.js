/* Spunfor "Spin it": a three-spin wheel that only PICKS INPUTS (destination, vibe, who's going/budget).
   It makes no claim about generated content; the results prefill the same intake chips and build flow.
   Keyboard accessible (every spin has a select + typed fallback), honours prefers-reduced-motion, no network. */
(function(){
'use strict';
var btn=document.getElementById('spinBtn');if(!btn)return;
var C=window.SpunforCities;
var SHORT={'New York, NY':'NYC','Los Angeles, CA':'LA','Chicago, IL':'CHI','Houston, TX':'HOU','Phoenix, AZ':'PHX','Philadelphia, PA':'PHL','San Antonio, TX':'SAT','San Diego, CA':'SD','Dallas, TX':'DAL','Jacksonville, FL':'JAX','Fort Worth, TX':'FTW','San Jose, CA':'SJ','Austin, TX':'AUS','Charlotte, NC':'CLT','Columbus, OH':'CMH','Indianapolis, IN':'IND','San Francisco, CA':'SF','Seattle, WA':'SEA','Denver, CO':'DEN','Oklahoma City, OK':'OKC','Nashville, TN':'BNA','Washington, DC':'DC','El Paso, TX':'ELP','Las Vegas, NV':'LV','Boston, MA':'BOS','Portland, OR':'PDX'};
var CITIES=(C?C.cities.filter(function(c){return !c.demo}).map(function(c){return c.label}):Object.keys(SHORT)).concat(['Other…']);
var VIBES=[['Food-first','food'],['Nightlife','nightlife'],['Slow and scenic','parks, slow mornings, views'],['Culture','museums, history'],['Family','family activities'],['Outdoors','parks, nature, hiking']];
var WHO=[['Solo','Budget-friendly'],['Solo','Mid-range'],['Couple','Mid-range'],['Couple','Splurge'],['Family','Budget-friendly'],['Family','Mid-range'],['Friends','Mid-range'],['Friends','Splurge']];
var STEPS=[
 {key:'dest',title:'Where to?',items:CITIES.map(function(c){return {label:c,short:SHORT[c]||'?'}})},
 {key:'vibe',title:'What’s the vibe?',items:VIBES.map(function(v){return {label:v[0],short:v[0],likes:v[1]}})},
 {key:'who',title:'Who’s going, and the budget?',items:WHO.map(function(w){return {label:w[0]+' · '+w[1].toLowerCase(),short:w[0]+' '+w[1].split('-')[0],group:w[0],budget:w[1]}})}
];
var COLORS=[['#C8F31D','#0D0D0C'],['#0D0D0C','#C8F31D'],['#FF4A1C','#0D0D0C'],['#F3EFE4','#0D0D0C']];
var res={},step=0,rot=0,spinning=false,wrap,modal,cv,ctx,size=300,last=null,other='';
var reduce=function(){return window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function rnd(n){try{var a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n}catch(e){return Math.floor(Math.random()*n)}}
function build(){
  wrap=document.createElement('div');wrap.className='modal-wrap';wrap.id='wheelWrap';wrap.hidden=true;
  wrap.innerHTML='<div class="scrim" data-wclose></div><div class="modal wheel-modal" id="wheelModal" role="dialog" aria-modal="true" aria-labelledby="wTitle" tabindex="-1"></div>';
  document.body.appendChild(wrap);modal=$('wheelModal');
  wrap.addEventListener('click',function(e){if(e.target.closest('[data-wclose]'))close()});
  document.addEventListener('keydown',function(e){
    if(wrap.hidden)return;
    if(e.key==='Escape'){close();return}
    if(e.key==='Tab'){var f=[].filter.call(modal.querySelectorAll('button,input,select,a[href]'),function(n){return !n.disabled&&n.offsetParent});if(!f.length)return;var a=f[0],z=f[f.length-1];
      if(e.shiftKey&&(document.activeElement===a||document.activeElement===modal)){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}
  });
}
function $(id){return document.getElementById(id)}
function chipsHtml(){
  return STEPS.map(function(s,i){var v=res[s.key];return '<button type="button" class="wchip'+(i===step?' cur':'')+(v?' set':'')+'" data-step="'+i+'" aria-label="'+esc(s.title)+(v?' — '+esc(v.text):' — not spun yet')+'">'+(i+1)+'. '+(v?esc(v.text):'—')+'</button>'}).join('');
}
function draw(){
  var s=STEPS[step],n=s.items.length,a=2*Math.PI/n,r=size/2-6,dpr=window.devicePixelRatio||1;
  cv.width=size*dpr;cv.height=size*dpr;cv.style.width=size+'px';cv.style.height=size+'px';
  ctx=cv.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,size,size);
  ctx.save();ctx.translate(size/2,size/2);ctx.rotate(rot);
  for(var i=0;i<n;i++){
    var col=COLORS[i%COLORS.length];if(n%COLORS.length===1&&i===n-1)col=COLORS[3];
    var a0=-Math.PI/2+i*a,a1=a0+a;
    ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,a0,a1);ctx.closePath();ctx.fillStyle=col[0];ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#0D0D0C';ctx.stroke();
    ctx.save();ctx.rotate(a0+a/2);ctx.fillStyle=col[1];ctx.textAlign='right';ctx.textBaseline='middle';
    var fs=n>16?10:(n>8?12:13);ctx.font='800 '+fs+'px Unbounded, system-ui, sans-serif';
    var t=s.items[i].short;if(n<=8&&t.length>12)t=t.slice(0,11)+'…';ctx.fillText(t,r-10,0);ctx.restore();
  }
  ctx.restore();
  ctx.beginPath();ctx.arc(size/2,size/2,22,0,2*Math.PI);ctx.fillStyle='#0D0D0C';ctx.fill();
  ctx.fillStyle='#C8F31D';ctx.font='800 12px Unbounded, system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('SPIN',size/2,size/2+1);
}
function setResult(i,how){
  var s=STEPS[step],it=s.items[i];last=i;
  if(s.key==='dest'&&it.label==='Other…'){res.dest={text:other||'Other',other:true,i:i}}
  else res[s.key]={text:it.label,i:i,item:it};
  render(false);
  $('wLive').textContent=(how==='spin'?'Spun: ':'Picked: ')+(res[s.key].text)+(res[s.key].other?'. Type your city below.':'');
}
function spin(){
  if(spinning)return;var s=STEPS[step],n=s.items.length,i=rnd(n),a=2*Math.PI/n;
  var target=-(i+.5)*a;while(target<rot+4*2*Math.PI)target+=2*Math.PI;
  if(reduce()){rot=target%(2*Math.PI);draw();setResult(i,'spin');return}
  spinning=true;var from=rot,t0=null,dur=2600;$('wSpin').disabled=true;
  function f(ts){if(!t0)t0=ts;var p=Math.min(1,(ts-t0)/dur),e=1-Math.pow(1-p,3);rot=from+(target-from)*e;draw();
    if(p<1)requestAnimationFrame(f);else{spinning=false;rot=rot%(2*Math.PI);draw();setResult(i,'spin')}}
  requestAnimationFrame(f);
}
function render(redraw){
  var s=STEPS[step],cur=res[s.key],isOther=cur&&cur.other;
  var ready=cur&&(!isOther||other.trim());
  modal.innerHTML='<button class="m-x" type="button" data-wclose aria-label="Close">×</button><div class="m-top"><p class="k" style="margin:0 0 6px">Spin '+(step+1)+' of 3</p><h2 id="wTitle">'+esc(s.title)+'</h2>'+
   '<div class="wchips" role="group" aria-label="Your spins">'+chipsHtml()+'</div>'+
   '<div class="wheel-wrap"><span class="wptr" aria-hidden="true"></span><canvas id="wCanvas" width="300" height="300" aria-hidden="true"></canvas></div>'+
   '<p class="wres" id="wRes" aria-live="polite">'+(cur?'<b>'+esc(cur.text)+'</b>':'Spin the wheel or pick one yourself.')+'</p><p class="sr" id="wLive" role="status" aria-live="polite"></p>'+
   '<div class="wctl"><button type="button" class="btn big" id="wSpin">'+(cur?'Spin again':'Spin it')+'</button>'+
   '<label class="wsel"><span class="sr">Pick one yourself</span><select id="wPick" aria-label="Or pick one yourself"><option value="">Or pick one yourself…</option>'+s.items.map(function(it,i){return '<option value="'+i+'"'+(cur&&cur.i===i?' selected':'')+'>'+esc(it.label)+'</option>'}).join('')+'</select></label></div>'+
   (isOther?'<label class="wother" for="wOther">Type your city, region or country</label><input id="wOther" type="text" maxlength="80" autocomplete="off" placeholder="e.g. Lisbon, Portugal" value="'+esc(other)+'">':'')+
   '<p class="fine" style="margin:10px 0 0">The wheel only picks inputs for the form. Nothing here is generated or recommended.</p></div>'+
   '<div class="m-stub"><button type="button" class="btn m-btn" id="wNext"'+(ready?'':' disabled')+'>'+(step<2?'Next spin →':'Use these in my trip')+'</button><button class="m-sub" type="button" data-wclose>Close</button></div>';
  cv=$('wCanvas');size=Math.min(300,Math.max(220,Math.floor((modal.clientWidth||340)-72)));draw();
  $('wSpin').onclick=spin;
  $('wPick').onchange=function(){if($('wPick').value!=='')setResult(+$('wPick').value,'pick')};
  var o=$('wOther');if(o)o.oninput=function(){other=o.value;res.dest.text=other.trim()||'Other';$('wNext').disabled=!other.trim();[].forEach.call(modal.querySelectorAll('.wchip'),function(c){var i=+c.getAttribute('data-step');if(i===0)c.textContent='1. '+res.dest.text})};
  $('wNext').onclick=next;
  [].forEach.call(modal.querySelectorAll('[data-step]'),function(c){c.onclick=function(){step=+c.getAttribute('data-step');render(true)}});
  if(spinning)$('wSpin').disabled=true;
}
function next(){
  if(step<2){step++;render(true);var sp=$('wSpin');if(sp)sp.focus();return}
  var d=res.dest.other?other.trim():res.dest.text,v=res.vibe&&res.vibe.item,w=res.who&&res.who.item,o={};
  if(d)o.dest=d;if(v&&v.likes)o.likes=v.likes;if(w){o.group=w.group;o.budget=w.budget}
  close();
  if(window.SpunforIntake){window.SpunforIntake.prefill(o);var c=document.getElementById('chat');if(c)c.scrollIntoView({behavior:reduce()?'auto':'smooth',block:'start'});var b=document.getElementById('buildBtn');if(b){var fb=function(){var a=document.activeElement;if(!a||a===document.body||a.tagName==='IFRAME'||a.id==='spinBtn')b.focus({preventScroll:true})};setTimeout(function(){b.focus({preventScroll:true})},reduce()?260:500);setTimeout(fb,1200);setTimeout(fb,2500)}}
}
var opener=null;
function open(){opener=document.activeElement;if(!wrap)build();step=0;res={};other='';last=null;wrap.hidden=false;document.body.style.overflow='hidden';render(true);requestAnimationFrame(function(){wrap.classList.add('on');var s=$('wSpin');if(s)s.focus()})}
function close(){if(!wrap)return;spinning=false;wrap.classList.remove('on');document.body.style.overflow='';setTimeout(function(){wrap.hidden=true},200);if(opener&&opener.focus)try{opener.focus()}catch(e){}}
btn.addEventListener('click',open);
window.SpunforWheel={open:open,close:close};
})();
