import * as THREE from './vendor/three/three.module.js';
import {OrbitControls} from './vendor/three/OrbitControls.js';

function makeGlowTexture(){
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d');
  const g=ctx.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(255,250,234,1)');
  g.addColorStop(.18,'rgba(255,235,190,.82)');
  g.addColorStop(.45,'rgba(173,205,216,.26)');
  g.addColorStop(1,'rgba(8,18,30,0)');
  ctx.fillStyle=g;
  ctx.fillRect(0,0,128,128);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  return texture;
}

function makeStarSpikeTexture(){
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d');
  const g=ctx.createRadialGradient(64,64,0,64,64,60);
  g.addColorStop(0,'rgba(255,252,242,1)');
  g.addColorStop(.15,'rgba(255,236,195,.88)');
  g.addColorStop(.42,'rgba(195,222,245,.28)');
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;
  ctx.fillRect(0,0,128,128);
  ctx.save();
  ctx.translate(64,64);
  for(let r=0;r<2;r++){
    const lg=ctx.createLinearGradient(-60,0,60,0);
    lg.addColorStop(0,'rgba(255,244,214,0)');
    lg.addColorStop(.42,'rgba(255,244,214,.38)');
    lg.addColorStop(.5,'rgba(255,255,255,.95)');
    lg.addColorStop(.58,'rgba(255,244,214,.38)');
    lg.addColorStop(1,'rgba(255,244,214,0)');
    ctx.fillStyle=lg;
    ctx.fillRect(-60,-1.2,120,2.4);
    ctx.rotate(Math.PI/2);
  }
  ctx.restore();
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  return texture;
}

export function mountGalaxy(root,archive){
  const canvas=root.querySelector('.cosmos-canvas');
  const area=root.querySelector('.cosmos-scene');
  const hoverCard=root.querySelector('#cosmos-hover-card');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  const dpr=Math.min(window.devicePixelRatio||1,2);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace=THREE.SRGBColorSpace;

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(44,1,.1,240);
  camera.position.set(0,8.8,18.6);

  const controls=new OrbitControls(camera,canvas);
  controls.enableDamping=true;
  controls.dampingFactor=.06;
  controls.enablePan=false;
  controls.minDistance=.52;
  controls.maxDistance=30;
  controls.maxPolarAngle=Math.PI*.78;
  controls.minPolarAngle=Math.PI*.12;
  controls.rotateSpeed=.65;
  controls.zoomSpeed=.85;

  const glowTexture=makeGlowTexture();
  const spikeTexture=makeStarSpikeTexture();
  const galaxy=new THREE.Group();
  galaxy.rotation.set(.18,0,-.09);
  scene.add(galaxy);

  const disposables=[];

  // 0. 360° Multi-Layered Authentic Starry Sky ("周围真正像浩瀚星空")
  let bgSeed=91023;
  const bgRand=()=>{bgSeed=(1664525*bgSeed+1013904223)>>>0;return bgSeed/4294967296;};
  const bgNormal=()=>bgRand()+bgRand()+bgRand()-1.5;

  // Layer 0A: 5,200 Crisp Field Stars & Open Star Clusters across the 360° Sky Dome
  const deepCount=5200,deepPos=new Float32Array(deepCount*3),deepCol=new Float32Array(deepCount*3),deepSize=new Float32Array(deepCount);
  const deepColor=new THREE.Color();
  const clusterCenters=[
    [-22,12,-28],[26,15,-25],[-30,-9,-18],[28,-11,-22],[0,21,-32],[-16,18,24]
  ];
  for(let i=0;i<deepCount;i++){
    let x,y,z;
    if(i<750){
      // Open star clusters in the surrounding night sky
      const c=clusterCenters[i%clusterCenters.length];
      const spread=2.2+bgRand()*4.5;
      x=c[0]+bgNormal()*spread;
      y=c[1]+bgNormal()*spread*.75;
      z=c[2]+bgNormal()*spread;
    }else{
      const u=bgRand()*2-1,theta=bgRand()*Math.PI*2,s=Math.sqrt(Math.max(0,1-u*u));
      const r=22+Math.pow(bgRand(),.58)*64;
      x=r*s*Math.cos(theta);
      y=r*u*.88;
      z=r*s*Math.sin(theta);
    }
    deepPos[i*3]=x;deepPos[i*3+1]=y;deepPos[i*3+2]=z;
    const pick=bgRand();
    if(pick<.28)deepColor.setHex(0xb8dcff);      // Ice sapphire
    else if(pick<.56)deepColor.setHex(0xfcf6ea); // Diamond ivory
    else if(pick<.78)deepColor.setHex(0xffd996); // Warm gold
    else if(pick<.91)deepColor.setHex(0x9be8df); // Celestial cyan
    else deepColor.setHex(0xffb8c6);             // Rose giant
    const b=.58+Math.pow(bgRand(),.85)*.42;
    deepCol[i*3]=deepColor.r*b;deepCol[i*3+1]=deepColor.g*b;deepCol[i*3+2]=deepColor.b*b;
    deepSize[i]=1.1+Math.pow(bgRand(),1.6)*3.6;
  }
  const deepGeo=new THREE.BufferGeometry();
  deepGeo.setAttribute('position',new THREE.BufferAttribute(deepPos,3));
  deepGeo.setAttribute('color',new THREE.BufferAttribute(deepCol,3));
  deepGeo.setAttribute('aSize',new THREE.BufferAttribute(deepSize,1));
  const deepMat=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
    uniforms:{scale:{value:dpr},time:{value:0},visibility:{value:1}},
    vertexShader:'attribute float aSize;varying vec3 vColor;varying float vTwinkle;uniform float scale;uniform float time;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.0);vTwinkle=.76+.24*sin(time*1.8+position.x*2.3+position.y*3.1);gl_PointSize=clamp(36.0*aSize*scale/(-p.z),1.5,6.8);gl_Position=projectionMatrix*p;}',
    fragmentShader:'varying vec3 vColor;varying float vTwinkle;uniform float visibility;void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.5)discard;float core=exp(-d*d*22.0);float halo=pow(max(0.0,1.0-d*2.0),1.8)*.65;float a=(core+halo)*vTwinkle*visibility;gl_FragColor=vec4(vColor*1.25,clamp(a,0.0,1.0));}'
  });
  const deepField=new THREE.Points(deepGeo,deepMat);
  scene.add(deepField);
  disposables.push(deepGeo,deepMat);

  // Layer 0B: 75 Named/Anchor Bright Stars with Cross-Diffraction Glints + Background Nebula Veils
  const brightSkyGroup=new THREE.Group();
  scene.add(brightSkyGroup);
  const anchorPalette=[0xd4ebff,0xfff6e0,0xffd28a,0xa8e6ff,0xffc2d1];
  for(let i=0;i<75;i++){
    const u=bgRand()*2-1,theta=bgRand()*Math.PI*2,s=Math.sqrt(Math.max(0,1-u*u));
    const r=24+bgRand()*38;
    const spMat=new THREE.SpriteMaterial({
      map:i%3===0?spikeTexture:glowTexture,
      color:anchorPalette[i%anchorPalette.length],
      transparent:true,
      opacity:.52+bgRand()*.42,
      depthWrite:false,
      blending:THREE.AdditiveBlending
    });
    const sp=new THREE.Sprite(spMat);
    sp.position.set(r*s*Math.cos(theta),r*u*.85,r*s*Math.sin(theta));
    const sc=(i%3===0?.75:.48)+bgRand()*.65;
    sp.scale.set(sc,sc,1);
    brightSkyGroup.add(sp);
    disposables.push(spMat);
  }
  // Ambient deep-space nebula veils in background sky
  const skyNebColors=[0x163854,0x2a1f4a,0x143d3e,0x3b2638];
  for(let i=0;i<18;i++){
    const u=(bgRand()-.5)*1.4,theta=bgRand()*Math.PI*2,r=28+bgRand()*22;
    const nebMat=new THREE.SpriteMaterial({
      map:glowTexture,
      color:skyNebColors[i%skyNebColors.length],
      transparent:true,
      opacity:.14+bgRand()*.08,
      depthWrite:false,
      blending:THREE.AdditiveBlending
    });
    const neb=new THREE.Sprite(nebMat);
    neb.position.set(Math.cos(theta)*r,u*16,Math.sin(theta)*r);
    const sc=14+bgRand()*16;
    neb.scale.set(sc*1.4,sc*.85,1);
    brightSkyGroup.add(neb);
    disposables.push(nebMat);
  }

  // Layer 0C: 3D Spherical & Vertical Galactic Halo Stars + Arching Tidal Streams
  const haloCount=2400,haloPos=new Float32Array(haloCount*3),haloCol=new Float32Array(haloCount*3),haloSize=new Float32Array(haloCount);
  for(let i=0;i<haloCount;i++){
    let x,y,z;
    if(i<600){
      // 3D Arching Tidal Stream ribbons rising above and below the disk ("打破扁平感的三维星流")
      const stream=i%2===0?1:-1;
      const t=(i/600)*Math.PI*1.65;
      const r=2.8+t*3.8;
      const angle=t*1.35+(stream>0?0:Math.PI);
      x=Math.cos(angle)*r+bgNormal()*.55;
      z=Math.sin(angle)*r+bgNormal()*.55;
      y=stream*Math.sin(t*1.1)*2.35+bgNormal()*.38;
    }else{
      const a=bgRand()*Math.PI*2;
      const r=1.4+Math.pow(bgRand(),.72)*16.5;
      const ySpread=(.85+r*.19)*bgNormal();
      x=Math.cos(a)*r+bgNormal()*.8;
      y=ySpread;
      z=Math.sin(a)*r+bgNormal()*.8;
    }
    haloPos[i*3]=x;haloPos[i*3+1]=y;haloPos[i*3+2]=z;
    const m=bgRand();
    deepColor.setHex(m<.38?0x9ecbff:m<.72?0xfff0d4:0xffbe78);
    const b=.38+bgRand()*.56;
    haloCol[i*3]=deepColor.r*b;haloCol[i*3+1]=deepColor.g*b;haloCol[i*3+2]=deepColor.b*b;
    haloSize[i]=.85+Math.pow(bgRand(),1.7)*2.4;
  }
  const haloGeo=new THREE.BufferGeometry();
  haloGeo.setAttribute('position',new THREE.BufferAttribute(haloPos,3));
  haloGeo.setAttribute('color',new THREE.BufferAttribute(haloCol,3));
  haloGeo.setAttribute('aSize',new THREE.BufferAttribute(haloSize,1));
  const haloMat=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
    uniforms:{scale:{value:dpr},time:{value:0},visibility:{value:1}},
    vertexShader:'attribute float aSize;varying vec3 vColor;uniform float scale;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(24.0*aSize*scale/(-p.z),1.1,5.2);gl_Position=projectionMatrix*p;}',
    fragmentShader:'varying vec3 vColor;uniform float visibility;void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.5)discard;float a=pow(1.0-d*2.0,1.7)*visibility*.88;gl_FragColor=vec4(vColor*1.15,a);}'
  });
  galaxy.add(new THREE.Points(haloGeo,haloMat));
  disposables.push(haloGeo,haloMat);

  // 1. NASA Spitzer Accurate Barred Spiral Galaxy (36,000 Stars: Central Bar + 2 Major Arms + Spurs + H-II Knots)
  const count = 38000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  const cCore = new THREE.Color('#fffcf2'); // Brilliant warm nuclear core
  const cBar = new THREE.Color('#ffd888');  // Warm golden-amber stellar bar
  const cArmCyan = new THREE.Color('#7de8ff'); // Radiant OB young stars
  const cArmBlue = new THREE.Color('#a8d4ff'); // Soft blue-white galactic disk
  const cKnotRose = new THREE.Color('#ff7ba9'); // H-II emission nebula (starbirth)
  const cKnotViolet = new THREE.Color('#be8aff');
  const cDust = new THREE.Color('#16121a'); // Obscuring interstellar dust

  let seed = 42071;
  const rand = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  const normal = () => rand() + rand() + rand() - 1.5;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const u = rand();
    let x, y, z, radius, angle;
    let starColor = cCore.clone();
    let brightness = 1.0;
    let starSize = 1.0;

    if (u < 0.20) {
      // Structure 1: Dense Galactic Bulge & Nuclear Star Cluster (中央高密度核球星团)
      radius = Math.pow(rand(), 1.8) * 1.8;
      angle = rand() * Math.PI * 2.0;
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius;
      y = normal() * 0.16 * Math.exp(-radius * 0.85);

      starColor = cCore.clone().lerp(cBar, Math.min(1.0, radius / 1.6));
      brightness = 1.25 + rand() * 0.65;
      starSize = 1.1 + rand() * 1.8;

    } else if (u < 0.38) {
      // Structure 2: NASA Spitzer 27,000-ly Elongated Central Stellar Bar (棒旋星系中央发光恒星棒)
      const barLength = 2.45;
      const barHalfWidth = 0.72;
      const tBar = (rand() - 0.5) * 2.0;
      const bx = tBar * barLength;
      const bz = normal() * barHalfWidth * Math.sqrt(Math.max(0.01, 1.0 - tBar * tBar * 0.75));
      const barAngle = 0.65;
      x = bx * Math.cos(barAngle) - bz * Math.sin(barAngle);
      z = bx * Math.sin(barAngle) + bz * Math.cos(barAngle);
      y = normal() * 0.14 * Math.exp(-Math.abs(tBar) * 0.8);
      radius = Math.hypot(x, z);
      angle = Math.atan2(z, x);

      starColor = cCore.clone().lerp(cBar, Math.min(1.0, radius / 2.2));
      brightness = 0.95 + rand() * 0.45;
      starSize = 0.95 + rand() * 1.3;

    } else if (u < 0.78) {
      // Structure 3: 2 Grand Major Arms (Perseus & Scutum-Centaurus) hooked directly to Bar ends
      const armIdx = i % 2;
      const startAngle = 0.65 + (armIdx === 0 ? 0.0 : Math.PI);
      const minR = 2.1;
      const maxR = 12.8;
      radius = minR + Math.pow(rand(), 0.82) * (maxR - minR);
      
      const windingPitch = 1.34;
      const spiralTheta = startAngle + windingPitch * Math.log(radius / minR);
      const armWidth = 0.14 + radius * 0.018;
      angle = spiralTheta + normal() * armWidth;
      const rr = Math.max(0.6, radius + normal() * (0.10 + radius * 0.014));
      x = Math.cos(angle) * rr;
      z = Math.sin(angle) * rr;

      const diskScaleHeight = 0.15 + 0.10 * Math.exp(-Math.pow(radius / 4.0, 2.0));
      const warp = 0.38 * Math.sin(angle + 0.42) * Math.pow(Math.min(1.0, radius / 11.5), 1.85);
      y = normal() * diskScaleHeight + warp;

      const tRadius = Math.min(1.0, (radius - minR) / 9.5);
      if (rand() < 0.09) {
        starColor = rand() < 0.65 ? cKnotRose.clone() : cKnotViolet.clone();
        brightness = 1.35 + rand() * 0.65;
        starSize = 2.2 + rand() * 2.2;
      } else {
        starColor = cCore.clone()
          .lerp(cBar, Math.min(1.0, (1.0 - tRadius) * 0.8))
          .lerp(cArmCyan, Math.min(1.0, tRadius * 1.8))
          .lerp(cArmBlue, Math.max(0.0, (tRadius - 0.25) / 0.75));
        brightness = 0.75 + Math.pow(rand(), 0.7) * 0.75;
        starSize = 0.85 + Math.pow(rand(), 1.5) * 2.0;
      }

    } else if (u < 0.94) {
      // Structure 4: Secondary Arms + Inter-arm Feathery Spurs
      const spurIdx = (i % 3);
      const spurOffset = (spurIdx * Math.PI * 0.66) + 0.35;
      radius = 1.6 + Math.pow(rand(), 0.75) * 10.5;
      const windingPitch = 1.48;
      const baseTheta = spurOffset + windingPitch * Math.log(radius / 1.5);
      const spread = 0.22 + radius * 0.024;
      angle = baseTheta + normal() * spread;
      const rr = Math.max(0.5, radius + normal() * 0.20);
      x = Math.cos(angle) * rr;
      z = Math.sin(angle) * rr;

      const diskScaleHeight = 0.16 + 0.08 * (radius / 10.0);
      const warp = 0.36 * Math.sin(angle + 0.42) * Math.pow(Math.min(1.0, radius / 11.5), 1.85);
      y = normal() * diskScaleHeight + warp;

      const tR = Math.min(1.0, (radius - 1.6) / 8.5);
      starColor = cBar.clone().lerp(cArmBlue, tR);
      brightness = 0.60 + rand() * 0.45;
      starSize = 0.75 + rand() * 1.2;

    } else {
      // Structure 5: Interstellar Dust Lanes
      const armIdx = i % 2;
      const startAngle = 0.65 + (armIdx === 0 ? 0.0 : Math.PI);
      radius = 2.2 + Math.pow(rand(), 0.78) * 8.8;
      const windingPitch = 1.34;
      const spiralTheta = startAngle + windingPitch * Math.log(radius / 2.1) - 0.08;
      angle = spiralTheta + normal() * 0.06;
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius;
      const warp = 0.38 * Math.sin(angle + 0.42) * Math.pow(Math.min(1.0, radius / 11.5), 1.85);
      y = normal() * 0.05 + warp;

      starColor = cDust.clone();
      brightness = 0.10;
      starSize = 1.6 + rand() * 1.8;
    }

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    colors[i3] = starColor.r * brightness;
    colors[i3 + 1] = starColor.g * brightness;
    colors[i3 + 2] = starColor.b * brightness;
    sizes[i] = starSize;
  }
  
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  geometry.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));
  const starsMaterial=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
    uniforms:{scale:{value:dpr},visibility:{value:1}},
    vertexShader:'attribute float aSize;varying vec3 vColor;uniform float scale;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(22.0*aSize*scale/(-p.z),1.2,6.4);gl_Position=projectionMatrix*p;}',
    fragmentShader:'varying vec3 vColor;uniform float visibility;void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.5)discard;float core=exp(-d*d*18.0);float halo=pow(max(0.0,1.0-d*2.0),1.6)*.6;float a=(core+halo)*0.88*visibility;gl_FragColor=vec4(vColor*1.18,clamp(a,0.0,1.0));}'
  });
  galaxy.add(new THREE.Points(geometry,starsMaterial));

  // 1B. 2,200 Volumetric Luminous Nebula Clouds Along the Spiral Arms (绚丽星云气团)
  const cloudCount=2200,cloudPositions=new Float32Array(cloudCount*3),cloudColors=new Float32Array(cloudCount*3),cloudSizes=new Float32Array(cloudCount);
  for(let i=0;i<cloudCount;i++){
    const i3=i*3;
    const isCoreCloud=i<320;
    const arm=i%2;
    const radius=isCoreCloud?(.45+Math.pow(rand(),1.3)*2.2):(1.2+Math.pow(rand(),.78)*10.6);
    const baseAngle=arm*Math.PI+1.38*Math.log(Math.max(.4,radius/1.12));
    const angle=isCoreCloud?(rand()*Math.PI*2):(baseAngle+normal()*(.14+radius*.014));
    const rr=radius+normal()*(isCoreCloud?.22:.32);
    const warp=isCoreCloud?0:(0.42*Math.sin(angle+0.45)*Math.pow(Math.min(1,radius/11.5),1.85));
    cloudPositions[i3]=Math.cos(angle)*rr;
    cloudPositions[i3+1]=normal()*(isCoreCloud?.38:.22)+warp;
    cloudPositions[i3+2]=Math.sin(angle)*rr;

    const t=Math.min(1,radius/10.5);
    let c;
    if(isCoreCloud){
      c=new THREE.Color('#ffcf86').lerp(new THREE.Color('#ff9b54'),rand()*.6);
    }else if(i%7===0){
      c=new THREE.Color('#e86fa8').lerp(new THREE.Color('#9a78ff'),rand());
    }else{
      c=new THREE.Color('#ffe2a8')
        .lerp(new THREE.Color('#5ea8ff'),Math.min(1,t*1.35))
        .lerp(new THREE.Color('#3b68c9'),Math.max(0,(t-.45)/.55));
    }
    const lum=isCoreCloud?.42:.28+rand()*.24;
    cloudColors[i3]=c.r*lum;cloudColors[i3+1]=c.g*lum;cloudColors[i3+2]=c.b*lum;
    cloudSizes[i]=isCoreCloud?(.75+rand()*.65):(.85+rand()*1.35);
  }
  const cloudGeometry=new THREE.BufferGeometry();
  cloudGeometry.setAttribute('position',new THREE.BufferAttribute(cloudPositions,3));
  cloudGeometry.setAttribute('color',new THREE.BufferAttribute(cloudColors,3));
  cloudGeometry.setAttribute('aSize',new THREE.BufferAttribute(cloudSizes,1));
  const cloudMaterial=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
    uniforms:{scale:{value:dpr},visibility:{value:1}},
    vertexShader:'attribute float aSize;varying vec3 vColor;uniform float scale;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(220.0*aSize*scale/(-p.z),8.0,58.0);gl_Position=projectionMatrix*p;}',
    fragmentShader:'varying vec3 vColor;uniform float visibility;void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.5)discard;float a=pow(max(0.0,1.0-d*2.0),2.1)*0.14*visibility;gl_FragColor=vec4(vColor,a);}'
  });
  galaxy.add(new THREE.Points(cloudGeometry,cloudMaterial));

  // 1C. 3D Gargantua Black Hole Core: Soft Bulge Glow + 3D Relativistic Accretion Disk + Event Horizon
  const coreMaterial=new THREE.SpriteMaterial({map:glowTexture,color:0xfff2d4,transparent:true,opacity:.58,depthWrite:false,blending:THREE.AdditiveBlending});
  const core=new THREE.Sprite(coreMaterial);
  core.scale.set(3.2,2.8,1);
  galaxy.add(core);

  // Additional soft amber nuclear glow
  const innerCoreMat=new THREE.SpriteMaterial({map:glowTexture,color:0xffd68a,transparent:true,opacity:.42,depthWrite:false,blending:THREE.AdditiveBlending});
  const innerCore=new THREE.Sprite(innerCoreMat);
  innerCore.scale.set(1.8,1.6,1);
  galaxy.add(innerCore);

  // 3D Relativistic Swirling Accretion Disk Mesh (visible at all camera distances!)
  const accretionGeo=new THREE.PlaneGeometry(1.4,1.4,1,1);
  const accretionMat=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    uniforms:{time:{value:0},visibility:{value:1}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv*2.0-1.0;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`
      varying vec2 vUv;uniform float time;uniform float visibility;
      void main(){
        float r=length(vUv);
        if(r>1.0||r<0.16)discard;
        float angle=atan(vUv.y,vUv.x);
        float spiral=sin(log(r)*14.0-angle*3.0+time*1.6)*.5+.5;
        float wisps=sin(r*24.0-angle*5.0+time*2.2)*.5+.5;
        float ring=smoothstep(0.16,0.23,r)*(1.0-smoothstep(0.45,1.0,r));
        float photon=exp(-pow((r-0.21)/0.028,2.0))*1.6;
        float doppler=0.68+0.48*cos(angle+0.6);
        vec3 hot=vec3(1.0,0.95,0.82);
        vec3 mid=vec3(1.0,0.62,0.22);
        vec3 outer=vec3(0.82,0.26,0.08);
        vec3 col=mix(outer,mix(mid,hot,clamp(1.2-r*1.4,0.0,1.0)),clamp(spiral*.65+wisps*.35,0.0,1.0));
        float alpha=(ring*(0.45+0.55*spiral*wisps)+photon)*doppler*visibility*0.85;
        gl_FragColor=vec4(col*doppler,clamp(alpha,0.0,1.0));
      }
    `
  });
  const accretionDisk=new THREE.Mesh(accretionGeo,accretionMat);
  accretionDisk.rotation.x=-Math.PI*0.42;
  accretionDisk.rotation.z=0.18;
  galaxy.add(accretionDisk);
  disposables.push(accretionGeo,accretionMat);

  // Compact Event Horizon Singularity (no longer a giant flat black sticker!)
  const holeGeometry=new THREE.SphereGeometry(0.08,24,16);
  const holeMaterial=new THREE.MeshBasicMaterial({color:0x000000});
  const blackHole=new THREE.Mesh(holeGeometry,holeMaterial);
  blackHole.visible = false;
  galaxy.add(blackHole);

  const waveGeometry=new THREE.RingGeometry(.16,.172,72);
  const waves=[0,.33,.66].map(offset=>{
    const m=new THREE.MeshBasicMaterial({color:0xf3ddb0,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
    const mesh=new THREE.Mesh(waveGeometry,m);
    mesh.rotation.x=-Math.PI/2;
    mesh.userData.phase=offset;
    galaxy.add(mesh);
    return mesh;
  });

  // 2. Aesthetic "Celestial Orrery (唯美发光星盘)" Building Blocks
  const planetSphereGeo=new THREE.SphereGeometry(1,28,24);
  disposables.push(planetSphereGeo);

  // Jewel-like Luminous Planet Shader (no dark shadow side — warm, sculptural, translucent celestial bodies)
  function createJewelPlanet(radius,dayHex,twilightHex,rimHex,bandAmp=0.14){
    const mat=new THREE.ShaderMaterial({
      transparent:true,
      depthWrite:true,
      uniforms:{
        opacity:{value:0},
        dayColor:{value:new THREE.Color(dayHex)},
        twilightColor:{value:new THREE.Color(twilightHex)},
        rimColor:{value:new THREE.Color(rimHex)},
        lightDir:{value:new THREE.Vector3(1,0.3,0).normalize()},
        bandAmp:{value:bandAmp}
      },
      vertexShader:`
        varying vec3 vNormalLocal;
        varying vec3 vNormalView;
        varying vec3 vPosLocal;
        void main(){
          vPosLocal=position;
          vNormalLocal=normalize(position);
          vNormalView=normalize(normalMatrix*normal);
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
        }
      `,
      fragmentShader:`
        uniform float opacity;
        uniform vec3 dayColor;
        uniform vec3 twilightColor;
        uniform vec3 rimColor;
        uniform vec3 lightDir;
        uniform float bandAmp;
        varying vec3 vNormalLocal;
        varying vec3 vNormalView;
        varying vec3 vPosLocal;
        void main(){
          if(opacity<.004)discard;
          float ndl=dot(normalize(vNormalLocal),normalize(lightDir));
          float lit=smoothstep(-.65,.75,ndl);
          float bands=sin(vPosLocal.y*14.0+sin(vPosLocal.x*6.0)*.5)*bandAmp;
          vec3 surface=mix(twilightColor,dayColor*(1.05+bands),lit*.72+.28);
          float rim=pow(clamp(1.0-abs(vNormalView.z),0.0,1.0),1.75);
          vec3 col=surface+rimColor*rim*.78;
          gl_FragColor=vec4(col,opacity);
          #include <colorspace_fragment>
        }
      `
    });
    const mesh=new THREE.Mesh(planetSphereGeo,mat);
    mesh.scale.setScalar(radius);
    const haloMat=new THREE.SpriteMaterial({map:glowTexture,color:rimHex,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
    const halo=new THREE.Sprite(haloMat);
    halo.scale.setScalar(2.85);
    mesh.add(halo);
    disposables.push(mat,haloMat);
    return {mesh,mat,haloMat};
  }

  function createOrbitLine(rx,rz,colorHex,tiltX=0,tiltZ=0,baseOp=0.68){
    const segs=128,pts=[];
    for(let k=0;k<=segs;k++){
      const a=k/segs*Math.PI*2;
      pts.push(new THREE.Vector3(Math.cos(a)*rx,0,Math.sin(a)*rz));
    }
    const geo=new THREE.BufferGeometry().setFromPoints(pts);
    const mat=new THREE.LineBasicMaterial({color:colorHex,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
    const line=new THREE.Line(geo,mat);
    line.rotation.set(tiltX,0,tiltZ);
    disposables.push(geo,mat);
    return {line,mat,baseOp};
  }

  function createPlanetaryRing(innerR,outerR,colorInnerHex,colorOuterHex,tiltX=0.42,tiltZ=-0.22){
    const geo=new THREE.RingGeometry(innerR,outerR,72,1);
    geo.rotateX(-Math.PI/2);
    const mat=new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
      uniforms:{
        opacity:{value:0},
        innerR:{value:innerR},
        outerR:{value:outerR},
        colA:{value:new THREE.Color(colorInnerHex)},
        colB:{value:new THREE.Color(colorOuterHex)}
      },
      vertexShader:'varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:`
        uniform float opacity;uniform float innerR;uniform float outerR;uniform vec3 colA;uniform vec3 colB;varying vec3 vPos;
        void main(){
          float r=length(vPos.xz);
          float u=clamp((r-innerR)/max(.0001,outerR-innerR),0.0,1.0);
          float edge=smoothstep(0.0,.08,u)*(1.0-smoothstep(.90,1.0,u));
          float cassini=1.0-.78*exp(-pow((u-.62)/.045,2.0));
          float fine=.82+.18*sin(u*42.0);
          vec3 col=mix(colA,colB,u)*fine;
          gl_FragColor=vec4(col,edge*cassini*opacity*.92);
          #include <colorspace_fragment>
        }
      `
    });
    const mesh=new THREE.Mesh(geo,mat);
    mesh.rotation.set(tiltX,0,tiltZ);
    disposables.push(geo,mat);
    return {mesh,mat};
  }

  // 3. Three Aesthetic "Celestial Orrery" Stellar Systems
  const markers=[],pickTargets=[],pickGeometry=new THREE.SphereGeometry(.82,12,8),pickMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false});
  const tilts=[[.28,.08,-.14],[-.20,.15,.18],[.22,-.16,.12]];
  const viewDirs=[new THREE.Vector3(.22,.62,.75).normalize(),new THREE.Vector3(-.18,.64,.74).normalize(),new THREE.Vector3(.16,.62,.76).normalize()];

  for(let i=0;i<archive.works.length;i++){
    const group=new THREE.Group(),sub=new THREE.Group();
    sub.rotation.set(tilts[i%3][0],tilts[i%3][1],tilts[i%3][2]);
    const markerColor=[0xdcecff,0xffe0a8,0xc6f0e0][i%3];
    const material=new THREE.SpriteMaterial({map:glowTexture,color:markerColor,transparent:true,opacity:.26,depthWrite:false,blending:THREE.AdditiveBlending});
    const sprite=new THREE.Sprite(material),hit=new THREE.Mesh(pickGeometry,pickMaterial);
    sprite.scale.setScalar(.22);

    const starPivot=new THREE.Group();
    sub.add(starPivot);
    const starMaterials=[];
    const coreGlowMat=new THREE.SpriteMaterial({map:glowTexture,color:[0xdbeeff,0xffdf9e,0xcaf2e2][i%3],transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
    const coreGlow=new THREE.Sprite(coreGlowMat);
    coreGlow.scale.setScalar(i===1?1.45:1.28);
    sub.add(coreGlow);
    disposables.push(coreGlowMat);

    if(i===0){
      // System 0: Luminous Twin Binary Stars (Sapphire Giant + Warm Gold Companion)
      const s1Mat=new THREE.MeshBasicMaterial({color:0xf2f8ff,transparent:true,opacity:0});
      const s1=new THREE.Mesh(planetSphereGeo,s1Mat);s1.scale.setScalar(.115);s1.position.set(-.092,0,0);
      const s1CoronaMat=new THREE.SpriteMaterial({map:spikeTexture,color:0x9ed0ff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
      const s1Corona=new THREE.Sprite(s1CoronaMat);s1Corona.scale.setScalar(.72);s1.add(s1Corona);

      const s2Mat=new THREE.MeshBasicMaterial({color:0xffebba,transparent:true,opacity:0});
      const s2=new THREE.Mesh(planetSphereGeo,s2Mat);s2.scale.setScalar(.076);s2.position.set(.115,0,0);
      const s2CoronaMat=new THREE.SpriteMaterial({map:glowTexture,color:0xffd28a,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
      const s2Corona=new THREE.Sprite(s2CoronaMat);s2Corona.scale.setScalar(.52);s2.add(s2Corona);

      starPivot.add(s1,s2);
      starMaterials.push(s1Mat,s1CoronaMat,s2Mat,s2CoronaMat);
      disposables.push(s1Mat,s1CoronaMat,s2Mat,s2CoronaMat);
    }else if(i===1){
      // System 1: Radiant Golden-Amber Sun with Starburst Corona
      const sunMat=new THREE.MeshBasicMaterial({color:0xfff7e2,transparent:true,opacity:0});
      const sun=new THREE.Mesh(planetSphereGeo,sunMat);sun.scale.setScalar(.142);
      const sunCoronaMat=new THREE.SpriteMaterial({map:spikeTexture,color:0xffce7c,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
      const sunCorona=new THREE.Sprite(sunCoronaMat);sunCorona.scale.setScalar(.92);sun.add(sunCorona);
      starPivot.add(sun);
      starMaterials.push(sunMat,sunCoronaMat);
      disposables.push(sunMat,sunCoronaMat);
    }else{
      // System 2: Luminous Jade-Pearl Sun with Soft Starburst
      const pStarMat=new THREE.MeshBasicMaterial({color:0xf4fff9,transparent:true,opacity:0});
      const pStar=new THREE.Mesh(planetSphereGeo,pStarMat);pStar.scale.setScalar(.128);
      const pCoronaMat=new THREE.SpriteMaterial({map:spikeTexture,color:0x9ef0d6,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
      const pCorona=new THREE.Sprite(pCoronaMat);pCorona.scale.setScalar(.82);pStar.add(pCorona);
      starPivot.add(pStar);
      starMaterials.push(pStarMat,pCoronaMat);
      disposables.push(pStarMat,pCoronaMat);
    }

    const orbitLines=[];
    if(i===0){
      orbitLines.push(
        createOrbitLine(.28,.27,0x9bc8ff,0,0,.55),
        createOrbitLine(.48,.46,0xc4e2ff,0,0,.76),
        createOrbitLine(.80,.76,0xe2f2ff,.06,-.05,.80),
        createOrbitLine(1.10,1.06,0x8ab8f0,-.04,.04,.48)
      );
    }else if(i===1){
      orbitLines.push(
        createOrbitLine(.29,.28,0xffd8a8,.10,-.06,.56),
        createOrbitLine(.50,.48,0xffecc2,-.05,.04,.78),
        createOrbitLine(.84,.79,0xffca82,.18,.14,.80),
        createOrbitLine(1.12,1.06,0xe2aa74,-.20,.10,.50)
      );
    }else{
      orbitLines.push(
        createOrbitLine(.28,.27,0x9ae2cb,0,0,.54),
        createOrbitLine(.49,.47,0xb8f4df,.03,-.03,.76),
        createOrbitLine(.86,.66,0xdffbf0,-.15,.18,.76),
        createOrbitLine(1.12,1.06,0x8cd0c4,.05,.04,.48)
      );
    }
    orbitLines.forEach(o=>sub.add(o.line));

    const starCount=420,points=new Float32Array(starCount*3),tints=new Float32Array(starCount*3),sizes=new Float32Array(starCount);
    const nebCount=70,nebPoints=new Float32Array(nebCount*3),nebTints=new Float32Array(nebCount*3);
    let seed=8383+i*7103;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;},normal=()=>rand()+rand()+rand()+rand()-2;
    const palette=[
      [0xe6f4ff,0x9bc8ff,0xffe6b8,0xffffff,0x7aa8e8],
      [0xffdc9c,0xffb468,0xfff4dc,0xe89b6c,0xc9dcff],
      [0xc6f4de,0x98dceb,0xffeac2,0xe4f7ee,0x84c4b8]
    ][i%3],tint=new THREE.Color();

    for(let j=0;j<starCount;j++){
      let x=0,y=0,z=0,sz=.65+Math.pow(rand(),1.8)*1.25;
      if(i===0){
        const a=rand()*Math.PI*2,rr=1.02+rand()*.16+normal()*.025;
        x=Math.cos(a)*rr;z=Math.sin(a)*rr*.96;y=normal()*.02;
      }else if(i===1){
        const a=rand()*Math.PI*2,rr=.64+rand()*.06+normal()*.015;
        x=Math.cos(a)*rr;z=Math.sin(a)*rr*.96;y=normal()*.015+x*.04;
      }else{
        const a=rand()*Math.PI*2,rr=(rand()<.45?.35:1.00)+normal()*.03;
        x=Math.cos(a)*rr;z=Math.sin(a)*rr*.95;y=normal()*.018;
      }
      points[j*3]=x;points[j*3+1]=y;points[j*3+2]=z;
      sizes[j]=sz;
      tint.setHex(palette[j%palette.length]);
      const intensity=.45+.48*rand();
      tints[j*3]=tint.r*intensity;tints[j*3+1]=tint.g*intensity;tints[j*3+2]=tint.b*intensity;
    }

    for(let k=0;k<nebCount;k++){
      const src=((k*5+1)%starCount)*3;
      nebPoints[k*3]=points[src]+(rand()-.5)*.06;
      nebPoints[k*3+1]=points[src+1]+(rand()-.5)*.025;
      nebPoints[k*3+2]=points[src+2]+(rand()-.5)*.06;
      tint.setHex(palette[k%palette.length]);
      const nebMult=i===2?.24:.16;
      nebTints[k*3]=tint.r*nebMult;nebTints[k*3+1]=tint.g*nebMult;nebTints[k*3+2]=tint.b*nebMult;
    }

    const miniGeometry=new THREE.BufferGeometry();
    miniGeometry.setAttribute('position',new THREE.BufferAttribute(points,3));
    miniGeometry.setAttribute('color',new THREE.BufferAttribute(tints,3));
    miniGeometry.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));
    const miniMaterial=new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
      uniforms:{scale:{value:dpr},opacity:{value:0},time:{value:0}},
      vertexShader:'attribute float aSize;varying vec3 vColor;varying float vTwinkle;uniform float scale;uniform float time;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.0);float tw=.88+.12*sin(time*2.2+position.x*13.0+position.z*9.0);vTwinkle=tw;gl_PointSize=clamp(12.0*aSize*scale/(-p.z),1.0,4.8);gl_Position=projectionMatrix*p;}',
      fragmentShader:'varying vec3 vColor;varying float vTwinkle;uniform float opacity;void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.5)discard;float core=exp(-d*d*18.0);float halo=pow(max(0.0,1.0-d*2.0),2.2);float a=(core*.70+halo*.35)*opacity*vTwinkle;gl_FragColor=vec4(vColor*(.85+core*.45),a);\n#include <colorspace_fragment>\n}'
    });
    const nebGeometry=new THREE.BufferGeometry();
    nebGeometry.setAttribute('position',new THREE.BufferAttribute(nebPoints,3));
    nebGeometry.setAttribute('color',new THREE.BufferAttribute(nebTints,3));
    const nebMaterial=new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
      uniforms:{scale:{value:dpr},opacity:{value:0}},
      vertexShader:'varying vec3 vColor;uniform float scale;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(76.0*scale/(-p.z),4.0,28.0);gl_Position=projectionMatrix*p;}',
      fragmentShader:'varying vec3 vColor;uniform float opacity;void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.5)discard;float a=pow(max(0.0,1.0-d*2.0),2.4)*.12*opacity;gl_FragColor=vec4(vColor,a);\n#include <colorspace_fragment>\n}'
    });
    const nebPointsMesh=new THREE.Points(nebGeometry,nebMaterial);
    const mini=new THREE.Points(miniGeometry,miniMaterial);
    sub.add(nebPointsMesh,mini);

    // Build 4 Jewel-Like Planets per system (larger, luminous, aesthetic proportions)
    const planets=[];
    for(let pIdx=0;pIdx<4;pIdx++){
      const pHolder=new THREE.Group();
      let orbitRx,orbitRz,orbitSpeed,baseAngle,tiltX=0,tiltZ=0,planetObj,ringObj=null,moonObj=null,moonOrbitObj=null,tailMat=null;

      if(i===0){
        if(pIdx===0){
          orbitRx=.48;orbitRz=.46;orbitSpeed=.34;baseAngle=.65;
          planetObj=createJewelPlanet(.078,0xa8dcff,0x3a6fa8,0xe6f6ff,.18);
          moonOrbitObj=createOrbitLine(.135,.135,0xc4e2ff,.12,0,.55);
          pHolder.add(moonOrbitObj.line);
          moonObj=createJewelPlanet(.026,0xf2f8ff,0x6e9cd0,0xffffff,.05);
          pHolder.add(moonObj.mesh);
        }else if(pIdx===1){
          orbitRx=.80;orbitRz=.76;orbitSpeed=.20;baseAngle=-1.15;tiltX=.06;tiltZ=-.05;
          planetObj=createJewelPlanet(.098,0xdff0ff,0x4c7eb8,0xffecc4,.22);
          ringObj=createPlanetaryRing(.132,.275,0xfff0cc,0x92c8ff,.40,-.22);
          pHolder.add(ringObj.mesh);
        }else if(pIdx===2){
          orbitRx=.28;orbitRz=.27;orbitSpeed=.56;baseAngle=2.2;
          planetObj=createJewelPlanet(.044,0xcce4fc,0x4974a5,0xeaf5ff,.10);
        }else{
          orbitRx=1.10;orbitRz=1.06;orbitSpeed=.13;baseAngle=.25;tiltX=-.04;tiltZ=.04;
          planetObj=createJewelPlanet(.060,0x82b8f5,0x2f5a94,0xc8e4ff,.16);
        }
      }else if(i===1){
        if(pIdx===0){
          orbitRx=.50;orbitRz=.48;orbitSpeed=.32;baseAngle=.45;tiltX=-.05;tiltZ=.04;
          planetObj=createJewelPlanet(.082,0xffda96,0x8c4d22,0xfff0c4,.20);
        }else if(pIdx===1){
          orbitRx=.84;orbitRz=.79;orbitSpeed=.18;baseAngle=-1.45;tiltX=.18;tiltZ=.14;
          planetObj=createJewelPlanet(.102,0xffc478,0x94481b,0xffe8ae,.24);
          ringObj=createPlanetaryRing(.138,.282,0xffecba,0xe29454,-.36,.28);
          pHolder.add(ringObj.mesh);
          moonOrbitObj=createOrbitLine(.155,.155,0xffe2a8,0,0,.52);
          pHolder.add(moonOrbitObj.line);
          moonObj=createJewelPlanet(.027,0xfff0cf,0x99582a,0xffe09e,.08);
          pHolder.add(moonObj.mesh);
        }else if(pIdx===2){
          orbitRx=.29;orbitRz=.28;orbitSpeed=.58;baseAngle=-.8;tiltX=.10;tiltZ=-.06;
          planetObj=createJewelPlanet(.046,0xffe6b5,0x965425,0xfff5d6,.12);
        }else{
          orbitRx=1.12;orbitRz=1.06;orbitSpeed=.12;baseAngle=1.85;tiltX=-.20;tiltZ=.10;
          planetObj=createJewelPlanet(.062,0xe6a872,0x783918,0xffdab2,.16);
        }
      }else{
        if(pIdx===0){
          orbitRx=.49;orbitRz=.47;orbitSpeed=.30;baseAngle=-.55;tiltX=.03;tiltZ=-.03;
          planetObj=createJewelPlanet(.084,0x9ef0d4,0x287868,0xdffef2,.20);
          ringObj=createPlanetaryRing(.118,.205,0xd4fae8,0x88d4c6,.30,.18);
          pHolder.add(ringObj.mesh);
          moonOrbitObj=createOrbitLine(.145,.145,0xb8f4df,0,0,.54);
          pHolder.add(moonOrbitObj.line);
          moonObj=createJewelPlanet(.025,0xe2fcf2,0x3c8a78,0xffffff,.05);
          pHolder.add(moonObj.mesh);
        }else if(pIdx===1){
          orbitRx=.86;orbitRz=.66;orbitSpeed=.21;baseAngle=1.15;tiltX=-.15;tiltZ=.18;
          planetObj=createJewelPlanet(.070,0xe2fff5,0x38847e,0xfff0cc,.14);
          const tCount=580,tPos=new Float32Array(tCount*3),tCol=new Float32Array(tCount*3);
          for(let tc=0;tc<tCount;tc++){
            const u=Math.pow(rand(),.72);
            const len=u*.56;
            const curve=-u*u*.28;
            const spread=(rand()-.5)*(.016+u*.088);
            tPos[tc*3]=len+spread*.4;
            tPos[tc*3+1]=(rand()-.5)*(.012+u*.042);
            tPos[tc*3+2]=curve+spread;
            const fade=Math.pow(1-u,1.45);
            const isIon=tc%3===0;
            tCol[tc*3]=(isIon?.58:.98)*fade;
            tCol[tc*3+1]=(isIon?.95:.95)*fade;
            tCol[tc*3+2]=(isIon?.98:.78)*fade;
          }
          const tGeo=new THREE.BufferGeometry();
          tGeo.setAttribute('position',new THREE.BufferAttribute(tPos,3));
          tGeo.setAttribute('color',new THREE.BufferAttribute(tCol,3));
          tailMat=new THREE.ShaderMaterial({
            transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
            uniforms:{scale:{value:dpr},opacity:{value:0}},
            vertexShader:'varying vec3 vColor;uniform float scale;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(18.0*scale/(-p.z),1.4,5.6);gl_Position=projectionMatrix*p;}',
            fragmentShader:'varying vec3 vColor;uniform float opacity;void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.5)discard;float a=pow(1.0-d*2.0,1.8)*opacity*.92;gl_FragColor=vec4(vColor,a);\n#include <colorspace_fragment>\n}'
          });
          const tailMesh=new THREE.Points(tGeo,tailMat);
          pHolder.add(tailMesh);
          disposables.push(tGeo,tailMat);
        }else if(pIdx===2){
          orbitRx=.28;orbitRz=.27;orbitSpeed=.54;baseAngle=1.4;
          planetObj=createJewelPlanet(.045,0xc4f6e4,0x347c6c,0xe8fff7,.10);
        }else{
          orbitRx=1.12;orbitRz=1.06;orbitSpeed=.13;baseAngle=-2.2;tiltX=.05;tiltZ=.04;
          planetObj=createJewelPlanet(.060,0x92d8ce,0x2e6e6c,0xffedc2,.16);
        }
      }

      pHolder.add(planetObj.mesh);
      const orbitPlane=new THREE.Group();
      orbitPlane.rotation.set(tiltX,0,tiltZ);
      orbitPlane.add(pHolder);
      sub.add(orbitPlane);

      planets.push({holder:pHolder,planetObj,ringObj,moonObj,moonOrbitObj,tailMat,orbitRx,orbitRz,orbitSpeed,baseAngle});
    }

    hit.userData.index=i;
    group.add(sprite,sub,hit);
    group.userData={sprite,mini,neb:nebPointsMesh,coreGlow,starPivot,starMaterials,orbitLines,planets,viewDir:viewDirs[i%3]};
    const r=4.6+i*1.35,a=(i%2)*Math.PI+.41+1.35*Math.log(r/1.5);
    group.position.set(Math.cos(a)*r,.18+i*.2,Math.sin(a)*r);
    galaxy.add(group);markers.push(group);pickTargets.push(hit);
    disposables.push(nebGeometry,nebMaterial);
  }

  const cursor=new THREE.Vector2(),raycaster=new THREE.Raycaster();
  let pointerIn=false,hoverArmed=false,frame=0,disposed=false,down=null,zoomTarget=null,focusIndex=-1,orienting=false,lastTime=null,locked=-1,lockedWorld=new THREE.Vector3(),cardHovering=false,enterTimer=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');

  if(hoverCard){
    hoverCard.addEventListener('pointerenter',()=>{cardHovering=true;});
    hoverCard.addEventListener('pointerleave',()=>{cardHovering=false;});
  }

  const notifyHover=idx=>{
    root.dispatchEvent(new CustomEvent('cosmos-hover',{detail:{index:idx}}));
  };

  const onPointer=e=>{
    const r=canvas.getBoundingClientRect();
    cursor.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
    if(e.pointerType==='mouse'||e.pointerType==='pen'){pointerIn=true;hoverArmed=true;}
  };
  const leave=()=>{
    pointerIn=false;hoverArmed=false;
    if(!cardHovering&&focusIndex<0){locked=-1;notifyHover(-1);}
    canvas.style.cursor='grab';
  };
  canvas.addEventListener('pointermove',onPointer);
  canvas.addEventListener('pointerleave',leave);

  const onDown=e=>{onPointer(e);down={x:e.clientX,y:e.clientY};canvas.focus({preventScroll:true});};
  const onUp=e=>{
    onPointer(e);
    if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<7)pick();
    down=null;
  };
  canvas.addEventListener('pointerdown',onDown);
  canvas.addEventListener('pointerup',onUp);
  canvas.addEventListener('pointercancel',leave);

  const wheelGuard=e=>{if(document.activeElement!==canvas)e.stopImmediatePropagation();else{zoomTarget=null;orienting=false;}};
  canvas.addEventListener('wheel',wheelGuard,{capture:true});
  let userInteracting=false;
  const controlStart=()=>{if(userInteracting){zoomTarget=null;orienting=false;}};
  controls.addEventListener('start',controlStart);
  const onControlDown=()=>{userInteracting=true;};
  const onControlUp=()=>{userInteracting=false;};
  canvas.addEventListener('pointerdown',onControlDown,{capture:true});
  window.addEventListener('pointerup',onControlUp,{capture:true});

  function hitMarker(){
    scene.updateMatrixWorld(true);camera.updateMatrixWorld();
    raycaster.setFromCamera(cursor,camera);
    return raycaster.intersectObjects(pickTargets.filter(s=>s.parent.visible))[0];
  }

  function focus(index,openGallery=false){
    if(index<0||index>=markers.length)return;
    focusIndex=index;
    locked=index;
    markers[index].getWorldPosition(lockedWorld);
    hoverArmed=false;
    zoomTarget=openGallery?1.35:1.85;
    orienting=true;
    notifyHover(index);
    root.dispatchEvent(new CustomEvent('cosmos-pick',{detail:{index,openGallery}}));
    if(openGallery){
      clearTimeout(enterTimer);
      enterTimer=window.setTimeout(()=>{
        if(!disposed&&archive.works[index]){
          location.hash='#/works/'+archive.works[index].slug;
        }
      },520);
    }
  }

  const onSelect=e=>focus(e.detail.index,!!e.detail.openGallery);
  root.addEventListener('cosmos-focus',onSelect);

  function pick(){
    const hit=hitMarker();
    if(hit){
      const idx=hit.object.userData.index;
      // On direct click of a stellar system: zoom in & enter its full photo exhibition
      focus(idx,true);
      return true;
    }
    return false;
  }

  const zoom=e=>{
    const button=e.target.closest('[data-zoom]');
    if(!button)return;
    const action=button.dataset.zoom;
    if(action==='reset'){
      clearTimeout(enterTimer);
      orienting=false;focusIndex=-1;locked=-1;zoomTarget=null;
      camera.position.set(0,8.8,18.6);controls.target.set(0,0,0);controls.update();
      notifyHover(-1);
    }else{
      orienting=false;
      const distance=zoomTarget??camera.position.distanceTo(controls.target);
      zoomTarget=THREE.MathUtils.clamp(distance*(action==='in'?.72:1.38),controls.minDistance,controls.maxDistance);
    }
  };
  root.addEventListener('click',zoom);

  // Screen-space gravitational lens for the central black hole
  const target=new THREE.WebGLRenderTarget(1,1),lensScene=new THREE.Scene(),lensCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const lensMaterial=new THREE.ShaderMaterial({transparent:true,uniforms:{image:{value:target.texture},center:{value:new THREE.Vector2(.5,.5)},aspect:{value:1},time:{value:0},radius:{value:.14},strength:{value:0},eye:{value:new THREE.Vector3(0,4.2,11.5)},right:{value:new THREE.Vector3(1,0,0)},up:{value:new THREE.Vector3(0,1,0)}},vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position,1.0);}',fragmentShader:`uniform sampler2D image;uniform vec2 center;uniform float aspect;uniform float time;uniform float radius;uniform float strength;uniform vec3 eye;uniform vec3 right;uniform vec3 up;varying vec2 uv0;
  void main(){
    vec2 d = uv0 - center;
    d.x *= aspect;
    float screenR = length(d);
    vec4 base = texture2D(image, uv0);
    if(strength < 0.001 || screenR > radius * 3.4){
      gl_FragColor = base;
      return;
    }
    // Pure Einstein deflection: optical starlight curvature without 2D black cutoffs
    float falloff = 1.0 - smoothstep(radius * 0.15, radius * 3.2, screenR);
    float deflect = strength * falloff * (0.0135 / (screenR + 0.032));
    vec2 nDir = normalize(d);
    vec2 shift = vec2(nDir.x / aspect, nDir.y) * deflect;
    vec2 tang = vec2(-nDir.y / aspect, nDir.x) * (deflect * 0.28);
    vec2 shiftedUV = uv0 - shift + tang;
    vec4 bent = texture2D(image, shiftedUV);

    // Subtle Einstein photon ring glow around the photon sphere
    float ringDist = abs(screenR - radius * 0.76);
    float photonRing = exp(-pow(ringDist / (radius * 0.18 + 0.003), 2.0)) * strength;
    vec3 photonGlow = vec3(1.0, 0.90, 0.72) * (photonRing * 0.82);

    vec3 blended = mix(base.rgb, bent.rgb + photonGlow, falloff);
    gl_FragColor = vec4(blended, max(base.a, bent.a));
  }`});
  lensScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),lensMaterial));

  const resize=()=>{
    const width=area.clientWidth,height=area.clientHeight;
    camera.aspect=width/height;
    camera.updateProjectionMatrix();
    renderer.setSize(width,height,false);
    target.setSize(Math.max(1,Math.floor(width*renderer.getPixelRatio())),Math.max(1,Math.floor(height*renderer.getPixelRatio())));
    lensMaterial.uniforms.aspect.value=width/height;
  };
  const observer=new ResizeObserver(resize);observer.observe(area);resize();

  let effectTime=0;
  const projVec=new THREE.Vector3();

  const tick=time=>{
    if(disposed)return;
    frame=requestAnimationFrame(tick);
    const dt=lastTime===null?0:Math.min((time-lastTime)/1000,.05);
    lastTime=time;
    if(!document.hidden){
      const audioBoost=window.__qzAudioEnergy||0;
      if(!reduced.matches){
        galaxy.rotation.y+=(focusIndex>=0?.012:(locked>=0?.018:.044))*dt;
        deepField.rotation.y+=.005*dt;
        effectTime+=dt;
      }
      lensMaterial.uniforms.time.value=effectTime;
      accretionMat.uniforms.time.value=effectTime;
      haloMat.uniforms.time.value=effectTime;
      deepMat.uniforms.time.value=effectTime;
      waves.forEach(w=>{const phase=(effectTime*.12+w.userData.phase)%1;w.scale.setScalar(.25+phase*3);w.material.opacity=reduced.matches?0:Math.sin(phase*Math.PI)*.12;});

      if(focusIndex>=0){
        galaxy.updateMatrixWorld(true);
        const wanted=markers[focusIndex].getWorldPosition(new THREE.Vector3());
        const targetFactor=orienting?(1-Math.exp(-6.5*dt)):1;
        const shift=wanted.clone().sub(controls.target).multiplyScalar(targetFactor);
        controls.target.add(shift);camera.position.add(shift);
        if(orienting){
          const offset=camera.position.clone().sub(controls.target),curDist=offset.length(),goalDist=zoomTarget??1.85,nextDist=THREE.MathUtils.lerp(curDist,goalDist,1-Math.exp(-6.2*dt));
          const viewDir=markers[focusIndex].userData.viewDir||new THREE.Vector3(.22,.64,.74).normalize();
          const desired=viewDir.clone().multiplyScalar(nextDist);
          offset.lerp(desired,1-Math.exp(-6.2*dt));
          camera.position.copy(controls.target).add(offset);
          if(offset.distanceTo(desired)<.02&&wanted.distanceTo(controls.target)<.02){orienting=false;zoomTarget=null;}
        }
      }
      if(zoomTarget!==null&&!orienting){
        const offset=camera.position.clone().sub(controls.target),distance=offset.length(),next=THREE.MathUtils.lerp(distance,zoomTarget,1-Math.exp(-6*dt));
        camera.position.copy(controls.target).add(offset.setLength(next));
        if(Math.abs(next-zoomTarget)<.01)zoomTarget=null;
      }
      controls.update();
      scene.updateMatrixWorld(true);camera.updateMatrixWorld();

      if(locked>=0&&focusIndex<0){
        galaxy.worldToLocal(markers[locked].position.copy(lockedWorld));
        scene.updateMatrixWorld(true);
      }

      if(pointerIn&&hoverArmed&&!down){
        const hit=hitMarker(),index=hit?hit.object.userData.index:-1;
        canvas.style.cursor=hit?'pointer':'grab';
        if(index>=0&&index!==locked){
          locked=index;
          markers[index].getWorldPosition(lockedWorld);
          notifyHover(index);
        }else if(index<0&&locked>=0&&!cardHovering&&focusIndex<0){
          locked=-1;
          notifyHover(-1);
        }
      }

      // Project active/hovered stellar system to 2D screen coordinates for the floating card
      const activeIdx=focusIndex>=0?focusIndex:locked;
      if(hoverCard&&activeIdx>=0&&markers[activeIdx]){
        markers[activeIdx].getWorldPosition(projVec);
        projVec.project(camera);
        const w=area.clientWidth,h=area.clientHeight;
        const sx=THREE.MathUtils.clamp((projVec.x*.5+.5)*w,148,Math.max(148,w-148));
        const sy=THREE.MathUtils.clamp((-projVec.y*.5+.5)*h,135,Math.max(140,h-36));
        hoverCard.style.setProperty('--card-x',`${sx.toFixed(1)}px`);
        hoverCard.style.setProperty('--card-y',`${sy.toFixed(1)}px`);
      }

      const visibility=focusIndex>=0?.06:(locked>=0?.52:1);
      starsMaterial.uniforms.visibility.value=THREE.MathUtils.lerp(starsMaterial.uniforms.visibility.value,visibility,1-Math.exp(-4.5*dt));
      cloudMaterial.uniforms.visibility.value=starsMaterial.uniforms.visibility.value;
      accretionMat.uniforms.visibility.value=starsMaterial.uniforms.visibility.value;
      haloMat.uniforms.visibility.value=THREE.MathUtils.lerp(haloMat.uniforms.visibility.value,focusIndex>=0?.28:1,1-Math.exp(-4.5*dt));
      deepMat.uniforms.visibility.value=THREE.MathUtils.lerp(deepMat.uniforms.visibility.value,focusIndex>=0?.75:1,1-Math.exp(-4.5*dt));
      coreMaterial.opacity=(.35+audioBoost*.12)*starsMaterial.uniforms.visibility.value;
      core.scale.setScalar(3.2+audioBoost*.35);
      

      markers.forEach((m,i)=>{
        const isFocus=i===focusIndex,isLock=i===locked;
        const spriteGoal=isFocus?.08:(isLock?.42:.26);
        m.userData.sprite.material.opacity=THREE.MathUtils.lerp(m.userData.sprite.material.opacity,spriteGoal,1-Math.exp(-6*dt));

        // Show the luminous Celestial Orrery both when focused AND when hovered!
        const goal=isFocus?1.0:(isLock?.88:.14);
        const curOp=THREE.MathUtils.lerp(m.userData.mini.material.uniforms.opacity.value,goal,1-Math.exp(-6.0*dt));
        m.userData.mini.material.uniforms.opacity.value=curOp;
        m.userData.mini.material.uniforms.time.value=effectTime;
        m.userData.neb.material.uniforms.opacity.value=curOp;
        m.userData.coreGlow.material.opacity=curOp*(.44+audioBoost*.14);

        if(!reduced.matches){
          m.userData.starPivot.rotation.y=effectTime*(i===0?.75:.25);
        }
        m.userData.starMaterials.forEach(sMat=>{sMat.opacity=curOp;});
        m.userData.orbitLines.forEach(o=>{o.mat.opacity=curOp*o.baseOp;});

        m.userData.planets.forEach((p)=>{
          const angle=p.baseAngle+(reduced.matches?0:effectTime*p.orbitSpeed);
          const px=Math.cos(angle)*p.orbitRx;
          const pz=Math.sin(angle)*p.orbitRz;
          p.holder.position.set(px,0,pz);
          p.planetObj.mat.uniforms.lightDir.value.set(-px,.22,-pz).normalize();
          p.planetObj.mat.uniforms.opacity.value=curOp;
          p.planetObj.haloMat.opacity=curOp*.46;
          if(p.ringObj)p.ringObj.mat.uniforms.opacity.value=curOp;
          if(p.moonOrbitObj)p.moonOrbitObj.mat.opacity=curOp*p.moonOrbitObj.baseOp;
          if(p.moonObj){
            const mAngle=effectTime*1.35+p.baseAngle;
            p.moonObj.mesh.position.set(Math.cos(mAngle)*.135,.014*Math.sin(mAngle),Math.sin(mAngle)*.135);
            p.moonObj.mat.uniforms.lightDir.value.set(-px,.22,-pz).normalize();
            p.moonObj.mat.uniforms.opacity.value=curOp;
            p.moonObj.haloMat.opacity=curOp*.38;
          }
          if(p.tailMat){
            p.holder.rotation.y=-angle;
            p.tailMat.uniforms.opacity.value=curOp;
          }
        });
      });

      const coreDist = camera.position.length();
      blackHole.visible = (coreDist < 5.5);
      if (focusIndex >= 0 || coreDist >= 5.5) {
        // Pure unwarped galactic beauty at normal/wide distances
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
      } else {
        // Relativistic starlight lensing only when diving deep into Sagittarius A* core
        renderer.setRenderTarget(target);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        const projected = new THREE.Vector3(0,0,0).project(camera);
        lensMaterial.uniforms.center.value.set(projected.x * 0.5 + 0.5, projected.y * 0.5 + 0.5);
        lensMaterial.uniforms.eye.value.copy(camera.position).normalize().multiplyScalar(12.25);
        lensMaterial.uniforms.right.value.set(1, 0, 0).applyQuaternion(camera.quaternion);
        lensMaterial.uniforms.up.value.set(0, 1, 0).applyQuaternion(camera.quaternion);
        lensMaterial.uniforms.radius.value = THREE.MathUtils.clamp(0.14 * 4.0 / Math.max(0.5, coreDist), 0.02, 0.32);
        lensMaterial.uniforms.strength.value = THREE.MathUtils.clamp((5.5 - coreDist) / 3.0, 0.0, 1.0);
        renderer.render(lensScene, lensCamera);
      }
    }
  };
  frame=requestAnimationFrame(tick);
  return ()=>{
    disposed=true;
    clearTimeout(enterTimer);
    cancelAnimationFrame(frame);
    observer.disconnect();
    controls.removeEventListener('start',controlStart);
    canvas.removeEventListener('pointerdown',onControlDown,{capture:true});
    window.removeEventListener('pointerup',onControlUp,{capture:true});
    controls.dispose();
    root.removeEventListener('cosmos-focus',onSelect);
    root.removeEventListener('click',zoom);
    canvas.removeEventListener('wheel',wheelGuard,{capture:true});
    canvas.removeEventListener('pointermove',onPointer);
    canvas.removeEventListener('pointerleave',leave);
    canvas.removeEventListener('pointerdown',onDown);
    canvas.removeEventListener('pointerup',onUp);
    canvas.removeEventListener('pointercancel',leave);
    geometry.dispose();starsMaterial.dispose();
    cloudGeometry.dispose();cloudMaterial.dispose();
    markers.forEach(s=>{s.userData.sprite.material.dispose();s.userData.mini.geometry.dispose();s.userData.mini.material.dispose();});
    disposables.forEach(d=>d.dispose());
    target.dispose();lensMaterial.dispose();
    pickGeometry.dispose();pickMaterial.dispose();
    holeGeometry.dispose();holeMaterial.dispose();
    waveGeometry.dispose();waves.forEach(w=>w.material.dispose());
    coreMaterial.dispose();holeGeometry.dispose();holeMaterial.dispose();glowTexture.dispose();spikeTexture.dispose();
    renderer.dispose();
  };
}
