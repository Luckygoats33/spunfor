/* Spunfor launch cities: top 25 US cities by population + Portland, OR, plus New Orleans (the sample demo).
   lat/lon are approximate city-center coordinates, used only to center a map. No venue data lives here. */
(function(root){
'use strict';
var L=[
 ['New York','NY',40.7128,-74.0060,['nyc','new york city','manhattan','brooklyn','jfk','lga','ewr'],'New York, NY'],
 ['Los Angeles','CA',34.0522,-118.2437,['la','lax','l.a.'],'Los Angeles, CA'],
 ['Chicago','IL',41.8781,-87.6298,['ord','mdw','chi-town'],'Chicago, IL'],
 ['Houston','TX',29.7604,-95.3698,['iah','hou'],'Houston, TX'],
 ['Phoenix','AZ',33.4484,-112.0740,['phx'],'Phoenix, AZ'],
 ['Philadelphia','PA',39.9526,-75.1652,['philly','phl'],'Philadelphia, PA'],
 ['San Antonio','TX',29.4241,-98.4936,['sat'],'San Antonio, TX'],
 ['San Diego','CA',32.7157,-117.1611,[],'San Diego, CA'],
 ['Dallas','TX',32.7767,-96.7970,['dfw','dal'],'Dallas, TX'],
 ['Jacksonville','FL',30.3322,-81.6557,['jax'],'Jacksonville, FL'],
 ['Fort Worth','TX',32.7555,-97.3308,['ft worth'],'Fort Worth, TX'],
 ['San Jose','CA',37.3382,-121.8863,['sjc'],'San Jose, CA'],
 ['Austin','TX',30.2672,-97.7431,['aus'],'Austin, TX'],
 ['Charlotte','NC',35.2271,-80.8431,['clt'],'Charlotte, NC'],
 ['Columbus','OH',39.9612,-82.9988,['cmh'],'Columbus, OH'],
 ['Indianapolis','IN',39.7684,-86.1581,['indy','ind'],'Indianapolis, IN'],
 ['San Francisco','CA',37.7749,-122.4194,['sf','sfo','frisco'],'San Francisco, CA'],
 ['Seattle','WA',47.6062,-122.3321,['sea','sea-tac'],'Seattle, WA'],
 ['Denver','CO',39.7392,-104.9903,['den'],'Denver, CO'],
 ['Oklahoma City','OK',35.4676,-97.5164,['okc'],'Oklahoma City, OK'],
 ['Nashville','TN',36.1627,-86.7816,['bna'],'Nashville, TN'],
 ['Washington','DC',38.9072,-77.0369,['dc','washington dc','washington d.c.','dca','iad'],'Washington, DC'],
 ['El Paso','TX',31.7619,-106.4850,['elp'],'El Paso, TX'],
 ['Las Vegas','NV',36.1699,-115.1398,['vegas','las','lv'],'Las Vegas, NV'],
 ['Boston','MA',42.3601,-71.0589,['bos'],'Boston, MA'],
 ['Portland','OR',45.5152,-122.6784,['pdx','portland or','portland oregon','portland, oregon','stumptown'],'Portland, OR'],
 ['New Orleans','LA',29.9511,-90.0715,['nola','msy','the big easy','n.o.'],'New Orleans, LA']
];
var cities=L.map(function(r){return {name:r[0],state:r[1],lat:r[2],lon:r[3],aliases:r[4],label:r[5],demo:r[0]==='New Orleans'}});
var AIRPORT_ONLY={sea:1,las:1,den:1,aus:1,sat:1,ind:1,dal:1,hou:1,la:1,sf:1,dc:1,lv:1,chi:1,elp:1};
function norm(s){return String(s||'').toLowerCase().replace(/[.]/g,'').replace(/[^a-z0-9, ]+/g,' ').replace(/\s+/g,' ').trim()}
/* find(text): returns a city object or null. Matches "Portland", "Portland, OR", "pdx", "nyc", "new orleans la"... */
function find(text){
  var t=norm(text);if(!t)return null;
  var i,c,a;
  for(i=0;i<cities.length;i++){c=cities[i];
    var n=norm(c.name),full=n+', '+c.state.toLowerCase(),full2=n+' '+c.state.toLowerCase();
    if(t===n||t===full||t===full2)return c}
  for(i=0;i<cities.length;i++){c=cities[i];
    for(a=0;a<c.aliases.length;a++){if(norm(c.aliases[a])===t)return c}}
  return null;
}
/* findIn(text): first city mentioned inside a longer string (only multi-letter names, never bare 2-3 letter codes). */
function findIn(text){
  var t=' '+norm(text)+' ',best=null,bi=1e9;
  cities.forEach(function(c){
    [norm(c.name)].concat(c.aliases.filter(function(x){return norm(x).length>=4}).map(norm)).forEach(function(n){
      var k=t.indexOf(' '+n+' ');if(k>-1&&k<bi){bi=k;best=c}})});
  return best;
}
var api={cities:cities,find:find,findIn:findIn,norm:norm,byName:function(n){return find(n)}};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SpunforCities=api;
})(typeof window!=='undefined'?window:this);
