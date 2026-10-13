"""jobs - fila durável em SQLite com workers em threads e checkpoints.

- 1 worker de GPU (a placa só aguenta um modelo por vez) e 2 de I/O
- cada job guarda um checkpoint (lista de mensagens + rodada) e pode retomar depois de reiniciar
  ou de uma aprovação
- progresso vai pelo canal SSE existente (skills.emitir, tipo "job")
"""
import json
import time
import secrets
import threading

from . import db, obs

ESTADOS = ("queued", "running", "waiting_approval", "done", "failed", "cancelled")
WORKERS = {"gpu": 1, "io": 2}
MAX_TENTATIVAS = 2
LOTE_MAX_ESPERA_S = 120          # agrupa jobs do mesmo modelo, mas nunca deixa o mais antigo esperar mais que isso
ao_terminar = []                 # callbacks(job, estado, result) - ex.: scheduler entrega o resultado da rotina
_novo = threading.Condition()
_threads = []
_parar = threading.Event()


class Aguardando(Exception):
    """O runner levanta isso quando precisa de aprovação; o job fica em waiting_approval."""

    def __init__(self, approval_id, checkpoint):
        super().__init__(approval_id)
        self.approval_id = approval_id
        self.checkpoint = checkpoint


class Cancelado(Exception):
    pass


def _emitir(job_id, estado, extra=None):
    payload = {"id": job_id, "state": estado}
    payload.update(extra or {})
    try:
        import skills
        skills.emitir("job", payload)
    except Exception:
        pass


def enqueue(bot_id, input, parent=None, kind="gpu") -> str:
    jid = "job_" + secrets.token_hex(6)
    agora = time.time()
    db.executar("INSERT INTO jobs(id, bot, kind, input, state, parent_id, created, updated) VALUES(?,?,?,?,?,?,?,?)",
                (jid, bot_id, kind if kind in WORKERS else "gpu", json.dumps(input, ensure_ascii=False),
                 "queued", parent, agora, agora))
    obs.evento("job_criado", id=jid, bot=bot_id, kind=kind, parent=parent)
    _emitir(jid, "queued", {"bot": bot_id})
    with _novo:
        _novo.notify_all()
    return jid


def _linha(r):
    if not r:
        return None
    for k in ("input", "result", "checkpoint"):
        if r.get(k):
            try:
                r[k] = json.loads(r[k])
            except ValueError:
                pass
    return r


def get(jid):
    rows, _ = db.executar("SELECT * FROM jobs WHERE id=?", (jid,))
    return _linha(rows[0]) if rows else None


def listar(limite=50, estado=None):
    if estado:
        rows, _ = db.executar("SELECT * FROM jobs WHERE state=? ORDER BY created DESC LIMIT ?", (estado, limite))
    else:
        rows, _ = db.executar("SELECT * FROM jobs ORDER BY created DESC LIMIT ?", (limite,))
    return [_linha(r) for r in rows]


def salvar_checkpoint(jid, checkpoint):
    db.executar("UPDATE jobs SET checkpoint=?, updated=? WHERE id=?",
                (json.dumps(checkpoint, ensure_ascii=False), time.time(), jid))
    _emitir(jid, "running", {"rodada": (checkpoint or {}).get("rodada")})


def cancelado(jid) -> bool:
    rows, _ = db.executar("SELECT cancel FROM jobs WHERE id=?", (jid,))
    return bool(rows and rows[0]["cancel"])


def cancel(jid) -> bool:
    _, n = db.executar("UPDATE jobs SET cancel=1, state=CASE WHEN state IN ('queued','waiting_approval') "
                       "THEN 'cancelled' ELSE state END, updated=? WHERE id=? AND state NOT IN ('done','failed','cancelled')",
                       (time.time(), jid))
    if n:
        obs.evento("job_cancelado", id=jid)
        _emitir(jid, "cancelled")
    return bool(n)


def retomar(jid):
    """Depois de uma decisão de aprovação: volta pra fila mantendo o checkpoint."""
    _, n = db.executar("UPDATE jobs SET state='queued', updated=? WHERE id=? AND state='waiting_approval'",
                       (time.time(), jid))
    if n:
        _emitir(jid, "queued")
        with _novo:
            _novo.notify_all()
    return bool(n)


def recuperar():
    """No start: jobs que ficaram 'running' quando o Atlas caiu voltam pra fila (retomam do checkpoint)."""
    _, n = db.executar("UPDATE jobs SET state='queued', updated=? WHERE state='running'", (time.time(),))
    return n


def _pegar(kind):
    """Reserva atomicamente o próximo job da fila deste tipo."""
    with db._lock:
        rows, _ = db.executar("SELECT id, bot, created FROM jobs WHERE state='queued' AND kind=? AND cancel=0 "
                              "ORDER BY created LIMIT 20", (kind,))
        if not rows:
            return None
        jid = _escolher(rows) if kind == "gpu" else rows[0]["id"]
        _, n = db.executar("UPDATE jobs SET state='running', attempts=attempts+1, updated=? WHERE id=? AND state='queued'",
                           (time.time(), jid))
        return get(jid) if n else None


def _modelo_do_bot(bid):
    try:
        from . import bots, router
        return router.resolver(bots.obter(bid)["model"])
    except Exception:
        return None


def _escolher(rows):
    """Lote por modelo: se o mais antigo não espera há muito, prefere um job cujo modelo já está na GPU
    (evita trocar de modelo a cada job, cada troca custa segundos)."""
    from . import router
    import core
    atual = router.residente()
    if not atual or time.time() - rows[0]["created"] > LOTE_MAX_ESPERA_S:
        return rows[0]["id"]
    for r in rows:
        m = _modelo_do_bot(r["bot"])
        if m and core.mesmo_modelo(m, atual):
            return r["id"]
    return rows[0]["id"]


def _avisar_fim(jid, estado, result):
    if not ao_terminar:
        return
    job = get(jid)
    for cb in list(ao_terminar):
        try:
            cb(job, estado, result)
        except Exception as e:
            obs.evento("callback_erro", id=jid, erro=type(e).__name__)


def _finalizar(jid, estado, result=None):
    db.executar("UPDATE jobs SET state=?, result=?, updated=? WHERE id=?",
                (estado, json.dumps(result, ensure_ascii=False) if result is not None else None, time.time(), jid))
    obs.evento("job_" + estado, id=jid)
    _emitir(jid, estado, {"result": result if isinstance(result, (str, type(None))) else None})
    _avisar_fim(jid, estado, result)


def processar(job, runner):
    """Roda um job já reservado. runner(job) -> result; pode levantar Aguardando/Cancelado."""
    jid = job["id"]
    obs.evento("job_inicio", id=jid, bot=job["bot"], tentativa=job["attempts"])
    _emitir(jid, "running", {"bot": job["bot"]})
    try:
        res = runner(job)
    except Aguardando as w:
        salvar_checkpoint(jid, w.checkpoint)
        db.executar("UPDATE jobs SET state='waiting_approval', updated=? WHERE id=?", (time.time(), jid))
        obs.evento("job_aguardando", id=jid, aprovacao=w.approval_id)
        _emitir(jid, "waiting_approval", {"approval": w.approval_id})
        return "waiting_approval"
    except Cancelado:
        _finalizar(jid, "cancelled")
        return "cancelled"
    except Exception as e:
        if job["attempts"] < MAX_TENTATIVAS:
            db.executar("UPDATE jobs SET state='queued', updated=? WHERE id=?", (time.time(), jid))
            obs.evento("job_retentativa", id=jid, erro=type(e).__name__)
            return "queued"
        _finalizar(jid, "failed", {"error": f"{type(e).__name__}: {str(e)[:300]}"})
        return "failed"
    _finalizar(jid, "done", res)
    return "done"


def rodar_um(kind, runner) -> bool:
    job = _pegar(kind)
    if not job:
        return False
    processar(job, runner)
    return True


def worker_loop(kind, runner):
    while not _parar.is_set():
        try:
            if rodar_um(kind, runner):
                continue
        except Exception as e:
            obs.evento("worker_erro", kind=kind, erro=type(e).__name__)
        with _novo:
            _novo.wait(timeout=5)


def iniciar(runner):
    if _threads:
        return
    _parar.clear()
    recuperar()
    for kind, n in WORKERS.items():
        for i in range(n):
            t = threading.Thread(target=worker_loop, args=(kind, runner), name=f"atlas-job-{kind}-{i}", daemon=True)
            t.start()
            _threads.append(t)


def parar():
    _parar.set()
    with _novo:
        _novo.notify_all()
    for t in _threads:
        t.join(timeout=2)
    _threads.clear()
