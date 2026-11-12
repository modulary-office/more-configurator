/* MODULARY · shades ring
   A 3D ring of melamine shades (Makor Haformaika). Drag to spin; hover a leaf for a moment or tap it, and it is pulled out
   of the ring and turned to face you as a sample chip, with its maker, number and finish. The three finishes (יער, מטריקס,
   בטון) change the relief of the chip under a raking light, so the difference can be seen and not only read.
   Embed:
     <link rel="stylesheet" href="…/modulary/shades-ring.css">
     <div class="mshr" data-cta="/contact/"></div>
     <script type="module" src="…/modulary/shades-ring.js"></script>
   Data: catalogs/decors.json of the configurator (126 shades, photos in catalogs/makor/). */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const DEFAULT_DATA = 'https://cdn.jsdelivr.net/gh/modulary-office/more-configurator@7f863e762b3d63daa55b8d11cb6440a1e29ba98d/catalogs/';
const FIN = {
  forest: { he: 'יער', line: 'טקסטורת עץ אמיתי: נקבוביות וסיבים לאורך הלוח, מורגשים במגע.' },
  matrix: { he: 'מטריקס', line: 'פסים אנכיים עדינים וטבעיים, משטח מט אחיד.' },
  concrete: { he: 'בטון', line: 'טקסטורת בטון: גבשושיות ונקבוביות קטנות, מגע מחוספס.' },
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- relief maps for the finishes (height → normal), drawn once ---------- */
let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
function noiseGrid(n) { const g = new Float32Array(n * n); for (let i = 0; i < g.length; i++) g[i] = rnd(); return g; }
function vnoise(g, n, x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const X0 = ((xi % n) + n) % n, X1 = (X0 + 1) % n, Y0 = ((yi % n) + n) % n, Y1 = (Y0 + 1) % n;
  const a = g[Y0 * n + X0], b = g[Y0 * n + X1], c = g[Y1 * n + X0], d = g[Y1 * n + X1];
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function heightMap(kind, S) {
  const h = new Float32Array(S * S), G = noiseGrid(64), G2 = noiseGrid(64);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x / S, v = y / S; let z = 0;
    if (kind === 'forest') {
      /* real-wood relief: wavy grain running along the board (y, like the photos), long pores sunk into it */
      const warp = vnoise(G2, 64, u * 2, v * 1.5) * 3;
      z = .6 * vnoise(G, 64, u * 60 + warp * 4, v * 1.5) + .25 * vnoise(G, 64, u * 150 + warp * 6, v * 3);
      const pore = vnoise(G2, 64, u * 120 + warp * 4, v * 16); if (pore > .8) z -= (pore - .8) * 2.5;
    } else if (kind === 'matrix') {
      /* matrix: straight, fine vertical streaks of uneven width – calmer and more regular than wood */
      const wob = vnoise(G2, 64, u * 4, v * 3) * .35;
      z = .5 * vnoise(G, 64, u * 320 + wob, v * 1.2) + .3 * vnoise(G, 64, u * 150 + wob, v * .8) + .2 * vnoise(G2, 64, u * 14, v * 2);
    } else {
      /* concrete: soft blotches, grit and a few pits */
      let f = 0, a = .5, fr = 4; for (let o = 0; o < 5; o++) { f += a * vnoise(G, 64, u * fr, v * fr); a *= .5; fr *= 2.1; }
      z = f + .25 * vnoise(G2, 64, u * 180, v * 180);
      const pit = vnoise(G2, 64, u * 70 + 13, v * 70 + 7); if (pit > .83) z -= (pit - .83) * 4;
    }
    h[y * S + x] = z;
  }
  return h;
}
function normalCanvas(kind, S = 512, strength = 6) {
  const h = heightMap(kind, S), c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const l = h[j * S + (i + S - 1) % S], r = h[j * S + (i + 1) % S], t = h[((j + S - 1) % S) * S + i], b = h[((j + 1) % S) * S + i];
    let nx = (l - r) * strength, ny = (b - t) * strength, nz = 1; const k = 1 / Math.hypot(nx, ny, nz); nx *= k; ny *= k; nz *= k;
    const o = (j * S + i) * 4; d[o] = (nx * .5 + .5) * 255; d[o + 1] = (ny * .5 + .5) * 255; d[o + 2] = (nz * .5 + .5) * 255; d[o + 3] = 255;
  }
  x.putImageData(img, 0, 0); return c;
}

/* ---------- shades shown on the ring: an even spread over the families ---------- */
function pickRing(items, n) {
  const fams = [...new Set(items.map(i => i.fam))], share = { wood: .34, white: .1, grey: .14, dark: .1, stone: .2, color: .12 };
  const out = [];
  for (const f of fams) {
    const xs = items.filter(i => i.fam === f), k = Math.max(2, Math.round(n * (share[f] || .1)));
    for (let j = 0; j < Math.min(k, xs.length); j++) out.push(xs[Math.floor((j + .5) * xs.length / Math.min(k, xs.length))]);
  }
  /* interleave so neighbours differ */
  const by = fams.map(f => out.filter(i => i.fam === f)), mix = [];
  for (let r = 0; mix.length < out.length; r++) for (const b of by) if (b[r]) mix.push(b[r]);
  return mix;
}

function boot(sec) {
  const DATA = sec.dataset.catalog || DEFAULT_DATA, CTA = sec.dataset.cta || '/contact/';
  sec.setAttribute('dir', 'rtl');
  sec.innerHTML = `<div class="mshr__text">
  <div class="mshr__kicker">MODULARY · גוונים</div>
  <h2 class="mshr__title">126 גוונים.<br>3 גימורים.</h2>
  <p class="mshr__body">כל הגוונים של מלמין מקור הפורמייקה, כפי שהם יוצאים לייצור. גררו את הטבעת, עצרו על גוון או הקישו עליו, והוא ייצא אליכם עם המספר שלו והגימור.</p>
  <div class="mshr__card" aria-live="polite" hidden>
    <div class="mshr__chip"></div>
    <div class="mshr__meta"><span class="mshr__maker">מקור הפורמייקה · מלמין</span><b class="mshr__code"></b><span class="mshr__fam"></span></div>
    <div class="mshr__fins" role="radiogroup" aria-label="גימור">${Object.entries(FIN).map(([k, f]) => `<button type="button" role="radio" data-fin="${k}">${f.he}</button>`).join('')}</div>
    <p class="mshr__finline"></p>
    <div class="mshr__acts"><a class="mshr__cta" href="#">הגוון הזה לפרויקט שלי</a><button type="button" class="mshr__back">חזרה לטבעת</button></div>
  </div>
  <details class="mshr__all"><summary>כל 126 הגוונים</summary><div class="mshr__famchips" role="tablist"></div><div class="mshr__grid"></div></details>
</div>
<div class="mshr__stage"><canvas class="mshr__canvas" aria-hidden="true"></canvas><div class="mshr__hint">גררו לסיבוב · עצרו או הקישו על גוון</div></div>`;
  const $ = s => sec.querySelector(s), stage = $('.mshr__stage'), canvas = $('.mshr__canvas'), card = $('.mshr__card');
  /* on narrow screens the card sits over the bottom of the stage, so the chip and its details are seen together */
  const narrow = matchMedia('(max-width: 860px)');
  const placeCard = () => { if (narrow.matches) stage.appendChild(card); else $('.mshr__body').after(card); };
  placeCard(); narrow.addEventListener('change', placeCard);
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)'); let reduce = reduceMQ.matches || !!window.MR_STILL;
  document.addEventListener('mr-a11y', e => { reduce = reduceMQ.matches || !!(e.detail && e.detail.still); });

  fetch(DATA + 'decors.json').then(r => r.json()).then(cat => {
    const items = cat.items.filter(i => i.img), fams = cat.families || [];
    const ringItems = pickRing(items, +sec.dataset.leaves || 54);
    const imgURL = i => DATA + i.img, thumbURL = i => DATA + (i.thumb || i.img);

    /* the full list: family chips + thumbnails */
    const chips = $('.mshr__famchips'), grid = $('.mshr__grid');
    chips.innerHTML = fams.map(f => `<button type="button" role="tab" data-fam="${f.id}">${esc(f.he)}</button>`).join('');
    grid.innerHTML = items.map(i => `<button type="button" data-id="${i.id}" data-fam="${i.fam}" title="גוון ${i.code}" aria-label="גוון ${i.code}" style="background-image:url('${thumbURL(i)}')"><span>${i.code}</span></button>`).join('');
    const showFam = f => { chips.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', b.dataset.fam === f)); grid.querySelectorAll('button').forEach(b => { b.hidden = b.dataset.fam !== f; }); };
    chips.addEventListener('click', e => { const b = e.target.closest('button'); if (b) showFam(b.dataset.fam); });
    showFam(fams[0] && fams[0].id);
    grid.addEventListener('click', e => { const b = e.target.closest('button'); if (b) pull(items.find(i => i.id === b.dataset.id), -1); });

    /* ---------- WebGL ---------- */
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { sec.classList.add('no-gl'); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02;
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(32, 1, .1, 50); cam.position.set(0, 0, 9.2);
    scene.add(new THREE.HemisphereLight(0xfff8ec, 0xb9ad98, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(-3, 5, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffe9b8, .9); rim.position.set(4, -2, -3); scene.add(rim);
    /* a low raking light that sweeps across the sample chip, so the relief of the finish shows */
    const rake = new THREE.DirectionalLight(0xffffff, 0); scene.add(rake); scene.add(rake.target);

    const loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
    const texCache = {};
    const photo = i => texCache[i.id] || (texCache[i.id] = (() => { const t = loader.load(imgURL(i)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; })());
    const normals = {}; const normalTex = k => normals[k] || (normals[k] = (() => { const t = new THREE.CanvasTexture(normalCanvas(k)); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })());

    /* leaf: a rounded slab, u along its length */
    const leafShape = (L, H, r) => { const s = new THREE.Shape(); s.moveTo(-L + r, -H); s.lineTo(L - r, -H); s.quadraticCurveTo(L, -H, L, -H + r); s.lineTo(L, H - r); s.quadraticCurveTo(L, H, L - r, H); s.lineTo(-L + r, H); s.quadraticCurveTo(-L, H, -L, H - r); s.lineTo(-L, -H + r); s.quadraticCurveTo(-L, -H, -L + r, -H); return s; };
    const Lh = .95, Hh = .33;
    const geo = new THREE.ExtrudeGeometry(leafShape(Lh, Hh, .32), { depth: .05, bevelEnabled: true, bevelThickness: .025, bevelSize: .025, bevelSegments: 3, curveSegments: 10 });
    geo.translate(0, 0, -.025);
    { const uv = geo.attributes.uv, p = geo.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, .1 + .8 * (p.getX(i) + Lh) / (2 * Lh), .35 + .3 * (p.getY(i) + Hh) / (2 * Hh)); }
    const leafMat = {}; const matFor = i => leafMat[i.id] || (leafMat[i.id] = new THREE.MeshStandardMaterial({ map: photo(i), color: 0xffffff, roughness: i.fam === 'stone' ? .45 : .58, metalness: 0 }));
    const N = ringItems.length, R = 1.55, ring = new THREE.Group(), leaves = [];
    ringItems.forEach(i => { const m = new THREE.Mesh(geo, matFor(i)); m.userData.item = i; ring.add(m); leaves.push(m); });
    const tilt = new THREE.Group(); tilt.add(ring); tilt.rotation.x = -.52; tilt.rotation.y = .18; scene.add(tilt);

    /* the sample chip: a thicker rounded panel facing the camera */
    const CW = 1.15, CH = .78;
    const chipGeo = new THREE.ExtrudeGeometry(leafShape(CW, CH, .09), { depth: .08, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 3, curveSegments: 8 });
    chipGeo.translate(0, 0, -.04);
    { const uv = chipGeo.attributes.uv, p = chipGeo.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + CW) / (2 * CW), (p.getY(i) + CH) / (2 * CH)); }
    const chipMat = new THREE.MeshStandardMaterial({ roughness: .55, metalness: 0, normalScale: new THREE.Vector2(.9, .9) });
    const chip = new THREE.Mesh(chipGeo, chipMat); chip.visible = false; scene.add(chip);

    const tmp = new THREE.Vector3(), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), M4 = new THREE.Matrix4();
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    let spin = 0, vel = .12, drag = null, open = 0, openT0 = null, visible = false, last = performance.now(), interacted = false;
    let sel = null, selLeaf = -1, selT = 0, fin = 'forest', hover = { leaf: -1, t: 0 };
    const from = { p: new THREE.Vector3(), q: new THREE.Quaternion(), s: 1 };

    function layout(t) {
      const ease = 1 - Math.pow(1 - open, 3);
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 * ease + spin, rad = tmp.set(Math.cos(a), Math.sin(a), 0), th = a * 2 + t * .25;
        X.set(0, 0, 1).multiplyScalar(Math.sin(th)).addScaledVector(rad, Math.cos(th)); Z.set(-Math.sin(a), Math.cos(a), 0); Y.crossVectors(Z, X).normalize();
        M4.makeBasis(X, Y, Z); const m = leaves[i]; m.quaternion.setFromRotationMatrix(M4); m.rotateY(.42);
        m.position.copy(rad).multiplyScalar(R * (.35 + .65 * ease));
        m.visible = !(sel && i === selLeaf && chip.visible);
        const lift = i === hover.leaf && !sel ? Math.min(1, (performance.now() - hover.t) / 200) : 0;
        if (lift) m.position.addScaledVector(rad, .25 * lift);
      }
    }
    function resize() {
      const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h;
      cam.position.z = w / h < .9 ? 11.5 : 9.2; cam.updateProjectionMatrix();
    }
    addEventListener('resize', resize); resize();

    /* where the chip ends up: in front of the ring, a little lower on narrow screens */
    const chipHome = () => narrow.matches ? new THREE.Vector3(0, .95, 2.2) : new THREE.Vector3(0, 0, 2.6);
    function setFinish(k) {
      fin = k; chipMat.normalMap = normalTex(k);
      chipMat.roughness = k === 'concrete' ? .82 : k === 'matrix' ? .62 : .5; { const ns = k === 'concrete' ? 1.1 : k === 'matrix' ? .6 : .8; chipMat.normalScale.set(ns, ns); } chipMat.needsUpdate = true;
      card.querySelectorAll('[data-fin]').forEach(b => b.setAttribute('aria-checked', b.dataset.fin === k));
      $('.mshr__finline').textContent = FIN[k].line; updateCTA(); selT = Math.min(selT, performance.now() - 900);
    }
    function updateCTA() { if (!sel) return; const subj = `גוון ${sel.code} (מקור הפורמייקה, מלמין) · גימור ${FIN[fin].he}`; $('.mshr__cta').href = CTA + (CTA.includes('?') ? '&' : '?') + 'subject=' + encodeURIComponent(subj); }
    function pull(item, leafIdx) {
      if (!item) return;
      sel = item; selLeaf = leafIdx; selT = performance.now(); interacted = true; $('.mshr__hint').style.opacity = 0;
      chipMat.map = photo(item); chipMat.needsUpdate = true;
      if (leafIdx >= 0) { const m = leaves[leafIdx]; m.getWorldPosition(from.p); m.getWorldQuaternion(from.q); from.s = .8; }
      else { from.p.set(0, -3, 1); from.q.identity(); from.s = .6; }
      chip.visible = true; setFinish(fin);
      card.hidden = false; $('.mshr__chip').style.backgroundImage = `url('${thumbURL(item)}')`;
      $('.mshr__code').textContent = `גוון ${item.code}`;
      const f = fams.find(x => x.id === item.fam); $('.mshr__fam').textContent = f ? f.he : '';
      grid.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === item.id));
      sec.classList.add('is-picked');
    }
    function release() { sel = null; selLeaf = -1; chip.visible = false; card.hidden = true; sec.classList.remove('is-picked'); grid.querySelectorAll('[aria-pressed="true"]').forEach(b => b.setAttribute('aria-pressed', 'false')); vel = .12; }
    card.addEventListener('click', e => { const b = e.target.closest('[data-fin]'); if (b) setFinish(b.dataset.fin); if (e.target.closest('.mshr__back')) release(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && sel) release(); });

    const qTo = new THREE.Quaternion(), eTo = new THREE.Euler();
    function frame(now) {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (visible) {
        if (openT0 == null) openT0 = now;
        open = reduce ? 1 : Math.min(1, (now - openT0) / 1600);
        const target = sel ? 0 : (reduce ? 0 : .12);
        if (!drag) { vel += (target - vel) * Math.min(1, dt * (sel ? 4 : 1.5)); spin += vel * dt; }
        layout(reduce ? 0 : now / 1000);
        /* hover a leaf for a moment → pull it */
        if (!sel && hover.leaf >= 0 && !drag && now - hover.t > 650) pull(leaves[hover.leaf].userData.item, hover.leaf);
        if (sel) {
          const k = reduce ? 1 : Math.min(1, (now - selT) / 900), e = 1 - Math.pow(1 - k, 3);
          const home = chipHome(), wob = reduce ? 0 : Math.sin(now / 1400) * .12;
          eTo.set(-.08 + (reduce ? 0 : Math.sin(now / 1900) * .05), wob, 0); qTo.setFromEuler(eTo);
          chip.position.lerpVectors(from.p, home, e); chip.quaternion.slerpQuaternions(from.q, qTo, e); chip.scale.setScalar(from.s + (1 - from.s) * e);
          /* raking light: low over the surface, sweeping slowly from side to side */
          const sw = reduce ? .6 : Math.sin(now / 1600);
          rake.intensity = 2.6 * e; rake.position.set(home.x + sw * 3, home.y + 1.2, home.z + .35); rake.target.position.copy(home);
          key.intensity = 2.0 - .9 * e;
          ring.children.forEach(m => { m.material.color.setScalar(1 - .35 * e); });
        } else { rake.intensity = 0; key.intensity = 2.0; ring.children.forEach(m => m.material.color.setScalar(1)); }
        renderer.render(scene, cam);
      }
      requestAnimationFrame(frame);
    }
    new IntersectionObserver(es => es.forEach(e => (visible = e.isIntersecting)), { threshold: .15 }).observe(stage);

    const hit = e => { const b = canvas.getBoundingClientRect(); ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); ray.setFromCamera(ndc, cam);
      const h = ray.intersectObjects(chip.visible ? [chip, ...leaves] : leaves)[0]; return h ? (h.object === chip ? 'chip' : leaves.indexOf(h.object)) : -1; };
    stage.addEventListener('pointerdown', e => { drag = { x: e.clientX, s: spin, t: performance.now(), moved: false }; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener('pointermove', e => {
      if (drag) {
        const dx = e.clientX - drag.x; if (Math.abs(dx) > 6) drag.moved = true;
        if (!sel) { const ns = drag.s - dx * .006, now = performance.now(); vel = (ns - spin) / Math.max(.016, (now - drag.t) / 1000); spin = ns; drag.t = now; }
        if (!interacted && Math.abs(dx) > 8) { interacted = true; $('.mshr__hint').style.opacity = 0; }
        return;
      }
      if (e.pointerType !== 'mouse' || sel) return;
      const h = hit(e); if (h !== hover.leaf) hover = { leaf: typeof h === 'number' ? h : -1, t: performance.now() };
      stage.style.cursor = hover.leaf >= 0 ? 'pointer' : '';
    });
    stage.addEventListener('pointerleave', () => { hover = { leaf: -1, t: 0 }; });
    const up = e => {
      if (!drag) return;
      if (!drag.moved && e.type === 'pointerup') {
        const h = hit(e);
        if (h === 'chip') { const ks = Object.keys(FIN); setFinish(ks[(ks.indexOf(fin) + 1) % ks.length]); }
        else if (h >= 0) pull(leaves[h].userData.item, h);
        else if (sel) release();
      } else if (!sel) vel = Math.max(-4, Math.min(4, vel));
      drag = null;
    };
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    addEventListener('scroll', () => { if (visible && !drag && !sel) vel += .02; }, { passive: true });
    layout(0); renderer.render(scene, cam); requestAnimationFrame(frame);
    sec.__shades = { pull: (code, finish) => { const i = items.find(x => x.code === String(code)); const li = leaves.findIndex(m => m.userData.item === i); pull(i, li); if (finish) setFinish(finish); }, release, setFinish, items, ringItems };
  }).catch(() => sec.classList.add('no-data'));
}
document.querySelectorAll('.mshr:not([data-booted])').forEach(s => { s.dataset.booted = '1'; boot(s); });
