import { easeBox } from '../engine/geo.js';
/* Family: meeting – conference tables.
   Top shapes: straight · rounded corners · ellipse · oval (round ends) · barrel ("egg": the long sides bow out).
   Edge: straight or undercut ("מדוקק"), in the colour of the top (matching PVC) or in a RAL colour.
   Legs: cone legs, or frames like the stock desk frames (posts, closed loop, X, A, trapeze). Their number and position
   follow the length and the outline of the top. Optional integral power / data boxes in the top.
   State: shape · w (length, cm) · d (depth, cm) · decor · edge · edgec · ecol · legs · ral · box */
import { topTexture, thumbTop } from '../engine/textures.js';
import { makeChair, chairTone } from '../engine/chair.js';


const FALLBACK = { id: '', he: '', hex: '#2b2b2d' };
const byId = (arr, id) => (arr || []).find(x => x.id === id) || (arr || [])[0] || FALLBACK;
const SHAPES = { rect: 'ישרה', round: 'פינות מעוגלות', ellipse: 'אליפסה', oval: 'אובאלית', egg: 'ביצתית' };
const LEGS = { cone: 'רגלי קונוס', wave: 'רגלי גלי', posts: 'אינטל, רגל ישרה', loop: 'רוז, מסגרת סגורה', xleg: 'איקס', aframe: 'ברצלונה', trapez: 'לוטוס, טרפז' };
const EDGES = { straight: 'קנט ישר', bevel: 'קנט מדוקק' };
const H = .75, T = .028;
const MIDS = { cabinet: 'תיבה 40×40 ס״מ באמצע', hh: 'רגלי ח פנימיות' };
const PEDESTAL = k => k === 'cone' || k === 'wave';
/* one top up to 240 × 120 cm; a bigger table is made of two or more tops, none longer than 240 cm */
const partsOf = (w, d) => (w <= 240 && d <= 120) ? 1 : Math.max(2, Math.ceil(w / 240 - 1e-6));
/* seats along each long side and at each end */
const seatPlan = S => ({ side: Math.max(1, Math.floor((S.w - (S.shape === 'ellipse' || S.shape === 'oval' ? S.d * .6 : 0)) / 65)), end: S.d >= 100 ? (S.d >= 160 ? 2 : 1) : 0 });
/* power boxes: one in the middle up to 240 cm, above that one on each side */
const boxesOf = S => S.box ? (S.w <= 240 ? 1 : 2) : 0;

function lists(cat) { const items = n => (cat[n] && cat[n].items) || []; return { DEC: items('decors'), RAL: items('ral') }; }
/* half depth of the top at x (metres), for each outline */
function halfDepth(shape, L, D, x) {
  const a = L / 2, b = D / 2, u = Math.min(1, Math.abs(x) / a);
  if (shape === 'ellipse') return b * Math.sqrt(Math.max(0, 1 - u * u));
  if (shape === 'oval') { const r = b, dx = Math.abs(x) - (a - r); return dx <= 0 ? b : Math.sqrt(Math.max(0, r * r - dx * dx)); }
  if (shape === 'egg') return b - b * .28 * u * u;
  if (shape === 'round') { const r = Math.min(.15, b / 2), dx = Math.abs(x) - (a - r); return dx <= 0 ? b : b - r + Math.sqrt(Math.max(0, r * r - dx * dx)); }
  return b;
}
/* outline as a closed list of points, counter-clockwise, optionally inset */
function outline(shape, L, D, inset = 0) {
  L -= 2 * inset; D -= 2 * inset; const a = L / 2, b = D / 2, pts = [], N = 96;
  if (shape === 'ellipse') { for (let i = 0; i < N; i++) { const t = i / N * Math.PI * 2; pts.push([a * Math.cos(t), b * Math.sin(t)]); } return pts; }
  if (shape === 'egg') {
    const be = b * .72, n = 40, r = Math.min(.06, be / 3);
    for (let i = 0; i <= n; i++) { const x = -a + r + (2 * a - 2 * r) * i / n; pts.push([x, -(b - b * .28 * (x / a) * (x / a))]); }
    for (let i = 0; i <= n; i++) { const x = a - r - (2 * a - 2 * r) * i / n; pts.push([x, b - b * .28 * (x / a) * (x / a)]); }
    /* soften the four corners */
    pts.splice(n + 1, 0, [a, -be + r], [a, be - r]); pts.push([-a, be - r], [-a, -be + r]);
    return pts;
  }
  const r = shape === 'oval' ? b : shape === 'round' ? Math.min(.15, b / 2) : .004, q = shape === 'rect' ? 2 : 18;
  [[a - r, -b + r, -Math.PI / 2], [a - r, b - r, 0], [-a + r, b - r, Math.PI / 2], [-a + r, -b + r, Math.PI]].forEach(([cx, cy, a0]) => { for (let i = 0; i <= q; i++) { const t = a0 + i / q * Math.PI / 2; pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); } });
  return pts;
}

export const meeting = {
  ui(product, cat, S) {
    const { DEC, RAL } = lists(cat);
    const dec = () => byId(DEC, S.decor), ral = () => byId(RAL, S.ral), ecol = () => byId(RAL, S.ecol);
    const seats = () => { const { side, end } = seatPlan(S); return 2 * side + 2 * end; };
    const parts = () => partsOf(S.w, S.d);
    const midTxt = () => !PEDESTAL(S.legs) && S.w > 320 ? `, תמיכה פנימית: ${MIDS[S.mid] || MIDS.cabinet}` : '';
    const edgeTxt = () => `${EDGES[S.edge] || EDGES.straight}, ${S.edgec === 'color' ? `RAL ${ecol().id} ${ecol().he}` : 'PVC תואם'}`;
    const boxes = () => boxesOf(S);
    const sizeTxt = () => `${S.w} × ${S.d} × 75 ס״מ`;
    return {
      metrics: () => ({ lengthM: S.w / 100, areaM2: S.w * S.d / 1e4, topParts: parts(), boxes: boxes(), seats: seats() }),
      outputs: () => ({ dimtag: `${sizeTxt()}<small>${SHAPES[S.shape] || SHAPES.rect} · כ־${seats()} מקומות ישיבה</small>`, summary: `${sizeTxt()} · ${SHAPES[S.shape] || SHAPES.rect}` }),
      sectionValue: k => ({
        shape: SHAPES[S.shape] || SHAPES.rect,
        size: `${sizeTxt()} · כ־${seats()} מקומות`,
        top: `<i style="background-image:url(${thumbTop(dec())})"></i>${dec().he} · ${EDGES[S.edge] || EDGES.straight}`,
        legs: `<i style="background:${ral().hex}"></i>${LEGS[S.legs] || LEGS.cone}${midTxt()}`,
        extra: boxes() === 1 ? 'תיבה אחת באמצע' : boxes() ? 'שתי תיבות, ימין ושמאל' : 'ללא'
      }[k]),
      toast: k => {
        if (k === 'decor' || k === 'decorFin') return [`פלטה: ${dec().he}`, `background-image:url(${thumbTop(dec())})`];
        if (k === 'edge' || k === 'edgec' || k === 'ecol') return [edgeTxt()];
        if (k === 'legs' || k === 'mid') return [(LEGS[S.legs] || LEGS.cone) + midTxt()];
        if (k === 'ral') return [`צבע רגליים: RAL ${ral().id} · ${ral().he}`, `background:${ral().hex}`];
        if (k === 'box') return [boxes() === 1 ? 'תיבת תקשורת שחורה באמצע הפלטה' : boxes() ? 'שתי תיבות תקשורת שחורות, מימין ומשמאל' : 'ללא תיבת תקשורת'];
        if (k === 'shape') return [`פלטה ${SHAPES[S.shape] || SHAPES.rect}`];
        return [`${sizeTxt()} · ${parts() > 1 ? parts() + ' פלטות' : 'פלטה אחת'} · כ־${seats()} מקומות`];
      },
      code: () => `${product.codePrefix || 'MT'}-${String(S.shape).toUpperCase()}-${S.w}x${S.d}-${(dec().code || S.decor)}-${S.edge === 'bevel' ? 'BV' : 'ST'}${S.edgec === 'color' ? 'R' + ecol().id : ''}-${String(S.legs).toUpperCase()}${!PEDESTAL(S.legs) && S.w > 320 ? (S.mid === 'hh' ? '-HH' : '-CAB') : ''}-R${ral().id}${boxes() ? '-PB' + boxes() : ''}`,
      summary: () => [`שולחן ישיבות, פלטה ${SHAPES[S.shape] || SHAPES.rect}`, `מידות ${sizeTxt()}, כ־${seats()} מקומות ישיבה`, `פלטה: ${dec().he}, 28 מ״מ, ${parts() > 1 ? `${parts()} פלטות של ${Math.round(S.w / parts())}×${S.d} ס״מ` : 'פלטה אחת'}`, edgeTxt(),
        `רגליים: ${LEGS[S.legs] || LEGS.cone}${midTxt()}, RAL ${ral().id} · ${ral().he}`, boxes() === 1 ? 'תיבת תקשורת שחורה באמצע הפלטה' : boxes() ? 'שתי תיבות תקשורת שחורות, מימין ומשמאל' : '']
    };
  },

  create({ THREE, scene, maxAniso, ao, S, product, cat, tweenColor, showDims }) {
    const { DEC, RAL } = lists(cat);
    const hexOf = id => byId(RAL, id).hex || '#1d1d1f';
    const legMat = new THREE.MeshStandardMaterial({ color: hexOf(S.ral), roughness: .42, metalness: .35, envMapIntensity: .9 });
    const edgeMat = new THREE.MeshStandardMaterial({ color: hexOf(S.ecol), roughness: .5, metalness: .05 });
    const footMat = new THREE.MeshStandardMaterial({ color: 0x161617, roughness: .7 });
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x1f1f21, roughness: .4, metalness: .5 });
    const lidMat = new THREE.MeshStandardMaterial({ color: 0x0f0f10, roughness: .35, metalness: .4 });
    const seamMat = new THREE.MeshBasicMaterial({ color: 0x1c1c1a, transparent: true, opacity: .6 });
    const decMats = {};
    function decMat(id) {
      if (decMats[id]) return decMats[id];
      const def = byId(DEC, id), tex = topTexture(THREE, def, 512);
      tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = maxAniso;
      return decMats[id] = new THREE.MeshStandardMaterial({ map: tex, roughness: .55, metalness: 0, envMapIntensity: .7 });
    }
    const mk = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
    const box = (w, h, d, mat, x, y, z) => mk(easeBox(new THREE.BoxGeometry(w, h, d)), mat, x, y, z);
    /* a bar between two points */
    function bar(a, b, r, mat, sq) {
      const dir = new THREE.Vector3().subVectors(b, a), len = dir.length();
      const g = sq ? easeBox(new THREE.BoxGeometry(r, len, r)) : new THREE.CylinderGeometry(r, r, len, 14);
      const m = mk(g, mat); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()); return m;
    }
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    /* slab with the outline, lying flat, top face at y1; uv in metres */
    function slab(shape, L, D, inset, y0, y1, mats) {
      const sh = new THREE.Shape(outline(shape, L, D, inset).map(([x, y]) => new THREE.Vector2(x, y)));
      const g = new THREE.ExtrudeGeometry(sh, { depth: y1 - y0, bevelEnabled: false, curveSegments: 4 });
      g.rotateX(-Math.PI / 2); g.translate(0, y0, 0);
      const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 1.2, p.getZ(i) / 1.2); uv.needsUpdate = true;
      return mk(g, mats);
    }

    const G = { top: new THREE.Group(), legs: new THREE.Group(), extra: new THREE.Group(), chairs: new THREE.Group(), dims: new THREE.Group() };
    Object.values(G).forEach(g => scene.add(g));
    const clear = g => { for (let i = g.children.length - 1; i >= 0; i--) { const o = g.children[i]; g.remove(o); o.traverse(c => c.geometry && c.geometry.dispose()); } };
    let hotPts = {}, dimLabels = [], cur = { L: 2.4, D: 1.2 }, dimT = null, resizing = false;

    function build() {
      Object.values(G).forEach(clear); hotPts = {};
      const L = cur.L, D = cur.D, shape = SHAPES[S.shape] ? S.shape : 'rect', tm = decMat(S.decor);
      const em = S.edgec === 'color' ? edgeMat : tm, yT = H, yB = H - T;
      /* top: for the undercut edge the lower part of the board steps in, so the top reads thin and sharp */
      if (S.edge === 'bevel') {
        G.top.add(slab(shape, L, D, 0, yT - .008, yT, [tm, em]));
        const steps = 5; for (let i = 0; i < steps; i++) G.top.add(slab(shape, L, D, .004 + (i + 1) * .0045, yT - .008 - (i + 1) * (T - .008) / steps, yT - .008 - i * (T - .008) / steps, [em, em]));
      } else G.top.add(slab(shape, L, D, 0, yB, yT, [tm, em]));
      /* a table bigger than one top is made of several tops: a visible joint where they meet */
      const parts = partsOf(Math.round(L * 100), Math.round(D * 100));
      for (let i = 1; i < parts; i++) { const x = -L / 2 + i * L / parts; G.top.add(box(.003, .0008, 2 * halfDepth(shape, L, D, x) - .004, seamMat, x, yT + .0005, 0)); }
      const style = LEGS[S.legs] ? S.legs : 'cone', yt = yB;
      let railX = null;
      if (PEDESTAL(style)) {
        /* pedestals on the centre line: their number follows the length, their size the depth */
        const n = L <= 3.4 ? 2 : 3, endIn = Math.max(.55, L * (shape === 'ellipse' ? .24 : .2));
        const xs = Array.from({ length: n }, (_, i) => -L / 2 + endIn + i * (L - 2 * endIn) / (n - 1));
        xs.forEach(x => {
          if (style === 'cone') {
            const rb = Math.min(.34, Math.max(.22, D * .27)), rt = rb * .5;
            G.legs.add(mk(new THREE.CylinderGeometry(rt, rb, yt - .004, 48), legMat, x, (yt - .004) / 2 + .004, 0));
            G.legs.add(mk(new THREE.CylinderGeometry(rb + .004, rb + .004, .004, 48), footMat, x, .002, 0));
          } else {
            /* "wave" leg: a tall slab with fully rounded ends, set across the table */
            const wz = Math.min(1.15, Math.max(.5, 2 * halfDepth(shape, L, D, x) * .62)), tx = .24, r = tx / 2, pts = [];
            const c = wz / 2 - r;
            for (let i = 0; i <= 24; i++) { const t = i / 24 * Math.PI; pts.push(new THREE.Vector2(r * Math.cos(t), c + r * Math.sin(t))); }
            for (let i = 0; i <= 24; i++) { const t = Math.PI + i / 24 * Math.PI; pts.push(new THREE.Vector2(r * Math.cos(t), -c + r * Math.sin(t))); }
            const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: yt, bevelEnabled: false, curveSegments: 4 }); g.rotateX(-Math.PI / 2);
            G.legs.add(mk(g, legMat, x, 0, 0));
          }
        });
        hotPts.legs = V(xs[0], .4, .2);
      } else {
        /* frames only at the two ends, so nobody sits against a leg; a long table gets an inner support instead */
        const endIn = shape === 'ellipse' ? L * .2 : shape === 'oval' ? Math.max(.45, D * .42) : shape === 'egg' ? .5 : .42, xs = [-L / 2 + endIn, L / 2 - endIn];
        xs.forEach(x => {
          const hd = halfDepth(shape, L, D, x), z = Math.max(.2, hd - .17);
          if (style === 'posts') {
            [-1, 1].forEach(s => { G.legs.add(box(.06, yt - .03, .06, legMat, x, (yt - .03) / 2, s * z)); G.legs.add(box(.08, .006, .08, footMat, x, .003, s * z)); });
            G.legs.add(box(.06, .03, 2 * z + .06, legMat, x, yt - .015, 0));
          } else if (style === 'loop') {
            [-1, 1].forEach(s => G.legs.add(box(.06, yt - .06, .03, legMat, x, yt / 2, s * z)));
            G.legs.add(box(.06, .03, 2 * z + .03, legMat, x, yt - .015, 0)); G.legs.add(box(.06, .03, 2 * z + .03, legMat, x, .015, 0));
          } else if (style === 'xleg') {
            G.legs.add(bar(V(x, .01, -z), V(x, yt - .02, z), .05, legMat, true)); G.legs.add(bar(V(x, .01, z), V(x, yt - .02, -z), .05, legMat, true));
            G.legs.add(box(.06, .03, 2 * z + .1, legMat, x, yt - .015, 0));
          } else if (style === 'aframe') {
            [-1, 1].forEach(s => { G.legs.add(bar(V(x, .01, s * (z + .06)), V(x, yt - .03, s * (z - .16)), .05, legMat, true)); G.legs.add(box(.07, .008, .07, footMat, x, .004, s * (z + .06))); });
            G.legs.add(box(.06, .03, 2 * z - .2, legMat, x, yt - .015, 0));
          } else {
            [-1, 1].forEach(s => G.legs.add(bar(V(x, .03, s * z), V(x, yt - .03, s * (z - .2)), .05, legMat, true)));
            G.legs.add(box(.06, .03, 2 * z - .34, legMat, x, yt - .015, 0)); G.legs.add(box(.06, .03, 2 * z + .05, legMat, x, .015, 0));
          }
        });
        railX = xs;
        if (L > 3.2) {
          const nm = L > 4.8 ? 2 : 1, mx = nm === 1 ? [0] : [-L / 6, L / 6];
          if (S.mid === 'hh') mx.forEach(x => {
            /* inner ח frames: narrow, well inside the knee line */
            [-1, 1].forEach(q => { const xx = x + q * .3; [-1, 1].forEach(s => G.legs.add(box(.05, yt - .03, .05, legMat, xx, (yt - .03) / 2, s * .2))); G.legs.add(box(.05, .03, .45, legMat, xx, yt - .015, 0)); G.legs.add(box(.05, .02, .45, legMat, xx, .01, 0)); });
          });
          else {
            /* one square box column, 40 × 40 cm, under the middle of the table: it carries the top and takes the cables */
            G.legs.add(box(.4, yt - .02, .4, legMat, 0, .02 + (yt - .02) / 2, 0)); G.legs.add(box(.36, .02, .36, footMat, 0, .01, 0));
          }
        }
        hotPts.legs = V(xs[0], .35, halfDepth(shape, L, D, xs[0]) - .17);
      }
      /* a rail under the top ties the supports together */
      if (railX) G.legs.add(box(railX[1] - railX[0], .04, .06, legMat, 0, yt - .05, 0));
      /* integral power and data boxes: a flush lid in the top, the box under it */
      const nb = boxesOf(S);
      if (nb) {
        (nb === 1 ? [0] : [-L / 4, L / 4]).forEach(x => {
          G.extra.add(box(.3, .003, .14, boxMat, x, yT + .0015, 0)); G.extra.add(box(.26, .0035, .1, lidMat, x, yT + .0018, 0));
          G.extra.add(box(.28, .09, .12, boxMat, x, yB - .045, 0));
        });
        hotPts.extra = V(nb === 1 ? 0 : -L / 4, yT + .01, 0);
      }
      /* chairs, for scale only: as many as the seat count, along the outline */
      if (S.chairs) {
        const { side, end } = seatPlan(S), tone = chairTone(byId(DEC, S.decor).base, hexOf(S.ral));
        const span = L - (shape === 'ellipse' || shape === 'oval' ? D * .6 : .3);
        for (let i = 0; i < side; i++) { const x = -span / 2 + (i + .5) * span / side, z = halfDepth(shape, L, D, x) + .3; [1, -1].forEach(q => { const c = makeChair(THREE, tone); c.position.set(x, 0, q * z); c.rotation.y = q > 0 ? 0 : Math.PI; G.chairs.add(c); }); }
        const hw = shape === 'egg' ? D * .72 : D;
        for (let i = 0; i < end; i++) { const z = end === 1 ? 0 : (i ? 1 : -1) * Math.min(.38, hw * .22); [1, -1].forEach(q => { const c = makeChair(THREE, tone); c.position.set(q * (L / 2 + .3), 0, z); c.rotation.y = q * Math.PI / 2; G.chairs.add(c); }); }
      }
      hotPts.top = V(L * .1, yT + .005, D * .22); hotPts.size = V(L / 2, yT, 0);
      ao.scale.set(L + .7, D + .7, 1); ao.position.z = 0;
      buildDims(L, D);
    }
    function buildDims(L, D) {
      const m = new THREE.LineBasicMaterial({ color: 0x1c1c1a, transparent: true, opacity: .75 });
      const seg = (a, b) => G.dims.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), m));
      const zf = D / 2 + .2, xr = L / 2 + .2, y = .004, tk = .05;
      seg(V(-L / 2, y, zf), V(L / 2, y, zf)); seg(V(-L / 2, y, zf - tk), V(-L / 2, y, zf + tk)); seg(V(L / 2, y, zf - tk), V(L / 2, y, zf + tk));
      seg(V(xr, y, -D / 2), V(xr, y, D / 2)); seg(V(xr - tk, y, -D / 2), V(xr + tk, y, -D / 2)); seg(V(xr - tk, y, D / 2), V(xr + tk, y, D / 2));
      seg(V(xr, 0, -D / 2), V(xr, H, -D / 2)); seg(V(xr - tk, H, -D / 2), V(xr + tk, H, -D / 2));
      dimLabels = [[V(0, y, zf), `${Math.round(L * 100)} ס״מ`], [V(xr, y, 0), `${Math.round(D * 100)} ס״מ`], [V(xr, H / 2, -D / 2), '75 ס״מ']];
      G.dims.visible = showDims();
    }
    function update(k) {
      resizing = false;
      if (k === 'ral') { tweenColor(legMat, hexOf(S.ral), 350); return; }
      if (k === 'w' || k === 'd') { /* fallthrough below */ }
      if (k === 'ecol') { tweenColor(edgeMat, hexOf(S.ecol), 350); return; }
      if (k === 'w' || k === 'd') { dimT = { a: { ...cur }, b: { L: S.w / 100, D: S.d / 100 }, t: 0 }; resizing = true; return; }
      build();
    }
    function tick(dt, ease) {
      if (!dimT) return;
      dimT.t = Math.min(1, dimT.t + dt / .55); const e = ease(dimT.t);
      cur = { L: dimT.a.L + (dimT.b.L - dimT.a.L) * e, D: dimT.a.D + (dimT.b.D - dimT.a.D) * e }; build();
      if (dimT.t >= 1) { dimT = null; return 'settled'; }
    }
    cur = { L: S.w / 100, D: S.d / 100 };
    return {
      build, update, tick, explode: ex => { G.top.position.y = .26 * ex; G.extra.position.y = .4 * ex; G.chairs.visible = ex < .05; },
      isResizing: () => resizing,
      dimsGroup: G.dims,
      fitSpan: () => Math.max(cur.L * .95, cur.D * 1.5, 1.6) + (S.chairs ? .5 : 0),
      clampBox: () => ({ lx: cur.L / 2 + .5, lz: cur.D / 2 + .5 }),
      hero: { th: .7, ph: 1.02 },
      views: { top: fitR => ({ th: .5, ph: .7, r: fitR() * .8, tx: 0, ty: H, tz: 0 }) },
      focusView: k => ({ top: 'top', shape: 'top' }[k] || 'hero'),
      hotspots: [['top', 'פלטה וקנט'], ['legs', 'רגליים'], ['size', 'מידות'], ['extra', 'תקשורת']],
      hotPts: () => hotPts,
      hotOffset: (k, ex) => k === 'top' ? .26 * ex : k === 'extra' ? .4 * ex : 0,
      dimLabels: () => dimLabels,
      snapLine: () => `${S.w}×${S.d}×75 ס״מ · ${byId(DEC, S.decor).he}`
    };
  }
};
