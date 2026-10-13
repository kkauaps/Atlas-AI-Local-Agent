"""api - endpoints Flask dos bots, jobs e aprovações (/api/bots, /api/jobs, /api/approvals)."""
import os

from flask import jsonify, request, send_from_directory

import json
import threading

from . import BASE_DIR, bots, jobs, approvals, orchestrator, router, skillmd, obs, scheduler, health, mcp_client


def _corpo():
    d = request.get_json(silent=True)
    return d if isinstance(d, dict) else {}


def registrar(app):
    @app.route("/api/bots")
    def api_bots():
        return jsonify({"bots": [bots.publico(b) for b in bots.carregar().values()], "erros": bots.erros(),
                        "router": router.status(), "skills": sorted(skillmd.listar())})

    @app.route("/api/jobs", methods=["GET", "POST"])
    def api_jobs():
        if request.method == "POST":
            d = _corpo()
            try:
                b = bots.obter(str(d.get("bot") or "atlas"))
            except bots.ErroBot as e:
                return jsonify({"ok": False, "erro": str(e)}), 400
            task = str(d.get("task") or "").strip()
            if not task:
                return jsonify({"ok": False, "erro": "task vazia"}), 400
            return jsonify({"ok": True, "id": jobs.enqueue(b["id"], {"task": task[:8000]}, kind=b["kind"])})
        return jsonify({"jobs": jobs.listar(int(request.args.get("limite", 50)), request.args.get("estado"))})

    @app.route("/api/jobs/<jid>")
    def api_job(jid):
        j = jobs.get(jid)
        return (jsonify(j), 200) if j else (jsonify({"erro": "não encontrado"}), 404)

    @app.route("/api/jobs/<jid>/cancel", methods=["POST"])
    def api_job_cancel(jid):
        return jsonify({"ok": jobs.cancel(jid)})

    @app.route("/api/approvals")
    def api_approvals():
        return jsonify({"approvals": approvals.listar(request.args.get("estado"))})

    @app.route("/api/approvals/<aid>/<acao>", methods=["POST"])
    def api_approval_decidir(aid, acao):
        if acao not in ("approve", "reject"):
            return jsonify({"ok": False, "erro": "ação inválida"}), 400
        try:
            a = approvals.decide(aid, acao == "approve")
        except ValueError as e:
            return jsonify({"ok": False, "erro": str(e)}), 409
        return jsonify({"ok": True, "approval": a})

    @app.route("/api/atividade")
    def api_atividade():
        return jsonify({"eventos": obs.ultimos(int(request.args.get("n", 100)))})

    @app.route("/atividade")
    def atividade_page():
        return send_from_directory(os.path.join(BASE_DIR, "web"), "atividade.html")

    @app.route("/api/jobs/<jid>/trace")
    def api_job_trace(jid):
        j = jobs.get(jid)
        if not j:
            return jsonify({"erro": "não encontrado"}), 404
        cp = j.get("checkpoint") if isinstance(j.get("checkpoint"), dict) else {}
        msgs = [{"role": m.get("role"), "content": obs.redigir(m.get("content") or "", 1500),
                 "tool_calls": [(c.get("function") or {}).get("name") for c in m.get("tool_calls") or []],
                 "tool_name": m.get("tool_name")} for m in cp.get("messages") or [] if m.get("role") != "system"]
        evs = [e for e in obs.ultimos(2000) if e.get("id") == jid or e.get("job") == jid]
        filhos = [{"id": f["id"], "bot": f["bot"], "state": f["state"]} for f in jobs.listar(200) if f.get("parent_id") == jid]
        return jsonify({"job": {k: j[k] for k in ("id", "bot", "state", "attempts", "created", "updated", "result")},
                        "mensagens": msgs, "eventos": evs, "filhos": filhos})

    @app.route("/api/health")
    def api_health():
        h = health.checar()
        st = scheduler.estado("_scheduler")
        h["scheduler_ultimo_tick"] = st.get("last_run")
        h["router"] = router.status()
        return jsonify(h)

    @app.route("/api/notificacoes")
    def api_notificacoes():
        return jsonify({"notificacoes": scheduler.notificacoes(int(request.args.get("limite", 50)),
                                                               request.args.get("nao_lidas") == "1")})

    @app.route("/api/notificacoes/lidas", methods=["POST"])
    def api_notificacoes_lidas():
        return jsonify({"ok": True, "n": scheduler.marcar_lida(_corpo().get("id"))})

    @app.route("/api/rotinas")
    def api_rotinas():
        out = []
        for r in scheduler.carregar().values():
            st = scheduler.estado(r["id"])
            out.append({**r, "estado": {k: st.get(k) for k in ("last_run", "last_status", "fails", "last_result")}})
        return jsonify({"rotinas": out, "erros": scheduler.carregar.erros})

    @app.route("/api/rotinas/<rid>/rodar", methods=["POST"])
    def api_rotina_rodar(rid):
        r = scheduler.carregar().get(rid)
        if not r:
            return jsonify({"ok": False, "erro": "rotina desconhecida"}), 404
        return jsonify({"ok": True, "job": scheduler.disparar(r, "manual")})

    @app.route("/bots")
    def bots_page():
        return send_from_directory(os.path.join(BASE_DIR, "web"), "bots.html")

    @app.route("/api/bots/<bid>/memoria", methods=["GET", "POST"])
    def api_bot_memoria(bid):
        try:
            b = bots.obter(bid)
        except bots.ErroBot as e:
            return jsonify({"ok": False, "erro": str(e)}), 404
        if request.method == "GET":
            return jsonify({"id": bid, "memory": b["memory"]})
        try:
            return jsonify({"ok": True, "memory": salvar_memoria_bot(bid, _corpo())})
        except (ValueError, OSError) as e:
            return jsonify({"ok": False, "erro": str(e)[:200]}), 400

    @app.route("/api/mcp", methods=["GET", "POST"])
    def api_mcp():
        if request.method == "POST":
            mcp_client.carregar()
        return jsonify({"servidores": mcp_client.carregar.estado,
                        "ferramentas": [{"nome": n, "aprovacao": orchestrator.reg.TOOLS[n]["outbound"]}
                                        for n in mcp_client.ferramentas_mcp()]})

    @app.route("/api/hooks/<rid>", methods=["POST"])
    def api_hook(rid):
        import hmac
        import memapi
        tok = request.headers.get("X-Atlas-Token") or ""
        if not tok or not hmac.compare_digest(tok, memapi.token()):
            return jsonify({"ok": False, "erro": "token inválido"}), 401
        r = scheduler.carregar().get(rid)
        if not r or not r["enabled"] or (r.get("event") or {}).get("type") != "webhook":
            return jsonify({"ok": False, "erro": "rotina sem webhook"}), 404
        return jsonify({"ok": True, "job": scheduler.disparar(r, "webhook", _corpo())})


def salvar_memoria_bot(bid, d):
    """Grava memory.projects/scope/write no bots/<id>.json (validado antes de escrever)."""
    caminho = os.path.join(bots.BOTS_DIR, f"{bid}.json")
    with open(caminho, encoding="utf-8") as f:
        cfg = json.load(f)
    projs = d.get("projects") or []
    if isinstance(projs, str):
        projs = [p.strip() for p in projs.split(",")]
    cfg["memory"] = {"projects": [str(p)[:64] for p in projs if str(p).strip()][:20],
                     "scope": d.get("scope", "inherit"), "write": d.get("write", "propose")}
    if cfg["memory"]["write"] not in ("propose", "none"):
        raise ValueError("write deve ser propose ou none")
    novo = bots.validar(cfg)
    tmp = caminho + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(json.dumps(cfg, ensure_ascii=False) + "\n")
    os.replace(tmp, caminho)
    bots.carregar(forcar=True)
    obs.evento("bot_memoria", bot=bid, scope=novo["memory"]["scope"], projetos=len(novo["memory"]["projects"]))
    return novo["memory"]


def iniciar():
    obs.limpar_antigos()
    threading.Thread(target=mcp_client.carregar, name="atlas-mcp", daemon=True).start()
    scheduler.iniciar()                       # registra o callback antes dos workers pegarem jobs
    jobs.iniciar(orchestrator.runner)
