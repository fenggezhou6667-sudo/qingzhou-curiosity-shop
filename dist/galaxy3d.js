import * as THREE from './vendor/three/three.module.js';
import {OrbitControls} from './vendor/three/OrbitControls.js';

export function mountGalaxy(root,archive){
  const canvas=root.querySelector('.cosmos-canvas'),area=root.querySelector('.cosmos-scene');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});}
  catch(error){root.querySelector('.cosmos-fallback').hidden=false;return ()=>{};}
  const dpr=Math.min(devicePixelRatio||1,1.5);
  renderer.setPixelRatio(dpr);renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1,.1,160);
  camera.position.set(0,9,19);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.06;controls.enablePan=false;controls.enableZoom=true;controls.minDistance=1.15;controls.maxDistance=38;controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI-.15;
  controls.touches.ONE=THREE.TOUCH.ROTATE;controls.touches.TWO=THREE.TOUCH.DOLLY_ROTATE;
  const galaxy=new THREE.Group();scene.add(galaxy);
  const disposables=[];

  // 1. Main Milky Way spiral disk (26,000 stars)
  const count=26000,positions=new Float32Array(count*3),colors=new Float32Array(count*3),color=new THREE.Color();
  function compose(index){
    let seed=57121+index*4099;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
    const stellarColors=[0xb5d2ff,0xe1e8ff,0xfff0d4,0xffd59f,0xf6bdb2];
    const normal=()=>rand()+rand()+rand()+rand()-2;
    for(let i=0;i<count;i++){
      let x,y,z,radius,armStar=false;
      const choice=rand();
      if(choice<.28){
        const bulge=choice<.15;x=normal()*(bulge?.8:1.75);z=normal()*(bulge?.65:.48);y=normal()*(bulge?.48:.23);
      }else if(choice<.52){
        radius=Math.min(10.8,Math.sqrt(rand())*10.8);const a=rand()*Math.PI*2;x=Math.cos(a)*radius;z=Math.sin(a)*radius;y=normal()*(.12+radius*.018);
      }else{
        armStar=true;const arm=i%2;radius=1.5+Math.pow(rand(),.86)*9.1;let theta=arm*Math.PI+.41+1.35*Math.log(radius/1.5);
        theta+=.10*Math.sin(radius*1.1+arm*1.8)+(rand()<.23?(radius-1.5)*.045:0);
        const spread=normal()*(.14+.045*radius);const rr=radius+normal()*(.18+.065*radius);
        x=Math.cos(theta+spread)*rr;z=Math.sin(theta+spread)*rr;y=normal()*(.11+radius*.017);
      }
      positions[i*3]=x;positions[i*3+1]=y;positions[i*3+2]=z;
      let tone;if(choice<.28)tone=rand()<.75?3:2;else if(armStar)tone=rand()<.45?0:(rand()<.42?1:2);else tone=rand()<.62?2:3;
      if(rand()<.035)tone=4;color.setHex(stellarColors[tone]);const luminosity=.30+rand()*.56;colors[i*3]=color.r*luminosity;colors[i*3+1]=color.g*luminosity;colors[i*3+2]=color.b*luminosity;
    }
  }compose(0);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const starsMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,uniforms:{scale:{value:dpr},visibility:{value:1}},vertexShader:'varying vec3 vColor; uniform float scale; void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(20.0*scale/(-p.z),1.0,3.6);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 vColor;uniform float visibility; void main(){float d=length(gl_PointCoord-vec2(.5));float a=1.0-smoothstep(.05,.5,d);gl_FragColor=vec4(vColor,a*.82*visibility);\n#include <colorspace_fragment>\n}'});
  const cloudCount=1800,cloudPositions=new Float32Array(cloudCount*3),cloudColors=new Float32Array(cloudCount*3);
  for(let i=0;i<cloudCount;i++){const source=(Math.floor((i+.37)*count/cloudCount)%count)*3;cloudPositions.set(positions.subarray(source,source+3),i*3);const warm=i%5===0;cloudColors.set(warm?[.23,.12,.08]:[.08,.15,.24],i*3);}
  const cloudGeometry=new THREE.BufferGeometry();cloudGeometry.setAttribute('position',new THREE.BufferAttribute(cloudPositions,3));cloudGeometry.setAttribute('color',new THREE.BufferAttribute(cloudColors,3));
  const cloudMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,uniforms:{scale:{value:dpr},visibility:{value:1}},vertexShader:'varying vec3 vColor;uniform float scale;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(240.*scale/(-p.z),2.,40.);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 vColor;uniform float visibility;void main(){float d=length(gl_PointCoord-vec2(.5));float a=pow(max(0.,1.-d*2.),2.);gl_FragColor=vec4(vColor,a*.16*visibility);}'});
  galaxy.add(new THREE.Points(cloudGeometry,cloudMaterial));
  const dust=new THREE.Points(geometry,starsMaterial);galaxy.add(dust);

  // 2. Full-Space 360° Celestial Sphere & 3D Galactic Halo ("把星星不只局限于那个地方")
  const haloCount=1800,haloPos=new Float32Array(haloCount*3),haloCol=new Float32Array(haloCount*3),haloSz=new Float32Array(haloCount);
  const deepCount=3400,deepPos=new Float32Array(deepCount*3),deepCol=new Float32Array(deepCount*3),deepSz=new Float32Array(deepCount);
  {
    let hSeed=19487;const hRand=()=>{hSeed=(1664525*hSeed+1013904223)>>>0;return hSeed/4294967296;};
    const hNorm=()=>hRand()+hRand()+hRand()-1.5;
    const hPalette=[0xd8e8ff,0xfff2dc,0xb4d2ff,0xffdfad,0xe8d8ff];
    for(let i=0;i<haloCount;i++){
      const r=2.2+Math.pow(hRand(),.68)*19.5;
      const theta=hRand()*Math.PI*2;
      const ySpread=(1.2+r*.38)*hNorm();
      haloPos[i*3]=Math.cos(theta)*r+hNorm()*1.2;
      haloPos[i*3+1]=ySpread;
      haloPos[i*3+2]=Math.sin(theta)*r+hNorm()*1.2;
      haloSz[i]=.7+Math.pow(hRand(),2.4)*1.5;
      color.setHex(hPalette[i%hPalette.length]);
      const lum=.22+hRand()*.46;
      haloCol[i*3]=color.r*lum;haloCol[i*3+1]=color.g*lum;haloCol[i*3+2]=color.b*lum;
    }
    for(let i=0;i<deepCount;i++){
      const u=hRand()*2-1,phi=hRand()*Math.PI*2,s=Math.sqrt(Math.max(0,1-u*u));
      const r=16+Math.pow(hRand(),.58)*76;
      deepPos[i*3]=r*s*Math.cos(phi);
      deepPos[i*3+1]=r*u*.82;
      deepPos[i*3+2]=r*s*Math.sin(phi);
      const bright=i%17===0;
      deepSz[i]=bright?(1.55+hRand()*1.1):(.65+hRand()*.95);
      color.setHex(hPalette[(i*3)%hPalette.length]);
      const lum=bright?(.55+hRand()*.42):(.18+hRand()*.38);
      deepCol[i*3]=color.r*lum;deepCol[i*3+1]=color.g*lum;deepCol[i*3+2]=color.b*lum;
    }
  }
  const haloGeo=new THREE.BufferGeometry();
  haloGeo.setAttribute('position',new THREE.BufferAttribute(haloPos,3));
  haloGeo.setAttribute('color',new THREE.BufferAttribute(haloCol,3));
  haloGeo.setAttribute('aSize',new THREE.BufferAttribute(haloSz,1));
  const haloMat=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
    uniforms:{scale:{value:dpr},visibility:{value:1},time:{value:0}},
    vertexShader:'attribute float aSize;varying vec3 vColor;varying float vTw;uniform float scale;uniform float time;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.0);vTw=.86+.14*sin(time*1.6+position.x*3.7+position.y*5.1);gl_PointSize=clamp(18.0*aSize*scale/(-p.z),1.0,4.2);gl_Position=projectionMatrix*p;}',
    fragmentShader:'varying vec3 vColor;varying float vTw;uniform float visibility;void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.5)discard;float a=(1.0-smoothstep(.04,.5,d))*.68*visibility*vTw;gl_FragColor=vec4(vColor,a);\n#include <colorspace_fragment>\n}'
  });
  galaxy.add(new THREE.Points(haloGeo,haloMat));
  disposables.push(haloGeo,haloMat);

  const deepGeo=new THREE.BufferGeometry();
  deepGeo.setAttribute('position',new THREE.BufferAttribute(deepPos,3));
  deepGeo.setAttribute('color',new THREE.BufferAttribute(deepCol,3));
  deepGeo.setAttribute('aSize',new THREE.BufferAttribute(deepSz,1));
  const deepMat=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
    uniforms:{scale:{value:dpr},visibility:{value:1},time:{value:0}},
    vertexShader:'attribute float aSize;varying vec3 vColor;varying float vTw;uniform float scale;uniform float time;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.0);vTw=.84+.16*sin(time*1.9+position.x*1.3+position.z*1.7);gl_PointSize=clamp(24.0*aSize*scale/(-p.z),1.0,4.5);gl_Position=projectionMatrix*p;}',
    fragmentShader:'varying vec3 vColor;varying float vTw;uniform float visibility;void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.5)discard;float core=exp(-d*d*16.0);float a=(core*.75+pow(max(0.,1.-d*2.),2.)*.35)*visibility*vTw;gl_FragColor=vec4(vColor,a);\n#include <colorspace_fragment>\n}'
  });
  const deepField=new THREE.Points(deepGeo,deepMat);
  scene.add(deepField);
  disposables.push(deepGeo,deepMat);

  // Shared glow & diffraction spike textures
  const spriteCanvas=document.createElement('canvas');spriteCanvas.width=spriteCanvas.height=128;const c=spriteCanvas.getContext('2d'),g=c.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,250,217,1)');g.addColorStop(.08,'rgba(255,230,157,.95)');g.addColorStop(.2,'rgba(238,203,120,.4)');g.addColorStop(1,'rgba(221,195,125,0)');c.fillStyle=g;c.fillRect(0,0,128,128);const glowTexture=new THREE.CanvasTexture(spriteCanvas);
  const spikeCanvas=document.createElement('canvas');spikeCanvas.width=spikeCanvas.height=128;const sc=spikeCanvas.getContext('2d'),sg=sc.createRadialGradient(64,64,0,64,64,58);sg.addColorStop(0,'rgba(255,252,240,1)');sg.addColorStop(.12,'rgba(255,235,185,.82)');sg.addColorStop(.32,'rgba(230,200,140,.22)');sg.addColorStop(1,'rgba(230,200,140,0)');sc.fillStyle=sg;sc.fillRect(0,0,128,128);
  sc.translate(64,64);for(let k=0;k<2;k++){const lg=sc.createLinearGradient(-58,0,58,0);lg.addColorStop(0,'rgba(255,245,215,0)');lg.addColorStop(.44,'rgba(255,245,215,.35)');lg.addColorStop(.5,'rgba(255,255,255,.95)');lg.addColorStop(.56,'rgba(255,245,215,.35)');lg.addColorStop(1,'rgba(255,245,215,0)');sc.fillStyle=lg;sc.fillRect(-58,-1.1,116,2.2);sc.rotate(Math.PI/2);}
  const spikeTexture=new THREE.CanvasTexture(spikeCanvas);

  const coreMaterial=new THREE.SpriteMaterial({map:glowTexture,color:0xffdfa4,transparent:true,opacity:.42,depthWrite:false,blending:THREE.AdditiveBlending});const core=new THREE.Sprite(coreMaterial);core.scale.set(3.3,3.3,1);galaxy.add(core);
  const holeGeometry=new THREE.SphereGeometry(.001,8,6),holeMaterial=new THREE.MeshBasicMaterial({color:0x010208});const hole=new THREE.Mesh(holeGeometry,holeMaterial);galaxy.add(hole);
  const waveGeometry=new THREE.BufferGeometry().setFromPoints(Array.from({length:129},(_,i)=>{const a=i*Math.PI*2/128;return new THREE.Vector3(Math.cos(a),.01,Math.sin(a));}));const waves=[];for(let i=0;i<3;i++){const material=new THREE.LineBasicMaterial({color:0x9dbcd3,transparent:true,opacity:0,depthWrite:false});const ring=new THREE.Line(waveGeometry,material);ring.userData.phase=i/3;waves.push(ring);}

  // Helper: create a 3D lit planet with day/night crescent terminator + atmospheric rim glow
  const planetSphereGeo=new THREE.SphereGeometry(1,28,20);
  disposables.push(planetSphereGeo);
  function createLitPlanet(radius,dayHex,nightHex,rimHex,bandStrength=0.18){
    const mat=new THREE.ShaderMaterial({
      transparent:true,depthWrite:true,
      uniforms:{
        opacity:{value:0},
        dayColor:{value:new THREE.Color(dayHex)},
        nightColor:{value:new THREE.Color(nightHex)},
        rimColor:{value:new THREE.Color(rimHex)},
        lightDir:{value:new THREE.Vector3(-1,0.2,0).normalize()},
        bandAmp:{value:bandStrength}
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
        uniform vec3 nightColor;
        uniform vec3 rimColor;
        uniform vec3 lightDir;
        uniform float bandAmp;
        varying vec3 vNormalLocal;
        varying vec3 vNormalView;
        varying vec3 vPosLocal;
        void main(){
          if(opacity<.004)discard;
          float ndl=dot(normalize(vNormalLocal),normalize(lightDir));
          float lit=smoothstep(-.24,.65,ndl);
          float bands=sin(vPosLocal.y*16.0+sin(vPosLocal.x*7.0)*.6)*bandAmp;
          vec3 surface=mix(nightColor,dayColor*(1.0+bands),lit);
          float rim=pow(clamp(1.0-abs(vNormalView.z),0.0,1.0),2.2);
          vec3 col=surface+rimColor*rim*(.40+.60*lit);
          gl_FragColor=vec4(col,opacity);
          #include <colorspace_fragment>
        }
      `
    });
    const mesh=new THREE.Mesh(planetSphereGeo,mat);
    mesh.scale.setScalar(radius);
    disposables.push(mat);
    return {mesh,mat};
  }

  // Helper: create an elliptical orbit line in 3D
  function createOrbitLine(rx,rz,colorHex,tiltX=0,tiltZ=0,baseOp=0.52){
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

  // Helper: create Saturn-like concentric planetary rings with Cassini division
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
          float edge=smoothstep(0.0,.10,u)*(1.0-smoothstep(.88,1.0,u));
          float cassini=1.0-.82*exp(-pow((u-.62)/.045,2.0));
          float fine=.78+.22*sin(u*44.0);
          vec3 col=mix(colA,colB,u)*fine;
          gl_FragColor=vec4(col,edge*cassini*opacity*.86);
          #include <colorspace_fragment>
        }
      `
    });
    const mesh=new THREE.Mesh(geo,mat);
    mesh.rotation.set(tiltX,0,tiltZ);
    disposables.push(geo,mat);
    return {mesh,mat};
  }

  // 3. Three Diverse 3D Stellar / Planetary Systems (恒星系)
  // System 0 (在寂静的岸边): Binary Star & Ice-Ringed Planetary System (双星潮汐与土星式冰晶光环恒星系)
  // System 1 (光的形状): Golden Amber Sun & Multi-Inclination Ecliptic System (琥珀主星与多倾角黄道晨昏线恒星系)
  // System 2 (漫长的下午): Emerald Sun, Twin-Moon World & Great Comet System (翡翠恒星、伴月行星与长尾彗星系)
  const markers=[],pickTargets=[],pickGeometry=new THREE.SphereGeometry(.72,12,8),pickMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false});
  const tilts=[[.28,.08,-.14],[-.20,.15,.18],[.22,-.16,.12]];
  const viewDirs=[new THREE.Vector3(.22,.62,.75).normalize(),new THREE.Vector3(-.18,.64,.74).normalize(),new THREE.Vector3(.16,.62,.76).normalize()];

  for(let i=0;i<archive.works.length;i++){
    const group=new THREE.Group(),sub=new THREE.Group();
    sub.rotation.set(tilts[i%3][0],tilts[i%3][1],tilts[i%3][2]);
    // Overview marker sprite — dimmed significantly in galaxy overview per user feedback
    const markerColor=[0xdcecff,0xffe0a8,0xc6f0e0][i%3];
    const material=new THREE.SpriteMaterial({map:glowTexture,color:markerColor,transparent:true,opacity:.26,depthWrite:false,blending:THREE.AdditiveBlending});
    const sprite=new THREE.Sprite(material),hit=new THREE.Mesh(pickGeometry,pickMaterial);
    sprite.scale.setScalar(.20);

    // Central host star(s)
    const starPivot=new THREE.Group();
    sub.add(starPivot);
    const starMaterials=[];
    const coreGlowMat=new THREE.SpriteMaterial({map:glowTexture,color:[0xdbeeff,0xffdf9e,0xcaf2e2][i%3],transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
    const coreGlow=new THREE.Sprite(coreGlowMat);
    coreGlow.scale.setScalar(i===1?1.15:.95);
    sub.add(coreGlow);
    disposables.push(coreGlowMat);

    if(i===0){
      // Binary stars: primary ice-blue giant + secondary warm-gold companion orbiting common center
      const s1Mat=new THREE.MeshBasicMaterial({color:0xeaf5ff,transparent:true,opacity:0});
      const s1=new THREE.Mesh(planetSphereGeo,s1Mat);s1.scale.setScalar(.078);s1.position.set(-.078,0,0);
      const s1CoronaMat=new THREE.SpriteMaterial({map:spikeTexture,color:0xaed4ff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
      const s1Corona=new THREE.Sprite(s1CoronaMat);s1Corona.scale.setScalar(.48);s1.add(s1Corona);

      const s2Mat=new THREE.MeshBasicMaterial({color:0xffe4b0,transparent:true,opacity:0});
      const s2=new THREE.Mesh(planetSphereGeo,s2Mat);s2.scale.setScalar(.052);s2.position.set(.098,0,0);
      const s2CoronaMat=new THREE.SpriteMaterial({map:glowTexture,color:0xffcf86,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
      const s2Corona=new THREE.Sprite(s2CoronaMat);s2Corona.scale.setScalar(.34);s2.add(s2Corona);

      starPivot.add(s1,s2);
      starMaterials.push(s1Mat,s1CoronaMat,s2Mat,s2CoronaMat);
      disposables.push(s1Mat,s1CoronaMat,s2Mat,s2CoronaMat);
    }else if(i===1){
      // Radiant Golden Amber Sun with crisp diffraction corona
      const sunMat=new THREE.MeshBasicMaterial({color:0xfff4d8,transparent:true,opacity:0});
      const sun=new THREE.Mesh(planetSphereGeo,sunMat);sun.scale.setScalar(.098);
      const sunCoronaMat=new THREE.SpriteMaterial({map:spikeTexture,color:0xffcb78,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
      const sunCorona=new THREE.Sprite(sunCoronaMat);sunCorona.scale.setScalar(.64);sun.add(sunCorona);
      starPivot.add(sun);
      starMaterials.push(sunMat,sunCoronaMat);
      disposables.push(sunMat,sunCoronaMat);
    }else{
      // Luminous Emerald-Cream Star with soft corona
      const pStarMat=new THREE.MeshBasicMaterial({color:0xf4fff8,transparent:true,opacity:0});
      const pStar=new THREE.Mesh(planetSphereGeo,pStarMat);pStar.scale.setScalar(.086);
      const pCoronaMat=new THREE.SpriteMaterial({map:spikeTexture,color:0xa8eed6,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
      const pCorona=new THREE.Sprite(pCoronaMat);pCorona.scale.setScalar(.54);pStar.add(pCorona);
      starPivot.add(pStar);
      starMaterials.push(pStarMat,pCoronaMat);
      disposables.push(pStarMat,pCoronaMat);
    }

    // 4 Clean Elliptical / Inclined Orbit Lines for each solar system
    const orbitLines=[];
    if(i===0){
      orbitLines.push(
        createOrbitLine(.25,.24,0x8bb8f0,0,0,.38),
        createOrbitLine(.44,.42,0xb6d8ff,0,0,.58),
        createOrbitLine(.76,.72,0xdceeff,.06,-.05,.62),
        createOrbitLine(1.06,1.02,0x7aa6e0,-.04,.04,.34)
      );
    }else if(i===1){
      orbitLines.push(
        createOrbitLine(.26,.25,0xffcfa0,.10,-.06,.40),
        createOrbitLine(.46,.44,0xffe6b8,-.05,.04,.60),
        createOrbitLine(.80,.76,0xffc47e,.18,.14,.62),
        createOrbitLine(1.08,1.02,0xd89e68,-.20,.10,.36)
      );
    }else{
      orbitLines.push(
        createOrbitLine(.25,.24,0x8cd8c0,0,0,.36),
        createOrbitLine(.45,.43,0xaef0d8,.03,-.03,.58),
        createOrbitLine(.84,.64,0xd6faee,-.15,.18,.58),
        createOrbitLine(1.08,1.02,0x7fc4b8,.05,.04,.34)
      );
    }
    orbitLines.forEach(o=>sub.add(o.line));

    // Delicate, sparse Asteroid / Kuiper / Protoplanetary Belt (560 fine particles so planets & orbits are the clear heroes!)
    const starCount=560,points=new Float32Array(starCount*3),tints=new Float32Array(starCount*3),sizes=new Float32Array(starCount);
    const nebCount=90,nebPoints=new Float32Array(nebCount*3),nebTints=new Float32Array(nebCount*3);
    let seed=8383+i*7103;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;},normal=()=>rand()+rand()+rand()+rand()-2;
    const palette=[
      [0xe6f4ff,0x9bc8ff,0xffe6b8,0xffffff,0x7aa8e8],
      [0xffdc9c,0xffb468,0xfff4dc,0xe89b6c,0xc9dcff],
      [0xc6f4de,0x98dceb,0xffeac2,0xe4f7ee,0x84c4b8]
    ][i%3],tint=new THREE.Color();

    for(let j=0;j<starCount;j++){
      let x=0,y=0,z=0,sz=.55+Math.pow(rand(),2.0)*1.15;
      if(i===0){
        // Outer Kuiper ice-crystal belt (r=0.96..1.14) + subtle binary tidal stream
        if(rand()<.12){
          const t=(rand()-.5)*2;x=t*.12+normal()*.018;z=Math.sin(t*2.4)*.045+normal()*.018;y=normal()*.014;
        }else{
          const a=rand()*Math.PI*2,rr=.98+rand()*.16+normal()*.025;
          x=Math.cos(a)*rr;z=Math.sin(a)*rr*.96;y=normal()*.02;
        }
      }else if(i===1){
        // Fine golden asteroid belt between Planet 01 and Planet 02 (r=0.60..0.66)
        const a=rand()*Math.PI*2,rr=.60+rand()*.06+normal()*.015;
        x=Math.cos(a)*rr;z=Math.sin(a)*rr*.96;y=normal()*.015+x*.04;
      }else{
        // Translucent protoplanetary dust rings at r=0.33 and r=0.96
        const a=rand()*Math.PI*2,rr=(rand()<.45?.33:.96)+normal()*.03;
        x=Math.cos(a)*rr;z=Math.sin(a)*rr*.95;y=normal()*.018;
      }
      points[j*3]=x;points[j*3+1]=y;points[j*3+2]=z;
      sizes[j]=sz;
      tint.setHex(palette[j%palette.length]);
      const intensity=.35+.45*rand();
      tints[j*3]=tint.r*intensity;tints[j*3+1]=tint.g*intensity;tints[j*3+2]=tint.b*intensity;
    }

    for(let k=0;k<nebCount;k++){
      const src=((k*6+1)%starCount)*3;
      nebPoints[k*3]=points[src]+(rand()-.5)*.06;
      nebPoints[k*3+1]=points[src+1]+(rand()-.5)*.025;
      nebPoints[k*3+2]=points[src+2]+(rand()-.5)*.06;
      tint.setHex(palette[k%palette.length]);
      const nebMult=i===2?.22:.14;
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

    // Build 4 Orbiting 3D Planets per system (pIdx 0 and 1 are the 2 photo-beacon planets; pIdx 2 and 3 are inner/outer companion planets)
    const planets=[],beacons=[];
    for(let pIdx=0;pIdx<4;pIdx++){
      const pHolder=new THREE.Group();
      let orbitRx,orbitRz,orbitSpeed,baseAngle,tiltX=0,tiltZ=0,planetObj,ringObj=null,moonObj=null,tailMat=null;

      if(i===0){
        if(pIdx===0){
          // Photo 01 Planet: Ocean & Glacial World with silver moon
          orbitRx=.44;orbitRz=.42;orbitSpeed=.36;baseAngle=.65;
          planetObj=createLitPlanet(.058,0x8eceff,0x08162a,0xd8f0ff,.20);
          const moon=createLitPlanet(.018,0xe8f2ff,0x142238,0xffffff,.05);
          moon.mesh.position.set(.105,.016,0);
          pHolder.add(moon.mesh);
          moonObj=moon;
        }else if(pIdx===1){
          // Photo 02 Planet: Outer Saturnian Ice-Ringed Giant
          orbitRx=.76;orbitRz=.72;orbitSpeed=.21;baseAngle=-1.15;tiltX=.06;tiltZ=-.05;
          planetObj=createLitPlanet(.076,0xd0e8ff,0x0b1c34,0xffe8b8,.25);
          ringObj=createPlanetaryRing(.105,.225,0xffecc4,0x8cc2ff,.42,-.24);
          pHolder.add(ringObj.mesh);
        }else if(pIdx===2){
          // Inner rocky ice world
          orbitRx=.25;orbitRz=.24;orbitSpeed=.58;baseAngle=2.2;
          planetObj=createLitPlanet(.028,0xbfd8f2,0x0c1828,0xdcecff,.10);
        }else{
          // Outer deep-blue Neptune world
          orbitRx=1.06;orbitRz=1.02;orbitSpeed=.13;baseAngle=.25;tiltX=-.04;tiltZ=.04;
          planetObj=createLitPlanet(.042,0x6ea8e8,0x071224,0xb4d8ff,.18);
        }
      }else if(i===1){
        if(pIdx===0){
          // Photo 01 Planet: Warm Desert-Gold Crescent World
          orbitRx=.46;orbitRz=.44;orbitSpeed=.34;baseAngle=.45;tiltX=-.05;tiltZ=.04;
          planetObj=createLitPlanet(.062,0xffcf86,0x1c0f06,0xffeab8,.22);
        }else if(pIdx===1){
          // Photo 02 Planet: Inclined Amber Ringed Giant with Shepherd Moon
          orbitRx=.80;orbitRz=.76;orbitSpeed=.19;baseAngle=-1.45;tiltX=.18;tiltZ=.14;
          planetObj=createLitPlanet(.078,0xffb86c,0x1f1008,0xffdf9e,.26);
          ringObj=createPlanetaryRing(.108,.215,0xffe4a8,0xd98a4e,-.36,.28);
          pHolder.add(ringObj.mesh);
          const moon=createLitPlanet(.019,0xffe8c2,0x241408,0xffd28a,.08);
          moon.mesh.position.set(-.12,.02,.04);
          pHolder.add(moon.mesh);
          moonObj=moon;
        }else if(pIdx===2){
          // Inner scorched amber world
          orbitRx=.26;orbitRz=.25;orbitSpeed=.62;baseAngle=-.8;tiltX=.10;tiltZ=-.06;
          planetObj=createLitPlanet(.030,0xffdfa8,0x221208,0xfff0c8,.12);
        }else{
          // Outer twilight bronze world
          orbitRx=1.08;orbitRz=1.02;orbitSpeed=.12;baseAngle=1.85;tiltX=-.20;tiltZ=.10;
          planetObj=createLitPlanet(.044,0xd89864,0x160b05,0xffcfa0,.16);
        }
      }else{
        if(pIdx===0){
          // Photo 01 Planet: Forest-Emerald World with Gossamer Ring & Moon
          orbitRx=.45;orbitRz=.43;orbitSpeed=.31;baseAngle=-.55;tiltX=.03;tiltZ=-.03;
          planetObj=createLitPlanet(.064,0x8ee6c8,0x07201c,0xcffaea,.22);
          ringObj=createPlanetaryRing(.086,.145,0xc6f4de,0x7fc4b8,.30,.18);
          pHolder.add(ringObj.mesh);
          const moon=createLitPlanet(.017,0xd4f7ea,0x0b2622,0xffffff,.05);
          moon.mesh.position.set(.102,.014,-.02);
          pHolder.add(moon.mesh);
          moonObj=moon;
        }else if(pIdx===1){
          // Photo 02 Planet: Eccentric Great Comet / Ice-Jade Wanderer with long curved dust & ion tail
          orbitRx=.84;orbitRz=.64;orbitSpeed=.22;baseAngle=1.15;tiltX=-.15;tiltZ=.18;
          planetObj=createLitPlanet(.052,0xd6faee,0x0a2426,0xffecc4,.14);
          const tCount=580,tPos=new Float32Array(tCount*3),tCol=new Float32Array(tCount*3);
          for(let tc=0;tc<tCount;tc++){
            const u=Math.pow(rand(),.72);
            const len=u*.52;
            const curve=-u*u*.26;
            const spread=(rand()-.5)*(.014+u*.082);
            tPos[tc*3]=len+spread*.4;
            tPos[tc*3+1]=(rand()-.5)*(.01+u*.04);
            tPos[tc*3+2]=curve+spread;
            const fade=Math.pow(1-u,1.5);
            const isIon=tc%3===0;
            tCol[tc*3]=(isIon?.58:.98)*fade;
            tCol[tc*3+1]=(isIon?.94:.94)*fade;
            tCol[tc*3+2]=(isIon?.96:.76)*fade;
          }
          const tGeo=new THREE.BufferGeometry();
          tGeo.setAttribute('position',new THREE.BufferAttribute(tPos,3));
          tGeo.setAttribute('color',new THREE.BufferAttribute(tCol,3));
          tailMat=new THREE.ShaderMaterial({
            transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
            uniforms:{scale:{value:dpr},opacity:{value:0}},
            vertexShader:'varying vec3 vColor;uniform float scale;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(17.0*scale/(-p.z),1.2,5.2);gl_Position=projectionMatrix*p;}',
            fragmentShader:'varying vec3 vColor;uniform float opacity;void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.5)discard;float a=pow(1.0-d*2.0,1.8)*opacity*.88;gl_FragColor=vec4(vColor,a);\n#include <colorspace_fragment>\n}'
          });
          const tailMesh=new THREE.Points(tGeo,tailMat);
          pHolder.add(tailMesh);
          disposables.push(tGeo,tailMat);
        }else if(pIdx===2){
          // Inner misty jade world
          orbitRx=.25;orbitRz=.24;orbitSpeed=.56;baseAngle=1.4;
          planetObj=createLitPlanet(.028,0xb8f0dc,0x08201c,0xe0fff4,.10);
        }else{
          // Outer cyan-gold world
          orbitRx=1.08;orbitRz=1.02;orbitSpeed=.13;baseAngle=-2.2;tiltX=.05;tiltZ=.04;
          planetObj=createLitPlanet(.042,0x82c8be,0x071a1c,0xffe8b8,.16);
        }
      }

      pHolder.add(planetObj.mesh);
      let bSprite=null;
      if(pIdx<2){
        const bMat=new THREE.SpriteMaterial({map:spikeTexture,color:pIdx===0?0xfff3d1:0xdcebff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
        bSprite=new THREE.Sprite(bMat);
        bSprite.scale.setScalar(.24);
        pHolder.add(bSprite);
        beacons.push(bSprite);
        disposables.push(bMat);
      }

      const orbitPlane=new THREE.Group();
      orbitPlane.rotation.set(tiltX,0,tiltZ);
      orbitPlane.add(pHolder);
      sub.add(orbitPlane);

      planets.push({holder:pHolder,planetObj,ringObj,moonObj,tailMat,orbitRx,orbitRz,orbitSpeed,baseAngle,beacon:bSprite,photoIdx:pIdx<2?pIdx:-1});
    }

    hit.userData.index=i;
    group.add(sprite,sub,hit);
    group.userData={sprite,mini,neb:nebPointsMesh,coreGlow,starPivot,starMaterials,orbitLines,planets,beacons,viewDir:viewDirs[i%3]};
    const r=4.6+i*1.35,a=(i%2)*Math.PI+.41+1.35*Math.log(r/1.5);
    group.position.set(Math.cos(a)*r,.18+i*.2,Math.sin(a)*r);
    galaxy.add(group);markers.push(group);pickTargets.push(hit);
    disposables.push(nebGeometry,nebMaterial);
  }

  const cursor=new THREE.Vector2(),raycaster=new THREE.Raycaster();let pointerIn=false,hoverArmed=false,selected=-1,activeFrame=0,hoveredFrame=-1,frame=0,disposed=false,down=null,zoomTarget=null,focusIndex=-1,orienting=false,lastTime=null,locked=-1,lockedWorld=new THREE.Vector3();const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const onChange=e=>{if(e.detail&&typeof e.detail.selected==='number')activeFrame=e.detail.selected;};root.addEventListener('cosmos-change',onChange);
  const onFrameHover=e=>{const btn=e.target.closest('[data-frame]');hoveredFrame=btn?Number(btn.dataset.frame):-1;};
  const onFrameLeave=()=>{hoveredFrame=-1;};
  root.addEventListener('pointerover',onFrameHover);root.addEventListener('pointerout',onFrameLeave);
  const onPointer=e=>{const r=canvas.getBoundingClientRect();cursor.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);if(e.pointerType==='mouse'){pointerIn=true;hoverArmed=true;}};
  const leave=()=>{pointerIn=false;hoverArmed=false;locked=-1;canvas.style.cursor='grab';};canvas.addEventListener('pointermove',onPointer);canvas.addEventListener('pointerleave',leave);
  const onDown=e=>{onPointer(e);down={x:e.clientX,y:e.clientY};canvas.focus({preventScroll:true});};const onUp=e=>{onPointer(e);if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<7)pick();down=null;};canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',leave);
  const onFocus=e=>{if(e.target.closest('.cosmos-panel'))hoverArmed=false;};root.addEventListener('focusin',onFocus);
  const wheelGuard=e=>{if(document.activeElement!==canvas)e.stopImmediatePropagation();else{zoomTarget=null;orienting=false;}};canvas.addEventListener('wheel',wheelGuard,{capture:true});
  const controlStart=()=>{if(userInteracting){zoomTarget=null;orienting=false;}};controls.addEventListener('start',controlStart);
  let userInteracting=false;
  const onControlDown=()=>{userInteracting=true;};const onControlUp=()=>{userInteracting=false;};
  canvas.addEventListener('pointerdown',onControlDown,{capture:true});window.addEventListener('pointerup',onControlUp,{capture:true});
  function hitMarker(){scene.updateMatrixWorld(true);camera.updateMatrixWorld();raycaster.setFromCamera(cursor,camera);return raycaster.intersectObjects(pickTargets.filter(s=>s.parent.visible))[0];}
  function focus(index){if(index<0||index>=markers.length)return;focusIndex=index;locked=-1;hoverArmed=false;selected=index;zoomTarget=1.95;orienting=true;root.dispatchEvent(new CustomEvent('cosmos-pick',{detail:{index}}));}const onSelect=e=>focus(e.detail.index);root.addEventListener('cosmos-focus',onSelect);function pick(){const hit=hitMarker();if(hit){focus(hit.object.userData.index);return true;}return false;}
  const zoom=e=>{const button=e.target.closest('[data-zoom]');if(!button)return;const action=button.dataset.zoom;if(action==='reset'){orienting=false;focusIndex=-1;locked=-1;zoomTarget=null;camera.position.set(0,9,19);controls.target.set(0,0,0);controls.update();}else{orienting=false;const distance=zoomTarget??camera.position.distanceTo(controls.target);zoomTarget=THREE.MathUtils.clamp(distance*(action==='in'?.72:1.38),controls.minDistance,controls.maxDistance);}};root.addEventListener('click',zoom);

  // Screen-space light deflection samples the actual rendered star field around the projected core.
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
  }`});lensScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),lensMaterial));

  const resize=()=>{const width=area.clientWidth,height=area.clientHeight;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);target.setSize(Math.max(1,Math.floor(width*renderer.getPixelRatio())),Math.max(1,Math.floor(height*renderer.getPixelRatio())));lensMaterial.uniforms.aspect.value=width/height;};const observer=new ResizeObserver(resize);observer.observe(area);resize();
  let effectTime=0;
  const tick=time=>{
    if(disposed)return;
    frame=requestAnimationFrame(tick);
    const dt=lastTime===null?0:Math.min((time-lastTime)/1000,.05);
    lastTime=time;
    if(!document.hidden){
      const audioBoost=window.__qzAudioEnergy||0;
      if(!reduced.matches){
        galaxy.rotation.y+=(focusIndex>=0?.014:.046)*dt;
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
          const offset=camera.position.clone().sub(controls.target),curDist=offset.length(),goalDist=zoomTarget??1.95,nextDist=THREE.MathUtils.lerp(curDist,goalDist,1-Math.exp(-6.0*dt));
          const viewDir=markers[focusIndex].userData.viewDir||new THREE.Vector3(.22,.64,.74).normalize();
          const desired=viewDir.clone().multiplyScalar(nextDist);
          offset.lerp(desired,1-Math.exp(-6.0*dt));
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
      if(locked>=0){galaxy.worldToLocal(markers[locked].position.copy(lockedWorld));scene.updateMatrixWorld(true);}
      if(pointerIn&&hoverArmed&&!down){
        const hit=hitMarker(),index=hit?hit.object.userData.index:-1;
        canvas.style.cursor=hit?'pointer':'grab';
        if(index!==locked){locked=index;if(index>=0){markers[index].getWorldPosition(lockedWorld);selected=index;root.dispatchEvent(new CustomEvent('cosmos-pick',{detail:{index}}));}}
      }

      const visibility=focusIndex>=0?.025:1;
      starsMaterial.uniforms.visibility.value=THREE.MathUtils.lerp(starsMaterial.uniforms.visibility.value,visibility,1-Math.exp(-4.5*dt));
      cloudMaterial.uniforms.visibility.value=starsMaterial.uniforms.visibility.value;
      haloMat.uniforms.visibility.value=THREE.MathUtils.lerp(haloMat.uniforms.visibility.value,focusIndex>=0?.22:1,1-Math.exp(-4.5*dt));
      deepMat.uniforms.visibility.value=THREE.MathUtils.lerp(deepMat.uniforms.visibility.value,focusIndex>=0?.65:1,1-Math.exp(-4.5*dt));
      coreMaterial.opacity=(.42+audioBoost*.16)*starsMaterial.uniforms.visibility.value;
      core.scale.setScalar(3.3+audioBoost*.45);

      markers.forEach((m,i)=>{
        const isFocus=i===focusIndex,isLock=i===locked;
        const spriteGoal=isFocus?.06:(isLock?.54:.26);
        m.userData.sprite.material.opacity=THREE.MathUtils.lerp(m.userData.sprite.material.opacity,spriteGoal,1-Math.exp(-6*dt));

        const goal=isFocus?.98:(isLock?.14:0);
        const curOp=THREE.MathUtils.lerp(m.userData.mini.material.uniforms.opacity.value,goal,1-Math.exp(-5.5*dt));
        m.userData.mini.material.uniforms.opacity.value=curOp;
        m.userData.mini.material.uniforms.time.value=effectTime;
        m.userData.neb.material.uniforms.opacity.value=curOp;
        m.userData.coreGlow.material.opacity=curOp*(.34+audioBoost*.12);

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
          p.planetObj.mat.uniforms.lightDir.value.set(-px,.14,-pz).normalize();
          p.planetObj.mat.uniforms.opacity.value=curOp;
          if(p.ringObj)p.ringObj.mat.uniforms.opacity.value=curOp;
          if(p.moonObj){
            const mAngle=effectTime*1.35+p.baseAngle;
            p.moonObj.mesh.position.set(Math.cos(mAngle)*.105,.014*Math.sin(mAngle),Math.sin(mAngle)*.105);
            p.moonObj.mat.uniforms.lightDir.value.set(-px,.14,-pz).normalize();
            p.moonObj.mat.uniforms.opacity.value=curOp;
          }
          if(p.tailMat){
            p.holder.rotation.y=-angle;
            p.tailMat.uniforms.opacity.value=curOp;
          }
          if(p.beacon){
            const highlight=isFocus&&(p.photoIdx===hoveredFrame||p.photoIdx===activeFrame);
            const bGoal=isFocus?(highlight?.95:.42):0;
            p.beacon.material.opacity=THREE.MathUtils.lerp(p.beacon.material.opacity,bGoal,1-Math.exp(-6*dt));
            const bScale=highlight?(.28+.035*Math.sin(effectTime*5)):.16;
            p.beacon.scale.setScalar(THREE.MathUtils.lerp(p.beacon.scale.x,bScale,1-Math.exp(-6*dt)));
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
  return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.removeEventListener('start',controlStart);canvas.removeEventListener('pointerdown',onControlDown,{capture:true});window.removeEventListener('pointerup',onControlUp,{capture:true});controls.dispose();root.removeEventListener('cosmos-change',onChange);root.removeEventListener('cosmos-focus',onSelect);root.removeEventListener('pointerover',onFrameHover);root.removeEventListener('pointerout',onFrameLeave);root.removeEventListener('focusin',onFocus);root.removeEventListener('click',zoom);canvas.removeEventListener('wheel',wheelGuard,{capture:true});canvas.removeEventListener('pointermove',onPointer);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('pointercancel',leave);geometry.dispose();starsMaterial.dispose();cloudGeometry.dispose();cloudMaterial.dispose();markers.forEach(s=>{s.userData.sprite.material.dispose();s.userData.mini.geometry.dispose();s.userData.mini.material.dispose();});disposables.forEach(d=>d.dispose());target.dispose();lensMaterial.dispose();pickGeometry.dispose();pickMaterial.dispose();holeGeometry.dispose();holeMaterial.dispose();waveGeometry.dispose();waves.forEach(w=>w.material.dispose());coreMaterial.dispose();glowTexture.dispose();spikeTexture.dispose();renderer.dispose();};
}
