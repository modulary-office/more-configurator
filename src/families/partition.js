/* Family: partition – open-space partitions.
   product.kind: 'frameless' (35 mm upholstered slab), 'thin' (32 mm, aluminium frame), 'thick' (65 mm, metal body with
   aluminium profiles), 'mobile' (upholstered slab on castor feet).
   Layouts: straight run, L, U, cross (four stations). Framed kinds take fabric, melamine boards (the decor catalogue)
   or melamine below + fabric above, and an optional glass band on top.
   Fabrics: catalogs/fabrics.json (the MODULARY fabric fan, RM-001…). Boards: catalogs/decors.json. */
import { genWeave, topTexture, thumbTop, fabThumb } from '../engine/textures.js';

const FALLBACK = { id: '', he: '', hex: '#8a8a86' };
const byId = (arr, id) => arr.find(x => x.id === id) || arr[0] || FALLBACK;
const KIND = {
  frameless: { he: 'מחיצה פריימלס', t: .035, framed: false },
  thin: { he: 'מחיצה דקה', t: .032, framed: true, post: .034, rail: .028, glassH: .3 },
  thick: { he: 'מחיצה עבה', t: .065, framed: true, post: .065, rail: .03, glassH: .4, plinth: .1 },
  mobile: { he: 'מחיצה ניידת', t: .04, framed: false }
};
const SHAPES = { I: 'ישרה', L: 'פינה (ר)', U: 'ח', E: 'תאים בשורה', X: 'צלב, ארבע עמדות', H: 'תאים משני הצדדים' };
const FILLS = { fabric: 'בד', combo: 'מלמין למטה, בד למעלה', melamine: 'לוחות מלמין' };
const GLASS = { none: 'ללא זכוכית', clear: 'זכוכית שקופה', frost: 'זכוכית מחוסמת חלבית' };
const TOP_H = .74, TOP_T = .025;

function lists(cat) { const items = n => (cat[n] && cat[n].items) || []; return { FAB: items('fabrics'), DEC: items('decors'), RAL: items('ral') }; }
const kindOf = product => KIND[product.kind] || KIND.thin;
const shapeOf = (S, product) => product.kind === 'mobile' ? 'I' : (SHAPES[S.shape] ? S.shape : 'I');
const fillOf = (S, product) => kindOf(product).framed ? (FILLS[S.fill] ? S.fill : 'fabric') : 'fabric';
const glassOf = (S, product) => kindOf(product).framed && GLASS[S.glass] ? S.glass : 'none';

/* plan of the layout: segments (centre, angle, length) in metres; +z is "towards the viewer".
   tops = worktops of the stations: [x0, x1, side] along the main run, side = +1 / −1 */
function plan(S, product) {
  const sh = shapeOf(S, product), n = sh === 'X' ? 2 : Math.max(1, S.n || 1), w = S.w / 100, d = (S.d || 80) / 100, segs = [], L = n * w;
  for (let i = 0; i < n; i++) segs.push({ x: -L / 2 + (i + .5) * w, z: 0, a: 0, len: w });
  const ret = (x, side) => segs.push({ x, z: side * d / 2, a: 1, len: d });
  const both = sh === 'X' || sh === 'H';
  if (sh === 'L' || sh === 'U') ret(-L / 2, 1);
  if (sh === 'U') ret(L / 2, 1);
  if (sh === 'E' || sh === 'H') for (let b = 0; b <= n; b++) { ret(-L / 2 + b * w, 1); if (sh === 'H') ret(-L / 2 + b * w, -1); }
  if (sh === 'X') { ret(0, 1); ret(0, -1); }
  const hasRet = sh !== 'I';
  const run = segs.reduce((t, g) => t + g.len, 0);
  const tops = [];
  if (S.top === 'yes' && product.kind !== 'mobile') for (let i = 0; i < n; i++) (both ? [1, -1] : [1]).forEach(side => tops.push([-L / 2 + i * w, -L / 2 + (i + 1) * w, side]));
  return { segs, L, D: !hasRet ? 0 : both ? 2 * d : d, zc: !hasRet || both ? 0 : d / 2, zmin: both ? -d : 0, zmax: hasRet ? d : 0, run, tops, topD: (S.topd || 70) / 100 };
}

export const partition = {
  ui(product, cat, S) {
    const { FAB, DEC, RAL } = lists(cat), K = kindOf(product);
    const ral = () => byId(RAL, S.ral), tops = () => P().tops.length, tdec = () => byId(DEC, S.tdec);
    const topTxt = () => tops() ? `${tops()} פלטות ${S.w}×${S.topd || 70} ס״מ, ${tdec().he}` : '';
    const P = () => plan(S, product), fill = () => fillOf(S, product), glass = () => glassOf(S, product);
    const fab = () => byId(FAB, S.fab), dec = () => byId(DEC, S.dec);
    const finTxt = () => fill() === 'fabric' ? `בד ${fab().he}` : fill() === 'melamine' ? `מלמין ${dec().he}` : `מלמין ${dec().he} למטה, בד ${fab().he} למעלה`;
    const sizeTxt = () => { const p = P(); return `${Math.round(p.L * 100)}${p.D ? ' × ' + Math.round(p.D * 100) : ''} × ${S.h} ס״מ`; };
    const swFab = () => `background:${fabThumb(fab().hex)};background-blend-mode:multiply`;
    return {
      metrics: () => { const p = P(); return { lengthM: p.run, areaM2: p.run * S.h / 100, modules: p.segs.length, glassM: glass() === 'none' ? 0 : p.run, tops: p.tops.length, topAreaM2: p.tops.length * S.w / 100 * p.topD }; },
      outputs: () => ({
        n: `${S.n || 1} <span class="mrc-seats">${'<i></i>'.repeat(S.n || 1)}</span>`,
        'n-lbl': product.kind === 'mobile' ? '' : `סה״כ ${Math.round(P().L * 100)} ס״מ`,
        dimtag: `${sizeTxt()}<small>${K.he} · ${SHAPES[shapeOf(S, product)]} · עובי ${Math.round(K.t * 1000)} מ״מ</small>`,
        summary: `${sizeTxt()} · ${SHAPES[shapeOf(S, product)]}`
      }),
      sectionValue: k => ({
        shape: `${SHAPES[shapeOf(S, product)]} · ${P().segs.length} מודולים`,
        size: sizeTxt(),
        finish: fill() === 'melamine' ? `<i style="background-image:url(${thumbTop(dec())})"></i>${dec().he}` : `<i style="${swFab()}"></i>${fab().he}${fill() === 'combo' ? ' + מלמין' : ''}`,
        frame: `<i style="background:${ral().hex}"></i>RAL ${ral().id}${glass() === 'none' ? '' : ' · ' + GLASS[glass()]}`,
        tops: tops() ? `<i style="background-image:url(${thumbTop(tdec())})"></i>${tops()} פלטות` : 'ללא פלטות'
      }[k]),
      toast: k => {
        if (k === 'fab') return [`בד: ${fab().he}`, swFab()];
        if (k === 'dec' || k === 'decFin') return [`מלמין: ${dec().he}`];
        if (k === 'fill') return [FILLS[fill()]];
        if (k === 'glass') return [GLASS[glass()]];
        if (k === 'ral') return [`צבע פרופיל: RAL ${ral().id} · ${ral().he}`, `background:${ral().hex}`];
        if (k === 'top' || k === 'topd' || k === 'tdec') return [tops() ? topTxt() : 'ללא פלטות'];
        if (k === 'ends') return [S.ends === 'round' ? 'פינות מעוגלות' : 'פינות ישרות'];
        return [sizeTxt()];
      },
      code: () => `${product.codePrefix || 'PT'}-${shapeOf(S, product)}${S.n || 1}-${S.w}${P().D ? 'x' + (S.d || 80) : ''}x${S.h}-${fill()[0].toUpperCase()}-${fill() === 'melamine' ? '' : (fab().code || S.fab)}${fill() === 'fabric' ? '' : (fill() === 'combo' ? '+' : '') + (dec().code || S.dec)}${glass() === 'none' ? '' : '-G' + glass()[0].toUpperCase()}${K.framed || tops() ? '-R' + ral().id : ''}${tops() ? '-T' + tops() + 'x' + (S.topd || 70) : ''}`,
      summary: () => [`${K.he}, ${SHAPES[shapeOf(S, product)]}, ${P().segs.length} מודולים`, `מידות ${sizeTxt()}, עובי ${Math.round(K.t * 1000)} מ״מ`, `סה״כ ${P().run.toFixed(2).replace(/\.?0+$/, '')} מטר רץ`,
        `חיפוי: ${finTxt()}`, K.framed ? `פרופיל אלומיניום צבוע RAL ${ral().id} · ${ral().he}` : (product.kind === 'frameless' ? (S.ends === 'round' ? 'פינות מעוגלות' : 'פינות ישרות') : ''),
        tops() ? `פלטות: ${topTxt()}, גובה 74 ס״מ${K.framed ? '' : `, רגליים RAL ${ral().id}`}` : '', glass() === 'none' ? '' : `${GLASS[glass()]}, פס עליון ${Math.round(K.glassH * 100)} ס״מ`]
    };
  },

  create({ THREE, scene, maxAniso, ao, S, product, cat, tweenColor, showDims }) {
    const { FAB, DEC, RAL } = lists(cat), K = kindOf(product);
    const ralHex = () => byId(RAL, S.ral).hex || '#b9bcc0';
    const weave = new THREE.CanvasTexture(genWeave(256)); weave.wrapS = weave.wrapT = THREE.RepeatWrapping; weave.colorSpace = THREE.SRGBColorSpace; weave.anisotropy = maxAniso;
    const fabMat = new THREE.MeshPhysicalMaterial({ color: byId(FAB, S.fab).hex, map: weave, roughness: .95, sheen: 1, sheenRoughness: .6, sheenColor: new THREE.Color(0xffffff).multiplyScalar(.3), envMapIntensity: .45 });
    const frameMat = new THREE.MeshStandardMaterial({ color: ralHex(), roughness: .42, metalness: .35, envMapIntensity: .9 });
    const footMat = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: .7 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xecebe7, roughness: .5, metalness: .1 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xd4e6ea, roughness: .05, metalness: 0, transparent: true, opacity: .28, envMapIntensity: 1.2, side: THREE.DoubleSide, depthWrite: false });
    const decMats = {};
    function decMat(id) {
      if (decMats[id]) return decMats[id];
      const def = byId(DEC, id), tex = topTexture(THREE, def, 512);
      tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = maxAniso;
      return decMats[id] = new THREE.MeshStandardMaterial({ map: tex, roughness: .6, metalness: 0, envMapIntensity: .6 });
    }
    /* UVs in metres, so weave and wood grain keep their real size on every panel */
    function worldUV(geo, tile) {
      const p = geo.attributes.position, nrm = geo.attributes.normal, uv = geo.attributes.uv;
      for (let i = 0; i < p.count; i++) {
        const ax = Math.abs(nrm.getX(i)), ay = Math.abs(nrm.getY(i));
        const u = ax > .6 ? p.getZ(i) : p.getX(i), v = ay > .6 ? p.getZ(i) : p.getY(i);
        uv.setXY(i, u / tile, v / tile);
      }
      uv.needsUpdate = true; return geo;
    }
    const mk = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
    const box = (w, h, d, mat, x, y, z, tile) => mk(tile ? worldUV(new THREE.BoxGeometry(w, h, d), tile) : new THREE.BoxGeometry(w, h, d), mat, x, y, z);
    function rr(w, h, r) {
      const s = new THREE.Shape(), x = -w / 2, y = -h / 2; r = Math.min(r, w / 2 - .001, h / 2 - .001);
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
    }
    /* upholstered slab, standing in the x–y plane, centred on x and z, bottom at y0 */
    function slab(len, h, t, r, y0) {
      const bev = Math.min(.008, t / 4), g = new THREE.ExtrudeGeometry(rr(len - 2 * bev, h - 2 * bev, r), { depth: t - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 8 });
      g.translate(0, y0 + h / 2, -(t - 2 * bev) / 2); return worldUV(g, .28);
    }

    const G = { fill: new THREE.Group(), frame: new THREE.Group(), glass: new THREE.Group(), feet: new THREE.Group(), tops: new THREE.Group(), dims: new THREE.Group() };
    /* everything hangs on one root, shifted so the layout sits around the origin (the camera looks at the origin) */
    const root = new THREE.Group(); scene.add(root);
    Object.values(G).forEach(g => root.add(g));
    const clear = g => { for (let i = g.children.length - 1; i >= 0; i--) { const o = g.children[i]; g.remove(o); o.traverse(c => c.geometry && c.geometry.dispose()); } };
    let hotPts = {}, dimLabels = [], cur = { L: 1, D: 0, zc: 0, H: 1.2 };

    /* one module of length len, built around the origin along x; returns groups to be placed by the caller */
    function module(len, H, add) {
      const fill = fillOf(S, product), glass = glassOf(S, product);
      if (!K.framed) {
        const mobile = product.kind === 'mobile', y0 = mobile ? .09 : .02;
        add('fill', mk(slab(len - .006, H - y0, K.t, mobile ? .05 : .014, y0), fabMat));
        if (mobile) {
          [-1, 1].forEach(s => {
            const x = s * (len / 2 - .14);
            add('feet', box(.035, .012, .5, whiteMat, x, .07, 0));
            add('feet', box(.03, .1, K.t + .012, whiteMat, x, .12, 0));
            [-1, 1].forEach(q => { const wh = mk(new THREE.CylinderGeometry(.03, .03, .022, 20), footMat, x, .03, q * .23); wh.rotation.z = Math.PI / 2; add('feet', wh); add('feet', box(.02, .04, .02, whiteMat, x, .055, q * .23)); });
          });
        } else [-1, 1].forEach(s => add('feet', mk(new THREE.CylinderGeometry(.013, .013, .02, 14), footMat, s * (len / 2 - .12), .01, 0)));
        return;
      }
      const thick = product.kind === 'thick', T = K.t, rail = K.rail, inner = len - K.post;   /* clear width between the posts */
      const y0 = thick ? K.plinth : .03, gh = glass === 'none' ? 0 : K.glassH;
      const top = H - rail, glassBot = top - gh, split = Math.min(.75, y0 + (glassBot - y0) * .5);
      const skinT = thick ? T - .012 : .018;
      const zone = (a, b, mat, tile) => { if (b - a > .02) add('fill', box(inner - .004, b - a - .004, skinT, mat, 0, (a + b) / 2, 0, tile)); };
      const railAt = y => add('frame', box(inner, rail, T, frameMat, 0, y + rail / 2, 0));
      /* bottom: plinth (thick) or a slim rail on feet (thin) */
      if (thick) add('frame', box(inner, K.plinth, T, frameMat, 0, K.plinth / 2, 0));
      else { add('frame', box(inner, rail, T, frameMat, 0, y0 - rail / 2 + .014, 0)); }
      const lowMat = fill === 'fabric' ? fabMat : decMat(S.dec), upMat = fill === 'melamine' ? decMat(S.dec) : fabMat;
      const lowTile = fill === 'fabric' ? .28 : .9, upTile = fill === 'melamine' ? .9 : .28;
      const bodyBot = y0 + (thick ? 0 : .014);
      if (fill === 'combo' || glassBot - bodyBot > 1.0) {
        zone(bodyBot, split, lowMat, lowTile); railAt(split - rail / 2); zone(split + rail / 2, glassBot - (gh ? rail : 0), upMat, upTile);
      } else zone(bodyBot, glassBot - (gh ? rail : 0), fill === 'melamine' ? decMat(S.dec) : fabMat, fill === 'melamine' ? .9 : .28);
      if (gh) {
        railAt(glassBot - rail);
        const gm = glassMat.clone(); if (glass === 'frost') { gm.opacity = .62; gm.roughness = .55; gm.color.set(0xe8eef0); }
        const pane = box(inner - .004, gh - .004, .006, gm, 0, glassBot + gh / 2, 0); pane.castShadow = false; add('glass', pane);
      }
      railAt(top);
    }

    function build() {
      Object.values(G).forEach(clear); hotPts = {};
      const p = plan(S, product), H = S.h / 100;
      { const tz = p.tops.length ? K.t / 2 + p.topD : 0, z0 = Math.min(p.zmin, p.tops.some(t => t[2] < 0) ? -tz : 0), z1 = Math.max(p.zmax, tz); cur = { L: p.L, D: z1 - z0, zc: (z0 + z1) / 2, H }; }
      /* joints of the layout: which segment ends meet where */
      const joints = new Map(), jk = (x, z) => `${Math.round(x * 1000)}|${Math.round(z * 1000)}`;
      const endPt = (sg, e) => sg.a ? [sg.x, sg.z + e * sg.len / 2] : [sg.x + e * sg.len / 2, sg.z];
      p.segs.forEach(sg => [-1, 1].forEach(e => { const [x, z] = endPt(sg, e), k = jk(x, z); (joints.get(k) || joints.set(k, []).get(k)).push({ sg, e, x, z }); }));
      /* frameless: a corner where one run meets one return is a single curved, upholstered piece (radius RC) */
      const round = product.kind === 'frameless' && S.ends === 'round', RC = .15, trims = new Map();
      const trim = (sg, e, v) => { const t = trims.get(sg) || trims.set(sg, { '-1': 0, '1': 0 }).get(sg); t[e] = Math.max(t[e], v); };
      joints.forEach(list => {
        const runs = list.filter(o => !o.sg.a), rets = list.filter(o => o.sg.a);
        if (round && list.length === 2 && runs.length === 1 && rets.length === 1 && runs[0].sg.len > RC + .15 && rets[0].sg.len > RC + .15) {
          const { x, z } = runs[0], ux = -runs[0].e, uz = -rets[0].e, y0 = .02;
          trim(runs[0].sg, runs[0].e, RC); trim(rets[0].sg, rets[0].e, RC);
          const a1 = uz * Math.PI / 2, a2 = ux > 0 ? Math.PI : 0; let dl = a2 - a1; while (dl > Math.PI) dl -= 2 * Math.PI; while (dl < -Math.PI) dl += 2 * Math.PI;
          const cw = dl < 0, Ro = RC + K.t / 2, Ri = RC - K.t / 2, sh = new THREE.Shape();
          sh.moveTo(Ro * Math.cos(a1), Ro * Math.sin(a1)); sh.absarc(0, 0, Ro, a1, a2, cw); sh.lineTo(Ri * Math.cos(a2), Ri * Math.sin(a2)); sh.absarc(0, 0, Ri, a2, a1, !cw); sh.closePath();
          const g = new THREE.ExtrudeGeometry(sh, { depth: H - y0 - .006, bevelEnabled: true, bevelThickness: .006, bevelSize: .004, bevelSegments: 2, curveSegments: 20 });
          g.rotateX(-Math.PI / 2); g.computeVertexNormals(); worldUV(g, .28);
          G.fill.add(mk(g, fabMat, x + ux * RC, y0 + .006, z + uz * RC));
        } else if (!K.framed && runs.length && rets.length) rets.forEach(o => trim(o.sg, o.e, K.t / 2));   /* returns butt against the run */
      });
      p.segs.forEach(sg => {
        const grp = {}, t = trims.get(sg) || { '-1': 0, '1': 0 };
        const add = (name, mesh) => { (grp[name] = grp[name] || new THREE.Group()).add(mesh); };
        module(sg.len - t[-1] - t[1], H, add);
        const off = (t[-1] - t[1]) / 2;
        Object.entries(grp).forEach(([name, g]) => { g.position.set(sg.x + (sg.a ? 0 : off), 0, sg.z + (sg.a ? off : 0)); g.rotation.y = sg.a ? -Math.PI / 2 : 0; G[name].add(g); });
      });
      if (K.framed) {
        /* a post at every joint and end */
        const pts = new Map();
        p.segs.forEach(sg => [-1, 1].forEach(s => { const x = sg.a ? sg.x : sg.x + s * sg.len / 2, z = sg.a ? sg.z + s * sg.len / 2 : sg.z; pts.set(`${Math.round(x * 1000)}|${Math.round(z * 1000)}`, [x, z]); }));
        pts.forEach(([x, z]) => {
          G.frame.add(box(K.post, H, K.post, frameMat, x, H / 2, z));
          if (product.kind === 'thin') G.feet.add(mk(new THREE.CylinderGeometry(.014, .014, .012, 14), footMat, x, -.004 + .006, z));
        });
      }
      /* joints and ends of the layout (shared by posts, rounded caps and the worktop legs) */
      const ends = new Map();
      p.segs.forEach(sg => [-1, 1].forEach(e => { const x = sg.a ? sg.x : sg.x + e * sg.len / 2, z = sg.a ? sg.z + e * sg.len / 2 : sg.z, k = `${Math.round(x * 1000)}|${Math.round(z * 1000)}`; ends.set(k, [x, z, (ends.get(k) || [0, 0, 0])[2] + 1]); }));
      /* worktops: carried by the partition, a leg at every front corner that no return panel reaches */
      if (p.tops.length) {
        const tm = decMat(S.tdec), td = p.topD, half = K.t / 2 + .004;
        const held = (x, zf) => p.segs.some(sg => sg.a && Math.abs(sg.x - x) < .07 && Math.sign(sg.z) === Math.sign(zf) && sg.len >= Math.abs(zf) - .12);
        p.tops.forEach(([x0, x1, side]) => {
          const cx = (x0 + x1) / 2, wT = x1 - x0 - K.t - .012, zc = side * (half + td / 2), zf = side * (half + td);
          const g = new THREE.ExtrudeGeometry(rr(wT, td, round ? RC - K.t / 2 - .008 : .012), { depth: TOP_T - .004, bevelEnabled: true, bevelThickness: .002, bevelSize: .002, bevelSegments: 2, curveSegments: 6 });
          g.rotateX(-Math.PI / 2); worldUV(g, .9); G.tops.add(mk(g, tm, cx, TOP_H - TOP_T + .002, zc));
          /* slim rail under the back edge, fixed to the partition */
          G.tops.add(box(wT - .08, .03, .02, frameMat, cx, TOP_H - TOP_T - .015, side * (half + .012)));
          [x0, x1].forEach((xe, i) => { if (held(xe, zf)) return; const lx = xe + (i ? -1 : 1) * (K.t / 2 + .05);
            G.tops.add(box(.04, TOP_H - TOP_T, .04, frameMat, lx, (TOP_H - TOP_T) / 2, zf - side * .05));
            G.feet.add(mk(new THREE.CylinderGeometry(.016, .016, .008, 14), footMat, lx, .004, zf - side * .05)); });
        });
        hotPts.tops = new THREE.Vector3((p.tops[0][0] + p.tops[0][1]) / 2, TOP_H + .01, half + td * .6);
      }
      const mid = p.segs[0];
      hotPts.finish = new THREE.Vector3(mid.x, H * .62, K.t / 2 + .01);
      hotPts.size = new THREE.Vector3(p.L / 2, H, 0);
      hotPts.frame = new THREE.Vector3(-p.L / 2, H * .3, K.t / 2 + .01);
      ao.scale.set(p.L + .7, Math.max(cur.D, .3) + .7, 1); ao.position.z = 0;
      buildDims(p, H);
      root.position.z = -cur.zc;
      Object.values(hotPts).forEach(v => { v.z -= cur.zc; }); dimLabels.forEach(l => { l[0].z -= cur.zc; });
    }

    function buildDims(p, H) {
      const m = new THREE.LineBasicMaterial({ color: 0x1c1c1a, transparent: true, opacity: .75 }), V = (x, y, z) => new THREE.Vector3(x, y, z);
      const seg = (a, b) => G.dims.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), m));
      const tz = p.tops.length ? K.t / 2 + p.topD : 0, zmin = Math.min(p.zmin, p.tops.some(t => t[2] < 0) ? -tz : 0), zmax = Math.max(p.zmax, tz);
      const zf = zmax + .22, xr = p.L / 2 + .22, y = .004, tk = .05;
      seg(V(-p.L / 2, y, zf), V(p.L / 2, y, zf)); seg(V(-p.L / 2, y, zf - tk), V(-p.L / 2, y, zf + tk)); seg(V(p.L / 2, y, zf - tk), V(p.L / 2, y, zf + tk));
      dimLabels = [[V(0, y, zf), `${Math.round(p.L * 100)} ס״מ`]];
      if (zmax - zmin > .2) { seg(V(xr, y, zmin), V(xr, y, zmax)); seg(V(xr - tk, y, zmin), V(xr + tk, y, zmin)); seg(V(xr - tk, y, zmax), V(xr + tk, y, zmax)); dimLabels.push([V(xr, y, (zmin + zmax) / 2), `${Math.round((zmax - zmin) * 100)} ס״מ`]); }
      seg(V(xr, 0, zmin), V(xr, H, zmin)); seg(V(xr - tk, H, zmin), V(xr + tk, H, zmin)); dimLabels.push([V(xr, H / 2, zmin), `${S.h} ס״מ`]);
      G.dims.visible = showDims();
    }

    function update(k) {
      if (k === 'fab') { tweenColor(fabMat, byId(FAB, S.fab).hex, 450); return; }
      if (k === 'ral') { tweenColor(frameMat, ralHex(), 350); return; }
      build();
    }
    const span = () => Math.max(cur.L, cur.D * 1.3, cur.H * 1.25, 1.3);

    return {
      build, update, tick: () => {}, explode: ex => { G.fill.position.z = .3 * ex; G.glass.position.y = .2 * ex; G.tops.position.y = .18 * ex; },
      isResizing: () => false,
      dimsGroup: G.dims,
      fitSpan: span,
      clampBox: () => ({ lx: cur.L / 2 + .5, lz: Math.max(cur.D, .4) / 2 + .6 }),
      targetY: () => cur.H * .48,
      hero: { th: .62, ph: 1.2 },
      views: { finish: fitR => ({ th: .35, ph: 1.32, r: fitR() * .85, tx: 0, ty: cur.H * .5, tz: 0 }) },
      focusView: k => ({ finish: 'finish' }[k] || 'hero'),
      hotspots: [['finish', 'חיפוי'], ['size', 'מידות'], ...(K.framed ? [['frame', 'מסגרת']] : []), ...(product.kind !== 'mobile' ? [['tops', 'פלטה']] : [])],
      hotPts: () => hotPts,
      hotOffset: () => 0,
      dimLabels: () => dimLabels,
      snapLine: () => `${Math.round(cur.L * 100)}${cur.D ? '×' + Math.round(cur.D * 100) : ''}×${S.h} ס״מ · ${fillOf(S, product) === 'melamine' ? byId(DEC, S.dec).he : byId(FAB, S.fab).he}`
    };
  }
};
