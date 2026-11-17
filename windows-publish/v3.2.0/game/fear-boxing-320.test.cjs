'use strict';
// v3.0.8 real combat VM regression (the same scripts the multiplayer server runs).
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const names=['equipment','world','navigation','presentation','game','loadout','accessories','weapons','combat-feel','battle-scale','weapon-identity','compact-draft','targeting','spell-catalog','catalog-weapons','catalog-expansion','weapon-variants-core','combat-tactics','tactical-abilities','support-role','objectives','maps','lanes','spell-art','expansion','deathmatch','potions','combat-balance','multiplayer-rules','arena-update','gear-v3','gear-v4','gear-v5','relic-maze','balance-v6','legendary-weapons-308','fear-boxing-320'];
const draw=new Proxy({},{get:(o,k)=>o[k]||(()=>({addColorStop(){}}))});
const els=new Map();
function el(k){if(!els.has(k))els.set(k,{style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},getBoundingClientRect:()=>({width:950,height:650}),getContext:()=>draw,addEventListener(){},focus(){},textContent:'',innerHTML:''});return els.get(k);}
const box={document:{querySelector:el,querySelectorAll:()=>[]},window:{addEventListener(){}},ResizeObserver:class{observe(){}},requestAnimationFrame(){},devicePixelRatio:1,Math,console};
vm.createContext(box);
for(const n of names)vm.runInContext(fs.readFileSync(__dirname+'/dist/'+n+'.js','utf8'),box,{filename:n+'.js'});
const run=src=>vm.runInContext(src,box);
const setup=(weapon,option=0)=>{
 run(`phase='fight';paused=false;pillars.length=0;matchType='vs';clock=180;round=1;actors=[actor(0,0,0,'blade',true),actor(1,95,0,'blade',true),actor(1,125,10,'blade',true),actor(0,95,-25,'blade',true)];shots=[];zones=[];effects=[];floating=[];for(const a of actors){applyGear(a,{head:0,armor:0,boots:0,main:a.team===0?'sword':'sword',off:-1});a.invul=0;a.stun=0;a.control={mouse:{x:100,y:0},target:null,enemy:null};a.ai=999;}applyGear(actors[0],{head:0,armor:0,boots:0,main:${JSON.stringify(weapon)},off:-1});actors[0].loadout=[${option},0,0,0];actors[0].ai=999;actors[0].control={mouse:{x:95,y:0},target:null,enemy:null};`);
};
// Test real weapon timers in isolation from baseline AI attacks.
const advance=(seconds)=>{for(let i=0;i<Math.round(seconds/.05);i++)run('kh308Step(.05)');};

for(const [id,hp] of [['feardagger',2000],['boxinggloves',2400]]){
 assert.equal(run('weaponBook.'+id+'.hands'),2);
 assert.equal(run('weaponBook.'+id+'.kind'),'blade');
 setup(id,0);
 assert.ok(Math.abs(run('actors[0].max')-hp)<170,'base HP for '+id);
 assert.equal(run('actors[0].hp'),run('actors[0].max'));
 assert.equal(run("weaponPair("+JSON.stringify(id)+",'sword')"),false,'two-handed means offhand blocked');
 assert.equal(run('familyQ.'+id+'.length'),2,'both Q inventory choices visible');
}
setup('feardagger',0);
run("actors[2].x=212;actors[2].y=0;actors[3].x=117;actors[3].y=3");
const h1=run('actors[1].hp'),h2=run('actors[2].hp'),friend=run('actors[3].hp');
assert.equal(run('cast(actors[0],0,{x:220,y:0})'),true);
assert.ok(Math.abs(run('actors[0].x')-220)<3,'jump 220 units');
assert.ok(run('actors[1].hp')<h1,'enemy in path hit');
assert.ok(run('actors[2].hp')<h2,'enemy at landing hit');
assert.equal(run('actors[3].hp'),friend,'teammate unharmed');
assert.equal(run('actors[0].khFearHidden'),2);
assert.ok(run('actors[0].stealth')>=1.9);
assert.equal(run('actors[0].cd[0]')>=11.9,true,'Q1 cooldown 12 sec');
advance(2.1);
assert.equal(run('actors[0].stealth'),0,'stealth ends after 2 sec');
assert.ok(run('actors[0].khFearWeak')>.9,'1 sec basic damage penalty begins');
let baseline,weak;
setup('feardagger');
run("actors[0].khFearBasic=true;damage(actors[1],100,actors[0]);actors[0].khFearBasic=false");
baseline=run('actors[1].max-actors[1].hp');
setup('feardagger');
run("actors[0].khFearWeak=1;actors[0].khFearBasic=true;damage(actors[1],100,actors[0]);actors[0].khFearBasic=false");
weak=run('actors[1].max-actors[1].hp');
assert.ok(weak<=baseline*.45&&weak>=baseline*.32,'only basic attacks lose ~60% damage');
setup('feardagger',1);
assert.equal(run('cast(actors[0],0,{x:90,y:0})'),true);
assert.equal(run('actors[0].khFearFrenzy'),3);
assert.ok(run("effects.some(e=>e.style==='kh320-frenzy'&&e.max===3)"));
assert.equal(run('actors[0].cd[0]')>=15.9,true,'Q2 16 second cooldown');
run('actors[0].attack=0');
assert.equal(run('attack(actors[0],actors[1])'),undefined);
const cooldown=run('actors[0].attack');
setup('feardagger',0);
run('actors[0].attack=0;attack(actors[0],actors[1])');
const regular=run('actors[0].attack');
assert.ok(cooldown>0&&Math.abs(regular/cooldown-3.1)<.15,'attack rate is 3.1x');
setup('feardagger',1);
run('cast(actors[0],0,{x:90,y:0})');
run('actors[0].x+=10;kh320MoveBonus(actors[0],{x:0,y:0})');
assert.ok(Math.abs(run('actors[0].x')-14)<.01,'movement bonus exactly +40%');
advance(3.1);
assert.equal(run('actors[0].khFearFrenzy'),0,'frenzy expires at 3 seconds');
setup('boxinggloves',0);
run("actors[2].x=-70;actors[2].y=0;actors[3].x=80;actors[3].y=-20");
const enemyFront=run('actors[1].hp'),enemyBack=run('actors[2].hp'),ally=run('actors[3].hp');
assert.equal(run('cast(actors[0],0,{x:140,y:0})'),true);
advance(.44);
assert.ok(run('actors[1].hp')<enemyFront,'two forward punches hit');
assert.equal(run('actors[2].hp'),enemyBack,'rear target waits for back punches');
advance(.28);
assert.ok(run('actors[2].hp')<enemyBack,'two rear punches hit');
assert.equal(run('actors[3].hp'),ally,'friendly player never hit');
assert.equal(run('actors[0].khBoxCombo'),null,'combo finishes after 4 strikes');
assert.equal(run('actors[0].cd[0]>=10.9'),true,'Q1 cooldown 11 seconds');
setup('boxinggloves',1);
run('actors[0].hp=actors[0].max-500;actors[0].facing=0;');
const oldhp=run('actors[0].hp'),x=run('actors[0].x');
assert.equal(run('cast(actors[0],0,{x:300,y:0})'),true);
assert.ok(Math.abs(run('actors[0].x')-(x-100))<4,'backstep 100 units');
assert.equal(run('actors[0].hp'),oldhp+220,'heal exactly 220');
assert.equal(run('actors[0].cd[0]>=11.9'),true,'Q2 cooldown 12 seconds');
const svgSource=fs.readFileSync(__dirname+'/dist/fear-boxing-art-320.js','utf8');
const vfxSource=fs.readFileSync(__dirname+'/dist/fear-boxing-vfx-320.js','utf8');
const c=new Proxy({},{get:(o,k)=>Object.hasOwn(o,k)?o[k]:(()=>({addColorStop(){}})),set:(o,k,v)=>(o[k]=v,true)});
const art={ctx:c,scale:1,project:(x,y,z=0)=>({x,y:y-z}),actors:[],
 drawHeldWeapon(){},drawChampion(){},equipmentIcon(){},weaponVariantSvg(){},drawAbility(){}};
vm.createContext(art);
vm.runInContext(svgSource,art);
vm.runInContext(vfxSource,art);
for(const id of ['feardagger','boxinggloves']){
 const h=vm.runInContext("equipmentIcon('main',"+JSON.stringify(id)+")",art);
 assert.match(h,/kh320-unique-art/);
 assert.match(h,/style="fill:#[0-9a-f]{6} !important;/,'SVG fill must defeat global inventory black CSS');
 assert.match(vm.runInContext("weaponVariantSvg("+JSON.stringify(id)+")",art),/style="fill:/);
}
for(const style of ['kh320-fear-jump','kh320-fear-hit','kh320-fear-mist','kh320-fear-fade',
 'kh320-frenzy','kh320-frenzy-end','kh320-box-punch','kh320-box-hit','kh320-box-ready',
 'kh320-box-retreat','kh320-box-heal']){
 art.effect={style,kind:'ability',x:10,y:20,tx:110,ty:20,life:.3,max:.5,khOwner:1,angle:0};
 vm.runInContext('drawAbility(effect)',art);
}
const page=fs.readFileSync(__dirname+'/dist/index.html','utf8');
const server=fs.readFileSync(__dirname+'/server.cjs','utf8');
assert.match(page,/src="fear-boxing-320\.js"/);
assert.match(page,/src="fear-boxing-art-320\.js"/);
assert.match(page,/src="fear-boxing-vfx-320\.js"/);
assert.match(server,/'legendary-weapons-308','fear-boxing-320'/);
console.log('PASS: v3.2.0 2000/2400 HP; ghost leap, swept damage, stealth/fatigue, frenzy 3.1x/1.4x; 4 boxing punches, backward heal, original art and FX');
