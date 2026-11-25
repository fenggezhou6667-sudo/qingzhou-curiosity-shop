import * as THREE from './vendor/three/three.module.js';
import { createMiniWishLanternMesh } from './river-water.js';

/**
 * 5 Interactive Miniature Worlds arranged inside the Single Curiosity Shop Room.
 * Each exhibit supports smooth damped fly-in, drag-to-orbit inspection, scroll zoom,
 * dedicated 3-point macro lighting (ZERO grey fog!), and bespoke physical awakening animations.
 */
export const ROOM_OVERVIEW_POS = new THREE.Vector3(0.0, 3.65, 7.65);
export const ROOM_OVERVIEW_TARGET = new THREE.Vector3(0.0, 1.48, -0.85);

export const ROOM_EXHIBITS = [
  {
    id: 'photo',
    stationId: 'works',
    idx: '01',
    name: '摄影暗箱',
    eyebrow: 'MINIATURE 01 · FILM LIGHTBOX',
    title: '复古胶片灯箱 · 六组光影',
    target: new THREE.Vector3(-4.48, 1.42, 1.32),
    defaultYaw: 0.44,
    defaultPitch: 0.64,
    defaultDist: 2.15,
    minYaw: -0.65,
    maxYaw: 1.55,
    minPitch: 0.16,
    maxPitch: 1.08,
    minDist: 1.45,
    maxDist: 3.4,
    spotPos: new THREE.Vector3(-4.2, 3.4, 1.8),
    spotColor: 0xffd28c
  },
  {
    id: 'moyan',
    stationId: 'notes',
    idx: '02',
    name: '墨盐诗卷',
    eyebrow: 'MINIATURE 02 · STUDY DESK',
    title: '宣纸《墨盐》 · 诗卷与朱砂印',
    target: new THREE.Vector3(-2.55, 1.15, -2.50),
    defaultYaw: 0.0,
    defaultPitch: 0.64,
    defaultDist: 2.18,
    minYaw: -1.05,
    maxYaw: 1.05,
    minPitch: 0.22,
    maxPitch: 1.15,
    minDist: 1.40,
    maxDist: 3.3,
    spotPos: new THREE.Vector3(-2.8, 3.2, -1.9),
    spotColor: 0xffca7a
  },
  {
    id: 'lab',
    stationId: 'labs',
    idx: '03',
    name: '植物标本匣',
    eyebrow: 'MINIATURE 03 · HERBARIUM BENCH',
    title: '月下标本匣 · 构造与蓝晒',
    target: new THREE.Vector3(2.55, 1.18, -2.42),
    defaultYaw: -0.05,
    defaultPitch: 0.62,
    defaultDist: 2.30,
    minYaw: -1.05,
    maxYaw: 1.05,
    minPitch: 0.20,
    maxPitch: 1.15,
    minDist: 1.45,
    maxDist: 3.4,
    spotPos: new THREE.Vector3(2.8, 3.2, -1.9),
    spotColor: 0x7ef0cf
  },
  {
    id: 'atlas',
    stationId: 'traces',
    idx: '04',
    name: '青绿山河盘',
    eyebrow: 'MINIATURE 04 · MINERAL CHINA ATLAS',
    title: '宋元青绿沙盘 · 山河行迹',
    target: new THREE.Vector3(0.0, 1.12, 0.65),
    defaultYaw: 0.14,
    defaultPitch: 0.64,
    defaultDist: 2.55,
    minYaw: -Infinity,
    maxYaw: Infinity,
    minPitch: 0.22,
    maxPitch: 1.18,
    minDist: 1.55,
    maxDist: 4.1,
    spotPos: new THREE.Vector3(-0.8, 3.6, 1.2),
    spotColor: 0x8ef2de
  },
  {
    id: 'river',
    stationId: 'about',
    idx: '05',
    name: '江南夜河箱',
    eyebrow: 'MINIATURE 05 · NIGHT CANAL TERRARIUM',
    title: '微缩夜河景箱 · 归舟放灯',
    target: new THREE.Vector3(4.52, 1.32, 1.32),
    defaultYaw: -0.06,
    defaultPitch: 0.56,
    defaultDist: 2.52,
    minYaw: -1.55,
    maxYaw: 0.85,
    minPitch: 0.16,
    maxPitch: 1.05,
    minDist: 1.48,
    maxDist: 3.7,
    spotPos: new THREE.Vector3(3.85, 3.45, 2.25),
    spotColor: 0xffbc64
  }
];

export function getExhibitById(id) {
  return ROOM_EXHIBITS.find((e) => e.id === id) || null;
}

/**
 * Build the Act III Curiosity Shop Room container, crisp twilight window backdrop,
 * warm bokeh light atmosphere (ZERO grey fog!), macro focus spotlight, and animation rigs.
 */
export function buildRoomAct(dpr = 1) {
  const group = new THREE.Group();
  group.name = 'QZ_Act3_Curiosity_Room';

  // 1. Crisp Clear Twilight-Violet Sunset & Emerging Stars Backdrop behind the back arched window
  // (Replaces any grey fog with luminous, deep, clean contrast!)
  const winSkyMat = new THREE.ShaderMaterial({
    depthWrite: false,
    fog: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      void main() {
        vec3 top = vec3(0.035, 0.042, 0.125);
        vec3 mid = vec3(0.16, 0.10, 0.25);
        vec3 hor = vec3(0.68, 0.34, 0.24);
        vec3 col = mix(hor, mid, smoothstep(0.05, 0.48, vUv.y));
        col = mix(col, top, smoothstep(0.42, 0.92, vUv.y));

        // Delicate pinpoint twinkling twilight stars outside the window (NEVER blocky squares!)
        vec2 cellUv = vUv * vec2(68.0, 44.0);
        vec2 g = floor(cellUv);
        vec2 f = fract(cellUv) - 0.5;
        float st = hash21(g);
        if (st > 0.968 && vUv.y > 0.30) {
          vec2 jitter = vec2(hash21(g + 7.1), hash21(g + 19.3)) * 0.44 - 0.22;
          float d2 = dot(f - jitter, f - jitter);
          float pinpoint = exp(-d2 * 145.0);
          float tw = 0.55 + 0.45 * sin(uTime * 2.1 + st * 250.0);
          col += vec3(0.98, 0.94, 1.0) * smoothstep(0.30, 0.68, vUv.y) * pinpoint * tw * 1.15;
        }
        // Soft silhouette of swaying sunflower horizon just outside the window sill
        float ridge = 0.14 + 0.03 * sin(vUv.x * 16.0) + 0.015 * cos(vUv.x * 38.0 + uTime * 0.6);
        if (vUv.y < ridge) {
          col = mix(vec3(0.04, 0.03, 0.06), col, smoothstep(ridge - 0.02, ridge, vUv.y));
        }
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `
  });
  const winSky = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), winSkyMat);
  winSky.position.set(0, 3.2, -7.8);
  group.add(winSky);

  // 2. Floating Warm Golden Dust Motes & Cinema Bokeh Orbs inside the Room (Zero Grey Haze!)
  const moteCount = 220;
  const mPos = new Float32Array(moteCount * 3);
  const mCol = new Float32Array(moteCount * 3);
  const mSize = new Float32Array(moteCount);
  const mPhase = new Float32Array(moteCount);
  let seed = 88421;
  const rand = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < moteCount; i++) {
    mPos[i * 3] = (rand() - 0.5) * 13.5;
    mPos[i * 3 + 1] = 0.7 + rand() * 4.5;
    mPos[i * 3 + 2] = -4.6 + rand() * 9.5;
    const isBokeh = i % 9 === 0;
    mSize[i] = isBokeh ? (2.8 + rand() * 2.4) : (0.7 + rand() * 0.9);
    mPhase[i] = rand() * Math.PI * 2;
    const c = i % 4 === 0 ? new THREE.Color(0x7ef0cf) : new THREE.Color(0xffd286);
    const l = isBokeh ? 0.34 : 0.68;
    mCol[i * 3] = c.r * l;
    mCol[i * 3 + 1] = c.g * l;
    mCol[i * 3 + 2] = c.b * l;
  }
  const mGeo = new THREE.BufferGeometry();
  mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  mGeo.setAttribute('color', new THREE.BufferAttribute(mCol, 3));
  mGeo.setAttribute('aSize', new THREE.BufferAttribute(mSize, 1));
  mGeo.setAttribute('aPhase', new THREE.BufferAttribute(mPhase, 1));
  const dustMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: { uTime: { value: 0 }, uScale: { value: dpr } },
    vertexShader: `
      attribute float aSize;
      attribute float aPhase;
      varying vec3 vColor;
      varying float vTw;
      uniform float uTime;
      uniform float uScale;
      void main() {
        vColor = color;
        vec3 p = position;
        p.x += sin(uTime * 0.30 + aPhase) * 0.16;
        p.y += sin(uTime * 0.24 + aPhase * 1.4) * 0.14;
        p.z += cos(uTime * 0.26 - aPhase) * 0.14;
        vTw = 0.45 + 0.55 * sin(uTime * 1.4 + aPhase * 2.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(18.0 * aSize * uScale / max(1.8, -mv.z), 1.2, 16.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vTw;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        // Soft creamy aperture bokeh disc with gentle edge bloom
        float a = smoothstep(0.5, 0.16, d) * 0.58 * vTw;
        gl_FragColor = vec4(vColor, a);
        #include <colorspace_fragment>
      }
    `
  });
  group.add(new THREE.Points(mGeo, dustMat));

  // 3. Crisp High-Contrast Studio/Gallery Room Lighting (Rich Dark Shadows + Focused Warm Pools)
  const addLight = (hex, intensity, dist, x, y, z, decay = 1.65) => {
    const pt = new THREE.PointLight(hex, intensity, dist, decay);
    pt.position.set(x, y, z);
    group.add(pt);
    return pt;
  };
  const exhibitLights = {
    photo: addLight(0xffcf82, 4.6, 8.5, -4.4, 2.85, 1.55),
    moyan: addLight(0xffc676, 4.4, 8.5, -2.75, 2.75, -2.2),
    lab: addLight(0x7ef0cf, 4.2, 8.5, 2.85, 2.75, -2.2),
    atlas: addLight(0x9cf0df, 5.2, 9.5, -0.5, 3.1, 1.15),
    river: addLight(0xffbe64, 5.4, 8.5, 4.4, 2.75, 1.55)
  };
  // Subtle warm window rim light from sunset dusk outside
  const windowRim = new THREE.DirectionalLight(0xd696b8, 0.72);
  windowRim.position.set(0, 4.2, -9.5);
  windowRim.target.position.set(0, 1.0, 0.5);
  group.add(windowRim, windowRim.target);

  // Dedicated dynamic macro focus key light + crisp rim light that glides onto whichever miniature is inspected!
  const focusKey = new THREE.PointLight(0xffe0aa, 0.0, 7.5, 1.5);
  const focusRim = new THREE.PointLight(0x88d4ff, 0.0, 7.0, 1.6);
  group.add(focusKey, focusRim);

  // 4. Invisible Overview Click Hitboxes for all 5 Miniature Worlds (so clicking any table/box focuses it cleanly!)
  const overviewHits = [];
  const hitSpecs = [
    ['photo', -4.55, 1.32, 1.35, 2.2, 1.2, 1.7, 0.42],
    ['moyan', -2.55, 1.26, -2.55, 3.4, 1.0, 1.8, 0.0],
    ['lab', 2.55, 1.28, -2.55, 3.4, 1.1, 1.8, 0.0],
    ['atlas', 0.0, 1.18, 0.65, 3.0, 1.1, 3.0, 0.0],
    ['river', 4.55, 1.45, 1.35, 2.4, 1.3, 2.6, -0.42]
  ];
  const invisibleMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });
  for (const [id, x, y, z, w, h, d, ry] of hitSpecs) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), invisibleMat);
    box.position.set(x, y, z);
    box.rotation.y = ry;
    box.name = `ExhibitHit_${id}`;
    box.userData.__qzExhibitId = id;
    box.userData.__qzInteractiveName = `Exhibit_${id}`;
    group.add(box);
    overviewHits.push(box);
  }

  // 5. Containers for Embedded Miniature Worlds (china-atlas.glb & jiangnan-river.glb)
  const miniAtlasMount = new THREE.Group();
  miniAtlasMount.name = 'Mini_ChinaAtlas_Mount';
  miniAtlasMount.position.set(0.0, 0.94, 0.65);
  group.add(miniAtlasMount);

  const miniRiverMount = new THREE.Group();
  miniRiverMount.name = 'Mini_RiverTerrarium_Mount';
  miniRiverMount.position.set(4.55, 1.10, 1.35);
  miniRiverMount.rotation.y = -0.42;
  group.add(miniRiverMount);

  // Subtle floating mini-clouds above the miniature China Atlas pedestal
  const miniCloudMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      float n2(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
          mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }
      void main() {
        float r = length(vUv - vec2(0.5));
        float mask = smoothstep(0.48, 0.16, r);
        float c = n2(vUv * 5.2 + vec2(uTime * 0.03, -uTime * 0.015)) * 0.65 + n2(vUv * 10.0 - vec2(uTime * 0.02, 0.0)) * 0.35;
        float a = smoothstep(0.52, 0.84, c) * mask * 0.24;
        if (a < 0.005) discard;
        gl_FragColor = vec4(vec3(0.70, 0.90, 0.86), a);
        #include <colorspace_fragment>
      }
    `
  });
  const miniCloud = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.0), miniCloudMat);
  miniCloud.rotation.x = -Math.PI / 2;
  miniCloud.position.set(0.0, 1.18, 0.65);
  group.add(miniCloud);

  // Dynamic spawned lotus wish lanterns inside the miniature Jiangnan river terrarium!
  const spawnedLanterns = [];
  function disposeGroupRecursive(obj) {
    obj.traverse((ch) => {
      if (ch.isMesh) {
        ch.geometry?.dispose?.();
        ch.material?.dispose?.();
      }
    });
  }
  function spawnWishLantern(onSplash) {
    const lan = createMiniWishLanternMesh();
    const xBase = (Math.random() - 0.5) * 0.46;
    const zStart = 0.72;
    lan.position.set(xBase, 0.048, zStart);
    miniRiverMount.add(lan);
    spawnedLanterns.push({ mesh: lan, z: zStart, xBase, phase: Math.random() * Math.PI * 2 });
    onSplash?.(xBase, zStart);
    if (spawnedLanterns.length > 8) {
      const old = spawnedLanterns.shift();
      miniRiverMount.remove(old.mesh);
      disposeGroupRecursive(old.mesh);
    }
    return { x: xBase, z: zStart };
  }

  // Awakening animation states
  let slideTrayOpen = 0;
  let lidOpenAngle = 0;
  let sealAnimT = -1; // >=0 when physically stamping!
  const sealBasePos = new THREE.Vector3();
  let sealBaseCaptured = false;
  const trayBasePos = new THREE.Vector3();
  let trayBaseCaptured = false;
  const slideBaseY = new Map();

  function triggerSealStamp() {
    sealAnimT = 0;
  }

  function update({ elapsed, dt, focusedExhibitId, hoveredExhibitId, selectedSampleIdx, namedObjects, prefersReducedMotion }) {
    winSkyMat.uniforms.uTime.value = elapsed;
    dustMat.uniforms.uTime.value = elapsed;
    miniCloudMat.uniforms.uTime.value = elapsed;

    // 1. Dynamic Gallery Spotlights: highlight focused or hovered miniature world while keeping others warmly intimate!
    for (const ex of ROOM_EXHIBITS) {
      const pt = exhibitLights[ex.id];
      if (!pt) continue;
      let targetInt = 3.8;
      if (focusedExhibitId) {
        targetInt = focusedExhibitId === ex.id ? 6.8 : 1.75; // Deep dramatic dark-room contrast for bokeh!
      } else if (hoveredExhibitId === ex.id) {
        targetInt = 6.2;
      }
      pt.intensity += (targetInt - pt.intensity) * Math.min(1, dt * 6.5);
    }

    const focusEx = getExhibitById(focusedExhibitId);
    if (focusEx) {
      focusKey.position.lerp(focusEx.spotPos, Math.min(1, dt * 8));
      focusKey.color.lerp(new THREE.Color(focusEx.spotColor), Math.min(1, dt * 8));
      focusKey.intensity += (4.8 - focusKey.intensity) * Math.min(1, dt * 6);

      focusRim.position.set(focusEx.target.x - 1.1, focusEx.target.y + 1.35, focusEx.target.z - 1.25);
      focusRim.intensity += (2.8 - focusRim.intensity) * Math.min(1, dt * 6);
    } else {
      focusKey.intensity += (0 - focusKey.intensity) * Math.min(1, dt * 6);
      focusRim.intensity += (0 - focusRim.intensity) * Math.min(1, dt * 6);
    }

    // 2. Awakening Anim A — Photo Slide Tray smoothly glides forward when focusing 'photo'
    const tray = namedObjects.get('Photo_Slide_Tray');
    if (tray) {
      if (!trayBaseCaptured) { trayBasePos.copy(tray.position); trayBaseCaptured = true; }
      const targetSlide = focusedExhibitId === 'photo' ? 1.0 : 0.0;
      slideTrayOpen += (targetSlide - slideTrayOpen) * Math.min(1, dt * (prefersReducedMotion ? 20 : 5.5));
      tray.position.set(
        trayBasePos.x + Math.sin(0.42) * 0.22 * slideTrayOpen,
        trayBasePos.y + 0.015 * slideTrayOpen,
        trayBasePos.z + Math.cos(0.42) * 0.22 * slideTrayOpen
      );
    }

    // 3. Awakening Anim B — Herbarium Glass Lid hinges open 42 deg & selected specimen levitates when focusing 'lab'
    const lid = namedObjects.get('Herbarium_Glass_Lid');
    if (lid) {
      const targetAngle = focusedExhibitId === 'lab' ? -0.74 : 0.0;
      lidOpenAngle += (targetAngle - lidOpenAngle) * Math.min(1, dt * (prefersReducedMotion ? 20 : 5.2));
      lid.rotation.x = lidOpenAngle;
    }
    for (let i = 0; i < 4; i++) {
      const sl = namedObjects.get(`Herbarium_Slide_${i}`);
      if (!sl) continue;
      if (!slideBaseY.has(i)) slideBaseY.set(i, sl.position.y);
      const lift = (focusedExhibitId === 'lab' && i === selectedSampleIdx) ? 0.055 : 0.0;
      sl.position.y += (slideBaseY.get(i) + lift - sl.position.y) * Math.min(1, dt * 7);
    }

    // 4. Awakening Anim C — Physical 3D Lift-and-Stamp Animation for ZhuSha Seal!
    const seal = namedObjects.get('ZhuSha_Seal_Block');
    if (seal) {
      if (!sealBaseCaptured) { sealBasePos.copy(seal.position); sealBaseCaptured = true; }
      if (sealAnimT >= 0) {
        sealAnimT += dt * 1.9;
        if (sealAnimT >= 1) {
          seal.position.copy(sealBasePos);
          sealAnimT = -1;
        } else {
          // Arc over to Book_Moyan left page & press down firmly at t=0.52!
          const p = sealAnimT;
          const arc = Math.sin(p * Math.PI);
          const press = Math.exp(-Math.pow((p - 0.52) * 10.0, 2.0));
          const horiz = Math.sin(Math.min(1, p * 1.05) * Math.PI);
          seal.position.set(
            sealBasePos.x - 1.32 * horiz,
            sealBasePos.y + 0.34 * arc - 0.24 * press,
            sealBasePos.z - 0.14 * horiz
          );
        }
      }
    }

    // 5. Floating Spawned Lotus Wish Lanterns inside the Miniature Jiangnan Glass Canal
    for (const ln of spawnedLanterns) {
      if (!prefersReducedMotion) {
        ln.z -= dt * 0.095;
        if (ln.z < -0.90) ln.z = 0.78;
        ln.mesh.position.set(
          ln.xBase + Math.sin(elapsed * 1.15 + ln.phase) * 0.036,
          0.046 + Math.sin(elapsed * 2.1 + ln.phase) * 0.008,
          ln.z
        );
        ln.mesh.rotation.y = elapsed * 0.35 + ln.phase;
      }
    }
  }

  return {
    group,
    overviewHits,
    miniAtlasMount,
    miniRiverMount,
    spawnWishLantern,
    getSpawnedLanterns: () => spawnedLanterns,
    triggerSealStamp,
    update
  };
}
