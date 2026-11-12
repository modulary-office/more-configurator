/* Builds a supplier work order from configurator items: lines + a render for each line that wants one.
   usage: node orders/make-order.cjs orders/examples/<order>.json [outdir]
   needs: static server on :8811 serving this repo, playwright.
   order JSON: { "subject": "...", "items": [ { "product": "manager-desk", "state": { ...changes from defaults }, "qty": 1, "room": "optional" } ] }
   writes <out>/<name>/order.json ({subject, contactId, lines:[{d,q,p,img}]}) and the jpg renders next to it. */
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
require('./order-lines.js'); const { orderLines } = globalThis.MoreOrders;   // package is ESM, the file sets a global
const map = JSON.parse(fs.readFileSync(path.join(__dirname, 'supplier-map.json'), 'utf8'));
const src = process.argv[2], order = JSON.parse(fs.readFileSync(src, 'utf8'));
const name = path.basename(src, '.json'), out = path.join(process.argv[3] || path.join(__dirname, 'out'), name);
fs.mkdirSync(out, { recursive: true });

const CSS = `#mrcfg .mrc-wrap{grid-template-columns:0 1fr!important}#mrcfg .mrc-panel,#mrcfg .mrc-foot{visibility:hidden}
#mrcfg .mrc-stage{width:900px!important;height:640px!important}.mrc-tools,.mrc-badge,.mrc-hint,.mrc-hot,.mrc-toast,.mrc-dlabel,.mrc-grid{display:none!important}`;
const shot = (p, bg = '#fff') => p.evaluate(bg => document.getElementById('mrcfg')._frame(src => { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); x.drawImage(src, 0, 0); return c.toDataURL('image/jpeg', .88); }), bg);
const save = (u, f) => fs.writeFileSync(path.join(out, f), Buffer.from(u.split(',')[1], 'base64'));

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const lines = [];
  for (const [i, it] of order.items.entries()) {
    const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
    await p.goto(`http://localhost:8811/examples/demo.html?p=${it.product}`); await p.waitForTimeout(7000);
    await p.addStyleTag({ content: CSS }); await p.evaluate(() => window.dispatchEvent(new Event('resize')));
    await p.evaluate(st => document.getElementById('mrcfg')._set({ nosel: true, ...st }), it.state || {});
    await p.waitForTimeout(2500);
    const S = await p.evaluate(() => document.getElementById('mrcfg')._state());
    const code = await p.evaluate(() => document.getElementById('mrcfg').mrcfg.code());
    const L = orderLines(it.product, S, { map, qty: it.qty || 1, room: it.room });
    const want = new Set(L.map(l => l.img).filter(Boolean)), files = {};
    if (want.has('product') || want.has('return')) { const f = `${i + 1}-${it.product}.jpg`; save(await shot(p), f); files.product = files.return = f; }
    if (want.has('frame')) {   // the frame without the top (a riding frame keeps its return, so it is shown the way it stands)
      await p.evaluate(() => document.getElementById('mrcfg')._set({ top: 'none' })); await p.waitForTimeout(2500);
      const f = `${i + 1}-${it.product}-frame.jpg`; save(await shot(p, '#f1f1f1'), f); files.frame = f;
    }
    L.forEach(l => { l.img = files[l.img] || ''; });
    lines.push(...L); await p.close();
    console.log(it.product, code, L.length, 'lines');
    it.code = code;
  }
  await b.close();
  const res = { subject: order.subject, contactId: map.supplier.plandoContactId, docType: map.supplier.docType, codes: order.items.map(i => i.code), lines };
  fs.writeFileSync(path.join(out, 'order.json'), JSON.stringify(res, null, 1));
  console.log(JSON.stringify(res, null, 1));
})();
