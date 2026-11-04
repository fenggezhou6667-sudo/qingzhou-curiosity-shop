import * as THREE from './vendor/three/three.module.js';
import {OrbitControls} from './vendor/three/OrbitControls.js';

export function mountGalaxy(root,archive){
  const canvas=root.querySelector('.cosmos-canvas'),area=root.querySelector('.cosmos-scene');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});}
  catch(error){root.querySelector('.cosmos-fallback').hidden=false;return ()=>{};}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1,.1,120);
  camera.position.set(0,9,19);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.enablePan=false;controls.enableZoom=true;controls.minDistance=1.6;controls.maxDistance=38;controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI-.15;
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
  const starsMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,uniforms:{scale:{value:Math.min(devicePixelRatio,1.5)},visibility:{value:1}},vertexShader:'varying vec3 vColor; uniform float scale; void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(20.0*scale/(-p.z),1.0,3.5);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 vColor;uniform float visibility; void main(){float d=length(gl_PointCoord-vec2(.5));float a=1.0-smoothstep(.05,.5,d);gl_FragColor=vec4(vColor,a*.8*visibility);\n#include <colorspace_fragment>\n}'});
  // Broad, low-brightness gas clouds soften the stellar disk without flattening it.
  const cloudCount=1800,cloudPositions=new Float32Array(cloudCount*3),cloudColors=new Float32Array(cloudCount*3);
  for(let i=0;i<cloudCount;i++){const source=(Math.floor((i+.37)*count/cloudCount)%count)*3;cloudPositions.set(positions.subarray(source,source+3),i*3);const warm=i%5===0;cloudColors.set(warm?[.23,.12,.08]:[.08,.15,.24],i*3);}
  const cloudGeometry=new THREE.BufferGeometry();cloudGeometry.setAttribute('position',new THREE.BufferAttribute(cloudPositions,3));cloudGeometry.setAttribute('color',new THREE.BufferAttribute(cloudColors,3));
  const cloudMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,uniforms:{scale:{value:Math.min(devicePixelRatio,1.5)},visibility:{value:1}},vertexShader:'varying vec3 vColor;uniform float scale;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(240.*scale/(-p.z),2.,40.);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 vColor;uniform float visibility;void main(){float d=length(gl_PointCoord-vec2(.5));float a=pow(max(0.,1.-d*2.),2.);gl_FragColor=vec4(vColor,a*.16*visibility);}'});
  galaxy.add(new THREE.Points(cloudGeometry,cloudMaterial));
  const dust=new THREE.Points(geometry,starsMaterial);galaxy.add(dust);
  const spriteCanvas=document.createElement('canvas');spriteCanvas.width=spriteCanvas.height=128;const c=spriteCanvas.getContext('2d'),g=c.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,250,217,1)');g.addColorStop(.08,'rgba(255,230,157,.95)');g.addColorStop(.2,'rgba(238,203,120,.4)');g.addColorStop(1,'rgba(221,195,125,0)');c.fillStyle=g;c.fillRect(0,0,128,128);const glowTexture=new THREE.CanvasTexture(spriteCanvas);const starCanvas=document.createElement('canvas');starCanvas.width=starCanvas.height=64;const starCtx=starCanvas.getContext('2d'),starGradient=starCtx.createRadialGradient(32,32,0,32,32,32);starGradient.addColorStop(0,'rgba(255,255,255,1)');starGradient.addColorStop(.38,'rgba(255,255,255,.95)');starGradient.addColorStop(1,'rgba(255,255,255,0)');starCtx.fillStyle=starGradient;starCtx.fillRect(0,0,64,64);const starTexture=new THREE.CanvasTexture(starCanvas);
  const coreMaterial=new THREE.SpriteMaterial({map:glowTexture,color:0xffdfa4,transparent:true,opacity:.42,depthWrite:false,blending:THREE.AdditiveBlending});const core=new THREE.Sprite(coreMaterial);core.scale.set(3.3,3.3,1);galaxy.add(core);
  // The black hole and outward ripples are deliberately schematic, not an astrophysical simulation.
  const holeGeometry=new THREE.SphereGeometry(.001,8,6),holeMaterial=new THREE.MeshBasicMaterial({color:0x010208});const hole=new THREE.Mesh(holeGeometry,holeMaterial);galaxy.add(hole);
  const diskGeometry=new THREE.RingGeometry(.17,.49,96,4),diskMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{time:{value:0}},vertexShader:'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 vUv; uniform float time; void main(){vec2 p=(vUv-.5)*2.0; float r=length(p); float a=atan(p.y,p.x); float bands=.68+.32*sin(r*48.0-a*3.0+time*.32); float fade=smoothstep(.32,.48,r)*(1.0-smoothstep(.83,1.0,r)); float side=.65+.35*cos(a); gl_FragColor=vec4(vec3(1.0,.58,.24)*bands*side,fade*.7);}' });const disk=new THREE.Mesh(diskGeometry,diskMaterial);disk.rotation.x=-Math.PI/2;/* Disk is integrated in the lens shader. */
  const waveGeometry=new THREE.BufferGeometry().setFromPoints(Array.from({length:129},(_,i)=>{const a=i*Math.PI*2/128;return new THREE.Vector3(Math.cos(a),.01,Math.sin(a));}));const waves=[];for(let i=0;i<3;i++){const material=new THREE.LineBasicMaterial({color:0x9dbcd3,transparent:true,opacity:0,depthWrite:false});const ring=new THREE.Line(waveGeometry,material);ring.userData.phase=i/3;waves.push(ring);}
  const markers=[],pickTargets=[],pickGeometry=new THREE.SphereGeometry(.65,12,8),pickMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false});
  // Archives are star clusters embedded in the same rotating disk.
  for(let i=0;i<archive.works.length;i++){
    const group=new THREE.Group(),material=new THREE.SpriteMaterial({map:glowTexture,color:[0xffd8a3,0xaaccff,0xffbdd1][i%3],transparent:true,opacity:.68,depthWrite:false,blending:THREE.AdditiveBlending});
    const sprite=new THREE.Sprite(material),hit=new THREE.Mesh(pickGeometry,pickMaterial), points=[],tints=[];
    let seed=8383+i*7103;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;},normal=()=>rand()+rand()+rand()+rand()-2;
    const palette=[[0xffe0ac,0xcad9ff,0xffffff],[0xc9ddff,0xf6d5bb,0xffffff],[0xffd7bf,0xbcd4ff,0xfff4e0]][i],tint=new THREE.Color();
    for(let j=0;j<5000;j++){
      let x,y,z;const core=rand()<.28;
      if(core){x=normal()*.20;z=normal()*.14;y=normal()*.10;}
      else{
        const arm=j%(i===1?3:2),r=.13+Math.pow(rand(),.75)*.92;
        let theta=arm*Math.PI*2/(i===1?3:2)+1.6*Math.log(r+.38)+.17*Math.sin(r*8+arm*2+i);
        if(rand()<.18)theta+=r*(.35+rand()*.25);
        theta+=normal()*(.12+r*.21);const rr=r+normal()*(.04+.1*r);
        x=Math.cos(theta)*rr;z=Math.sin(theta)*rr*(i===2?.75:1);y=normal()*(.035+.04*(1-r));
      }
      points.push(x,y,z);tint.setHex(palette[Math.floor(rand()*palette.length)]);const intensity=.45+.5*rand();tints.push(tint.r*intensity,tint.g*intensity,tint.b*intensity);
    }
    const miniGeometry=new THREE.BufferGeometry();miniGeometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));miniGeometry.setAttribute('color',new THREE.Float32BufferAttribute(tints,3));const miniMaterial=new THREE.PointsMaterial({map:starTexture,vertexColors:true,size:.033,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
    const mini=new THREE.Points(miniGeometry,miniMaterial);hit.userData.index=i;sprite.scale.setScalar(.26);group.add(sprite,mini,hit);group.userData.sprite=sprite;group.userData.mini=mini;const r=4.6+i*1.35,a=(i%2)*Math.PI+.41+1.35*Math.log(r/1.5);group.position.set(Math.cos(a)*r,.18+i*.2,Math.sin(a)*r);galaxy.add(group);markers.push(group);pickTargets.push(hit);
  }
  const cursor=new THREE.Vector2(),raycaster=new THREE.Raycaster();let pointerIn=false,hoverArmed=false,selected=-1,frame=0,disposed=false,down=null,zoomTarget=null,focusIndex=-1,orienting=false,lastTime=null,locked=-1,lockedWorld=new THREE.Vector3();const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const onChange=()=>{};root.addEventListener('cosmos-change',onChange);
  const onPointer=e=>{const r=canvas.getBoundingClientRect();cursor.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);if(e.pointerType==='mouse'){pointerIn=true;hoverArmed=true;}};
  const leave=()=>{pointerIn=false;hoverArmed=false;locked=-1;canvas.style.cursor='grab';};canvas.addEventListener('pointermove',onPointer);canvas.addEventListener('pointerleave',leave);
  const onDown=e=>{onPointer(e);down={x:e.clientX,y:e.clientY};canvas.focus({preventScroll:true});};const onUp=e=>{onPointer(e);if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<7)pick();down=null;};canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',leave);
  const onFocus=e=>{if(e.target.closest('.cosmos-panel'))hoverArmed=false;};root.addEventListener('focusin',onFocus);
  const wheelGuard=e=>{if(document.activeElement!==canvas)e.stopImmediatePropagation();};canvas.addEventListener('wheel',wheelGuard,{capture:true});
  const controlStart=()=>{zoomTarget=null;orienting=false;};controls.addEventListener('start',controlStart);
  function hitMarker(){scene.updateMatrixWorld(true);camera.updateMatrixWorld();raycaster.setFromCamera(cursor,camera);return raycaster.intersectObjects(pickTargets.filter(s=>s.parent.visible))[0];}
  function focus(index){if(index<0||index>=markers.length)return;focusIndex=index;locked=-1;hoverArmed=false;selected=index;zoomTarget=3.15;orienting=true;root.dispatchEvent(new CustomEvent('cosmos-pick',{detail:{index}}));}const onSelect=e=>focus(e.detail.index);root.addEventListener('cosmos-focus',onSelect);function pick(){const hit=hitMarker();if(hit){focus(hit.object.userData.index);return true;}return false;}
  const zoom=e=>{const button=e.target.closest('[data-zoom]');if(!button)return;const action=button.dataset.zoom;if(action==='reset'){orienting=false;focusIndex=-1;locked=-1;zoomTarget=null;camera.position.set(0,9,19);controls.target.set(0,0,0);controls.update();}else{const distance=zoomTarget??camera.position.distanceTo(controls.target);zoomTarget=THREE.MathUtils.clamp(distance*(action==='in'?.72:1.38),controls.minDistance,controls.maxDistance);}};root.addEventListener('click',zoom);
  // Screen-space light deflection samples the actual rendered star field around the projected core.
  const target=new THREE.WebGLRenderTarget(1,1),lensScene=new THREE.Scene(),lensCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  // Artistic ray integration; not a Schwarzschild or Kerr geodesic solver.
  const lensMaterial=new THREE.ShaderMaterial({transparent:true,uniforms:{image:{value:target.texture},center:{value:new THREE.Vector2(.5,.5)},aspect:{value:1},time:{value:0},radius:{value:.14},strength:{value:0},eye:{value:new THREE.Vector3(0,4.2,11.5)},right:{value:new THREE.Vector3(1,0,0)},up:{value:new THREE.Vector3(0,1,0)}},vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position,1.0);}',fragmentShader:`
  uniform sampler2D image;uniform vec2 center;uniform float aspect;uniform float time;uniform float radius;uniform float strength;uniform vec3 eye;uniform vec3 right;uniform vec3 up;varying vec2 uv0;
  void main(){
    vec2 d=uv0-center;d.x*=aspect;float screenR=length(d);vec4 base=texture2D(image,uv0);
    if(screenR>radius||strength<.001){gl_FragColor=base;return;}
    vec2 q=d/radius;vec3 pos=eye,forward=normalize(-pos);
    vec3 dir=normalize(forward+right*q.x*.40+up*q.y*.40);vec3 light=vec3(0.);float captured=0.;float previousY=pos.y;
    for(int i=0;i<128;i++){
      float r=length(pos);float stepSize=clamp(r*.045,.045,.35);vec3 acceleration=-pos/(r*r*r+.18)*.85;
      dir=normalize(dir+acceleration*stepSize);pos+=dir*stepSize;float nr=length(pos);
      if(previousY*pos.y<0.){float radial=length(pos.xz);if(radial>1.05&&radial<5.0){
          float angle=atan(pos.z,pos.x);float flow=radial*3.4-angle*1.7+time*.16;float streak=.78+.13*sin(flow)+.07*sin(flow*2.3+angle);
          float edge=smoothstep(1.05,1.5,radial)*(1.-smoothstep(3.6,5.,radial));float beam=clamp(.85+.50*cos(angle+.45),.25,1.35);float heat=1.-smoothstep(1.2,4.6,radial);
          light+=mix(vec3(1.,.35,.055),vec3(1.,.88,.50),heat)*streak*edge*beam*1.08;}}
      previousY=pos.y;if(nr<.55){captured=1.;break;}if(pos.z < -10.)break;
    }
    vec2 shifted=uv0+vec2((dir.x-q.x*.32)/aspect,dir.y-q.y*.32)*.032;vec4 bent=texture2D(image,shifted);float rim=1.-smoothstep(radius*.79,radius,screenR);
    vec3 result=mix(base.rgb,bent.rgb,rim)*(1.-captured*rim)+light*rim;float alpha=max(base.a,max(bent.a*rim,(captured+length(light))*rim));
    gl_FragColor=mix(base,vec4(result,clamp(alpha,0.,1.)),strength);
  }`});lensScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),lensMaterial));
  const resize=()=>{const width=area.clientWidth,height=area.clientHeight;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);target.setSize(Math.max(1,Math.floor(width*renderer.getPixelRatio())),Math.max(1,Math.floor(height*renderer.getPixelRatio())));lensMaterial.uniforms.aspect.value=width/height;};const observer=new ResizeObserver(resize);observer.observe(area);resize();
  let effectTime=0;const tick=time=>{if(disposed)return;frame=requestAnimationFrame(tick);const dt=lastTime===null?0:Math.min((time-lastTime)/1000,.05);lastTime=time;if(!document.hidden){if(!reduced.matches){galaxy.rotation.y+=.048*dt;effectTime+=dt;}diskMaterial.uniforms.time.value=effectTime;lensMaterial.uniforms.time.value=effectTime;waves.forEach(w=>{const phase=(effectTime*.12+w.userData.phase)%1;w.scale.setScalar(.25+phase*3);w.material.opacity=reduced.matches?0:Math.sin(phase*Math.PI)*.12;});controls.update();if(focusIndex>=0){galaxy.updateMatrixWorld(true);const wanted=markers[focusIndex].getWorldPosition(new THREE.Vector3()),shift=wanted.sub(controls.target).multiplyScalar(1-Math.exp(-3.5*dt));controls.target.add(shift);camera.position.add(shift);if(orienting){const offset=camera.position.clone().sub(controls.target),distance=offset.length(),direction=new THREE.Vector3(.18,.88,.44).normalize().multiplyScalar(distance);offset.lerp(direction,1-Math.exp(-3*dt));camera.position.copy(controls.target).add(offset);if(offset.distanceTo(direction)<.015)orienting=false;}controls.update();}if(zoomTarget!==null){const offset=camera.position.clone().sub(controls.target),distance=offset.length(),next=THREE.MathUtils.lerp(distance,zoomTarget,1-Math.exp(-5*dt));camera.position.copy(controls.target).add(offset.setLength(next));controls.update();if(Math.abs(next-zoomTarget)<.01)zoomTarget=null;}scene.updateMatrixWorld(true);camera.updateMatrixWorld();if(locked>=0){galaxy.worldToLocal(markers[locked].position.copy(lockedWorld));scene.updateMatrixWorld(true);}if(pointerIn&&hoverArmed&&!down){const hit=hitMarker(),index=hit?hit.object.userData.index:-1;canvas.style.cursor=hit?'pointer':'grab';if(index!==locked){locked=index;if(index>=0){markers[index].getWorldPosition(lockedWorld);selected=index;root.dispatchEvent(new CustomEvent('cosmos-pick',{detail:{index}}));}}}const visibility=focusIndex>=0?.06:1;starsMaterial.uniforms.visibility.value=THREE.MathUtils.lerp(starsMaterial.uniforms.visibility.value,visibility,1-Math.exp(-2.5*dt));cloudMaterial.uniforms.visibility.value=starsMaterial.uniforms.visibility.value;coreMaterial.opacity=.42*starsMaterial.uniforms.visibility.value;markers.forEach((m,i)=>{m.userData.sprite.material.opacity=THREE.MathUtils.lerp(m.userData.sprite.material.opacity,i===locked?.8:.48,1-Math.exp(-5*dt));const goal=i===focusIndex?.9:0;m.userData.mini.material.opacity=THREE.MathUtils.lerp(m.userData.mini.material.opacity,goal,1-Math.exp(-3*dt));});if(camera.position.length()>=7){renderer.setRenderTarget(null);renderer.render(scene,camera);}else{renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);const projected=new THREE.Vector3(0,0,0).project(camera);lensMaterial.uniforms.center.value.set(projected.x*.5+.5,projected.y*.5+.5);lensMaterial.uniforms.eye.value.copy(camera.position).normalize().multiplyScalar(12.25);lensMaterial.uniforms.right.value.set(1,0,0).applyQuaternion(camera.quaternion);lensMaterial.uniforms.up.value.set(0,1,0).applyQuaternion(camera.quaternion);lensMaterial.uniforms.radius.value=THREE.MathUtils.clamp(.09*4.0/camera.position.length(),.01,.16);lensMaterial.uniforms.strength.value=THREE.MathUtils.clamp((7-camera.position.length())/2.5,0,1);renderer.render(lensScene,lensCamera);}}};frame=requestAnimationFrame(tick);
  return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.removeEventListener('start',controlStart);controls.dispose();root.removeEventListener('cosmos-change',onChange);root.removeEventListener('cosmos-focus',onSelect);root.removeEventListener('focusin',onFocus);root.removeEventListener('click',zoom);canvas.removeEventListener('wheel',wheelGuard,{capture:true});canvas.removeEventListener('pointermove',onPointer);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('pointercancel',leave);geometry.dispose();starsMaterial.dispose();cloudGeometry.dispose();cloudMaterial.dispose();markers.forEach(s=>{s.userData.sprite.material.dispose();s.userData.mini.geometry.dispose();s.userData.mini.material.dispose();});target.dispose();lensMaterial.dispose();pickGeometry.dispose();pickMaterial.dispose();holeGeometry.dispose();holeMaterial.dispose();diskGeometry.dispose();diskMaterial.dispose();waveGeometry.dispose();waves.forEach(w=>w.material.dispose());coreMaterial.dispose();glowTexture.dispose();starTexture.dispose();renderer.dispose();};
}

