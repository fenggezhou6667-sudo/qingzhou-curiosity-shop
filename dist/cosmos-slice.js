import * as THREE from './vendor/three/three.module.js';

export const B612_CENTER = new THREE.Vector3(-1.35, 28.0, 29.0);
export const B612_AIM_POINT = new THREE.Vector3(-1.35, 29.05, 29.0);
export const B612_WINDOW_WORLD = new THREE.Vector3(-1.07, 30.84, 29.61);
export const B612_LANDING_POS_DESKTOP = new THREE.Vector3(2.90, 32.25, 38.15);
export const B612_LANDING_POS_PORTRAIT = new THREE.Vector3(3.12, 32.85, 42.10);
export const B612_PATH_POS_DESKTOP = new THREE.Vector3(0.86, 31.36, 33.48);
export const B612_PATH_POS_PORTRAIT = new THREE.Vector3(0.95, 31.52, 34.48);
export const B612_PATH_AIM = new THREE.Vector3(-0.76, 30.72, 29.15);

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
 * Procedural Deep-Space Astronomical Nebula Sky Dome (32-deg tilted Milky Way dust band).
 * Restrained nocturnal Prussian indigo, mineral teal haze, and faint warm galactic dust rifts.
 */
export function createCosmosNebulaDome(cosmosGroup) {
  if (!cosmosGroup) return null;
  const domeGeo = new THREE.SphereGeometry(260, 48, 32);
  const domeMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTime: { value: 0 }
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vDir;

      float hash31(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }

      float noise3(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float n000 = hash31(i + vec3(0,0,0));
        float n100 = hash31(i + vec3(1,0,0));
        float n010 = hash31(i + vec3(0,1,0));
        float n110 = hash31(i + vec3(1,1,0));
        float n001 = hash31(i + vec3(0,0,1));
        float n101 = hash31(i + vec3(1,0,1));
        float n011 = hash31(i + vec3(0,1,1));
        float n111 = hash31(i + vec3(1,1,1));
        float nx00 = mix(n000, n100, f.x);
        float nx10 = mix(n010, n110, f.x);
        float nx01 = mix(n001, n101, f.x);
        float nx11 = mix(n011, n111, f.x);
        float nxy0 = mix(nx00, nx10, f.y);
        float nxy1 = mix(nx01, nx11, f.y);
        return mix(nxy0, nxy1, f.z);
      }

      float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.52;
        for (int i = 0; i < 4; i++) {
          v += a * noise3(p);
          p = p * 2.04 + vec3(1.7, 9.2, 4.3);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 d = normalize(vDir);
        // Tilt galactic plane ~32 deg so Milky Way arches poetically across the opening viewport
        float c = cos(0.56);
        float s = sin(0.56);
        vec3 g = vec3(d.x * c - d.y * s, d.x * s + d.y * c, d.z);

        float plane = exp(-pow(g.y * 3.15, 2.0));
        float broad = exp(-pow(g.y * 1.45, 2.0));

        float n1 = fbm(g * 2.6 + vec3(0.0, 0.0, uTime * 0.002));
        float n2 = fbm(g * 5.8 + vec3(3.1, -1.4, 2.2));
        float dustRift = smoothstep(0.40, 0.72, fbm(g * 4.4 + vec3(-2.3, 1.9, 0.8)));

        vec3 voidCol = vec3(0.003, 0.006, 0.015);
        vec3 deepIndigo = vec3(0.011, 0.024, 0.056);
        vec3 tealNebula = vec3(0.010, 0.036, 0.052);
        vec3 warmCore = vec3(0.058, 0.044, 0.036);

        // Galactic core density toward B-612 direction (-z, +x)
        float coreDir = pow(max(0.0, dot(d, normalize(vec3(0.32, 0.14, -0.93)))), 2.8);

        vec3 col = voidCol;
        col += deepIndigo * broad * (0.30 + 0.70 * n1) * 0.56;
        col += tealNebula * plane * smoothstep(0.38, 0.84, n2) * 0.34;
        col += warmCore * plane * coreDir * (0.40 + 0.60 * n1) * 0.52;
        // Dark cosmic dust lanes carved organically through the Milky Way band
        col *= (1.0 - plane * dustRift * 0.55);

        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `
  });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.name = 'Cosmos_Nebula_Dome';
  dome.position.copy(COSMOS_CENTER);
  dome.renderOrder = -10;
  cosmosGroup.add(dome);
  return domeMat;
}

/**
 * Sculpt twilight-navy atmosphere, crisp rim silhouette for roof cat & cottage,
 * and balanced storybook-in-nightlight illumination around B-612.
 */
export function sculptB612TwilightLook({ b612HaloMat, b612MistMat, cosmosGroup }) {
  // 1. Twilight-navy atmospheric Fresnel halo hugging the planet limb
  if (b612HaloMat) {
    b612HaloMat.uniforms.glowColor.value.setHex(0x285094);
    b612HaloMat.uniforms.opacity.value = 0.28;
    b612HaloMat.fragmentShader = `
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      uniform float opacity;
      uniform vec3 glowColor;
      void main() {
        float ndv = abs(dot(normalize(vNormalView), normalize(vViewPos)));
        float limb = pow(smoothstep(0.02, 0.48, ndv), 1.55) * pow(1.0 - smoothstep(0.48, 0.93, ndv), 1.45);
        float distFade = exp(-pow(0.008 * length(vViewPos), 2.0));
        gl_FragColor = vec4(glowColor, limb * opacity * 0.58 * distFade);
        #include <colorspace_fragment>
      }
    `;
    b612HaloMat.needsUpdate = true;
  }

  // 2. Delicate misty orbiting stardust
  if (b612MistMat) {
    b612MistMat.uniforms.opacity.value = 0.24;
  }

  if (cosmosGroup) {
    // Crisp cool twilight-indigo rim light to sculpt the roof black cat, rafters & tree silhouette
    const backRim = new THREE.DirectionalLight(0x74a4f5, 1.25);
    backRim.position.set(2.8, 34.5, 11.0);
    backRim.target.position.copy(B612_CENTER).add(new THREE.Vector3(0, 1.6, 0));
    cosmosGroup.add(backRim);
    cosmosGroup.add(backRim.target);

    // Subtle twilight-navy sky aura behind cottage ridge & B612_Cat for effortless silhouette legibility
    const ridgeHaloMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color(0x3664b5) }
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
          float a = exp(-d * d * 12.5) * smoothstep(0.5, 0.12, d) * 0.36;
          gl_FragColor = vec4(uColor, a);
          #include <colorspace_fragment>
        }
      `
    });
    const ridgeHalo = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 4.6), ridgeHaloMat);
    ridgeHalo.position.set(-1.30, 31.55, 27.4);
    cosmosGroup.add(ridgeHalo);

    // Balanced nocturnal diorama lighting (retains rich pigments while preserving starlit mood)
    const gardenKey = new THREE.PointLight(0xffdfb0, 29, 17, 1.8);
    gardenKey.position.copy(B612_CENTER).add(new THREE.Vector3(-3.4, 6.4, 5.2));
    cosmosGroup.add(gardenKey);

    const gardenFill = new THREE.PointLight(0x8bb8de, 16, 16, 1.8);
    gardenFill.position.copy(B612_CENTER).add(new THREE.Vector3(4.2, 2.2, 5.0));
    cosmosGroup.add(gardenFill);

    const cottageWarm = new THREE.PointLight(0xffa445, 0.55, 7.8, 1.7);
    cottageWarm.position.set(-1.35, 30.78, 30.05);
    cosmosGroup.add(cottageWarm);

    const roseWarm = new THREE.PointLight(0xff7d6d, 0.38, 4.2, 1.8);
    roseWarm.position.set(0.32, 30.22, 29.90);
    cosmosGroup.add(roseWarm);
  }
}

/**
 * Create the 6 scattered Photo Light-Frames (P—001 ~ P—006) in 3D cosmos space.
 * Distant (>20u): razor-sharp astronomical jewel + ultra-fine gilded astrolabe ring (ZERO giant blurry blobs!).
 * Approaching (~20 -> 10u): ring unfolds gracefully into clear 640px frame + hairline gold border.
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

    // 1. Refined Crystalline Astronomical Star-Beacon (compact 0.78u quad, sharp pinpoint + hairline brass reticle)
    const haloGeo = new THREE.PlaneGeometry(0.78, 0.78);
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

          float breathe = 0.72 + 0.28 * sin(uTime * 1.25 + uPhase);
          // Razor-sharp astronomical diamond star core
          float core = exp(-d * d * 480.0);
          float innerGlow = exp(-d * d * 78.0) * 0.22;

          // Ultra-crisp 4-point optical diffraction needles
          float spikeH = exp(-abs(p.y) * 105.0) * exp(-abs(p.x) * 9.5);
          float spikeV = exp(-abs(p.x) * 105.0) * exp(-abs(p.y) * 9.5);
          float spikes = (spikeH + spikeV) * 0.52;

          // Subtle rotating hairline gilded astrolabe ring (r = 0.27)
          float ang = atan(p.y, p.x) + uTime * 0.22 + uPhase;
          float ringMask = exp(-pow((d - 0.27) * 110.0, 2.0));
          float ringArc = 0.28 + 0.72 * smoothstep(-0.15, 0.75, sin(ang * 2.0));
          float ring = ringMask * ringArc * 0.15;

          float edgeFade = smoothstep(0.49, 0.34, d);
          float vis = (1.0 - smoothstep(0.04, 0.78, uReveal));
          float intensity = (core + innerGlow + spikes + ring) * edgeFade * breathe * vis;
          if (intensity <= 0.004) discard;

          vec3 starCol = mix(vec3(0.86, 0.72, 0.48), vec3(0.98, 0.96, 0.90), clamp(core * 1.4 + spikes * 0.4, 0.0, 1.0));
          // Subtle pale cyan-silver tint on the diffraction tips for authentic optical refraction
          starCol = mix(starCol, vec3(0.76, 0.88, 1.0), smoothstep(0.14, 0.38, d) * 0.35);

          gl_FragColor = vec4(starCol, clamp(intensity, 0.0, 0.92));
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
          float rNorm = length(centered);
          float grain = hash21(floor(vUv * vec2(68.0 * uAspect, 68.0)));

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
          vec3 photoRgb = mix(vec3(0.95, 0.76, 0.45) * 0.55, texCol * 0.76, smoothstep(0.15, 0.92, uReveal));
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
