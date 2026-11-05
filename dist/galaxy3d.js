import * as THREE from './vendor/three/three.module.js';
import {OrbitControls} from './vendor/three/OrbitControls.js';

export function mountGalaxy(root,archive){
  const canvas=root.querySelector('.cosmos-canvas'),area=root.querySelector('.cosmos-scene');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});}
  catch(error){root.querySelector('.cosmos-fallback').hidden=false;return ()=>{};}
  const dpr=Math.min(devicePixelRatio||1,1.5);
  renderer.setPixelRatio(dpr);renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1,.1,120);
  camera.position.set(0,9,19);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.06;controls.enablePan=false;controls.enableZoom=true;controls.minDistance=1.45;controls.maxDistance=38;controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI-.15;
  controls.touches.ONE=THREE.TOUCH.ROTATE;controls.touches.TWO=THREE.TOUCH.DOLLY_ROTATE;
  const galaxy=new THREE.Group();scene.add(galaxy);
  const count=26000,positions=new Float32Array(count*3),colors=new Float32Array(count*3),color=new THREE.Color();
  function compose(index){
    let seed=57121+index*4099;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
    const stellarColors=[0xb5d2ff,0xe1e8ff,0xfff0d4,0xffd59f,0xf6bdb2];
    const normal=()=>rand()+rand()+rand()+rand()-2;
    for(let i=0;i<count;i++){
      let x,y,z,radius,armStar=false;
      const choice=rand();
      if(choice<.28){ // warm, elongated central bar and thick bulge
        const bulge=choice<.15;x=normal()*(bulge?.8:1.75);z=normal()*(bulge?.65:.48);y=normal()*(bulge?.48:.23);
      }else if(choice<.52){ // diffuse stellar disk between the arms
        radius=Math.min(10.5,Math.sqrt(rand())*10.5);const a=rand()*Math.PI*2;x=Math.cos(a)*radius;z=Math.sin(a)*radius;y=normal()*(.12+radius*.018);
      }else{ // two broad main arms, with imperfect spurs and clumps
        armStar=true;const arm=i%2;radius=1.5+Math.pow(rand(),.86)*8.8;let theta=arm*Math.PI+.41+1.35*Math.log(radius/1.5);
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
  // Broad, low-brightness gas clouds soften the stellar disk without flattening it.
  const cloudCount=1800,cloudPositions=new Float32Array(cloudCount*3),cloudColors=new Float32Array(cloudCount*3);
  for(let i=0;i<cloudCount;i++){const source=(Math.floor((i+.37)*count/cloudCount)%count)*3;cloudPositions.set(positions.subarray(source,source+3),i*3);const warm=i%5===0;cloudColors.set(warm?[.23,.12,.08]:[.08,.15,.24],i*3);}
  const cloudGeometry=new THREE.BufferGeometry();cloudGeometry.setAttribute('position',new THREE.BufferAttribute(cloudPositions,3));cloudGeometry.setAttribute('color',new THREE.BufferAttribute(cloudColors,3));
  const cloudMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,uniforms:{scale:{value:dpr},visibility:{value:1}},vertexShader:'varying vec3 vColor;uniform float scale;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(240.*scale/(-p.z),2.,40.);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 vColor;uniform float visibility;void main(){float d=length(gl_PointCoord-vec2(.5));float a=pow(max(0.,1.-d*2.),2.);gl_FragColor=vec4(vColor,a*.16*visibility);}'});
  galaxy.add(new THREE.Points(cloudGeometry,cloudMaterial));
  const dust=new THREE.Points(geometry,starsMaterial);galaxy.add(dust);
  const spriteCanvas=document.createElement('canvas');spriteCanvas.width=spriteCanvas.height=128;const c=spriteCanvas.getContext('2d'),g=c.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,250,217,1)');g.addColorStop(.08,'rgba(255,230,157,.95)');g.addColorStop(.2,'rgba(238,203,120,.4)');g.addColorStop(1,'rgba(221,195,125,0)');c.fillStyle=g;c.fillRect(0,0,128,128);const glowTexture=new THREE.CanvasTexture(spriteCanvas);
  // Diffraction spike star texture for photo beacon stars inside each sub-galaxy
  const spikeCanvas=document.createElement('canvas');spikeCanvas.width=spikeCanvas.height=128;const sc=spikeCanvas.getContext('2d'),sg=sc.createRadialGradient(64,64,0,64,64,58);sg.addColorStop(0,'rgba(255,252,240,1)');sg.addColorStop(.12,'rgba(255,235,185,.82)');sg.addColorStop(.32,'rgba(230,200,140,.22)');sg.addColorStop(1,'rgba(230,200,140,0)');sc.fillStyle=sg;sc.fillRect(0,0,128,128);
  sc.translate(64,64);for(let k=0;k<2;k++){const lg=sc.createLinearGradient(-58,0,58,0);lg.addColorStop(0,'rgba(255,245,215,0)');lg.addColorStop(.44,'rgba(255,245,215,.35)');lg.addColorStop(.5,'rgba(255,255,255,.95)');lg.addColorStop(.56,'rgba(255,245,215,.35)');lg.addColorStop(1,'rgba(255,245,215,0)');sc.fillStyle=lg;sc.fillRect(-58,-1.1,116,2.2);sc.rotate(Math.PI/2);}
  const spikeTexture=new THREE.CanvasTexture(spikeCanvas);
  const coreMaterial=new THREE.SpriteMaterial({map:glowTexture,color:0xffdfa4,transparent:true,opacity:.42,depthWrite:false,blending:THREE.AdditiveBlending});const core=new THREE.Sprite(coreMaterial);core.scale.set(3.3,3.3,1);galaxy.add(core);
  // The black hole and outward ripples are deliberately schematic, not an astrophysical simulation.
  const holeGeometry=new THREE.SphereGeometry(.001,8,6),holeMaterial=new THREE.MeshBasicMaterial({color:0x010208});const hole=new THREE.Mesh(holeGeometry,holeMaterial);galaxy.add(hole);
  const waveGeometry=new THREE.BufferGeometry().setFromPoints(Array.from({length:129},(_,i)=>{const a=i*Math.PI*2/128;return new THREE.Vector3(Math.cos(a),.01,Math.sin(a));}));const waves=[];for(let i=0;i<3;i++){const material=new THREE.LineBasicMaterial({color:0x9dbcd3,transparent:true,opacity:0,depthWrite:false});const ring=new THREE.Line(waveGeometry,material);ring.userData.phase=i/3;waves.push(ring);}
  const markers=[],pickTargets=[],disposables=[],pickGeometry=new THREE.SphereGeometry(.72,12,8),pickMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false});
  // Three distinct morphological sub-galaxies with volumetric clouds, inclined planes, and photo-frame beacon stars.
  const tilts=[[.38,.12,-.28],[-.24,.22,.34],[.16,-.32,.20]];
  const viewDirs=[new THREE.Vector3(.26,.64,.72).normalize(),new THREE.Vector3(-.22,.72,.66).normalize(),new THREE.Vector3(.18,.68,.71).normalize()];
  for(let i=0;i<archive.works.length;i++){
    const group=new THREE.Group(),sub=new THREE.Group();
    sub.rotation.set(tilts[i%3][0],tilts[i%3][1],tilts[i%3][2]);
    const markerColor=[0xffdfaa,0xffcfa0,0xbbe0ff][i%3];
    const material=new THREE.SpriteMaterial({map:glowTexture,color:markerColor,transparent:true,opacity:.68,depthWrite:false,blending:THREE.AdditiveBlending});
    const sprite=new THREE.Sprite(material),hit=new THREE.Mesh(pickGeometry,pickMaterial);
    const coreGlowMat=new THREE.SpriteMaterial({map:glowTexture,color:[0xdbeeff,0xffe0a6,0xc8f0e4][i%3],transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
    const coreGlow=new THREE.Sprite(coreGlowMat);coreGlow.scale.setScalar(i===2?1.25:.95);sub.add(coreGlow);disposables.push(coreGlowMat);
    const starCount=5600,points=new Float32Array(starCount*3),tints=new Float32Array(starCount*3),sizes=new Float32Array(starCount);
    const nebCount=460,nebPoints=new Float32Array(nebCount*3),nebTints=new Float32Array(nebCount*3);
    let seed=8383+i*7103;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;},normal=()=>rand()+rand()+rand()+rand()-2;
    const palette=[
      [0xe6f2ff,0x9bc5ff,0xffe4b5,0xffffff,0x7aa8e8], // P-001: Water & Mountain — cool reflection blue & glacial silver-gold
      [0xffd591,0xffb067,0xfff2d6,0xe89b6c,0xc9dcff], // P-002: Shape of Light — warm desert gold, amber & dusk
      [0xc8f2dc,0x9ad8eb,0xffe9be,0xe4f7ee,0x89b8d6]  // P-003: Long Afternoon — forest mist emerald, cyan & sunbeam gold
    ][i%3],tint=new THREE.Color();
    for(let j=0;j<starCount;j++){
      let x,y,z,sz=.65+Math.pow(rand(),2.2)*1.65;
      if(i===0){
        // Barred spiral with reflection ring and outer tidal streams
        const p=rand();
        if(p<.22){
          const along=(rand()-.5)*.78;x=along+normal()*.11;z=along*.32+normal()*.08;y=normal()*.065;sz*=1.18;
        }else if(p<.36){
          const a=rand()*Math.PI*2,rr=.34+normal()*.055;x=Math.cos(a)*rr;z=Math.sin(a)*rr*.82;y=normal()*.035;
        }else{
          const arm=j%2,u=Math.pow(rand(),.76),r=.26+u*1.32;
          let theta=arm*Math.PI+1.42*Math.log(r/.26)+.14*Math.sin(r*5.5+arm*3.1);
          if(rand()<.25)theta+=(rand()-.5)*.45; // feather spurs
          const spread=normal()*(.07+.10*r),rr=r+normal()*(.04+.08*r);
          x=Math.cos(theta+spread)*rr;z=Math.sin(theta+spread)*rr*.84;y=normal()*(.032+.042*r)+Math.sin(theta*2)*.025*r;
        }
      }else if(i===1){
        // Grand-design sculpted dual-spiral with swept dust lanes and warm golden wind streams
        const p=rand();
        if(p<.24){
          const r=Math.pow(rand(),1.4)*.28,a=rand()*Math.PI*2;x=Math.cos(a)*r+normal()*.06;z=Math.sin(a)*r+normal()*.06;y=normal()*.065*(1-r);sz*=1.2;
        }else{
          const mainArm=j%3===0?2:(j%2);
          const u=Math.pow(rand(),.72),r=.16+u*1.18;
          const baseAngle=mainArm===2?1.15:(mainArm*Math.PI);
          const wind=mainArm===2?2.05:1.68;
          let theta=baseAngle+wind*Math.log(r/.16)+.18*Math.sin(r*5.2);
          // Dust-lane split: push stars slightly off the dark lane center
          const ridge=(rand()<.5?-1:1)*(.025+.04*r)+normal()*(.045+.075*r);
          const rr=r+normal()*(.035+.065*r);
          x=Math.cos(theta+ridge)*rr;z=Math.sin(theta+ridge)*rr;y=normal()*(.022+.032*r);
          if(mainArm===2)sz*=.82;
        }
      }else{
        // Multi-arm flocculent nebula galaxy with soft star-forming knots and misty outer streams
        const p=rand();
        if(p<.20){
          const r=Math.pow(rand(),1.6)*.22,a=rand()*Math.PI*2;
          x=Math.cos(a)*r+normal()*.065;z=Math.sin(a)*r+normal()*.065;y=normal()*.045;
        }else if(p<.68){
          const arm=j%4,u=Math.pow(rand(),.82),r=.15+u*1.08;
          let theta=arm*(Math.PI/2)+1.25*Math.log(r/.15)+.28*Math.sin(r*4.5+arm*1.7);
          const spread=normal()*(.09+.13*r),rr=r+normal()*(.05+.09*r);
          x=Math.cos(theta+spread)*rr;z=Math.sin(theta+spread)*rr*.9;y=normal()*(.035+.05*r);
        }else{
          // Soft HII-like star-forming knots embedded along the misty arms
          const knots=[[.34,.02,-.21],[-.38,-.02,.24],[.16,-.01,.44],[-.24,.02,-.38],[.48,.01,.18],[-.46,-.01,-.16]];
          const kn=knots[j%knots.length],rad=(.04+Math.pow(rand(),1.1)*.18),a=rand()*Math.PI*2;
          x=kn[0]+Math.cos(a)*rad+normal()*.055;z=kn[2]+Math.sin(a)*rad+normal()*.055;y=kn[1]+normal()*.032;
        }
      }
      points[j*3]=x;points[j*3+1]=y;points[j*3+2]=z;
      sizes[j]=sz;
      const cIdx=Math.floor(Math.pow(rand(),1.15)*palette.length)%palette.length;
      tint.setHex(palette[cIdx]);
      const rDist=Math.hypot(x,z),coreBoost=Math.max(0,1-rDist/.45)*.32;
      const intensity=.38+.52*rand()+coreBoost;
      tints[j*3]=tint.r*intensity;tints[j*3+1]=tint.g*intensity;tints[j*3+2]=tint.b*intensity;
    }
    for(let k=0;k<nebCount;k++){
      const src=((k*11+3)%starCount)*3;
      nebPoints[k*3]=points[src]+(rand()-.5)*.09;
      nebPoints[k*3+1]=points[src+1]+(rand()-.5)*.04;
      nebPoints[k*3+2]=points[src+2]+(rand()-.5)*.09;
      const cIdx=k%palette.length;tint.setHex(palette[cIdx]);
      nebTints[k*3]=tint.r*.36;nebTints[k*3+1]=tint.g*.36;nebTints[k*3+2]=tint.b*.36;
    }
    const miniGeometry=new THREE.BufferGeometry();
    miniGeometry.setAttribute('position',new THREE.BufferAttribute(points,3));
    miniGeometry.setAttribute('color',new THREE.BufferAttribute(tints,3));
    miniGeometry.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));
    const miniMaterial=new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
      uniforms:{scale:{value:dpr},opacity:{value:0},time:{value:0}},
      vertexShader:'attribute float aSize;varying vec3 vColor;varying float vTwinkle;uniform float scale;uniform float time;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.0);float tw=.88+.12*sin(time*2.2+position.x*13.0+position.z*9.0);vTwinkle=tw;gl_PointSize=clamp(14.5*aSize*scale/(-p.z),1.1,6.8);gl_Position=projectionMatrix*p;}',
      fragmentShader:'varying vec3 vColor;varying float vTwinkle;uniform float opacity;void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.5)discard;float core=exp(-d*d*18.0);float halo=pow(max(0.0,1.0-d*2.0),2.2);float a=(core*.75+halo*.45)*opacity*vTwinkle;gl_FragColor=vec4(vColor*(.85+core*.55),a);\n#include <colorspace_fragment>\n}'
    });
    const nebGeometry=new THREE.BufferGeometry();
    nebGeometry.setAttribute('position',new THREE.BufferAttribute(nebPoints,3));
    nebGeometry.setAttribute('color',new THREE.BufferAttribute(nebTints,3));
    const nebMaterial=new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
      uniforms:{scale:{value:dpr},opacity:{value:0}},
      vertexShader:'varying vec3 vColor;uniform float scale;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(95.0*scale/(-p.z),4.0,36.0);gl_Position=projectionMatrix*p;}',
      fragmentShader:'varying vec3 vColor;uniform float opacity;void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.5)discard;float a=pow(max(0.0,1.0-d*2.0),2.4)*.15*opacity;gl_FragColor=vec4(vColor,a);\n#include <colorspace_fragment>\n}'
    });
    const nebPointsMesh=new THREE.Points(nebGeometry,nebMaterial);
    const mini=new THREE.Points(miniGeometry,miniMaterial);
    // Photo-frame beacon stars with gentle diffraction spikes
    const workPhotos=archive.works[i].photos||[];
    const beacons=[];
    const beaconCoords=[[-.28,.04,.16],[.31,-.03,-.18],[.05,.06,-.34],[-.19,-.02,-.28]];
    for(let pIdx=0;pIdx<workPhotos.length;pIdx++){
      const bMat=new THREE.SpriteMaterial({map:spikeTexture,color:pIdx===0?0xfff3d1:0xdcebff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
      const bSprite=new THREE.Sprite(bMat);
      const bc=beaconCoords[pIdx%beaconCoords.length];
      bSprite.position.set(bc[0],bc[1],bc[2]);
      bSprite.scale.setScalar(.22);
      sub.add(bSprite);beacons.push(bSprite);disposables.push(bMat);
    }
    sub.add(nebPointsMesh,mini);
    hit.userData.index=i;sprite.scale.setScalar(.28);
    group.add(sprite,sub,hit);
    group.userData={sprite,mini,neb:nebPointsMesh,coreGlow,beacons,viewDir:viewDirs[i%3]};
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
  function focus(index){if(index<0||index>=markers.length)return;focusIndex=index;locked=-1;hoverArmed=false;selected=index;zoomTarget=2.45;orienting=true;root.dispatchEvent(new CustomEvent('cosmos-pick',{detail:{index}}));}const onSelect=e=>focus(e.detail.index);root.addEventListener('cosmos-focus',onSelect);function pick(){const hit=hitMarker();if(hit){focus(hit.object.userData.index);return true;}return false;}
  const zoom=e=>{const button=e.target.closest('[data-zoom]');if(!button)return;const action=button.dataset.zoom;if(action==='reset'){orienting=false;focusIndex=-1;locked=-1;zoomTarget=null;camera.position.set(0,9,19);controls.target.set(0,0,0);controls.update();}else{orienting=false;const distance=zoomTarget??camera.position.distanceTo(controls.target);zoomTarget=THREE.MathUtils.clamp(distance*(action==='in'?.72:1.38),controls.minDistance,controls.maxDistance);}};root.addEventListener('click',zoom);
  // Screen-space light deflection samples the actual rendered star field around the projected core.
  const target=new THREE.WebGLRenderTarget(1,1),lensScene=new THREE.Scene(),lensCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  // Artistic ray integration with turbulent FBM accretion filaments, Doppler beaming, and thin relativistic photon ring.
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
  let effectTime=0;const tick=time=>{if(disposed)return;frame=requestAnimationFrame(tick);const dt=lastTime===null?0:Math.min((time-lastTime)/1000,.05);lastTime=time;if(!document.hidden){const audioBoost=window.__qzAudioEnergy||0;if(!reduced.matches){galaxy.rotation.y+=(focusIndex>=0?.018:.048)*dt;effectTime+=dt;}lensMaterial.uniforms.time.value=effectTime;waves.forEach(w=>{const phase=(effectTime*.12+w.userData.phase)%1;w.scale.setScalar(.25+phase*3);w.material.opacity=reduced.matches?0:Math.sin(phase*Math.PI)*.12;});controls.update();if(focusIndex>=0){galaxy.updateMatrixWorld(true);const wanted=markers[focusIndex].getWorldPosition(new THREE.Vector3()),shift=wanted.clone().sub(controls.target).multiplyScalar(1-Math.exp(-6.5*dt));controls.target.add(shift);camera.position.add(shift);if(orienting){const offset=camera.position.clone().sub(controls.target),curDist=offset.length(),goalDist=zoomTarget??2.45,nextDist=THREE.MathUtils.lerp(curDist,goalDist,1-Math.exp(-4.8*dt));const viewDir=markers[focusIndex].userData.viewDir||new THREE.Vector3(.22,.68,.70).normalize();const desired=viewDir.clone().multiplyScalar(nextDist);offset.lerp(desired,1-Math.exp(-4.5*dt));camera.position.copy(controls.target).add(offset);if(offset.distanceTo(desired)<.02&&wanted.distanceTo(controls.target)<.02){orienting=false;zoomTarget=null;}}controls.update();}if(zoomTarget!==null&&!orienting){const offset=camera.position.clone().sub(controls.target),distance=offset.length(),next=THREE.MathUtils.lerp(distance,zoomTarget,1-Math.exp(-5*dt));camera.position.copy(controls.target).add(offset.setLength(next));controls.update();if(Math.abs(next-zoomTarget)<.01)zoomTarget=null;}scene.updateMatrixWorld(true);camera.updateMatrixWorld();if(locked>=0){galaxy.worldToLocal(markers[locked].position.copy(lockedWorld));scene.updateMatrixWorld(true);}if(pointerIn&&hoverArmed&&!down){const hit=hitMarker(),index=hit?hit.object.userData.index:-1;canvas.style.cursor=hit?'pointer':'grab';if(index!==locked){locked=index;if(index>=0){markers[index].getWorldPosition(lockedWorld);selected=index;root.dispatchEvent(new CustomEvent('cosmos-pick',{detail:{index}}));}}}const visibility=focusIndex>=0?.022:1;starsMaterial.uniforms.visibility.value=THREE.MathUtils.lerp(starsMaterial.uniforms.visibility.value,visibility,1-Math.exp(-3.2*dt));cloudMaterial.uniforms.visibility.value=starsMaterial.uniforms.visibility.value;coreMaterial.opacity=(.42+audioBoost*.16)*starsMaterial.uniforms.visibility.value;core.scale.setScalar(3.3+audioBoost*.45);markers.forEach((m,i)=>{const isFocus=i===focusIndex,isLock=i===locked;const spriteGoal=isFocus?.16:(isLock?.85:.52);m.userData.sprite.material.opacity=THREE.MathUtils.lerp(m.userData.sprite.material.opacity,spriteGoal,1-Math.exp(-5*dt));const goal=isFocus?.96:0;const curOp=THREE.MathUtils.lerp(m.userData.mini.material.uniforms.opacity.value,goal,1-Math.exp(-3.5*dt));m.userData.mini.material.uniforms.opacity.value=curOp;m.userData.mini.material.uniforms.time.value=effectTime;m.userData.neb.material.uniforms.opacity.value=curOp;m.userData.coreGlow.material.opacity=curOp*(.38+audioBoost*.14);m.userData.beacons.forEach((b,bIdx)=>{const highlight=isFocus&&(bIdx===hoveredFrame||bIdx===activeFrame);const bGoal=isFocus?(highlight?.98:.52):0;b.material.opacity=THREE.MathUtils.lerp(b.material.opacity,bGoal,1-Math.exp(-6*dt));const bScale=highlight?(.31+.04*Math.sin(effectTime*5)):.20;b.scale.setScalar(THREE.MathUtils.lerp(b.scale.x,bScale,1-Math.exp(-6*dt)));});});const coreDist=camera.position.length();if(focusIndex>=0||coreDist>=7){renderer.setRenderTarget(null);renderer.render(scene,camera);}else{renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);const projected=new THREE.Vector3(0,0,0).project(camera);lensMaterial.uniforms.center.value.set(projected.x*.5+.5,projected.y*.5+.5);lensMaterial.uniforms.eye.value.copy(camera.position).normalize().multiplyScalar(12.25);lensMaterial.uniforms.right.value.set(1,0,0).applyQuaternion(camera.quaternion);lensMaterial.uniforms.up.value.set(0,1,0).applyQuaternion(camera.quaternion);lensMaterial.uniforms.radius.value=THREE.MathUtils.clamp(.09*4.0/coreDist,.01,.16);lensMaterial.uniforms.strength.value=THREE.MathUtils.clamp((7-coreDist)/2.5,0,1);renderer.render(lensScene,lensCamera);}}};frame=requestAnimationFrame(tick);
  return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.removeEventListener('start',controlStart);canvas.removeEventListener('pointerdown',onControlDown,{capture:true});window.removeEventListener('pointerup',onControlUp,{capture:true});controls.dispose();root.removeEventListener('cosmos-change',onChange);root.removeEventListener('cosmos-focus',onSelect);root.removeEventListener('pointerover',onFrameHover);root.removeEventListener('pointerout',onFrameLeave);root.removeEventListener('focusin',onFocus);root.removeEventListener('click',zoom);canvas.removeEventListener('wheel',wheelGuard,{capture:true});canvas.removeEventListener('pointermove',onPointer);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('pointercancel',leave);geometry.dispose();starsMaterial.dispose();cloudGeometry.dispose();cloudMaterial.dispose();markers.forEach(s=>{s.userData.sprite.material.dispose();s.userData.mini.geometry.dispose();s.userData.mini.material.dispose();});disposables.forEach(d=>d.dispose());target.dispose();lensMaterial.dispose();pickGeometry.dispose();pickMaterial.dispose();holeGeometry.dispose();holeMaterial.dispose();waveGeometry.dispose();waves.forEach(w=>w.material.dispose());coreMaterial.dispose();glowTexture.dispose();spikeTexture.dispose();renderer.dispose();};
}
