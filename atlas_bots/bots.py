"""bots - carrega e valida as configs dos bots (bots/<id>.json), com recarga automática por mtime."""
import os
import re
import json
import threading

from . import BASE_DIR

BOTS_DIR = os.path.join(BASE_DIR, "bots")
_ID = re.compile(r"^[a-z][a-z0-9_]{1,31}$")
MEM_ESCOPOS = ("exact", "inherit", "tree", "all")
_lock = threading.Lock()
_cache = {"assin": None, "bots": {}}


class ErroBot(ValueError):
    pass


def validar(d: dict) -> dict:
    """Normaliza uma config de bot; levanta ErroBot se inválida."""
    if not isinstance(d, dict):
        raise ErroBot("config precisa ser um objeto")
    bid = str(d.get("id") or "")
    if not _ID.match(bid):
        raise ErroBot(f"id inválido: {bid!r}")
    model = d.get("model") or {"local": "default"}
    if isinstance(model, str):
        model = {"local": model}
    if not isinstance(model, dict) or not model.get("local"):
        raise ErroBot(f"{bid}: model.local obrigatório")
    tools = d.get("tools") or []
    approval = d.get("approval") or []
    if not all(isinstance(t, str) for t in tools + approval):
        raise ErroBot(f"{bid}: tools/approval devem ser listas de nomes")
    mem = d.get("memory") or {}
    escopo = mem.get("scope", "inherit")
    if escopo not in MEM_ESCOPOS:
        raise ErroBot(f"{bid}: memory.scope inválido")
    try:
        rounds = int(d.get("max_rounds", 4))
    except (TypeError, ValueError):
        raise ErroBot(f"{bid}: max_rounds inválido")
    kind = d.get("kind", "gpu")
    if kind not in ("gpu", "io"):
        raise ErroBot(f"{bid}: kind deve ser gpu ou io")
    return {
        "id": bid, "name": str(d.get("name") or bid)[:60], "persona": str(d.get("persona") or ""),
        "description": str(d.get("description") or "")[:300], "model": model,
        "tools": list(dict.fromkeys(tools)), "approval": list(dict.fromkeys(approval)),
        "memory": {"projects": [str(p) for p in mem.get("projects") or []], "scope": escopo,
                   "write": mem.get("write", "propose") if mem.get("write") in ("propose", "none") else "propose"},
        "max_rounds": max(1, min(rounds, 12)), "kind": kind,
        "can_delegate": bool(d.get("can_delegate", False)), "enabled": d.get("enabled", True) is not False,
        "allow_api_private": bool(d.get("allow_api_private", False)),
    }


def _assinatura(pasta):
    try:
        return tuple(sorted((n, os.path.getmtime(os.path.join(pasta, n)))
                            for n in os.listdir(pasta) if n.endswith(".json")))
    except OSError:
        return ()


def carregar(pasta=None, forcar=False) -> dict:
    """{id: bot}. Arquivos inválidos são ignorados (e listados em erros())."""
    pasta = pasta or BOTS_DIR
    assin = (pasta, _assinatura(pasta))
    with _lock:
        if not forcar and _cache["assin"] == assin:
            return dict(_cache["bots"])
        bots, erros = {}, []
        for n, _ in assin[1]:
            try:
                with open(os.path.join(pasta, n), encoding="utf-8") as f:
                    b = validar(json.load(f))
                if b["enabled"]:
                    bots[b["id"]] = b
            except (OSError, ValueError) as e:
                erros.append({"arquivo": n, "erro": str(e)[:200]})
        _cache.update(assin=assin, bots=bots, erros=erros)
        return dict(bots)


def erros():
    return list(_cache.get("erros") or [])


def obter(bid, pasta=None):
    b = carregar(pasta).get(bid)
    if not b:
        raise ErroBot(f"bot desconhecido: {bid}")
    return b


def persona(bot) -> str:
    """Texto da persona (arquivo .md relativo à raiz, ou texto direto)."""
    p = bot.get("persona") or ""
    if p.endswith(".md"):
        caminho = os.path.normpath(os.path.join(BASE_DIR, p))
        if caminho.startswith(BASE_DIR):
            try:
                with open(caminho, encoding="utf-8") as f:
                    return f.read().strip()
            except OSError:
                return ""
    return p


def publico(bot) -> dict:
    return {k: bot[k] for k in ("id", "name", "description", "tools", "approval", "kind", "max_rounds", "can_delegate")} | \
        {"model": bot["model"].get("local")}
