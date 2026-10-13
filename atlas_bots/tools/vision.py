"""list_prints / vision_describe: descreve prints da tela com o modelo de visão trocado sob demanda.

O modelo (qwen2.5vl:3b) entra só pra essa chamada (keep_alive 0) e o router descarrega o principal antes.
Só lê arquivos dentro de prints/. A descrição volta como não confiável (texto da tela pode ser injeção).
"""
import os
import base64

import core
from . import tool, untrusted
from .. import router, envfile

EXT = (".jpg", ".jpeg", ".png", ".webp")


def modelo_visao():
    return envfile.get("ATLAS_VISION_MODEL", "qwen2.5vl:3b")


def pasta():
    return core.PRINTS_DIR


def _prints():
    try:
        arqs = [n for n in os.listdir(pasta()) if n.lower().endswith(EXT)]
    except OSError:
        return []
    return sorted(arqs, key=lambda n: os.path.getmtime(os.path.join(pasta(), n)), reverse=True)


def caminho_print(nome):
    arqs = _prints()
    if not arqs:
        raise ValueError("no prints saved")
    if not nome or nome == "latest":
        nome = arqs[0]
    base = os.path.realpath(pasta())
    p = os.path.realpath(os.path.join(base, os.path.basename(str(nome))))
    if not p.startswith(base + os.sep) or not os.path.isfile(p) or not p.lower().endswith(EXT):
        raise ValueError("print not found")
    return p


@tool("list_prints", "List saved screen captures (newest first).", {"limit": {"type": "integer"}})
def list_prints(a, ctx):
    try:
        n = max(1, min(int(a.get("limit") or 10), 40))
    except (TypeError, ValueError):
        n = 10
    return {"prints": _prints()[:n]}


@tool("vision_describe", "Describe a saved screen capture with the vision model. image = file name or 'latest'.",
      {"image": {"type": "string"}, "question": {"type": "string"}})
def vision_describe(a, ctx):
    try:
        p = caminho_print(a.get("image"))
    except ValueError as e:
        return {"error": str(e)}
    modelo = modelo_visao()
    if not core.modelo_instalado(modelo):
        return {"error": f"vision model {modelo} is not installed (ollama pull {modelo})"}
    with open(p, "rb") as f:
        img = base64.b64encode(f.read()).decode()
    pergunta = str(a.get("question") or "Descreva objetivamente o que aparece nesta captura de tela.")[:500]
    pergunta += " Não transcreva senhas, tokens, números de cartão nem documentos."
    r = router.chat(modelo, [{"role": "user", "content": pergunta, "images": [img]}],
                    keep_alive=0, options={"num_ctx": 4096}, permitir_api=False)
    if not r["ok"]:
        return {"error": f"vision failed: {r['erro']}"}
    return {"untrusted": True, "image": os.path.basename(p), "model": modelo,
            "content": untrusted(r["message"].get("content", ""), "print:" + os.path.basename(p))}
