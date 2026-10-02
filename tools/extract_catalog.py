# -*- coding: utf-8 -*-
"""
Extractor de catalogo EXXOMAX desde 'Catalogo Exxomax 25092026.pdf'.

Sin dependencias externas: solo re, zlib, os, json, collections.

Produce:
  data/productos.json      catalogo normalizado (nombre, codigo, marca,
                           presentacion, categoria, imagen, pagina)
  assets/img/productos/    imagenes extraidas (jpg byte-a-byte, png re-codificado)
  tools/reporte.txt        diagnostico: cobertura de imagenes, categorias, etc.
"""

import re
import os
import zlib
import json
import sys
from collections import Counter, defaultdict

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(BASE, "Catalogo Exxomax 25092026.pdf")
IMGDIR = os.path.join(BASE, "assets", "img", "productos")
RAW_DIR = os.path.join(BASE, "assets", "img", "_raw")
OUTJSON = os.path.join(BASE, "data", "productos.json")
OUTRAW = os.path.join(BASE, "tools", "crudos.json")
REPORT = os.path.join(BASE, "tools", "reporte.txt")

# --------------------------------------------------------------------------
# 1. Lectura de objetos indirectos
# --------------------------------------------------------------------------

data = open(PDF, "rb").read()
print("PDF: %.1f MB" % (len(data) / 1048576.0))

obj_start = re.compile(rb"(?<![0-9])(\d+)\s+(\d+)\s+obj\b")

hits = [(m.start(), m.end(), int(m.group(1))) for m in obj_start.finditer(data)]
print("objetos detectados: %d" % len(hits))

OBJ = {}  # num -> (dict_bytes, stream_bytes|None)

for i, (pos, after_hdr, num) in enumerate(hits):
    end = hits[i + 1][0] if i + 1 < len(hits) else len(data)
    body = data[after_hdr:end]
    sm = re.search(rb"stream\r?\n", body)
    if sm:
        d = body[: sm.start()]
        st = sm.end()
        se = body.find(b"endstream", st)
        if se < 0:
            se = len(body)
        OBJ[num] = (d, body[st:se])
    else:
        OBJ[num] = (body[:body.rfind(b"endobj") if b"endobj" in body else len(body)], None)

print("objetos parseados: %d" % len(OBJ))


def inflate(b):
    if not b:
        return None
    for attempt in (b, b[1:], b[2:]):
        try:
            return zlib.decompressobj().decompress(attempt)
        except Exception:
            pass
    try:
        do = zlib.decompressobj(-15)
        return do.decompress(b)
    except Exception:
        return None


# --------------------------------------------------------------------------
# 2. Paginas
# --------------------------------------------------------------------------

PAGES = []
for num, (d, st) in OBJ.items():
    if b"/Type" in d and re.search(rb"/Type\s*/Page[^s]", d):
        PAGES.append((num, d))
PAGES.sort()
print("paginas: %d" % len(PAGES))


def ref(d, key):
    m = re.search(key.encode() + rb"\s+(\d+)\s+\d+\s+R", d)
    return int(m.group(1)) if m else None


def resolve(d, key):
    n = ref(d, key)
    if n is not None and n in OBJ:
        return OBJ[n][0]
    m = re.search(key.encode() + rb"\s*<<", d)
    return d[m.end() - 2:] if m else b""


# --------------------------------------------------------------------------
# 3. Tokenizador de content streams
# --------------------------------------------------------------------------

DELIM = b" \t\r\n\f\x00/[]<>()%"


def tokens(s):
    i = 0
    n = len(s)
    while i < n:
        c = s[i : i + 1]
        if c in b" \t\r\n\f\x00":
            i += 1
            continue
        if c == b"%":
            j = s.find(b"\n", i)
            i = n if j < 0 else j + 1
            continue
        if c == b"(":
            j = i + 1
            depth = 1
            buf = bytearray()
            while j < n:
                ch = s[j : j + 1]
                if ch == b"\\":
                    buf += s[j : j + 2]
                    j += 2
                    continue
                if ch == b"(":
                    depth += 1
                elif ch == b")":
                    depth -= 1
                    if depth == 0:
                        j += 1
                        break
                buf += ch
                j += 1
            yield ("str", bytes(buf))
            i = j
            continue
        if s[i : i + 2] == b"<<":
            j = s.find(b">>", i)
            if j < 0:
                return
            yield ("dict", s[i : j + 2])
            i = j + 2
            continue
        if c == b"<":
            j = s.find(b">", i)
            yield ("hex", s[i + 1 : j])
            i = j + 1
            continue
        if c == b">>":
            i += 2
            continue
        if c == b"/":
            j = i + 1
            while j < n and s[j : j + 1] not in DELIM:
                j += 1
            yield ("name", s[i + 1 : j])
            i = j
            continue
        if c in b"[]":
            yield ("op", c)
            i += 1
            continue
        j = i
        while j < n and s[j : j + 1] not in DELIM:
            j += 1
        tok = s[i:j]
        if not tok:
            i += 1
            continue
        try:
            yield ("num", float(tok))
        except ValueError:
            yield ("op", tok)
        i = j


ESC = {b"n": b"\n", b"r": b"\r", b"t": b"\t", b"b": b"\b", b"f": b"\f",
       b"(": b"(", b")": b")", b"\\": b"\\"}


def decode_str(raw):
    out = bytearray()
    i = 0
    while i < len(raw):
        c = raw[i : i + 1]
        if c != b"\\":
            out += c
            i += 1
            continue
        nxt = raw[i + 1 : i + 2]
        if nxt in ESC:
            out += ESC[nxt]
            i += 2
        elif nxt.isdigit():
            j = i + 1
            oc = b""
            while j < len(raw) and len(oc) < 3 and raw[j : j + 1] in b"01234567":
                oc += raw[j : j + 1]
                j += 1
            out.append(int(oc, 8) & 0xFF)
            i = j
        elif nxt == b"\n":
            i += 2
        else:
            out += nxt
            i += 2
    return out.decode("cp1252", errors="replace")


# --------------------------------------------------------------------------
# 4. Texto con posicion
# --------------------------------------------------------------------------

def page_text(content):
    items = []
    x = y = 0.0
    tl = 0.0
    fs = 0.0
    stack = []
    arr = None
    pend = None
    for kind, val in tokens(content):
        if kind == "num":
            stack.append(val)
            continue
        if kind == "str" or kind == "hex":
            pend = decode_str(val) if kind == "str" else ""
            continue
        if kind == "name":
            continue
        if kind == "dict":
            continue
        op = val
        if op == b"[":
            arr = []
            continue
        if op == b"]":
            if arr is not None and pend is None:
                items.append((x, y, fs, "".join(arr)))
            arr = None
            stack = []
            continue
        if arr is not None and kind in ("str",):
            arr.append(pend or "")
            continue
        if op == b"Tf":
            if stack:
                fs = stack[-1]
        elif op == b"TL":
            if stack:
                tl = stack[-1]
        elif op in (b"Td", b"TD"):
            if len(stack) >= 2:
                x += stack[-2]
                y += stack[-1]
                if op == b"TD":
                    tl = -stack[-1]
        elif op == b"Tm":
            if len(stack) >= 6:
                x, y = stack[-2], stack[-1]
        elif op == b"BT":
            x = y = 0.0
        elif op == b"T*":
            y -= tl
        elif op == b"'":
            if pend is not None:
                items.append((x, y, fs, pend))
            y -= tl
        elif op == b'"':
            if pend is not None:
                items.append((x, y, fs, pend))
            y -= tl
        elif op in (b"Tj", b"TJ", b"'", b'"'):
            if pend is not None:
                items.append((x, y, fs, pend))
        pend = None
        stack = []
    return items


# --------------------------------------------------------------------------
# 5. Colocaciones de imagen (CTM + Do)
# --------------------------------------------------------------------------

def compose(m, ctm):
    a, b, c, d, e, f = m
    A, B, C, D, E, F = ctm
    return (
        a * A + b * C,
        a * B + b * D,
        c * A + d * C,
        c * B + d * D,
        e * A + f * C + E,
        e * B + f * D + F,
    )


def page_images(content):
    ctm = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
    stack = []
    nums = []
    name = None
    out = []
    for kind, val in tokens(content):
        if kind == "num":
            nums.append(val)
            continue
        if kind == "name":
            name = val
            continue
        if kind != "op":
            continue
        op = val
        if op == b"q":
            stack.append(ctm)
        elif op == b"Q":
            ctm = stack.pop() if stack else ctm
        elif op == b"cm" and len(nums) >= 6:
            ctm = compose(nums[-6:], ctm)
        elif op == b"Do" and name is not None:
            a, b, c, d, e, f = ctm
            xs = sorted([e, e + a, e + c, e + a + c])
            ys = sorted([f, f + b, f + d, f + b + d])
            out.append((name.decode("latin-1"), xs[0], ys[0], xs[-1] - xs[0], ys[-1] - ys[0]))
        nums = []
        name = None
    return out


# --------------------------------------------------------------------------
# 6. Recorrido del documento
# --------------------------------------------------------------------------

CODE = re.compile(r"^[A-Z]{4}-\d{2}$")
PRICE = re.compile(r"^\d{1,4}[.,]\d{2}$")

items = []      # productos
placements = [] # (page, xname, x0, y0, w, h)
seen_img = set()

for pi, (pnum, pd) in enumerate(PAGES, start=1):
    cnums = [int(x) for x in re.findall(rb"(\d+)\s+\d+\s+R", re.search(rb"/Contents[^>]*?>>", pd).group(0))] if re.search(rb"/Contents", pd) else []
    cbuf = b""
    for cn in cnums:
        cbuf += (OBJ.get(cn, (b"", None))[1] or b"") + b"\n"
    if not cbuf:
        cbuf = inflate(OBJ.get(pnum, (b"", b""))[1] or b"") or b""
    content = inflate(cbuf) or cbuf

    res = resolve(pd, "/Resources")
    xo = re.search(rb"/XObject\s*<<(.*?)>>", res, re.S)
    xmap = {}
    if xo:
        for nm, on in re.findall(rb"/([^\s/]+)\s+(\d+)\s+\d+\s+R", xo.group(1)):
            xmap[nm.decode("latin-1")] = int(on)

    for xname, x0, y0, w, h in page_images(content):
        on = xmap.get(xname)
        if on is not None:
            placements.append((pi, on, x0, y0, w, h))

    toks = page_text(content)
    cur = []
    for x, y, fs, t in toks:
        tt = t.strip()
        if not tt or tt in ("ULTIMA ACTUALIZACION", "Catalogo 2026"):
            continue
        if tt.endswith(" ~") or tt.startswith("~ "):
            tt = tt.replace("~", "").strip()
        if not tt:
            continue
        cur.append((x, y, fs, tt))
        if PRICE.match(tt.replace(" ", "")) or PRICE.match(tt):
            toks_prod = cur
            cur = []
            code = None
            ci = None
            for k in range(len(toks_prod) - 1, -1, -1):
                if CODE.match(toks_prod[k][3]):
                    code = toks_prod[k]
                    ci = k
                    break
            if code is None:
                continue
            name_parts = [z[3] for z in toks_prod[:ci]]
            after = [z[3] for z in toks_prod[ci + 1:]]
            brand = after[0] if after else ""
            rest = after[1:]
            # el ultimo token es el precio; lo que quede es la presentacion
            if rest and PRICE.match(rest[-1].replace(" ", "")):
                rest = rest[:-1]
            pres = " ".join(rest)
            items.append({
                "nombre": " ".join(name_parts),
                "codigo": code[3],
                "marca": brand,
                "presentacion": pres,
                "precio": toks_prod[-1][3],
                "pagina": pi,
                "_cx": code[0],
                "_cy": code[1],
                "_tx": toks_prod[0][0],
                "_ty": toks_prod[0][1],
            })

print("productos parseados: %d" % len(items))
print("codigos unicos: %d" % len(set(i["codigo"] for i in items)))
print("colocaciones de imagen: %d" % len(placements))

# --------------------------------------------------------------------------
# 7. Volcado de imagenes + emparejado geometrico
# --------------------------------------------------------------------------

os.makedirs(IMGDIR, exist_ok=True)
os.makedirs(RAW_DIR, exist_ok=True)
extras = []

imgmeta = {}
for num, (d, st) in OBJ.items():
    if b"/Subtype" not in d or not re.search(rb"/Subtype\s*/Image", d):
        continue
    w = re.search(rb"/Width\s+(\d+)", d)
    h = re.search(rb"/Height\s+(\d+)", d)
    bpc = re.search(rb"/BitsPerComponent\s+(\d+)", d)
    cs = re.search(rb"/ColorSpace\s*(/\w+|\[[^\]]*\])", d)
    filt = b"/DCTDecode" in d
    pred = re.search(rb"/Predictor\s+(\d+)", d)
    col = re.search(rb"/Columns\s+(\d+)", d)
    imgmeta[num] = {
        "w": int(w.group(1)) if w else 0,
        "h": int(h.group(1)) if h else 0,
        "bpc": int(bpc.group(1)) if bpc else 8,
        "cs": (cs.group(1).decode("latin-1") if cs else "/DeviceRGB"),
        "jpeg": filt,
        "predictor": int(pred.group(1)) if pred else 1,
        "columns": int(col.group(1)) if col else 0,
        "decoded": None,
        "png": False,
    }

print("objetos de imagen: %d  (jpeg=%d)" % (len(imgmeta), sum(1 for m in imgmeta.values() if m["jpeg"])))


def write_png(path, w, h, rgb):
    """PNG minimo, sin Pillow: zlib estandar."""
    raw = bytearray()
    stride = w * 3
    for y in range(h):
        raw.append(0)
        raw += rgb[y * stride:(y + 1) * stride]
    comp = zlib.compress(bytes(raw), 6)

    def chunk(tag, payload):
        return (len(payload).to_bytes(4, "big") + tag + payload
                + (zlib.crc32(tag + payload) & 0xFFFFFFFF).to_bytes(4, "big"))

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", w.to_bytes(4, "big") + h.to_bytes(4, "big") + bytes([8, 2, 0, 0, 0]))
    png += chunk(b"IDAT", comp)
    png += chunk(b"IEND", b"")
    open(path, "wb").write(png)


def to_rgb(num):
    m = imgmeta[num]
    raw = m["decoded"]
    if raw is None:
        return None
    w, h, bpc, cs = m["w"], m["h"], m["bpc"], m["cs"]
    if bpc != 8:
        return None
    ncomp = 3 if "RGB" in cs or cs == "/CalRGB" else (1 if "Gray" in cs or "CalGray" in cs else (4 if "CMYK" in cs else None))
    if ncomp is None:
        return None
    if m["predictor"] > 1:
        bpp = ncomp
        rowlen = w * bpp
        rows = []
        prev = bytearray(rowlen)
        pos = 0
        for y in range(h):
            ft = raw[pos]; pos += 1
            row = bytearray(raw[pos:pos + rowlen]); pos += rowlen
            if ft == 1:
                for i in range(bpp, rowlen):
                    row[i] = (row[i] + row[i - bpp]) & 0xFF
            elif ft == 2:
                for i in range(rowlen):
                    row[i] = (row[i] + prev[i]) & 0xFF
            elif ft == 3:
                for i in range(rowlen):
                    left = row[i - bpp] if i >= bpp else 0
                    row[i] = (row[i] + ((left + prev[i]) >> 1)) & 0xFF
            elif ft == 4:
                for i in range(rowlen):
                    a = row[i - bpp] if i >= bpp else 0
                    b = prev[i]
                    c = prev[i - bpp] if i >= bpp else 0
                    p = a + b - c
                    pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                    pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                    row[i] = (row[i] + pr) & 0xFF
            rows.append(row)
            prev = row
        raw = b"".join(bytes(r) for r in rows)
    need = w * h * ncomp
    if len(raw) < need:
        return None
    if ncomp == 3:
        return raw[:need]
    out = bytearray(w * h * 3)
    if ncomp == 1:
        for i in range(w * h):
            v = raw[i]
            out[i * 3] = v; out[i * 3 + 1] = v; out[i * 3 + 2] = v
    else:
        for i in range(w * h):
            c, m_, y_, k = raw[i * 4:i * 4 + 4]
            out[i * 3] = 255 - min(255, c + k)
            out[i * 3 + 1] = 255 - min(255, m_ + k)
            out[i * 3 + 2] = 255 - min(255, y_ + k)
    return bytes(out)


# agrupar colocaciones por pagina
bypage = defaultdict(list)
for idx, (pg, on, x0, y0, w, h) in enumerate(placements):
    bypage[pg].append((idx, on, x0, y0, w, h))

matched = 0
for it in items:
    pg = it["pagina"]
    cx, cy = it["_cx"], it["_cy"]
    best = None
    bestd = 1e9
    taken = set()
    for idx, on, x0, y0, w, h in bypage.get(pg, []):
        if idx in taken:
            continue
        if h < 60 or w < 40:
            continue
        # la foto esta justo encima del codigo
        if y0 <= cy + 2:
            continue
        d = y0 - cy
        if d > 90:
            continue
        ov = min(x0 + w, cx + 170) - max(x0, cx - 20)
        if ov <= 0:
            continue
        if d < bestd:
            bestd = d
            best = (idx, on, x0, y0, w, h)
    if best:
        idx, on, x0, y0, w, h = best
        taken.add(idx)
        # ninguna otra posicion puede reclamar esta misma colocacion
        for _pg, lst in bypage.items():
            for k, (i2, *_r) in enumerate(lst):
                if i2 == idx:
                    lst[k] = (-1, on, x0, y0, w, h)
                    break
        meta = imgmeta.get(on)
        if not os.path.exists(RAW_DIR):
            pass
        ext = "jpg" if meta and meta["jpeg"] else "png"
        raw_path = os.path.join(RAW_DIR, "%d.%s" % (on, ext))
        if not os.path.exists(raw_path):
            if meta and meta["jpeg"]:
                open(raw_path, "wb").write(OBJ[on][1])
            else:
                if meta and meta["decoded"] is None:
                    meta["decoded"] = inflate(OBJ[on][1])
                rgb = to_rgb(on) if meta else None
                if not rgb:
                    continue
                write_png(raw_path, meta["w"], meta["h"], rgb)
        if os.path.exists(raw_path):
            it["imagen"] = "assets/img/productos/%d.jpg" % on
            it["_raw"] = raw_path
            matched += 1

print("productos con foto: %d / %d  (%.1f%%)" % (matched, len(items), 100.0 * matched / max(1, len(items))))

# tambien volcar imagenes sueltas (logos, portadas) que no son de producto
loose = 0
loose_objs = set()
for pg, on, x0, y0, w, h in placements:
    meta = imgmeta.get(on)
    if not meta or on in loose_objs:
        continue
    if meta["w"] < 700 or meta["h"] < 700:
        continue
    loose_objs.add(on)
for on in loose_objs:
    meta = imgmeta.get(on)
    ext = "jpg" if meta["jpeg"] else "png"
    raw_path = os.path.join(RAW_DIR, "%d.%s" % (on, ext))
    if not os.path.exists(raw_path):
        if meta["jpeg"]:
            open(raw_path, "wb").write(OBJ[on][1])
        else:
            if meta["decoded"] is None:
                meta["decoded"] = inflate(OBJ[on][1])
            rgb = to_rgb(on)
            if not rgb:
                continue
            write_png(raw_path, meta["w"], meta["h"], rgb)
    if os.path.exists(raw_path):
        loose += 1
        extras.append({"_raw": raw_path, "salida": "assets/img/extra/%d.jpg" % on})
print("imagenes sueltas de alta resolucion: %d" % loose)

# --------------------------------------------------------------------------
# 8. Normalizacion de texto
# --------------------------------------------------------------------------

def clean(s):
    s = s.replace("\u00a0", " ")
    s = s.replace("*", "/")
    s = re.sub(r"\s+", " ", s).strip(" -/")
    s = s.replace('"', '"')
    return s


# tokens de presentacion: cuando aparecen en la posicion de la marca
# significa que ese producto no tiene marca en el catalogo.
# tokens que no son marca ni presentacion: campos sueltos del catalogo
NO_ES_MARCA = {"1HORA", "1 HORA", "2 HORAS", "24H", "X"}

UNIDADES = {
    "UND", "UNIDAD", "UNDID", "CAJA", "ROLLO", "BLISTER", "PAQUETE", "PAQ",
    "JUEGO", "PAR", "METRO", "MET", "MT", "KG", "GALON", "GL", "SACO",
    "DOCENA", "BLOQUE", "FRASCO", "POTE", "SPRAY", "X", "UNDID",
}


for it in items:
    it["nombre"] = clean(it["nombre"])
    it["marca"] = clean(it["marca"])
    it["presentacion"] = clean(it["presentacion"])

    # si lo que se leyo como marca es en realidad una unidad de venta,
    # el producto no trae marca en el catalogo
    if it["marca"].upper() in UNIDADES:
        if not it["presentacion"]:
            it["presentacion"] = it["marca"]
        it["marca"] = ""

    # si la marca es solo un numero, es el precio del catalogo:
    # esos productos no traen marca ni presentacion
    if re.match(r"^\d+(?:[.,]\d+)?$", it["marca"]):
        it["marca"] = ""

    # campos sueltos del catalogo que no son marca ni presentacion
    if it["marca"].upper() in NO_ES_MARCA:
        it["marca"] = ""

# quitar el codigo que a veces se cuela en el nombre
for it in items:
    it["nombre"] = re.sub(r"\b[A-Z]{4}-\d{2}\b", "", it["nombre"]).strip()

# dedupe por codigo
seen = set()
final = []
for it in items:
    if it["codigo"] in seen:
        continue
    seen.add(it["codigo"])
    final.append(it)

# --------------------------------------------------------------------------
# 9. Diagnostico
# --------------------------------------------------------------------------

lines = []
lines.append("PRODUCTOS: %d" % len(final))
lines.append("CON FOTO: %d (%.1f%%)" % (matched, 100.0 * matched / max(1, len(final))))
lines.append("")
lines.append("PRIMERAS PALABRAS (para armar categorias):")
wc = Counter(i["nombre"].split(" ")[0] for i in final if i["nombre"])
for w, c in wc.most_common(400):
    lines.append("  %-28s %d" % (w, c))
lines.append("")
lines.append("MARCAS: %d unicas" % len(set(i["marca"] for i in final)))
bc = Counter(i["marca"] for i in final)
for w, c in bc.most_common(80):
    lines.append("  %-28s %d" % (w, c))
lines.append("")
lines.append("PRESENTACIONES: %d unicas" % len(set(i["presentacion"] for i in final)))
pc = Counter(i["presentacion"] for i in final)
for w, c in pc.most_common(40):
    lines.append("  %-28s %d" % (w, c))
lines.append("")
lines.append("SIN FOTO (primeros 40):")
n = 0
for it in final:
    if "imagen" not in it:
        lines.append("  p%-4d %-10s %s" % (it["pagina"], it["codigo"], it["nombre"][:70]))
        n += 1
        if n >= 40:
            break
open(REPORT, "w", encoding="utf-8").write("\n".join(lines))
print("reporte: %s" % REPORT)

for it in final:
    it.pop("_cx", None); it.pop("_cy", None)
    it.pop("_tx", None); it.pop("_ty", None)
    it.pop("precio", None)
    it.pop("pagina", None)
    it.pop("_raw", None)

json.dump(final, open(OUTJSON, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("json: %s  (%d productos)" % (OUTJSON, len(final)))

raws = {}
for it in final:
    if "imagen" in it:
        raws[it["imagen"].split("/")[-1].replace(".jpg", "")] = None
raws = sorted(int(k) for k in raws)
jobs = [{"raw": os.path.join(RAW_DIR, "%d%s" % (
    o, ".jpg" if os.path.exists(os.path.join(RAW_DIR, "%d.jpg" % o)) else ".png")),
    "salida": "assets/img/productos/%d.jpg" % o} for o in raws]
for e in extras:
    jobs.append(e)
json.dump(jobs, open(OUTRAW, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("trabajos de optimizacion: %d" % len(jobs))
