/* MORE configurator – projects (engine 1.5).
   A visitor (usually a designer) collects configured products into a project: quantity, a note and a picture per item.
   Projects live in this browser (localStorage), several per browser. From a project:
   - a presentation for the client (print → PDF), with or without prices
   - a request to MORE (opens the contact page with the full list)
   - a production order sheet (every selected option, decor codes, quantities) – shown with ?mrcfg-admin=1
   Nothing here talks to a server yet: ordering, payment and the CRM come in later stages. */
import { fmtPrice } from './pricing.js';

const KEY = 'mrcfg:projects:v1';
const ADMIN_KEY = 'mrcfg:admin';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const today = () => new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });

/* ---------------- storage ---------------- */
function blank() { const id = uid(); return { active: id, list: { [id]: { id, name: 'פרויקט חדש', client: '', items: [], created: Date.now() } } }; }
let mem = null;                                   /* fallback when localStorage is blocked (private mode, blocked site data) */
export function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw); if (d && d.list && d.list[d.active]) return d; } } catch (e) {}
  return mem || (mem = blank());
}
function save(d) {
  mem = d;
  try { localStorage.setItem(KEY, JSON.stringify(d)); return true; }
  catch (e) {
    /* quota: drop the pictures of the oldest items until it fits */
    const all = Object.values(d.list).flatMap(p => p.items).filter(i => i.img).sort((a, b) => a.added - b.added);
    for (const it of all) { it.img = ''; try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (e2) {} }
    return false;
  }
}
const emit = () => dispatchEvent(new CustomEvent('mrcfg-project'));
export function active() { const d = load(); return d.list[d.active]; }
export function count() { return active().items.reduce((n, i) => n + i.qty, 0); }
export function isAdmin() {
  try { if (/[?&]mrcfg-admin=1/.test(location.search)) localStorage.setItem(ADMIN_KEY, '1'); if (/[?&]mrcfg-admin=0/.test(location.search)) localStorage.removeItem(ADMIN_KEY); return localStorage.getItem(ADMIN_KEY) === '1'; }
  catch (e) { return /[?&]mrcfg-admin=1/.test(location.search); }
}
export function addItem(item) {
  const d = load(), p = d.list[d.active];
  /* the same configuration again → one more of it */
  const same = p.items.find(i => i.product === item.product && i.code === item.code);
  if (same) { same.qty += 1; if (item.img) same.img = item.img; }
  else p.items.push({ id: uid(), qty: 1, note: '', added: Date.now(), ...item });
  save(d); emit();
  return p;
}
function mutate(fn) { const d = load(); fn(d, d.list[d.active]); save(d); emit(); }

/* ---------------- totals ---------------- */
export function totals(p) {
  let sum = 0, quote = 0, none = 0;
  for (const i of p.items) { if (i.quote) quote += 1; else if (i.price) sum += i.price * i.qty; else none += 1; }
  return { sum, quote, none, units: p.items.reduce((n, i) => n + i.qty, 0) };
}
const priceCell = (i, cur) => i.quote ? 'לפי הצעת מחיר' : i.price ? fmtPrice(i.price, cur) : '—';

/* ---------------- request text (contact page) ---------------- */
export function requestText(p) {
  const t = totals(p);
  const lines = p.items.map((i, n) => `${n + 1}. ${i.name} × ${i.qty} | ${i.lines.join(' | ')} | קוד ${i.code}${i.note ? ' | הערה: ' + i.note : ''}${i.url ? ' | ' + i.url : ''}`);
  return [`פרויקט: ${p.name}${p.client ? ' · לקוח: ' + p.client : ''}`, ...lines,
    t.sum ? `סה״כ משוער לפריטים המתומחרים: ${fmtPrice(t.sum, p.items[0] && p.items[0].currency)}` : '',
    t.quote ? `${t.quote} פריטים במידה מיוחדת – לתמחור` : ''].filter(Boolean).join('\n');
}

/* ---------------- printable documents ---------------- */
const PRINT_CSS = `@page{size:A4;margin:0}*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#1C1C1A;font-family:Heebo,Assistant,Arial,sans-serif;direction:rtl;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pg{width:210mm;height:297mm;padding:14mm 15mm 11mm;display:flex;flex-direction:column;gap:5mm;overflow:hidden;page-break-after:always;break-after:page;position:relative}.pg:last-child{page-break-after:auto;break-after:auto}
.brand{display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid #1C1C1A;padding-bottom:3mm;flex:none}.brand b{font-size:19pt;letter-spacing:.08em;direction:ltr;font-weight:700}.brand b i{font-style:normal;background:#F8DC55;padding:0 1.6mm}.brand span{font-size:9.5pt;color:#5e5a52}
h1{font-size:30pt;margin:0;line-height:1.1;font-weight:700}h2{font-size:17pt;margin:0;line-height:1.2;font-weight:700}h2 small{font-size:11pt;font-weight:400;color:#5e5a52;margin-inline-start:3mm}
.lead{margin:0;font-size:12.5pt;color:#5e5a52}
.meta{display:grid;grid-template-columns:auto 1fr;gap:1.5mm 8mm;font-size:11pt;margin:0}.meta dt{color:#5e5a52}.meta dd{margin:0;font-weight:600}
.collage{flex:1;min-height:0;display:grid;gap:4mm;grid-template-columns:repeat(var(--c),1fr);grid-auto-rows:1fr}.collage figure{margin:0;background:#F3EEE5;border-radius:3mm;overflow:hidden;display:flex;flex-direction:column}.collage img{flex:1;min-height:0;width:100%;object-fit:contain}.collage figcaption{font-size:9pt;padding:1.5mm 3mm;color:#5e5a52}
.hero{flex:1 1 auto;min-height:60mm;background:#F3EEE5;border-radius:3mm;display:flex;align-items:center;justify-content:center;overflow:hidden}.hero img{width:100%;height:100%;object-fit:contain}
.spec{display:grid;grid-template-columns:1fr 1fr;gap:0 9mm;font-size:9.8pt;flex:none}.spec div{display:flex;justify-content:space-between;gap:4mm;padding:1.5mm 0;border-bottom:1px solid #e3dccf;break-inside:avoid}.spec span{color:#5e5a52}.spec b{font-weight:600;text-align:left}
.price{display:flex;justify-content:space-between;align-items:baseline;background:#F3EEE5;border-radius:2.5mm;padding:3mm 4.5mm;font-size:11pt;flex:none}.price b{font-size:15pt}
.note{background:#FFF7CC;padding:2.5mm 4mm;border-radius:2mm;font-size:10pt;flex:none}
.code{font-family:ui-monospace,Menlo,monospace;direction:ltr;unicode-bidi:embed;font-size:8.5pt;color:#5e5a52}
table{width:100%;border-collapse:collapse;font-size:9.8pt}th,td{text-align:right;padding:1.6mm 2mm;border-bottom:1px solid #e3dccf;vertical-align:middle}th{background:#F3EEE5;font-weight:600}td.n,th.n{text-align:left;direction:ltr;white-space:nowrap;font-variant-numeric:tabular-nums}
.sum td{font-weight:700;border-bottom:0;border-top:1.5px solid #1C1C1A}.small{font-size:8.5pt;color:#5e5a52}.thumb{width:30mm;height:22.5mm;object-fit:contain;background:#F3EEE5;border-radius:1.5mm;display:block}
.foot{margin-top:auto;flex:none;font-size:8pt;color:#77736b;display:flex;justify-content:space-between;border-top:1px solid #e3dccf;padding-top:2mm}
.grid2{display:grid;grid-template-columns:1fr 78mm;gap:6mm;align-items:start}.grid2 img{width:100%;background:#F3EEE5;border-radius:2mm}
@media screen{body{background:#e9e4da}.pg{margin:8mm auto;box-shadow:0 2px 14px rgba(0,0,0,.14);background:#fff}.bar{position:sticky;top:0;z-index:2;background:#1C1C1A;color:#fff;padding:10px 16px;display:flex;gap:12px;align-items:center;justify-content:center;font-size:14px}.bar button{font:inherit;background:#F8DC55;border:0;border-radius:8px;padding:8px 16px;font-weight:600;cursor:pointer}}
@media screen and (max-width:820px){.pg{zoom:.45}}
@media print{.bar{display:none}}`;

function openDoc(title, body) {
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.open();
  w.document.write(`<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700&display=swap"><style>${PRINT_CSS}</style></head>
<body><div class="bar"><span>${esc(title)}</span><button onclick="print()">שמירה כ־PDF / הדפסה</button></div>${body}
<script>addEventListener('load',function(){var im=[].slice.call(document.images),n=im.length;function go(){setTimeout(function(){print()},400)}if(!n)return go();im.forEach(function(i){if(i.complete){if(!--n)go()}else{i.onload=i.onerror=function(){if(!--n)go()}}})});<\/script></body></html>`);
  w.document.close();
  return true;
}

const brand = sub => `<div class="brand"><b>M<i>O</i>RE</b><span>${esc(sub)}</span></div>`;
const foot = (n, of) => `<div class="foot"><span>MORE by MODULARY · modularymore.co.il</span><span>${today()}${n ? ` · עמוד ${n} מתוך ${of}` : ''}</span></div>`;
/* the client sees what was chosen; "no" answers (no tray, no screen) only add noise there. The production sheet shows everything, with codes */
const specGrid = (i, all) => { const rows = (i.spec || []).filter(r => all || (r[1] !== 'לא' && r[1] !== '0'));
  return `<div class="spec">${rows.map(r => `<div><span>${esc(r[0])}</span><b>${esc(r[1])}${all && r[2] ? ` <span class="code">${esc(r[2])}</span>` : ''}</b></div>`).join('')}</div>`; };

export function presentation(p, withPrices) {
  const t = totals(p), cur = p.items[0] && p.items[0].currency, N = p.items.length + 2;
  const pics = p.items.filter(i => i.img).slice(0, 6), c = pics.length <= 1 ? 1 : pics.length <= 4 ? 2 : 3;
  const pages = [`<section class="pg">${brand('הצעה לפרויקט')}<div style="display:flex;flex-direction:column;gap:3mm;margin-top:6mm"><h1>${esc(p.name)}</h1>${p.client ? `<p class="lead">עבור ${esc(p.client)}</p>` : ''}</div>
<dl class="meta"><dt>תאריך</dt><dd>${today()}</dd><dt>פריטים</dt><dd>${p.items.length} דגמים · ${t.units} יחידות</dd>${withPrices && t.sum ? `<dt>סה״כ משוער</dt><dd>${fmtPrice(t.sum, cur)}${t.quote ? ' + פריטים לתמחור' : ''}</dd>` : ''}</dl>
${pics.length ? `<div class="collage" style="--c:${c}">${pics.map(i => `<figure><img src="${i.img}" alt=""><figcaption>${esc(i.name)}${i.qty > 1 ? ` × ${i.qty}` : ''}</figcaption></figure>`).join('')}</div>` : ''}${foot(1, N)}</section>`];
  p.items.forEach((i, n) => pages.push(`<section class="pg">${brand(`פריט ${n + 1} מתוך ${p.items.length}`)}<h2>${esc(i.name)}${i.qty > 1 ? `<small>כמות ${i.qty}</small>` : ''}</h2>
<div class="hero">${i.img ? `<img src="${i.img}" alt="">` : ''}</div>${specGrid(i, false)}
${withPrices ? `<div class="price"><span>${i.quote ? 'מחיר' : i.qty > 1 ? `מחיר ליחידה ${priceCell(i, cur)} · סה״כ ל־${i.qty}` : 'מחיר'}</span><b>${i.quote ? 'לפי הצעת מחיר' : i.price ? fmtPrice(i.price * i.qty, cur) : '—'}</b></div>` : ''}
${i.note ? `<div class="note">${esc(i.note)}</div>` : ''}${foot(n + 2, N)}</section>`));
  pages.push(`<section class="pg">${brand('ריכוז')}<h2>ריכוז הפריטים</h2><table><tr><th></th><th>פריט</th><th class="n">כמות</th>${withPrices ? '<th class="n">ליחידה</th><th class="n">סה״כ</th>' : ''}</tr>
${p.items.map(i => `<tr><td style="width:32mm">${i.img ? `<img class="thumb" src="${i.img}" alt="">` : ''}</td><td><b>${esc(i.name)}</b><br><span class="small">${esc(i.lines.join(' · '))}</span></td><td class="n">${i.qty}</td>${withPrices ? `<td class="n">${priceCell(i, cur)}</td><td class="n">${!i.quote && i.price ? fmtPrice(i.price * i.qty, cur) : ''}</td>` : ''}</tr>`).join('')}
${withPrices && t.sum ? `<tr class="sum"><td></td><td>סה״כ משוער${t.quote ? ' (ללא פריטים לתמחור)' : ''}</td><td class="n">${t.units}</td><td></td><td class="n">${fmtPrice(t.sum, cur)}</td></tr>` : ''}</table>
<p class="small">${withPrices ? 'המחירים כוללים מע״מ ומשוערים לפי המחירון ביום ההפקה. ההצעה הסופית תישלח מ־MORE. ' : ''}ההדמיות להמחשה. גוונים במציאות עשויים להיות שונים מעט מהמסך.</p>${foot(N, N)}</section>`);
  return openDoc(`${p.name} – MORE`, pages.join(''));
}

export function orderSheet(p) {
  const N = p.items.length + 1;
  const pages = [`<section class="pg">${brand('מפרט הזמנה לייצור')}<h2>${esc(p.name)}${p.client ? `<small>${esc(p.client)}</small>` : ''}</h2>
<table><tr><th class="n">#</th><th></th><th>פריט</th><th class="n">כמות</th></tr>${p.items.map((i, n) => `<tr><td class="n">${n + 1}</td><td style="width:32mm">${i.img ? `<img class="thumb" src="${i.img}" alt="">` : ''}</td><td><b>${esc(i.name)}</b><br><span class="small">${esc(i.lines.join(' · '))}</span><br><span class="code">${esc(i.code)}</span></td><td class="n">${i.qty}</td></tr>`).join('')}</table>
<p class="small">לכל פריט עמוד עם כל הבחירות וקודי הגוונים. פירוק לפלטות (עובי, קנט, פרזול) יתווסף כשכללי הייצור יאושרו.</p>${foot(1, N)}</section>`];
  p.items.forEach((i, n) => pages.push(`<section class="pg">${brand(`פריט ${n + 1} מתוך ${p.items.length}`)}<h2>${esc(i.name)}<small>כמות ${i.qty}</small></h2>
<div class="grid2"><div style="display:flex;flex-direction:column;gap:3mm">${specGrid(i, true).replace('class="spec"', 'class="spec" style="grid-template-columns:1fr"')}<div class="code">קוד תצורה: ${esc(i.code)}</div></div>${i.img ? `<img src="${i.img}" alt="">` : '<div></div>'}</div>
${i.note ? `<div class="note">הערת לקוח: ${esc(i.note)}</div>` : ''}${foot(n + 2, N)}</section>`));
  return openDoc(`מפרט הזמנה – ${p.name}`, pages.join(''));
}

/* ---------------- drawer UI ---------------- */
const CSS = `
.mrp-dlg{direction:rtl;border:0;padding:0;margin:0 0 0 auto;width:min(480px,100vw);max-width:100vw;height:100vh;height:100dvh;max-height:100dvh;background:#fff;color:#1C1C1A;box-shadow:0 0 40px rgba(0,0,0,.25);font-family:inherit;line-height:1.45}
.mrp-dlg::backdrop{background:rgba(28,28,26,.45)}
.mrp-dlg[open]{display:flex;flex-direction:column}
.mrp-dlg *{box-sizing:border-box}
.mrp-dlg button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;margin:0;padding:0;min-height:0;line-height:inherit;text-transform:none;letter-spacing:normal}
.mrp-dlg button:focus-visible,.mrp-dlg input:focus-visible,.mrp-dlg textarea:focus-visible,.mrp-dlg select:focus-visible{outline:2px solid #1C1C1A;outline-offset:2px}
.mrp-h{display:flex;align-items:center;gap:10px;padding:16px max(16px,env(safe-area-inset-right)) 12px max(16px,env(safe-area-inset-left));border-bottom:1px solid rgba(28,28,26,.12)}
.mrp-h strong{font-size:18px;flex:1}
.mrp-x{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-size:22px!important;background:#F3EEE5!important}
.mrp-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 16px;border-bottom:1px solid rgba(28,28,26,.08)}
.mrp-meta label{display:flex;flex-direction:column;gap:3px;font-size:12px;color:#5e5a52}
.mrp-meta input,.mrp-meta select,.mrp-it textarea{font:inherit;font-size:14px;color:#1C1C1A;border:1px solid rgba(28,28,26,.2);border-radius:9px;padding:8px 10px;background:#fff;width:100%;margin:0}
.mrp-meta .mrp-sel{grid-column:1/-1;display:flex;gap:8px;align-items:end}
.mrp-meta .mrp-sel label{flex:1}
.mrp-meta .mrp-new{padding:9px 12px!important;border:1px solid rgba(28,28,26,.2)!important;border-radius:9px;font-size:13px!important;white-space:nowrap}
.mrp-list{flex:1;overflow:auto;padding:8px 16px;display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain}
.mrp-empty{color:#5e5a52;text-align:center;padding:40px 10px;font-size:14px}
.mrp-it{display:grid;grid-template-columns:92px minmax(0,1fr);gap:4px 12px;padding:10px;border:1px solid rgba(28,28,26,.12);border-radius:14px}
.mrp-it img,.mrp-it .mrp-noimg{width:92px;height:74px;object-fit:contain;background:#F3EEE5;border-radius:10px;grid-row:span 2}
.mrp-it b{font-size:15px}
.mrp-it small{display:block;font-size:12px;color:#5e5a52;overflow-wrap:anywhere}
.mrp-row{grid-column:1/-1;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.mrp-q{display:flex;align-items:center;border:1px solid rgba(28,28,26,.2);border-radius:99px}
.mrp-q button{width:34px;height:34px;font-size:18px!important}
.mrp-q output{min-width:26px;text-align:center;font-weight:600}
.mrp-pr{margin-inline-start:auto;font-weight:600;font-size:14px;font-variant-numeric:tabular-nums}
.mrp-lnk{font-size:13px!important;text-decoration:underline!important;color:#5e5a52!important}
.mrp-it textarea{grid-column:1/-1;min-height:38px;resize:vertical;font-size:13px}
.mrp-f{border-top:1px solid rgba(28,28,26,.12);padding:12px 16px max(14px,env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:8px;background:#fff}
.mrp-tot{display:flex;justify-content:space-between;align-items:baseline;font-size:14px}
.mrp-tot b{font-size:18px}
.mrp-chk{display:flex;align-items:center;gap:8px;font-size:13px;color:#5e5a52}
.mrp-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.mrp-btns button{padding:11px 10px!important;border-radius:11px;border:1px solid #1C1C1A!important;font-weight:600!important;font-size:14px!important}
.mrp-btns .mrp-main{background:#1C1C1A!important;color:#fff!important}
.mrp-btns .mrp-wide{grid-column:1/-1}
.mrp-admin{border-style:dashed!important}
@media (max-width:520px){.mrp-dlg{width:100vw}.mrp-meta{grid-template-columns:1fr}}
`;

let dlg = null, cfg = { quoteUrl: '/contact/' };
function ensureDialog() {
  if (dlg) return dlg;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  dlg = document.createElement('dialog'); dlg.className = 'mrp-dlg'; dlg.setAttribute('aria-labelledby', 'mrp-title');
  document.body.appendChild(dlg);
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => { document.documentElement.style.overflow = ''; });
  dlg.addEventListener('click', onClick);
  dlg.addEventListener('input', onInput);
  dlg.addEventListener('change', onChange);
  addEventListener('mrcfg-project', () => { const f = document.activeElement; if (dlg.open && !(f && dlg.contains(f) && f.matches('input,textarea'))) render(); });
  return dlg;
}
function render() {
  const d = load(), p = d.list[d.active], t = totals(p), cur = p.items[0] && p.items[0].currency, admin = isAdmin();
  const opts = Object.values(d.list).sort((a, b) => b.created - a.created).map(x => `<option value="${x.id}"${x.id === d.active ? ' selected' : ''}>${esc(x.name)} (${x.items.length})</option>`).join('');
  dlg.innerHTML = `<div class="mrp-h"><strong id="mrp-title">הפרויקט שלי</strong><button class="mrp-x" data-a="close" aria-label="סגירה">×</button></div>
<div class="mrp-meta"><div class="mrp-sel"><label>פרויקט<select data-f="switch">${opts}</select></label><button class="mrp-new" data-a="new">+ פרויקט חדש</button></div>
<label>שם הפרויקט<input data-f="name" value="${esc(p.name)}" maxlength="80"></label><label>שם הלקוח (לא חובה)<input data-f="client" value="${esc(p.client)}" maxlength="80"></label></div>
<div class="mrp-list">${p.items.length ? p.items.map(i => `<div class="mrp-it" data-id="${i.id}">${i.img ? `<img src="${i.img}" alt="">` : '<span class="mrp-noimg"></span>'}
<div><b>${esc(i.name)}</b><small>${esc(i.lines.join(' · '))}</small></div><div><small class="code" dir="ltr">${esc(i.code)}</small></div>
<div class="mrp-row"><div class="mrp-q"><button data-a="minus" aria-label="פחות">−</button><output>${i.qty}</output><button data-a="plus" aria-label="יותר">+</button></div>${i.url ? `<a class="mrp-lnk" href="${esc(i.url)}">פתיחה</a>` : ''}<button class="mrp-lnk" data-a="del">הסרה</button><span class="mrp-pr">${!i.quote && i.price ? fmtPrice(i.price * i.qty, cur) : priceCell(i, cur)}</span></div>
<textarea data-f="note" placeholder="הערה לפריט (חדר, מיקום, בקשה מיוחדת)" maxlength="400">${esc(i.note)}</textarea></div>`).join('')
    : '<p class="mrp-empty">עדיין אין פריטים. בחרו תצורה בקונפיגורטור ולחצו "הוספה לפרויקט".</p>'}</div>
<div class="mrp-f">${p.items.length ? `<div class="mrp-tot"><span>${t.units} יחידות${t.quote ? ` · ${t.quote} לתמחור` : ''}</span><b>${t.sum ? fmtPrice(t.sum, cur) : ''}</b></div>
<label class="mrp-chk"><input type="checkbox" data-f="prices"${p.showPrices !== false ? ' checked' : ''}> להציג מחירים במצגת</label>
<div class="mrp-btns"><button class="mrp-main" data-a="pdf">מצגת ללקוח (PDF)</button><button data-a="send">שליחת בקשה אלינו</button>${admin ? '<button class="mrp-admin mrp-wide" data-a="sheet">מפרט הזמנה לייצור (PDF)</button>' : ''}</div>` : ''}</div>`;
}
function onClick(e) {
  const b = e.target.closest('button'); if (!b) return;
  const a = b.dataset.a, itId = b.closest('[data-id]') && b.closest('[data-id]').dataset.id;
  if (a === 'close') { dlg.close(); return; }
  if (a === 'new') { mutate(d => { const x = blank().list; const id = Object.keys(x)[0]; d.list[id] = x[id]; d.active = id; }); render(); dlg.querySelector('[data-f="name"]').select(); return; }
  if (a === 'plus' || a === 'minus') { mutate((d, p) => { const i = p.items.find(x => x.id === itId); i.qty = Math.max(1, Math.min(999, i.qty + (a === 'plus' ? 1 : -1))); }); render(); return; }
  if (a === 'del') { mutate((d, p) => { p.items = p.items.filter(x => x.id !== itId); }); render(); return; }
  const p = active();
  if (a === 'pdf') { if (!presentation(p, p.showPrices !== false)) alertBlocked(); return; }
  if (a === 'sheet') { if (!orderSheet(p)) alertBlocked(); return; }
  if (a === 'send') { const u = cfg.quoteUrl; location.href = u + (u.includes('?') ? '&' : '?') + 'subject=' + encodeURIComponent(`בקשה לפרויקט: ${p.name}\n` + requestText(p)); }
}
function alertBlocked() { const f = dlg.querySelector('.mrp-f'); if (f && !f.querySelector('.mrp-blk')) f.insertAdjacentHTML('afterbegin', '<p class="mrp-blk" style="margin:0;color:#a33;font-size:13px">הדפדפן חסם חלון חדש. אפשרו חלונות קופצים לאתר ונסו שוב.</p>'); }
function onInput(e) {
  const f = e.target.dataset.f; if (!f) return;
  if (f === 'name' || f === 'client') mutate((d, p) => { p[f] = e.target.value; });
  if (f === 'note') { const id = e.target.closest('[data-id]').dataset.id; mutate((d, p) => { p.items.find(x => x.id === id).note = e.target.value; }); }
}
function onChange(e) {
  const f = e.target.dataset.f;
  if (f === 'switch') { mutate(d => { d.active = e.target.value; }); render(); }
  if (f === 'prices') mutate((d, p) => { p.showPrices = e.target.checked; });
  if (f === 'name') render();
}
export function openDrawer(opts = {}) {
  Object.assign(cfg, opts);
  ensureDialog(); render();
  if (!dlg.open) { dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', ''); document.documentElement.style.overflow = 'hidden'; }
}
