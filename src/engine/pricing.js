/* Price rules. Every rule may carry "when": { key: value | [values] } and is skipped unless it matches.
   Rules run in order; "percent", "tiers" with percent and "qtyDiscount" act on the subtotal reached so far.
   Quantities ("per", "by") are read from the family's metrics first, then from the configuration itself (w, h, d…).

   fixed        { amount }                                     – flat amount
   unit         { per, amount }                                – amount × quantity (seats, lengthM, doors, drawers, …)
   area         { amount }                                     – amount × areaM2
   length       { amount }                                     – amount × lengthM
   option       { key, amounts: {value: n}, otherwise?, per? }   – amount for the chosen value, optionally × quantity
   percent      { percent }                                    – % of the subtotal so far (negative = discount)
   tiers        { by, tiers: [{ upTo, amount | percent }], per? } – first tier whose upTo ≥ value
   qtyDiscount  { by, tiers: [{ from, percent }] }             – highest tier whose from ≤ value, as a discount
   customSize   { key | keys, amount?, percent? }              – when a typed size is outside the standard list
   table        { dims: ["w","h"], rows: [{ w, h, price, when? }], clamp?: { d: [min, max] } }
                – price-list rows for standard sizes. A size in the list gets its exact price; any other size is
                  interpolated (or extrapolated) from the neighbouring rows, one dimension at a time. A dimension
                  with only one row in the list scales in proportion (e.g. a 175 cm wide cabinet from the 80 cm price).

   Product-level: "markup" (% on top of the list, e.g. 100 = ×2), "vat" (% added, e.g. 18), "roundTo" (e.g. 10).
*/
import { controlsOf, isCustom } from './state.js';

const matches = (when, S) => !when || Object.entries(when).every(([k, v]) => Array.isArray(v) ? v.includes(S[k]) : S[k] === v);
const num = v => (Number.isFinite(+v) ? +v : 0);

/* price for target size t from list rows, interpolating dimension by dimension */
export function tablePrice(rows, dims, t) {
  if (!rows.length) return 0;
  const dist = r => dims.reduce((s, d) => s + Math.abs(num(r[d]) - t[d]) / Math.max(1, t[d]), 0);
  const ref = rows.slice().sort((a, b) => dist(a) - dist(b))[0];
  let p = num(ref.price); const cur = {}; dims.forEach(d => cur[d] = num(ref[d]));
  for (const d of dims) {
    if (cur[d] === t[d]) continue;
    /* rows on the same line: equal to the current point in every other dimension */
    const line = rows.filter(r => dims.every(o => o === d || num(r[o]) === cur[o]));
    const xs = [...new Map(line.map(r => [num(r[d]), num(r.price)])).entries()].sort((a, b) => a[0] - b[0]);
    const f = x => {
      if (xs.length < 2) return null;
      let i = xs.findIndex(([v]) => v >= x);
      if (i === -1) i = xs.length - 1; else if (i === 0) i = 1;
      const [x0, y0] = xs[i - 1], [x1, y1] = xs[i];
      return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
    };
    const a = f(cur[d]), b = f(t[d]);
    if (a && b && b > 0) p = p * b / a;
    else p = p * t[d] / Math.max(1, cur[d]);           /* single point → proportional */
    cur[d] = t[d];
  }
  return p;
}

export function price(product, S, metrics) {
  const P = product.pricing; if (!P || !Array.isArray(P.rules)) return { total: 0, lines: [] };
  const ctrls = controlsOf(product);
  let sub = 0; const lines = [];
  const m = k => (k in metrics ? num(metrics[k]) : num(S[k]));
  for (const r of P.rules) {
    if (!matches(r.when, S)) continue;
    let a = 0;
    switch (r.type) {
      case 'fixed': a = num(r.amount); break;
      case 'unit': a = num(r.amount) * m(r.per); break;
      case 'area': a = num(r.amount) * m('areaM2'); break;
      case 'length': a = num(r.amount) * m('lengthM'); break;
      case 'option': {
        const v = S[r.key], base = r.amounts && v in r.amounts ? num(r.amounts[v]) : num(r.otherwise);
        a = base * (r.per ? m(r.per) : 1); break;
      }
      case 'percent': a = sub * num(r.percent) / 100; break;
      case 'tiers': {
        const x = m(r.by), list = r.tiers || [], t = list.find(t => x <= num(t.upTo)) || list[list.length - 1];
        a = !t ? 0 : 'percent' in t ? sub * num(t.percent) / 100 : num(t.amount) * (r.per ? m(r.per) : 1); break;
      }
      case 'qtyDiscount': {
        const x = m(r.by), t = (r.tiers || []).filter(t => x >= num(t.from)).sort((p, q) => q.from - p.from)[0];
        a = t ? -sub * num(t.percent) / 100 : 0; break;
      }
      case 'customSize': {
        const keys = r.keys || [r.key];
        const hit = keys.some(k => { const c = ctrls.find(c => c.key === k); return c && isCustom(c, S); });
        a = hit ? num(r.amount) + sub * num(r.percent) / 100 : 0; break;
      }
      case 'table': {
        const dims = r.dims || ['w'];
        const rows = (r.rows || []).filter(row => matches(row.when, S));
        const t = {};
        dims.forEach(d => { let v = m(d); const c = r.clamp && r.clamp[d]; if (c) v = Math.max(c[0], Math.min(c[1], v)); t[d] = v; });
        a = tablePrice(rows, dims, t); break;
      }
    }
    if (a) { sub += a; lines.push({ label: r.label || r.type, amount: a }); }
  }
  let total = sub * (1 + num(P.markup) / 100) * (1 + num(P.vat) / 100);
  const step = num(P.roundTo) || 1;
  total = Math.max(0, Math.round(total / step) * step);
  return { total, list: Math.round(sub), lines };
}

export const fmtPrice = (n, cur = '₪') => cur === '₪'
  ? new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n)
  : n.toLocaleString('he-IL') + ' ' + cur;
