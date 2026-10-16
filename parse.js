/* Spunfor intake parser: pulls flight, dates, destination, likes, avoid, budget, group and needs out of free text.
   Each field only ever gets its own clause; anything that matched nothing is left out. Pure functions, no network. */
(function(root){
'use strict';
var ALIAS={pdx:'Portland, OR',msy:'New Orleans',nola:'New Orleans',sfo:'San Francisco',lax:'Los Angeles',jfk:'New York',lga:'New York',nyc:'New York',sea:'Seattle',den:'Denver',ord:'Chicago',atl:'Atlanta',bos:'Boston',aus:'Austin',las:'Las Vegas',mia:'Miami',dca:'Washington, DC',phx:'Phoenix',dfw:'Dallas',iah:'Houston',slc:'Salt Lake City',san:'San Diego',bna:'Nashville'};
var AMBIG={sea:1,san:1,den:1,las:1,aus:1,mia:1,ord:1};
var IDK=/^\s*(idk|i don'?t know|dunno|not sure( yet)?|no idea|skip|none|no|nope|nah|n\/a|nothing|nothing in particular|\?+|-+|\.+)\s*[.!]?\s*$/i;
var STOP={for:1,with:1,on:1,from:1,and:1,til:1,till:1,until:1,thru:1,through:1,next:1,this:1,the:1,a:1,my:1,our:1,we:1,i:1,then:1,back:1,returning:1,leaving:1,arriving:1,at:1,by:1,but:1,so:1,around:1,about:1,during:1,mid:1,early:1,late:1,after:1,before:1,because:1,when:1,while:1,that:1,is:1,are:1,it:1,to:1,in:1,into:1,of:1,'-':1,'–':1};
var NOTDEST=/^(home|town|work|there|here|it|them|us|bed|sleep|weekend|week|night|nowhere|somewhere|anywhere|vacation|holiday|trip|time|day|days|nights|new|old)$/i;
var DAYS={mon:'Mon',tue:'Tue',tues:'Tue',wed:'Wed',weds:'Wed',thu:'Thu',thur:'Thu',thurs:'Thu',fri:'Fri',sat:'Sat',sun:'Sun'};
var DAYRE=/\b(mon|tues?|wed(?:nes)?|weds|thu(?:rs?)?|fri|sat(?:ur)?|sun)(?:day)?s?\b/gi;
var MONS='jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?';
var MONRE=new RegExp('^(?:'+MONS+')$','i');
var SEP='(?:–|—|-|to|til|till|until|thru|through)';
var RANGE=new RegExp('\\b\\d{1,2}\\s*(?:'+MONS+')\\.?\\s*'+SEP+'\\s*\\d{1,2}\\s*(?:'+MONS+')\\b|\\b(?:'+MONS+')\\.?\\s*\\d{1,2}(?:\\s*'+SEP+'\\s*(?:(?:'+MONS+')\\.?\\s*)?\\d{1,2})?\\b|\\b\\d{1,2}\\s*(?:st|nd|rd|th)?\\s*'+SEP+'\\s*\\d{1,2}(?:\\s*(?:'+MONS+'))?\\b|\\b\\d{1,2}\\/\\d{1,2}(?:\\s*'+SEP+'\\s*\\d{1,2}\\/\\d{1,2})?\\b','i');
var REL=new RegExp('\\b(?:(?:this|next|last)\\s+(?:weekend|week|month)|tomorrow|tonight|(?:a|an|one|two|three|four|five|\\d+)\\s+(?:weekend|weeks?|days?|nights?)(?:\\s+(?:in|this|next|around|for)\\s+(?:'+MONS+'|[a-z]+))?|(?:in|during|early|late|mid|for|this)[ -]?(?:'+MONS+')(?:\\s+\\d{4})?)\\b','i');
var DISL=/\b(avoid|hate|dislike|don'?t like|do not like|can'?t stand|sick of|not into|no)\b(?:\s+(?:to\s+)?)(.+)$/i;
var LIKE=/\b(love|loves|like|likes|i'?m into|we'?re into|enjoy|enjoys|obsessed with|want to see|craving|interested in)\b\s+(.+)$/i;
var NEEDV=/\b(?:need|needs|require|requires)\s+(.+)$/i;
var NEEDW=/\b(vegetarian|vegan|gluten[- ]?free|gluten|allerg\w*|wheelchair|accessib\w*|step[- ]free|mobility|dietary|kosher|halal|pescatarian|lactose|celiac)\b.*$/i;
var BUDGET=/\bbudget(?:\s+(?:is|of|around|about|:))?\s*(.+)$/i;
var BUDW=/\b(cheap|affordable|inexpensive|mid[- ]?range|splurge|luxury|shoestring|\$\s?\d[\d,]*(?:\s*\/\s*(?:day|night|person)|\s*(?:a|per)\s*(?:day|night|person)|\s*total)?)/i;
var GROUP=/\b(solo|by myself|alone|couple|my (?:wife|husband|partner|girlfriend|boyfriend|spouse|kids?)|with (?:my |our |the )?(?:wife|husband|partner|kids?|family|friends?|parents|mom|dad|girlfriend|boyfriend)|family|\d+\s+(?:adults?|people|of us)|two of us|just us|friends)\b/i;
var FLIGHTCODE=/\b[A-Z]{2}\s?\d{2,4}\b/;
var FLIGHTCUE=/\b(flight|flights|airline|airport|lands?|landing|arrives?|arriving|departs?|departing|not booked|layover|connection|connecting|terminal|delta|united|alaska|southwest|american airlines|jetblue|spirit|frontier)\b/i;

function tc(s){
  s=String(s||'').replace(/\s+/g,' ').trim().replace(/^[,.;:\s]+|[,.;:\s]+$/g,'');
  if(!s)return '';
  if(s!==s.toLowerCase())return s;
  return s.replace(/,\s*([a-z]{2})$/,function(m,x){return ', '+x.toUpperCase()}).replace(/(^|[\s'’-])([a-z])/g,function(m,a,b){return a+b.toUpperCase()}).replace(/\b(Of|De|La|Le|Del|And)\b(?!$)/g,function(x){return x.toLowerCase()}).replace(/^(.)/,function(c){return c.toUpperCase()});
}
function cap(s){s=String(s||'').trim();return s.charAt(0).toUpperCase()+s.slice(1)}
function day(m){var k=m.toLowerCase().replace(/day$|sday$/,'').replace(/^(tues|thur|thurs|weds)$/,function(x){return x});var key=m.toLowerCase().slice(0,3);return DAYS[key]||DAYS[m.toLowerCase()]||cap(m)}
function stripTrail(s){return String(s||'').replace(/[\s,.;:!]+$/,'').replace(/\s+(?:and|but|&|plus)$/i,'').replace(/[\s,.;:!]+$/,'').trim()}
function capMonths(s){return s.replace(new RegExp('\\b('+MONS+')\\b','gi'),function(x){return cap(x.toLowerCase())})}

/* dates: returns [text,remainderWithDatesRemoved] or null. noSingleDay: do not treat a lone weekday as dates (it is probably a flight time). */
function dates(t,noSingleDay){
  var m=t.match(RANGE);
  if(m)return [cap(stripTrail(m[0]).replace(/\s*(?:-|–|—)\s*/,'–')),t.replace(m[0],' ')];
  var days=[],r;DAYRE.lastIndex=0;
  while((r=DAYRE.exec(t)))days.push({s:r[0],i:r.index,d:day(r[1])});
  if(days.length>=2){
    var a=days[0],b=days[1],out=t,pre=t.slice(0,b.i).match(/(?:\s*(?:–|—|-|to|til|till|until|thru|through)\s*)$/i);
    var cutB=pre?b.i-pre[0].length:b.i;
    out=t.slice(0,a.i)+' '+t.slice(a.i+a.s.length,cutB)+' '+t.slice(b.i+b.s.length);
    return [a.d+' to '+b.d,out];
  }
  var rm=t.match(REL);
  if(rm)return [capMonths(cap(stripTrail(rm[0]))),t.replace(rm[0],' ')];
  if(days.length===1&&!noSingleDay){var one=days[0],pre1=t.slice(0,one.i).match(/\b(til|till|until|thru|through|by)\s*$/i);
    return [(pre1?'Through ':'')+one.d,pre1?t.slice(0,one.i-pre1[0].length)+' '+t.slice(one.i+one.s.length):t.replace(one.s,' ')]}
  return null;
}

/* destination from text (dates etc. already removed). */
function dest(t,allowAlias,bare){
  var words=t.replace(/[“”"()]/g,' ').split(/\s+/).filter(Boolean),i,j;
  var VERBS={to:1,in:1,into:1,visiting:1,visit:1};
  function place(start){
    var out=[],k=start,sawAnd=false;
    for(;k<words.length;k++){
      var raw=words[k],w=raw.replace(/^[,.;:!]+|[,.;:!]+$/g,''),lw=w.toLowerCase(),endsPunct=/[,.;:!]$/.test(raw);
      if(!w)break;
      if(lw==='and'||lw==='&'||lw==='then'){
        if(out.length&&k+1<words.length&&!STOP[words[k+1].toLowerCase()]&&!/^\d/.test(words[k+1])&&!MONRE.test(words[k+1])&&!DAYS[words[k+1].toLowerCase().slice(0,3)]){out.push('and');continue}
        break;
      }
      if(STOP[lw]||/\d/.test(w)||MONRE.test(w)||(DAYS[lw.slice(0,3)]&&/^(mon|tue|wed|thu|fri|sat|sun)/.test(lw)&&w.length<=9))break;
      if(out.length>=4)break;
      var next=words[k+1]?words[k+1].replace(/^[,.;:!]+|[,.;:!]+$/g,''):'';
      out.push(ALIAS[lw]&&(allowAlias||/^[A-Z]{3}$/.test(w))&&!(AMBIG[lw]&&!/^[A-Z]{3}$/.test(w))?ALIAS[lw]:w);
      if(endsPunct){ if(/^[A-Za-z]{2}$/.test(next)&&words[k+1]&&!/[.;!]/.test(raw)){out[out.length-1]=out[out.length-1].replace(/[,.;:!]+$/,'')+',';out.push(next.toUpperCase());k++;} break; }
    }
    while(out.length&&out[out.length-1]==='and')out.pop();
    var s=out.join(' ').replace(/\s+,/g,',').replace(/,,/g,',');
    return s;
  }
  var best='',verbRank=-1;
  for(i=0;i<words.length;i++){
    var lw=words[i].toLowerCase().replace(/[^a-z]/g,'');
    var rank=0,start=i+1;
    if(lw==='to'||lw==='in'||lw==='into'||lw==='visiting'||lw==='visit'||lw==='heading'||lw==='headed'||lw==='going'||lw==='off'||lw==='trip'||lw==='fly'||lw==='flying'||lw==='travel'||lw==='traveling'||lw==='travelling'||lw==='vacation'||lw==='holiday'||lw==='stay'||lw==='staying'){
      rank=(lw==='to'||lw==='in'||lw==='into')?1:2;
      if(rank===2){ // verb: skip following "to"/"in"/"into"
        var n=words[i+1]&&words[i+1].toLowerCase();
        if(n==='to'||n==='in'||n==='into')start=i+2; else if(lw==='trip'||lw==='vacation'||lw==='holiday')continue; else if(lw!=='visiting'&&lw!=='visit')continue;
      }
      var p=place(start);
      if(!p)continue;
      var first=p.split(/\s+/)[0];
      if(NOTDEST.test(p)||(p.split(/\s+/).length===1&&NOTDEST.test(first)))continue;
      if(rank>verbRank||(rank===verbRank&&rank===1&&true)){best=p;verbRank=rank}
    }
  }
  if(!best&&allowAlias){
    for(i=0;i<words.length;i++){var w=words[i].replace(/[^A-Za-z]/g,'');if(ALIAS[w.toLowerCase()]&&(!AMBIG[w.toLowerCase()]||/^[A-Z]{3}$/.test(w))&&words.length<=4){best=ALIAS[w.toLowerCase()];break}}
  }
  if(!best&&bare){
    var rem=t.replace(/[“”"()]/g,' ').replace(/[\/]+/g,' ').replace(/\s+/g,' ').trim().replace(/^[,.;:\s]+|[,.;:\s]+$/g,'');
    var ws=rem.split(/[\s,]+/).filter(Boolean);
    if(rem&&ws.length<=4&&!/\d/.test(rem)&&!ws.some(function(w){var l=w.toLowerCase();return STOP[l]&&l!=='and'})&&!/\b(driving|drive|train|bus|car|instead|booked|yet|maybe|idk|unsure|flying|fly|plane|none|nothing|skip|vegetarian)\b/i.test(rem)&&!NOTDEST.test(rem))best=ALIAS[rem.toLowerCase()]||rem;
  }
  return best?tc(best):'';
}

/* split off one regex-matched tail; returns [captured,prefix] */
function tail(t,re,g){var m=t.match(re);if(!m)return null;var cut=m[g||2];return [stripTrail(cut),t.slice(0,m.index)]}

function parseTrip(text){
  var out={},src=String(text||'').trim().replace(/\bw\/\s*/gi,'with ').replace(/([a-z])\s+2\s+(?=[a-z])(?!(?:adults?|people|nights?|days?|of)\b)/gi,'$1 to ');
  if(!src)return out;
  var oneish=src.split(/\s+/).length<=4;
  var clauses=src.split(/[.;!?\n]+|,\s*(?=(?:and\s+)?(?:i|we|also|but|my)\b)/i).map(function(c){return c.replace(/^\s*(and|but|also|then|plus|so)\s+/i,'').trim()}).filter(Boolean);
  clauses.forEach(function(c0){
    var t=c0,m,r;
    if(IDK.test(t))return;
    var hasCode=FLIGHTCODE.test(t),isFlight=hasCode||FLIGHTCUE.test(t);
    if((r=tail(t,DISL,2))&&r[0]){if(!out.dislikes)out.dislikes=r[0].replace(/^(?:to\s+)/i,'');t=r[1]}
    if((r=tail(t,LIKE,2))&&r[0]&&!/^(to (?:go|stay|visit|see|be)\b)/i.test(r[0])){if(!out.likes)out.likes=r[0];t=r[1]}
    if((m=t.match(GROUP))){if(!out.group)out.group=cap(stripTrail(m[0]).replace(/^with\s+/i,'With '));t=t.replace(m[0],' ')}
    if((m=t.match(NEEDV))&&NEEDW.test(m[1])||(m=t.match(NEEDV))&&!isFlight&&!/\b(a (?:break|vacation|holiday))\b/i.test(m[1])){if(!out.needs)out.needs=cap(stripTrail(m[1]).replace(/\s+and\s+(?:travell?ing|going|traveling)\s*$/i,''));t=t.slice(0,m.index)}
    else if((m=t.match(NEEDW))){if(!out.needs)out.needs=cap(stripTrail(m[0]).replace(/\s+and\s+(?:travell?ing|going|traveling)\s*$/i,''));t=t.slice(0,m.index)}
    if((m=t.match(BUDGET))){if(!out.budget)out.budget=stripTrail(m[1]);t=t.slice(0,m.index)}
    else if((m=t.match(BUDW))){if(!out.budget)out.budget=cap(stripTrail(m[0]));t=t.replace(m[0],' ')}
    var d=dates(t,isFlight);
    if(d){if(!out.dates)out.dates=d[0];t=d[1]}
    if(isFlight&&!out.flight)out.flight=stripTrail(c0.replace(DISL,'').replace(LIKE,''));
    var ds=dest(t,!hasCode&&oneish,!isFlight&&oneish&&clauses.length===1);
    if(ds&&!out.dest)out.dest=ds;
  });
  return out;
}

/* Normalise a single answer to its own field. */
function answer(k,val){
  val=String(val||'').trim();
  if(!val||IDK.test(val))return '';
  if(k==='dest'){var d=dest('to '+val.replace(/^(?:to|going to|in)\s+/i,''),true);return d||tc(val.replace(/^(?:to|going to|in)\s+/i,''))}
  if(k==='dates'){var r=dates(val,false);return r?r[0]:cap(val)}
  return val;
}
var api={parseTrip:parseTrip,answer:answer,tc:tc,IDK:IDK};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SpunforParse=api;
})(typeof window!=='undefined'?window:this);
