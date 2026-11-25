import * as THREE from './vendor/three/three.module.js';

/**
 * Act I: Pure Dual-Arm Spiral Galaxy (26,000 stars + 360° celestial deep field + soft nebula gas)
 * + Delicate Breathing Outer-Arm Star Beacon 「清舟星」 (NO giant disproportionate planet beside the galaxy!).
 */

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
  // 4. DELICATE BREATHING OUTER-ARM STAR BEACON 「清舟星」 (True Cosmic Scale!)
  // -------------------------------------------------------------------------
  const beaconR = 4.9;
  const beaconTheta = Math.PI + 0.44 + 1.38 * Math.log(beaconR / 1.65);
  const starBeaconGroup = new THREE.Group();
  starBeaconGroup.name = 'Qingzhou_Star_Beacon';
  starBeaconGroup.position.set(
    Math.cos(beaconTheta) * beaconR,
    0.14,
    Math.sin(beaconTheta) * beaconR
  );
  galaxyDisk.add(starBeaconGroup);

  // 45 tiny warm golden-amber companion cluster stars nestled along the spiral arm
  const clCount = 45;
  const clPos = new Float32Array(clCount * 3);
  const clCol = new Float32Array(clCount * 3);
  const clSz = new Float32Array(clCount);
  const clPh = new Float32Array(clCount);
  const clPalette = [0xfff2cf, 0xffd788, 0xcbe2ff, 0xffe4aa];
  for (let i = 0; i < clCount; i++) {
    const u = rand() * 2 - 1;
    const phi = rand() * Math.PI * 2;
    const rr = 0.14 + Math.pow(rand(), 0.72) * 0.86;
    const s = Math.sqrt(Math.max(0, 1 - u * u));
    clPos[i * 3] = rr * s * Math.cos(phi);
    clPos[i * 3 + 1] = rr * u * 0.42;
    clPos[i * 3 + 2] = rr * s * Math.sin(phi);
    color.setHex(clPalette[i % clPalette.length]);
    const lum = 0.45 + rand() * 0.55;
    clCol[i * 3] = color.r * lum;
    clCol[i * 3 + 1] = color.g * lum;
    clCol[i * 3 + 2] = color.b * lum;
    clSz[i] = 0.75 + rand() * 0.75;
    clPh[i] = rand() * Math.PI * 2;
  }
  const clGeo = new THREE.BufferGeometry();
  clGeo.setAttribute('position', new THREE.BufferAttribute(clPos, 3));
  clGeo.setAttribute('color', new THREE.BufferAttribute(clCol, 3));
  clGeo.setAttribute('aSize', new THREE.BufferAttribute(clSz, 1));
  clGeo.setAttribute('aPhase', new THREE.BufferAttribute(clPh, 1));
  const clMat = new THREE.ShaderMaterial({
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
        vTw = 0.75 + 0.25 * sin(uTime * 2.2 + aPhase * 3.1);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(24.0 * aSize * uScale / max(1.4, -mv.z), 1.0, 4.2);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vTw;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float core = exp(-d * d * 28.0);
        gl_FragColor = vec4(vColor, core * vTw);
        #include <colorspace_fragment>
      }
    `
  });
  starBeaconGroup.add(new THREE.Points(clGeo, clMat));

  // Breathing Warm Ivory-Gold Star Core (Billboarded, restrained diamond glint!)
  const starCoreMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uHover: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uHover;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv - 0.5;
        float d = length(p);
        if (d > 0.5) discard;

        float breath = 0.86 + 0.14 * sin(uTime * 2.4);
        float edgeFade = 1.0 - smoothstep(0.18, 0.50, d);
        float core = exp(-d * d * 110.0);
        float halo = exp(-d * d * 24.0) * (0.52 + uHover * 0.28) * edgeFade;
        float spikes = (exp(-abs(p.x) * 48.0) * exp(-abs(p.y) * 11.0)
                      + exp(-abs(p.y) * 48.0) * exp(-abs(p.x) * 11.0)) * 0.14 * edgeFade;

        vec3 col = mix(vec3(1.0, 0.78, 0.36), vec3(1.0, 0.98, 0.90), clamp(core * 1.35 + spikes, 0.0, 1.0));
        float alpha = clamp((core * 1.15 + halo + spikes) * breath * (1.0 + uHover * 0.25), 0.0, 1.0);
        gl_FragColor = vec4(col, alpha);
        #include <colorspace_fragment>
      }
    `
  });
  const starCoreMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 2.15), starCoreMat);
  starBeaconGroup.add(starCoreMesh);

  // Subtle Champagne-Gold Astrolabe Pulse Ring & Expanding Ripple in Galactic Plane
  const astroRingGeo = new THREE.RingGeometry(0.42, 0.46, 64);
  astroRingGeo.rotateX(-Math.PI / 2);
  const astroRingMat = new THREE.ShaderMaterial({
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
        float a = atan(vPos.z, vPos.x);
        float pulse = 0.55 + 0.45 * sin(a * 2.0 - uTime * 1.8);
        vec3 col = mix(vec3(0.92, 0.78, 0.48), vec3(1.0, 0.92, 0.68), uHover);
        gl_FragColor = vec4(col, (0.20 + 0.24 * pulse + uHover * 0.30));
        #include <colorspace_fragment>
      }
    `
  });
  const astroRing = new THREE.Mesh(astroRingGeo, astroRingMat);
  starBeaconGroup.add(astroRing);

  const pulseRingGeo = new THREE.RingGeometry(0.44, 0.47, 64);
  pulseRingGeo.rotateX(-Math.PI / 2);
  const pulseRingMat = new THREE.MeshBasicMaterial({
    color: 0xffdea0,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const pulseRing = new THREE.Mesh(pulseRingGeo, pulseRingMat);
  starBeaconGroup.add(pulseRing);

  // Generous invisible click sphere around the breathing star beacon
  const beaconHit = new THREE.Mesh(
    new THREE.SphereGeometry(1.45, 16, 12),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  );
  beaconHit.name = 'HitProxy_Qingzhou_Planet';
  beaconHit.userData.__qzInteractiveName = 'Qingzhou_Planet';
  starBeaconGroup.add(beaconHit);

  function getBeaconWorldPos(outVec = new THREE.Vector3()) {
    group.updateMatrixWorld(true);
    return starBeaconGroup.getWorldPosition(outVec);
  }

  let hoverLerp = 0;
  function update(elapsed, dt, isBeaconHovered, prefersReducedMotion, camera) {
    starsMat.uniforms.uTime.value = elapsed;
    deepMat.uniforms.uTime.value = elapsed;
    clMat.uniforms.uTime.value = elapsed;
    starCoreMat.uniforms.uTime.value = elapsed;
    astroRingMat.uniforms.uTime.value = elapsed;

    hoverLerp += ((isBeaconHovered ? 1 : 0) - hoverLerp) * Math.min(1, dt * 7);
    starCoreMat.uniforms.uHover.value = hoverLerp;
    astroRingMat.uniforms.uHover.value = hoverLerp;

    if (!prefersReducedMotion) {
      galaxyDisk.rotation.y = elapsed * 0.018;
      astroRing.rotation.y = -elapsed * 0.28;
      const cyc = (elapsed * 0.42) % 1.0;
      const pulseSc = 0.85 + cyc * 1.45;
      pulseRing.scale.setScalar(pulseSc);
      pulseRingMat.opacity = (1.0 - cyc) * (0.28 + hoverLerp * 0.24);
    }

    if (camera) {
      starCoreMesh.lookAt(camera.position);
    }
  }

  return {
    group,
    starBeaconGroup,
    getBeaconWorldPos,
    hitTargets: [beaconHit],
    update
  };
}
