"""orchestrator - loop de ferramentas de um bot + handoff (delegate) entre bots.

Reaproveita ferramentas.executar para as ferramentas de memória/grafo/docs. Ferramentas que saem
do Atlas passam pela fila de aprovação (approvals.guard) e nunca rodam sem decisão humana.
"""
import json
import time

import ferramentas
from . import bots, router, approvals, jobs, skillmd, obs

MAX_PROFUNDIDADE = 2
TIMEOUT_JOB_S = 900

DELEGATE = {"type": "function", "function": {
    "name": "delegate",
    "description": "Hand a task to another Atlas bot. mode=sync waits for the answer; background queues a job.",
    "parameters": {"type": "object", "properties": {
        "bot": {"type": "string", "description": "bot id"},
        "task": {"type": "string", "description": "self-contained task for that bot"},
        "mode": {"type": "string", "enum": ["sync", "background"]}}, "required": ["bot", "task"]}}}

USE_SKILL = {"type": "function", "function": {
    "name": "use_skill",
    "description": "Render a markdown skill template (instructions) by name with inputs.",
    "parameters": {"type": "object", "properties": {
        "name": {"type": "string"}, "inputs": {"type": "object"}}, "required": ["name"]}}}

# executores das ferramentas com aprovação (adaptadores reais chegam nas fases 2-4)
EXECUTORES = {}


def _ferramentas_do_bot(bot, cfg=None):
    """Nomes de ferramentas do ferramentas.py liberadas para o bot (interseção com as habilitadas)."""
    try:
        liberadas = ferramentas.disponiveis(cfg)
    except Exception:
        liberadas = []
    pedidas = bot["tools"]
    if "@ferramentas" in pedidas:
        return list(liberadas)
    return [t for t in pedidas if t in liberadas]


def esquemas(bot, cfg=None):
    nomes = _ferramentas_do_bot(bot, cfg)
    sch = ferramentas.esquemas(nomes)
    if bot.get("can_delegate"):
        sch.append(DELEGATE)
    if "use_skill" in bot["tools"]:
        sch.append(USE_SKILL)
    for t in bot["approval"]:
        if t in EXECUTORES:
            sch.append(EXECUTORES[t]["schema"])
    return nomes, sch


def system_prompt(bot, outros):
    txt = bots.persona(bot) or f"Você é {bot['name']}, um bot do Atlas."
    if bot.get("can_delegate") and outros:
        lista = "\n".join(f"- {b['id']}: {b['description']}" for b in outros)
        txt += "\n\nBots disponíveis para delegate:\n" + lista
    return txt


def _args(tc):
    a = (tc.get("function") or {}).get("arguments") or {}
    if isinstance(a, str):
        try:
            a = json.loads(a)
        except ValueError:
            a = {}
    return a if isinstance(a, dict) else {}


def _delegar(bot, args, ctx):
    alvo = str(args.get("bot") or "")
    tarefa = str(args.get("task") or "")[:4000]
    if alvo == bot["id"]:
        return {"error": "cannot delegate to yourself"}
    if ctx.get("profundidade", 0) >= MAX_PROFUNDIDADE:
        return {"error": "delegation depth limit"}
    try:
        b = bots.obter(alvo)
    except bots.ErroBot as e:
        return {"error": str(e)}
    if args.get("mode") == "background":
        jid = jobs.enqueue(alvo, {"task": tarefa}, parent=ctx.get("job_id"), kind=b["kind"])
        return {"job_id": jid, "state": "queued"}
    sub = dict(ctx, profundidade=ctx.get("profundidade", 0) + 1, job_id=None)
    r = run_bot(alvo, [{"role": "user", "content": tarefa}], sub, chat_fn=ctx.get("_chat_fn"))
    return {"bot": alvo, "answer": r["content"], "ok": r["ok"]}


def _com_aprovacao(bot, nome, args, ctx, checkpoint):
    """Ferramenta outbound: executa só com aprovação válida; senão pede e pausa o job."""
    jid = ctx.get("job_id")
    previa = json.dumps(args, ensure_ascii=False)[:1500]
    if jid:
        d = approvals.achar_decisao(jid, nome, args)
        if d and d["state"] == "rejected":
            return {"error": "rejected by user"}
        if d and d["state"] == "expired":
            return {"error": "approval expired"}
        if d and d["state"] == "approved" and not d["used"]:
            if not approvals.guard(nome, args, d["id"]):
                return {"error": "approval check failed"}
            ex = EXECUTORES.get(nome)
            if not ex:
                return {"error": f"tool '{nome}' approved but has no executor yet"}
            return ex["fn"](args, ctx)
        if d and d["state"] == "approved" and d["used"]:
            return {"error": "approval already used"}
        if d and d["state"] == "pending":
            raise jobs.Aguardando(d["id"], checkpoint)
        aid = approvals.request_approval(jid, nome, args, previa)
        raise jobs.Aguardando(aid, checkpoint)
    aid = approvals.request_approval(None, nome, args, previa)
    return {"pending_approval": aid, "note": "queued for user approval; it did not run"}


def executar_ferramenta(bot, tc, ctx, permitidas, checkpoint):
    nome = (tc.get("function") or {}).get("name") or ""
    args = _args(tc)
    obs.evento("tool", bot=bot["id"], tool=nome, args=args, job=ctx.get("job_id"))
    if nome == "delegate" and bot.get("can_delegate"):
        return _delegar(bot, args, ctx)
    if nome == "use_skill" and "use_skill" in bot["tools"]:
        try:
            return {"skill": args.get("name"), "text": skillmd.render_skill(args.get("name"), args.get("inputs") or {},
                                                                            bot_id=bot["id"])}
        except ValueError as e:
            return {"error": str(e)}
    if approvals.precisa(nome, bot):
        return _com_aprovacao(bot, nome, args, ctx, checkpoint)
    if nome in permitidas:
        fctx = {"chat_id": ctx.get("chat_id"), "modelo": ctx.get("modelo"), "projeto": ctx.get("projeto"),
                "cfg": ctx.get("cfg"), "permitidas": permitidas}
        return ferramentas.executar(nome, args, fctx)["resultado"]
    return {"error": f"tool '{nome}' is not available"}


def _pendentes(msgs):
    """tool_calls da última mensagem do assistente que ainda não têm resposta (retomada do checkpoint)."""
    for i in range(len(msgs) - 1, -1, -1):
        if msgs[i].get("role") == "assistant":
            calls = msgs[i].get("tool_calls") or []
            respondidas = sum(1 for m in msgs[i + 1:] if m.get("role") == "tool")
            return calls[respondidas:]
    return []


def run_bot(bot_id, messages, ctx=None, chat_fn=None, checkpoint=None, salvar=None):
    """Roda o bot até responder sem ferramentas ou estourar max_rounds.
    Devolve {"ok", "content", "messages", "rodadas"}. Em job, pode levantar jobs.Aguardando."""
    ctx = dict(ctx or {})
    chat_fn = chat_fn or router.chat
    ctx["_chat_fn"] = chat_fn
    bot = bots.obter(bot_id)
    outros = [b for b in bots.carregar().values() if b["id"] != bot_id]
    permitidas, sch = esquemas(bot, ctx.get("cfg"))
    if checkpoint:
        msgs, rodada = list(checkpoint["messages"]), int(checkpoint.get("rodada", 0))
    else:
        msgs = [{"role": "system", "content": system_prompt(bot, outros)}] + list(messages)
        rodada = 0
    inicio = time.time()
    while True:
        if ctx.get("job_id") and jobs.cancelado(ctx["job_id"]):
            raise jobs.Cancelado()
        if time.time() - inicio > TIMEOUT_JOB_S:
            return {"ok": False, "content": "timeout", "messages": msgs, "rodadas": rodada}
        pend = _pendentes(msgs)
        if not pend:
            if rodada >= bot["max_rounds"]:
                return {"ok": False, "content": "max_rounds", "messages": msgs, "rodadas": rodada}
            r = chat_fn(bot["model"], msgs, tools=sch or None, gpu=bot["kind"] == "gpu")
            rodada += 1
            if not r.get("ok"):
                return {"ok": False, "content": r.get("erro") or "erro", "messages": msgs, "rodadas": rodada}
            m = r["message"]
            msgs.append({k: m[k] for k in ("role", "content", "tool_calls") if k in m})
            if salvar:
                salvar({"messages": msgs, "rodada": rodada})
            if not m.get("tool_calls"):
                return {"ok": True, "content": m.get("content") or "", "messages": msgs, "rodadas": rodada}
            pend = m["tool_calls"]
        for tc in pend:
            cp = {"messages": msgs, "rodada": rodada}
            res = executar_ferramenta(bot, tc, ctx, permitidas, cp)
            msgs.append({"role": "tool", "content": ferramentas.resultado_texto(res) if not isinstance(res, str) else res,
                         "tool_name": (tc.get("function") or {}).get("name")})
        if salvar:
            salvar({"messages": msgs, "rodada": rodada})


def delegate(bot_id, task, background=False, ctx=None, chat_fn=None):
    b = bots.obter(bot_id)
    if background:
        return jobs.enqueue(bot_id, {"task": task}, kind=b["kind"])
    return run_bot(bot_id, [{"role": "user", "content": task}], ctx, chat_fn=chat_fn)


def runner(job, chat_fn=None):
    """Runner dos workers: roda o bot do job, retomando do checkpoint quando existir."""
    inp = job["input"] if isinstance(job["input"], dict) else {"task": str(job["input"])}
    msgs = inp.get("messages") or [{"role": "user", "content": str(inp.get("task") or "")}]
    cp = job.get("checkpoint") if isinstance(job.get("checkpoint"), dict) else None
    r = run_bot(job["bot"], msgs, {"job_id": job["id"]}, chat_fn=chat_fn, checkpoint=cp,
                salvar=lambda c: jobs.salvar_checkpoint(job["id"], c))
    if not r["ok"]:
        raise RuntimeError(r["content"])
    return r["content"]
