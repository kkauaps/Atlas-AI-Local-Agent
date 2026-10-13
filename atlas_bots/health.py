"""health - checagens do vigia: Ollama, VRAM, disco (C:/D:), fila travada, rotinas falhando."""
import os
import time
import shutil

import core
from . import db, router, envfile

DISCO_MIN_GB = {"C:": 10.0}           # C: é pequeno; outros discos avisam abaixo de 20 GB
DISCO_PADRAO_GB = 20.0
VRAM_ALERTA = 0.92
TRAVADO_S = 15 * 60
FILA_PARADA_S = 30 * 60


def discos():
    nomes = (envfile.get("ATLAS_DISCOS") or ("C:,D:" if os.name == "nt" else "/")).split(",")
    out = []
    for n in [x.strip() for x in nomes if x.strip()]:
        raiz = n + "\\" if n.endswith(":") else n
        try:
            u = shutil.disk_usage(raiz)
        except OSError:
            continue
        out.append({"disco": n, "livre_gb": round(u.free / 2**30, 1), "total_gb": round(u.total / 2**30, 1)})
    return out


def _vram_total_mb():
    try:
        g = core.hardware().get("gpus") or []
        return int((g[0].get("vram_gb") or 0) * 1024) if g else None
    except Exception:
        return None


def checar() -> dict:
    alertas, agora = [], time.time()

    def add(nivel, chave, msg):
        alertas.append({"nivel": nivel, "chave": chave, "msg": msg})

    online = core.ollama_online()
    if not online:
        add("erro", "ollama", "Ollama está parado")
    usado, total = router.vram_mb(), _vram_total_mb()
    if usado and total and usado / total > VRAM_ALERTA:
        add("aviso", "vram", f"VRAM quase cheia: {usado}/{total} MB")
    ds = discos()
    for d in ds:
        minimo = DISCO_MIN_GB.get(d["disco"].upper(), DISCO_PADRAO_GB)
        if d["livre_gb"] < minimo:
            add("aviso" if d["livre_gb"] > minimo / 2 else "erro", "disco_" + d["disco"],
                f"Disco {d['disco']} com {d['livre_gb']:.0f} GB livres (mínimo {minimo:.0f})")
    rows, _ = db.executar("SELECT id, bot, state, updated, created FROM jobs WHERE state IN ('running','queued')")
    for j in rows:
        if j["state"] == "running" and agora - j["updated"] > TRAVADO_S:
            add("aviso", "job_" + j["id"], f"Job {j['id']} ({j['bot']}) rodando há {int((agora - j['updated']) / 60)} min sem progresso")
        elif j["state"] == "queued" and agora - j["created"] > FILA_PARADA_S:
            add("aviso", "fila", "Fila de jobs parada há mais de 30 min")
    try:
        rows, _ = db.executar("SELECT id, fails FROM routine_state WHERE fails >= 2")
    except Exception:
        rows = []
    for r in rows:
        add("aviso", "rotina_" + r["id"], f"Rotina {r['id']} falhou {r['fails']} vezes seguidas")
    dedup = {a["chave"]: a for a in alertas}
    return {"ok": not dedup, "ollama": online, "vram_mb": usado, "vram_total_mb": total, "discos": ds,
            "alertas": sorted(dedup.values(), key=lambda a: a["chave"])}


def texto(h=None) -> str:
    h = h or checar()
    if not h["alertas"]:
        return ""
    return "\n".join(f"[{a['nivel']}] {a['msg']}" for a in h["alertas"])
