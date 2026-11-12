/* MORE configurator engine – entry point.
   <div id="mrcfg-mount" data-product="duo-bench" data-name="Duo Bench" data-quote="/contact/"></div>
   Loads products/<id>.json and the shared catalogs, builds the panel from the product's sections,
   and hands the 3D part to the product's family (families/*.js). */
import { ico } from './icons.js';
import { thumbTop, fabThumb } from './textures.js';
import { controlsOf, optionValues, optionList, driverOf, isCustom, sanitize, readHash, writeHash, catItems } from './state.js';
import { price, fmtPrice } from './pricing.js';
import { createViewer } from './viewer.js';
import * as project from './project.js';
import { bench } from '../families/bench.js';
import { cabinet } from '../families/cabinet.js';
import { desk } from '../families/desk.js';
import { lounge } from '../families/lounge.js';
import { sofa } from '../families/sofa.js';

const FAMILIES = { bench, cabinet, desk, lounge, sofa };
const VERSION = "1.11.0";
/* repository root: dist/mrcfg.min.js → ../ */
const ROOT = new URL('../', import.meta.url);

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fill = (tpl, item) => tpl.replace(/\{(\w+)\}/g, (_, k) => item[k] ?? '');

async function getJSON(path) {
  /* a page may carry the data inline (demo pages, offline previews) */
  const inline = window.MRCFG_DATA && window.MRCFG_DATA[path];
  if (inline) return JSON.parse(JSON.stringify(inline));
  const r = await fetch(new URL(path, ROOT), { cache: 'force-cache' });
  if (!r.ok) throw new Error(`MORE configurator: cannot load ${path} (${r.status})`);
  return r.json();
}

async function boot() {
  const mount = document.getElementById('mrcfg-mount');
  if (!mount || document.getElementById('mrcfg') || mount.dataset.booting) return;
  mount.dataset.booting = '1';
  const productId = (mount.dataset.product || 'duo-bench').replace(/[^a-z0-9-]/gi, '');
  let product, cat = {};
  try {
    product = await getJSON(`products/${productId}.json`);
    const needed = [...new Set(controlsOf(product).filter(c => c.catalog).map(c => c.catalog))];
    await Promise.all(needed.map(async n => { cat[n] = await getJSON(`catalogs/${n.replace(/[^a-z0-9-]/gi, '')}.json`); }));
  } catch (e) { console.error(e); delete mount.dataset.booting; mount.textContent = 'לא ניתן לטעון את הקונפיגורטור כרגע.'; return; }
  delete mount.dataset.booting;
  const family = FAMILIES[product.family];
  if (!family) { console.error('MORE configurator: unknown family', product.family); return; }
  start(mount, product, cat, family);
}

function start(mount, product, cat, family) {
  const NAME = mount.dataset.name || product.name;
  const QUOTE_URL = mount.dataset.quote || '/contact/';
  /* every supplier shade comes in several surface finishes (Makor: יער, מטריקס, בטון) – a finish choice follows each decor swatch */
  const DECOR_FIN = cat.decors && cat.decors.finishes;
  if (DECOR_FIN && DECOR_FIN.length) for (const sec of product.sections) {
    for (let i = sec.controls.length - 1; i >= 0; i--) {
      const c = sec.controls[i];
      if (c.type !== 'swatch' || c.catalog !== 'decors' || c.noFinish) continue;
      const key = c.key + 'Fin';
      if (sec.controls.some(x => x.key === key)) continue;
      sec.controls.splice(i + 1, 0, { type: 'seg', key, label: `גימור ${c.label}`, options: DECOR_FIN.map(f => ({ v: f.id, label: f.he })), ...(c.showWhen ? { showWhen: c.showWhen } : {}), _finish: true });
      if (!(key in product.defaults)) product.defaults[key] = DECOR_FIN[0].id;
    }
  }
  const S = sanitize(product, cat, readHash());
  const F = family.ui(product, cat, S);
  const ctrls = controlsOf(product);
  const ctrlByKey = Object.fromEntries(ctrls.map(c => [c.key, c]));

  /* ---------------- markup ---------------- */
  const root = document.createElement('section');
  root.id = 'mrcfg';
  root.dataset.version = VERSION;
  root.setAttribute('aria-label', 'קונפיגורטור תלת־ממדי');

  const segButtons = c => (c.optionsBy ? '' : c.options.map(o => `<button data-v="${esc(o.v)}">${esc(o.label ?? o.v)}</button>`).join(''))
    + (c.custom ? `<button data-v="custom" class="mrc-cbtn">${esc(c.custom.label || 'אחר')}</button>` : '');
  const ctrlHTML = c => c.showWhen ? `<div class="mrc-ctl" data-ctl="${c.key}">${ctrlInner(c)}</div>` : ctrlInner(c);
  const ctrlInner = c => {
    switch (c.type) {
      case 'seg': return `<div class="mrc-lbl">${esc(c.label)}</div><div class="mrc-seg${c.layout ? ' ' + c.layout : ''}" data-k="${c.key}">${segButtons(c)}</div>`
        + (c.custom ? `<div class="mrc-custom" data-ck="${c.key}" hidden><label><span>${esc(c.custom.inputLabel || c.label)}</span><input type="number" inputmode="numeric" min="${c.custom.min}" max="${c.custom.max}" step="${c.custom.step || 1}"></label><em>${esc(c.custom.unit || '')}</em><button type="button" data-apply="${c.key}">עדכון</button><small>${c.custom.min}–${c.custom.max} ${esc(c.custom.unit || '')}</small></div>` : '');
      case 'stepper': return `<div class="mrc-lbl">${esc(c.label)} <b data-out="${c.out || c.key + '-lbl'}"></b></div><div class="mrc-step" data-sk="${c.key}"><button data-step="-1" aria-label="פחות">−</button><output data-out="${c.key}"></output><button data-step="1" aria-label="יותר">+</button></div>`;
      case 'swatch': return `<div class="mrc-lbl">${esc(c.label)} <b data-out="${c.key}"></b></div><div class="mrc-sw${c.style === 'decor' || c.style === 'tex' ? ' sq' : c.style === 'ral' ? ' ral' : ''}" data-k="${c.key}"></div>`;
      case 'toggle': return `<button class="mrc-tog" data-t="${c.key}"><span><b>${esc(c.title)}</b><small>${esc(c.sub || '')}</small></span><i></i></button>`;
    }
    return '';
  };
  const secHTML = (s, i) => `<div class="mrc-sec" data-sec="${s.id}"><button class="mrc-sh" type="button" aria-expanded="false"><span class="mrc-num">${i + 1}</span><strong>${esc(s.title)}</strong><em data-val="${s.id}"></em>${ico.chev}</button><div class="mrc-sb"><div><div>
        ${s.controls.map(ctrlHTML).join('\n        ')}</div></div></div></div>`;

  root.innerHTML = `<div class="mrc-wrap">
  <aside class="mrc-panel">
    <div class="mrc-head"><div class="mrc-eyebrow">קונפיגורטור 3D</div><div class="mrc-title">${esc(NAME)}</div><p class="mrc-sub">${esc(product.subtitle || '')}</p></div>
    <div class="mrc-steps">
      ${product.sections.map(secHTML).join('\n      ')}
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
  <div class="mrc-foot">
      <div class="mrc-price" data-out="price" hidden></div>
      <div class="mrc-code"><span data-out="summary"></span><code data-out="code"></code></div>
      <div class="mrc-ctas"><button class="mrc-cta" data-act="add">${ico.plus}הוספה לפרויקט</button><button class="mrc-ghost mrc-quote-btn" data-act="quote">${ico.send}בקשת הצעת מחיר לתצורה הזו</button></div>
      <div class="mrc-row"><button class="mrc-ghost" data-act="project">${ico.folder}הפרויקט שלי <span class="mrc-cnt" data-out="pcount"></span></button><button class="mrc-ghost" data-act="share">${ico.share}שיתוף</button><button class="mrc-ghost" data-act="snap">${ico.cam}תמונה</button></div>
      <p class="mrc-note">${esc(product.note || '')}</p>
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

  /* ---------------- swatches ---------------- */
  const swatchCtrls = ctrls.filter(c => c.type === 'swatch');
  const itemOf = c => { const items = catItems(c, cat); return items.find(x => x.id === S[c.key]) || items[0]; };
  swatchCtrls.forEach(c => {
    const items = catItems(c, cat), el = $(`.mrc-sw[data-k="${c.key}"]`);
    if (c.style === 'ral') el.innerHTML = items.map(r => `<button data-v="${esc(r.id)}" title="RAL ${esc(r.id)} · ${esc(r.he)}" aria-label="RAL ${esc(r.id)} ${esc(r.he)}" style="background:${r.metal ? `linear-gradient(135deg,#d9dbdc,${r.hex} 45%,#8d9090)` : r.hex}"><small>${esc(r.id)}</small></button>`).join('');
    else el.innerHTML = items.map(t => `<button data-v="${esc(t.id)}" title="${esc(t.he)}" aria-label="${esc(t.he)}"${t.fam ? ` data-fam="${esc(t.fam)}"` : ''}${t.supplier ? ` data-supplier="${esc(t.supplier)}"` : ''}${c.style === 'swatch' ? ` style="background:${t.hex}"` : ''}></button>`).join('');
    /* long supplier catalogues: family chips above the swatches, showing the family of the current choice */
    const fams = cat[c.catalog] && cat[c.catalog].families;
    if (fams && items.length > 18 && items.some(t => t.fam)) {
      const present = fams.filter(f => items.some(t => t.fam === f.id));
      el.insertAdjacentHTML('beforebegin', `<div class="mrc-fam" role="tablist" data-fk="${c.key}">${present.map(f => `<button type="button" role="tab" data-fam="${esc(f.id)}">${esc(f.he)}</button>`).join('')}</div>`);
      const bar = el.previousElementSibling;
      const show = fam => { $$('button', bar).forEach(b => { const on = b.dataset.fam === fam; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); }); $$('button[data-v]', el).forEach(b => { b.hidden = b.dataset.fam !== fam; }); };
      bar.addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(b.dataset.fam); });
      const cur = items.find(t => t.id === S[c.key]); show((cur && cur.fam) || present[0].id);
      el.__showFam = show;
    }
  });
  requestAnimationFrame(() => swatchCtrls.forEach(c => {
    const items = catItems(c, cat), btns = $$(`.mrc-sw[data-k="${c.key}"] button`);
    if (c.style === 'decor') btns.forEach((b, i) => setTimeout(() => { b.style.backgroundImage = `url(${thumbTop(items[i])})`; }, i * 25));
    if (c.style === 'tex') btns.forEach((b, i) => { const t = items[i]; b.style.background = `${t.hex} url(${new URL('catalogs/upholstery/' + t.tex, ROOT)}) center/cover`; });
    if (c.style === 'fabric') btns.forEach((b, i) => { b.style.background = fabThumb(items[i].hex); b.style.backgroundBlendMode = 'multiply'; });
  }));

  /* ---------------- refresh ---------------- */
  const metrics = () => F.metrics();
  const shown = c => !c.showWhen || Object.entries(c.showWhen).every(([k, v]) => Array.isArray(v) ? v.includes(S[k]) : S[k] === v);
  function refreshUI() {
    $$('.mrc-ctl[data-ctl]').forEach(el => { el.hidden = !shown(ctrlByKey[el.dataset.ctl]); });
    $$('.mrc-seg[data-k]').forEach(g => {
      const c = ctrlByKey[g.dataset.k];
      if (c.optionsBy) {
        const drv = driverOf(c, S);
        if (g.dataset.dep !== drv) { g.dataset.dep = drv; g.innerHTML = optionList(c, S).map(o => `<button data-v="${esc(o.v)}">${esc(o.label)}</button>`).join('') + (c.custom ? `<button data-v="custom" class="mrc-cbtn">${esc(c.custom.label || 'אחר')}</button>` : ''); }
      }
      const cust = isCustom(c, S);
      $$('button', g).forEach(b => b.classList.toggle('on', b.dataset.v === 'custom' ? cust : String(S[c.key]) === b.dataset.v));
      const box = $(`.mrc-custom[data-ck="${c.key}"]`);
      if (box) { const open = cust || box.dataset.open === '1'; box.hidden = !open; if (cust && document.activeElement !== $('input', box)) $('input', box).value = S[c.key]; }
    });
    $$('.mrc-sw[data-k]').forEach(g => { const k = g.dataset.k; $$('button', g).forEach(b => b.classList.toggle('on', String(S[k]) === b.dataset.v)); });
    $$('.mrc-tog').forEach(b => b.classList.toggle('on', !!S[b.dataset.t]));
    $$('.mrc-step[data-sk]').forEach(st => { const c = ctrlByKey[st.dataset.sk]; $('[data-step="-1"]', st).disabled = S[c.key] <= c.min; $('[data-step="1"]', st).disabled = S[c.key] >= c.max; });
    swatchCtrls.forEach(c => { const o = $(`[data-out="${c.key}"]`); if (o) o.textContent = fill(c.out || '{he}', itemOf(c)); });
    const outs = F.outputs();
    for (const [k, html] of Object.entries(outs)) { const e = $(`[data-out="${k}"]`); if (e) e.innerHTML = html; }
    product.sections.forEach(s => { const e = $(`[data-val="${s.id}"]`), v = F.sectionValue(s.id); if (e && v !== undefined) e.innerHTML = v; });
    $('[data-out="code"]').textContent = code();
    const p = priceNow(), pe = $('[data-out="price"]');
    pe.hidden = !p.total && !p.quote;
    if (p.quote) pe.innerHTML = `<span>${esc(product.pricing.label || 'מחיר')}</span><b class="mrc-quote">לפי הצעת מחיר</b><small>מידה מיוחדת מתומחרת אישית. לחצו על "בקשת הצעת מחיר" ונחזור אליכם.</small>`;
    else if (p.total) pe.innerHTML = `<span>${esc(product.pricing.label || 'מחיר משוער')}</span><b>${fmtPrice(p.total, product.pricing.currency)}</b>${product.pricing.note ? `<small>${esc(product.pricing.note)}</small>` : ''}`;
  }
  const code = () => F.code();
  const priceNow = () => price(product, S, metrics());
  function summaryText() {
    const p = priceNow();
    return [NAME, ...F.summary(), p.quote ? 'מידה מיוחדת – לתמחור' : p.total ? `${product.pricing.label || 'מחיר משוער'}: ${fmtPrice(p.total, product.pricing.currency)}` : '', `קוד: ${code()}`].filter(Boolean).join(' | ');
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

  /* dependent option lists: keep the same position when the driver changes (e.g. depth when layout flips) */
  function remapDependents(k, before, depth = 0) {
    if (depth > 5) return;
    const prev = { ...S, [k]: before };
    ctrls.filter(c => c.optionsBy && [].concat(c.optionsBy.key).includes(k)).forEach(c => {
      const now = optionValues(c, S);
      if (now.includes(S[c.key]) || (c.custom && isCustom(c, S) && S[c.key] >= c.custom.min && S[c.key] <= c.custom.max)) return;
      const was = optionValues(c, prev).indexOf(S[c.key]), old = S[c.key];
      S[c.key] = now[Math.min(now.length - 1, Math.max(0, was))];
      if (S[c.key] !== old) remapDependents(c.key, old, depth + 1);
    });
  }

  function setValue(k, v) {
    if (S[k] === v) return false;
    const before = S[k]; S[k] = v; remapDependents(k, before); change(k); return true;
  }

  function applyCustom(k) {
    const c = ctrlByKey[k], box = $(`.mrc-custom[data-ck="${k}"]`), inp = $('input', box);
    let v = Math.round(Number(inp.value) / (c.custom.step || 1)) * (c.custom.step || 1);
    if (!Number.isFinite(v) || inp.value === '') { inp.focus(); return; }
    const cl = Math.max(c.custom.min, Math.min(c.custom.max, v));
    inp.value = cl;
    if (!setValue(k, cl)) refreshUI();
    if (cl !== v) toast(`המידה עודכנה ל־${cl}. הטווח הוא ${c.custom.min}–${c.custom.max} ${c.custom.unit || ''}`);
  }

  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !root.contains(b)) return;
    if (b.dataset.apply) { applyCustom(b.dataset.apply); return; }
    const g = b.closest('[data-k]');
    if (g && b.dataset.v !== undefined) {
      const k = g.dataset.k, c = ctrlByKey[k];
      if (b.dataset.v === 'custom') {
        const box = $(`.mrc-custom[data-ck="${k}"]`); box.dataset.open = '1'; box.hidden = false;
        const inp = $('input', box); if (!inp.value) inp.value = S[k]; inp.focus(); inp.select(); return;
      }
      const box = $(`.mrc-custom[data-ck="${k}"]`); if (box) box.dataset.open = '';
      let v = b.dataset.v; if (c && c.num) v = +v;
      if (!setValue(k, v)) refreshUI();
      return;
    }
    if (b.dataset.step) {
      const st = b.closest('[data-sk]'), c = ctrlByKey[st.dataset.sk];
      const n = Math.max(c.min, Math.min(c.max, S[c.key] + +b.dataset.step)); if (n !== S[c.key]) { S[c.key] = n; change(c.key); } return;
    }
    if (b.dataset.t) { S[b.dataset.t] = !S[b.dataset.t]; change(b.dataset.t); return; }
    if (b.dataset.act === 'quote') { location.href = QUOTE_URL + (QUOTE_URL.includes('?') ? '&' : '?') + 'subject=' + encodeURIComponent('בקשת הצעת מחיר: ' + summaryText()); return; }
    if (b.dataset.act === 'add') { addToProject(); return; }
    if (b.dataset.act === 'project') { project.openDrawer({ quoteUrl: QUOTE_URL }); return; }
    if (b.dataset.act === 'share') { share(); return; }
    if (b.dataset.act === 'snap') { api && api.snap(); return; }
  });
  root.addEventListener('keydown', e => {
    const inp = e.target.closest('.mrc-custom input');
    if (inp && e.key === 'Enter') { e.preventDefault(); applyCustom(inp.closest('[data-ck]').dataset.ck); }
  });

  function change(k) {
    refreshUI();
    const m = F.toast(k);
    toast(m[0], m[1]);
    writeHash(S);
    api && api.update(k);
    /* a family may adjust the state while updating (e.g. per-part fabrics) */
    if (api && api.mutates) { refreshUI(); writeHash(S); }
  }
  function share() {
    const url = location.href.split('#')[0] + location.hash;
    const done = () => toast('קישור לתצורה הועתק');
    if (navigator.share && matchMedia('(pointer:coarse)').matches) navigator.share({ title: NAME + ' – MORE', text: summaryText(), url }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, () => prompt('העתיקו את הקישור:', url));
    else prompt('העתיקו את הקישור:', url);
  }
  /* every choice in words, for the project, the presentation and the production sheet */
  function specRows() {
    const rows = [];
    for (const sec of product.sections) for (const c of sec.controls) {
      if (!shown(c)) continue;
      const v = S[c.key]; let txt = '', code = '';
      if (c.type === 'seg') { const o = optionList(c, S).find(o => String(o.v) === String(v)); txt = o ? (o.label ?? o.v) : `${v}${c.custom && c.custom.unit ? ' ' + c.custom.unit : ''} (מידה מיוחדת)`; }
      else if (c.type === 'swatch') { const it = itemOf(c); txt = it ? (c.style === 'ral' ? `RAL ${it.id} · ${it.he}` : it.he) : String(v); code = it && c.style !== 'ral' ? (it.supplier ? `${it.supplier} · ${it.line ? it.line + ' ' : ''}${it.code}` : (it.code || it.id || '')) : ''; }
      else if (c.type === 'toggle') txt = v ? 'כן' : 'לא';
      else if (c.type === 'stepper') txt = String(v);
      else continue;
      txt = String(txt).replace(/<[^>]+>/g, '').trim();
      const lab = c.label || c.title || sec.title;
      if (/^\d+(\.\d+)?$/.test(txt) && /רוחב|עומק|גובה|אורך|מידה/.test(lab)) txt += ' ס״מ';
      if (txt) rows.push([lab, txt, String(code)]);
    }
    return rows;
  }
  function addToProject() {
    const p = priceNow();
    project.addItem({ product: product.id, name: NAME, code: code(), lines: F.summary().map(x => String(x).replace(/<[^>]+>/g, '').trim()).filter(x => x && !/^[·\s]+$/.test(x)), spec: specRows(),
      price: p.quote ? 0 : (p.total || 0), quote: !!p.quote, currency: product.pricing && product.pricing.currency, url: location.href.split('#')[0] + '#' + (location.hash.slice(1) || ''),
      img: api && api.thumb ? api.thumb() : '' });
    const n = project.count();
    toast(`נוסף לפרויקט · ${n} ${n === 1 ? 'פריט' : 'פריטים'}`);
    pcount();
  }
  const pcount = () => { const n = project.count(), e = $('[data-out="pcount"]'); if (e) e.textContent = n ? `(${n})` : ''; };
  addEventListener('mrcfg-project', pcount);
  pcount();
  if (project.isAdmin()) root.dataset.admin = '1';

  refreshUI();
  openSec(product.sections[0].id, false);

  /* ---------------- 3D ---------------- */
  let api = null;
  const ui = { openSec, toast, code, name: NAME, refresh: () => { refreshUI(); writeHash(S); } };
  try { api = createViewer({ root, stage, $, $$, S, product, cat, family, ui }); } catch (e) { console.error(e); $('.mrc-loading div').textContent = 'התצוגה התלת־ממדית אינה נתמכת בדפדפן זה'; }

  /* small public hook for debugging / later cart integration */
  root.mrcfg = { state: S, code, price: priceNow, summary: summaryText, spec: specRows, add: addToProject, product: product.id,
    destroy: () => { api && api.destroy && api.destroy(); root.remove(); } };
}

/* switch the configurator on the page to another product (demo pages) */
window.MRCFG = {
  project,
  openProject(opts) { project.openDrawer(opts); },
  load(id, name) {
    const old = document.getElementById('mrcfg'); if (old && old.mrcfg) old.mrcfg.destroy(); else if (old) old.remove();
    const mount = document.getElementById('mrcfg-mount'); if (!mount) return;
    mount.dataset.product = id; if (name !== undefined) mount.dataset.name = name;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    return boot();
  }
};
boot();
