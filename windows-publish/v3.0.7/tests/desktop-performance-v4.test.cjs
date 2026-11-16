'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/dist/desktop-performance-v4.js','utf8');
const reports=[];
function scenario(refresh=144){
 let now=0,fieldCalls=0,paints=0,bufferCount=0,resizeCount=0;
 let tickNumber=0,paintedThisTick=false,inTick=false,resizeAfterPaint=0,compositeFailure=false;
 const fakeContext=(front=false)=>({
  setTransform(){},drawImage(){if(front&&compositeFailure){compositeFailure=false;throw Error('evicted GPU bitmap');}},save(){},restore(){},
  clearRect(){},beginPath(){},fill(){},stroke(){},fillRect(){},
  createRadialGradient(){return {addColorStop(){}}}
 });
 const context={
  navigator:{userAgent:'Mozilla/5.0 KeyboardHeroesDesktop/2.5.15'},
  window:{},document:{
   hidden:false,createElement(tag){
    assert.equal(tag,'canvas');bufferCount++;
    return {width:0,height:0,getContext(){return fakeContext(false)}};
   }
  },
  performance:{now:()=>now},
  canvas:{width:1350,height:870},
  ctx:fakeContext(true),cw:900,ch:580,scale:1,camera:{x:0,y:0},
  khPerfLow:false,phase:'fight',arenaLayout:'courtyard',
  arenaSize:'standard',matchType:'vs',arenaBounds:{x:650,y:500},
  resize(){resizeCount++;if(inTick&&paintedThisTick)resizeAfterPaint++;},
  drawBattlefield(){fieldCalls++;},
  draw(){paints++;paintedThisTick=true;context.drawBattlefield();}
 };
 const box=vm.createContext(context);
 vm.runInContext(src,box);
 function tick(n){for(let i=0;i<n;i++){tickNumber++;paintedThisTick=false;inTick=true;now+=1000/refresh;context.draw();inTick=false;}}
 tick(refresh); // Allow monitor-refresh estimator to settle after startup.
 paints=0;
 tick(refresh);
 const state=context.window.khDesktopPerfState;
 assert.ok(state&&state.active);
 assert.ok(paints>40&&paints<=90,'Painter must render at most about 85Hz on 144Hz displays: '+paints);
 assert.ok(state.terrainHits>10&&state.terrainMisses<=2,'Detailed terrain should be cached for stationary camera: '+JSON.stringify(state));
 assert.ok(fieldCalls<=2,'Should not redraw hundreds of terrain polygons each frame');
 const initialPaints=paints,initialMisses=state.terrainMisses;
 context.camera.x+=350;tick(4);
 assert.ok(state.terrainMisses>initialMisses,'Cache invalidation required when camera crosses overscan');
 const beforeMode=fieldCalls;context.khPerfLow=true;tick(10);
 assert.ok(fieldCalls>beforeMode,'F8 low-detail mode bypasses the detailed terrain cache');
 const beforeHidden=paints;context.document.hidden=true;tick(10);
 assert.equal(paints,beforeHidden,'Minimized/hidden window should avoid painting');
 context.document.hidden=false;
 assert.equal(resizeCount,1,'Initializing desktop optimization should resize once');
 context.khPerfLow=false;
 // A gain in frame budget used to call resize() AFTER a frame had already
 // been drawn. Canvas clears immediately on resize, flashing black.
 tick(refresh*12);
 assert.ok(state.maxPixels>3500000,'Adaptive budget should exercise the expansion path');
 assert.ok(resizeCount>1,'Adaptive canvas resizing still occurs before a paint');
 assert.equal(resizeAfterPaint,0,'NEVER clear the front buffer after painting');
 const beforeScheduled=resizeCount;
 context.window.khRequestCanvasResize();tick(10);
 assert.ok(resizeCount>beforeScheduled,'ResizeObserver should request a repaint-safe resize');
 assert.equal(resizeAfterPaint,0,'Observer-triggered resize must precede the paint');
 const beforeFallback=fieldCalls;
 compositeFailure=true;tick(10);
 assert.equal(state.terrainCompositeFallbacks,1,'Lost terrain texture must be handled');
 assert.ok(fieldCalls>beforeFallback,'A failed cache composite redraws the real terrain in the same frame');
 return {refresh,painted:initialPaints,fieldCalls,cacheHits:state.terrainHits,cacheMisses:state.terrainMisses,
  cacheBuffers:bufferCount,paintStride:state.paintStride};
}
reports.push(scenario(120),scenario(144),scenario(165),scenario(240));
const html=fs.readFileSync(__dirname+'/dist/index.html','utf8');
assert.ok(html.includes('src="desktop-performance-v4.js"'));
assert.ok(html.indexOf('src="render-v3.js"')<html.indexOf('src="desktop-performance-v4.js"'));
assert.ok(html.indexOf('src="desktop-performance-v4.js"')<html.indexOf('src="android-controls.js"'));
const game=fs.readFileSync(__dirname+'/dist/game.js','utf8');
assert.ok(game.includes("let ctx=canvas.getContext('2d')"));
assert.ok(game.includes('perf.maxPixels/(cw*ch)'));
console.log('PASS Windows performance: 120/144/165/240 Hz frame pacing, detailed terrain cache, camera invalidation, F8 toggle, hidden tab');
console.log(reports);
