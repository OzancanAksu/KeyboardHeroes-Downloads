'use strict';
// Android/WebView static map raster cache. All arena physics, collision,
// objectives, spells and player updates remain authoritative on the server.
// This is purely local GPU/Canvas work and sends NO bitmap to the network.
(function(){
 const mobile=/KeyboardHeroesAndroid\/\d+\.\d+\.\d+/.test(navigator.userAgent||'');
 if(!mobile)return;
 const stats={enabled:true,hits:0,misses:0,fallbacks:0,compositeErrors:0,bytes:0,mode:'static-terrain-cache'};
 window.khMobileTerrainStats=stats;
 const original=drawBattlefield;
 let atlas=null;
 function key(){
  return [arenaLayout,arenaSize,matchType,arenaBounds.x,arenaBounds.y,
   Math.round(cw*10),Math.round(ch*10),canvas.width,canvas.height,
   Math.round(scale*10000),khPerfLow?1:0].join('|');
 }
 drawBattlefield=function(){
  if(khPerfLow){atlas=null;stats.mode='fast-fallback';return original();}
  stats.mode='static-terrain-cache';
  const sx=canvas.width/Math.max(1,cw),sy=canvas.height/Math.max(1,ch);
  // Keep overscan deliberately small on phones to avoid memory pressure.
  const padX=Math.max(95,Math.min(210,cw*.21));
  const padY=Math.max(90,Math.min(165,ch*.25));
  const offW=cw+2*padX,offH=ch+2*padY;
  // Lower cached terrain resolution on large tablets, not their live heroes/UI.
  const d=Math.min(1.5,sx,sy,Math.sqrt(2100000/(offW*offH)));
  if(!Number.isFinite(d)||d<.55){atlas=null;stats.fallbacks++;return original();}
  const bw=Math.ceil(offW*d),bh=Math.ceil(offH*d),mapKey=key();
  if(bw*bh>2200000){atlas=null;stats.fallbacks++;stats.bytes=0;return original();}
  const offset=item=>({
   x:padX+(camera.x-item.camX-(camera.y-item.camY))*.83*scale,
   y:padY*1.02+(camera.x-item.camX+camera.y-item.camY)*.44*scale
  });
  let margin=atlas?offset(atlas):null;
  const invalid=!atlas||atlas.key!==mapKey||!margin||
   margin.x<8||margin.y<8||margin.x+cw>offW-8||margin.y+ch>offH-8;
  if(invalid){
   const surface=document.createElement('canvas');
   surface.width=bw;surface.height=bh;
   let off=null;
   try{off=surface.getContext('2d',{alpha:true});}catch(error){}
   if(!off){atlas=null;stats.fallbacks++;return original();}
   let failed=false;
   const prevCtx=ctx,prevW=cw,prevH=ch,prevCam=camera;
   const center={x:camera.x,y:camera.y};
   try{
    ctx=off;cw=offW;ch=offH;camera=center;
    off.setTransform(d,0,0,d,0,0);
    original();
   }catch(error){
    atlas=null;stats.fallbacks++;failed=true;
   }finally{
    ctx=prevCtx;cw=prevW;ch=prevH;camera=prevCam;
   }
   if(failed)return original();
   atlas={key:mapKey,surface,camX:center.x,camY:center.y};
   stats.bytes=bw*bh*4;
   stats.misses++;
   margin=offset(atlas);
  }else stats.hits++;
  if(!atlas){stats.fallbacks++;return original();}
  try{ctx.drawImage(atlas.surface,margin.x*d,margin.y*d,cw*d,ch*d,0,0,cw,ch);}
  catch(error){
   // A WebView GPU context can evict an offscreen texture. Keep the battle
   // visible by painting the map directly in the same frame instead.
   atlas=null;stats.bytes=0;stats.fallbacks++;stats.compositeErrors++;
   return original();
  }
 };
 window.khClearMobileTerrainCache=()=>{atlas=null;stats.bytes=0;};
})();
