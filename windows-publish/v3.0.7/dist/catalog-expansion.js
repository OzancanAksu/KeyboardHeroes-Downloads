'use strict';

const extraWeapons={
 mace:{name:'Siper topuzu',kind:'blade',hands:1,hp:10,speed:-4,power:1,attack:0,q:0,icon:'✦',trait:'Topuz · yakın kontrol',off:'Ağırlık dengesi: +65 can, −3 hız'},
 gloves:{name:'Fırtına eldivenleri',kind:'blade',hands:2,hp:-9,speed:8,power:1,attack:.04,q:0,icon:'✊',trait:'Eldiven · seri baskı',off:'İki el gerektirir'},
 spear:{name:'Gelgit mızrağı',kind:'blade',hands:1,hp:-3,speed:4,power:1,attack:0,q:0,icon:'♆',trait:'Mızrak · delici hat',off:'Arka tutuş: +%3 hasar, −35 can'},
 quarterstaff:{name:'Yankı değneği',kind:'blade',hands:2,hp:3,speed:5,power:1,attack:0,q:0,icon:'╏',trait:'Değnek · yer değiştirme',off:'İki el gerektirir'},
 shapeshifter:{name:'Vahşi biçim asası',kind:'staff',hands:2,hp:6,speed:2,power:1,attack:0,q:0,icon:'◈',trait:'Biçim · yakın/uzak geçiş',off:'İki el gerektirir'},
 cursed:{name:'Çürüme asası',kind:'staff',hands:2,hp:-5,speed:0,power:1,attack:0,q:0,icon:'☽',trait:'Lanet · gecikmeli baskı',off:'İki el gerektirir'},
 holy:{name:'Şafak asası',kind:'staff',hands:2,hp:1,speed:-2,power:1,attack:0,q:0,icon:'✺',trait:'Kutsal · iyileştirme',off:'İki el gerektirir'}
};
const offhandBook={
 buckler:{name:'Kırık siper',icon:'⛨',trait:'Kalkan · +130 can, %2 direnç, −5 hız',hp:130,resist:.02,speed:-5},
 tower:{name:'Kule kalkanı',icon:'▣',trait:'Ağır kalkan · +210 can, %3 direnç, −12 hız',hp:210,resist:.03,speed:-12},
 grimoire:{name:'Yıldız kitabı',icon:'▤',trait:'Kitap · %5 kısa bekleme, −90 can',hp:-90,cooldown:.05},
 codex:{name:'Yankı kodeksi',icon:'▧',trait:'Kitap · %4 hasar, −85 can',hp:-85,damage:.04},
 torch:{name:'Kıvılcım meşalesi',icon:'♨',trait:'Meşale · %7 saldırı hızı, −70 can',hp:-70,attack:.07},
 lantern:{name:'Uğultu feneri',icon:'◌',trait:'Fener · +5 hız, %3 saldırı hızı, −75 can',hp:-75,speed:5,attack:.03}
};
for(const [id,item] of Object.entries(offhandBook))weaponBook[id]={...item,kind:'offhand',hands:1,offhandOnly:true,off:item.trait};
Object.assign(weaponBook,extraWeapons);
for(const id of Object.keys(extraWeapons))weaponChoice[id]=0;
const familyQ={
 mace:[
  {skill:'Siper kıran',desc:'130 alanda 300 hasar, 1,5 sn yavaşlatma.',cd:7,shape:'self',range:0,effect:130,style:'metal',action:'burst',damage:300,slow:1.5},
  {skill:'Demir kanca',desc:'190 menzilli 360 hasar ve kısa yavaşlatma.',cd:9,shape:'line',range:190,effect:30,style:'metal',action:'shot',damage:360,slow:.6}
 ],
 gloves:[
  {skill:'Üç darbe',desc:'115 alanda 3×125 hasar.',cd:7,shape:'self',range:0,effect:115,style:'slash',action:'burst',damage:375},
  {skill:'Fırtına adımı',desc:'150 birim atıl; yakın hedefe 350 hasar.',cd:10,shape:'dash',range:150,effect:110,style:'slash',action:'dashburst',damage:350}
 ],
 spear:[
  {skill:'Delici hat',desc:'330 menzilli mızrak · 340 hasar.',cd:7,shape:'line',range:330,effect:12,style:'metal',action:'shot',damage:340},
  {skill:'Çember süpürme',desc:'165 alanda 290 hasar ve 1 sn yavaşlatma.',cd:8,shape:'self',range:0,effect:165,style:'metal',action:'burst',damage:290,slow:1}
 ],
 quarterstaff:[
  {skill:'Yankı savuruşu',desc:'150 alanda 310 hasar ve yavaşlatma.',cd:8,shape:'self',range:0,effect:150,style:'metal',action:'burst',damage:310,slow:1},
  {skill:'Dönen sıçrayış',desc:'170 birim atıl; 120 alanda 310 hasar.',cd:11,shape:'dash',range:170,effect:120,style:'metal',action:'dashburst',damage:310}
 ],
 shapeshifter:[
  {skill:'Pençe biçimi',desc:'125 alanda 380 hasar; 2 sn hız.',cd:9,shape:'self',range:0,effect:125,style:'slash',action:'burst',damage:380,haste:2},
  {skill:'Ruh biçimi',desc:'500 menzilli 290 hasar; 150 can yeniler.',cd:9,shape:'line',range:500,effect:12,style:'mist',action:'shot',damage:290,heal:150}
 ],
 cursed:[
  {skill:'Çürüme küresi',desc:'530 menzilde 80 alan · 330 hasar.',cd:7,shape:'line',range:530,effect:80,style:'mist',action:'shot',damage:330,splash:80},
  {skill:'Kara mühür',desc:'460 menzilde 125 alan · 410 hasar ve yavaşlatma.',cd:11,shape:'ground',range:460,effect:125,style:'mist',action:'zone',damage:410,slow:1.4}
 ],
 holy:[
  {skill:'Şafak oku',desc:'510 menzile 160 hasarlı ışık oku; 250 yakındaki en yaralı müttefiğe 140 can.',cd:8,shape:'line',range:510,effect:12,style:'heal',action:'holyShot',damage:160,heal:140,healRange:250},
  {skill:'Kutsal halka',desc:'190 çevredeki müttefiklere 220 can ve 85 kalkan; hasar vermez.',cd:13,shape:'self',range:0,effect:190,style:'heal',action:'holyCircle',damage:0,heal:220,shield:85}
 ]
};
const extraGarments={
 head:[
  {name:'Prizma başlığı',color:'#9d8ab8',hp:-7,skill:'Işık saçağı',desc:'450 menzilli 670 hasar.',cd:20},
  {name:'Diken tacı',color:'#567f66',hp:0,skill:'Diken kalkanı',desc:'260 can yenile; yakın düşmana 440 hasar.',cd:21},
  {name:'Burç miğferi',color:'#8298a4',hp:22,skill:'Çelik yankı',desc:'140 alanda 620 hasar ve yavaşlatma.',cd:22},
  {name:'İzci kukuletası',color:'#9b8867',hp:5,skill:'Yol sezgisi',desc:'3 sn hız; yavaşlatmayı temizle.',cd:16}
 ],
 armor:[
  {name:'Fırtına cüppesi',color:'#8581b4',hp:-15,speed:1,skill:'Yıldırım alanı',desc:'450 menzilde 140 alan · 380 hasar.',cd:18},
  {name:'Engerek ceketi',color:'#607f67',hp:0,speed:5,skill:'Zehir pelerini',desc:'155 alanda 300 hasar ve yavaşlatma.',cd:17},
  {name:'Burç zırhı',color:'#7c8793',hp:55,speed:-12,skill:'Ağır siper',desc:'2,8 sn %45 hasar azaltma.',cd:21},
  {name:'Yolcu montu',color:'#a08b69',hp:10,speed:4,skill:'Kısa mola',desc:'360 can yenile.',cd:19}
 ],
 boots:[
  {name:'Gök sandaletleri',color:'#9886b3',speed:5,skill:'Rüzgâr adımı',desc:'155 birim atıl; 0,12 sn dokunulmazlık.',cd:11},
  {name:'İz sürücü botları',color:'#5f7866',speed:8,skill:'Keskin depar',desc:'3,5 sn hızlan.',cd:15},
  {name:'Burç sabatonları',color:'#83919d',speed:-6,skill:'Çelik sıçrama',desc:'100 birim atıl; 110 alanda 190 hasar ve 0,7 sn yavaşlatma.',cd:16},
  {name:'Yolcu çizmeleri',color:'#a28b64',speed:4,skill:'Geri çekil',desc:'180 birim geri atıl; kısa dokunulmazlık.',cd:12}
 ]
};
const extraSpells={
 head:[
  [{shape:'line',range:450,effect:12,style:'mist',action:'shot',damage:670},{skill:'Prizma patlaması',desc:'130 alanda 650 hasar.',cd:22,shape:'self',range:0,effect:130,style:'mist',action:'burst',damage:650}],
  [{shape:'self',range:0,effect:135,style:'heal',action:'burst',damage:440,heal:260},{skill:'Kök bağı',desc:'450 menzilde 120 alan · 690 hasar ve yavaşlatma.',cd:23,shape:'ground',range:450,effect:120,style:'heal',action:'zone',damage:690,slow:1.5}],
  [{shape:'self',range:0,effect:140,style:'metal',action:'burst',damage:620,slow:1},{skill:'Kale yemini',desc:'2,5 sn kalkan; 450 can yenile.',cd:20,shape:'self',range:0,effect:40,style:'metal',action:'guard',heal:450}],
  [{shape:'self',range:0,effect:40,style:'mist',action:'haste',haste:3},{skill:'İzci oku',desc:'560 menzilli 690 hasar.',cd:22,shape:'line',range:560,effect:12,style:'arrow',action:'shot',damage:690}]
 ],
 armor:[
  [{shape:'ground',range:450,effect:140,style:'ice',action:'zone',damage:380},{skill:'Fırtına sığınağı',desc:'300 can yenile ve kısa kalkan.',cd:18,shape:'self',range:0,effect:42,style:'ice',action:'guard',heal:300}],
  [{shape:'self',range:0,effect:155,style:'slash',action:'burst',damage:300,slow:1},{skill:'Keskin deri',desc:'4 sn can çalma ve hız.',cd:20,shape:'self',range:0,effect:42,style:'slash',action:'leech',haste:3}],
  [{shape:'self',range:0,effect:40,style:'metal',action:'guard',duration:2.8},{skill:'Burç çarpışı',desc:'145 alanda 270 hasar.',cd:17,shape:'self',range:0,effect:145,style:'metal',action:'burst',damage:270}],
  [{shape:'self',range:0,effect:40,style:'heal',action:'guard',heal:360},{skill:'Yolcu baskını',desc:'130 birim atıl; 120 alanda 210 hasar.',cd:17,shape:'dash',range:130,effect:120,style:'mist',action:'dashburst',damage:210}]
 ],
 boots:[
  [{shape:'dash',range:155,effect:155,style:'mist',action:'dash',invul:.12},{skill:'Gök sıçrayışı',desc:'195 birim atıl; 0,12 sn dokunulmazlık.',cd:16,shape:'dash',range:195,effect:195,style:'mist',action:'dash',invul:.12}],
  [{shape:'self',range:0,effect:40,style:'mist',action:'haste',haste:3.5},{skill:'Avcı kayması',desc:'165 birim atıl.',cd:12,shape:'dash',range:165,effect:165,style:'mist',action:'dash'}],
  [{shape:'dash',range:100,effect:110,style:'metal',action:'dashburst',damage:190,slow:.7},{skill:'Yer sarsıntısı',desc:'145 alanda 195 hasar ve 1,2 sn yavaşlatma.',cd:17,shape:'self',range:0,effect:145,style:'metal',action:'burst',damage:195,slow:1.2}],
  [{shape:'backdash',range:180,effect:180,style:'mist',action:'backdash',invul:.12},{skill:'Yol bulma',desc:'2,5 sn hız; 110 can yenile.',cd:14,shape:'self',range:0,effect:40,style:'heal',action:'haste',haste:2.5,heal:110}]
 ]
};
for(const key of ['head','armor','boots'])for(let i=0;i<4;i++){
 const item=extraGarments[key][i],pair=extraSpells[key][i];garments[key].push(item);garmentAlternates[key].push({...pair[1]});
 pair[0].skill=item.skill;pair[0].desc=item.desc;pair[0].cd=item.cd;
}
const capeBook=[
 {name:'Kızıl pelerin',desc:'Darbe yankısı: aynı hedefe 3 temel isabetten sonra 125 ek hasar · 18 sn.',color:'#a55c65',proc:'thirdAttack'},
 {name:'Gözcü pelerini',desc:'Son siper: HP %30 altına inince 1,4 sn %25 hasar azaltma · 45 sn.',color:'#7f9a82',proc:'lowHealthGuard'},
 {name:'Ayaz pelerini',desc:'Çözülme: stun/root süresini %50 azalt; 1 sn slow koruması · 50 sn.',color:'#8faebe',proc:'ccMitigation'},
 {name:'Atak pelerini',desc:'Atılım ivmesi: temel isabette 2 sn %8 saldırı hızı · 25 sn.',color:'#b49668',proc:'attackHaste'},
 {name:'Ruh pelerini',desc:'Artçı yankı: Q kullandığında bekleyen W süresinden 1,2 sn düş · 30 sn.',color:'#a493b7',proc:'qCooldown'},
 {name:'Şifa pelerini',desc:'Dayanışma izi: başka müttefiğe şifada 3 sn 150 kalkan · 28 sn.',color:'#8da886',proc:'allyBarrier'}
];
accessories.cape=capeBook;wardrobe.cape=-1;
const olderAccessoryStats=accessoryStats;
accessoryStats=function(g){const result=olderAccessoryStats(g),cape=capeBook[g.cape];if(cape)for(const key of Object.keys(result))if(key!=='hp')result[key]+=cape[key]||0;return result;};
const olderApplyGear=applyGear;
applyGear=function(a,g=wardrobe){olderApplyGear(a,g);const off=offhandBook[a.gear.off],cape=capeBook[a.gear.cape];if(cape)a.max+=cape.hp||0;if(off){a.max+=off.hp||0;a.speed+=off.speed||0;for(const stat of ['resist','cooldown','attack','damage'])a.accessory[stat]=(a.accessory[stat]||0)+(off[stat]||0);}if(a.gear.off==='mace'){a.max+=65;a.speed-=3;}if(a.gear.off==='spear'){a.max-=35;a.accessory.damage=(a.accessory.damage||0)+.03;}if(a.gear.off==='runeblade'){a.max-=95;a.accessory.damage=(a.accessory.damage||0)+.02;a.accessory.cooldown=(a.accessory.cooldown||0)+.02;}if(a.gear.off==='sparkmace'){a.max-=70;a.accessory.attack=(a.accessory.attack||0)+.04;a.accessory.cooldown=(a.accessory.cooldown||0)+.02;}if(a.gear.off==='compassdagger'){a.max-=60;a.speed+=6;}a.hp=a.max;};
validGear=function(g){if(!g||!['head','armor','boots'].every(k=>Number.isInteger(g[k])&&g[k]>=0&&g[k]<garments[k].length))return false;
 if(!['ring','necklace','cape'].every(k=>g[k]===undefined||Number.isInteger(g[k])&&g[k]>=-1&&g[k]<accessories[k].length))return false;
 if(g.spells!==undefined&&(!g.spells||!['head','armor','boots'].every(k=>g.spells[k]===0||g.spells[k]===1)))return false;
 if(g.main!==undefined&&(!Object.hasOwn(weaponBook,g.main)||weaponBook[g.main].offhandOnly||!weaponPair(g.main,g.off??-1)))return false;
 if(g.main===undefined&&g.off!==undefined&&g.off!==-1)return false;
 return true;};
const olderGearSkill=gearSkill;
gearSkill=function(slot,a){const main=a?.gear?.main||wardrobe.main;if(slot===0&&familyQ[main]){const q=familyQ[main][a?.loadout?.[0]??weaponChoice[main]??0];return {name:weaponBook[main].name,skill:q.skill,desc:q.desc,color:'#d6c28f'};}return olderGearSkill(slot,a);};
const olderSkillSpec=skillTargetSpec;
skillTargetSpec=function(a,skill){const g=a?.gear||wardrobe,main=g.main;if(skill===0&&familyQ[main]){const q=familyQ[main][a?.loadout?.[0]??weaponChoice[main]??0];return {range:q.range,shape:q.shape,effect:q.effect};}
 const key=spellKeyForSkill[skill],index=g[key];if(key&&index>=5){const spell=extraSpells[key][index-5][g.spells?.[key]??0];return {range:spell.range,shape:spell.shape,effect:spell.effect};}return olderSkillSpec(a,skill);};
function castExpanded(a,slot,spec,target,color){
 const angle=Math.atan2(target.y-a.y,target.x-a.x);a.cd[slot]=spec.cd*(1-(a.accessory?.cooldown||0));a.facing=angle;a.anim=a.animMax=.57;
 effects.push({kind:'ability',style:spec.style,x:a.x,y:a.y,angle,r:Math.max(75,spec.effect||75),life:.6,max:.6,color});
 const burst=(range,value,slow=0)=>{for(const b of actors)if(b.team!==a.team&&b.hp>0&&b.invul<=0&&clearRoute(a,b,0)&&dist(a,b)<=range){damage(b,value,a);b.slow=Math.max(b.slow,slow);}};
 const dash=(distance,invul)=>{move(a,Math.cos(angle)*distance,Math.sin(angle)*distance);a.invul=Math.max(a.invul,invul||0);a.vx=a.vy=0;const control=a.control||input;control.target=null;control.enemy=null;};
 if(spec.action==='dashburst')dash(spec.range,.08);
 if(spec.action==='dash')dash(spec.range,spec.invul);
 if(spec.action==='backdash')dash(-spec.range,spec.invul);
 if(spec.action==='burst'||spec.action==='dashburst')burst(spec.effect,spec.damage||0,spec.slow||0);
 if(spec.action==='shot'||spec.action==='holyShot'){
  const before=shots.length;fire(a,angle,spec.damage||0,540,9,color,spec.splash||0);
  for(const shot of shots.slice(before)){shot.maxRange=spec.range;shot.originX=a.x;shot.originY=a.y;shot.life=(spec.range+shot.r)/Math.max(1,Math.hypot(shot.vx,shot.vy));shot.slowOnHit=spec.slow||0;}
 }
 if(spec.action==='holyShot'){
  // Holy specializes in team sustain. The arrow damages the enemy; healing
  // seeks a nearby injured teammate instead of automatically healing the caster.
  const ally=actors.filter(b=>b.team===a.team&&!b.laneRole&&b.hp>0&&b.hp<b.max&&dist(a,b)<=spec.healRange)
   .sort((b,c)=>b.hp/b.max-c.hp/c.max)[0];
  if(ally)supportHeal(a,ally,spec.heal);
 }
 if(spec.action==='holyCircle'){
  for(const ally of actors)if(ally.team===a.team&&!ally.laneRole&&ally.hp>0&&dist(a,ally)<=spec.effect){
   supportHeal(a,ally,spec.heal);
   if(typeof gearV4Barrier==='function')gearV4Barrier(ally,spec.shield,3);
  }
 }
 if(spec.action==='zone')addZone(a,target,spec.effect,.48,spec.damage||0,color,spec.slow||0);
 if(spec.action==='guard')a.shield=Math.max(a.shield,spec.duration||2.4);
 if(spec.action==='haste')a.haste=Math.max(a.haste,spec.haste||2.5);
 if(spec.action==='leech'){a.leech=Math.max(a.leech,4);a.haste=Math.max(a.haste,spec.haste||2.5);}
 if(spec.haste&&spec.action!=='haste'&&spec.action!=='leech')a.haste=Math.max(a.haste,spec.haste);
 if(spec.heal&&spec.action!=='holyShot'&&spec.action!=='holyCircle')restoreHealth(a,spec.heal*(a.incomingHeal||1));
 if(spec.action==='haste')a.slow=0;
}
const olderCast=cast;
cast=function(a,skill,target){const main=a?.gear?.main,key=spellKeyForSkill[skill],index=a?.gear?.[key];const family=skill===0&&familyQ[main],newCloth=key&&index>=5;
 if(!family&&!newCloth)return olderCast(a,skill,target);
 if(typeof net!=='undefined'&&net.active){net.send({type:'cast',skill,aim:target});return true;}
 if(!a||!target||a.hp<=0||a.cd[skill]>0||phase!=='fight'||paused||!inSkillRange(a,skill,target))return false;
 const spec=family?familyQ[main][a.loadout?.[0]??weaponChoice[main]??0]:extraSpells[key][index-5][a.gear.spells?.[key]??0];
 castExpanded(a,skill,spec,target,family?'#d7bd89':garments[key][index].color);return true;};
const olderDraft=renderDraft;
renderDraft=function(){olderDraft();const panel=$('#draft');if(!panel.querySelector)return;
 for(const button of panel.querySelectorAll('[data-main]'))if(weaponBook[button.dataset.main]?.offhandOnly)button.remove();
 const main=wardrobe.main,options=panel.querySelector('.weapon-options');if(options&&familyQ[main]){options.innerHTML=familyQ[main].map((q,i)=>'<button type="button" data-family-q="'+i+'" aria-pressed="'+(weaponChoice[main]===i)+'"><b>Q · '+q.skill+'</b><small>'+q.desc+' · '+q.cd+' sn</small></button>').join('');options.querySelectorAll('[data-family-q]').forEach(b=>b.onclick=()=>{weaponChoice[main]=+b.dataset.familyQ;renderDraft();});}
 for(const key of ['head','armor','boots'])for(let index=5;index<garments[key].length;index++){const button=panel.querySelector('[data-garment="'+key+':'+index+'"]');if(!button)continue;button.onclick=()=>{wardrobe[key]=index;wardrobe.spells[key]=0;renderDraft();};if(wardrobe[key]!==index)continue;
  const options=document.createElement('div');options.className='item-spell-options';options.innerHTML=extraSpells[key][index-5].map((spell,n)=>'<button type="button" data-spell="'+n+'" aria-pressed="'+(wardrobe.spells[key]===n)+'"><b>'+({boots:'W',armor:'E',head:'R'})[key]+' · '+spell.skill+'</b><small>'+spell.desc+' · '+spell.cd+' sn</small></button>').join('');button.after(options);options.querySelectorAll('[data-spell]').forEach(b=>b.onclick=()=>{wardrobe.spells[key]=+b.dataset.spell;renderDraft();});}
 for(const key of ['head','armor','boots']){const heading=panel.querySelector('[data-garment="'+key+':0"]')?.closest('section')?.querySelector('h3 small');if(heading)heading.textContent=garments[key].length+' SEÇENEK';}
 const grid=panel.querySelector('.accessory-grid');if(grid){const section=document.createElement('section');section.innerHTML='<h4>PELERİN</h4><button class="accessory-empty" data-cape="-1" aria-pressed="'+(wardrobe.cape===-1)+'">Takma</button>'+capeBook.map((cape,i)=>'<button class="garment '+(wardrobe.cape===i?'active':'')+'" data-cape="'+i+'" aria-pressed="'+(wardrobe.cape===i)+'" style="--cloth:'+cape.color+'"><i>◇</i><span><b>'+cape.name+'</b><small>'+cape.desc+'</small></span></button>').join('');grid.append(section);section.querySelectorAll('[data-cape]').forEach(b=>b.onclick=()=>{wardrobe.cape=+b.dataset.cape;renderDraft();});const subtitle=panel.querySelector('.accessory-panel h3 small');if(subtitle)subtitle.textContent='Bir yüzük + bir kolye + bir pelerin · Ek tuş yok';}
 const board=panel.querySelector('.slot-board');if(board){const tile=document.createElement('button');tile.type='button';tile.className='slot-tile';tile.innerHTML='<small>PELERİN</small><b>'+(capeBook[wardrobe.cape]?.name||'Boş')+'</b>';tile.onclick=()=>{activeGearTab='accessories';renderDraft();};board.append(tile);}
 const weaponPage=panel.querySelector('[data-tab="weapons"]');if(weaponPage){const filter=document.createElement('div');filter.className='catalog-filters';filter.innerHTML='<input type="search" aria-label="Silah ara" placeholder="Silah ara…"><span>28 silah ailesi · kalkan / kitap / meşale ikinci elde</span>';weaponPage.prepend(filter);const input=filter.querySelector('input');input.oninput=()=>{const term=input.value.toLocaleLowerCase('tr-TR');for(const card of weaponPage.querySelectorAll('[data-main]'))card.hidden=!weaponBook[card.dataset.main].name.toLocaleLowerCase('tr-TR').includes(term);};}
 const note=panel.querySelector('.draft-note');if(note)note.textContent='28 silah ailesi · 11 ikinci el · '+(garments.head.length+garments.armor.length+garments.boots.length)+' kıyafet · 16 aksesuar · Her raund yeniden seç';
};
const quick=$('.loadouts');if(quick?.querySelectorAll){quick.innerHTML=Object.entries(weaponBook).filter(([,w])=>!w.offhandOnly).map(([id,w])=>'<button class="loadout '+(id===wardrobe.main?'selected':'')+'" data-quick-weapon="'+id+'"><span class="weapon">'+w.icon+'</span><span><b>'+w.name+'</b><small>'+w.hands+' el · '+w.trait+'</small></span><span class="dot"></span></button>').join('');quick.querySelectorAll('[data-quick-weapon]').forEach(button=>button.onclick=()=>{if(phase==='fight'||phase==='between'){notify('Silahı sonraki raundda değiştir.');return;}wardrobe.main=button.dataset.quickWeapon;wardrobe.off=-1;chosen=weaponBook[wardrobe.main].kind;setKit();updateHud();quick.querySelectorAll('[data-quick-weapon]').forEach(x=>x.classList.toggle('selected',x===button));});}
