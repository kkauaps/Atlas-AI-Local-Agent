"""browse: navegador headless (Playwright Chromium) para páginas que precisam de JS.

Opcional: se o playwright não estiver instalado, a ferramenta só avisa. Os navegadores ficam fora do C:
(PLAYWRIGHT_BROWSERS_PATH, padrão D:\\playwright). Perfil novo a cada chamada (sem logins salvos),
todas as requisições passam pelo mesmo bloqueio de endereços locais do web_fetch. Print vai para prints/
para o vision_describe usar. Texto volta marcado como não confiável.
"""
import os
import time

import core
from . import tool, untrusted
from .web import checar_url, ErroURL
from .. import envfile

TIMEOUT_MS = 30000


def _caminho_navegadores():
    p = envfile.get("PLAYWRIGHT_BROWSERS_PATH") or (r"D:\playwright" if os.path.isdir(r"D:\playwright") else "")
    if p:
        os.environ["PLAYWRIGHT_BROWSERS_PATH"] = p
    return p


def _sync_playwright():
    from playwright.sync_api import sync_playwright
    return sync_playwright


@tool("browse", "Open a public page in a headless browser (runs JavaScript). mode=text returns the page text; "
      "mode=screenshot saves a capture to prints/ for vision_describe.",
      {"url": {"type": "string"}, "mode": {"type": "string", "enum": ["text", "screenshot"]}}, ["url"])
def browse(a, ctx):
    try:
        url = checar_url(a.get("url"))
    except ErroURL as e:
        return {"error": str(e)}
    try:
        sp = _sync_playwright()
    except ImportError:
        return {"error": "playwright is not installed (pip install playwright; "
                         "set PLAYWRIGHT_BROWSERS_PATH off C: and run: python -m playwright install chromium --only-shell)"}
    _caminho_navegadores()
    modo = a.get("mode") if a.get("mode") in ("text", "screenshot") else "text"

    def filtro(route):
        try:
            checar_url(route.request.url)
        except ErroURL:
            return route.abort()
        return route.continue_()

    try:
        with sp() as p:
            nav = p.chromium.launch(headless=True)
            try:
                ctxb = nav.new_context(java_script_enabled=True, accept_downloads=False,
                                       viewport={"width": 1280, "height": 800})
                ctxb.route("**/*", filtro)
                pg = ctxb.new_page()
                pg.goto(url, timeout=TIMEOUT_MS, wait_until="domcontentloaded")
                pg.wait_for_timeout(1500)
                titulo = pg.title()[:200]
                if modo == "screenshot":
                    os.makedirs(core.PRINTS_DIR, exist_ok=True)
                    nome = "web_" + time.strftime("%Y%m%d_%H%M%S") + ".jpg"
                    pg.screenshot(path=os.path.join(core.PRINTS_DIR, nome), type="jpeg", quality=60)
                    return {"url": pg.url, "title": titulo, "image": nome,
                            "note": "call vision_describe with this image name"}
                texto = pg.inner_text("body")[:12000]
                return {"untrusted": True, "url": pg.url, "title": titulo, "content": untrusted(texto, pg.url)}
            finally:
                nav.close()
    except Exception as e:
        return {"error": f"browser failed: {type(e).__name__}: {str(e)[:200]}"}
