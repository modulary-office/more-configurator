import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

(function () {
  if (window.__mrcfg) return; window.__mrcfg = 1;
  const mount = document.getElementById('mrcfg-mount');
  if (!mount) return;
  const PRODUCT = mount.dataset.name || 'Duo Bench';
  const QUOTE_URL = mount.dataset.quote || '/contact/';

  /* ---------------- data ---------------- */
  const TOPS = [
    { id: 'oak', he: 'אלון טבעי', kind: 'wood', base: '#D8B98D', dark: '#A9824F' },
    { id: 'split', he: 'אלון מבוקע', kind: 'wood', base: '#C9A274', dark: '#86603A', cracks: 1 },
    { id: 'smoked', he: 'אלון מעושן', kind: 'wood', base: '#8C6C4F', dark: '#55402D' },
    { id: 'walnut', he: 'אגוז אמריקאי', kind: 'wood', base: '#73513A', dark: '#3E2A1D' },
    { id: 'ash', he: 'אש לבן', kind: 'wood', base: '#E6DAC6', dark: '#C7B597' },
    { id: 'white', he: 'לבן ארקטי', kind: 'solid', base: '#F2F1EC' },
    { id: 'cashmere', he: 'קשמיר', kind: 'solid', base: '#D4C7B5' },
    { id: 'lgrey', he: 'אפור בהיר', kind: 'solid', base: '#C5C4C0' },
    { id: 'graphite', he: 'גרפיט', kind: 'solid', base: '#3E3F42' },
    { id: 'black', he: 'שחור', kind: 'solid', base: '#1E1E20' },
    { id: 'concrete', he: 'דמוי בטון', kind: 'stone', base: '#A8A39B' },
    { id: 'marble', he: 'דמוי שיש', kind: 'marble', base: '#EEEBE5' },
    { id: 'sage', he: 'ירוק מרווה', kind: 'solid', base: '#9AA793' },
    { id: 'terra', he: 'טרקוטה', kind: 'solid', base: '#B76B4E' },
    { id: 'blush', he: 'ורוד אבקה', kind: 'solid', base: '#DDB8AC' },
    { id: 'navy', he: 'כחול לילה', kind: 'solid', base: '#2C3649' },
    { id: 'olive', he: 'זית', kind: 'solid', base: '#6F6E4C' },
    { id: 'sand', he: 'חול', kind: 'stone', base: '#CDBB9E' }
  ];
  const RAL = [
    { id: '9005', he: 'שחור עמוק', hex: '#121214' },
    { id: '9016', he: 'לבן תנועה', hex: '#EEEEE8' },
    { id: '7016', he: 'אפור אנתרציט', hex: '#383E42' },
    { id: '7035', he: 'אפור בהיר', hex: '#C4C7C2' },
    { id: '9006', he: 'אלומיניום', hex: '#A3A6A6', metal: 1 },
    { id: '1015', he: 'שנהב', hex: '#E6D2B5' },
    { id: '1023', he: 'צהוב תנועה', hex: '#F2B705' },
    { id: '2001', he: 'כתום אדום', hex: '#C2512A' },
    { id: '2004', he: 'כתום', hex: '#E25E1C' },
    { id: '3009', he: 'אדום חמרה', hex: '#6E3530' },
    { id: '3015', he: 'ורוד בהיר', hex: '#D8A0A6' },
    { id: '5024', he: 'כחול פסטל', hex: '#5D8DAE' },
    { id: '5011', he: 'כחול פלדה', hex: '#1F2B3A' },
    { id: '6021', he: 'ירוק חיוור', hex: '#89A37A' },
    { id: '6005', he: 'ירוק אזוב', hex: '#173F33' },
    { id: '8017', he: 'חום שוקולד', hex: '#45322E' },
    { id: '1019', he: 'בז׳ אפרפר', hex: '#A4957D' },
    { id: '7039', he: 'אפור קוורץ', hex: '#6B675F' }
  ];
  const FABRICS = [
    { id: 'petrol', he: 'פטרול מעושן', hex: '#5D7C7E' },
    { id: 'melange', he: 'אפור מלאנז׳', hex: '#9C9B97' },
    { id: 'graphite', he: 'גרפיט', hex: '#4A4C50' },
    { id: 'sage', he: 'מרווה', hex: '#93A28C' },
    { id: 'bottle', he: 'ירוק בקבוק', hex: '#2F4E3C' },
    { id: 'olive', he: 'זית', hex: '#727440' },
    { id: 'mustard', he: 'חרדל', hex: '#C9A03A' },
    { id: 'terracotta', he: 'טרקוטה', hex: '#B4643F' },
    { id: 'rust', he: 'חלודה', hex: '#8E4426' },
    { id: 'rose', he: 'ורוד עתיק', hex: '#C3938B' },
    { id: 'bordeaux', he: 'בורדו', hex: '#6B2833' },
    { id: 'navy', he: 'נייבי', hex: '#263248' },
    { id: 'sky', he: 'תכלת', hex: '#8DAFC4' },
    { id: 'sand', he: 'חול', hex: '#CDBC9F' },
    { id: 'cream', he: 'קרם', hex: '#E7DFCF' },
    { id: 'yellow', he: 'צהוב MORE', hex: '#E9C843' }
  ];
  const HW = [
    { id: 'match', he: 'כמו הרגליים' },
    { id: 'alu', he: 'אלומיניום', hex: '#B8BBBD', metal: 1 },
    { id: 'black', he: 'שחור', hex: '#1A1A1C' },
    { id: 'white', he: 'לבן', hex: '#EDEDE8' }
  ];
  const EDGES = [{ id: 'match', he: 'תואם לפלטה' }, { id: 'black', he: 'שחור' }, { id: 'legs', he: 'כצבע הרגליים' }];
  const DEPTHS = { double: [120, 140, 160], single: [60, 70, 80] };

  const S = { layout: 'double', n: 2, w: 120, d: 120, top: 'oak', edge: 'match', ral: '2001', hw: 'alu', sh: 40, fab: 'petrol', tray: false, power: false, chairs: false };
  try {
    const m = location.hash.match(/cfg=([^&]+)/);
    if (m) Object.assign(S, JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/-/g, '+').replace(/_/g, '/'))))));
  } catch (e) {}

  const byId = (arr, id) => arr.find(x => x.id === id) || arr[0];

  /* ---------------- markup ---------------- */
  const root = document.createElement('section');
  root.id = 'mrcfg';
  root.setAttribute('aria-label', 'קונפיגורטור תלת־ממדי');
  const ico = {
    rot: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/></svg>',
    persp: '<svg viewBox="0 0 24 24"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>',
    front: '<svg viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="3"/><path d="M5 11v8M19 11v8"/><rect x="7" y="4" width="10" height="4"/></svg>',
    side: '<svg viewBox="0 0 24 24"><rect x="5" y="8" width="14" height="3"/><path d="M7 11l-2 8M17 11l2 8"/></svg>',
    top: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M12 6v12"/></svg>',
    dims: '<svg viewBox="0 0 24 24"><path d="M3 17h18M3 14v6M21 14v6M7 17v-2M11 17v-3M15 17v-2"/><path d="M6 4h12v6H6z"/></svg>',
    explode: '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="3"/><path d="M12 8v3M9 10l3 2 3-2"/><path d="M7 15l-1 6M17 15l1 6M6 14h12"/></svg>',
    full: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    cam: '<svg viewBox="0 0 24 24"><path d="M3 8h4l2-3h6l2 3h4v11H3z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    share: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/></svg>',
    chev: '<svg class="mrc-chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
    drag: '<svg viewBox="0 0 24 24"><path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4M4 12h16"/></svg>'
  };
  const sec = (k, n, t, body) => `<div class="mrc-sec" data-sec="${k}"><button class="mrc-sh" type="button" aria-expanded="false"><span class="mrc-num">${n}</span><strong>${t}</strong><em data-val="${k}"></em>${ico.chev}</button><div class="mrc-sb"><div><div>${body}</div></div></div></div>`;
  root.innerHTML = `<div class="mrc-wrap">
  <aside class="mrc-panel">
    <div class="mrc-head"><div class="mrc-eyebrow">קונפיגורטור 3D</div><div class="mrc-title">${PRODUCT}</div><p class="mrc-sub">בנו את העמדה שלכם: מידות, פלטה, צבע רגליים ובד מחיצה. התצוגה מתעדכנת בזמן אמת.</p></div>
    <div class="mrc-steps">
      ${sec('size', 1, 'מידות ותצורה', `
        <div class="mrc-lbl">סוג עמדה</div><div class="mrc-seg" data-k="layout"><button data-v="double">דו־צדדי (Bench)</button><button data-v="single">חד־צדדי</button></div>
        <div class="mrc-lbl">עמדות בכל צד <b data-out="seats"></b></div><div class="mrc-step"><button data-step="-1" aria-label="פחות">−</button><output data-out="n"></output><button data-step="1" aria-label="יותר">+</button></div>
        <div class="mrc-lbl">רוחב עמדה</div><div class="mrc-seg" data-k="w"><button data-v="120">120</button><button data-v="140">140</button><button data-v="160">160</button></div>
        <div class="mrc-lbl">עומק</div><div class="mrc-seg" data-k="d"></div>`)}
      ${sec('top', 2, 'פלטה', `
        <div class="mrc-lbl">גימור <b data-out="top"></b></div><div class="mrc-sw sq" data-k="top"></div>
        <div class="mrc-lbl">קנט</div><div class="mrc-seg" data-k="edge">${EDGES.map(e => `<button data-v="${e.id}">${e.he}</button>`).join('')}</div>`)}
      ${sec('frame', 3, 'רגליים ופרזול', `
        <div class="mrc-lbl">צבע שלד לפי RAL <b data-out="ral"></b></div><div class="mrc-sw ral" data-k="ral"></div>
        <div class="mrc-lbl">פרזול: רגליות ותפסני מחיצה</div><div class="mrc-seg" data-k="hw">${HW.map(e => `<button data-v="${e.id}">${e.he}</button>`).join('')}</div>`)}
      ${sec('screen', 4, 'מחיצות', `
        <div class="mrc-lbl">גובה מעל הפלטה</div><div class="mrc-seg" data-k="sh"><button data-v="0">ללא</button><button data-v="30">30 ס״מ</button><button data-v="40">40 ס״מ</button><button data-v="50">50 ס״מ</button></div>
        <div class="mrc-lbl">בד אקוסטי <b data-out="fab"></b></div><div class="mrc-sw" data-k="fab"></div>`)}
      ${sec('extra', 5, 'תוספות', `
        <button class="mrc-tog" data-t="tray"><span><b>מגש כבלים</b><small>תעלה מתחת לפלטה לאורך כל העמדה</small></span><i></i></button>
        <button class="mrc-tog" data-t="power"><span><b>קופסת חשמל ותקשורת</b><small>שקע נשלף בכל עמדה</small></span><i></i></button>
        <button class="mrc-tog" data-t="chairs"><span><b>הצגת כיסאות</b><small>להמחשת קנה מידה בלבד</small></span><i></i></button>`)}
    </div>
    <div class="mrc-foot">
      <div class="mrc-code"><span data-out="summary"></span><code data-out="code"></code></div>
      <button class="mrc-cta" data-act="quote">${ico.send}בקשת הצעת מחיר לתצורה הזו</button>
      <div class="mrc-row"><button class="mrc-ghost" data-act="share">${ico.share}שיתוף התצורה</button><button class="mrc-ghost" data-act="snap">${ico.cam}שמירת תמונה</button></div>
      <p class="mrc-note">הגוונים במסך להמחשה. נשמח לשלוח דוגמאות פיזיות של הפלטות, הצבעים והבדים.</p>
    </div>
  </aside>
  <div class="mrc-stage">
    <div class="mrc-grid"></div>
    <div class="mrc-badge"><b>3D LIVE</b><span>אצבע אחת: סיבוב · שתיים: זום והזזה</span></div>
    <div class="mrc-dimtag" data-out="dimtag"></div>
    <div class="mrc-tools">
      <div class="mrc-tgroup"><button class="mrc-tb on" data-tool="rot" data-tip="סיבוב אוטומטי">${ico.rot}</button><button class="mrc-tb" data-tool="dims" data-tip="מידות">${ico.dims}</button><button class="mrc-tb" data-tool="explode" data-tip="תצוגת הרכבה">${ico.explode}</button><button class="mrc-tb" data-tool="full" data-tip="מסך מלא">${ico.full}</button></div>
      <div class="mrc-tgroup v2"><button class="mrc-tb" data-view="hero" data-tip="פרספקטיבה">${ico.persp}</button><button class="mrc-tb" data-view="front" data-tip="חזית">${ico.front}</button><button class="mrc-tb" data-view="side" data-tip="צד">${ico.side}</button><button class="mrc-tb" data-view="top" data-tip="מבט על">${ico.top}</button></div>
    </div>
    <div class="mrc-hint">${ico.drag}גררו לסיבוב · גלגלת לזום · קליק ימני להזזה</div>
    <div class="mrc-toast"></div>
    <div class="mrc-loading"><div><svg viewBox="0 0 64 64"><path d="M14 50L24 14 32 30 40 14 50 50" fill="none" stroke="#1C1C1A" stroke-width="3" stroke-linejoin="round" stroke-dasharray="140" stroke-dashoffset="140"><animate attributeName="stroke-dashoffset" values="140;0;0;-140" dur="2s" repeatCount="indefinite"/></path></svg>טוען תצוגה תלת־ממדית…</div></div>
  </div>
</div>`;
  const host = document.querySelector('div.product');
  if (host && host.parentNode && !mount.closest('.mrc-wrap')) host.parentNode.insertBefore(root, host); else mount.appendChild(root);

  const $ = (s, r = root) => r.querySelector(s);
  const $$ = (s, r = root) => [...r.querySelectorAll(s)];
  const stage = $('.mrc-stage');

  function setHdr() {
    const h = document.querySelector('#masthead');
    let v = 0;
    if (h && getComputedStyle(h).position === 'sticky') v = h.getBoundingClientRect().height + (parseFloat(getComputedStyle(h).top) || 0);
    root.style.setProperty('--hdr', Math.round(v) + 'px');
  }
  setHdr(); addEventListener('resize', setHdr);

  /* ---------------- procedural textures ---------------- */
  function hash(x, y) { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  function vn(x, y, px, py) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const X0 = ((xi % px) + px) % px, X1 = (X0 + 1) % px, Y0 = ((yi % py) + py) % py, Y1 = (Y0 + 1) % py;
    const a = hash(X0, Y0), b = hash(X1, Y0), c = hash(X0, Y1), d = hash(X1, Y1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, px, py, oct) { let s = 0, a = .5, f = 1; for (let i = 0; i < oct; i++) { s += a * vn(x * f, y * f, px * f, py * f); a *= .5; f *= 2; } return s; }
  const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  function genTop(def, N) {
    const c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d'), img = x.createImageData(N, N), d = img.data;
    const A = hexRgb(def.base), B = hexRgb(def.dark || def.base);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const u = i / N, v = j / N; let t, r, g, b;
      if (def.kind === 'wood') {
        const warp = fbm(u * 2, v * 5, 2, 5, 4) * 3.2 + fbm(u * 6, v * 2, 6, 2, 2) * .8;
        const ring = v * 26 + warp; const f = ring - Math.floor(ring);
        const late = Math.pow(f, 5);
        const streak = fbm(u * 1.5, v * 220, 1.5, 220, 3);
        const fine = vn(u * 6, v * 700, 6, 700);
        const pore = vn(u * 300, v * 1100, 300, 1100) > .9 ? .45 : 0;
        t = Math.max(0, Math.min(1, late * .55 + (streak - .5) * .7 + (fine - .5) * .25 + pore * .45 + .18));
      } else if (def.kind === 'stone') {
        const n1 = fbm(u * 6, v * 6, 6, 6, 5), sp = hash(i, j * 7) > .985 ? .5 : 0;
        t = .25 + (n1 - .5) * .9 + sp * .4 + (hash(i * 3, j) - .5) * .08;
      } else if (def.kind === 'marble') {
        const w = fbm(u * 4, v * 4, 4, 4, 5) * 7;
        const s = Math.abs(Math.sin((u * 2 + v) * Math.PI * 2 + w));
        t = Math.pow(1 - s, 14) * .9 + fbm(u * 10, v * 10, 10, 10, 3) * .12;
        r = A[0] - t * 120; g = A[1] - t * 118; b = A[2] - t * 112;
      } else {
        t = (fbm(u * 16, v * 16, 16, 16, 3) - .5) * .12 + (hash(i, j) - .5) * .05;
        r = A[0] * (1 + t); g = A[1] * (1 + t); b = A[2] * (1 + t);
      }
      if (r === undefined) { r = A[0] + (B[0] - A[0]) * t; g = A[1] + (B[1] - A[1]) * t; b = A[2] + (B[2] - A[2]) * t; }
      const k = (j * N + i) * 4; d[k] = r; d[k + 1] = g; d[k + 2] = b; d[k + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    if (def.cracks) {
      x.strokeStyle = 'rgba(60,38,20,.55)'; x.lineCap = 'round';
      for (let k = 0; k < 70; k++) {
        const y0 = hash(k, 3) * N, x0 = hash(k, 7) * N, len = (40 + hash(k, 9) * 220) * N / 1024;
        x.lineWidth = (1 + hash(k, 11) * 2.2) * N / 1024;
        for (const ox of [0, -N, N]) for (const oy of [0, -N, N]) {
          x.beginPath(); x.moveTo(x0 + ox, y0 + oy);
          for (let s = 1; s <= 8; s++) x.lineTo(x0 + ox + len * s / 8, y0 + oy + (hash(k, s) - .5) * 4 * N / 1024);
          x.stroke();
        }
      }
    }
    return c;
  }
  function genWeave(N) {
    const c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d'), img = x.createImageData(N, N), d = img.data;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const wx = (i % 6) < 3, wy = (j % 6) < 3;
      const t = 222 + ((wx ^ wy) ? 16 : -6) + (hash(i, j) - .5) * 34 + (fbm(i / N * 24, j / N * 24, 24, 24, 2) - .5) * 30;
      const k = (j * N + i) * 4; d[k] = d[k + 1] = d[k + 2] = Math.max(150, Math.min(255, t)); d[k + 3] = 255;
    }
    x.putImageData(img, 0, 0); return c;
  }
  const thumbCache = {};
  function thumbTop(def) {
    if (thumbCache[def.id]) return thumbCache[def.id];
    const src = genTop(def, 160), c = document.createElement('canvas'); c.width = c.height = 80;
    c.getContext('2d').drawImage(src, 0, 0, 160, 160, 0, 0, 80, 80);
    return thumbCache[def.id] = c.toDataURL('image/jpeg', .85);
  }
  let weaveURL = null;
  function fabThumb(hex) {
    if (!weaveURL) weaveURL = genWeave(48).toDataURL();
    return `url(${weaveURL}),linear-gradient(${hex},${hex})`;
  }

  /* ---------------- UI wiring ---------------- */
  const swTop = $('[data-k="top"]'), swRal = $('[data-k="ral"]'), swFab = $('[data-k="fab"]');
  swTop.innerHTML = TOPS.map(t => `<button data-v="${t.id}" title="${t.he}" aria-label="${t.he}"></button>`).join('');
  swRal.innerHTML = RAL.map(r => `<button data-v="${r.id}" title="RAL ${r.id} · ${r.he}" aria-label="RAL ${r.id} ${r.he}" style="background:${r.metal ? `linear-gradient(135deg,#d9dbdc,${r.hex} 45%,#8d9090)` : r.hex}"><small>${r.id}</small></button>`).join('');
  swFab.innerHTML = FABRICS.map(f => `<button data-v="${f.id}" title="${f.he}" aria-label="${f.he}"></button>`).join('');
  requestAnimationFrame(() => {
    $$('button', swTop).forEach((b, i) => setTimeout(() => { b.style.backgroundImage = `url(${thumbTop(TOPS[i])})`; }, i * 25));
    $$('button', swFab).forEach((b, i) => { b.style.background = fabThumb(FABRICS[i].hex); b.style.backgroundBlendMode = 'multiply'; });
  });

  function refreshUI() {
    $$('.mrc-seg[data-k], .mrc-sw[data-k]').forEach(g => {
      const k = g.dataset.k; $$('button', g).forEach(b => b.classList.toggle('on', String(S[k]) === b.dataset.v));
    });
    const dd = DEPTHS[S.layout];
    const dSeg = $('[data-k="d"]');
    if (dSeg.dataset.layout !== S.layout) { dSeg.dataset.layout = S.layout; dSeg.innerHTML = dd.map(v => `<button data-v="${v}">${v}</button>`).join(''); }
    $$('button', dSeg).forEach(b => b.classList.toggle('on', String(S.d) === b.dataset.v));
    $$('.mrc-tog').forEach(b => b.classList.toggle('on', !!S[b.dataset.t]));
    const sides = S.layout === 'double' ? 2 : 1, seats = S.n * sides;
    $('[data-out="n"]').innerHTML = `${S.n} <span class="mrc-seats">${'<i></i>'.repeat(S.n)}</span>`;
    $('[data-out="seats"]').textContent = `סה״כ ${seats} עמדות`;
    $('[data-step="-1"]').disabled = S.n <= 1; $('[data-step="1"]').disabled = S.n >= 4;
    const top = byId(TOPS, S.top), ral = byId(RAL, S.ral), fab = byId(FABRICS, S.fab);
    $('[data-out="top"]').textContent = top.he; $('[data-out="ral"]').textContent = `RAL ${ral.id} · ${ral.he}`; $('[data-out="fab"]').textContent = fab.he;
    const L = S.n * S.w;
    const val = (k, html) => { const e = $(`[data-val="${k}"]`); if (e) e.innerHTML = html; };
    val('size', `${L}×${S.d} · ${seats} עמדות`);
    val('top', `<i style="background-image:url(${thumbTop(top)})"></i>${top.he}`);
    val('frame', `<i style="background:${ral.hex}"></i>RAL ${ral.id}`);
    val('screen', S.sh ? `<i style="background:${fab.hex}"></i>${fab.he} · ${S.sh}` : 'ללא מחיצות');
    val('extra', [S.tray && 'מגש כבלים', S.power && 'חשמל'].filter(Boolean).join(' · ') || 'ללא');
    $('[data-out="dimtag"]').innerHTML = `${L} × ${S.d} × 75 ס״מ<small>${seats} עמדות · ${S.layout === 'double' ? 'דו־צדדי' : 'חד־צדדי'}</small>`;
    $('[data-out="summary"]').textContent = `${L}×${S.d}×75 · ${seats} עמדות`;
    $('[data-out="code"]').textContent = code();
  }
  function code() { return `MB-${S.layout === 'double' ? 'D' : 'S'}${S.n}-${S.n * S.w}x${S.d}-${S.top.toUpperCase()}-${S.edge[0].toUpperCase()}-R${S.ral}-${S.hw.toUpperCase()}-${S.sh ? 'S' + S.sh + '-' + S.fab.toUpperCase() : 'NS'}${S.tray ? '-T' : ''}${S.power ? '-P' : ''}`; }
  function summaryText() {
    const top = byId(TOPS, S.top), ral = byId(RAL, S.ral), fab = byId(FABRICS, S.fab), hw = byId(HW, S.hw), ed = byId(EDGES, S.edge);
    return [`${PRODUCT}`, `${S.layout === 'double' ? 'דו־צדדי' : 'חד־צדדי'}, ${S.n * (S.layout === 'double' ? 2 : 1)} עמדות`, `מידות ${S.n * S.w}×${S.d}×75 ס״מ`, `פלטה: ${top.he}, קנט ${ed.he}`, `שלד: RAL ${ral.id} ${ral.he}`, `פרזול: ${hw.he}`, S.sh ? `מחיצות ${S.sh} ס״מ, בד ${fab.he}` : 'ללא מחיצות', S.tray ? 'מגש כבלים' : '', S.power ? 'קופסת חשמל' : '', `קוד: ${code()}`].filter(Boolean).join(' | ');
  }

  let toastT;
  function toast(txt, sw) {
    const t = $('.mrc-toast'); t.innerHTML = (sw ? `<i style="${sw}"></i>` : '') + txt; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800);
  }

  function openSec(k, fly = true) {
    $$('.mrc-sec').forEach(s => { const o = s.dataset.sec === k && !s.classList.contains('open'); s.classList.toggle('open', o); $('.mrc-sh', s).setAttribute('aria-expanded', o); });
    if (fly && api) api.focus(k);
  }
  $$('.mrc-sh').forEach(b => b.addEventListener('click', () => openSec(b.parentNode.dataset.sec)));

  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !root.contains(b)) return;
    const g = b.closest('[data-k]');
    if (g && b.dataset.v !== undefined) {
      const k = g.dataset.k; let v = b.dataset.v; if (['w', 'd', 'sh'].includes(k)) v = +v;
      if (S[k] === v) return;
      S[k] = v;
      if (k === 'layout') { const i = DEPTHS[v === 'double' ? 'single' : 'double'].indexOf(S.d); S.d = DEPTHS[v][Math.max(0, i)]; }
      change(k); return;
    }
    if (b.dataset.step) { const n = Math.max(1, Math.min(4, S.n + +b.dataset.step)); if (n !== S.n) { S.n = n; change('n'); } return; }
    if (b.dataset.t) { S[b.dataset.t] = !S[b.dataset.t]; change(b.dataset.t); return; }
    if (b.dataset.act === 'quote') { location.href = QUOTE_URL + (QUOTE_URL.includes('?') ? '&' : '?') + 'subject=' + encodeURIComponent('בקשת הצעת מחיר: ' + summaryText()); return; }
    if (b.dataset.act === 'share') { share(); return; }
    if (b.dataset.act === 'snap') { api && api.snap(); return; }
  });

  function change(k) {
    refreshUI();
    const top = byId(TOPS, S.top), ral = byId(RAL, S.ral), fab = byId(FABRICS, S.fab);
    const msgs = {
      top: [`פלטה: ${top.he}`, `background-image:url(${thumbTop(top)})`],
      ral: [`שלד: RAL ${ral.id} ${ral.he}`, `background:${ral.hex}`],
      fab: [`בד מחיצה: ${fab.he}`, `background:${fab.hex}`],
      edge: [`קנט: ${byId(EDGES, S.edge).he}`], hw: [`פרזול: ${byId(HW, S.hw).he}`],
      tray: [S.tray ? 'נוסף מגש כבלים' : 'הוסר מגש כבלים'], power: [S.power ? 'נוספה קופסת חשמל' : 'הוסרה קופסת חשמל'], chairs: [S.chairs ? 'כיסאות להמחשה' : 'הוסתרו הכיסאות'],
      sh: [S.sh ? `מחיצות בגובה ${S.sh} ס״מ` : 'ללא מחיצות']
    };
    const m = msgs[k] || [`${S.n * S.w} × ${S.d} ס״מ · ${S.n * (S.layout === 'double' ? 2 : 1)} עמדות`];
    toast(m[0], m[1]);
    try { history.replaceState(null, '', '#cfg=' + btoa(unescape(encodeURIComponent(JSON.stringify(S)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')); } catch (e) {}
    api && api.update(k);
  }
  function share() {
    const url = location.href.split('#')[0] + location.hash;
    const done = () => toast('קישור לתצורה הועתק');
    if (navigator.share && matchMedia('(pointer:coarse)').matches) navigator.share({ title: PRODUCT + ' – MORE', text: summaryText(), url }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, () => prompt('העתיקו את הקישור:', url));
    else prompt('העתיקו את הקישור:', url);
  }
  refreshUI();
  openSec('size', false);

  /* ---------------- 3D ---------------- */
  let api = null;
  try { api = init3D(); } catch (e) { console.error(e); $('.mrc-loading div').textContent = 'התצוגה התלת־ממדית אינה נתמכת בדפדפן זה'; }

  function init3D() {
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

    /* materials */
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const topMats = {};
    function topMat(id) {
      if (topMats[id]) return topMats[id];
      const def = byId(TOPS, id), tex = new THREE.CanvasTexture(genTop(def, 1024));
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
    const matCol = (m, hex, dur = 380) => tweens.push({ m, a: m.color.clone(), b: new THREE.Color(hex), t: 0, dur });
    function applyLeg(instant) {
      const r = byId(RAL, S.ral);
      if (instant) legMat.color.set(r.hex); else matCol(legMat, r.hex);
      legMat.metalness = r.metal ? .8 : .25; legMat.roughness = r.metal ? .3 : .42;
      applyHw(instant);
    }
    function applyHw(instant) {
      const h = byId(HW, S.hw), hex = h.id === 'match' ? byId(RAL, S.ral).hex : h.hex, metal = h.id === 'match' ? !!byId(RAL, S.ral).metal : !!h.metal;
      if (instant) hwMat.color.set(hex); else matCol(hwMat, hex);
      hwMat.metalness = metal ? .85 : .2; hwMat.roughness = metal ? .3 : .5;
    }
    const tweens = [];
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
    let hotPts = {}, dimLabels = [], fadeTop = null, lastTopGeo = null;

    function clearGroup(g) { for (let i = g.children.length - 1; i >= 0; i--) { const o = g.children[i]; g.remove(o); o.traverse(c => { if (c.geometry && !c.userData.keep) c.geometry.dispose(); }); } }

    function build() {
      const { L, D, sh } = dims, n = S.n, dbl = S.layout === 'double', W = L / n, y0 = H - T;
      Object.entries(G).forEach(([k, g]) => { if (k !== 'chairs') clearGroup(g); });
      /* top */
      const tg = new THREE.ExtrudeGeometry(rr(L, D, .012), { depth: T - .004, bevelEnabled: true, bevelThickness: .002, bevelSize: .002, bevelSegments: 2, curveSegments: 6 });
      tg.rotateX(-Math.PI / 2); lastTopGeo = tg;
      const edgeM = S.edge === 'black' ? edgeBlack : S.edge === 'legs' ? legMat : topMat(S.top);
      const top = mk(tg, [topMat(S.top), edgeM], 0, y0 + .002, 0); G.top.add(top);
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
      G.dims.visible = showDims;
    }

    /* overlays */
    const hotEls = {};
    [['top', 'פלטה'], ['frame', 'רגליים ופרזול'], ['screen', 'מחיצות']].forEach(([k, t]) => {
      const b = document.createElement('button'); b.className = 'mrc-hot'; b.type = 'button'; b.innerHTML = `<span>${t}</span>`; b.setAttribute('aria-label', t);
      b.addEventListener('click', () => { const s = $(`.mrc-sec[data-sec="${k}"]`); if (!s.classList.contains('open')) openSec(k); else focus(k); s.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
      stage.appendChild(b); hotEls[k] = b;
    });
    const dimEls = [0, 1, 2].map(() => { const d = document.createElement('div'); d.className = 'mrc-dlabel'; stage.appendChild(d); return d; });

    /* camera */
    const cam = { th: .78, ph: 1.12, r: 4, tx: 0, ty: .45, tz: 0 }, goal = { ...cam };
    root._cam = goal;
    let autoRot = true, lastInput = performance.now() - 9000, showDims = false, explode = 0, explodeGoal = 0;
    function fitR() { const asp = stage.clientWidth / Math.max(1, stage.clientHeight); const base = 1.5 + 1.5 * Math.max(dims.L, dims.D * 1.35, 1.3); return base * (asp < 1.1 ? Math.pow(1.1 / asp, .75) : 1); }
    const VIEWS = {
      hero: () => ({ th: .78, ph: 1.12, r: fitR(), tx: 0, ty: .42, tz: 0 }),
      front: () => ({ th: 0, ph: 1.38, r: fitR() * .95, tx: 0, ty: .5, tz: 0 }),
      side: () => ({ th: Math.PI / 2, ph: 1.36, r: fitR() * .8, tx: 0, ty: .5, tz: 0 }),
      top: () => ({ th: 0, ph: .04, r: fitR() * 1.05, tx: 0, ty: .4, tz: 0 }),
      topSec: () => ({ th: .5, ph: .72, r: fitR() * .85, tx: -dims.L * .12, ty: .62, tz: 0 }),
      frame: () => ({ th: 1.0, ph: 1.4, r: fitR() * .6, tx: dims.L / 2 - .25, ty: .38, tz: .1 }),
      screen: () => ({ th: .22, ph: 1.22, r: fitR() * .78, tx: 0, ty: .78, tz: 0 })
    };
    function setView(v) { Object.assign(goal, VIEWS[v]()); $$('[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === v)); }
    function focus(k) { lastInput = performance.now(); setView({ size: 'hero', top: 'topSec', frame: 'frame', screen: S.sh ? 'screen' : 'hero', extra: 'hero' }[k] || 'hero'); }

    /* input: one finger / mouse = orbit · two fingers = pinch zoom + pan · right-drag or shift = pan · double tap = reset */
    const el = renderer.domElement, ptrs = new Map(); let g0 = null, lastTap = 0;
    const phoneLayout = () => matchMedia('(max-width:980px)').matches && matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) < 600;
    const rMin = () => fitR() * .3, rMax = () => fitR() * 2.6;
    const clampT = () => { const lx = dims.L / 2 + .4, lz = dims.D / 2 + .4; goal.tx = Math.max(-lx, Math.min(lx, goal.tx)); goal.tz = Math.max(-lz, Math.min(lz, goal.tz)); goal.ty = Math.max(.05, Math.min(1.4, goal.ty)); };
    function pan(dx, dy) {
      const h = stage.clientHeight || 1, k = 2 * cam.r * Math.tan(camera.fov * Math.PI / 360) / h;
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0), upv = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      goal.tx += (-dx * right.x + dy * upv.x) * k; goal.ty += (-dx * right.y + dy * upv.y) * k; goal.tz += (-dx * right.z + dy * upv.z) * k; clampT();
    }
    function twoState() { const [a, b] = [...ptrs.values()]; return { d: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, r: goal.r }; }
    const touched = () => { lastInput = performance.now(); const hnt = $('.mrc-hint'); if (hnt) hnt.style.opacity = 0; $$('[data-view]').forEach(b => b.classList.remove('on')); };
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
      if (t === 'dims') { showDims = !showDims; G.dims.visible = showDims; b.classList.toggle('on', showDims); toast(showDims ? 'מוצגות מידות' : 'הוסתרו המידות'); }
      if (t === 'explode') { explodeGoal = explodeGoal ? 0 : 1; b.classList.toggle('on', !!explodeGoal); toast(explodeGoal ? 'תצוגת הרכבה' : 'תצוגה רגילה'); if (explodeGoal) { setView('hero'); goal.r = fitR() * 1.3; goal.ty = .7; } }
      if (t === 'full') { const on = !root.classList.contains('is-full'); root.classList.toggle('is-full', on); b.classList.toggle('on', on); document.documentElement.style.overflow = on ? 'hidden' : ''; setTimeout(resize, 50); setTimeout(() => setView('hero'), 80); }
    }));
    addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('is-full')) $('[data-tool="full"]').click(); });

    function resize() {
      const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      const f = fitR(); if (Math.abs(goal.r - f) > .01 && performance.now() - lastInput > 1500) goal.r = Math.min(goal.r, f * 1.8);
    }
    new ResizeObserver(resize).observe(stage);

    /* update from UI */
    function update(k) {
      if (k === 'ral') { applyLeg(false); return; }
      if (k === 'hw') { applyHw(false); return; }
      if (k === 'fab') { matCol(fabMat, byId(FABRICS, S.fab).hex, 450); return; }
      if (k === 'top') {
        const mesh = G.top.children.find(c => Array.isArray(c.material));
        if (mesh) { const old = mesh.material.map(m => { const c = m.clone(); c.transparent = true; c.polygonOffset = true; c.polygonOffsetFactor = -2; c.polygonOffsetUnits = -2; c.depthWrite = false; return c; }); fadeTop = { mats: old, t: 0 }; }
        build(); return;
      }
      if (['n', 'w', 'd', 'layout', 'sh'].includes(k)) {
        dimT = { a: { ...dims }, b: { L: S.n * S.w / 100, D: S.d / 100, sh: S.sh / 100 }, t: 0 };
        if (k === 'sh' || k === 'n' || k === 'layout') build();
        if (performance.now() - lastInput > 400) Object.assign(goal, { r: Math.max(goal.r, 0) });
        return;
      }
      build();
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
      x.fillStyle = '#F3EEE5'; x.font = `500 ${Math.round(fs * .55)}px sans-serif`; x.fillText(`${PRODUCT} · ${code()}`, fh * .3, fy + fh * .78);
      x.textAlign = 'right'; x.direction = 'rtl'; x.fillText(`${S.n * S.w}×${S.d}×75 ס״מ · ${byId(TOPS, S.top).he} · RAL ${S.ral}`, w - fh * .3, fy + fh * .45);
      x.fillText('modularymore.co.il', w - fh * .3, fy + fh * .78);
      c.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `MORE-${code()}.png`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); toast('התמונה נשמרה'); }, 'image/png');
    }

    /* loop */
    const v3 = new THREE.Vector3(); let prev = performance.now(), visible = true, raf = 0;
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    function renderFrame(dt) {
      if (dimT) { dimT.t = Math.min(1, dimT.t + dt / .65); const e = ease(dimT.t); dims = { L: dimT.a.L + (dimT.b.L - dimT.a.L) * e, D: dimT.a.D + (dimT.b.D - dimT.a.D) * e, sh: dimT.a.sh + (dimT.b.sh - dimT.a.sh) * e }; build(); if (dimT.t >= 1) { dimT = null; const f = fitR(); if (goal.r < f * .85 || goal.r > f * 1.25) goal.r = f; } }
      for (let i = tweens.length - 1; i >= 0; i--) { const tw = tweens[i]; tw.t = Math.min(1, tw.t + dt * 1000 / tw.dur); tw.m.color.copy(tw.a).lerp(tw.b, ease(tw.t)); if (tw.t >= 1) tweens.splice(i, 1); }
      if (fadeTop) { fadeTop.t = Math.min(1, fadeTop.t + dt / .55); fadeTop.mats.forEach(m => m.opacity = 1 - ease(fadeTop.t)); if (fadeTop.t >= 1) { const ov = fadeTop.mesh; if (ov) { ov.parent && ov.parent.remove(ov); } fadeTop.mats.forEach(m => m.dispose()); fadeTop = null; } }
      explode += (explodeGoal - explode) * Math.min(1, dt * 5);
      const ex = explode;
      G.top.position.y = .32 * ex; G.scr.position.y = .62 * ex; G.fL.position.x = -.38 * ex; G.fR.position.x = .38 * ex; G.tray.position.y = -.06 * ex; G.ctr.position.y = .1 * ex * 0;
      G.chairs.visible = ex < .05;
      if (autoRot && performance.now() - lastInput > 5000 && !explodeGoal) goal.th += dt * .14;
      const k = Math.min(1, dt * 6.5);
      for (const p of ['th', 'ph', 'r', 'tx', 'ty', 'tz']) cam[p] += (goal[p] - cam[p]) * k;
      const sp = Math.sin(cam.ph);
      camera.position.set(cam.tx + cam.r * sp * Math.sin(cam.th), cam.ty + cam.r * Math.cos(cam.ph), cam.tz + cam.r * sp * Math.cos(cam.th));
      camera.lookAt(cam.tx, cam.ty, cam.tz);
      renderer.render(scene, camera);
      const W = stage.clientWidth, Hh = stage.clientHeight;
      const place = (elx, p, offY = 0) => { v3.copy(p); v3.y += offY; v3.project(camera); const on = v3.z < 1 && Math.abs(v3.x) < 1.05 && Math.abs(v3.y) < 1.05; elx.style.transform = `translate(${(v3.x * .5 + .5) * W}px,${(-v3.y * .5 + .5) * Hh}px)`; return on; };
      const hotOn = ex < .05 && !showDims;
      for (const k2 in hotEls) {
        const p = hotPts[k2]; if (!p) { hotEls[k2].classList.add('off'); continue; }
        const off = k2 === 'top' ? .32 * ex : k2 === 'screen' ? .62 * ex : 0;
        const on = place(hotEls[k2], p, off); hotEls[k2].classList.toggle('off', !(on && hotOn));
      }
      dimEls.forEach((d, i) => { const L2 = dimLabels[i]; if (!L2 || !showDims) { d.style.opacity = 0; return; } d.textContent = L2[1]; d.style.opacity = place(d, L2[0]) ? 1 : 0; d.style.transform += ' translate(-50%,-50%)'; });
    }
    function loop(t) { raf = 0; if (!visible) return; const dt = Math.min(.05, (t - prev) / 1000); prev = t; renderFrame(dt); raf = requestAnimationFrame(loop); }
    new IntersectionObserver(es => { visible = es[0].isIntersecting || root.classList.contains('is-full'); if (visible && !raf) { prev = performance.now(); raf = requestAnimationFrame(loop); } }).observe(stage);

    build(); resize(); Object.assign(cam, VIEWS.hero(), { th: 1.9, r: fitR() * 1.35 }); setView('hero');
    raf = requestAnimationFrame(loop);
    setTimeout(() => $('.mrc-loading').classList.add('done'), 250);
    return { update, focus, snap };
  }
})();
