import * as THREE from './vendor/three/three.module.js';

/**
 * Deep-Cyan Glaze Jiangnan Night River Water Shader (深青琉璃夜水)
 * Features multi-octave rippled micro-normals, Fresnel dark-jade glaze,
 * shoreline depth ambient occlusion, stone bridge arch shadow, broken-gold reflections
 * from all Wupeng boat lanterns, waterfront illuminated windows, and dynamic wish ripples.
 */
export function buildMiniRiverWaterMaterial(clipPlanes) {
  const mat = new THREE.ShaderMaterial({
    clipping: true,
    clippingPlanes: clipPlanes,
    uniforms: {
      uTime: { value: 0 },
      uBoatLights: { value: Array.from({ length: 7 }, () => new THREE.Vector3(0, -100, 0)) },
      uWishLights: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 0, 0)) },
      uRipples: { value: Array.from({ length: 4 }, () => new THREE.Vector4(0, 0, -999, 0)) }
    },
    vertexShader: `
      #include <clipping_planes_pars_vertex>
      varying vec3 vWorldPos;
      varying vec3 vLocalPos;
      void main() {
        vLocalPos = position;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        #include <clipping_planes_vertex>
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      #include <clipping_planes_pars_fragment>
      uniform float uTime;
      uniform vec3 uBoatLights[7];
      uniform vec4 uWishLights[8];
      uniform vec4 uRipples[4];
      varying vec3 vWorldPos;
      varying vec3 vLocalPos;

      // Multi-octave canal ripple heightfield (jiangnan-river local XZ units)
      float waveHeight(vec2 p, float t) {
        float w = 0.0;
        w += sin(p.x * 1.9 + p.y * 0.45 - t * 1.15) * 0.42;
        w += cos(p.x * 3.1 - p.y * 1.6 + t * 1.55) * 0.28;
        w += sin(p.y * 4.8 + p.x * 1.4 - t * 2.15) * 0.18;
        w += cos(p.x * 7.6 + p.y * 6.4 + t * 2.75) * 0.09;
        return w;
      }

      // Compute broken-gold vertical reflection column from a glowing lantern point
      float lanternReflection(vec2 xz, vec2 lxz, vec2 nrmXZ, float spreadX, float trailZ) {
        vec2 d = xz - lxz;
        float distX = abs(d.x + nrmXZ.x * 0.85);
        float distZ = abs(d.y + nrmXZ.y * 1.55);
        // Core lantern pool + trembling vertical broken-gold water streak along canal axis
        float pool = exp(-(d.x * d.x + d.y * d.y) * 0.36);
        float streak = exp(-(distX * distX) / spreadX - (distZ * distZ) / trailZ);
        float sparkle = smoothstep(0.16, 0.52, abs(nrmXZ.y) * 1.55 + 0.04);
        return pool * 0.58 + streak * sparkle * 1.25;
      }

      void main() {
        #include <clipping_planes_fragment>
        vec2 p = vLocalPos.xz;

        // 1. Finite-difference water wave normal
        float eps = 0.08;
        float h0 = waveHeight(p, uTime);
        float hx = waveHeight(p + vec2(eps, 0.0), uTime);
        float hz = waveHeight(p + vec2(0.0, eps), uTime);
        vec2 grad = vec2(hx - h0, hz - h0) / eps;

        // Expanding wish-lantern splash ripples
        float rippleGlow = 0.0;
        for (int k = 0; k < 4; k++) {
          vec4 rp = uRipples[k];
          if (rp.w > 0.5) {
            float age = uTime - rp.z;
            if (age >= 0.0 && age < 4.2) {
              vec2 dp = p - rp.xy;
              float dist = length(dp);
              float front = age * 2.35;
              float ringEnv = exp(-abs(dist - front) * 1.35) * (1.0 - age / 4.2);
              float ringSin = sin((dist - front) * 4.6);
              vec2 dir = dist > 0.001 ? dp / dist : vec2(0.0, 1.0);
              grad += dir * cos((dist - front) * 4.6) * ringEnv * 0.85;
              rippleGlow += max(0.0, ringSin) * ringEnv * 0.55;
            }
          }
        }

        vec3 N = normalize(vec3(-grad.x * 0.24, 1.0, -grad.y * 0.24));
        vec3 V = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(0.0, dot(N, V)), 3.2);

        // 2. Deep Nocturnal Cyan-Jade Glaze Base (深青琉璃水色)
        vec3 deepInk = vec3(0.014, 0.042, 0.078);
        vec3 cyanGlaze = vec3(0.048, 0.165, 0.215);
        vec3 skyTint = vec3(0.115, 0.155, 0.245);
        vec3 col = mix(deepInk, cyanGlaze, 0.28 + 0.58 * fresnel);
        col = mix(col, skyTint, fresnel * 0.36);

        // Subtle cool moonlight & wave-crest sheen
        float crest = smoothstep(0.18, 0.72, abs(N.x) + abs(N.z));
        col += vec3(0.055, 0.145, 0.195) * crest * 0.28;

        // 3. Shoreline Depth Ambient Occlusion (darker along stone embankments x = +-7.55)
        float bankProx = smoothstep(4.8, 7.65, abs(p.x));
        col *= (1.0 - bankProx * 0.52);

        // Soft shadow under the arched stone bridge (z = -91.5)
        float bridgeShadow = exp(-pow((p.y + 91.5) * 0.42, 2.0));
        col *= (1.0 - bridgeShadow * 0.46);

        // 4. Waterfront Huizhou House Illuminated Windows Reflected Along Both Banks
        float windowBand = exp(-pow((abs(p.x) - 5.95) * 0.72, 2.0));
        float winFreq = max(0.0, sin(p.y * 0.92 + 0.6)) * (0.55 + 0.45 * cos(p.y * 2.1 - 0.4));
        float winBroken = smoothstep(0.10, 0.65, abs(N.z) * 1.7 + 0.22);
        vec3 warmAmber = vec3(1.00, 0.68, 0.30);
        vec3 deepGold = vec3(0.96, 0.56, 0.22);
        col += warmAmber * windowBand * pow(winFreq, 1.4) * winBroken * 0.38;

        // 5. Dynamic Lantern Reflections (6 Wupeng Boats + 1 Eave Lantern)
        float totalRefl = 0.0;
        for (int i = 0; i < 7; i++) {
          vec3 lp = uBoatLights[i];
          if (lp.y > -50.0) {
            totalRefl += lanternReflection(p, lp.xz, N.xz, 0.68, 3.6);
          }
        }
        // Bridge arch approach stone lanterns at x = +-2.4, z = -90.35 & -92.65
        totalRefl += lanternReflection(p, vec2(-2.4, -90.35), N.xz, 0.48, 2.4) * 0.75;
        totalRefl += lanternReflection(p, vec2( 2.4, -90.35), N.xz, 0.48, 2.4) * 0.75;
        totalRefl += lanternReflection(p, vec2(-2.4, -92.65), N.xz, 0.48, 2.4) * 0.55;
        totalRefl += lanternReflection(p, vec2( 2.4, -92.65), N.xz, 0.48, 2.4) * 0.55;

        // Dynamic user-spawned Lotus Wish Lanterns
        for (int j = 0; j < 8; j++) {
          vec4 wl = uWishLights[j];
          if (wl.w > 0.5) {
            totalRefl += lanternReflection(p, wl.xz, N.xz, 0.42, 2.2) * 1.15;
          }
        }

        col += mix(deepGold, vec3(1.0, 0.85, 0.52), clamp(totalRefl * 0.55, 0.0, 1.0)) * clamp(totalRefl, 0.0, 1.35) * 0.62;

        // Pale-gold expanding wish-lantern splash ripple highlight
        col += vec3(1.0, 0.84, 0.50) * rippleGlow;

        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `
  });
  return mat;
}

/**
 * Multi-petal miniature glowing Lotus Wish Lantern dropped into the Jiangnan canal terrarium.
 */
export function createMiniWishLanternMesh() {
  const g = new THREE.Group();

  // Dark carved wood tray base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.042, 0.012, 8),
    new THREE.MeshStandardMaterial({ color: 0x2b1b12, roughness: 0.78 })
  );
  g.add(base);

  // Inner warm candlelight flame
  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.016, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe9a6 })
  );
  flame.position.y = 0.022;
  g.add(flame);

  // Six delicate angled lotus petals glowing softly from within
  const petalGeo = new THREE.ConeGeometry(0.016, 0.038, 4);
  petalGeo.scale(1.0, 1.0, 0.35);
  const petalMat = new THREE.MeshStandardMaterial({
    color: 0xffd188,
    emissive: new THREE.Color(0xff9f38),
    emissiveIntensity: 1.15,
    roughness: 0.42
  });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = new THREE.Mesh(petalGeo, petalMat);
    p.position.set(Math.cos(a) * 0.024, 0.018, Math.sin(a) * 0.024);
    p.rotation.y = -a + Math.PI / 2;
    p.rotation.x = 0.58;
    g.add(p);
  }

  return g;
}
