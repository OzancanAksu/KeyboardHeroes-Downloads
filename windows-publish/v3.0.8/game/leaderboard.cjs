'use strict';
const crypto=require('node:crypto');
const VALID_UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const LIVE_PAGE_SIZE=500,MAX_RESULT_ROWS=50000,CACHE_MS=30000;
const QUEUES=new Set(['normal','competitive']);
function rankMatchHistory(rows,penalties=[]){
 const byId=new Map();
 let asOf=null;
 for(const row of rows){
  if(!row||typeof row.user_id!=='string'||!Number.isSafeInteger(row.kills)||row.kills<0||row.kills>10000||typeof row.won!=='boolean')continue;
  const joined=Array.isArray(row.kh_users)?row.kh_users[0]:row.kh_users;
  const username=typeof joined?.username==='string'?joined.username:'';
  if(!username||username.length>18)continue;
  if(typeof row.played_at==='string'&&(!asOf||row.played_at>asOf))asOf=row.played_at;
  let p=byId.get(row.user_id);
  if(!p){p={username,wins:0,kills:0,matches:0};byId.set(row.user_id,p);}
  p.wins+=row.won?1:0;p.kills+=row.kills;p.matches++;
 }
 // Penalty entries reduce victories but do not add wins, matches, or kills.
 for(const row of penalties){
  if(!row||typeof row.user_id!=='string'||row.victories_lost!==2)continue;
  const joined=Array.isArray(row.kh_users)?row.kh_users[0]:row.kh_users;
  const username=typeof joined?.username==='string'?joined.username:'';
  if(!username||username.length>18)continue;
  let p=byId.get(row.user_id);
  if(!p){p={username,wins:0,kills:0,matches:0};byId.set(row.user_id,p);}
  p.wins-=2;
  if(typeof row.penalized_at==='string'&&(!asOf||row.penalized_at>asOf))asOf=row.penalized_at;
 }
 const players=[...byId.values()].sort((a,b)=>b.wins-a.wins||b.kills-a.kills||
  b.matches-a.matches||a.username.localeCompare(b.username,'tr'))
  .slice(0,10).map((p,i)=>({rank:i+1,...p}));
 return {asOf,players};
}
function createLeaderboardService({url=process.env.SUPABASE_URL,secretKey=process.env.SUPABASE_SECRET_KEY,request=fetch,store=null}={}){
 const enabled=!!store||!!(url&&secretKey);
 if(!store&&enabled){
  const root=new URL(url);
  if(root.protocol!=='https:'||!root.hostname.endsWith('.supabase.co'))throw Error('Invalid SUPABASE_URL');
  const base=root.origin+'/rest/v1/';
  async function query(method,resource,body,headers={}){
   const head={apikey:secretKey,Accept:'application/json',...headers};
   if(secretKey.startsWith('eyJ'))head.Authorization='Bearer '+secretKey;
   if(body!==undefined){head['Content-Type']='application/json';if(!resource.startsWith('rpc/'))head.Prefer='resolution=ignore-duplicates,return=minimal';}
   const response=await request(base+resource,{method,headers:head,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
   if(!response.ok){
    let code='';
    try{
     const body=await response.json();
     code=typeof body?.code==='string'?body.code.slice(0,32):'';
    }catch{}
    const error=new Error('Leaderboard storage failed: '+response.status);
    error.status=response.status;
    error.dbCode=code;
    throw error;
   }
   return (method==='POST'&&!resource.startsWith('rpc/'))||response.status===204?[]:await response.json();
  }
  store={
   insert:rows=>query('POST','kh_match_results?on_conflict=match_id,user_id',rows),
   penalize:({matchId,userId,reason})=>query('POST','kh_ranked_penalties?on_conflict=match_id,user_id',[
    {match_id:matchId,user_id:userId,victories_lost:2,reason}
   ]),
   reset:async()=>{
    const result=await query('POST','rpc/kh_admin_clear_rankings',{});
    await query('DELETE','kh_ranked_penalties?match_id=not.is.null');
    return result;
   },
   managePlayer:async(args)=>{
    const result=await query('POST','rpc/kh_admin_manage_user',{
     p_actor_id:args.actorId,p_target_id:args.targetId,
     p_target_username:args.username,p_action:args.action,
     p_queue:args.queue,p_metric:args.metric,p_confirmation:args.confirmation
    });
    if(args.action==='reset_stats'&&['wins','both'].includes(args.metric)&&['competitive','all'].includes(args.queue))
     await query('DELETE','kh_ranked_penalties?user_id=eq.'+args.targetId);
    return result;
   },
   async listPlayers(){
    const accounts=await query('GET','kh_users?select=id,username&order=username.asc&limit=500');
    if(!Array.isArray(accounts))throw Error('Unexpected player list response');
    const byId=new Map(accounts.filter(u=>VALID_UUID.test(u.id)&&typeof u.username==='string').map(u=>[
     u.id,{id:u.id,username:u.username,normal:{wins:0,kills:0,matches:0},
      competitive:{wins:0,kills:0,matches:0},demo:{normal:null,competitive:null}}
    ]));
    for(let offset=0;offset<MAX_RESULT_ROWS;offset+=LIVE_PAGE_SIZE){
     const page=await query('GET','kh_match_results?select=user_id,queue,won,kills'
      +'&order=played_at.desc&limit='+LIVE_PAGE_SIZE+'&offset='+offset);
     if(!Array.isArray(page))throw Error('Unexpected match result list');
     for(const item of page){
      const p=byId.get(item.user_id),score=p?.[item.queue];
      if(!score)continue;
      score.wins+=item.won===true?1:0;
      score.kills+=Number.isSafeInteger(item.kills)?Math.max(0,item.kills):0;
      score.matches++;
     }
     if(page.length<LIVE_PAGE_SIZE)break;
     if(offset+page.length>=MAX_RESULT_ROWS)throw Error('Too many player results to list');
    }
    const penalties=await query('GET','kh_ranked_penalties?select=user_id,victories_lost&limit=50000');
    for(const row of penalties){const p=byId.get(row.user_id);if(p&&row.victories_lost===2)p.competitive.wins-=2;}
    const samples=await query('GET','kh_leaderboard_demo?select=user_id,queue,wins,kills,matches&limit=1000');
    if(!Array.isArray(samples))throw Error('Unexpected demo list');
    for(const item of samples){
     const p=byId.get(item.user_id);
     if(p&&QUEUES.has(item.queue))p.demo[item.queue]={
      wins:Number(item.wins)||0,kills:Number(item.kills)||0,matches:Number(item.matches)||0};
    }
    return [...byId.values()];
   },
   async demo(queue){
    const sample=await query('GET','kh_leaderboard_demo?select=user_id,wins,kills,matches'
      +'&queue=eq.'+queue+'&order=wins.desc,kills.desc&limit=10');
    if(!sample.length)return {asOf:null,players:[],demo:false};
    const ids=sample.map(x=>x.user_id).filter(id=>VALID_UUID.test(id));
    if(!ids.length)return {asOf:null,players:[],demo:false};
    const accounts=await query('GET','kh_users?select=id,username&id=in.('+ids.join(',')+')&limit='+ids.length);
    const names=new Map(accounts.map(a=>[a.id,a.username]));
    const players=sample.filter(p=>names.has(p.user_id)).map(p=>({
     username:names.get(p.user_id),wins:Number(p.wins),kills:Number(p.kills),matches:Number(p.matches)
    })).sort((a,b)=>b.wins-a.wins||b.kills-a.kills||b.matches-a.matches||a.username.localeCompare(b.username,'tr'))
     .slice(0,10).map((p,i)=>({rank:i+1,...p}));
    return {asOf:null,players,demo:true};
   },
   // Read completed matches and resolve account names separately. This avoids
   // PostgREST foreign-key-embedding/schema-cache errors during SQL migrations.
   // No passwords, sessions, or full player records ever leave the backend.
   live:async(queue='normal')=>{
    const rows=[];
    for(let offset=0;offset<MAX_RESULT_ROWS;offset+=LIVE_PAGE_SIZE){
     const page=await query('GET','kh_match_results?select=user_id,won,kills,played_at'
      +'&queue=eq.'+queue+'&order=played_at.desc&limit='+LIVE_PAGE_SIZE+'&offset='+offset);
     if(!Array.isArray(page))throw Error('Invalid leaderboard result page');
     rows.push(...page);
     if(page.length<LIVE_PAGE_SIZE)break;
     if(offset+page.length>=MAX_RESULT_ROWS)throw Error('Leaderboard history exceeds bounded live aggregation; configure an aggregate view');
    }
    const penalties=[];
    if(queue==='competitive')for(let offset=0;offset<MAX_RESULT_ROWS;offset+=LIVE_PAGE_SIZE){
     const page=await query('GET','kh_ranked_penalties?select=user_id,victories_lost,penalized_at'
      +'&order=penalized_at.desc&limit='+LIVE_PAGE_SIZE+'&offset='+offset);
     if(!Array.isArray(page))throw Error('Invalid ranked penalty page');
     penalties.push(...page);
     if(page.length<LIVE_PAGE_SIZE)break;
     if(offset+page.length>=MAX_RESULT_ROWS)throw Error('Ranked penalty list exceeds limit');
    }
    if(!rows.length&&!penalties.length)return {asOf:null,players:[]};
    const ids=[...new Set([...rows,...penalties].map(row=>row.user_id).filter(id=>VALID_UUID.test(id)))];
    const names=new Map();
    for(let start=0;start<ids.length;start+=80){
     const chunk=ids.slice(start,start+80);
     const users=await query('GET','kh_users?select=id,username&id=in.('+chunk.join(',')+')&limit='+chunk.length);
     if(!Array.isArray(users))throw Error('Invalid leaderboard user page');
     for(const user of users)if(VALID_UUID.test(user?.id)&&typeof user?.username==='string')
      names.set(user.id,user.username);
    }
    return rankMatchHistory(rows.map(row=>({
     ...row,kh_users:{username:names.get(row.user_id)||''}
    })),penalties.map(row=>({...row,kh_users:{username:names.get(row.user_id)||''}})));
   },
   latest:async(queue='normal')=>{
    if(queue!=='normal')return {asOf:null,players:[]};
    const days=await query('GET','kh_leaderboard_daily?select=snapshot_day&order=snapshot_day.desc&limit=1');
    if(!days.length)return {asOf:null,players:[]};
    const date=days[0].snapshot_day;
    const rows=await query('GET','kh_leaderboard_daily?select=rank,username,wins,kills,matches&snapshot_day=eq.'+encodeURIComponent(date)+'&order=rank.asc&limit=10');
    return {asOf:date,players:rows};
   }
  };
 }
 function resultRows({matchId,players,stats,matchType,winner,score,ranked=false}){
  if(!VALID_UUID.test(matchId)||!Array.isArray(players)||players.length<2||players.length>10||!players.every(p=>p.account&&VALID_UUID.test(p.account.id))||new Set(players.map(p=>p.account.id)).size!==players.length)return [];
  if(!Array.isArray(stats)||!Array.isArray(score)||!['vs','capture','domination','skirmish','hill','deathmatch','relicdeathmatch','flagRace','labyrinth'].includes(matchType))return [];
  if(ranked&&(![6,8,10].includes(players.length)||!['domination','hill','flagRace'].includes(matchType)
    ||players.filter(p=>p.team===0).length!==players.length/2||players.filter(p=>p.team===1).length!==players.length/2))return [];
  if(matchType==='vs')winner=score[0]===score[1]?null:score[0]>score[1]?0:1;
  const rows=players.map(p=>{
   const stat=stats.find(s=>s.id===p.id);
   const kills=stat?.kills,deaths=stat?.deaths;
   if(!Number.isSafeInteger(kills)||kills<0||kills>10000||!Number.isSafeInteger(deaths)||deaths<0||deaths>10000)return null;
   return {match_id:matchId,user_id:p.account.id,queue:ranked?'competitive':'normal',won:winner!==null&&winner===p.team,kills,deaths};
  });
  return rows.every(Boolean)?rows:[];
 }
 const cache=new Map(),pending=new Map();
 function invalidate(){cache.clear();pending.clear();}
 async function read(queue='normal',{fresh=false}={}){
  if(!QUEUES.has(queue))throw Error('Invalid leaderboard queue');
  if(!enabled)return {asOf:null,players:[]};
  if(!fresh){const hit=cache.get(queue);if(hit&&Date.now()-hit.at<CACHE_MS)return hit.value;}
  if(pending.has(queue))return pending.get(queue);
  const request=(async()=>{
   let data;
   if(typeof store.live==='function'){
    try{data=await store.live(queue);}
    catch(error){
     if(typeof store.latest!=='function')throw error;
     const snapshot=await store.latest(queue).catch(()=>null);
     if(!snapshot?.players?.length)throw error;
     data=snapshot;
    }
   }else data=await store.latest(queue);
   if(!data.players?.length&&typeof store.demo==='function'){
    const demo=await store.demo(queue);
    if(demo?.players?.length)data=demo;
   }
   const parsed={asOf:typeof data.asOf==='string'?data.asOf:null,
    players:(data.players||[]).slice(0,10).map(p=>({
     rank:Number(p.rank),username:String(p.username),wins:Number(p.wins),
     kills:Number(p.kills),matches:Number(p.matches)
    }))};
   if(data.demo===true)parsed.demo=true;
   cache.set(queue,{at:Date.now(),value:parsed});
   return parsed;
  })();
  pending.set(queue,request);
  try{return await request;}finally{if(pending.get(queue)===request)pending.delete(queue);}
 }
 return {
  enabled,resultRows,read,
  async recordMatch(match){
   if(!enabled)return false;
   const rows=resultRows(match);
   if(!rows.length)return false;
   await store.insert(rows);
   invalidate();
   return true;
  },
  async penalize({matchId,userId,reason}){
   if(!enabled||typeof store.penalize!=='function')throw Error('Ranked penalty store unavailable');
   if(!VALID_UUID.test(matchId)||!VALID_UUID.test(userId)||!['leave','timeout'].includes(reason))throw Error('Invalid ranked penalty');
   await store.penalize({matchId,userId,reason});invalidate();return true;
  },
  async refresh(){
   invalidate();
   return {normal:await read('normal',{fresh:true}),competitive:await read('competitive',{fresh:true})};
  },
  async reset(){
   if(!enabled||typeof store.reset!=='function')throw Error('Leaderboard reset unsupported');
   const removed=await store.reset();invalidate();return removed;
  },
  async listPlayers(){
   if(!enabled||typeof store.listPlayers!=='function')throw Error('Admin user list unsupported');
   return store.listPlayers();
  },
  async managePlayer(args){
   if(!enabled||typeof store.managePlayer!=='function')throw Error('Admin player management unsupported');
   const removed=await store.managePlayer(args);invalidate();return removed;
  }
 };
}
module.exports={createLeaderboardService,rankMatchHistory};
