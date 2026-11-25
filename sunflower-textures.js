import * as THREE from './vendor/three/three.module.js';

/**
 * Procedural Painterly Oil-Book CanvasTextures for Act II:
 * 512px Fibonacci-Seed Sunflower Blossom, 256px Veined Leaf,
 * 256px Sunset-Tipped Meadow Grass Clump, and 512px Earthy Meadow Ground.
 */

export function makeSunflowerHeadTexture() {
  const S = 512;
  const H = S * 0.5;
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = S;
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, S, S);

  let seed = 41081;
  const rnd = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const drawPetalRing = (count, rIn, rOut, halfW, angleOff, outerCols, baseCol) => {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + angleOff + (rnd() - 0.5) * 0.05;
      const tipR = rOut * (0.94 + rnd() * 0.10);
      const pw = halfW * (0.92 + rnd() * 0.16);
      const bend = (rnd() - 0.5) * 9;

      ctx.save();
      ctx.translate(H, H);
      ctx.rotate(a);

      // Rich saffron-amber oil gradient from disc root to luminous sunlit petal tip
      const grad = ctx.createLinearGradient(rIn, 0, tipR, 0);
      grad.addColorStop(0.0, baseCol);
      grad.addColorStop(0.28, outerCols[0]);
      grad.addColorStop(0.75, outerCols[1]);
      grad.addColorStop(1.0, outerCols[2]);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(rIn - 6, -pw * 0.42);
      ctx.bezierCurveTo(rIn + (tipR - rIn) * 0.35, -pw * 1.12, rIn + (tipR - rIn) * 0.72, -pw * 0.72 + bend, tipR, bend * 0.5);
      ctx.bezierCurveTo(rIn + (tipR - rIn) * 0.72, pw * 0.72 + bend, rIn + (tipR - rIn) * 0.35, pw * 1.12, rIn - 6, pw * 0.42);
      ctx.closePath();
      ctx.fill();

      // Delicate painted petal ridge veins for handcrafted brush texture
      ctx.strokeStyle = 'rgba(182, 86, 14, 0.30)';
      ctx.lineWidth = 1.6;
      for (const vOff of [-0.36, 0.0, 0.36]) {
        ctx.beginPath();
        ctx.moveTo(rIn + 4, pw * vOff * 0.4);
        ctx.quadraticCurveTo(rIn + (tipR - rIn) * 0.55, pw * vOff * 0.75 + bend * 0.4, tipR - 8, pw * vOff * 0.25 + bend * 0.5);
        ctx.stroke();
      }
      // Subtle impasto highlight along sunlit crest
      ctx.strokeStyle = 'rgba(255, 240, 172, 0.38)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(rIn + (tipR - rIn) * 0.25, -pw * 0.16);
      ctx.quadraticCurveTo(rIn + (tipR - rIn) * 0.65, -pw * 0.12 + bend * 0.4, tipR - 10, bend * 0.4);
      ctx.stroke();

      ctx.restore();
    }
  };

  // Back petal ring (18 broad saffron petals)
  drawPetalRing(18, 86, 244, 24, 0.0, ['#ed9d24', '#f7be3e', '#ffde6a'], '#b85a14');
  // Front staggered inner ring (15 slightly shorter warm-honey petals for lush volume)
  drawPetalRing(15, 82, 214, 21, Math.PI / 16, ['#df861c', '#f5ae34', '#ffd056'], '#96420e');

  // Deep velvety seed disc with radial golden pollen corona
  const corona = ctx.createRadialGradient(H, H, 62, H, H, 98);
  corona.addColorStop(0.0, '#1e1008');
  corona.addColorStop(0.68, '#3f220e');
  corona.addColorStop(0.86, '#87511a');
  corona.addColorStop(0.96, '#c78328');
  corona.addColorStop(1.0, 'rgba(180, 100, 22, 0)');
  ctx.fillStyle = corona;
  ctx.beginPath();
  ctx.arc(H, H, 98, 0, Math.PI * 2);
  ctx.fill();

  // Golden Fibonacci spiral seed florets inside the center disc!
  const goldenAngle = 2.39996323;
  for (let n = 0; n < 240; n++) {
    const r = 7.5 + Math.sqrt(n) * 4.95;
    if (r > 84) break;
    const th = n * goldenAngle;
    const x = H + Math.cos(th) * r;
    const y = H + Math.sin(th) * r;
    const t = r / 84;
    if (t < 0.55) {
      ctx.fillStyle = n % 2 === 0 ? '#180c06' : '#321a0b';
      ctx.beginPath();
      ctx.arc(x, y, 2.7, 0, Math.PI * 2);
      ctx.fill();
    } else if (t < 0.84) {
      ctx.fillStyle = n % 3 === 0 ? '#5c3114' : '#7d4418';
      ctx.beginPath();
      ctx.arc(x, y, 3.0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = n % 2 === 0 ? '#d89b32' : '#f2be52';
      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, Math.PI * 2);
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

  // Broad heart-shaped sunflower leaf extending from (128, 248) stem base to (128, 12) tip
  const grad = ctx.createLinearGradient(0, 244, 0, 14);
  grad.addColorStop(0.0, '#1e381e');
  grad.addColorStop(0.45, '#2f5429');
  grad.addColorStop(0.85, '#466e32');
  grad.addColorStop(1.0, '#62883c');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(128, 242);
  ctx.bezierCurveTo(64, 248, 22, 182, 34, 118);
  ctx.bezierCurveTo(44, 68, 92, 34, 128, 14);
  ctx.bezierCurveTo(164, 34, 212, 68, 222, 118);
  ctx.bezierCurveTo(234, 182, 192, 248, 128, 242);
  ctx.closePath();
  ctx.fill();

  // Central midrib & lateral veins
  ctx.strokeStyle = 'rgba(136, 172, 92, 0.58)';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(128, 246);
  ctx.quadraticCurveTo(130, 128, 128, 22);
  ctx.stroke();

  ctx.lineWidth = 1.8;
  ctx.strokeStyle = 'rgba(116, 152, 76, 0.45)';
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

  // 13 gracefully curving meadow grass blades rising from bottom edge (y = 256)
  for (let i = 0; i < 13; i++) {
    const bx = 36 + (i / 12) * 184 + (rnd() - 0.5) * 12;
    const h = 135 + rnd() * 102;
    const sway = (i - 6) * 8 + (rnd() - 0.5) * 24;
    const w = 9 + rnd() * 6;

    const grad = ctx.createLinearGradient(bx, 256, bx + sway, 256 - h);
    grad.addColorStop(0.0, '#182b1c');
    grad.addColorStop(0.45, '#2f4c28');
    grad.addColorStop(0.82, '#5a6e32');
    grad.addColorStop(1.0, '#a48136'); // sunset-kissed golden blade tip!

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(bx - w, 256);
    ctx.quadraticCurveTo(bx - w * 0.35 + sway * 0.35, 256 - h * 0.55, bx + sway, 256 - h);
    ctx.quadraticCurveTo(bx + w * 0.35 + sway * 0.35, 256 - h * 0.55, bx + w, 256);
    ctx.closePath();
    ctx.fill();
  }

  // Two delicate ochre meadow seed spikes among the blades
  for (const fx of [88, 174]) {
    ctx.fillStyle = 'rgba(232, 182, 82, 0.85)';
    ctx.beginPath();
    ctx.arc(fx, 86 + rnd() * 26, 4.5, 0, Math.PI * 2);
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
