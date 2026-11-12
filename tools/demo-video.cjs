/* Renders a short looping product demo from the live configurator.
   usage: node tools/demo-video.cjs demos/<product>.json [outdir]
   needs: a static server on :8811 serving this repo (python3 -m http.server 8811), playwright, ffmpeg.
   Each timeline step: {explode:bool} | {set:{key:value}} (same path as a control) |
   {paint:{part:fabricId}} (per-part fabric, pops on change) | {reset:true} (back to the product defaults).
   Output: <out>/<product>-demo.webp (animated, loops, for <img>/CSS backgrounds) and .mp4. */
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const out = process.argv[3] || 'demos/out';
const [W, H] = cfg.size, FPS = cfg.fps, N = Math.round(cfg.dur * FPS), C = cfg.camera, fr = path.join(out, 'frames-' + cfg.product);
fs.mkdirSync(fr, { recursive: true }); fs.readdirSync(fr).forEach(f => fs.unlinkSync(path.join(fr, f)));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W + 420, height: H + 200 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.log('PERR', e.message));
  await p.clock.install({ time: new Date('2026-11-12T10:00:00') });
  await p.goto(`http://localhost:8811/examples/demo.html?p=${cfg.product}`);
  for (let i = 0; i < 3; i++) { await p.waitForTimeout(3000); await p.clock.runFor(200); }
  await p.addStyleTag({ content: `#mrcfg .mrc-wrap{grid-template-columns:0 1fr!important}#mrcfg .mrc-panel,#mrcfg .mrc-foot{visibility:hidden}
   #mrcfg .mrc-stage{width:${W}px!important;height:${H}px!important;min-height:0!important;max-height:none!important;border-radius:0!important}
   .mrc-tools,.mrc-badge,.mrc-hint,.mrc-hot,.mrc-dimtag,.mrc-toast,.mrc-dlabel,.mrc-grid{display:none!important}` });
  await p.evaluate(() => window.dispatchEvent(new Event('resize')));
  await p.evaluate(() => document.getElementById('mrcfg')._set({ nosel: true, psel: '' }));
  const D = await p.evaluate(() => { const g = document.getElementById('mrcfg')._cam; return { r: g.r }; });
  const run = st => p.evaluate(st => {
    const r = document.getElementById('mrcfg');
    if (st.reset) r._set({ pmap: r._pmap0 });
    if (st.set) r._set(st.set);
    if (st.paint) { const m = Object.fromEntries((r._pmapNow() || '').split(';').filter(Boolean).map(x => x.split('='))); Object.assign(m, st.paint); r._set({ pmode: 'part', pmap: Object.entries(m).map(e => e.join('=')).join(';') }); }
    if ('explode' in st) r._explode(st.explode);
  }, st);
  await p.evaluate(() => { const r = document.getElementById('mrcfg'); r._pmap0 = r._pmapNow(); });
  let ti = 0, ex = 0;
  // settle the first state before frame 0 so the loop joins cleanly
  while (ti < cfg.timeline.length && cfg.timeline[ti][0] <= 0) { const st = cfg.timeline[ti++][1]; if ('explode' in st) ex = st.explode ? 1 : 0; await run(st); }
  await p.clock.runFor(1500);
  for (let f = 0; f < N; f++) {
    const t = f / FPS;
    while (ti < cfg.timeline.length && cfg.timeline[ti][0] <= t) { const st = cfg.timeline[ti++][1]; if ('explode' in st) ex = st.explode ? 1 : 0; await run(st); }
    await p.evaluate(([t, C, r0, dur]) => { const g = document.getElementById('mrcfg')._cam; const s = Math.sin(2 * Math.PI * t / dur);
      g.th = C.th + C.swing * s; g.ph = C.ph; g.r = r0 * C.r; g.ty = C.ty; }, [t, C, D.r, cfg.dur]);
    await p.clock.runFor(1000 / FPS);
    const url = await p.evaluate(bg => document.getElementById('mrcfg')._frame(src => { const c = window.__cv || (window.__cv = document.createElement('canvas')); c.width = src.width; c.height = src.height;
      const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); x.drawImage(src, 0, 0); return c.toDataURL('image/png'); }), cfg.bg);
    fs.writeFileSync(path.join(fr, `f${String(f).padStart(4, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
  }
  await b.close();
  const base = path.join(out, cfg.product + '-demo');
  execSync(`ffmpeg -y -loglevel error -framerate ${FPS} -i ${fr}/f%04d.png -vf "scale=${W}:${H}:flags=lanczos" -c:v libwebp_anim -lossless 0 -q:v 62 -compression_level 6 -loop 0 ${base}.webp`);
  execSync(`ffmpeg -y -loglevel error -framerate ${FPS} -i ${fr}/f%04d.png -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -movflags +faststart ${base}.mp4`);
  console.log('done', base, N, 'frames');
})();
