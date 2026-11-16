'use strict';
// Comprehensive combat-budget and corridor regression, shared with online VM.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const names=['equipment','world','navigation','presentation','game','loadout','accessories','weapons','combat-feel','battle-scale','weapon-identity','compact-draft','targeting','spell-catalog','catalog-weapons','catalog-expansion','weapon-variants-core','combat-tactics','tactical-abilities','support-role','objectives','maps','lanes','spell-art','expansion','deathmatch','potions','combat-balance','multiplayer-rules','arena-update','gear-v3','gear-v4','gear-v5','relic-maze','balance-v6'];
const c=new Proxy({},{get:(o,k)=>o[k]||(()=>({addColorStop(){}}))});
const cache=new Map(),el=s=>{if(!cache.has(s))cache.set(s,{style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},getBoundingClientRect:()=>({width:950,height:650}),getContext:()=>c,addEventListener(){},focus(){},textContent:'',value:'test',innerHTML:''});return cache.get(s);};
const box={document:{querySelector:el,querySelectorAll:()=>[]},window:{addEventListener(){}},ResizeObserver:class{observe(){}},requestAnimationFrame(){},devicePixelRatio:1,Math,console};
vm.createContext(box);
for(const f of names)vm.runInContext(fs.readFileSync(__dirname+'/dist/'+f+'.js','utf8'),box,{filename:f+'.js'});
const run=source=>vm.runInContext(source,box);
const weapons=run("Object.entries(weaponBook).filter(([,w])=>!w.offhandOnly).map(([id])=>id)");
const heads=run('garments.head.length'),chests=run('garments.armor.length'),boots=run('garments.boots.length');
assert.equal(weapons.length,28);assert.equal(heads+chests+boots,50);
const kind=id=>run('weaponBook['+JSON.stringify(id)+'].kind');
function equipped(main='sword',overrides={}){
 const gear={head:0,armor:0,boots:0,main,off:-1,ring:-1,necklace:-1,cape:-1,spells:{head:0,armor:0,boots:0},...overrides};
 const obj=run('({kind:'+JSON.stringify(kind(main))+'})');
 const object=JSON.parse(JSON.stringify(gear));
 return run('(()=>{const a={kind:'+JSON.stringify(kind(main))+'};applyGear(a,'+JSON.stringify(object)+');return {max:a.max,hp:a.hp,speed:a.speed,accessory:a.accessory,balance:a.balanceV6,gear:a.gear};})()');
}

for(const [id,check] of [
 ['runeblade',a=>a.accessory.damage>=.02&&a.accessory.cooldown>=.02],
 ['sparkmace',a=>a.accessory.attack>=.04&&a.accessory.cooldown>=.02],
 ['compassdagger',a=>a.speed>equipped('sword').speed]
]){
 const item=equipped('sword',{off:id}),baseline=equipped('sword');
 assert.ok(check(item),id+' must grant meaningful offhand bonus');
 assert.ok(item.max<baseline.max,id+' must pay HP for offhand bonus');
}

let configurations=0,low=Infinity,high=-Infinity,score=[];
for(const id of weapons){
 const base=equipped(id);
 assert.ok(base.balance&&Number.isFinite(base.max)&&base.max>=1400&&base.max<4600,id+' max HP valid');
 assert.ok(base.balance.outgoing>=.66&&base.balance.outgoing<=1.04,id+' output bounded');
 const q=run('balanceV6Q('+JSON.stringify(id)+')');
 for(let i=0;i<q.length;i++){
  assert.ok(base.balance.qRatios[i]>=.05&&base.balance.qRatios[i]<=1,id+' Q'+i+' multiplier');
 }
 for(let chest=0;chest<chests;chest++){
  const a=equipped(id,{armor:chest});
  assert.ok(a.max>=1400&&a.max<4600&&a.hp===a.max,id+' armor '+chest+' finite');
  const resist=a.accessory.resist||0;
  assert.ok(resist<.4,'excessive passive resist');
  low=Math.min(low,a.max);high=Math.max(high,a.max);configurations++;
  // Compare a high-defense chest to baseline using the same mainhand.
  const protection=run('garments.armor['+chest+'].defense');
  if(protection>65){
   assert.ok(a.balance.outgoing<=base.balance.outgoing+.00001,id+' cannot gain offense from heavy armor');
  }
 }
 for(let head=0;head<heads;head++){
  const a=equipped(id,{head});assert.ok(a.hp>0);configurations++;
 }
 for(let boot=0;boot<boots;boot++){
  const a=equipped(id,{boots:boot});assert.ok(a.speed>75);configurations++;
 }
 const w=run('weaponBook['+JSON.stringify(id)+']');
 const offhands=w.hands===1?['tome','grimoire','codex','buckler','tower','torch','lantern','dagger','sword','spear','mace']:[];
 for(const off of offhands){
  const a=equipped(id,{off});if(a.gear.off!==off)continue;
  assert.ok(Number.isFinite(a.max)&&a.hp>0);
  configurations++;
 }
 const offensive=equipped(id,{ring:0,necklace:4});
 const plain=equipped(id);
 assert.ok(offensive.max<plain.max,id+' damage ring + execute must cost health');
 configurations++;
 score.push({id,offenseScore:+base.balance.threat.toFixed(1),hp:base.max,damageMultiplier:+base.balance.outgoing.toFixed(3),qScales:base.balance.qRatios.map(x=>+x.toFixed(3))});
}
for(const protectedId of ['dagger','compassdagger'])assert.ok(equipped(protectedId).balance.qRatios.every(v=>v===1),'hunter dagger unchanged');
for(const oldFamily of ['greataxe','hammer','crossbow','frost']){
 const p=equipped(oldFamily).balance;
 assert.ok(p.threat>24,oldFamily+' legacy Q must be evaluated from real legacy tooltip');
 assert.ok(p.qRatios.some(v=>v<.98),oldFamily+' high-damage Q must be normalized by damage budget');
}
for(const id of weapons){if(['dagger','compassdagger'].includes(id))continue;
 const q=run('balanceV6Q('+JSON.stringify(id)+')');
 for(let i=0;i<q.length;i++){
  const effective=run('balanceV6RawQDamage(balanceV6Q('+JSON.stringify(id)+')['+i+'])')*equipped(id).balance.qRatios[i];
  assert.ok(effective<=255,id+' Q'+i+' must not burst above two-hand Q budget: '+effective);
 }
}
assert.ok(equipped('sword').balance.outgoing<equipped('greataxe').balance.outgoing,'one-handed baseline lower than two-handed');
const axePressure=equipped('greataxe').balance.threat;
assert.ok(equipped('greataxe').max<equipped('sword').max,'high-Q axe trades maximum HP for power');
assert.ok(axePressure>45,'high-Q axe pressure not accidentally zero');
const tome=equipped('sword',{off:'tome'}),star=equipped('sword',{off:'grimoire'});
assert.equal(tome.max,star.max,'same -90 HP for identical +5% cooldown book');
assert.equal(tome.accessory.cooldown,star.accessory.cooldown,'same 5% cooldown');
assert.equal(tome.accessory.cooldown,.05);
assert.ok(equipped('sword',{off:'codex'}).max<equipped('sword').max,'damage offhand costs HP');
const heavy=equipped('sword',{armor:7,off:'tower',ring:4}),light=equipped('sword',{armor:4,off:-1,ring:0});
assert.ok(heavy.max>light.max,'tank has higher HP');
assert.ok(heavy.balance.outgoing<light.balance.outgoing,'tank attack reduced compared to glass-cannon');
assert.ok(equipped('sword',{ring:0}).max<equipped('sword',{ring:4}).max,'damage costs HP vs resist');
run("phase='fight';paused=false;score=[0,0];actors=[actor(0,0,0,'blade',true),actor(1,90,0,'blade',true)];applyGear(actors[0],{main:'sword',off:-1,head:0,armor:0,boots:0});applyGear(actors[1],{main:'sword',off:-1,head:0,armor:0,boots:0});actors[1].invul=0;");
run('damage(actors[1],100,actors[0]);');
assert.ok(run('actors[1].hp<actors[1].max'),'balanced wrapper must preserve actual combat');
for(const layout of ['maze','relicmaze']){
 run("matchType="+JSON.stringify(layout==='relicmaze'?'labyrinth':'skirmish')+";setArenaLayout("+JSON.stringify(layout)+");setArenaSize('grand');");
 for(const [ax,ay,bx,by]of [[-790,0,790,0],[790,0,-790,0],[-700,-450,700,450],[0,-520,0,520],[-600,250,600,-250]]){
  const path=run('findRoute({x:'+ax+',y:'+ay+'},{x:'+bx+',y:'+by+'})');
  assert.ok(path.length>0,layout+' route '+[ax,ay,bx,by].join(','));
  assert.ok(path.length<300,'no maze path loops');
  const end=path[path.length-1];
  assert.ok(run('arenaObstacles.every(o=>(o.x-('+end.x+'))**2+(o.y-('+end.y+'))**2>=(o.r+16)**2)'),layout+' clicked target snapped to walkable point');
 }
 const obstacles=run('arenaObstacles.slice(0,12).map(o=>({x:o.x,y:o.y,r:o.r}))');
 for(const wall of obstacles){
  const from={x:wall.x-155,y:wall.y-130},click={x:wall.x,y:wall.y};
  const path=run('findRoute('+JSON.stringify(from)+','+JSON.stringify(click)+')');
  assert.ok(path.length>0,layout+' clicking a wall routes to reachable adjacent surface');
  const end=path[path.length-1];
  assert.ok(Math.hypot(end.x-click.x,end.y-click.y)>wall.r,'not attempting to walk into wall center');
 }
}
const {simulation}=require('./server.cjs');
const sim=simulation();
const participants=[{id:'a',name:'A',team:0,kind:'staff',passive:'assault'},{id:'b',name:'B',team:1,kind:'blade',passive:'assault'}];
sim.init(participants,'grand','labyrinth','relicmaze',20,20);
sim.ready('a',{kind:'staff',passive:'assault',loadout:[0,0,0,0],gear:{main:'tome',off:'grimoire',head:0,armor:0,boots:0}});
sim.ready('b',{kind:'blade',passive:'assault',loadout:[0,0,0,0],gear:{main:'sword',off:'tower',head:0,armor:7,boots:0}});
const snapshot=sim.snapshot();assert.equal(snapshot.phase,'fight');
assert.ok(snapshot.actors.every(a=>Number.isFinite(a.max)&&a.max>=1400),'server authoritatively uses identical final combat budget');
const html=fs.readFileSync(__dirname+'/dist/index.html','utf8');
assert.ok(html.includes('src="balance-v6.js"')&&html.includes('src="render-v3.js"'));
console.log('BALANCE V6 PASS: '+weapons.length+' weapons, '+(heads+chests+boots)+' garments, '+configurations+' tested equipment configurations, equal tome/grimoire cost and 2 connected wider mazes; HP '+low+'..'+high);
console.log('BALANCE WEAPON AUDIT '+JSON.stringify(score));
