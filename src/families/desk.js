/* Family: desk – office desks and desk frames on metal legs.
   Frame styles (model.frames[id].type): loop · trapez · posts · aframe · splay · bow · zigzag · tripod · angled · xleg · electric
   Layouts: single · row (desks side by side sharing legs, "riders") · pair (two facing desks) · bench (long double-sided table)
   State keys: frame · layout · n · w · d (cm) · top (top type or "none") · decor · fcolor (RAL id) · holes · tray · motor */
import { genTop, thumbTop } from '../engine/textures.js';

const FALLBACK = { id: '', he: '', hex: '#2b2b2d', base: '#d8d2c8', kind: 'solid' };
const byId = (arr, id) => (arr || []).find(x => x.id === id) || (arr || [])[0] || FALLBACK;
const allControls = product => product.sections.flatMap(s => s.controls);
const label = (product, k, v) => {
  const c = allControls(product).find(c => c.key === k); if (!c) return String(v);
  const o = (c.options || []).find(o => o.v === v); if (o) return o.label ?? String(o.v);
  if (c.optionsBy) for (const list of Object.values(c.optionsBy.map)) { const x = list.find(o => (o && o.v) === v); if (x) return x.label; }
  return String(v);
};
const BOARD = [280, 210];  /* melamine / formica board size in cm */
function perBoard(a, b) {
  const fit = (x, y) => Math.floor(BOARD[0] / x) * Math.floor(BOARD[1] / y);
  return Math.max(1, Math.min(4, Math.max(fit(a, b), fit(b, a))));
}
/* tops for a layout: count and size of each top (cm) */
function tops(S) {
  const L = S.w, D = S.d;
  switch (S.layout) {
    case 'row': return { n: S.n || 2, L, D };
    case 'pair': return { n: 2, L, D: D / 2 };
    case 'bench': return { n: 4, L: L / 2, D: D / 2 };
    default: return { n: 1, L, D };
  }
}

export const desk = {
  ui(product, cat, S) {
    const M = product.model || {}, F = () => (M.frames || {})[S.frame] || {};
    const DEC = (cat.decors && cat.decors.items) || [], COL = ((cat['frame-colors'] || cat.ral) || {}).items || [];
    const hasTop = () => S.top && S.top !== 'none';
    const hasRet = () => S.layout === 'single' && (S.ret === 'right' || S.ret === 'left');
    const retTxt = () => hasRet() ? ` + שלוחה ${S.rw} ס״מ ${S.ret === 'right' ? 'מימין' : 'משמאל'}` : '';
    const total = () => S.layout === 'row' ? S.w * (S.n || 2) : S.w;
    const seats = () => ({ single: 1, row: S.n || 2, pair: 2, bench: 4 }[S.layout] || 1);
    return {
      metrics: () => {
        const t = tops(S);
        return { w: S.w, d: S.d, seats: seats(), riders: S.layout === 'row' ? (S.n || 2) - 1 : 0, units: S.layout === 'row' ? (S.n || 2) : 1,
          tops: hasTop() ? t.n : 0, perBoard: perBoard(t.L, t.D), holes: hasTop() && S.holes ? t.n : 0, lengthM: total() / 100 };
      },
      outputs: () => ({
        dimtag: `${total()} × ${S.d} × 75 ס״מ<small>${F().he || ''} · ${label(product, 'layout', S.layout)}${retTxt()}</small>`,
        summary: `${total()}×${S.d}×75 · ${seats()} ${seats() > 1 ? 'עמדות' : 'עמדה'}`
      }),
      sectionValue: k => {
        if (k === 'frame') return F().he;
        if (k === 'ret') return hasRet() ? `${S.rw} ס״מ ${S.ret === 'right' ? 'מימין' : 'משמאל'}` : (S.layout === 'single' ? 'ללא' : 'רק בשולחן יחיד');
        if (k === 'size') return `${total()}×${S.d}`;
        if (k === 'top') { if (!hasTop()) return 'ללא פלטה'; const t = byId(DEC, S.decor); return `<i style="background-image:url(${thumbTop(t)})"></i>${t.he}`; }
        if (k === 'color') { const c = byId(COL, S.fcolor); return `<i style="background:${c.hex}"></i>${c.he}`; }
        if (k === 'extra') return [S.holes && 'פתחי כבלים', S.tray && 'תעלת חשמל'].filter(Boolean).join(' · ') || 'ללא';
      },
      toast: k => {
        if (k === 'decor') { const t = byId(DEC, S.decor); return [`פלטה: ${t.he}`, `background-image:url(${thumbTop(t)})`]; }
        if (k === 'fcolor') { const c = byId(COL, S.fcolor); return [`שלד: RAL ${c.id} ${c.he}`, `background:${c.hex}`]; }
        if (k === 'frame') return [`שלד ${F().he}`];
        if (['w', 'd', 'n', 'layout'].includes(k)) return [`${total()} × ${S.d} ס״מ · ${label(product, 'layout', S.layout)}`];
        if (k === 'ret' || k === 'rw') return [hasRet() ? `שלוחה ${S.rw} ס״מ ${S.ret === 'right' ? 'מימין' : 'משמאל'}, השלד רוכב עליה` : 'ללא שלוחה'];
        const c = allControls(product).find(c => c.key === k);
        if (c && c.type === 'toggle') return [`${S[k] ? 'נוסף' : 'הוסר'}: ${c.title}`];
        return [c ? `${c.label}: ${label(product, k, S[k])}` : ''];
      },
      code: () => [product.codePrefix || 'MD', String(S.frame).toUpperCase(), { single: 'S', row: 'R' + (S.n || 2), pair: 'P', bench: 'B' }[S.layout] || 'S', `${S.w}x${S.d}`, hasTop() ? String(S.top).toUpperCase() + '-' + String(S.decor).toUpperCase() : 'NOTOP', 'R' + S.fcolor, S.motor && S.frame === 'electric' ? S.motor.toUpperCase() : '', S.holes && hasTop() ? 'CNC' : '', S.tray ? 'TR' : '', hasRet() ? 'RET' + S.rw + (S.ret === 'right' ? 'R' : 'L') : ''].filter(Boolean).join('-'),
      summary: () => {
        const c = byId(COL, S.fcolor), t = byId(DEC, S.decor);
        return [`שלד ${F().he}, ${label(product, 'layout', S.layout)}`, `מידות ${total()}×${S.d}×75 ס״מ, ${seats()} ${seats() > 1 ? 'עמדות' : 'עמדה'}`,
          hasTop() ? `פלטה: ${label(product, 'top', S.top)}, ${t.he}` : 'שלד בלבד, ללא פלטה', `צבע שלד: RAL ${c.id} ${c.he}`,
          S.frame === 'electric' && S.motor ? label(product, 'motor', S.motor) : '', S.holes && hasTop() ? 'פתחי כבלים CNC' : '', S.tray ? 'תעלת חשמל' : '', hasRet() ? `שלוחה ${S.rw}×40×65 ס״מ ${S.ret === 'right' ? 'מימין' : 'משמאל'}, השלד רוכב עליה` : ''];
      }
    };
  },

  create({ THREE, scene, maxAniso, ao, S, product, cat, tweenColor, showDims }) {
    const M = product.model || {};
    const DEC = (cat.decors && cat.decors.items) || [], COL = ((cat['frame-colors'] || cat.ral) || {}).items || [];
    const F = () => (M.frames || {})[S.frame] || { type: 'posts' };
    const TOPS = M.tops || {};

    const decMats = {};
    function decMat(id) {
      if (decMats[id]) return decMats[id];
      const def = byId(DEC, id), tex = new THREE.CanvasTexture(genTop(def, 1024));
      tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = maxAniso;
      const span = def.kind === 'wood' ? 1.6 : 1.2; tex.repeat.set(1 / span, 1 / span);
      return decMats[id] = new THREE.MeshStandardMaterial({ map: tex, roughness: def.kind === 'marble' ? .28 : def.kind === 'wood' ? .6 : .5, envMapIntensity: .7 });
    }
    const metal = new THREE.MeshStandardMaterial({ color: byId(COL, S.fcolor).hex, roughness: .4, metalness: .35, envMapIntensity: .9 });
    const applyColor = instant => { const c = byId(COL, S.fcolor); if (instant) metal.color.set(c.hex); else tweenColor(metal, c.hex); metal.metalness = c.metal ? .8 : .35; metal.roughness = c.metal ? .3 : .4; };
    applyColor(true);
    const dark = new THREE.MeshStandardMaterial({ color: 0x1b1b1c, roughness: .6 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xc9cccf, roughness: .2, metalness: .95 });
    const RET_H = .65, RET_D = .40;   /* return (שלוחה): 65 cm high, 40 cm deep */
    const retOn = () => S.layout === 'single' && (S.ret === 'right' || S.ret === 'left');
    const retSide = () => S.ret === 'left' ? -1 : 1;
    const retLen = () => (Number(S.rw) || 120) / 100;

    const G = { top: new THREE.Group(), frame: new THREE.Group(), dims: new THREE.Group() };
    Object.values(G).forEach(g => scene.add(g));
    const sh = m => { m.castShadow = m.receiveShadow = true; return m; };
    const UP = new THREE.Vector3(0, 1, 0);
    /* rectangular tube between two points; sx across, sz depth of profile */
    const bar = (a, b, sx, sz, mat = metal) => { const d = new THREE.Vector3().subVectors(b, a), m = sh(new THREE.Mesh(new THREE.BoxGeometry(sx, d.length(), sz), mat)); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(UP, d.normalize()); return m; };
    /* round tube between two points, optional taper */
    const tube = (a, b, r1, r2 = r1, mat = metal) => { const d = new THREE.Vector3().subVectors(b, a), m = sh(new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, d.length(), 16), mat)); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(UP, d.normalize()); return m; };
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const box = (w, h, d, mat, x, y, z) => { const m = sh(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)); m.position.set(x, y, z); return m; };
    function rr(w, h, r) { const s = new THREE.Shape(), x = -w / 2, y = -h / 2; r = Math.min(r, w / 2, h / 2); s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }

    let dims = { L: S.w / 100, D: S.d / 100, n: S.n || 2 }, dimT = null, hotPts = {}, dimLabels = [];
    const target = () => ({ L: S.w / 100, D: S.d / 100, n: S.n || 2 });
    function clear(g) { for (let i = g.children.length - 1; i >= 0; i--) { const o = g.children[i]; g.remove(o); o.traverse(c => c.geometry && c.geometry.dispose()); } }

    /* one leg assembly at x, spanning depth Ds (centre z0); yt = underside of the top */
    function leg(type, x, Ds, yt, z0 = 0, side = 1) {
      const g = G.frame, p = .06, q = .03, zi = Ds / 2 - .05;
      switch (type) {
        case 'loop':
          [-1, 1].forEach(s => g.add(bar(V(x, 0, z0 + s * zi), V(x, yt, z0 + s * zi), q, p)));
          g.add(box(q, .03, 2 * zi + p, metal, x, yt - .015, z0));
          g.add(box(q, .03, 2 * zi + p, metal, x, .015, z0));
          break;
        case 'trapez':
          [-1, 1].forEach(s => g.add(bar(V(x, 0, z0 + s * zi), V(x, yt, z0 + s * (zi - .12)), q, p)));
          g.add(box(q, .03, 2 * zi + p, metal, x, .015, z0));
          g.add(box(q, .03, 2 * (zi - .12) + p, metal, x, yt - .015, z0));
          break;
        case 'posts':
          [-1, 1].forEach(s => g.add(box(.05, yt, .05, metal, x, yt / 2, z0 + s * zi)));
          [-1, 1].forEach(s => g.add(box(.012, .01, .05, dark, x, .005, z0 + s * zi)));
          g.add(box(.04, .04, 2 * zi, metal, x, yt - .02, z0));
          break;
        case 'aframe': {
          const top = V(x, yt, z0);
          [-1, 1].forEach(s => g.add(bar(V(x, 0, z0 + s * zi), V(x, yt, z0 + s * .1), .035, .05)));
          g.add(box(.035, .03, 2 * zi * .55, metal, x, yt * .38, z0));
          g.add(box(.035, .03, 2 * zi, metal, x, yt - .015, z0)); void top;
          break;
        }
        case 'splay':
          [-1, 1].forEach(s => g.add(tube(V(x + side * .07, 0, z0 + s * (zi + .03)), V(x, yt, z0 + s * (zi - .04)), .011, .02)));
          g.add(box(.03, .03, 2 * zi - .1, metal, x, yt - .015, z0));
          break;
        case 'bow':
          [-1, 1].forEach(s => {
            const c = new THREE.QuadraticBezierCurve3(V(x, yt, z0 + s * (zi - .05)), V(x + side * .16, yt * .45, z0 + s * (zi + .05)), V(x + side * .05, 0, z0 + s * (zi + .06)));
            g.add(sh(new THREE.Mesh(new THREE.TubeGeometry(c, 24, .018, 10), metal)));
            g.add(box(.05, .012, .05, dark, x + side * .05, .006, z0 + s * (zi + .06)));
          });
          g.add(box(.035, .035, 2 * zi, metal, x, yt - .018, z0));
          break;
        case 'zigzag': {
          [-1, 1].forEach(s => { const pts = [V(x, yt, z0 + s * zi), V(x + side * .07, yt * .66, z0 + s * zi), V(x, yt * .33, z0 + s * zi), V(x + side * .07, 0, z0 + s * zi)]; for (let i = 0; i < 3; i++) g.add(bar(pts[i], pts[i + 1], .03, .05)); });
          g.add(box(.03, .03, 2 * zi + .05, metal, x, yt - .015, z0)); g.add(box(.03, .03, 2 * zi + .05, metal, x + side * .07, .015, z0));
          break;
        }
        case 'tripod':
          [-1, 1].forEach(s => g.add(tube(V(x + side * .02, yt - .03, z0 + s * .12), V(x + side * .18, 0, z0 + s * (zi + .02)), .016)));
          g.add(tube(V(x, yt - .03, z0 - zi), V(x, yt - .03, z0 + zi), .018));
          break;
        case 'angled':
          [-1, 1].forEach(s => { g.add(bar(V(x + side * .12, 0, z0 + s * zi), V(x, yt, z0 + s * zi), .04, .04)); g.add(bar(V(x + side * .06, yt * .5, z0 + s * zi), V(x - side * .05, yt - .02, z0 + s * zi), .025, .025)); });
          g.add(box(.04, .04, 2 * zi, metal, x, yt - .02, z0));
          break;
        case 'xleg':
          g.add(bar(V(x, 0, z0 - zi), V(x, yt, z0 + zi), .04, .04)); g.add(bar(V(x, 0, z0 + zi), V(x, yt, z0 - zi), .04, .04));
          g.add(box(.04, .03, 2 * zi + .04, metal, x, yt - .015, z0));
          break;
        case 'electric': {
          g.add(box(.07, .025, Ds - .08, metal, x, .0125, z0));                                       /* foot */
          g.add(box(.07, yt * .55, .05, metal, x, .025 + yt * .275, z0 - .05));                        /* outer column */
          g.add(box(.06, yt * .5, .042, metal, x, yt * .7, z0 - .05));                                /* inner column */
          g.add(box(.05, .03, Ds - .12, metal, x, yt - .015, z0));                                    /* top arm */
          [-1, 1].forEach(s => g.add(box(.05, .012, .05, dark, x, .006, z0 + s * (Ds / 2 - .06))));
          break;
        }
        default:
          [-1, 1].forEach(s => g.add(box(.05, yt, .05, metal, x, yt / 2, z0 + s * zi)));
      }
    }
    /* beams between two leg stations */
    function beams(type, x0, x1, Ds, yt, z0 = 0) {
      const zi = Ds / 2 - .05, len = Math.abs(x1 - x0), cx = (x0 + x1) / 2;
      if (type === 'electric') { G.frame.add(box(len, .05, .05, metal, cx, yt - .06, z0 - .05)); return; }
      if (type === 'tripod') { G.frame.add(tube(V(x0, yt - .03, z0), V(x1, yt - .03, z0), .02)); return; }
      if (type === 'aframe' || type === 'bow' || type === 'splay') { G.frame.add(box(len, .03, .03, metal, cx, yt - .015, z0)); }
      [-1, 1].forEach(s => G.frame.add(box(len, .035, .02, metal, cx, yt - .02, z0 + s * (zi - .02))));
    }

    /* the return cabinet: carcass in the top's finish, fronts facing the knee space */
    function retBox(xo, xin, z0, z1, rs, rl) {
      const g = G.frame, mat = decMat(S.decor || 'oak'), xc = (xo + xin) / 2, zc = (z0 + z1) / 2, t = .018, H = RET_H;
      g.add(box(RET_D, .025, rl, mat, xc, H - .0125, zc));                        /* top */
      [z0, z1].forEach(z => g.add(box(RET_D, H - .025, t, mat, xc, (H - .025) / 2, z + (z === z0 ? t / 2 : -t / 2)))); /* ends */
      g.add(box(t, H - .025, rl - 2 * t, mat, xo - rs * t / 2, (H - .025) / 2, zc));  /* back (outer side) */
      g.add(box(RET_D - 2 * t, .018, rl - 2 * t, dark, xc, .03, zc));             /* bottom */
      g.add(box(.004, H - .06, rl - 2 * t, dark, xin + rs * .006, (H - .025) / 2 + .01, zc)); /* shadow line behind fronts */
      /* fronts: doors under the desk, a column of three drawers at the open end */
      const fx = xin - rs * .009, gap = .003, y0 = .05, y1 = H - .03, colW = .40, doorW = rl - 2 * t - colW;
      const front = (za, zb, ya, yb) => { const m = box(.018, yb - ya - gap, zb - za - gap, mat, fx, (ya + yb) / 2, (za + zb) / 2); g.add(m); return m; };
      const handleV = (z, ya, yb) => g.add(box(.012, yb - ya, .012, metal, fx - rs * .016, (ya + yb) / 2, z));
      const handleH = (za, zb, y) => g.add(box(.012, .012, zb - za, metal, fx - rs * .016, y, (za + zb) / 2));
      const zs = z0 + t, zd = zs + doorW;
      const nDoors = doorW > .55 ? 2 : 1, dw = doorW / nDoors;
      for (let i = 0; i < nDoors; i++) { const za = zs + i * dw, zb = za + dw; front(za, zb, y0, y1); handleV(nDoors === 2 ? (i === 0 ? zb - .04 : za + .04) : zb - .04, H * .55, H * .55 + .16); }
      const dh = (y1 - y0) / 3;
      for (let i = 0; i < 3; i++) { const ya = y0 + i * dh; front(zd, z1 - t, ya, ya + dh); handleH(zd + .08, z1 - t - .08, ya + dh - .045); }
      g.add(box(RET_D - .04, .05, rl - .04, dark, xc, .025, zc));                 /* recessed plinth */
    }

    function build() {
      clear(G.top); clear(G.frame); clear(G.dims);
      const { L, D } = dims, n = Math.max(1, Math.round(dims.n)), type = F().type || 'posts';
      const topDef = TOPS[S.top], tt = topDef ? (topDef.t || 25) / 1000 : 0, yt = .75 - (tt || .025);
      const lay = S.layout || 'single';
      const total = lay === 'row' ? L * n : L;
      /* leg stations */
      const inset = ['splay', 'bow', 'tripod', 'angled'].includes(type) ? .14 : .06;
      let xs;
      if (lay === 'row') xs = Array.from({ length: n + 1 }, (_, i) => -total / 2 + i * L).map((x, i, a) => i === 0 ? x + inset : i === a.length - 1 ? x - inset : x);
      else if (lay === 'bench') xs = [-total / 2 + inset, 0, total / 2 - inset];
      else xs = [-total / 2 + inset, total / 2 - inset];
      const ret = retOn(), rs = retSide(), rl = retLen();
      if (ret) {
        /* L-shape: the return replaces the leg on its side and the frame rides on it */
        const xo = rs * total / 2, xin = xo - rs * RET_D, xc = (xo + xin) / 2, z0r = -D / 2, z1r = -D / 2 + rl;
        if (rs > 0) xs[xs.length - 1] = xc; else xs[0] = xc;
        retBox(xo, xin, z0r, z1r, rs, rl);
        /* rider: short frame of the chosen profile sitting on the return's top */
        const zA = Math.max(-D / 2 + .05, z0r + .04), zB = Math.min(D / 2 - .05, z1r - .04), hr = yt - RET_H, zm = (zA + zB) / 2;
        [zA, zB].forEach(z => G.frame.add(box(.045, hr, .045, metal, xc, RET_H + hr / 2, z)));
        G.frame.add(box(.045, .03, zB - zA + .045, metal, xc, yt - .015, zm));
        G.frame.add(box(.06, .012, zB - zA + .06, metal, xc, RET_H + .006, zm));
      }
      xs.forEach((x, i) => { if (ret && ((rs > 0 && i === xs.length - 1) || (rs < 0 && i === 0))) return; leg(type, x, D, yt, 0, i === 0 ? -1 : i === xs.length - 1 ? 1 : 0); });
      for (let i = 0; i < xs.length - 1; i++) beams(type, xs[i], xs[i + 1], D, yt);
      if (lay === 'pair' || lay === 'bench') G.frame.add(box(xs[xs.length - 1] - xs[0], .04, .04, metal, (xs[0] + xs[xs.length - 1]) / 2, yt - .02, 0));
      if (S.tray) { const lt = total - .4; G.frame.add(box(lt, .004, .16, metal, 0, yt - .12, lay === 'pair' || lay === 'bench' ? 0 : -D / 2 + .14)); [-1, 1].forEach(s => G.frame.add(box(lt, .07, .004, metal, 0, yt - .085, (lay === 'pair' || lay === 'bench' ? 0 : -D / 2 + .14) + s * .08))); }
      /* tops */
      if (topDef) {
        const tm = decMat(S.decor), bev = topDef.edge === 'bevel' ? .006 : .0015;
        const place = (w, d, x, z) => {
          const g = new THREE.ExtrudeGeometry(rr(w - .004, d - .004, .006), { depth: Math.max(.004, tt - 2 * bev), bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: topDef.edge === 'bevel' ? 1 : 2, curveSegments: 4 });
          g.rotateX(-Math.PI / 2);
          const m = sh(new THREE.Mesh(g, [tm, topDef.edge === 'epoxy' ? dark : tm])); m.position.set(x, yt + bev, z); G.top.add(m);
          if (S.holes) { const h = sh(new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .003, 24), dark)); h.position.set(x + w * .32, yt + tt + .0005, z - d / 2 + .09); G.top.add(h); }
        };
        if (lay === 'row') for (let i = 0; i < n; i++) place(L, D, -total / 2 + (i + .5) * L, 0);
        else if (lay === 'pair') [-1, 1].forEach(s => place(L, D / 2, 0, s * D / 4));
        else if (lay === 'bench') [-1, 1].forEach(sx => [-1, 1].forEach(sz => place(L / 2, D / 2, sx * L / 4, sz * D / 4)));
        else place(L, D, 0, 0);
      }
      const zMax = ret ? Math.max(D / 2, -D / 2 + rl) : D / 2;
      ao.scale.set(total + .5, zMax + D / 2 + .5, 1); ao.position.z = (zMax - D / 2) / 2;
      hotPts = { frame: V(xs[xs.length - 1], .35, D / 2 - .05), top: V(-total * .25, .76, D * .15) };
      /* dimensions */
      const m = new THREE.LineBasicMaterial({ color: 0x1c1c1a, transparent: true, opacity: .75 }), seg = (a, b) => G.dims.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), m));
      const zf = zMax + .14, xr = (ret ? -rs : 1) * (total / 2 + .14), y = .004, tk = .04;
      seg(V(-total / 2, y, zf), V(total / 2, y, zf)); seg(V(-total / 2, y, zf - tk), V(-total / 2, y, zf + tk)); seg(V(total / 2, y, zf - tk), V(total / 2, y, zf + tk));
      seg(V(xr, y, -D / 2), V(xr, y, D / 2)); seg(V(xr - tk, y, -D / 2), V(xr + tk, y, -D / 2)); seg(V(xr - tk, y, D / 2), V(xr + tk, y, D / 2));
      seg(V(xr, 0, -D / 2), V(xr, .75, -D / 2)); seg(V(xr - tk, .75, -D / 2), V(xr + tk, .75, -D / 2));
      dimLabels = [[V(0, y, zf), `${Math.round(total * 100)} ס״מ`], [V(xr, y, 0), `${Math.round(D * 100)} ס״מ`], [V(xr, .375, -D / 2), '75 ס״מ']];
      if (ret) {
        const xq = rs * (total / 2 + .14), z0r = -D / 2, z1r = -D / 2 + rl;
        seg(V(xq, y, z0r), V(xq, y, z1r)); seg(V(xq - tk, y, z0r), V(xq + tk, y, z0r)); seg(V(xq - tk, y, z1r), V(xq + tk, y, z1r));
        seg(V(xq, 0, z1r), V(xq, RET_H, z1r)); seg(V(xq - tk, RET_H, z1r), V(xq + tk, RET_H, z1r));
        dimLabels.push([V(xq, y, (z0r + z1r) / 2), `שלוחה ${Math.round(rl * 100)} ס״מ`], [V(xq, RET_H / 2, z1r), '65 ס״מ']);
      }
      G.dims.visible = showDims();
    }

    function update(k) {
      if (k === 'fcolor') { applyColor(false); return; }
      if (['w', 'd', 'n'].includes(k)) { dimT = { a: { ...dims }, b: target(), t: 0 }; return; }
      if (k === 'layout') dims = target();
      build();
    }
    function tick(dt, ease) {
      if (!dimT) return;
      dimT.t = Math.min(1, dimT.t + dt / .6); const e = ease(dimT.t);
      dims = { L: dimT.a.L + (dimT.b.L - dimT.a.L) * e, D: dimT.a.D + (dimT.b.D - dimT.a.D) * e, n: dimT.t < 1 ? dimT.a.n : dimT.b.n };
      if (dimT.t >= .5) dims.n = dimT.b.n;
      build(); if (dimT.t >= 1) { dimT = null; return 'settled'; }
    }
    function explode(ex) { G.top.position.y = .28 * ex; }
    const totalLen = () => (S.layout === 'row' ? dims.L * dims.n : dims.L);
    return {
      build, update, tick, explode, dimsGroup: G.dims,
      hero: { th: .7, ph: 1.12 },
      fitSpan: () => Math.max(totalLen(), (retOn() ? Math.max(dims.D, retLen()) : dims.D) * 1.35, 1.2),
      clampBox: () => ({ lx: totalLen() / 2 + .4, lz: (retOn() ? Math.max(dims.D, retLen()) : dims.D) / 2 + .4 }),
      views: {}, focusView: () => 'hero',
      hotspots: [['frame', 'שלד'], ['top', 'פלטה']],
      hotPts: () => hotPts, hotOffset: (k, ex) => k === 'top' ? .28 * ex : 0,
      dimLabels: () => dimLabels,
      snapLine: () => `${Math.round(totalLen() * 100)}×${S.d}×75 ס״מ · ${(F().he || '')}`
    };
  }
};
