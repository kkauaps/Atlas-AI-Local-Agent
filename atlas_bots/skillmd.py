"""skillmd - skills como templates markdown (skills/*.md com frontmatter simples, sem dependências)."""
import os
import re

from . import BASE_DIR

SKILLS_DIR = os.path.join(BASE_DIR, "skills")
_NOME = re.compile(r"^[a-z][a-z0-9_]{1,40}$")
_VAR = re.compile(r"\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}")


def _valor(v):
    v = v.strip()
    if v.startswith("[") and v.endswith("]"):
        return [x.strip().strip("'\"") for x in v[1:-1].split(",") if x.strip()]
    return v.strip("'\"")


def parse(texto):
    """(meta, corpo). Frontmatter entre linhas '---' com chave: valor ou chave: [a, b]."""
    meta, corpo = {}, texto
    if texto.startswith("---"):
        partes = texto.split("\n---", 1)
        if len(partes) == 2:
            for linha in partes[0].splitlines()[1:]:
                if ":" in linha:
                    k, v = linha.split(":", 1)
                    meta[k.strip()] = _valor(v)
            corpo = partes[1].lstrip("-").lstrip("\n")
    return meta, corpo.strip()


def listar(pasta=None):
    pasta = pasta or SKILLS_DIR
    out = {}
    try:
        nomes = sorted(os.listdir(pasta))
    except OSError:
        return out
    for n in nomes:
        if not n.endswith(".md"):
            continue
        try:
            with open(os.path.join(pasta, n), encoding="utf-8") as f:
                meta, corpo = parse(f.read())
        except OSError:
            continue
        nome = meta.get("name") or n[:-3]
        if _NOME.match(nome):
            out[nome] = {"name": nome, "bots": meta.get("bots") or [], "tools": meta.get("tools") or [],
                         "inputs": meta.get("inputs") or [], "description": meta.get("description", ""), "body": corpo}
    return out


def render_skill(name, inputs=None, bot_id=None, pasta=None) -> str:
    s = listar(pasta).get(str(name or ""))
    if not s:
        raise ValueError(f"skill desconhecida: {name}")
    if bot_id and s["bots"] and bot_id not in s["bots"]:
        raise ValueError(f"skill {name} não é para o bot {bot_id}")
    inputs = {k: str(v)[:2000] for k, v in (inputs or {}).items()}
    return _VAR.sub(lambda m: inputs.get(m.group(1), ""), s["body"])
