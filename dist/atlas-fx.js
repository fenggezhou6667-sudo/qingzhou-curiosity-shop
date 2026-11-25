import * as THREE from './vendor/three/three.module.js';

/**
 * Curated travel-corridor edges connecting all 22 cities on the China Atlas.
 * Keeps regional topology clean (South -> Southwest -> Central -> Central Plains -> East -> North)
 * without cluttering the carved jade relief with spiderwebs.
 */
export const ATLAS_CORRIDOR_EDGES = [
  // Huanan (South China): 防城港-北海-玉林-南宁-贵港
  [3, 1], [1, 0], [0, 2], [0, 4], [2, 4],
  // Southwest: 南宁-贵阳-昆明-大理-丽江
  [2, 5], [5, 6], [6, 8], [8, 7],
  // Central China: 玉林-长沙-张家界 & 长沙-武汉
  [0, 10], [10, 11], [10, 9],
  // Central Plains & Northwest: 武汉-郑州-洛阳-华阴-西安
  [9, 17], [17, 18], [18, 19], [19, 20],
  // East China: 武汉-杭州-苏州-无锡-上海 & 上海-济南
  [9, 12], [12, 13], [13, 14], [14, 15], [15, 16],
  // Northbound links: 郑州-北京, 济南-北京, 郑州-济南
  [17, 21], [16, 21], [17, 16]
];

/**
 * Etched nocturnal mineral-navy sea disk shader with fine antique-gold nautical graticule,
 * 16 compass azimuth hairlines, and subtle ink bathymetry grain.
 */
export function buildAtlasSeaShader(timeUniforms) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vColor;
      void main() {
        vUv = uv;
        #ifdef USE_COLOR
          vColor = color;
        #else
          vColor = vec3(0.06, 0.14, 0.20);
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vColor;

      float hash21(vec2 p) {
        p = fract(p * vec2(127.1, 311.7));
        p += dot(p, p + 34.17);
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
        vec2 p = vUv - vec2(0.5);
        float r = length(p);
        float ang = atan(p.y, p.x);

        // Deep mineral slate-navy bathymetry radial gradient + fine stone ink grain
        float grain = (n2(vUv * 48.0) - 0.5) * 0.025 + (n2(vUv * 120.0) - 0.5) * 0.015;
        vec3 innerCol = vec3(0.052, 0.138, 0.178);
        vec3 outerCol = vec3(0.016, 0.048, 0.082);
        vec3 col = mix(innerCol, outerCol, smoothstep(0.02, 0.49, r));
        col += vec3(grain * 0.6, grain, grain * 1.15);

        // Ultra-fine etched antique gold concentric range rings
        float ringMask = 0.0;
        ringMask += smoothstep(0.0028, 0.0006, abs(r - 0.14));
        ringMask += smoothstep(0.0028, 0.0006, abs(r - 0.24));
        ringMask += smoothstep(0.0028, 0.0006, abs(r - 0.34));
        ringMask += smoothstep(0.0030, 0.0007, abs(r - 0.425));
        ringMask += smoothstep(0.0036, 0.0008, abs(r - 0.482)) * 1.35;

        // 16 radial azimuth compass hairlines (4 cardinal axes slightly crisper)
        float radFade = smoothstep(0.075, 0.14, r) * smoothstep(0.492, 0.478, r);
        float step16 = 6.2831853 / 16.0;
        float dist16 = abs(fract(ang / step16 + 0.5) - 0.5) * step16 * r;
        float hair16 = smoothstep(0.0024, 0.0005, dist16) * 0.55;

        float step4 = 6.2831853 / 4.0;
        float dist4 = abs(fract(ang / step4 + 0.5) - 0.5) * step4 * r;
        float hair4 = smoothstep(0.0030, 0.0006, dist4) * 0.85;

        float etch = clamp(ringMask * 0.24 + (hair16 + hair4) * radFade * 0.20, 0.0, 0.38);
        float breath = 0.86 + 0.14 * sin(uTime * 0.9 - r * 8.0);
        vec3 goldEtch = vec3(0.86, 0.70, 0.42);
        col = mix(col, goldEtch, etch * breath);

        // Delicate rim shadow hugging brass compass ring
        col *= 1.0 - smoothstep(0.475, 0.502, r) * 0.42;

        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `
  });
  timeUniforms.push(mat.uniforms.uTime);
  return mat;
}

/**
 * Flowing downstream river shader using UV.x (0 = headwaters -> 1 = estuary).
 */
export function buildAtlasRiverShader(baseHex, glowHex, speed, timeUniforms) {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uBase: { value: new THREE.Color(baseHex) },
      uGlow: { value: new THREE.Color(glowHex) },
      uSpeed: { value: speed }
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
      uniform vec3 uBase;
      uniform vec3 uGlow;
      uniform float uSpeed;
      varying vec2 vUv;
      void main() {
        float bank = sin(clamp(vUv.y, 0.0, 1.0) * 3.14159265);
        float w1 = 0.5 + 0.5 * sin(vUv.x * 26.0 - uTime * uSpeed);
        float w2 = 0.5 + 0.5 * sin(vUv.x * 11.0 - uTime * uSpeed * 0.65 + 1.3);
        float glint = pow(w1, 3.0) * 0.65 + pow(w2, 2.5) * 0.35;
        vec3 col = mix(uBase, uGlow, 0.30 + 0.70 * glint);
        float alpha = bank * (0.78 + 0.22 * glint);
        if (alpha < 0.02) discard;
        gl_FragColor = vec4(col, alpha);
        #include <colorspace_fragment>
      }
    `
  });
  timeUniforms.push(mat.uniforms.uTime);
  return mat;
}

/**
 * Builds faint champagne-gold curved light-streams connecting the 22 city pins
 * along ATLAS_CORRIDOR_EDGES. Supports regional emphasis & active-city focus.
 */
export function buildAtlasGoldenFilaments(cityPositions, placesMeta, timeUniforms) {
  const group = new THREE.Group();
  group.name = 'Atlas_Golden_Filaments';

  const edgeCount = ATLAS_CORRIDOR_EDGES.length;
  const edgeEmph = new Float32Array(edgeCount).fill(0.48);

  const tubularSegments = 36;
  const radialSegments = 6;

  const allPos = [];
  const allNorm = [];
  const allUvs = [];
  const allIndices = [];
  const allT = [];
  const allPhase = [];
  const allEdgeIdx = [];

  let vertOffset = 0;

  for (let e = 0; e < edgeCount; e++) {
    const [ia, ib] = ATLAS_CORRIDOR_EDGES[e];
    const pa = cityPositions[ia];
    const pb = cityPositions[ib];
    if (!pa || !pb) continue;

    const aIsMajor = !!placesMeta[ia]?.hasDirectPoem;
    const bIsMajor = !!placesMeta[ib]?.hasDirectPoem;

    // Lift arch endpoints smoothly to sit right at the luminous drop-pin crystal cores
    const start = pa.clone().add(new THREE.Vector3(0, aIsMajor ? 0.36 : 0.29, 0));
    const end = pb.clone().add(new THREE.Vector3(0, bIsMajor ? 0.36 : 0.29, 0));
    const dist = start.distanceTo(end);
    const mid = start.clone().lerp(end, 0.5);
    mid.y = Math.max(start.y, end.y) + 0.28 + dist * 0.082;

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const tube = new THREE.TubeGeometry(curve, tubularSegments, 0.044, radialSegments, false);

    const posAttr = tube.attributes.position;
    const normAttr = tube.attributes.normal;
    const uvAttr = tube.attributes.uv;
    const count = posAttr.count;
    const phase = (e * 0.371) % 1.0;

    for (let i = 0; i < count; i++) {
      allPos.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
      allNorm.push(normAttr.getX(i), normAttr.getY(i), normAttr.getZ(i));
      const u = uvAttr.getX(i);
      const v = uvAttr.getY(i);
      allUvs.push(u, v);
      allT.push(u);
      allPhase.push(phase);
      allEdgeIdx.push(e);
    }

    if (tube.index) {
      const idxArr = tube.index.array;
      for (let k = 0; k < idxArr.length; k++) {
        allIndices.push(vertOffset + idxArr[k]);
      }
    }
    vertOffset += count;
    tube.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(allPos, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(allNorm, 3));
  merged.setAttribute('uv', new THREE.Float32BufferAttribute(allUvs, 2));
  merged.setAttribute('aT', new THREE.Float32BufferAttribute(allT, 1));
  merged.setAttribute('aPhase', new THREE.Float32BufferAttribute(allPhase, 1));
  merged.setAttribute('aEdgeIdx', new THREE.Float32BufferAttribute(allEdgeIdx, 1));
  merged.setIndex(allIndices);

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uEdgeEmph: { value: edgeEmph }
    },
    vertexShader: `
      attribute float aT;
      attribute float aPhase;
      attribute float aEdgeIdx;
      varying float vT;
      varying float vPhase;
      varying float vEdgeIdx;
      varying float vRim;
      void main() {
        vT = aT;
        vPhase = aPhase;
        vEdgeIdx = aEdgeIdx;
        vec3 nView = normalize(normalMatrix * normal);
        vRim = pow(clamp(abs(nView.z), 0.1, 1.0), 0.7);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uEdgeEmph[${edgeCount}];
      varying float vT;
      varying float vPhase;
      varying float vEdgeIdx;
      varying float vRim;

      void main() {
        int idx = clamp(int(vEdgeIdx + 0.5), 0, ${edgeCount - 1});
        float emph = uEdgeEmph[idx];

        // Taper gently at both pin endpoints
        float endFade = smoothstep(0.0, 0.08, vT) * smoothstep(1.0, 0.92, vT);

        // Two peaceful traveling champagne-gold light beads along the curve
        float f1 = fract(vT - uTime * 0.14 + vPhase);
        float f2 = fract(vT - uTime * 0.14 + vPhase + 0.5);
        float p1 = exp(-pow(f1 - 0.5, 2.0) * 85.0);
        float p2 = exp(-pow(f2 - 0.5, 2.0) * 85.0);
        float pulse = max(p1, p2);

        vec3 baseGold = vec3(0.88, 0.70, 0.38);
        vec3 brightGold = vec3(1.00, 0.91, 0.66);
        vec3 col = mix(baseGold, brightGold, pulse * 0.85);

        float baseAlpha = 0.24 * emph;
        float sparkAlpha = 0.58 * pulse * max(0.35, emph);
        float alpha = (baseAlpha + sparkAlpha) * endFade * vRim;
        if (alpha < 0.008) discard;

        gl_FragColor = vec4(col, alpha);
        #include <colorspace_fragment>
      }
    `
  });

  timeUniforms.push(mat.uniforms.uTime);
  const mesh = new THREE.Mesh(merged, mat);
  mesh.name = 'Atlas_Golden_Filaments_Mesh';
  mesh.renderOrder = 3;
  group.add(mesh);

  function updateEmphasis(selectedIdx, activeRegion = 'all') {
    const arr = mat.uniforms.uEdgeEmph.value;
    for (let e = 0; e < edgeCount; e++) {
      const [ia, ib] = ATLAS_CORRIDOR_EDGES[e];
      const touchesSel = (ia === selectedIdx || ib === selectedIdx);
      const inRegion = activeRegion === 'all' ||
        placesMeta[ia]?.group === activeRegion ||
        placesMeta[ib]?.group === activeRegion;

      if (touchesSel) {
        arr[e] = 1.25;
      } else if (activeRegion !== 'all') {
        arr[e] = inRegion ? 0.92 : 0.16;
      } else {
        arr[e] = 0.48;
      }
    }
  }

  return { group, updateEmphasis };
}
