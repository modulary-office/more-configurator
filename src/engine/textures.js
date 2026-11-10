/* Procedural textures – wood, stone, marble, solid, fabric weave. No image files. */
export function hash(x, y) { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
export function vn(x, y, px, py) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const X0 = ((xi % px) + px) % px, X1 = (X0 + 1) % px, Y0 = ((yi % py) + py) % py, Y1 = (Y0 + 1) % py;
  const a = hash(X0, Y0), b = hash(X1, Y0), c = hash(X0, Y1), d = hash(X1, Y1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, px, py, oct) { let s = 0, a = .5, f = 1; for (let i = 0; i < oct; i++) { s += a * vn(x * f, y * f, px * f, py * f); a *= .5; f *= 2; } return s; }
export const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

export function genTop(def, N) {
  const c = document.createElement('canvas'); c.width = c.height = N;
  const x = c.getContext('2d'), img = x.createImageData(N, N), d = img.data;
  const A = hexRgb(def.base), B = hexRgb(def.dark || def.base);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = i / N, v = j / N; let t, r, g, b;
    if (def.kind === 'wood') {
      const warp = fbm(u * 2, v * 5, 2, 5, 4) * 3.2 + fbm(u * 6, v * 2, 6, 2, 2) * .8;
      const ring = v * 26 + warp; const f = ring - Math.floor(ring);
      const late = Math.pow(f, 5);
      const streak = fbm(u * 1.5, v * 220, 1.5, 220, 3);
      const fine = vn(u * 6, v * 700, 6, 700);
      const pore = vn(u * 300, v * 1100, 300, 1100) > .9 ? .45 : 0;
      t = Math.max(0, Math.min(1, late * .55 + (streak - .5) * .7 + (fine - .5) * .25 + pore * .45 + .18));
    } else if (def.kind === 'stone') {
      const n1 = fbm(u * 6, v * 6, 6, 6, 5), sp = hash(i, j * 7) > .985 ? .5 : 0;
      t = .25 + (n1 - .5) * .9 + sp * .4 + (hash(i * 3, j) - .5) * .08;
    } else if (def.kind === 'marble') {
      const w = fbm(u * 4, v * 4, 4, 4, 5) * 7;
      const s = Math.abs(Math.sin((u * 2 + v) * Math.PI * 2 + w));
      t = Math.pow(1 - s, 14) * .9 + fbm(u * 10, v * 10, 10, 10, 3) * .12;
      r = A[0] - t * 120; g = A[1] - t * 118; b = A[2] - t * 112;
    } else {
      t = (fbm(u * 16, v * 16, 16, 16, 3) - .5) * .12 + (hash(i, j) - .5) * .05;
      r = A[0] * (1 + t); g = A[1] * (1 + t); b = A[2] * (1 + t);
    }
    if (r === undefined) { r = A[0] + (B[0] - A[0]) * t; g = A[1] + (B[1] - A[1]) * t; b = A[2] + (B[2] - A[2]) * t; }
    const k = (j * N + i) * 4; d[k] = r; d[k + 1] = g; d[k + 2] = b; d[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  if (def.cracks) {
    x.strokeStyle = 'rgba(60,38,20,.55)'; x.lineCap = 'round';
    for (let k = 0; k < 70; k++) {
      const y0 = hash(k, 3) * N, x0 = hash(k, 7) * N, len = (40 + hash(k, 9) * 220) * N / 1024;
      x.lineWidth = (1 + hash(k, 11) * 2.2) * N / 1024;
      for (const ox of [0, -N, N]) for (const oy of [0, -N, N]) {
        x.beginPath(); x.moveTo(x0 + ox, y0 + oy);
        for (let s = 1; s <= 8; s++) x.lineTo(x0 + ox + len * s / 8, y0 + oy + (hash(k, s) - .5) * 4 * N / 1024);
        x.stroke();
      }
    }
  }
  return c;
}

export function genWeave(N) {
  const c = document.createElement('canvas'); c.width = c.height = N;
  const x = c.getContext('2d'), img = x.createImageData(N, N), d = img.data;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const wx = (i % 6) < 3, wy = (j % 6) < 3;
    const t = 222 + ((wx ^ wy) ? 16 : -6) + (hash(i, j) - .5) * 34 + (fbm(i / N * 24, j / N * 24, 24, 24, 2) - .5) * 30;
    const k = (j * N + i) * 4; d[k] = d[k + 1] = d[k + 2] = Math.max(150, Math.min(255, t)); d[k + 3] = 255;
  }
  x.putImageData(img, 0, 0); return c;
}

const thumbCache = {};
export function thumbTop(def) {
  if (thumbCache[def.id]) return thumbCache[def.id];
  const src = genTop(def, 160), c = document.createElement('canvas'); c.width = c.height = 80;
  c.getContext('2d').drawImage(src, 0, 0, 160, 160, 0, 0, 80, 80);
  return thumbCache[def.id] = c.toDataURL('image/jpeg', .85);
}
let weaveURL = null;
export function fabThumb(hex) {
  if (!weaveURL) weaveURL = genWeave(48).toDataURL();
  return `url(${weaveURL}),linear-gradient(${hex},${hex})`;
}
