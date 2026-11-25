import * as THREE from './vendor/three/three.module.js';

/**
 * Phase 3 Cinematic Transition Rig:
 * 1. Colossal Curved Planet Horizon + Atmospheric Terminator (`horizonGroup` in main scene).
 * 2. 3D Radial Interstellar Warp Streaks + Soft Arrival Corona + 20-Layer Volumetric Backlit Cloud Tunnel (`overlayScene`).
 * 3. Real Dual-Pass Doorway Frame-Wipe Composite (`createDoorPortalPass`).
 */
export function createDescentRig(dpr = 1) {
  let seed = 88417;
  const rand = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // =========================================================================
  // 1. ORBITAL HORIZON SCENE (Added to Main Scene -> receives Bloom & ACES)
  // =========================================================================
  const horizonGroup = new THREE.Group();
  horizonGroup.name = 'QZ_Orbital_Horizon';
  horizonGroup.visible = false;

  // 1A. Deep Orbital Starfield Arc above the Curved Planet
  const orbStarCount = 1800;
  const osPos = new Float32Array(orbStarCount * 3);
  const osCol = new Float32Array(orbStarCount * 3);
  const osSz = new Float32Array(orbStarCount);
  const osPh = new Float32Array(orbStarCount);
  const sColor = new THREE.Color();
  const starTones = [0xcbe0ff, 0xfff5e4, 0xffd7a4, 0xd8d0ff];
  for (let i = 0; i < orbStarCount; i++) {
    const phi = rand() * Math.PI * 2;
    const u = rand() * 1.4 - 0.35; // spread broadly over upper & mid sky dome
    const len = Math.sqrt(Math.max(0.05, 1.0 - Math.min(0.95, u * u)));
    const r = 165 + rand() * 115;
    osPos[i * 3] = r * len * Math.cos(phi);
    osPos[i * 3 + 1] = r * Math.max(-0.25, u) - 10.0;
    osPos[i * 3 + 2] = r * len * Math.sin(phi) - 24.0;
    sColor.setHex(starTones[i % starTones.length]);
    const bright = i % 15 === 0 ? 1.0 : 0.42 + rand() * 0.48;
    osCol[i * 3] = sColor.r * bright;
    osCol[i * 3 + 1] = sColor.g * bright;
    osCol[i * 3 + 2] = sColor.b * bright;
    osSz[i] = i % 15 === 0 ? 1.55 + rand() * 0.8 : 0.65 + rand() * 0.7;
    osPh[i] = rand() * Math.PI * 2;
  }
  const osGeo = new THREE.BufferGeometry();
  osGeo.setAttribute('position', new THREE.BufferAttribute(osPos, 3));
  osGeo.setAttribute('color', new THREE.BufferAttribute(osCol, 3));
  osGeo.setAttribute('aSize', new THREE.BufferAttribute(osSz, 1));
  osGeo.setAttribute('aPhase', new THREE.BufferAttribute(osPh, 1));
  const osMat = new THREE.ShaderMaterial({
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
        vTw = 0.78 + 0.22 * sin(uTime * 1.9 + aPhase * 3.7);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(85.0 * aSize * uScale / max(24.0, -mv.z), 1.4, 4.4);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vTw;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float core = exp(-d * d * 26.0);
        float halo = (1.0 - smoothstep(0.08, 0.5, d)) * 0.35;
        gl_FragColor = vec4(vColor, (core * 0.9 + halo) * vTw);
        #include <colorspace_fragment>
      }
    `
  });
  horizonGroup.add(new THREE.Points(osGeo, osMat));

  // 1B. Colossal Curved Planet Limb (R = 54 at (0, -58.5, -24))
  const HORIZON_POS = new THREE.Vector3(0, -58.5, -24);
  const HORIZON_R = 54.0;
  const sunDir = new THREE.Vector3(-0.62, 0.16, -0.77).normalize();

  const horizonSurfaceMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: sunDir }
    },
    vertexShader: `
      varying vec3 vNormalWorld;
      varying vec3 vPosLocal;
      varying vec3 vViewDir;
      void main() {
        vPosLocal = normalize(position);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSunDir;
      varying vec3 vNormalWorld;
      varying vec3 vPosLocal;
      varying vec3 vViewDir;

      float hash31(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }
      float n3(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x),
              mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
          mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
              mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y),
          f.z
        );
      }
      float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * n3(p);
          p = p * 2.12 + vec3(1.4, -2.1, 0.8);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 n = normalize(vNormalWorld);
        vec3 v = normalize(vViewDir);
        vec3 s = normalize(uSunDir);
        float ndl = dot(n, s);
        float day = smoothstep(-0.22, 0.42, ndl);
        float twilight = exp(-pow((ndl + 0.06) * 4.4, 2.0));

        // High-detail coastal continents, golden plateaus & deep sapphire twilight seas
        float cont = fbm(vPosLocal * 10.5 + vec3(0.4, -0.5, 1.3));
        float detail = fbm(vPosLocal * 26.0);
        float isLand = smoothstep(0.49, 0.56, cont + (detail - 0.5) * 0.18);

        vec3 oceanDeep = vec3(0.02, 0.05, 0.14);
        vec3 oceanShallow = vec3(0.05, 0.16, 0.30);
        vec3 oceanCol = mix(oceanDeep, oceanShallow, smoothstep(0.30, 0.49, cont));

        vec3 plainsGold = vec3(0.62, 0.42, 0.16);
        vec3 meadowJade = vec3(0.14, 0.26, 0.18);
        vec3 landCol = mix(meadowJade, plainsGold, smoothstep(0.50, 0.72, cont + detail * 0.22));

        vec3 surface = mix(oceanCol, landCol, isLand);

        // Crisp multi-scale swirling cloud bands across planet curvature
        float cw = fbm(vPosLocal * 18.0 + vec3(uTime * 0.015, 0.0, -uTime * 0.01));
        float cloudMask = smoothstep(0.52, 0.78, cw) * 0.62;

        // Ocean sun glint + rich sunset terminator glow
        vec3 h = normalize(s + v);
        float glint = pow(max(0.0, dot(n, h)), 36.0) * (1.0 - isLand) * smoothstep(-0.35, 0.4, ndl) * 0.36;

        vec3 nightCol = surface * vec3(0.03, 0.05, 0.12);
        vec3 dayCol = surface * (0.20 + 0.72 * day) + vec3(1.0, 0.80, 0.52) * glint;
        vec3 col = mix(nightCol, dayCol, day);

        vec3 cloudTint = mix(vec3(0.14, 0.12, 0.26), vec3(0.96, 0.68, 0.42), twilight * 0.80 + day * 0.28);
        col = mix(col, cloudTint, cloudMask);

        // Golden-rose atmospheric terminator band & warm city/cottage embers on dark side
        col += vec3(0.98, 0.48, 0.24) * twilight * 0.38;
        float ember = smoothstep(0.86, 0.96, n3(vPosLocal * 56.0)) * isLand * (1.0 - day) * 0.55;
        col += vec3(1.0, 0.78, 0.36) * ember;

        // Smooth Rayleigh-Mie horizon limb scatter
        float ndv = max(0.0, dot(n, v));
        float fresnel = pow(clamp(1.0 - ndv, 0.0, 1.0), 3.6);
        vec3 limbCol = mix(vec3(0.28, 0.58, 1.0), vec3(1.0, 0.64, 0.34), twilight * 0.84);
        col += limbCol * fresnel * (0.55 + twilight * 0.42);

        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `
  });
  const horizonPlanet = new THREE.Mesh(new THREE.SphereGeometry(HORIZON_R, 72, 48), horizonSurfaceMat);
  horizonPlanet.position.copy(HORIZON_POS);
  horizonGroup.add(horizonPlanet);

  // Soft outer atmospheric limb halo tapering smoothly both inward and outward (no hard shell crease!)
  const outerHaloMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uSunDir: { value: sunDir } },
    vertexShader: `
      varying vec3 vNormalWorld;
      varying vec3 vViewDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uSunDir;
      varying vec3 vNormalWorld;
      varying vec3 vViewDir;
      void main() {
        vec3 n = normalize(vNormalWorld);
        vec3 v = normalize(vViewDir);
        float c = clamp(dot(-n, v), 0.0, 1.0);
        // Zero at extreme outer boundary (c -> 0), rising smoothly toward horizon limb
        float rim = smoothstep(0.02, 0.30, c) * exp(-c * 2.2);
        float ndl = dot(n, normalize(uSunDir));
        float sunset = exp(-pow((ndl + 0.06) * 3.6, 2.0));
        vec3 atmo = mix(vec3(0.24, 0.54, 1.0), vec3(1.0, 0.62, 0.34), sunset * 0.76);
        gl_FragColor = vec4(atmo, rim * 0.58);
        #include <colorspace_fragment>
      }
    `
  });
  const outerHalo = new THREE.Mesh(new THREE.SphereGeometry(56.6, 64, 42), outerHaloMat);
  outerHalo.position.copy(HORIZON_POS);
  horizonGroup.add(outerHalo);

  // =========================================================================
  // 2. OVERLAY SCENE (3D Warp Streaks + Arrival Corona + 20-Layer Cloud Tunnel)
  // =========================================================================
  const overlayScene = new THREE.Scene();
  const overlayCam = new THREE.PerspectiveCamera(44, 1.6, 0.1, 220);

  // 2A. 420 Radial 3D Interstellar Warp Streaks (LineSegments streaming -Z -> +Z)
  const streakCount = 420;
  const stPos = new Float32Array(streakCount * 6);
  const stCol = new Float32Array(streakCount * 6);
  const stData = new Float32Array(streakCount * 4); // seed, speed, isTail (0/1), len
  const warpColors = [0xdbeaff, 0xfff4dd, 0xa8ccff, 0xffd28c];
  for (let i = 0; i < streakCount; i++) {
    const ang = rand() * Math.PI * 2;
    const rad = 1.4 + Math.pow(rand(), 0.72) * 14.2;
    const sx = Math.cos(ang) * rad;
    const sy = Math.sin(ang) * rad * 0.78;
    const sz = -rand() * 140;
    const sLen = 2.6 + rand() * 5.8;
    const sSeed = rand();
    const sSpd = 0.7 + rand() * 0.85;
    stColor(warpColors[i % warpColors.length], 0.55 + rand() * 0.45, i);
    for (let v = 0; v < 2; v++) {
      stPos[i * 6 + v * 3] = sx;
      stPos[i * 6 + v * 3 + 1] = sy;
      stPos[i * 6 + v * 3 + 2] = sz;
      stData[i * 4 + v * 2] = sSeed;
      stData[i * 4 + v * 2 + 1] = v === 0 ? 0.0 : sLen; // tail offset encoded directly per endpoint
    }
  }
  function stColor(hex, lum, idx) {
    sColor.setHex(hex);
    for (let v = 0; v < 2; v++) {
      const fade = v === 0 ? 1.0 : 0.18;
      stCol[idx * 6 + v * 3] = sColor.r * lum * fade;
      stCol[idx * 6 + v * 3 + 1] = sColor.g * lum * fade;
      stCol[idx * 6 + v * 3 + 2] = sColor.b * lum * fade;
    }
  }
  const stPhase = new Float32Array(streakCount * 2);
  const stTail = new Float32Array(streakCount * 2);
  const stSpd = new Float32Array(streakCount * 2);
  for (let i = 0; i < streakCount; i++) {
    const ph = stData[i * 4];
    const tl = stData[i * 4 + 3];
    const sp = 0.72 + ((i * 37) % 100) / 140;
    stPhase[i * 2] = stPhase[i * 2 + 1] = ph;
    stTail[i * 2] = 0.0;
    stTail[i * 2 + 1] = tl;
    stSpd[i * 2] = stSpd[i * 2 + 1] = sp;
  }
  const warpGeo = new THREE.BufferGeometry();
  warpGeo.setAttribute('position', new THREE.BufferAttribute(stPos, 3));
  warpGeo.setAttribute('color', new THREE.BufferAttribute(stCol, 3));
  warpGeo.setAttribute('aPhase', new THREE.BufferAttribute(stPhase, 1));
  warpGeo.setAttribute('aTail', new THREE.BufferAttribute(stTail, 1));
  warpGeo.setAttribute('aSpeed', new THREE.BufferAttribute(stSpd, 1));

  const warpMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    toneMapped: true,
    uniforms: { uFlow: { value: 0 }, uStretch: { value: 0 }, uOpacity: { value: 0 } },
    vertexShader: `
      attribute float aPhase;
      attribute float aTail;
      attribute float aSpeed;
      varying vec3 vColor;
      varying float vAlpha;
      uniform float uFlow;
      uniform float uStretch;
      void main() {
        vColor = color;
        vec3 p = position;
        float span = 146.0;
        float zHead = -mod(uFlow * span * aSpeed + aPhase * span, span) + 6.0;
        // Reverse travel: stream from deep -Z forward past +Z camera
        zHead = mod(uFlow * span * aSpeed + aPhase * span, span) - 140.0;
        float tailShift = -aTail * (0.25 + uStretch * 3.4);
        p.z = zHead + tailShift;
        float edge = smoothstep(-140.0, -95.0, zHead) * smoothstep(6.0, -6.0, zHead);
        vAlpha = edge * (aTail < 0.01 ? 1.0 : 0.14);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      uniform float uOpacity;
      void main() {
        gl_FragColor = vec4(vColor, vAlpha * uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const warpLines = new THREE.LineSegments(warpGeo, warpMat);
  warpLines.frustumCulled = false;
  warpLines.visible = false;
  overlayScene.add(warpLines);

  // 2B. Soft Celestial Arrival Star Corona (Bridges star-core into orbital horizon at p=0.28..0.42)
  const arrivalMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: true,
    uniforms: { uIntensity: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uIntensity;
      void main() {
        vec2 p = vUv - 0.5;
        float d = length(p);
        float core = exp(-d * d * 26.0);
        float bloom = exp(-d * d * 4.8) * 0.65;
        vec3 col = mix(vec3(0.45, 0.72, 1.0), vec3(1.0, 0.94, 0.80), clamp(core * 1.4, 0.0, 1.0));
        gl_FragColor = vec4(col, (core + bloom) * uIntensity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const arrivalQuad = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), arrivalMat);
  arrivalQuad.position.set(0, 0, -8);
  arrivalQuad.visible = false;
  overlayScene.add(arrivalQuad);

  // 2C. 20-Layer 3D Volumetric Backlit Cloud Tunnel (True Multi-Plane Perspective Parallax!)
  const cloudGroup = new THREE.Group();
  cloudGroup.visible = false;
  overlayScene.add(cloudGroup);

  const cloudVert = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const cloudFrag = `
    uniform float uTime;
    uniform float uSeed;
    uniform float uLayerT;
    uniform float uOpacity;
    uniform float uHole;
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
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.50;
      for (int i = 0; i < 4; i++) {
        v += a * n2(p);
        p = p * 2.12 + vec2(1.7, -1.3);
        a *= 0.50;
      }
      return v;
    }

    void main() {
      if (uOpacity <= 0.002) discard;
      vec2 centered = vUv - 0.5;
      vec2 uv = centered * (4.8 + uLayerT * 1.4) + vec2(uSeed * 3.1 + uTime * 0.035, uSeed * 1.7);
      float f = fbm(uv) * 0.72 + fbm(uv * 2.4 - vec2(uTime * 0.04, 0.0)) * 0.28;

      // Hard box-edge safeguard so rotated quad corners NEVER clip visibly regardless of negative FBM displacement!
      float boxClamp = smoothstep(0.49, 0.34, max(abs(centered.x), abs(centered.y)));
      float radial = length(centered * vec2(1.05, 1.0)) + (0.48 - f) * 0.38;
      float outerMask = smoothstep(0.45, 0.14, radial) * boxClamp;
      if (outerMask <= 0.002) discard;

      // High-contrast backlit cumulus rim vs shadowed indigo belly
      float sunBias = clamp(0.55 - centered.x * 0.70 + centered.y * 0.70, 0.0, 1.0);
      float rim = fbm(uv + vec2(-0.14, 0.12));
      float litEdge = clamp((f - rim) * 8.2 + 0.36 + sunBias * 0.45, 0.0, 1.0);

      // Part center opening gracefully once descending below mid-cloud deck
      float holeMask = uHole <= 0.001
        ? 1.0
        : smoothstep(uHole - 0.08, uHole + 0.12, radial);

      float density = smoothstep(0.32, 0.56, f) * outerMask * holeMask;
      if (density <= 0.005) discard;

      // Rich twilight palette: Dusk Indigo-Plum bellies -> Early Apricot & Molten Sunset-Gold crests
      vec3 shadUpper = vec3(0.08, 0.13, 0.32);
      vec3 shadMid   = vec3(0.28, 0.13, 0.32);
      vec3 shadLow   = vec3(0.52, 0.24, 0.22);
      vec3 shadowCol = mix(shadUpper, shadMid, smoothstep(0.0, 0.42, uLayerT));
      shadowCol = mix(shadowCol, shadLow, smoothstep(0.42, 0.88, uLayerT));

      vec3 rimUpper = vec3(0.84, 0.90, 1.00);
      vec3 rimMid   = vec3(1.00, 0.66, 0.34);
      vec3 rimLow   = vec3(1.00, 0.90, 0.58);
      vec3 highlightCol = mix(rimUpper, rimMid, smoothstep(0.0, 0.36, uLayerT));
      highlightCol = mix(highlightCol, rimLow, smoothstep(0.40, 0.85, uLayerT));

      vec3 col = mix(shadowCol, highlightCol, smoothstep(0.16, 0.72, litEdge));
      gl_FragColor = vec4(col, clamp(density * uOpacity, 0.0, 0.96));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `;

  const cloudGeo = new THREE.PlaneGeometry(16, 12);
  const cloudLayers = [];
  for (let i = 0; i < 20; i++) {
    const t = i / 19;
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      toneMapped: true,
      uniforms: {
        uTime: { value: 0 },
        uSeed: { value: 1.37 + i * 2.41 },
        uLayerT: { value: t },
        uOpacity: { value: 0 },
        uHole: { value: 0 }
      },
      vertexShader: cloudVert,
      fragmentShader: cloudFrag
    });
    const mesh = new THREE.Mesh(cloudGeo, mat);
    const angle = i * 2.39996;
    const isCoreCover = i >= 6 && i <= 12;
    const bankR = isCoreCover ? (0.4 + (i % 3) * 0.75) : (2.8 + (i % 4) * 1.15);
    const ox = Math.cos(angle) * bankR;
    const oy = Math.sin(angle) * (bankR * 0.65);
    mesh.rotation.z = ((i % 2 === 0 ? 1 : -1) * 0.20) + (rand() - 0.5) * 0.26;
    cloudGroup.add(mesh);
    cloudLayers.push({ mesh, mat, t, ox, oy });
  }

  function setAspect(aspect) {
    overlayCam.aspect = Math.max(0.25, aspect);
    overlayCam.updateProjectionMatrix();
  }

  function smoothstep(e0, e1, x) {
    const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  }

  function update(diveP, elapsed, mainCam, isRise = false) {
    osMat.uniforms.uTime.value = elapsed;
    horizonSurfaceMat.uniforms.uTime.value = elapsed;

    if (mainCam && Math.abs(overlayCam.fov - mainCam.fov) > 0.01) {
      overlayCam.fov = mainCam.fov;
      overlayCam.aspect = mainCam.aspect;
      overlayCam.updateProjectionMatrix();
    }

    // Interstellar Warp Streaks (active p in [0.02, 0.41])
    const warpEnv = smoothstep(0.02, 0.16, diveP) * (1.0 - smoothstep(0.32, 0.42, diveP));
    warpLines.visible = warpEnv > 0.005;
    if (warpLines.visible) {
      const flowDir = isRise ? 1.0 - diveP : diveP;
      warpMat.uniforms.uFlow.value = flowDir * 1.45 + elapsed * 0.08;
      warpMat.uniforms.uStretch.value = warpEnv;
      warpMat.uniforms.uOpacity.value = warpEnv * 0.88;
    }

    // Arrival Star Corona bridge (peaks smoothly right around galaxy -> horizon swap p = 0.35)
    const arrivalEnv = Math.exp(-Math.pow((diveP - 0.35) / 0.055, 2.0));
    arrivalQuad.visible = arrivalEnv > 0.01;
    if (arrivalQuad.visible) {
      arrivalMat.uniforms.uIntensity.value = arrivalEnv * 0.76;
    }

    // 20-Layer 3D Cloud Tunnel (active p in [0.56, 0.995])
    const cloudMaster = smoothstep(0.56, 0.64, diveP) * (1.0 - smoothstep(0.91, 0.995, diveP));
    cloudGroup.visible = cloudMaster > 0.005;
    if (cloudGroup.visible) {
      const norm = Math.max(0, Math.min(1, (diveP - 0.58) / 0.38));
      const hole = smoothstep(0.77, 0.92, diveP) * 0.34;
      const centerVeilBoost = Math.exp(-Math.pow((diveP - 0.76) / 0.055, 2.0));
      for (const layer of cloudLayers) {
        const z = -4.0 - layer.t * 32.0 + norm * 32.0;
        const depthFade = smoothstep(1.2, -3.2, z) * smoothstep(-38.0, -22.0, z);
        const layerOp = Math.min(0.94, cloudMaster * depthFade * (0.76 + centerVeilBoost * 0.24));
        layer.mesh.visible = layerOp > 0.006;
        if (!layer.mesh.visible) continue;
        const lateralPart = smoothstep(0.78, 0.96, diveP) * (0.28 + layer.t * 0.38);
        layer.mesh.position.set(layer.ox * (1.0 + lateralPart), layer.oy * (1.0 + lateralPart * 0.55), z);
        layer.mat.uniforms.uTime.value = elapsed;
        layer.mat.uniforms.uOpacity.value = layerOp;
        layer.mat.uniforms.uHole.value = hole * (0.35 + 0.65 * layer.t);
      }
    }
  }

  function renderOverlay(renderer) {
    if (!warpLines.visible && !arrivalQuad.visible && !cloudGroup.visible) return;
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(overlayScene, overlayCam);
    renderer.autoClear = true;
  }

  return {
    horizonGroup,
    setAspect,
    update,
    renderOverlay
  };
}

/**
 * Dual-Pass Real Doorway Frame-Wipe Composite:
 * Captures the sunlit cottage porch & 85° open door into an HDR render target,
 * then cuts open ONLY the exact projected doorframe rectangle over Act III.
 */
export function createDoorPortalPass() {
  let portalRT = new THREE.WebGLRenderTarget(1440, 900, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true
  });

  const portalScene = new THREE.Scene();
  const portalCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const doorWipeMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    toneMapped: true,
    uniforms: {
      tDoorway: { value: portalRT.texture },
      uRect: { value: new THREE.Vector4(0.35, 0.25, 0.65, 0.78) },
      uOpen: { value: 0 },
      uFadeOut: { value: 1 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDoorway;
      uniform vec4 uRect; // xMin, yMin, xMax, yMax in screen UV [0..1]
      uniform float uOpen;
      uniform float uFadeOut;
      varying vec2 vUv;

      void main() {
        vec4 src = texture2D(tDoorway, vUv);
        vec2 center = 0.5 * (uRect.xy + uRect.zw);
        vec2 halfSz = max(vec2(0.01), 0.5 * (uRect.zw - uRect.xy));
        vec2 q = abs(vUv - center) - halfSz;
        float sdf = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);

        // Inside doorway opening (sdf < 0) fades smoothly transparent -> exposes live Act III room!
        float inside = 1.0 - smoothstep(-0.003, 0.002, sdf);
        float alpha = mix(1.0, 1.0 - uOpen, inside) * uFadeOut;
        if (alpha <= 0.002) discard;

        // Delicate warm doorway threshold rim
        float rim = exp(-abs(sdf) * 140.0) * 0.06 * uOpen * uFadeOut;
        vec3 col = src.rgb + vec3(1.0, 0.82, 0.48) * rim;

        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), doorWipeMat);
  portalScene.add(quad);

  function resize(pixelW, pixelH) {
    const w = Math.max(2, Math.floor(pixelW));
    const h = Math.max(2, Math.floor(pixelH));
    if (portalRT.width !== w || portalRT.height !== h) {
      portalRT.setSize(w, h);
    }
  }

  function setPortalRect(uMin, vMin, uMax, vMax) {
    doorWipeMat.uniforms.uRect.value.set(uMin, vMin, uMax, vMax);
  }

  function setMix(open, fadeOut) {
    doorWipeMat.uniforms.uOpen.value = open;
    doorWipeMat.uniforms.uFadeOut.value = fadeOut;
  }

  function renderComposite(renderer) {
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(portalScene, portalCam);
    renderer.autoClear = true;
  }

  return {
    get captureTarget() { return portalRT; },
    resize,
    setPortalRect,
    setMix,
    renderComposite
  };
}
