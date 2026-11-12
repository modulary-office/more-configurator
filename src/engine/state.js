/* State: defaults, validation against the product schema, share-link (#cfg=) encode/decode. */

export const controlsOf = product => product.sections.flatMap(s => s.controls.map(c => ({ ...c, section: s.id })));

/* options currently offered by a seg control. optionsBy.key may be one key or several (map keys joined
   with "|", "*" as a wildcard: "bench|bari", "single|*", "*|venice", "*"). Entries are values or {v, label}. */
const keysOf = c => [].concat(c.optionsBy.key);
export const driverOf = (c, S) => keysOf(c).map(k => String(S[k])).join('|');
export function optionList(c, S) {
  if (!c.optionsBy) return (c.options || []).map(o => ({ v: o.v, label: o.label ?? String(o.v), hex: o.hex }));
  const vals = keysOf(c).map(k => String(S[k])), M = c.optionsBy.map;
  const tries = [vals.join('|'), ...vals.map((_, i) => vals.map((v, j) => (j === i ? v : '*')).join('|')), vals.map(() => '*').join('|'), '*'];
  const hit = tries.find(t => M[t]);
  return (hit ? M[hit] : []).map(o => (o && typeof o === 'object' ? { v: o.v, label: o.label ?? String(o.v) } : { v: o, label: String(o) }));
}
export function optionValues(c, S) { return optionList(c, S).map(o => o.v); }

/* a value outside the listed options that the control's custom range accepts */
export const isCustom = (c, S, v = S[c.key]) => !!c.custom && !optionValues(c, S).includes(v);

function validOne(c, S, v, cat) {
  switch (c.type) {
    case 'seg': {
      if (c.num) v = Number(v);
      if (optionValues(c, S).includes(v)) return { ok: true, v };
      if (c.custom && Number.isFinite(v) && v >= c.custom.min && v <= c.custom.max) return { ok: true, v: Math.round(v / (c.custom.step || 1)) * (c.custom.step || 1) };
      return { ok: false };
    }
    case 'stepper': { v = Number(v); return Number.isInteger(v) && v >= c.min && v <= c.max ? { ok: true, v } : { ok: false }; }
    case 'swatch': { const items = catItems(c, cat); if (items.some(x => x.id === v)) return { ok: true, v };
      /* old decor names (before the real supplier shades) map to the closest shade, so old links and saved projects still open */
      const al = cat[c.catalog] && cat[c.catalog].aliases, to = al && al[v];
      return to && items.some(x => x.id === to) ? { ok: true, v: to } : { ok: false }; }
    case 'toggle': return typeof v === 'boolean' ? { ok: true, v } : { ok: false };
  }
  return { ok: false };
}

export function catItems(c, cat) {
  const all = (cat[c.catalog] && cat[c.catalog].items) || [];
  return c.items ? all.filter(x => c.items.includes(x.id)) : all;
}

/* Merge input over defaults. Unknown keys are dropped; invalid values fall back to the default. */
export function sanitize(product, cat, input) {
  const S = { ...product.defaults };
  const ctrls = controlsOf(product);
  /* drivers before the controls that depend on them (frame → layout → depth) */
  const ordered = [], left = ctrls.slice();
  for (let guard = 0; left.length && guard < 10; guard++)
    for (let i = left.length - 1; i >= 0; i--) {
      const c = left[i], deps = c.optionsBy ? keysOf(c) : [];
      if (deps.every(d => !left.some(o => o.key === d && o !== c))) { ordered.push(c); left.splice(i, 1); }
    }
  ordered.push(...left);
  if (input && typeof input === 'object') for (const c of ordered) {
    if (!(c.key in input)) continue;
    const r = validOne(c, S, input[c.key], cat);
    if (r.ok) S[c.key] = r.v;
  }
  /* family-owned values without a control (e.g. per-part fabrics) come back from the link as they were */
  if (input && typeof input === 'object') for (const k of Object.keys(product.defaults)) if (!ctrls.some(c => c.key === k) && k in input && typeof input[k] === typeof product.defaults[k]) S[k] = input[k];
  /* defaults themselves must be consistent (e.g. d must exist for the chosen layout) */
  for (const c of ordered) {
    const fromInput = input && typeof input === 'object' && c.key in input;
    /* a default that is not one of the listed options for the current choice snaps to the first option
       (a typed custom size is only kept when it came from the link itself) */
    if (c.optionsBy && !fromInput && !optionValues(c, S).includes(S[c.key])) { S[c.key] = optionValues(c, S)[0]; continue; }
    const r = validOne(c, S, S[c.key], cat); if (!r.ok) S[c.key] = c.type === 'seg' ? optionValues(c, S)[0] : product.defaults[c.key];
  }
  return S;
}

export function readHash() {
  try {
    const m = location.hash.match(/cfg=([^&]+)/);
    if (m) return JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/-/g, '+').replace(/_/g, '/')))));
  } catch (e) {}
  return null;
}
export function writeHash(S) {
  try { history.replaceState(null, '', '#cfg=' + btoa(unescape(encodeURIComponent(JSON.stringify(S)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')); } catch (e) {}
}
