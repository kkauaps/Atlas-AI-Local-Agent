"""approvals - fila de aprovação para ações que saem do Atlas.

Ferramenta marcada como outbound (ou listada em bot.approval) nunca roda direto: vira um pedido
pendente. A aprovação é amarrada ao hash dos argumentos exatos e só pode ser usada uma vez,
então o modelo não consegue reaproveitar nem alterar o que foi aprovado.
"""
import json
import time
import hashlib
import secrets

from . import db, obs

# ferramentas que sempre exigem aprovação (as de fora entram nas próximas fases)
OUTBOUND = {"memory_propose", "x_post_draft", "email_draft", "git_push", "merge", "shell_write", "delete_file", "send_message"}
EXPIRA_S = 7 * 86400


def hash_args(tool, args) -> str:
    bruto = json.dumps({"tool": tool, "args": args}, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(bruto.encode("utf-8")).hexdigest()


def precisa(tool, bot=None) -> bool:
    return tool in OUTBOUND or tool.startswith("mcp.") or (bot is not None and tool in (bot.get("approval") or []))


def request_approval(job_id, tool, args, preview="") -> str:
    aid = "apr_" + secrets.token_hex(6)
    db.executar("INSERT INTO approvals(id, job_id, tool, args_json, args_hash, preview, state, created) "
                "VALUES(?,?,?,?,?,?,?,?)",
                (aid, job_id, tool, json.dumps(args, ensure_ascii=False), hash_args(tool, args),
                 str(preview or "")[:4000], "pending", time.time()))
    obs.evento("aprovacao_pedida", id=aid, job=job_id, tool=tool)
    try:
        import skills
        skills.emitir("aprovacao", {"id": aid, "tool": tool, "job": job_id, "preview": str(preview)[:300]})
    except Exception:
        pass
    return aid


def obter(aid):
    rows, _ = db.executar("SELECT * FROM approvals WHERE id=?", (aid,))
    if not rows:
        return None
    a = rows[0]
    a["args"] = json.loads(a.pop("args_json") or "{}")
    return a


def listar(estado=None, limite=100):
    _expirar()
    if estado:
        rows, _ = db.executar("SELECT * FROM approvals WHERE state=? ORDER BY created DESC LIMIT ?", (estado, limite))
    else:
        rows, _ = db.executar("SELECT * FROM approvals ORDER BY created DESC LIMIT ?", (limite,))
    for a in rows:
        a["args"] = json.loads(a.pop("args_json") or "{}")
    return rows


def _expirar():
    db.executar("UPDATE approvals SET state='expired', decided=? WHERE state='pending' AND created<?",
                (time.time(), time.time() - EXPIRA_S))


def decide(aid, ok) -> dict:
    """Aprova/rejeita um pedido pendente e acorda o job que estava esperando."""
    _expirar()
    novo = "approved" if ok else "rejected"
    _, n = db.executar("UPDATE approvals SET state=?, decided=? WHERE id=? AND state='pending'",
                       (novo, time.time(), aid))
    if not n:
        raise ValueError("aprovação inexistente ou já decidida")
    a = obter(aid)
    obs.evento("aprovacao_decidida", id=aid, tool=a["tool"], estado=novo)
    obs.diario(f"aprovação {novo}: {a['tool']}")
    if a.get("job_id"):
        from . import jobs
        jobs.retomar(a["job_id"])
    elif ok:
        a["result"] = _executar_sem_job(a)
    return a


def _executar_sem_job(a):
    """Pedido criado fora de um job (rotina, chat direto): aprovado roda na hora, pelo mesmo guard."""
    from .orchestrator import EXECUTORES
    ex = EXECUTORES.get(a["tool"])
    if not ex:
        return {"error": "no executor"}
    if not guard(a["tool"], a["args"], a["id"]):
        return {"error": "approval check failed"}
    try:
        res = ex["fn"](a["args"], {"approval_id": a["id"]})
    except Exception as e:
        res = {"error": f"{type(e).__name__}: {str(e)[:200]}"}
    obs.evento("aprovacao_executada", id=a["id"], tool=a["tool"], ok=not (isinstance(res, dict) and res.get("error")))
    return res


def guard(tool, args, approval_id) -> bool:
    """Checagem do executor: só passa com aprovação aprovada, não usada, para exatamente esses args.
    Consome a aprovação (uso único)."""
    if not approval_id:
        return False
    _, n = db.executar("UPDATE approvals SET used=1 WHERE id=? AND state='approved' AND used=0 AND tool=? "
                       "AND args_hash=?", (approval_id, tool, hash_args(tool, args)))
    return n == 1


def achar_decisao(job_id, tool, args):
    """Pedido já existente deste job para os mesmos args (para retomar sem pedir de novo)."""
    rows, _ = db.executar("SELECT id, state, used FROM approvals WHERE job_id=? AND tool=? AND args_hash=? "
                          "ORDER BY created DESC LIMIT 1", (job_id, tool, hash_args(tool, args)))
    return rows[0] if rows else None
