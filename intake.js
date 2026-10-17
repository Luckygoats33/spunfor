/* Spunfor intake: one free-text box, live editable chips, follow-ups only for what is missing, then build.
   Answers stay in this browser (localStorage spunfor.trip). No analytics, no network. */
(function(){
'use strict';
var P=window.SpunforParse,C=window.SpunforCities;
var $=function(id){return document.getElementById(id)};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ls(k,v){try{if(v===undefined){var x=localStorage.getItem('spunfor.'+k);return x?JSON.parse(x):null}if(v===null)localStorage.removeItem('spunfor.'+k);else localStorage.setItem('spunfor.'+k,JSON.stringify(v))}catch(e){return null}}
var text=$('tripText');if(!text||!P)return;
var chipsEl=$('chips'),moreEl=$('more'),noteEl=$('destNote'),buildBtn=$('buildBtn'),msgEl=$('buildMsg'),afterEl=$('afterBuild');
var ORDER=['dest','dates','flight','likes','dislikes','budget','group','needs'];
var LABEL={dest:'Going to',dates:'Dates',flight:'Flight',likes:'Likes',dislikes:'Avoid',budget:'Budget',group:'Group',needs:'Needs'};
var ASK={dest:['Where are you going?','e.g. Portland, OR',[]],dates:['When?','e.g. next weekend, or Oct 3-7',[]],flight:['Flight (optional)','e.g. AS 123 arrives 3:40pm',['Not booked yet']],likes:['What do you like?','e.g. coffee, jazz, bookstores',[]],dislikes:['Anything to avoid?','e.g. crowds, early mornings',[]],budget:['Budget (optional)','e.g. mid-range, or $150/day',['Budget-friendly','Mid-range','Splurge']],group:['Who’s going? (optional)','e.g. 2 adults',['Solo','Couple','Family','Friends']],needs:['Any needs? (optional)','e.g. vegetarian, step-free access',['Vegetarian','Step-free access']]};
var over={},parsed={},editing=null,t0=null;
function today(){return window.__spunforToday?new Date(window.__spunforToday):new Date()}
function normDest(v){v=String(v||'').trim();if(!v)return '';var c=C&&C.find(v);return c?c.label:(P.tc?P.tc(v):v)}
function eff(k){
  if(Object.prototype.hasOwnProperty.call(over,k))return over[k];
  var v=parsed[k]||'';return v;
}
function destInfo(v){var c=C&&v?(C.find(v)||C.findIn(v)):null;return c}
function datesInfo(v){return v&&P.resolveDates?P.resolveDates(v,today()):null}
function chipText(k,v){
  if(k==='dest'){var c=destInfo(v);return c?c.label:v}
  if(k==='dates'){var r=datesInfo(v);return r?r.label:v}
  return v.length>46?v.slice(0,44)+'…':v;
}
function values(){var o={};ORDER.forEach(function(k){var v=eff(k);if(v&&String(v).trim())o[k]=String(v).trim()});if(o.dest)o.dest=normDest(o.dest);return o}
function renderChips(){
  var vals=values(),h='';
  ORDER.forEach(function(k){
    if(!vals[k])return;
    if(editing===k){h+='<span class="chip editing"><label class="sr" for="chipEdit">Edit '+LABEL[k]+'</label><input id="chipEdit" type="text" maxlength="200" value="'+esc(vals[k])+'" data-k="'+k+'"><button type="button" class="chip-ok" data-save="'+k+'" aria-label="Save">✓</button><button type="button" class="chip-x" data-rm="'+k+'" aria-label="Remove '+LABEL[k]+'">×</button></span>';return}
    var warn=(k==='dest'&&!destInfo(vals[k]))||(k==='dates'&&!datesInfo(vals[k])),cls='chip'+(warn?' warn':'');
    h+='<button type="button" class="'+cls+'" data-edit="'+k+'" aria-label="Edit '+LABEL[k]+': '+esc(chipText(k,vals[k]))+'"><b>'+LABEL[k]+'</b> '+esc(chipText(k,vals[k]))+'</button>';
  });
  chipsEl.innerHTML=h;chipsEl.hidden=!h;
  if(editing){var inp=$('chipEdit');if(inp){inp.focus();inp.select&&inp.select()}}
  var dv=vals.dest,c=destInfo(dv);
  if(dv&&!c){noteEl.hidden=false;noteEl.textContent=dv+' isn’t a launch city yet: not yet supported, so you’ll get a starter plan with no map.'}
  else if(c&&c.demo){noteEl.hidden=false;noteEl.textContent='New Orleans has a full interactive demo; after you unlock you can open it, plus your own starter plan.'}
  else if(c){noteEl.hidden=false;noteEl.textContent=c.name+' is a launch city: you’ll get a starter plan with a map. Hand-built venue data is still to come.'}
  else noteEl.hidden=true;
}
/* follow-up rows only for what the text did not give us. Built when the parsed set changes, not on every keystroke. */
var rowKeys='';
function renderMore(force){
  var has=text.value.trim().length>0||Object.keys(over).length>0;
  var missing=has?ORDER.filter(function(k){return !parsed[k]||over[k]===''}):[];
  var key=missing.join(',');if(key===rowKeys&&!force)return;rowKeys=key;
  moreEl.hidden=!missing.length;
  moreEl.innerHTML=missing.length?'<p class="more-h">Only what’s missing</p>'+missing.map(function(k){
    var a=ASK[k],v=Object.prototype.hasOwnProperty.call(over,k)?over[k]:'';
    return '<div class="mrow" data-row="'+k+'"><label for="mf-'+k+'">'+a[0]+(k==='dest'?' <i>required</i>':'')+'</label><div class="mrow-in"><input id="mf-'+k+'" data-mf="'+k+'" type="text" maxlength="200" placeholder="'+esc(a[1])+'" autocomplete="off" value="'+esc(v)+'"'+(k==='dest'?' list="cityList"':'')+'>'+
     (a[2].length?'<span class="mq">'+a[2].map(function(q){return '<button type="button" data-q="'+k+'" data-v="'+esc(q)+'">'+esc(q)+'</button>'}).join('')+'</span>':'')+'</div></div>'}).join('')+'<datalist id="cityList">'+(C?C.cities.filter(function(c){return !c.demo}).map(function(c){return '<option value="'+esc(c.label)+'">'}).join('')+'<option value="New Orleans, LA">':'')+'</datalist>':'';
}
var timer=null;
function onText(){
  parsed=P.parseTrip(text.value)||{};
  /* removed or edited chips stay as the user left them; everything else follows the text */
  renderChips();renderMore();msgEl.textContent='';
}
text.addEventListener('input',function(){clearTimeout(timer);timer=setTimeout(onText,120)});
chipsEl.addEventListener('click',function(e){
  var b=e.target.closest('[data-edit]');if(b){editing=b.getAttribute('data-edit');renderChips();return}
  var s=e.target.closest('[data-save]');if(s){commitEdit(s.getAttribute('data-save'));return}
  var r=e.target.closest('[data-rm]');if(r){over[r.getAttribute('data-rm')]='';editing=null;renderChips();renderMore(true)}
});
chipsEl.addEventListener('keydown',function(e){
  if(e.target.id!=='chipEdit')return;
  if(e.key==='Enter'){e.preventDefault();commitEdit(e.target.getAttribute('data-k'))}
  if(e.key==='Escape'){e.preventDefault();editing=null;renderChips()}
});
function commitEdit(k){var i=$('chipEdit');var v=i?i.value.trim():'';over[k]=v;editing=null;renderChips();renderMore(true)}
moreEl.addEventListener('input',function(e){var k=e.target.getAttribute&&e.target.getAttribute('data-mf');if(!k)return;var v=e.target.value.trim();if(v)over[k]=v;else delete over[k];renderChips()});
moreEl.addEventListener('click',function(e){var q=e.target.closest('[data-q]');if(!q)return;var k=q.getAttribute('data-q'),v=q.getAttribute('data-v');over[k]=v;var i=$('mf-'+k);if(i)i.value=v;renderChips()});
/* ---------- build ---------- */
function build(){
  var d=values();
  if(!text.value.trim()&&!Object.keys(d).length){msgEl.textContent='Tell us a bit about your trip first.';text.focus();return}
  if(!d.dest){msgEl.textContent='Where are you going? Add a destination to build your app.';var i=$('mf-dest');if(!i){renderMore(true);i=$('mf-dest')}if(i)i.focus();return}
  var r=datesInfo(d.dates);
  if(r){if(r.start){d.start=r.start;d.end=r.end}d.dateLabel=r.label;if(r.approx)d.approxDates=true}
  var c=destInfo(d.dest);if(c)d.cityKnown=true;
  ls('trip',d);try{sessionStorage.setItem('spunfor.trip',JSON.stringify(d))}catch(e){}
  var url='preview.html',w=null;
  try{w=window.open(url,'_blank')}catch(e){w=null}
  if(w&&!w.closed){try{w.opener=null}catch(e){}
    msgEl.textContent='Your preview opened in a new tab.';
    afterEl.innerHTML='<a class="btn small" id="pvLink" href="'+url+'" target="_blank" rel="noopener">Open my preview again</a>';
  }else{msgEl.textContent='Taking you to your preview…';setTimeout(function(){location.href=url},350)}
}
buildBtn.addEventListener('click',build);
text.addEventListener('keydown',function(e){if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();build()}});
$('restart').addEventListener('click',function(){text.value='';over={};parsed={};editing=null;rowKeys='';afterEl.innerHTML='';msgEl.textContent='';renderChips();renderMore(true);ls('trip',null);text.focus()});
/* hook for the home page wheel (item 2): prefill chips, then the same build flow */
window.SpunforIntake={prefill:function(o){Object.keys(o||{}).forEach(function(k){if(ORDER.indexOf(k)>-1&&o[k])over[k]=String(o[k])});renderChips();renderMore(true)},values:values,build:build,setText:function(t){text.value=t;onText()}};
onText();
})();
