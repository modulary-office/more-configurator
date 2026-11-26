/* MODULARY / MORE – "בונים בתלת־ממד": one page, every configurator product.
   Loads the shared MORE configurator engine (pinned commit) and swaps products with ?p=<id>.
   #mb3d data attributes: data-quote (contact URL), data-brand (title suffix), data-prices="on" to show list prices. */
const ENGINE = 'https://cdn.jsdelivr.net/gh/modulary-office/more-configurator@7f9b9d832b521d339102b94c2a617879dec5c137/dist/';
const GROUPS = [
  ['שולחנות', [['office-desk', 'שולחן עבודה'], ['manager-desk', 'שולחן מנהל'], ['desk-frame', 'שלד לשולחן'], ['meeting-table', 'שולחן ישיבות']]],
  ['עמדות עבודה', [['bench-desk', 'עמדות משותפות'], ['duo-bench', 'Duo Bench עם מחיצות']]],
  ['מחיצות Open Space', [['partition-thin', 'מחיצה דקה'], ['partition-thick', 'מחיצה עבה'], ['partition-frameless', 'מחיצה פריימלס'], ['partition-mobile', 'מחיצה ניידת']]],
  ['ארונות ואחסון', [['cabinet-low', 'ארון נמוך'], ['cabinet-tall', 'ארון גבוה'], ['cabinet-sliding', 'דלתות הזזה'], ['file-cabinet', 'ארון תיקיות'], ['credenza', 'שלוחת מנהל'], ['drawer-unit', 'מגירות ועגלה'], ['shelf-open', 'כוננית'], ['cubby', 'כוורת תאים']]],
  ['קונסולות וספריות מתכת', [['metal-console', 'קונסולת מתכת'], ['metal-shelf', 'ספריית מתכת']]],
  ['נגרות', [['counter', 'דלפק קבלה'], ['kitchenette', 'מטבחון']]],
  ['ספות וישיבה', [['hofi', 'Hofi מערכת ישיבה'], ['agatha', 'Agatha'], ['austin', 'Austin'], ['boomer', 'Boomer'], ['break', 'Break'], ['bully', 'Bully'], ['daffy', 'Daffy'], ['dobby', 'Dobby'], ['domino', 'Domino'], ['douglas', 'Douglas'], ['ellipse', 'Ellipse'], ['elora-duo', 'Elora Duo'], ['forma', 'Forma'], ['harley', 'Harley'], ['honey', 'Honey'], ['humi', 'Humi'], ['joyce', 'Joyce'], ['juan', 'Juan'], ['julie', 'Julie'], ['lento', 'Lento'], ['lunaro', 'Lunaro'], ['onem-3-seater', 'Onem 3-Seater'], ['peanut', 'Peanut'], ['rivano', 'Rivano'], ['sorano', 'Sorano'], ['velora', 'Velora'], ['wolf', 'Wolf'], ['zorro', 'Zorro'], ['zoya', 'Zoya']]]
  ['הדומים', [['onem-d80', 'Onem Ø80'], ['onem-d120', 'Onem Ø120'], ['onem-80x80', 'Onem 80×80'], ['onem-60x160', 'Onem 60×160'], ['onem-80x160', 'Onem 80×160'], ['onem-oval-60x180', 'Onem Oval 60×180'], ['onem-oval-80x180', 'Onem Oval 80×180'], ['archie', 'Archie'], ['atlas', 'Atlas'], ['bubble', 'Bubble'], ['caramel', 'Caramel'], ['chapo', 'Chapo'], ['checkmate', 'Checkmate'], ['cloud', 'Cloud'], ['felix', 'Felix'], ['kobi', 'Kobi'], ['nubo', 'Nubo'], ['pablo', 'Pablo'], ['pepita', 'Pepita'], ['pico', 'Pico'], ['scooter', 'Scooter'], ['sputnik', 'Sputnik']]],
];
const host = document.getElementById('mb3d');
if (host) {
  /* on a category page only the groups that belong there are offered: data-groups="name,name", data-default="product id",
     data-title="off" keeps the page title, data-lazy loads the 3D engine only when the block comes near the screen */
  const want = (host.dataset.groups || '').split(',').map(x => x.trim()).filter(Boolean);
  if (want.length) { const keep = GROUPS.filter(g => want.includes(g[0])); if (keep.length) GROUPS.splice(0, GROUPS.length, ...keep); }
  const ALL = GROUPS.flatMap(g => g[1].map(p => p[0]));
  const QUOTE = host.dataset.quote || '/צור-קשר/', BRAND = host.dataset.brand || 'מודולרי';
  const q = new URLSearchParams(location.search).get('p');
  const id = ALL.includes(q) ? q : ALL.includes(host.dataset.default) ? host.dataset.default : ALL.includes('office-desk') ? 'office-desk' : ALL[0];
  const name = GROUPS.flatMap(g => g[1]).find(p => p[0] === id)[1];
  const svg = b => `<svg viewBox="0 0 48 48" fill="none" stroke="#1C1C1A" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${b}</svg>`;
  const ICONS = {
    'שולחנות': '<rect x="6" y="14" width="36" height="6" fill="#F8DC55"/><path d="M10 20v20M38 20v20"/>',
    'עמדות עבודה': '<rect x="21" y="8" width="6" height="18" fill="#F8DC55"/><path d="M4 22h40M8 22v18M40 22v18M24 26v14"/>',
    'מחיצות Open Space': '<rect x="8" y="10" width="14" height="26" fill="#F8DC55"/><rect x="8" y="10" width="32" height="26"/><path d="M22 10v26M12 36v4M36 36v4"/>',
    'ארונות ואחסון': '<rect x="8" y="8" width="32" height="32"/><rect x="8" y="8" width="16" height="16" fill="#F8DC55"/><path d="M24 8v32M8 24h32"/>',
    'קונסולות וספריות מתכת': '<rect x="10" y="20" width="28" height="4" fill="#F8DC55"/><path d="M10 6v36M38 6v36M10 8h28M10 34h28M24 8v12M18 24v10"/>',
    'נגרות': '<path d="M8 34l14-22 18 6-12 20z" fill="#F8DC55"/><path d="M22 12l6 26"/>',
    'הדומים': '<ellipse cx="24" cy="20" rx="15" ry="6" fill="#F8DC55"/><path d="M9 20v10c0 3.3 6.7 6 15 6s15-2.7 15-6V20"/><ellipse cx="24" cy="20" rx="15" ry="6"/>',
    'ספות וישיבה': '<rect x="10" y="22" width="28" height="8" fill="#F8DC55"/><path d="M12 22v-8h24v8M6 20h4v14H6zM38 20h4v14h-4zM10 34h28M11 34v5M37 34v5"/>'
  };
  const cur = GROUPS.findIndex(g => g[1].some(p => p[0] === id));
  host.innerHTML = `<nav class="mb3d-nav" aria-label="בחירת מוצר"><div class="mb3d-tabs" role="tablist" aria-label="קטגוריות">${GROUPS.map(([g, ps], i) =>
    `<button type="button" role="tab" id="mb3d-t${i}" aria-controls="mb3d-p${i}" aria-selected="${i === cur}" tabindex="${i === cur ? 0 : -1}">${svg(ICONS[g] || '')}<span>${g}</span><small>${ps.length}</small></button>`).join('')}</div>
    ${GROUPS.map(([g, ps], i) => `<div class="mb3d-g" role="tabpanel" id="mb3d-p${i}" aria-labelledby="mb3d-t${i}"${i === cur ? '' : ' hidden'}>${ps.map(([pid, he]) =>
    `<a href="?p=${pid}#mb3d"${pid === id ? ' aria-current="page"' : ''}>${he}</a>`).join('')}</div>`).join('')}</nav>
    <div id="mrcfg-mount" data-product="${id}" data-quote="${QUOTE}"></div>
    <p class="mb3d-note">המידות, הגימורים והגוונים במסך להמחשה. אחרי שבניתם, שלחו לנו את התצורה ונחזור עם הצעת מחיר מדויקת.</p>`;
  const tabs = [...host.querySelectorAll('.mb3d-tabs [role="tab"]')];
  const pick = (i, focus) => { tabs.forEach((t, j) => { const on = j === i; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; host.querySelector('#mb3d-p' + j).hidden = !on; }); if (focus) tabs[i].focus(); tabs[i].scrollIntoView({ block: 'nearest', inline: 'nearest' }); };
  tabs.forEach((t, i) => { t.addEventListener('click', () => pick(i));
    t.addEventListener('keydown', e => { const d = { ArrowLeft: 1, ArrowRight: -1 }[e.key]; if (d) { e.preventDefault(); pick((i + d + tabs.length) % tabs.length, true); } else if (e.key === 'Home') { e.preventDefault(); pick(0, true); } else if (e.key === 'End') { e.preventDefault(); pick(tabs.length - 1, true); } }); });
  { const tb = host.querySelector('.mb3d-tabs'), ct = tabs[cur]; if (ct) tb.scrollLeft = ct.offsetLeft - (tb.clientWidth - ct.offsetWidth) / 2; }
  const load = () => { const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = ENGINE + 'mrcfg.min.css'; document.head.appendChild(css);
    import(ENGINE + 'mrcfg.min.js').catch(() => { const m = document.getElementById('mrcfg-mount'); if (m) m.textContent = 'לא ניתן לטעון את הקונפיגורטור כרגע.'; }); };
  if (host.dataset.lazy && 'IntersectionObserver' in window && !q) { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); load(); } }, { rootMargin: '600px 0px' }); io.observe(host); }
  else load();
  if (host.dataset.title !== 'off') document.title = name + ' – בונים בתלת־ממד | ' + BRAND;
}
