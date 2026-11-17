'use strict';

const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),os=require('node:os');
const {WebSocketServer,WebSocket}=require('ws');
const lanDiscovery=require('./lan-discovery.cjs');
const {createAccountService}=require('./account.cjs');
const {createBuildSlotService}=require('./build-slots.cjs');
const {createLeaderboardService}=require('./leaderboard.cjs');
const {createMatchSaveQueue}=require('./match-save-queue.cjs');
const {isOxyAdmin,validRankedRoster,RANKED_TYPES,RANKED_SIZES,RANKED_RECONNECT_GRACE_MS,rankedGoal}=require('./ranked-rules.cjs');
const {createReleaseManifest,VERIFIED_RELEASES}=require('./release-manifest.cjs');
const {getAndroidRelease}=require('./android-release.cjs');
const GAME_VERSION='2.2.7';
const APP_VERSION='3.2.0';
const {compact,stateDelta}=require('./sync-protocol.cjs');
const simulationScripts=new Map();
function simulation(){
 const elements=new Map();function element(s){if(!elements.has(s))elements.set(s,{style:{},classList:{add(){},remove(){},toggle(){}},getBoundingClientRect:()=>({width:930,height:580}),getContext:()=>({setTransform(){}}),addEventListener(){},focus(){},textContent:'',innerHTML:''});return elements.get(s);}
 const box={document:{querySelector:element,querySelectorAll:()=>[]},window:{addEventListener(){}},ResizeObserver:class{observe(){}},requestAnimationFrame(){},devicePixelRatio:1,Math,console};vm.createContext(box);
 for(const name of ['equipment','world','navigation','presentation','game','loadout','accessories','weapons','combat-feel','battle-scale','weapon-identity','compact-draft','targeting','spell-catalog','catalog-weapons','catalog-expansion','weapon-variants-core','combat-tactics','tactical-abilities','support-role','objectives','maps','lanes','spell-art','expansion','deathmatch','potions','combat-balance','multiplayer-rules','arena-update','gear-v3','gear-v4','gear-v5','relic-maze','balance-v6','legendary-weapons-308','fear-boxing-320']){if(!simulationScripts.has(name))simulationScripts.set(name,new vm.Script(fs.readFileSync(path.join(__dirname,'dist',name+'.js'),'utf8'),{filename:name+'.js'}));simulationScripts.get(name).runInContext(box);}
 vm.runInContext(`
 let roster=[],readiness=new Set(),eventSerial=0,rankedMatch=false;
 const standardCombatDuration=combatDuration;combatDuration=function(){return rankedMatch&&['domination','hill'].includes(matchType)?900:standardCombatDuration();};
 updateHud=()=>{};showBanner=()=>{};notify=()=>{};setKit=()=>{};
 setupRound=function(){phase='draft';paused=false;clock=90;shots=[];zones=[];effects=[];floating=[];readiness.clear();resetObjectives();actors=roster.map((p,i)=>{const team=(matchType==='deathmatch'||matchType==='relicdeathmatch')?i:p.team??i%2,slot=roster.slice(0,i).filter(q=>(q.team??roster.indexOf(q)%2)===team).length,point=spawnPoint(team,slot,mode),a=actor(team,point.x,point.y,p.kind,true);a.playerId=p.id;a.scoreKey=p.id;a.displayName=p.name||'Oyuncu '+(i+1);a.passive=p.passive;a.loadout=p.loadout;a.control={mouse:{x:0,y:0},enemy:null,target:null};applyGear(a,p.gear||{head:0,armor:0,boots:0});statFor(a);return a;});};
 globalThis.api={
 validGearForKind(g,kind){return validGear(g)&&(!g?.main||weaponBook[g.main]?.kind===kind);},
 init(players,size='standard',type='vs',layout='courtyard',killTarget=20,goal=null,ranked=false){rankedMatch=ranked;roster=players;scoreTarget=goal;resetMatchStats();deathmatchTarget=validKillTarget((type==='deathmatch'||type==='relicdeathmatch')?(goal??killTarget):killTarget);score=(type==='deathmatch'||type==='relicdeathmatch')?Array(8).fill(0):[0,0];round=1;mode=(type==='deathmatch'||type==='relicdeathmatch')?4:Math.max(1,...[0,1].map(t=>players.filter((p,i)=>(p.team??i%2)===t).length));matchType=['vs','capture','domination','skirmish','hill','deathmatch','relicdeathmatch','flagRace','labyrinth'].includes(type)?type:'vs';setArenaSize((type==='labyrinth'||type==='relicdeathmatch')?'grand':size);setArenaLayout((type==='labyrinth'||type==='relicdeathmatch')?'relicmaze':layout);setupRound();},
 ready(id,selection){if(phase!=='draft'||readiness.has(id))return;const p=roster.find(p=>p.id===id);if(!p)return;Object.assign(p,selection);const i=actors.findIndex(a=>a.playerId===id),old=actors[i],a=actor(old.team,old.x,old.y,p.kind,true);a.playerId=p.id;a.displayName=p.name;a.passive=p.passive;a.loadout=p.loadout;a.control={mouse:{x:0,y:0},enemy:null,target:null};applyGear(a,p.gear||{head:0,armor:0,boots:0});actors[i]=a;statFor(a);readiness.add(id);if(readiness.size===roster.length){phase='fight';clock=combatDuration();}},
 suspend(id){const a=actors.find(a=>a.playerId===id);if(a?.control){a.control.target=null;a.control.enemy=null;a.control.selectedEnemy=null;}},
 forfeit(team){if(phase==='end')return false;phase='end';clock=0;matchWinner=1-team;return true;},
 potion(id,slot){return usePotion(actors.find(a=>a.playerId===id),slot);},
 command(id,c){if(phase!=='fight')return;const a=actors.find(a=>a.playerId===id);if(!a||a.hp<=0)return;if(c.type==='input'){a.control.mouse=c.aim;a.control.enemy=c.enemy===null?null:actors.find(b=>b.id===c.enemy&&b.team!==a.team&&b.hp>0)||null;a.control.target=a.control.enemy?null:c.target;if(c.selectedEnemy!==undefined)a.control.selectedEnemy=c.selectedEnemy===null?null:actors.find(b=>b.id===c.selectedEnemy&&b.team!==a.team&&b.hp>0)||null;}else if(c.type==='cast')cast(a,c.skill,c.aim);},
 step(dt){if(phase==='draft'){clock=Math.max(0,clock-dt);if(clock<=0)for(const p of roster)if(!readiness.has(p.id))this.ready(p.id,{kind:p.kind,passive:p.passive,loadout:p.loadout,gear:p.gear||{head:0,armor:0,boots:0,main:'sword'}});return;}update(dt);},
 snapshot(){for(const e of [...effects,...floating])if(!e.eid)e.eid=++eventSerial;return {phase,scoreTarget:matchGoal(),flagState,stats:Object.values(matchStats),matchElapsed,killTarget:deathmatchTarget,matchType,arenaLayout,relicGifts,relicSpawnIn,controlPoints,laneState,matchWinner,score:[...score],clock,round,arenaSize,ready:[...readiness],draftPlayers:roster.map(p=>({id:p.id,name:p.name,team:p.team??0,ready:readiness.has(p.id)})),actors:actors.map(a=>({id:a.id,laneRole:a.laneRole,lane:a.lane,playerId:a.playerId,displayName:a.displayName,team:a.team,x:a.x,y:a.y,vx:a.vx||0,vy:a.vy||0,kind:a.kind,hp:a.hp,max:a.max,wear:a.wear||0,relicBoons:a.relicBoons||{},relicArmor:a.relicArmor||0,relicPickupSeq:a.relicPickupSeq||0,relicPickupText:a.relicPickupText||'',respawnIn:respawns[a.id]??(a.hp<=0?(matchType==='deathmatch'?7:5):0),cd:a.cd,potionCharges:a.potionCharges,potionCooldowns:a.potionCooldowns,potionLock:a.potionLock,attack:a.attack,shield:a.shield,invul:a.invul,slow:a.slow,hit:a.hit,facing:a.facing,walk:a.walk,motion:a.motion||0,anim:a.anim||0,animMax:a.animMax||.42,gear:a.gear,recoil:a.recoil||0,recoilAngle:a.recoilAngle||0,haste:a.haste||0,leech:a.leech||0,focus:a.focus||0,stun:a.stun||0,root:a.root||0,stealth:a.stealth||0,reveal:a.reveal||0})),shots:shots.map(({owner,hitGroup,...s})=>({...s,visual:owner.kind})),zones:zones.map(({owner,...z})=>({...z,visual:owner.kind})),effects:effects.slice(-64).map(e=>({...e})),floating:floating.slice(-32).map(f=>({...f}))};}
 };`,box);
 return box.api;
}
function createArenaServer({host='127.0.0.1',port=4173,publicHostname=process.env.RENDER_EXTERNAL_HOSTNAME||'',accountService=null,leaderboardService=null,releaseManifest=null}={}){
 if(publicHostname&&!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(publicHostname))throw Error('Invalid public hostname');
 const allowedCloudHosts=new Set([publicHostname,'keyboardheroes.com.tr','www.keyboardheroes.com.tr'].filter(Boolean).map(v=>v.toLowerCase()));
 function cloudHost(value){if(!publicHostname||typeof value!=='string')return false;const host=value.toLowerCase().replace(/:443$/,'');return allowedCloudHosts.has(host);}
 const rooms=new Map(),clients=new Set(),penaltyJobs=new Map(),root=path.join(__dirname,'dist');
 const accounts=accountService||createAccountService();
 const buildSlots=createBuildSlotService({accounts});
 const leaderboard=leaderboardService||createLeaderboardService();
 const matchSaves=createMatchSaveQueue({save:match=>leaderboard.recordMatch(match)});
 // Independent of a specific room: retries continue after rematch or lobby teardown.
 const matchSaveRetryTimer=setInterval(()=>matchSaves.retryDue(),5000);
 const pinnedRelease=VERIFIED_RELEASES[APP_VERSION]||null;
 const getRelease=releaseManifest||createReleaseManifest({expectedVersion:APP_VERSION,pinnedRelease});
 const listedRooms=(lan=true)=>[...rooms.values()].filter(r=>r.lan===lan).map(r=>({code:r.code,name:r.name,players:r.players.length,capacity:r.mode*2,started:!!r.sim,mode:r.mode,matchType:r.matchType,map:r.arenaLayout,ranked:!!r.ranked}));
 let discovery=null,search=null;

 function tailnetAddress(){for(const list of Object.values(os.networkInterfaces()))for(const n of list||[])if(n.family==='IPv4'&&/^100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(n.address))return n.address;return null;}
 function funnelHost(value,address){return ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(address)&&/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.ts\.net(?::443)?$/i.test(value||'');}
 function validHost(value,address){try{if(cloudHost(value)||funnelHost(value,address))return true;const u=new URL('http://'+value);if(Number(u.port||80)!==server.address()?.port)return false;if(['localhost','127.0.0.1','[::1]'].includes(u.hostname))return true;for(const list of Object.values(os.networkInterfaces()))for(const n of list||[])if(n.family==='IPv4'&&n.address===u.hostname)return true;return false;}catch{return false;}}
 const server=http.createServer((req,res)=>{
  if(!validHost(req.headers.host,req.socket.remoteAddress)){res.writeHead(403);return res.end('Host not allowed');}
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
  if(pathname.startsWith('/api/account/')){
   accounts.handle(req,res,pathname,{secure:cloudHost(req.headers.host)||funnelHost(req.headers.host,req.socket.remoteAddress)}).catch(err=>{console.error('Account handler:',err?.message);if(!res.headersSent){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Hesap servisi geçici olarak kullanılamıyor.'}));}});return;
  }
  if(pathname==='/api/build-slots'||pathname.startsWith('/api/build-slots/')){
   buildSlots.handle(req,res,pathname,{secure:cloudHost(req.headers.host)||funnelHost(req.headers.host,req.socket.remoteAddress)}).catch(err=>{console.error('Build route failed:',err?.code||'unknown');if(!res.headersSent){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Build servisi kullanılamıyor.'}));}});return;
  }
  if(!['GET','HEAD'].includes(req.method)&&!pathname.startsWith('/api/leaderboard/admin/')){res.writeHead(405);return res.end();}
  // Admin endpoints are authorized with the HttpOnly session, never from
  // user-submitted names or an admin flag in request JSON.
  if(pathname.startsWith('/api/leaderboard/admin/')){
   const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
   const answer=(status,body)=>{res.writeHead(status,headers);res.end(req.method==='HEAD'?undefined:JSON.stringify(body));};
   const action=pathname.substring('/api/leaderboard/admin/'.length);
   if(!['me','refresh','reset','players','manage'].includes(action)){answer(404,{error:'Not found'});return;}
   const method=(action==='me'||action==='players')?'GET':'POST';
   if(req.method!==method){answer(405,{error:'Method not allowed'});return;}
   if(method==='POST'){
    const hostName=String(req.headers.host||'').toLowerCase();
    const secure=cloudHost(req.headers.host)||funnelHost(req.headers.host,req.socket.remoteAddress);
    if(req.headers.origin!==(secure?'https://':'http://')+hostName){
     answer(403,{error:'origin_forbidden'});return;
    }
    if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json')){
     answer(415,{error:'json_required'});return;
    }
   }
   accounts.identity(req).then(async user=>{
    const admin=isOxyAdmin(user);
    if(action==='me'){answer(200,{admin});return;}
    if(!admin){answer(403,{error:'admin_required'});return;}
    if(action==='players'){
     const players=await leaderboard.listPlayers();
     answer(200,{players});return;
    }
    if(action==='manage'){
     let body='';let bytes=0;
     for await(const chunk of req){
      bytes+=chunk.length;
      if(bytes>768){answer(413,{error:'request_too_large'});return;}
      body+=chunk.toString('utf8');
     }
     let input;
     try{input=JSON.parse(body);}catch{answer(400,{error:'invalid_json'});return;}
     const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
     if(!input||typeof input!=='object'||!UUID.test(input.targetId||'')||
      typeof input.username!=='string'||!/^[a-zA-Z0-9_]{3,18}$/.test(input.username)||
      !['reset_stats','delete_account'].includes(input.action)||
      !['all','normal','competitive'].includes(input.queue)||
      !['all','kills','wins','both'].includes(input.metric)||
      typeof input.confirmation!=='string'||input.confirmation.length>50){
      answer(400,{error:'invalid_management_request'});return;
     }
     const deleting=input.action==='delete_account';
     if((deleting&&(input.metric!=='all'||input.queue!=='all'))||
       (!deleting&&input.metric==='all')){
      answer(400,{error:'invalid_management_mode'});return;
     }
     if(input.targetId==='43556e11-906c-4d45-bb91-51242bfb5804'){
      answer(403,{error:'protected_admin_account'});return;
     }
     const expected=(deleting?'SIL ':'SIFIRLA ')+input.username;
     if(input.confirmation!==expected){
      answer(400,{error:'confirmation_required'});return;
     }
     const result=await leaderboard.managePlayer({
      actorId:user.id,targetId:input.targetId,username:input.username,
      action:input.action,queue:input.queue,metric:input.metric,confirmation:input.confirmation
     });
     if(deleting){
      // Revoke live room access, too; DB FK cascade revokes login sessions.
      for(const client of clients)if(client.account?.id===input.targetId)
       client.ws.close(4003,'Account deleted');
     }
     console.warn('OXY player management:',{
      action:input.action,queue:input.queue,metric:input.metric,
      targetId:input.targetId
     });
     answer(200,{ok:true,result});return;
    }
    if(action==='reset'){
     let body='';for await(const chunk of req){body+=chunk.toString('utf8');if(body.length>256){answer(413,{error:'request_too_large'});return;}}
     let confirmation;try{confirmation=JSON.parse(body).confirmation;}catch{}
     if(confirmation!=='SIFIRLA'){answer(400,{error:'confirmation_required'});return;}
     const removed=await leaderboard.reset();
     console.warn('Leaderboard administratively reset by the authorized OXY account');
     answer(200,{ok:true,removed});return;
    }
    const data=await leaderboard.refresh();
    answer(200,{ok:true,normal:data.normal,competitive:data.competitive});
   }).catch(error=>{
    // Never leak SQL, tokens, password hashes or raw PostgREST messages to browsers.
    // Expose only a safe, actionable category; include the vendor code in server logs.
    const dbCode=typeof error?.dbCode==='string'?error.dbCode:'';
    const dbStatus=Number.isInteger(error?.status)?error.status:0;
    console.warn('Leaderboard admin operation failed:',{
     action,status:dbStatus||null,dbCode:dbCode.slice(0,24)||null
    });
    if(res.headersSent)return;
    if(dbCode==='P0002'){
     answer(404,{error:'admin_player_missing',message:'Oyuncu bulunamadı. Listeyi yenileyip tekrar dene.'});
    }else if(dbCode==='22023'){
     answer(409,{error:'admin_player_changed',message:'Oyuncu veya işlem bilgileri değişmiş. Listeyi yenileyip tekrar dene.'});
    }else if(dbCode==='21000'){
     answer(502,{error:'admin_database_rejected',message:'Veritabanı güvenlik kuralı işlemi reddetti. İşlem tamamlanmadı.'});
    }else if(dbStatus===400){
     answer(502,{error:'admin_database_invalid',message:'Veritabanı yönetim işlemini reddetti. Lütfen tekrar dene.'});
    }else if(dbStatus===404){
     answer(503,{error:'admin_database_setup',message:'Yönetim fonksiyonu sunucu veritabanında bulunamadı.'});
    }else if(dbStatus===401||dbStatus===403){
     answer(503,{error:'admin_database_permissions',message:'Sunucunun veritabanında yönetim yetkisi eksik.'});
    }else{
     answer(503,{error:'admin_service_unavailable',message:'Yönetim servisine şu anda ulaşılamıyor. Yeniden dene.'});
    }
   });return;
  }
  if(pathname==='/api/leaderboard'){
   const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
   if(leaderboard.enabled===false){
    res.writeHead(503,headers);
    return res.end(req.method==='HEAD'?undefined:JSON.stringify({error:'leaderboard_not_configured',message:'Leaderboard veri tabanı bağlantısı yapılandırılmamış.'}));
   }
   const queue=new URL(req.url,'http://localhost').searchParams.get('queue')||'normal';
   if(!['normal','competitive'].includes(queue)){
    res.writeHead(400,headers);return res.end(JSON.stringify({error:'invalid_queue'}));
   }
   leaderboard.read(queue).then(data=>{
    res.writeHead(200,headers);
    res.end(req.method==='HEAD'?undefined:JSON.stringify(data));
   }).catch(err=>{
    // Only vetted status categories are visible to players. Never return
    // database URLs, credentials, SQL query strings, or driver errors.
    const schemaMissing=err?.dbCode==='PGRST205'||err?.dbCode==='42P01'||err?.status===404;
    const schemaMismatch=err?.dbCode==='42703'||err?.dbCode==='PGRST200';
    const authFailure=err?.status===401||err?.status===403;
    const error=schemaMissing?'leaderboard_schema_missing':schemaMismatch?'leaderboard_schema_outdated':authFailure?'leaderboard_database_access_denied':'leaderboard_unavailable';
    const message=schemaMissing?'Sıralama veritabanı tabloları eksik. Sunucu yöneticisinin Supabase kurulumunu tamamlaması gerekiyor.':
     schemaMismatch?'Sıralama veritabanı yapısı güncel değil. Sunucu yöneticisi Supabase şemasını kontrol etmeli.':
     authFailure?'Sıralama veritabanına erişim izni bulunmuyor. Sunucu yöneticisi Supabase anahtarını ve yetkileri kontrol etmeli.':
     'Sıralama veritabanına şu anda ulaşılamıyor. Biraz sonra yeniden dene.';
    console.warn('Leaderboard read failed:',{status:err?.status||null,dbCode:err?.dbCode||null});
    res.writeHead(503,headers);
    res.end(req.method==='HEAD'?undefined:JSON.stringify({error,message}));
   });return;
  }
  if(pathname==='/api/android/latest'){
   getAndroidRelease().then(data=>{
    res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:JSON.stringify(data));
   }).catch(()=>{
    res.writeHead(503,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
    res.end(req.method==='HEAD'?undefined:JSON.stringify({error:'Android release temporarily unavailable'}));
   });
   return;
  }
  if(pathname==='/android-apk'){
   getAndroidRelease().then(data=>{
    res.writeHead(302,{'Location':data.download,
     'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end();
   }).catch(()=>{
    res.writeHead(503,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});
    res.end('Android APK is temporarily unavailable');
   });
   return;
  }
  if(pathname==='/api/launcher/manifest'){
   getRelease().then(data=>{res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:JSON.stringify(data));}).catch(err=>{console.warn('Release manifest:',err.message);res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:'Update service temporarily unavailable'}));});return;
  }
  if(pathname==='/api/match/active'&&req.method==='GET'){
   accounts.identity(req).then(user=>{
    const entry=user&&[...rooms.values()].find(r=>r.sim&&r.players.some(p=>p.account?.id===user.id&&!p.quit));
    res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(JSON.stringify(entry?{active:true,code:entry.code,name:entry.name,ranked:!!entry.ranked,matchType:entry.matchType,mode:entry.mode}:{active:false}));
   }).catch(()=>{res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:'match_lookup_unavailable'}));});return;
  }
  if(pathname==='/rooms'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(req.method==='HEAD'?undefined:JSON.stringify({version:GAME_VERSION,rooms:listedRooms(false)}));}
  if(pathname==='/healthz'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(req.method==='HEAD'?undefined:JSON.stringify({status:'ok'}));}
  if(pathname==='/version'){res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});return res.end(req.method==='HEAD'?undefined:JSON.stringify({version:GAME_VERSION,release:APP_VERSION,protocol:2,download:'/download'}));}
  if(publicHostname&&(pathname==='/setup'||pathname==='/download')){
   // A release with a verified pinned manifest can redirect immediately.
   // Unpinned releases must be confirmed by the public release feed.
   if(pinnedRelease){
    const file=pathname==='/setup'?'KeyboardHeroesSetup.exe':'KeyboardHeroes-Desktop-v'+APP_VERSION+'.zip';
    res.writeHead(302,{'Location':'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v'+APP_VERSION+'/'+file,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    return res.end();
   }
   // For future versions without a pinned public release, verify first.
   getRelease().then(data=>{
    if(data.version!==APP_VERSION)throw Error('Published build mismatch');
    const file=pathname==='/setup'?'KeyboardHeroesSetup.exe':'KeyboardHeroes-Desktop-v'+data.version+'.zip';
    res.writeHead(302,{'Location':'https://github.com/OzancanAksu/KeyboardHeroes-Downloads/releases/download/v'+data.version+'/'+file,'Cache-Control':'no-store'});
    res.end();
   }).catch(()=>{
    res.writeHead(503,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});
    res.end('Keyboard Heroes setup is being published. Please try again later.');
   });return;
  }
  if(pathname==='/setup'){const file=path.join(__dirname,'KeyboardHeroesSetup.exe');if(!fs.existsSync(file)){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Length':fs.statSync(file).size,'Content-Disposition':'attachment; filename="KeyboardHeroesSetup.exe"'});if(req.method==='HEAD')return res.end();return fs.createReadStream(file).pipe(res);}
  if(pathname==='/download'){const archive=path.join(__dirname,'updates','KeyboardHeroes-Desktop-v'+GAME_VERSION+'.zip');fs.stat(archive,(error,stat)=>{if(error||!stat.isFile()){res.writeHead(404);return res.end('Update package not found');}res.writeHead(200,{'Content-Type':'application/zip','Content-Length':stat.size,'Content-Disposition':'attachment; filename="KeyboardHeroes-Desktop-v'+GAME_VERSION+'.zip"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});if(req.method==='HEAD')return res.end();fs.createReadStream(archive).pipe(res);});return;}
  if(pathname==='/lan-rooms'){
   const hostname=new URL('http://'+req.headers.host).hostname;
   if(publicHostname||funnelHost(req.headers.host,req.socket.remoteAddress)||req.headers['x-forwarded-for']||!['localhost','127.0.0.1','[::1]'].includes(hostname)&&!lanDiscovery.privateIp(hostname)){res.writeHead(403);return res.end('LAN only');}
   if(!search){search=lanDiscovery.discover();setTimeout(()=>{search=null;},3000).unref();}
   const results=awaitSearch=>{const peers=awaitSearch.filter(p=>p.address!==hostname);peers.unshift({address:hostname,version:GAME_VERSION,rooms:listedRooms()});res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:JSON.stringify({servers:peers,discovery:discovery?.isReady()||false}));};
   search.then(results).catch(()=>results([]));return;
  }
  if(pathname==='/lan-info'){
   if(publicHostname||funnelHost(req.headers.host,req.socket.remoteAddress)||req.headers['x-forwarded-for']){res.writeHead(403);return res.end('Local network only');}
   const addresses=[];for(const list of Object.values(os.networkInterfaces()))for(const n of list||[]){const p=n.address.split('.').map(Number);if(n.family==='IPv4'&&!n.internal&&(p[0]===10||p[0]===192&&p[1]===168||p[0]===172&&p[1]>=16&&p[1]<=31))addresses.push('http://'+n.address+':'+server.address().port+'/');}
   res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(req.method==='HEAD'?undefined:JSON.stringify({enabled:host==='0.0.0.0',addresses:[...new Set(addresses)]}));
  }
  if(pathname==='/tailnet-info'){res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});return res.end(req.method==='HEAD'?undefined:JSON.stringify({ip:tailnetAddress()}));}
  if(publicHostname&&(pathname==='/'||pathname==='/index.html'||pathname==='/desktop'||pathname==='/desktop/'||pathname==='/desktop.html'))pathname='/home.html';
  else if(pathname==='/desktop'||pathname==='/desktop/')pathname='/desktop.html';
  if(pathname==='/launcher'||pathname==='/launcher/')pathname='/launcher.html';
  if(pathname==='/android-launcher'||pathname==='/android-launcher/')pathname='/android-launcher.html';
  if(pathname==='/play'){
   if(publicHostname){
    if(!/KeyboardHeroes(?:Desktop|Android)\/\d+\.\d+\.\d+/.test(String(req.headers['user-agent']||''))){res.writeHead(403);return res.end('Installed app required');}
    accounts.identity(req).then(user=>{
     if(!user){res.writeHead(401);return res.end('Login required');}
     fs.readFile(path.join(root,'index.html'),(err,data)=>{if(err){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'"});res.end(req.method==='HEAD'?undefined:data);});
    }).catch(()=>{res.writeHead(503);res.end('Authentication unavailable');});return;
   }
   pathname='/index.html';
  }
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  const ext=path.extname(file),mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp'}[ext];if(!mime){res.writeHead(404);return res.end();}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'"});res.end(req.method==='HEAD'?undefined:data);});
 });
 const wss=new WebSocketServer({noServer:true,maxPayload:2048,perMessageDeflate:false});
 server.on('upgrade',(req,socket,head)=>{let okay=false;try{const origin=new URL(req.headers.origin),publicHost=cloudHost(req.headers.host)||funnelHost(req.headers.host,socket.remoteAddress);okay=req.url==='/arena'&&validHost(req.headers.host,socket.remoteAddress)&&(publicHost?origin.protocol==='https:'&&origin.hostname===new URL('http://'+req.headers.host).hostname&&origin.port==='':origin.protocol==='http:'&&origin.host===req.headers.host);}catch{}
 const reject=(code=403)=>{if(socket.destroyed)return;socket.write('HTTP/1.1 '+code+' '+(code===503?'Service Unavailable':'Forbidden')+'\r\nConnection: close\r\n\r\n');socket.destroy();};
 if(!okay||clients.size>=32)return reject();
 const accept=()=>{if(socket.destroyed)return;wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));};
 if(accounts.enabled&&cloudHost(req.headers.host)){
  accounts.identity(req).then(user=>{if(!user)return reject();req.account=user;accept();}).catch(()=>reject(503));
 }else accept();
});
 const send=(c,m)=>{if(c.ws.readyState===WebSocket.OPEN&&c.ws.bufferedAmount<256000)c.ws.send(JSON.stringify(m));};
 const broadcast=(r,m)=>{const raw=JSON.stringify(m);for(const c of r.players)if(c.ws.readyState===WebSocket.OPEN)c.ws.send(raw);};
 const goalDefaults={vs:3,capture:10800,domination:500,skirmish:20,hill:300,deathmatch:20,relicdeathmatch:20,flagRace:3,labyrinth:20};
 function goalForRoom(r){return r.ranked?rankedGoal(r.matchType):r.scoreTarget;}
 function queuePenalty(r,c,reason){
  if(!r.ranked||!r.matchId||!c.account||!leaderboard.enabled||typeof leaderboard.penalize!=='function')return;
  const key=r.matchId+':'+c.account.id;
  if(!penaltyJobs.has(key))penaltyJobs.set(key,{matchId:r.matchId,userId:c.account.id,reason,attempts:0,nextAt:0,pending:false});
 }
 function forfeitMatch(r,c,reason){
  if(!r?.sim||r.sim.snapshot().phase==='end')return;
  if(!r.sim.forfeit(c.team))return;
  if(r.ranked)queuePenalty(r,c,reason);
  r.endAt=Date.now();r.previous=null;
  broadcast(r,{type:'forfeit',name:c.name||'Oyuncu',team:c.team,ranked:!!r.ranked,reason,penalty:r.ranked?2:0});
  sendState(r,true);
 }
 function goalFor(type,value){const max=['vs','deathmatch','relicdeathmatch','skirmish','flagRace','labyrinth'].includes(type)?100:type==='capture'?10800:50000;return Number.isInteger(value)&&value>=1&&value<=max?value:goalDefaults[type];}
 function recordFinishedMatch(r){
  if(!leaderboard.enabled||r.lan||r.recordQueued||!r.matchId)return;
  const state=r.sim?.snapshot();if(state?.phase!=='end')return;
  // A completed online match must survive a room reset, rematch or player leaving.
  // This snapshot is server-authoritative, not supplied by the browser.
  if(!r.players.every(p=>p.account)){
   console.warn('Completed match is not ranked: unverified guest participant',{
    matchId:r.matchId,matchType:state.matchType,playerCount:r.players.length
   });
   r.recordQueued=true;
   return;
  }
  const players=r.players.map((p,i)=>({id:p.id,team:(r.matchType==='deathmatch'||r.matchType==='relicdeathmatch')?i:p.team,account:{id:p.account.id}}));
  const matchId=r.matchId;
  const match={matchId,players,stats:state.stats,matchType:state.matchType,winner:state.matchWinner,score:state.score,ranked:!!r.ranked};
  const accepted=matchSaves.enqueue(match,()=>{if(r.matchId===matchId)r.recorded=true;});
  r.recordQueued=accepted;
  if(!accepted)console.error('Match persistence queue refused result', {matchId,matchType:state.matchType});
 }
 function returnToLobby(r){if(!r.sim)return;const state=r.sim.snapshot();if(state.phase==='end')recordFinishedMatch(r);r.lastResult={score:state.score,stats:state.stats,matchType:state.matchType};r.sim=null;r.previous=null;r.endAt=null;r.ready.clear();r.rematch=null;r.rematchRequested=false;
  for(const p of r.players.filter(p=>p.quit||p.disconnectedAt))p.room=null;
  r.players=r.players.filter(p=>!p.quit&&!p.disconnectedAt&&p.ws.readyState===WebSocket.OPEN);
  for(const p of r.players){p.pendingInput=null;p.needsFull=true;}
  if(!r.players.length){rooms.delete(r.code);return;}
  if(!r.players.some(p=>p.id===r.hostId))r.hostId=r.players[0].id;
  lobby(r);}
 function canStart(r){if(r.ranked)return validRankedRoster(r.players,r.matchType,r.mode);if(r.players.length<2)return false;if((r.matchType==='deathmatch'||r.matchType==='relicdeathmatch'))return r.players.length<=8;const counts=[0,1].map(t=>r.players.filter(p=>p.team===t).length);return counts[0]===counts[1]&&counts[0]>0;}
 function lobby(r){broadcast(r,{type:'lobby',scope:r.lan?'lan':'online',code:r.code,name:r.name,mode:r.mode,ranked:!!r.ranked,killTarget:r.killTarget,scoreTarget:r.scoreTarget,lastResult:r.lastResult||null,matchType:r.matchType,arenaLayout:r.arenaLayout,arenaSize:r.arenaSize,hostId:r.hostId,canStart:canStart(r),players:r.players.map((c,i)=>({id:c.id,team:(r.matchType==='deathmatch'||r.matchType==='relicdeathmatch')?i:c.team,name:c.name,ready:r.ready.has(c.id),connected:!c.disconnectedAt&&!c.quit})),capacity:r.mode*2});}
 function roster(r){return r.players.map(p=>({id:p.id,name:p.name,team:p.team,kind:'blade',passive:'assault',loadout:[0,0,0,0]}));}
 function sendState(r,force=false){if(!r.sim)return;const state=compact(r.sim.snapshot()),seq=(r.seq||0)+1,full={type:'state',seq,full:true,serverTime:Date.now(),...state},keyframe=force||!r.previous||seq%20===0,patch=keyframe?null:{type:'state',seq,base:r.seq,full:false,serverTime:full.serverTime,...stateDelta(r.previous,state)};let fullRaw=null,patchRaw=null;for(const c of r.players){if(c.ws.readyState!==WebSocket.OPEN)continue;if(c.ws.bufferedAmount>64000){c.needsFull=true;continue;}if(keyframe||c.needsFull){fullRaw=fullRaw||JSON.stringify(full);c.ws.send(fullRaw);c.needsFull=false;}else{patchRaw=patchRaw||JSON.stringify(patch);c.ws.send(patchRaw);}}r.seq=seq;r.previous=state;if(state.phase==='end')recordFinishedMatch(r);}
 function remove(c,explicit=false){
  c.pendingInput=null;const r=c.room;if(!r)return;
  if(r.sim){
   if(c.disconnectedAt)return;
   const unfinished=r.sim.snapshot().phase!=='end';
   if(unfinished){r.sim.suspend(c.id);if(explicit){c.quit=true;forfeitMatch(r,c,'leave');}}
   else recordFinishedMatch(r);
   c.disconnectedAt=Date.now();c.needsFull=true;
   broadcast(r,{type:'player-presence',id:c.id,name:c.name,connected:false,graceSeconds:120});
   return;
  }
  c.room=null;r.players=r.players.filter(p=>p!==c);r.ready.delete(c.id);
  if(!r.players.length)rooms.delete(r.code);
  else{if(r.hostId===c.id)r.hostId=r.players[0].id;lobby(r);}
 }
 const validPoint=p=>p&&typeof p==='object'&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<=5000&&Math.abs(p.y)<=5000;
 const validPlayerName=value=>typeof value==='string'&&Array.from(value.trim()).length>0&&Array.from(value.trim()).length<=18&&/^[\p{L}\p{N} _-]+$/u.test(value.trim());
 const normalizedName=value=>value.trim().replace(/\s+/g,' ');
 const bounded=(p,size)=>{const x=size==='grand'?900:650,y=size==='grand'?700:500;return{x:Math.max(-x,Math.min(x,p.x)),y:Math.max(-y,Math.min(y,p.y))};};
 wss.on('connection',(ws,request)=>{const c={lan:!publicHostname&&!funnelHost(request.headers.host,request.socket.remoteAddress),ws,id:crypto.randomUUID(),room:null,name:null,account:request.account||null,tokens:100,seen:Date.now(),alive:true};clients.add(c);const ongoing=c.account&&[...rooms.values()].find(r=>r.sim&&r.players.some(p=>p.account?.id===c.account.id&&!p.quit));
  send(c,{type:'hello',id:c.id,version:GAME_VERSION,protocol:2,resume:ongoing?{code:ongoing.code,name:ongoing.name,ranked:!!ongoing.ranked}:null});ws.on('pong',()=>c.alive=true);ws.on('error',()=>{});
  ws.on('message',raw=>{const now=Date.now();c.tokens=Math.min(100,c.tokens+(now-c.seen)*.05);c.seen=now;if(--c.tokens<0){ws.close(1008,'Rate limit');return;}let m;try{m=JSON.parse(raw.toString());}catch{return send(c,{type:'error',message:'Geçersiz mesaj.'});}if(!m||typeof m!=='object')return;
   if(m.type==='resume'){
    if(m.version!==GAME_VERSION)return send(c,{type:'error',code:'version_mismatch',version:GAME_VERSION,message:'Maça dönebilmek için oyun sürümünü güncelle.'});
    if(!c.account||c.room)return send(c,{type:'error',code:'resume_unavailable',message:'Devam edilecek hesaplı bir maç bulunamadı.'});
    const r=[...rooms.values()].find(r=>r.sim&&r.players.some(p=>p.account?.id===c.account.id&&!p.quit));
    if(!r)return send(c,{type:'error',code:'resume_unavailable',message:'Devam eden maç bulunamadı.'});
    const old=r.players.find(p=>p.account?.id===c.account.id&&!p.quit);
    // The verified user identity is the only resume credential; client player IDs are ignored.
    if(old.ws?.readyState===WebSocket.OPEN){old.room=null;old.ws.close(4001,'Session restored');}
    const slot=r.players.indexOf(old);
    Object.assign(c,{id:old.id,team:old.team,name:old.name,room:r,account:old.account,needsFull:true,disconnectedAt:null,quit:false});
    old.room=null;r.players[slot]=c;
    send(c,{type:'resumed',id:c.id,code:r.code,ranked:!!r.ranked,name:r.name,matchType:r.matchType});
    sendState(r,true);
    broadcast(r,{type:'player-presence',id:c.id,name:c.name,connected:true});
    return;
   }
   if(m.type==='create'||m.type==='join'){
    if(c.room)return;
    if(c.account&&[...rooms.values()].some(r=>r.sim&&r.players.some(p=>p.account?.id===c.account.id&&!p.quit)))
     return send(c,{type:'error',code:'match_active',message:'Devam eden maçın var. Önce MAÇA DÖN seçeneğini kullan.'});
    if(m.version!==GAME_VERSION)return send(c,{type:'error',code:'version_mismatch',version:GAME_VERSION,message:'Sürüm uyuşmuyor. Bu sunucu için '+GAME_VERSION+' gerekiyor.'});
    if(!c.account&&!validPlayerName(m.name))return send(c,{type:'error',code:'name_required',message:'Odaya girmek için 1–18 karakterlik kullanıcı adı yaz.'});
    c.name=c.account?c.account.username:normalizedName(m.name);
    if(m.type==='create'){
     if(m.ranked===true&&(c.lan||!c.account||m.scope==='lan'||!RANKED_TYPES.has(m.matchType)||!RANKED_SIZES.has(m.mode)))
      return send(c,{type:'error',message:'Rekabetçi: hesaplı online 3v3, 4v4, 5v5 Hâkimiyet, Gezen Taht veya Bayrak Yarışı.'});
     if(m.scope==='lan'&&!c.lan)return send(c,{type:'error',message:'LAN odası yalnız yerel ağdan kurulabilir.'});if(rooms.size>=8)return send(c,{type:'error',message:'Sunucuda oda sınırına ulaşıldı.'});const mode=m.ranked===true?m.mode:(m.matchType==='deathmatch'||m.matchType==='relicdeathmatch')?4:[1,2,3,4,5].includes(m.mode)?m.mode:1,matchType=['vs','capture','domination','skirmish','hill','deathmatch','relicdeathmatch','flagRace','labyrinth'].includes(m.matchType)?m.matchType:'vs',arenaSize=m.arenaLayout==='maze'||m.arenaLayout==='relicmaze'||(matchType==='labyrinth'||matchType==='relicdeathmatch')||m.arenaSize==='grand'?'grand':'standard';let code;do{code=crypto.randomBytes(4).toString('hex').toUpperCase();}while(rooms.has(code));const r={name:typeof m.roomName==='string'?m.roomName.trim().slice(0,40)||c.name+' odası':c.name+' odası',lan:m.scope==='lan',ranked:m.ranked===true,code,mode,matchType,killTarget:Number.isInteger(m.killTarget)&&m.killTarget>=1&&m.killTarget<=100?m.killTarget:20,arenaLayout:(matchType==='labyrinth'||matchType==='relicdeathmatch')?'relicmaze':['courtyard','bridges','siege','valley','ruins','quarry','maze','relicmaze'].includes(m.arenaLayout)?m.arenaLayout:'courtyard',arenaSize,scoreTarget:m.ranked===true?rankedGoal(matchType):goalFor(matchType,m.scoreTarget??((matchType==='deathmatch'||matchType==='relicdeathmatch')?m.killTarget:undefined)),hostId:c.id,players:[c],ready:new Set(),sim:null,created:now};rooms.set(code,r);c.team=0;c.room=r;lobby(r);}
    else{const code=typeof m.code==='string'?m.code.toUpperCase():'';const r=rooms.get(code);if(!r||r.lan&&!c.lan||r.ranked&&!c.account||r.sim||r.players.length>=r.mode*2)return send(c,{type:'error',message:'Oda bulunamadı, dolu veya maç başladı.'});c.team=r.players.filter(p=>p.team===0).length<=r.players.filter(p=>p.team===1).length?0:1;if(!r.lan&&c.account&&r.players.some(p=>p.account?.id===c.account.id))return send(c,{type:'error',message:'Aynı hesap bu odada zaten bulunuyor.'});r.players.push(c);c.room=r;r.ready.clear();lobby(r);}
   }
   else if(m.type==='settings'){const r=c.room;if(!r||r.sim||r.hostId!==c.id)return;const type=Object.hasOwn(goalDefaults,m.matchType)?m.matchType:r.matchType,mode=(type==='deathmatch'||type==='relicdeathmatch')?4:[1,2,3,4,5].includes(m.mode)?m.mode:r.mode;if(r.ranked&&(!RANKED_TYPES.has(type)||!RANKED_SIZES.has(mode)))return send(c,{type:'error',message:'Rekabetçi yalnızca 3v3, 4v4, 5v5 Hâkimiyet, Gezen Taht veya Bayrak Yarışı olabilir.'});
    if(r.players.length>mode*2)return send(c,{type:'error',message:'Bu takım boyutu için odada fazla oyuncu var.'});const changed=r.matchType!==type;r.matchType=type;r.mode=mode;r.scoreTarget=goalForRoom({...r,matchType:type,scoreTarget:goalFor(type,m.scoreTarget)});if(type==='deathmatch'||type==='relicdeathmatch')r.killTarget=r.scoreTarget;if(['courtyard','bridges','siege','valley','ruins','quarry','maze','relicmaze'].includes(m.arenaLayout))r.arenaLayout=m.arenaLayout;if(type==='labyrinth'||type==='relicdeathmatch')r.arenaLayout='relicmaze';r.arenaSize=r.arenaLayout==='maze'||r.arenaLayout==='relicmaze'||m.arenaSize==='grand'?'grand':'standard';if(changed)r.players.forEach((p,i)=>p.team=i%2);r.ready.clear();lobby(r);}
   else if(m.type==='team'){const r=c.room;if(!r||r.sim||(r.matchType==='deathmatch'||r.matchType==='relicdeathmatch')||![0,1].includes(m.team)||c.team===m.team||r.ranked&&r.players.filter(p=>p.team===m.team).length>=r.mode)return;c.team=m.team;r.ready.clear();lobby(r);}
   else if(m.type==='perf-ping'&&Number.isFinite(m.id)&&m.id>=0&&m.id<1e13){send(c,{type:'perf-pong',id:m.id});}
   else if(m.type==='resync'){c.needsFull=true;}
   else if(m.type==='lobby-ready'){const r=c.room;if(!r||r.sim||typeof m.ready!=='boolean')return;if(m.ready)r.ready.add(c.id);else r.ready.delete(c.id);lobby(r);}
   else if(m.type==='start'){const r=c.room;if(!r||r.sim||r.hostId!==c.id)return;if(!canStart(r))return send(c,{type:'error',message:r.ranked?'Rekabetçi maç için iki takımda tam '+r.mode+' farklı hesaplı oyuncu bulunmalı.':(r.matchType==='deathmatch'||r.matchType==='relicdeathmatch')?'Deathmatch için en az 2 oyuncu gerekir.':'İki takımın oyuncu sayısı eşit ve en az birer kişi olmalı.'});if(r.ready.size!==r.players.length)return send(c,{type:'error',message:'Arenaya girmek için herkes hazır olmalı.'});r.endAt=null;r.previous=null;r.recorded=false;r.recordQueued=false;r.rematchRequested=false;r.matchId=crypto.randomUUID();r.sim=simulation();r.sim.init(roster(r),r.arenaSize,r.matchType,r.arenaLayout,r.killTarget,r.scoreTarget,!!r.ranked);sendState(r,true);}
   else if(m.type==='rematch'){
    const r=c.room;
    if(!r?.sim||r.sim.snapshot().phase!=='end')return;
    recordFinishedMatch(r);
    // The authoritative final result stays in the independent retry queue.
    // A rematch never destroys the only copy of a pending database write.
    if(r.recordQueued||!leaderboard.enabled||r.lan)returnToLobby(r);
    else r.rematchRequested=true;
   }
   else if(m.type==='leave')remove(c,true);
   else if(m.type==='ready'){const r=c.room;if(!r?.sim)return;
    const requestedName=c.account?c.account.username:m.name===undefined?c.name:m.name;
    if(!['blade','bow','staff'].includes(m.kind)||!['assault','flow','guard'].includes(m.passive)||!Array.isArray(m.loadout)||m.loadout.length!==4||!m.loadout.every(v=>v===0||v===1)||!validPlayerName(requestedName)||(m.gear!==undefined&&!r.sim.validGearForKind(m.gear,m.kind)))return send(c,{type:'error',message:'Geçersiz sınıf, ad veya yetenek seçimi.'});
    const g=m.gear||{head:0,armor:0,boots:0},name=normalizedName(requestedName);r.sim.ready(c.id,{kind:m.kind,name,passive:m.passive,loadout:m.loadout.slice(),gear:{head:g.head,armor:g.armor,boots:g.boots,ring:g.ring??-1,necklace:g.necklace??-1,cape:g.cape??-1,main:g.main??({blade:'sword',bow:'bow',staff:'staff'})[m.kind],off:g.off??-1,variant:g.variant??0,potions:g.potions?g.potions.slice():undefined,spells:g.spells?{head:g.spells.head,armor:g.spells.armor,boots:g.spells.boots}:{head:0,armor:0,boots:0}}});sendState(r,true);}
   else if(m.type==='input'){if(!c.room?.sim||!validPoint(m.aim)||(m.target!==null&&!validPoint(m.target))||(m.enemy!==null&&!Number.isSafeInteger(m.enemy))||(m.selectedEnemy!==undefined&&m.selectedEnemy!==null&&!Number.isSafeInteger(m.selectedEnemy)))return;c.pendingInput={type:'input',aim:bounded(m.aim,c.room.arenaSize),target:m.target?bounded(m.target,c.room.arenaSize):null,enemy:m.enemy,selectedEnemy:m.selectedEnemy};}
   else if(m.type==='potion'){if(c.room?.sim&&Number.isInteger(m.slot)&&m.slot>=0&&m.slot<3)c.room.sim.potion(c.id,m.slot);}
   else if(m.type==='cast'){if(!c.room?.sim||!Number.isInteger(m.skill)||m.skill<0||m.skill>3||!validPoint(m.aim))return;c.room.sim.command(c.id,{type:'cast',skill:m.skill,aim:bounded(m.aim,c.room.arenaSize)});}
  });ws.on('close',()=>{remove(c);clients.delete(c);});
 });
 let previousTime=performance.now(),accumulator=0,pingTime=0;
 const timer=setInterval(()=>{const now=performance.now(),elapsed=Math.min(.15,(now-previousTime)/1000);previousTime=now;accumulator+=elapsed;let steps=0;while(accumulator>=1/30&&steps<3){for(const r of rooms.values())if(r.sim){for(const c of r.players)if(c.pendingInput){r.sim.command(c.id,c.pendingInput);c.pendingInput=null;}r.sim.step(1/30);}accumulator-=1/30;steps++;}if(steps===3)accumulator=Math.min(accumulator,1/30);for(const r of rooms.values()){if(r.sim){
   for(const p of r.players)if(p.disconnectedAt&&!p.quit&&Date.now()-p.disconnectedAt>=RANKED_RECONNECT_GRACE_MS&&r.sim.snapshot().phase!=='end'){p.quit=true;forfeitMatch(r,p,'timeout');}
   r.sendElapsed=(r.sendElapsed||0)+elapsed;const interval=r.previous?.phase==='fight'?(r.players.length<=6?.05:1/15):.35;if(r.sendElapsed>=interval){r.sendElapsed=Math.min(interval,r.sendElapsed-interval);sendState(r);}}if(r.sim&&r.previous?.phase==='end'){recordFinishedMatch(r);r.endAt=r.endAt||Date.now();
     // Room lifecycle no longer stops independent match persistence retries.
     if(r.rematchRequested&&(r.recordQueued||!leaderboard.enabled||r.lan)){returnToLobby(r);continue;}
     if(Date.now()-r.endAt>=7000&&(r.recordQueued||!leaderboard.enabled||r.lan))returnToLobby(r);}if(Date.now()-r.created>3600000){broadcast(r,{type:'aborted',message:'Odanın 1 saatlik süresi doldu.'});for(const c of r.players)c.room=null;rooms.delete(r.code);}}for(const [key,job] of penaltyJobs)if(!job.pending&&Date.now()>=job.nextAt){
   if(job.attempts>=8){console.error('Ranked penalty persistence exhausted retries:',key);penaltyJobs.delete(key);continue;}
   job.pending=true;job.attempts++;
   leaderboard.penalize(job).then(()=>penaltyJobs.delete(key)).catch(err=>{
    console.warn('Ranked penalty persistence retry',job.attempts,err.message);
    job.nextAt=Date.now()+Math.min(60000,1000*2**job.attempts);
   }).finally(()=>{job.pending=false;});
  }
  pingTime+=elapsed;if(pingTime>=15){pingTime=0;for(const c of clients){if(!c.alive){c.ws.terminate();continue;}c.alive=false;c.ws.ping();}}},1000/30);
 async function listen(){await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});if(!publicHostname&&host==='0.0.0.0'&&server.address().port===4180)discovery=lanDiscovery.respond(()=>listedRooms(true),GAME_VERSION,4180);return server.address();}
 async function close(){discovery?.close();clearInterval(timer);clearInterval(matchSaveRetryTimer);
  if(matchSaves.size())console.warn('Closing server with unpersisted in-memory match results',{pending:matchSaves.size()});for(const c of clients)c.ws.terminate();await new Promise(resolve=>wss.close(resolve));await new Promise(resolve=>server.close(resolve));}
 return {listen,close,server};
}
module.exports={createArenaServer,simulation};
if(require.main===module){const host=process.env.RENDER==='true'||process.argv.includes('--lan')?'0.0.0.0':'127.0.0.1',port=Number(process.env.PORT||process.env.ARENA_PORT||4173);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('ARENA_PORT must be 1024..65535');const app=createArenaServer({host,port});app.listen().then(()=>{console.log(`KeyboardHeroes: http://localhost:${port}`);if(host==='0.0.0.0'){for(const list of Object.values(os.networkInterfaces()))for(const n of list||[])if(n.family==='IPv4'&&!n.internal)console.log(`LAN: http://${n.address}:${port}`);}console.log('Stop: Ctrl+C. No paid service, tunnel, router or firewall changes.');}).catch(e=>{console.error(e.message);app.close().catch(()=>{});process.exitCode=1;});process.on('SIGINT',()=>app.close().then(()=>process.exit()));process.on('SIGTERM',()=>app.close().then(()=>process.exit()));}
