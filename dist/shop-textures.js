import * as THREE from './vendor/three/three.module.js';
import { HERBARIUM_SAMPLES } from './shop-data.js';

/* ---------- High-Res Procedural CanvasTexture Generators ---------- */
export function paintXuanPaperBase(ctx, w, h) {
  ctx.fillStyle = '#f3ead7';
  ctx.fillRect(0, 0, w, h);

  // Subtle paper fibers
  let seed = 4201;
  const rnd = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 2400; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(138, 108, 72, 0.045)' : 'rgba(255, 252, 244, 0.08)';
    ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 2);
  }

  // Spine fold shadow down the center x = w/2
  const spineGrad = ctx.createLinearGradient(w * 0.44, 0, w * 0.56, 0);
  spineGrad.addColorStop(0, 'rgba(62, 42, 24, 0)');
  spineGrad.addColorStop(0.5, 'rgba(42, 28, 16, 0.34)');
  spineGrad.addColorStop(1, 'rgba(62, 42, 24, 0)');
  ctx.fillStyle = spineGrad;
  ctx.fillRect(w * 0.44, 0, w * 0.12, h);

  // Outer vignette edges
  const edgeL = ctx.createLinearGradient(0, 0, 36, 0);
  edgeL.addColorStop(0, 'rgba(78, 55, 32, 0.25)');
  edgeL.addColorStop(1, 'rgba(78, 55, 32, 0)');
  ctx.fillStyle = edgeL;
  ctx.fillRect(0, 0, 36, h);
  const edgeR = ctx.createLinearGradient(w - 36, 0, w, 0);
  edgeR.addColorStop(0, 'rgba(78, 55, 32, 0)');
  edgeR.addColorStop(1, 'rgba(78, 55, 32, 0.25)');
  ctx.fillStyle = edgeR;
  ctx.fillRect(w - 36, 0, 36, h);

  // Classical Red 乌丝栏 Ruling frames for Right Page (544..986) & Left Page (38..480)
  const drawPageFrame = (x0, x1) => {
    const y0 = 62, y1 = h - 62;
    ctx.strokeStyle = 'rgba(166, 54, 42, 0.58)';
    ctx.lineWidth = 4;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    ctx.lineWidth = 1.6;
    ctx.strokeRect(x0 + 7, y0 + 7, x1 - x0 - 14, y1 - y0 - 14);
    const cols = 6;
    const step = (x1 - x0 - 14) / cols;
    ctx.strokeStyle = 'rgba(166, 54, 42, 0.28)';
    for (let c = 1; c < cols; c++) {
      const cx = x0 + 7 + c * step;
      ctx.beginPath();
      ctx.moveTo(cx, y0 + 7);
      ctx.lineTo(cx, y1 - 7);
      ctx.stroke();
    }
  };
  drawPageFrame(38, 480);
  drawPageFrame(544, 986);

  // Center edition fish-tail 版心 mark
  ctx.fillStyle = 'rgba(166, 54, 42, 0.65)';
  ctx.font = 'bold 26px "Noto Serif SC", "Songti SC", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('墨', w * 0.5, 190);
  ctx.fillText('盐', w * 0.5, 232);
}

export function makeWalnutTexture() {
  const cvs = document.createElement('canvas');
  cvs.width = 1024;
  cvs.height = 512;
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#3d2415';
  ctx.fillRect(0, 0, 1024, 512);
  for (let y = 0; y < 512; y += 2) {
    const shade = 22 + Math.sin(y * 0.055) * 10 + Math.cos(y * 0.14) * 5;
    ctx.fillStyle = `rgba(${Math.round(68 + shade)}, ${Math.round(38 + shade * 0.6)}, ${Math.round(20 + shade * 0.35)}, 0.45)`;
    ctx.fillRect(0, y, 1024, 2);
  }
  for (let k = 0; k < 28; k++) {
    ctx.strokeStyle = 'rgba(24, 12, 6, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const y0 = 14 + k * 18;
    ctx.moveTo(0, y0);
    for (let x = 0; x <= 1024; x += 32) {
      ctx.lineTo(x, y0 + Math.sin(x * 0.015 + k) * 6);
    }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  return tex;
}

export function makeBlueprintTexture(kind) {
  const cvs = document.createElement('canvas');
  cvs.width = 512;
  cvs.height = 384;
  const ctx = cvs.getContext('2d');
  const palettes = [
    { bg: '#0b2236', grid: 'rgba(130, 210, 255, 0.16)', ink: '#9ce6ff', accent: '#62e5d0', title: 'L—004 · 绒绒', sub: 'RESONANT COMPANION' },
    { bg: '#0b2924', grid: 'rgba(95, 226, 204, 0.18)', ink: '#74f5db', accent: '#f3e6cf', title: 'L—002 · 机器的植物志', sub: 'MACHINE HERBARIUM' },
    { bg: '#261b12', grid: 'rgba(232, 184, 109, 0.20)', ink: '#ffd38a', accent: '#7cf2da', title: 'L—003 · 记忆的地形', sub: 'TOPOGRAPHIC MEMORY' }
  ];
  const p = palettes[kind % 3];
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, 512, 384);
  ctx.strokeStyle = p.grid;
  ctx.lineWidth = 1;
  for (let x = 24; x < 512; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 384); ctx.stroke();
  }
  for (let y = 24; y < 384; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
  }
  ctx.strokeStyle = p.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 476, 348);

  const plateKind = kind % 3;
  if (plateKind === 0) {
    // L-004 绒绒: Dual-node resonant companion & harmonic acoustic waveform
    ctx.strokeStyle = 'rgba(156, 230, 255, 0.35)';
    ctx.lineWidth = 1.6;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.ellipse(306, 178, 72 + k * 28, 34 + k * 14, -0.22, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    for (let x = 44; x <= 468; x += 4) {
      const f = (x - 44) / 424;
      const env = Math.sin(f * Math.PI);
      const y = 296 - env * (26 * Math.sin(f * 26) + 12 * Math.cos(f * 13));
      if (x === 44) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // Companion dual resonance nodes
    ctx.fillStyle = p.accent;
    for (const [nx, ny, r] of [[256, 174, 8], [356, 182, 6]]) {
      ctx.beginPath(); ctx.arc(nx, ny, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('RESONANCE 432Hz · DIALOGUE KERNEL', 36, 342);
  } else if (plateKind === 1) {
    // L-002 机器的植物志: Botanical venation topology graph & landmark nodes
    ctx.strokeStyle = p.ink;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(220, 324);
    ctx.bezierCurveTo(255, 255, 310, 170, 368, 92);
    ctx.stroke();
    const veins = [
      [[264, 248], [218, 206], [198, 176]],
      [[292, 206], [238, 162], [220, 134]],
      [[322, 164], [274, 124], [262, 102]],
      [[272, 238], [336, 224], [378, 202]],
      [[304, 192], [372, 174], [408, 150]],
      [[336, 146], [392, 128], [418, 106]]
    ];
    ctx.lineWidth = 1.8;
    for (const [a, b, c] of veins) {
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.quadraticCurveTo(b[0], b[1], c[0], c[1]);
      ctx.stroke();
      ctx.fillStyle = p.accent;
      ctx.beginPath(); ctx.arc(c[0], c[1], 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(116, 245, 219, 0.35)';
    ctx.strokeRect(184, 78, 252, 248);
    ctx.fillStyle = p.ink;
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('VEIN NODES: 12 · CONFIDENCE 0.94', 36, 342);
  } else {
    // L-003 记忆的地形: Irregular organic elevation contours & survey azimuth grid
    ctx.strokeStyle = p.ink;
    for (let lvl = 0; lvl < 6; lvl++) {
      const baseR = 26 + lvl * 18;
      ctx.lineWidth = lvl % 2 === 0 ? 2.4 : 1.3;
      ctx.beginPath();
      for (let s = 0; s <= 48; s++) {
        const a = (s / 48) * Math.PI * 2;
        const wob = 1 + 0.18 * Math.sin(a * 3 + lvl * 0.7) + 0.10 * Math.cos(a * 2 - 0.5);
        const rx = 312 + Math.cos(a) * baseR * 1.24 * wob;
        const ry = 212 + Math.sin(a) * baseR * 0.88 * wob;
        if (s === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(190, 290); ctx.lineTo(426, 128);
    ctx.moveTo(312, 108); ctx.lineTo(312, 316);
    ctx.stroke();
    ctx.fillStyle = p.ink;
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('AZIMUTH N28°E · CONTOUR Δ 50m', 36, 342);
  }

  ctx.fillStyle = p.ink;
  ctx.font = 'bold 26px "Noto Serif SC", Georgia, serif';
  ctx.fillText(p.title, 36, 68);
  ctx.font = '15px "JetBrains Mono", monospace';
  ctx.fillText(p.sub, 36, 98);
  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  return tex;
}

export function makeHerbariumSlideTexture(idx) {
  const cvs = document.createElement('canvas');
  cvs.width = 256;
  cvs.height = 512;
  const ctx = cvs.getContext('2d');
  const s = HERBARIUM_SAMPLES[idx] || HERBARIUM_SAMPLES[0];
  const bgPalettes = [
    { bg: '#0e2824', stroke: '#6cf0d6', fill: 'rgba(108, 240, 214, 0.24)', ink: '#d4fff5' },
    { bg: '#261e12', stroke: '#f0cb7e', fill: 'rgba(240, 203, 126, 0.24)', ink: '#fff0d1' },
    { bg: '#281a14', stroke: '#ffbe7d', fill: 'rgba(255, 190, 125, 0.24)', ink: '#ffe8d2' },
    { bg: '#102230', stroke: '#86d6ff', fill: 'rgba(134, 214, 255, 0.22)', ink: '#dff4ff' }
  ];
  const pal = bgPalettes[idx % 4];
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, 256, 512);
  ctx.strokeStyle = pal.stroke;
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, 228, 484);
  ctx.fillStyle = pal.fill;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (idx === 0) {
    // 1. 雨后青苔 Bryophyta: cushion moss mound + slender nodding sporophyte setae & capsules
    ctx.beginPath();
    ctx.ellipse(128, 355, 76, 32, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (let k = -3; k <= 3; k++) {
      const bx = 128 + k * 18;
      const topY = 125 + Math.abs(k) * 26;
      const cx = bx + k * 6;
      ctx.beginPath();
      ctx.moveTo(bx, 340);
      ctx.quadraticCurveTo(bx - k * 3, 240, cx, topY);
      ctx.stroke();
      ctx.save();
      ctx.translate(cx, topY);
      ctx.rotate(k * 0.22 + 0.35);
      ctx.beginPath();
      ctx.ellipse(0, -10, 8, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  } else if (idx === 1) {
    // 2. 九月梧桐 Firmiana: 5-lobed palmate leaf + palmate veins
    ctx.beginPath();
    ctx.moveTo(128, 385);
    ctx.lineTo(128, 305);
    ctx.lineTo(64, 305);
    ctx.quadraticCurveTo(48, 265, 76, 246);
    ctx.lineTo(44, 185);
    ctx.quadraticCurveTo(68, 175, 92, 198);
    ctx.lineTo(128, 86);
    ctx.lineTo(164, 198);
    ctx.quadraticCurveTo(188, 175, 212, 185);
    ctx.lineTo(180, 246);
    ctx.quadraticCurveTo(208, 265, 192, 305);
    ctx.lineTo(128, 305);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    for (const [vx, vy] of [[128, 96], [52, 192], [204, 192], [68, 294], [188, 294]]) {
      ctx.beginPath();
      ctx.moveTo(128, 302);
      ctx.lineTo(vx, vy);
      ctx.stroke();
    }
  } else if (idx === 2) {
    // 3. 晚霞与桂子 Osmanthus: twig with opposite elliptical leaves + dense 4-petal floret clusters
    ctx.beginPath();
    ctx.moveTo(128, 388);
    ctx.bezierCurveTo(118, 285, 138, 180, 124, 72);
    ctx.stroke();
    for (const [lx, ly, ang] of [[84, 300, -0.55], [172, 274, 0.52], [86, 178, -0.48], [168, 152, 0.5]]) {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -40);
      ctx.lineTo(0, 42);
      ctx.stroke();
      ctx.restore();
    }
    for (const [fx, fy] of [[112, 232], [142, 224], [126, 206], [108, 128], [144, 118], [126, 102]]) {
      for (let p = 0; p < 4; p++) {
        const a = (p * Math.PI) / 2;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(a) * 6, fy + Math.sin(a) * 6, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  } else {
    // 4. 山谷雾松 Cedrus: branched twig with radiating pine needle fascicles & ovoid pinecone
    ctx.beginPath();
    ctx.moveTo(128, 388);
    ctx.lineTo(128, 105);
    ctx.moveTo(128, 285);
    ctx.lineTo(74, 215);
    ctx.moveTo(128, 225);
    ctx.lineTo(182, 162);
    ctx.stroke();
    for (const [nx, ny] of [[74, 215], [182, 162], [128, 118], [96, 245], [160, 186]]) {
      for (let k = -5; k <= 5; k++) {
        const a = -Math.PI / 2 + k * 0.24;
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(nx + Math.cos(a) * 40, ny + Math.sin(a) * 44);
        ctx.stroke();
      }
    }
    ctx.beginPath();
    ctx.ellipse(128, 326, 20, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = pal.ink;
  ctx.font = 'bold 24px "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.fillText(s.tag, 128, 438);
  ctx.font = '12px "JetBrains Mono", monospace';
  ctx.fillText(s.latin.slice(0, 22), 128, 466);
  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  return tex;
}

export function heightCanvasToNormalTexture(srcCanvas, strength = 2.0, repeatX = 1, repeatY = 1) {
  const w = srcCanvas.width;
  const h = srcCanvas.height;
  const src = srcCanvas.getContext('2d').getImageData(0, 0, w, h).data;
  const outCvs = document.createElement('canvas');
  outCvs.width = w;
  outCvs.height = h;
  const outCtx = outCvs.getContext('2d');
  const outImg = outCtx.createImageData(w, h);
  const dst = outImg.data;
  const lumaAt = (x, y) => {
    const cx = (x + w) % w;
    const cy = (y + h) % h;
    const i = (cy * w + cx) * 4;
    return (src[i] * 0.3 + src[i + 1] * 0.59 + src[i + 2] * 0.11) / 255;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (lumaAt(x + 1, y) - lumaAt(x - 1, y)) * strength;
      const dy = (lumaAt(x, y + 1) - lumaAt(x, y - 1)) * strength;
      let nx = -dx, ny = -dy, nz = 1.0;
      const invLen = 1 / Math.hypot(nx, ny, nz);
      nx *= invLen; ny *= invLen; nz *= invLen;
      const idx = (y * w + x) * 4;
      dst[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      dst[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      dst[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      dst[idx + 3] = 255;
    }
  }
  outCtx.putImageData(outImg, 0, 0);
  const tex = new THREE.CanvasTexture(outCvs);
  tex.colorSpace = THREE.NoColorSpace;
  tex.flipY = false;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  return tex;
}

export function makeLinearRoughNormalMaps(w, h, drawHeightFn, strength = 1.8, repeatX = 1, repeatY = 1) {
  const cvs = document.createElement('canvas');
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext('2d');
  drawHeightFn(ctx, w, h);
  const roughTex = new THREE.CanvasTexture(cvs);
  roughTex.colorSpace = THREE.NoColorSpace;
  roughTex.flipY = false;
  roughTex.wrapS = THREE.RepeatWrapping;
  roughTex.wrapT = THREE.RepeatWrapping;
  roughTex.repeat.set(repeatX, repeatY);
  const normalTex = heightCanvasToNormalTexture(cvs, strength, repeatX, repeatY);
  return { roughTex, normalTex };
}

export function buildProceduralEnvMap(renderer, scene) {
  if (!renderer || !scene) return;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const domeMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 deep = vec3(0.025, 0.035, 0.075);
        vec3 mid = vec3(0.08, 0.12, 0.18);
        vec3 warm = vec3(0.72, 0.48, 0.22);
        vec3 col = mix(deep, mid, smoothstep(0.15, 0.85, h));
        float keySpot = pow(max(0.0, dot(vDir, normalize(vec3(-0.4, 0.7, 0.6)))), 6.0);
        float jadeSpot = pow(max(0.0, dot(vDir, normalize(vec3(0.6, 0.4, -0.7)))), 5.0);
        col += warm * keySpot * 1.25 + vec3(0.20, 0.62, 0.54) * jadeSpot * 0.75;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(20, 24, 16), domeMat);
  envScene.add(dome);
  const envRT = pmrem.fromScene(envScene, 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.78;
  dome.geometry.dispose();
  domeMat.dispose();
  pmrem.dispose();
}
