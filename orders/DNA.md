# Work orders to שני (Modulartech) – how Marhiv writes them

Learned from the Plando card of **שני** (contact 4399326, sales@modulartech.co.il): 1,800 documents, of which 1,750 are
work orders (2021–2026, ~11,000 lines). The card note says it plainly: *a work order to this contact replaces a purchase order*.

## The document
- Type **הזמנת עבודה** (Plando doc type 100) on the supplier's card. Customer documents never carry these lines.
- **Subject** = the customer / project name (e.g. a first name, a company), sometimes "– למול הזמנת עבודה NNNN" for a follow-up order,
  "הזמנת תיקון NNNN" for repairs.
- **Prices are almost always 0** (only ~75 of 1,800 orders carry prices). The supplier prices the order and sends it back for approval.
  The generator therefore writes price 0. Cost prices never go into the Plando catalog.
- **Rooms** are separated by a line of their own: `חדר 14-----------`, `ישיבות-----------`, `מטבח---------`.
- Drawings go by email; a line may say `לפי שירטוט` / `מצ״ב שירטוט`. Images on lines were rare (8 orders) – we add them now.

## Desks are split into parts – one line each
| part | pattern | example from past orders |
|---|---|---|
| top | `פלטה <thickness> <W>\<D> גוון <code> [קנט]` | `פלטה 24 160\80 גוון A488 PS37 מרינדה קנט מדוקק PVC תואם` |
| frame | `רגל <model> <colour> <W>\<D>`; riding a return: `רוכב 3 רגליים` | `רגל רוז לבנה 160\70`, `רגל בארי שחורה 180\70 רוכב 3 רגליים` |
| modesty panel | `סינר <W−10>\35 גוון <code>` | top 180 → `סינר 170\35`, top 200 → `סינר 190\35` |
| manager return | `שלוחה <side> H65\40\<L> <arrangement> גוף .. חזית .. ידיות ..` | `שלוחה לימין 160\40 דלתות\מגירות\תא פתוח ידיות לבנות - חזית שקועה` |
| attached return | `ארגז מגירות תומך שלוחה ..` + `פלטה 28 ממ לשלוחה 90/45` | `שלוחה 80\40 דלת + מגירות לבן , ידיות לבנות קסקט 90\45` |

Thickness words: `28 ממ` (most common), `17`, `24`, `2.8`. Edge: `קנט מדוקק PVC תואם`.
Frame models used: רוז, לוטוס, וונציה, בארי, לאטה, חלון, ח, ישרה, פיצה/מדורה (round tops), חשמלי. "כולל ניתוק" appears often on רוז/לוטוס.

## Cabinets – one line
`ארון H<height>\<depth>\<width> גוון <code> ידיות <type+colour> [צוקל] [חזית שקועה] [גב מלא] [מדפים 2.8]`
e.g. `ארון H90\40\80 דלת+ מגירות ידיות לבנות חזית לבן גוף 7019`, `ארון H210\40\80 גוון 5200 טלסקר שחור`.
Pedestals: `ארגז מגירות נייד` / `עגלת מגירות` / `ארגז מגירות תומך (שלוחה)`.

## Colours
Supplier decor numbers (Birman / Mazonit / "מקור"), most used: 7019, 3130, 5550, 7150, 3199 (שחור יער), 5200, 9007, 1480, 5733,
1416, 7906 (סטון/בטון), 2047, 161 (סופר מט מוקה), 3614, 3160 (אפור גרפיט), A924 PS70, A488 PS37 (מרינדה).
White/black are usually written as words (`לבן`, `שחור`). Handles: `ידיות שחורות` / `ידיות לבנות` / `טלסקר שחור|לבן` / `ניקל` / `פרופיל C`, `פתיחה בטאץ`.
The website's colour names → supplier codes live in `supplier-map.json`. Unknown codes print `[קוד גוון לאישור]` until filled in.

## Pipeline
1. `orders/examples/<order>.json` – items as configured on the site (product id + state changes + qty + room).
2. `node orders/make-order.cjs orders/examples/<order>.json` – lines (`order-lines.js`) + a render per product and a frame-only render.
3. Renders are published to the `site-assets` branch (`plando/<order>/`) so the Plando tab can fetch them.
4. In the logged-in Plando tab: `createPlandoDraft(order)` from `plando-draft.js` → a **draft** on שני's card. Marhiv reviews and presses "הפק".
