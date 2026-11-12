/* Turns a configurator state into work-order lines for the supplier (שני / Modulartech),
   written the way Marhiv writes them in Plando. See orders/DNA.md for the rules and where they come from.

   orderLines(productId, S, { map, qty, room }) -> [{ d, q, p, img }]
     d   line text (Hebrew, supplier vocabulary)
     q   quantity
     p   price: 0 by default – the supplier prices the order and sends it back for approval
     img which render to attach: 'product' | 'frame' | 'return' | ''  (resolved by make-order.cjs)

   Works in node (require) and in the browser (window.MoreOrders). */
(function (root) {
  const J = (...a) => a.filter(x => x !== '' && x != null && x !== false).join(' ');

  function decor(map, id) {
    const d = map.decors[id] || { he: id, code: null };
    if (d.code === null) return `גוון ${d.he} [קוד גוון לאישור]`;
    return d.code ? `גוון ${d.code} ${d.he}` : `גוון ${d.he}`;
  }
  const dark = id => ['black', 'graphite', 'walnut', 'smoked', 'navy', 'olive', 'concrete'].includes(id);
  const handles = (map, kind, bodyId) => {
    const base = map.handles[kind] || '';
    if (!base || /טאץ/.test(base)) return base;
    return `${base} ${dark(bodyId) ? 'שחורות' : 'לבנות'}`;
  };
  const dims = (map, ...n) => n.join(map.sep);
  const frameName = (map, S) => {
    const f = map.frames[S.frame] || S.frame, c = map.frameColors[S.fcolor] || `RAL ${S.fcolor}`;
    return `${f} ${c}`;
  };

  /* desks: split into top / frame / modesty panel / return – one line each */
  function desk(map, S, q) {
    const L = [];
    const W = +S.w, D = +S.d, single = (S.layout || 'single') === 'single';
    const top = S.top && S.top !== 'none';
    const seats = single ? 1 : (S.layout === 'pair' ? 2 : S.layout === 'bench' ? 4 : +S.n || 2);
    const qq = q * (single ? 1 : seats);
    const ret = S.ret && S.ret !== 'none' && single;
    const credenza = ret && S.rarr != null;                       // manager desk: frame rides on a full return
    const attached = ret && S.rarr == null;                       // office desk: kaskat on a drawer pedestal
    const side = S.ret === 'left' ? 'לשמאל' : 'לימין';

    if (top) L.push({ d: J('פלטה', map.thickness[S.top], dims(map, W, D), decor(map, S.decor), map.edge[S.top]), q: qq, p: 0, img: 'product' });

    if (S.frame === 'electric') L.push({ d: J('רגל שולחן חשמלי', dims(map, W, D), map.frameColors[S.fcolor] || '', S.motor === 'dual' ? 'שני מנועים' : ''), q: qq, p: 0, img: 'frame' });
    else L.push({ d: J('רגל', frameName(map, S), credenza ? 'רוכב 3 רגליים' : '', dims(map, W, D), S.holes ? '+ פתחי כבלים' : '', S.tray ? '+ תעלת תקשורת' : ''), q: qq, p: 0, img: top ? 'frame' : 'product' });

    if (top && single) L.push({ d: J('סינר', dims(map, W - map.apron.shorterBy, map.apron.height), decor(map, S.decor)), q: qq, p: 0, img: '' });

    if (credenza) {
      const front = S.rfaceOn ? `חזית ${decor(map, S.rface).replace(/^גוון /, '')}` : '';
      L.push({ d: J('שלוחה', side, `H${map.returnHeight}${map.sep}40${map.sep}${S.rw}`, map.returnArr[S.rarr] || S.rarr,
        `גוף ${decor(map, S.rbody).replace(/^גוון /, '')}`, front, S.rinset === 'inset' ? 'חזית שקועה' : '',
        handles(map, S.rhandle, S.rbody), '– השלד רוכב על השלוחה'), q, p: 0, img: '' });
    }
    if (attached) {
      const kas = dims(map, S.rw, 45);
      L.push({ d: J('ארגז מגירות תומך שלוחה', decor(map, S.rbody), S.rfaceOn ? `חזית ${decor(map, S.rface).replace(/^גוון /, '')}` : '', S.rinset === 'inset' ? 'חזית שקועה' : '', handles(map, S.rhandle, S.rbody)), q, p: 0, img: '' });
      if (S.rped === 'drd') L.push({ d: J('ארגז דלת תומך שלוחה', decor(map, S.rbody), handles(map, S.rhandle, S.rbody)), q, p: 0, img: '' });
      L.push({ d: J('פלטה', map.thickness[S.top] || '28 ממ', 'לשלוחה', side, kas, decor(map, S.decor), '+ 2 פלחים לחיבור לשולחן'), q, p: 0, img: '' });
    }
    return L;
  }

  /* cabinets: one line, H<height>\<depth>\<width> like the past orders */
  function cabinet(map, S, q, product) {
    const fronts = { doors: 'דלתות', doors2: '2 דלתות', doors4: '4 דלתות', doorsDrawers: 'דלתות + מגירות', open: 'פתוח', openDoors: 'פתוח למעלה + דלתות למטה' };
    const kind = product.he || 'ארון';
    const face = S.face && S.face !== S.body ? `חזית ${decor(map, S.face).replace(/^גוון /, '')}` : '';
    return [{ d: J(kind, `H${S.h}${map.sep}${S.d}${map.sep}${S.w}`, fronts[S.front] || '', `גוף ${decor(map, S.body).replace(/^גוון /, '')}`, face,
      handles(map, S.handle, S.face || S.body), S.base === 'plinth' ? 'צוקל' : S.base === 'legs' ? 'רגלי אלומיניום' : S.base === 'wheels' ? 'על גלגלים' : '',
      S.shelves ? `${S.shelves} מדפים` : '', S.back ? 'גב מלא' : '', S.lock ? 'נעילה' : '', S.side28 ? 'דפנות 28' : '', S.softclose ? 'טריקה שקטה' : ''), q, p: 0, img: 'product' }];
  }

  const FAMILY = { 'manager-desk': desk, 'office-desk': desk, 'bench-desk': desk, 'desk-frame': desk };
  const CAB = { 'cabinet-low': 'ארון', 'cabinet-tall': 'ארון', 'cabinet-sliding': 'ארון הזזה', 'credenza': 'שלוחה', 'file-cabinet': 'ארון תיקיות', 'shelf-open': 'כוננית', 'cubby': 'כוורת', 'drawer-unit': 'ארגז מגירות', 'kitchenette': 'יחידה תחתונה מטבחון', 'counter': 'דלפק' };

  function orderLines(productId, S, opt = {}) {
    const map = opt.map, q = opt.qty || 1;
    let L = FAMILY[productId] ? FAMILY[productId](map, S, q) : CAB[productId] ? cabinet(map, S, q, { he: CAB[productId] }) : [{ d: `${productId} ${JSON.stringify(S)}`, q, p: 0, img: 'product' }];
    if (opt.room) L = [{ d: `${opt.room}-----------`, q: 1, p: 0, img: '' }, ...L];   // room separator line, as in the past orders
    return L;
  }

  const api = { orderLines };
  root.MoreOrders = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
