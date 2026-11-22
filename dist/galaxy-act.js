import * as THREE from './vendor/three/three.module.js';

/**
 * Act I: Upgraded Dual-Arm Spiral Galaxy (26,000 stars + 360° celestial deep field + soft nebula gas)
 * + Real Atmospheric Celestial Planet 「清舟星」 (oceans, sunflower plains, volumetric cloud shell,
 *   Rayleigh/Fresnel atmospheric rim halo, subtle brass orbital beacon — NO house or grass glued to a sphere!)
 * + Fullscreen GLSL Volumetric Cloud-Break Dive Transition (`createCloudDiveScene`).
 */
export const PLANET_POS = new THREE.Vector3(5.6, 0.45, 2.8);
export const PLANET_RADIUS = 1.28;

export function buildGalaxyAct(dpr = 1) {
  const group = new THREE.Group();
  group.name = 'QZ_Act1_Spiral_Galaxy';

  const galaxyDisk = new THREE.Group();
  galaxyDisk.name = 'Spiral_Galaxy_Disk';
  // Gentle cinematic tilt so the spiral arms read with dramatic perspective depth
  galaxyDisk.rotation.set(0.14, 0.0, -0.09);
  group.add(galaxyDisk);

  // -------------------------------------------------------------------------
  // 1. 26,000-Star Dual-Arm Spiral Milky Way (upgraded from original galaxy3d.js)
  // -------------------------------------------------------------------------
  const count = 26000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const sizes = new Float32Array(count);
  const color = new THREE.Color();

  let seed = 57121;
  const rand = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const normal = () => rand() + rand() + rand() + rand() - 2.0;
  const stellarColors = [0xb2d0ff, 0xe2ebff, 0xfff1d6, 0xffd296, 0xf2b4b0];

  for (let i = 0; i < count; i++) {
    let x, y, z, radius, armStar = false;
    const choice = rand();
    if (choice < 0.27) {
      const bulge = choice < 0.14;
      x = normal() * (bulge ? 0.95 : 2.15);
      z = normal() * (bulge ? 0.78 : 0.62);
      y = normal() * (bulge ? 0.56 : 0.28);
    } else if (choice < 0.50) {
      radius = Math.min(13.2, Math.sqrt(rand()) * 13.2);
      const a = rand() * Math.PI * 2;
      x = Math.cos(a) * radius;
      z = Math.sin(a) * radius;
      y = normal() * (0.14 + radius * 0.02);
    } else {
      armStar = true;
      const arm = i % 2;
      radius = 1.65 + Math.pow(rand(), 0.86) * 11.4;
      let theta = arm * Math.PI + 0.44 + 1.38 * Math.log(radius / 1.65);
      theta += 0.11 * Math.sin(radius * 1.05 + arm * 1.8) + (rand() < 0.24 ? (radius - 1.65) * 0.044 : 0);
      const spread = normal() * (0.14 + 0.042 * radius);
      const rr = radius + normal() * (0.20 + 0.068 * radius);
      x = Math.cos(theta + spread) * rr;
      z = Math.sin(theta + spread) * rr;
      y = normal() * (0.12 + radius * 0.018);
    }
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    let tone;
    if (choice < 0.27) tone = rand() < 0.72 ? 3 : 2;
    else if (armStar) tone = rand() < 0.48 ? 0 : (rand() < 0.42 ? 1 : 2);
    else tone = rand() < 0.62 ? 2 : 3;
    if (rand() < 0.045) tone = 4; // subtle rose H-II regions

    color.setHex(stellarColors[tone]);
    const lum = 0.28 + Math.pow(rand(), 1.15) * 0.68;
    colors[i * 3] = color.r * lum;
    colors[i * 3 + 1] = color.g * lum;
    colors[i * 3 + 2] = color.b * lum;
    phases[i] = rand() * Math.PI * 2;
    sizes[i] = rand() < 0.04 ? (1.45 + rand() * 0.85) : (0.68 + rand() * 0.65);
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  starGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

  const starsMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: { uScale: { value: dpr }, uTime: { value: 0 } },
    vertexShader: `
      attribute float aPhase;
      attribute float aSize;
      varying vec3 vColor;
      varying float vTw;
      uniform float uScale;
      uniform float uTime;
      void main() {
        vColor = color;
        vTw = 0.84 + 0.16 * sin(uTime * 1.45 + aPhase * 3.1);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(24.0 * aSize * uScale / max(1.5, -mv.z), 1.0, 4.2);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vTw;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float core = exp(-d * d * 24.0);
        float halo = (1.0 - smoothstep(0.06, 0.5, d)) * 0.42;
        gl_FragColor = vec4(vColor, (core * 0.85 + halo) * vTw);
        #include <colorspace_fragment>
      }
    `
  });
  galaxyDisk.add(new THREE.Points(starGeo, starsMat));

  // -------------------------------------------------------------------------
  // 2. Soft Luminous Galactic Dust & Nebula Gas Clouds along the Spiral Arms
  // -------------------------------------------------------------------------
  const cloudCount = 1900;
  const cPos = new Float32Array(cloudCount * 3);
  const cCol = new Float32Array(cloudCount * 3);
  for (let i = 0; i < cloudCount; i++) {
    const src = (Math.floor((i + 0.37) * count / cloudCount) % count) * 3;
    cPos.set(positions.subarray(src, src + 3), i * 3);
    const kind = i % 7;
    if (kind === 0) cCol.set([0.26, 0.14, 0.10], i * 3);       // warm gold-amber core nebula
    else if (kind === 1) cCol.set([0.19, 0.10, 0.24], i * 3);  // violet-plum twilight nebula
    else cCol.set([0.07, 0.15, 0.28], i * 3);                  // sapphire spiral arm nebula
  }
  const cloudGeo = new THREE.BufferGeometry();
  cloudGeo.setAttribute('position', new THREE.BufferAttribute(cPos, 3));
  cloudGeo.setAttribute('color', new THREE.BufferAttribute(cCol, 3));
  const cloudMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: { uScale: { value: dpr } },
    vertexShader: `
      varying vec3 vColor;
      uniform float uScale;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(280.0 * uScale / max(2.0, -mv.z), 3.0, 52.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float a = pow(max(0.0, 1.0 - d * 2.0), 2.2) * 0.16;
        gl_FragColor = vec4(vColor, a);
        #include <colorspace_fragment>
      }
    `
  });
  galaxyDisk.add(new THREE.Points(cloudGeo, cloudMat));

  // Restrained, refined galactic core glow (no gaudy cross-star lens flare!)
  const coreCvs = document.createElement('canvas');
  coreCvs.width = coreCvs.height = 128;
  const cctx = coreCvs.getContext('2d');
  const cg = cctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  cg.addColorStop(0.0, 'rgba(255, 246, 218, 0.92)');
  cg.addColorStop(0.16, 'rgba(255, 218, 152, 0.56)');
  cg.addColorStop(0.45, 'rgba(210, 165, 118, 0.16)');
  cg.addColorStop(1.0, 'rgba(180, 140, 100, 0.0)');
  cctx.fillStyle = cg;
  cctx.fillRect(0, 0, 128, 128);
  const coreTex = new THREE.CanvasTexture(coreCvs);
  const coreSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: coreTex,
      color: 0xffe2b0,
      transparent: true,
      opacity: 0.44,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  coreSprite.scale.set(4.6, 4.6, 1);
  galaxyDisk.add(coreSprite);

  // -------------------------------------------------------------------------
  // 3. 360° Deep-Space Celestial Sphere & 3D Galactic Halo (4,600 stars)
  // -------------------------------------------------------------------------
  const deepCount = 4600;
  const dPos = new Float32Array(deepCount * 3);
  const dCol = new Float32Array(deepCount * 3);
  const dSz = new Float32Array(deepCount);
  const dPh = new Float32Array(deepCount);
  const hPalette = [0xd6e8ff, 0xfff3de, 0xaecfff, 0xffdca8, 0xe2d4ff];
  for (let i = 0; i < deepCount; i++) {
    const u = rand() * 2 - 1;
    const phi = rand() * Math.PI * 2;
    const s = Math.sqrt(Math.max(0, 1 - u * u));
    const r = 18 + Math.pow(rand(), 0.56) * 86;
    dPos[i * 3] = r * s * Math.cos(phi);
    dPos[i * 3 + 1] = r * u * 0.88;
    dPos[i * 3 + 2] = r * s * Math.sin(phi);
    const bright = i % 19 === 0;
    dSz[i] = bright ? (1.45 + rand() * 0.95) : (0.62 + rand() * 0.82);
    color.setHex(hPalette[(i * 3) % hPalette.length]);
    const lum = bright ? (0.58 + rand() * 0.36) : (0.20 + rand() * 0.36);
    dCol[i * 3] = color.r * lum;
    dCol[i * 3 + 1] = color.g * lum;
    dCol[i * 3 + 2] = color.b * lum;
    dPh[i] = rand() * Math.PI * 2;
  }
  const deepGeo = new THREE.BufferGeometry();
  deepGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  deepGeo.setAttribute('color', new THREE.BufferAttribute(dCol, 3));
  deepGeo.setAttribute('aSize', new THREE.BufferAttribute(dSz, 1));
  deepGeo.setAttribute('aPhase', new THREE.BufferAttribute(dPh, 1));
  const deepMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: { uScale: { value: dpr }, uTime: { value: 0 } },
    vertexShader: `
      attribute float aSize;
      attribute float aPhase;
      varying vec3 vColor;
      varying float vTw;
      uniform float uScale;
      uniform float uTime;
      void main() {
        vColor = color;
        vTw = 0.80 + 0.20 * sin(uTime * 1.85 + aPhase * 4.2);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(28.0 * aSize * uScale / max(2.0, -mv.z), 1.0, 4.4);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vTw;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float core = exp(-d * d * 20.0);
        float halo = pow(max(0.0, 1.0 - d * 2.0), 2.2) * 0.34;
        gl_FragColor = vec4(vColor, (core * 0.82 + halo) * vTw);
        #include <colorspace_fragment>
      }
    `
  });
  group.add(new THREE.Points(deepGeo, deepMat));

  // -------------------------------------------------------------------------
  // 4. REAL ATMOSPHERIC CELESTIAL PLANET 「清舟星」 (Seated gracefully on an outer spiral arm!)
  // -------------------------------------------------------------------------
  const planetGroup = new THREE.Group();
  planetGroup.name = 'Qingzhou_Planet';
  planetGroup.position.copy(PLANET_POS);
  group.add(planetGroup);

  const sunDir = new THREE.Vector3(-0.78, 0.36, 0.52).normalize();

  // 4A. Planet Surface Shader (deep indigo-sapphire oceans, ochre/sunflower plains, sunset terminator, tiny night lantern embers!)
  const surfaceMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: sunDir },
      uHover: { value: 0 }
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
      uniform float uHover;
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
          p = p * 2.08 + vec3(1.7, -2.3, 0.9);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 n = normalize(vNormalWorld);
        vec3 v = normalize(vViewDir);
        float ndl = dot(n, normalize(uSunDir));
        float day = smoothstep(-0.18, 0.45, ndl);
        float twilight = exp(-pow((ndl + 0.02) * 5.2, 2.0));

        // Continents & sunflower-gold highlands vs sapphire oceans
        float cont = fbm(vPosLocal * 2.4 + vec3(0.4, -0.2, 1.1));
        float detail = fbm(vPosLocal * 6.2);
        float isLand = smoothstep(0.49, 0.57, cont + (detail - 0.5) * 0.12);

        vec3 oceanDeep = vec3(0.05, 0.13, 0.28);
        vec3 oceanShallow = vec3(0.09, 0.29, 0.42);
        vec3 oceanCol = mix(oceanDeep, oceanShallow, smoothstep(0.32, 0.50, cont));

        vec3 plainsGold = vec3(0.74, 0.55, 0.25); // hint of golden sunflower plains!
        vec3 meadowJade = vec3(0.24, 0.40, 0.28);
        vec3 peakWarm   = vec3(0.84, 0.72, 0.52);
        vec3 landCol = mix(meadowJade, plainsGold, smoothstep(0.52, 0.72, cont + detail * 0.2));
        landCol = mix(landCol, peakWarm, smoothstep(0.76, 0.90, cont + detail * 0.22));

        // Subtle polar twilight frost
        float polar = smoothstep(0.78, 0.95, abs(vPosLocal.y));
        vec3 surface = mix(oceanCol, landCol, isLand);
        surface = mix(surface, vec3(0.72, 0.82, 0.92), polar * 0.55);

        // Specular sun glint on ocean
        vec3 h = normalize(normalize(uSunDir) + v);
        float spec = pow(max(0.0, dot(n, h)), 36.0) * (1.0 - isLand) * day * 0.48;

        // Night-side dark indigo + warm twilight sunset band along the terminator!
        vec3 nightCol = surface * vec3(0.06, 0.08, 0.16);
        vec3 dayCol = surface * (0.28 + 0.92 * day) + vec3(1.0, 0.85, 0.62) * spec;
        vec3 col = mix(nightCol, dayCol, day);
        col += vec3(0.96, 0.46, 0.28) * twilight * 0.36;

        // Tiny warm lantern ember specks on the night-side land (curiosity cottage lights!)
        float ember = smoothstep(0.84, 0.95, n3(vPosLocal * 22.0)) * isLand * (1.0 - day) * 0.75;
        col += vec3(1.0, 0.76, 0.38) * ember;

        // Subtle inner atmospheric Fresnel scatter (sky-blue on day side, golden-violet on twilight rim)
        float fresnel = pow(clamp(1.0 - max(0.0, dot(n, v)), 0.0, 1.0), 2.8);
        vec3 atmoTint = mix(vec3(0.36, 0.56, 0.98), vec3(1.0, 0.68, 0.38), twilight * 0.75 + uHover * 0.25);
        col += atmoTint * fresnel * (0.48 + 0.42 * day + uHover * 0.25);

        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `
  });
  const planetMesh = new THREE.Mesh(new THREE.SphereGeometry(PLANET_RADIUS, 48, 36), surfaceMat);
  planetMesh.name = 'Qingzhou_Planet_Core';
  planetGroup.add(planetMesh);

  // 4B. Independent Rotating Volumetric Cloud Shell (catches golden sunset rim light!)
  const cloudShellMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
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
      void main() {
        vec3 p = vPosLocal * 3.4 + vec3(uTime * 0.04, 0.0, -uTime * 0.02);
        float c = n3(p) * 0.58 + n3(p * 2.2 + vec3(3.1, -1.4, 2.2)) * 0.42;
        float wisps = smoothstep(0.52, 0.80, c);
        if (wisps < 0.01) discard;

        vec3 n = normalize(vNormalWorld);
        float ndl = dot(n, normalize(uSunDir));
        float day = smoothstep(-0.22, 0.45, ndl);
        float sunset = exp(-pow((ndl + 0.04) * 5.0, 2.0));

        vec3 cloudDay = vec3(0.95, 0.96, 1.0);
        vec3 cloudNight = vec3(0.14, 0.18, 0.30);
        vec3 col = mix(cloudNight, cloudDay, day);
        col = mix(col, vec3(1.0, 0.72, 0.46), sunset * 0.72);
        gl_FragColor = vec4(col, wisps * (0.28 + 0.42 * day + sunset * 0.25));
        #include <colorspace_fragment>
      }
    `
  });
  const cloudShell = new THREE.Mesh(new THREE.SphereGeometry(PLANET_RADIUS * 1.036, 40, 28), cloudShellMat);
  planetGroup.add(cloudShell);

  // 4C. Outer Rayleigh / Fresnel Atmospheric Halo Shell (luminous sapphire-violet-gold atmosphere!)
  const haloMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uSunDir: { value: sunDir },
      uHover: { value: 0 }
    },
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
      uniform float uHover;
      varying vec3 vNormalWorld;
      varying vec3 vViewDir;
      void main() {
        vec3 n = normalize(vNormalWorld);
        vec3 v = normalize(vViewDir);
        float rim = pow(clamp(0.68 - dot(-n, v), 0.0, 1.0), 2.5);
        float ndl = dot(n, normalize(uSunDir));
        float sunSide = smoothstep(-0.4, 0.65, ndl);
        float sunsetBand = exp(-pow(ndl * 3.8, 2.0));
        vec3 atmo = mix(vec3(0.28, 0.56, 1.0), vec3(1.0, 0.68, 0.38), sunsetBand * 0.65 + uHover * 0.25);
        float alpha = rim * (0.42 + 0.58 * sunSide + uHover * 0.35);
        gl_FragColor = vec4(atmo, alpha);
        #include <colorspace_fragment>
      }
    `
  });
  const haloMesh = new THREE.Mesh(new THREE.SphereGeometry(PLANET_RADIUS * 1.18, 40, 28), haloMat);
  planetGroup.add(haloMesh);

  // 4D. Delicate Brass-Starlight Orbital Beacon Ring (gives clear visual affordance to click & descend!)
  const ringGeo = new THREE.RingGeometry(PLANET_RADIUS * 1.44, PLANET_RADIUS * 1.50, 96);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uHover: { value: 0 } },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uHover;
      varying vec3 vPos;
      void main() {
        float ang = atan(vPos.z, vPos.x);
        float pulse = 0.55 + 0.45 * sin(ang * 2.0 - uTime * 1.4);
        vec3 col = mix(vec3(0.84, 0.72, 0.48), vec3(1.0, 0.88, 0.58), uHover);
        gl_FragColor = vec4(col, (0.28 + 0.34 * pulse + uHover * 0.28));
        #include <colorspace_fragment>
      }
    `
  });
  const beaconRing = new THREE.Mesh(ringGeo, ringMat);
  beaconRing.rotation.set(0.36, 0.15, -0.24);
  planetGroup.add(beaconRing);

  // Generous invisible click hitbox over the atmospheric planet
  const planetHit = new THREE.Mesh(
    new THREE.SphereGeometry(PLANET_RADIUS * 1.55, 16, 12),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  );
  planetHit.name = 'HitProxy_Qingzhou_Planet';
  planetHit.userData.__qzInteractiveName = 'Qingzhou_Planet';
  planetGroup.add(planetHit);

  let hoverLerp = 0;
  function update(elapsed, dt, isPlanetHovered, prefersReducedMotion) {
    starsMat.uniforms.uTime.value = elapsed;
    deepMat.uniforms.uTime.value = elapsed;
    surfaceMat.uniforms.uTime.value = elapsed;
    cloudShellMat.uniforms.uTime.value = elapsed;
    ringMat.uniforms.uTime.value = elapsed;

    hoverLerp += ((isPlanetHovered ? 1 : 0) - hoverLerp) * Math.min(1, dt * 7);
    surfaceMat.uniforms.uHover.value = hoverLerp;
    haloMat.uniforms.uHover.value = hoverLerp;
    ringMat.uniforms.uHover.value = hoverLerp;

    if (!prefersReducedMotion) {
      galaxyDisk.rotation.y = elapsed * 0.018;
      planetMesh.rotation.y = elapsed * 0.085;
      cloudShell.rotation.y = elapsed * 0.125;
      beaconRing.rotation.y = -elapsed * 0.14;
    }
  }

  return {
    group,
    planetGroup,
    hitTargets: [planetHit],
    update
  };
}

/**
 * Fullscreen GLSL Volumetric Cloud-Break Dive Transition Overlay!
 * Renders seamlessly over the WebGL canvas during Act I <-> Act II transitions:
 * Space Indigo -> Twilight Violet -> Molten Sunset Gold clouds rushing past and parting open.
 */
export function createCloudDiveScene() {
  const cloudScene = new THREE.Scene();
  const cloudCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const cloudMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uProgress: { value: 0 }, // 0 = hidden, 0.5 = dense cloud-break climax, 1 = parted open
      uTime: { value: 0 },
      uAspect: { value: 1.6 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uProgress;
      uniform float uTime;
      uniform float uAspect;
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
        float a = 0.52;
        for (int i = 0; i < 4; i++) {
          v += a * n2(p);
          p = p * 2.05 + vec2(1.7, -1.2);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        float p = clamp(uProgress, 0.0, 1.0);
        if (p <= 0.002 || p >= 0.998) discard;

        // Radial zoom & cloud parting coordinates from lens center
        vec2 uv = (vUv - 0.5) * vec2(uAspect, 1.0);
        float r = length(uv);
        float ang = atan(uv.y, uv.x);

        // Two rushing cloud strata zooming outward as we dive through the atmosphere
        float zoomA = exp(-p * 1.45);
        float zoomB = exp(-p * 2.10);
        vec2 cUvA = uv * (2.6 * zoomA) + vec2(cos(ang), sin(ang)) * p * 0.45 + vec2(uTime * 0.08, -p * 0.6);
        vec2 cUvB = uv * (4.4 * zoomB) - vec2(uTime * 0.06, p * 1.1);
        float cloud = fbm(cUvA) * 0.62 + fbm(cUvB) * 0.38;

        // Envelope peaks smoothly around p=0.48..0.55 and parts radially from center on exit!
        float enterEnv = smoothstep(0.0, 0.44, p);
        float exitPart = smoothstep(0.56, 0.98, p);
        float centerOpening = smoothstep(exitPart * 0.88 - 0.18, exitPart * 0.88 + 0.34, r + (cloud - 0.5) * 0.42);
        float density = enterEnv * centerOpening * smoothstep(0.24, 0.82, cloud + enterEnv * 0.32);

        // Color journey: Deep Atmospheric Azure -> Twilight Violet-Plum -> Molten Sunset Gold!
        vec3 colSpace  = vec3(0.16, 0.32, 0.62);
        vec3 colViolet = vec3(0.46, 0.24, 0.46);
        vec3 colSunset = vec3(1.00, 0.72, 0.38);
        vec3 colCream  = vec3(1.00, 0.92, 0.72);

        vec3 tint = mix(colSpace, colViolet, smoothstep(0.10, 0.52, p));
        tint = mix(tint, colSunset, smoothstep(0.42, 0.82, p));
        tint = mix(tint, colCream, smoothstep(0.55, 0.92, cloud) * smoothstep(0.35, 0.85, p) * 0.65);

        float alpha = clamp(density * (1.0 - smoothstep(0.86, 1.0, p)), 0.0, 0.98);
        gl_FragColor = vec4(tint, alpha);
        #include <colorspace_fragment>
      }
    `
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), cloudMat);
  cloudScene.add(quad);

  return {
    cloudScene,
    cloudCam,
    cloudMat,
    setAspect(a) {
      cloudMat.uniforms.uAspect.value = a;
    },
    update(progress, elapsed) {
      cloudMat.uniforms.uProgress.value = progress;
      cloudMat.uniforms.uTime.value = elapsed;
    }
  };
}
