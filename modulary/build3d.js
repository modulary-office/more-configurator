/* MODULARY / MORE – "בונים בתלת־ממד": one page, every configurator product.
   Loads the shared MORE configurator engine (pinned commit) and swaps products with ?p=<id>.
   #mb3d data attributes: data-quote (contact URL), data-brand (title suffix), data-prices="on" to show list prices. */
const ENGINE = 'https://cdn.jsdelivr.net/gh/modulary-office/more-configurator@7f863e762b3d63daa55b8d11cb6440a1e29ba98d/dist/';
const GROUPS = [
  ['שולחנות', [['office-desk', 'שולחן עבודה'], ['manager-desk', 'שולחן מנהל'], ['desk-frame', 'שלד לשולחן']]],
  ['עמדות עבודה', [['bench-desk', 'עמדות משותפות'], ['duo-bench', 'Duo Bench עם מחיצות']]],
  ['ארונות ואחסון', [['cabinet-low', 'ארון נמוך'], ['cabinet-tall', 'ארון גבוה'], ['cabinet-sliding', 'דלתות הזזה'], ['file-cabinet', 'ארון תיקיות'], ['credenza', 'שלוחת מנהל'], ['drawer-unit', 'מגירות ועגלה'], ['shelf-open', 'כוננית'], ['cubby', 'כוורת תאים']]],
  ['נגרות', [['counter', 'דלפק קבלה'], ['kitchenette', 'מטבחון']]],
  ['ספות וישיבה', [['hofi', 'Hofi מערכת ישיבה'], ['agatha', 'Agatha'], ['austin', 'Austin'], ['boomer', 'Boomer'], ['break', 'Break'], ['bully', 'Bully'], ['daffy', 'Daffy'], ['dobby', 'Dobby'], ['domino', 'Domino'], ['douglas', 'Douglas'], ['ellipse', 'Ellipse'], ['elora-duo', 'Elora Duo'], ['forma', 'Forma'], ['harley', 'Harley'], ['honey', 'Honey'], ['humi', 'Humi'], ['joyce', 'Joyce'], ['juan', 'Juan'], ['julie', 'Julie'], ['lento', 'Lento'], ['lunaro', 'Lunaro'], ['onem-3-seater', 'Onem 3-Seater'], ['peanut', 'Peanut'], ['rivano', 'Rivano'], ['sorano', 'Sorano'], ['velora', 'Velora'], ['wolf', 'Wolf'], ['zorro', 'Zorro'], ['zoya', 'Zoya']]]
];
const ALL = GROUPS.flatMap(g => g[1].map(p => p[0]));
const host = document.getElementById('mb3d');
if (host) {
  const QUOTE = host.dataset.quote || '/צור-קשר/', BRAND = host.dataset.brand || 'מודולרי';
  const q = new URLSearchParams(location.search).get('p');
  const id = ALL.includes(q) ? q : 'office-desk';
  const name = GROUPS.flatMap(g => g[1]).find(p => p[0] === id)[1];
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = ENGINE + 'mrcfg.min.css'; document.head.appendChild(css);
  host.innerHTML = `<nav class="mb3d-nav" aria-label="בחירת מוצר">${GROUPS.map(([g, ps]) => `<div class="mb3d-g"><span>${g}</span><div>${ps.map(([pid, he]) =>
    `<a href="?p=${pid}#mb3d"${pid === id ? ' aria-current="page"' : ''}>${he}</a>`).join('')}</div></div>`).join('')}</nav>
    <div id="mrcfg-mount" data-product="${id}" data-quote="${QUOTE}"></div>
    <p class="mb3d-note">המידות, הגימורים והגוונים במסך להמחשה. אחרי שבניתם, שלחו לנו את התצורה ונחזור עם הצעת מחיר מדויקת.</p>`;
  import(ENGINE + 'mrcfg.min.js').catch(() => { const m = document.getElementById('mrcfg-mount'); if (m) m.textContent = 'לא ניתן לטעון את הקונפיגורטור כרגע.'; });
  document.title = name + ' – בונים בתלת־ממד | ' + BRAND;
}
