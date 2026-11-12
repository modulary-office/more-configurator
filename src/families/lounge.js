/* Family: lounge – modular upholstered seating on a steel beam (Hofi): seat pads, back cushions,
   wooden side tables, one- or two-sided. Price per running metre of seat, so length scales the price.
   Fabrics: catalogs/upholstery.json (swatch photos from the supplier's fabric books → textures). */
import { genTop, thumbTop } from '../engine/textures.js';

const FALLBACK = { id: '', he: '', hex: '#8a8a86' };
const byId = (arr, id) => arr.find(x => x.id === id) || arr[0] || FALLBACK;
const TEX_BASE = new URL('../catalogs/upholstery/', import.meta.url);
const LEGS = { black: { he: 'שחור', hex: '#1d1d1f' }, white: { he: 'לבן', hex: '#ecebe7' }, graphite: { he: 'גרפיט', hex: '#4a4c50' } };
const BACKS = { full: 'גב לכל האורך', center: 'גב באמצע', left: 'גב משמאל', right: 'גב מימין', stagger: 'גבות מתחלפים', none: 'ללא גב' };
const TABLES = { none: 'ללא', left: 'משמאל', right: 'מימין', middle: 'באמצע', both: 'בשני הקצוות' };

function lists(product, cat) {
  const items = n => (cat[n] && cat[n].items) || [];
  return { FAB: items('upholstery'), DEC: items('decors') };
}
/* the chosen fabric = the swatch of the chosen collection */
const fabKey = S => 'f_' + (S.fcol || 'fast');
const fabId = S => S[fabKey(S)];
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : '';
/* per-part fabrics: S.pmap = "s0-1=moon-3;b1=fast-2" (only in "part" mode) */
const pmapGet = S => Object.fromEntries(String(S.pmap || '').split(';').filter(Boolean).map(x => x.split('=')));
const pmapSet = (S, m) => { S.pmap = Object.entries(m).map(([k, v]) => k + '=' + v).join(';'); };
const partName = k => k[0] === 'b' ? `גב ${+k.slice(1) + 1}` : `מושב ${+k.split('-')[1] + 1}${k[1] === '1' ? ' (צד שני)' : ''}`;

export const lounge = {
  ui(product, cat, S) {
    const { FAB, DEC } = lists(product, cat);
    const sides = () => S.sides === 2 ? 2 : 1;
    const D = () => sides() === 2 ? 120 : 65;
    const fab = () => byId(FAB, fabId(S));
    const backTxt = () => BACKS[S.back] || BACKS.center;
    return {
      metrics: () => ({ lengthM: S.len / 100, seatM: S.len / 100 * sides(), sides: sides(), tables: S.tables === 'both' ? 2 : S.tables === 'none' ? 0 : 1 }),
      outputs: () => ({
        dimtag: `${S.len} × ${D()} × 70 ס״מ<small>${sides() === 2 ? 'דו־צדדי, גב אל גב' : 'חד־צדדי'} · ${backTxt()}</small>`,
        summary: `${S.len}×${D()}×70 · ${sides() === 2 ? 'דו־צדדי' : 'חד־צדדי'}`
      }),
      sectionValue: k => {
        const f = fab(), d = byId(DEC, S.tdec);
        return {
          size: `${S.len} ס״מ · ${sides() === 2 ? 'דו־צדדי' : 'חד־צדדי'}`,
          back: backTxt(),
          tables: S.tables === 'none' ? 'ללא' : `<i style="background-image:url(${thumbTop(d)})"></i>${TABLES[S.tables]}${S.tdepth === 'half' ? ' · חצי' : ''}`,
          fabric: `<i style="background:${f.hex} url(${new URL(f.tex || '', TEX_BASE)}) center/cover"></i>${f.he}`,
          frame: `<i style="background:${(LEGS[S.leg] || LEGS.black).hex}"></i>${(LEGS[S.leg] || LEGS.black).he}`
        }[k];
      },
      toast: k => {
        const f = fab();
        if (k === 'pmode') return [S.pmode === 'part' ? 'לחצו על מושב או גב בתלת־ממד ובחרו לו בד' : 'בד אחד לכל הספה'];
        if ((k === 'fcol' || k.startsWith('f_')) && S.pmode === 'part' && S.psel) return [`${partName(S.psel)}: ${f.he}`, `background:${f.hex} url(${new URL(f.tex || '', TEX_BASE)}) center/cover`];
        if (k === 'fcol' || k.startsWith('f_')) return [`בד: ${f.he}`, `background:${f.hex} url(${new URL(f.tex || '', TEX_BASE)}) center/cover`];
        if (k === 'back') return [backTxt()];
        if (k === 'tables' || k === 'tdec') return [S.tables === 'none' ? 'ללא מגש עץ' : `מגש עץ ${TABLES[S.tables]}${S.tdepth === 'half' ? ', חצי עומק' : ''}, ${byId(DEC, S.tdec).he}`];
        if (k === 'leg') return [`שלד: ${(LEGS[S.leg] || LEGS.black).he}`];
        return [`${S.len} × ${D()} ס״מ · ${sides() === 2 ? 'דו־צדדי' : 'חד־צדדי'}`];
      },
      code: () => `${product.codePrefix || 'LG'}-${sides() === 2 ? 'D' : 'S'}${S.len}-${String(S.back).toUpperCase()}-T${String(S.tables).toUpperCase()}-${fab().code || fabId(S)}${S.pmode === 'part' && S.pmap ? '-MIX' + Object.keys(pmapGet(S)).length : ''}-${String(S.leg).toUpperCase()}`,
      summary: () => [`${sides() === 2 ? 'דו־צדדי, גב אל גב' : 'חד־צדדי'}, אורך ${S.len} ס״מ`, `מידות ${S.len}×${D()}×70 ס״מ, גובה מושב 45`, backTxt(),
        S.tables === 'none' ? '' : `מגש עץ ${TABLES[S.tables]}${S.tdepth === 'half' ? ', חצי עומק' : ''}, ${byId(DEC, S.tdec).he}`, S.pmode === 'part' ? `בד בסיס: ${byId(FAB, S.pbase || fabId(S)).he}` : `בד: ${fab().he}`,
        ...(S.pmode === 'part' ? Object.entries(pmapGet(S)).sort().map(([k, v]) => `${partName(k)}: ${byId(FAB, v).he}`) : []), `שלד: ${(LEGS[S.leg] || LEGS.black).he}`]
    };
  },

  create({ THREE, scene, maxAniso, ao, S, product, cat, tweenColor, showDims }) {
    const { FAB, DEC } = lists(product, cat);

    /* fabric: the swatch photo as a mirrored-repeat texture, tinted by nothing (the photo is the colour) */
    const loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
    const texCache = {};
    function fabTex(item) {
      if (!item.tex) return null;
      if (texCache[item.id]) return texCache[item.id];
      const t = loader.load(new URL(item.tex, TEX_BASE).href, () => { fabMat.needsUpdate = true; });
      t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.anisotropy = maxAniso;
      return texCache[item.id] = t;
    }
    const fabMats = {};
    function matFor(id) {
      if (fabMats[id]) return fabMats[id];
      const it = byId(FAB, id), t = fabTex(it);
      return fabMats[id] = new THREE.MeshPhysicalMaterial({ color: t ? 0xffffff : it.hex, map: t, roughness: .92, sheen: .8, sheenRoughness: .7, sheenColor: new THREE.Color(0xffffff).multiplyScalar(.25), envMapIntensity: .45 });
    }
    const fabMat = { needsUpdate: false };   /* texture callbacks */
    const partFab = key => S.pmode === 'part' ? (pmapGet(S)[key] || S.pbase || fabId(S)) : fabId(S);
    const selMat = new THREE.MeshBasicMaterial({ color: 0xf5d547, transparent: true, opacity: .0, depthWrite: false });
    let selT = 0;
    function applyFab() {
      [G.seat, G.back].forEach(g => g.children.forEach(m => {
        if (m.userData.part) { const mt = matFor(partFab(m.userData.part)); if (m.material !== mt && m.userData.fabbed) pops.set(m, 0); m.material = mt; m.userData.fabbed = true; }
        if (m.userData.sel) m.visible = m.userData.sel === S.psel && S.pmode === 'part';
      }));
    }
    /* a short "pop" on every pad whose fabric just changed, so the change reads at a glance */
    const pops = new Map();
    function tickPops(dt) { pops.forEach((t, m) => { t += dt / .42; if (t >= 1 || !m.parent) { m.scale.set(1, 1, 1); pops.delete(m); return; } const k = 1 + .085 * Math.sin(Math.PI * t); m.scale.set(k, k, k); pops.set(m, t); }); }
    /* UVs in metres so the weave keeps its real size on every pad */
    const TILE = .3;
    function worldUV(geo) {
      geo.computeBoundingBox(); const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
      for (let i = 0; i < p.count; i++) {
        const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
        const u = ay > .6 ? p.getX(i) : ax > .6 ? p.getZ(i) : p.getX(i), v = ay > .6 ? p.getZ(i) : p.getY(i);
        uv.setXY(i, u / TILE, v / TILE);
      }
      uv.needsUpdate = true; return geo;
    }
    const legMat = new THREE.MeshStandardMaterial({ color: (LEGS[S.leg] || LEGS.black).hex, roughness: .45, metalness: .35 });
    const footMat = new THREE.MeshStandardMaterial({ color: 0x141415, roughness: .7 });
    const woodMats = {};
    function woodMat(id) {
      if (woodMats[id]) return woodMats[id];
      const def = byId(DEC, id), tex = new THREE.CanvasTexture(genTop(def, 512));
      tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = maxAniso; tex.repeat.set(1.6, 1.6);
      return woodMats[id] = new THREE.MeshStandardMaterial({ map: tex, roughness: .55 });
    }

    function rr(w, h, r) {
      const s = new THREE.Shape(), x = -w / 2, y = -h / 2; r = Math.min(r, w / 2 - .001, h / 2 - .001);
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
    }
    const mk = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
    /* soft pad: rounded plan, generous bevel → cushion look */
    function pad(w, d, h, r) {
      const g = new THREE.ExtrudeGeometry(rr(w - .05, d - .05, r), { depth: h - .05, bevelEnabled: true, bevelThickness: .025, bevelSize: .025, bevelSegments: 5, curveSegments: 10 });
      g.rotateX(-Math.PI / 2); g.translate(0, .025, 0); return worldUV(g);
    }

    const G = { seat: new THREE.Group(), back: new THREE.Group(), table: new THREE.Group(), frame: new THREE.Group(), dims: new THREE.Group() };
    Object.values(G).forEach(g => scene.add(g));
    const SEAT_Y = .45, PAD_H = .13, SIDE_D = .6;
    let dims = { L: S.len / 100 }, dimT = null, hotPts = {}, dimLabels = [];
    const clear = g => { for (let i = g.children.length - 1; i >= 0; i--) { const o = g.children[i]; g.remove(o); o.traverse(c => c.geometry && c.geometry.dispose()); } };

    function build() {
      Object.values(G).forEach(clear); hotPts = {};
      const L = dims.L, two = S.sides === 2, D = two ? 2 * SIDE_D : SIDE_D + .05, TW = .5;
      const half = S.tdepth === 'half';
      /* trays along the length: centre x of each */
      const tx = { none: [], left: [-L / 2 + TW / 2], right: [L / 2 - TW / 2], both: [-L / 2 + TW / 2, L / 2 - TW / 2], middle: [0] }[S.tables] || [];
      const sideZ = two ? [SIDE_D / 2, -SIDE_D / 2] : [.025];   /* centre of each seating side (front = +z) */
      /* free ranges on a side: the length minus the trays that cover that side */
      const covers = si => !half || si === 0;   /* a half-depth tray sits on the front side only */
      const ranges = si => {
        let r = [[-L / 2, L / 2]];
        tx.forEach(x => { if (!covers(si)) return; const a = x - TW / 2, b = x + TW / 2; r = r.flatMap(([u, v]) => b <= u || a >= v ? [[u, v]] : [[u, a], [b, v]]).filter(([u, v]) => v - u > .05); });
        return r;
      };
      const fullR = (() => { const r = ranges(0); return [r[0][0], r[r.length - 1][1]]; })();
      const x0 = fullR[0], x1 = fullR[1], seatL = Math.max(.6, x1 - x0);
      let pi = 0;
      sideZ.forEach((zc, si) => {
        const depth = !two && half ? SIDE_D : SIDE_D;
        ranges(si).forEach(([u, v]) => {
          const n = Math.max(1, Math.ceil((v - u) / 1.1)), pw = (v - u) / n;
          for (let i = 0; i < n; i++) {
            const key = `s${si}-${pi++}`, geo = pad(pw, depth, PAD_H, .09), m = mk(geo, matFor(partFab(key)), u + (i + .5) * pw, SEAT_Y - PAD_H, zc);
            m.userData.part = key; G.seat.add(m);
            const h = new THREE.Mesh(geo, selMat); h.position.copy(m.position); h.scale.set(1.015, 1.06, 1.02); h.userData.sel = key; G.seat.add(h);
          }
        });
        /* back cushion: a slim reclined pad along the rear edge of this side */
        const dir = zc >= 0 && !two ? 1 : (si === 0 ? 1 : -1);  /* +1: sitter faces +z, back at the rear (−z) */
        const rs = ranges(si), sa = rs[0][0], sb = rs[rs.length - 1][1], sL = sb - sa;
        let a = sa, b = sb;
        const mode = S.back === 'stagger' && two ? (si === 0 ? 'left' : 'right') : S.back;
        if (mode === 'none') return;
        if (mode === 'center') { const w = Math.min(sL, Math.max(1.0, sL * .6)); a = -w / 2 + (sa + sb) / 2; b = a + w; }
        if (mode === 'left') b = sa + Math.max(.9, sL * .5);
        if (mode === 'right') a = sb - Math.max(.9, sL * .5);
        const bw = b - a, bh = .36, bt = .15;
        const g = new THREE.ExtrudeGeometry(rr(bw - .05, bh, .08), { depth: bt - .05, bevelEnabled: true, bevelThickness: .025, bevelSize: .025, bevelSegments: 5, curveSegments: 10 });
        g.translate(0, bh / 2, -(bt - .05) / 2); worldUV(g);
        const bkey = `b${si}`, m = mk(g, matFor(partFab(bkey)), (a + b) / 2, SEAT_Y - .02, zc - dir * (SIDE_D / 2 - bt / 2 - .005));
        m.rotation.x = -dir * .16; m.userData.part = bkey; G.back.add(m);
        const hb = new THREE.Mesh(g, selMat); hb.position.copy(m.position); hb.rotation.copy(m.rotation); hb.scale.set(1.01, 1.03, 1.08); hb.userData.sel = bkey; G.back.add(hb);
        if (si === 0) hotPts.back = new THREE.Vector3((a + b) / 2, SEAT_Y + .28, zc - dir * (SIDE_D / 2 - .1));
      });
      /* trays: wood at seat height on the same beam; full depth or the front half */
      const tm = woodMat(S.tdec || 'oak');
      tx.forEach(x => {
        const td = half ? SIDE_D : D, tz = half ? sideZ[0] : (two ? 0 : .025);
        const tg = new THREE.ExtrudeGeometry(rr(TW - .03, td - .03, .05), { depth: .025, bevelEnabled: true, bevelThickness: .004, bevelSize: .004, bevelSegments: 2, curveSegments: 8 });
        tg.rotateX(-Math.PI / 2); G.table.add(mk(tg, tm, x, SEAT_Y - .1, tz));
        G.table.add(mk(new THREE.BoxGeometry(TW - .12, .05, td - .14), legMat, x, SEAT_Y - .125, tz));
        if (!hotPts.tables) hotPts.tables = new THREE.Vector3(x, SEAT_Y - .06, tz + td / 4);
      });
      /* frame: one beam along the length, cross arms under the pads, splayed legs */
      const by = SEAT_Y - PAD_H - .03, zc = two ? 0 : .025, BL = L - .25;
      G.frame.add(mk(new THREE.BoxGeometry(BL, .05, .09), legMat, 0, by, zc));
      const nl = Math.max(2, Math.ceil(BL / 1.6) + 1);
      for (let i = 0; i < nl; i++) {
        const x = -BL / 2 + .08 + i * (BL - .16) / (nl - 1), arm = D - .16;
        G.frame.add(mk(new THREE.BoxGeometry(.06, .035, arm), legMat, x, by + .01, zc));
        [-1, 1].forEach(s => {
          const top = new THREE.Vector3(x, by, zc + s * (arm / 2 - .03)), bot = new THREE.Vector3(x + (i === 0 ? -.03 : i === nl - 1 ? .03 : 0), .01, zc + s * (arm / 2 + .02));
          const dir = new THREE.Vector3().subVectors(bot, top), len = dir.length();
          const leg = mk(new THREE.CylinderGeometry(.016, .012, len, 12), legMat); leg.position.copy(top).add(bot).multiplyScalar(.5);
          leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()); G.frame.add(leg);
          G.frame.add(mk(new THREE.CylinderGeometry(.018, .018, .01, 12), footMat, bot.x, .005, bot.z));
        });
      }
      hotPts.fabric = new THREE.Vector3((x0 + x1) / 2 - seatL * .2, SEAT_Y + .01, sideZ[0] + .1);
      hotPts.frame = new THREE.Vector3(-BL / 2 + .08, .2, zc + D / 2 - .1);
      ao.scale.set(L + .8, D + .8, 1); ao.position.z = zc;
      buildDims(L, D, zc);
      applyFab();
    }

    function buildDims(L, D, zc) {
      const m = new THREE.LineBasicMaterial({ color: 0x1c1c1a, transparent: true, opacity: .75 }), V = (x, y, z) => new THREE.Vector3(x, y, z);
      const seg = (a, b) => G.dims.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), m));
      const zf = zc + D / 2 + .16, xr = L / 2 + .16, y = .004, tk = .05, H = .7;
      seg(V(-L / 2, y, zf), V(L / 2, y, zf)); seg(V(-L / 2, y, zf - tk), V(-L / 2, y, zf + tk)); seg(V(L / 2, y, zf - tk), V(L / 2, y, zf + tk));
      seg(V(xr, y, zc - D / 2), V(xr, y, zc + D / 2)); seg(V(xr - tk, y, zc - D / 2), V(xr + tk, y, zc - D / 2)); seg(V(xr - tk, y, zc + D / 2), V(xr + tk, y, zc + D / 2));
      seg(V(xr, 0, zc - D / 2), V(xr, H, zc - D / 2)); seg(V(xr - tk, H, zc - D / 2), V(xr + tk, H, zc - D / 2));
      dimLabels = [[V(0, y, zf), `${Math.round(L * 100)} ס״מ`], [V(xr, y, zc), `${Math.round(D * 100)} ס״מ`], [V(xr, H / 2, zc - D / 2), '70 ס״מ']];
      G.dims.visible = showDims();
    }

    let resizing = false;
    function update(k) {
      resizing = false;
      if (k === 'pmode') { if (S.pmode !== 'part') { S.pmap = ''; S.psel = ''; S.pbase = ''; } else { S.pbase = S.pbase || fabId(S); if (!S.psel) S.psel = 's0-0'; } applyFab(); return; }
      if (k.startsWith('f_') && S.pmode === 'part' && S.psel) { const m = pmapGet(S); m[S.psel] = fabId(S); pmapSet(S, m); applyFab(); return; }
      if (k === 'fcol' || k.startsWith('f_') || k === 'pmap' || k === 'pbase') { applyFab(); return; }
      if (k === 'leg') { tweenColor(legMat, (LEGS[S.leg] || LEGS.black).hex); return; }
      if (k === 'len') { dimT = { a: dims.L, b: S.len / 100, t: 0 }; resizing = true; return; }
      build();
    }
    function tick(dt, ease) {
      selT += dt; selMat.opacity = S.pmode === 'part' && S.psel && !S.nosel ? .26 + .14 * Math.sin(selT * 4) : 0;
      tickPops(dt);
      if (!dimT) return;
      dimT.t = Math.min(1, dimT.t + dt / .6); dims = { L: dimT.a + (dimT.b - dimT.a) * ease(dimT.t) }; build();
      if (dimT.t >= 1) { dimT = null; return 'settled'; }
    }
    function explode(ex) { G.back.position.y = .5 * ex; G.back.position.z = 0; G.seat.position.y = .28 * ex; G.table.position.y = .16 * ex; }
    const depth = () => S.sides === 2 ? 1.2 : .65;

    return {
      build, update, tick, explode,
      pick: part => {
        if (S.pmode !== 'part') { S.pmode = 'part'; S.pbase = fabId(S); }
        S.psel = part;
        const f = byId(FAB, partFab(part)); if (f.col) { S.fcol = f.col; S['f_' + f.col] = f.id; }
        applyFab();
        return { section: 'fabric', text: `נבחר ${partName(part)} · בחרו לו בד`, sw: `background:${f.hex} url(${new URL(f.tex || '', TEX_BASE)}) center/cover` };
      },
      isResizing: () => resizing,
      dimsGroup: G.dims,
      fitSpan: () => Math.max(dims.L, depth() * 1.6, 1.4),
      clampBox: () => ({ lx: dims.L / 2 + .5, lz: depth() / 2 + .5 }),
      hero: { th: .62, ph: 1.08 },
      views: { fabric: fitR => ({ th: .55, ph: 1.0, r: fitR() * .9, tx: 0, ty: .4, tz: 0 }) },
      focusView: k => ({ fabric: 'fabric' }[k] || 'hero'),
      hotspots: [['fabric', 'בד'], ['back', 'גב'], ['tables', 'שולחן צד'], ['frame', 'שלד']],
      hotPts: () => hotPts,
      hotOffset: (k, ex) => k === 'back' ? .5 * ex : k === 'fabric' ? .28 * ex : 0,
      dimLabels: () => dimLabels,
      snapLine: () => `${S.len} ס״מ · ${byId(FAB, fabId(S)).he}`
    };
  }
};
