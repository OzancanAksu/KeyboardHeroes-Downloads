'use strict';
// Original geometric silhouettes, no third-party artwork or downloaded sprites.
// Matching inventory SVGs and in-arena 2D canvas forms remain editable source assets.
(function(){
 const isLegend=id=>id==='twinaxe'||id==='legendshield';
 const oldHeld=drawHeldWeapon,oldIcon=equipmentIcon,oldVariant=weaponVariantSvg;
 const oldChampion=drawChampion;
 function polygon(c,points,fill,stroke='#29343e',width=2){
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.closePath();c.fillStyle=fill;c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
 }
 function line(c,points,color,width=3){
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.strokeStyle=color;c.lineWidth=width;c.stroke();
 }
 function gem(c,x,y,color){
  polygon(c,[[x,y-10],[x+7,y],[x,y+10],[x-7,y]],color,'#f8eac8',1.5);
  line(c,[[x-2,y-4],[x,y-8],[x+2,y-4]],'#fff9de',1.5);
 }
 function axe(c){
  c.save();
  // Short bronze grips; axe head is a silver sweeping wing on one side,
  // with a square striking hammer behind the poll. NOT a great axe.
  polygon(c,[[-5,18],[-8,-37],[7,-38],[6,18]],'#50392c','#d0ad78',2);
  for(let y=-14;y<17;y+=7)line(c,[[-6,y],[6,y-4]],'#caad79',2);
  polygon(c,[[-3,-48],[-30,-63],[-38,-48],[-34,-24],[-12,-28],[-3,-22]],
   '#c6dadb','#546871',2.5);
  polygon(c,[[-26,-57],[-35,-45],[-31,-31],[-12,-34],[-10,-43]],'#eaf4ed','#9baaa8',1.1);
  line(c,[[-8,-26],[-19,-40],[-21,-54]],'#8aacc1',2);
  polygon(c,[[5,-52],[23,-51],[26,-42],[23,-30],[6,-31]],
   '#826e62','#354551',2.2);
  polygon(c,[[19,-51],[26,-43],[26,-35],[18,-31]],'#b9a28e','#6e7780',1);
  polygon(c,[[-4,-52],[7,-55],[11,-26],[-7,-27]],'#7b8792','#374b57',2);
  gem(c,1,-40,'#87d5da');c.restore();
 }
 function shield(c){
  c.save();
  // Six exterior spikes and a five-rib wide shield, architecturally distinct
  // from old buckler/tower shields and all weapons in the existing catalog.
  const spikes=[[-36,-78,-49,-91,-23,-77],[-12,-91,0,-104,12,-91],
   [23,-77,49,-91,36,-77],[-48,-49,-62,-44,-48,-30],
   [48,-49,62,-44,48,-30],[-22,-2,0,26,22,-2]];
  spikes.forEach(p=>polygon(c,[[p[0],p[1]],[p[2],p[3]],[p[4],p[5]]],'#aab9b7','#394851',2));
  polygon(c,[[-47,-82],[0,-94],[47,-82],[53,-45],[39,-8],[0,14],[-39,-8],[-53,-45]],
   '#394e59','#ddb777',5);
  polygon(c,[[-40,-75],[0,-84],[40,-75],[44,-45],[31,-14],[0,2],[-31,-14],[-44,-45]],
   '#738896','#d4c69c',2);
  polygon(c,[[0,-84],[13,-55],[0,0],[-13,-55]],'#a8bab9','#e6d7a8',2);
  polygon(c,[[-39,-69],[-11,-60],[-12,-20],[-31,-18],[-41,-42]],'#516879','#a3b0b3',1.5);
  polygon(c,[[39,-69],[11,-60],[12,-20],[31,-18],[41,-42]],'#516879','#a3b0b3',1.5);
  line(c,[[-47,-44],[47,-44]],'#e1bb80',5);
  line(c,[[-31,-70],[-23,-27],[-1,6]],'#d4c39a',2);
  line(c,[[31,-70],[23,-27],[1,6]],'#d4c39a',2);
  gem(c,0,-45,'#e9a86e');
  for(const x of [-35,35])for(const y of [-59,-32]){c.beginPath();c.arc(x,y,2.3,0,Math.PI*2);c.fillStyle='#e8d7ad';c.fill();}
  c.restore();
 }
 drawHeldWeapon=function(id,variant=0,active=0,surface=ctx){
  if(!isLegend(id))return oldHeld(id,variant,active,surface);
  surface.save();surface.lineJoin='round';surface.lineCap='round';
  if(id==='twinaxe')axe(surface);else shield(surface);
  if(active>0){surface.globalAlpha=.35;surface.strokeStyle=id==='twinaxe'?'#8ed8df':'#f3c68a';
   surface.lineWidth=2;surface.beginPath();surface.ellipse(0,-40,id==='twinaxe'?34:54,61,0,0,Math.PI*2);surface.stroke();}
  surface.restore();
 };
 drawChampion=function(a){
  oldChampion(a);
  if(a?.gear?.main!=='twinaxe'||a.hp<=0||a.laneRole)return;
  const c=ctx,p=project(a.x,a.y);
  c.save();c.translate(p.x,p.y);c.scale(scale*.59,scale*.59);
  // The second short axe is positioned in the visible left hand, not carried
  // on the back or represented by a merged two-headed great axe.
  c.translate(-25,-31);c.rotate(-.18);c.scale(-.69,.69);
  drawHeldWeapon('twinaxe',0,a.anim>0?.3:0,c);c.restore();
 };
 function svg(id){
  const axeShape=(x,rot)=>'<g transform="translate('+x+' 19) rotate('+rot+' 0 34)"><path d="M-4 34L-6 73L6 73L5 34Z" fill="#634936" stroke="#ebc18c" stroke-width="2"/><path d="M-2 14L-24 6L-34 24L-27 44L-9 38L-1 41Z" fill="#c6dce0" stroke="#637a84" stroke-width="2"/><path d="M-25 15L-31 25L-25 36L-12 32Z" fill="#eff7ed"/><path d="M6 15L24 16L27 33L7 39Z" fill="#a08a7c" stroke="#485b63" stroke-width="2"/><path d="M-4 12L9 11L11 42L-6 42Z" fill="#647989" stroke="#304854" stroke-width="2"/><path d="M0 23L7 31L0 39L-7 31Z" fill="#75d6d6" stroke="#fff4cf" stroke-width="1.5"/></g>';
  const body=id==='twinaxe'
   ?axeShape(33,-13)+axeShape(69,13)
   :'<g transform="translate(50 6)"><path d="M-31 12L-43 2L-21 17M-9 10L0 -3L9 10M21 17L43 2L31 12M-43 37L-50 49L-39 57M43 37L50 49L39 57M-15 83L0 97L15 83" fill="#b5bcb5" stroke="#465964" stroke-width="2"/><path d="M-39 14L0 4L39 14L44 48L31 75L0 91L-31 75L-44 48Z" fill="#344d60" stroke="#e6bc7f" stroke-width="4"/><path d="M-31 21L0 14L31 21L35 47L25 68L0 80L-25 68L-35 47Z" fill="#738d9f" stroke="#d1d4c3" stroke-width="1.6"/><path d="M0 14L15 46L0 80L-15 46Z" fill="#b9c7c6" stroke="#f8d7a1" stroke-width="1.5"/><path d="M-31 43L31 43" stroke="#f1c486" stroke-width="4"/><path d="M0 36L9 46L0 56L-9 46Z" fill="#f3a56b" stroke="#fff0c4" stroke-width="2"/><circle cx="-27" cy="29" r="3" fill="#f5dcae"/><circle cx="27" cy="29" r="3" fill="#f5dcae"/></g>';
  const title=id==='twinaxe'?'İkiz Balta':'Destan Kalkanı';
  return '<svg xmlns="http://www.w3.org/2000/svg" class="weapon-illustration kh308-unique-art" viewBox="0 0 100 110" role="img" aria-label="'+title+' özgün silah çizimi"><rect x="2" y="2" width="96" height="106" rx="17" fill="#142c38" stroke="#ad9874" stroke-width="2"/><circle cx="50" cy="55" r="43" fill="none" stroke="#608a9a" opacity=".4"/>'+body+'</svg>';
 }
 weaponVariantSvg=function(id,index=0){return isLegend(id)?svg(id):oldVariant(id,index);};
 equipmentIcon=function(type,id,variant=0){
  if(type==='main'&&isLegend(id))return '<span class="inventory-art kh308-icon" aria-hidden="true">'+svg(id)+'</span>';
  return oldIcon(type,id,variant);
 };
})();
