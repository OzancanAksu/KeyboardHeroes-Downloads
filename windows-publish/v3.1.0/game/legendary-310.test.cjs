'use strict';
// v3.0.8 real combat VM regression (the same scripts the multiplayer server runs).
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const names=['equipment','world','navigation','presentation','game','loadout','accessories','weapons','combat-feel','battle-scale','weapon-identity','compact-draft','targeting','spell-catalog','catalog-weapons','catalog-expansion','weapon-variants-core','combat-tactics','tactical-abilities','support-role','objectives','maps','lanes','spell-art','expansion','deathmatch','potions','combat-balance','multiplayer-rules','arena-update','gear-v3','gear-v4','gear-v5','relic-maze','balance-v6','legendary-weapons-308'];
const draw=new Proxy({},{get:(o,k)=>o[k]||(()=>({addColorStop(){}}))});
const els=new Map();
function el(k){if(!els.has(k))els.set(k,{style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},getBoundingClientRect:()=>({width:950,height:650}),getContext:()=>draw,addEventListener(){},focus(){},textContent:'',innerHTML:''});return els.get(k);}
const box={document:{querySelector:el,querySelectorAll:()=>[]},window:{addEventListener(){}},ResizeObserver:class{observe(){}},requestAnimationFrame(){},devicePixelRatio:1,Math,console};
vm.createContext(box);
for(const n of names)vm.runInContext(fs.readFileSync(__dirname+'/dist/'+n+'.js','utf8'),box,{filename:n+'.js'});
const run=src=>vm.runInContext(src,box);
const setup=(weapon,option=0)=>{
 run(`phase='fight';paused=false;matchType='vs';clock=180;round=1;actors=[actor(0,0,0,'blade',true),actor(1,95,0,'blade',true),actor(1,125,10,'blade',true),actor(0,95,-25,'blade',true)];shots=[];zones=[];effects=[];floating=[];for(const a of actors){applyGear(a,{head:0,armor:0,boots:0,main:a.team===0?'sword':'sword',off:-1});a.invul=0;a.stun=0;a.control={mouse:{x:100,y:0},target:null,enemy:null};a.ai=999;}applyGear(actors[0],{head:0,armor:0,boots:0,main:${JSON.stringify(weapon)},off:-1});actors[0].loadout=[${option},0,0,0];actors[0].ai=999;actors[0].control={mouse:{x:95,y:0},target:null,enemy:null};`);
};
// Test real weapon timers in isolation from baseline AI attacks.
const advance=(seconds)=>{for(let i=0;i<Math.round(seconds/.05);i++)run('kh308Step(.05)');};
// The previous v3.0.8 gameplay mechanics are covered by legendary-308.test.cjs.
// This suite verifies only v3.1.0 visual event creation, cancellation and painting.
setup('twinaxe',0);
assert.equal(run('cast(actors[0],0,{x:120,y:0})'),true);
assert.ok(run("effects.some(e=>e.style==='kh310-focus-axes')"),'axes charging effect');
advance(1.05);
assert.equal(run("effects.filter(e=>e.style==='kh310-axe-flight').length"),2,'two actual hatchets fly');
assert.ok(run("effects.some(e=>e.style==='kh310-axe-hit')"),'enemy collision sparkle');
assert.equal(run('actors[1].stun')>0,true,'new visuals keep original stun');
setup('twinaxe',0);
run('kh308Zones.length=0');
assert.equal(run('cast(actors[0],0,{x:120,y:0})'),true);
run('actors[0].stun=1');
advance(.05);
assert.equal(run("effects.some(e=>e.style==='kh310-focus-axes')"),false,'interrupted cast cancels charging light');
assert.equal(run("effects.some(e=>e.style==='kh310-axe-flight')"),false,'interrupted cast throws nothing');
setup('twinaxe',1);
run('kh308Zones.length=0');
assert.equal(run('cast(actors[0],0,{x:110,y:0})'),true);
assert.equal(run("effects.filter(e=>e.style==='kh310-whirl').length"),1,'3s spinning four-axe whirlwind');
assert.equal(run("effects.find(e=>e.style==='kh310-whirl').max"),3,'whirlwind lasts exact duration');
advance(1.1);
assert.ok(run("effects.some(e=>e.style==='kh310-whirl-pulse')"),'1 second tick pulse');
setup('legendshield',0);
run('kh308Zones.length=0');
assert.equal(run('cast(actors[0],0,{x:90,y:0})'),true);
assert.ok(run("effects.some(e=>e.style==='kh310-focus-shield')"),'2s shield rune cast');
advance(2.1);
assert.equal(run("effects.find(e=>e.style==='kh310-guard-aura').max"),4,'4s spiked guard ring');
advance(1.05);
assert.ok(run("effects.some(e=>e.style==='kh310-guard-pulse')"),'aura pulses at damage tick');
run('actors[0].stun=1.2');
advance(.05);
assert.equal(run("effects.some(e=>e.style==='kh310-guard-aura')"),false,'stun removes ongoing guard art');
assert.equal(run('actors[0].kh308Guard'),0,'protection is also cancelled');
setup('legendshield',1);
run('kh308Zones.length=0');
assert.equal(run('cast(actors[0],0,{x:300,y:0})'),true);
advance(.65);
assert.ok(run("effects.filter(e=>e.style==='kh310-ram-dust').length")>=3,'smoke trail at fixed budget');
assert.ok(run("effects.some(e=>e.style==='kh310-ram-front')"),'ram front glints during rush');
assert.ok(run("effects.some(e=>e.style==='kh310-ram-impact')"),'impact flashes at collision');
const serialized=run('JSON.stringify(effects.filter(e=>String(e.style).startsWith("kh310-")))');
assert.ok(serialized.includes('kh310-ram-dust'),'events remain serializable for server snapshots');
const script=fs.readFileSync(__dirname+'/dist/legendary-weapon-art-308.js','utf8');
const visual=fs.readFileSync(__dirname+'/dist/legendary-weapon-vfx-310.js','utf8');
const paintCalls={};
const ctx=new Proxy({},{
 get(obj,k){return Object.hasOwn(obj,k)?obj[k]:()=>{paintCalls[k]=(paintCalls[k]||0)+1;return {addColorStop(){}};}},
 set(obj,k,v){obj[k]=v;return true;}
});
const artBox={
 ctx,scale:1,actors:[{id:1,x:32,y:17,hp:2000}],project:(x,y,z)=>({x,y:y-z}),
 drawHeldWeapon(){},drawChampion(){},drawAbility(){},equipmentIcon(){return 'original';},
 weaponVariantSvg(){return 'original';}
};
vm.createContext(artBox);
vm.runInContext(script,artBox,{filename:'legendary-weapon-art-308.js'});
vm.runInContext(visual,artBox,{filename:'legendary-weapon-vfx-310.js'});
for(const id of ['twinaxe','legendshield']){
 const rendered=vm.runInContext("equipmentIcon('main',"+JSON.stringify(id)+")",artBox);
 assert.match(rendered,/style="fill:#[\da-f]{6} !important/,'metal fill must override broken inherited CSS for '+id);
 assert.ok((rendered.match(/style="fill:/g)||[]).length>=9,'original painted pieces stay colored');
 assert.match(rendered,/kh308-unique-art/);
 assert.match(vm.runInContext("weaponVariantSvg("+JSON.stringify(id)+")",artBox),/style="fill:/);
}
const styles=['kh310-focus-axes','kh310-focus-shield','kh310-axe-flight','kh310-axe-hit',
 'kh310-whirl','kh310-whirl-pulse','kh310-guard-aura','kh310-guard-pulse',
 'kh310-ram-dust','kh310-ram-front','kh310-ram-impact','kh310-ram-start','kh310-guard-break'];
for(const style of styles){
 const sample={kind:'ability',style,x:30,y:25,angle:0,r:145,life:.33,max:.5,
  side:-13,distance:330,khOwner:1,seed:7};
 artBox.effect=sample;
 vm.runInContext('drawAbility(effect)',artBox);
}
assert.ok((paintCalls.stroke||0)>20,'Canvas paths actually rendered for new FX');
const css=fs.readFileSync(__dirname+'/dist/inventory.css','utf8');
assert.ok(css.includes('.inventory-art path{fill:inherit'), 'regression fixture: old CSS conflict must be covered');
const html=fs.readFileSync(__dirname+'/dist/index.html','utf8');
assert.ok(html.includes('src="legendary-weapon-vfx-310.js"'));
assert.ok(html.includes('src="legendary-weapon-art-308.js"'));
console.log('PASS: 3.1.0 original inventory paints, real hatchet visuals, whirlwind, armor rune, dust, collision FX and multiplayer event payloads');
