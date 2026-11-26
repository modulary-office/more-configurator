/* Geometry helpers shared by the families. */

/* Soften the 12 edges of a BoxGeometry: every face is pulled in by b and the gaps are closed with strips that reuse the
   face vertices, so the normal turns across each strip and the edge catches light like a real, slightly eased edge.
   Call it after any UV work on the box – vertex order and UVs are kept. */
export function easeBox(g, b = .0015) {
  const p = g.attributes.position, n = g.attributes.normal;
  if (!g.index || p.count !== 24) return g;
  g.computeBoundingBox();
  const s = g.boundingBox.max, ax = ['x', 'y', 'z'];
  b = Math.min(b, s.x * .45, s.y * .45, s.z * .45);
  if (!(b > 0)) return g;
  const key = {}, get = { x: i => p.getX(i), y: i => p.getY(i), z: i => p.getZ(i) }, nrm = { x: i => n.getX(i), y: i => n.getY(i), z: i => n.getZ(i) };
  for (let i = 0; i < 24; i++) {
    const f = ax.find(a => Math.abs(nrm[a](i)) > .5), sg = ax.map(a => (get[a](i) > 0 ? 1 : 0));
    key[sg.join('') + f] = i;
    const v = ax.map(a => (a === f ? get[a](i) : get[a](i) - Math.sign(get[a](i)) * b));
    p.setXYZ(i, v[0], v[1], v[2]);
  }
  const idx = Array.from(g.index.array), P = i => [p.getX(i), p.getY(i), p.getZ(i)];
  const tri = (a, c, d) => {
    const A = P(a), C = P(c), D = P(d), u = [C[0] - A[0], C[1] - A[1], C[2] - A[2]], w = [D[0] - A[0], D[1] - A[1], D[2] - A[2]];
    const nx = u[1] * w[2] - u[2] * w[1], ny = u[2] * w[0] - u[0] * w[2], nz = u[0] * w[1] - u[1] * w[0];
    const out = nx * (A[0] + C[0] + D[0]) + ny * (A[1] + C[1] + D[1]) + nz * (A[2] + C[2] + D[2]);
    if (out >= 0) idx.push(a, c, d); else idx.push(a, d, c);
  };
  for (let c = 0; c < 8; c++) {
    const sg = [c & 1, (c >> 1) & 1, (c >> 2) & 1], k = sg.join('');
    tri(key[k + 'x'], key[k + 'y'], key[k + 'z']);
    for (let a = 0; a < 3; a++) {
      if (sg[a]) continue;                       /* each edge once: from the corner on its low end */
      const o = sg.slice(); o[a] = 1; const k2 = o.join(''), [f1, f2] = ax.filter((_, j) => j !== a);
      tri(key[k + f1], key[k2 + f1], key[k2 + f2]); tri(key[k + f1], key[k2 + f2], key[k + f2]);
    }
  }
  g.setIndex(idx); p.needsUpdate = true;
  if (g.groups.length) g.clearGroups();
  return g;
}
