'use strict';
// Keyboard Heroes 3.0.8 — deterministic, server-authoritative legendary main weapons.
// Q is a two-option weapon skill, matching the existing inventory's Q1/Q2 selector.
const KH308_WEAPONS={
 twinaxe:{name:'İkiz Balta',kind:'blade',hands:2,hp:-25,speed:0,power:1,attack:0,q:0,
  icon:'⚒',trait:'2600 temel can · iki elde tokmak sırtlı el baltası',off:'İki eli de doldurur'},
 legendshield:{name:'Destan Kalkanı',kind:'blade',hands:2,hp:-31.25,speed:-4,power:1,attack:0,q:0,
  icon:'⛨',trait:'2550 temel can · geniş dikenli ana kalkan',off:'İkinci eli kilitler'}
};
const KH308_Q={
 twinaxe:[
  {skill:'Hat Darbesi',desc:'1 sn odaklan; 330 hat boyunca 60 hasar ve 1,5 sn stun. Stun ile cast kesilir; bekleme yine başlar.',cd:11,shape:'line',range:330,effect:48,damage:60,stun:1.5,castTime:1},
  {skill:'Balta Girdabı',desc:'360 menzilde 145 çaplı alanda 3 sn dönen balta; her saniye 70 hasar (toplam 210).',cd:9,shape:'ground',range:360,effect:145,damage:70,duration:3}
 ],
 legendshield:[
  {skill:'Kale Duvarı',desc:'2 sn odaklan; 4 sn aura: yakın düşmanlara 90 hasar/sn ve %70 hasar azaltımı. Stun sonlandırır.',cd:12,shape:'self',range:0,effect:145,damage:90,castTime:2,duration:4},
  {skill:'Toslama',desc:'2,5 sn 110 hızla atıl; şeritteki dost/düşmanı konuma göre savur. Çarpışanlara 2×140 hasar, %50 hasar azaltımı.',cd:10,shape:'dash',range:275,effect:52,damage:280,duration:2.5,speed:110}
 ]
};
Object.assign(weaponBook,KH308_WEAPONS);
weaponChoice.twinaxe=0;weaponChoice.legendshield=0;
weaponVariantNames.twinaxe=['İkiz Balta'];weaponVariantNames.legendshield=['Destan Kalkanı'];
// Existing balancing and skill-tooltip code reads this shared catalog.
Object.assign(GEAR_V4_Q,KH308_Q);
function kh308AbilityId(a){return a?.gear?.main;}
function kh308Combat(){return phase==='fight'&&!paused&&!(typeof net!=='undefined'&&net.active);}
function kh308Fx(x,y,r,color,style='metal',life=.42){
 effects.push({kind:'ability',style,x,y,r,angle:0,color,life,max:life});
 if(effects.length>160)effects.splice(0,effects.length-160);
}
function kh308Hit(source,target,amount){
 // New Q values are already in combat HP; never apply legacy slot-0 x4.5.
 const old=source.skillSlot,oldRatio=source.balanceV6CastingQ;
 source.skillSlot=null;source.balanceV6CastingQ=null;
 try{damage(target,amount,source);}finally{source.skillSlot=old;source.balanceV6CastingQ=oldRatio;}
}
function kh308Segment(a,b,x,y,range,width){
 const dx=Math.cos(a),dy=Math.sin(a),ox=x-b.x,oy=y-b.y;
 const along=ox*dx+oy*dy,side=Math.abs(ox*dy-oy*dx);
 return along>=-12&&along<=range+18&&side<=width;
}
function kh308FinishChannel(a){
 const ch=a.kh308Channel;
 if(!ch)return;
 a.kh308Channel=null;
 if(ch.kind==='twinaxe'){
  for(const b of actors){
   if(b===a||b.team===a.team||b.hp<=0||b.invul>0||b.laneRole)continue;
   if(!kh308Segment(ch.angle,a,b.x,b.y,330,48)||!clearRoute(a,b,0))continue;
   kh308Hit(a,b,60);
   if(b.hp>0&&b.invul<=0)b.stun=Math.max(b.stun||0,1.5);
  }
  kh308Fx(a.x+Math.cos(ch.angle)*115,a.y+Math.sin(ch.angle)*115,125,'#d9d0b0','slash',.55);
 }else if(ch.kind==='legendshield'){
  a.kh308Aura={remaining:4,tick:0};a.kh308Guard=.70;
  kh308Fx(a.x,a.y,145,'#f4cf87','metal',.65);
 }
}
function kh308Step(dt){
 if(!kh308Combat())return;
 const step=Math.min(.15,Math.max(0,dt));
 for(const a of actors){
  if(a.kh308Channel){
   const ch=a.kh308Channel;
   if(a.hp<=0||(a.stun||0)>0){a.kh308Channel=null;kh308Fx(a.x,a.y,60,'#9b8b8b','mist',.22);}
   else{ch.remaining-=step;if(ch.remaining<=1e-8)kh308FinishChannel(a);}
  }
  if(a.kh308Aura){
   const aura=a.kh308Aura;
   if(a.hp<=0||(a.stun||0)>0){a.kh308Aura=null;a.kh308Guard=0;}
   else{
    const time=Math.min(step,aura.remaining);aura.remaining-=time;aura.tick+=time;
    while(aura.tick>=1-1e-8){
     aura.tick-=1;
     for(const b of actors)if(b!==a&&b.team!==a.team&&b.hp>0&&!b.laneRole&&
       dist(a,b)<=145&&clearRoute(a,b,0))kh308Hit(a,b,90);
     kh308Fx(a.x,a.y,145,'#edc789','metal');
    }
    if(aura.remaining<=1e-8){a.kh308Aura=null;a.kh308Guard=0;}
   }
  }
  if(a.kh308Rush){
   const rush=a.kh308Rush;
   if(a.hp<=0||(a.stun||0)>0){a.kh308Rush=null;a.kh308Guard=0;continue;}
   const travel=Math.min(step,rush.remaining);
   const start={x:a.x,y:a.y};
   move(a,Math.cos(rush.angle)*110*travel,Math.sin(rush.angle)*110*travel);
   rush.remaining-=travel;
   // Continuous collision test over the swept strip; one collision per actor.
   const traveled=Math.hypot(a.x-start.x,a.y-start.y);
   for(const b of actors){
    if(b===a||b.hp<=0||b.laneRole||rush.hits[b.id])continue;
    const forward=(b.x-start.x)*Math.cos(rush.angle)+(b.y-start.y)*Math.sin(rush.angle);
    const side=-(b.x-start.x)*Math.sin(rush.angle)+(b.y-start.y)*Math.cos(rush.angle);
    if(forward< -19||forward>traveled+44||Math.abs(side)>52)continue;
    rush.hits[b.id]=true;
    if(b.invul<=0){kh308Hit(a,b,140);if(b.hp>0)kh308Hit(a,b,140);}
    // Side-dependent outward impulse. Central contact is pushed forward.
    const pushAngle=rush.angle+(Math.abs(side)<16?0:side>0?Math.PI/2:-Math.PI/2);
    move(b,Math.cos(pushAngle)*70,Math.sin(pushAngle)*70);
    b.root=Math.max(b.root||0,.16);
    kh308Fx(b.x,b.y,48,'#e4b67a','metal',.33);
   }
   if(rush.remaining<=1e-8){a.kh308Rush=null;a.kh308Guard=0;}
  }
 }
 for(let i=kh308Zones.length-1;i>=0;i--){
  const z=kh308Zones[i];
  if(z.owner.hp<=0||!actors.includes(z.owner)){kh308Zones.splice(i,1);continue;}
  const time=Math.min(step,z.remaining);z.remaining-=time;z.tick+=time;
  while(z.tick>=1-1e-8){
   z.tick-=1;
   for(const b of actors)if(b!==z.owner&&b.team!==z.owner.team&&b.hp>0&&!b.laneRole&&
    dist(z,b)<=145)kh308Hit(z.owner,b,70);
   kh308Fx(z.x,z.y,145,'#c5bfdf','slash',.45);
  }
  if(z.remaining<=1e-8)kh308Zones.splice(i,1);
 }
}
const kh308Zones=[];
const kh308PreviousApply=applyGear;
applyGear=function(a,g=wardrobe){
 kh308PreviousApply(a,g);
 const id=kh308AbilityId(a);
 if(!KH308_WEAPONS[id])return;
 // Base 2800 blade HP + -200/-250 weapon modifier; preserve equipped armor bonuses.
 // The new weapons already pay their lower HP budget, so do not subtract it twice.
 if(a.balanceV6?.hpPenalty)a.max+=a.balanceV6.hpPenalty;
 a.hp=a.max;
 a.kh308Channel=null;a.kh308Aura=null;a.kh308Rush=null;a.kh308Guard=0;
};
const kh308PreviousCast=cast;
cast=function(a,slot,target){
 const id=kh308AbilityId(a);
 if(slot!==0||!KH308_Q[id])return kh308PreviousCast(a,slot,target);
 if(typeof net!=='undefined'&&net.active){if(target)net.send({type:'cast',skill:slot,aim:target});return true;}
 if(!a||!target||a.hp<=0||a.cd[0]>0||(a.stun||0)>0||!kh308Combat()||a.kh308Channel||a.kh308Rush)return false;
 const choice=a.loadout?.[0]??weaponChoice[id]??0,q=KH308_Q[id][choice];
 if(!q)return false;
 const angle=Math.atan2(target.y-a.y,target.x-a.x);
 if(choice===1&&id==='twinaxe'&&dist(a,target)>360)return false;
 a.cd[0]=q.cd*(1-Math.min(.12,a.accessory?.cooldown||0));a.facing=angle;
 a.anim=a.animMax=.55;
 if(choice===0){
  a.kh308Channel={kind:id,remaining:q.castTime,angle};
  kh308Fx(a.x,a.y,70,id==='twinaxe'?'#cec8da':'#f4c878','arcane',.45);
 }else if(id==='twinaxe'){
  const d=Math.min(360,dist(a,target)),p={x:a.x+Math.cos(angle)*d,y:a.y+Math.sin(angle)*d};
  kh308Zones.push({owner:a,x:p.x,y:p.y,remaining:3,tick:0});
  kh308Fx(p.x,p.y,145,'#d4bce1','slash',.75);
 }else{
  a.kh308Rush={remaining:2.5,angle,hits:Object.create(null)};
  a.kh308Guard=.50;
  kh308Fx(a.x,a.y,80,'#edbe7d','metal',.65);
 }
 return true;
};
const kh308PreviousDamage=damage;
damage=function(target,value,source){
 if(target&&target.hp>0&&target.kh308Guard>0)value*=1-target.kh308Guard;
 return kh308PreviousDamage(target,value,source);
};
const kh308PreviousUpdate=update;
update=function(dt){
 if(kh308Combat())kh308Step(dt);
 return kh308PreviousUpdate(dt);
};
const kh308PreviousPlayerStep=playerStep;
playerStep=function(a,dt){if(a?.kh308Channel||a?.kh308Rush)return;return kh308PreviousPlayerStep(a,dt);};
const kh308PreviousBot=bot;
bot=function(a,dt){if(a?.kh308Channel||a?.kh308Rush)return;return kh308PreviousBot(a,dt);};
const kh308PreviousAttack=attack;
attack=function(a,target){if(a?.kh308Channel||a?.kh308Rush)return;return kh308PreviousAttack(a,target);};
const kh308PreviousSkill=gearSkill;
gearSkill=function(slot,a){
 const id=a?.gear?.main||wardrobe.main;
 if(slot===0&&KH308_Q[id]){
  const index=a?.loadout?.[0]??weaponChoice[id]??0,q=KH308_Q[id][index];
  return {name:weaponBook[id].name,skill:q.skill,desc:q.desc,color:'#edca9b',cd:q.cd};
 }
 return kh308PreviousSkill(slot,a);
};
const kh308PreviousSpec=skillTargetSpec;
skillTargetSpec=function(a,slot){
 const id=a?.gear?.main||wardrobe.main;
 if(slot===0&&KH308_Q[id]){
  const choice=a?.loadout?.[0]??weaponChoice[id]??0,q=KH308_Q[id][choice];
  return {range:q.range,shape:q.shape,effect:q.effect};
 }
 return kh308PreviousSpec(a,slot);
};
const kh308PreviousDraft=renderDraft;
renderDraft=function(){
 kh308PreviousDraft();
 const id=wardrobe.main,options=document.querySelector('#draft .weapon-options');
 if(!options||!KH308_Q[id])return;
 options.innerHTML=KH308_Q[id].map((q,i)=>'<button type="button" data-kh308-q="'+i+'" aria-pressed="'+(weaponChoice[id]===i)+'"><b>Q'+(i+1)+' · '+q.skill+'</b><small>'+q.desc+' · '+q.cd+' sn bekleme</small></button>').join('');
 options.querySelectorAll('[data-kh308-q]').forEach(b=>b.onclick=()=>{weaponChoice[id]=Number(b.dataset.kh308Q);renderDraft();});
};
// Existing quick-weapon sidebar is built before this module; add the two new main weapons.
const kh308Sidebar=document.querySelector('.loadouts');
if(kh308Sidebar&&typeof document.createElement==='function'&&typeof kh308Sidebar.append==='function'){
 for(const id of Object.keys(KH308_WEAPONS)){
  const w=weaponBook[id],btn=document.createElement('button');
  btn.type='button';btn.className='loadout';btn.dataset.quickWeapon=id;
  btn.innerHTML='<span class="weapon">'+w.icon+'</span><span><b>'+w.name+'</b><small>2 el · '+w.trait+'</small></span><span class="dot"></span>';
  btn.onclick=()=>{
   if(phase==='fight'||phase==='between'){notify('Silahı sonraki raundda değiştir.');return;}
   wardrobe.main=id;wardrobe.off=-1;chosen=w.kind;weaponChoice[id]=weaponChoice[id]??0;
   setKit();updateHud();kh308Sidebar.querySelectorAll('[data-quick-weapon]').forEach(x=>x.classList.toggle('selected',x===btn));
  };
  kh308Sidebar.append(btn);
 }
}
