"""Teste ao vivo: mede a VRAM ao trocar modelo principal <-> visão pelo router (precisa do Ollama ligado).

    python scripts/vram_swap_test.py [modelo_principal]
Não grava nada no repo; a imagem de teste vai para a pasta temporária e é apagada.
"""
import os
import sys
import time
import base64
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import requests  # noqa: E402
import core  # noqa: E402
from atlas_bots import router  # noqa: E402


def ps():
    try:
        return [(m["name"], round(m.get("size_vram", 0) / 2**30, 2))
                for m in requests.get(f"{core.OLLAMA}/api/ps", timeout=5).json().get("models", [])]
    except Exception:
        return []


def passo(nome, fn):
    t = time.time()
    r = fn()
    time.sleep(1)
    print(f"{nome:<28} ok={r['ok']!s:<5} {time.time() - t:6.1f}s  vram_total={router.vram_mb()} MB  carregados={ps()}")
    return r


def imagem():
    from PIL import Image, ImageDraw
    img = Image.new("RGB", (640, 240), "white")
    ImageDraw.Draw(img).text((20, 100), "Atlas VRAM test: invoice INV-0042 total 120.00", fill="black")
    p = os.path.join(tempfile.gettempdir(), "atlas_vram_test.jpg")
    img.save(p, "JPEG")
    with open(p, "rb") as f:
        b = base64.b64encode(f.read()).decode()
    os.remove(p)
    return b


if __name__ == "__main__":
    principal = sys.argv[1] if len(sys.argv) > 1 else router.principal()
    router.principal = lambda: principal
    visao = "qwen2.5vl:3b"
    print("base", router.vram_mb(), "MB", ps())
    core.descarregar_modelos()
    time.sleep(2)
    print(f"{'vazio':<28} vram_total={router.vram_mb()} MB")
    msg = [{"role": "user", "content": "Responda só: ok"}]
    passo(f"principal {principal}", lambda: router.chat("default", msg, options={"num_ctx": 4096}))
    img = imagem()
    r = passo(f"visao {visao}", lambda: router.chat(visao, [{"role": "user", "content": "What text is in the image?",
                                                               "images": [img]}], keep_alive=0, permitir_api=False))
    print("   resposta visao:", (r["message"].get("content") or "")[:120].replace("\n", " "))
    passo(f"principal de novo", lambda: router.chat("default", msg, options={"num_ctx": 4096}))
    core.descarregar_modelos()
    time.sleep(2)
    print(f"{'descarregado':<28} vram_total={router.vram_mb()} MB")
