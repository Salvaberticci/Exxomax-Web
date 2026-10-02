# -*- coding: utf-8 -*-
"""
Optimiza las imagenes crudas del catalogo usando ffmpeg.

Genera miniaturas cuadradas con fondo blanco, listas para la web.
  assets/img/productos/<obj>.jpg   500x500  (fichas de producto)
  assets/img/extra/<obj>.jpg       1200x1200 (material de marca / portadas)
"""

import os
import json
import subprocess
import shutil
from concurrent.futures import ThreadPoolExecutor

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JOBS = os.path.join(BASE, "tools", "crudos.json")


def find_ffmpeg():
    p = shutil.which("ffmpeg")
    if p:
        return p
    for root in (os.environ.get("LOCALAPPDATA", ""),):
        base = os.path.join(root, "Microsoft", "WinGet", "Packages")
        if os.path.isdir(base):
            for dirpath, dirnames, filenames in os.walk(base):
                for f in filenames:
                    if f == "ffmpeg.exe":
                        cand = os.path.join(dirpath, f)
                        if "bin" in dirpath:
                            return cand
    raise SystemExit("ffmpeg no encontrado")


FF = find_ffmpeg()
print("ffmpeg: %s" % FF)

jobs = json.load(open(JOBS, encoding="utf-8"))


def run(job):
    src = job.get("raw") or job["_raw"]
    dst = os.path.join(BASE, job["salida"].replace("/", os.sep))
    if not os.path.exists(src):
        return ("skip", src)
    if os.path.exists(dst) and os.path.getsize(dst) > 0:
        return ("cached", dst)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    size = 1200 if "\\extra\\" in dst or "/extra/" in job["salida"] else 500
    vf = (
        "scale=%d:%d:force_original_aspect_ratio=decrease:flags=lanczos,"
        "pad=%d:%d:(ow-iw)/2:(oh-ih)/2:color=white,format=yuvj420p"
        % (size, size, size, size)
    )
    tmp = dst + ".tmp.jpg"
    p = subprocess.run(
        [FF, "-hide_banner", "-loglevel", "error", "-y", "-i", src,
         "-vf", vf, "-q:v", "4", tmp],
        capture_output=True,
    )
    if p.returncode != 0 or not os.path.exists(tmp):
        if os.path.exists(tmp):
            os.remove(tmp)
        return ("error", src + " :: " + p.stderr.decode("utf-8", "replace")[:200])
    os.replace(tmp, dst)
    return ("ok", dst)


with ThreadPoolExecutor(max_workers=8) as ex:
    res = list(ex.map(run, jobs))

ok = sum(1 for r, _ in res if r in ("ok", "cached"))
err = [(info, msg) for status, info in res for msg in [info] if status == "error"]
skip = sum(1 for r, _ in res if r == "skip")
print("optimizadas: %d / %d   (omitidas %d, errores %d)" % (ok, len(jobs), skip, len(err)))
for p, m in err[:10]:
    print("  ERROR %s" % m)

total = 0
cnt = 0
for root, _, files in os.walk(os.path.join(BASE, "assets", "img")):
    if "_raw" in root:
        continue
    for f in files:
        total += os.path.getsize(os.path.join(root, f))
        cnt += 1
print("assets/img: %d archivos, %.1f MB" % (cnt, total / 1048576.0))
