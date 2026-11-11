# Desk products from the Modulartech imported-frames price list (January 2026), prices before VAT, frames without tops.
# Tops from the Modulartech office price list (melamine / formica boards, price by how many tops fit one 280×210 board).
import json, os
OUT = 'products'

# id: (Hebrew name, leg type, {depth: frame price}, rider price, {pair depth: price}, {bench depth: price}, desk lengths)
STD = [120, 140, 160, 180]
F = {
  'intel':      ('אינטל', 'posts',   {60: 249, 70: 249, 80: 249}, 240, {118: 800, 138: 900}, {118: 950, 138: 1100}, STD),
  'rose':       ('רוז', 'loop',      {60: 249, 70: 249, 80: 249}, 240, {118: 800, 138: 900}, {118: 950, 138: 1100}, STD),
  'lotus':      ('לוטוס', 'trapez',  {60: 249, 70: 249, 80: 249}, 240, {118: 800, 138: 900}, {118: 950, 138: 1100}, STD),
  'x':          ('איקס', 'xleg',     {70: 249, 80: 249}, None, {}, {}, STD),
  'verona':     ('ורונה', 'angled',  {70: 290, 80: 290, 90: 390}, 270, {}, {118: 1100, 138: 1250}, STD),
  'latte':      ('לאטה', 'splay',    {60: 390, 70: 430, 80: 450}, 410, {}, {118: 1250, 138: 1400}, STD),
  'arco':       ('ארקו', 'posts',    {60: 400, 70: 440, 80: 480}, 390, {}, {118: 1150, 138: 1300}, STD),
  'quadro':     ('קואדרו', 'loop',   {60: 400, 70: 440, 80: 480}, 390, {}, {118: 1150, 138: 1300}, STD),
  'joy-open':   ('ג׳וי פתוח', 'posts', {70: 400, 80: 400}, None, {}, {118: 1250, 138: 1390}, STD),
  'joy-closed': ('ג׳וי חלון סגור', 'loop', {70: 450, 80: 450}, 400, {}, {118: 1250, 138: 1390}, STD),
  'bari':       ('בארי', 'splay',    {70: 530, 80: 530}, 470, {138: 1050, 158: 1250}, {138: 1250, 158: 1400}, [160, 180, 200]),
  'venice':     ('ונציה', 'zigzag',  {70: 530, 80: 530, 90: 600}, 490, {}, {}, STD),
  'play':       ('פלאי', 'tripod',   {80: 650}, None, {}, {}, STD),
  'barcelona':  ('ברצלונה', 'aframe', {80: 750}, 690, {120: 1550}, {138: 2200}, STD),
  'gesher':     ('גשר', 'bow',       {80: 750}, 690, {118: 1100, 138: 1300}, {118: 1550, 138: 2200}, STD),
  'spider':     ('ספיידר', 'bow',    {70: 850, 80: 850}, 750, {}, {118: 1250, 138: 3200}, STD),
  'electric':   ('חשמלי מתכוונן', 'electric', {60: 800, 70: 800, 80: 800}, None, {}, {}, STD),
}
TOPS = {  # id: (label, thickness mm, edge, [1,2,3,4 per board])
  'm28':  ('מלמין 28 מ״מ, קנט ישר', 28, 'straight', [350, 215, 160, 135]),
  'm17':  ('מלמין 17 מ״מ, קנט ישר', 17, 'straight', [250, 155, 125, 110]),
  'b24':  ('מלמין 24 מ״מ, קנט משופע', 24, 'bevel', [450, 280, 225, 195]),
  'f28':  ('סנדוויץ׳ פורמייקה 28 מ״מ', 28, 'straight', [585, 325, 235, 190]),
  'mdf28': ('MDF פורמייקה 28 מ״מ, קנט אפוקסי', 28, 'epoxy', [800, 600, 600, 600]),
  'v30':  ('MDF פורניר 30 מ״מ, קנט משופע', 30, 'bevel', [1200, 780, 780, 780]),
}
LAYOUT_LABEL = {'single': 'שולחן יחיד', 'row': 'שורת שולחנות', 'pair': 'זוג שולחנות מול מול', 'bench': 'בנץ׳ ארבע עמדות'}

def layouts(fid):
    n, t, desk, rider, pair, bench, L = F[fid]
    out = ['single'] + (['row'] if rider else []) + (['pair'] if pair else []) + (['bench'] if bench else [])
    return [{"v": x, "label": LAYOUT_LABEL[x]} for x in out]

def lengths_map():
    m = {}
    for fid, (n, t, desk, rider, pair, bench, L) in F.items():
        m[f'single|{fid}'] = L; m[f'row|{fid}'] = L
        if pair: m[f'pair|{fid}'] = [240] if fid == 'barcelona' else [180]
        if bench: m[f'bench|{fid}'] = [360] if fid == 'barcelona' else [300, 330, 360]
    return m

def depths_map():
    m = {}
    for fid, (n, t, desk, rider, pair, bench, L) in F.items():
        m[f'single|{fid}'] = sorted(desk); m[f'row|{fid}'] = sorted(desk)
        if pair: m[f'pair|{fid}'] = sorted(pair)
        if bench: m[f'bench|{fid}'] = sorted(bench)
    return m

def rules():
    r = []
    rows = []
    for fid, (n, t, desk, rider, pair, bench, L) in F.items():
        rows += [{"d": d, "price": p, "when": {"frame": fid, "layout": ["single", "row"]}} for d, p in desk.items()]
        rows += [{"d": d, "price": p, "when": {"frame": fid, "layout": "pair"}} for d, p in pair.items()]
        rows += [{"d": d, "price": p, "when": {"frame": fid, "layout": "bench"}} for d, p in bench.items()]
    r.append({"type": "table", "label": "שלד", "dims": ["d"], "rows": rows})
    r.append({"type": "option", "label": "רוכבים (שולחנות נוספים בשורה)", "key": "frame", "per": "riders", "amounts": {fid: v[3] for fid, v in F.items() if v[3]}, "when": {"layout": "row"}})
    r.append({"type": "option", "label": "מנוע כפול", "key": "motor", "amounts": {"single": 0, "dual": 150}, "when": {"frame": "electric"}})
    std = {"9016": 0, "9005": 0, "7024": 0, "5013": 0}
    r.append({"type": "option", "label": "צבע RAL מיוחד לשלד", "key": "fcolor", "per": "units", "amounts": std, "otherwise": 70, "when": {"layout": ["single", "row"]}})
    r.append({"type": "option", "label": "צבע RAL מיוחד לבנץ׳", "key": "fcolor", "amounts": std, "otherwise": 120, "when": {"layout": ["pair", "bench"]}})
    for tid, (lab, t, edge, p) in TOPS.items():
        r.append({"type": "tiers", "label": "פלטה: " + lab, "by": "perBoard", "per": "tops", "when": {"top": tid}, "tiers": [{"upTo": i + 1, "amount": a} for i, a in enumerate(p)]})
    r.append({"type": "unit", "label": "פתחי כבלים CNC", "per": "holes", "amount": 50})
    r.append({"type": "unit", "label": "תעלת תקשורת", "per": "units", "amount": 195, "when": {"tray": True}})
    return r

def sw(key, label, catalog, style, showWhen=None):
    c = {"type": "swatch", "key": key, "label": label, "catalog": catalog, "style": style, "out": "RAL {id} · {he}" if style == 'ral' else "{he}"}
    if showWhen: c["showWhen"] = showWhen
    return c

def product(pid, name, prefix, subtitle, defaults):
    return {
        "id": pid, "name": name, "family": "desk", "codePrefix": prefix, "subtitle": subtitle,
        "note": "השלדים בייבוא, בצבעי לבן, שחור, גרפיט וכחול, או בכל גוון RAL בתוספת. הגוונים במסך להמחשה.",
        "model": {"frames": {fid: {"he": v[0], "type": v[1]} for fid, v in F.items()}, "tops": {tid: {"he": v[0], "t": v[1], "edge": v[2]} for tid, v in TOPS.items()}},
        "defaults": {"frame": "intel", "layout": "single", "n": 2, "w": 160, "d": 80, "top": "m28", "decor": "oak", "fcolor": "9005", "motor": "single", "holes": False, "tray": False, **defaults},
        "sections": [
            {"id": "frame", "title": "שלד", "controls": [
                {"type": "seg", "key": "frame", "label": "דגם שלד", "layout": "wrap", "options": [{"v": fid, "label": v[0]} for fid, v in F.items()]},
                {"type": "seg", "key": "motor", "label": "מנוע", "showWhen": {"frame": "electric"}, "options": [{"v": "single", "label": "מנוע יחיד"}, {"v": "dual", "label": "שני מנועים"}]}]},
            {"id": "size", "title": "תצורה ומידות", "controls": [
                {"type": "seg", "key": "layout", "label": "תצורה", "layout": "list", "optionsBy": {"key": "frame", "map": {fid: layouts(fid) for fid in F}}},
                {"type": "stepper", "key": "n", "label": "שולחנות בשורה", "min": 2, "max": 6, "showWhen": {"layout": "row"}},
                {"type": "seg", "key": "w", "label": "אורך", "num": True, "optionsBy": {"key": ["layout", "frame"], "map": lengths_map()}, "custom": {"label": "אחר", "min": 100, "max": 400, "step": 1, "unit": "ס״מ", "inputLabel": "אורך בס״מ"}},
                {"type": "seg", "key": "d", "label": "עומק", "num": True, "optionsBy": {"key": ["layout", "frame"], "map": depths_map()}}]},
            {"id": "top", "title": "פלטה", "controls": [
                {"type": "seg", "key": "top", "label": "סוג פלטה", "layout": "list", "options": [{"v": "none", "label": "ללא פלטה (שלד בלבד)"}] + [{"v": tid, "label": v[0]} for tid, v in TOPS.items()]},
                sw("decor", "גימור", "decors", "decor", {"top": list(TOPS)})]},
            {"id": "color", "title": "צבע שלד", "controls": [sw("fcolor", "צבע", "frame-colors", "ral")]},
            {"id": "extra", "title": "תוספות", "controls": [
                {"type": "toggle", "key": "holes", "title": "פתחי כבלים CNC", "sub": "פתח לכל פלטה", "showWhen": {"top": list(TOPS)}},
                {"type": "toggle", "key": "tray", "title": "תעלת תקשורת", "sub": "תעלה לכבלים מתחת לפלטה"}]}],
        "pricing": {"_help": "מחירי ספק לפני מע״מ (שלדים: מחירון ייבוא מתכת Modulartech ינואר 2026; פלטות: מחירון ריהוט משרדי). markup = רווח, vat = מע״מ.",
                    "currency": "₪", "label": "מחיר", "note": "כולל מע״מ, לא כולל הובלה והרכבה", "markup": 100, "vat": 18, "roundTo": 10, "customQuote": True, "rules": rules()}}

P = {
  'office-desk': product('office-desk', 'שולחן עבודה', 'MDW', 'שולחן עבודה על שלד מתכת: בחרו דגם שלד, מידות, פלטה וצבע. אפשר גם שורת שולחנות או זוג מול זוג.', {}),
  'manager-desk': product('manager-desk', 'שולחן מנהל', 'MDM', 'שולחן מנהל על שלד מתכת מעוצב, עם פלטה בקנט משופע או פורניר.', {"frame": "barcelona", "w": 180, "d": 80, "top": "b24", "decor": "walnut", "fcolor": "9016"}),
  'desk-frame': product('desk-frame', 'שלד לשולחן', 'MDF', 'שלדי מתכת לשולחנות, בלי פלטה או עם פלטה לבחירה. מגיעים בלבן, שחור, גרפיט או כל גוון RAL.', {"top": "none", "fcolor": "9016"}),
  'bench-desk': product('bench-desk', 'עמדות עבודה משותפות', 'MDB', 'שולחנות בנץ׳ לארבע עמדות או זוג שולחנות מול מול, על שלד מתכת משותף.', {"frame": "arco", "layout": "bench", "w": 330, "d": 138, "fcolor": "7024", "decor": "white"}),
}
# manager desk: optional L-return (שלוחה) – a 65 cm credenza that replaces one leg; the frame rides on its top.
# (an 80 cm return at desk height belongs to the office desk, as an attached return)
RW = [120, 140, 160, 180, 200]
RET_PRICE = {120: 750, 140: 900, 160: 1050, 180: 1200, 200: 1350}   # credenza list: 120 → 750, 180 → 1200; in between by length
md = P['manager-desk']
md['defaults'].update({"ret": "left", "rw": 160, "rarr": "dd", "rbody": "graphite", "rfaceOn": True, "rface": "walnut", "rinset": "over", "rhandle": "h"})
sel = {"layout": "single", "ret": ["right", "left"]}
md['sections'].insert(2, {"id": "ret", "title": "שלוחה", "controls": [
    {"type": "seg", "key": "ret", "label": "שלוחה בצורת L", "showWhen": {"layout": "single"}, "options": [
        {"v": "none", "label": "ללא"}, {"v": "right", "label": "מימין"}, {"v": "left", "label": "משמאל"}]},
    {"type": "seg", "key": "rw", "label": "אורך השלוחה", "num": True, "showWhen": sel, "options": [{"v": w, "label": f"{w}"} for w in RW]},
    {"type": "seg", "key": "rarr", "label": "סידור", "layout": "list", "showWhen": sel, "options": [
        {"v": "dd", "label": "דלתות + מגירות"}, {"v": "ddd", "label": "מגירות + דלתות + מגירות"}, {"v": "dod", "label": "דלתות + תא פתוח + מגירות"},
        {"v": "od", "label": "תאים פתוחים + מגירות"}, {"v": "dr", "label": "מגירות בלבד"}]},
    sw("rbody", "צבע גוף", "decors", "decor", sel),
    {"type": "toggle", "key": "rfaceOn", "title": "חזיתות בצבע אחר", "sub": "צבע שונה לדלתות ולמגירות", "showWhen": sel},
    sw("rface", "צבע חזיתות", "decors", "decor", {**sel, "rfaceOn": True}),
    {"type": "seg", "key": "rinset", "label": "חזיתות", "showWhen": sel, "options": [{"v": "over", "label": "על הגוף"}, {"v": "inset", "label": "שקועות בגוף"}]},
    {"type": "seg", "key": "rhandle", "label": "פתיחה", "showWhen": sel, "options": [{"v": "h", "label": "ידיות ח רוכבות"}, {"v": "touch", "label": "פתיחה בלחיצה (טאץ׳)"}]}]})
md['pricing']['rules'].insert(1, {"type": "table", "label": "שלוחה 65 ס״מ", "dims": ["rw"],
    "rows": [{"rw": w, "price": p} for w, p in RET_PRICE.items()], "when": sel})
md['subtitle'] = 'שולחן מנהל על שלד מתכת מעוצב, עם פלטה בקנט משופע או פורניר, ושלוחה בצורת L שהשלד רוכב עליה.'

for k, p in P.items():
    json.dump(p, open(os.path.join(OUT, k + '.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print(list(P))
