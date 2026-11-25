import * as THREE from './vendor/three/three.module.js';
import {
  makeSinglePetalTexture,
  makeSunflowerDiscTexture,
  makeSunflowerLeafTexture,
  makeMeadowGrassTexture,
  makeMeadowGroundTexture
} from './sunflower-textures.js';

/**
 * Act II: 3D Painterly Oil-Book Golden-Violet Sunset Sunflower Meadow
 * + 3,200 Wind-Swept Grass Clumps + Diagonal Sunset God-Rays + Drifting Pollen
 * + Interactive Guiding Fireflies + Blender-Sculpted Curiosity Cottage with Opening Door.
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
  // 1. GLSL GOLDEN-VIOLET SUNSET DUSK SKY DOME (with emerging pinpoint stars)
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

        // Rich Makoto Shinkai golden-violet twilight sunset palette
        vec3 zenith = vec3(0.05, 0.04, 0.16);
        vec3 violet = vec3(0.22, 0.11, 0.34);
        vec3 rose   = vec3(0.62, 0.25, 0.36);
        vec3 amber  = vec3(0.92, 0.48, 0.24);
        vec3 gold   = vec3(0.98, 0.78, 0.42);

        vec3 col = mix(gold, amber, smoothstep(0.0, 0.09, h));
        col = mix(col, rose, smoothstep(0.07, 0.22, h));
        col = mix(col, violet, smoothstep(0.18, 0.42, h));
        col = mix(col, zenith, smoothstep(0.38, 0.78, h));

        // Setting sun glow just off-left behind the distant cottage hills
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

        // Pinpoint evening stars sparkling in the violet zenith
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
  // 2. 2.5D LAYERED PARALLAX DISTANT HILLS & SUNSET TREELINE RIDGES
  // =========================================================================
  function makeRidgeLayer(zDist, width, height, colorHex, rimHex, seedOff, addTrees = false) {
    const segs = 128;
    const geo = new THREE.PlaneGeometry(width, height, segs, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      const x = (u - 0.5) * width;
      let ridge =
        Math.sin(x * 0.045 + seedOff) * height * 0.32 +
        Math.sin(x * 0.11 - seedOff * 1.7) * height * 0.18 +
        Math.cos(x * 0.24 + seedOff * 0.6) * height * 0.08;
      if (addTrees) {
        ridge += Math.max(0, Math.sin(x * 1.85 + seedOff) * Math.cos(x * 0.72)) * 0.65;
      }
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
          float mist = smoothstep(0.0, 0.32, vUv.y);
          vec3 col = mix(vec3(0.32, 0.17, 0.24), mix(uBase, uRim, rim * 0.58), mist);
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }
      `
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(0, -1.2, zDist);
    group.add(m);
  }
  makeRidgeLayer(-96, 220, 16.5, 0x2a1c38, 0xd87a64, 0.7, false);
  makeRidgeLayer(-68, 165, 11.8, 0x1e182e, 0xc97452, 2.3, false);
  makeRidgeLayer(-46, 120, 7.6, 0x161920, 0xae6e44, 4.1, true);

  // =========================================================================
  // 3. TEXTURED ROLLING MEADOW GROUND + STEPPING STONES + PATHSIDE LANTERNS
  // =========================================================================
  const pathCenterX = (z) => Math.sin((z + 16) * 0.17) * 1.15 * Math.min(1, Math.abs(z + 18.5) / 14);
  const groundY = (x, z) => {
    const hill = Math.sin(x * 0.14) * Math.cos(z * 0.12) * 0.45 + Math.max(0, Math.abs(x) - 3.5) * 0.045;
    const distPath = Math.abs(x - pathCenterX(z));
    const pathFlat = Math.min(1, Math.max(0, (distPath - 1.0) / 2.2));
    return hill * pathFlat;
  };

  const gGeo = new THREE.PlaneGeometry(78, 58, 72, 64);
  gGeo.rotateX(-Math.PI / 2);
  const gPos = gGeo.attributes.position;
  const gCol = new Float32Array(gPos.count * 3);
  const cGrass = new THREE.Color(0x1f2d1d);
  const cWarmGrass = new THREE.Color(0x3a3b22);
  const cPath = new THREE.Color(0x745338);
  const tmpC = new THREE.Color();
  for (let i = 0; i < gPos.count; i++) {
    const x = gPos.getX(i);
    const z = gPos.getZ(i) - 10;
    gPos.setZ(i, z);
    const y = groundY(x, z);
    gPos.setY(i, y);
    const dp = Math.abs(x - pathCenterX(z));
    const pMask = Math.max(0, 1 - Math.max(0, dp - 0.65) / 0.85);
    tmpC.copy(cGrass).lerp(cWarmGrass, Math.max(0, Math.sin(x * 0.3 + z * 0.25) * 0.5 + 0.5));
    tmpC.lerp(cPath, pMask * 0.90);
    gCol[i * 3] = tmpC.r;
    gCol[i * 3 + 1] = tmpC.g;
    gCol[i * 3 + 2] = tmpC.b;
  }
  gGeo.setAttribute('color', new THREE.BufferAttribute(gCol, 3));
  gGeo.computeVertexNormals();
  const groundTex = makeMeadowGroundTexture();
  const groundMesh = new THREE.Mesh(
    gGeo,
    new THREE.MeshStandardMaterial({ map: groundTex, vertexColors: true, roughness: 0.94, metalness: 0.02 })
  );
  group.add(groundMesh);

  // Mossy Stepping Stones along the winding garden path
  const stoneGeo = new THREE.CylinderGeometry(0.41, 0.48, 0.085, 9);
  const stoneMats = [
    new THREE.MeshStandardMaterial({ color: 0x9b8268, roughness: 0.90 }),
    new THREE.MeshStandardMaterial({ color: 0x86745d, roughness: 0.92 }),
    new THREE.MeshStandardMaterial({ color: 0x77745c, roughness: 0.92 })
  ];
  for (let i = 0; i < 19; i++) {
    const sz = 8.5 - i * 1.28;
    const sx = pathCenterX(sz) + (i % 2 === 0 ? -0.14 : 0.14);
    const st = new THREE.Mesh(stoneGeo, stoneMats[i % stoneMats.length]);
    st.position.set(sx, groundY(sx, sz) + 0.032, sz);
    st.scale.set(0.95 + rand() * 0.25, 1, 0.72 + rand() * 0.2);
    st.rotation.y = rand() * Math.PI;
    group.add(st);
  }

  // 4 Low Charming Pathside Wooden & Brass Garden Lanterns
  const postWoodMat = new THREE.MeshStandardMaterial({ color: 0x3b2519, roughness: 0.78 });
  const postCapMat = new THREE.MeshStandardMaterial({ color: 0xb98d4e, metalness: 0.75, roughness: 0.32 });
  const postGlowMat = new THREE.MeshBasicMaterial({ color: 0xffdf92 });
  [4.2, -1.2, -6.6, -12.0].forEach((lz, idx) => {
    const lx = pathCenterX(lz) + (idx % 2 === 0 ? -1.08 : 1.08);
    const ly = groundY(lx, lz);
    const lp = new THREE.Group();
    lp.position.set(lx, ly, lz);
    const stake = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.56, 0.06), postWoodMat);
    stake.position.y = 0.26;
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 0.11), postGlowMat);
    bulb.position.y = 0.58;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.08, 4), postCapMat);
    cap.rotation.y = Math.PI / 4;
    cap.position.y = 0.68;
    lp.add(stake, bulb, cap);
    group.add(lp);
  });

  // Two subtle warm pathside fill lights illuminating petals & grass along the walk
  const pathGlow1 = new THREE.PointLight(0xffb454, 4.2, 8.5, 1.6);
  pathGlow1.position.set(pathCenterX(1.5), groundY(0, 1.5) + 0.9, 1.5);
  const pathGlow2 = new THREE.PointLight(0xffb454, 4.6, 8.5, 1.6);
  pathGlow2.position.set(pathCenterX(-9.5), groundY(0, -9.5) + 0.9, -9.5);
  group.add(pathGlow1, pathGlow2);

  // =========================================================================
  // 4. SCULPTED 3D SUNFLOWER SEA (Multi-Ring Curved Petals + Seed Disc + Calyx + Grass)
  // =========================================================================
  function mergeIndexedGeos(geos) {
    let totalVerts = 0;
    let totalIndices = 0;
    const hasColor = geos.every((g) => Boolean(g.attributes.color));
    for (const g of geos) {
      if (!g.attributes.normal) g.computeVertexNormals();
      totalVerts += g.attributes.position.count;
      totalIndices += g.index ? g.index.count : g.attributes.position.count;
    }
    const pos = new Float32Array(totalVerts * 3);
    const norm = new Float32Array(totalVerts * 3);
    const uv = new Float32Array(totalVerts * 2);
    const col = hasColor ? new Float32Array(totalVerts * 3) : null;
    const IdxArr = totalVerts > 65535 ? Uint32Array : Uint16Array;
    const idx = new IdxArr(totalIndices);

    let vOff = 0;
    let iOff = 0;
    for (const g of geos) {
      const vc = g.attributes.position.count;
      pos.set(g.attributes.position.array, vOff * 3);
      norm.set(g.attributes.normal.array, vOff * 3);
      if (g.attributes.uv) uv.set(g.attributes.uv.array, vOff * 2);
      if (hasColor) col.set(g.attributes.color.array, vOff * 3);
      if (g.index) {
        const srcIdx = g.index.array;
        for (let k = 0; k < srcIdx.length; k++) idx[iOff++] = srcIdx[k] + vOff;
      } else {
        for (let k = 0; k < vc; k++) idx[iOff++] = k + vOff;
      }
      vOff += vc;
      g.dispose();
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(norm, 3));
    out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    if (hasColor) out.setAttribute('color', new THREE.BufferAttribute(col, 3));
    out.setIndex(new THREE.BufferAttribute(idx, 1));
    return out;
  }

  const windUniforms = { uTime: { value: 0 } };
  function injectBotanicalShader(mat, mode, swayAmt = 0.13) {
    mat.customProgramCacheKey = () => `qz-botanical-v2-${mode}-${swayAmt.toFixed(2)}`;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = windUniforms.uTime;
      shader.vertexShader = `uniform float uTime;\nvarying vec2 vBotUv;\n` + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vBotUv = uv;
         vec3 instOrigin = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
         float wave = sin(uTime * 1.48 + instOrigin.x * 0.42 + instOrigin.z * 0.34)
                    + 0.42 * cos(uTime * 2.15 - instOrigin.x * 0.68 + instOrigin.z * 0.52);
         float bend = smoothstep(0.0, 1.28, position.y);
         transformed.x += wave * ${swayAmt.toFixed(3)} * bend;
         transformed.z += wave * ${(swayAmt * 0.52).toFixed(3)} * bend;`
      );
      if (mode !== 'stem' && mode !== 'disc') {
        shader.fragmentShader = `varying vec2 vBotUv;\n` + shader.fragmentShader;
        let glowSnippet = '';
        if (mode === 'petal') {
          glowSnippet = `
            float sss = smoothstep(0.16, 0.90, vBotUv.y);
            totalEmissiveRadiance += diffuseColor.rgb * vec3(1.06, 0.92, 0.28) * sss * 0.42;
          `;
        } else if (mode === 'leaf') {
          glowSnippet = `
            float tipL = smoothstep(0.32, 0.92, vBotUv.y);
            totalEmissiveRadiance += diffuseColor.rgb * vec3(0.55, 0.72, 0.20) * tipL * 0.28;
          `;
        } else if (mode === 'grass') {
          glowSnippet = `
            float tipG = smoothstep(0.45, 0.98, vBotUv.y);
            totalEmissiveRadiance += diffuseColor.rgb * vec3(0.58, 0.68, 0.18) * tipG * 0.28;
          `;
        }
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>\n${glowSnippet}`
        );
      }
    };
  }

  const HEAD_TILT_X = -0.14;
  const HEAD_CENTER = new THREE.Vector3(0, 1.28, 0.044);

  // 4A. Bowed Stalk + Green Sepal Calyx Cup & Flared Bracts
  const stemPart = new THREE.CylinderGeometry(0.022, 0.038, 1.27, 6, 5);
  stemPart.translate(0, 0.635, 0);
  const stemPos = stemPart.attributes.position;
  for (let i = 0; i < stemPos.count; i++) {
    const t = Math.max(0, Math.min(1, stemPos.getY(i) / 1.27));
    stemPos.setZ(i, stemPos.getZ(i) + Math.sin(t * Math.PI) * 0.030 + Math.pow(t, 2.2) * 0.026);
  }
  stemPart.computeVertexNormals();

  const calyxCup = new THREE.SphereGeometry(0.135, 12, 6, 0, Math.PI * 2, Math.PI * 0.48, Math.PI * 0.52);
  calyxCup.rotateX(-Math.PI * 0.5); // open rim faces +Z, rounded back faces -Z
  calyxCup.scale(1.0, 1.0, 0.48);
  calyxCup.rotateX(HEAD_TILT_X);
  calyxCup.translate(HEAD_CENTER.x, HEAD_CENTER.y, 0.028);

  const calyxGeos = [stemPart, calyxCup];
  for (let b = 0; b < 8; b++) {
    const ba = (b / 8) * Math.PI * 2 + 0.2;
    const bract = new THREE.ConeGeometry(0.036, 0.095, 3);
    bract.scale(1.0, 1.0, 0.28);
    bract.translate(0, 0.045, 0);
    bract.rotateX(-0.28);
    bract.rotateZ(ba - Math.PI * 0.5);
    bract.translate(Math.cos(ba) * 0.095, Math.sin(ba) * 0.095, -0.015);
    bract.rotateX(HEAD_TILT_X);
    bract.translate(HEAD_CENTER.x, HEAD_CENTER.y, 0.028);
    bract.computeVertexNormals();
    calyxGeos.push(bract);
  }
  const stemCalyxGeo = mergeIndexedGeos(calyxGeos);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x3b632e, roughness: 0.82 });
  injectBotanicalShader(stemMat, 'stem', 0.13);

  // 4B. Convex Domed Botanical Seed Disc with Warm Fibonacci Corona
  const discTex = makeSunflowerDiscTexture();
  function buildDomedDiscGeo(R = 0.132, angSegs = 18, radSegs = 4) {
    const g = new THREE.BufferGeometry();
    const verts = [0, 0, 0.050];
    const uvs = [0.5, 0.5];
    const indices = [];
    for (let ir = 1; ir <= radSegs; ir++) {
      const f = ir / radSegs;
      const r = R * f;
      const z = 0.050 * Math.cos(f * Math.PI * 0.46) - 0.004 * f * f;
      for (let ia = 0; ia < angSegs; ia++) {
        const th = (ia / angSegs) * Math.PI * 2;
        const x = Math.cos(th) * r;
        const y = Math.sin(th) * r;
        verts.push(x, y, z);
        uvs.push(0.5 + (0.5 * x) / R, 0.5 + (0.5 * y) / R);
      }
    }
    for (let ia = 0; ia < angSegs; ia++) {
      const next = (ia + 1) % angSegs;
      indices.push(0, 1 + ia, 1 + next);
    }
    for (let ir = 1; ir < radSegs; ir++) {
      const r0 = 1 + (ir - 1) * angSegs;
      const r1 = 1 + ir * angSegs;
      for (let ia = 0; ia < angSegs; ia++) {
        const next = (ia + 1) % angSegs;
        indices.push(r0 + ia, r1 + ia, r1 + next, r0 + ia, r1 + next, r0 + next);
      }
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    g.rotateX(HEAD_TILT_X);
    g.translate(HEAD_CENTER.x, HEAD_CENTER.y, 0.056);
    g.computeVertexNormals();
    return g;
  }
  const discGeo = buildDomedDiscGeo(0.132, 18, 4);
  const discMat = new THREE.MeshStandardMaterial({
    map: discTex,
    roughness: 0.90,
    metalness: 0.0,
    emissive: new THREE.Color(0x2b1707),
    emissiveIntensity: 0.38
  });
  injectBotanicalShader(discMat, 'disc', 0.13);

  // 4C. True 3D Multi-Ring Sculpted Curved Overlapping Petals (2 Variants!)
  const petalTex = makeSinglePetalTexture();
  function build3DPetalBlossomGeo(seedInit) {
    let s = seedInit >>> 0;
    const rnd = () => {
      s = (1664525 * s + 1013904223) >>> 0;
      return s / 4294967296;
    };

    const segU = 2;
    const segV = 3;
    const positions = [];
    const uvs = [];
    const colors = [];
    const indices = [];

    const addPetal = (theta, rStart, len, width, ringZ, pitch, roll, curl, tintCol, archPow) => {
      const baseV = positions.length / 3;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);
      const cosR = Math.cos(roll);
      const sinR = Math.sin(roll);

      for (let iv = 0; iv <= segV; iv++) {
        const v = iv / segV;
        const y0 = v * len;
        const baseZ = Math.sin(v * Math.PI) * 0.026 - archPow * v * v;
        for (let iu = 0; iu <= segU; iu++) {
          const u = (iu / segU) * 2 - 1;
          const x0 = u * (width * 0.5) + curl * v * v;
          const cupZ = baseZ + 0.012 * u * u;

          // Pitch forward/back around tangential axis
          const yP = y0 * cosP - cupZ * sinP;
          const zP = y0 * sinP + cupZ * cosP;

          // Gentle twist around radial axis so neighboring petals catch dusk light uniquely
          const xR = x0 * cosR - zP * sinR;
          const zR = x0 * sinR + zP * cosR + ringZ;

          const radR = rStart + yP;
          const lx = cosT * radR - sinT * xR;
          const ly = sinT * radR + cosT * xR;
          const lz = zR;

          positions.push(lx, ly, lz);
          uvs.push(iu / segU, v);
          colors.push(tintCol.r, tintCol.g, tintCol.b);
        }
      }

      const stride = segU + 1;
      for (let iv = 0; iv < segV; iv++) {
        for (let iu = 0; iu < segU; iu++) {
          const i00 = baseV + iv * stride + iu;
          const i10 = i00 + 1;
          const i01 = i00 + stride;
          const i11 = i01 + 1;
          indices.push(i00, i01, i10, i01, i11, i10);
        }
      }
    };

    const backBase = new THREE.Color(0xf4be3c);
    const frontBase = new THREE.Color(0xfff8d2);
    const workCol = new THREE.Color();

    // Outer/back ring: 14 broad overlapping golden petals with relaxed arch & organic stagger
    const nBack = 14;
    for (let i = 0; i < nBack; i++) {
      const th = (i / nBack) * Math.PI * 2 + (rnd() - 0.5) * 0.16;
      const len = 0.195 + rnd() * 0.045;
      const wid = 0.112 + rnd() * 0.022;
      const pitch = -0.14 + rnd() * 0.24;
      const roll = (rnd() - 0.5) * 0.30;
      const curl = (rnd() - 0.5) * 0.024;
      workCol.copy(backBase).multiplyScalar(0.95 + rnd() * 0.09);
      addPetal(th, 0.104, len, wid, -0.004, pitch, roll, curl, workCol, 0.046);
    }

    // Inner/front ring: 12 plump staggered petals cupping forward around the pollen corona
    const nFront = 12;
    for (let i = 0; i < nFront; i++) {
      const th = ((i + 0.5) / nFront) * Math.PI * 2 + (rnd() - 0.5) * 0.20;
      const len = 0.174 + rnd() * 0.038;
      const wid = 0.096 + rnd() * 0.020;
      const pitch = 0.05 + rnd() * 0.19;
      const roll = (rnd() - 0.5) * 0.28;
      const curl = (rnd() - 0.5) * 0.020;
      workCol.copy(frontBase).multiplyScalar(0.96 + rnd() * 0.06);
      addPetal(th, 0.098, len, wid, 0.012, pitch, roll, curl, workCol, 0.032);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.rotateX(HEAD_TILT_X);
    geo.translate(HEAD_CENTER.x, HEAD_CENTER.y, HEAD_CENTER.z);
    geo.computeVertexNormals();
    return geo;
  }

  const petalGeoA = build3DPetalBlossomGeo(1703);
  const petalGeoB = build3DPetalBlossomGeo(5381);
  const petalMat = new THREE.MeshStandardMaterial({
    map: petalTex,
    vertexColors: true,
    alphaTest: 0.38,
    side: THREE.DoubleSide,
    roughness: 0.62,
    metalness: 0.0
  });
  injectBotanicalShader(petalMat, 'petal', 0.13);

  // 4D. Paired Broad Arched Opposite Stem Leaves (Merged Left + Right in 1 Draw Call!)
  const leafTex = makeSunflowerLeafTexture();
  function buildSingleLeaf(attachY, rotY, tiltX) {
    const g = new THREE.PlaneGeometry(0.36, 0.50, 4, 5);
    g.translate(0, 0.25, 0);
    const lp = g.attributes.position;
    for (let i = 0; i < lp.count; i++) {
      const u = lp.getY(i) / 0.50;
      const sideFold = Math.abs(lp.getX(i)) * 0.18;
      lp.setZ(i, lp.getZ(i) + Math.sin(u * Math.PI) * 0.08 + sideFold - u * u * 0.11);
    }
    g.rotateX(tiltX);
    g.rotateY(rotY);
    g.translate(0, attachY, 0);
    g.computeVertexNormals();
    return g;
  }
  const mergedLeafGeo = mergeIndexedGeos([
    buildSingleLeaf(0.45, -1.35, 1.05),
    buildSingleLeaf(0.75, +1.42, 0.95)
  ]);

  const leafMat = new THREE.MeshStandardMaterial({
    map: leafTex,
    alphaTest: 0.36,
    side: THREE.DoubleSide,
    roughness: 0.78
  });
  injectBotanicalShader(leafMat, 'leaf', 0.10);

  // Scatter ~1,450 sculpted 3D sunflowers split evenly across variants A & B along winding path
  const transformsA = [];
  const transformsB = [];
  const tintsA = [];
  const tintsB = [];
  const allTransforms = [];
  const tintPalette = [0xffffff, 0xfff8d8, 0xfff0b4, 0xffe99c, 0xfef5ca];
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 2600 && allTransforms.length < 1450; i++) {
    const z = 11.8 - Math.pow(rand(), 0.85) * 34.5;
    const x = (rand() - 0.5) * (25 + Math.max(0, -z) * 1.18);
    const dp = Math.abs(x - pathCenterX(z));
    if (dp < 1.32 + rand() * 0.32) continue;
    if (z < -13.2 && Math.abs(x) < 5.2) continue;
    const y = groundY(x, z);
    const sc = 0.68 + rand() * 0.42;
    dummy.position.set(x, y - 0.05, z);
    dummy.scale.set(sc, sc * (0.90 + rand() * 0.24), sc);
    dummy.rotation.set(-0.16 + (rand() - 0.5) * 0.30, -0.15 + (rand() - 0.5) * 1.35, (rand() - 0.5) * 0.24);
    dummy.updateMatrix();
    const mat4 = dummy.matrix.clone();
    const tint = new THREE.Color(tintPalette[i % tintPalette.length]);
    allTransforms.push(mat4);
    if ((allTransforms.length & 1) === 0) {
      transformsA.push(mat4);
      tintsA.push(tint);
    } else {
      transformsB.push(mat4);
      tintsB.push(tint);
    }
  }

  const instCount = allTransforms.length;
  const stems = new THREE.InstancedMesh(stemCalyxGeo, stemMat, instCount);
  const discs = new THREE.InstancedMesh(discGeo, discMat, instCount);
  const leaves = new THREE.InstancedMesh(mergedLeafGeo, leafMat, instCount);
  for (let i = 0; i < instCount; i++) {
    stems.setMatrixAt(i, allTransforms[i]);
    discs.setMatrixAt(i, allTransforms[i]);
    leaves.setMatrixAt(i, allTransforms[i]);
  }
  stems.instanceMatrix.needsUpdate = true;
  discs.instanceMatrix.needsUpdate = true;
  leaves.instanceMatrix.needsUpdate = true;

  const petalsA = new THREE.InstancedMesh(petalGeoA, petalMat, transformsA.length);
  for (let i = 0; i < transformsA.length; i++) {
    petalsA.setMatrixAt(i, transformsA[i]);
    petalsA.setColorAt(i, tintsA[i]);
  }
  petalsA.instanceMatrix.needsUpdate = true;
  if (petalsA.instanceColor) petalsA.instanceColor.needsUpdate = true;

  const petalsB = new THREE.InstancedMesh(petalGeoB, petalMat, transformsB.length);
  for (let i = 0; i < transformsB.length; i++) {
    petalsB.setMatrixAt(i, transformsB[i]);
    petalsB.setColorAt(i, tintsB[i]);
  }
  petalsB.instanceMatrix.needsUpdate = true;
  if (petalsB.instanceColor) petalsB.instanceColor.needsUpdate = true;

  group.add(stems, discs, petalsA, petalsB, leaves);

  // 4D. 3,200 Wind-Swept Cross-Quad Meadow Grass Clumps (conceals ground seams!)
  const grassTex = makeMeadowGrassTexture();
  function makeGrassCrossGeo() {
    const p1 = new THREE.PlaneGeometry(0.62, 0.50, 2, 3);
    p1.translate(0, 0.25, 0);
    const p2 = new THREE.PlaneGeometry(0.62, 0.50, 2, 3);
    p2.translate(0, 0.25, 0);
    p2.rotateY(Math.PI * 0.42);
    const geo = new THREE.BufferGeometry();
    const pa = p1.attributes.position.array;
    const pb = p2.attributes.position.array;
    const ua = p1.attributes.uv.array;
    const ub = p2.attributes.uv.array;
    const ia = p1.index.array;
    const ib = p2.index.array;
    const pos = new Float32Array(pa.length + pb.length);
    pos.set(pa, 0); pos.set(pb, pa.length);
    const uv = new Float32Array(ua.length + ub.length);
    uv.set(ua, 0); uv.set(ub, ua.length);
    const vcA = p1.attributes.position.count;
    const idx = new Uint16Array(ia.length + ib.length);
    idx.set(ia, 0);
    for (let k = 0; k < ib.length; k++) idx[ia.length + k] = ib[k] + vcA;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeVertexNormals();
    p1.dispose(); p2.dispose();
    return geo;
  }
  const grassGeo = makeGrassCrossGeo();
  const grassMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    alphaTest: 0.34,
    side: THREE.DoubleSide,
    roughness: 0.86
  });
  injectBotanicalShader(grassMat, 'grass', 0.14);

  const grassTransforms = [];
  for (let i = 0; i < 4200 && grassTransforms.length < 3200; i++) {
    const z = 11.8 - Math.pow(rand(), 0.82) * 34.0;
    const cxP = pathCenterX(z);
    // Bias 30% of tufts right along path borders for lush organic trail edging!
    const x = (i % 3 === 0)
      ? cxP + (rand() < 0.5 ? -1 : 1) * (0.76 + rand() * 0.95)
      : (rand() - 0.5) * (25 + Math.max(0, -z) * 1.12);
    const dp = Math.abs(x - cxP);
    if (dp < 0.72) continue;
    if (z < -13.8 && Math.abs(x) < 4.5) continue;
    const y = groundY(x, z);
    const sc = 0.75 + rand() * 0.75;
    dummy.position.set(x, y - 0.04, z);
    dummy.scale.set(sc, sc * (0.85 + rand() * 0.4), sc);
    dummy.rotation.set((rand() - 0.5) * 0.16, rand() * Math.PI * 2, (rand() - 0.5) * 0.16);
    dummy.updateMatrix();
    grassTransforms.push(dummy.matrix.clone());
  }
  const grassMesh = new THREE.InstancedMesh(grassGeo, grassMat, grassTransforms.length);
  for (let i = 0; i < grassTransforms.length; i++) {
    grassMesh.setMatrixAt(i, grassTransforms[i]);
  }
  grassMesh.instanceMatrix.needsUpdate = true;
  group.add(grassMesh);

  // =========================================================================
  // 5. DIAGONAL VOLUMETRIC SUNSET GOD-RAYS + DRIFTING GOLDEN POLLEN
  // =========================================================================
  const rayMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
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
        float edgeX = pow(sin(vUv.x * 3.14159265), 2.2);
        float edgeY = pow(sin(vUv.y * 3.14159265), 1.5);
        float breath = 0.78 + 0.22 * sin(uTime * 0.65 + vUv.x * 4.0);
        vec3 col = vec3(1.0, 0.72, 0.36);
        gl_FragColor = vec4(col, edgeX * edgeY * 0.072 * breath);
        #include <colorspace_fragment>
      }
    `
  });
  const raySpecs = [
    [-9.5, 6.2, -16.0, 12.0, 26.0, 0.58],
    [-4.2, 6.8, -11.5, 10.5, 24.0, 0.56],
    [1.8, 7.0, -7.0, 11.0, 25.0, 0.54],
    [7.2, 6.4, -14.0, 11.5, 24.0, 0.58],
    [-1.5, 6.4, -1.5, 9.5, 22.0, 0.55]
  ];
  for (const [rx, ry, rz, rw, rh, tz] of raySpecs) {
    const shaft = new THREE.Mesh(new THREE.PlaneGeometry(rw, rh), rayMat);
    shaft.position.set(rx, ry, rz);
    shaft.rotation.set(0.22, -0.18, -tz);
    group.add(shaft);
  }

  // 180 Drifting Sunlit Pollen Motes riding the evening breeze
  const pCount = 180;
  const pPos = new Float32Array(pCount * 3);
  const pPhase = new Float32Array(pCount);
  for (let i = 0; i < pCount; i++) {
    const z = 10.5 - rand() * 30.0;
    const x = (rand() - 0.5) * 22.0;
    pPos[i * 3] = x;
    pPos[i * 3 + 1] = groundY(x, z) + 0.4 + rand() * 3.8;
    pPos[i * 3 + 2] = z;
    pPhase[i] = rand() * Math.PI * 2;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('aPhase', new THREE.BufferAttribute(pPhase, 1));
  const pollenMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uScale: { value: dpr } },
    vertexShader: `
      attribute float aPhase;
      varying float vA;
      uniform float uTime;
      uniform float uScale;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.45 + aPhase) * 0.8 + mod(uTime * 0.22 + aPhase * 2.0, 6.0) - 3.0;
        p.y += sin(uTime * 0.72 + aPhase * 1.4) * 0.35;
        vA = 0.28 + 0.38 * sin(uTime * 1.6 + aPhase);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(16.0 * uScale / max(1.8, -mv.z), 1.2, 5.5);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.1, d) * vA;
        gl_FragColor = vec4(vec3(1.0, 0.86, 0.54), a);
        #include <colorspace_fragment>
      }
    `
  });
  group.add(new THREE.Points(pGeo, pollenMat));

  // =========================================================================
  // 6. BLENDER SCULPTED CURIOSITY COTTAGE MOUNT + SWINGING DOOR + SMOKE
  // =========================================================================
  const cottage = new THREE.Group();
  cottage.name = 'Sunflower_Cottage';
  cottage.position.set(0.0, groundY(0, -18.5), -18.5);
  group.add(cottage);

  const cottageMount = new THREE.Group();
  cottageMount.name = 'Sunflower_Cottage_Mount';
  cottage.add(cottageMount);

  // Ultra-lightweight temporary silhouette until sunflower-cottage.glb finishes loading (~150ms)
  const fallbackCottage = new THREE.Group();
  const fbMat = new THREE.MeshStandardMaterial({ color: 0xc2ab8e, roughness: 0.88 });
  const fbBody = new THREE.Mesh(new THREE.BoxGeometry(6.2, 3.3, 4.6), fbMat);
  fbBody.position.set(0, 2.35, -0.1);
  fallbackCottage.add(fbBody);
  cottageMount.add(fallbackCottage);

  let sculptedMounted = false;
  let doorPivot = null;
  let porchLanternPivot = null;
  let doorOpenTarget = 0; // 0 = cozy ajar 15 deg (0.26 rad), 1 = wide open 85 deg (1.48 rad)
  let doorOpenCur = 0;

  function mountSculptedCottage(gltfScene) {
    if (sculptedMounted || !gltfScene) return;
    sculptedMounted = true;
    cottageMount.remove(fallbackCottage);
    cottageMount.add(gltfScene);
    gltfScene.traverse((obj) => {
      if (obj.name === 'Cottage_Door_Pivot') {
        doorPivot = obj;
        doorPivot.rotation.y = 0.26;
      }
      if (obj.name === 'Cottage_Porch_Lantern') {
        porchLanternPivot = obj;
      }
    });
  }

  function setDoorOpen(v, instant = false) {
    doorOpenTarget = Math.max(0, Math.min(1, v));
    if (instant) {
      doorOpenCur = doorOpenTarget;
      if (doorPivot) doorPivot.rotation.y = 0.26 + doorOpenCur * 1.22;
    }
  }

  // Rising Chimney Hearth Smoke Wisps above the cottage roof (-2.15, 6.55, -0.85)
  const sCount = 26;
  const sPos = new Float32Array(sCount * 3);
  const sSeed = new Float32Array(sCount);
  for (let i = 0; i < sCount; i++) {
    sPos[i * 3] = -2.15;
    sPos[i * 3 + 1] = 6.55;
    sPos[i * 3 + 2] = -0.85;
    sSeed[i] = i / sCount;
  }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  sGeo.setAttribute('aSeed', new THREE.BufferAttribute(sSeed, 1));
  const smokeMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uScale: { value: dpr } },
    vertexShader: `
      attribute float aSeed;
      varying float vLife;
      uniform float uTime;
      uniform float uScale;
      void main() {
        float life = fract(aSeed + uTime * 0.085);
        vLife = life;
        vec3 p = position;
        p.y += life * 4.4;
        p.x += life * 1.65 + sin(uTime * 0.9 + aSeed * 12.0) * 0.35 * life;
        p.z += cos(uTime * 0.7 + aSeed * 9.0) * 0.25 * life;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp((180.0 + life * 360.0) * uScale / max(4.0, -mv.z), 4.0, 34.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying float vLife;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float puff = smoothstep(0.5, 0.05, d);
        float env = smoothstep(0.0, 0.18, vLife) * smoothstep(1.0, 0.35, vLife);
        gl_FragColor = vec4(vec3(0.88, 0.76, 0.72), puff * env * 0.18);
        #include <colorspace_fragment>
      }
    `
  });
  cottage.add(new THREE.Points(sGeo, smokeMat));

  // Invisible generous click target over the cottage & porch
  const cottageHit = new THREE.Mesh(
    new THREE.BoxGeometry(7.4, 6.2, 6.5),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  );
  cottageHit.position.set(0, 3.0, 0.6);
  cottageHit.name = 'HitProxy_Sunflower_Cottage';
  cottageHit.userData.__qzInteractiveName = 'Sunflower_Cottage';
  cottage.add(cottageHit);

  // =========================================================================
  // 7. GOLDEN-HOUR SUNSET + WARM HORIZON BOUNCE FILL (vibrant sunflower golds)
  // =========================================================================
  const sunsetSun = new THREE.DirectionalLight(0xffc966, 2.25);
  sunsetSun.position.set(-24, 14, -22);
  group.add(sunsetSun);

  const sunBounceFill = new THREE.DirectionalLight(0xffe0a3, 1.35);
  sunBounceFill.position.set(-10, 12, 24);
  group.add(sunBounceFill);

  const twilightHemi = new THREE.HemisphereLight(0xdba8b8, 0x3b3d22, 1.15);
  group.add(twilightHemi);

  const porchLight = new THREE.PointLight(0xffb454, 11.5, 16.5, 1.65);
  porchLight.position.set(0.0, 2.45, -14.8);
  group.add(porchLight);

  // =========================================================================
  // 8. AMBIENT GOLDEN FIREFLIES + 5 INTERACTIVE GUIDING FIREFLIES
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

  // 5 Hero Guiding Fireflies dancing ahead of viewer along path toward the doorway
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

  function update(elapsed, camera, pointerX, pointerY, walkProgress, prefersReducedMotion, dt = 0.016) {
    skyMat.uniforms.uTime.value = elapsed;
    windUniforms.uTime.value = elapsed;
    rayMat.uniforms.uTime.value = elapsed;
    pollenMat.uniforms.uTime.value = elapsed;
    smokeMat.uniforms.uTime.value = elapsed;
    fireflyMat.uniforms.uTime.value = elapsed;
    guideMat.uniforms.uTime.value = elapsed;

    // Smooth door opening (0 = cozy 15 deg ajar, 1 = wide 85 deg inward!)
    doorOpenCur += (doorOpenTarget - doorOpenCur) * Math.min(1, dt * (prefersReducedMotion ? 20 : 6.5));
    if (doorPivot) {
      doorPivot.rotation.y = 0.26 + doorOpenCur * 1.22;
    }

    if (!prefersReducedMotion && porchLanternPivot) {
      porchLanternPivot.rotation.z = Math.sin(elapsed * 1.35) * 0.065;
    }

    for (const g of guideFlies) {
      const cycle = ((elapsed * 0.085 + g.offset) % 1.0);
      const zStart = 5.2 - walkProgress * 11.0;
      const zEnd = -15.2;
      const z = zStart + (zEnd - zStart) * cycle;
      const px = pathCenterX(z) + Math.sin(elapsed * g.freq + g.offset * 12) * 0.48 + g.lateral * (1 - cycle * 0.7) + pointerX * 0.45 * (1 - cycle);
      const py = groundY(px, z) + 1.15 + Math.sin(elapsed * 2.1 + g.offset * 18) * 0.28 + cycle * 0.55 + pointerY * 0.25 * (1 - cycle);
      g.mesh.position.set(px, py, z);
      const dist = camera ? Math.hypot(camera.position.x - px, camera.position.y - py, camera.position.z - z) : 5.0;
      const nearFade = Math.max(0.0, Math.min(1.0, (dist - 1.5) / 1.8));
      const sc = (0.58 + 0.48 * Math.sin(cycle * Math.PI)) * nearFade;
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
    mountSculptedCottage,
    setDoorOpen,
    update
  };
}
