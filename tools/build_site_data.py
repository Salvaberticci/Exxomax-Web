# -*- coding: utf-8 -*-
"""
Construye data/productos.js a partir de data/productos.json.

- asigna una categoria a cada producto con reglas ordenadas por especificidad
- normaliza la presentacion
- genera un indice de busqueda sin acentos
- NO incluye precios (el sitio es publico)
"""

import os
import json
import re
import unicodedata
from collections import Counter, OrderedDict

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(BASE, "data", "productos.json")
OUT = os.path.join(BASE, "data", "productos.js")
OUTCAT = os.path.join(BASE, "data", "categorias.js")

# --------------------------------------------------------------------------
# categorias (orden = prioridad, de mas especifico a mas general)
# clave, nombre visible, icono, palabras clave
# --------------------------------------------------------------------------

RULES = [
    ("electrica", "Herramientas Eléctricas", "⚡", [
        "TALADRO", "SIERRA", "AMOLADORA", "PULIDORA", "LIJADORA", "SOPLADORA",
        "DESMALEZADORA", "HIDROLAVADORA", "ASPIRADORA", "SALPICADORA",
        "GRAPADORA", "REMACHADORA", "CORTADORA", "ENGRASADORA", "EXTRACTOR",
        "MOTOTOOLS", "MOTOSIERRA", "SOPLETE", "CAUTIN", "MULTIMETRO",
        "FUMIGADORA", "MAQUINA", "MOTOBOMBA", "GENERADOR", "INVERSOR",
        "ELECTRODO", "CARGADOR", "PRENSA", "ATORNILLADOR",
        "PISTOLA P/PINTAR", "PISTOLA DE CALOR", "CALENTADOR DE AGUA",
        "BOMBA DE AGUA", "PULMON PRESURIZADOR", "PISTOLA D/CALOR",
    ]),
    ("seguridad", "Seguridad Industrial", "\U0001F9AF", [
        "PROTECTOR", "LENTES", "CARETA", "GUANTE", "MASCARA", "CASCO",
        "BOTA", "CHALECO", "GAFAS", "GUARAL", "TAPON AUDITIVO", "OREJERA",
        "EXTINTOR", "PRIMER AUXILIO", "SEÑAL", "DELIMITADOR", "CONO",
    ]),
    ("jardin", "Jardinería y Riego", "\U0001F33F", [
        "MACHETE", "MECATE", "NYLON", "ASPERSOR", "ASPERSORA", "REGADERA",
        "RASTRILLO", "GUAYA", "PODA", "CULTIVADORA", "MACETA", "JARDIN",
        "RIEGO", "MANGO DE", "CABO DE MADERA", "CORDON",
    ]),
    ("pinturas", "Pinturas y Barnices", "\U0001F3A8", [
        "PINTURA", "BARNIZ", "ESMALTE", "SOLVENTE", "RODILLO", "GAMUZA",
        "PINCEL", "COLORANTE", "AFORO", "LIJA LI",
    ]),
    ("adhesivos", "Adhesivos y Selladores", "\U0001F9F1", [
        "PEGAMENTO", "PEGA ", "PEGO ", "SELLADOR", "SILICON", "CEMENTO",
        "GOTA FIX", "TEIPE", "TEFLON", "STUCO", "EPOXI", "RESINA", "CORDEL",
        "FLEXICON", "FORMULA", "GRASA", "LUBRICANTE", "WD40",
    ]),
    ("abrasivos", "Abrasivos y Discos", "◐", [
        "DISCO", "LIJA", "ESMERIL", "FLAP", "RESINOIDO", "ABRASIVO",
        "MECHA ", "MECHAS ", "BROCHA",
    ]),
    ("plomeria", "Plomería y Tuberías", "\U0001F6B0", [
        "HG ", "TUBO", "TUBERIA", "MANGUERA", "ABRAZADERA", "VALVULA", "NIPLE",
        "TEE ", "YEE", "CODO", "CURVA", "UNION", "ACOPLE", "CANGREJO",
        "TAPON", "SIFON", "DESAGUE", "REJILLA", "GARRUCHA", "SOCATE",
        "LLAVE DE PASO", "CAJETIN", "EMPAQUE", "EMBOQUILLO", "BUSHING",
        "ADAPTADOR HEMBRA", "ADAPTADOR MACHO", "FLOTANTE", "POCETA",
        "TANQUE CONICO", "SET DE ACCESORIOS P/BA", "SURTIDOR PARA W.C.",
        "PURIFICADOR",
    ]),
    ("banos", "Baños y Cocina", "\U0001F6BF", [
        "GRIFERIA", "LAVAMANOS", "FREGADERO", "DUCHA", "REGADERA", "TOBO",
        "COCINA", "CAMPANA", "INODORO", "HORNO", "SET DE MUEBLE DE LAVAMANO",
        "BAÑO", "W.C.",
    ]),
    ("cerrajeria", "Cerrajería y Cerraduras", "\U0001F512", [
        "CERRADURA", "CANDADO", "CERROJO", "BISAGRA", "HERRAJE", "CHAPA",
        "PORTA", "OREJA P/", "ALARMA", "PULPADORA", "CADENA P/PERRO",
    ]),
    ("electricidad", "Electricidad e Iluminación", "\U0001F4A1", [
        "LAMPARA", "BOMBILLO", "REFLECTOR", "PLAFON", "APAGADOR",
        "INTERRUPTOR", "TOMA", "TOMACORRIENTE", "ENCHUFE", "BREAKER",
        "TABLERO", "CABLE", "BORNE", "ALAMBRE", "RESISTENCIA", "LINTERNA",
        "VENTILADOR", "FUSIBLE", "TERMINAL", "MULTITOMA", "EXTENSION",
        "REGULADOR", "TIMBRE", "MEDIDOR", "PROBADOR", "CANALETA",
        "CONECTOR", "CONECTORES", "PASADOR", "AUDIFONO", "CAMPANILLA",
        "AISLANTE", "ESTANO", "SOLDER", "BOTON", "ZAPATA", "REGLETA",
        "TAPA CIEGA", "TAPA METAL", "TAPA PLASTICA", "TAPA TERMO",
        "TERMOENCOGIBLE", "BAKELITA",
    ]),
    ("tornilleria", "Tornillería y Fijación", "\U0001F529", [
        "TORNILLO", "ANCLAJE", "TUERCA", "ROLDANA", "DADO", "CLAVO",
        "REMACHE", "PERNO", "BARRA ROSCADA", "AMARRE", "GRAPA", "ARANDELA",
        "COUPLER", "ESPARRAGO", "COPLE", "CAPUCHON", "SPLINTER", "CLIP",
        "AMARRA", "RAMPLU", "O-RINE",
    ]),
    ("manuales", "Herramientas Manuales", "\U0001F6E0", [
        "LLAVE DE CRUZ", "LLAVE", "DESTORNILLADOR", "ALICATE", "PINZA",
        "TENAZA", "MARTILLO", "GATO ", "GATO CAIMAN", "GATO BOTELLA", "CUÑA",
        "PALUSTRA", "HACHA", "LIMA ", "EXACTO", "SACA", "TROQUETE",
        "MULTIHERRAMIENTA", "RATCHET", "PELACABLE", "RASPADOR",
        "CARRETILLA", "NIVEL", "CUCHILLA", "HOJA", "GUIANA", "MAZO",
        "CORTADOR", "CEPILLO", "AZUELO", "PLOMADA", "JUEGO DE",
        "ESPATULA", "ARCO DE SEGUETA", "NAVAJA",
    ]),
    ("construccion", "Materiales de Construcción", "\U0001F3D7", [
        "MALLA", "PIEDRA", "ZOCALO", "PALA", "ARENA", "CANTONERA",
        "CASCOTE", "ENCOFRADO", "SOLERA", "POSTE", "CERCO", "ALAMBRADA",
        "CARGA", "FORMON", "FRAGUA", "BARRETON", "ESCARDILLA", "PALIN",
        "CAL HIDRATADA", "OCCICONCRETO", "OCCIFRISO", "IMPERPLUS",
        "CEMENTO", "MEZCLA", "CUCHARA P/ALBA",
    ]),
    ("ferreteria", "Ferretería y Embalaje", "\U0001F9F2", [
        "PLASTICO P/EMBALAR", "BOLSA", "SACO", "EMBALAJE", "CINTA",
        "ESTANTE", "REPISA", "GANCHO", "PERCHA", "TRABA", "TOPE",
        "ESCALERA", "CINCHA", "BASE ", "SOPORTE", "CABO DE ACERO",
        "LIMPIADOR", "BRILLO", "ESPONJA", "CAMILLA", "ROCIADOR",
        "ROLINERA", "RUEDA", "PIE DE AMIGO", "PAÑO DE MICROFIBRA",
        "SILLA", "TRAMPA", "BOMBA D/AIRE", "BOLIGRAFO", "CRAYON",
    ]),
]

DEFAULT = ("varios", "Otros", "\U0001F4E6")

# prefijos de familia de producto que definen la categoria sin importar la marca
PREFIX_RULES = [
    ("CP ", "plomeria"),      # conexiones CPVC
    ("HG ", "plomeria"),      # accesorios galvanizados
    ("HEM", "cerrajeria"),    # herrajes
    ("HESC", "electrica"),
    ("HESE", "electrica"),
    ("HETP", "electrica"),
    ("HETR", "electrica"),
    ("HELA", "adhesivos"),
    ("HELO", "adhesivos"),
    ("CGT", "plomeria"),
    ("CPA", "plomeria"),
    ("CPC", "plomeria"),
    ("CPU", "plomeria"),
    ("CPJ", "plomeria"),
    ("CPD", "plomeria"),
    ("CPT", "plomeria"),
    ("CPR", "plomeria"),
    ("CPM", "plomeria"),
    ("CPBP", "plomeria"),
    ("CPVI", "plomeria"),
    ("CPHE", "plomeria"),
]


def deaccent(s):
    return "".join(
        c for c in unicodedata.normalize("NFD", s)
        if unicodedata.category(c) != "Mn"
    )


def asignar(nombre, presentacion, codigo=""):
    n = deaccent(nombre).upper()
    c = codigo.upper()
    for pref, cat in PREFIX_RULES:
        if n.startswith(pref) or c.startswith(pref):
            return cat
    for key, label, icono, kws in RULES:
        for kw in kws:
            if deaccent(kw).upper() in n:
                return key
    return DEFAULT[0]


CAT_META = OrderedDict()
ICONOS = {
    "electrica": "i-electrica", "manuales": "i-manuales", "abrasivos": "i-abrasivos",
    "tornilleria": "i-tornilleria", "plomeria": "i-plomeria", "banos": "i-banos",
    "cerrajeria": "i-cerrajeria", "electricidad": "i-electricidad",
    "pinturas": "i-pinturas", "adhesivos": "i-adhesivos", "seguridad": "i-seguridad",
    "jardin": "i-jardin", "construccion": "i-construccion", "ferreteria": "i-ferreteria",
}
for key, label, icono, _ in RULES:
    CAT_META[key] = {"nombre": label, "icono": ICONOS.get(key, "i-ferreteria")}
CAT_META[DEFAULT[0]] = {"nombre": DEFAULT[1], "icono": "i-ferreteria"}

# --------------------------------------------------------------------------
# presentacion normalizada
# --------------------------------------------------------------------------

UNIDADES = {
    "CAJA X": "caja", "CAJA": "caja", "UND": "unidad", "UNIDAD": "unidad",
    "UNDID": "unidad", "ROLLO": "rollo", "BLISTER": "blister",
    "PAQUETE": "paquete", "PAQ": "paquete", "JUEGO": "juego",
    "PAR": "par", "METRO": "metro", "MT": "metro", "KG": "kilo",
    "GALON": "galón", "GL": "galón", "TAMBOR": "tambor",
    "SACO": "saco", "BLOQUE": "bloque", "FRASCO": "frasco",
    "POTE": "pote", "CUBO": "cubo", "PILA": "pila", "SPRAY": "spray",
    "DOCENA": "docena", "PAQUETE X": "paquete",
}


def norm_pres(p):
    p = (p or "").strip()
    if not p:
        return ""
    u = p.upper()
    if u in UNIDADES:
        return UNIDADES[u]
    for k, v in UNIDADES.items():
        if u.startswith(k + " ") or u.startswith(k + "X"):
            return v
    return p.lower()


# --------------------------------------------------------------------------
# generacion
# --------------------------------------------------------------------------

productos = json.load(open(SRC, encoding="utf-8"))
print("entradas: %d" % len(productos))

out = []
catcount = Counter()
for p in productos:
    nombre = re.sub(r"\s+", " ", p["nombre"]).strip()
    if not nombre:
        continue
    cat = asignar(nombre, p.get("presentacion", ""), p["codigo"])
    catcount[cat] += 1
    item = {
        "n": nombre,
        "c": p["codigo"],
        "g": cat,
        "b": deaccent(p.get("marca", "")).upper()[:24],
        "p": norm_pres(p.get("presentacion", "")),
    }
    if p.get("imagen"):
        item["i"] = p["imagen"].split("/")[-1]
    q = deaccent(nombre).lower()
    q = re.sub(r"[^a-z0-9]+", " ", q).strip()
    item["q"] = q + " " + deaccent(p["codigo"]).lower() + " " + deaccent(p.get("marca", "")).lower()
    out.append(item)

print("productos con categoria: %d" % len(out))
print("sin foto: %d" % sum(1 for i in out if "i" not in i))
print("")
print("DISTRIBUCION POR CATEGORIA:")
for k, v in catcount.most_common():
    print("  %-14s %-30s %4d" % (k, CAT_META[k]["nombre"], v))
print("")
print("SIN CATEGORIA (todos):")
n = 0
for i in out:
    if i["g"] == DEFAULT[0]:
        print("   %-10s %s" % (i["c"], i["n"][:72]))
        n += 1

js = os.environ.get("PYTHONIOENCODING", "utf-8")
with open(OUT, "w", encoding="utf-8") as f:
    f.write("/* Catalogo EXXOMAX - generado desde el catalogo 2026.\n")
    f.write("   Campos: n=nombre, c=codigo, g=categoria, b=marca, p=presentacion,\n")
    f.write("           i=imagen, q=busqueda.  Sin precios: el sitio es publico. */\n")
    f.write("window.EXXOMAX_PRODUCTOS = ")
    f.write(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
    f.write(";\n")
print("")
print("escrito: %s  (%.0f KB)" % (OUT, os.path.getsize(OUT) / 1024.0))

cats = [{"id": k, "nombre": v["nombre"], "icono": v["icono"], "total": catcount.get(k, 0)}
        for k, v in CAT_META.items()]
cats = [c for c in cats if c["total"] > 0]
with open(OUTCAT, "w", encoding="utf-8") as f:
    f.write("/* Categorias del catalogo EXXOMAX (generado). */\n")
    f.write("window.EXXOMAX_CATEGORIAS = ")
    f.write(json.dumps(cats, ensure_ascii=False, separators=(",", ":")))
    f.write(";\n")
print("escrito: %s  (%d categorias)" % (OUTCAT, len(cats)))

marcas = sorted(set(i["b"] for i in out if i["b"]))
mc = Counter(i["b"] for i in out if i["b"])
with open(os.path.join(BASE, "data", "marcas.js"), "w", encoding="utf-8") as f:
    f.write("/* Marcas del catalogo EXXOMAX (generado). */\n")
    f.write("window.EXXOMAX_MARCAS = ")
    f.write(json.dumps([{"n": m, "t": mc[m]} for m in marcas], ensure_ascii=False, separators=(",", ":")))
    f.write(";\n")
print("escrito marcas: %d" % len(marcas))
