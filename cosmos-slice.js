import * as THREE from './vendor/three/three.module.js';

export const B612_CENTER = new THREE.Vector3(-1.35, 28.0, 29.0);
export const B612_AIM_POINT = new THREE.Vector3(-1.35, 30.15, 29.15);
export const B612_WINDOW_WORLD = new THREE.Vector3(-1.38, 30.72, 29.68);
export const B612_LANDING_POS_DESKTOP = new THREE.Vector3(-0.35, 29.85, 38.6);
export const B612_LANDING_POS_PORTRAIT = new THREE.Vector3(-0.15, 29.95, 42.8);

export const COSMOS_CENTER = new THREE.Vector3(-4.0, 27.5, 34.0);
export const COSMOS_R_MAX = 64.0;
export const COSMOS_R_HARD = 78.0;

export const ROAM_HOME_POS = new THREE.Vector3(-30.0, 21.0, 82.0);
export const ROAM_HOME_YAW = 0.28;
export const ROAM_HOME_PITCH = 0.02;

export const PHOTO_FRAME_SPECS = [
  { id: 'frame-0', workSlug: 'still-water', photoIdx: 0, imageKey: 'lake', pos: [-37.2, 21.5, 57.0], phase: 0.2 },
  { id: 'frame-1', workSlug: 'still-water', photoIdx: 1, imageKey: 'mountain', pos: [-39.0, 28.5, 59.0], phase: 1.4 },
  { id: 'frame-2', workSlug: 'shape-of-light', photoIdx: 0, imageKey: 'dunes', pos: [-14.0, 19.5, 52.0], phase: 2.5 },
  { id: 'frame-3', workSlug: 'shape-of-light', photoIdx: 1, imageKey: 'dunesWalk', pos: [8.5, 32.5, 47.0], phase: 3.7 },
  { id: 'frame-4', workSlug: 'long-afternoon', photoIdx: 0, imageKey: 'forest', pos: [11.0, 23.0, 24.0], phase: 4.8 },
  { id: 'frame-5', workSlug: 'long-afternoon', photoIdx: 1, imageKey: 'forestStudy', pos: [-14.5, 34.0, 21.0], phase: 5.9 }
];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

export function shortestAngleDelta(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function computeAimYawPitch(fromPos, targetPos) {
  const dir = new THREE.Vector3().subVectors(targetPos, fromPos).normalize();
  const yaw = Math.atan2(-dir.x, -dir.z);
  const pitch = clamp(Math.asin(clamp(dir.y, -0.99, 0.99)), -1.25, 1.25);
  return { yaw, pitch };
}

/**
 * Strip the 12-triangle diagonal skylight plate (Y > 31.15) from B612_Cottage's
 * LanternGlow mesh while preserving all 204 warm window, door, and lantern triangles.
 */
export function stripB612SkylightPlate(cottageObj) {
  if (!cottageObj) return;
  cottageObj.traverse((child) => {
    if (!child.isMesh) return;
    if (/skylight/i.test(child.name || '')) {
      child.visible = false;
      return;
    }
    if (child.material?.name !== 'LanternGlow') return;
    const geom = child.geometry;
    const posAttr = geom?.getAttribute('position');
    if (!posAttr) return;
    const idxAttr = geom.getIndex();
    const kept = [];
    if (idxAttr) {
      for (let i = 0; i < idxAttr.count; i += 3) {
        const a = idxAttr.getX(i);
        const b = idxAttr.getX(i + 1);
        const c = idxAttr.getX(i + 2);
        const maxY = Math.max(posAttr.getY(a), posAttr.getY(b), posAttr.getY(c));
        if (maxY <= 31.15) kept.push(a, b, c);
      }
      if (kept.length > 0 && kept.length < idxAttr.count) {
        geom.setIndex(kept);
        geom.computeBoundingBox();
        geom.computeBoundingSphere();
      }
    }
  });
}

/**
 * Completely hide Orrery_0..2 satellites/rings and the B612_Star_Ring orbital track.
 */
export function hideOrreryNodes(namedObjects) {
  const hiddenNames = [
    'Orrery_0', 'Orrery_1', 'Orrery_2',
    'Anchor_Orrery_0', 'Anchor_Orrery_1', 'Anchor_Orrery_2',
    'HitProxy_Orrery_0', 'HitProxy_Orrery_1', 'HitProxy_Orrery_2',
    'B612_Star_Ring'
  ];
  for (const name of hiddenNames) {
    const obj = namedObjects.get(name);
    if (!obj) continue;
    obj.visible = false;
    obj.traverse((child) => { child.visible = false; });
  }
}

/**
 * Sculpt twilight-navy atmosphere, backlit rim silhouette, and HDR warm window/rose
 * bloom accents around B-612 without disturbing worldGroup (02~05) shared materials.
 */
export function sculptB612TwilightLook({ namedObjects, b612HaloMat, b612MistMat, cosmosGroup }) {
  // 1. Twilight-navy atmospheric Fresnel halo hugging the planet limb
  if (b612HaloMat) {
    b612HaloMat.uniforms.glowColor.value.setHex(0x21407a);
    b612HaloMat.uniforms.opacity.value = 0.46;
    b612HaloMat.fragmentShader = `
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      uniform float opacity;
      uniform vec3 glowColor;
      void main() {
        float ndv = abs(dot(normalize(vNormalView), normalize(vViewPos)));
        float limb = pow(smoothstep(0.02, 0.50, ndv), 1.6) * pow(1.0 - smoothstep(0.50, 0.94, ndv), 1.5);
        float distFade = exp(-pow(0.0085 * length(vViewPos), 2.0));
        gl_FragColor = vec4(glowColor, limb * opacity * 0.52 * distFade);
        #include <colorspace_fragment>
      }
    `;
    b612HaloMat.needsUpdate = true;
  }

  // 2. Delicate misty orbiting stardust
  if (b612MistMat) {
    b612MistMat.uniforms.opacity.value = 0.28;
  }

  // 3. Twilight-navy planet surface shader with FogExp2 support & local warm window spill
  const body = namedObjects.get('B612_Asteroid_Body');
  if (body) {
    const planetMat = new THREE.ShaderMaterial({
      fog: true,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          sunDir: { value: new THREE.Vector3(-0.48, 0.72, -0.52).normalize() }
        }
      ]),
      vertexShader: `
        varying vec3 vLocalPos;
        varying vec3 vNormalWorld;
        varying vec3 vNormalView;
        #include <fog_pars_vertex>
        void main() {
          vLocalPos = position;
          vNormalWorld = normalize(mat3(modelMatrix) * normal);
          vNormalView = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }
      `,
      fragmentShader: `
        uniform vec3 sunDir;
        varying vec3 vLocalPos;
        varying vec3 vNormalWorld;
        varying vec3 vNormalView;
        #include <fog_pars_fragment>
        void main() {
          vec3 p = vLocalPos;
          vec3 nw = normalize(vNormalWorld);
          float ndl = dot(nw, normalize(sunDir));
          float lit = smoothstep(-0.15, 0.80, ndl);
          float hill = smoothstep(-0.35, 0.55, sin(p.x * 2.4 + 0.6) * cos(p.z * 2.1) + 0.5 * cos(p.y * 3.2));
          float micro = sin(p.x * 8.5 + p.y * 6.0) * cos(p.z * 7.5) * 0.008;
          vec3 twilight = vec3(0.014, 0.020, 0.048);
          vec3 moonSlate = mix(vec3(0.036, 0.050, 0.095), vec3(0.025, 0.044, 0.070), hill * 0.65) + micro;
          vec3 surface = mix(twilight, moonSlate, lit * 0.65);

          // Localized warm window light spill onto upper-front meadow
          vec3 winPos = vec3(0.0, 2.25, 0.68);
          float winSpill = exp(-dot(p - winPos, p - winPos) * 0.75);
          surface += vec3(0.68, 0.32, 0.09) * winSpill * 0.45;

          // Localized warm rose cloche spill on right shoulder
          vec3 rosePos = vec3(1.55, 1.68, 0.75);
          float roseSpill = exp(-dot(p - rosePos, p - rosePos) * 1.55);
          surface += vec3(0.60, 0.20, 0.14) * roseSpill * 0.34;

          // Cool twilight-navy Fresnel rim
          float rim = pow(clamp(1.0 - abs(vNormalView.z), 0.0, 1.0), 3.1);
          vec3 col = surface + vec3(0.22, 0.38, 0.72) * rim * (0.24 + 0.40 * lit);
          gl_FragColor = vec4(col, 1.0);
          #include <fog_fragment>
          #include <colorspace_fragment>
        }
      `
    });
    body.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      if (child.material.name === 'B612GoldSoil') {
        child.material = planetMat;
      } else if (child.material.name === 'WarmOak') {
        const stones = child.material.clone();
        stones.color.setHex(0x282128);
        stones.emissiveIntensity = 0.0;
        stones.roughness = 0.88;
        stones.envMapIntensity = 0.18;
        child.material = stones;
      }
    });
  }

  // 4. Clone & sculpt B612_Cottage materials (keep worldGroup materials untouched)
  const cottage = namedObjects.get('B612_Cottage');
  if (cottage) {
    stripB612SkylightPlate(cottage);
    cottage.traverse((child) => {
      if (!child.isMesh || !child.material || child.material.name === 'HitProxyMat') return;
      const m = child.material.clone();
      if (m.name === 'LanternGlow') {
        // Cross threshold > 0.78 for UnrealBloomPass
        m.color.setHex(0xffb45c);
        m.emissive.setHex(0xff9636);
        m.emissiveIntensity = 2.15;
      } else if (m.name === 'LimeWall') {
        m.color.setHex(0x283042);
        m.emissiveIntensity = 0.0;
        m.roughness = 0.96;
        m.metalness = 0.0;
        m.normalMap = null;
        m.roughnessMap = null;
        m.envMapIntensity = 0.06;
      } else if (m.name === 'DarkWood') {
        m.color.setHex(0x161218);
        m.emissiveIntensity = 0.0;
        m.roughness = 0.92;
        m.metalness = 0.0;
        m.normalMap = null;
        m.envMapIntensity = 0.06;
      } else if (m.name === 'SlateTile') {
        m.color.setHex(0x141d2e);
        m.emissiveIntensity = 0.0;
        m.roughness = 0.98;
        m.metalness = 0.0;
        m.normalMap = null;
        m.roughnessMap = null;
        m.envMapIntensity = 0.03;
      }
      m.needsUpdate = true;
      child.material = m;
    });
  }

  // 5. Roof silhouette cat (pure dark silhouette against behind-ridge twilight halo)
  const cat = namedObjects.get('B612_Cat');
  if (cat) {
    cat.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const m = child.material.clone();
      m.color.setHex(0x04060c);
      m.emissiveIntensity = 0.0;
      m.roughness = 0.96;
      m.metalness = 0.0;
      m.envMapIntensity = 0.04;
      m.needsUpdate = true;
      child.material = m;
    });
  }

  // 6. Moody silhouette tree
  const tree = namedObjects.get('B612_Tree');
  if (tree) {
    tree.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const m = child.material.clone();
      if (m.name === 'B612Foliage') {
        m.color.setHex(0x1b2c2a);
        m.emissive.setHex(0x0e1c1a);
        m.emissiveIntensity = 0.12;
      } else {
        m.color.setHex(0x181316);
        m.emissiveIntensity = 0.0;
      }
      m.envMapIntensity = 0.14;
      m.needsUpdate = true;
      child.material = m;
    });
  }

  // 7. Subtle moonlit creek
  const creek = namedObjects.get('B612_Creek');
  if (creek) {
    creek.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const m = child.material.clone();
      m.color.setHex(0x285678);
      m.emissive.setHex(0x1b4c6e);
      m.emissiveIntensity = 0.35;
      m.envMapIntensity = 0.28;
      m.needsUpdate = true;
      child.material = m;
    });
  }

  // 8. Warm glowing B612_Rose_Cloche
  const rose = namedObjects.get('B612_Rose_Cloche');
  if (rose) {
    rose.traverse((child) => {
      if (!child.isMesh || !child.material || child.material.name === 'HitProxyMat') return;
      const m = child.material.clone();
      if (m.name === 'VermilionSeal') {
        m.color.setHex(0xff523c);
        m.emissive.setHex(0xf04832);
        m.emissiveIntensity = 1.45;
      } else if (m.name === 'B612Moss') {
        m.color.setHex(0x213c2d);
        m.emissiveIntensity = 0.14;
      } else if (m.name === 'WarmBrass') {
        m.emissiveIntensity = 0.18;
        m.envMapIntensity = 0.65;
      } else if (m.name === 'DarkWood') {
        m.color.setHex(0x1c1518);
        m.emissiveIntensity = 0.0;
        m.envMapIntensity = 0.18;
      }
      m.needsUpdate = true;
      child.material = m;
    });
  }

  // 9. Sculpted cosmos backlit rim, behind-roof twilight cat backdrop, & tight local warm beacons
  if (cosmosGroup) {
    const backRim = new THREE.DirectionalLight(0x5b82d6, 0.58);
    backRim.position.set(3.5, 32.5, 10.0);
    backRim.target.position.copy(B612_CENTER);
    cosmosGroup.add(backRim);
    cosmosGroup.add(backRim.target);

    // Subtle twilight-navy sky halo behind cottage ridge & B612_Cat for clear silhouette contrast
    const ridgeHaloMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color(0x2a4f94) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
          float d = length(vUv - vec2(0.5));
          if (d > 0.5) discard;
          float a = exp(-d * d * 14.0) * smoothstep(0.5, 0.12, d) * 0.34;
          gl_FragColor = vec4(uColor, a);
          #include <colorspace_fragment>
        }
      `
    });
    const ridgeHalo = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 4.2), ridgeHaloMat);
    ridgeHalo.position.set(-1.30, 31.35, 27.6);
    cosmosGroup.add(ridgeHalo);

    const cottageWarm = new THREE.PointLight(0xffa248, 2.35, 8.2, 1.7);
    cottageWarm.position.set(-1.35, 30.75, 29.95);
    cosmosGroup.add(cottageWarm);

    const roseWarm = new THREE.PointLight(0xff6b52, 1.25, 4.0, 1.8);
    roseWarm.position.set(0.35, 30.18, 29.85);
    cosmosGroup.add(roseWarm);
  }
}

/**
 * Create the 6 scattered Photo Light-Frames (P—001 ~ P—006) in 3D cosmos space.
 * Distant (>20u): soft breathing star halo (reveal = 0).
 * Approaching (~20 -> 10u): smoothly condenses into clear 640px frame + gold border.
 */
export function createScatteredPhotoFrames(cosmosGroup, archiveData) {
  if (!cosmosGroup) return [];
  const texLoader = new THREE.TextureLoader();
  const images = archiveData?.images || {};
  const frames = [];

  for (let i = 0; i < PHOTO_FRAME_SPECS.length; i++) {
    const spec = PHOTO_FRAME_SPECS[i];
    const meta = images[spec.imageKey] || {};
    const fileBase = meta.file || spec.imageKey;
    const aspect = meta.width && meta.height ? meta.width / meta.height : 1.5;
    const frameH = 2.45;
    const frameW = frameH * aspect;

    const group = new THREE.Group();
    group.name = `PhotoFrameGroup_${i}`;
    group.position.set(...spec.pos);
    cosmosGroup.add(group);

    // 1. Breathing Star-Halo Billboard (visible when distant / uncondensed)
    const haloGeo = new THREE.PlaneGeometry(1.55, 1.55);
    const haloMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPhase: { value: spec.phase },
        uReveal: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uPhase;
        uniform float uReveal;
        varying vec2 vUv;
        void main() {
          vec2 p = vUv - vec2(0.5);
          float d = length(p);
          if (d > 0.49) discard;
          float edgeMask = smoothstep(0.49, 0.10, d);
          float breathe = 0.62 + 0.38 * sin(uTime * 1.45 + uPhase);
          float core = exp(-d * d * 110.0);
          float halo = exp(-d * d * 26.0) * 0.34;
          float crossRay = max(
            exp(-abs(p.x) * 44.0) * exp(-abs(p.y) * 11.0),
            exp(-abs(p.y) * 44.0) * exp(-abs(p.x) * 11.0)
          ) * 0.42;
          float alpha = (core + halo + crossRay) * edgeMask * breathe * (1.0 - smoothstep(0.05, 0.85, uReveal));
          if (alpha <= 0.004) discard;
          vec3 col = mix(vec3(0.95, 0.68, 0.34), vec3(1.0, 0.94, 0.82), core);
          gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.88));
          #include <colorspace_fragment>
        }
      `
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.renderOrder = 2;
    group.add(haloMesh);

    // 2. Condensing Photographic Frame with Warm-Gold Translucent Hairline Border
    const tex = texLoader.load(`./assets/${fileBase}-640.jpg`);
    tex.colorSpace = THREE.SRGBColorSpace;

    const photoGeo = new THREE.PlaneGeometry(frameW, frameH);
    const photoMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uMap: { value: tex },
        uReveal: { value: 0 },
        uTime: { value: 0 },
        uPhase: { value: spec.phase },
        uHover: { value: 0 },
        uAspect: { value: aspect }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform float uReveal;
        uniform float uTime;
        uniform float uPhase;
        uniform float uHover;
        uniform float uAspect;
        varying vec2 vUv;

        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        void main() {
          if (uReveal <= 0.005) discard;

          vec2 centered = vUv - vec2(0.5);
          float rNorm = length(centered * vec2(1.0, 1.0));
          float grain = hash21(floor(vUv * vec2(68.0 * uAspect, 68.0)));

          // Stardust condensation from center outward as uReveal rises 0 -> 1
          float iris = smoothstep(uReveal * 1.35 + 0.04, uReveal * 1.35 - 0.36, rNorm + (grain - 0.5) * 0.22 * (1.0 - uReveal));
          float padX = 0.022 / max(uAspect, 0.55);
          float padY = 0.022;
          float dx = min(vUv.x, 1.0 - vUv.x);
          float dy = min(vUv.y, 1.0 - vUv.y);
          bool inBorder = (dx < padX || dy < padY);

          vec3 borderGold = vec3(0.92, 0.72, 0.40) * (0.72 + 0.38 * uHover);
          if (inBorder) {
            float edgeFade = smoothstep(0.0, 0.006, min(dx, dy));
            float borderAlpha = smoothstep(0.08, 0.72, uReveal) * (0.68 + 0.28 * uHover) * (0.55 + 0.45 * edgeFade);
            gl_FragColor = vec4(borderGold, borderAlpha);
            #include <colorspace_fragment>
            return;
          }

          vec2 innerUv = (vUv - vec2(padX, padY)) / vec2(1.0 - 2.0 * padX, 1.0 - 2.0 * padY);
          vec3 texCol = texture2D(uMap, clamp(innerUv, 0.0, 1.0)).rgb;
          // Keep photographic highlights delicately below Bloom threshold 0.78
          vec3 photoRgb = mix(vec3(0.95, 0.76, 0.45) * 0.55, texCol * 0.74, smoothstep(0.15, 0.92, uReveal));
          float photoAlpha = iris * smoothstep(0.05, 0.88, uReveal);
          if (photoAlpha <= 0.004) discard;
          gl_FragColor = vec4(photoRgb, photoAlpha);
          #include <colorspace_fragment>
        }
      `
    });
    const photoMesh = new THREE.Mesh(photoGeo, photoMat);
    photoMesh.name = `PhotoFrame_${i}`;
    photoMesh.userData.__qzInteractiveName = `PhotoFrame_${i}`;
    photoMesh.userData.__qzFrameIdx = i;
    photoMesh.userData.__qzIsPhotoFrame = true;
    photoMesh.renderOrder = 3;
    group.add(photoMesh);

    frames.push({
      index: i,
      id: spec.id,
      workSlug: spec.workSlug,
      photoIdx: spec.photoIdx,
      basePos: new THREE.Vector3(...spec.pos),
      phase: spec.phase,
      group,
      haloMesh,
      haloMat,
      photoMesh,
      photoMat,
      reveal: 0,
      hover: 0,
      hovered: false
    });
  }

  return frames;
}

export function updatePhotoFrames(frames, camera, elapsedSec, dt, prefersReducedMotion, instantSnap = false) {
  if (!frames?.length || !camera) return;
  for (const f of frames) {
    const floatY = prefersReducedMotion ? 0 : Math.sin(elapsedSec * 0.55 + f.phase) * 0.16;
    f.group.position.set(f.basePos.x, f.basePos.y + floatY, f.basePos.z);
    f.group.lookAt(camera.position);

    const dist = camera.position.distanceTo(f.group.position);
    const targetReveal = 1.0 - smoothstep(10.5, 20.0, dist);
    if (instantSnap) {
      f.reveal = targetReveal;
    } else {
      f.reveal += (targetReveal - f.reveal) * Math.min(1, dt * 4.8);
    }

    const targetHover = f.hovered && f.reveal >= 0.35 ? 1.0 : 0.0;
    f.hover += (targetHover - f.hover) * Math.min(1, dt * 10);

    f.haloMat.uniforms.uTime.value = elapsedSec;
    f.haloMat.uniforms.uReveal.value = f.reveal;
    f.photoMat.uniforms.uReveal.value = f.reveal;
    f.photoMat.uniforms.uTime.value = elapsedSec;
    f.photoMat.uniforms.uHover.value = f.hover;
  }
}

const _starLocal = new THREE.Vector3();

/**
 * Project B-612 world pos into NDC (properly handling behind-camera angles) and clamp
 * #star-guide-btn onto an inner viewport ellipse (margin >= 44px) when far or off-center.
 */
export function updateStarGuidePip(btn, camera, mode) {
  if (!btn || !camera) return;
  if (mode !== 'roam') {
    btn.hidden = true;
    return;
  }

  camera.updateMatrixWorld();
  _starLocal.copy(B612_AIM_POINT).applyMatrix4(camera.matrixWorldInverse);
  const dist = camera.position.distanceTo(B612_AIM_POINT);

  const w = window.innerWidth || 1440;
  const h = window.innerHeight || 900;
  const cx = w * 0.5;
  const cy = h * 0.5;

  // Inner viewport ellipse with >=68px center margin (>=44px outer hitbox margin for 48x48 btn)
  const rx = Math.max(40, cx - Math.min(72, w * 0.18));
  const ry = Math.max(40, cy - Math.min(86, h * 0.16));

  const tanHalfV = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
  const aspect = Math.max(0.25, w / Math.max(1, h));
  const inBehind = _starLocal.z >= -0.15;

  let ox, oy;
  if (!inBehind) {
    const depth = -_starLocal.z;
    const ndcX = (_starLocal.x / depth) / (tanHalfV * aspect);
    const ndcY = (_starLocal.y / depth) / tanHalfV;
    ox = ndcX * cx;
    oy = -ndcY * cy;
  } else {
    let lx = _starLocal.x;
    let ly = _starLocal.y;
    if (Math.hypot(lx, ly) < 0.01) lx = 1.0;
    const norm = Math.hypot(lx, ly) || 1;
    ox = (lx / norm) * rx * 1.4;
    oy = -(ly / norm) * ry * 1.4;
  }

  const ellip = Math.hypot(ox / rx, oy / ry);
  const isArrived = !inBehind && dist <= 14.5 && ellip <= 0.65;

  if (isArrived) {
    btn.hidden = true;
    return;
  }

  // Clamp onto inner ellipse when off-center or far (>20u) so center 90%+ stays pure
  if (ellip > 1.0 || dist > 20.0 || inBehind) {
    const scale = 1.0 / Math.max(ellip, 0.0001);
    ox *= scale;
    oy *= scale;
  }

  const gx = clamp(cx + ox, cx - rx, cx + rx);
  const gy = clamp(cy + oy, cy - ry, cy + ry);
  btn.hidden = false;
  btn.style.setProperty('--gx', `${gx.toFixed(1)}px`);
  btn.style.setProperty('--gy', `${gy.toFixed(1)}px`);
}
