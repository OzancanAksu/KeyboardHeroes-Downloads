'use strict';
// v3.2.0 — server-authoritative two-handed main weapons.
// Q1/Q2 use the existing single active Q choice (loadout[0] in match).
const KH320_WEAPONS={
 feardagger:{name:'Korku Hançeri',kind:'blade',hands:2,hp:-100,speed:6,power:1,attack:0,q:0,
  icon:'🗡',trait:'2000 temel can · çift korku hançeri · kaçınma ve çılgınlık',off:'İki elde korku hançeri'},
 boxinggloves:{name:'Boks Eldiveni',kind:'blade',hands:2,hp:-50,speed:0,power:1,attack:0,q:0,
  icon:'🥊',trait:'2400 temel can · çift darbeli ön/arka kombosu',off:'İki el boks'}
};
const KH320_Q={
 feardagger:[
  {skill:'Hayalet Sıçrayışı',desc:'Hedefe 220 birim sıçra. Geçtiğin veya indiğin rakiplere bir kez 150 hasar ver, 2 sn görünmez ol. Sonrasında 1 sn temel saldırı hasarı −%60.',cd:12,shape:'dash',range:220,effect:44,damage:150,stealth:2,weak:1},
  {skill:'Kızıl Çılgınlık',desc:'3 sn boyunca kırmızı aura, +%210 temel saldırı hızı (3,1 kat) ve +%40 koşma hızı.',cd:16,shape:'self',range:0,effect:86,duration:3,attackSpeed:3.1,moveSpeed:1.4}
 ],
 boxinggloves:[
  {skill:'Dörtlü Yumruk',desc:'2 öne + 2 arkaya yumruk; her isabet 90 hasar. Her yumruk ayrı vuruş olarak hesaplanır.',cd:11,shape:'self',range:0,effect:92,damage:90,hits:4,duration:.62},
  {skill:'Geri Sekme',desc:'Baktığın yönün tersine 100 birim geri çekil ve 220 can yenile.',cd:12,shape:'dash',range:100,effect:42,heal:220}
 ]
};
Object.assign(weaponBook,KH320_WEAPONS);
Object.assign(GEAR_V4_Q,KH320_Q);
// Inventory is populated via familyQ. Without this mapping the skills
// misleadingly fall back to generic blade Q choices.
Object.assign(familyQ,KH320_Q);
for(const id of Object.keys(KH320_WEAPONS)){
 weaponChoice[id]=0;
 weaponVariantNames[id]=[KH320_WEAPONS[id].name];
}
function kh320Playing(){return phase==='fight'&&!paused&&!(typeof net!=='undefined'&&net.active);}
function kh320Fx(style,x,y,extra={}){
 const {life=.38,...attrs}=extra;
 effects.push({kind:'ability',style,x,y,...attrs,life,max:life});
 if(effects.length>145)effects.splice(0,effects.length-145);
}
function kh320Clear(owner,style){
 effects=effects.filter(e=>!(e.style===style&&e.khOwner===owner.id));
}
function kh320SegmentDistance(p,start,end){
 const dx=end.x-start.x,dy=end.y-start.y,length=dx*dx+dy*dy;
 const t=length?Math.max(0,Math.min(1,((p.x-start.x)*dx+(p.y-start.y)*dy)/length)):0;
 return Math.hypot(p.x-start.x-dx*t,p.y-start.y-dy*t);
}
function kh320Step(dt){
 if(!kh320Playing())return;
 const step=Math.max(0,Math.min(.15,dt));
 for(const a of actors){
  if(a.hp<=0){
   if(a.khFearHidden>0)a.stealth=0;
   a.khFearHidden=0;a.khFearFrenzy=0;a.khFearWeak=0;a.khBoxCombo=null;
   kh320Clear(a,'kh320-frenzy');
   continue;
  }
  if(a.khFearHidden>0){
   a.khFearHidden=Math.max(0,a.khFearHidden-step);
   if(a.khFearHidden<=0){
    a.stealth=0;
    a.khFearWeak=1;
    kh320Fx('kh320-fear-fade',a.x,a.y,{life:.47,khOwner:a.id});
   }else a.stealth=Math.max(a.stealth||0,a.khFearHidden);
  }else if(a.khFearWeak>0)a.khFearWeak=Math.max(0,a.khFearWeak-step);
  if(a.khFearFrenzy>0){
   a.khFearFrenzy=Math.max(0,a.khFearFrenzy-step);
   if(a.khFearFrenzy<=0){
    kh320Clear(a,'kh320-frenzy');
    kh320Fx('kh320-frenzy-end',a.x,a.y,{khOwner:a.id});
   }
  }
  const combo=a.khBoxCombo;
  if(combo){
   if((a.stun||0)>0){a.khBoxCombo=null;continue;}
   combo.elapsed+=step;
   while(combo.hit<4&&combo.elapsed>=.12+combo.hit*.14){
    // First two punches forward, final two rearward.
    const hitIndex=combo.hit++,forward=hitIndex<2;
    const angle=combo.angle+(forward?0:Math.PI);
    const from={x:a.x,y:a.y};
    kh320Fx('kh320-box-punch',a.x,a.y,{life:.32,angle,hitIndex,khOwner:a.id});
    for(const b of actors){
     if(b===a||b.hp<=0||b.team===a.team||b.laneRole||b.invul>0)continue;
     const d=dist(a,b),ang=Math.atan2(b.y-a.y,b.x-a.x);
     if(d>92||Math.cos(ang-angle)<.48||!clearRoute(from,b,0))continue;
     kh308Hit(a,b,90);
     kh320Fx('kh320-box-hit',b.x,b.y,{life:.35,angle,khOwner:a.id});
    }
   }
   if(combo.hit>=4&&combo.elapsed>=.62)a.khBoxCombo=null;
  }
 }
}
const kh320OldApply=applyGear;
applyGear=function(a,g=wardrobe){
 kh320OldApply(a,g);
 if(!KH320_WEAPONS[a?.gear?.main])return;
 // Blade baseline 2800; weapon stats -100*8 or -50*8.
 // Like the prior twin-axe/shield, do not double-apply budget HP penalties.
 if(a.balanceV6?.hpPenalty)a.max+=a.balanceV6.hpPenalty;
 a.hp=a.max;a.khFearHidden=0;a.khFearWeak=0;a.khFearFrenzy=0;a.khBoxCombo=null;
};
const kh320OldCast=cast;
cast=function(a,slot,target){
 const id=a?.gear?.main;
 if(slot!==0||!KH320_Q[id])return kh320OldCast(a,slot,target);
 if(typeof net!=='undefined'&&net.active){
  if(target)net.send({type:'cast',skill:slot,aim:target});
  return true;
 }
 if(!a||a.hp<=0||a.cd[0]>0||(a.stun||0)>0||!kh320Playing()||a.khBoxCombo)return false;
 const choice=a.loadout?.[0]??weaponChoice[id]??0,q=KH320_Q[id][choice];
 if(!q)return false;
 const aim=target&&Number.isFinite(target.x)&&Number.isFinite(target.y)?target:{x:a.x+Math.cos(a.facing||0)*10,y:a.y+Math.sin(a.facing||0)*10};
 const angle=Math.atan2(aim.y-a.y,aim.x-a.x);
 a.cd[0]=q.cd*(1-Math.min(.12,a.accessory?.cooldown||0));
 a.anim=a.animMax=.55;
 if(id==='feardagger'&&choice===0){
  const start={x:a.x,y:a.y},distance=Math.min(220,dist(a,aim));
  a.facing=angle;
  move(a,Math.cos(angle)*distance,Math.sin(angle)*distance);
  // Terrain clamping may shorten the jump; use the actual endpoint.
  const end={x:a.x,y:a.y};
  for(const b of actors)if(b!==a&&b.team!==a.team&&b.hp>0&&!b.laneRole&&
    kh320SegmentDistance(b,start,end)<=44){
   kh308Hit(a,b,150); // each opponent once, not twice at landing
   kh320Fx('kh320-fear-hit',b.x,b.y,{khOwner:a.id,life:.42});
  }
  a.khFearHidden=2;a.khFearWeak=0;a.stealth=Math.max(a.stealth||0,2);
  kh320Fx('kh320-fear-jump',start.x,start.y,{tx:end.x,ty:end.y,life:.47,khOwner:a.id});
  kh320Fx('kh320-fear-mist',end.x,end.y,{life:.7,khOwner:a.id});
 }else if(id==='feardagger'){
  a.khFearFrenzy=3;
  kh320Fx('kh320-frenzy',a.x,a.y,{life:3,r:86,khOwner:a.id});
 }else if(choice===0){
  a.facing=angle;
  a.khBoxCombo={angle,elapsed:0,hit:0};
  kh320Fx('kh320-box-ready',a.x,a.y,{life:.3,khOwner:a.id});
 }else{
  const back=a.facing||0,start={x:a.x,y:a.y};
  move(a,-Math.cos(back)*100,-Math.sin(back)*100);
  a.hp=Math.min(a.max,a.hp+220);
  kh320Fx('kh320-box-retreat',start.x,start.y,{tx:a.x,ty:a.y,life:.42,khOwner:a.id});
  kh320Fx('kh320-box-heal',a.x,a.y,{life:.55,khOwner:a.id});
 }
 return true;
};
const kh320OldAttack=attack;
attack=function(a,target){
 if(a?.khBoxCombo)return;
 const wasReady=!!a&&a.attack<=0&&a.hp>0;
 if(a)a.khFearBasic=(a.gear?.main==='feardagger'&&wasReady);
 try{
  const result=kh320OldAttack(a,target);
  // 210% *increase*: resulting attacks per second = 3.1x, not 2.1x.
  if(wasReady&&a?.attack>0&&a.gear?.main==='feardagger'&&a.khFearFrenzy>0)
   a.attack/=3.1;
  return result;
 }finally{if(a)a.khFearBasic=false;}
};
const kh320OldDamage=damage;
damage=function(target,value,source){
 if(source?.khFearBasic&&source.khFearWeak>0&&source.gear?.main==='feardagger')
  value*=.4;
 return kh320OldDamage(target,value,source);
};
const kh320OldUpdate=update;
update=function(dt){
 if(kh320Playing())kh320Step(dt);
 return kh320OldUpdate(dt);
};
function kh320MoveBonus(a,before){
 if(!a||a.hp<=0||a.gear?.main!=='feardagger'||a.khFearFrenzy<=0)return;
 const dx=a.x-before.x,dy=a.y-before.y,travel=Math.hypot(dx,dy);
 if(travel>.01&&travel<40)move(a,dx*.4,dy*.4);
}
const kh320OldPlayerStep=playerStep;
playerStep=function(a,dt){
 const before={x:a.x,y:a.y};const result=kh320OldPlayerStep(a,dt);
 kh320MoveBonus(a,before);return result;
};
const kh320OldBot=bot;
bot=function(a,dt){
 const before={x:a.x,y:a.y};const result=kh320OldBot(a,dt);
 kh320MoveBonus(a,before);return result;
};
const kh320OldSkill=gearSkill;
gearSkill=function(slot,a){
 const id=a?.gear?.main||wardrobe.main;
 if(slot===0&&KH320_Q[id]){
  const index=a?.loadout?.[0]??weaponChoice[id]??0,q=KH320_Q[id][index];
  return {name:weaponBook[id].name,skill:q.skill,desc:q.desc,color:id==='feardagger'?'#e994ac':'#e5b77a',cd:q.cd};
 }
 return kh320OldSkill(slot,a);
};
const kh320OldSpec=skillTargetSpec;
skillTargetSpec=function(a,slot){
 const id=a?.gear?.main||wardrobe.main;
 if(slot===0&&KH320_Q[id]){
  const choice=a?.loadout?.[0]??weaponChoice[id]??0,q=KH320_Q[id][choice];
  return {range:q.range,shape:q.shape,effect:q.effect};
 }
 return kh320OldSpec(a,slot);
};
const kh320OldDraft=renderDraft;
renderDraft=function(){
 kh320OldDraft();
 const id=wardrobe.main,options=document.querySelector('#draft .weapon-options');
 if(!options||!KH320_Q[id])return;
 options.innerHTML=KH320_Q[id].map((q,i)=>'<button type="button" data-kh320-q="'+i+'" aria-pressed="'+(weaponChoice[id]===i)+'"><b>Q'+(i+1)+' · '+q.skill+'</b><small>'+q.desc+' · '+q.cd+' sn bekleme</small></button>').join('');
 options.querySelectorAll('[data-kh320-q]').forEach(b=>b.onclick=()=>{weaponChoice[id]=Number(b.dataset.kh320Q);renderDraft();});
};
const kh320Sidebar=document.querySelector('.loadouts');
if(kh320Sidebar&&typeof document.createElement==='function'&&typeof kh320Sidebar.append==='function'){
 for(const id of Object.keys(KH320_WEAPONS)){
  const w=weaponBook[id],btn=document.createElement('button');
  btn.type='button';btn.className='loadout';btn.dataset.quickWeapon=id;
  btn.innerHTML='<span class="weapon">'+w.icon+'</span><span><b>'+w.name+'</b><small>2 el · '+w.trait+'</small></span><span class="dot"></span>';
  btn.onclick=()=>{
   if(phase==='fight'||phase==='between'){notify('Silahı sonraki raundda değiştir.');return;}
   wardrobe.main=id;wardrobe.off=-1;chosen='blade';
   setKit();updateHud();
   kh320Sidebar.querySelectorAll('[data-quick-weapon]').forEach(x=>x.classList.toggle('selected',x===btn));
  };
  kh320Sidebar.append(btn);
 }
}
