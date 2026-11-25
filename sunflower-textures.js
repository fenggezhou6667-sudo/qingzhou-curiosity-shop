import * as THREE from './vendor/three/three.module.js';

/**
 * Procedural Painterly Oil-Book CanvasTextures for Act II:
 * 256x512 Soft Rounded Botanical Petal, 256px Warm Cinnamon-Gold Fibonacci Disc,
 * 256px Veined Leaf, 256px Vibrant Dusk Meadow Grass Clump, and 512px Earthy Meadow Ground.
 */

export function makeSinglePetalTexture() {
  const W = 256;
  const H = 512;
  const cvs = document.createElement('canvas');
  cvs.width = W;
  cvs.height = H;
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const cx = W * 0.5;
  // Single vertical rounded-oval-lanceolate petal from base (y=502, v~0) to soft rounded tip (y=14, v~1)
  const grad = ctx.createLinearGradient(0, 502, 0, 14);
  grad.addColorStop(0.0, '#cc7208');
  grad.addColorStop(0.22, '#f4b014');
  grad.addColorStop(0.62, '#ffd626');
  grad.addColorStop(1.0, '#ffec68');

  ctx.fillStyle = grad;
  ctx.beginPath();
  // Narrow clasped root at y=502 (-30..+30), plump mid-belly ~108px half-width around y=230, smoothly rounded apex at y=14..52 (NOT a needle!)
  ctx.moveTo(cx - 30, 502);
  ctx.bezierCurveTo(cx - 92, 420, cx - 114, 290, cx - 102, 196);
  ctx.bezierCurveTo(cx - 90, 110, cx - 54, 46, cx - 26, 22);
  ctx.bezierCurveTo(cx - 10, 11, cx + 12, 11, cx + 27, 23);
  ctx.bezierCurveTo(cx + 56, 48, cx + 92, 114, cx + 105, 200);
  ctx.bezierCurveTo(cx + 112, 295, cx + 90, 422, cx + 30, 502);
  ctx.closePath();
  ctx.fill();

  // Warm saffron shading right at petal base fold
  const rootShade = ctx.createRadialGradient(cx, 504, 4, cx, 496, 86);
  rootShade.addColorStop(0.0, 'rgba(182, 82, 4, 0.52)');
  rootShade.addColorStop(0.65, 'rgba(218, 128, 12, 0.18)');
  rootShade.addColorStop(1.0, 'rgba(244, 176, 20, 0.0)');
  ctx.fillStyle = rootShade;
  ctx.fill();

  // Subtle longitudinal petal crease veins (kept strictly inside petal silhouette)
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(194, 112, 10, 0.22)';
  ctx.lineWidth = 2.0;
  for (const xFrac of [-0.46, -0.22, 0.02, 0.24, 0.48]) {
    ctx.beginPath();
    ctx.moveTo(cx + xFrac * 24, 500);
    ctx.bezierCurveTo(cx + xFrac * 96, 360, cx + xFrac * 98, 210, cx + xFrac * 34, 34);
    ctx.stroke();
  }

  // Soft sunlit impasto highlight along petal bellies
  ctx.strokeStyle = 'rgba(255, 250, 198, 0.36)';
  ctx.lineWidth = 2.6;
  for (const hOff of [-0.14, 0.15]) {
    ctx.beginPath();
    ctx.moveTo(cx + hOff * 30, 455);
    ctx.bezierCurveTo(cx + hOff * 88, 320, cx + hOff * 86, 175, cx + hOff * 30, 42);
    ctx.stroke();
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function makeSunflowerDiscTexture() {
  const S = 256;
  const H = S * 0.5;
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = S;
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, S, S);

  // Warm velvety botanical gradient — NEVER pitch black!
  const discGrad = ctx.createRadialGradient(H, H, 6, H, H, H - 2);
  discGrad.addColorStop(0.0, '#3d2410');
  discGrad.addColorStop(0.55, '#5e3816');
  discGrad.addColorStop(0.78, '#8c571b');
  discGrad.addColorStop(0.93, '#e6a626');
  discGrad.addColorStop(1.0, '#f6c942');

  ctx.fillStyle = discGrad;
  ctx.beginPath();
  ctx.arc(H, H, H - 1, 0, Math.PI * 2);
  ctx.fill();

  // 260 Fibonacci spiral seed florets with warm espresso -> cinnamon -> golden pollen gradient
  const goldenAngle = 2.39996323;
  const maxR = H - 6;
  for (let n = 0; n < 260; n++) {
    const r = 4.0 + Math.sqrt(n) * 7.45;
    if (r > maxR) break;
    const th = n * goldenAngle;
    const x = H + Math.cos(th) * r;
    const y = H + Math.sin(th) * r;
    const t = r / maxR;
    if (t < 0.52) {
      const idx = n % 3;
      ctx.fillStyle = idx === 0 ? '#331d0c' : idx === 1 ? '#4d2d12' : '#4a3715';
      ctx.beginPath();
      ctx.arc(x, y, 2.7, 0, Math.PI * 2);
      ctx.fill();
    } else if (t < 0.80) {
      ctx.fillStyle = n % 2 === 0 ? '#6e4118' : '#8f581d';
      ctx.beginPath();
      ctx.arc(x, y, 2.9, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = n % 2 === 0 ? '#e2a326' : '#f8cb48';
      ctx.beginPath();
      ctx.arc(x, y, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function makeSunflowerLeafTexture() {
  const S = 256;
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = S;
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, S, S);

  // Broad lush warm-dusk heart-shaped sunflower leaf from stem base (128, 244) to tip (128, 16)
  const grad = ctx.createLinearGradient(0, 244, 0, 14);
  grad.addColorStop(0.0, '#214222');
  grad.addColorStop(0.45, '#36622b');
  grad.addColorStop(0.84, '#528034');
  grad.addColorStop(1.0, '#789e40');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(128, 242);
  ctx.bezierCurveTo(60, 246, 20, 182, 34, 118);
  ctx.bezierCurveTo(46, 68, 92, 34, 128, 16);
  ctx.bezierCurveTo(164, 34, 210, 68, 222, 118);
  ctx.bezierCurveTo(236, 182, 196, 246, 128, 242);
  ctx.closePath();
  ctx.fill();

  // Central midrib & lateral veins
  ctx.strokeStyle = 'rgba(154, 192, 98, 0.56)';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(128, 244);
  ctx.quadraticCurveTo(130, 128, 128, 24);
  ctx.stroke();

  ctx.lineWidth = 1.8;
  ctx.strokeStyle = 'rgba(136, 174, 86, 0.44)';
  for (let i = 0; i < 4; i++) {
    const y0 = 200 - i * 40;
    const spread = 66 - i * 11;
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(128, y0);
      ctx.quadraticCurveTo(128 + dir * spread * 0.5, y0 - 18, 128 + dir * spread, y0 - 38);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function makeMeadowGrassTexture() {
  const S = 256;
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = S;
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, S, S);

  let seed = 82419;
  const rnd = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // 13 gracefully curving vibrant meadow grass blades rising from bottom edge (y = 256)
  for (let i = 0; i < 13; i++) {
    const bx = 36 + (i / 12) * 184 + (rnd() - 0.5) * 12;
    const h = 135 + rnd() * 102;
    const sway = (i - 6) * 8 + (rnd() - 0.5) * 24;
    const w = 9 + rnd() * 6;

    const grad = ctx.createLinearGradient(bx, 256, bx + sway, 256 - h);
    grad.addColorStop(0.0, '#1a351e');
    grad.addColorStop(0.45, '#345e29');
    grad.addColorStop(0.82, '#628533');
    grad.addColorStop(1.0, '#c9ab42'); // lush sunlit golden blade tip!

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(bx - w, 256);
    ctx.quadraticCurveTo(bx - w * 0.35 + sway * 0.35, 256 - h * 0.55, bx + sway, 256 - h);
    ctx.quadraticCurveTo(bx + w * 0.35 + sway * 0.35, 256 - h * 0.55, bx + w, 256);
    ctx.closePath();
    ctx.fill();
  }

  // Two delicate sunlit meadow seed spikes among the blades
  for (const fx of [88, 174]) {
    ctx.fillStyle = 'rgba(244, 198, 86, 0.85)';
    ctx.beginPath();
    ctx.arc(fx, 86 + rnd() * 26, 4.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function makeMeadowGroundTexture() {
  const S = 512;
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = S;
  const ctx = cvs.getContext('2d');

  // Rich neutral-warm textured canvas multiplier so terrain vertexColors keep exact meadow/path palette!
  ctx.fillStyle = '#cfcfcf';
  ctx.fillRect(0, 0, S, S);

  let seed = 51923;
  const rnd = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < 1800; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const r = 2 + rnd() * 14;
    const v = Math.round(145 + rnd() * 95);
    ctx.fillStyle = `rgba(${v}, ${Math.round(v * 0.98)}, ${Math.round(v * 0.88)}, ${0.08 + rnd() * 0.14})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tiny scattered fallen golden sunflower petal dabs
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = 'rgba(242, 185, 76, 0.22)';
    ctx.save();
    ctx.translate(rnd() * S, rnd() * S);
    ctx.rotate(rnd() * Math.PI);
    ctx.fillRect(-3, -1.2, 6, 2.4);
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 10);
  tex.anisotropy = 4;
  return tex;
}
