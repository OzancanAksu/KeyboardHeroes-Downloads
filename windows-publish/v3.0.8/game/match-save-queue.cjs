'use strict';

// Keeps an authoritative, immutable final match result available for retry after
// the room returns to the lobby or starts another round. In-memory only:
// process restarts during a database outage can still lose outstanding jobs.
function createMatchSaveQueue({save,logger=console,now=Date.now}={}){
 if(typeof save!=='function')throw new TypeError('Match save handler is required');
 const pending=new Map();
 const MAX_PENDING=5000;
 const RETRY_CAP_MS=60000;
 function report(level,message,details){
  const method=typeof logger[level]==='function'?logger[level]:logger.warn;
  if(method)method.call(logger,message,details);
 }
 async function attempt(job){
  if(job.running||!pending.has(job.match.matchId)||now()<job.nextAt)return false;
  job.running=true;job.attempts++;
  try{
   const ok=await save(job.match);
   if(ok!==true){
    report('error','Match save rejected without a database write',{
     matchId:job.match.matchId,matchType:job.match.matchType,
     playerCount:job.match.players.length,attempt:job.attempts
    });
    job.nextAt=now()+RETRY_CAP_MS;
    return false;
   }
   pending.delete(job.match.matchId);
   if(typeof job.onSaved==='function')job.onSaved();
   return true;
  }catch(error){
   job.nextAt=now()+Math.min(RETRY_CAP_MS,1000*2**Math.min(job.attempts,6));
   report('warn','Match save will retry',{
    matchId:job.match.matchId,matchType:job.match.matchType,
    attempt:job.attempts,error:error?.message||String(error)
   });
   return false;
  }finally{job.running=false;}
 }
 function enqueue(match,onSaved){
  if(!match||typeof match.matchId!=='string'||!match.matchId)throw new Error('Match ID required');
  if(pending.has(match.matchId))return true; // one queue job per authoritative match ID
  if(pending.size>=MAX_PENDING){
   report('error','Match persistence queue is full',{pending:pending.size,matchId:match.matchId});
   return false;
  }
  // State must not mutate when players leave, reconnect or start a rematch.
  const immutable=JSON.parse(JSON.stringify(match));
  const job={match:immutable,onSaved,attempts:0,running:false,nextAt:0};
  pending.set(match.matchId,job);
  void attempt(job);
  return true;
 }
 function retryDue(){
  for(const job of pending.values())if(!job.running&&now()>=job.nextAt)void attempt(job);
 }
 function size(){return pending.size;}
 return {enqueue,retryDue,size};
}
module.exports={createMatchSaveQueue};
