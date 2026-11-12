/* Family: cabinet – everything built as a box with fronts:
   tall / low / sliding cabinets, open shelving, cubbies, drawer pedestals and carts, file cabinets, sideboards,
   reception counters (model.kind = "counter") and kitchenettes (model.kind = "kitchen").
   Sizes and options come from products/<id>.json; this file turns them into geometry.

   State keys used (all optional, a product offers only what it needs):
   w h d (cm) · front (variant) · body / face (decor ids) · ral (epoxy colour) · handle · base · back · side28 ·
   shelves · lock · glass · drawers · upper · finish · shape · w2 · style · rails · softclose */
import { genTop, topTexture, thumbTop } from '../engine/textures.js';

const FALLBACK = { id: '', he: '', hex: '#999999', base: '#d8d2c8', kind: 'solid' };
const byId = (arr, id) => (arr || []).find(x => x.id === id) || (arr || [])[0] || FALLBACK;
const allControls = product => product.sections.flatMap(s => s.controls);
const optLabel = (product, k, v) => { const c = allControls(product).find(c => c.key === k); const o = c && (c.options || []).find(o => o.v === v); return o ? (o.label ?? String(o.v)) : String(v); };

/* ---------- front layouts → columns of cells ---------- */
/* returns [{ w: metres, cells: [{ k, h: metres, hinge }] }]; heights are inside the carcass */
function layout(tpl, W, Hin) {
  const col = (w, cells) => ({ w, cells });
  const doorsAcross = n => Array.from({ length: n }, (_, i) => i);
  const nDoors = Math.max(1, Math.round(W / (tpl.doorW || .42)));
  switch (tpl.t) {
    case 'doors': {
      const rows = tpl.rows || 1, cols = tpl.cols || nDoors;
      const hs = rows === 1 ? [Hin] : tpl.split ? [Hin * tpl.split, Hin * (1 - tpl.split)] : Array(rows).fill(Hin / rows);
      return doorsAcross(cols).map(i => col(W / cols, hs.map(h => ({ k: 'door', h, hinge: i % 2 ? 'r' : 'l' }))));
    }
    case 'door': return [col(W, [{ k: 'door', h: Hin, hinge: 'l' }])];
    case 'drawers': {
      const n = tpl.n || 4, cells = [];
      if (tpl.pencil) { const p = .07; cells.push(...Array(n - 1).fill(0).map(() => ({ k: 'drawer', h: (Hin - p) / (n - 1) })), { k: 'drawer', h: p }); }
      else cells.push(...Array(n).fill(0).map(() => ({ k: 'drawer', h: Hin / n })));
      return [col(W, cells)];
    }
    case 'files': { const n = Math.max(1, Math.round(Hin / .34)); return [col(W, Array(n).fill(0).map(() => ({ k: 'drawer', h: Hin / n, big: 1 })))]; }
    case 'drawerDoor': return [col(W, [{ k: 'door', h: Hin - .14, hinge: 'l' }, { k: 'drawer', h: .14 }])];
    case 'open': {
      const n = Math.max(1, Math.round(Hin / .36)); const cols = Math.max(1, Math.round(W / .9));
      return Array(cols).fill(0).map(() => col(W / cols, Array(n).fill(0).map(() => ({ k: 'open', h: Hin / n }))));
    }
    case 'openDoors': {
      const dh = Math.min(Hin * .6, (tpl.doorH || 80) / 100), rest = Hin - dh;
      const glassH = tpl.glassH ? Math.min(rest, tpl.glassH / 100) : 0;
      return doorsAcross(Math.max(1, Math.round(W / .42))).map((i, _, arr) => col(W / arr.length, [
        { k: 'door', h: dh, hinge: i % 2 ? 'r' : 'l' },
        ...(glassH ? [{ k: 'glass', h: glassH, hinge: i % 2 ? 'r' : 'l' }] : []),
        ...Array(Math.max(1, Math.round((rest - glassH) / .36))).fill(0).map((_, __, a) => ({ k: 'open', h: (rest - glassH) / a.length }))
      ]));
    }
    case 'sliding': {
      const rows = tpl.rows || 1;
      return [col(W, Array(rows).fill(0).map(() => ({ k: 'slide', h: Hin / rows })))];
    }
    case 'cubes': {
      const cols = Math.max(1, Math.round(W / .42)), rows = Math.max(1, Math.round(Hin / .4));
      return Array(cols).fill(0).map(() => col(W / cols, Array(rows).fill(0).map(() => ({ k: 'open', h: Hin / rows, cube: 1 }))));
    }
    case 'cols': {
      /* explicit segments with relative widths: { k: door|doors|drawers|open|slide|cpu, w, n } */
      const tot = tpl.cols.reduce((s, c) => s + (c.w || 1), 0);
      return tpl.cols.flatMap(c => {
        const w = W * (c.w || 1) / tot;
        if (c.k === 'drawers') return [col(w, Array(c.n || 3).fill(0).map(() => ({ k: 'drawer', h: Hin / (c.n || 3) })))];
        if (c.k === 'doors') { const n = Math.max(1, Math.round(w / .42)); return Array(n).fill(0).map((_, i) => col(w / n, [{ k: 'door', h: Hin, hinge: i % 2 ? 'r' : 'l' }])); }
        if (c.k === 'door') return [col(w, [{ k: 'door', h: Hin, hinge: c.hinge || 'l' }])];
        if (c.k === 'slide') return [col(w, [{ k: 'slide', h: Hin }])];
        if (c.k === 'cpu') return [col(w, [{ k: 'open', h: Hin }])];
        if (c.k === 'open') { const n = c.n || Math.max(1, Math.round(Hin / .3)); return [col(w, Array(n).fill(0).map(() => ({ k: 'open', h: Hin / n })))]; }
        if (c.k === 'cubby') { const n = c.n || 2; return [col(w, Array(n).fill(0).map(() => ({ k: 'open', h: Hin / n, cube: 1 })))]; }
        return [col(w, [{ k: 'door', h: Hin }])];
      });
    }
  }
  return [col(W, [{ k: 'door', h: Hin }])];
}

/* the template for the current state (glass doors, sliding rows by height) */
function resolveTpl(M, S) {
  const tpl = { ...((M.fronts || {})[S.front] || M.front || { t: 'doors' }) };
  if (tpl.t === 'openDoors' && S.glass && S.glass !== 'none') tpl.glassH = tpl.glassH || 120;
  if (tpl.t === 'sliding' && tpl.rows === 'auto') tpl.rows = (S.h || 90) > 160 ? 2 : 1;
  return tpl;
}
const isCorner = S => S.style === 'alucorner' || S.shape === 'corner';

const count = (cols, k) => cols.reduce((s, c) => s + c.cells.filter(x => x.k === k).length, 0);

export const cabinet = {
  /* ---------- numbers, texts, code ---------- */
  ui(product, cat, S) {
    const M = product.model || {};
    const kind = M.kind || 'cabinet';
    const DEC = (cat.decors && cat.decors.items) || [], RAL = (cat.ral && cat.ral.items) || [];
    const tpl = () => resolveTpl(M, S);
    const VK = M.variantKey || 'front';
    const W = () => S.w / 100, H = () => (S.h || M.h || 75) / 100, D = () => (S.d || M.d || 40) / 100;
    const cols = () => kind === 'cabinet' ? layout(tpl(), W(), H()) : [];
    const has = k => allControls(product).some(c => c.key === k);
    const kitchenMods = () => Math.max(1, Math.round(S.w / 60));
    return {
      metrics: () => {
        const c = cols(), doors = count(c, 'door') + count(c, 'glass'), drawers = count(c, 'drawer') + (S.drawers || 0) + (kind === 'kitchen' ? Math.ceil(kitchenMods() / 3) * 3 : 0);
        return {
          w: S.w, h: S.h || M.h || 0, d: S.d || M.d || 0, lengthM: S.w / 100, areaM2: S.w * (S.d || M.d || 40) / 1e4,
          doors, doorPairs: Math.ceil(doors / 2), slideDoors: count(c, 'slide') * 2, drawers, glassPairs: Math.ceil(count(c, 'glass') / 2),
          per80: Math.max(1, Math.ceil(S.w / 80)), per120: Math.max(1, Math.ceil(S.w / 120)), modules: kitchenMods(), upperUnits: S.upper ? kitchenMods() : 0,
          wing: isCorner(S) ? (S.w2 || 0) : 0, run: S.w + (isCorner(S) ? (S.w2 || 0) : 0)
        };
      },
      outputs: () => ({
        dimtag: (kind === 'counter' && isCorner(S)
          ? `${S.w} × ${S.w2} × ${Math.round(H() * 100)} ס״מ`
          : `${S.w} × ${Math.round(D() * 100)} × ${Math.round((kind === 'kitchen' ? (S.upper ? 2.15 : .9) : H()) * 100)} ס״מ`) + `<small>${S[VK] !== undefined ? optLabel(product, VK, S[VK]) : product.name}</small>`,
        summary: `${S.w}×${Math.round(D() * 100)}×${Math.round(H() * 100)} ס״מ`
      }),
      sectionValue: k => {
        const sec = product.sections.find(s => s.id === k); if (!sec) return;
        if (k === 'size') return `${S.w}×${Math.round(D() * 100)}×${Math.round(H() * 100)}`;
        const sw = sec.controls.find(c => c.type === 'swatch' && c.catalog === 'decors');
        if (sw) { const t = byId(DEC, S[sw.key]); return `<i style="background-image:url(${thumbTop(t)})"></i>${t.he}`; }
        const seg = sec.controls.find(c => c.type === 'seg');
        if (seg) return optLabel(product, seg.key, S[seg.key]);
        const togs = sec.controls.filter(c => c.type === 'toggle' && S[c.key]).map(c => c.title);
        return togs.join(' · ') || 'ללא';
      },
      toast: k => {
        const c = allControls(product).find(c => c.key === k);
        if (!c) return [''];
        if (c.type === 'swatch') { const it = byId(c.catalog === 'ral' ? RAL : DEC, S[k]); return [`${c.label}: ${c.catalog === 'ral' ? 'RAL ' + it.id + ' ' : ''}${it.he}`, c.catalog === 'ral' ? `background:${it.hex}` : `background-image:url(${thumbTop(it)})`]; }
        if (c.type === 'toggle') return [`${S[k] ? 'נוסף' : 'הוסר'}: ${c.title}`];
        if (c.type === 'stepper') return [`${c.label}: ${S[k]}`];
        if (['w', 'h', 'd', 'w2'].includes(k)) return [`${S.w} × ${Math.round(D() * 100)} × ${Math.round(H() * 100)} ס״מ`];
        return [`${c.label}: ${optLabel(product, k, S[k])}`];
      },
      code: () => [product.codePrefix || 'MC', `${S.w}x${Math.round(D() * 100)}x${Math.round(H() * 100)}`, S.front, isCorner(S) ? 'L' + S.w2 : '', S.style, S.finish, S.body && String(S.body).toUpperCase(), S.face && S.face !== S.body ? String(S.face).toUpperCase() : '', S.finish === 'epoxy' && S.ral ? 'R' + S.ral : '', S.handle && S.handle !== 'none' ? S.handle.toUpperCase().slice(0, 3) : '', S.base && S.base !== (product.defaults || {}).base ? S.base.toUpperCase().slice(0, 3) : '', S.glass && S.glass !== 'none' ? 'G' + S.glass[0].toUpperCase() : '', S.lock ? 'LK' : '', S.back ? 'BK' : '', S.side28 ? 'S28' : '', S.shelves ? 'SH' + S.shelves : '', S.drawers ? 'DR' + S.drawers : '', S.upper ? 'UP' : '', S.softclose ? 'SC' : '', S.rails === 'alu' ? 'ALR' : '', S.thick ? 'T' + S.thick : ''].filter(Boolean).join('-').replace(/[^A-Za-z0-9-]/g, ''),
      summary: () => {
        const out = [`מידות ${S.w}×${Math.round(D() * 100)}×${Math.round(H() * 100)} ס״מ`];
        allControls(product).forEach(c => {
          if (['w', 'h', 'd'].includes(c.key)) return;
          if (c.showWhen && !Object.entries(c.showWhen).every(([k, v]) => Array.isArray(v) ? v.includes(S[k]) : S[k] === v)) return;
          if (c.type === 'seg') out.push(`${c.label}: ${c.key === 'w2' ? S.w2 + ' ס״מ' : optLabel(product, c.key, S[c.key])}`);
          if (c.type === 'swatch') { const it = byId(c.catalog === 'ral' ? RAL : DEC, S[c.key]); out.push(`${c.label}: ${c.catalog === 'ral' ? 'RAL ' + it.id + ' ' : ''}${it.he}`); }
          if (c.type === 'toggle' && S[c.key]) out.push(c.title);
          if (c.type === 'stepper' && S[c.key]) out.push(`${c.label}: ${S[c.key]}`);
        });
        return out;
      }
    };
  },

  /* ---------- 3D ---------- */
  create({ THREE, scene, maxAniso, ao, S, product, cat, tweenColor, showDims }) {
    const M = product.model || {};
    const kind = M.kind || 'cabinet';
    const DEC = (cat.decors && cat.decors.items) || [], RAL = (cat.ral && cat.ral.items) || [];

    /* materials */
    const decMats = {};
    function decMat(id) {
      if (decMats[id]) return decMats[id];
      const def = byId(DEC, id), tex = topTexture(THREE, def, 512);
      tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = maxAniso;
      const span = def.kind === 'wood' ? 1.0 : 1.1; tex.repeat.set(1 / span, 1 / span);
      return decMats[id] = new THREE.MeshStandardMaterial({ map: tex, roughness: def.kind === 'marble' ? .3 : def.kind === 'wood' ? .62 : .5, envMapIntensity: .7 });
    }
    const epoxyMat = new THREE.MeshStandardMaterial({ color: byId(RAL, S.ral).hex, roughness: .35, metalness: .05, envMapIntensity: .9 });
    const metal = new THREE.MeshStandardMaterial({ color: 0xb9bcbe, roughness: .3, metalness: .9 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x1b1b1c, roughness: .55 });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x232325, roughness: .8 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xdfe8e6, roughness: .05, metalness: 0, transparent: true, opacity: .28, envMapIntensity: 1.2, depthWrite: false });
    const glassTempered = glassMat.clone(); glassTempered.color.set(0xd2e2df); glassTempered.opacity = .34;
    const interiorShade = new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: .12, depthWrite: false });

    const bodyMat = () => decMat(S.body || DEC[0]?.id);
    const faceMat = () => {
      if (S.finish === 'epoxy') return epoxyMat;
      return decMat(S.face && S.face !== 'same' ? S.face : (S.body || DEC[0]?.id));
    };

    /* helpers */
    const sh = m => { m.castShadow = m.receiveShadow = true; return m; };
    /* a board whose texture is scaled to its real size, grain along its longest face direction */
    function board(w, h, d, mat, x, y, z) {
      const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
      const U = [d, d, w, w, w, w], V = [h, h, d, d, h, h];
      /* vertical faces: grain runs up the board (like real door and side panels); horizontal faces: along the width */
      for (let i = 0; i < uv.count; i++) { const f = Math.floor(i / 4), u = uv.getX(i) * U[f], v = uv.getY(i) * V[f]; if (f === 2 || f === 3) uv.setXY(i, u, v); else uv.setXY(i, v, u); }
      const m = sh(new THREE.Mesh(g, mat)); m.position.set(x, y, z); return m;
    }
    const cyl = (r, h, mat, x, y, z, seg = 16) => { const m = sh(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat)); m.position.set(x, y, z); return m; };

    const G = { body: new THREE.Group(), fronts: new THREE.Group(), base: new THREE.Group(), top: new THREE.Group(), dims: new THREE.Group() };
    Object.values(G).forEach(g => scene.add(g));
    let hotPts = {}, dimLabels = [], dims = null, dimT = null;
    const target = () => ({ W: S.w / 100, H: (S.h || M.h || 75) / 100, D: (S.d || M.d || 40) / 100, W2: (S.w2 || 0) / 100 });
    dims = target();

    function clearGroup(g) { for (let i = g.children.length - 1; i >= 0; i--) { const o = g.children[i]; g.remove(o); o.traverse(c => { if (c.geometry) c.geometry.dispose(); }); } }

    /* ---- handles ---- */
    function handle(group, kindCell, x, y, z, fw, fh, hinge) {
      const hs = S.handle || M.handle || 'none';
      if (S.finish === 'epoxy' || hs === 'integral') {
        /* integral aluminium grip profile along the top edge */
        const len = kindCell === 'drawer' ? fw * .86 : Math.min(.2, fw * .5);
        const px = kindCell === 'drawer' ? x : x + (hinge === 'r' ? -1 : 1) * (fw / 2 - len / 2 - .03);
        group.add(board(len, .014, .022, metal, px, y + fh / 2 - .007, z + .004));
      } else if (hs === 'bar') {
        if (kindCell === 'drawer') { group.add(board(Math.min(.16, fw * .5), .012, .012, metal, x, y + fh * .22, z + .026)); [-1, 1].forEach(s => group.add(board(.01, .01, .02, metal, x + s * Math.min(.16, fw * .5) / 2.4, y + fh * .22, z + .016))); }
        else { const hx = x + (hinge === 'r' ? -1 : 1) * (fw / 2 - .05), hy = y + Math.min(fh / 2 - .12, .3); group.add(board(.012, Math.min(.18, fh * .4), .012, metal, hx, hy, z + .026)); [-1, 1].forEach(s => group.add(board(.01, .01, .02, metal, hx, hy + s * Math.min(.18, fh * .4) / 2.4, z + .016))); }
      } else if (hs === 'cnc') {
        const g = new THREE.Mesh(new THREE.CircleGeometry(.022, 24), dark); g.scale.set(1.8, 1, 1);
        g.position.set(kindCell === 'drawer' ? x : x + (hinge === 'r' ? -1 : 1) * (fw / 2 - .06), y + fh / 2 - .05, z + .0095); group.add(g);
      }
      if (S.lock && (kindCell === 'door' || kindCell === 'drawer')) {
        const lk = cyl(.008, .01, metal, x + (kindCell === 'drawer' ? fw * .3 : (hinge === 'r' ? -1 : 1) * (fw / 2 - .05)), y + fh / 2 - .04, z + .013, 14);
        lk.rotation.x = Math.PI / 2; group.add(lk);
      }
    }

    /* ---- base: plinth / legs / wheels ---- */
    function buildBase(W, D, len = W, depth = D, ox = 0, oz = 0) {
      const b = S.base || M.base || 'plinth';
      if (b === 'plinth') { G.base.add(board(len - .05, .06, depth - .07, dark, ox, .03, oz - .02)); return .06; }
      if (b === 'legs') {
        const lh = .1; [-1, 1].forEach(sx => [-1, 1].forEach(sz => { G.base.add(cyl(.018, lh, metal, ox + sx * (len / 2 - .05), lh / 2, oz + sz * (depth / 2 - .05))); }));
        return lh;
      }
      if (b === 'wheels') {
        const wh = .055; [-1, 1].forEach(sx => [-1, 1].forEach(sz => {
          const x = ox + sx * (len / 2 - .05), z = oz + sz * (depth / 2 - .06);
          G.base.add(board(.04, .01, .04, metal, x, wh - .005, z));
          const wheel = cyl(.022, .02, rubber, x, .022, z + .01, 18); wheel.rotation.z = Math.PI / 2; G.base.add(wheel);
        }));
        return wh;
      }
      return 0;
    }

    /* ---- carcass + fronts ---- */
    function buildBox(W, H, D, tpl, ox = 0, oz = 0, opts = {}) {
      const t = (S.thick || 17) / 1000, ts = S.side28 ? .028 : t, bm = bodyMat(), fm = faceMat();
      const bh = opts.noBase ? 0 : buildBase(W, D, W, D, ox, oz);
      const y0 = opts.y0 ?? bh;
      const Hc = H - y0;
      /* sides, top, bottom, back */
      [-1, 1].forEach(s => G.body.add(board(ts, Hc, D, bm, ox + s * (W / 2 - ts / 2), y0 + Hc / 2, oz)));
      if (!opts.noTop) G.body.add(board(W - 2 * ts, t, D, bm, ox, H - t / 2, oz));
      G.body.add(board(W - 2 * ts, t, D, bm, ox, y0 + t / 2, oz));
      G.body.add(board(W - 2 * ts, Hc - 2 * t, S.back ? t : .004, bm, ox, y0 + Hc / 2, oz - D / 2 + (S.back ? t / 2 : .002)));
      const Win = W - 2 * ts, Hin = Hc - 2 * t, zf = oz + D / 2;
      const cols = layout(tpl, Win, Hin);
      let x = ox - Win / 2;
      cols.forEach((c, ci) => {
        const cx = x + c.w / 2;
        if (ci > 0) G.body.add(board(t, Hin, D - .02, bm, x, y0 + t + Hin / 2, oz - .01));
        let y = y0 + t;
        c.cells.forEach((cell, ri) => {
          const cy = y + cell.h / 2, gap = .003;
          if (ri > 0 && (cell.k === 'open' || c.cells[ri - 1].k === 'open' || cell.k === 'glass' || c.cells[ri - 1].k === 'glass' || cell.cube)) G.body.add(board(c.w - (ci > 0 ? t / 2 : 0), t, D - .02, bm, cx, y, oz - .01));
          if (cell.k === 'door' || cell.k === 'drawer') {
            const fw = c.w + (ci === 0 ? ts : t / 2) + (ci === cols.length - 1 ? ts : t / 2) - 2 * gap - (cols.length > 1 ? 0 : 0);
            const fwx = cx + (ci === 0 ? -ts / 2 : 0) + (ci === cols.length - 1 ? ts / 2 : 0) + (ci === 0 && ci === cols.length - 1 ? 0 : 0);
            const fh = cell.h + (ri === 0 ? t : t / 2) + (ri === c.cells.length - 1 ? t : t / 2) - 2 * gap;
            const fy = cy + (ri === 0 ? -t / 2 : 0) + (ri === c.cells.length - 1 ? t / 2 : 0);
            const panelW = cols.length === 1 ? W - 2 * gap : fw, panelX = cols.length === 1 ? ox : fwx;
            const p = board(panelW, fh, .018, fm, panelX, fy, zf + .009); p.userData.front = 1; G.fronts.add(p);
            handle(G.fronts, cell.k, panelX, fy, zf + .009, panelW, fh, cell.hinge);
          } else if (cell.k === 'glass') {
            const fh = cell.h - .004, fw = c.w - .004;
            const gm = S.glass === 'tempered' ? glassTempered : glassMat;
            const p = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, .006), gm); p.position.set(cx, cy, zf + .006); p.renderOrder = 3; G.fronts.add(p);
            G.fronts.add(board(.012, Math.min(.16, fh * .3), .012, metal, cx + (cell.hinge === 'r' ? -1 : 1) * (fw / 2 - .04), cy, zf + .016));
            /* shelves behind the glass */
            const ns = Math.max(1, Math.round(cell.h / .36));
            for (let i = 1; i < ns; i++) G.body.add(board(c.w - .002, t, D - .03, bm, cx, y + i * cell.h / ns, oz - .015));
            const sh3 = board(c.w - .002, cell.h - .002, .002, interiorShade, cx, cy, oz - D / 2 + .012); sh3.castShadow = false; G.body.add(sh3);
          } else if (cell.k === 'slide') {
            const n = Math.max(2, Math.round(c.w / .6)), pw = c.w / n + .03;
            for (let i = 0; i < n; i++) {
              const px = cx - c.w / 2 + pw / 2 + i * (c.w - pw) / (n - 1);
              const pz = zf - .02 + (i % 2 ? .021 : 0);
              const p = board(pw, cell.h - .006, .016, fm, px, cy, pz); p.userData.front = 1; G.fronts.add(p);
              G.fronts.add(board(.024, .12, .006, dark, p.position.x + (i % 2 ? -1 : 1) * (pw / 2 - .05), cy, pz + .011));
            }
            G.body.add(board(c.w, .012, .045, S.rails === 'alu' ? metal : dark, cx, y + .006, zf - .01));
            G.body.add(board(c.w, .012, .045, S.rails === 'alu' ? metal : dark, cx, y + cell.h - .006, zf - .01));
          } else if (cell.k === 'open') {
            const sh2 = board(c.w - .002, cell.h - .002, .002, interiorShade, cx, cy, oz - D / 2 + .012); sh2.castShadow = false; G.body.add(sh2);
          }
          y += cell.h;
        });
        x += c.w;
      });
      /* extra shelves behind doors are invisible; cubby drawers are visible */
      if (S.drawers && tpl.t === 'cubes') {
        let k = 0; const c0 = cols, rowsN = c0[0].cells.length;
        for (let ci = 0; ci < c0.length && k < S.drawers; ci++) {
          const cw = c0[ci].w, cx = ox - Win / 2 + c0.slice(0, ci).reduce((s, c) => s + c.w, 0) + cw / 2, ch = c0[ci].cells[0].h;
          const p = board(cw - .01, ch - .01, .018, fm, cx, y0 + t + ch / 2, zf + .009); p.userData.front = 1; G.fronts.add(p);
          handle(G.fronts, 'drawer', cx, y0 + t + ch / 2, zf + .009, cw - .01, ch - .01, 'l'); k++;
          void rowsN;
        }
      }
      return { y0, cols };
    }

    /* ---- reception counter ---- */
    function buildCounter() {
      const { W, H, D, W2 } = dims, bm = bodyMat(), fm = faceMat(), t = .028, rd = .32, ws = .75;
      const corner = isCorner(S) && W2 > .3;
      const wing = (len, ox, oz, rotY) => {
        const g = new THREE.Group(); g.position.set(ox, 0, oz); g.rotation.y = rotY;
        /* front panel */
        g.add(board(len, H - t, t, bm, 0, (H - t) / 2, D / 2 - t / 2));
        /* rider (raised top) */
        g.add(board(len + .01, t, rd, fm, 0, H - t / 2, D / 2 - rd / 2 + .04));
        /* rider inner face */
        g.add(board(len, H - ws - t, t, bm, 0, ws + (H - ws - t) / 2, D / 2 - rd + .04 + t / 2));
        /* work surface */
        g.add(board(len, t, D - .05, fm, 0, ws - t / 2, -.005));
        /* decoration */
        const st = S.style === 'alucorner' ? 'alu' : (S.style || 'plain');
        if (st === 'alu') for (let y = .22; y < H - .12; y += .24) g.add(board(len - .004, .006, .004, metal, 0, y, D / 2 + .002));
        if (st === 'strips') { const n = Math.max(3, Math.round(len / .14)); for (let i = 0; i < n; i++) if (i % 2) g.add(board(len / n - .004, H - t - .06, .012, fm, -len / 2 + (i + .5) * len / n, (H - t) / 2, D / 2 + .006)); }
        G.body.add(g); return g;
      };
      if (!corner) {
        wing(W, 0, 0, 0);
        [-1, 1].forEach(sx => G.body.add(board(t, H - t, D, bm, sx * (W / 2 - t / 2), (H - t) / 2, 0)));
        G.base.add(board(W - .1, .05, D - .12, dark, 0, .025, -.03));
      } else {
        /* L shape: the main run starts after the corner; the side wing runs back from the front-left corner */
        wing(W - D, D / 2, 0, 0);
        G.body.add(board(t, H - t, D, bm, W / 2 - t / 2, (H - t) / 2, 0));
        wing(W2, -W / 2 + D / 2, D / 2 - W2 / 2, -Math.PI / 2);
        G.body.add(board(D, H - t, t, bm, -W / 2 + D / 2, (H - t) / 2, D / 2 - t / 2));
        G.body.add(board(D, H - t, t, bm, -W / 2 + D / 2, (H - t) / 2, D / 2 - W2 + t / 2));
        G.base.add(board(W - D - .05, .05, D - .12, dark, D / 2, .025, -.03));
        G.base.add(board(D - .12, .05, W2 - .05, dark, -W / 2 + D / 2 + .03, .025, D / 2 - W2 / 2));
      }
      return { y0: 0 };
    }

    /* ---- kitchenette: base run + worktop (+ upper flap cabinets) ---- */
    function buildKitchen() {
      const { W } = dims, D = .6, Hb = .9, fm = faceMat(), bm = bodyMat(), t = .018;
      const n = Math.max(1, Math.round(W / .6)), mw = W / n, pb = S.base === 'plinth' ? .1 : .02;
      /* plinth on legs, or a low kick board */
      G.base.add(board(W - .02, pb, D - .08, S.finish === 'epoxy' ? epoxyMat : dark, 0, pb / 2, -.03));
      /* carcass */
      const ch = Hb - .04 - pb;
      [-1, 1].forEach(s => G.body.add(board(t, ch, D - .02, bm, s * (W / 2 - t / 2), pb + ch / 2, -.01)));
      G.body.add(board(W, ch, .004, bm, 0, pb + ch / 2, -D / 2 + .002));
      for (let i = 0; i < n; i++) {
        const cx = -W / 2 + (i + .5) * mw, fy0 = pb, fh = ch - .006;
        if (i % 3 === 0) { for (let r = 0; r < 3; r++) { const h = fh / 3 - .003; const y = fy0 + (r + .5) * fh / 3; const p = board(mw - .004, h, .018, fm, cx, y + .003, D / 2 - .01); p.userData.front = 1; G.fronts.add(p); handle(G.fronts, 'drawer', cx, y + .003, D / 2 - .01, mw - .004, h, 'l'); } }
        else { const p = board(mw - .004, fh, .018, fm, cx, fy0 + fh / 2 + .003, D / 2 - .01); p.userData.front = 1; G.fronts.add(p); handle(G.fronts, 'door', cx, fy0 + fh / 2 + .003, D / 2 - .01, mw - .004, fh, i % 2 ? 'r' : 'l'); }
      }
      /* worktop */
      G.top.add(board(W + .01, .038, D + .02, bm, 0, Hb - .019, .0));
      /* upper flap cabinets */
      if (S.upper) {
        const uy = 1.45, uh = .7, ud = .35, uz = -D / 2 + ud / 2 + .01;
        [-1, 1].forEach(s => G.body.add(board(t, uh, ud, bm, s * (W / 2 - t / 2), uy + uh / 2, uz)));
        G.body.add(board(W - 2 * t, t, ud, bm, 0, uy + t / 2, uz)); G.body.add(board(W - 2 * t, t, ud, bm, 0, uy + uh - t / 2, uz));
        G.body.add(board(W, uh, .004, bm, 0, uy + uh / 2, -D / 2 + .012));
        for (let i = 0; i < n; i++) { const cx = -W / 2 + (i + .5) * mw; const p = board(mw - .004, uh - .006, .018, fm, cx, uy + uh / 2, uz + ud / 2 + .009); p.userData.front = 1; G.fronts.add(p);
          if (S.finish === 'epoxy' || S.handle === 'integral') G.fronts.add(board(mw * .8, .014, .022, metal, cx, uy + .007 + .003, uz + ud / 2 + .013)); else if (S.handle === 'bar') G.fronts.add(board(Math.min(.16, mw * .5), .012, .012, metal, cx, uy + .05, uz + ud / 2 + .026)); }
      }
      return { y0: 0 };
    }

    function build() {
      Object.values(G).forEach(clearGroup);
      const { W, H, D } = dims;
      let info;
      if (kind === 'counter') info = buildCounter();
      else if (kind === 'kitchen') info = buildKitchen();
      else info = buildBox(W, H, D, resolveTpl(M, S));
      void info;
      const Ht = kind === 'kitchen' ? (S.upper ? 2.15 : .9) : H, Dt = kind === 'kitchen' ? .6 : D;
      const corner = kind === 'counter' && isCorner(S);
      ao.scale.set(W + .6, (corner ? dims.W2 : Dt) + .6, 1); ao.position.z = corner ? -(dims.W2 - Dt) / 2 : 0;
      hotPts = {
        size: new THREE.Vector3(W / 2, Ht * .55, Dt / 2),
        fronts: new THREE.Vector3(-W * .18, Math.min(Ht * .62, Ht - .1), Dt / 2 + .03),
        finish: new THREE.Vector3(W * .25, Ht + .002, 0)
      };
      buildDims(W, Ht, Dt);
    }
    function buildDims(W, H, D) {
      const m = new THREE.LineBasicMaterial({ color: 0x1c1c1a, transparent: true, opacity: .75 });
      const seg = (a, b) => G.dims.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), m));
      const V = (x, y, z) => new THREE.Vector3(x, y, z), zf = D / 2 + .12, xr = W / 2 + .12, tk = .04, y = .004;
      seg(V(-W / 2, y, zf), V(W / 2, y, zf)); seg(V(-W / 2, y, zf - tk), V(-W / 2, y, zf + tk)); seg(V(W / 2, y, zf - tk), V(W / 2, y, zf + tk));
      seg(V(xr, y, -D / 2), V(xr, y, D / 2)); seg(V(xr - tk, y, -D / 2), V(xr + tk, y, -D / 2)); seg(V(xr - tk, y, D / 2), V(xr + tk, y, D / 2));
      seg(V(xr, 0, -D / 2), V(xr, H, -D / 2)); seg(V(xr - tk, H, -D / 2), V(xr + tk, H, -D / 2));
      dimLabels = [[V(0, y, zf), `${Math.round(W * 100)} ס״מ`], [V(xr, y, 0), `${Math.round(D * 100)} ס״מ`], [V(xr, H / 2, -D / 2), `${Math.round(H * 100)} ס״מ`]];
      G.dims.visible = showDims();
    }

    const SIZE = ['w', 'h', 'd', 'w2'];
    function update(k) {
      if (k === 'ral') { tweenColor(epoxyMat, byId(RAL, S.ral).hex); return; }
      if (SIZE.includes(k)) { dimT = { a: { ...dims }, b: target(), t: 0 }; return; }
      build();
    }
    function tick(dt, ease) {
      if (!dimT) return;
      dimT.t = Math.min(1, dimT.t + dt / .6); const e = ease(dimT.t);
      dims = Object.fromEntries(Object.keys(dimT.b).map(k => [k, dimT.a[k] + (dimT.b[k] - dimT.a[k]) * e]));
      build();
      if (dimT.t >= 1) { dimT = null; return 'settled'; }
    }
    function explode(ex) { G.fronts.position.z = .22 * ex; G.top.position.y = .2 * ex; G.base.position.y = -.04 * ex; }

    const height = () => kind === 'kitchen' ? (S.upper ? 2.15 : .9) : dims.H;
    return {
      build, update, tick, explode,
      dimsGroup: G.dims,
      hero: M.hero || { th: .62, ph: 1.22 },
      fitSpan: () => Math.max(dims.W * .95, height() * 1.05, (kind === 'counter' && isCorner(S) ? dims.W2 : dims.D) * 1.2, .7),
      targetY: () => height() * .48,
      maxY: () => Math.max(1.4, height()),
      clampBox: () => ({ lx: dims.W / 2 + .4, lz: Math.max(dims.D, dims.W2 || 0) / 2 + .4 }),
      views: {},
      focusView: () => 'hero',
      hotspots: (M.hotspots || [['size', 'מידות'], ['fronts', 'חזיתות'], ['finish', 'גימור']]).filter(([k]) => product.sections.some(s => s.id === k)),
      hotPts: () => hotPts,
      hotOffset: (k, ex) => k === 'fronts' ? 0 : 0,
      dimLabels: () => dimLabels,
      snapLine: () => `${S.w}×${Math.round(dims.D * 100)}×${Math.round(height() * 100)} ס״מ · ${byId(DEC, S.body).he}`
    };
  }
};
