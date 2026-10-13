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
from . import code as _code


def raiz():
    return _code.raiz()

DRAFTS = os.path.join(BASE_DIR, "drafts")
_BRANCH = re.compile(r"^[A-Za-z0-9._/\-]{1,100}$")


def _mostrar(p):
    """Caminho do rascunho para mostrar (relativo quando der; outro disco no Windows não dá)."""
    try:
        return os.path.relpath(p, BASE_DIR).replace("\\", "/")
    except ValueError:
        return p


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
    return {"ok": True, "saved": _mostrar(p), "published": False}


@tool("email_draft", "Prepare an email. Requires approval; saves the approved draft as .eml, never sends.",
      {"to": {"type": "string"}, "subject": {"type": "string"}, "body": {"type": "string"}},
      ["to", "subject", "body"], outbound=True)
def email_draft(a, ctx):
    para, assunto = str(a.get("to") or "").strip(), str(a.get("subject") or "").strip()
    if not re.match(r"^[^@\s,;]+@[^@\s,;]+\.[^@\s,;]+$", para) or not assunto or "\n" in assunto + para:
        return {"error": "invalid to/subject"}
    eml = f"To: {para}\nSubject: {assunto}\nContent-Type: text/plain; charset=utf-8\n\n{a.get('body') or ''}\n"
    p = _salvar("email", "mensagem.eml", eml)
    return {"ok": True, "saved": _mostrar(p), "sent": False, "meta": json.dumps({"to": para})}


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


# ── envio real (só com .env configurado E aprovação de args exatos, uso único) ──
X_CHAVES = ("X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_SECRET")
X_URL = "https://api.x.com/2/tweets"


def x_configurado():
    return all(envfile.get(k) for k in X_CHAVES)


def _oauth1(metodo, url, ck, cs, tk, ts, nonce=None, stamp=None):
    """Cabeçalho OAuth 1.0a (HMAC-SHA1) só com a stdlib. Corpo JSON não entra na assinatura."""
    import hmac
    import base64
    import hashlib
    import secrets
    from urllib.parse import quote
    q = lambda s: quote(str(s), safe="~-._")  # noqa: E731
    p = {"oauth_consumer_key": ck, "oauth_nonce": nonce or secrets.token_hex(16),
         "oauth_signature_method": "HMAC-SHA1", "oauth_timestamp": str(stamp or int(time.time())),
         "oauth_token": tk, "oauth_version": "1.0"}
    base = "&".join([metodo.upper(), q(url), q("&".join(f"{q(k)}={q(v)}" for k, v in sorted(p.items())))])
    chave = f"{q(cs)}&{q(ts)}"
    p["oauth_signature"] = base64.b64encode(hmac.new(chave.encode(), base.encode(), hashlib.sha1).digest()).decode()
    return "OAuth " + ", ".join(f'{q(k)}="{q(v)}"' for k, v in sorted(p.items()))


@tool("x_post", "Publish a post on X (needs X API keys in .env AND user approval of the exact text). "
      "Without keys it only saves a draft.", {"text": {"type": "string"}, "reply_to": {"type": "string"}},
      ["text"], outbound=True)
def x_post(a, ctx):
    import requests
    texto = str(a.get("text") or "").strip().replace("\u2014", ",")
    if not texto or len(texto) > 280:
        return {"error": "text must be 1-280 chars"}
    if not x_configurado():
        r = x_post_draft({"text": texto, "reply_to": a.get("reply_to")}, ctx)
        return {**r, "note": "X API keys not configured in .env; saved as draft only"}
    corpo = {"text": texto}
    if a.get("reply_to"):
        if not re.match(r"^\d{1,25}$", str(a["reply_to"])):
            return {"error": "reply_to must be a post id"}
        corpo["reply"] = {"in_reply_to_tweet_id": str(a["reply_to"])}
    auth = _oauth1("POST", X_URL, *(envfile.get(k) for k in X_CHAVES))
    r = requests.post(X_URL, json=corpo, headers={"Authorization": auth}, timeout=20)
    if r.status_code >= 300:
        return {"error": f"X API HTTP {r.status_code}", "published": False}
    pid = (r.json().get("data") or {}).get("id")
    obs.evento("x_publicado", id=pid)
    return {"ok": True, "published": True, "id": pid}


def smtp_configurado():
    return all(envfile.get(k) for k in ("SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"))


@tool("email_send", "Send an email via SMTP (needs SMTP settings in .env AND user approval of the exact message). "
      "Without SMTP it only saves a draft.", {"to": {"type": "string"}, "subject": {"type": "string"},
                                             "body": {"type": "string"}}, ["to", "subject", "body"], outbound=True)
def email_send(a, ctx):
    import smtplib
    import ssl
    from email.message import EmailMessage
    para, assunto = str(a.get("to") or "").strip(), str(a.get("subject") or "").strip()
    if not re.match(r"^[^@\s,;]+@[^@\s,;]+\.[^@\s,;]+$", para) or not assunto or "\n" in assunto + para \
            or "\r" in assunto + para:
        return {"error": "invalid to/subject (one recipient only)"}
    if not smtp_configurado():
        r = email_draft(a, ctx)
        return {**r, "note": "SMTP not configured in .env; saved as draft only"}
    m = EmailMessage()
    m["From"], m["To"], m["Subject"] = envfile.get("SMTP_FROM"), para, assunto
    m.set_content(str(a.get("body") or ""))
    host, modo = envfile.get("SMTP_HOST"), (envfile.get("SMTP_TLS") or "starttls").lower()
    porta = int(envfile.get("SMTP_PORT") or (465 if modo == "ssl" else 587))
    tls = ssl.create_default_context()
    if modo == "ssl":
        s = smtplib.SMTP_SSL(host, porta, timeout=30, context=tls)
    else:
        s = smtplib.SMTP(host, porta, timeout=30)
        s.starttls(context=tls)
    try:
        s.login(envfile.get("SMTP_USER"), envfile.get("SMTP_PASSWORD"))
        s.send_message(m)
    finally:
        try:
            s.quit()
        except Exception:
            pass
    obs.evento("email_enviado", dominio=para.split("@")[1])
    return {"ok": True, "sent": True}


def _git(*args, timeout=120):
    r = subprocess.run(["git", *args], cwd=raiz(), capture_output=True, text=True, encoding="utf-8",
                       errors="replace", timeout=timeout, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    return r.returncode, (r.stdout + r.stderr).strip()


@tool("merge", "Merge a source branch into a target branch locally (--no-ff, never force). Requires approval. "
      "Refuses main/master unless explicitly enabled, a dirty worktree or conflicts (aborts cleanly).",
      {"source": {"type": "string"}, "target": {"type": "string"}}, ["source", "target"], outbound=True)
def merge(a, ctx):
    src, alvo = str(a.get("source") or ""), str(a.get("target") or "")
    for b in (src, alvo):
        if not _BRANCH.match(b) or b.startswith("-") or ".." in b:
            return {"error": "invalid branch name"}
    if src == alvo:
        return {"error": "source and target are the same"}
    if alvo in ("main", "master") and envfile.get("ATLAS_ALLOW_PUSH_MAIN") != "1":
        return {"error": "merge into main/master is disabled"}
    rc, sujo = _git("status", "--porcelain", "--untracked-files=no")
    if rc or sujo:
        return {"error": "worktree has uncommitted changes"}
    for b in (src, alvo):
        if _git("rev-parse", "--verify", "--quiet", f"refs/heads/{b}")[0]:
            return {"error": f"branch not found: {b}"}
    rc, original = _git("rev-parse", "--abbrev-ref", "HEAD")
    rc, out = _git("checkout", alvo)
    if rc:
        return {"error": "checkout failed", "output": out[-1000:]}
    try:
        rc, out = _git("merge", "--no-ff", "--no-edit", src)
        if rc:
            _git("merge", "--abort")
            return {"ok": False, "error": "merge conflict; aborted", "output": out[-1500:]}
        _, head = _git("rev-parse", "--short", "HEAD")
        return {"ok": True, "merged": f"{src} -> {alvo}", "commit": head, "pushed": False}
    finally:
        if original and original != alvo:
            _git("checkout", original)
