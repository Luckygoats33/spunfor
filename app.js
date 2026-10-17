/* Spunfor site script: shared helpers, reveal-on-scroll, business form, hero spiral, demo frame toggle. The intake lives in intake.js. */
(function(){
'use strict';
document.documentElement.classList.remove('no-js');
var $=function(id){return document.getElementById(id)};
var tb=$('talkBtn');if(tb)tb.addEventListener('click',function(e){e.preventDefault();var f=$('talk');f.hidden=!f.hidden;if(!f.hidden)$('tName').focus()});
var tm=$('tMail');if(tm)tm.addEventListener('click',function(){tm.href='mailto:business@spunfor.example?subject='+encodeURIComponent('Spunfor Business enquiry')+'&body='+encodeURIComponent(($('tName').value||'')+'\n\n'+($('tMsg').value||''))});
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

})();
