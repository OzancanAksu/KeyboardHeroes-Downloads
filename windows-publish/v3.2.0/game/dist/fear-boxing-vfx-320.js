'use strict';
// v3.2.0 original Canvas-only FX: serialized server snapshots, no extra assets.
// Draw only; the server-side ability module owns all damage and timings.
(function(){
 const oldDraw=drawAbility;
 function line(c,points,color,width){
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();
 }
 function circle(c,x,y,r,color){
  c.beginPath();c.arc(x,y,Math.max(.01,r),0,Math.PI*2);c.fillStyle=color;c.fill();
 }
 function ring(c,r,color,width=3){
  c.beginPath();c.ellipse(0,0,r,r*.50,0,0,Math.PI*2);
  c.strokeStyle=color;c.lineWidth=width;c.stroke();
 }
 function ghost(e,t){
  const st=project(e.x,e.y,17),en=project(e.tx??e.x,e.ty??e.y,17);
  ctx.save();ctx.globalAlpha=(1-t)*.66;
  line(ctx,[[st.x,st.y],[en.x,en.y]],'#e69cd2',5*scale);
  line(ctx,[[st.x-8*scale,st.y-5*scale],[en.x-8*scale,en.y-5*scale]],'#6e347b',3*scale);
  for(let i=0;i<4;i++){
   const f=(t*.9+i*.25)%1,x=st.x+(en.x-st.x)*f,y=st.y+(en.y-st.y)*f;
   ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
   ctx.rotate(f*12);
   line(ctx,[[-13,7],[0,-24],[13,7]],i%2?'#e79bbd':'#9d568c',2.8);
   ctx.restore();
  }
  ctx.restore();
 }
 function mist(e,t){
  const p=project(e.x,e.y,3);
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);
  ctx.globalAlpha=(1-t)*.47;
  ring(ctx,55+t*28,'#d58ed4',4);
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3+t*3,x=Math.cos(a)*(21+t*35),y=Math.sin(a)*(14+t*12);
   circle(ctx,x,y,5+i%3*3,'#8c507b');
  }
  ctx.restore();
 }
 function frenzy(e,t){
  const hero=actors?.find(a=>a.id===e.khOwner&&a.hp>0);
  const px=hero?.x??e.x,py=hero?.y??e.y;
  const p=project(px,py,20);
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);
  ctx.globalAlpha=.58+Math.sin(t*70)*.16;
  ring(ctx,73+Math.sin(t*34)*9,'#fd4b62',5);
  ring(ctx,62,'#bd3559',2);
  for(let i=0;i<9;i++){
   const a=t*13+i*Math.PI*2/9,r=67+(i%3)*7;
   const x=Math.cos(a)*r,y=Math.sin(a)*r*.52;
   ctx.save();ctx.translate(x,y);ctx.rotate(a);
   line(ctx,[[-8,2],[0,-18-(i%4)*3],[6,2]],i%2?'#ff6d6d':'#f9a3aa',2.4);
   ctx.restore();
  }
  ctx.restore();
 }
 function punch(e,t){
  const p=project(e.x,e.y,21),a=e.angle||0,phi=Math.atan2(Math.sin(a)+Math.cos(a),Math.cos(a)-Math.sin(a));
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(phi);ctx.scale(scale,scale);
  ctx.globalAlpha=(1-t)*.86;
  const index=e.hitIndex||0,side=index%2?-17:17,dx=22+t*53;
  line(ctx,[[-14,side],[dx,side*.25]],'#ffe1b0',6);
  line(ctx,[[-12,side+7],[dx-8,side*.35+7]],'#b65d52',2.3);
  ctx.save();ctx.translate(dx,side*.25);ctx.scale(1+t*.3,1+t*.3);
  ctx.beginPath();ctx.ellipse(0,0,17,13,0,0,Math.PI*2);
  ctx.fillStyle='#dd6d4a';ctx.strokeStyle='#ffcf9a';ctx.lineWidth=2;
  ctx.fill();ctx.stroke();
  line(ctx,[[-9,-4],[9,-4]],'#ffb789',1.8);
  ctx.restore();ctx.restore();
 }
 function impact(e,t,red=false){
  const p=project(e.x,e.y,22);
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);
  ctx.globalAlpha=Math.max(0,1-t);
  const r=16+t*35;
  for(let i=0;i<7;i++){
   const a=i*Math.PI*2/7;
   line(ctx,[[Math.cos(a)*6,Math.sin(a)*6],[Math.cos(a)*r,Math.sin(a)*r*.65]],
    red?'#f6a4cb':'#ffdfae',2.6);
  }
  circle(ctx,0,0,8*(1-t)+2,red?'#eeb1dd':'#ffe1aa');
  ctx.restore();
 }
 function retreat(e,t){
  const start=project(e.x,e.y,8),end=project(e.tx??e.x,e.ty??e.y,8);
  ctx.save();ctx.globalAlpha=(1-t)*.7;
  line(ctx,[[start.x,start.y],[end.x,end.y]],'#e9bb82',5*scale);
  for(let i=0;i<3;i++){
   const f=(t+i/3)%1;
   const x=start.x+(end.x-start.x)*f,y=start.y+(end.y-start.y)*f;
   ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
   ring(ctx,19+f*12,'#e3b58c',2.3);ctx.restore();
  }
  ctx.restore();
 }
 function heal(e,t){
  const p=project(e.x,e.y,26);
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);
  ctx.globalAlpha=Math.max(.06,1-t);
  ring(ctx,38+t*17,'#99e1b1',3);
  for(let i=0;i<4;i++){
   const a=i*Math.PI/2+t*2,rr=25+t*16;
   const x=Math.cos(a)*rr,y=Math.sin(a)*rr;
   line(ctx,[[x-5,y],[x+5,y]],'#c4f6be',3);
   line(ctx,[[x,y-5],[x,y+5]],'#c4f6be',3);
  }
  ctx.restore();
 }
 drawAbility=function(e){
  if(typeof e?.style!=='string'||!e.style.startsWith('kh320-'))return oldDraw(e);
  const t=Math.max(0,Math.min(1,1-e.life/Math.max(.001,e.max||.5)));
  ctx.save();
  if(e.style==='kh320-fear-jump')ghost(e,t);
  else if(e.style==='kh320-fear-mist'||e.style==='kh320-fear-fade')mist(e,t);
  else if(e.style==='kh320-frenzy')frenzy(e,t);
  else if(e.style==='kh320-frenzy-end'||e.style==='kh320-fear-hit')impact(e,t,true);
  else if(e.style==='kh320-box-punch'||e.style==='kh320-box-ready')punch(e,t);
  else if(e.style==='kh320-box-hit')impact(e,t,false);
  else if(e.style==='kh320-box-retreat')retreat(e,t);
  else if(e.style==='kh320-box-heal')heal(e,t);
  ctx.restore();
 };
})();
