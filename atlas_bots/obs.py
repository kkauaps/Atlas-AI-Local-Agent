"""obs - log estruturado em logs/atlas.jsonl (redigido, com rotação pequena porque o C: é apertado)."""
import os
import re
import json
import time
import threading

from . import BASE_DIR

LOG_DIR = os.path.join(BASE_DIR, "logs")
MAX_BYTES = 20 * 1024 * 1024
MANTER_DIAS = 7
_lock = threading.Lock()

_SEGREDO = re.compile(r"(?i)(sk-[a-z0-9_\-]{12,}|gh[pousr]_[a-z0-9]{20,}|xox[abpr]-[a-z0-9\-]{10,}|"
                      r"bearer\s+[a-z0-9._\-]{12,}|(?:senha|password|token|api[_-]?key)\s*[:=]\s*\S+)")


def redigir(v, maximo=300):
    """Texto seguro pro log: corta, mascara segredos e aplica o filtro de dados sensíveis do Atlas."""
    if isinstance(v, dict):
        return {str(k)[:40]: redigir(x, maximo) for k, x in list(v.items())[:12]}
    if isinstance(v, (list, tuple)):
        return [redigir(x, maximo) for x in list(v)[:12]]
    if isinstance(v, (int, float, bool)) or v is None:
        return v
    s = _SEGREDO.sub("[redigido]", str(v))
    try:
        import contexto
        if contexto.sensivel(s):
            return "[sensivel]"
    except Exception:
        pass
    return s[:maximo]


def _arquivo():
    return os.path.join(LOG_DIR, "atlas.jsonl")


def _rotacionar(caminho):
    try:
        if os.path.getsize(caminho) < MAX_BYTES:
            return
    except OSError:
        return
    velho = caminho + ".1"
    try:
        if os.path.exists(velho):
            os.remove(velho)
        os.replace(caminho, velho)
    except OSError:
        pass


def limpar_antigos():
    if not os.path.isdir(LOG_DIR):
        return
    limite = time.time() - MANTER_DIAS * 86400
    for n in os.listdir(LOG_DIR):
        p = os.path.join(LOG_DIR, n)
        try:
            if os.path.isfile(p) and os.path.getmtime(p) < limite:
                os.remove(p)
        except OSError:
            pass


def evento(tipo, **dados):
    """Grava um evento (nunca levanta exceção)."""
    item = {"ts": time.strftime("%Y-%m-%dT%H:%M:%S"), "tipo": tipo}
    item.update({k: redigir(v) for k, v in dados.items()})
    try:
        with _lock:
            os.makedirs(LOG_DIR, exist_ok=True)
            caminho = _arquivo()
            _rotacionar(caminho)
            with open(caminho, "a", encoding="utf-8") as f:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
    except Exception:
        pass
    return item


def diario(linha, quando=None):
    """Log diário legível em logs/AAAA-MM-DD.md (resumido à noite em memória, com aprovação)."""
    quando = quando or time.localtime()
    try:
        with _lock:
            os.makedirs(LOG_DIR, exist_ok=True)
            with open(os.path.join(LOG_DIR, time.strftime("%Y-%m-%d", quando) + ".md"), "a", encoding="utf-8") as f:
                f.write(f"- {time.strftime('%H:%M', quando)} {redigir(linha, 400)}\n")
    except Exception:
        pass


def ler_diario(dia):
    try:
        with open(os.path.join(LOG_DIR, f"{dia}.md"), encoding="utf-8") as f:
            return f.read()
    except OSError:
        return ""


def ultimos(n=100):
    try:
        with open(_arquivo(), encoding="utf-8") as f:
            linhas = f.readlines()[-n:]
        return [json.loads(x) for x in linhas if x.strip()]
    except (OSError, ValueError):
        return []
