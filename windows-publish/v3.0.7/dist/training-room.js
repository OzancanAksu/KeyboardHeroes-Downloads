'use strict';
/* Local build training, same damage pipeline as ordinary matches. No ranked reporting. */
(()=>{
 const entry=document.getElementById('training-open'),panel=document.getElementById('training-overlay');
 if(!entry||!panel)return;
 const DUMMY_HP=10000,HEAL_PER_SECOND=50,RESPAWN_SECONDS=5,DUMMY_X=170,DUMMY_Y=0;
 const get=id=>document.getElementById(id);
 const pretty=value=>Math.max(0,Math.round(value)).toLocaleString('tr-TR');
 let active=false,saved=null,elapsed=0,respawnIn=null,total=0,kills=0,best=0,history=[];
 const dummy=()=>actors.find(a=>a.trainingDummy);
 const connected=()=>typeof net!=='undefined'&&!!net.active;
 function updatePanel(){
  if(!active)return;
  const d=dummy(),hp=d?.hp||0;
  get('training-hp').textContent=pretty(hp)+' / '+pretty(DUMMY_HP);
  get('training-hp-fill').style.width=Math.max(0,Math.min(100,hp/DUMMY_HP*100))+'%';
  get('training-status').textContent=respawnIn!==null?'YENİ HEDEF · '+Math.ceil(Math.max(0,respawnIn))+' SN':'HEDEF HAZIR';
  while(history.length&&history[0].at<elapsed-5)history.shift();
  const rolling=history.reduce((sum,hit)=>sum+hit.amount,0);
  const seconds=Math.max(.1,Math.min(5,elapsed));
  get('training-dps').textContent=pretty(rolling/seconds);
  get('training-total').textContent=pretty(total);
  get('training-kills').textContent=pretty(kills);
  get('training-best').textContent=pretty(best);
  get('timer').textContent='∞';
  get('roundLabel').textContent='SÜRESİZ · DENEME ODASI';
  const draft=get('draft-timer');if(draft)draft.textContent='EKİPMAN SEÇİMİ · SÜRE SINIRI YOK';
  const footer=document.querySelector('.arena-bottom span:last-child');
  if(footer)footer.textContent='Deneme odası · İstediğin zaman çık';
  const rebuild=get('training-rebuild');if(rebuild)rebuild.classList.toggle('hidden',phase!=='fight');
 }
 function createDummy(){
  const old=dummy(),d=actor(1,DUMMY_X,DUMMY_Y,'blade',false);
  d.trainingDummy=true;d.displayName='ANTRENMAN HEDEFİ';d.hp=d.max=DUMMY_HP;
  d.speed=0;d.attack=0;d.shield=0;d.invul=0;d.slow=0;d.hit=0;d.stun=0;d.root=0;d.wear=0;d.ai=Infinity;
  d.cd=[0,0,0,0];d.gear=null;d.accessory={};
  if(old){actors[actors.indexOf(old)]=d;}
  else if(actors.length>1)actors[1]=d;
  else actors.push(d);
  respawnIn=null;
  input.enemy=null;input.selectedEnemy=null;
  return d;
 }
 function openTraining(){
  if(connected()){notify('Deneme odası için önce çevrimiçi odadan ayrıl.');return;}
  if(phase!=='idle'&&phase!=='end'){notify('Önce mevcut maçtan çık.');return;}
  if(!requirePlayerName())return;
  saved={mode,matchType,arenaLayout,arenaSize};
  active=true;elapsed=0;respawnIn=null;total=0;kills=0;best=0;history=[];
  document.body.classList.add('kh-training-room');panel.classList.remove('hidden');
  matchType='training';mode=1;score=[0,0];round=1;
  setArenaLayout('courtyard');setArenaSize('standard');
  setupRound();actors[0].x=-150;actors[0].y=0;camera={x:0,y:0};
  createDummy();clock=Infinity;paused=false;
  get('arena-name').textContent='DENEME ODASI';updateHud();
  notify('Build seç · Süre sınırsız · Hedef 10.000 can, saniyede +50 yenilenme.');
 }
 const rebuild=get('training-rebuild');
 if(rebuild)rebuild.addEventListener('click',()=>{
  if(!active||phase!=='fight'||connected())return;
  elapsed=0;respawnIn=null;total=0;kills=0;best=0;history=[];
  shots=[];zones=[];effects=[];floating=[];
  createDummy();phase='draft';clock=Infinity;paused=false;
  input.keys.clear();input.down=false;input.target=null;
  openDraft();updateHud();
  notify('Yeni build seç · Hedef ve hasar istatistikleri sıfırlandı.');
 });
 const regularConfirm=confirmBuild;
 confirmBuild=function(){
  const wasDraft=active&&phase==='draft';regularConfirm();
  if(wasDraft&&phase==='fight'){
   actors[0].x=-150;actors[0].y=0;clock=Infinity;
   get('banner').classList.add('hidden');
   notify('Deneme başladı · Dummy sabit durur · Öldüğünde 5 sn sonra yeniden doğar.');
   updatePanel();
  }
 };
 const regularBot=bot;
 bot=function(a,dt){if(active&&a?.trainingDummy)return;return regularBot(a,dt);};
 const regularRespawn=respawnActor;
 respawnActor=function(a,dt){if(active&&a?.trainingDummy)return;return regularRespawn(a,dt);};
 const regularStep=stepObjectives;
 stepObjectives=function(dt){if(active)return;return regularStep(dt);};
 const regularReset=resetObjectives;
 resetObjectives=function(){regularReset();if(active)controlPoints=[];};
 const regularDamage=damage;
 damage=function(a,value,source){
  const before=active&&a?.trainingDummy?a.hp:null,result=regularDamage(a,value,source);
  if(before!==null&&before>0){
   const actual=Math.max(0,before-a.hp);
   if(actual>0){
    total+=actual;best=Math.max(best,actual);history.push({at:elapsed,amount:actual});
    if(a.hp<=0&&respawnIn===null){respawnIn=RESPAWN_SECONDS;kills++;notify('Hedef imha edildi! 5 saniye içinde yeni hedef doğacak.');}
   }
  }
  return result;
 };
 const regularUpdate=update;
 update=function(dt){
  const result=regularUpdate(dt);
  if(!active)return result;
  if(phase==='fight'&&!paused&&!connected()){
   const step=Math.max(0,Number(dt)||0);
   elapsed+=step;
   const d=dummy();
   if(d){
    d.x=DUMMY_X;d.y=DUMMY_Y;
    if(respawnIn!==null){respawnIn=Math.max(0,respawnIn-step);if(respawnIn<1e-6)createDummy();}
    else if(d.hp>0)d.hp=Math.min(DUMMY_HP,d.hp+HEAL_PER_SECOND*step);
   }
  }
  updatePanel();
  return result;
 };
 const regularHud=updateHud;
 updateHud=function(){regularHud();if(active)updatePanel();};
 const regularDrawChampion=drawChampion;
 drawChampion=function(a){
  if(!active||!a?.trainingDummy)return regularDrawChampion(a);
  if(a.hp<=0){ellipse(a.x,a.y,24,'#644438',.3);return;}
  ellipse(a.x,a.y+9,33,'#1a2d32',.55);ring(a.x,a.y,32,'#e0b96b',3);
  const p=project(a.x,a.y,58);
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);
  ctx.fillStyle='#4a3834';ctx.fillRect(-7,-19,14,69);
  ctx.fillStyle='#9d7051';ctx.fillRect(-5,-17,10,62);
  ctx.fillStyle='#c9a279';ctx.fillRect(-33,-54,66,56);
  ctx.strokeStyle='#5f4540';ctx.lineWidth=5;ctx.strokeRect(-33,-54,66,56);
  for(const [radius,color] of [[25,'#58454b'],[18,'#e6d0a3'],[10,'#a95b53'],[4,'#f3e7cc']]){
   ctx.beginPath();ctx.arc(0,-26,radius,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  }
  ctx.fillStyle='#182b30';ctx.fillRect(-40,-82,80,11);
  ctx.fillStyle='#76d8b5';ctx.fillRect(-39,-81,78*a.hp/DUMMY_HP,9);
  ctx.fillStyle='#ffebbe';ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.fillText('HEDEF',0,-91);
  ctx.restore();
 };
 const regularLeave=leaveBotMatch;
 leaveBotMatch=function(){
  if(!active)return regularLeave();
  active=false;panel.classList.add('hidden');document.body.classList.remove('kh-training-room');if(rebuild)rebuild.classList.add('hidden');
  const former=saved;saved=null;respawnIn=null;history=[];
  if(former){matchType=former.matchType;mode=former.mode;}
  regularLeave();
  if(former){setArenaLayout(former.arenaLayout);setArenaSize(former.arenaSize);}
  refreshExitButtons();
 };
 entry.addEventListener('click',openTraining);
 window.khTrainingRoom={get active(){return active;},open:openTraining,getSnapshot:()=>({active,hp:dummy()?.hp||0,respawnIn,elapsed,total,kills,best})};
})();