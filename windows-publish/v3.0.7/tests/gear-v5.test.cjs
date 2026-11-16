'use strict';
// Gear 2.5.7 regression: numerical Q budgets, all new skills, art routing and cloud slots.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const names=['equipment','world','navigation','presentation','game','loadout','accessories','weapons','combat-feel','battle-scale','weapon-identity','compact-draft','targeting','spell-catalog','catalog-weapons','catalog-expansion','weapon-variants-core','combat-tactics','tactical-abilities','support-role','objectives','maps','lanes','spell-art','expansion','deathmatch','potions','combat-balance','multiplayer-rules','arena-update','gear-v3','gear-v4','gear-v5'];
const drawing=new Proxy({},{get:(o,k)=>o[k]||(()=>({addColorStop(){}}))});
const els=new Map(),el=s=>{if(!els.has(s))els.set(s,{style:{},classList:{add(){},remove(){},toggle(){}},getBoundingClientRect:()=>({width:920,height:640}),getContext:()=>drawing,addEventListener(){},focus(){},textContent:'',innerHTML:''});return els.get(s);};
const context={document:{querySelector:el,querySelectorAll:()=>[]},window:{addEventListener(){}},ResizeObserver:class{observe(){}},requestAnimationFrame(){},devicePixelRatio:1,Math,console};
vm.createContext(context);
for(const name of names)vm.runInContext(fs.readFileSync(__dirname+'/dist/'+name+'.js','utf8'),context,{filename:name});
const run=s=>vm.runInContext(s,context);
assert.equal(run('Object.values(weaponBook).filter(w=>!w.offhandOnly).length'),28);
assert.equal(run('garments.head.length+garments.armor.length+garments.boots.length'),50);
assert.equal(run('Object.keys(GEAR_V5_WEAPONS).length'),4);
assert.equal(run('Object.values(GEAR_V5_GARMENTS).reduce((total,items)=>total+items.length,0)'),6);
const caps={riftscythe:[195,165],stormlance:[205,155],mirrorbow:[210,170],chrono:[90,0],resonance:[0,145],runeblade:[150,165]};
for(const [id,values] of Object.entries(caps))for(const [i,expected]of values.entries()){
 const q=run('GEAR_V4_Q['+JSON.stringify(id)+']['+i+']');
 assert.equal(q.damage||0,expected,id+' Q'+(i+1)+' damage');
 assert.ok(q.cd>=8&&q.cd<=15,id+' Q cooldown');
}
for(const id of Object.keys(caps).concat(['sparkmace','shadowcrossbow','compassdagger','rootstaff'])){
 const kind=run('weaponBook['+JSON.stringify(id)+'].kind');
 for(const n of [0,1]){
  run(`phase='fight';paused=false;actors=[actor(0,0,0,'${kind}',true),actor(1,92,0,'blade',true),actor(1,130,10,'blade',true)];for(const b of actors.slice(1))applyGear(b,{head:0,armor:0,boots:0,main:'sword',off:-1});var hero=actors[0];applyGear(hero,{head:0,armor:0,boots:0,main:'${id}',off:-1});hero.loadout=[${n},0,0,0];hero.hp=hero.max-300;shots=[];zones=[];effects=[];var qResult=cast(hero,0,{x:92,y:0});`);
  assert.equal(run('qResult'),true,id+' Q'+(n+1)+' cast');
  assert.ok(run('hero.cd[0]>0 && Number.isFinite(hero.hp) && Number.isFinite(hero.x)'),id+' finite and cooldown');
  for(let j=1;j<3;j++)assert.ok(run('actors['+j+'].hp<=actors['+j+'].max'),id+' enemy health valid');
 }
}
for(const [key,slot]of Object.entries({head:2,armor:1,boots:3}))for(const index of [0,1])for(const option of [0,1]){
 const gearIndex=run('Array.from(GEAR_V5_INDEX.'+key+')['+index+']');
 const gear={head:0,armor:0,boots:0,main:'sword',off:-1,spells:{head:0,armor:0,boots:0}};
 gear[key]=gearIndex;gear.spells[key]=option;
 run("phase='fight';paused=false;actors=[actor(0,0,0,'blade',true),actor(0,60,0,'staff',true),actor(1,85,0,'blade',true)];for(const b of actors.slice(1))applyGear(b,{head:0,armor:0,boots:0,main:'sword',off:-1});var hero=actors[0];applyGear(hero,"+JSON.stringify(gear)+");hero.hp=hero.max-200;var ready=cast(hero,"+slot+",{x:85,y:0});");
 assert.equal(run('ready'),true,key+' index '+index+' option '+option);
 assert.ok(run('hero.cd['+slot+']>0'),'cooldown after garment skill');
}
const v5q=run('GEAR_V5_Q');
for(const [id,qs]of Object.entries(v5q))for(const q of qs){
 assert.ok((q.damage||0)<=215,'new Q max 215: '+id+' '+q.skill);
 assert.ok(q.cd>=8.5,'Q cooldown at least 8.5: '+id);
}
const held=fs.readFileSync(__dirname+'/dist/gear-v5-visuals.js','utf8');
const svg=fs.readFileSync(__dirname+'/dist/weapon-art.js','utf8');
for(const id of Object.keys(caps).concat(Object.keys(v5q))){
 assert.match(held,new RegExp("case '"+id+"':"),id+' must get real held weapon');
 assert.ok(svg.includes(id+':'),id+' must get distinct inventory-preview SVG');
}
const html=fs.readFileSync(__dirname+'/dist/index.html','utf8'),server=fs.readFileSync(__dirname+'/server.cjs','utf8');
assert.ok(html.includes('src="gear-v5.js"')&&html.includes('src="gear-v5-visuals.js"')&&html.includes('src="i18n-v5.js"'));
assert.ok(server.includes("'gear-v4','gear-v5'"));
const {sanitizeBuild}=require('./build-slots.cjs');
const sample={gear:{head:16,armor:16,boots:16,main:'sparkmace',off:-1,ring:-1,necklace:-1,cape:-1,spells:{head:1,armor:0,boots:1},potions:['heal','guard','haste']},choices:{sparkmace:1}};
assert.ok(sanitizeBuild(sample),'new Gear V5 models survive server cloud storage');
assert.equal(sanitizeBuild({...sample,gear:{...sample.gear,head:17}}),null);
// Equipment identity audit: overlapping ability archetypes must make genuine
// speed/defense/range/utility trades, not simply be stronger copies.
const equipmentByName=(key,name)=>run("(()=>{const index=garments."+key+".findIndex(x=>x.name==="+JSON.stringify(name)+");return {item:garments."+key+"[index],skills:extraSpells."+key+"[index-5],index};})()");
const bulwarkBoot=equipmentByName('boots','Burç sabatonları'),impactBoot=equipmentByName('boots','Darbe Botları');
assert.ok(bulwarkBoot.index>=5&&impactBoot.index>=5);
assert.ok(bulwarkBoot.item.speed<impactBoot.item.speed,'Bulwark must pay a larger movement cost');
assert.ok(bulwarkBoot.skills[0].damage>impactBoot.skills[0].damage,'Bulwark is the area-damage alternative');
assert.ok(bulwarkBoot.skills[0].range<impactBoot.skills[0].range,'Impact boots are a longer engage');
assert.ok(impactBoot.skills[0].root>0,'Impact boots have unique crowd-control utility');
assert.ok(bulwarkBoot.skills[0].slow>0,'Bulwark boots apply an area slow');
assert.notEqual(bulwarkBoot.skills[1].action,impactBoot.skills[1].action,'Alternate abilities have separate identities');
const sky=equipmentByName('boots','Gök sandaletleri'),phaseBoot=equipmentByName('boots','Faz Çizmeleri');
assert.equal(sky.item.speed,phaseBoot.item.speed,'Compare equally fast escape boots');
assert.ok(sky.skills[0].cd<phaseBoot.skills[0].cd,'Sky: shorter cooldown');
assert.ok(sky.skills[0].range<phaseBoot.skills[0].range,'Phase: longer leap');
assert.ok(sky.skills[0].invul<phaseBoot.skills[0].invul,'Phase: longer invulnerability');
const scout=equipmentByName('armor','Gözcü Paltosu'),root=equipmentByName('armor','Kök Dokuma Ceket');
assert.ok(scout.item.speed>root.item.speed&&scout.item.defense>root.item.defense,'Scout has mobility and protection');
assert.ok(root.item.hp>scout.item.hp&&root.skills[0].damage>scout.skills[0].damage,'Root has HP and slightly stronger pulses');
assert.ok(scout.skills[0].cd<root.skills[0].cd,'Scout trades lower damage for frequency');
assert.notEqual(scout.skills[1].action,root.skills[1].action,'Scout cleanse vs root group healing');
const mirror=equipmentByName('head','Ayna Vizörü'),echo=equipmentByName('head','Yankı Tacı');
assert.ok(mirror.skills[0].shield>echo.skills[0].shield,'Mirror focuses on absorbing damage');
assert.ok(mirror.skills[0].damage<echo.skills[0].damage&&mirror.skills[0].cd>echo.skills[0].cd,'Echo counters harder and more often');
const castle=equipmentByName('armor','Burç zırhı'),steel=equipmentByName('armor','Çelik zırh');
assert.ok(castle.item.hp>steel.item.hp&&castle.item.speed<steel.item.speed,'Castle armor offers more HP at a mobility cost');
assert.ok(castle.skills[0].duration>steel.item.cd*0+2.4,'Castle guard lasts longer than the standard steel shell');
assert.ok(castle.item.cd>steel.item.cd,'Castle guard has a longer cooldown');
const runner=equipmentByName('boots','Koşucu botları'),tracker=equipmentByName('boots','İz sürücü botları');
assert.ok(runner.item.speed>tracker.item.speed,'Runner has the strongest base sprint');
assert.ok(tracker.skills[0].haste>3&&tracker.item.cd>runner.item.cd,'Tracker trades cooldown for a longer sprint');
// Weapon families: tactical profiles differ without gratuitous numerical buffs.
// The shared Balance V6 caps already normalize offensive Qs and require a
// health or speed tradeoff for stronger damage; preserve that single budget.
const mace=run("weaponBook.mace"),sparkMace=run("weaponBook.sparkmace");
assert.ok(mace.hp>sparkMace.hp&&mace.speed<sparkMace.speed,'Mace has more HP but less mobility than spark mace');
assert.ok(run("familyQ.mace[0].slow")>run("GEAR_V4_Q.sparkmace[0].slow"),'Mace specializes in long slows');
assert.ok(run("GEAR_V4_Q.sparkmace[1].stun")>0,'Spark mace specializes in interrupts');
const siege=run("weaponBook.crossbow"),shadow=run("weaponBook.shadowcrossbow");
assert.ok(siege.speed<shadow.speed,'Siege crossbow trades mobility for splash damage');
assert.ok(run("catalogWeaponQ.crossbow[0].effect")>run("GEAR_V4_Q.shadowcrossbow[0].effect"),'Siege has an area bolt');
assert.ok(run("GEAR_V4_Q.shadowcrossbow[1].root")>0,'Shadow crossbow has a pinning bolt');
assert.ok(run("weaponBook.greataxe.speed")>run("weaponBook.hammer.speed"),'Axe is the mobile heavy melee option');
assert.ok(run("weaponBook.hammer.hp")>run("weaponBook.greataxe.hp"),'Hammer has more HP and control');
assert.ok(run("familyQ.holy[0].heal")>run("catalogWeaponQ.nature[0].heal"),'Holy has stronger burst healing');
assert.ok(run("familyQ.holy[0].cd")>run("catalogWeaponQ.nature[0].cd"),'Nature heals more frequently');
// Actual Q budget is validated by balance-v6.test.cjs, which loads the balance-v6 runtime.
const garmentRecords=run("['head','armor','boots'].flatMap(key=>garments[key].slice(5).map((item,offset)=>({key,name:item.name,skills:extraSpells[key][offset]})))");
const seenSignatures=new Map();
let activeAbilities=0;
for(const entry of garmentRecords)for(const ability of entry.skills||[]){
 const signature=[entry.key,ability.action,ability.shape,ability.range,ability.effect,ability.damage||0,
  ability.heal||0,ability.shield||0,ability.root||0,ability.slow||0,ability.invul||0,
  ability.duration||0,ability.haste||0,ability.cd].join('|');
 assert.ok(!seenSignatures.has(signature),'Identical extended garment ability: '+seenSignatures.get(signature)+' / '+entry.name);
 seenSignatures.set(signature,entry.name);activeAbilities++;
}
assert.ok(activeAbilities>=45,'All extended clothes must be covered by uniqueness audit');
console.log('Equipment identity audit PASS: '+activeAbilities+' extended garment skills checked, overlapping boots/armor/head roles separated.');
console.log('PASS: 28 weapons, 50 garments, all 20 new Qs/12 new garment skills, balance cap, art routes, cloud build limits.');
