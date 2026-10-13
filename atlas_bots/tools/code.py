"""Ferramentas de código do bot dev: read_file, list_dir, grep, edit_file, run_tests, shell, shell_write.

Tudo preso a uma raiz (ATLAS_DEV_ROOT no .env, padrão: a pasta do Atlas). Arquivos pessoais e segredos
nunca são lidos nem editados. shell roda só comandos de leitura de uma lista; o resto é shell_write,
que é outbound (só roda depois de aprovado). edit_file também fica atrás de aprovação no bot dev.
"""
import os
import re
import sys
import shlex
import subprocess

from . import tool, untrusted
from .. import BASE_DIR, envfile

PROIBIDOS = re.compile(r"(^|[\\/])(memorias?\.json|memorias_vetores\.json|conversas\.json|grafo\.json|config\.json|"
                       r"observacoes\.json|lembretes\.json|acoes_ia\.json|jobs\.db.*|mcp\.json|\.env(\.[^\\/]*)?|"
                       r"id_rsa.*|.*\.pem|.*\.key)$|(^|[\\/])(\.git|prints|logs|browser_profile)([\\/]|$)")
PERMITIDOS = re.compile(r"(^|[\\/])\.env\.example$")
PULAR_DIRS = {".git", "node_modules", "__pycache__", ".pytest_cache", "venv", ".venv", "prints", "logs", "dist", "build"}
MAX_LER = 60000
_SAIDA = 8000

# comandos de leitura liberados (primeiro token + subcomando quando houver)
LEITURA = {"git": {"status", "log", "diff", "show", "branch", "rev-parse", "ls-files", "blame", "remote"},
           "python": {"--version", "-V"}, "py": {"--version", "-V"}, "pip": {"list", "show", "freeze"},
           "node": {"--version"}, "npm": {"ls", "--version"}, "where": None, "whoami": None}
_PERIGO = re.compile(r"[|&;<>`$]|\b(--output|-o)\b")


def raiz():
    return os.path.realpath(envfile.get("ATLAS_DEV_ROOT") or BASE_DIR)


def resolver(rel, deve_existir=True):
    base = raiz()
    p = os.path.realpath(os.path.join(base, str(rel or ".")))
    if p != base and not p.startswith(base + os.sep):
        raise ValueError("path outside the workspace")
    relp = os.path.relpath(p, base)
    if relp != "." and PROIBIDOS.search(relp) and not PERMITIDOS.search(relp):
        raise ValueError("path is private/blocked")
    if deve_existir and not os.path.exists(p):
        raise ValueError("path not found")
    return p


def _rel(p):
    return os.path.relpath(p, raiz()).replace("\\", "/")


@tool("read_file", "Read a text file in the workspace (optionally a line range).",
      {"path": {"type": "string"}, "start": {"type": "integer"}, "end": {"type": "integer"}}, ["path"])
def read_file(a, ctx):
    p = resolver(a.get("path"))
    if not os.path.isfile(p):
        return {"error": "not a file"}
    with open(p, encoding="utf-8", errors="replace") as f:
        linhas = f.readlines()
    ini = max(1, int(a.get("start") or 1))
    fim = min(len(linhas), int(a.get("end") or len(linhas)))
    txt = "".join(f"{i}|{linhas[i - 1]}" for i in range(ini, fim + 1))
    return {"path": _rel(p), "lines": len(linhas), "truncated": len(txt) > MAX_LER,
            "content": untrusted(txt[:MAX_LER], _rel(p))}


@tool("list_dir", "List files and folders in a workspace directory.", {"path": {"type": "string"}})
def list_dir(a, ctx):
    p = resolver(a.get("path") or ".")
    if not os.path.isdir(p):
        return {"error": "not a directory"}
    itens = []
    for n in sorted(os.listdir(p))[:300]:
        q = os.path.join(p, n)
        relq = _rel(q)
        if PROIBIDOS.search(relq) and not PERMITIDOS.search(relq):
            continue
        itens.append(n + ("/" if os.path.isdir(q) else ""))
    return {"path": _rel(p), "items": itens}


@tool("grep", "Search a regex in workspace files. Returns file:line: text.",
      {"pattern": {"type": "string"}, "path": {"type": "string"}, "glob": {"type": "string"}}, ["pattern"])
def grep(a, ctx):
    try:
        rx = re.compile(str(a.get("pattern") or ""))
    except re.error as e:
        return {"error": f"bad regex: {e}"}
    base = resolver(a.get("path") or ".")
    ext = str(a.get("glob") or "").lstrip("*")
    achados = []
    for dirpath, dirs, arqs in os.walk(base):
        dirs[:] = [d for d in dirs if d not in PULAR_DIRS]
        for n in arqs:
            q = os.path.join(dirpath, n)
            relq = _rel(q)
            if (ext and not n.endswith(ext)) or (PROIBIDOS.search(relq) and not PERMITIDOS.search(relq)):
                continue
            try:
                if os.path.getsize(q) > 2_000_000:
                    continue
                with open(q, encoding="utf-8", errors="strict") as f:
                    for i, linha in enumerate(f, 1):
                        if rx.search(linha):
                            achados.append(f"{relq}:{i}: {linha.rstrip()[:200]}")
                            if len(achados) >= 200:
                                break
            except (UnicodeDecodeError, OSError):
                continue
            if len(achados) >= 200:
                break
    return {"matches": len(achados), "content": untrusted("\n".join(achados) or "no matches", "grep")}


@tool("edit_file", "Edit a file with an exact search/replace block (search must match exactly once). "
      "Empty search with a new path creates the file.",
      {"path": {"type": "string"}, "search": {"type": "string"}, "replace": {"type": "string"}},
      ["path", "replace"])
def edit_file(a, ctx):
    busca, troca = str(a.get("search") or ""), str(a.get("replace") or "")
    if not busca:
        p = resolver(a.get("path"), deve_existir=False)
        if os.path.exists(p):
            return {"error": "file exists; give a search block"}
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w", encoding="utf-8", newline="") as f:
            f.write(troca)
        return {"ok": True, "created": _rel(p)}
    p = resolver(a.get("path"))
    with open(p, encoding="utf-8", newline="") as f:
        s = f.read()
    crlf = "\r\n" in s
    if crlf:
        busca, troca = busca.replace("\r\n", "\n").replace("\n", "\r\n"), troca.replace("\r\n", "\n").replace("\n", "\r\n")
    n = s.count(busca)
    if n != 1:
        return {"error": f"search block matched {n} times (must be exactly 1)"}
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(s.replace(busca, troca))
    return {"ok": True, "edited": _rel(p)}


def _rodar(args, timeout=120):
    try:
        r = subprocess.run(args, cwd=raiz(), capture_output=True, text=True, encoding="utf-8", errors="replace",
                           timeout=timeout, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        saida = (r.stdout or "") + (("\n[stderr]\n" + r.stderr) if r.stderr else "")
        return {"exit_code": r.returncode, "content": untrusted(saida[-_SAIDA:], " ".join(args[:3]))}
    except subprocess.TimeoutExpired:
        return {"error": f"timeout after {timeout}s"}
    except FileNotFoundError:
        return {"error": "command not found"}


@tool("run_tests", "Run pytest in the workspace (optionally a path or -k expression).",
      {"path": {"type": "string"}, "k": {"type": "string"}})
def run_tests(a, ctx):
    args = [sys.executable, "-m", "pytest", "-q", "--no-header", "-p", "no:cacheprovider"]
    if a.get("path"):
        args.append(_rel(resolver(a["path"])))
    if a.get("k"):
        args += ["-k", str(a["k"])[:200]]
    return _rodar(args, timeout=600)


def _dividir(cmd):
    cmd = str(cmd or "").strip()
    if not cmd or len(cmd) > 500:
        raise ValueError("empty or too long command")
    return shlex.split(cmd, posix=os.name != "nt")


def eh_leitura(cmd) -> bool:
    try:
        args = _dividir(cmd)
    except ValueError:
        return False
    if _PERIGO.search(cmd):
        return False
    subs = LEITURA.get(args[0].lower().removesuffix(".exe"), False)
    if subs is False:
        return False
    return subs is None or (len(args) > 1 and args[1] in subs)


@tool("shell", "Run a READ-ONLY command in the workspace (git status/log/diff/show, pip list...). "
      "Anything that writes must use shell_write, which needs user approval.", {"command": {"type": "string"}},
      ["command"])
def shell(a, ctx):
    cmd = a.get("command")
    if not eh_leitura(cmd):
        return {"error": "not a read-only command; use shell_write (requires user approval)"}
    return _rodar(_dividir(cmd))


@tool("shell_write", "Run a command that changes files in the workspace. Always requires user approval.",
      {"command": {"type": "string"}}, ["command"], outbound=True)
def shell_write(a, ctx):
    args = _dividir(a.get("command"))
    if args[0].lower() in ("rm", "del", "rmdir", "format", "rd") or "--force" in args or "-f" in args[:3] and args[0] == "git":
        return {"error": "destructive command refused"}
    return _rodar(args, timeout=300)
