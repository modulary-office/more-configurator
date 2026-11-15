/* Family: metalshelf – metal consoles and bookcases: a welded frame of 20 × 20 mm profile with shelves of sheet
   metal or wood. Layouts: "stagger" (offset uprights and half shelves, like a designer étagère), "grid" (even bays)
   and "open" (shelves only). Optional back: wire mesh or vertical bars, full or on half of the unit.
   State: w · h · d (cm) · levels · layout · cols · shelf ('metal' | 'wood') · decor · ral · back · backw */
import { topTexture, thumbTop } from '../engine/textures.js';

const FALLBACK = { id: '', he: '', hex: '#1d1d1f' };
const byId = (arr, id) => (arr || []).find(x => x.id === id) || (arr || [])[0] || FALLBACK;
const LAYOUTS = { stagger: 'מדורג', grid: 'תאים שווים', open: 'מדפים בלבד' };
const BACKS = { none: 'ללא גב', mesh: 'גב רשת', bars: 'גב פסי מתכת' };
const P = .02;   /* profile 20 × 20 mm */

function lists(cat) { const items = n => (cat[n] && cat[n].items) || []; return { DEC: items('decors'), RAL: items('ral') }; }
/* the pieces of a layout, in metres: levels y (shelf tops), uprights [x, y0, y1], half shelves [x0, x1, y] */
function plan(S) {
  const W = S.w / 100, H = S.h / 100, n = Math.max(2, S.levels || 5), y0 = .1, ys = Array.from({ length: n }, (_, i) => y0 + i * (H - P - y0) / (n - 1));
  const ups = [], halves = [], lay = LAYOUTS[S.layout] ? S.layout : 'stagger', inner = W - 2 * P;
  if (lay === 'grid') { const c = Math.max(1, S.cols || 2); for (let i = 1; i < c; i++) ups.push([-inner / 2 + i * inner / c, ys[0], ys[n - 1]]); }
  if (lay === 'stagger') for (let i = 0; i < n - 1; i++) {
    /* each bay gets one upright, alternating between a third and two thirds of the width; every other bay a half shelf */
    const x = -inner / 2 + inner * (i % 2 ? .36 : .64), a = ys[i], b = ys[i + 1];
    ups.push([x, a, b]);
    if (b - a > .34 && i % 3 !== 2) halves.push(i % 2 ? [x, inner / 2, (a + b) / 2] : [-inner / 2, x, (a + b) / 2]);
  }
  return { W, H, D: S.d / 100, ys, ups, halves, shelves: n + halves.length, lay };
}

export const metalshelf = {
  ui(product, cat, S) {
    const { DEC, RAL } = lists(cat);
    const ral = () => byId(RAL, S.ral), dec = () => byId(DEC, S.decor), wood = () => S.shelf === 'wood';
    const sizeTxt = () => `${S.w} × ${S.d} × ${S.h} ס״מ`;
    const backTxt = () => S.back && S.back !== 'none' ? `${BACKS[S.back]}${S.backw === 'half' ? ', על חצי מהרוחב' : ''}` : '';
    const shelfTxt = () => wood() ? `מדפי עץ ${dec().he}` : 'מדפי פח בצבע המסגרת';
    return {
      metrics: () => { const p = plan(S); return { w: S.w, h: S.h, d: S.d, areaM2: S.w * S.h / 1e4, shelves: p.shelves, backM2: S.back && S.back !== 'none' ? S.w * S.h / 1e4 * (S.backw === 'half' ? .5 : 1) : 0 }; },
      outputs: () => ({ levels: `${S.levels || 5} <span class="mrc-seats">${'<i></i>'.repeat(S.levels || 5)}</span>`, 'levels-lbl': `סה״כ ${plan(S).shelves} מדפים`,
        cols: `${S.cols || 2}`, 'cols-lbl': '', dimtag: `${sizeTxt()}<small>${LAYOUTS[plan(S).lay]} · ${plan(S).shelves} מדפים · פרופיל 20/20</small>`, summary: `${sizeTxt()} · ${LAYOUTS[plan(S).lay]}` }),
      sectionValue: k => ({
        size: sizeTxt(),
        layout: `${LAYOUTS[plan(S).lay]} · ${plan(S).shelves} מדפים`,
        shelf: wood() ? `<i style="background-image:url(${thumbTop(dec())})"></i>עץ ${dec().he}` : `<i style="background:${ral().hex}"></i>פח`,
        frame: `<i style="background:${ral().hex}"></i>RAL ${ral().id}${backTxt() ? ' · ' + BACKS[S.back] : ''}`
      }[k]),
      toast: k => {
        if (k === 'ral') return [`צבע מסגרת: RAL ${ral().id} · ${ral().he}`, `background:${ral().hex}`];
        if (k === 'shelf' || k === 'decor' || k === 'decorFin') return [shelfTxt()];
        if (k === 'back' || k === 'backw') return [backTxt() || 'ללא גב'];
        if (k === 'layout' || k === 'levels' || k === 'cols') return [`${LAYOUTS[plan(S).lay]} · ${plan(S).shelves} מדפים`];
        return [sizeTxt()];
      },
      code: () => `${product.codePrefix || 'MS'}-${S.w}x${S.d}x${S.h}-${String(plan(S).lay).toUpperCase()}${S.levels || 5}${plan(S).lay === 'grid' ? 'C' + (S.cols || 2) : ''}-${wood() ? 'W' + (dec().code || S.decor) : 'M'}-R${ral().id}${S.back && S.back !== 'none' ? '-' + S.back.toUpperCase() + (S.backw === 'half' ? 'H' : '') : ''}`,
      summary: () => [`${product.name}, מסגרת מתכת בפרופיל 20/20`, `מידות ${sizeTxt()}`, `פריסה: ${LAYOUTS[plan(S).lay]}, ${S.levels || 5} מפלסים, ${plan(S).shelves} מדפים`, shelfTxt(), `צבע מסגרת: RAL ${ral().id} · ${ral().he}`, backTxt()]
    };
  },

  create({ THREE, scene, maxAniso, ao, S, product, cat, tweenColor, showDims }) {
    const { DEC, RAL } = lists(cat);
    const hexOf = id => byId(RAL, id).hex || '#1d1d1f';
    const frameMat = new THREE.MeshStandardMaterial({ color: hexOf(S.ral), roughness: .5, metalness: .45, envMapIntensity: .8 });
    const footMat = new THREE.MeshStandardMaterial({ color: 0x141415, roughness: .7 });
    const meshMat = new THREE.MeshStandardMaterial({ color: hexOf(S.ral), roughness: .5, metalness: .5 });
    const decMats = {};
    function decMat(id) {
      if (decMats[id]) return decMats[id];
      const def = byId(DEC, id), tex = topTexture(THREE, def, 512);
      tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = maxAniso;
      return decMats[id] = new THREE.MeshStandardMaterial({ map: tex, roughness: .6, metalness: 0, envMapIntensity: .6 });
    }
    const mk = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
    const box = (w, h, d, mat, x, y, z) => mk(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
    function board(w, t, d, mat, x, y, z) { const g = new THREE.BoxGeometry(w, t, d), p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / .9, p.getZ(i) / .9); return mk(g, mat, x, y, z); }
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const G = { frame: new THREE.Group(), shelves: new THREE.Group(), back: new THREE.Group(), dims: new THREE.Group() };
    Object.values(G).forEach(g => scene.add(g));
    const clear = g => { for (let i = g.children.length - 1; i >= 0; i--) { const o = g.children[i]; g.remove(o); o.traverse(c => c.geometry && c.geometry.dispose()); } };
    let hotPts = {}, dimLabels = [], cur = { W: 1, H: 1.8, D: .35 };

    function build() {
      Object.values(G).forEach(clear); hotPts = {};
      const p = plan(S), { W, H, D, ys } = p; cur = { W, H, D };
      const wood = S.shelf === 'wood', sm = wood ? decMat(S.decor) : frameMat, st = wood ? .018 : .004;
      /* frame: four posts, a rail front and back at every level, side rails */
      [-1, 1].forEach(sx => [-1, 1].forEach(sz => { G.frame.add(box(P, H, P, frameMat, sx * (W / 2 - P / 2), H / 2, sz * (D / 2 - P / 2))); G.frame.add(mk(new THREE.CylinderGeometry(.011, .011, .012, 12), footMat, sx * (W / 2 - P / 2), -.006, sz * (D / 2 - P / 2))); }));
      ys.forEach(y => {
        [-1, 1].forEach(sz => G.frame.add(box(W - 2 * P, P, P, frameMat, 0, y - P / 2, sz * (D / 2 - P / 2))));
        [-1, 1].forEach(sx => G.frame.add(box(P, P, D - 2 * P, frameMat, sx * (W / 2 - P / 2), y - P / 2, 0)));
        /* shelf: sits in the frame (sheet metal) or on it (wood) */
        G.shelves.add(board(W - (wood ? .002 : 2 * P), st, D - (wood ? .002 : 2 * P), sm, 0, y + (wood ? st / 2 : -st / 2), 0));
      });
      /* uprights of the layout, front and back, and the half shelves between them */
      p.ups.forEach(([x, a, b]) => [-1, 1].forEach(sz => G.frame.add(box(P, b - a - (wood ? st : 0), P, frameMat, x, (a + b) / 2 + (wood ? st / 2 : 0), sz * (D / 2 - P / 2)))));
      p.halves.forEach(([x0, x1, y]) => {
        const w = x1 - x0;
        [-1, 1].forEach(sz => G.frame.add(box(w, P, P, frameMat, (x0 + x1) / 2, y - P / 2, sz * (D / 2 - P / 2))));
        G.shelves.add(board(w + (wood ? 0 : -P), st, D - (wood ? .002 : 2 * P), sm, (x0 + x1) / 2, y + (wood ? st / 2 : -st / 2), 0));
      });
      /* back: wire mesh or vertical bars, on the whole unit or on one half */
      if (S.back && S.back !== 'none') {
        const half = S.backw === 'half', bw = (W - 2 * P) * (half ? .5 : 1), bx = half ? -(W - 2 * P) / 4 : 0, by0 = ys[0], bh = ys[ys.length - 1] - by0, z = -D / 2 + P / 2;
        if (S.back === 'bars') { const n = Math.max(3, Math.round(bw / .06)); for (let i = 1; i < n; i++) G.back.add(box(.008, bh, .008, meshMat, bx - bw / 2 + i * bw / n, by0 + bh / 2, z)); }
        else { const nx = Math.max(4, Math.round(bw / .05)), ny = Math.max(4, Math.round(bh / .05));
          for (let i = 1; i < nx; i++) G.back.add(box(.003, bh, .003, meshMat, bx - bw / 2 + i * bw / nx, by0 + bh / 2, z));
          for (let j = 1; j < ny; j++) G.back.add(box(bw, .003, .003, meshMat, bx, by0 + j * bh / ny, z)); }
      }
      hotPts.shelf = V(W * .15, ys[Math.min(2, ys.length - 1)] + .02, D / 2); hotPts.frame = V(-W / 2, H * .7, D / 2); hotPts.size = V(W / 2, H, D / 2);
      ao.scale.set(W + .5, D + .5, 1); ao.position.z = 0;
      const m = new THREE.LineBasicMaterial({ color: 0x1c1c1a, transparent: true, opacity: .75 }), seg = (a, b) => G.dims.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), m));
      const zf = D / 2 + .16, xr = W / 2 + .16, y = .004, tk = .04;
      seg(V(-W / 2, y, zf), V(W / 2, y, zf)); seg(V(-W / 2, y, zf - tk), V(-W / 2, y, zf + tk)); seg(V(W / 2, y, zf - tk), V(W / 2, y, zf + tk));
      seg(V(xr, y, -D / 2), V(xr, y, D / 2)); seg(V(xr, 0, D / 2), V(xr, H, D / 2)); seg(V(xr - tk, H, D / 2), V(xr + tk, H, D / 2));
      dimLabels = [[V(0, y, zf), `${S.w} ס״מ`], [V(xr, y, 0), `${S.d} ס״מ`], [V(xr, H / 2, D / 2), `${S.h} ס״מ`]];
      G.dims.visible = showDims();
    }
    function update(k) {
      if (k === 'ral') { tweenColor(frameMat, hexOf(S.ral), 350); tweenColor(meshMat, hexOf(S.ral), 350); return; }
      build();
    }
    return {
      build, update, tick: () => {}, explode: ex => { G.shelves.position.z = .3 * ex; G.back.position.z = -.25 * ex; },
      isResizing: () => false,
      dimsGroup: G.dims,
      fitSpan: () => Math.max(cur.W, cur.H * 1.15, 1.2),
      clampBox: () => ({ lx: cur.W / 2 + .4, lz: cur.D / 2 + .5 }),
      targetY: () => cur.H * .5,
      hero: { th: .5, ph: 1.32 },
      hotspots: [['shelf', 'מדפים'], ['frame', 'מסגרת'], ['size', 'מידות']],
      hotPts: () => hotPts,
      hotOffset: () => 0,
      dimLabels: () => dimLabels,
      snapLine: () => `${S.w}×${S.d}×${S.h} ס״מ · RAL ${byId(RAL, S.ral).id}`
    };
  }
};
