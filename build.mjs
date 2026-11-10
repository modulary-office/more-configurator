// Build: node build.mjs   (needs esbuild – `npm install`)
// Outputs dist/mrcfg.min.js + dist/mrcfg.min.css. three.js stays external (loaded from jsDelivr).
// THREE_URL can point elsewhere for local testing.
import { build } from 'esbuild';
const THREE_URL = process.env.THREE_URL || 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
const OUT = process.env.OUT || 'dist';
await build({
  entryPoints: ['src/engine/index.js'], bundle: true, minify: true, format: 'esm', target: 'es2020',
  outfile: `${OUT}/mrcfg.min.js`, legalComments: 'none',
  plugins: [{ name: 'three-external', setup(b) { b.onResolve({ filter: /^three$/ }, () => ({ path: THREE_URL, external: true })); } }]
});
await build({ entryPoints: ['src/engine/mrcfg.css'], bundle: true, minify: true, outfile: `${OUT}/mrcfg.min.css` });
console.log('built', OUT);
