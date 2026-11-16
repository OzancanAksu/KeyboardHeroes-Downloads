'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/dist/mobile-terrain-cache.js','utf8');
const html=fs.readFileSync(__dirname+'/dist/index.html','utf8');

function scenario(agent='KeyboardHeroesAndroid/0.6.4'){
 let draws=0,cachedComposites=0,buffers=0,compositeFailure=false;
 const fakeCtx=(front=false)=>({
  setTransform(){},drawImage(){if(front&&compositeFailure){compositeFailure=false;throw Error('evicted texture');}cachedComposites++;},save(){},restore(){}
 });
 const window={};
 const test={
  navigator:{userAgent:'Mozilla/5.0 '+agent},window,
  canvas:{width:1350,height:645},ctx:fakeCtx(true),cw:900,ch:430,scale:1,
  camera:{x:0,y:0},arenaLayout:'courtyard',arenaSize:'standard',
  matchType:'domination',arenaBounds:{x:900,y:700},khPerfLow:false,
  document:{createElement(tag){
   assert.equal(tag,'canvas');buffers++;
   return {width:0,height:0,getContext(){return fakeCtx();}};
  }},
  drawBattlefield(){draws++;}
 };
 vm.runInNewContext(src,test);
 if(!agent.includes('KeyboardHeroesAndroid')){
  assert.equal(window.khMobileTerrainStats,undefined);
  test.drawBattlefield();assert.equal(draws,1);
  return;
 }
 const state=window.khMobileTerrainStats;
 for(let i=0;i<90;i++)test.drawBattlefield();
 assert.equal(state.misses,1,'Rasterize one map once at a stationary camera');
 assert.ok(state.hits>=89,'Reuse static GPU bitmap for subsequent frames');
 assert.equal(draws,1,'No terrain geometry calculation every frame');
 assert.ok(state.bytes>0&&state.bytes<=2200000*4,'Bound mobile GPU cache to ~9 MB');
 assert.equal(buffers,1);
 assert.equal(cachedComposites,90);
 test.camera.x+=400;
 test.drawBattlefield();assert.equal(state.misses,2,'Camera crossing overscan redraws terrain');
 test.arenaLayout='bridges';
 test.drawBattlefield();assert.equal(state.misses,3,'Switching map invalidates cached geometry');
 test.arenaSize='grand';
 test.drawBattlefield();assert.equal(state.misses,4,'Switching arena size invalidates cache');
 window.khClearMobileTerrainCache();
 assert.equal(state.bytes,0,'Explicit memory release');
 test.drawBattlefield();assert.equal(state.misses,5);
 test.khPerfLow=true;
 const count=draws;
 test.drawBattlefield();assert.equal(draws,count+1,'Low graphics stays a safe direct-draw fallback');
 test.khPerfLow=false;
 compositeFailure=true;
 const beforeFailure=draws;
 test.drawBattlefield();
 assert.ok(draws>=beforeFailure+2,'Lost Android texture triggers immediate direct draw');
 assert.equal(state.compositeErrors,1,'GPU cache failure recorded');
 assert.ok(state.fallbacks>=1,'Fallback counted');
 assert.equal(state.bytes,0,'Evicted texture released');
 const beforeRebuild=state.misses;
 test.drawBattlefield();
 assert.equal(state.misses,beforeRebuild+1,'Cache re-created on next frame');
}
scenario();scenario('Mozilla/5.0 KeyboardHeroesDesktop/2.5.18');
assert.ok(html.includes('src="mobile-terrain-cache.js"'));
assert.ok(html.indexOf('src="desktop-performance-v4.js"')<
 html.indexOf('src="mobile-terrain-cache.js"'));
assert.ok(html.indexOf('src="mobile-terrain-cache.js"')<
 html.indexOf('src="android-controls.js"'));
console.log('PASS Android static terrain: one raster, 90 cache hits, camera/layout invalidation, memory cap, Windows isolation');
