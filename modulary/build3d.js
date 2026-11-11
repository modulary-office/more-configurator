/* MODULARY – "בונים בתלת־ממד": one page, every configurator product.
   Loads the shared MORE configurator engine (pinned commit) and swaps products with ?p=<id>. */
const ENGINE = 'https://cdn.jsdelivr.net/gh/modulary-office/more-configurator@8a76ba6/dist/';
const GROUPS = [
  ['שולחנות', [['office-desk', 'שולחן עבודה'], ['manager-desk', 'שולחן מנהל'], ['desk-frame', 'שלד לשולחן']]],
  ['עמדות עבודה', [['bench-desk', 'עמדות משותפות'], ['duo-bench', 'Duo Bench עם מחיצות']]],
  ['ארונות ואחסון', [['cabinet-low', 'ארון נמוך'], ['cabinet-tall', 'ארון גבוה'], ['cabinet-sliding', 'דלתות הזזה'], ['file-cabinet', 'ארון תיקיות'], ['credenza', 'שלוחת מנהל'], ['drawer-unit', 'מגירות ועגלה'], ['shelf-open', 'כוננית'], ['cubby', 'כוורת תאים']]],
  ['נגרות', [['counter', 'דלפק קבלה'], ['kitchenette', 'מטבחון']]]
];
const ALL = GROUPS.flatMap(g => g[1].map(p => p[0]));
const host = document.getElementById('mb3d');
if (host) {
  const q = new URLSearchParams(location.search).get('p');
  const id = ALL.includes(q) ? q : 'office-desk';
  const name = GROUPS.flatMap(g => g[1]).find(p => p[0] === id)[1];
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = ENGINE + 'mrcfg.min.css'; document.head.appendChild(css);
  host.innerHTML = `<nav class="mb3d-nav" aria-label="בחירת מוצר">${GROUPS.map(([g, ps]) => `<div class="mb3d-g"><span>${g}</span><div>${ps.map(([pid, he]) =>
    `<a href="?p=${pid}#mb3d"${pid === id ? ' aria-current="page"' : ''}>${he}</a>`).join('')}</div></div>`).join('')}</nav>
    <div id="mrcfg-mount" data-product="${id}" data-quote="/צור-קשר/"></div>
    <p class="mb3d-note">המידות, הגימורים והגוונים במסך להמחשה. אחרי שבניתם, שלחו לנו את התצורה ונחזור עם הצעת מחיר מדויקת.</p>`;
  import(ENGINE + 'mrcfg.min.js').catch(() => { const m = document.getElementById('mrcfg-mount'); if (m) m.textContent = 'לא ניתן לטעון את הקונפיגורטור כרגע.'; });
  document.title = name + ' – בונים בתלת־ממד | מודולרי';
}
