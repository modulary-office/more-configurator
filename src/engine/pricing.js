/* Price rules. Every rule may carry "when": { key: value | [values] } and is skipped unless it matches.
   Rules run in order; "percent" and "qtyDiscount" act on the subtotal reached so far.

   fixed        { amount }                                   – flat amount
   unit         { per, amount }                              – amount × metric (seats, lengthM, areaM2, …)
   area         { amount }                                   – amount × areaM2
   length       { amount }                                   – amount × lengthM
   option       { key, amounts: {value: n}, otherwise?, per? } – amount for the chosen value, optionally × metric
   percent      { percent }                                  – % of the subtotal so far (negative = discount)
   tiers        { by, tiers: [{ upTo, amount }] }            – first tier whose upTo ≥ metric; amount × per (optional)
   qtyDiscount  { by, tiers: [{ from, percent }] }           – highest tier whose from ≤ metric, as a discount
   customSize   { key | keys, amount?, percent? }            – when a typed size is outside the standard list
*/
import { controlsOf, isCustom } from './state.js';

const matches = (when, S) => !when || Object.entries(when).every(([k, v]) => Array.isArray(v) ? v.includes(S[k]) : S[k] === v);
const num = v => (Number.isFinite(+v) ? +v : 0);

export function price(product, S, metrics) {
  const P = product.pricing; if (!P || !Array.isArray(P.rules)) return { total: 0, lines: [] };
  const ctrls = controlsOf(product);
  let sub = 0; const lines = [];
  const m = k => num(metrics[k]);
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
        const x = m(r.by), t = (r.tiers || []).find(t => x <= num(t.upTo)) || (r.tiers || []).slice(-1)[0];
        a = t ? num(t.amount) * (r.per ? m(r.per) : 1) : 0; break;
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
    }
    if (a) { sub += a; lines.push({ label: r.label || r.type, amount: a }); }
  }
  return { total: Math.max(0, Math.round(sub)), lines };
}

export const fmtPrice = (n, cur = '₪') => cur === '₪'
  ? new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n)
  : n.toLocaleString('he-IL') + ' ' + cur;
