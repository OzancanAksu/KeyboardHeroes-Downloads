'use strict';
// Desktop painter V4. The Android APK has its own 60-Hz painter.
//
// Why: a 120/144/165/240-Hz Windows WebView2 repeatedly repaints every
// decorative map tile and a full DPR=1.5 backbuffer at monitor refresh,
// even though network/simulation inputs need independent update cadence.
//
// Keep original render-v3 detailed art by default; optimize *work*, not art:
// - The authoritative physics/network update loop remains on native rAF.
// - Only Canvas paints are paced to monitor refresh (roughly 60-85 Hz).
// - Static detailed battlefield is rasterized once with an overscan margin,
//   then camera-panned until the margin is exhausted.
// - A backed-pixel budget adapts to slow GPU/Canvas paint, without ever
//   forcing low-detail graphics or changing gameplay mechanics.
(function(){
 const isAndroid=/KeyboardHeroesAndroid\/\d+\.\d+\.\d+/.test(navigator.userAgent||'');
 if(isAndroid)return;
 const perf={
  active:true,maxPixels:3500000,minPixels:1600000,maxBudget:4000000,
  dpr:1,canvasPixels:0,paints:0,skips:0,terrainHits:0,terrainMisses:0,terrainCompositeFallbacks:0,
  paintMs:0,paintFps:0,nativeHz:60,paintStride:1,mode:'detailed'
 };
 window.khDesktopPerfState=perf;
 let cache=null;
 function cacheKey(){
  return [
   arenaLayout,arenaSize,matchType,arenaBounds.x,arenaBounds.y,
   Math.round(cw*10),Math.round(ch*10),canvas.width,canvas.height,
   Math.round(scale*10000),khPerfLow?1:0
  ].join('|');
 }
 const baseBattlefield=drawBattlefield;
 drawBattlefield=function(){
  if(khPerfLow){cache=null;perf.mode='fast (F8)';return baseBattlefield();}
  perf.mode='detailed';
  const px=canvas.width/Math.max(1,cw),py=canvas.height/Math.max(1,ch);
  const d=Math.min(px,py),overscanX=Math.max(165,Math.min(320,cw*.22));
  const overscanY=Math.max(140,Math.min(260,ch*.22));
  const offW=cw+2*overscanX,offH=ch+2*overscanY;
  const bw=Math.ceil(offW*d),bh=Math.ceil(offH*d),key=cacheKey();
  // Guard GPU memory on ultra-wide/high-resolution monitors.
  if(bw*bh>15000000){cache=null;return baseBattlefield();}
  function offset(item){
   return {
    x:overscanX+(camera.x-item.camX-(camera.y-item.camY))*.83*scale,
    y:overscanY*1.02+(camera.x-item.camX+camera.y-item.camY)*.44*scale
   };
  }
  let margin=cache?offset(cache):null;
  const needsNew=!cache||cache.key!==key||!margin||
   margin.x<10||margin.y<10||margin.x+cw>offW-10||margin.y+ch>offH-10;
  if(needsNew){
   const buffer=document.createElement('canvas');
   buffer.width=bw;buffer.height=bh;
   const bufferCtx=buffer.getContext('2d',{alpha:true});
   if(!bufferCtx){cache=null;return baseBattlefield();}
   const oldCtx=ctx,oldCw=cw,oldCh=ch,oldCam=camera;
   const cacheCam={x:oldCam.x,y:oldCam.y};
   try{
    ctx=bufferCtx;cw=offW;ch=offH;camera=cacheCam;
    bufferCtx.setTransform(d,0,0,d,0,0);
    baseBattlefield();
   }catch(err){
    cache=null;
    // Throw to the usual renderer's diagnostic path. All globals are
    // restored in finally, so subsequent frames remain recoverable.
    throw err;
   }finally{
    ctx=oldCtx;cw=oldCw;ch=oldCh;camera=oldCam;
   }
   cache={surface:buffer,key,camX:cacheCam.x,camY:cacheCam.y,offW,offH,
     overscanX,overscanY,d};
   perf.terrainMisses++;
   margin=offset(cache);
  }else perf.terrainHits++;
  // Composite only visible viewport pixels; preserve full-resolution detailed
  // terrain and camera offset. No changes to heroes, spell FX or buildings.
  try{ctx.drawImage(cache.surface,margin.x*d,margin.y*d,cw*d,ch*d,0,0,cw,ch);}
  catch(error){
   // A lost/evicted GPU bitmap must fall back to normal terrain in THIS frame,
   // never leave an empty canvas while waiting for a later cache rebuild.
   cache=null;perf.terrainCompositeFallbacks++;return baseBattlefield();
  }
 };
 const painter=draw;
 let lastTick=0,estimatedFrameMs=16.67,paintStep=0,pendingResize=false,
     rollingPaint=0,rollingTime=performance.now(),lastAdjust=0,steady=0;
 // ResizeObserver and the adaptive quality controller request, but NEVER
 // clear, the front buffer between paints. Resize immediately before repaint.
 window.khRequestCanvasResize=()=>{pendingResize=true;};
 draw=function(){
  const now=performance.now();
  if(lastTick>0){
   const delta=now-lastTick;
   if(delta>=3&&delta<80)estimatedFrameMs=estimatedFrameMs*.9+delta*.1;
  }
  lastTick=now;
  // Snap the drawing stride to an integer number of real display refreshes
  // to avoid stutter from arbitrary 16ms throttles on 120/144/165-Hz screens.
  const hz=Math.max(20,Math.min(300,1000/Math.max(3,estimatedFrameMs)));
  const desired=phase==='fight'?76:phase==='draft'?28:24;
  const stride=hz>desired*1.23?Math.max(1,Math.round(hz/desired)):1;
  perf.nativeHz=Math.round(hz);perf.paintStride=stride;
  if(document.hidden||paintStep++%stride!==0){perf.skips++;return;}
  // Resizing after a just-painted frame clears its bitmap and flashes once.
  // Resize *before* painting the next frame instead.
  if(pendingResize){pendingResize=false;resize();}
  const start=performance.now();
  const result=painter();
  const elapsed=performance.now()-start;
  if(elapsed<90){
   perf.paintMs=perf.paintMs===0?elapsed:perf.paintMs*.93+elapsed*.07;
  }
  perf.paints++;rollingPaint++;
  if(now-rollingTime>=700){
   perf.paintFps=Math.round(rollingPaint*1000/Math.max(1,now-rollingTime));
   rollingPaint=0;rollingTime=now;
  }
  // Adjust ONLY the canvas backing resolution, never the original detailed
  // geometry. Slow or software-rendering GPUs get fewer backing pixels.
  // Hysteresis avoids repeated canvas resize / cache invalidations.
  if(now-lastAdjust>2300&&perf.paints>80&&phase==='fight'){
   const tooSlow=perf.paintMs>12.5||
     (perf.paintFps>0&&perf.paintFps<47&&perf.nativeHz<60);
   const plenty=perf.paintMs<6.5&&perf.paintFps>=55;
   if(tooSlow&&perf.maxPixels>perf.minPixels){
    perf.maxPixels=Math.max(perf.minPixels,Math.round(perf.maxPixels*.86));
    steady=0;lastAdjust=now;pendingResize=true;
   }else if(plenty&&perf.maxPixels<perf.maxBudget){
    if(++steady>=3){
     perf.maxPixels=Math.min(perf.maxBudget,Math.round(perf.maxPixels*1.055));
     lastAdjust=now;steady=0;pendingResize=true;
    }
   }else steady=0;
  }
  return result;
 };
 // Recalculate backing pixels immediately after the module initializes;
 // the first resize in game.js intentionally ran before this module loaded.
 resize();
})();
