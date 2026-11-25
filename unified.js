import * as THREE from './vendor/three/three.module.js';
import { GLTFLoader } from './vendor/three/GLTFLoader.js';
import { EffectComposer } from './vendor/three/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/three/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/three/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/three/postprocessing/OutputPass.js';

import { buildGalaxyAct, createCloudDiveScene, PLANET_POS } from './galaxy-act.js';
import { buildSunflowerAct } from './sunflower-act.js';
import {
  buildRoomAct,
  ROOM_OVERVIEW_POS,
  ROOM_OVERVIEW_TARGET,
  ROOM_EXHIBITS,
  getExhibitById
} from './room-act.js';
import {
  buildAtlasSeaShader,
  buildAtlasRiverShader,
  buildAtlasGoldenFilaments
} from './atlas-fx.js';
import { buildMiniRiverWaterMaterial } from './river-water.js';
import {
  paintXuanPaperBase,
  makeWalnutTexture,
  makeBlueprintTexture,
  makeHerbariumSlideTexture,
  makeLinearRoughNormalMaps,
  buildProceduralEnvMap
} from './shop-textures.js';
import {
  PLACES_22,
  clamp,
  archive,
  updateSolarTermHUD,
  playChimeSound,
  playWoodTapSound,
  getSealsMap,
  togglePoemSeal
} from './shop-data.js';
import { createShopModals } from './shop-modals.js';

const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;

/* =========================================================================
   1. APPLICATION STATE
   ========================================================================= */
const state = {
  act: 'galaxy',          // 'galaxy' | 'sunflower' | 'room'
  focusedExhibit: null,   // null (Room Overview) | 'photo' | 'moyan' | 'lab' | 'atlas' | 'river'
  hoveredExhibit: null,
  hoveredObjectName: null,

  // Act I Galaxy camera orbit
  galaxyYaw: 0.34,
  galaxyPitch: 0.42,
  galaxyDist: 19.6,
  targetGalaxyYaw: 0.34,
  targetGalaxyPitch: 0.42,
  targetGalaxyDist: 19.6,

  // Act II Sunflower meadow walk & parallax
  sunflowerWalk: 0.0,
  targetSunflowerWalk: 0.0,

  // Act III Miniature Inspect camera orbit
  inspectYaw: 0.16,
  inspectPitch: 0.62,
  inspectDist: 2.75,
  targetInspectYaw: 0.16,
  targetInspectPitch: 0.62,
  targetInspectDist: 2.75,

  // Pointer NDC for gentle parallax & raycast
  pointerNdcX: 0,
  pointerNdcY: 0,
  smoothPtrX: 0,
  smoothPtrY: 0,

  // Selections across the 5 miniature worlds
  selectedWorkSlug: 'still-water',
  selectedPoemSlug: 'moyan-01',
  selectedLabSlug: 'rongrong',
  selectedSampleIdx: 0,
  selectedCityName: '上海',
  selectedAtlasRegion: 'all',

  // Darkroom modal state
  darkroomWorkSlug: 'still-water',
  darkroomPhotoIdx: 0,
  darkroomZoomed: false,
  darkroomPanX: 0,
  darkroomPanY: 0,
  darkroomIntroOpen: false,
  darkroomLoadingToken: 0,

  // Active transition director
  transition: null, // { kind: 'dive'|'rise'|'enterRoom'|'exitRoom', elapsed, dur, swapped, startPos, startLook }
  manualCloudDive: -1,

  // Room asset loading status
  roomLoaded: false,
  roomLoadingPromise: null
};

/* =========================================================================
   2. THREE.JS RENDERER, SCENE, CAMERA & POST-PROCESSING
   ========================================================================= */
const canvas = document.getElementById('onetake-canvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});
const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
renderer.setPixelRatio(dpr);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04070f);

const camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.08, 420);
camera.position.set(6.4, 8.2, 18.2);
const camPos = camera.position.clone();
const camLook = new THREE.Vector3(0.8, 0.2, 0.4);
camera.lookAt(camLook);

// Procedural neutral-warm IBL for realistic brass, glass & carved walnut highlights
buildProceduralEnvMap(renderer, scene);

// Subtle room ambient base (tuned per-act in applyActAtmosphere)
const globalAmbient = new THREE.AmbientLight(0xd8c8ba, 0.35);
scene.add(globalAmbient);

// Post-processing composer (gentle poetic bloom without blowing out calligraphy/photos)
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.34,
  0.42,
  0.84
);
const outputPass = new OutputPass();
composer.addPass(renderPass);
composer.addPass(bloomPass);
composer.addPass(outputPass);

/* =========================================================================
   3. BUILD THE 3 PROCEDURAL ACT STAGE CONTAINERS + CLOUD-BREAK OVERLAY
   ========================================================================= */
const galaxyAct = buildGalaxyAct(dpr);
const sunflowerAct = buildSunflowerAct(dpr);
const roomAct = buildRoomAct(dpr);
const cloudDive = createCloudDiveScene();
cloudDive.setAspect(window.innerWidth / Math.max(1, window.innerHeight));

sunflowerAct.group.visible = false;
roomAct.group.visible = false;

scene.add(galaxyAct.group);
scene.add(sunflowerAct.group);
scene.add(roomAct.group);

/* =========================================================================
   4. ROOM GLB TRACKING, DYNAMIC BOOK TEXTURE & EMBEDDED MINIATURE WORLDS
   ========================================================================= */
const namedObjects = new Map();
const materialsByName = new Map();
const roomInteractiveTargets = [];
const atlasCityGroups = [];
const atlasCityBeacons = [];
const miniRiverBoats = [];
const customShaderUniforms = [];

let atlasFilaments = null;
let miniWaterMat = null;
let eaveCatObj = null;
let catBaseScaleY = 1;
let rippleCursor = 0;
let simElapsed = 0;
const RIVER_WRAP_SCALE = 0.068;
const RIVER_WRAP_POS_Z = 79.5 * RIVER_WRAP_SCALE - 0.12;

let bookCanvas = null;
let bookTex = null;

function updateBookMoyanTexture() {
  const mat = materialsByName.get('BookSpreadMat');
  if (!mat) return;
  if (!bookCanvas) {
    bookCanvas = document.createElement('canvas');
    bookCanvas.width = 1024;
    bookCanvas.height = 1024;
    bookTex = new THREE.CanvasTexture(bookCanvas);
    bookTex.colorSpace = THREE.SRGBColorSpace;
    bookTex.flipY = false;
    bookTex.anisotropy = 4;
    mat.map = bookTex;
    mat.color.setHex(0xffffff);
    mat.roughness = 0.86;
    mat.needsUpdate = true;
  }
  const ctx = bookCanvas.getContext('2d');
  paintXuanPaperBase(ctx, 1024, 1024);

  const notes = archive().notes || [];
  const poem = notes.find((p) => p.slug === state.selectedPoemSlug) || notes[0];
  if (poem) {
    const drawVert = (text, x, yStart, stepY, font, fill) => {
      ctx.font = font;
      ctx.fillStyle = fill;
      ctx.textAlign = 'center';
      let y = yStart;
      for (const ch of String(text || '')) {
        if (y > 930) break;
        ctx.fillText(ch, x, y);
        y += stepY;
      }
    };
    // Right page: Title + Date/Place + Opening Columns
    drawVert(`《${poem.title}》`, 948, 128, 46, 'bold 38px "Noto Serif SC", "Songti SC", serif', '#1a1410');
    drawVert(`${poem.id} · ${poem.date || ''}${poem.place ? ` · ${poem.place}` : ''}`, 878, 140, 30, '22px "Noto Serif SC", serif', '#7c4c34');

    const lines = (poem.body || []).flatMap((st) => st.split('\n')).filter((l) => l.trim());
    const rightCols = [806, 734, 662, 590];
    const leftCols = [440, 368, 296, 224, 152, 80];
    const allCols = [...rightCols, ...leftCols];
    for (let i = 0; i < Math.min(lines.length, allCols.length); i++) {
      drawVert(lines[i], allCols[i], 136, 38, '30px "Noto Serif SC", "Songti SC", serif', '#1d1814');
    }

    // Cinnabar Seal on bottom-left page if stamped!
    if (getSealsMap()[poem.slug]) {
      ctx.save();
      ctx.translate(112, 845);
      ctx.strokeStyle = '#c42e24';
      ctx.fillStyle = 'rgba(196, 46, 36, 0.90)';
      ctx.lineWidth = 5;
      ctx.strokeRect(-38, -38, 76, 76);
      ctx.fillRect(-31, -31, 62, 62);
      ctx.fillStyle = '#f6eedc';
      ctx.font = 'bold 26px "Noto Serif SC", serif';
      ctx.textAlign = 'center';
      ctx.fillText('清', 14, -4);
      ctx.fillText('舟', 14, 24);
      ctx.fillText('之', -14, -4);
      ctx.fillText('印', -14, 24);
      ctx.restore();
    }
  }
  bookTex.needsUpdate = true;
}

function mountToRiverLocal(mx, mz) {
  return {
    x: mx / RIVER_WRAP_SCALE,
    z: (mz - RIVER_WRAP_POS_Z) / RIVER_WRAP_SCALE
  };
}

function triggerRiverRipple(mx, mz) {
  if (!miniWaterMat) return;
  const pt = mountToRiverLocal(mx, mz);
  const slot = miniWaterMat.uniforms.uRipples.value[rippleCursor % 4];
  slot.set(pt.x, pt.z, simElapsed, 1.0);
  rippleCursor++;
}

function spawnWishWithSplash() {
  return roomAct.spawnWishLantern((mx, mz) => triggerRiverRipple(mx, mz));
}

function buildRiverTerrariumClipPlanes() {
  // Compute 4 inward-facing world-space clipping planes matching Mini_RiverTerrarium's glass walls!
  // Glass case mounted at roomAct.miniRiverMount: pos (4.55, 1.10, 1.35), rotY = -0.42
  roomAct.miniRiverMount.updateMatrixWorld(true);
  const m = roomAct.miniRiverMount.matrixWorld;
  const origin = new THREE.Vector3().setFromMatrixPosition(m);
  const rotMat = new THREE.Matrix4().extractRotation(m);
  const right = new THREE.Vector3(1, 0, 0).applyMatrix4(rotMat).normalize();
  const fwd = new THREE.Vector3(0, 0, 1).applyMatrix4(rotMat).normalize();
  const up = new THREE.Vector3(0, 1, 0);

  const hx = 1.05;
  const hz = 1.12;
  const planes = [
    new THREE.Plane().setFromNormalAndCoplanarPoint(right.clone(), origin.clone().addScaledVector(right, -hx)),
    new THREE.Plane().setFromNormalAndCoplanarPoint(right.clone().negate(), origin.clone().addScaledVector(right, hx)),
    new THREE.Plane().setFromNormalAndCoplanarPoint(fwd.clone(), origin.clone().addScaledVector(fwd, -hz)),
    new THREE.Plane().setFromNormalAndCoplanarPoint(fwd.clone().negate(), origin.clone().addScaledVector(fwd, hz)),
    new THREE.Plane().setFromNormalAndCoplanarPoint(up.clone(), origin.clone().addScaledVector(up, -0.02))
  ];
  return planes;
}

function bindRoomProceduralTextures() {
  // 1. Hand-rubbed satin walnut desk wood (subtle organic grain, zero periodic striping!)
  const deskMat = materialsByName.get('DeskTopWood');
  if (deskMat) {
    deskMat.map = makeWalnutTexture();
    const { roughTex, normalTex } = makeLinearRoughNormalMaps(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#929292';
      ctx.fillRect(0, 0, w, h);
      let s = 31337;
      const rnd = () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; };
      for (let i = 0; i < 420; i++) {
        const y = rnd() * h;
        const v = Math.round(132 + rnd() * 28);
        ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
        ctx.fillRect(0, y, w, 1 + rnd() * 2);
      }
    }, 0.25, 1, 1);
    deskMat.roughnessMap = roughTex;
    deskMat.normalMap = normalTex;
    deskMat.normalScale = new THREE.Vector2(0.28, 0.28);
    deskMat.roughness = 0.68;
    deskMat.needsUpdate = true;
  }

  // 2. Curved Xuan paper book spread 《墨盐》
  updateBookMoyanTexture();

  // 3. Cyanotype lab blueprints (LabBlueprintMat_0..2)
  for (let i = 0; i < 3; i++) {
    const bpMat = materialsByName.get(`LabBlueprintMat_${i}`);
    if (bpMat) {
      bpMat.map = makeBlueprintTexture(i);
      bpMat.color.setHex(0xffffff);
      bpMat.roughness = 0.72;
      bpMat.emissive = new THREE.Color(0x16424a);
      bpMat.emissiveIntensity = 0.28;
      bpMat.needsUpdate = true;
    }
  }

  // 4. Four botanical herbarium slides (HerbariumSlideMat_0..3)
  for (let i = 0; i < 4; i++) {
    const slMat = materialsByName.get(`HerbariumSlideMat_${i}`);
    if (slMat) {
      slMat.map = makeHerbariumSlideTexture(i);
      slMat.color.setHex(0xffffff);
      slMat.roughness = 0.55;
      slMat.emissive = new THREE.Color(0x1a3028);
      slMat.emissiveIntensity = 0.22;
      slMat.needsUpdate = true;
    }
  }

  // 5. Three backlit photo slide thumbnails on the vintage lightbox (PhotoThumbMat_0..2)
  const photoFiles = ['./assets/lake-640.jpg', './assets/dunes-640.jpg', './assets/forest-640.jpg'];
  const texLoader = new THREE.TextureLoader();
  for (let i = 0; i < 3; i++) {
    const pMat = materialsByName.get(`PhotoThumbMat_${i}`);
    if (pMat) {
      const tex = texLoader.load(photoFiles[i]);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY = false;
      pMat.map = tex;
      pMat.color.setHex(0xffffff);
      pMat.emissiveMap = tex;
      pMat.emissive = new THREE.Color(0xfff0d4);
      pMat.emissiveIntensity = 0.58;
      pMat.roughness = 0.32;
      pMat.needsUpdate = true;
    }
  }

  // 6. Crystal-clear glass for Terrarium & Herbarium Lid (ZERO cloudy haze!)
  for (const gName of ['GlassCase', 'TerrariumGlass', 'HerbariumGlass', 'Glass_Clear']) {
    const gMat = materialsByName.get(gName);
    if (gMat) {
      gMat.transparent = true;
      gMat.opacity = 0.16;
      gMat.roughness = 0.08;
      gMat.metalness = 0.1;
      gMat.depthWrite = false;
      gMat.color.setHex(0xdcf4ff);
      gMat.needsUpdate = true;
    }
  }
}

function registerRoomInteractiveMeshes() {
  // IMPORTANT: Runs AFTER bindRoomProceduralTextures so cloned materials inherit all CanvasTextures!
  const interactivePatterns = [
    { prefix: 'Photo_Slide_Card_', role: 'photoCard' },
    { prefix: 'Book_Moyan_Spread', role: 'bookMoyan' },
    { prefix: 'ZhuSha_Seal_Block', role: 'sealBlock' },
    { prefix: 'Herbarium_Slide_', role: 'herbSlide' },
    { prefix: 'Lab_Plate_', role: 'labPlate' }
  ];
  namedObjects.forEach((obj, name) => {
    const match = interactivePatterns.find((p) => name.startsWith(p.prefix));
    if (!match) return;
    obj.traverse((child) => {
      if (!child.isMesh) return;
      if (child.material && typeof child.material.clone === 'function') {
        const origName = child.material.name;
        child.material = child.material.clone();
        child.material.name = origName;
        // Re-bind live BookSpreadMat pointer to the cloned material so poem switches update 3D book live!
        if (origName === 'BookSpreadMat') {
          materialsByName.set('BookSpreadMat', child.material);
        }
      }
      child.userData.__qzInteractiveName = name;
      child.userData.__qzRole = match.role;
      roomInteractiveTargets.push(child);
    });
  });
}

function ensureRoomLoaded() {
  if (state.roomLoaded) return Promise.resolve();
  if (state.roomLoadingPromise) return state.roomLoadingPromise;

  const loader = new GLTFLoader();
  const loadGlb = (url) => new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));

  state.roomLoadingPromise = Promise.all([
    loadGlb('./assets/curiosity-room.glb'),
    loadGlb('./assets/china-atlas.glb'),
    loadGlb('./assets/jiangnan-river.glb')
  ]).then(([roomGltf, atlasGltf, riverGltf]) => {
    // 1. Mount main single-room curiosity shop GLB
    roomAct.group.add(roomGltf.scene);
    roomGltf.scene.traverse((obj) => {
      if (obj.name) namedObjects.set(obj.name, obj);
      if (obj.isMesh && obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          if (m.name && !materialsByName.has(m.name)) {
            materialsByName.set(m.name, m);
          }
        }
      }
    });
    // Bind textures BEFORE hover cloning!
    bindRoomProceduralTextures();
    registerRoomInteractiveMeshes();

    // 2. Embed sculpted China Atlas onto the Center Octagonal Pedestal (scale 0.082)
    const atlasWrap = new THREE.Group();
    atlasWrap.name = 'Mini_ChinaAtlas_Inner';
    atlasWrap.scale.setScalar(0.082);
    // Original china-atlas.glb sits around (0, 1.38, -41.5) -> recenter onto pedestal surface!
    atlasWrap.position.set(0.0, -0.02, 41.5 * 0.082);
    atlasWrap.add(atlasGltf.scene);
    roomAct.miniAtlasMount.add(atlasWrap);

    const cityLocalPositions = new Array(22);
    atlasGltf.scene.traverse((obj) => {
      if (obj.name) namedObjects.set(`Atlas_${obj.name}`, obj);
      if (obj.name === 'Atlas_Orbital_Ring') {
        namedObjects.set('Atlas_Orbital_Ring', obj);
        // Keep the brass astrolabe ring low & flat around the pedestal rim so it never slices vertically across close-up camera!
        obj.rotation.set(0.08, 0.0, 0.04);
        obj.scale.setScalar(0.95);
      }
      const beaconGroupMatch = obj.name.match(/^City_Beacon_(\d+)$/);
      if (beaconGroupMatch) {
        const idx = parseInt(beaconGroupMatch[1], 10);
        cityLocalPositions[idx] = obj.position.clone();
        atlasCityGroups[idx] = obj;
      }
      if (obj.isMesh) {
        if (obj.name === 'Atlas_Sea_Basin') {
          obj.material = buildAtlasSeaShader(customShaderUniforms);
        } else if (obj.name.includes('Yangtze')) {
          obj.material = buildAtlasRiverShader(0x289088, 0x8efae8, 2.2, customShaderUniforms);
        } else if (obj.name.includes('Yellow')) {
          obj.material = buildAtlasRiverShader(0xb88230, 0xffe08a, 2.5, customShaderUniforms);
        } else if (obj.name.includes('Xijiang') || obj.name.includes('Pearl')) {
          obj.material = buildAtlasRiverShader(0x2a7a96, 0x8ce2ff, 2.0, customShaderUniforms);
        } else if (obj.name.startsWith('River_Spline_')) {
          obj.material = buildAtlasRiverShader(0x2c7d76, 0x76e8d4, 1.8, customShaderUniforms);
        } else {
          const coreMatch = obj.name.match(/^City_Beacon_(Core|Base)_(\d+)$/);
          if (coreMatch) {
            const idx = parseInt(coreMatch[2], 10);
            if (obj.material && obj.material.clone) obj.material = obj.material.clone();
            obj.userData.__qzInteractiveName = obj.name;
            obj.userData.__qzRole = 'cityBeacon';
            obj.userData.__qzCityIndex = idx;
            if (coreMatch[1] === 'Core') atlasCityBeacons[idx] = obj;
            roomInteractiveTargets.push(obj);
          }
        }
      }
    });

    atlasFilaments = buildAtlasGoldenFilaments(cityLocalPositions, PLACES_22, customShaderUniforms);
    atlasGltf.scene.add(atlasFilaments.group);

    // 3. Embed sculpted Jiangnan River into the Brass-Framed Glass Terrarium (clipped cleanly!)
    const clipPlanes = buildRiverTerrariumClipPlanes();
    const riverWrap = new THREE.Group();
    riverWrap.name = 'Mini_JiangnanRiver_Inner';
    riverWrap.scale.setScalar(RIVER_WRAP_SCALE);
    // Original hero bridge & canal centered around (0, -6.5, -79.5) — tucked cleanly inside brass glass box!
    riverWrap.position.set(0.0, 6.55 * RIVER_WRAP_SCALE + 0.02, RIVER_WRAP_POS_Z);
    riverWrap.add(riverGltf.scene);
    roomAct.miniRiverMount.add(riverWrap);

    miniWaterMat = buildMiniRiverWaterMaterial(clipPlanes);
    customShaderUniforms.push(miniWaterMat.uniforms.uTime);

    let boatCounter = 0;
    const boatByIndex = new Map();
    riverGltf.scene.traverse((obj) => {
      // Capture animated group nodes BEFORE mesh-only guard!
      const boatMatch = obj.name.match(/^River_Boat_Lantern_(\d+)$/);
      if (boatMatch) {
        const bIdx = parseInt(boatMatch[1], 10);
        const rec = {
          obj,
          index: bIdx,
          baseY: obj.position.y,
          phase: boatCounter * 1.18,
          lanternOffset: new THREE.Vector3(0, 0.65, 1.54)
        };
        miniRiverBoats.push(rec);
        boatByIndex.set(bIdx, rec);
        boatCounter++;
      }
      if (obj.name === 'Roof_Cat_3D') {
        eaveCatObj = obj;
        catBaseScaleY = obj.scale.y || 1.0;
      }

      if (!obj.isMesh) return;
      const bowLampMatch = obj.name.match(/^Boat_Lantern_(\d+)$/);
      if (bowLampMatch && obj.geometry) {
        const bIdx = parseInt(bowLampMatch[1], 10);
        const rec = boatByIndex.get(bIdx);
        if (rec) {
          obj.geometry.computeBoundingBox();
          obj.geometry.boundingBox.getCenter(rec.lanternOffset);
        }
      }
      if (obj.name === 'River_Bed' || obj.name.includes('Water')) {
        obj.material = miniWaterMat;
      } else if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          m.clippingPlanes = clipPlanes;
          m.clipShadows = true;
          m.needsUpdate = true;
        });
      }
      if (obj.name.startsWith('Boat_') || (obj.parent && obj.parent.name.startsWith('River_Boat_Lantern_'))) {
        obj.userData.__qzInteractiveName = obj.name;
        obj.userData.__qzRole = 'riverLantern';
        roomInteractiveTargets.push(obj);
      }
      if (obj.parent && obj.parent.name === 'Roof_Cat_3D') {
        obj.userData.__qzInteractiveName = 'Roof_Cat_3D';
        obj.userData.__qzRole = 'riverCat';
        roomInteractiveTargets.push(obj);
      }
    });

    // Update city beacon highlight & golden filaments for initial state
    highlightSelectedCityBeacon();
    state.roomLoaded = true;
  }).catch((err) => {
    console.error('[CuriosityRoom] Failed loading miniature GLBs:', err);
    state.roomLoadingPromise = null;
    throw err;
  });

  return state.roomLoadingPromise;
}

function highlightSelectedCityBeacon() {
  const sel = PLACES_22.find((p) => p.name === state.selectedCityName);
  const selIdx = sel ? sel.index : 15;
  const region = state.selectedAtlasRegion || 'all';

  for (let idx = 0; idx < PLACES_22.length; idx++) {
    const place = PLACES_22[idx];
    const grp = atlasCityGroups[idx];
    const core = atlasCityBeacons[idx];
    const isSel = idx === selIdx;
    const inRegion = region === 'all' || place.group === region;

    if (grp) {
      grp.scale.setScalar(isSel ? 1.48 : (inRegion ? 1.0 : 0.84));
    }
    if (core && core.material && core.material.emissive) {
      if (isSel) {
        core.material.emissive.setHex(0xffc966);
        core.material.emissiveIntensity = 2.2;
      } else if (inRegion) {
        core.material.emissive.setHex(place.hasDirectPoem ? 0xffd27d : 0x5fe2cc);
        core.material.emissiveIntensity = 1.15;
      } else {
        core.material.emissive.setHex(0x3a645e);
        core.material.emissiveIntensity = 0.25;
      }
    }
  }
  atlasFilaments?.updateEmphasis(selIdx, region);
}

/* =========================================================================
   5. MODALS & UI CONTROLLER
   ========================================================================= */
const modals = createShopModals({
  state,
  onUpdateBookMoyan: () => updateBookMoyanTexture(),
  onTriggerSealStamp: () => roomAct.triggerSealStamp(),
  onSpawnWishLantern: () => spawnWishWithSplash(),
  onFocusExhibit: (id) => {
    if (state.act !== 'room') {
      goAct('room', true).then(() => focusExhibit(id));
    } else {
      focusExhibit(id);
    }
  },
  onSelectCity: (cityName) => {
    state.selectedCityName = cityName;
    highlightSelectedCityBeacon();
    modals.renderExhibitDeck(true);
  },
  onSelectAtlasRegion: (region) => {
    state.selectedAtlasRegion = region || 'all';
    if (region !== 'all') {
      const cur = PLACES_22.find((p) => p.name === state.selectedCityName);
      if (!cur || cur.group !== region) {
        const firstInRegion = PLACES_22.find((p) => p.group === region);
        if (firstInRegion) state.selectedCityName = firstInRegion.name;
      }
    }
    highlightSelectedCityBeacon();
    modals.renderExhibitDeck(true);
  }
});

/* =========================================================================
   6. ACT ATMOSPHERE, HUD SYNC & SPATIAL MARKERS
   ========================================================================= */
function applyActAtmosphere(act) {
  galaxyAct.group.visible = (act === 'galaxy');
  sunflowerAct.group.visible = (act === 'sunflower');
  roomAct.group.visible = (act === 'room');

  if (act === 'galaxy') {
    scene.background.setHex(0x03060e);
    scene.fog = null;
    globalAmbient.color.setHex(0x88a2cc);
    globalAmbient.intensity = 0.25;
    bloomPass.strength = 0.40;
    bloomPass.threshold = 0.80;
    renderer.toneMappingExposure = 1.06;
  } else if (act === 'sunflower') {
    scene.background.setHex(0x281730);
    // Warm amber-plum atmospheric sunset depth (never grey!)
    scene.fog = new THREE.FogExp2(0x3a2034, 0.0085);
    globalAmbient.color.setHex(0xefb49a);
    globalAmbient.intensity = 0.42;
    bloomPass.strength = 0.36;
    bloomPass.threshold = 0.82;
    renderer.toneMappingExposure = 1.12;
  } else {
    // ACT III ROOM: ZERO GREY FOG! Crisp dark-walnut high-contrast gallery lighting!
    scene.background.setHex(0x09070b);
    scene.fog = null;
    globalAmbient.color.setHex(0xdec6ae);
    globalAmbient.intensity = 0.48;
    bloomPass.strength = 0.28;
    bloomPass.threshold = 0.88;
    renderer.toneMappingExposure = 1.10;
  }
}

function syncHudUI() {
  document.body.dataset.act = state.act;
  document.body.dataset.inspect = state.focusedExhibit || 'none';

  const badge = document.getElementById('hud-act-badge');
  if (badge) {
    if (state.act === 'galaxy') badge.textContent = 'ACT I · 旋臂银河';
    else if (state.act === 'sunflower') badge.textContent = 'ACT II · 紫金花海';
    else if (state.focusedExhibit) {
      const ex = getExhibitById(state.focusedExhibit);
      badge.textContent = `ACT III · ${ex ? ex.name : '微缩奇珍阁'}`;
    } else {
      badge.textContent = 'ACT III · 微缩奇珍阁';
    }
  }

  document.querySelectorAll('.act-pill[data-act-target]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.actTarget === state.act);
  });

  const galaxyBar = document.getElementById('act-galaxy-bar');
  const sunflowerBar = document.getElementById('act-sunflower-bar');
  const exhibitDock = document.getElementById('exhibit-dock');
  const inspectHint = document.getElementById('inspect-hint');

  if (galaxyBar) galaxyBar.hidden = (state.act !== 'galaxy');
  if (sunflowerBar) sunflowerBar.hidden = (state.act !== 'sunflower');
  if (exhibitDock) exhibitDock.hidden = (state.act !== 'room');
  if (inspectHint) inspectHint.hidden = !(state.act === 'room' && state.focusedExhibit);

  document.querySelectorAll('.exhibit-pill[data-exhibit]').forEach((btn) => {
    const isAct = btn.dataset.exhibit === state.focusedExhibit;
    btn.classList.toggle('is-active', isAct);
    if (isAct) {
      btn.scrollIntoView?.({ behavior: 'auto', inline: 'center', block: 'nearest' });
    }
  });
  const overviewBtn = document.getElementById('btn-room-overview');
  if (overviewBtn) overviewBtn.classList.toggle('is-active', state.act === 'room' && !state.focusedExhibit);

  modals.renderExhibitDeck(true);
}

/* ---------- Spatial 3D-Projected Floating Pins ---------- */
const markerLayer = document.getElementById('spatial-markers');
const markerNodes = new Map();
const projVec = new THREE.Vector3();

function ensureMarker(id, label, sub, onClick) {
  if (!markerLayer) return null;
  let el = markerNodes.get(id);
  if (!el) {
    el = document.createElement('button');
    el.type = 'button';
    el.className = 'spatial-pin';
    el.innerHTML = `<span class="pin-dot"></span><span class="pin-label">${label}</span>${sub ? `<span class="pin-sub">${sub}</span>` : ''}`;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });
    markerLayer.appendChild(el);
    markerNodes.set(id, el);
  }
  return el;
}

function updateSpatialMarkers() {
  if (!markerLayer) return;
  const activeIds = new Set();
  const w = window.innerWidth;
  const h = window.innerHeight;
  const placePin = (id, worldPos, label, sub, onClick) => {
    const el = ensureMarker(id, label, sub, onClick);
    if (!el) return;
    projVec.copy(worldPos).project(camera);
    const onScreen = projVec.z > -1 && projVec.z < 1 && projVec.x > -0.98 && projVec.x < 0.98 && projVec.y > -0.84 && projVec.y < 0.86;
    if (!onScreen) {
      el.hidden = true;
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      return;
    }
    activeIds.add(id);
    const sx = (projVec.x * 0.5 + 0.5) * w;
    const sy = (-projVec.y * 0.5 + 0.5) * h;
    el.hidden = false;
    el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%)`;
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
  };

  if (!state.transition) {
    if (state.act === 'galaxy') {
      placePin('planet', new THREE.Vector3(PLANET_POS.x, PLANET_POS.y + 1.85, PLANET_POS.z), '清舟星', '点击穿云降落', () => startCloudBreakDive());
    } else if (state.act === 'sunflower') {
      placePin('cottage', new THREE.Vector3(0.0, 5.2, -16.8), '清舟杂货铺', '随萤火虫入屋', () => startEnterRoomTransition());
    } else if (state.act === 'room' && !state.focusedExhibit) {
      const pinOffsets = {
        photo: new THREE.Vector3(-4.15, 2.20, 1.32),
        moyan: new THREE.Vector3(-2.55, 2.15, -2.50),
        lab: new THREE.Vector3(2.55, 2.20, -2.50),
        atlas: new THREE.Vector3(0.0, 2.08, 0.65),
        river: new THREE.Vector3(4.15, 2.32, 1.32)
      };
      for (const ex of ROOM_EXHIBITS) {
        placePin(`ex-${ex.id}`, pinOffsets[ex.id], `${ex.idx} ${ex.name}`, '', () => focusExhibit(ex.id));
      }
    }
  }

  markerNodes.forEach((el, id) => {
    if (!activeIds.has(id)) {
      el.hidden = true;
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
    }
  });
}

/* =========================================================================
   7. TRANSITIONS & ACT / EXHIBIT NAVIGATION
   ========================================================================= */
function getSunflowerCameraPose(walk, ptrX = 0, ptrY = 0) {
  const z = 9.2 - walk * 17.5;
  const cx = sunflowerAct.pathCenterX(z);
  const gy = sunflowerAct.groundY(cx, z);
  const pos = new THREE.Vector3(cx + ptrX * 0.55, gy + 1.95 + ptrY * 0.25, z);
  const lookZ = Math.max(-18.5, z - 16.0);
  const look = new THREE.Vector3(sunflowerAct.pathCenterX(lookZ) * 0.5 + ptrX * 0.3, 2.35 + ptrY * 0.2, lookZ);
  return { pos, look };
}

function getInspectCameraPose(ex, yaw, pitch, dist) {
  const cosP = Math.cos(pitch);
  const pos = new THREE.Vector3(
    ex.target.x + Math.sin(yaw) * cosP * dist,
    ex.target.y + Math.sin(pitch) * dist,
    ex.target.z + Math.cos(yaw) * cosP * dist
  );
  return { pos, look: ex.target.clone() };
}

function startCloudBreakDive() {
  if (state.transition) return;
  playChimeSound();
  ensureRoomLoaded().catch(() => {});
  if (prefersReducedMotion) {
    goAct('sunflower', true);
    return;
  }
  state.transition = {
    kind: 'dive',
    elapsed: 0,
    dur: 2.2,
    swapped: false,
    startPos: camPos.clone(),
    startLook: camLook.clone()
  };
}

function startRiseToGalaxy() {
  if (state.transition) return;
  playChimeSound();
  if (prefersReducedMotion) {
    goAct('galaxy', true);
    return;
  }
  state.transition = {
    kind: 'rise',
    elapsed: 0,
    dur: 1.75,
    swapped: false,
    startPos: camPos.clone(),
    startLook: camLook.clone()
  };
}

async function startEnterRoomTransition() {
  if (state.transition) return;
  playChimeSound();
  await ensureRoomLoaded();
  if (prefersReducedMotion) {
    goAct('room', true);
    return;
  }
  state.transition = {
    kind: 'enterRoom',
    elapsed: 0,
    dur: 1.55,
    swapped: false,
    startPos: camPos.clone(),
    startLook: camLook.clone()
  };
}

function startExitRoomToSunflower() {
  if (state.transition) return;
  playWoodTapSound();
  state.focusedExhibit = null;
  if (prefersReducedMotion) {
    goAct('sunflower', true);
    return;
  }
  state.transition = {
    kind: 'exitRoom',
    elapsed: 0,
    dur: 1.25,
    swapped: false,
    startPos: camPos.clone(),
    startLook: camLook.clone()
  };
}

async function goAct(act, instant = false) {
  if (act === 'room') await ensureRoomLoaded();
  if (!instant && !prefersReducedMotion) {
    if (state.act === 'galaxy' && act === 'sunflower') {
      startCloudBreakDive();
      return;
    }
    if (state.act === 'sunflower' && act === 'galaxy') {
      startRiseToGalaxy();
      return;
    }
    if (state.act === 'sunflower' && act === 'room') {
      startEnterRoomTransition();
      return;
    }
    if (state.act === 'room' && act === 'sunflower') {
      startExitRoomToSunflower();
      return;
    }
  }
  state.transition = null;
  state.act = act;
  if (act !== 'room') state.focusedExhibit = null;
  const veil = document.getElementById('matchcut-veil');
  if (veil) veil.style.opacity = '0';
  applyActAtmosphere(act);
  if (act === 'galaxy') {
    const cosP = Math.cos(state.galaxyPitch);
    camPos.set(
      Math.sin(state.galaxyYaw) * cosP * state.galaxyDist,
      Math.sin(state.galaxyPitch) * state.galaxyDist,
      Math.cos(state.galaxyYaw) * cosP * state.galaxyDist
    );
    camLook.set(1.2, 0.2, 0.5);
  } else if (act === 'sunflower') {
    state.sunflowerWalk = 0;
    state.targetSunflowerWalk = 0;
    const pose = getSunflowerCameraPose(0, 0, 0);
    camPos.copy(pose.pos);
    camLook.copy(pose.look);
  } else if (act === 'room') {
    if (state.focusedExhibit) {
      const ex = getExhibitById(state.focusedExhibit);
      if (ex) {
        const pose = getInspectCameraPose(ex, state.inspectYaw, state.inspectPitch, state.inspectDist);
        camPos.copy(pose.pos);
        camLook.copy(pose.look);
      }
    } else {
      camPos.copy(ROOM_OVERVIEW_POS);
      camLook.copy(ROOM_OVERVIEW_TARGET);
    }
  }
  camera.position.copy(camPos);
  camera.lookAt(camLook);
  syncHudUI();
}

function focusExhibit(id, instant = false) {
  if (!id) {
    state.focusedExhibit = null;
    playWoodTapSound();
    if (instant) {
      camPos.copy(ROOM_OVERVIEW_POS);
      camLook.copy(ROOM_OVERVIEW_TARGET);
      camera.position.copy(camPos);
      camera.lookAt(camLook);
    }
    syncHudUI();
    return;
  }
  const ex = getExhibitById(id);
  if (!ex) return;
  state.focusedExhibit = ex.id;
  state.targetInspectYaw = ex.defaultYaw;
  state.targetInspectPitch = ex.defaultPitch;
  state.targetInspectDist = ex.defaultDist;
  if (instant) {
    state.inspectYaw = ex.defaultYaw;
    state.inspectPitch = ex.defaultPitch;
    state.inspectDist = ex.defaultDist;
    const pose = getInspectCameraPose(ex, ex.defaultYaw, ex.defaultPitch, ex.defaultDist);
    camPos.copy(pose.pos);
    camLook.copy(pose.look);
    camera.position.copy(camPos);
    camera.lookAt(camLook);
  } else {
    playChimeSound();
  }
  syncHudUI();
}

function stepExhibit(delta) {
  if (state.act !== 'room') return;
  const idx = ROOM_EXHIBITS.findIndex((e) => e.id === state.focusedExhibit);
  const nextIdx = idx < 0
    ? (delta > 0 ? 0 : ROOM_EXHIBITS.length - 1)
    : (idx + delta + ROOM_EXHIBITS.length) % ROOM_EXHIBITS.length;
  focusExhibit(ROOM_EXHIBITS[nextIdx].id);
}

/* =========================================================================
   8. POINTER DRAG-ORBIT, SCROLL ZOOM, RAYCASTING & KEYBOARD CONTROLS
   ========================================================================= */
const raycaster = new THREE.Raycaster();
const ptrVec = new THREE.Vector2();

let isDragging = false;
let dragMoved = 0;
let lastPtrX = 0;
let lastPtrY = 0;

function pickUnderPointer(clientX, clientY) {
  ptrVec.set(
    (clientX / window.innerWidth) * 2 - 1,
    -(clientY / window.innerHeight) * 2 + 1
  );
  raycaster.setFromCamera(ptrVec, camera);

  if (state.act === 'galaxy') {
    const hits = raycaster.intersectObjects(galaxyAct.hitTargets, false);
    return hits.length ? hits[0].object : null;
  }
  if (state.act === 'sunflower') {
    const hits = raycaster.intersectObjects(sunflowerAct.hitTargets, false);
    return hits.length ? hits[0].object : null;
  }
  if (state.act === 'room') {
    if (!state.focusedExhibit) {
      const hits = raycaster.intersectObjects(roomAct.overviewHits, false);
      return hits.length ? hits[0].object : null;
    }
    const hits = raycaster.intersectObjects(roomInteractiveTargets, false);
    return hits.length ? hits[0].object : null;
  }
  return null;
}

canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  isDragging = true;
  dragMoved = 0;
  lastPtrX = e.clientX;
  lastPtrY = e.clientY;
  canvas.setPointerCapture?.(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  state.pointerNdcX = (e.clientX / window.innerWidth) * 2 - 1;
  state.pointerNdcY = -(e.clientY / window.innerHeight) * 2 + 1;

  if (isDragging && !state.transition) {
    const dx = e.clientX - lastPtrX;
    const dy = e.clientY - lastPtrY;
    dragMoved += Math.hypot(dx, dy);
    lastPtrX = e.clientX;
    lastPtrY = e.clientY;

    if (state.act === 'galaxy') {
      state.targetGalaxyYaw -= dx * 0.0052;
      state.targetGalaxyPitch = clamp(state.targetGalaxyPitch + dy * 0.0042, 0.08, 1.32);
    } else if (state.act === 'room' && state.focusedExhibit) {
      const ex = getExhibitById(state.focusedExhibit);
      if (ex) {
        state.targetInspectYaw = clamp(state.targetInspectYaw - dx * 0.0072, ex.minYaw, ex.maxYaw);
        state.targetInspectPitch = clamp(state.targetInspectPitch + dy * 0.0058, ex.minPitch, ex.maxPitch);
      }
    }
    return;
  }

  // Hover affordance
  if (!state.transition) {
    const hit = pickUnderPointer(e.clientX, e.clientY);
    state.hoveredObjectName = hit?.userData?.__qzInteractiveName || null;
    state.hoveredExhibit = hit?.userData?.__qzExhibitId || null;
    canvas.style.cursor = hit ? 'pointer' : (state.act === 'galaxy' || state.focusedExhibit ? 'grab' : 'default');
  }
});

canvas.addEventListener('pointerup', (e) => {
  if (!isDragging) return;
  isDragging = false;
  if (dragMoved > 7 || state.transition) return;

  const hit = pickUnderPointer(e.clientX, e.clientY);
  if (!hit) return;

  if (state.act === 'galaxy' && hit.userData.__qzInteractiveName === 'Qingzhou_Planet') {
    startCloudBreakDive();
    return;
  }
  if (state.act === 'sunflower' && hit.userData.__qzInteractiveName === 'Sunflower_Cottage') {
    startEnterRoomTransition();
    return;
  }
  if (state.act === 'room') {
    if (!state.focusedExhibit && hit.userData.__qzExhibitId) {
      focusExhibit(hit.userData.__qzExhibitId);
      return;
    }
    const role = hit.userData.__qzRole;
    if (role === 'photoCard') {
      const idx = parseInt((hit.userData.__qzInteractiveName || '').replace('Photo_Slide_Card_', ''), 10) || 0;
      const works = archive().works || [];
      const w = works[idx] || works[0];
      modals.openDarkroomViewer(w?.slug || state.selectedWorkSlug, 0);
    } else if (role === 'bookMoyan') {
      modals.openPoemDossier(state.selectedPoemSlug);
    } else if (role === 'sealBlock') {
      const next = togglePoemSeal(state.selectedPoemSlug);
      playWoodTapSound();
      roomAct.triggerSealStamp();
      setTimeout(() => updateBookMoyanTexture(), 260);
      modals.showToast(next ? '寿山石印落纸，已盖「清舟」朱砂印 ✨' : '已轻拭朱砂印记');
      modals.renderExhibitDeck(true);
    } else if (role === 'herbSlide') {
      const idx = parseInt((hit.userData.__qzInteractiveName || '').replace('Herbarium_Slide_', ''), 10);
      if (Number.isFinite(idx)) {
        state.selectedSampleIdx = clamp(idx, 0, 3);
        playChimeSound();
        modals.renderExhibitDeck(true);
      }
    } else if (role === 'labPlate') {
      const idx = parseInt((hit.userData.__qzInteractiveName || '').replace('Lab_Plate_', ''), 10) || 0;
      const labs = archive().labs || [];
      const lab = labs[idx] || labs[0];
      if (lab) {
        state.selectedLabSlug = lab.slug;
        modals.openLabDossier(lab.slug);
      }
    } else if (role === 'cityBeacon') {
      const idx = hit.userData.__qzCityIndex;
      const city = PLACES_22[idx];
      if (city) {
        state.selectedCityName = city.name;
        playWoodTapSound();
        highlightSelectedCityBeacon();
        modals.renderExhibitDeck(true);
      }
    } else if (role === 'riverLantern' || role === 'riverCat') {
      document.getElementById('river-wish-input')?.focus();
      modals.showToast('在右侧展签写下寄语，放出一盏微缩河灯 ✨');
    }
  }
});

canvas.addEventListener('wheel', (e) => {
  if (state.transition) return;
  const openModal = !document.getElementById('darkroom-modal')?.hidden ||
    !document.getElementById('dossier-modal')?.hidden ||
    !document.getElementById('ink-atlas')?.hidden;
  if (openModal) return;

  e.preventDefault();
  if (state.act === 'galaxy') {
    state.targetGalaxyDist = clamp(state.targetGalaxyDist + e.deltaY * 0.015, 7.5, 32.0);
  } else if (state.act === 'sunflower') {
    state.targetSunflowerWalk = clamp(state.targetSunflowerWalk + e.deltaY * 0.00075, 0.0, 1.0);
  } else if (state.act === 'room' && state.focusedExhibit) {
    const ex = getExhibitById(state.focusedExhibit);
    if (ex) {
      state.targetInspectDist = clamp(state.targetInspectDist + e.deltaY * 0.0022, ex.minDist, ex.maxDist);
    }
  }
}, { passive: false });

/* ---------- HUD Button & Overlay Wiring ---------- */
function bindHudControls() {
  document.querySelectorAll('.act-pill[data-act-target]').forEach((btn) => {
    btn.addEventListener('click', () => goAct(btn.dataset.actTarget));
  });

  document.getElementById('btn-dive-planet')?.addEventListener('click', () => startCloudBreakDive());
  document.getElementById('btn-back-galaxy')?.addEventListener('click', () => startRiseToGalaxy());
  document.getElementById('btn-enter-room')?.addEventListener('click', () => startEnterRoomTransition());
  document.getElementById('btn-back-sunflower')?.addEventListener('click', () => startExitRoomToSunflower());

  document.querySelectorAll('.exhibit-pill[data-exhibit]').forEach((btn) => {
    btn.addEventListener('click', () => focusExhibit(btn.dataset.exhibit));
  });
  document.getElementById('btn-exhibit-prev')?.addEventListener('click', () => stepExhibit(-1));
  document.getElementById('btn-exhibit-next')?.addEventListener('click', () => stepExhibit(1));
  document.getElementById('btn-room-overview')?.addEventListener('click', () => focusExhibit(null));

  // Collapse/expand exhibit deck
  const deckToggle = document.getElementById('btn-deck-toggle');
  const deckBody = document.getElementById('station-deck-body');
  if (deckToggle && deckBody) {
    deckToggle.addEventListener('click', () => {
      const nextHidden = !deckBody.hidden;
      deckBody.hidden = nextHidden;
      deckToggle.textContent = nextHidden ? '+' : '—';
      deckToggle.setAttribute('aria-expanded', String(!nextHidden));
    });
  }

  // Ink Atlas Overlay
  const atlas = document.getElementById('ink-atlas');
  const openAtlas = () => {
    if (!atlas) return;
    atlas.hidden = false;
    atlas.setAttribute('aria-hidden', 'false');
    modals.openModalFocus(atlas);
  };
  const closeAtlas = () => {
    if (!atlas) return;
    atlas.hidden = true;
    atlas.setAttribute('aria-hidden', 'true');
    modals.closeModalFocus();
  };
  document.getElementById('btn-menu-open')?.addEventListener('click', openAtlas);
  document.getElementById('btn-atlas-open')?.addEventListener('click', openAtlas);
  document.getElementById('atlas-close')?.addEventListener('click', closeAtlas);
  document.getElementById('atlas-backdrop')?.addEventListener('click', closeAtlas);

  atlas?.querySelectorAll('[data-atlas-act]').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeAtlas();
      goAct(btn.dataset.atlasAct);
    });
  });
  atlas?.querySelectorAll('[data-atlas-exhibit]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      closeAtlas();
      const exId = btn.dataset.atlasExhibit;
      if (state.act !== 'room') await goAct('room', true);
      focusExhibit(exId);
    });
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    const tag = (document.activeElement?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    const drOpen = !document.getElementById('darkroom-modal')?.hidden;
    const dsOpen = !document.getElementById('dossier-modal')?.hidden;
    const atOpen = !document.getElementById('ink-atlas')?.hidden;

    if (e.key === 'Escape') {
      if (drOpen) { modals.closeDarkroomViewer(); return; }
      if (dsOpen) { modals.closeDossier(); return; }
      if (atOpen) { closeAtlas(); return; }
      if (state.act === 'room' && state.focusedExhibit) { focusExhibit(null); return; }
    }
    if (drOpen) {
      if (e.key === 'ArrowLeft') modals.stepDarkroomPhoto(-1);
      if (e.key === 'ArrowRight') modals.stepDarkroomPhoto(1);
      return;
    }
    if (!dsOpen && !atOpen && state.act === 'room') {
      if (e.key === 'ArrowLeft') stepExhibit(-1);
      if (e.key === 'ArrowRight') stepExhibit(1);
    }
  });
}

/* =========================================================================
   9. MAIN CINEMA RENDER LOOP
   ========================================================================= */
const clock = new THREE.Clock();
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());
  const elapsed = clock.elapsedTime;
  simElapsed = elapsed;

  state.smoothPtrX += (state.pointerNdcX - state.smoothPtrX) * Math.min(1, dt * 4.5);
  state.smoothPtrY += (state.pointerNdcY - state.smoothPtrY) * Math.min(1, dt * 4.5);

  let cloudDiveProgress = state.manualCloudDive >= 0 ? state.manualCloudDive : 0;

  // --- A. ACTIVE TRANSITIONS ---
  if (state.transition) {
    const tr = state.transition;
    tr.elapsed += dt;
    const p = clamp(tr.elapsed / tr.dur, 0, 1);
    const ep = easeInOut(p);

    if (tr.kind === 'dive') {
      cloudDiveProgress = p;
      if (p < 0.50) {
        // Spiral dive into Qingzhou_Planet's atmospheric glow!
        const sub = easeInOut(p / 0.50);
        const dest = PLANET_POS.clone().add(new THREE.Vector3(0.15, 0.25, 1.35));
        camPos.lerpVectors(tr.startPos, dest, sub);
        camLook.lerpVectors(tr.startLook, PLANET_POS, sub);
      } else {
        if (!tr.swapped) {
          tr.swapped = true;
          state.act = 'sunflower';
          state.sunflowerWalk = 0;
          state.targetSunflowerWalk = 0;
          applyActAtmosphere('sunflower');
          syncHudUI();
        }
        // Emerge smoothly from golden clouds descending into the sunflower meadow!
        const sub = easeInOut((p - 0.50) / 0.50);
        const endPose = getSunflowerCameraPose(0, 0, 0);
        const highStart = endPose.pos.clone().add(new THREE.Vector3(0, 8.5, 4.0));
        camPos.lerpVectors(highStart, endPose.pos, sub);
        camLook.lerpVectors(endPose.look.clone().add(new THREE.Vector3(0, 2.2, 0)), endPose.look, sub);
      }
      if (p >= 1) state.transition = null;
    } else if (tr.kind === 'rise') {
      cloudDiveProgress = 1.0 - p;
      if (p < 0.48) {
        const sub = easeInOut(p / 0.48);
        camPos.lerpVectors(tr.startPos, tr.startPos.clone().add(new THREE.Vector3(0, 12.0, 2.0)), sub);
        camLook.lerpVectors(tr.startLook, tr.startLook.clone().add(new THREE.Vector3(0, 14.0, 0)), sub);
      } else {
        if (!tr.swapped) {
          tr.swapped = true;
          state.act = 'galaxy';
          applyActAtmosphere('galaxy');
          syncHudUI();
        }
        const sub = easeInOut((p - 0.48) / 0.52);
        const cosP = Math.cos(state.targetGalaxyPitch);
        const dest = new THREE.Vector3(
          Math.sin(state.targetGalaxyYaw) * cosP * state.targetGalaxyDist,
          Math.sin(state.targetGalaxyPitch) * state.targetGalaxyDist,
          Math.cos(state.targetGalaxyYaw) * cosP * state.targetGalaxyDist
        );
        camPos.lerpVectors(PLANET_POS.clone().add(new THREE.Vector3(0, 0.6, 2.2)), dest, sub);
        camLook.lerpVectors(PLANET_POS, new THREE.Vector3(1.2, 0.2, 0.5), sub);
      }
      if (p >= 1) state.transition = null;
    } else if (tr.kind === 'enterRoom' || tr.kind === 'exitRoom') {
      const veil = document.getElementById('matchcut-veil');
      const pulse = Math.sin(p * Math.PI);
      if (veil) veil.style.opacity = String((pulse * 0.92).toFixed(3));

      if (tr.kind === 'enterRoom') {
        if (p < 0.52) {
          const sub = easeInOut(p / 0.52);
          camPos.lerpVectors(tr.startPos, new THREE.Vector3(0, 1.9, -15.4), sub);
          camLook.lerpVectors(tr.startLook, new THREE.Vector3(0, 1.85, -18.5), sub);
        } else {
          if (!tr.swapped) {
            tr.swapped = true;
            state.act = 'room';
            state.focusedExhibit = null;
            applyActAtmosphere('room');
            syncHudUI();
          }
          const sub = easeInOut((p - 0.52) / 0.48);
          camPos.lerpVectors(new THREE.Vector3(0, 2.5, 9.4), ROOM_OVERVIEW_POS, sub);
          camLook.lerpVectors(new THREE.Vector3(0, 1.4, -1.6), ROOM_OVERVIEW_TARGET, sub);
        }
      } else {
        if (p < 0.50) {
          const sub = easeInOut(p / 0.50);
          camPos.lerpVectors(tr.startPos, new THREE.Vector3(0, 2.4, 9.6), sub);
        } else {
          if (!tr.swapped) {
            tr.swapped = true;
            state.act = 'sunflower';
            state.sunflowerWalk = 0.28;
            state.targetSunflowerWalk = 0.28;
            applyActAtmosphere('sunflower');
            syncHudUI();
          }
          const sub = easeInOut((p - 0.50) / 0.50);
          const pose = getSunflowerCameraPose(state.sunflowerWalk, 0, 0);
          camPos.lerpVectors(new THREE.Vector3(0, 2.1, -13.5), pose.pos, sub);
          camLook.lerpVectors(new THREE.Vector3(0, 2.2, -18.5), pose.look, sub);
        }
      }
      if (p >= 1) {
        if (veil) veil.style.opacity = '0';
        state.transition = null;
      }
    }
  } else {
    // --- B. NORMAL PER-ACT SMOOTH CAMERA ---
    const damp = Math.min(1, dt * 6.5);
    if (state.act === 'galaxy') {
      state.galaxyYaw += (state.targetGalaxyYaw - state.galaxyYaw) * damp;
      state.galaxyPitch += (state.targetGalaxyPitch - state.galaxyPitch) * damp;
      state.galaxyDist += (state.targetGalaxyDist - state.galaxyDist) * damp;
      const cosP = Math.cos(state.galaxyPitch);
      const goalPos = new THREE.Vector3(
        Math.sin(state.galaxyYaw) * cosP * state.galaxyDist,
        Math.sin(state.galaxyPitch) * state.galaxyDist,
        Math.cos(state.galaxyYaw) * cosP * state.galaxyDist
      );
      camPos.lerp(goalPos, damp);
      camLook.lerp(new THREE.Vector3(1.2, 0.2, 0.5), damp);
    } else if (state.act === 'sunflower') {
      state.sunflowerWalk += (state.targetSunflowerWalk - state.sunflowerWalk) * damp;
      const pose = getSunflowerCameraPose(state.sunflowerWalk, state.smoothPtrX, state.smoothPtrY);
      camPos.lerp(pose.pos, damp);
      camLook.lerp(pose.look, damp);
    } else if (state.act === 'room') {
      if (state.focusedExhibit) {
        const ex = getExhibitById(state.focusedExhibit);
        if (ex) {
          state.inspectYaw += (state.targetInspectYaw - state.inspectYaw) * damp;
          state.inspectPitch += (state.targetInspectPitch - state.inspectPitch) * damp;
          state.inspectDist += (state.targetInspectDist - state.inspectDist) * damp;
          const pose = getInspectCameraPose(ex, state.inspectYaw, state.inspectPitch, state.inspectDist);
          camPos.lerp(pose.pos, Math.min(1, dt * 7.2));
          camLook.lerp(pose.look, Math.min(1, dt * 7.2));
        }
      } else {
        const goalPos = ROOM_OVERVIEW_POS.clone().add(
          new THREE.Vector3(state.smoothPtrX * 0.42, state.smoothPtrY * 0.22, 0)
        );
        const goalLook = ROOM_OVERVIEW_TARGET.clone().add(
          new THREE.Vector3(state.smoothPtrX * 0.28, state.smoothPtrY * 0.14, 0)
        );
        camPos.lerp(goalPos, Math.min(1, dt * 5.8));
        camLook.lerp(goalLook, Math.min(1, dt * 5.8));
      }
    }
  }

  camera.position.copy(camPos);
  camera.lookAt(camLook);

  // --- C. UPDATE ACTIVE WORLD SIMULATIONS ---
  if (galaxyAct.group.visible) {
    galaxyAct.update(elapsed, dt, state.hoveredObjectName === 'Qingzhou_Planet', prefersReducedMotion);
  }
  if (sunflowerAct.group.visible) {
    sunflowerAct.update(elapsed, camera, state.smoothPtrX, state.smoothPtrY, state.sunflowerWalk, prefersReducedMotion);
  }
  if (roomAct.group.visible) {
    roomAct.update({
      elapsed,
      dt,
      focusedExhibitId: state.focusedExhibit,
      hoveredExhibitId: state.hoveredExhibit,
      selectedSampleIdx: state.selectedSampleIdx,
      namedObjects,
      prefersReducedMotion
    });
    for (const u of customShaderUniforms) u.value = elapsed;
    const ring = namedObjects.get('Atlas_Orbital_Ring');
    if (ring && !prefersReducedMotion) ring.rotation.y = elapsed * 0.14;

    // Peaceful living buoyancy for all 6 Wupeng lantern boats + shader light tracking
    for (let i = 0; i < miniRiverBoats.length; i++) {
      const b = miniRiverBoats[i];
      if (!prefersReducedMotion) {
        b.obj.position.y = b.baseY + Math.sin(elapsed * 1.45 + b.phase) * 0.06;
        b.obj.rotation.z = Math.sin(elapsed * 1.15 + b.phase) * 0.032;
        b.obj.rotation.x = Math.cos(elapsed * 1.32 + b.phase) * 0.020;
      }
      if (miniWaterMat && i < 6) {
        const bx = b.obj.position.x + b.lanternOffset.x;
        const bz = b.obj.position.z + b.lanternOffset.z;
        miniWaterMat.uniforms.uBoatLights.value[i].set(bx, -6.0, bz);
      }
    }
    if (miniWaterMat) {
      // Foreground eave palace lantern at index 6
      miniWaterMat.uniforms.uBoatLights.value[6].set(-3.05, -4.15, -70.7);
      // Dynamic Lotus Wish Lantern lights
      const wlArr = miniWaterMat.uniforms.uWishLights.value;
      const activeWish = roomAct.getSpawnedLanterns();
      for (let j = 0; j < 8; j++) {
        if (j < activeWish.length) {
          const mp = activeWish[j].mesh.position;
          const lp = mountToRiverLocal(mp.x, mp.z);
          wlArr[j].set(lp.x, -6.4, lp.z, 1.0);
        } else {
          wlArr[j].set(0, 0, 0, 0.0);
        }
      }
    }
    if (eaveCatObj && !prefersReducedMotion) {
      eaveCatObj.scale.y = catBaseScaleY * (1.0 + 0.025 * Math.sin(elapsed * 2.1));
      eaveCatObj.rotation.y = Math.sin(elapsed * 0.52) * 0.055;
    }
  }

  // --- D. RENDER COMPOSER + OPTIONAL VOLUMETRIC CLOUD-BREAK PASS ---
  composer.render();
  if (cloudDiveProgress > 0.002 && cloudDiveProgress < 0.998) {
    cloudDive.update(cloudDiveProgress, elapsed);
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(cloudDive.cloudScene, cloudDive.cloudCam);
    renderer.autoClear = true;
  }

  updateSpatialMarkers();
}

/* =========================================================================
   10. BOOTSTRAP, RESIZE & QA DIAGNOSTIC HOOKS
   ========================================================================= */
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  cloudDive.setAspect(w / Math.max(1, h));
});

updateSolarTermHUD();
modals.bindModalEvents();
bindHudControls();
applyActAtmosphere('galaxy');
syncHudUI();

// Instant First-Paint! Act I is 100% procedural WebGL -> hide loader immediately
const loaderEl = document.getElementById('cinema-loader');
if (loaderEl) {
  loaderEl.classList.add('is-hidden');
  setTimeout(() => { loaderEl.hidden = true; }, 450);
}

// Quietly stream the Act III miniature room GLBs in the background right after Act I paints!
setTimeout(() => { ensureRoomLoaded().catch(() => {}); }, 250);

// Expose clean QA / Director verification hooks
window.__qzGetState = () => ({
  act: state.act,
  focusedExhibit: state.focusedExhibit,
  roomLoaded: state.roomLoaded,
  selectedPoemSlug: state.selectedPoemSlug,
  selectedCityName: state.selectedCityName,
  selectedSampleIdx: state.selectedSampleIdx,
  cameraPos: camPos.toArray().map((v) => Number(v.toFixed(2))),
  cameraLook: camLook.toArray().map((v) => Number(v.toFixed(2)))
});
window.__qzGoAct = (act, instant = true) => goAct(act, instant);
window.__qzFocusExhibit = async (id, instant = true) => {
  if (state.act !== 'room') await goAct('room', true);
  focusExhibit(id, instant);
};
window.__qzSetCloudDive = (p) => { state.manualCloudDive = p; };
window.__qzEnsureRoom = () => ensureRoomLoaded();
window.__qzTriggerSeal = () => {
  togglePoemSeal(state.selectedPoemSlug);
  roomAct.triggerSealStamp();
  updateBookMoyanTexture();
  modals.renderExhibitDeck(true);
};
window.__qzSetAtlasRegion = (region) => {
  state.selectedAtlasRegion = region || 'all';
  if (state.selectedAtlasRegion !== 'all') {
    const first = PLACES_22.find((p) => p.group === state.selectedAtlasRegion);
    if (first) state.selectedCityName = first.name;
  }
  highlightSelectedCityBeacon();
  modals.renderExhibitDeck(true);
};
window.__qzSpawnLantern = () => spawnWishWithSplash();

animate();
