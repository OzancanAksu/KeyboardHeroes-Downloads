'use strict';
// v3.1.0: lightweight author-drawn Canvas VFX. No external image fetch,
// no per-frame particles emitted, and zero damage calculations in this file.
// These styles arrive through the existing authoritative effects snapshot.
(function(){
 const previousDrawAbility=drawAbility;
 const prefix='kh310-';
 function stroke(c,color,width){c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';}
 function oval(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();}
 function line(c,points,color,width=2){
  c.beginPath();for(let i=0;i<points.length;i++){const [x,y]=points[i];if(i)c.lineTo(x,y);else c.moveTo(x,y);}
  stroke(c,color,width);c.stroke();
 }
 function ring(c,r,color,width=2){
  c.beginPath();c.ellipse(0,0,r,r*.47,0,0,Math.PI*2);stroke(c,color,width);c.stroke();
 }
 function hatchet(c,x,y,spin,size=1){
  c.save();c.translate(x,y);c.rotate(spin);c.scale(size,size);
  // Complete, visibly edged short axe; the square back is a striking hammer.
  c.shadowColor='#6ad5e3';c.shadowBlur=6;
  c.fillStyle='#654832';c.strokeStyle='#e5be85';c.lineWidth=1.7;
  c.beginPath();c.moveTo(-2,15);c.lineTo(-3,-12);c.lineTo(3,-12);c.lineTo(2,15);c.closePath();c.fill();c.stroke();
  c.shadowBlur=0;
  c.beginPath();c.moveTo(-2,-11);c.lineTo(-16,-21);c.lineTo(-25,-14);c.lineTo(-22,-3);c.lineTo(-8,-7);c.lineTo(-2,-3);c.closePath();
  c.fillStyle='#c6e0e7';c.strokeStyle='#eaf5ed';c.lineWidth=1.8;c.fill();c.stroke();
  c.beginPath();c.moveTo(3,-14);c.lineTo(15,-13);c.lineTo(19,-5);c.lineTo(15,1);c.lineTo(3,-2);c.closePath();
  c.fillStyle='#927d75';c.strokeStyle='#d6b999';c.fill();c.stroke();
  c.fillStyle='#77dce6';c.beginPath();c.arc(0,-8,3.5,0,Math.PI*2);c.fill();
  c.restore();
 }
 function worldAt(x,y,z=18){return project(x,y,z);}
 function groundRing(e,t,color='#dcc3a0',radius=e.r||125,width=2){
  const p=worldAt(e.x,e.y,2);ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);
  ctx.globalAlpha=Math.min(.8,Math.max(.08,1-t));
  ring(ctx,radius,color,width);ctx.restore();
 }
 function focus(e,t,shield){
  const p=worldAt(e.x,e.y,20);
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);
  const grow=(shield?82:63)*(0.6+t*.4);
  ctx.globalAlpha=Math.min(.8,.25+Math.sin(t*Math.PI)*.5);
  ring(ctx,grow,shield?'#ffd491':'#9bd9e6',shield?3:2.3);
  for(let i=0;i<(shield?8:6);i++){
   const a=Math.PI*2*i/(shield?8:6)+t*(shield?-1.3:2.2);
   const x=Math.cos(a)*grow,y=Math.sin(a)*grow*.47;
   ctx.save();ctx.translate(x,y);ctx.rotate(a);
   line(ctx,[[-7,1],[0,-8],[7,1]],shield?'#efcc88':'#c4e4f0',2.3);
   ctx.restore();
  }
  if(shield){
   stroke(ctx,'#f8d9a3',3);ctx.beginPath();ctx.arc(0,-16,26,Math.PI*1.05,Math.PI*1.95);ctx.stroke();
   line(ctx,[[-14,-23],[0,-34],[14,-23]],'#e9d4ab',2);
  }else{
   for(const side of [-1,1])hatchet(ctx,side*27,-25,side*1.2+t*4,0.55);
  }
  ctx.restore();
 }
 function flying(e,t){
  const angle=e.angle||0,s=e.side||0;
  const d=(e.distance||330)*Math.min(1,Math.max(0,t));
  const x=e.x+Math.cos(angle)*d-Math.sin(angle)*s;
  const y=e.y+Math.sin(angle)*d+Math.cos(angle)*s;
  const p=worldAt(x,y,26),back=worldAt(x-Math.cos(angle)*44,y-Math.sin(angle)*44,25);
  ctx.save();ctx.globalAlpha=Math.max(.15,1-t*.6);
  line(ctx,[[back.x,back.y],[p.x,p.y]],'#d2eaf4',4*scale);
  line(ctx,[[back.x+2,back.y-3],[p.x,p.y]],'#7fb7ce',1.5*scale);
  ctx.translate(p.x,p.y);ctx.scale(scale*.93,scale*.93);
  hatchet(ctx,0,0,t*Math.PI*8+(e.side<0?0:Math.PI),.95);
  ctx.restore();
 }
 function whirlwind(e,t){
  const p=worldAt(e.x,e.y,4);
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);
  const r=Math.min(145,e.r||145);
  ctx.globalAlpha=.34+Math.sin(t*Math.PI)*.28;
  for(let i=0;i<3;i++){
   ctx.beginPath();ctx.ellipse(0,0,r*(.45+i*.24),r*(.25+i*.11),
    t*8+i*.65,Math.PI*.08,Math.PI*1.8);
   stroke(ctx,i===0?'#e5d4dc':i===1?'#9ebdce':'#b4a5d7',2+i*.4);ctx.stroke();
  }
  ctx.restore();
  for(let i=0;i<4;i++){
   const phase=t*Math.PI*10+(Math.PI*2*i/4);
   const rr=78+(i%2)*42,ax=e.x+Math.cos(phase)*rr,ay=e.y+Math.sin(phase)*rr;
   const point=worldAt(ax,ay,17+i%2*6);
   ctx.save();ctx.translate(point.x,point.y);
   ctx.globalAlpha=.88;ctx.scale(scale*.81,scale*.81);
   hatchet(ctx,0,0,-phase*1.9,0.72);
   ctx.restore();
  }
 }
 function guard(e,t,pulse=false){
  const p=worldAt(e.x,e.y,20),r=Math.min(145,e.r||145),radius=r*(pulse?.65+t*.35:1);
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);
  ctx.globalAlpha=pulse?Math.max(.1,1-t):.72+Math.sin(t*Math.PI*8)*.13;
  ring(ctx,radius,pulse?'#fff3c3':'#e7bb70',pulse?5:3);
  ring(ctx,radius*.84,'#8eb9c6',1.4);
  for(let i=0;i<10;i++){
   const a=i*Math.PI/5+t*(pulse?0:2.5),x=Math.cos(a)*radius,y=Math.sin(a)*radius*.47;
   ctx.save();ctx.translate(x,y);ctx.rotate(a);
   line(ctx,[[-6,0],[0,-11],[6,0]],'#f5d29a',2.6);
   ctx.restore();
  }
  if(!pulse){
   stroke(ctx,'#b7e0dc',2);
   ctx.beginPath();ctx.arc(0,-21,29,Math.PI*1.16,Math.PI*1.84);ctx.stroke();
   line(ctx,[[-13,-24],[0,-39],[13,-24]],'#f6d7a6',2.4);
  }
  ctx.restore();
 }
 function dust(e,t){
  const p=worldAt(e.x,e.y,5),s=e.seed||1;
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);
  ctx.globalAlpha=Math.max(.02,(1-t)*.54);
  for(let i=0;i<4;i++){
   const k=(s*7+i*11)%13,spread=9+i*7+t*(15+(k%5)*3);
   const x=Math.cos((k+i)*1.6)*spread,y=Math.sin((k+i)*1.8)*spread*.49-t*(6+i*4);
   oval(ctx,x,y,8+i*4+t*6,4+i*2+t*4,
    i%2?'#a79888':'#d9c2a4');
  }
  ctx.globalAlpha=Math.max(0,.6-t*.5);
  for(let i=0;i<3;i++){
   const x=(i-1)*11+(s%3)*2;
   line(ctx,[[x+6,4],[x-7-t*13,10+i*3]],'#e2cfad',1.6);
  }
  ctx.restore();
 }
 function impact(e,t,ram){
  const p=worldAt(e.x,e.y,24);
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);
  ctx.globalAlpha=Math.max(0,1-t);
  const r=(ram?27:17)*(1+t*1.1),angle=e.angle||0;
  for(let i=0;i<7;i++){
   const a=angle+i*Math.PI*2/7,rr=r*(.8+(i%3)*.18);
   line(ctx,[[Math.cos(a)*7,Math.sin(a)*4],[Math.cos(a)*rr,Math.sin(a)*rr*.72]],
    ram?'#f6c78e':'#b8e9f1',i%2?2:3);
  }
  ctx.beginPath();ctx.arc(0,0,r*.55,0,Math.PI*2);
  ctx.fillStyle=ram?'#ffd7a5':'#b6e6ef';ctx.fill();
  ctx.restore();
 }
 function ramFront(e,t){
  const p=worldAt(e.x,e.y,22);
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);
  ctx.globalAlpha=(1-t)*.7;
  ctx.rotate(Math.atan2(Math.sin(e.angle||0)+Math.cos(e.angle||0),
    Math.cos(e.angle||0)-Math.sin(e.angle||0)));
  line(ctx,[[-16,-16],[16,0],[-16,16]],'#efd4a0',4);
  line(ctx,[[-23,-11],[0,0],[-23,11]],'#9cbcc4',1.8);
  ctx.restore();
 }
 drawAbility=function(e){
  if(typeof e?.style!=='string'||!e.style.startsWith(prefix))return previousDrawAbility(e);
  // Defensive aura follows the caster's interpolated multiplayer position.
  // Historical dust, impacts and thrown axes deliberately stay world-anchored.
  if(e.style==='kh310-guard-aura'&&typeof actors!=='undefined'){
   const owner=actors.find(a=>a.id===e.khOwner&&a.hp>0);
   if(owner)e={...e,x:owner.x,y:owner.y};
  }
  const t=1-Math.max(0,e.life)/Math.max(.001,e.max||.5);
  ctx.save();
  switch(e.style){
  case 'kh310-focus-axes':focus(e,t,false);break;
  case 'kh310-focus-shield':focus(e,t,true);break;
  case 'kh310-axe-flight':flying(e,t);break;
  case 'kh310-whirl':whirlwind(e,t);break;
  case 'kh310-guard-aura':guard(e,t);break;
  case 'kh310-guard-pulse':guard(e,t,true);break;
  case 'kh310-ram-dust':dust(e,t);break;
  case 'kh310-ram-start':case 'kh310-ram-front':ramFront(e,t);break;
  case 'kh310-ram-impact':impact(e,t,true);break;
  case 'kh310-axe-hit':impact(e,t,false);break;
  case 'kh310-whirl-pulse':groundRing(e,t,'#dce8f5',e.r||145,5);break;
  case 'kh310-guard-break':groundRing(e,t,'#e9b48b',e.r||145,3);break;
  case 'kh310-focus-break':case 'kh310-ram-break':groundRing(e,t,'#d5c0ad',64,3);break;
  default:break;
  }
  ctx.restore();
 };
})();
