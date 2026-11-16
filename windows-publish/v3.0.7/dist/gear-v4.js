'use strict';
/* Keyboard Heroes / Gear V4: original equipment abilities.
 * Shared deterministic implementation: desktop bot arena + authoritative Node server.
 * No timers, wall-clock, or client-only combat decisions. No tier/power creep.
 */
const GEAR_V4_WEAPONS={
 riftscythe:{name:'Yarık Tırpanı',kind:'blade',hands:2,hp:-8,speed:-2,power:1,attack:0,q:0,icon:'☾',trait:'Alan biçme · isabete bağlı can yenileme',off:'İki elli'},
 stormlance:{name:'Gök Mızrağı',kind:'blade',hands:2,hp:-4,speed:2,power:1,attack:0,q:0,icon:'ϟ',trait:'Zincirleme darbe · kısa kontrol',off:'İki elli'},
 mirrorbow:{name:'Ayna Yayı',kind:'bow',hands:2,hp:-7,speed:3,power:1,attack:0,q:0,icon:'◇',trait:'Seken ok · gizli rakibi açığa çıkar',off:'İki elli'},
 chrono:{name:'Saat Asası',kind:'staff',hands:2,hp:-4,speed:-3,power:1,attack:0,q:0,icon:'⌛',trait:'Gecikmeli alan · konuma geri dönüş',off:'İki elli'},
 resonance:{name:'Akort Asası',kind:'staff',hands:2,hp:-5,speed:0,power:1,attack:0,q:0,icon:'♫',trait:'Takım şifası · itme dalgası',off:'İki elli'},
 runeblade:{name:'Mühür Kılıcı',kind:'blade',hands:1,hp:0,speed:1,power:1,attack:0,q:0,icon:'✧',trait:'Hedef işaretleme · delici enerji hattı',off:'Mühür uyumu: %2 hasar, %2 kısa bekleme, −95 can'}
};
const GEAR_V4_Q={
 riftscythe:[
  {skill:'Karanlık Biçiş',desc:'Önündeki 140 alanda 360 hasar ve 1,1 sn yavaşlatma.',cd:9,shape:'self',range:0,effect:140,style:'slash',action:'v4Reap',damage:360,slow:1.1},
  {skill:'Yaşam Oraklaması',desc:'135 alanda 245 hasar; rakibe isabette en çok 160 can yenile.',cd:12,shape:'self',range:0,effect:135,style:'heal',action:'v4Leech',damage:245,heal:160}
 ],
 stormlance:[
  {skill:'İletken Darbe',desc:'410 menzilde 290 hasar; ikinci rakibe 145 hasar sıçrar.',cd:9,shape:'line',range:410,effect:32,style:'metal',action:'v4Chain',damage:290,bounce:145},
  {skill:'Fırtına Kıskacı',desc:'130 birim atıl; inişte 120 alanda 245 hasar ve 0,6 sn sabitle.',cd:13,shape:'dash',range:130,effect:120,style:'ice',action:'v4DashBurst',damage:245,root:.6}
 ],
 mirrorbow:[
  {skill:'Sekmeli Ok',desc:'540 menzilde 320 hasar; en yakın ikinci rakibe 130 hasar.',cd:9,shape:'line',range:540,effect:26,style:'arrow',action:'v4Chain',damage:320,bounce:130},
  {skill:'Ayna İzi',desc:'520 menzilde 265 hasar; 190 alandaki gizli rakipleri 3 sn açığa çıkar.',cd:12,shape:'ground',range:520,effect:190,style:'mist',action:'v4RevealShot',damage:265,reveal:3}
 ],
 chrono:[
  {skill:'Zaman Çemberi',desc:'470 menzilde 135 alana iki gecikmeli darbe: 175+175 hasar.',cd:13,shape:'ground',range:470,effect:135,style:'arcane',action:'v4Pulse',damage:175,slow:1.2},
  {skill:'Geri Sarım',desc:'Yaklaşık 2 sn önceki güvenli konumuna dön; 150 can yenile.',cd:17,shape:'self',range:0,effect:50,style:'arcane',action:'v4Rewind',heal:150}
 ],
 resonance:[
  {skill:'Dost Frekansı',desc:'Çevrende 210 alandaki müttefiklere 220 can yenile.',cd:11,shape:'self',range:0,effect:210,style:'heal',action:'v4Chorus',heal:220},
  {skill:'Bozucu Nota',desc:'Önündeki 175 alanda 245 hasar; rakipleri 65 birim geri iter.',cd:12,shape:'self',range:0,effect:175,style:'mist',action:'v4Repulse',damage:245}
 ],
 runeblade:[
  {skill:'Mühür Kesisi',desc:'185 menzilde 270 hasar; sonraki temel vuruş 140 ek hasar verir.',cd:9,shape:'line',range:185,effect:40,style:'metal',action:'v4Mark',damage:270,bonus:140},
  {skill:'Kırık Rün Hattı',desc:'340 menzilde en çok 2 rakibe 280 hasar ve 0,8 sn yavaşlatma.',cd:10,shape:'line',range:340,effect:42,style:'arcane',action:'v4Wave',damage:280,slow:.8}
 ]
};
const GEAR_V4_GARMENTS={
 head:[
  [{name:'Ayna Vizörü',color:'#b9a2cb',hp:-9,skill:'Keskin Yansıma',desc:'2,5 sn içinde alınan ilk darbeye 175 kalkan; 95 karşı hasar.',cd:25},
   {skill:'Keskin Yansıma',desc:'2,5 sn içinde alınan ilk darbeye 175 kalkan; 95 karşı hasar.',cd:25,shape:'self',range:0,effect:40,style:'mist',action:'v4Reflect',shield:175,damage:95},
   {skill:'Çıplak Gerçek',desc:'280 alandaki görünmez rakipleri 3 sn görünür yap.',cd:20,shape:'self',range:0,effect:280,style:'arcane',action:'v4Reveal',reveal:3}],
  [{name:'Işık Tacı',color:'#86b7a7',hp:-12,skill:'Koruma Frekansı',desc:'Yakındaki en düşük canlı müttefiğe 275 can.',cd:22},
   {skill:'Koruma Frekansı',desc:'Yakındaki en düşük canlı müttefiğe 275 can.',cd:22,shape:'self',range:0,effect:260,style:'heal',action:'v4Help',heal:275},
   {skill:'Arınmış Nefes',desc:'Kontrolleri temizle; 180 can yenile.',cd:25,shape:'self',range:0,effect:50,style:'heal',action:'v4Cleanse',heal:180}],
  [{name:'Mühür Miğferi',color:'#a7a2ba',hp:10,skill:'Açık Hedef',desc:'300 menzilli bir rakibi 3 sn %10 fazladan hasara açık bırak.',cd:22},
   {skill:'Açık Hedef',desc:'300 menzilli bir rakibi 3 sn %10 fazladan hasara açık bırak.',cd:22,shape:'line',range:300,effect:36,style:'metal',action:'v4Expose',expose:3},
   {skill:'Kara Kalkan',desc:'3 sn boyunca gelen hasarı %16 azalt.',cd:24,shape:'self',range:0,effect:40,style:'metal',action:'v4Fortify',duration:3}]
 ],
 armor:[
  [{name:'Faz Cübbesi',color:'#978cbd',hp:-22,speed:2,defense:19,skill:'Faz Perdesi',desc:'3 sn 300 hasarlık geçici kalkan.',cd:23},
   {skill:'Faz Perdesi',desc:'3 sn 300 hasarlık geçici kalkan.',cd:23,shape:'self',range:0,effect:40,style:'mist',action:'v4Barrier',shield:300},
   {skill:'Yarık Dalgası',desc:'150 alanda 265 hasar ve kısa geri itiş.',cd:22,shape:'self',range:0,effect:150,style:'mist',action:'v4Repulse',damage:265}],
  [{name:'Kök Dokuma Ceket',color:'#789978',hp:4,speed:0,defense:28,skill:'Filiz Baskısı',desc:'410 menzilde iki kez 105 hasar ve 1,2 sn yavaşlatma.',cd:22},
   {skill:'Filiz Baskısı',desc:'410 menzilde iki kez 105 hasar ve 1,2 sn yavaşlatma.',cd:22,shape:'ground',range:410,effect:130,style:'heal',action:'v4Pulse',damage:105,slow:1.2},
   {skill:'Paylaşılan Yaşam',desc:'Çevrendeki müttefiklere 140 can ve 80 kalkan.',cd:26,shape:'self',range:0,effect:180,style:'heal',action:'v4GroupGuard',heal:140,shield:80}],
  [{name:'Demir Omurga',color:'#88939c',hp:23,speed:-7,defense:72,skill:'Kale Birliği',desc:'Yakın müttefiklere 3 sn %16 hasar azaltma.',cd:28},
   {skill:'Kale Birliği',desc:'Yakın müttefiklere 3 sn %16 hasar azaltma.',cd:28,shape:'self',range:0,effect:200,style:'metal',action:'v4GroupFortify',duration:3},
   {skill:'Çelik Basınç',desc:'155 alanda 265 hasar ve 0,6 sn sabitleme.',cd:25,shape:'self',range:0,effect:155,style:'metal',action:'v4Burst',damage:265,root:.6}]
 ],
 boots:[
  [{name:'Faz Çizmeleri',color:'#a797c5',speed:5,skill:'Parlama Adımı',desc:'185 birim sıçra; 0,20 sn dokunulmazlık.',cd:15},
   {skill:'Parlama Adımı',desc:'185 birim sıçra; 0,20 sn dokunulmazlık.',cd:15,shape:'dash',range:185,effect:185,style:'mist',action:'v4Dash',invul:.2},
   {skill:'Çapraz Kaçış',desc:'Hedefin yanına 115 birim çapraz atıl.',cd:13,shape:'dash',range:115,effect:115,style:'mist',action:'v4Sidestep'}],
  [{name:'Çapa Sabatonları',color:'#a69980',speed:-5,skill:'Toprak Yemini',desc:'2,5 sn sabitlenmeye ve yavaşlamaya diren; 150 kalkan.',cd:20},
   {skill:'Toprak Yemini',desc:'2,5 sn sabitlenmeye ve yavaşlamaya diren; 150 kalkan.',cd:20,shape:'self',range:0,effect:45,style:'metal',action:'v4Anchor',shield:150,duration:2.5},
   {skill:'Siper Basışı',desc:'90 birim atıl; 180 canlık kalkan kazan.',cd:18,shape:'dash',range:90,effect:90,style:'metal',action:'v4DashGuard',shield:180}],
  [{name:'Yankı Botları',color:'#8badc5',speed:3,skill:'İkinci Adım',desc:'140 birim atıl; 1,3 sn sonra ilk yerine dön.',cd:19},
   {skill:'İkinci Adım',desc:'140 birim atıl; 1,3 sn sonra ilk yerine dön.',cd:19,shape:'dash',range:140,effect:140,style:'arcane',action:'v4EchoDash'},
   {skill:'Ritim Koşusu',desc:'3 sn hızlan ve yavaşlatmayı temizle.',cd:17,shape:'self',range:0,effect:50,style:'mist',action:'v4Sprint',duration:3}]
 ]
};
const GEAR_V4_INDEX={head:new Set(),armor:new Set(),boots:new Set()};
for(const [id,w] of Object.entries(GEAR_V4_WEAPONS)){
 weaponBook[id]=w;weaponChoice[id]=0;weaponVariantNames[id]=[w.name];
 familyQ[id]=GEAR_V4_Q[id];
}
for(const key of ['head','armor','boots'])for(const [item,first,second] of GEAR_V4_GARMENTS[key]){
 const idx=garments[key].length;
 const a={...first,skill:item.skill,desc:item.desc,cd:item.cd},b={...second};
 garments[key].push(item);extraGarments[key].push(item);extraSpells[key].push([a,b]);garmentAlternates[key].push(b);
 GEAR_V4_INDEX[key].add(idx);
 if(typeof itemGlyphs!=='undefined')itemGlyphs[key][idx]=key==='head'?'✧':key==='armor'?'◈':'➟';
}
const gearV4Events=[];
function gearV4Effect(x,y,r,style='mist',color='#a3d9d8'){
 effects.push({kind:'ability',style,x,y,r,angle:0,life:.6,max:.6,color});
 if(effects.length>180)effects.splice(0,effects.length-180);
}
function gearV4Damage(a,b,value){
 if(!a||!b||b.hp<=0||a.team===b.team||!Number.isFinite(value))return 0;
 const before=b.hp,slot=a.skillSlot,tag=a.gearV3HitTag;
 a.skillSlot=null;a.gearV3HitTag={slot:null,basic:false};
 try{damage(b,Math.min(800,Math.max(0,value)),a);}
 finally{a.skillSlot=slot;a.gearV3HitTag=tag;}
 return Math.max(0,before-b.hp);
}
function gearV4Enemies(a,p,r){
 return actors.filter(b=>b.team!==a.team&&b.hp>0&&!b.laneRole&&(!b.stealth||b.reveal>0)&&dist(b,p)<=r&&clearRoute(p,b,0));
}
function gearV4Target(a,p,range,tolerance=65){
 return gearV4Enemies(a,p,tolerance).filter(b=>dist(a,b)<=range&&clearRoute(a,b,0)).sort((b,c)=>dist(b,p)-dist(c,p))[0]||null;
}
function gearV4Pulse(a,p,r,value,slow=0,root=0){
 let hit=0;
 for(const b of gearV4Enemies(a,p,r)){
  const dealt=gearV4Damage(a,b,value);
  if(dealt>0){hit++;if(slow)b.slow=Math.max(b.slow||0,slow);if(root)b.root=Math.max(b.root||0,root);}
 }
 return hit;
}
function gearV4Barrier(a,value,duration=3){
 a.gearV3Barrier=Math.max(a.gearV3Barrier||0,Math.min(350,value));
 a.gearV3BarrierTime=Math.max(a.gearV3BarrierTime||0,duration);
}
function gearV4Jump(a,angle,distance){
 if(a.root>0&&!a.gearV4RootImmune)return false;
 move(a,Math.cos(angle)*distance,Math.sin(angle)*distance);a.vx=a.vy=0;
 const c=a.control||input;if(c){c.target=null;c.enemy=null;}
 return true;
}
function gearV4Rewind(a,seconds=2){
 const h=a.gearV4History||[],past=h.find(x=>x.t>=seconds)||h[h.length-1];
 if(!past)return false;
 a.x=clamp(past.x,-arenaBounds.x,arenaBounds.x);a.y=clamp(past.y,-arenaBounds.y,arenaBounds.y);
 a.vx=a.vy=0;a.slow=0;gearV4Effect(a.x,a.y,70,'arcane','#b9a5ec');
 return true;
}
function gearV4Activate(a,slot,s,p){
 const angle=Math.atan2(p.y-a.y,p.x-a.x),center=a,range=s.range||0,r=s.effect||120;
 a.facing=angle;a.anim=a.animMax=.52;
 gearV4Effect(s.shape==='ground'?p.x:a.x,s.shape==='ground'?p.y:a.y,Math.max(55,r),s.style||'mist');
 switch(s.action){
 case 'v4Reap':gearV4Pulse(a,a,r,s.damage,s.slow);break;
 case 'v4Leech':if(gearV4Pulse(a,a,r,s.damage))restoreHealth(a,s.heal);break;
 case 'v4Chain':{
  const first=gearV4Target(a,p,range);if(!first)break;
  gearV4Damage(a,first,s.damage);
  const second=gearV4Enemies(a,first,165).filter(b=>b!==first).sort((b,c)=>dist(b,first)-dist(c,first))[0];
  if(second){gearV4Damage(a,second,s.bounce);gearV4Effect(second.x,second.y,45,s.style);}
  break;
 }
 case 'v4RevealShot':{
  const first=gearV4Target(a,p,range,80);
  if(first)gearV4Damage(a,first,s.damage);
  for(const b of actors)if(b.team!==a.team&&b.hp>0&&dist(b,p)<r)b.reveal=Math.max(b.reveal||0,s.reveal);
  break;
 }
 case 'v4DashBurst':if(gearV4Jump(a,angle,range))gearV4Pulse(a,a,r,s.damage,0,s.root);break;
 case 'v4Pulse':
  gearV4Events.push({owner:a,x:p.x,y:p.y,r,damage:s.damage,slow:s.slow||0,remaining:.5,pulses:2,interval:.65});
  break;
 case 'v4Rewind':gearV4Rewind(a);restoreHealth(a,s.heal||0);break;
 case 'v4Chorus':
  for(const b of actors)if(b.team===a.team&&!b.laneRole&&b.hp>0&&dist(a,b)<=r)supportHeal(a,b,s.heal);
  break;
 case 'v4Repulse':
  for(const b of gearV4Enemies(a,center,r)){
   gearV4Damage(a,b,s.damage);const dir=Math.atan2(b.y-a.y,b.x-a.x);
   if(b.root<=0)move(b,Math.cos(dir)*65,Math.sin(dir)*65);
   b.slow=Math.max(b.slow||0,.6);
  }
  break;
 case 'v4Mark':{
  const b=gearV4Target(a,p,range,70);
  if(b){gearV4Damage(a,b,s.damage);b.gearV4Mark={owner:a.id,ttl:4.5,bonus:s.bonus};}
  break;
 }
 case 'v4Wave':{
  const hits=gearV4Enemies(a,a,range).filter(b=>Math.abs(Math.atan2(Math.sin(Math.atan2(b.y-a.y,b.x-a.x)-angle),Math.cos(Math.atan2(b.y-a.y,b.x-a.x)-angle)))<.34).sort((b,c)=>dist(a,b)-dist(a,c)).slice(0,2);
  for(const b of hits){gearV4Damage(a,b,s.damage);b.slow=Math.max(b.slow||0,s.slow);}
  break;
 }
 case 'v4Reflect':gearV4Barrier(a,s.shield,2.5);a.gearV4Reflect={ttl:2.5,damage:s.damage};break;
 case 'v4Reveal':
  for(const b of actors)if(b.team!==a.team&&b.hp>0&&dist(a,b)<=r)b.reveal=Math.max(b.reveal||0,s.reveal);
  break;
 case 'v4Help':{
  const b=actors.filter(x=>x.team===a.team&&!x.laneRole&&x.hp>0&&dist(a,x)<=r).sort((x,y)=>x.hp/x.max-y.hp/y.max)[0];
  if(b)supportHeal(a,b,s.heal);
  break;
 }
 case 'v4Cleanse':a.root=0;a.stun=0;a.slow=0;restoreHealth(a,s.heal);break;
 case 'v4Expose':{const b=gearV4Target(a,p,range);if(b)b.gearV4Expose=s.expose;break;}
 case 'v4Fortify':a.gearV4Fortify=s.duration;break;
 case 'v4Barrier':gearV4Barrier(a,s.shield);break;
 case 'v4GroupGuard':
  for(const b of actors)if(b.team===a.team&&!b.laneRole&&b.hp>0&&dist(a,b)<=r){supportHeal(a,b,s.heal);gearV4Barrier(b,s.shield);}
  break;
 case 'v4GroupFortify':
  for(const b of actors)if(b.team===a.team&&!b.laneRole&&b.hp>0&&dist(a,b)<=r)b.gearV4Fortify=Math.max(b.gearV4Fortify||0,s.duration);
  break;
 case 'v4Burst':gearV4Pulse(a,a,r,s.damage,0,s.root);break;
 case 'v4Dash':if(gearV4Jump(a,angle,range))a.invul=Math.max(a.invul||0,s.invul||0);break;
 case 'v4Sidestep':gearV4Jump(a,angle+Math.PI/2,range);break;
 case 'v4Anchor':a.root=0;a.slow=0;a.gearV4RootImmune=s.duration;gearV4Barrier(a,s.shield,s.duration);break;
 case 'v4DashGuard':if(gearV4Jump(a,angle,range))gearV4Barrier(a,s.shield);break;
 case 'v4EchoDash':{
  const old={x:a.x,y:a.y};if(gearV4Jump(a,angle,range))gearV4Events.push({owner:a,returnTo:old,remaining:1.3});
  break;
 }
 case 'v4Sprint':a.slow=0;a.haste=Math.max(a.haste||0,s.duration);break;
 }
}
const gearV4FormerSkill=gearSkill;
gearSkill=function(slot,a){
 const g=a?.gear||wardrobe;
 if(slot===0&&GEAR_V4_Q[g.main]){const x=GEAR_V4_Q[g.main][a?.loadout?.[0]??weaponChoice[g.main]??0]||GEAR_V4_Q[g.main][0];return {name:weaponBook[g.main].name,skill:x.skill,desc:x.desc,color:'#a8c9d8'};}
 return gearV4FormerSkill(slot,a);
};
const gearV4FormerSpec=skillTargetSpec;
skillTargetSpec=function(a,slot){
 const g=a?.gear||wardrobe;
 if(slot===0&&GEAR_V4_Q[g.main]){const s=GEAR_V4_Q[g.main][a?.loadout?.[0]??weaponChoice[g.main]??0]||GEAR_V4_Q[g.main][0];return {range:s.range,shape:s.shape,effect:s.effect};}
 const key=spellKeyForSkill[slot];if(key&&GEAR_V4_INDEX[key].has(g[key])){const s=extraSpells[key][g[key]-5][g.spells?.[key]??0];return {range:s.range,shape:s.shape,effect:s.effect};}
 return gearV4FormerSpec(a,slot);
};
const gearV4FormerCast=cast;
cast=function(a,slot,p){
 const g=a?.gear||{},key=spellKeyForSkill[slot];
 const s=slot===0&&GEAR_V4_Q[g.main]?GEAR_V4_Q[g.main][a?.loadout?.[0]??weaponChoice[g.main]??0]:
 key&&GEAR_V4_INDEX[key].has(g[key])?extraSpells[key][g[key]-5][g.spells?.[key]??0]:null;
 if(!s)return gearV4FormerCast(a,slot,p);
 if(!a||!p||a.hp<=0||a.cd?.[slot]>0||phase!=='fight'||paused||a.stun>0&&!['v4Cleanse','v4Anchor'].includes(s.action)||!inSkillRange(a,slot,p))return false;
 if(typeof net!=='undefined'&&net.active){net.send({type:'cast',skill:slot,aim:p});return true;}
 a.cd[slot]=s.cd*(1-Math.min(.12,a.accessory?.cooldown||0));
 if(a.stealth>0){a.stealth=0;a.reveal=1;}
 const before=a.skillSlot;a.skillSlot=slot;
 try{gearV4Activate(a,slot,s,p);}finally{a.skillSlot=before;}
 if(slot===0&&a.cd[3]>3&&gearV3CapeReady(a,4)){gearV3Proc(a,4,'arcane');a.cd[3]=Math.max(3,a.cd[3]-1.2);}
 return true;
};
const gearV4FormerDamage=damage;
damage=function(target,value,source){
 if(!target||target.hp<=0||target.invul>0)return gearV4FormerDamage(target,value,source);
 const reduced=target.gearV4Fortify>0?value*.84:value;
 const before=target.hp,shieldBefore=target.gearV3Barrier||0;
 gearV4FormerDamage(target,target.gearV4Expose>0?reduced*1.10:reduced,source);
 if(target.hp>=before&&(target.gearV3Barrier||0)>=shieldBefore)return;
 if(source&&source.team!==target.team&&target.gearV4Reflect?.ttl>0){
  const spec=target.gearV4Reflect;target.gearV4Reflect=null;
  gearV4Damage(target,source,spec.damage);
 }
 if(source&&source.team!==target.team&&target.gearV4Mark?.owner===source.id&&target.gearV4Mark.ttl>0&&
    (source.gearV3HitTag?.basic||source.gearV3ActiveBasic)&&!source.gearV4ProcLock){
  const bonus=target.gearV4Mark.bonus;target.gearV4Mark=null;source.gearV4ProcLock=true;
  try{gearV4Damage(source,target,bonus);}finally{source.gearV4ProcLock=false;}
 }
};
const gearV4FormerApply=applyGear;
applyGear=function(a,g=wardrobe){
 gearV4FormerApply(a,g);
 a.gearV4History=[];a.gearV4HistoryStep=0;a.gearV4Reflect=null;a.gearV4Fortify=0;
 a.gearV4Expose=0;a.gearV4Mark=null;a.gearV4RootImmune=0;
};
const gearV4FormerUpdate=update;
update=function(dt){
 const step=Math.max(0,Math.min(.12,dt));
 if(phase==='fight'&&!paused&&!(typeof net!=='undefined'&&net.active)){
  for(const a of actors){
   if(!a.gearV4History)continue;
   for(const key of ['gearV4Fortify','gearV4Expose','gearV4RootImmune'])a[key]=Math.max(0,(a[key]||0)-step);
   if(a.gearV4RootImmune>0){a.root=0;a.slow=0;}
   if(a.gearV4Reflect){a.gearV4Reflect.ttl-=step;if(a.gearV4Reflect.ttl<=0)a.gearV4Reflect=null;}
   if(a.gearV4Mark){a.gearV4Mark.ttl-=step;if(a.gearV4Mark.ttl<=0)a.gearV4Mark=null;}
   a.gearV4HistoryStep=(a.gearV4HistoryStep||0)+step;
   for(const h of a.gearV4History)h.t+=step;
   if(a.gearV4HistoryStep>=.16){a.gearV4HistoryStep=0;a.gearV4History.unshift({x:a.x,y:a.y,t:0});}
   a.gearV4History=a.gearV4History.filter(h=>h.t<=2.4).slice(0,20);
  }
  for(let i=gearV4Events.length-1;i>=0;i--){
   const e=gearV4Events[i];e.remaining-=step;if(e.remaining>0)continue;
   if(e.owner?.hp<=0){gearV4Events.splice(i,1);continue;}
   if(e.returnTo){const a=e.owner;if(a.stun<=0&&a.root<=0){a.x=clamp(e.returnTo.x,-arenaBounds.x,arenaBounds.x);a.y=clamp(e.returnTo.y,-arenaBounds.y,arenaBounds.y);a.vx=a.vy=0;gearV4Effect(a.x,a.y,55,'arcane');}gearV4Events.splice(i,1);continue;}
   gearV4Pulse(e.owner,{x:e.x,y:e.y},e.r,e.damage,e.slow);
   gearV4Effect(e.x,e.y,e.r,'arcane');
   e.pulses--;if(e.pulses<=0)gearV4Events.splice(i,1);else e.remaining=e.interval;
  }
 }else if(phase!=='fight')gearV4Events.length=0;
 return gearV4FormerUpdate(dt);
};
if(typeof refreshCharacterCard==='function')refreshCharacterCard(true);
