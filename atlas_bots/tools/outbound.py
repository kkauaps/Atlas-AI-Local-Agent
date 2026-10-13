"""Executores de saída (sempre atrás da fila de aprovação).

- git_push: push de um branch, nunca --force, nunca main/master sem ATLAS_ALLOW_PUSH_MAIN=1
- x_post_draft / email_draft: NÃO publicam nem enviam; gravam o rascunho aprovado em drafts/ (gitignored)
  pra você postar/enviar. Adaptadores reais (API do X, SMTP) ficam pra fase 4.
"""
import os
import re
import time
import json
import subprocess

from . import tool
from .. import BASE_DIR, envfile, obs
from .code import raiz

DRAFTS = os.path.join(BASE_DIR, "drafts")
_BRANCH = re.compile(r"^[A-Za-z0-9._/\-]{1,100}$")


def _salvar(tipo, nome, conteudo):
    d = os.path.join(DRAFTS, tipo)
    os.makedirs(d, exist_ok=True)
    p = os.path.join(d, time.strftime("%Y%m%d_%H%M%S_") + nome)
    with open(p, "w", encoding="utf-8") as f:
        f.write(conteudo)
    obs.evento("rascunho_salvo", canal=tipo, arquivo=os.path.basename(p))
    return p


@tool("git_push", "Push a branch to its remote. Requires user approval. Never force.",
      {"branch": {"type": "string"}, "remote": {"type": "string"}}, ["branch"], outbound=True)
def git_push(a, ctx):
    branch, remote = str(a.get("branch") or ""), str(a.get("remote") or "origin")
    if not _BRANCH.match(branch) or not _BRANCH.match(remote) or branch.startswith("-") or remote.startswith("-"):
        return {"error": "invalid branch/remote"}
    if branch in ("main", "master") and envfile.get("ATLAS_ALLOW_PUSH_MAIN") != "1":
        return {"error": "push to main/master is disabled"}
    r = subprocess.run(["git", "push", remote, f"{branch}:{branch}"], cwd=raiz(), capture_output=True, text=True,
                       encoding="utf-8", errors="replace", timeout=120,
                       creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    return {"ok": r.returncode == 0, "exit_code": r.returncode, "output": (r.stdout + r.stderr)[-2000:]}


@tool("x_post_draft", "Prepare a post for X. Requires approval; saves the approved draft, never publishes.",
      {"text": {"type": "string"}, "reply_to": {"type": "string"}}, ["text"], outbound=True)
def x_post_draft(a, ctx):
    texto = str(a.get("text") or "").strip()
    if not texto or len(texto) > 280:
        return {"error": "text must be 1-280 chars"}
    texto = texto.replace("\u2014", ",")                     # sem travessão
    p = _salvar("x", "post.md", (f"reply_to: {a['reply_to']}\n\n" if a.get("reply_to") else "") + texto + "\n")
    return {"ok": True, "saved": os.path.relpath(p, BASE_DIR), "published": False}


@tool("email_draft", "Prepare an email. Requires approval; saves the approved draft as .eml, never sends.",
      {"to": {"type": "string"}, "subject": {"type": "string"}, "body": {"type": "string"}},
      ["to", "subject", "body"], outbound=True)
def email_draft(a, ctx):
    para, assunto = str(a.get("to") or "").strip(), str(a.get("subject") or "").strip()
    if not re.match(r"^[^@\s,;]+@[^@\s,;]+\.[^@\s,;]+$", para) or not assunto or "\n" in assunto + para:
        return {"error": "invalid to/subject"}
    eml = f"To: {para}\nSubject: {assunto}\nContent-Type: text/plain; charset=utf-8\n\n{a.get('body') or ''}\n"
    p = _salvar("email", "mensagem.eml", eml)
    return {"ok": True, "saved": os.path.relpath(p, BASE_DIR), "sent": False, "meta": json.dumps({"to": para})}


@tool("memory_propose", "Propose a durable memory for the user to approve (saved only after approval).",
      {"content": {"type": "string"}, "type": {"type": "string"}, "tags": {"type": "array", "items": {"type": "string"}},
       "importance": {"type": "integer"}}, ["content"], outbound=True)
def memory_propose(a, ctx):
    import ferramentas
    args = {"content": str(a.get("content") or "")[:4000], "type": a.get("type") or "note",
            "tags": a.get("tags") or ["diario"], "importance": a.get("importance") or 2}
    r = ferramentas.executar("save_memory", args, {"chat_id": None, "modelo": "atlas-bots", "projeto": None,
                                                    "cfg": None, "permitidas": None})
    return r["resultado"] if r["ok"] else {"error": (r["resultado"] or {}).get("error", "save failed")}
