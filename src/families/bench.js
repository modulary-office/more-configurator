/* Family: bench – shared desks built from end frames, centre supports, a top, optional screens, tray, power boxes.
   Used by Duo Bench. Options and prices come from products/<id>.json; geometry lives here. */
import { genTop, topTexture, genWeave, thumbTop } from '../engine/textures.js';

const FALLBACK = { id: '', he: '', hex: '#888888', base: '#888888', kind: 'solid' };
const byId = (arr, id) => arr.find(x => x.id === id) || arr[0] || FALLBACK;

/* lookups shared by the UI and 3D parts */
function lists(product, cat) {
  const ctrl = k => product.sections.flatMap(s => s.controls).find(c => c.key === k) || {};
  const opts = k => (ctrl(k).options || []).map(o => ({ id: o.v, he: o.label || String(o.v), hex: o.hex, metal: o.metal }));
  const items = n => (cat[n] && cat[n].items) || [];
  return { TOPS: items('decors'), RAL: items('ral'), FABRICS: items('fabrics'), HW: opts('hw'), EDGES: opts('edge'), PROF: opts('prof'), has: k => !!ctrl(k).key };
}

/* Options the product doesn't offer are fixed: no partition section → no partitions, no bevel option → straight edge. */
function lockMissing(product, cat, S) {
  const { has } = lists(product, cat);
  if (!has('sh')) S.sh = 0;
  if (!has('prof')) S.prof = 'straight';
  if (!has('tray')) S.tray = false;
  if (!has('power')) S.power = false;
}

export const bench = {
  /* ---------- non-3D: numbers, texts, code ---------- */
  ui(product, cat, S) {
    lockMissing(product, cat, S);
    const { TOPS, RAL, FABRICS, HW, EDGES, PROF } = lists(product, cat);
    const sides = () => S.layout === 'double' ? 2 : 1;
    const seats = () => S.n * sides();
    const L = () => S.n * S.w;
    const bevel = () => S.prof === 'bevel';
    return {
      metrics: () => ({ stations: S.n, sides: sides(), seats: seats(), L: L(), D: S.d, lengthM: L() / 100, areaM2: L() * S.d / 1e4, screens: S.sh ? S.n : 0, screenAreaM2: S.sh ? S.n * Math.max(.5, S.w / 100 - .16) * S.sh / 100 : 0, powerBoxes: S.power ? seats() : 0 }),
      outputs: () => ({
        n: `${S.n} <span class="mrc-seats">${'<i></i>'.repeat(S.n)}</span>`,
        seats: `סה״כ ${seats()} עמדות`,
        dimtag: `${L()} × ${S.d} × 75 ס״מ<small>${seats()} עמדות · ${S.layout === 'double' ? 'דו־צדדי' : 'חד־צדדי'}</small>`,
        summary: `${L()}×${S.d}×75 · ${seats()} עמדות`
      }),
      sectionValue: k => {
        const top = byId(TOPS, S.top), ral = byId(RAL, S.ral), fab = byId(FABRICS, S.fab);
        return {
          size: `${L()}×${S.d} · ${seats()} עמדות`,
          top: `<i style="background-image:url(${thumbTop(top)})"></i>${top.he}${bevel() ? ' · מדוקק' : ''}`,
          frame: `<i style="background:${ral.hex}"></i>RAL ${ral.id}`,
          screen: S.sh ? `<i style="background:${fab.hex}"></i>${fab.he} · ${S.sh}` : 'ללא מחיצות',
          extra: [S.tray && 'מגש כבלים', S.power && 'חשמל'].filter(Boolean).join(' · ') || 'ללא'
        }[k];
      },
      toast: k => {
        const top = byId(TOPS, S.top), ral = byId(RAL, S.ral), fab = byId(FABRICS, S.fab);
        const msgs = {
          top: [`פלטה: ${top.he}`, `background-image:url(${thumbTop(top)})`],
          ral: [`שלד: RAL ${ral.id} ${ral.he}`, `background:${ral.hex}`],
          fab: [`בד מחיצה: ${fab.he}`, `background:${fab.hex}`],
          edge: [`קנט: ${byId(EDGES, S.edge).he}`], hw: [`פרזול: ${byId(HW, S.hw).he}`], prof: [`פרופיל קנט: ${byId(PROF, S.prof).he}`],
          tray: [S.tray ? 'נוסף מגש כבלים' : 'הוסר מגש כבלים'], power: [S.power ? 'נוספה קופסת חשמל' : 'הוסרה קופסת חשמל'], chairs: [S.chairs ? 'כיסאות להמחשה' : 'הוסתרו הכיסאות'],
          sh: [S.sh ? `מחיצות בגובה ${S.sh} ס״מ` : 'ללא מחיצות']
        };
        return msgs[k] || [`${L()} × ${S.d} ס״מ · ${seats()} עמדות`];
      },
      code: () => `${product.codePrefix || 'MB'}-${S.layout === 'double' ? 'D' : 'S'}${S.n}-${L()}x${S.d}-${S.top.toUpperCase()}-${S.edge[0].toUpperCase()}${bevel() ? '-BV' : ''}-R${S.ral}-${S.hw.toUpperCase()}-${S.sh ? 'S' + S.sh + '-' + S.fab.toUpperCase() : 'NS'}${S.tray ? '-T' : ''}${S.power ? '-P' : ''}`,
      summary: () => {
        const top = byId(TOPS, S.top), ral = byId(RAL, S.ral), fab = byId(FABRICS, S.fab), hw = byId(HW, S.hw), ed = byId(EDGES, S.edge);
        return [`${S.layout === 'double' ? 'דו־צדדי' : 'חד־צדדי'}, ${seats()} עמדות`, `מידות ${L()}×${S.d}×75 ס״מ`, `פלטה: ${top.he}, קנט ${ed.he}${bevel() ? ' מדוקק' : ''}`, `שלד: RAL ${ral.id} ${ral.he}`, `פרזול: ${hw.he}`, S.sh ? `מחיצות ${S.sh} ס״מ, בד ${fab.he}` : 'ללא מחיצות', S.tray ? 'מגש כבלים' : '', S.power ? 'קופסת חשמל' : ''];
      }
    };
  },

  /* ---------- 3D ---------- */
  create({ THREE, scene, maxAniso, ao, S, product, cat, tweenColor, showDims }) {
    lockMissing(product, cat, S);
    const { TOPS, RAL, FABRICS, HW } = lists(product, cat);

    /* materials */
    const topMats = {};
    function topMat(id) {
      if (topMats[id]) return topMats[id];
      const def = byId(TOPS, id), tex = topTexture(THREE, def, 1024);
      tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = maxAniso;
      const span = def.kind === 'wood' ? 1.6 : 1.2; tex.repeat.set(1 / span, 1 / span);
      const m = new THREE.MeshStandardMaterial({ map: tex, roughness: def.kind === 'marble' ? .28 : def.kind === 'wood' ? .62 : .5, metalness: 0, envMapIntensity: .7 });
      return topMats[id] = m;
    }
    const edgeBlack = new THREE.MeshStandardMaterial({ color: 0x1b1b1c, roughness: .55 });
    const legMat = new THREE.MeshStandardMaterial({ color: byId(RAL, S.ral).hex, roughness: .42, metalness: .25, envMapIntensity: .9 });
    const hwMat = new THREE.MeshStandardMaterial({ color: 0xb8bbbd, roughness: .32, metalness: .85 });
    const footMat = new THREE.MeshStandardMaterial({ color: 0x161617, roughness: .7 });
    const weave = new THREE.CanvasTexture(genWeave(256)); weave.wrapS = weave.wrapT = THREE.RepeatWrapping; weave.repeat.set(9, 9); weave.colorSpace = THREE.SRGBColorSpace; weave.anisotropy = maxAniso;
    const fabMat = new THREE.MeshPhysicalMaterial({ color: byId(FABRICS, S.fab).hex, map: weave, roughness: .95, sheen: 1, sheenRoughness: .6, sheenColor: new THREE.Color(0xffffff).multiplyScalar(.35), envMapIntensity: .5 });
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x232325, roughness: .45, metalness: .3 });
    const chairFab = new THREE.MeshPhysicalMaterial({ color: 0x3c3d40, map: weave, roughness: .95, sheen: .6, sheenColor: new THREE.Color(0x777777) });
    const chairBase = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: .4, metalness: .5 });
    function applyLeg(instant) {
      const r = byId(RAL, S.ral);
      if (instant) legMat.color.set(r.hex); else tweenColor(legMat, r.hex);
      legMat.metalness = r.metal ? .8 : .25; legMat.roughness = r.metal ? .3 : .42;
      applyHw(instant);
    }
    function applyHw(instant) {
      const h = byId(HW, S.hw), hex = h.id === 'match' ? byId(RAL, S.ral).hex : h.hex, metal = h.id === 'match' ? !!byId(RAL, S.ral).metal : !!h.metal;
      if (instant) hwMat.color.set(hex); else tweenColor(hwMat, hex);
      hwMat.metalness = metal ? .85 : .2; hwMat.roughness = metal ? .3 : .5;
    }
    applyLeg(true);

    /* geometry helpers */
    function rr(w, h, r) {
      const s = new THREE.Shape(), x = -w / 2, y = -h / 2; r = Math.min(r, w / 2, h / 2);
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
    }
    const UP = new THREE.Vector3(0, 1, 0);
    function strut(a, b, sx, sz, mat) {
      const dir = new THREE.Vector3().subVectors(b, a), len = dir.length();
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, len, sz), mat);
      m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(UP, dir.normalize());
      m.castShadow = m.receiveShadow = true; return m;
    }
    const mk = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };

    /* chair (built once) */
    const chairProto = (() => {
      const g = new THREE.Group();
      const seat = new THREE.ExtrudeGeometry(rr(.48, .46, .07), { depth: .07, bevelEnabled: true, bevelSize: .015, bevelThickness: .015, bevelSegments: 3, curveSegments: 6 }); seat.rotateX(-Math.PI / 2);
      g.add(mk(seat, chairFab, 0, .43, 0));
      const back = new THREE.ExtrudeGeometry(rr(.45, .5, .09), { depth: .055, bevelEnabled: true, bevelSize: .012, bevelThickness: .012, bevelSegments: 3, curveSegments: 6 });
      const bm = mk(back, chairFab, 0, .83, .25); bm.rotation.x = -.12; g.add(bm);
      g.add(mk(new THREE.BoxGeometry(.04, .3, .03), chairBase, 0, .62, .245));
      g.add(mk(new THREE.CylinderGeometry(.022, .026, .32, 14), chairBase, 0, .26, 0));
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2, arm = mk(new THREE.BoxGeometry(.04, .03, .3), chairBase, Math.sin(a) * .15, .07, Math.cos(a) * .15); arm.rotation.y = a; g.add(arm);
        g.add(mk(new THREE.SphereGeometry(.026, 12, 8), footMat, Math.sin(a) * .3, .026, Math.cos(a) * .3));
      }
      return g;
    })();

    /* scene graph */
    const G = { top: new THREE.Group(), scr: new THREE.Group(), fL: new THREE.Group(), fR: new THREE.Group(), ctr: new THREE.Group(), tray: new THREE.Group(), chairs: new THREE.Group(), dims: new THREE.Group() };
    Object.values(G).forEach(g => scene.add(g));
    const H = .75, T = .025;
    let dims = { L: S.n * S.w / 100, D: S.d / 100, sh: S.sh / 100 }, dimT = null;
    let hotPts = {}, dimLabels = [], fadeTop = null;

    function clearGroup(g) { for (let i = g.children.length - 1; i >= 0; i--) { const o = g.children[i]; g.remove(o); o.traverse(c => { if (c.geometry && !c.userData.keep) c.geometry.dispose(); }); } }

    function build() {
      const { L, D, sh } = dims, n = S.n, dbl = S.layout === 'double', W = L / n, y0 = H - T;
      Object.entries(G).forEach(([k, g]) => { if (k !== 'chairs') clearGroup(g); });
      /* top */
      const edgeM = S.edge === 'black' ? edgeBlack : S.edge === 'legs' ? legMat : topMat(S.top);
      let tg, top;
      if (S.prof === 'bevel') {
        /* bevelled (מדוקק) edge: short straight band on top, then a 45° chamfer running in under the top */
        const e = .008, c = T - e, r0 = .012;
        tg = new THREE.ExtrudeGeometry(rr(L, D, r0), { depth: e - .003, bevelEnabled: true, bevelThickness: .0015, bevelSize: .0015, bevelSegments: 2, curveSegments: 6 });
        tg.rotateX(-Math.PI / 2);
        top = mk(tg, [topMat(S.top), edgeM], 0, H - e + .0015, 0); G.top.add(top);
        const outer = rr(L, D, r0).getPoints(6), inner = rr(L - 2 * c, D - 2 * c, Math.max(.002, r0 - c * .4)).getPoints(6);
        const pos = [], uv = [], idx = [], N = Math.min(outer.length, inner.length);
        for (let i = 0; i < N; i++) {
          pos.push(outer[i].x, H - e, -outer[i].y, inner[i].x, H - T, -inner[i].y);
          uv.push(outer[i].x, outer[i].y, inner[i].x, inner[i].y);
        }
        for (let i = 0; i < N; i++) { const j = (i + 1) % N, a0 = i * 2, b0 = j * 2; idx.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1); }
        const cg = new THREE.BufferGeometry();
        cg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); cg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); cg.setIndex(idx); cg.computeVertexNormals();
        /* make sure the chamfer faces outward-down whatever the contour winding */
        const nrm = cg.getAttribute('normal'); if (nrm.getY(0) > 0) { idx.reverse(); cg.setIndex(idx); cg.computeVertexNormals(); }
        G.top.add(mk(cg, edgeM, 0, 0, 0));
        const bot = new THREE.ShapeGeometry(rr(L - 2 * c, D - 2 * c, Math.max(.002, r0 - c * .4)), 6); bot.rotateX(Math.PI / 2);
        G.top.add(mk(bot, topMat(S.top), 0, H - T, 0));
      } else {
        tg = new THREE.ExtrudeGeometry(rr(L, D, .012), { depth: T - .004, bevelEnabled: true, bevelThickness: .002, bevelSize: .002, bevelSegments: 2, curveSegments: 6 });
        tg.rotateX(-Math.PI / 2);
        top = mk(tg, [topMat(S.top), edgeM], 0, y0 + .002, 0); G.top.add(top);
      }
      if (fadeTop) { const ov = new THREE.Mesh(tg, fadeTop.mats); ov.position.copy(top.position); ov.renderOrder = 2; ov.userData.keep = 1; G.top.add(ov); fadeTop.mesh = ov; }
      /* power boxes */
      if (S.power) for (let i = 0; i < n; i++) {
        const cx = -L / 2 + (i + .5) * W, zs = dbl ? [.2, -.2] : [D / 2 - .2];
        zs.forEach(z => { G.top.add(mk(new THREE.BoxGeometry(.26, .008, .11), boxMat, cx, H + .002, z)); G.top.add(mk(new THREE.BoxGeometry(.24, .009, .006), hwMat, cx, H + .003, z - .03)); });
      }
      /* end frames */
      [-1, 1].forEach(sx => {
        const g = sx < 0 ? G.fL : G.fR, xE = sx * (L / 2 - .13), zl = dbl ? D / 2 - .11 : D / 2 - .07;
        g.add(mk(new THREE.BoxGeometry(.055, .055, 2 * zl + .06), legMat, xE, y0 - .028, 0));
        [-1, 1].forEach(sz => {
          const a = new THREE.Vector3(xE, y0 - .03, sz * zl), b = new THREE.Vector3(xE + sx * .1, .014, sz * (zl + .03));
          g.add(strut(a, b, .055, .045, legMat));
          g.add(mk(new THREE.CylinderGeometry(.021, .021, .014, 14), footMat, b.x, .007, b.z));
        });
      });
      G.ctr.add(mk(new THREE.BoxGeometry(Math.max(.1, L - .4), .04, .05), legMat, 0, y0 - .02, dbl ? 0 : -D / 2 + .2));
      /* central supports */
      for (let i = 1; i < n; i++) {
        const x = -L / 2 + i * W, pw = .2, ph = y0, pd = dbl ? .34 : .28;
        const s = new THREE.Shape(); s.moveTo(-pw / 2, 0); s.lineTo(-.055, 0); s.absarc(0, 0, .055, Math.PI, 0, true); s.lineTo(pw / 2, 0); s.lineTo(pw / 2, ph); s.lineTo(-pw / 2, ph); s.closePath();
        const pg = new THREE.ExtrudeGeometry(s, { depth: pd, bevelEnabled: true, bevelSize: .004, bevelThickness: .004, bevelSegments: 1, curveSegments: 10 }); pg.translate(0, 0, -pd / 2);
        G.ctr.add(mk(pg, legMat, x, .012, dbl ? 0 : -D / 2 + .2));
        [-1, 1].forEach(a => [-1, 1].forEach(c => G.ctr.add(mk(new THREE.CylinderGeometry(.018, .018, .012, 12), footMat, x + a * .075, .006, (dbl ? 0 : -D / 2 + .2) + c * (pd / 2 - .03)))));
      }
      /* screens */
      hotPts = {};
      if (sh > .01) for (let i = 0; i < n; i++) {
        const cx = -L / 2 + (i + .5) * W, sw = Math.max(.5, W - .16), zs = dbl ? 0 : -D / 2 + .035;
        const sg = new THREE.ExtrudeGeometry(rr(sw, sh, .045), { depth: .016, bevelEnabled: true, bevelSize: .006, bevelThickness: .006, bevelSegments: 3, curveSegments: 8 });
        sg.translate(0, sh / 2, -.008);
        G.scr.add(mk(sg, fabMat, cx, H + .022, zs));
        [-1, 1].forEach(a => { const c = mk(new THREE.BoxGeometry(.04, .075, .05), hwMat, cx + a * (sw / 2 - .13), H + .036, zs); G.scr.add(c); });
        if (i === 0) hotPts.screen = new THREE.Vector3(cx, H + .022 + sh * .8, zs);
      }
      /* tray */
      if (S.tray) {
        const lt = Math.max(.4, L - .6), z = dbl ? 0 : -D / 2 + .17, y = y0 - .13;
        G.tray.add(mk(new THREE.BoxGeometry(lt, .004, .17), legMat, 0, y, z));
        [-1, 1].forEach(s => G.tray.add(mk(new THREE.BoxGeometry(lt, .075, .004), legMat, 0, y + .036, z + s * .085)));
      }
      /* chairs */
      clearGroup(G.chairs);
      if (S.chairs) for (let i = 0; i < n; i++) (dbl ? [1, -1] : [1]).forEach(s => {
        const c = chairProto.clone(); c.traverse(o => o.userData.keep = 1);
        c.position.set(-L / 2 + (i + .5) * W, 0, s * (D / 2 + .3)); c.rotation.y = s > 0 ? 0 : Math.PI; G.chairs.add(c);
      });
      /* ao + hotspots + dims */
      ao.scale.set(L + .7, D + .7, 1);
      hotPts.top = new THREE.Vector3(-L * .3, H + .01, D * .18);
      hotPts.frame = new THREE.Vector3(L / 2 - .07, .36, D / 2 - .06);
      buildDims();
    }

    function buildDims() {
      const { L, D } = dims, m = new THREE.LineBasicMaterial({ color: 0x1c1c1a, transparent: true, opacity: .75 });
      const seg = (a, b) => { const g = new THREE.BufferGeometry().setFromPoints([a, b]); G.dims.add(new THREE.Line(g, m)); };
      const zf = D / 2 + .16, xr = L / 2 + .16, y = .004, tk = .05;
      seg(new THREE.Vector3(-L / 2, y, zf), new THREE.Vector3(L / 2, y, zf)); seg(new THREE.Vector3(-L / 2, y, zf - tk), new THREE.Vector3(-L / 2, y, zf + tk)); seg(new THREE.Vector3(L / 2, y, zf - tk), new THREE.Vector3(L / 2, y, zf + tk));
      seg(new THREE.Vector3(xr, y, -D / 2), new THREE.Vector3(xr, y, D / 2)); seg(new THREE.Vector3(xr - tk, y, -D / 2), new THREE.Vector3(xr + tk, y, -D / 2)); seg(new THREE.Vector3(xr - tk, y, D / 2), new THREE.Vector3(xr + tk, y, D / 2));
      seg(new THREE.Vector3(xr, 0, -D / 2), new THREE.Vector3(xr, H, -D / 2)); seg(new THREE.Vector3(xr - tk, H, -D / 2), new THREE.Vector3(xr + tk, H, -D / 2));
      dimLabels = [[new THREE.Vector3(0, y, zf), `${Math.round(L * 100)} ס״מ`], [new THREE.Vector3(xr, y, 0), `${Math.round(D * 100)} ס״מ`], [new THREE.Vector3(xr, H / 2, -D / 2), '75 ס״מ']];
      G.dims.visible = showDims();
    }

    const SIZE_KEYS = ['n', 'w', 'd', 'layout', 'sh'];
    let resizing = false;
    function update(k) {
      resizing = false;
      if (k === 'ral') { applyLeg(false); return; }
      if (k === 'hw') { applyHw(false); return; }
      if (k === 'fab') { tweenColor(fabMat, byId(FABRICS, S.fab).hex, 450); return; }
      if (k === 'top') {
        const mesh = G.top.children.find(c => Array.isArray(c.material));
        if (mesh) { const old = mesh.material.map(m => { const c = m.clone(); c.transparent = true; c.polygonOffset = true; c.polygonOffsetFactor = -2; c.polygonOffsetUnits = -2; c.depthWrite = false; return c; }); fadeTop = { mats: old, t: 0 }; }
        build(); return;
      }
      if (SIZE_KEYS.includes(k)) {
        dimT = { a: { ...dims }, b: { L: S.n * S.w / 100, D: S.d / 100, sh: S.sh / 100 }, t: 0 };
        if (k === 'sh' || k === 'n' || k === 'layout') build();
        resizing = true;
        return;
      }
      build();
    }

    function tick(dt, ease) {
      let r;
      if (dimT) { dimT.t = Math.min(1, dimT.t + dt / .65); const e = ease(dimT.t); dims = { L: dimT.a.L + (dimT.b.L - dimT.a.L) * e, D: dimT.a.D + (dimT.b.D - dimT.a.D) * e, sh: dimT.a.sh + (dimT.b.sh - dimT.a.sh) * e }; build(); if (dimT.t >= 1) { dimT = null; r = 'settled'; } }
      if (fadeTop) { fadeTop.t = Math.min(1, fadeTop.t + dt / .55); fadeTop.mats.forEach(m => m.opacity = 1 - ease(fadeTop.t)); if (fadeTop.t >= 1) { const ov = fadeTop.mesh; if (ov) { ov.parent && ov.parent.remove(ov); } fadeTop.mats.forEach(m => m.dispose()); fadeTop = null; } }
      return r;
    }

    function explode(ex) {
      G.top.position.y = .32 * ex; G.scr.position.y = .62 * ex; G.fL.position.x = -.38 * ex; G.fR.position.x = .38 * ex; G.tray.position.y = -.06 * ex;
      G.chairs.visible = ex < .05;
    }

    return {
      build, update, tick, explode,
      isResizing: () => resizing,
      dimsGroup: G.dims,
      fitSpan: () => Math.max(dims.L, dims.D * 1.35, 1.3),
      clampBox: () => ({ lx: dims.L / 2 + .4, lz: dims.D / 2 + .4 }),
      views: {
        topSec: fitR => ({ th: .5, ph: .72, r: fitR() * .85, tx: -dims.L * .12, ty: .62, tz: 0 }),
        frame: fitR => ({ th: 1.0, ph: 1.4, r: fitR() * .6, tx: dims.L / 2 - .25, ty: .38, tz: .1 }),
        screen: fitR => ({ th: .22, ph: 1.22, r: fitR() * .78, tx: 0, ty: .78, tz: 0 })
      },
      focusView: k => ({ size: 'hero', top: 'topSec', frame: 'frame', screen: S.sh ? 'screen' : 'hero', extra: 'hero' }[k] || 'hero'),
      hotspots: [['top', 'פלטה'], ['frame', 'רגליים ופרזול'], ['screen', 'מחיצות']],
      hotPts: () => hotPts,
      hotOffset: (k, ex) => k === 'top' ? .32 * ex : k === 'screen' ? .62 * ex : 0,
      dimLabels: () => dimLabels,
      snapLine: () => `${S.n * S.w}×${S.d}×75 ס״מ · ${byId(TOPS, S.top).he} · RAL ${S.ral}`
    };
  }
};
