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

  // 0. 360° Full-Space Deep Starfield & Galactic Halo ("把星星不只局限于那个地方")
  let bgSeed=91023;
  const bgRand=()=>{bgSeed=(1664525*bgSeed+1013904223)>>>0;return bgSeed/4294967296;};
  const bgNormal=()=>bgRand()+bgRand()+bgRand()-1.5;

  const deepCount=3400,deepPos=new Float32Array(deepCount*3),deepCol=new Float32Array(deepCount*3),deepSize=new Float32Array(deepCount);
  const deepColor=new THREE.Color();
  for(let i=0;i<deepCount;i++){
    const u=bgRand()*2-1,theta=bgRand()*Math.PI*2,s=Math.sqrt(Math.max(0,1-u*u));
    const r=20+Math.pow(bgRand(),.65)*72;
    deepPos[i*3]=r*s*Math.cos(theta);
    deepPos[i*3+1]=r*u*.82;
    deepPos[i*3+2]=r*s*Math.sin(theta);
    const pick=bgRand();
    if(pick<.25)deepColor.setHex(0xc8deff);
    else if(pick<.55)deepColor.setHex(0xf5efe2);
    else if(pick<.80)deepColor.setHex(0xffe0ac);
    else deepColor.setHex(0xaed4e6);
    const b=.24+Math.pow(bgRand(),1.6)*.72;
    deepCol[i*3]=deepColor.r*b;deepCol[i*3+1]=deepColor.g*b;deepCol[i*3+2]=deepColor.b*b;
    deepSize[i]=.6+Math.pow(bgRand(),2.4)*2.4;
  }
  const deepGeo=new THREE.BufferGeometry();
  deepGeo.setAttribute('position',new THREE.BufferAttribute(deepPos,3));
  deepGeo.setAttribute('color',new THREE.BufferAttribute(deepCol,3));
  deepGeo.setAttribute('aSize',new THREE.BufferAttribute(deepSize,1));
  const deepMat=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
    uniforms:{scale:{value:dpr},time:{value:0},visibility:{value:1}},
    vertexShader:'attribute float aSize;varying vec3 vColor;varying float vTwinkle;uniform float scale;uniform float time;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.0);vTwinkle=.82+.18*sin(time*1.4+position.x*3.1+position.y*2.7);gl_PointSize=clamp(18.0*aSize*scale/(-p.z),.9,4.2);gl_Position=projectionMatrix*p;}',
    fragmentShader:'varying vec3 vColor;varying float vTwinkle;uniform float visibility;void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.5)discard;float a=pow(1.0-d*2.0,2.0)*vTwinkle*visibility;gl_FragColor=vec4(vColor,a);\n#include <colorspace_fragment>\n}'
  });
  const deepField=new THREE.Points(deepGeo,deepMat);
  scene.add(deepField);
  disposables.push(deepGeo,deepMat);

  const haloCount=1800,haloPos=new Float32Array(haloCount*3),haloCol=new Float32Array(haloCount*3),haloSize=new Float32Array(haloCount);
  for(let i=0;i<haloCount;i++){
    const a=bgRand()*Math.PI*2;
    const r=2.5+Math.pow(bgRand(),.78)*22.0;
    const ySpread=(1.2+r*.28)*bgNormal();
    haloPos[i*3]=Math.cos(a)*r+bgNormal()*1.2;
    haloPos[i*3+1]=ySpread;
    haloPos[i*3+2]=Math.sin(a)*r+bgNormal()*1.2;
    const m=bgRand();
    deepColor.setHex(m<.35?0xd8e8ff:m<.72?0xf6ead3:0xe5c287);
    const b=.18+bgRand()*.46;
    haloCol[i*3]=deepColor.r*b;haloCol[i*3+1]=deepColor.g*b;haloCol[i*3+2]=deepColor.b*b;
    haloSize[i]=.55+Math.pow(bgRand(),2.0)*1.8;
  }
  const haloGeo=new THREE.BufferGeometry();
  haloGeo.setAttribute('position',new THREE.BufferAttribute(haloPos,3));
  haloGeo.setAttribute('color',new THREE.BufferAttribute(haloCol,3));
  haloGeo.setAttribute('aSize',new THREE.BufferAttribute(haloSize,1));
  const haloMat=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
    uniforms:{scale:{value:dpr},time:{value:0},visibility:{value:1}},
    vertexShader:'attribute float aSize;varying vec3 vColor;uniform float scale;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(16.0*aSize*scale/(-p.z),.8,4.0);gl_Position=projectionMatrix*p;}',
    fragmentShader:'varying vec3 vColor;uniform float visibility;void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.5)discard;float a=pow(1.0-d*2.0,2.1)*visibility*.75;gl_FragColor=vec4(vColor,a);\n#include <colorspace_fragment>\n}'
  });
  galaxy.add(new THREE.Points(haloGeo,haloMat));
  disposables.push(haloGeo,haloMat);

  // 1. Main Milky Way Galaxy
  const count=28000;
  const positions=new Float32Array(count*3),colors=new Float32Array(count*3);
  const inside=new THREE.Color('#fff2cf'),mid=new THREE.Color('#d8c796'),outside=new THREE.Color('#6f96b8'),dust=new THREE.Color('#476779');
  let seed=42071;
  const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const normal=()=>rand()+rand()+rand()-1.5;

  for(let i=0;i<count;i++){
    const i3=i*3,u=rand(),inCore=u<.23;
    const radius=inCore?Math.pow(rand(),1.9)*2.2:1.1+Math.pow(rand(),.76)*11.6;
    const arm=i%4,spin=radius*1.32,branch=(arm/4)*Math.PI*2;
    const spread=(inCore?.38:.24+radius*.078)*(inCore?1:(.55+rand()*.9));
    const angle=branch+spin+normal()*spread*.42;
    const thickness=inCore?(1-radius/3.2)*.58+.12:Math.max(.08,.48-radius*.025);
    positions[i3]=Math.cos(angle)*radius+normal()*spread;
    positions[i3+1]=normal()*thickness;
    positions[i3+2]=Math.sin(angle)*radius+normal()*spread;

    const t=Math.min(1,radius/12.2);
    const c=inside.clone().lerp(mid,Math.min(1,t*1.55)).lerp(outside,Math.max(0,(t-.28)/.72));
    if(i%6===0)c.lerp(dust,.48);
    const brightness=inCore?.88+rand()*.42:.42+rand()*.78;
    colors[i3]=c.r*brightness;colors[i3+1]=c.g*brightness;colors[i3+2]=c.b*brightness;
  }

  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const starsMaterial=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
    uniforms:{scale:{value:dpr},visibility:{value:1}},
    vertexShader:'varying vec3 vColor;uniform float scale;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(24.0*scale/(-p.z),1.2,5.5);gl_Position=projectionMatrix*p;}',
    fragmentShader:'varying vec3 vColor;uniform float visibility;void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.5)discard;float a=(1.0-smoothstep(0.08,0.5,d))*0.92*visibility;gl_FragColor=vec4(vColor,a);\n#include <colorspace_fragment>\n}'
  });
  galaxy.add(new THREE.Points(geometry,starsMaterial));

  const cloudCount=380,cloudPositions=new Float32Array(cloudCount*3),cloudColors=new Float32Array(cloudCount*3);
  for(let i=0;i<cloudCount;i++){
    const i3=i*3,arm=i%4,radius=1.1+Math.pow(rand(),.82)*9.2,angle=(arm/4)*Math.PI*2+radius*1.28+normal()*.28;
    cloudPositions[i3]=Math.cos(angle)*radius+normal()*.55;
    cloudPositions[i3+1]=normal()*.18;
    cloudPositions[i3+2]=Math.sin(angle)*radius+normal()*.55;
    const c=inside.clone().lerp(outside,Math.min(1,radius/10));
    cloudColors[i3]=c.r*.65;cloudColors[i3+1]=c.g*.68;cloudColors[i3+2]=c.b*.78;
  }
  const cloudGeometry=new THREE.BufferGeometry();
  cloudGeometry.setAttribute('position',new THREE.BufferAttribute(cloudPositions,3));
  cloudGeometry.setAttribute('color',new THREE.BufferAttribute(cloudColors,3));
  const cloudMaterial=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
    uniforms:{scale:{value:dpr},visibility:{value:1}},
    vertexShader:'varying vec3 vColor;uniform float scale;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(160.0*scale/(-p.z),6.0,46.0);gl_Position=projectionMatrix*p;}',
    fragmentShader:'varying vec3 vColor;uniform float visibility;void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.5)discard;float a=pow(max(0.0,1.0-d*2.0),2.2)*0.075*visibility;gl_FragColor=vec4(vColor,a);\n#include <colorspace_fragment>\n}'
  });
  galaxy.add(new THREE.Points(cloudGeometry,cloudMaterial));

    const coreMaterial=new THREE.SpriteMaterial({map:glowTexture,color:0xffdfa4,transparent:true,opacity:.35,depthWrite:false,blending:THREE.AdditiveBlending});
  const core=new THREE.Sprite(coreMaterial);
  core.scale.set(3.2,3.2,1);
  galaxy.add(core);



  const holeGeometry=new THREE.SphereGeometry(.56,28,20);
  const holeMaterial=new THREE.MeshBasicMaterial({color:0x000104});
  const blackHole=new THREE.Mesh(holeGeometry,holeMaterial);
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
  const lensMaterial=new THREE.ShaderMaterial({transparent:true,uniforms:{image:{value:target.texture},center:{value:new THREE.Vector2(.5,.5)},aspect:{value:1},time:{value:0},radius:{value:.14},strength:{value:0},eye:{value:new THREE.Vector3(0,4.2,11.5)},right:{value:new THREE.Vector3(1,0,0)},up:{value:new THREE.Vector3(0,1,0)}},vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position,1.0);}',fragmentShader:`
  uniform sampler2D image;uniform vec2 center;uniform float aspect;uniform float time;uniform float radius;uniform float strength;uniform vec3 eye;uniform vec3 right;uniform vec3 up;varying vec2 uv0;
  float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
  float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);float a=hash21(i),b=hash21(i+vec2(1.,0.)),c=hash21(i+vec2(0.,1.)),d=hash21(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
  float fbm(vec2 p){float v=0.0,amp=.5;for(int k=0;k<4;k++){v+=amp*noise2(p);p=p*2.03+vec2(1.7,9.2);amp*=.5;}return v;}
  void main(){
    vec2 d=uv0-center;d.x*=aspect;float screenR=length(d);vec4 base=texture2D(image,uv0);
    if(screenR>radius||strength<.001){gl_FragColor=base;return;}
    vec2 q=d/radius;vec3 pos=eye,forward=normalize(-pos);
    vec3 dir=normalize(forward+right*q.x*.40+up*q.y*.40);vec3 light=vec3(0.);float captured=0.;float previousY=pos.y;float minR=99.0;
    for(int i=0;i<128;i++){
      float r=length(pos);minR=min(minR,r);float stepSize=clamp(r*.045,.042,.34);vec3 acceleration=-pos/(r*r*r+.165)*.88;
      dir=normalize(dir+acceleration*stepSize);pos+=dir*stepSize;float nr=length(pos);minR=min(minR,nr);
      if(previousY*pos.y<0.&&captured<.5){float radial=length(pos.xz);if(radial>1.02&&radial<5.2){
          float angle=atan(pos.z,pos.x);float shear=log(max(radial,.1))*6.8-angle*2.0+time*.28;
          float turb=fbm(vec2(radial*2.6+sin(angle*2.0)*.35,shear*.65));
          float wisps=smoothstep(.22,.82,turb)*(.62+.38*sin(shear*1.7+turb*4.2));
          float edge=smoothstep(1.02,1.42,radial)*(1.-smoothstep(3.4,5.1,radial));
          float doppler=pow(clamp(.78+.58*cos(angle+.52),.18,1.55),1.45);
          float heat=pow(clamp(1.-(radial-1.02)/3.8,0.,1.),1.3);
          vec3 col=mix(vec3(.88,.24,.04),mix(vec3(1.,.64,.18),vec3(1.,.96,.82),heat),clamp(heat*doppler*.85,0.,1.));
          light+=col*wisps*edge*doppler*1.18;}}
      previousY=pos.y;if(nr<.62){captured=1.;break;}if(pos.z < -10.)break;
    }
    float photonRing=exp(-pow((minR-.635)/.034,2.0))*(1.0-captured*.92);
    float asym=.75+.45*normalize(q+vec2(.001)).x;
    light=light*(1.0-captured*.88)+vec3(1.0,.91,.70)*photonRing*asym*.98;
    float einstein=exp(-pow((minR-.72)/.14,2.0))*(1.0-captured);
    vec2 tang=vec2(-q.y,q.x)/(length(q)+.04);
    vec2 shifted=uv0+vec2((dir.x-q.x*.32)/aspect,dir.y-q.y*.32)*(.034+einstein*.022)+vec2(tang.x/aspect,tang.y)*einstein*.008;
    vec4 bent=texture2D(image,shifted)*(1.0-captured);float rim=1.-smoothstep(radius*.72,radius,screenR);
    vec3 voidColor=vec3(.003,.006,.014);
    vec3 bgResult=mix(base.rgb,mix(voidColor,bent.rgb*(1.0+einstein*.28),1.0-captured),rim);
    vec3 result=bgResult+light*rim;
    float alpha=max(base.a,max(bent.a*rim,clamp((captured*.98+length(light)*.88)*rim,0.,1.)));
    gl_FragColor=mix(base,vec4(result,clamp(alpha,0.,1.)),strength);
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

      const coreDist=camera.position.length();
      if(focusIndex>=0||coreDist>=7){
        renderer.setRenderTarget(null);renderer.render(scene,camera);
      }else{
        renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);
        const projected=new THREE.Vector3(0,0,0).project(camera);
        lensMaterial.uniforms.center.value.set(projected.x*.5+.5,projected.y*.5+.5);
        lensMaterial.uniforms.eye.value.copy(camera.position).normalize().multiplyScalar(12.25);
        lensMaterial.uniforms.right.value.set(1,0,0).applyQuaternion(camera.quaternion);
        lensMaterial.uniforms.up.value.set(0,1,0).applyQuaternion(camera.quaternion);
        lensMaterial.uniforms.radius.value=THREE.MathUtils.clamp(.09*4.0/coreDist,.01,.16);
        lensMaterial.uniforms.strength.value=THREE.MathUtils.clamp((7-coreDist)/2.5,0,1);
        renderer.render(lensScene,lensCamera);
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
