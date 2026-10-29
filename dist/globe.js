/* Self-contained, orthographic night globe. Map image drawn from Natural Earth lowres (public domain).
   No tile service, API key, location collection, or external assets are used. */
(()=>{'use strict';
const RAD=Math.PI/180;
const PLACES=[
 ['玉林',110.15,22.63,'华南'],['北海',109.12,21.48,'华南'],['南宁',108.32,22.82,'华南'],['防城港',108.35,21.69,'华南'],['贵港',109.60,23.11,'华南'],
 ['贵阳',106.63,26.65,'西南'],['昆明',102.72,25.04,'西南'],['丽江',100.23,26.87,'西南'],['大理',100.27,25.60,'西南'],
 ['武汉',114.30,30.59,'华中'],['长沙',112.94,28.23,'华中'],['张家界',110.48,29.13,'华中'],
 ['杭州',120.15,30.27,'华东'],['苏州',120.60,31.30,'华东'],['无锡',120.31,31.49,'华东'],['上海',121.47,31.23,'华东'],['济南',116.99,36.67,'华东'],
 ['郑州',113.62,34.75,'中原与西北'],['洛阳',112.45,34.62,'中原与西北'],['西安',108.94,34.34,'中原与西北'],['北京',116.40,39.90,'华北']
].map(([name,lon,lat,group])=>({name,lon,lat,group}));
const clamp=(a,low,hi)=>Math.max(low,Math.min(hi,a));
window.initFootprintGlobe=function(){
 const canvas=document.querySelector('#footprint-globe'),list=document.querySelector('#earth-city-list');if(!canvas||!list)return()=>{};
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return()=>{};
 let disposed=false,longitude=109,latitude=30,selected=null,hover=null,dragging=null,last=[];
 const zoom=1,center=340,radius=264;
 const tex=new Image();let texture=null,frame=0;
 const desc=document.querySelector('#earth-description'),title=document.querySelector('#earth-selected'),reset=document.querySelector('#earth-reset');
 let textureData=null,tw=0,th=0;
 function selectCity(place,align=true){selected=place;title.textContent=place.name;desc.textContent=`${place.name} · 到访过的城市。这里将来可以放照片、美食与路上的记忆。`;list.querySelectorAll('button[data-city]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.city===place.name)));
  if(align){latitude=clamp(place.lat,18,60);longitude=place.lon;} schedule(); }
 const groups=[...new Set(PLACES.map(p=>p.group))];
 list.innerHTML=groups.map(g=>`<div class="earth-group"><h3>${g}</h3><div class="earth-pills">${PLACES.filter(p=>p.group===g).map(p=>`<button type="button" data-city="${p.name}" aria-pressed="false">${p.name}</button>`).join('')}</div></div>`).join('');
 const byName=new Map(PLACES.map(p=>[p.name,p]));
 function onList(e){let b=e.target.closest('button[data-city]');if(b){selectCity(byName.get(b.dataset.city));}}
 list.addEventListener('click',onList);
 const onReset=()=>{longitude=109;latitude=30;selected=null;title.textContent='走过的地方';desc.textContent='点亮的城市，来自我真实走过的路。选中一个地点，看看它在夜色中亮起。';list.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed','false'));schedule();};
 reset.addEventListener('click',onReset);
 function project(lon,lat){const dl=(lon-longitude)*RAD,phi=lat*RAD,phi0=latitude*RAD;const z=Math.sin(phi0)*Math.sin(phi)+Math.cos(phi0)*Math.cos(phi)*Math.cos(dl);return{x:center+radius*Math.cos(phi)*Math.sin(dl),y:center-radius*(Math.cos(phi0)*Math.sin(phi)-Math.sin(phi0)*Math.cos(phi)*Math.cos(dl)),z};}
 const texCanvas=document.createElement('canvas');const tctx=texCanvas.getContext('2d',{willReadFrequently:true});
 const ocean={r:10,g:31,b:48};
 function render(){if(disposed)return;ctx.clearRect(0,0,680,680);
  const bg=ctx.createRadialGradient(center,center,110,center,center,335);bg.addColorStop(0,'rgba(33,112,129,.13)');bg.addColorStop(.76,'rgba(47,120,145,.17)');bg.addColorStop(1,'rgba(40,121,156,0)');ctx.fillStyle=bg;ctx.fillRect(0,0,680,680);
  ctx.save();ctx.shadowBlur=48;ctx.shadowColor='rgba(86,179,193,.4)';ctx.beginPath();ctx.arc(center,center,radius,0,Math.PI*2);ctx.fillStyle='#0b2436';ctx.fill();ctx.restore();
  const s=540,output=ctx.createImageData(s,s),data=output.data;const sin0=Math.sin(latitude*RAD),cos0=Math.cos(latitude*RAD);
  // Inverse spherical projection: all geographic points are mapped to real lat/lon texture coordinates.
  for(let j=0;j<s;j++){
   const y=1-(j+.5)*2/s;
   for(let i=0;i<s;i++){
    const x=(i+.5)*2/s-1,r2=x*x+y*y,off=(j*s+i)*4;
    if(r2>=1){data[off+3]=0;continue;}
    const rho=Math.sqrt(r2),c=Math.asin(rho),sinc=Math.sin(c),cosc=Math.cos(c),q=rho>0?sinc/rho:1;
    const lat=Math.asin(clamp(cosc*sin0+y*q*cos0,-1,1)),lon=longitude*RAD+Math.atan2(x*sinc,rho*cos0*cosc-y*sin0*sinc);
    const u=((lon/(Math.PI*2)+.5)%1+1)%1,v=clamp(.5-lat/Math.PI,0,.999999);
    let rr=ocean.r,gg=ocean.g,bb=ocean.b;
    if(textureData){const id=(Math.floor(v*th)*tw+Math.floor(u*tw))*4;rr=textureData[id];gg=textureData[id+1];bb=textureData[id+2];}
    const rim=Math.sqrt(1-r2),light=.32+.70*clamp(.26*x+.40*y+.90*rim,0,1);
    data[off]=Math.min(255,rr*light+4);data[off+1]=Math.min(255,gg*light+7);data[off+2]=Math.min(255,bb*light+11);data[off+3]=255;
   }
  }
  const im=document.createElement('canvas');im.width=im.height=s;im.getContext('2d').putImageData(output,0,0);
  ctx.drawImage(im,center-radius,center-radius,radius*2,radius*2);
  ctx.save();ctx.lineWidth=1.5;ctx.strokeStyle='rgba(154,212,215,.33)';ctx.beginPath();ctx.arc(center,center,radius-.5,0,Math.PI*2);ctx.stroke();ctx.restore();
  const glow=ctx.createRadialGradient(center-94,center-113,40,center,center,radius);glow.addColorStop(0,'rgba(150,199,193,.08)');glow.addColorStop(.76,'rgba(76,122,145,0)');glow.addColorStop(1,'rgba(74,113,161,.16)');ctx.beginPath();ctx.arc(center,center,radius,0,Math.PI*2);ctx.fillStyle=glow;ctx.fill();
  last=[];
  PLACES.forEach(p=>{const q=project(p.lon,p.lat);if(q.z<=.03)return;last.push({...q,place:p});const active=selected===p,hot=hover===p;
    ctx.save();ctx.globalAlpha=clamp(.5+.4*q.z,.25,1);ctx.shadowBlur=active?21:hot?17:11;ctx.shadowColor='#ffdc8c';ctx.fillStyle=active?'#fff1b4':'#f5d89b';ctx.beginPath();ctx.arc(q.x,q.y,active?5.3:hot?4.8:2.9,0,Math.PI*2);ctx.fill();ctx.restore();
    if(active){ctx.save();ctx.strokeStyle='rgba(250,219,153,.7)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(q.x,q.y,11,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#f5ddb4';ctx.font='17px serif';ctx.fillText(p.name,q.x+15,q.y-12);ctx.restore();}
  });
 }
 function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(render);}
 function coord(e){const b=canvas.getBoundingClientRect();return{x:(e.clientX-b.left)*680/b.width,y:(e.clientY-b.top)*680/b.height};}
 const nearest=(xy)=>last.map(q=>({...q,dist:Math.hypot(q.x-xy.x,q.y-xy.y)})).sort((a,b)=>a.dist-b.dist)[0];
 function onPointerDown(e){if(e.button!==0)return;dragging={...coord(e),lon:longitude,lat:latitude,moved:false};canvas.setPointerCapture?.(e.pointerId);}
 function onPointerMove(e){let p=coord(e);if(dragging){const dx=p.x-dragging.x,dy=p.y-dragging.y;if(Math.abs(dx)+Math.abs(dy)>5)dragging.moved=true;longitude=dragging.lon-dx*.23;latitude=clamp(dragging.lat+dy*.18,-65,78);schedule();return;}
  const n=nearest(p),now=n?.dist<16?n.place:null;if(now!==hover){hover=now;canvas.style.cursor=hover?'pointer':'grab';schedule();}}
 function onPointerUp(e){if(!dragging)return;const was=dragging.moved;dragging=null;if(!was){const n=nearest(coord(e));if(n?.dist<17)selectCity(n.place,false);}canvas.style.cursor=hover?'pointer':'grab';}
 function onKey(e){if(e.key==='ArrowLeft'||e.key==='ArrowRight'){longitude+=e.key==='ArrowLeft'?-8:8;schedule();e.preventDefault();}if(e.key==='ArrowUp'||e.key==='ArrowDown'){latitude=clamp(latitude+(e.key==='ArrowUp'?7:-7),-65,78);schedule();e.preventDefault();}}
 canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.title='拖动旋转地球，也可以使用箭头键；下方城市按钮可直接选择';
 canvas.addEventListener('pointerdown',onPointerDown);canvas.addEventListener('pointermove',onPointerMove);canvas.addEventListener('pointerup',onPointerUp);canvas.addEventListener('pointercancel',onPointerUp);canvas.addEventListener('keydown',onKey);
 tex.onload=()=>{if(disposed)return;texCanvas.width=tex.naturalWidth;texCanvas.height=tex.naturalHeight;tctx.drawImage(tex,0,0);tw=texCanvas.width;th=texCanvas.height;textureData=tctx.getImageData(0,0,tw,th).data;schedule();};
 tex.src='assets/earth-texture.webp';schedule();
 return()=>{disposed=true;cancelAnimationFrame(frame);tex.onload=null;list.removeEventListener('click',onList);reset.removeEventListener('click',onReset);canvas.removeEventListener('pointerdown',onPointerDown);canvas.removeEventListener('pointermove',onPointerMove);canvas.removeEventListener('pointerup',onPointerUp);canvas.removeEventListener('pointercancel',onPointerUp);canvas.removeEventListener('keydown',onKey);};
};
})();
