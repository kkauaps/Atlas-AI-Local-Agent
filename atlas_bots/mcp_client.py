"""mcp_client - cliente MCP (stdio e HTTP) sem SDK, importando ferramentas remotas para os bots.

Config em mcp.json na raiz (gitignored; veja mcp.example.json):
  {"servers": {"github": {"command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"],
                          "env": {"GITHUB_TOKEN": "${GITHUB_TOKEN}"}, "allow": ["search_issues"]},
               "remoto": {"url": "https://exemplo/mcp", "headers": {"Authorization": "Bearer ${MEU_TOKEN}"}}}}
- ${VAR} é lido do ambiente/.env (o segredo nunca fica no mcp.json versionado)
- ferramentas viram mcp__<servidor>__<ferramenta>; exigem aprovação, exceto as listadas em "allow"
- resultados voltam marcados como não confiáveis
"""
import os
import re
import json
import itertools
import threading
import subprocess

import requests

from . import BASE_DIR, envfile, obs
from .tools import TOOLS, untrusted

PROTOCOLO = "2025-06-18"
TIMEOUT = 30
_NOME = re.compile(r"[^A-Za-z0-9_\-]")
_clientes = {}
_lock = threading.Lock()


def caminho():
    return os.path.join(BASE_DIR, "mcp.json")


def _expandir(v):
    if isinstance(v, str):
        return re.sub(r"\$\{([A-Za-z_][A-Za-z0-9_]*)\}", lambda m: envfile.get(m.group(1), "") or "", v)
    if isinstance(v, list):
        return [_expandir(x) for x in v]
    if isinstance(v, dict):
        return {k: _expandir(x) for k, x in v.items()}
    return v


class ErroMCP(RuntimeError):
    pass


class _Base:
    def __init__(self, nome, cfg):
        self.nome, self.cfg, self._ids = nome, cfg, itertools.count(1)

    def iniciar(self):
        r = self.rpc("initialize", {"protocolVersion": PROTOCOLO, "capabilities": {},
                                    "clientInfo": {"name": "atlas", "version": "1.0"}})
        self.notificar("notifications/initialized")
        return r

    def listar(self):
        tools, cursor = [], None
        for _ in range(20):
            r = self.rpc("tools/list", {"cursor": cursor} if cursor else {})
            tools += r.get("tools") or []
            cursor = r.get("nextCursor")
            if not cursor:
                break
        return tools

    def chamar(self, ferramenta, args):
        return self.rpc("tools/call", {"name": ferramenta, "arguments": args or {}})

    def _resposta(self, msg, mid):
        if msg.get("id") != mid:
            return None
        if msg.get("error"):
            raise ErroMCP(str(msg["error"].get("message") or msg["error"])[:300])
        return msg.get("result") or {}


class Stdio(_Base):
    def __init__(self, nome, cfg):
        super().__init__(nome, cfg)
        env = dict(os.environ)
        env.update({k: str(v) for k, v in _expandir(cfg.get("env") or {}).items()})
        self.proc = subprocess.Popen([cfg["command"], *_expandir(cfg.get("args") or [])], stdin=subprocess.PIPE,
                                     stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, env=env, text=True,
                                     encoding="utf-8", bufsize=1, cwd=cfg.get("cwd") or None,
                                     creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        self._lock = threading.Lock()

    def _enviar(self, msg):
        self.proc.stdin.write(json.dumps(msg) + "\n")
        self.proc.stdin.flush()

    def notificar(self, metodo, params=None):
        with self._lock:
            self._enviar({"jsonrpc": "2.0", "method": metodo, **({"params": params} if params else {})})

    def rpc(self, metodo, params=None):
        with self._lock:
            mid = next(self._ids)
            self._enviar({"jsonrpc": "2.0", "id": mid, "method": metodo, "params": params or {}})
            res, fim = [None], threading.Event()

            def ler():
                for linha in self.proc.stdout:
                    try:
                        msg = json.loads(linha)
                    except ValueError:
                        continue
                    if msg.get("id") == mid:
                        res[0] = msg
                        break
                fim.set()

            t = threading.Thread(target=ler, daemon=True)
            t.start()
            if not fim.wait(TIMEOUT) or res[0] is None:
                raise ErroMCP("timeout/servidor fechou")
            return self._resposta(res[0], mid)

    def fechar(self):
        try:
            self.proc.terminate()
        except Exception:
            pass


class Http(_Base):
    """Streamable HTTP: POST JSON-RPC; resposta em JSON ou SSE; sessão via Mcp-Session-Id."""

    def __init__(self, nome, cfg):
        super().__init__(nome, cfg)
        self.url, self.sessao = _expandir(cfg["url"]), None

    def _post(self, msg):
        h = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream",
             "MCP-Protocol-Version": PROTOCOLO, **_expandir(self.cfg.get("headers") or {})}
        if self.sessao:
            h["Mcp-Session-Id"] = self.sessao
        r = requests.post(self.url, json=msg, headers=h, timeout=TIMEOUT)
        self.sessao = r.headers.get("Mcp-Session-Id") or self.sessao
        if r.status_code >= 400:
            raise ErroMCP(f"HTTP {r.status_code}")
        return r

    def notificar(self, metodo, params=None):
        self._post({"jsonrpc": "2.0", "method": metodo, **({"params": params} if params else {})})

    def rpc(self, metodo, params=None):
        mid = next(self._ids)
        r = self._post({"jsonrpc": "2.0", "id": mid, "method": metodo, "params": params or {}})
        if "text/event-stream" in r.headers.get("Content-Type", ""):
            for linha in r.text.splitlines():
                if linha.startswith("data:"):
                    try:
                        out = self._resposta(json.loads(linha[5:].strip()), mid)
                    except ValueError:
                        continue
                    if out is not None:
                        return out
            raise ErroMCP("resposta SSE sem resultado")
        out = self._resposta(r.json(), mid)
        if out is None:
            raise ErroMCP("resposta sem id correspondente")
        return out

    def fechar(self):
        pass


def nome_tool(servidor, ferramenta):
    return f"mcp__{_NOME.sub('_', servidor)}__{_NOME.sub('_', ferramenta)}"[:64]


def texto_resultado(res):
    partes = []
    for c in res.get("content") or []:
        if c.get("type") == "text":
            partes.append(c.get("text") or "")
        else:
            partes.append(f"[{c.get('type')} omitido]")
    if res.get("structuredContent") and not partes:
        partes.append(json.dumps(res["structuredContent"], ensure_ascii=False))
    return "\n".join(partes)[:12000]


def _registrar(servidor, cli, t, permitidas):
    nome = nome_tool(servidor, t["name"])
    remoto = t["name"]

    def fn(args, ctx):
        try:
            res = cli.chamar(remoto, args)
        except Exception as e:
            return {"error": f"mcp {servidor}: {str(e)[:200]}"}
        return {"untrusted": True, "is_error": bool(res.get("isError")),
                "content": untrusted(texto_resultado(res), f"mcp:{servidor}/{remoto}")}

    schema = t.get("inputSchema") or {"type": "object", "properties": {}}
    TOOLS[nome] = {"name": nome, "fn": fn, "outbound": remoto not in permitidas, "mcp": servidor,
                   "schema": {"type": "function", "function": {
                       "name": nome, "description": f"[MCP {servidor}] " + str(t.get("description") or "")[:500],
                       "parameters": schema}}}
    return nome


def ler_config(p=None):
    try:
        with open(p or caminho(), encoding="utf-8") as f:
            d = json.load(f)
    except FileNotFoundError:
        return {}
    except (OSError, ValueError) as e:
        raise ErroMCP(f"mcp.json inválido: {e}")
    return d.get("servers") or d.get("mcpServers") or {}


def carregar(p=None, fabrica=None):
    """(Re)conecta todos os servidores e registra as ferramentas. Devolve {servidor: {ok, tools|erro}}."""
    fabrica = fabrica or (lambda nome, cfg: Http(nome, cfg) if cfg.get("url") else Stdio(nome, cfg))
    with _lock:
        for n in [n for n, t in TOOLS.items() if t.get("mcp")]:
            TOOLS.pop(n, None)
        for c in _clientes.values():
            c.fechar()
        _clientes.clear()
        estado = {}
        try:
            servidores = ler_config(p)
        except ErroMCP as e:
            return {"_config": {"ok": False, "erro": str(e)}}
        for nome, cfg in servidores.items():
            if cfg.get("disabled"):
                continue
            try:
                cli = fabrica(nome, cfg)
                cli.iniciar()
                nomes = [_registrar(nome, cli, t, set(cfg.get("allow") or [])) for t in cli.listar()]
                _clientes[nome] = cli
                estado[nome] = {"ok": True, "tools": nomes}
            except Exception as e:
                estado[nome] = {"ok": False, "erro": f"{type(e).__name__}: {str(e)[:200]}"}
            obs.evento("mcp_servidor", servidor=nome, ok=estado[nome]["ok"])
        carregar.estado = estado
        return estado


carregar.estado = {}


def ferramentas_mcp():
    return [n for n, t in TOOLS.items() if t.get("mcp")]
