/* State: defaults, validation against the product schema, share-link (#cfg=) encode/decode. */

export const controlsOf = product => product.sections.flatMap(s => s.controls.map(c => ({ ...c, section: s.id })));

/* option values currently allowed for a seg control (resolves optionsBy) */
export function optionValues(c, S) {
  if (c.optionsBy) return (c.optionsBy.map[S[c.optionsBy.key]] || []).slice();
  return (c.options || []).map(o => o.v);
}

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
    case 'swatch': { const items = catItems(c, cat); return items.some(x => x.id === v) ? { ok: true, v } : { ok: false }; }
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
  /* drivers first (e.g. layout before d), so dependent option lists resolve correctly */
  const ordered = [...ctrls.filter(c => !c.optionsBy), ...ctrls.filter(c => c.optionsBy)];
  if (input && typeof input === 'object') for (const c of ordered) {
    if (!(c.key in input)) continue;
    const r = validOne(c, S, input[c.key], cat);
    if (r.ok) S[c.key] = r.v;
  }
  /* defaults themselves must be consistent (e.g. d must exist for the chosen layout) */
  for (const c of ordered) { const r = validOne(c, S, S[c.key], cat); if (!r.ok) S[c.key] = c.type === 'seg' ? optionValues(c, S)[0] : product.defaults[c.key]; }
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
