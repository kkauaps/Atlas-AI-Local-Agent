"""envfile - lê o .env da raiz (KEY=VALUE) sem dependências. Variáveis do sistema têm prioridade."""
import os

from . import BASE_DIR

_cache = {"mtime": None, "vals": {}}


def _ler(caminho):
    vals = {}
    try:
        with open(caminho, encoding="utf-8") as f:
            for linha in f:
                linha = linha.strip()
                if not linha or linha.startswith("#") or "=" not in linha:
                    continue
                k, v = linha.split("=", 1)
                k = k.strip().removeprefix("export ").strip()
                v = v.strip()
                if len(v) >= 2 and v[0] == v[-1] and v[0] in "'\"":
                    v = v[1:-1]
                vals[k] = v
    except OSError:
        pass
    return vals


def get(chave, padrao=None, caminho=None):
    if os.environ.get(chave):
        return os.environ[chave]
    caminho = caminho or os.path.join(BASE_DIR, ".env")
    try:
        mt = os.path.getmtime(caminho)
    except OSError:
        mt = None
    if _cache["mtime"] != (caminho, mt):
        _cache.update(mtime=(caminho, mt), vals=_ler(caminho) if mt else {})
    return _cache["vals"].get(chave, padrao)
