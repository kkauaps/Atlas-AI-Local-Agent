"""scheduler - rotinas (routines/*.json) por cron e por evento, entregando só quando o resultado muda.

Gatilhos: cron de 5 campos (tick de 30 s), eventos internos (skills.emitir: print_saved, doc_indexed,
job_done...), arquivo alterado (polling) e webhook /api/hooks/<id> (com o token da API de memória).
Ações: prompt (skill markdown rodada por um bot, via fila de jobs) ou ação Python (health, daily_summary).
Entrega: always | changed_only (hash do resultado normalizado) | never (só log). NO_CHANGE = nada a dizer.
"""
import os
import re
import json
import time
import hashlib
import secrets
import threading
import datetime as dt

from . import BASE_DIR, db, obs, jobs, bots, skillmd, approvals, health, envfile

ROTINAS_DIR = os.path.join(BASE_DIR, "routines")
TICK_S = 30
ENTREGAS = ("always", "changed_only", "never")
ESQUEMA = """
CREATE TABLE IF NOT EXISTS routine_state(id TEXT PRIMARY KEY, last_hash TEXT, last_run REAL, last_status TEXT,
  fails INTEGER NOT NULL DEFAULT 0, last_minute TEXT, last_result TEXT, watch_sig TEXT);
CREATE TABLE IF NOT EXISTS notificacoes(id TEXT PRIMARY KEY, routine TEXT, titulo TEXT, corpo TEXT, nivel TEXT,
  created REAL NOT NULL, lida INTEGER NOT NULL DEFAULT 0);
"""
_parar = threading.Event()
_threads = []
_ID = re.compile(r"^[a-z][a-z0-9_]{1,40}$")


# ── cron ─────────────────────────────────────────────────────────────────────
_LIMITES = [(0, 59), (0, 23), (1, 31), (1, 12), (0, 7)]


def _campo(txt, lo, hi):
    vals = set()
    for parte in txt.split(","):
        passo = 1
        if "/" in parte:
            parte, p = parte.split("/", 1)
            passo = int(p)
            if passo < 1:
                raise ValueError("passo inválido")
        if parte in ("*", ""):
            a, b = lo, hi
        elif "-" in parte:
            a, b = (int(x) for x in parte.split("-", 1))
        else:
            a = b = int(parte)
        if a < lo or b > hi or a > b:
            raise ValueError(f"fora do intervalo: {txt}")
        vals.update(range(a, b + 1, passo))
    return vals


def parse_cron(expr):
    partes = str(expr or "").split()
    if len(partes) != 5:
        raise ValueError("cron precisa de 5 campos")
    campos = [_campo(p, lo, hi) for p, (lo, hi) in zip(partes, _LIMITES)]
    if 7 in campos[4]:
        campos[4] = (campos[4] - {7}) | {0}
    return campos, partes[2] != "*", partes[4] != "*"


def cron_bate(expr, quando):
    (mi, h, dom, mes, dow), dom_r, dow_r = parse_cron(expr)
    if quando.minute not in mi or quando.hour not in h or quando.month not in mes:
        return False
    d_dom, d_dow = quando.day in dom, (quando.isoweekday() % 7) in dow
    if dom_r and dow_r:
        return d_dom or d_dow                      # semântica do cron clássico
    return d_dom and d_dow


# ── rotinas ──────────────────────────────────────────────────────────────────
def validar(d):
    rid = str(d.get("id") or "")
    if not _ID.match(rid):
        raise ValueError(f"id inválido: {rid!r}")
    if not d.get("cron") and not d.get("event"):
        raise ValueError(f"{rid}: precisa de cron ou event")
    if d.get("cron"):
        parse_cron(d["cron"])
    if not d.get("action") and not d.get("prompt"):
        raise ValueError(f"{rid}: precisa de action ou prompt")
    if d.get("action") and d["action"] not in ACOES:
        raise ValueError(f"{rid}: action desconhecida")
    ev = d.get("event") or None
    if ev is not None and (not isinstance(ev, dict) or not ev.get("type")):
        raise ValueError(f"{rid}: event precisa de type")
    return {"id": rid, "bot": str(d.get("bot") or "vigia"), "cron": d.get("cron"), "event": ev,
            "prompt": d.get("prompt"), "action": d.get("action"), "inputs": d.get("inputs") or {},
            "deliver": d.get("deliver") if d.get("deliver") in ENTREGAS else "changed_only",
            "propose_memory": bool(d.get("propose_memory")), "enabled": d.get("enabled", True) is not False,
            "title": str(d.get("title") or rid)[:80]}


def carregar(pasta=None):
    pasta = pasta or ROTINAS_DIR
    out, erros = {}, []
    try:
        nomes = sorted(n for n in os.listdir(pasta) if n.endswith(".json"))
    except OSError:
        nomes = []
    for n in nomes:
        try:
            with open(os.path.join(pasta, n), encoding="utf-8") as f:
                r = validar(json.load(f))
            out[r["id"]] = r
        except (OSError, ValueError) as e:
            erros.append({"arquivo": n, "erro": str(e)[:200]})
    carregar.erros = erros
    return out


carregar.erros = []


def estado(rid):
    db.executar(ESQUEMA.split(";")[0])
    rows, _ = db.executar("SELECT * FROM routine_state WHERE id=?", (rid,))
    return rows[0] if rows else {}


def _salvar_estado(rid, **campos):
    db.executar("INSERT OR IGNORE INTO routine_state(id) VALUES(?)", (rid,))
    sets = ", ".join(f"{k}=?" for k in campos)
    db.executar(f"UPDATE routine_state SET {sets} WHERE id=?", (*campos.values(), rid))


def _init():
    with db._lock:
        con = db.conectar()
        try:
            con.executescript(ESQUEMA)
        finally:
            con.close()


def normalizar(texto):
    return re.sub(r"\s+", " ", str(texto or "")).strip().lower()


# ── disparo e entrega ────────────────────────────────────────────────────────
def disparar(r, motivo="cron", payload=None):
    """Roda a rotina. Ações Python entregam na hora; prompts viram job e entregam quando o job termina."""
    _init()
    _salvar_estado(r["id"], last_run=time.time(), last_status="running")
    obs.evento("rotina_disparo", id=r["id"], motivo=motivo)
    try:
        if r["action"]:
            res = ACOES[r["action"]](r, payload or {})
            if isinstance(res, dict) and res.get("job"):
                return res["job"]
            texto, chave = (res.get("texto"), res.get("chave")) if isinstance(res, dict) else (res, None)
            entregar(r, texto, ok=True, chave=chave)
            return None
        inputs = {**r["inputs"], **{k: json.dumps(v, ensure_ascii=False) if not isinstance(v, str) else v
                                    for k, v in (payload or {}).items()}}
        inputs.setdefault("data", time.strftime("%Y-%m-%d %H:%M"))
        tarefa = skillmd.render_skill(r["prompt"], inputs)
        b = bots.obter(r["bot"])
        return jobs.enqueue(b["id"], {"task": tarefa, "routine": r["id"], "evento": payload or {}}, kind=b["kind"])
    except Exception as e:
        entregar(r, None, ok=False, erro=f"{type(e).__name__}: {str(e)[:200]}")
        return None


def entregar(r, texto, ok=True, erro=None, chave=None):
    """Quiet-unless-changed: notifica só se não vazio, não NO_CHANGE e (changed_only) diferente da última vez."""
    _init()
    st = estado(r["id"])
    if not ok:
        fails = int(st.get("fails") or 0) + 1
        _salvar_estado(r["id"], last_status="failed", fails=fails, last_result=(erro or "")[:500])
        obs.evento("rotina_falhou", id=r["id"], erro=erro, fails=fails)
        obs.diario(f"rotina {r['id']} falhou ({fails}x)")
        return False
    texto = str(texto or "").strip()
    vazio = not texto or texto.upper().startswith("NO_CHANGE")
    h = hashlib.sha256(normalizar(chave if chave is not None else texto).encode()).hexdigest()
    mudou = h != st.get("last_hash")
    entregue = (not vazio) and r["deliver"] != "never" and (r["deliver"] == "always" or mudou)
    _salvar_estado(r["id"], last_status="ok", fails=0, last_result=texto[:2000],
                   last_hash=st.get("last_hash") if vazio else h)
    obs.evento("rotina_resultado", id=r["id"], entregue=entregue, mudou=mudou, vazio=vazio)
    if entregue:
        notificar(r["id"], r["title"], texto, nivel="erro" if "[erro]" in texto else "info")
        if r.get("propose_memory"):
            approvals.request_approval(None, "memory_propose",
                                       {"content": texto[:4000], "type": "note", "tags": ["diario"], "importance": 2},
                                       "Salvar na memória:\n" + texto[:1500])
    return entregue


def notificar(rid, titulo, corpo, nivel="info"):
    _init()
    nid = "ntf_" + secrets.token_hex(5)
    db.executar("INSERT INTO notificacoes(id, routine, titulo, corpo, nivel, created) VALUES(?,?,?,?,?,?)",
                (nid, rid, titulo, corpo[:4000], nivel, time.time()))
    obs.diario(f"aviso {titulo}: {corpo.splitlines()[0][:150] if corpo else ''}")
    try:
        import skills
        skills.emitir("notificacao", {"id": nid, "titulo": titulo, "corpo": corpo[:300], "nivel": nivel})
    except Exception:
        pass
    if envfile.get("ATLAS_TOAST", "1") != "0":
        try:
            import bandeja
            bandeja.notificar(titulo, corpo)
        except Exception:
            pass
    return nid


def notificacoes(limite=50, nao_lidas=False):
    _init()
    sql = "SELECT * FROM notificacoes" + (" WHERE lida=0" if nao_lidas else "") + " ORDER BY created DESC LIMIT ?"
    return db.executar(sql, (limite,))[0]


def marcar_lida(nid=None):
    _init()
    if nid:
        return db.executar("UPDATE notificacoes SET lida=1 WHERE id=?", (nid,))[1]
    return db.executar("UPDATE notificacoes SET lida=1 WHERE lida=0")[1]


def _ao_terminar_job(job, estado_job, result):
    """Callback da fila: entrega rotinas e registra jobs comuns no diário."""
    inp = job.get("input") if isinstance(job.get("input"), dict) else {}
    rid = inp.get("routine")
    if rid:
        r = carregar().get(rid)
        if r:
            if estado_job == "done":
                entregar(r, result if isinstance(result, str) else json.dumps(result, ensure_ascii=False))
            elif estado_job == "failed":
                entregar(r, None, ok=False, erro=json.dumps(result, ensure_ascii=False)[:300])
        return
    obs.diario(f"job {job['bot']} {estado_job}: {str(inp.get('task') or '')[:120]}")
    if estado_job == "done":
        fire_event("job_done", {"id": job["id"], "bot": job["bot"]})


# ── eventos ─────────────────────────────────────────────────────────────────
def fire_event(tipo, payload=None, rotinas=None):
    disparados = []
    for r in (rotinas or carregar()).values():
        ev = r.get("event")
        if not r["enabled"] or not ev or ev.get("type") != tipo:
            continue
        if ev.get("bot") and (payload or {}).get("bot") != ev["bot"]:
            continue
        disparar(r, "evento:" + tipo, payload)
        disparados.append(r["id"])
    return disparados


def _assinatura(caminho):
    total, maior = 0, 0.0
    for dirpath, dirs, arqs in os.walk(caminho):
        dirs[:] = [d for d in dirs if d not in (".git", "__pycache__")]
        for n in arqs:
            try:
                maior = max(maior, os.path.getmtime(os.path.join(dirpath, n)))
                total += 1
            except OSError:
                pass
    return f"{total}:{maior:.0f}"


def checar_arquivos(rotinas=None):
    disparados = []
    for r in (rotinas or carregar()).values():
        ev = r.get("event") or {}
        if not r["enabled"] or ev.get("type") != "file_changed" or not ev.get("path"):
            continue
        p = os.path.realpath(os.path.join(BASE_DIR, ev["path"]))
        if not p.startswith(BASE_DIR) or not os.path.exists(p):
            continue
        sig = _assinatura(p)
        antes = estado(r["id"]).get("watch_sig")
        if antes != sig:
            _salvar_estado(r["id"], watch_sig=sig)
            if antes is not None:
                disparar(r, "arquivo", {"path": ev["path"]})
                disparados.append(r["id"])
    return disparados


def tick(agora=None, rotinas=None):
    _init()
    agora = agora or dt.datetime.now()
    chave = agora.strftime("%Y%m%d%H%M")
    disparados = []
    for r in (rotinas or carregar()).values():
        if not r["enabled"] or not r["cron"]:
            continue
        try:
            if not cron_bate(r["cron"], agora):
                continue
        except ValueError:
            continue
        if estado(r["id"]).get("last_minute") == chave:
            continue
        _salvar_estado(r["id"], last_minute=chave)
        disparar(r, "cron")
        disparados.append(r["id"])
    checar_arquivos(rotinas)
    return disparados


# ── ações Python ─────────────────────────────────────────────────────────────
def _acao_health(r, payload):
    h = health.checar()
    chaves = ",".join(f"{a['nivel']}:{a['chave']}" for a in h["alertas"])
    if not h["alertas"]:
        anterior = estado(r["id"]).get("last_hash")
        sem_alerta = hashlib.sha256(b"ok").hexdigest()
        if anterior and anterior != sem_alerta:
            return {"texto": "Sistema normal de novo.", "chave": "ok"}
        return {"texto": "NO_CHANGE"}
    return {"texto": health.texto(h), "chave": chaves}


def _acao_resumo(r, payload):
    """Resumo do diário do dia via bot (fila); o resultado vira proposta de memória (aprovação)."""
    dia = payload.get("dia") or time.strftime("%Y-%m-%d")
    diario = obs.ler_diario(dia)
    if len(diario.strip().splitlines()) < 3:
        return {"texto": "NO_CHANGE"}
    tarefa = skillmd.render_skill(r.get("prompt") or "resumo_diario", {"dia": dia, "diario": diario[-12000:]})
    b = bots.obter(r["bot"])
    return {"job": jobs.enqueue(b["id"], {"task": tarefa, "routine": r["id"]}, kind=b["kind"])}


ACOES = {"health": _acao_health, "daily_summary": _acao_resumo}


# ── loop ────────────────────────────────────────────────────────────────────
def _loop():
    while not _parar.wait(TICK_S):
        try:
            tick()
        except Exception as e:
            obs.evento("scheduler_erro", erro=type(e).__name__)
        _salvar_estado("_scheduler", last_run=time.time(), last_status="tick")


def _ouvir_eventos():
    try:
        import skills
    except Exception:
        return
    q = skills.assinar()
    try:
        while not _parar.is_set():
            try:
                tipo, payload = q.get(timeout=5)
            except Exception:
                continue
            if tipo in ("job", "notificacao", "aprovacao", "status"):
                continue                              # job_done vem pelo callback (evita laço)
            try:
                fire_event(tipo, payload if isinstance(payload, dict) else {"valor": payload})
            except Exception as e:
                obs.evento("scheduler_erro", erro=type(e).__name__)
    finally:
        skills.desassinar(q)


def iniciar():
    if _threads:
        return
    _init()
    _parar.clear()
    if _ao_terminar_job not in jobs.ao_terminar:
        jobs.ao_terminar.append(_ao_terminar_job)
    for alvo, nome in ((_loop, "atlas-scheduler"), (_ouvir_eventos, "atlas-eventos")):
        t = threading.Thread(target=alvo, name=nome, daemon=True)
        t.start()
        _threads.append(t)


def parar():
    _parar.set()
    _threads.clear()
