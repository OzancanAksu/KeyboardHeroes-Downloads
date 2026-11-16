'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/dist/index.html','utf8');
const css=fs.readFileSync(__dirname+'/dist/training-room.css','utf8');
assert.match(html,/id="training-open"/);assert.match(html,/id="training-overlay"/);
assert.match(html,/src="training-room.js"/);assert.match(css,/kh-training-room/);
assert.match(html,/<button id="training-rebuild"[^>]*aria-label="Envantere dön ve build değiştir"/);
assert.match(html,/class="training-rebuild-label">ENVANTERE DÖN</);
assert.match(html,/class="training-rebuild-icon"[^>]*><svg/);
assert.ok(html.lastIndexOf('href="training-room.css"')>html.lastIndexOf('href="arcana-unified.css"'),'training styles must override theme');
assert.match(css,/body\.kh-training-room \.game-shell > \.arena-top #training-rebuild/);
assert.match(css,/html\.kh-android-playing body\.kh-training-room \.game-shell > \.arena-top/);
assert.match(css,/min-height:43px!important/);
const elements=new Map();
function el(id){
 if(!elements.has(id))elements.set(id,{id,textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},
  addEventListener(type,handler){this[type]=handler},getAttribute(){return'';},focus(){},value:id==='playerAlias'?'Tester':''});
 return elements.get(id);
}
const box={console,Math,document:{getElementById:el,querySelector:el,querySelectorAll:()=>[],body:{classList:{add(){},remove(){}}}},window:{}};
vm.createContext(box);
const bootstrap=[
 "let mode=2,matchType='vs',phase='idle',paused=false,actors=[],shots=[],zones=[],effects=[],floating=[],score=[0,0],clock=120,round=1,serial=0,respawns=[],arenaLayout='bridges',arenaSize='grand',camera={x:0,y:0};",
 "const input={keys:new Set(),enemy:null,selectedEnemy:null,target:null,down:false};",
 "const net={active:false},canvas={focus(){}};",
 "function actor(team,x,y,kind,human){return {id:++serial,team,x,y,kind,human,hp:2500,max:2500,cd:[0,0,0,0]};}",
 "function setupRound(){actors=[actor(0,-100,0,'blade',true),actor(1,100,0,'blade',false)];phase='draft';clock=90;}",
 "function confirmBuild(){if(phase==='draft'){actors[0]=actor(0,-100,0,'blade',true);phase='fight';clock=120;}}",
 "function damage(a,n){a.hp=Math.max(0,a.hp-n);}",
 "function update(dt){if(phase==='fight'){clock=Math.max(0,clock-dt);for(const a of actors){if(a.hp<=0)respawnActor(a,dt);else if(!a.human)bot(a,dt);}stepObjectives(dt);}updateHud();}",
 "function updateHud(){}",
 "function bot(a){a.x+=100;}",
 "function respawnActor(a){a.hp=a.max;}",
 "function resetObjectives(){}",
 "let controlPoints=[{x:1}];",
 "function stepObjectives(){phase='end';}",
 "function drawChampion(){}",
 "function leaveBotMatch(){phase='idle';actors=[];clock=120;}",
 "function refreshExitButtons(){}",
 "function requirePlayerName(){return 'TEST';}",
 "function setArenaLayout(a){arenaLayout=a;}",
 "function setArenaSize(a){arenaSize=a;}",
 "function notify(){}",
 "function openDraft(){}",
 "function ellipse(){}",
 "function ring(){}",
 "function project(x,y){return {x,y};}",
 "const ctx={save(){},restore(){},translate(){},scale(){},fillRect(){},strokeRect(){},beginPath(){},arc(){},fill(){},fillText(){}};",
 "let scale=1;"
].join('\n');
vm.runInContext(bootstrap,box);
vm.runInContext(fs.readFileSync(__dirname+'/dist/training-room.js','utf8'),box,{filename:'training-room.js'});
el('training-open').click();
assert.equal(box.window.khTrainingRoom.active,true);
assert.equal(vm.runInContext('phase',box),'draft');
assert.equal(vm.runInContext('clock',box),Infinity);
assert.equal(box.window.khTrainingRoom.getSnapshot().hp,10000);
vm.runInContext('confirmBuild()',box);
for(let i=0;i<10;i++)vm.runInContext('update(.1)',box);
assert.equal(vm.runInContext('phase',box),'fight');
assert.equal(vm.runInContext('clock',box),Infinity);
assert.equal(vm.runInContext('actors[1].x',box),170,'dummy must remain stationary');
vm.runInContext('damage(actors[1],100)',box);
for(let i=0;i<10;i++)vm.runInContext('update(.1)',box);
assert.ok(Math.abs(box.window.khTrainingRoom.getSnapshot().hp-9950)<.01,'regen is exactly 50 HP/s');
vm.runInContext('damage(actors[1],20000)',box);
assert.equal(box.window.khTrainingRoom.getSnapshot().kills,1);
assert.equal(box.window.khTrainingRoom.getSnapshot().hp,0);
for(let i=0;i<49;i++)vm.runInContext('update(.1)',box);
assert.equal(box.window.khTrainingRoom.getSnapshot().hp,0,'target cannot respawn early');
vm.runInContext('update(.1)',box);
assert.equal(box.window.khTrainingRoom.getSnapshot().hp,10000,'target respawns after five seconds');
assert.equal(box.window.khTrainingRoom.getSnapshot().total,10050);
el('training-rebuild').click();
assert.equal(vm.runInContext('phase',box),'draft','rebuild opens equipment draft');
assert.equal(box.window.khTrainingRoom.getSnapshot().total,0,'rebuild resets stats');
assert.equal(box.window.khTrainingRoom.getSnapshot().hp,10000,'rebuild resets dummy');
vm.runInContext('confirmBuild()',box);
vm.runInContext('leaveBotMatch()',box);
assert.equal(box.window.khTrainingRoom.active,false);
assert.equal(vm.runInContext('phase',box),'idle');
assert.equal(vm.runInContext('matchType',box),'vs');
console.log('PASS: standalone training room, exact regeneration, 5s respawn, immortal timer, exit');
