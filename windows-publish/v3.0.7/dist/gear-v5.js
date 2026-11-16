'use strict';
// Gear V5: extends the authoritative Gear V4 system without extra weapon variants.
// Q magnitudes are already in effective combat damage units; no second IP multiplier.
const GEAR_V5_Q_BALANCE={
 riftscythe:[{damage:195,slow:.8,desc:'140 alanda 195 hasar; 0,8 sn yavaşlatma.'},{damage:165,heal:85,cd:11,desc:'135 alanda 165 hasar; isabet varsa en çok 85 can yenile.'}],
 stormlance:[{damage:205,bounce:80,desc:'410 menzilde 205 hasar; ikinci hedefe 80 hasar sıçrar.'},{damage:155,root:.45,cd:12,desc:'130 birim atıl; 120 alanda 155 hasar ve 0,45 sn sabitle.'}],
 mirrorbow:[{damage:210,bounce:70,cd:8.5,desc:'540 menzilde 210 hasar; ikinci rakibe 70 hasar sıçrar.'},{damage:170,reveal:2.5,cd:11,desc:'520 menzilde 170 hasar; 190 alanda gizlileri 2,5 sn açığa çıkar.'}],
 chrono:[{damage:90,slow:.6,cd:12,desc:'470 menzilde iki gecikmeli 90 hasarlık zaman darbesi (toplam 180).'},{heal:75,cd:15,desc:'Yaklaşık 2 sn önceki güvenli konumuna dön; 75 can yenile.'}],
 resonance:[{heal:140,cd:10,desc:'210 alandaki müttefiklere 140 can yenile.'},{damage:145,cd:11,desc:'175 alanda 145 hasar; hedefleri kısa mesafe geri iter.'}],
 runeblade:[{damage:150,bonus:70,desc:'185 menzilde 150 hasar; sonraki temel vuruş 70 ek hasar verir.'},{damage:165,slow:.7,desc:'340 menzilde en çok 2 rakibe 165 hasar ve 0,7 sn yavaşlatma.'}]
};
for(const [id,changes]of Object.entries(GEAR_V5_Q_BALANCE))for(let i=0;i<2;i++){
 const q=GEAR_V4_Q[id][i];Object.assign(q,changes[i]);
 if(i===0&&q.action==='v4Mark')q.markDuration=4;
}
const GEAR_V5_WEAPONS={
 sparkmace:{name:'Kıvılcım Topuzu',kind:'blade',hands:1,hp:5,speed:-2,power:1,attack:0,q:0,icon:'⚡',trait:'Yakın kontrol · kıvılcım çarpması',off:'Kıvılcım akışı: %4 saldırı hızı, %2 kısa bekleme, −70 can'},
 shadowcrossbow:{name:'Gölge Arbaleti',kind:'bow',hands:2,hp:-8,speed:-5,power:1,attack:0,q:0,icon:'✣',trait:'Dar atış · hedefe kısa sabitleme',off:'İki elli'},
 compassdagger:{name:'Pusula Hançeri',kind:'blade',hands:1,hp:-9,speed:6,power:1,attack:0,q:0,icon:'✥',trait:'Yanal hamle · ileri geri hareket',off:'Pusula adımı: +6 hareket hızı, −60 can'},
 rootstaff:{name:'Kök Bastonu',kind:'staff',hands:2,hp:0,speed:-1,power:1,attack:0,q:0,icon:'❧',trait:'Sarmaşık yavaşlatma · takım yardımı',off:'İki elli'}
};
const GEAR_V5_Q={
 sparkmace:[
  {skill:'Çarpan Kafa',desc:'150 alanda 180 hasar ve 0,6 sn yavaşlatma.',cd:9,shape:'self',range:0,effect:150,style:'metal',action:'v4Reap',damage:180,slow:.6},
  {skill:'Sarsıntı Halkası',desc:'135 alanda 140 hasar ve 0,4 sn mini sersemletme.',cd:12,shape:'self',range:0,effect:135,style:'metal',action:'v5StunBurst',damage:140,stun:.4}
 ],
 shadowcrossbow:[
  {skill:'Delici Cıvata',desc:'560 menzilde tek rakibe 215 hasar.',cd:8.5,shape:'line',range:560,effect:35,style:'arrow',action:'v5Bolt',damage:215},
  {skill:'Kara Pim',desc:'530 menzilde 145 hasar ve 0,8 sn sabitleme.',cd:11,shape:'line',range:530,effect:35,style:'mist',action:'v5Pin',damage:145,root:.8}
 ],
 compassdagger:[
  {skill:'Yörünge Vuruşu',desc:'Hedefin yanına kısa geçiş; yakın rakibe 160 hasar.',cd:9,shape:'line',range:215,effect:55,style:'slash',action:'v5Orbit',damage:160},
  {skill:'Geri İz',desc:'120 birim atıl ve 125 hasar ver; 1,2 sn sonra önceki noktaya dön.',cd:13,shape:'dash',range:120,effect:85,style:'mist',action:'v5ReturnStrike',damage:125}
 ],
 rootstaff:[
  {skill:'Sarmaşık Atışı',desc:'475 menzilde 150 hasar ve 1 sn yavaşlatma.',cd:9,shape:'line',range:475,effect:50,style:'heal',action:'v5Vine',damage:150,slow:1},
  {skill:'Filiz Yardımı',desc:'En yaralı müttefiğe 120, yanındakilere 60 can yenile.',cd:11,shape:'self',range:0,effect:230,style:'heal',action:'v5Sprout',heal:120,splashHeal:60}
 ]
};
const GEAR_V5_GARMENTS={
 head:[
  [{name:'Avcı Kukuletası',color:'#738f80',hp:-4,skill:'İşaret Fısıltısı',desc:'300 alanda gizli rakipleri 3 sn açığa çıkar.',cd:20},
   {skill:'İşaret Fısıltısı',desc:'300 alanda gizli rakipleri 3 sn açığa çıkar.',cd:20,shape:'self',range:0,effect:300,style:'mist',action:'v4Reveal',reveal:3},
   {skill:'Keskin Nefes',desc:'2 sn %8 saldırı hızı kazandırır.',cd:22,shape:'self',range:0,effect:40,style:'metal',action:'v5AttackHaste',duration:2}],
  [{name:'Yankı Tacı',color:'#a69cc6',hp:-8,skill:'Geri Ses',desc:'İlk darbeye 135 kalkan, 115 karşı hasar.',cd:23},
   {skill:'Geri Ses',desc:'İlk darbeye 135 kalkan, 115 karşı hasar.',cd:23,shape:'self',range:0,effect:50,style:'arcane',action:'v4Reflect',shield:135,damage:115},
   {skill:'Ses Duvarı',desc:'3 sn 210 kalkan kazan.',cd:21,shape:'self',range:0,effect:40,style:'mist',action:'v4Barrier',shield:210}]
 ],
 armor:[
  [{name:'Gözcü Paltosu',color:'#768b7c',hp:2,speed:3,defense:32,skill:'Takip Alanı',desc:'410 menzilde iki kez 95 hasar ve 1,2 sn yavaşlatma.',cd:21},
   {skill:'Takip Alanı',desc:'410 menzilde iki kez 95 hasar ve 1,2 sn yavaşlatma.',cd:21,shape:'ground',range:410,effect:130,style:'mist',action:'v4Pulse',damage:95,slow:1.2},
   {skill:'Hızlı Toparlanma',desc:'Yavaşlatma/sabitlemeyi temizle; 145 can yenile.',cd:21,shape:'self',range:0,effect:45,style:'heal',action:'v4Cleanse',heal:145}],
  [{name:'Savaş İlmeği',color:'#867f94',hp:12,speed:-3,defense:50,skill:'Bağlayıcı Baskı',desc:'135 alanda 165 hasar ve 0,45 sn sabitleme.',cd:23},
   {skill:'Bağlayıcı Baskı',desc:'135 alanda 165 hasar ve 0,45 sn sabitleme.',cd:23,shape:'self',range:0,effect:135,style:'metal',action:'v4Burst',damage:165,root:.45},
   {skill:'Müttefik Zinciri',desc:'190 alanda en yaralı takım arkadaşına 180 kalkan.',cd:24,shape:'self',range:0,effect:190,style:'heal',action:'v5AllyBarrier',shield:180}]
 ],
 boots:[
  [{name:'İz Çizmeleri',color:'#9aab8c',speed:5,skill:'Çapraz Adım',desc:'130 birim yana sıçra.',cd:13},
   {skill:'Çapraz Adım',desc:'130 birim yana sıçra.',cd:13,shape:'dash',range:130,effect:130,style:'mist',action:'v4Sidestep'},
   {skill:'Takip Koşusu',desc:'2,5 sn hızlan ve yavaşlatmayı temizle.',cd:16,shape:'self',range:0,effect:40,style:'mist',action:'v4Sprint',duration:2.5}],
  [{name:'Darbe Botları',color:'#8c929e',speed:-1,skill:'Sert İniş',desc:'135 birim atıl; 110 alanda 115 hasar ve 0,5 sn sabitleme.',cd:16},
   {skill:'Sert İniş',desc:'135 birim atıl; 110 alanda 115 hasar ve 0,5 sn sabitleme.',cd:16,shape:'dash',range:135,effect:110,style:'metal',action:'v4DashBurst',damage:115,root:.5},
   {skill:'Dayanma Adımı',desc:'2,2 sn gelen hasarı %16 azalt.',cd:18,shape:'self',range:0,effect:50,style:'metal',action:'v4Fortify',duration:2.2}]
 ]
};
const GEAR_V5_INDEX={head:new Set(),armor:new Set(),boots:new Set()};
for(const [id,w]of Object.entries(GEAR_V5_WEAPONS)){
 weaponBook[id]=w;weaponChoice[id]=0;weaponVariantNames[id]=[w.name];familyQ[id]=GEAR_V5_Q[id];GEAR_V4_Q[id]=GEAR_V5_Q[id];
}
for(const key of ['head','armor','boots'])for(const [item,first,second]of GEAR_V5_GARMENTS[key]){
 const i=garments[key].length;
 garments[key].push(item);extraGarments[key].push(item);extraSpells[key].push([{...first,skill:item.skill,desc:item.desc,cd:item.cd},{...second}]);
 garmentAlternates[key].push({...second});
 GEAR_V4_INDEX[key].add(i);GEAR_V5_INDEX[key].add(i);
 if(typeof itemGlyphs!=='undefined')itemGlyphs[key][i]=key==='head'?'✧':key==='armor'?'◈':'➟';
}
const gearV5BaseActivate=gearV4Activate;
gearV4Activate=function(a,slot,s,p){
 const angle=Math.atan2(p.y-a.y,p.x-a.x),r=s.effect||85;
 switch(s.action){
 case 'v5StunBurst':
  gearV4Effect(a.x,a.y,r,'metal','#9ddde0');
  for(const b of gearV4Enemies(a,a,r)){if(gearV4Damage(a,b,s.damage)>0)applyStun(b,s.stun,a);}
  break;
 case 'v5Bolt':
 case 'v5Pin':{
  const b=gearV4Target(a,p,s.range,65);
  if(b&&gearV4Damage(a,b,s.damage)>0&&s.root)b.root=Math.max(b.root||0,s.root);
  gearV4Effect(b?.x??p.x,b?.y??p.y,45,s.style,s.action==='v5Pin'?'#a39ac8':'#b9a1dd');break;
 }
 case 'v5Orbit':{
  const b=gearV4Target(a,p,s.range,65);
  if(!b)break;
  const perpendicular=Math.atan2(b.y-a.y,b.x-a.x)+Math.PI/2;
  const target={x:b.x+Math.cos(perpendicular)*48,y:b.y+Math.sin(perpendicular)*48};
  const d=Math.min(110,dist(a,target));
  if(d>0&&gearV4Jump(a,Math.atan2(target.y-a.y,target.x-a.x),d))gearV4Damage(a,b,s.damage);
  gearV4Effect(a.x,a.y,65,'slash','#e4b9da');break;
 }
 case 'v5ReturnStrike':{
  const from={x:a.x,y:a.y};
  if(gearV4Jump(a,angle,s.range)){
   gearV4Pulse(a,a,r,s.damage);
   gearV4Events.push({owner:a,returnTo:from,remaining:1.2});
  }
  break;
 }
 case 'v5Vine':{
  const b=gearV4Target(a,p,s.range,65);
  if(b&&gearV4Damage(a,b,s.damage)>0)b.slow=Math.max(b.slow||0,s.slow);
  gearV4Effect(b?.x??p.x,b?.y??p.y,65,'heal','#9ed8a4');break;
 }
 case 'v5Sprout':{
  const allies=actors.filter(b=>b.team===a.team&&!b.laneRole&&b.hp>0&&dist(a,b)<=r).sort((x,y)=>x.hp/x.max-y.hp/y.max);
  if(allies.length){const primary=allies[0];supportHeal(a,primary,s.heal);
   for(const ally of allies.slice(1))if(dist(ally,primary)<=160)supportHeal(a,ally,s.splashHeal);}
  gearV4Effect(a.x,a.y,r,'heal','#a7e1ad');break;
 }
 case 'v5AttackHaste':a.gearV3AttackHaste=Math.max(a.gearV3AttackHaste||0,s.duration);gearV4Effect(a.x,a.y,45,'metal','#ead49b');break;
 case 'v5AllyBarrier':{
  const ally=actors.filter(b=>b.team===a.team&&!b.laneRole&&b.hp>0&&b!==a&&dist(a,b)<=r)
   .sort((x,y)=>x.hp/x.max-y.hp/y.max)[0];
  if(ally){gearV4Barrier(ally,s.shield,3);gearV4Effect(ally.x,ally.y,45,'heal','#a3d9ce');}
  break;
 }
 default:gearV5BaseActivate(a,slot,s,p);return;
 }
 a.facing=angle;a.anim=a.animMax=.5;
};
// If the user chooses a runic mark, the existing proc consumes it on a qualifying basic hit.
const gearV5BaseAttack=attack;
attack=function(a,target){
 const id=a?.gear?.main;
 const before=shots.length,wasReady=!!a&&a.attack<=0;
 const result=gearV5BaseAttack(a,target);
 if(wasReady&&a?.attack>0&&a.hp>0){
  if(['chrono','resonance','rootstaff'].includes(id)){
   const color={chrono:'#d9bd91',resonance:'#8adfcf',rootstaff:'#9dc67e'}[id];
   for(const shot of shots.slice(before))shot.color=color;
   gearV4Effect(a.x,a.y,36,'arcane',color);
  }else if(['mirrorbow','shadowcrossbow'].includes(id)){
   for(const shot of shots.slice(before))shot.color=id==='mirrorbow'?'#c9e3f4':'#9386be';
  }else if(['stormlance','sparkmace'].includes(id)){
   gearV4Effect(a.x,a.y,40,'metal','#a7e6ef');
  }else if(['riftscythe','compassdagger','runeblade'].includes(id)){
   gearV4Effect(a.x,a.y,42,'slash',id==='riftscythe'?'#bb9ce2':'#e2c4e7');
  }
 }
 return result;
};
