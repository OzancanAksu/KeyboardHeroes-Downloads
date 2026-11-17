'use strict';
// v3.2.0 — original, editable paired weapon silhouettes for inventory and arena.
(function(){
 const originals=new Set(['feardagger','boxinggloves']);
 const oldHeld=drawHeldWeapon,oldChampion=drawChampion;
 const oldIcon=equipmentIcon,oldVariant=weaponVariantSvg;
 function poly(c,points,fill,edge='#263746',width=2){
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
  c.fillStyle=fill;c.strokeStyle=edge;c.lineWidth=width;c.fill();c.stroke();
 }
 function line(c,points,color,width=2){
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.strokeStyle=color;c.lineWidth=width;c.stroke();
 }
 function fearBlade(c){
  c.save();
  // A thin bat-wing hooked dagger: asymmetrical serrations and skull crossguard.
  poly(c,[[-4,18],[-8,-17],[-1,-23],[7,-17],[5,18]],'#442c42','#e4a6b5',2);
  for(let y=0;y<15;y+=5)line(c,[[-6,y],[6,y-3]],'#de8596',1.5);
  poly(c,[[-8,-18],[-19,-27],[-12,-32],[0,-28],[13,-34],[20,-26],[7,-17]],
   '#78506c','#ed94af',2);
  poly(c,[[-6,-22],[-13,-48],[-26,-62],[-23,-79],[-11,-96],[-13,-68],[0,-80],
   [10,-100],[15,-79],[9,-65],[13,-47],[5,-22]],
   '#6a344d','#f09bae',2.6);
  poly(c,[[-7,-30],[-6,-61],[0,-75],[6,-62],[5,-30]],'#e384a0','#fcbdc1',1.3);
  line(c,[[0,-72],[0,-36]],'#ffdfd5',2.4);
  c.beginPath();c.arc(0,-21,6,0,Math.PI*2);c.fillStyle='#dfc4a7';c.fill();c.strokeStyle='#843c57';c.stroke();
  for(const x of [-2.6,2.6]){c.beginPath();c.arc(x,-22,1.3,0,Math.PI*2);c.fillStyle='#b23650';c.fill();}
  c.restore();
 }
 function punchGlove(c){
  c.save();
  // Coiled heavy boxing leather, four padded knuckles and strapped cuff.
  poly(c,[[-19,18],[-23,-5],[-29,-19],[-23,-38],[-21,-61],[-10,-73],[14,-73],
   [25,-64],[27,-42],[20,-24],[13,-15],[14,18]],
   '#a7453e','#f2af75',3);
  poly(c,[[-20,-52],[-16,-68],[-6,-74],[14,-71],[21,-60],[18,-45],[-4,-40]],
   '#e56a46','#f5b780',1.5);
  for(const x of [-14,-3,8,18])line(c,[[x,-62],[x+1,-49]],'#9c443d',1.7);
  poly(c,[[-24,-40],[-33,-34],[-29,-20],[-19,-17],[-10,-28]],
   '#cc5846','#ec997a',2);
  poly(c,[[-22,-9],[16,-9],[18,16],[-20,16]],'#693a39','#e8c099',2.5);
  poly(c,[[-20,-8],[17,-8],[17,-1],[-20,-1]],'#f4cd9e','#f9dfb6',1.2);
  poly(c,[[-3,-9],[5,-9],[6,12],[-3,12]],'#e4ba78','#f5d5a0',1.3);
  line(c,[[-14,-34],[-1,-29],[12,-35]],'#ffc59a',2);
  c.restore();
 }
 drawHeldWeapon=function(id,variant=0,active=0,surface=ctx){
  if(!originals.has(id))return oldHeld(id,variant,active,surface);
  surface.save();surface.lineJoin='round';surface.lineCap='round';
  if(id==='feardagger')fearBlade(surface);else punchGlove(surface);
  if(active>0){surface.strokeStyle=id==='feardagger'?'#f178b4':'#f6c59a';
   surface.globalAlpha=.35;surface.lineWidth=2;surface.beginPath();
   surface.ellipse(0,-45,29,50,0,0,Math.PI*2);surface.stroke();}
  surface.restore();
 };
 drawChampion=function(a){
  oldChampion(a);
  if(a?.hp<=0||a?.laneRole||!originals.has(a?.gear?.main))return;
  const c=ctx,p=project(a.x,a.y);
  c.save();c.translate(p.x,p.y);c.scale(scale*.59,scale*.59);
  c.translate(-26,-30);c.rotate(-.21);c.scale(-.72,.72);
  drawHeldWeapon(a.gear.main,0,a.anim>0?.25:0,c);c.restore();
 };
 const paint=(p)=>p.replace(/<(?:path|rect|circle|polygon|ellipse)\b[^>]*>/g,tag=>{
  const fill=/\sfill="([^"]+)"/.exec(tag)?.[1],stroke=/\sstroke="([^"]+)"/.exec(tag)?.[1];
  if(!fill&&!stroke)return tag;
  return tag.replace(/(\/?>)$/,' style="'+(fill?'fill:'+fill+' !important;':'')+(stroke?'stroke:'+stroke+' !important;':'')+'" $1');
 });
 function icon(id){
  const hilt='<path d="M-3 13L-6 31L5 31L4 12Z" fill="#5e3545" stroke="#edacbc" stroke-width="1.5"/><path d="M-15 6L0 12L16 5L11 0L0 3L-10 -1Z" fill="#81455b" stroke="#f2a8b8" stroke-width="1.3"/><circle cx="0" cy="11" r="5" fill="#ddcbb2" stroke="#a65d74"/>';
  const blade='<path d="M-6 5L-12 -24L-23 -37L-19 -52L-8 -68L-10 -40L0 -55L10 -67L15 -50L9 -33L8 -13L5 5Z" fill="#6e344f" stroke="#f09bae" stroke-width="2"/><path d="M-2 4L-5 -38L0 -52L5 -39L3 4Z" fill="#f395ad" stroke="#ffdade" stroke-width="1.1"/>';
  const glove='<path d="M-17 31L-21 7L-28 -3L-25 -25L-17 -39L12 -41L25 -32L28 -12L18 8L17 31Z" fill="#ae473f" stroke="#f2bd8d" stroke-width="2.4"/><path d="M-20 -18L-17 -37L-2 -46L15 -40L23 -24L16 -13L-12 -11Z" fill="#eb714f" stroke="#ffd29e" stroke-width="1.5"/><path d="M-19 12L17 12L18 28L-17 28Z" fill="#633b3c" stroke="#edc393" stroke-width="2"/><path d="M-15 15L13 15" stroke="#f8d9a4" stroke-width="4"/><path d="M-10 -30L-9 -13M0 -33L0 -12M10 -31L10 -12" stroke="#a74841" stroke-width="1.5" fill="none"/>';
  const pair=id==='feardagger'
   ?'<g transform="translate(27 43) rotate(-18)">'+hilt+blade+'</g><g transform="translate(73 43) rotate(18)">'+hilt+blade+'</g>'
   :'<g transform="translate(29 44) rotate(-13)">'+glove+'</g><g transform="translate(71 44) rotate(13)">'+glove+'</g>';
  const label=id==='feardagger'?'Korku Hançeri':'Boks Eldiveni';
  return paint('<svg class="weapon-illustration kh320-unique-art" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110" role="img" aria-label="'+label+' özgün çift silah çizimi"><rect x="2" y="2" width="96" height="106" rx="15" fill="#162330" stroke="'+(id==='feardagger'?'#b75d8d':'#bd835a')+'" stroke-width="2"/><circle cx="50" cy="56" r="41" fill="none" stroke="'+(id==='feardagger'?'#794b78':'#a36e58')+'" opacity=".55"/>'+pair+'</svg>');
 }
 weaponVariantSvg=function(id,index=0){return originals.has(id)?icon(id):oldVariant(id,index);};
 equipmentIcon=function(type,id,variant=0){
  if(type==='main'&&originals.has(id))return '<span class="inventory-art kh320-icon" aria-hidden="true">'+icon(id)+'</span>';
  return oldIcon(type,id,variant);
 };
})();
