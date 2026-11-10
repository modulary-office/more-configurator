# Generates products/*.json for the cabinet family from the Modulartech price list (prices before VAT).
import json, os
OUT = 'products'

PRICING = lambda rules: {
    "_help": "סכומים לפי מחירון הספק, לפני מע״מ. markup = אחוז רווח על המחירון, vat = מע״מ. ראו README.",
    "source": "מחירון Modulartech (ריהוט משרדי), עמודים 22–49",
    "currency": "₪", "label": "מחיר", "note": "כולל מע״מ, לא כולל הובלה והרכבה",
    "markup": 100, "vat": 18, "roundTo": 10, "customQuote": True,
    "rules": rules}

def seg(key, label, opts, num=False, custom=None, layout=None, optionsBy=None, showWhen=None):
    c = {"type": "seg", "key": key, "label": label}
    if num: c["num"] = True
    if optionsBy: c["optionsBy"] = optionsBy
    else: c["options"] = [o if isinstance(o, dict) else {"v": o} for o in opts]
    if custom: c["custom"] = {"label": "אחר", "step": 1, "unit": "ס״מ", **custom}
    if layout: c["layout"] = layout
    if showWhen: c["showWhen"] = showWhen
    return c
def sw(key, label, catalog="decors", style="decor", showWhen=None):
    c = {"type": "swatch", "key": key, "label": label, "catalog": catalog, "style": style, "out": "RAL {id} · {he}" if catalog == "ral" else "{he}"}
    if showWhen: c["showWhen"] = showWhen
    return c
def tog(key, title, sub="", showWhen=None):
    c = {"type": "toggle", "key": key, "title": title, "sub": sub}
    if showWhen: c["showWhen"] = showWhen
    return c
def step(key, label, mn, mx):
    return {"type": "stepper", "key": key, "label": label, "min": mn, "max": mx}
O = lambda v, l: {"v": v, "label": l}

DEPTH_TIERS = {"type": "tiers", "label": "תוספת עומק", "by": "d", "tiers": [{"upTo": 40, "percent": 0}, {"upTo": 50, "percent": 25}, {"upTo": 60, "percent": 35}]}
FINISH = {"id": "finish", "title": "גימור", "controls": [sw("body", "גוף"), sw("face", "חזיתות")]}
HANDLES = seg("handle", "ידיות", [O("bar", "ידית מוט"), O("integral", "פרופיל אינטגרלי"), O("none", "ללא (לחיצה)")])
DEF_DEC = {"body": "white", "face": "oak"}
NOTE = "הגוונים במסך להמחשה. נשמח לשלוח דוגמאות פיזיות של הגימורים."

products = {}

# 1. tall cabinet ------------------------------------------------------------
products["cabinet-tall"] = {
    "id": "cabinet-tall", "name": "ארון גבוה", "family": "cabinet", "codePrefix": "MCT",
    "subtitle": "ארון משרדי גבוה בגוף ודלתות מלמין 17 מ״מ. מידות סטנדרט או לפי מידה.", "note": NOTE,
    "model": {"kind": "cabinet", "fronts": {"doors2": {"t": "doors"}, "doors4": {"t": "doors", "rows": 2, "split": .5}}},
    "defaults": {"w": 80, "h": 210, "d": 40, "front": "doors2", **DEF_DEC, "handle": "bar", "base": "none", "lock": False, "back": False, "side28": False, "shelves": 0},
    "sections": [
        {"id": "size", "title": "מידות", "controls": [
            seg("w", "רוחב", [80], True, {"min": 40, "max": 160, "inputLabel": "רוחב בס״מ"}),
            seg("h", "גובה", [130, 160, 210, 240], True, {"min": 100, "max": 260, "inputLabel": "גובה בס״מ"}),
            seg("d", "עומק", [40, 50, 60], True, {"min": 30, "max": 60, "inputLabel": "עומק בס״מ"})]},
        {"id": "fronts", "title": "חזיתות", "controls": [
            seg("front", "דלתות", [O("doors2", "2 דלתות לכל הגובה"), O("doors4", "4 דלתות")]), HANDLES]},
        FINISH,
        {"id": "extra", "title": "תוספות", "controls": [
            seg("base", "בסיס", [O("none", "ללא"), O("plinth", "צוקל")]),
            step("shelves", "מדפים נוספים", 0, 6),
            tog("lock", "מנעול", "לכל זוג דלתות"), tog("back", "גב מלא"), tog("side28", "דפנות 28 מ״מ", "דופן עבה במקום 17 מ״מ")]}],
    "pricing": PRICING([
        {"type": "table", "label": "ארון לפי מידה", "dims": ["w", "h"], "rows": [
            {"w": 80, "h": 130, "price": 500}, {"w": 80, "h": 160, "price": 610}, {"w": 80, "h": 210, "price": 670}, {"w": 80, "h": 240, "price": 770}]},
        {"type": "option", "label": "4 דלתות", "key": "front", "amounts": {"doors2": 0, "doors4": 10}},
        DEPTH_TIERS,
        {"type": "unit", "label": "מנעול", "per": "doorPairs", "amount": 25, "when": {"lock": True}},
        {"type": "unit", "label": "גב מלא", "per": "per80", "amount": 120, "when": {"back": True}},
        {"type": "fixed", "label": "דפנות 28 מ״מ", "amount": 200, "when": {"side28": True}},
        {"type": "unit", "label": "מדפים נוספים", "per": "shelves", "amount": 30},
        {"type": "unit", "label": "צוקל", "per": "per80", "amount": 30, "when": {"base": "plinth"}}])}

# 2. low cabinet ------------------------------------------------------------
products["cabinet-low"] = {
    "id": "cabinet-low", "name": "ארון נמוך", "family": "cabinet", "codePrefix": "MCL",
    "subtitle": "ארון נמוך בגוף ודלתות מלמין 17 מ״מ, כולל קסקט. מידות סטנדרט או לפי מידה.", "note": NOTE,
    "model": {"kind": "cabinet", "fronts": {"doors": {"t": "doors"}, "doorsDrawers": {"t": "cols", "cols": [{"k": "doors", "w": 2}, {"k": "drawers", "n": 3, "w": 1}, {"k": "doors", "w": 2}]}}},
    "defaults": {"w": 160, "h": 90, "d": 40, "front": "doors", **DEF_DEC, "handle": "bar", "base": "none", "lock": False, "back": False, "side28": False, "shelves": 0},
    "sections": [
        {"id": "size", "title": "מידות", "controls": [
            seg("w", "רוחב", [80, 120, 160, 200, 240], True, {"min": 40, "max": 300, "inputLabel": "רוחב בס״מ"}),
            seg("h", "גובה", [90], True, {"min": 60, "max": 120, "inputLabel": "גובה בס״מ"}),
            seg("d", "עומק", [40, 50, 60], True, {"min": 30, "max": 60, "inputLabel": "עומק בס״מ"})]},
        {"id": "fronts", "title": "חזיתות", "controls": [
            seg("front", "סוג", [O("doors", "דלתות"), O("doorsDrawers", "דלתות + מגירות")]), HANDLES]},
        FINISH,
        {"id": "extra", "title": "תוספות", "controls": [
            seg("base", "בסיס", [O("none", "ללא"), O("plinth", "צוקל")]),
            step("shelves", "מדפים נוספים", 0, 4),
            tog("lock", "מנעול", "לכל זוג דלתות"), tog("back", "גב מלא"), tog("side28", "דפנות 28 מ״מ")]}],
    "pricing": PRICING([
        {"type": "table", "label": "ארון לפי מידה", "dims": ["w", "h"], "rows": [
            {"w": 80, "h": 90, "price": 430, "when": {"front": "doors"}}, {"w": 120, "h": 90, "price": 700, "when": {"front": "doors"}},
            {"w": 160, "h": 90, "price": 860, "when": {"front": "doors"}}, {"w": 200, "h": 90, "price": 1130, "when": {"front": "doors"}},
            {"w": 240, "h": 90, "price": 1500, "when": {"front": "doorsDrawers"}}]},
        DEPTH_TIERS,
        {"type": "unit", "label": "מנעול", "per": "doorPairs", "amount": 25, "when": {"lock": True}},
        {"type": "unit", "label": "גב מלא", "per": "per80", "amount": 60, "when": {"back": True}},
        {"type": "fixed", "label": "דפנות 28 מ״מ", "amount": 100, "when": {"side28": True}},
        {"type": "unit", "label": "מדפים נוספים", "per": "shelves", "amount": 30},
        {"type": "unit", "label": "צוקל", "per": "per80", "amount": 30, "when": {"base": "plinth"}}])}

# 3. sliding ------------------------------------------------------------------
products["cabinet-sliding"] = {
    "id": "cabinet-sliding", "name": "ארון דלתות הזזה", "family": "cabinet", "codePrefix": "MCS",
    "subtitle": "ארון עם דלתות הזזה על מסילות. מעל 160 ס״מ גובה – 4 דלתות בשתי קומות.", "note": NOTE,
    "model": {"kind": "cabinet", "front": {"t": "sliding", "rows": "auto"}},
    "defaults": {"w": 120, "h": 90, "d": 40, **DEF_DEC, "base": "none", "rails": "plastic", "lock": False, "back": False},
    "sections": [
        {"id": "size", "title": "מידות", "controls": [
            seg("w", "רוחב", [120], True, {"min": 80, "max": 240, "inputLabel": "רוחב בס״מ"}),
            seg("h", "גובה", [90, 130, 210, 240], True, {"min": 70, "max": 260, "inputLabel": "גובה בס״מ"}),
            seg("d", "עומק", [40, 50, 60], True, {"min": 30, "max": 60, "inputLabel": "עומק בס״מ"})]},
        {"id": "fronts", "title": "מסילות", "controls": [
            seg("rails", "סוג מסילה", [O("plastic", "פלסטיק"), O("alu", "אלומיניום")])]},
        FINISH,
        {"id": "extra", "title": "תוספות", "controls": [
            seg("base", "בסיס", [O("none", "ללא"), O("plinth", "צוקל")]),
            tog("lock", "מנעול לחיצה", "לכל דלת"), tog("back", "גב מלא")]}],
    "pricing": PRICING([
        {"type": "table", "label": "ארון לפי מידה", "dims": ["w", "h"], "rows": [
            {"w": 120, "h": 90, "price": 550}, {"w": 120, "h": 130, "price": 680}, {"w": 120, "h": 210, "price": 1050}, {"w": 120, "h": 240, "price": 1180}]},
        DEPTH_TIERS,
        {"type": "unit", "label": "מנעול לחיצה", "per": "slideDoors", "amount": 25, "when": {"lock": True}},
        {"type": "unit", "label": "גב מלא", "per": "per120", "amount": 90, "when": {"back": True}},
        {"type": "unit", "label": "צוקל", "per": "per120", "amount": 55, "when": {"base": "plinth"}},
        {"type": "option", "label": "מסילות אלומיניום", "key": "rails", "amounts": {"plastic": 0, "alu": 120}}])}

# 4. open shelving ----------------------------------------------------------
products["shelf-open"] = {
    "id": "shelf-open", "name": "כוננית", "family": "cabinet", "codePrefix": "MCB",
    "subtitle": "כוננית מדפים פתוחה, עם או בלי דלתות תחתונות ודלתות זכוכית.", "note": NOTE,
    "model": {"kind": "cabinet", "fronts": {"open": {"t": "open"}, "openDoors": {"t": "openDoors", "doorH": 80}}},
    "defaults": {"w": 80, "h": 210, "d": 40, "front": "openDoors", **DEF_DEC, "handle": "bar", "glass": "none", "base": "none", "lock": False, "back": False, "side28": False, "shelves": 0},
    "sections": [
        {"id": "size", "title": "מידות", "controls": [
            seg("w", "רוחב", [80], True, {"min": 40, "max": 160, "inputLabel": "רוחב בס״מ"}),
            seg("h", "גובה", [210, 240], True, {"min": 80, "max": 260, "inputLabel": "גובה בס״מ"}),
            seg("d", "עומק", [30, 40], True, {"min": 25, "max": 60, "inputLabel": "עומק בס״מ"})]},
        {"id": "fronts", "title": "חזיתות", "controls": [
            seg("front", "סוג", [O("open", "מדפים פתוחים"), O("openDoors", "פתוחה + דלתות תחתונות")]),
            seg("glass", "דלתות זכוכית (גובה 120)", [O("none", "ללא"), O("clear", "זכוכית"), O("tempered", "מחוסמת")], showWhen={"front": "openDoors"}),
            {**HANDLES, "showWhen": {"front": "openDoors"}}]},
        FINISH,
        {"id": "extra", "title": "תוספות", "controls": [
            seg("base", "בסיס", [O("none", "ללא"), O("plinth", "צוקל")]),
            step("shelves", "מדפים נוספים", 0, 6),
            tog("lock", "מנעול", "לכל זוג דלתות", showWhen={"front": "openDoors"}), tog("back", "גב מלא"), tog("side28", "דפנות 28 מ״מ")]}],
    "pricing": PRICING([
        {"type": "table", "label": "כוננית לפי מידה", "dims": ["w", "d", "h"], "clamp": {"d": [30, 40]}, "rows":
            [{"w": 80, "d": d, "h": h, "price": p, "when": {"front": "open"}} for d, h, p in [(30, 210, 360), (30, 240, 440), (40, 210, 440), (40, 240, 510)]] +
            [{"w": 80, "d": d, "h": h, "price": p, "when": {"front": "openDoors"}} for d, h, p in [(30, 210, 480), (30, 240, 560), (40, 210, 560), (40, 240, 640)]]},
        DEPTH_TIERS,
        {"type": "option", "label": "דלתות זכוכית", "key": "glass", "per": "per80", "amounts": {"none": 0, "clear": 300, "tempered": 400}, "when": {"front": "openDoors"}},
        {"type": "unit", "label": "מנעול", "per": "doorPairs", "amount": 25, "when": {"lock": True, "front": "openDoors"}},
        {"type": "unit", "label": "גב מלא", "per": "per80", "amount": 120, "when": {"back": True}},
        {"type": "fixed", "label": "דפנות 28 מ״מ", "amount": 200, "when": {"side28": True}},
        {"type": "unit", "label": "מדפים נוספים", "per": "shelves", "amount": 25},
        {"type": "unit", "label": "צוקל", "per": "per80", "amount": 30, "when": {"base": "plinth"}}])}

# 5. cubby --------------------------------------------------------------------
products["cubby"] = {
    "id": "cubby", "name": "כוורת תאים", "family": "cabinet", "codePrefix": "MCC",
    "subtitle": "כוורת תאים פתוחה ממלמין, בעובי 17 או 28 מ״מ. אפשר להוסיף מגירות נשלפות בתאים.", "note": NOTE,
    "model": {"kind": "cabinet", "front": {"t": "cubes"}},
    "defaults": {"w": 120, "h": 80, "d": 40, "thick": 17, **DEF_DEC, "body": "oak", "face": "white", "handle": "integral", "base": "none", "drawers": 0},
    "sections": [
        {"id": "size", "title": "מידות", "controls": [
            seg("w", "רוחב", [120, 210], True, {"min": 80, "max": 300, "inputLabel": "רוחב בס״מ"}),
            seg("h", "גובה", [80, 120], True, {"min": 40, "max": 200, "inputLabel": "גובה בס״מ"}),
            seg("d", "עומק", [40], True, {"min": 30, "max": 60, "inputLabel": "עומק בס״מ"}),
            seg("thick", "עובי מלמין", [O(17, "17 מ״מ"), O(28, "28 מ״מ")], True)]},
        {"id": "fronts", "title": "מגירות", "controls": [step("drawers", "מגירות נשלפות", 0, 8), {**HANDLES, "label": "ידיות למגירות"}]},
        {"id": "finish", "title": "גימור", "controls": [sw("body", "גוף"), sw("face", "חזיתות מגירה")]},
        {"id": "extra", "title": "בסיס", "controls": [seg("base", "בסיס", [O("none", "ללא"), O("plinth", "צוקל"), O("legs", "רגלי אלומיניום")])]}],
    "pricing": PRICING([
        {"type": "table", "label": "כוורת לפי מידה", "dims": ["w", "h"], "rows":
            [{"w": w, "h": h, "price": p, "when": {"thick": 17}} for w, h, p in [(120, 80, 420), (210, 80, 700), (210, 120, 1050)]] +
            [{"w": w, "h": h, "price": p, "when": {"thick": 28}} for w, h, p in [(120, 80, 480), (210, 80, 800), (210, 120, 1200)]]},
        DEPTH_TIERS,
        {"type": "unit", "label": "מגירות נשלפות", "per": "drawers", "amount": 150},
        {"type": "unit", "label": "צוקל", "per": "per80", "amount": 35, "when": {"base": "plinth"}},
        {"type": "fixed", "label": "רגלי אלומיניום", "amount": 100, "when": {"base": "legs"}}])}

# 6. drawer units / carts -------------------------------------------------
products["drawer-unit"] = {
    "id": "drawer-unit", "name": "יחידת מגירות ועגלה", "family": "cabinet", "codePrefix": "MCP",
    "subtitle": "ארגז מגירות נייד על גלגלים או תומך שלוחה.", "note": NOTE,
    "model": {"kind": "cabinet", "fronts": {"mob4": {"t": "drawers", "n": 4, "pencil": True}, "mob5": {"t": "drawers", "n": 5, "pencil": True},
                                            "support": {"t": "drawers", "n": 3}, "door": {"t": "door"}, "drawerDoor": {"t": "drawerDoor"}}},
    "defaults": {"front": "mob4", "w": 42, "d": 55, "h": 60, **DEF_DEC, "body": "white", "face": "white", "handle": "bar", "base": "wheels", "softclose": False},
    "sections": [
        {"id": "fronts", "title": "סוג יחידה", "controls": [
            seg("front", "סוג", [O("mob4", "4 מגירות נייד + קסקט"), O("mob5", "5 מגירות נייד + קסקט"), O("support", "ארגז מגירות תומך שלוחה, גב מלא"), O("door", "ארגז דלת נייד"), O("drawerDoor", "מגירה + דלת, נייד או תומך")], layout="list"),
            HANDLES]},
        {"id": "size", "title": "מידות", "controls": [
            seg("w", "רוחב", [42], True, {"min": 30, "max": 60, "inputLabel": "רוחב בס״מ"}),
            seg("h", "גובה", None, True, {"min": 40, "max": 80, "inputLabel": "גובה בס״מ"}, optionsBy={"key": "front", "map": {"mob4": [60], "mob5": [60], "support": [72], "door": [60], "drawerDoor": [60]}}),
            seg("d", "עומק", [55], True, {"min": 40, "max": 70, "inputLabel": "עומק בס״מ"})]},
        FINISH,
        {"id": "extra", "title": "תוספות", "controls": [
            seg("base", "בסיס", [O("wheels", "גלגלים"), O("none", "עומד")]),
            tog("softclose", "טריקה שקטה", "לכל מגירה")]}],
    "pricing": PRICING([
        {"type": "table", "label": "יחידה לפי מידה", "dims": ["w", "h"], "rows": [
            {"w": 42, "h": 60, "price": 340, "when": {"front": "mob4"}}, {"w": 42, "h": 60, "price": 400, "when": {"front": "mob5"}},
            {"w": 42, "h": 72, "price": 350, "when": {"front": "support"}}, {"w": 42, "h": 60, "price": 300, "when": {"front": "door"}},
            {"w": 42, "h": 60, "price": 320, "when": {"front": "drawerDoor"}}]},
        {"type": "fixed", "label": "גלגלי גומי + מעצור", "amount": 70, "when": {"base": "wheels", "front": "support"}},
        {"type": "unit", "label": "טריקה שקטה", "per": "drawers", "amount": 100, "when": {"softclose": True}},
        {"type": "unit", "label": "ידית אינטגרלית", "per": "drawers", "amount": 80, "when": {"handle": "integral"}}])}

# 7. file cabinet -------------------------------------------------------------
products["file-cabinet"] = {
    "id": "file-cabinet", "name": "ארון תיקיות", "family": "cabinet", "codePrefix": "MCF",
    "subtitle": "ארון תיקיות תלויות סופר פייל, כולל מסילות. 2, 3 או 4 קומות.", "note": NOTE,
    "model": {"kind": "cabinet", "front": {"t": "files"}},
    "defaults": {"w": 50, "d": 45, "h": 110, **DEF_DEC, "body": "lgrey", "face": "lgrey", "handle": "bar", "base": "none", "dtc": False, "lock": False, "back": False},
    "sections": [
        {"id": "size", "title": "מידות", "controls": [
            seg("h", "גובה", [O(77, "77 · 2 קומות"), O(110, "110 · 3 קומות"), O(145, "145 · 4 קומות")], True, {"min": 60, "max": 180, "inputLabel": "גובה בס״מ"}),
            seg("w", "רוחב", [50], True, {"min": 40, "max": 80, "inputLabel": "רוחב בס״מ"}),
            seg("d", "עומק", [45], True, {"min": 40, "max": 60, "inputLabel": "עומק בס״מ"})]},
        {"id": "fronts", "title": "מגירות", "controls": [HANDLES]},
        FINISH,
        {"id": "extra", "title": "תוספות", "controls": [
            seg("base", "בסיס", [O("none", "ללא"), O("plinth", "צוקל")]),
            tog("dtc", "מסילות שליפה כפולה DTC", "לכל מגירה"), tog("lock", "נעילה", "לכל מגירה"), tog("back", "גב מלמין")]}],
    "pricing": PRICING([
        {"type": "table", "label": "ארון לפי מידה", "dims": ["w", "h"], "rows": [
            {"w": 50, "h": 77, "price": 440}, {"w": 50, "h": 110, "price": 555}, {"w": 50, "h": 145, "price": 700}]},
        {"type": "unit", "label": "מסילות DTC", "per": "drawers", "amount": 100, "when": {"dtc": True}},
        {"type": "unit", "label": "נעילה", "per": "drawers", "amount": 25, "when": {"lock": True}},
        {"type": "fixed", "label": "גב מלמין", "amount": 90, "when": {"back": True}},
        {"type": "fixed", "label": "צוקל", "amount": 30, "when": {"base": "plinth"}}])}

# 8. credenza / sideboard ---------------------------------------------------
CRED = {
    "doorDrawers80": ("דלת + מגירות", 80, 650, [{"k": "door", "w": 1}, {"k": "drawers", "n": 3, "w": 1}]),
    "doorsDrawers": ("דלתות פתיחה + מגירות", 120, 750, [{"k": "doors", "w": 2}, {"k": "drawers", "n": 3, "w": 1}]),
    "slideDrawers": ("דלתות הזזה + מגירות", 120, 750, [{"k": "slide", "w": 2}, {"k": "drawers", "n": 3, "w": 1}]),
    "cpu": ("מגירות + תא למחשב", 120, 700, [{"k": "drawers", "n": 3, "w": 1}, {"k": "door", "w": 1}, {"k": "cpu", "w": 1}]),
    "drawersOpen": ("מגירות + תאים פתוחים בקצה", 180, 1200, [{"k": "drawers", "n": 3, "w": 1}, {"k": "drawers", "n": 3, "w": 1}, {"k": "open", "n": 2, "w": 1}]),
    "full": ("מגירות + דלת + 2 תאים + כוורת", 220, 1500, [{"k": "drawers", "n": 3, "w": 1}, {"k": "door", "w": 1}, {"k": "open", "n": 2, "w": 1}, {"k": "cubby", "n": 2, "w": .8}]),
}
products["credenza"] = {
    "id": "credenza", "name": "שלוחת מנהל", "family": "cabinet", "codePrefix": "MCR",
    "subtitle": "שלוחה בגובה 65 ס״מ עם גב מלא, בשילוב מגירות, דלתות ותאים פתוחים.", "note": NOTE,
    "model": {"kind": "cabinet", "fronts": {k: {"t": "cols", "cols": v[3]} for k, v in CRED.items()}},
    "defaults": {"front": "doorsDrawers", "w": 120, "h": 65, "d": 40, **DEF_DEC, "body": "graphite", "face": "oak", "handle": "bar", "base": "none", "back": True, "softclose": False},
    "sections": [
        {"id": "fronts", "title": "תצורה", "controls": [seg("front", "סוג", [O(k, f"{v[0]} · {v[1]} ס״מ") for k, v in CRED.items()], layout="list"), HANDLES]},
        {"id": "size", "title": "מידות", "controls": [
            seg("w", "רוחב", None, True, {"min": 60, "max": 260, "inputLabel": "רוחב בס״מ"}, optionsBy={"key": "front", "map": {k: [v[1]] for k, v in CRED.items()}}),
            seg("d", "עומק", [40], True)]},
        FINISH,
        {"id": "extra", "title": "תוספות", "controls": [
            seg("base", "בסיס", [O("none", "ללא"), O("plinth", "צוקל"), O("legs", "רגלי אלומיניום"), O("wheels", "גלגלים")]),
            tog("softclose", "טריקה שקטה DTC", "לכל מגירה")]}],
    "pricing": PRICING([
        {"type": "table", "label": "שלוחה לפי מידה", "dims": ["w"], "rows": [{"w": v[1], "price": v[2], "when": {"front": k}} for k, v in CRED.items()]},
        {"type": "unit", "label": "טריקה שקטה", "per": "drawers", "amount": 100, "when": {"softclose": True}},
        {"type": "fixed", "label": "ידיות אינטגרליות", "amount": 80, "when": {"handle": "integral"}},
        {"type": "fixed", "label": "צוקל", "amount": 55, "when": {"base": "plinth"}},
        {"type": "fixed", "label": "רגלי אלומיניום", "amount": 100, "when": {"base": "legs"}},
        {"type": "fixed", "label": "גלגלים", "amount": 100, "when": {"base": "wheels"}}])}

# 9. reception counter -----------------------------------------------------
products["counter"] = {
    "id": "counter", "name": "דלפק קבלה", "family": "cabinet", "codePrefix": "MCK",
    "subtitle": "דלפק קבלה עם רוכב, ישר או פינתי, עם פסי קישוט לבחירה. גובה 117 ס״מ.", "note": NOTE,
    "model": {"kind": "counter", "h": 117, "d": 80, "variantKey": "style", "hotspots": [["size", "מידות"], ["finish", "גימור"]]},
    "defaults": {"style": "plain", "w": 180, "w2": 120, "body": "white", "face": "oak"},
    "sections": [
        {"id": "fronts", "title": "דגם", "controls": [seg("style", "סוג", [O("plain", "דלפק + רוכב, מלמין 28 מ״מ"), O("alu", "פסי קישוט אלומיניום – ישר"), O("alucorner", "פסי קישוט אלומיניום – פינתי"), O("strips", "פסי קישוט מלמין")], layout="list")]},
        {"id": "size", "title": "מידות", "controls": [
            seg("w", "אורך", None, True, {"min": 100, "max": 500, "inputLabel": "אורך בס״מ"}, optionsBy={"key": "style", "map": {"plain": [120, 180, 240, 300, 480], "alu": [160, 240], "alucorner": [180, 240], "strips": [240, 300, 480]}}),
            seg("w2", "אורך כנף פינתית", [120], True, {"min": 80, "max": 240, "inputLabel": "כנף בס״מ"}, showWhen={"style": "alucorner"})]},
        {"id": "finish", "title": "גימור", "controls": [sw("body", "חזית ודפנות"), sw("face", "משטח ורוכב")]}],
    "pricing": PRICING([
        {"type": "table", "label": "דלפק + רוכב", "dims": ["w"], "rows": [{"w": w, "price": p, "when": {"style": "plain"}} for w, p in [(120, 1250), (180, 2100), (240, 2200), (300, 3450), (480, 3880)]]},
        {"type": "table", "label": "פסי קישוט אלומיניום", "dims": ["w"], "rows": [{"w": w, "price": p, "when": {"style": "alu"}} for w, p in [(160, 1800), (240, 2100)]]},
        {"type": "table", "label": "פינתי אלומיניום", "dims": ["run"], "rows": [{"run": r, "price": p, "when": {"style": "alucorner"}} for r, p in [(300, 2880), (360, 3300)]]},
        {"type": "table", "label": "פסי קישוט מלמין", "dims": ["w"], "rows": [{"w": w, "price": p, "when": {"style": "strips"}} for w, p in [(240, 3750), (300, 4680), (480, 7500)]]}])}

# 10. kitchenette ---------------------------------------------------------------
products["kitchenette"] = {
    "id": "kitchenette", "name": "מטבחון", "family": "cabinet", "codePrefix": "MCM",
    "subtitle": "מטבחון משרדי לפי מטר רץ: ארונות תחתונים עם משטח, ואפשרות לארונות עליונים עם קלפה.", "note": NOTE,
    "model": {"kind": "kitchen", "h": 90, "d": 60, "variantKey": "finish", "hero": {"th": .5, "ph": 1.25}},
    "defaults": {"w": 240, "finish": "formica", "body": "concrete", "face": "sage", "ral": "9016", "handle": "bar", "upper": True, "flap": "dtc", "base": "plinth", "dtc": False, "softclose": False},
    "sections": [
        {"id": "size", "title": "אורך", "controls": [seg("w", "אורך", [120, 180, 240, 300], True, {"min": 80, "max": 400, "inputLabel": "אורך בס״מ"})]},
        {"id": "fronts", "title": "חזיתות", "controls": [
            seg("finish", "גימור חזיתות", [O("formica", "סנדוויץ׳ + פורמיקה"), O("epoxy", "צבע אפוקסי + ידיות אינטגרליות")], layout="list"),
            {**HANDLES, "showWhen": {"finish": "formica"}}]},
        {"id": "finish", "title": "צבעים", "controls": [
            sw("body", "משטח וגוף"), sw("face", "חזיתות", showWhen={"finish": "formica"}), sw("ral", "צבע חזיתות לפי RAL", "ral", "ral", showWhen={"finish": "epoxy"})]},
        {"id": "extra", "title": "תוספות", "controls": [
            tog("upper", "ארונות עליונים", "קלפה עם מנגנון הרמה DTC"),
            seg("flap", "מנגנון קלפה", [O("dtc", "DTC"), O("hk", "DTC HK"), O("micro", "מיקרו")], showWhen={"upper": True}),
            seg("base", "בסיס", [O("plinth", "4 רגליים + צוקל"), O("none", "ללא")]),
            tog("dtc", "מגירות שליפה כפולה DTC", "לכל מגירה"), tog("softclose", "טריקה שקטה למגירות", "דפנות מתכת DTC")]}],
    "pricing": PRICING([
        {"type": "unit", "label": "תחתון סנדוויץ׳ + פורמיקה למטר", "per": "lengthM", "amount": 900, "when": {"finish": "formica"}},
        {"type": "unit", "label": "תחתון צבע אפוקסי למטר", "per": "lengthM", "amount": 1500, "when": {"finish": "epoxy"}},
        {"type": "unit", "label": "עליון קלפה DTC למטר", "per": "lengthM", "amount": 900, "when": {"upper": True}},
        {"type": "option", "label": "מתקן קלפה", "key": "flap", "per": "upperUnits", "amounts": {"dtc": 0, "hk": 220, "micro": 250}, "when": {"upper": True}},
        {"type": "unit", "label": "רגליים וצוקל למטר", "per": "lengthM", "amount": 75, "when": {"base": "plinth"}},
        {"type": "unit", "label": "מגירות DTC", "per": "drawers", "amount": 100, "when": {"dtc": True}},
        {"type": "unit", "label": "טריקה שקטה", "per": "drawers", "amount": 200, "when": {"softclose": True}}])}

for k, p in products.items():
    for s in p["sections"]:
        for c in s["controls"]:
            if c.get("options") is None and not c.get("optionsBy"): c.pop("options", None)
    json.dump(p, open(os.path.join(OUT, k + ".json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(list(products))
