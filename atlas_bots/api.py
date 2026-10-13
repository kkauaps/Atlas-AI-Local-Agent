"""api - endpoints Flask dos bots, jobs e aprovações (/api/bots, /api/jobs, /api/approvals)."""
from flask import jsonify, request

from . import bots, jobs, approvals, orchestrator, router, skillmd, obs


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


def iniciar():
    obs.limpar_antigos()
    jobs.iniciar(orchestrator.runner)
