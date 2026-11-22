import * as THREE from './vendor/three/three.module.js';

/**
 * Act II: 2.5D × 3D Hybrid Golden-Violet Sunset Sunflower Meadow
 * + Interactive Guiding Fireflies + Warm-Lit Curiosity Shop Cottage.
 */
export function buildSunflowerAct(dpr = 1) {
  const group = new THREE.Group();
  group.name = 'QZ_Act2_Sunflower_Meadow';

  let seed = 90917;
  const rand = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // =========================================================================
  // 1. GLSL GOLDEN-VIOLET SUNSET DUSK SKY DOME (with emerging evening stars!)
  // =========================================================================
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { uTime: { value: 0 } },
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
        vec3 d = normalize(vDir);
        float h = clamp(d.y, -0.1, 1.0);

        // Richer Makoto Shinkai golden-violet twilight sunset palette (deep violet dusk -> rose-plum -> molten amber-gold!)
        vec3 zenith = vec3(0.05, 0.04, 0.16);
        vec3 violet = vec3(0.22, 0.11, 0.34);
        vec3 rose   = vec3(0.62, 0.25, 0.36);
        vec3 amber  = vec3(0.92, 0.48, 0.24);
        vec3 gold   = vec3(0.98, 0.78, 0.42);

        vec3 col = mix(gold, amber, smoothstep(0.0, 0.09, h));
        col = mix(col, rose, smoothstep(0.07, 0.22, h));
        col = mix(col, violet, smoothstep(0.18, 0.42, h));
        col = mix(col, zenith, smoothstep(0.38, 0.78, h));

        // Setting sun glow just off-left behind the distant cottage hills (restrained warm disc, never blown-out white)
        vec3 sunDir = normalize(vec3(-0.24, 0.075, -0.97));
        float sunDot = max(0.0, dot(d, sunDir));
        col += vec3(0.98, 0.62, 0.28) * pow(sunDot, 12.0) * 0.36;
        col += vec3(1.00, 0.88, 0.62) * pow(sunDot, 72.0) * 0.48;

        // Soft painted sunset cloud ribbons catching golden under-light
        if (h > 0.02) {
          vec2 cuv = d.xz / (h + 0.22) * 0.95 + vec2(uTime * 0.008, 0.0);
          float c = n2(cuv * 2.2) * 0.62 + n2(cuv * 4.8 + vec2(2.1, -1.4)) * 0.38;
          float cloudBand = smoothstep(0.50, 0.82, c) * smoothstep(0.02, 0.12, h) * smoothstep(0.62, 0.18, h);
          vec3 cloudTint = mix(vec3(0.32, 0.16, 0.36), vec3(0.98, 0.66, 0.38), pow(sunDot, 2.2) * 0.72 + (1.0 - h) * 0.35);
          col = mix(col, cloudTint, cloudBand * 0.58);
        }

        // First delicate pinpoint evening stars sparkling in the violet zenith (NEVER blocky squares!)
        if (h > 0.16) {
          vec2 starCell = vec2(atan(d.x, d.z) * 58.0, asin(d.y) * 58.0);
          vec2 g = floor(starCell);
          vec2 f = fract(starCell) - 0.5;
          float st = hash21(g);
          if (st > 0.972) {
            vec2 jitter = vec2(hash21(g + 3.7), hash21(g + 11.9)) * 0.42 - 0.21;
            float pinpoint = exp(-dot(f - jitter, f - jitter) * 140.0);
            float tw = 0.55 + 0.45 * sin(uTime * 2.2 + st * 400.0);
            col += vec3(0.98, 0.94, 1.0) * smoothstep(0.16, 0.46, h) * pinpoint * tw * 1.1;
          }
        }

        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `
  });
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(180, 48, 32), skyMat);
  group.add(skyDome);

  // =========================================================================
  // 2. 2.5D LAYERED PARALLAX DISTANT HILLS & SUNSET SILHOUETTE RIDGES
  // =========================================================================
  function makeRidgeLayer(zDist, width, height, colorHex, rimHex, seedOff) {
    const segs = 96;
    const geo = new THREE.PlaneGeometry(width, height, segs, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      const x = (u - 0.5) * width;
      const ridge =
        Math.sin(x * 0.045 + seedOff) * height * 0.32 +
        Math.sin(x * 0.11 - seedOff * 1.7) * height * 0.18 +
        Math.cos(x * 0.24 + seedOff * 0.6) * height * 0.08;
      pos.setY(i, height * 0.5 + ridge);
    }
    geo.computeVertexNormals();
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: true,
      uniforms: {
        uBase: { value: new THREE.Color(colorHex) },
        uRim: { value: new THREE.Color(rimHex) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uBase;
        uniform vec3 uRim;
        varying vec2 vUv;
        void main() {
          float rim = smoothstep(0.84, 1.0, vUv.y);
          vec3 col = mix(uBase, uRim, rim * 0.55);
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }
      `
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(0, -1.2, zDist);
    group.add(m);
  }
  makeRidgeLayer(-96, 220, 16, 0x2a1c38, 0xd87a64, 0.7);
  makeRidgeLayer(-68, 165, 11.5, 0x1e182e, 0xc97452, 2.3);
  makeRidgeLayer(-46, 120, 7.2, 0x171822, 0xa86842, 4.1);

  // =========================================================================
  // 3. ROLLING SUNFLOWER MEADOW GROUND + WINDING GOLDEN GARDEN PATH
  // =========================================================================
  const pathCenterX = (z) => Math.sin((z + 16) * 0.17) * 1.15 * Math.min(1, Math.abs(z + 18.5) / 14);
  const groundY = (x, z) => {
    const hill = Math.sin(x * 0.14) * Math.cos(z * 0.12) * 0.45 + Math.max(0, Math.abs(x) - 3.5) * 0.045;
    const distPath = Math.abs(x - pathCenterX(z));
    const pathFlat = Math.min(1, Math.max(0, (distPath - 1.0) / 2.2));
    return hill * pathFlat;
  };

  const gGeo = new THREE.PlaneGeometry(76, 56, 72, 64);
  gGeo.rotateX(-Math.PI / 2);
  const gPos = gGeo.attributes.position;
  const gCol = new Float32Array(gPos.count * 3);
  const cGrass = new THREE.Color(0x22301f);
  const cWarmGrass = new THREE.Color(0x3a3b22);
  const cPath = new THREE.Color(0x7c5a3e);
  const tmpC = new THREE.Color();
  for (let i = 0; i < gPos.count; i++) {
    const x = gPos.getX(i);
    const z = gPos.getZ(i) - 10;
    gPos.setZ(i, z);
    const y = groundY(x, z);
    gPos.setY(i, y);
    const dp = Math.abs(x - pathCenterX(z));
    const pMask = Math.max(0, 1 - Math.max(0, dp - 0.68) / 0.82);
    tmpC.copy(cGrass).lerp(cWarmGrass, Math.max(0, Math.sin(x * 0.3 + z * 0.25) * 0.5 + 0.5));
    tmpC.lerp(cPath, pMask * 0.92);
    gCol[i * 3] = tmpC.r;
    gCol[i * 3 + 1] = tmpC.g;
    gCol[i * 3 + 2] = tmpC.b;
  }
  gGeo.setAttribute('color', new THREE.BufferAttribute(gCol, 3));
  gGeo.computeVertexNormals();
  const groundMesh = new THREE.Mesh(
    gGeo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0.02 })
  );
  group.add(groundMesh);

  // Warm Stepping Stones along the winding garden path toward the cottage
  const stoneGeo = new THREE.CylinderGeometry(0.42, 0.48, 0.08, 9);
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xa68a6d, roughness: 0.88 });
  for (let i = 0; i < 19; i++) {
    const sz = 8.5 - i * 1.28;
    const sx = pathCenterX(sz) + (i % 2 === 0 ? -0.14 : 0.14);
    const st = new THREE.Mesh(stoneGeo, stoneMat);
    st.position.set(sx, groundY(sx, sz) + 0.03, sz);
    st.scale.set(0.95 + rand() * 0.25, 1, 0.72 + rand() * 0.2);
    st.rotation.y = rand() * Math.PI;
    group.add(st);
  }

  // =========================================================================
  // 4. 3D WIND-SWEPT SUNFLOWER SEA (1,450 Instanced Sunflowers + GLSL Wind!)
  // =========================================================================
  const windUniforms = { uTime: { value: 0 } };
  function injectWindShader(mat, swayAmt = 0.14) {
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = windUniforms.uTime;
      shader.vertexShader = `uniform float uTime;\n` + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vec3 instOrigin = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
         float wave = sin(uTime * 1.45 + instOrigin.x * 0.42 + instOrigin.z * 0.34)
                    + 0.45 * cos(uTime * 2.1 - instOrigin.x * 0.7 + instOrigin.z * 0.55);
         float bend = smoothstep(0.0, 1.35, position.y);
         transformed.x += wave * ${swayAmt.toFixed(3)} * bend;
         transformed.z += wave * ${(swayAmt * 0.55).toFixed(3)} * bend;`
      );
    };
  }

  // Build clean sunflower stem + 2 broad leaves geometry (merged manually for 1 draw call!)
  const stemGeo = new THREE.CylinderGeometry(0.022, 0.038, 1.28, 6);
  stemGeo.translate(0, 0.64, 0);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x3b5932, roughness: 0.82 });
  injectWindShader(stemMat, 0.13);

  // Sunflower dark seed center disk
  const diskGeo = new THREE.CylinderGeometry(0.16, 0.13, 0.07, 10);
  diskGeo.rotateX(Math.PI / 2);
  diskGeo.translate(0, 1.28, 0.04);
  const diskMat = new THREE.MeshStandardMaterial({ color: 0x3b2212, roughness: 0.90 });
  injectWindShader(diskMat, 0.13);

  // Sunflower radiant golden petal crown (12 sculpted pointed petals around the disk!)
  const petalPositions = [];
  const petalNormals = [];
  const petalColors = [];
  const pOuter = new THREE.Color(0xf7b93c);
  const pInner = new THREE.Color(0xe68422);
  for (let p = 0; p < 12; p++) {
    const ang = (p / 12) * Math.PI * 2;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const tx = -sa, ty = ca;
    const r0 = 0.13, r1 = 0.36 + (p % 2) * 0.04;
    const zTilt = (p % 2 === 0 ? 0.045 : -0.015);
    const b0 = [ca * r0 - tx * 0.042, 1.28 + sa * r0 - ty * 0.042, 0.02];
    const b1 = [ca * r0 + tx * 0.042, 1.28 + sa * r0 + ty * 0.042, 0.02];
    const m0 = [ca * (r0 + (r1 - r0) * 0.6) - tx * 0.056, 1.28 + sa * (r0 + (r1 - r0) * 0.6) - ty * 0.056, 0.02 + zTilt * 0.5];
    const m1 = [ca * (r0 + (r1 - r0) * 0.6) + tx * 0.056, 1.28 + sa * (r0 + (r1 - r0) * 0.6) + ty * 0.056, 0.02 + zTilt * 0.5];
    const tip = [ca * r1, 1.28 + sa * r1, 0.02 + zTilt];
    const tris = [b0, b1, m1, b0, m1, m0, m0, m1, tip];
    const cols = [pInner, pInner, pOuter, pInner, pOuter, pOuter, pOuter, pOuter, pOuter];
    for (let k = 0; k < tris.length; k++) {
      petalPositions.push(...tris[k]);
      petalNormals.push(0, 0.15, 0.98);
      petalColors.push(cols[k].r, cols[k].g, cols[k].b);
    }
  }
  const petalGeo = new THREE.BufferGeometry();
  petalGeo.setAttribute('position', new THREE.Float32BufferAttribute(petalPositions, 3));
  petalGeo.setAttribute('normal', new THREE.Float32BufferAttribute(petalNormals, 3));
  petalGeo.setAttribute('color', new THREE.Float32BufferAttribute(petalColors, 3));
  const petalMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.64,
    emissive: new THREE.Color(0x522908),
    emissiveIntensity: 0.35,
    side: THREE.DoubleSide
  });
  injectWindShader(petalMat, 0.13);

  // Scatter 1,450 sunflowers across the meadow leaving the winding path & cottage yard clear!
  const transforms = [];
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 2200 && transforms.length < 1450; i++) {
    const z = 11.5 - Math.pow(rand(), 0.85) * 34.0;
    const x = (rand() - 0.5) * (24 + Math.max(0, -z) * 1.15);
    const dp = Math.abs(x - pathCenterX(z));
    if (dp < 1.38 + rand() * 0.35) continue; // Keep garden path clear!
    if (z < -13.5 && Math.abs(x) < 5.2) continue; // Keep cottage porch yard clear!
    const y = groundY(x, z);
    const sc = 0.78 + rand() * 0.52;
    dummy.position.set(x, y - 0.04, z);
    dummy.scale.set(sc, sc * (0.9 + rand() * 0.25), sc);
    // Sunflowers face warmly toward camera / setting sun with gentle organic variation
    dummy.rotation.set(-0.18 + (rand() - 0.5) * 0.26, (rand() - 0.5) * 0.72, (rand() - 0.5) * 0.14);
    dummy.updateMatrix();
    transforms.push(dummy.matrix.clone());
  }

  const instCount = transforms.length;
  const stems = new THREE.InstancedMesh(stemGeo, stemMat, instCount);
  const disks = new THREE.InstancedMesh(diskGeo, diskMat, instCount);
  const petals = new THREE.InstancedMesh(petalGeo, petalMat, instCount);
  for (let i = 0; i < instCount; i++) {
    stems.setMatrixAt(i, transforms[i]);
    disks.setMatrixAt(i, transforms[i]);
    petals.setMatrixAt(i, transforms[i]);
  }
  stems.instanceMatrix.needsUpdate = true;
  disks.instanceMatrix.needsUpdate = true;
  petals.instanceMatrix.needsUpdate = true;
  group.add(stems, disks, petals);

  // =========================================================================
  // 5. COZY WARM-LIT CURIOSITY SHOP COTTAGE AT PATH'S END (z = -18.5)
  // =========================================================================
  const cottage = new THREE.Group();
  cottage.name = 'Sunflower_Cottage';
  cottage.position.set(0.0, groundY(0, -18.5), -18.5);
  group.add(cottage);

  const mWall = new THREE.MeshStandardMaterial({ color: 0xc2ab8e, roughness: 0.88 });
  const mTimber = new THREE.MeshStandardMaterial({ color: 0x3b2519, roughness: 0.68 });
  const mRoof = new THREE.MeshStandardMaterial({ color: 0x263440, roughness: 0.66 });
  const mStone = new THREE.MeshStandardMaterial({ color: 0x5c5b58, roughness: 0.88 });
  const mGlowWin = new THREE.MeshStandardMaterial({
    color: 0xffe2a6,
    emissive: new THREE.Color(0xffb452),
    emissiveIntensity: 2.35,
    roughness: 0.25
  });

  // Stone porch foundation & steps
  const base = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.72, 5.4), mStone);
  base.position.set(0, 0.36, 0);
  cottage.add(base);
  for (let s = 0; s < 3; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 0.42), mStone);
    step.position.set(0, 0.56 - s * 0.16, 2.95 + s * 0.36);
    cottage.add(step);
  }
  // Main timber-framed house body + pitched gable wall
  const body = new THREE.Mesh(new THREE.BoxGeometry(6.2, 3.3, 4.8), mWall);
  body.position.set(0, 2.35, -0.1);
  cottage.add(body);

  // Pitched roof slopes
  const roofL = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.24, 6.0), mRoof);
  roofL.position.set(-1.75, 4.95, 0.15);
  roofL.rotation.z = 0.66;
  const roofR = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.24, 6.0), mRoof);
  roofR.position.set(1.75, 4.95, 0.15);
  roofR.rotation.z = -0.66;
  const gableGeo = new THREE.ConeGeometry(3.55, 2.3, 4);
  gableGeo.rotateY(Math.PI / 4);
  gableGeo.scale(1.22, 1.0, 0.94);
  const gable = new THREE.Mesh(gableGeo, mWall);
  gable.position.set(0, 4.95, -0.1);
  cottage.add(roofL, roofR, gable);

  // Brick chimney
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.68, 2.2, 0.68), mStone);
  chimney.position.set(-1.9, 5.65, -0.8);
  cottage.add(chimney);

  // Glowing Ajar Doorway (warm invitation into the Curiosity Shop!)
  const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 2.15), mGlowWin);
  doorGlow.position.set(0, 1.80, 2.33);
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.42, 2.32, 0.16), mTimber);
  doorFrame.position.set(0, 1.85, 2.26);
  // Half-open wooden door leaf angled invitingly inward
  const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(1.12, 2.12, 0.08), new THREE.MeshStandardMaterial({ color: 0x36524d, roughness: 0.72 }));
  doorLeaf.position.set(-0.46, 1.80, 2.02);
  doorLeaf.rotation.y = 0.72;
  cottage.add(doorFrame, doorGlow, doorLeaf);

  // Twin Warm Glowing Lattice Windows + Attic Rose Window
  for (const wx of [-1.85, 1.85]) {
    const wf = new THREE.Mesh(new THREE.BoxGeometry(1.32, 1.24, 0.14), mTimber);
    wf.position.set(wx, 2.28, 2.32);
    const wg = new THREE.Mesh(new THREE.PlaneGeometry(1.10, 1.04), mGlowWin);
    wg.position.set(wx, 2.28, 2.40);
    const mv = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.08, 0.06), mTimber);
    mv.position.set(wx, 2.28, 2.42);
    const mh = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.06, 0.06), mTimber);
    mh.position.set(wx, 2.28, 2.42);
    cottage.add(wf, wg, mv, mh);
  }
  const roseWin = new THREE.Mesh(new THREE.CircleGeometry(0.48, 20), mGlowWin);
  roseWin.position.set(0, 4.55, 2.34);
  cottage.add(roseWin);

  // Porch overhang & Swaying Brass Hanging Lantern
  const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.14, 1.45), mRoof);
  porchRoof.position.set(0, 3.22, 2.85);
  porchRoof.rotation.x = 0.22;
  cottage.add(porchRoof);
  for (const px of [-1.18, 1.18]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.55, 8), mTimber);
    post.position.set(px, 1.92, 3.35);
    cottage.add(post);
  }
  const lanternPivot = new THREE.Group();
  lanternPivot.position.set(0.82, 3.05, 3.32);
  const lanternCord = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.45, 6), mTimber);
  lanternCord.position.y = -0.22;
  const lanternGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), mGlowWin);
  lanternGlobe.position.y = -0.52;
  lanternPivot.add(lanternCord, lanternGlobe);
  cottage.add(lanternPivot);

  // Invisible generous click target over the cottage & porch
  const cottageHit = new THREE.Mesh(
    new THREE.BoxGeometry(7.2, 5.8, 6.2),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  );
  cottageHit.position.set(0, 2.8, 0.5);
  cottageHit.name = 'HitProxy_Sunflower_Cottage';
  cottageHit.userData.__qzInteractiveName = 'Sunflower_Cottage';
  cottage.add(cottageHit);

  // =========================================================================
  // 6. LIGHTING FOR GOLDEN-VIOLET SUNSET MEADOW
  // =========================================================================
  const sunsetSun = new THREE.DirectionalLight(0xffae5c, 2.25);
  sunsetSun.position.set(-14, 7.5, -42);
  group.add(sunsetSun);

  const twilightHemi = new THREE.HemisphereLight(0x8c68a8, 0x262118, 0.92);
  group.add(twilightHemi);

  const porchLight = new THREE.PointLight(0xffb454, 18.0, 18.0, 1.55);
  porchLight.position.set(0.0, 2.4, -15.2);
  group.add(porchLight);

  // =========================================================================
  // 7. AMBIENT GOLDEN FIREFLIES + 5 INTERACTIVE GUIDING FIREFLIES
  // =========================================================================
  const fCount = 120;
  const fPos = new Float32Array(fCount * 3);
  const fPhase = new Float32Array(fCount);
  const fSize = new Float32Array(fCount);
  for (let i = 0; i < fCount; i++) {
    const z = 9.5 - rand() * 27.0;
    const x = (rand() - 0.5) * 20.0;
    fPos[i * 3] = x;
    fPos[i * 3 + 1] = groundY(x, z) + 0.8 + rand() * 2.6;
    fPos[i * 3 + 2] = z;
    fPhase[i] = rand() * Math.PI * 2;
    fSize[i] = 0.85 + rand() * 1.1;
  }
  const fGeo = new THREE.BufferGeometry();
  fGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3));
  fGeo.setAttribute('aPhase', new THREE.BufferAttribute(fPhase, 1));
  fGeo.setAttribute('aSize', new THREE.BufferAttribute(fSize, 1));
  const fireflyMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uScale: { value: dpr } },
    vertexShader: `
      attribute float aPhase;
      attribute float aSize;
      varying float vPulse;
      uniform float uTime;
      uniform float uScale;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.72 + aPhase) * 0.65;
        p.y += sin(uTime * 1.05 + aPhase * 1.6) * 0.35;
        p.z += cos(uTime * 0.65 - aPhase) * 0.55;
        vPulse = 0.32 + 0.68 * pow(0.5 + 0.5 * sin(uTime * 2.4 + aPhase * 2.3), 1.8);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(34.0 * aSize * uScale / max(2.0, -mv.z), 2.0, 9.5);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying float vPulse;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float core = exp(-d * d * 32.0);
        float halo = exp(-d * d * 7.5) * 0.55;
        vec3 col = mix(vec3(1.0, 0.78, 0.28), vec3(1.0, 0.98, 0.84), core);
        gl_FragColor = vec4(col, (core + halo) * vPulse);
        #include <colorspace_fragment>
      }
    `
  });
  group.add(new THREE.Points(fGeo, fireflyMat));

  // 5 Hero Guiding Fireflies flying along the garden path toward the glowing cottage doorway!
  const guideMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
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
      void main() {
        float d = length(vUv - vec2(0.5));
        if (d > 0.5) discard;
        float core = exp(-d * d * 48.0);
        float halo = exp(-d * d * 9.0) * 0.62;
        vec3 col = mix(vec3(1.0, 0.80, 0.30), vec3(1.0, 0.99, 0.88), core);
        gl_FragColor = vec4(col, (core + halo) * 0.95);
        #include <colorspace_fragment>
      }
    `
  });
  const guideFlies = [];
  for (let i = 0; i < 5; i++) {
    const spr = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.24), guideMat);
    spr.userData.__qzInteractiveName = 'Sunflower_Cottage';
    group.add(spr);
    guideFlies.push({ mesh: spr, offset: i * 0.20, lateral: (i - 2) * 0.32, freq: 1.5 + i * 0.25 });
  }

  function update(elapsed, camera, pointerX, pointerY, walkProgress, prefersReducedMotion) {
    skyMat.uniforms.uTime.value = elapsed;
    windUniforms.uTime.value = elapsed;
    fireflyMat.uniforms.uTime.value = elapsed;
    guideMat.uniforms.uTime.value = elapsed;
    if (!prefersReducedMotion) {
      lanternPivot.rotation.z = Math.sin(elapsed * 1.35) * 0.065;
    }
    // Guiding fireflies beckon smoothly ahead of viewer along path toward the warm glowing doorway
    for (const g of guideFlies) {
      const cycle = ((elapsed * 0.085 + g.offset) % 1.0);
      // Travel from near viewer (+5.. -15.5) into the warm doorway
      const zStart = 5.2 - walkProgress * 11.0;
      const zEnd = -15.6;
      const z = zStart + (zEnd - zStart) * cycle;
      const px = pathCenterX(z) + Math.sin(elapsed * g.freq + g.offset * 12) * 0.48 + g.lateral * (1 - cycle * 0.7) + pointerX * 0.45 * (1 - cycle);
      const py = groundY(px, z) + 1.15 + Math.sin(elapsed * 2.1 + g.offset * 18) * 0.28 + cycle * 0.55 + pointerY * 0.25 * (1 - cycle);
      g.mesh.position.set(px, py, z);
      const sc = 0.65 + 0.55 * Math.sin(cycle * Math.PI);
      g.mesh.scale.setScalar(sc);
      if (camera) g.mesh.lookAt(camera.position);
    }
  }

  return {
    group,
    cottage,
    hitTargets: [cottageHit, ...guideFlies.map((g) => g.mesh)],
    pathCenterX,
    groundY,
    update
  };
}
