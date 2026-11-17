'use strict';
// The Android download page and /android-apk redirect must agree with the
// latest actually published official APK, not the Windows desktop manifest.
const REPO='OzancanAksu/KeyboardHeroes-Downloads';
const PREFIX='https://github.com/'+REPO+'/releases/download/';
const FALLBACK=Object.freeze({
 version:'3.1.0',channel:'stable',tag:'android-v3.1.0',
 download:PREFIX+'android-v3.1.0/KeyboardHeroes-Android-v3.1.0.apk'
});
const semver=/^android-v(\d+)\.(\d+)\.(\d+)(-beta)?$/;
const sha256=/^sha256:[a-f0-9]{64}$/i;
function pickAndroidRelease(releases){
 let best=null;
 if(!Array.isArray(releases))return null;
 for(const release of releases){
  if(!release||release.draft||typeof release.tag_name!=='string')continue;
  const match=semver.exec(release.tag_name);
  if(!match||!Array.isArray(release.assets))continue;
  const numbers=match.slice(1,4).map(Number);
  if(numbers.some(n=>!Number.isSafeInteger(n)))continue;
  const version=numbers.join('.'),beta=!!match[4];
  const name='KeyboardHeroes-Android-v'+version+(beta?'-beta':'')+'.apk';
  const url=PREFIX+release.tag_name+'/'+name;
  const asset=release.assets.find(a=>a&&a.name===name&&a.browser_download_url===url
   &&Number.isSafeInteger(a.size)&&a.size>=10000&&a.size<=100000000
   &&sha256.test(a.digest||''));
  if(!asset)continue;
  const candidate={version,channel:beta?'beta':'stable',tag:release.tag_name,download:url,numbers};
  if(!best||numbers.some((n,i)=>numbers.slice(0,i).every((v,k)=>v===best.numbers[k])&&n>best.numbers[i])
    ||numbers.every((n,i)=>n===best.numbers[i])&&!beta&&best.channel==='beta')best=candidate;
 }
 if(!best)return null;
 const {numbers,...publicResult}=best;
 return publicResult;
}
let cache=null,expires=0,inFlight=null;
async function getAndroidRelease(){
 const now=Date.now();
 if(cache&&now<expires)return cache;
 if(inFlight)return inFlight;
 inFlight=(async()=>{
  try{
   const response=await fetch('https://api.github.com/repos/'+REPO+'/releases?per_page=50',{
    headers:{Accept:'application/vnd.github+json','User-Agent':'KeyboardHeroes-Android-Publisher'},
    signal:AbortSignal.timeout(6000)
   });
   if(!response.ok)throw Error('GitHub '+response.status);
   const list=await response.json();
   const candidate=pickAndroidRelease(list);
   // A temporary older/out-of-order feed must never downgrade the advertised APK.
   const fallback=FALLBACK.version.split('.').map(Number),numbers=candidate?.version?.split('.').map(Number);
   const newer=numbers&&(numbers[0]>fallback[0]||
    numbers[0]===fallback[0]&&numbers[1]>fallback[1]||
    numbers[0]===fallback[0]&&numbers[1]===fallback[1]&&numbers[2]>=fallback[2]);
   cache=newer?candidate:FALLBACK;
   expires=Date.now()+5*60*1000;
  }catch{
   cache=FALLBACK;
   expires=Date.now()+60*1000;
  }
  return cache;
 })();
 try{return await inFlight;}finally{inFlight=null;}
}
module.exports={getAndroidRelease,pickAndroidRelease,FALLBACK};
