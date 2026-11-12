/* Generic 3D stage: renderer, studio lighting, floor + contact shadow, orbit camera with touch/mouse input,
   view presets, tools (auto-rotate, dimensions, exploded view, fullscreen), hotspots, snapshot, render loop.
   Everything product-specific comes from the family instance (see families/*.js). */
import * as THREE from 'three';

export function createViewer({ root, stage, $, $$, S, product, cat, family, ui }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.insertBefore(renderer.domElement, stage.firstChild);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .05, 60);

  /* environment */
  const pm = new THREE.PMREMGenerator(renderer);
  const es = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(12, 7, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(.55, .52, .48), side: THREE.BackSide })); room.position.y = 3; es.add(room);
  const panel = (w, h, p, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(i, i * .98, i * .95), side: THREE.DoubleSide })); m.position.set(...p); m.lookAt(0, 1, 0); es.add(m); };
  panel(5, 3, [0, 6.4, 0], 5); panel(3, 2.5, [5.9, 2.5, 1], 3.2); panel(3, 2.5, [-5.9, 2.8, -1.5], 2); panel(4, 2, [0, 2.5, 5.9], 1.6);
  const floorE = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(.75, .7, .62) })); floorE.rotation.x = -Math.PI / 2; floorE.position.y = -.4; es.add(floorE);
  scene.environment = pm.fromScene(es, .04).texture;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9cfbf, .55));
  const key = new THREE.DirectionalLight(0xfff6ea, 2.1); key.position.set(2.6, 5.5, 3.4); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0004; key.shadow.normalBias = .02;
  const sc = key.shadow.camera; sc.left = -3.4; sc.right = 3.4; sc.top = 3.4; sc.bottom = -3.4; sc.near = 1; sc.far = 14;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe9efff, .5); fill.position.set(-4, 3, -2); scene.add(fill);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: .2 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const aoC = document.createElement('canvas'); aoC.width = aoC.height = 128; { const g = aoC.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(60,45,30,.55)'); gr.addColorStop(1, 'rgba(60,45,30,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  const ao = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(aoC), transparent: true, depthWrite: false }));
  ao.rotation.x = -Math.PI / 2; ao.position.y = .001; scene.add(ao);

  /* colour tweens shared by all families */
  const tweens = [];
  const tweenColor = (m, hex, dur = 380) => tweens.push({ m, a: m.color.clone(), b: new THREE.Color(hex), t: 0, dur });

  let showDims = false;
  const P = family.create({ THREE, scene, renderer, maxAniso: renderer.capabilities.getMaxAnisotropy(), ao, S, product, cat, tweenColor, showDims: () => showDims });

  /* overlays */
  const hotEls = {};
  (P.hotspots || []).forEach(([k, t]) => {
    const b = document.createElement('button'); b.className = 'mrc-hot'; b.type = 'button'; b.innerHTML = `<span>${t}</span>`; b.setAttribute('aria-label', t);
    b.addEventListener('click', () => { const s = $(`.mrc-sec[data-sec="${k}"]`); if (!s.classList.contains('open')) ui.openSec(k); else focus(k); s.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
    stage.appendChild(b); hotEls[k] = b;
  });
  const dimEls = [0, 1, 2].map(() => { const d = document.createElement('div'); d.className = 'mrc-dlabel'; stage.appendChild(d); return d; });

  /* camera */
  const cam = { th: .78, ph: 1.12, r: 4, tx: 0, ty: .45, tz: 0 }, goal = { ...cam };
  root._cam = goal;
  let autoRot = true, lastInput = performance.now() - 9000, explode = 0, explodeGoal = 0;
  function fitR() { const sw = stage.clientWidth, sh = stage.clientHeight, asp = sw && sh ? sw / sh : 1.4; const base = 1.5 + 1.5 * P.fitSpan(); return base * (asp < 1.1 ? Math.pow(1.1 / asp, .75) : 1); }
  /* families may set their own look-at height (tall cabinets) and hero angle */
  const TY = d => (P.targetY ? P.targetY() : d);
  const HERO = P.hero || { th: .78, ph: 1.12 };
  const VIEWS = {
    hero: () => ({ th: HERO.th, ph: HERO.ph, r: fitR(), tx: 0, ty: TY(.42), tz: 0 }),
    front: () => ({ th: 0, ph: 1.38, r: fitR() * .95, tx: 0, ty: TY(.5), tz: 0 }),
    side: () => ({ th: Math.PI / 2, ph: 1.36, r: fitR() * .8, tx: 0, ty: TY(.5), tz: 0 }),
    top: () => ({ th: 0, ph: .04, r: fitR() * 1.05, tx: 0, ty: TY(.4), tz: 0 })
  };
  for (const [k, f] of Object.entries(P.views || {})) VIEWS[k] = () => f(fitR);
  function setView(v) { Object.assign(goal, (VIEWS[v] || VIEWS.hero)()); $$('[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === v)); }
  function focus(k) { lastInput = performance.now(); setView((P.focusView && P.focusView(k)) || 'hero'); }

  /* input: one finger / mouse = orbit · two fingers = pinch zoom + pan · right-drag or shift = pan · double tap = reset */
  const el = renderer.domElement, ptrs = new Map(); let g0 = null, lastTap = 0;
  const phoneLayout = () => matchMedia('(max-width:980px)').matches && matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) < 600;
  const rMin = () => fitR() * .3, rMax = () => fitR() * 2.6;
  const clampT = () => { const { lx, lz } = P.clampBox(); goal.tx = Math.max(-lx, Math.min(lx, goal.tx)); goal.tz = Math.max(-lz, Math.min(lz, goal.tz)); goal.ty = Math.max(.05, Math.min(P.maxY ? P.maxY() : 1.4, goal.ty)); };
  function pan(dx, dy) {
    const h = stage.clientHeight || 1, k = 2 * cam.r * Math.tan(camera.fov * Math.PI / 360) / h;
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0), upv = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    goal.tx += (-dx * right.x + dy * upv.x) * k; goal.ty += (-dx * right.y + dy * upv.y) * k; goal.tz += (-dx * right.z + dy * upv.z) * k; clampT();
  }
  function twoState() { const [a, b] = [...ptrs.values()]; return { d: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, r: goal.r }; }
  const touched = () => { moved = true; lastInput = performance.now(); const hnt = $('.mrc-hint'); if (hnt) hnt.style.opacity = 0; $$('[data-view]').forEach(b => b.classList.remove('on')); };
  /* tap on a part: families that colour parts separately (lounge) get the mesh under the finger */
  const ray = new THREE.Raycaster(); let tap0 = null;
  el.addEventListener('pointerdown', e => { tap0 = { x: e.clientX, y: e.clientY, t: performance.now() }; }, true);
  el.addEventListener('pointerup', e => {
    if (!P.pick || !tap0 || Math.hypot(e.clientX - tap0.x, e.clientY - tap0.y) > 6 || performance.now() - tap0.t > 400) return;
    const r = el.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), camera);
    const hit = ray.intersectObjects(scene.children, true).find(h => { let o = h.object; while (o && !(o.userData && o.userData.part)) o = o.parent; return o; });
    if (!hit) return;
    let o = hit.object; while (!o.userData.part) o = o.parent;
    const msg = P.pick(o.userData.part);
    if (msg) { ui.refresh && ui.refresh(); if (msg.section) ui.openSec(msg.section); ui.toast(msg.text, msg.sw); }
  });
  el.addEventListener('pointerdown', e => {
    if (e.isPrimary) ptrs.clear();
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, btn: e.button, shift: e.shiftKey });
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
    touched();
    if (ptrs.size === 2) g0 = twoState();
    if (e.pointerType !== 'mouse' && ptrs.size === 1) { const now = performance.now(); if (now - lastTap < 300) { setView('hero'); lastTap = 0; } else lastTap = now; }
  });
  el.addEventListener('pointermove', e => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) { ptrs.delete(e.pointerId); return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (Math.abs(dx) + Math.abs(dy) > 2) lastTap = 0;
    touched();
    if (ptrs.size === 1) {
      if (p.btn === 2 || p.btn === 1 || p.shift) { pan(dx, dy); return; }
      goal.th -= dx * .0085;
      if (!phoneLayout()) goal.ph = Math.max(.04, Math.min(1.52, goal.ph - dy * .0065));
    } else if (ptrs.size >= 2 && g0) {
      const s2 = twoState();
      goal.r = Math.max(rMin(), Math.min(rMax(), g0.r * g0.d / s2.d));
      pan(s2.mx - g0.mx, s2.my - g0.my); g0.mx = s2.mx; g0.my = s2.my;
    }
  });
  const up = e => { ptrs.delete(e.pointerId); try { el.releasePointerCapture(e.pointerId); } catch (_) {} g0 = ptrs.size >= 2 ? twoState() : null; };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => el.addEventListener(t, up));
  addEventListener('pointerup', up); addEventListener('blur', () => { ptrs.clear(); g0 = null; });
  el.addEventListener('contextmenu', e => e.preventDefault());
  el.addEventListener('wheel', e => {
    e.preventDefault(); touched();
    if (e.ctrlKey) { goal.r = Math.max(rMin(), Math.min(rMax(), goal.r * Math.exp(e.deltaY * .01))); return; }
    if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5) { pan(-e.deltaX * .6, 0); return; }
    goal.r = Math.max(rMin(), Math.min(rMax(), goal.r * Math.exp(Math.sign(e.deltaY) * Math.min(.14, Math.abs(e.deltaY) * .0014))));
  }, { passive: false });
  ['gesturestart', 'gesturechange'].forEach(t => el.addEventListener(t, e => e.preventDefault()));
  el.addEventListener('dblclick', () => setView('hero'));

  $$('[data-view]').forEach(b => b.addEventListener('click', () => { lastInput = performance.now(); setView(b.dataset.view); }));
  $$('[data-tool]').forEach(b => b.addEventListener('click', () => {
    const t = b.dataset.tool;
    if (t === 'rot') { autoRot = !autoRot; b.classList.toggle('on', autoRot); lastInput = 0; }
    if (t === 'dims') { showDims = !showDims; P.dimsGroup.visible = showDims; b.classList.toggle('on', showDims); ui.toast(showDims ? 'מוצגות מידות' : 'הוסתרו המידות'); }
    if (t === 'explode') { explodeGoal = explodeGoal ? 0 : 1; b.classList.toggle('on', !!explodeGoal); ui.toast(explodeGoal ? 'תצוגת הרכבה' : 'תצוגה רגילה'); if (explodeGoal) { setView('hero'); goal.r = fitR() * 1.3; goal.ty = .7; } }
    if (t === 'full') { const on = !root.classList.contains('is-full'); root.classList.toggle('is-full', on); b.classList.toggle('on', on); document.documentElement.style.overflow = on ? 'hidden' : ''; setTimeout(resize, 50); setTimeout(() => setView('hero'), 80); }
  }));
  addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('is-full')) $('[data-tool="full"]').click(); });

  let sized = false, moved = false;
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    if (!sized) { sized = true; Object.assign(cam, VIEWS.hero(), { th: 1.9, r: fitR() * 1.35 }); }
    if (!moved) { const th = goal.th; setView('hero'); goal.th = th; }
    const f = fitR(); if (Math.abs(goal.r - f) > .01 && performance.now() - lastInput > 1500) goal.r = Math.min(goal.r, f * 1.8);
  }
  new ResizeObserver(resize).observe(stage);

  /* update from UI */
  function update(k) {
    P.update(k);
    if (P.isResizing && P.isResizing() && performance.now() - lastInput > 400) Object.assign(goal, { r: Math.max(goal.r, 0) });
  }

  /* snapshot */
  function snap() {
    renderFrame(0);
    const src = renderer.domElement, w = src.width, h = src.height, c = document.createElement('canvas');
    c.width = w; c.height = h + Math.round(h * .16); const x = c.getContext('2d');
    const gr = x.createRadialGradient(w / 2, h * .38, 10, w / 2, h * .5, w * .8); gr.addColorStop(0, '#FFFDF9'); gr.addColorStop(1, '#E9E2D6'); x.fillStyle = gr; x.fillRect(0, 0, w, c.height);
    x.drawImage(src, 0, 0);
    const fy = h, fh = c.height - h; x.fillStyle = '#1C1C1A'; x.fillRect(0, fy, w, fh);
    const fs = Math.round(fh * .26); x.fillStyle = '#F8DC55'; x.font = `700 ${fs}px sans-serif`; x.textAlign = 'left'; x.fillText('MORE', fh * .3, fy + fh * .45);
    x.fillStyle = '#F3EEE5'; x.font = `500 ${Math.round(fs * .55)}px sans-serif`; x.fillText(`${ui.name} · ${ui.code()}`, fh * .3, fy + fh * .78);
    x.textAlign = 'right'; x.direction = 'rtl'; x.fillText(P.snapLine(), w - fh * .3, fy + fh * .45);
    x.fillText('modularymore.co.il', w - fh * .3, fy + fh * .78);
    c.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `MORE-${ui.code()}.png`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); ui.toast('התמונה נשמרה'); }, 'image/png');
  }

  /* picture for a project item: always the same front three-quarter angle, at a fixed 4:3 size, cropped to the product
     (not whatever angle or zoom the visitor happens to be at), on the cream ground, JPEG */
  function thumb(maxW = 900) {
    const W = 1200, H = 900, keep = { ...cam }, keepEx = explode, oldW = renderer.domElement.width, oldH = renderer.domElement.height, sw = stage.clientWidth, sh = stage.clientHeight;
    let out = '';
    try {
      renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
      Object.assign(cam, VIEWS.hero(), { r: (1.5 + 1.5 * P.fitSpan()) * 1.05 });
      explode = 0; P.explode(0);
      renderFrame(0);
      const src = renderer.domElement, t = document.createElement('canvas'); t.width = W; t.height = H;
      const tx = t.getContext('2d'); tx.drawImage(src, 0, 0, W, H);
      /* crop to what was drawn (the product and its shadow) */
      const d = tx.getImageData(0, 0, W, H).data; let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (d[(y * W + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) { x0 = 0; y0 = 0; x1 = W; y1 = H; }
      const pad = Math.round(Math.max(x1 - x0, y1 - y0) * .08), cw = x1 - x0 + pad * 2, ch = y1 - y0 + pad * 2;
      /* final picture keeps 4:3 so every page looks the same */
      let fw = cw, fh = ch; if (fw / fh > 4 / 3) fh = fw * 3 / 4; else fw = fh * 4 / 3;
      const k = Math.min(1, maxW / fw), c = document.createElement('canvas'); c.width = Math.round(fw * k); c.height = Math.round(fh * k);
      const x = c.getContext('2d'); x.fillStyle = '#F3EEE5'; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(t, x0 - pad - (fw - cw) / 2, y0 - pad - (fh - ch) / 2, fw, fh, 0, 0, c.width, c.height);
      out = c.toDataURL('image/jpeg', .85);
    } catch (e) { out = ''; }
    Object.assign(cam, keep); explode = keepEx;
    renderer.setSize(sw || oldW, sh || oldH, false); camera.aspect = (sw || oldW) / (sh || oldH); camera.updateProjectionMatrix();
    renderFrame(0);
    return out;
  }

  /* loop */
  const v3 = new THREE.Vector3(); let prev = performance.now(), visible = true, raf = 0;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function renderFrame(dt) {
    if (P.tick(dt, ease) === 'settled') { const f = fitR(); if (goal.r < f * .85 || goal.r > f * 1.25) goal.r = f; }
    for (let i = tweens.length - 1; i >= 0; i--) { const tw = tweens[i]; tw.t = Math.min(1, tw.t + dt * 1000 / tw.dur); tw.m.color.copy(tw.a).lerp(tw.b, ease(tw.t)); if (tw.t >= 1) tweens.splice(i, 1); }
    explode += (explodeGoal - explode) * Math.min(1, dt * 5);
    const ex = explode;
    P.explode(ex);
    if (autoRot && performance.now() - lastInput > 5000 && !explodeGoal) goal.th += dt * .14;
    for (const p of ['th', 'ph', 'r', 'tx', 'ty', 'tz']) if (!Number.isFinite(cam[p])) cam[p] = goal[p];
    if (!Number.isFinite(dt) || dt < 0) dt = 0;
    const k = Math.min(1, dt * 6.5);
    for (const p of ['th', 'ph', 'r', 'tx', 'ty', 'tz']) cam[p] += (goal[p] - cam[p]) * k;
    const sp = Math.sin(cam.ph);
    camera.position.set(cam.tx + cam.r * sp * Math.sin(cam.th), cam.ty + cam.r * Math.cos(cam.ph), cam.tz + cam.r * sp * Math.cos(cam.th));
    camera.lookAt(cam.tx, cam.ty, cam.tz);
    renderer.render(scene, camera);
    const W = stage.clientWidth, Hh = stage.clientHeight;
    const place = (elx, p, offY = 0) => { v3.copy(p); v3.y += offY; v3.project(camera); const on = v3.z < 1 && Math.abs(v3.x) < 1.05 && Math.abs(v3.y) < 1.05; elx.style.transform = `translate(${(v3.x * .5 + .5) * W}px,${(-v3.y * .5 + .5) * Hh}px)`; return on; };
    const hotOn = ex < .05 && !showDims;
    const hotPts = P.hotPts();
    for (const k2 in hotEls) {
      const p = hotPts[k2]; if (!p) { hotEls[k2].classList.add('off'); continue; }
      const on = place(hotEls[k2], p, P.hotOffset(k2, ex)); hotEls[k2].classList.toggle('off', !(on && hotOn));
    }
    const dimLabels = P.dimLabels();
    dimEls.forEach((d, i) => { const L2 = dimLabels[i]; if (!L2 || !showDims) { d.style.opacity = 0; return; } d.textContent = L2[1]; d.style.opacity = place(d, L2[0]) ? 1 : 0; d.style.transform += ' translate(-50%,-50%)'; });
  }
  function loop(t) { raf = 0; if (!visible) return; const dt = Math.min(.05, (t - prev) / 1000); prev = t; renderFrame(dt); raf = requestAnimationFrame(loop); }
  new IntersectionObserver(es => { visible = es[0].isIntersecting || root.classList.contains('is-full'); if (visible && !raf) { prev = performance.now(); raf = requestAnimationFrame(loop); } }).observe(stage);

  P.build(); resize(); Object.assign(cam, VIEWS.hero(), { th: 1.9, r: fitR() * 1.35 }); setView('hero');
  raf = requestAnimationFrame(loop);
  setTimeout(() => $('.mrc-loading').classList.add('done'), 250);
  function destroy() {
    visible = false; cancelAnimationFrame(raf);
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); });
    renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {}
  }
  return { update, focus, snap, thumb, destroy, mutates: !!P.pick };
}
