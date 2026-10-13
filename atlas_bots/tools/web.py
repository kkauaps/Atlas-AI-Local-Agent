"""web_search / web_fetch: busca (SearXNG local ou DuckDuckGo HTML) e leitura de página.

Só http/https, bloqueia endereços locais/privados (SSRF), limita tamanho, extrai texto com html.parser.
Tudo volta marcado como não confiável.
"""
import re
import socket
import ipaddress
import urllib.parse
from html.parser import HTMLParser

import requests

from . import tool, untrusted
from .. import envfile

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AtlasLocal/1.0"
MAX_BYTES = 2 * 1024 * 1024
MAX_TEXTO = 12000


class ErroURL(ValueError):
    pass


def checar_url(url):
    u = urllib.parse.urlparse(str(url or "").strip())
    if u.scheme not in ("http", "https") or not u.hostname:
        raise ErroURL("only http/https URLs")
    try:
        infos = socket.getaddrinfo(u.hostname, u.port or (443 if u.scheme == "https" else 80))
    except socket.gaierror:
        raise ErroURL("host not found")
    for info in infos:
        ip = ipaddress.ip_address(info[4][0].split("%")[0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast or ip.is_unspecified:
            raise ErroURL("local/private addresses are blocked")
    return u.geturl()


class _Texto(HTMLParser):
    PULAR = {"script", "style", "noscript", "svg", "head", "nav", "footer", "form", "iframe"}
    BLOCO = {"p", "div", "br", "li", "h1", "h2", "h3", "h4", "tr", "section", "article", "pre"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.partes, self.pular, self.titulo, self._no_titulo = [], 0, "", False

    def handle_starttag(self, tag, attrs):
        if tag in self.PULAR:
            self.pular += 1
        if tag == "title":
            self._no_titulo = True
        if tag in self.BLOCO:
            self.partes.append("\n")

    def handle_endtag(self, tag):
        if tag in self.PULAR and self.pular:
            self.pular -= 1
        if tag == "title":
            self._no_titulo = False

    def handle_data(self, data):
        if self._no_titulo:
            self.titulo += data
        elif not self.pular:
            self.partes.append(data)


def html_texto(html):
    p = _Texto()
    try:
        p.feed(html)
    except Exception:
        pass
    txt = re.sub(r"[ \t\r\f\v]+", " ", "".join(p.partes))
    txt = re.sub(r"\n\s*\n+", "\n\n", txt).strip()
    return p.titulo.strip(), txt


def _get(url, params=None, timeout=15):
    r = requests.get(url, params=params, headers={"User-Agent": UA}, timeout=timeout, stream=True,
                     allow_redirects=False)
    corpo = b""
    for pedaco in r.iter_content(65536):
        corpo += pedaco
        if len(corpo) > MAX_BYTES:
            break
    r.close()
    return r, corpo.decode(r.encoding or "utf-8", errors="replace")


class _DDG(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.res, self._campo = [], None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = a.get("class") or ""
        if tag == "a" and "result__a" in cls:
            href = a.get("href") or ""
            q = urllib.parse.parse_qs(urllib.parse.urlparse(href).query)
            self.res.append({"title": "", "url": q.get("uddg", [href])[0], "snippet": ""})
            self._campo = "title"
        elif "result__snippet" in cls and self.res:
            self._campo = "snippet"

    def handle_endtag(self, tag):
        if tag in ("a", "td", "div"):
            self._campo = None

    def handle_data(self, data):
        if self._campo and self.res:
            self.res[-1][self._campo] += data


def buscar(query, n=5):
    searx = envfile.get("ATLAS_SEARXNG_URL")
    if searx:
        r = requests.get(searx.rstrip("/") + "/search", params={"q": query, "format": "json"},
                         headers={"User-Agent": UA}, timeout=15)
        return [{"title": x.get("title", ""), "url": x.get("url", ""), "snippet": x.get("content", "")}
                for x in (r.json().get("results") or [])[:n]]
    r, html = _get("https://html.duckduckgo.com/html/", params={"q": query})
    p = _DDG()
    p.feed(html)
    return [x for x in p.res if x["url"].startswith("http")][:n]


@tool("web_search", "Search the web. Returns titles, URLs and snippets (external, untrusted).",
      {"query": {"type": "string"}, "max_results": {"type": "integer"}}, ["query"])
def web_search(a, ctx):
    q = str(a.get("query") or "").strip()[:300]
    if not q:
        return {"error": "empty query"}
    try:
        n = max(1, min(int(a.get("max_results") or 5), 10))
    except (TypeError, ValueError):
        n = 5
    try:
        res = buscar(q, n)
    except Exception as e:
        return {"error": f"search failed: {type(e).__name__}"}
    linhas = "\n".join(f"{i + 1}. {r['title'].strip()} | {r['url']}\n   {r['snippet'].strip()[:300]}"
                       for i, r in enumerate(res)) or "no results"
    return {"untrusted": True, "results": len(res), "content": untrusted(linhas, "web_search")}


@tool("web_fetch", "Fetch a public web page and return its readable text (external, untrusted).",
      {"url": {"type": "string"}, "max_chars": {"type": "integer"}}, ["url"])
def web_fetch(a, ctx):
    url = a.get("url")
    try:
        for _ in range(4):                           # segue redirects checando cada destino
            url = checar_url(url)
            r, corpo = _get(url)
            if r.status_code in (301, 302, 303, 307, 308) and r.headers.get("Location"):
                url = urllib.parse.urljoin(url, r.headers["Location"])
                continue
            break
    except ErroURL as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": f"fetch failed: {type(e).__name__}"}
    if r.status_code >= 400:
        return {"error": f"HTTP {r.status_code}"}
    try:
        lim = max(500, min(int(a.get("max_chars") or MAX_TEXTO), MAX_TEXTO))
    except (TypeError, ValueError):
        lim = MAX_TEXTO
    tipo = r.headers.get("Content-Type", "")
    titulo, texto = html_texto(corpo) if "html" in tipo or corpo.lstrip().startswith("<") else ("", corpo)
    return {"untrusted": True, "url": url, "title": titulo[:200], "truncated": len(texto) > lim,
            "content": untrusted(texto[:lim], url)}
