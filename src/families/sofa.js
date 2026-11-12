/* Family: sofa – upholstered sofas built from a few parametric styles.
   product.model.style:
     "block"  – seat base, arms, back (tight or loose cushions), seat cushions; legs / plinth / sled;
                optional chaise (L) at either end.
     "curved" – an arc: seat and back follow a circle (Joyce, Honey, Elora…); length = chord.
   Parts can be coloured separately (tap a part in 3D) – same S.pmode / S.pmap / S.pbase / S.psel as lounge.
   Price: per running metre of front length (+ chaise depth), so a longer sofa costs proportionally more. */

const FALLBACK = { id: '', he: '', hex: '#8a8a86' };
const byId = (arr, id) => arr.find(x => x.id === id) || arr[0] || FALLBACK;
const TEX_BASE = new URL('../catalogs/upholstery/', import.meta.url);
const LEGS = { black: { he: 'שחור', hex: '#1d1d1f', metal: true }, brass: { he: 'זהב מוברש', hex: '#b08d57', metal: true }, chrome: { he: 'כרום', hex: '#c9cccf', metal: true }, oak: { he: 'עץ אלון', hex: '#b88a5a' }, walnut: { he: 'עץ אגוז', hex: '#5b3b26' }, white: { he: 'לבן', hex: '#ecebe7' } };
const SHAPES = { straight: 'ישרה', chaiseL: 'שזלונג משמאל', chaiseR: 'שזלונג מימין' };
const fabId = S => S['f_' + (S.fcol || 'fast')];
const pmapGet = S => Object.fromEntries(String(S.pmap || '').split(';').filter(Boolean).map(x => x.split('=')));
const pmapSet = (S, m) => { S.pmap = Object.entries(m).map(([k, v]) => k + '=' + v).join(';'); };
const PART_HE = { base: 'בסיס', back: 'גב', armL: 'ידית שמאל', armR: 'ידית ימין', chaise: 'שזלונג' };
const partName = k => PART_HE[k] || (k[0] === 's' ? `כרית ישיבה ${+k.slice(1) + 1}` : k.startsWith('bc') ? `כרית גב ${+k.slice(2) + 1}` : k[0] === 'p' ? `כרית נוי ${+k.slice(1) + 1}` : k);

function lists(cat) {
  const items = n => (cat[n] && cat[n].items) || [];
  return { FAB: items('upholstery') };
}

export const sofa = {
  ui(product, cat, S) {
    const { FAB } = lists(cat), M = product.model || {};
    const fab = () => byId(FAB, fabId(S));
    const D = () => M.d || 90, H = () => M.h || 75;
    const shapeTxt = () => M.style === 'curved' ? 'מעוגלת' : SHAPES[S.shape] || SHAPES.straight;
    const run = () => S.len + (S.shape && S.shape !== 'straight' ? (M.chaiseD || 160) - D() : 0);
    const texCss = f => `background:${f.hex} url(${new URL(f.tex || '', TEX_BASE)}) center/cover`;
    return {
      metrics: () => ({ lengthM: S.len / 100, runM: run() / 100 }),
      outputs: () => ({ dimtag: `${S.len} × ${D()} × ${H()} ס״מ<small>${shapeTxt()}</small>`, summary: `${S.len}×${D()}×${H()} · ${shapeTxt()}` }),
      sectionValue: k => ({
        size: `${S.len} ס״מ · ${shapeTxt()}`,
        fabric: `<i style="${texCss(fab())}"></i>${S.pmode === 'part' ? 'בד לכל חלק' : fab().he}`,
        legs: M.base === 'plinth' ? 'בסיס על הרצפה' : `<i style="background:${(LEGS[S.leg] || LEGS.black).hex}"></i>${(LEGS[S.leg] || LEGS.black).he}`,
        extra: S.pillows ? 'כריות נוי' : 'ללא'
      }[k]),
      toast: k => {
        const f = fab();
        if (k === 'pmode') return [S.pmode === 'part' ? 'לחצו על חלק בספה ובחרו לו בד' : 'בד אחד לכל הספה'];
        if ((k === 'fcol' || k.startsWith('f_')) && S.pmode === 'part' && S.psel) return [`${partName(S.psel)}: ${f.he}`, texCss(f)];
        if (k === 'fcol' || k.startsWith('f_')) return [`בד: ${f.he}`, texCss(f)];
        if (k === 'leg') return [`רגליים: ${(LEGS[S.leg] || LEGS.black).he}`];
        if (k === 'pillows') return [S.pillows ? 'נוספו כריות נוי' : 'הוסרו כריות הנוי'];
        return [`${S.len} × ${D()} ס״מ · ${shapeTxt()}`];
      },
      code: () => `${product.codePrefix || 'SF'}-${S.len}${S.shape && S.shape !== 'straight' ? '-' + S.shape.toUpperCase() : ''}-${fab().code || fabId(S)}${S.pmode === 'part' && S.pmap ? '-MIX' + Object.keys(pmapGet(S)).length : ''}${M.base === 'plinth' ? '' : '-' + String(S.leg).toUpperCase()}${S.pillows ? '-P' : ''}`,
      summary: () => [`${product.name}, ${shapeTxt()}`, `מידות ${S.len}×${D()}×${H()} ס״מ${M.sh ? `, גובה מושב ${M.sh}` : ''}`,
        S.pmode === 'part' ? `בד בסיס: ${byId(FAB, S.pbase || fabId(S)).he}` : `בד: ${fab().he}`,
        ...(S.pmode === 'part' ? Object.entries(pmapGet(S)).sort().map(([k, v]) => `${partName(k)}: ${byId(FAB, v).he}`) : []),
        M.base === 'plinth' ? '' : `רגליים: ${(LEGS[S.leg] || LEGS.black).he}`, S.pillows ? 'כריות נוי' : '']
    };
  },

  create({ THREE, scene, maxAniso, ao, S, product, cat, tweenColor, showDims }) {
    const { FAB } = lists(cat), M = product.model || {};
    const cm = v => v / 100;
    const D = cm(M.d || 90), H = cm(M.h || 75), SH = cm(M.sh || 43);
    const AW = cm(M.armW ?? 20), AH = M.armH === 0 ? 0 : cm(M.armH || 60), BT = cm(M.backT || 22), RND = cm(M.round ?? 6);
    const LEG_H = M.base === 'plinth' ? .02 : cm(M.legH || 14), CUSH = cm(M.cushT || 14);

    /* fabrics */
    const loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
    const texCache = {}, mats = {};
    function matFor(id) {
      if (mats[id]) return mats[id];
      const it = byId(FAB, id); let t = null;
      if (it.tex) {
        t = texCache[id] = loader.load(new URL(it.tex, TEX_BASE).href);
        t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.anisotropy = maxAniso;
      }
      return mats[id] = new THREE.MeshPhysicalMaterial({ color: t ? 0xffffff : it.hex, map: t, roughness: .92, sheen: .8, sheenRoughness: .7, sheenColor: new THREE.Color(0xffffff).multiplyScalar(.25), envMapIntensity: .45 });
    }
    const partFab = key => S.pmode === 'part' ? (pmapGet(S)[key] || S.pbase || fabId(S)) : fabId(S);
    const TILE = .3;
    function worldUV(geo) {
      const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
      for (let i = 0; i < p.count; i++) {
        const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
        const u = ay > .6 ? p.getX(i) : ax > .6 ? p.getZ(i) : p.getX(i), v = ay > .6 ? p.getZ(i) : p.getY(i);
        uv.setXY(i, u / TILE, v / TILE);
      }
      uv.needsUpdate = true; return geo;
    }
    const legMat = new THREE.MeshStandardMaterial({ roughness: .4, metalness: .3 });
    function applyLeg(instant) {
      const l = LEGS[S.leg] || LEGS.black;
      if (instant) legMat.color.set(l.hex); else tweenColor(legMat, l.hex);
      legMat.metalness = l.metal ? .75 : 0; legMat.roughness = l.metal ? .3 : .6;
    }
    applyLeg(true);
    const footMat = new THREE.MeshStandardMaterial({ color: 0x141415, roughness: .7 });
    const selMat = new THREE.MeshBasicMaterial({ color: 0xf5d547, transparent: true, opacity: 0, depthWrite: false });
    let selT = 0;

    function rr(w, h, r) {
      const s = new THREE.Shape(), x = -w / 2, y = -h / 2; r = Math.max(.001, Math.min(r, w / 2 - .001, h / 2 - .001));
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
    }
    /* upholstered block: w (x) × h (y) × d (z), soft rounded edges, sitting on y=0 at its centre x/z */
    function block(w, h, d, r = RND, plan = .02) {
      const b = Math.min(r, h / 2 - .002, w / 2 - .002, d / 2 - .002);
      const g = new THREE.ExtrudeGeometry(rr(w - 2 * b, d - 2 * b, plan), { depth: Math.max(.002, h - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 5, curveSegments: 8 });
      g.rotateX(-Math.PI / 2); g.translate(0, b, 0); return worldUV(g);
    }
    const G = { body: new THREE.Group(), legs: new THREE.Group(), dims: new THREE.Group() };
    Object.values(G).forEach(g => scene.add(g));
    let dims = { L: S.len / 100 }, dimT = null, hotPts = {}, dimLabels = [];
    const clear = g => { for (let i = g.children.length - 1; i >= 0; i--) { const o = g.children[i]; g.remove(o); o.traverse(c => c.geometry && c.geometry.dispose()); } };
    function part(geo, key, x, y, z, rot) {
      const m = new THREE.Mesh(geo, matFor(partFab(key))); m.position.set(x, y, z); if (rot) m.rotation.set(...rot); m.castShadow = m.receiveShadow = true; m.userData.part = key; G.body.add(m);
      const h = new THREE.Mesh(geo, selMat); h.position.copy(m.position); h.rotation.copy(m.rotation); h.scale.setScalar(1.012); h.userData.sel = key; G.body.add(h);
      return m;
    }
    function applyFab() { G.body.children.forEach(m => { if (m.userData.part) m.material = matFor(partFab(m.userData.part)); if (m.userData.sel) m.visible = m.userData.sel === S.psel && S.pmode === 'part'; }); }

    function leg(x, z) {
      const h = LEG_H;
      if (M.base === 'plinth') return;
      if (M.legStyle === 'block') { const b = new THREE.Mesh(new THREE.BoxGeometry(.05, h, .05), legMat); b.position.set(x, h / 2, z); b.castShadow = true; G.legs.add(b); return; }
      const wood = !(LEGS[S.leg] || LEGS.black).metal, m = new THREE.Mesh(new THREE.CylinderGeometry(wood ? .02 : .012, wood ? .013 : .011, h, 14), legMat);
      m.position.set(x, h / 2, z); m.castShadow = true; G.legs.add(m);
    }
    function sled(x, d0, d1) {
      const r = .012, top = LEG_H, mk = (a, b) => { const dir = new THREE.Vector3().subVectors(b, a), len = dir.length(); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), legMat); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()); m.castShadow = true; G.legs.add(m); };
      const V = (y, z) => new THREE.Vector3(x, y, z);
      mk(V(top, d0), V(r, d0)); mk(V(r, d0), V(r, d1)); mk(V(r, d1), V(top, d1));
    }

    function buildBlock() {
      const L = dims.L, shape = S.shape || 'straight', chaiseD = cm(M.chaiseD || 160), CW = cm(M.chaiseW || 90);
      const arms = AH > 0, aw = arms ? AW : 0, baseY = LEG_H, baseH = Math.max(.06, SH - CUSH - baseY);
      const z0 = -D / 2, backZ = z0 + BT / 2, seatD = D - BT;
      /* base under the whole straight part */
      part(block(L - 2 * aw + .02, baseH, D - .02, .02), 'base', 0, baseY, 0);
      /* chaise: an extra deep seat at one end, no back over it */
      const ch = shape === 'chaiseL' ? -1 : shape === 'chaiseR' ? 1 : 0;
      if (ch) {
        const cx = ch * (L / 2 - CW / 2), cz = z0 + chaiseD / 2;
        part(block(CW - .01, baseH, chaiseD, .02), 'chaise', cx, baseY, cz);
        part(block(CW - .03, CUSH, chaiseD - .03 - (D - seatD) * 0, RND * 1.4), 'chaise', cx, baseY + baseH, cz + .01);
      }
      /* arms (none on the chaise side) */
      if (arms) [-1, 1].forEach(s => {
        if (s === ch) return;
        const r = M.armShape === 'round' ? Math.min(aw / 2 - .005, .16) : M.armShape === 'slim' ? .02 : RND;
        part(block(aw, AH - baseY, D, r), s < 0 ? 'armL' : 'armR', s * (L / 2 - aw / 2), baseY, 0);
      });
      /* back: frame, and loose cushions in front of it when the model has them */
      const bx0 = -L / 2 + aw + (ch < 0 ? CW - aw : 0), bx1 = L / 2 - aw - (ch > 0 ? CW - aw : 0), bw = bx1 - bx0;
      const loose = M.back === 'cushion', frameH = loose ? H - baseY - .08 : H - baseY;
      part(block(bw + (arms ? .0 : 0), frameH, BT, RND), 'back', (bx0 + bx1) / 2, baseY, backZ);
      /* seat cushions over the straight part (not over the chaise) */
      const sx0 = -L / 2 + aw + (ch < 0 ? CW - aw : 0), sx1 = L / 2 - aw - (ch > 0 ? CW - aw : 0), sw = sx1 - sx0;
      const n = M.bench ? 1 : Math.max(1, Math.round(sw / (cm(M.seatW || 70))));
      const cw = sw / n;
      for (let i = 0; i < n; i++) {
        const x = sx0 + (i + .5) * cw;
        part(block(cw - .008, CUSH, seatD - .01, RND * 1.4), 's' + i, x, baseY + baseH, z0 + BT + seatD / 2);
        if (loose) {
          const bh = H - SH + .02, bt = .17, m = part(block(cw - .02, bh, bt, .07), 'bc' + i, x, SH - .02, z0 + BT + bt / 2 - .02);
          m.rotation.x = -.1;
        }
      }
      /* decorative pillows */
      if (S.pillows) [-1, 1].forEach((s, i) => { const m = part(block(.44, .42, .13, .06), 'p' + i, s * (sw / 2 - .3) + (sx0 + sx1) / 2, SH - .01, z0 + BT + (loose ? .2 : .1)); m.rotation.set(-.25, s * .2, s * .05); });
      /* legs */
      if (M.base === 'sled') { [-1, 1].forEach(s => sled(s * (L / 2 - .12), z0 + .08, -z0 - .08)); }
      else {
        const xs = [-L / 2 + .07, L / 2 - .07]; if (L > 2.2) xs.push(0);
        xs.forEach(x => [z0 + .07, -z0 - .07].forEach(z => leg(x, z)));
        if (ch) leg(ch * (L / 2 - .07), z0 + chaiseD - .07), leg(ch * (L / 2 - CW + .07), z0 + chaiseD - .07);
      }
      hotPts = { fabric: new THREE.Vector3((sx0 + sx1) / 2, SH + .01, .1), legs: new THREE.Vector3(-L / 2 + .07, LEG_H / 2, -z0 - .07) };
      return { W: L, Dz: ch ? chaiseD : D, zc: ch ? z0 + chaiseD / 2 : 0 };
    }

    function buildCurved() {
      /* chord L, sagitta from model.bow (fraction of L) → radius */
      const L = dims.L, bow = M.bow || .22, sag = L * bow, R = (L * L / 4 + sag * sag) / (2 * sag), th = 2 * Math.asin(Math.min(1, L / 2 / R));
      const cz = R - (sag + D) / 2;   /* circle centre in front; the arc bulges back (−z), the whole footprint centred */
      const ring = (r0, r1, a0, a1) => { const s = new THREE.Shape(); s.absarc(0, 0, r1, a0, a1, false); s.absarc(0, 0, r0, a1, a0, true); s.closePath(); return s; };
      const mkRing = (r0, r1, h, bevel) => {
        const g = new THREE.ExtrudeGeometry(ring(r0, r1, -Math.PI / 2 - th / 2, -Math.PI / 2 + th / 2), { depth: Math.max(.002, h - 2 * bevel), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 48 });
        g.rotateX(Math.PI / 2); g.translate(0, h - bevel, 0); return worldUV(g);
      };
      const baseY = LEG_H, baseH = Math.max(.06, SH - CUSH - baseY), Rout = R + 0, Rin = R - D;
      part(mkRing(Rin, Rout, baseH, .03), 'base', 0, baseY, cz);
      part(mkRing(Rin + .01, Rout - BT, CUSH, RND), 's0', 0, baseY + baseH, cz);
      part(mkRing(Rout - BT, Rout, H - baseY, RND * 1.2), 'back', 0, baseY, cz);
      if (M.base !== 'plinth') for (let i = 0; i <= 3; i++) {
        const a = -Math.PI / 2 - th / 2 + (i / 3) * th, cos = Math.cos(a), sin = Math.sin(a);
        [Rin + .1, Rout - .1].forEach(r => leg(r * cos, cz + r * sin));
      }
      hotPts = { fabric: new THREE.Vector3(0, SH + .01, cz - R + D * .6), legs: new THREE.Vector3(L / 2 - .1, LEG_H / 2, 0) };
      return { W: L, Dz: sag + D, zc: 0 };
    }

    function build() {
      Object.values(G).forEach(clear);
      const r = M.style === 'curved' ? buildCurved() : buildBlock();
      ao.scale.set(r.W + .8, r.Dz + .8, 1); ao.position.z = r.zc;
      buildDims(r.W, r.Dz, r.zc); applyFab();
      ext = r;
    }
    let ext = { W: dims.L, Dz: D, zc: 0 };
    function buildDims(W, Dz, zc) {
      const m = new THREE.LineBasicMaterial({ color: 0x1c1c1a, transparent: true, opacity: .75 }), V = (x, y, z) => new THREE.Vector3(x, y, z);
      const seg = (a, b) => G.dims.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), m));
      const zf = zc + Dz / 2 + .16, xr = W / 2 + .16, y = .004, tk = .05;
      seg(V(-W / 2, y, zf), V(W / 2, y, zf)); seg(V(-W / 2, y, zf - tk), V(-W / 2, y, zf + tk)); seg(V(W / 2, y, zf - tk), V(W / 2, y, zf + tk));
      seg(V(xr, y, zc - Dz / 2), V(xr, y, zc + Dz / 2)); seg(V(xr - tk, y, zc - Dz / 2), V(xr + tk, y, zc - Dz / 2)); seg(V(xr - tk, y, zc + Dz / 2), V(xr + tk, y, zc + Dz / 2));
      seg(V(xr, 0, zc - Dz / 2), V(xr, H, zc - Dz / 2)); seg(V(xr - tk, H, zc - Dz / 2), V(xr + tk, H, zc - Dz / 2));
      dimLabels = [[V(0, y, zf), `${Math.round(W * 100)} ס״מ`], [V(xr, y, zc), `${Math.round(Dz * 100)} ס״מ`], [V(xr, H / 2, zc - Dz / 2), `${Math.round(H * 100)} ס״מ`]];
      G.dims.visible = showDims();
    }

    let resizing = false;
    function update(k) {
      resizing = false;
      if (k === 'pmode') { if (S.pmode !== 'part') { S.pmap = ''; S.psel = ''; S.pbase = ''; } else { S.pbase = S.pbase || fabId(S); if (!S.psel) S.psel = 's0'; } applyFab(); return; }
      if (k.startsWith('f_') && S.pmode === 'part' && S.psel) { const m = pmapGet(S); m[S.psel] = fabId(S); pmapSet(S, m); applyFab(); return; }
      if (k === 'fcol' || k.startsWith('f_')) { applyFab(); return; }
      if (k === 'leg') { applyLeg(false); return; }
      if (k === 'len') { dimT = { a: dims.L, b: S.len / 100, t: 0 }; resizing = true; return; }
      build();
    }
    function tick(dt, ease) {
      selT += dt; selMat.opacity = S.pmode === 'part' && S.psel ? .26 + .14 * Math.sin(selT * 4) : 0;
      if (!dimT) return;
      dimT.t = Math.min(1, dimT.t + dt / .6); dims = { L: dimT.a + (dimT.b - dimT.a) * ease(dimT.t) }; build();
      if (dimT.t >= 1) { dimT = null; return 'settled'; }
    }
    function explode(ex) { G.body.children.forEach(m => { const k = m.userData.part || m.userData.sel; if (!k) return; const lift = k === 'base' ? 0 : k[0] === 's' || k === 'chaise' ? .12 : k.startsWith('bc') || k[0] === 'p' ? .3 : .06; if (m.userData.y0 === undefined) m.userData.y0 = m.position.y; m.position.y = m.userData.y0 + lift * ex; }); }

    return {
      build, update, tick, explode,
      isResizing: () => resizing,
      dimsGroup: G.dims,
      fitSpan: () => Math.max(ext.W, ext.Dz * 1.5, 1.3),
      clampBox: () => ({ lx: ext.W / 2 + .5, lz: ext.Dz / 2 + .5 }),
      hero: { th: .62, ph: 1.12 },
      views: {},
      focusView: () => 'hero',
      hotspots: [['fabric', 'בד'], ['legs', 'רגליים']],
      hotPts: () => hotPts,
      hotOffset: (k, ex) => k === 'fabric' ? .12 * ex : 0,
      dimLabels: () => dimLabels,
      pick: p => {
        if (S.pmode !== 'part') { S.pmode = 'part'; S.pbase = fabId(S); }
        S.psel = p;
        const f = byId(FAB, partFab(p)); if (f.col) { S.fcol = f.col; S['f_' + f.col] = f.id; }
        applyFab();
        return { section: 'fabric', text: `נבחר: ${partName(p)} · בחרו לו בד`, sw: `background:${f.hex} url(${new URL(f.tex || '', TEX_BASE)}) center/cover` };
      },
      snapLine: () => `${S.len} ס״מ · ${byId(FAB, fabId(S)).he}`
    };
  }
};
