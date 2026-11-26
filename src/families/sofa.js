import { easeBox } from '../engine/geo.js';
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
const LEGS = { taupe: { he: 'שמפניה', hex: '#a39a8d', metal: true }, black: { he: 'שחור', hex: '#1d1d1f', metal: true }, brass: { he: 'זהב מוברש', hex: '#b08d57', metal: true }, chrome: { he: 'כרום', hex: '#c9cccf', metal: true }, oak: { he: 'עץ אלון', hex: '#b88a5a' }, walnut: { he: 'עץ אגוז', hex: '#5b3b26' }, white: { he: 'לבן', hex: '#ecebe7' } };
const SHAPES = { straight: 'ישרה', chaiseL: 'שזלונג משמאל', chaiseR: 'שזלונג מימין' };
const fabId = S => S['f_' + (S.fcol || 'fast')];
const pmapGet = S => Object.fromEntries(String(S.pmap || '').split(';').filter(Boolean).map(x => x.split('=')));
const pmapSet = (S, m) => { S.pmap = Object.entries(m).map(([k, v]) => k + '=' + v).join(';'); };
const PART_HE = { seat: 'מושב', end: 'קצה מעוגל', base: 'בסיס', back: 'גב', armL: 'ידית שמאל', armR: 'ידית ימין', chaise: 'שזלונג' };
const BACKS = { photo: 'כמו בתמונה', all: 'גב לכל מודול', alt: 'גבות לסירוגין', none: 'ללא גב' };
const partName = k => PART_HE[k] || (k.startsWith('mb') ? `גב מודול ${+k.slice(2) + 1}` : k[0] === 'm' ? `מודול ${+k.slice(1) + 1}` : k[0] === 's' ? `כרית ישיבה ${+k.slice(1) + 1}` : k.startsWith('bc') ? `כרית גב ${+k.slice(2) + 1}` : k[0] === 'p' ? `כרית נוי ${+k.slice(1) + 1}` : k);

function lists(cat) {
  const items = n => (cat[n] && cat[n].items) || [];
  return { FAB: items('upholstery') };
}

export const sofa = {
  ui(product, cat, S) {
    const { FAB } = lists(cat), M = product.model || {};
    const fab = () => byId(FAB, fabId(S));
    const D = () => M.d || 90, H = () => M.h || 75;
    const shapeTxt = () => M.style === 'corner' ? 'פינתית' : M.style === 'curved' || M.style === 'shell' ? 'מעוגלת' : SHAPES[S.shape] || SHAPES.straight;
    const run = () => S.len + (S.shape && S.shape !== 'straight' ? (M.chaiseD || 160) - D() : 0);
    const texCss = f => `background:${f.hex} url(${new URL(f.tex || '', TEX_BASE)}) center/cover`;
    return {
      metrics: () => ({ lengthM: S.len / 100, runM: run() / 100 }),
      outputs: () => ({ dimtag: `${S.len} × ${D()} × ${H()} ס״מ<small>${shapeTxt()}</small>`, summary: `${S.len}×${D()}×${H()} · ${shapeTxt()}` }),
      sectionValue: k => ({
        size: M.style === 'modules' ? `${S.len} ס״מ · ${Math.max(1, Math.round(S.len / (M.modW || 90)))} מודולים` : `${S.len} ס״מ · ${shapeTxt()}`,
        backs: BACKS[S.backs] || BACKS.photo,
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
        M.style === 'modules' ? `${Math.max(1, Math.round(S.len / (M.modW || 90)))} מודולים, ${BACKS[S.backs] || BACKS.photo}` : '',
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
    const mats = {};
    function matFor(id) {
      if (mats[id]) return mats[id];
      const it = byId(FAB, id);
      /* the swatch photos are too small to tile (mirrored, they read as a kaleidoscope), so the cloth is the swatch's colour
         over one shared seamless bouclé grain that also drives the bump */
      const m = new THREE.MeshPhysicalMaterial({ color: it.hex, map: weave(), bumpMap: weave(), bumpScale: 1.6, roughness: .95, sheen: .7, sheenRoughness: .75, sheenColor: new THREE.Color(it.hex).lerp(new THREE.Color(0xffffff), .55).multiplyScalar(.3), envMapIntensity: .4, side: THREE.DoubleSide });
      return mats[id] = m;
    }
    let weaveT = null;
    function weave() {
      if (weaveT) return weaveT;
      const n = 256, c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d');
      x.fillStyle = '#e9e9e9'; x.fillRect(0, 0, n, n);
      let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 5200; i++) {
        const px = rnd() * n, py = rnd() * n, r = 1.1 + rnd() * 2.2, v = 205 + Math.round(rnd() * 50);
        x.fillStyle = `rgba(${v},${v},${v},.75)`;
        for (const ox of [-n, 0, n]) for (const oy of [-n, 0, n]) { x.beginPath(); x.arc(px + ox, py + oy, r, 0, 7); x.fill(); }
      }
      weaveT = new THREE.CanvasTexture(c); weaveT.colorSpace = THREE.SRGBColorSpace; weaveT.wrapS = weaveT.wrapT = THREE.RepeatWrapping; weaveT.anisotropy = maxAniso;
      return weaveT;
    }
    const partFab = key => S.pmode === 'part' ? (pmapGet(S)[key] || S.pbase || fabId(S)) : fabId(S);
    const TILE = .16;   /* a swatch photo covers about 16 cm: the weave reads as cloth, not as a pattern */
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
      if (M.legStyle === 'cone') { const m = new THREE.Mesh(new THREE.CylinderGeometry(.021, .008, h, 18), legMat); m.position.set(x, h / 2, z); m.castShadow = true; G.legs.add(m); return; }   /* tapered foot (Lento) */
      if (M.legStyle === 'splay') {   /* round leg leaning outwards (wood or metal) */
        const o = new THREE.Vector3(Math.sign(x) || 0, 0, Math.sign(z) || 0).normalize().multiplyScalar(h * .32), a = new THREE.Vector3(x, h, z), b2 = new THREE.Vector3(x, 0, z).add(o), dir = new THREE.Vector3().subVectors(b2, a), len = dir.length();
        const m = new THREE.Mesh(new THREE.CylinderGeometry(.011, .019, len, 16), legMat); m.position.copy(a).add(b2).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()); m.castShadow = true; G.legs.add(m); return;
      }
      if (M.legStyle === 'block') { const lt = cm(M.legT || 5); const b = new THREE.Mesh(easeBox(new THREE.BoxGeometry(lt, h, lt)), legMat); b.position.set(x, h / 2, z); b.castShadow = true; G.legs.add(b); return; }
      const wood = !(LEGS[S.leg] || LEGS.black).metal, m = new THREE.Mesh(new THREE.CylinderGeometry(wood ? .02 : .012, wood ? .013 : .011, h, 14), legMat);
      m.position.set(x, h / 2, z); m.castShadow = true; G.legs.add(m);
    }
    function bar(a, b, r) { const dir = new THREE.Vector3().subVectors(b, a), len = dir.length(); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), legMat); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()); m.castShadow = true; G.legs.add(m); }
    function tleg(x, d0, d1) {   /* front and back post, a rail under the seat, a brace from the front foot back to the rail */
      const top = LEG_H, V = (y, z) => new THREE.Vector3(x, y, z), r = .013;
      bar(V(0, d1), V(top, d1), r); bar(V(0, d0), V(top, d0), r); bar(V(top - .01, d0), V(top - .01, d1), r * .9);
      if (M.brace !== false) bar(V(.03, d1 - .02), V(top - .01, (d0 + d1) / 2), r * .8);
      [d0, d1].forEach(z => { const f = new THREE.Mesh(new THREE.CylinderGeometry(.016, .016, .008, 12), footMat); f.position.set(x, .004, z); G.legs.add(f); });
    }
    function sled(x, d0, d1) {
      const r = .012, top = LEG_H, mk = (a, b) => { const dir = new THREE.Vector3().subVectors(b, a), len = dir.length(); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), legMat); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()); m.castShadow = true; G.legs.add(m); };
      const V = (y, z) => new THREE.Vector3(x, y, z);
      mk(V(top, d0), V(r, d0)); mk(V(r, d0), V(r, d1)); mk(V(r, d1), V(top, d1));
    }

    function buildBlock() {
      const L = M.roundEnd ? dims.L - D / 2 : dims.L, shape = S.shape || 'straight', chaiseD = cm(M.chaiseD || 160), CW = cm(M.chaiseW || 90);
      const arms = AH > 0, aw = arms ? AW : 0, awL = M.oneArm === 'R' ? 0 : aw, awR = M.oneArm === 'L' ? 0 : aw, baseY = LEG_H, baseH = Math.max(.06, SH - CUSH - baseY);
      const z0 = -D / 2, backZ = z0 + BT / 2, seatD = D - BT;
      /* base under the whole straight part */
      const solid = M.seat === 'solid';
      if (!solid) part(block(L - awL - awR + .02, baseH, D - .02, .02), 'base', (awL - awR) / 2, baseY, 0);
      /* chaise: an extra deep seat at one end, no back over it */
      const ch = shape === 'chaiseL' ? -1 : shape === 'chaiseR' ? 1 : 0;
      if (ch) {
        const cx = ch * (L / 2 - CW / 2), cz = z0 + chaiseD / 2;
        part(block(CW - .006, SH - baseY, chaiseD, RND), 'chaise', cx, baseY, cz);   /* one piece, like the seat */
      }
      /* arms (none on the chaise side) */
      if (arms) [-1, 1].forEach(s => {
        if (s === ch || (s < 0 ? awL : awR) === 0) return;
        if (M.armShape === 'panel') {   /* wedge panel: outer face vertical, inner face leaning out towards the top */
          const h = AH - baseY, t0 = aw, t1 = Math.max(.03, aw * .4), sh = new THREE.Shape();
          sh.moveTo(0, 0); sh.lineTo(t0, 0); sh.lineTo(t1, h); sh.lineTo(0, h); sh.closePath();
          const g = new THREE.ExtrudeGeometry(sh, { depth: D - .01, bevelEnabled: true, bevelThickness: .004, bevelSize: .004, bevelSegments: 2 });
          g.translate(0, 0, -(D - .01) / 2); worldUV(g);
          const m = part(g, s < 0 ? 'armL' : 'armR', s * L / 2, baseY, 0); if (s > 0) m.rotation.y = Math.PI;
          return;
        }
        const r = M.armShape === 'round' ? Math.min(aw / 2 - .005, .16) : M.armShape === 'slim' ? .02 : RND;
        part(block(aw, AH - baseY, D, r), s < 0 ? 'armL' : 'armR', s * (L / 2 - aw / 2), baseY, 0);
      });
      if (M.sidePanel) [-1, 1].forEach(sd => {   /* tall thin screens at both ends (Juan), corners rounded in side view */
        const ph = H + .08, pd = D + .1, pt = .045, g = new THREE.ExtrudeGeometry(rr(pd - .012, ph - .012, cm(M.panelR ?? 12)), { depth: pt - .012, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 3, curveSegments: 12 });
        g.translate(0, 0, -(pt - .012) / 2); g.rotateY(Math.PI / 2); g.computeVertexNormals(); worldUV(g);
        part(g, sd < 0 ? 'armL' : 'armR', sd * (L / 2 + pt / 2 + .004), .02 + ph / 2, 0);
      });   /* tall thin screens at both ends (Juan) */
      /* back: frame, and loose cushions in front of it when the model has them */
      const bx0 = -L / 2 + awL + (ch < 0 ? CW - awL : 0), bx1 = L / 2 - awR - (ch > 0 ? CW - awR : 0), bw = bx1 - bx0;
      const loose = M.back === 'cushion', frameH = loose ? H - baseY - .08 : H - baseY;
      if (M.back === 'panel') {   /* one leaning wedge per seat: thick at the seat, thin at the top */
        const np = Math.max(1, Math.round(bw / cm(M.seatW || 70))), pw = bw / np, h = H - baseY, t0 = BT, t1 = Math.max(.04, BT * .35);
        for (let i = 0; i < np; i++) {
          const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(t0, 0); sh.lineTo(t1, h); sh.lineTo(0, h); sh.closePath();
          const g = new THREE.ExtrudeGeometry(sh, { depth: pw - .006, bevelEnabled: true, bevelThickness: .004, bevelSize: .004, bevelSegments: 2 });
          g.translate(0, 0, -(pw - .006) / 2); g.rotateY(-Math.PI / 2); worldUV(g);
          part(g, 'back', bx0 + (i + .5) * pw, baseY, z0);
        }
      } else if (!M.channel) part(block(bw + (arms ? .0 : 0), frameH, BT, RND), 'back', (bx0 + bx1) / 2, baseY, backZ);
      /* seat cushions over the straight part (not over the chaise) */
      const sx0 = -L / 2 + awL + (ch < 0 ? CW - awL : 0), sx1 = L / 2 - awR - (ch > 0 ? CW - awR : 0), sw = sx1 - sx0;
      const n = M.bench ? 1 : Math.max(1, Math.round(sw / (cm(M.seatW || 70))));
      const cw = sw / n;
      for (let i = 0; i < n; i++) {
        const x = sx0 + (i + .5) * cw;
        if (solid) part(block(cw - .006, SH - baseY, seatD, RND), M.channel ? 'seat' : 's' + i, x, baseY, z0 + BT + seatD / 2);
        else part(block(cw - (M.channel ? .004 : .008), CUSH, seatD - .01, M.channel ? Math.min(cw / 2 - .006, .06) : RND * 1.4), 's' + i, x, baseY + baseH, z0 + BT + seatD / 2);
        if (M.channel) part(block(cw - .004, H - baseY, BT, Math.min(cw / 2 - .006, .06)), 'back', x, baseY, backZ);
        if (loose) {
          const bh = H - SH + .02, bt = .17, m = part(block(cw - .02, bh, bt, .07), 'bc' + i, x, SH - .02, z0 + BT + bt / 2 - .02);
          m.rotation.x = -.1;
        }
      }
      if (M.roundEnd) {
        const rr0 = D / 2, g = new THREE.ExtrudeGeometry((() => { const sh = new THREE.Shape(); sh.moveTo(0, -rr0); sh.absarc(0, 0, rr0, -Math.PI / 2, Math.PI / 2, false); sh.lineTo(0, -rr0); return sh; })(), { depth: SH - baseY - .04, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 4, curveSegments: 32 });
        g.rotateX(-Math.PI / 2); g.translate(0, .02, 0); worldUV(g);
        part(g, 'end', L / 2, baseY, 0);
      }
      /* decorative pillows */
      if (S.pillows) [-1, 1].forEach((s, i) => { const m = part(block(.44, .42, .13, .06), 'p' + i, s * (sw / 2 - .3) + (sx0 + sx1) / 2, SH - .01, z0 + BT + (loose ? .2 : .1)); m.rotation.set(-.25, s * .2, s * .05); });
      /* legs */
      if (M.base === 'sled') { [-1, 1].forEach(s => sled(s * (L / 2 - .12), z0 + .08, -z0 - .08)); }
      else if (M.legStyle === 'plank') { const ins = cm(M.legInset || 25); [-1, 1].forEach(s => { const b = new THREE.Mesh(easeBox(new THREE.BoxGeometry(.035, LEG_H, D * .72)), legMat); b.position.set(s * (L / 2 - ins), LEG_H / 2, 0); b.castShadow = true; G.legs.add(b); }); }
      else if (M.legStyle === 'tleg') { const ins = cm(M.legInset || 22); [-1, 1].forEach(s => tleg(s * (L / 2 - ins), z0 + .08, -z0 - .1)); }
      else {
        const xs = [-L / 2 + .07, L / 2 - .07]; if (L > 2.2) xs.push(0);
        xs.forEach(x => [z0 + .07, -z0 - .07].forEach(z => leg(x, z)));
        if (ch) leg(ch * (L / 2 - .07), z0 + chaiseD - .07), leg(ch * (L / 2 - CW + .07), z0 + chaiseD - .07);
      }
      hotPts = { fabric: new THREE.Vector3((sx0 + sx1) / 2, SH + .01, .1), legs: new THREE.Vector3(-L / 2 + .07, LEG_H / 2, -z0 - .07) };
      return { W: L + (M.roundEnd ? D / 2 : 0), Dz: ch ? chaiseD : D, zc: ch ? z0 + chaiseD / 2 : 0 };
    }

    function buildModules() {
      /* separate upholstered cubes (Bully): a solid seat block per module, a back block on some of them */
      const L = dims.L, n = Math.max(1, Math.round(L / cm(M.modW || 90))), w = L / n, base = M.base === 'legs' ? LEG_H : .015, z0 = -D / 2;
      if (M.base === 'legs') { const xs = [-L / 2 + .09, L / 2 - .09]; if (L > 2.4) xs.push(0); xs.forEach(x => [z0 + .09, -z0 - .09].forEach(z => leg(x, z))); }
      const pat = S.backs === 'all' ? '1' : S.backs === 'none' ? '0' : S.backs === 'alt' ? '10' : (M.backPattern || '1');
      for (let i = 0; i < n; i++) {
        const x = -L / 2 + (i + .5) * w;
        part(block(w - .006, SH - base, D, RND), 'm' + i, x, base, 0);
        if (pat[i % pat.length] === '1') part(block(w - .01, H - SH, BT, RND), 'mb' + i, x, SH, z0 + BT / 2);
      }
      hotPts = { fabric: new THREE.Vector3(-L / 2 + w / 2, SH + .01, .1), legs: new THREE.Vector3(0, .01, D / 2) };
      return { W: L, Dz: D, zc: 0 };
    }

    function buildCurved() {
      /* chord L, sagitta from model.bow (fraction of L) → radius */
      const L = dims.L * (M.chordK || 1), bow = M.bow || .22, sag = L * bow, R = (L * L / 4 + sag * sag) / (2 * sag), th = 2 * Math.asin(Math.min(1, L / 2 / R));
      const cz = R - (sag + D) / 2;   /* circle centre in front; the arc bulges back (−z), the whole footprint centred */
      const ring = (r0, r1, a0, a1) => { const s = new THREE.Shape(); s.absarc(0, 0, r1, a0, a1, false); s.absarc(0, 0, r0, a1, a0, true); s.closePath(); return s; };
      const mkRing = (r0, r1, h, bevel) => {
        const g = new THREE.ExtrudeGeometry(ring(r0, r1, -Math.PI / 2 - th / 2, -Math.PI / 2 + th / 2), { depth: Math.max(.002, h - 2 * bevel), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 48 });
        g.rotateX(Math.PI / 2); g.translate(0, h - bevel, 0); return worldUV(g);
      };
      const baseY = LEG_H, baseH = Math.max(.06, SH - CUSH - baseY), Rout = R + 0, Rin = R - D; let tail = null;
      const nseg = M.segs || 1, gap = nseg > 1 ? .008 / R : 0;
      for (let i = 0; i < nseg; i++) {
        const a0 = -Math.PI / 2 - th / 2 + i * th / nseg + gap, a1 = a0 + th / nseg - 2 * gap;
        const seg = (r0, r1, h, bevel) => { const g = new THREE.ExtrudeGeometry(ring(r0, r1, a0, a1), { depth: Math.max(.002, h - 2 * bevel), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 24 }); g.rotateX(Math.PI / 2); g.translate(0, h - bevel, 0); return worldUV(g); };
        part(seg(Rin, Rout - BT + .01, SH - baseY, Math.min(RND, .06)), 's' + i, 0, baseY, cz);   /* seat in one piece down to the floor line */
        part(seg(Rout - BT, Rout, H - baseY, RND * 1.2), nseg > 1 ? 'bc' + i : 'back', 0, baseY, cz);
      }
      if (M.sR) {   /* S shape: a second, gentler arc leaves the right end and bends the other way; the back stays on the same side */
        const aE = -Math.PI / 2 + th / 2, Rm = R - D / 2, Rb = cm(M.sR), bx = (Rm + Rb) * Math.cos(aE), bz = (Rm + Rb) * Math.sin(aE), sweep = (dims.L - L) / Rb, b1 = aE + Math.PI, b0 = b1 - sweep;
        const mk = (r0, r1, h, bevel) => { const g = new THREE.ExtrudeGeometry(ring(r0, r1, b0, b1), { depth: Math.max(.002, h - 2 * bevel), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 48 }); g.rotateX(Math.PI / 2); g.translate(0, h - bevel, 0); return worldUV(g); };
        part(mk(Rb - D / 2 + BT - .01, Rb + D / 2, SH - baseY, Math.min(RND, .06)), 's' + nseg, bx, baseY, cz + bz);
        part(mk(Rb - D / 2, Rb - D / 2 + BT, H - baseY, RND * 1.2), 'back', bx, baseY, cz + bz);
        if (M.base !== 'plinth') for (let i = 1; i <= 4; i++) { const a = b1 - (i / 4) * sweep; [Rb - D / 2 + .1, Rb + D / 2 - .1].forEach(r => leg(bx + r * Math.cos(a), cz + bz + r * Math.sin(a))); }
        tail = { x: bx + Rb * Math.cos(b0), z: bz + Rb * Math.sin(b0) };
      }
      if (M.base !== 'plinth') for (let i = 0; i <= 3; i++) {
        const a = -Math.PI / 2 - th / 2 + (i / 3) * th, cos = Math.cos(a), sin = Math.sin(a);
        if (M.legStyle === 'spider') { const rm = (Rin + Rout) / 2, top = new THREE.Vector3(rm * cos, LEG_H, cz + rm * sin); [Rin + .06, Rout - .06].forEach(r => { bar(new THREE.Vector3(r * cos, 0, cz + r * sin), top, .009); const ft = new THREE.Mesh(new THREE.CylinderGeometry(.014, .014, .006, 12), footMat); ft.position.set(r * cos, .003, cz + r * sin); G.legs.add(ft); }); }
        else [Rin + .1, Rout - .1].forEach(r => leg(r * cos, cz + r * sin));
      }
      hotPts = { fabric: new THREE.Vector3(0, SH + .01, cz - R + D * .6), legs: new THREE.Vector3(L / 2 - .1, LEG_H / 2, 0) };
      if (tail) { const xmin = -L / 2, xmax = Math.max(L / 2, tail.x + D / 2), zmin = Math.min(-(sag + D) / 2, cz + tail.z - D / 2), zmax = Math.max((sag + D) / 2, cz + tail.z + D / 2); [G.body, G.legs].forEach(gr => { gr.position.x = -(xmin + xmax) / 2; }); return { W: xmax - xmin, Dz: zmax - zmin, zc: (zmax + zmin) / 2 }; }
      return { W: L, Dz: sag + D, zc: 0 };
    }

    /* "shell": one soft body whose plan is a rounded pill, optionally bent like a bean; the back is a single band that follows
       the outline, full height behind and dropping as it wraps round the ends (Onem, Elora, Ellipse, Boomer, Velora, Wolf, Zoya). */
    function buildShell() {
      const L = dims.L, a = L / 2, b = D / 2, n = M.planN || 2.6, k = (M.bend || 0) * L, dip = cm(M.frontDip || 0), baseY = LEG_H, seatY = SH - CUSH;
      const C = (ph, ia = 0, ib = 0, nn = n) => { const c = Math.cos(ph), sn = Math.sin(ph), ux = Math.sign(c) * Math.pow(Math.abs(c), 2 / nn), uz = Math.sign(sn) * Math.pow(Math.abs(sn), 2 / nn); return [(a - ia) * ux, (b - ib) * uz + k * (ux * ux - .45) - (sn > 0 ? dip * Math.pow(1 - ux * ux, 2) : 0)]; };   /* dip: the front edge curves gently in towards the back at the centre */
      const extr = (inset, h, bv, nn) => {
        const pts = []; for (let i = 0; i < 120; i++) { const [x, z] = C(i / 120 * Math.PI * 2, inset + bv, inset + bv, nn); pts.push(new THREE.Vector2(x, -z)); }
        const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: Math.max(.002, h - 2 * bv), bevelEnabled: true, bevelThickness: bv, bevelSize: bv, bevelSegments: 6, curveSegments: 4 });
        g.rotateX(-Math.PI / 2); g.translate(0, bv, 0); return worldUV(g);
      };
      /* the seat is one piece from the floor line to the sitting height – no separate mattress on top */
      /* the back is its own body: a shell that stands on the floor line and wraps round the seat, which sits inside it
         (backOnSeat: the back is a roll resting on top of the seat instead – Onem, Elora) */
      const wrapSeat = !M.backOnSeat, bo = wrapSeat ? .03 : .008;
      part(extr(wrapSeat ? .022 : 0, SH - baseY, Math.min(M.seatR != null ? cm(M.seatR) : wrapSeat ? .11 : .07, (SH - baseY) / 2 - .002), M.seatN), 'base', 0, baseY, 0);   /* generous edge so the seat reads as a full cushion */
      /* back band */
      const wrap = (M.wrap ?? .8) * Math.PI, armF = M.armF ?? .6, flat = M.backFlat ?? .45, J = 96, K = 16, pos = [], uv = [], idx = [];
      const smooth = t => t * t * (3 - 2 * t);
      let arc = 0, prev = null, totLen = 0;
      { let pv = null; for (let j = 0; j <= J; j++) { const [x, z] = C(-Math.PI / 2 + (-1 + 2 * j / J) * wrap); if (pv) totLen += Math.hypot(x - pv[0], z - pv[1]); pv = [x, z]; } }
      const roundEnd = (M.dropAt ?? .8) >= 1 && M.endRound !== false;   /* arm fronts finish in a soft half-round, not a flat cut */
      for (let j = 0; j <= J; j++) {
        const sN = -1 + 2 * j / J, e = Math.abs(sN), ph = -Math.PI / 2 + sN * wrap;
        const [x, z] = C(ph), [x1, z1] = C(ph + .002), [x0, z0] = C(ph - .002);
        let nx = z1 - z0, nz = -(x1 - x0); const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl; if (nx * x + nz * (z - k * .1) < 0) { nx = -nx; nz = -nz; }
        const q = M.dropAt ?? .8, fh = q >= 1 ? (e < flat ? 1 : 1 + (armF - 1) * smooth((e - flat) / (1 - flat))) : e < flat ? 1 : e < q ? 1 + (armF - 1) * smooth((e - flat) / (q - flat)) : armF * Math.sqrt(Math.max(0, 1 - Math.pow((e - q) / (1 - q), 2)));
        const top = seatY + .03 + (H - seatY - .03) * Math.max(.02, fh), T = BT * (.7 + .3 * Math.min(1, fh)), r = Math.min(T / 2, (top - seatY) * .9), y0 = wrapSeat ? baseY + cm(M.backLift || 0) : baseY + .035;   /* backLift: the shell stops above the bottom of the seat and floats */
        if (prev) arc += Math.hypot(x - prev[0], z - prev[1]); prev = [x, z];
        const prof = [[-bo, y0], [-bo - .004, (y0 + top - r) / 2]]; for (let t = 0; t <= K - 4; t++) { const th = t / (K - 4) * Math.PI; prof.push([-bo + (T / 2 + bo / 2) - (T / 2 + bo / 2) * Math.cos(th), top - r + r * Math.sin(th)]); } prof.push([T, seatY - .02]);
        if (roundEnd) { const capL = T * .55, dE = Math.min(arc, totLen - arc); if (dE < capL) { const w = Math.sqrt(Math.max(.02, 1 - Math.pow(1 - dE / capL, 2))), cc = (T - bo) / 2; prof.forEach(p => { p[0] = cc + (p[0] - cc) * w; }); } }
        let pl = 0;
        prof.forEach(([u, y], i) => { if (i) pl += Math.hypot(u - prof[i - 1][0], y - prof[i - 1][1]); pos.push(x - nx * u, y, z - nz * u); uv.push(arc / TILE, pl / TILE); });
      }
      const P = K;   /* points per ring */
      if ((M.dropAt ?? .8) >= 1) [0, J].forEach(j => { for (let i = 1; i < P - 1; i++) idx.push(j * P, j * P + i, j * P + i + 1); });   /* arms cut straight: close the two ends */
      for (let j = 0; j < J; j++) for (let i = 0; i < P - 1; i++) { const A = j * P + i, B = A + 1, Cc = A + P, Dd = Cc + 1; idx.push(A, Cc, B, B, Cc, Dd); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      if (g.attributes.normal.getZ((J / 2) * P + 1) > 0) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } g.setIndex(idx); g.computeVertexNormals(); }
      const bm = part(g, 'back', 0, 0, 0); bm.material = bm.material; bm.userData.double = 1;
      if (S.pillows) (M.pillows || [{ x: -.5 }, { x: .5 }]).forEach((p, i) => {
        const px = p.x * (a - BT - .12), pz = -b + k * (p.x * p.x * .6 - .45) + (wrapSeat ? BT : BT * .8) + .1;
        if (p.k === 'round') { const g = new THREE.SphereGeometry(.17, 24, 16); g.scale(1, 1, .62); const m = part(g, 'p' + i, px, SH + .15, pz + .02); m.rotation.x = -.2; }
        else { const m = part(block(.38, .37, .12, .055), 'p' + i, px, SH - .01, pz); m.rotation.set(-.25, -Math.sign(p.x) * .12, Math.sign(p.x) * .04); }
      });
      /* what it stands on */
      if (M.legStyle === 'plank') { const ins = cm(M.legInset || 30); [-1, 1].forEach(sg => { const p = new THREE.Mesh(easeBox(new THREE.BoxGeometry(.04, LEG_H, D * .62), .004), legMat); p.position.set(sg * (a - ins), LEG_H / 2, k * .2); p.castShadow = true; G.legs.add(p); }); }
      else if (M.legStyle === 'frame') { const fx = a - cm(M.legInset || 45), fz = b - .14, y = LEG_H - .012, V = (x, yy, z) => new THREE.Vector3(x, yy, z);
        [-1, 1].forEach(sx => { [-1, 1].forEach(sz => bar(V(sx * fx, 0, sz * fz), V(sx * fx, LEG_H, sz * fz), .009)); bar(V(sx * fx, y, -fz), V(sx * fx, y, fz), .008); });
        [-1, 1].forEach(sz => bar(V(-fx, y, sz * fz), V(fx, y, sz * fz), .008)); }
      else if (M.base === 'plinth') { const p = new THREE.Mesh(extr(.07, baseY + .01, .004), footMat); p.position.y = 0; G.legs.add(p); }
      else { [-1, 1].forEach(sx => [-1, 1].forEach(sz => leg(sx * (a - .3), sz * (b - .16) + k * .1))); }
      hotPts = { fabric: new THREE.Vector3(0, SH + .01, .1), legs: new THREE.Vector3(a - .3, LEG_H / 2, b - .1) };
      return { W: L, Dz: D + Math.abs(k), zc: 0 };
    }

    /* "corner": an L in one piece – the long run along x, a return coming forward at the right end (mirror: at the left).
       The back is one band that follows the two outer edges and turns the corner on a radius. */
    function buildCorner() {
      const L = dims.L, SL = cm(M.sideL || 200), D2 = cm(M.sideD || M.d || 90), rc = cm(M.cornerR ?? 25), re = cm(M.endR ?? 12), baseY = LEG_H;
      const x0 = -L / 2, x1 = L / 2, zb = -D / 2, zf = D / 2, zs = zb + SL;
      const P = [[x0, zb, re], [x1, zb, rc], [x1, zs, M.sideEndR != null ? cm(M.sideEndR) : re], [x1 - D2, zs, M.sideEndR != null ? cm(M.sideEndR) : re], [x1 - D2, zf, cm(M.innerR ?? 6)], [x0, zf, re]];
      const sh = new THREE.Shape(), n = P.length, bv = Math.min(.05, (SH - baseY) / 2 - .002);
      P.forEach(([x, z, r], i) => {
        const [px, pz] = P[(i + n - 1) % n], [nx, nz] = P[(i + 1) % n];
        const la = Math.hypot(px - x, pz - z), lb = Math.hypot(nx - x, nz - z), rr1 = Math.max(.005, Math.min(r, la / 2 - .001, lb / 2 - .001));
        const ax = x + (px - x) / la * rr1, az = z + (pz - z) / la * rr1, bx = x + (nx - x) / lb * rr1, bz = z + (nz - z) / lb * rr1;
        if (i) sh.lineTo(ax, -az); else sh.moveTo(ax, -az);
        sh.quadraticCurveTo(x, -z, bx, -bz);
      });
      sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(.002, SH - baseY - bv), bevelEnabled: true, bevelThickness: bv, bevelSize: bv, bevelOffset: -bv, bevelSegments: 6, curveSegments: 10 });
      g.rotateX(-Math.PI / 2); worldUV(g);
      part(g, 'base', 0, baseY, 0);
      /* back band along the outer edge */
      const a0 = cm(M.backStart ?? 0), a1 = cm(M.backEnd ?? 0), path = [], N = 40;
      const l1 = (x1 - rc) - (x0 + a0), l3 = (zs - a1) - (zb + rc);
      for (let i = 0; i <= N; i++) path.push([x0 + a0 + l1 * i / N, zb, 0, -1]);
      for (let i = 1; i <= 16; i++) { const t = -Math.PI / 2 + i / 16 * Math.PI / 2; path.push([x1 - rc + rc * Math.cos(t), zb + rc + rc * Math.sin(t), Math.cos(t), Math.sin(t)]); }
      for (let i = 1; i <= N; i++) path.push([x1, zb + rc + l3 * i / N, 1, 0]);
      let tot = 0; const cum = [0]; for (let i = 1; i < path.length; i++) { tot += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); cum.push(tot); }
      const K = 16, pos = [], uv = [], idx = [], T = BT, capL = M.backRound === false ? 0 : Math.min(.22, T * 1.1);
      path.forEach(([x, z, nx, nz], j) => {
        const e = Math.min(cum[j], tot - cum[j]), fh = capL ? Math.sqrt(Math.max(.0004, 1 - Math.pow(Math.max(0, 1 - e / capL), 2))) : 1;
        const top = SH - .02 + (H - SH + .02) * fh, r = Math.min(T / 2, (top - SH + .04) * .9, cm(M.backTopR ?? 99)), y0 = M.backToFloor ? baseY + .03 : SH - .03;
        const prof = [[-.004, y0], [-.006, (y0 + top - r) / 2]]; for (let t = 0; t <= K - 4; t++) { const th = t / (K - 4) * Math.PI; prof.push([T / 2 - (T / 2 + .004) * Math.cos(th), top - r + r * Math.sin(th)]); } prof.push([T, SH - .03]);
        let pl = 0; prof.forEach(([u, y], i) => { if (i) pl += Math.hypot(u - prof[i - 1][0], y - prof[i - 1][1]); pos.push(x - nx * u, y, z - nz * u); uv.push(cum[j] / TILE, pl / TILE); });
      });
      for (let j = 0; j < path.length - 1; j++) for (let i = 0; i < K - 1; i++) { const A = j * K + i, B = A + 1, C2 = A + K, D3 = C2 + 1; idx.push(A, C2, B, B, C2, D3); }
      [0, path.length - 1].forEach(j => { for (let i = 1; i < K - 1; i++) idx.push(j * K, j * K + i, j * K + i + 1); });
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); bg.setIndex(idx); bg.computeVertexNormals();
      if (bg.attributes.normal.getZ(20 * K + 1) > 0) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } bg.setIndex(idx); bg.computeVertexNormals(); }
      part(bg, 'back', 0, 0, 0);
      if (M.base !== 'plinth') [[x0 + .08, zb + .08], [x0 + .08, zf - .08], [x1 - .08, zb + .08], [x1 - .08, zs - .08], [x1 - D2 + .08, zs - .08], [x1 - D2 + .08, zf - .08], [(x0 + x1 - D2) / 2, zb + .08], [(x0 + x1 - D2) / 2, zf - .08]].forEach(([x, z]) => leg(x, z));
      if (M.mirror) [G.body, G.legs].forEach(gr => { gr.scale.x = -1; });
      hotPts = { fabric: new THREE.Vector3(0, SH + .01, 0), legs: new THREE.Vector3(x0 + .08, LEG_H / 2, zf - .08) };
      return { W: L, Dz: Math.max(D, SL), zc: zb + Math.max(D, SL) / 2 };
    }

    function build() {
      Object.values(G).forEach(clear); [G.body, G.legs].forEach(gr => { gr.scale.x = 1; gr.position.x = 0; });
      const r = M.style === 'corner' ? buildCorner() : M.style === 'shell' ? buildShell() : M.style === 'curved' ? buildCurved() : M.style === 'modules' ? buildModules() : buildBlock();
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
