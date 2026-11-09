# MORE Configurator – Duo Bench

קונפיגורטור תלת־ממד לעמדת העבודה המשותפת **Duo Bench** של MORE by MODULARY.
הלקוח בוחר מידות, דקור משטח, צבע RAL לרגליים, פרזול, מחיצה ובד, ורואה את התוצאה בזמן אמת.

## מבנה התיקייה

| נתיב | מה יש בו |
|---|---|
| `src/duo-bench.js` | קוד המקור (קריא, לעריכה) |
| `src/duo-bench.css` | העיצוב |
| `dist/*.min.*` | הגרסה המכווצת – זה מה שהאתר טוען |
| `examples/index.html` | דף דמו עצמאי |
| `examples/embed-snippet.html` | הקוד להדבקה בדף מוצר |

## הטמעה באתר

1. ב-GitHub: **Releases → Create a new release**, תגית `v1.0.0`.
2. בדף המוצר מדביקים את `examples/embed-snippet.html` (מחליפים `USER` בשם החשבון).
3. jsDelivr מגיש את הקבצים אוטומטית מהמאגר. **המאגר חייב להיות ציבורי** כדי ש-jsDelivr יוכל להגיש אותו.

### הגדרות על האלמנט

```html
<div id="mrcfg-mount" data-name="Duo Bench" data-quote="/contact/"></div>
```

- `data-name` – שם המוצר שמופיע בכותרת, בסיכום ובבקשת ההצעה.
- `data-quote` – כתובת דף יצירת הקשר. הסיכום נשלח אליה כפרמטר `subject`.

אם בדף יש `div.product` של WooCommerce, הקונפיגורטור נכנס מעליו. אחרת הוא נכנס לתוך האלמנט.

## פיתוח

```bash
npm install
npm run build      # בונה את dist מתוך src
npm run dev        # שרת מקומי: http://localhost:8080/examples/
```

אחרי כל שינוי: `npm run build`, commit, release חדש (`v1.0.1`…), ועדכון מספר הגרסה בקוד ההטמעה.
כך שינוי חדש לא משפיע על אתר עד שמעדכנים בו את מספר הגרסה.

## תלויות

- three.js 0.160.0, נטען מ-jsDelivr בתוך הקוד. אין צורך להתקין.
- הטקסטורות (עץ, אבן, שיש, בד) נוצרות בקוד, בלי קבצי תמונה.

## קישור שיתוף

התצורה נשמרת ב-hash של הכתובת (`#cfg=…`), כך שאפשר לשלוח ללקוח או לאדריכלית קישור לתצורה מדויקת.

---
© MORE by MODULARY. כל הזכויות שמורות.
