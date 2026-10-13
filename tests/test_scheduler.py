"""Fase 3: cron, eventos, quiet-unless-changed, resumo noturno com aprovação, vigia, lote por modelo,
API depois de 2 falhas locais, browser opcional e endpoints de atividade."""
import os
import json
import time
import datetime as dt
import unittest
from unittest import mock

import bots_util as u
import core
from atlas_bots import scheduler as sc, jobs, approvals, obs, health, router, orchestrator, db
from atlas_bots.tools import browser


def rot(**d):
    base = {"id": "r1", "bot": "atlas", "cron": "*/5 * * * *", "prompt": "morning_brief", "deliver": "changed_only"}
    base.update(d)
    return sc.validar(base)


class TestCron(unittest.TestCase):
    def test_parse_e_bate(self):
        t = dt.datetime(2026, 10, 13, 8, 0)                # terça
        self.assertTrue(sc.cron_bate("0 8 * * 1-5", t))
        self.assertFalse(sc.cron_bate("0 8 * * 0,6", t))
        self.assertTrue(sc.cron_bate("*/10 * * * *", t.replace(minute=30)))
        self.assertFalse(sc.cron_bate("*/10 * * * *", t.replace(minute=31)))
        self.assertTrue(sc.cron_bate("30 23 * * *", t.replace(hour=23, minute=30)))
        self.assertTrue(sc.cron_bate("0 8 1 * 2", t))      # dom e dow restritos: OU
        self.assertTrue(sc.cron_bate("0 8 * * 7", dt.datetime(2026, 10, 11, 8, 0)))   # 7 = domingo
        for ruim in ("* * *", "61 * * * *", "*/0 * * * *", "a * * * *"):
            with self.assertRaises(ValueError, msg=ruim):
                sc.parse_cron(ruim)


class TestRotinas(u.Base):
    def setUp(self):
        super().setUp()
        self.bot(id="atlas")
        self.bot(id="vigia", kind="io")
        self.pn = mock.patch("skills.emitir")
        self.pn.start()

    def tearDown(self):
        self.pn.stop()
        super().tearDown()

    def test_repo_rotinas_validas(self):
        rs = sc.carregar()
        self.assertEqual(sc.carregar.erros, [])
        self.assertTrue({"vigia_saude", "resumo_noturno", "morning_brief"} <= set(rs))
        self.assertTrue(rs["resumo_noturno"]["propose_memory"])

    def test_quiet_unless_changed(self):
        r = rot()
        self.assertTrue(sc.entregar(r, "disco cheio"))
        self.assertFalse(sc.entregar(r, "  Disco   cheio "))       # igual normalizado: quieto
        self.assertFalse(sc.entregar(r, "NO_CHANGE"))
        self.assertFalse(sc.entregar(r, ""))
        self.assertTrue(sc.entregar(r, "disco ok"))
        self.assertEqual(len(sc.notificacoes()), 2)
        self.assertTrue(sc.entregar(rot(id="r2", deliver="always"), "x"))
        self.assertTrue(sc.entregar(rot(id="r2", deliver="always"), "x"))
        self.assertFalse(sc.entregar(rot(id="r3", deliver="never"), "x"))

    def test_falhas_contam_e_zeram(self):
        r = rot()
        sc.entregar(r, None, ok=False, erro="boom")
        sc.entregar(r, None, ok=False, erro="boom")
        self.assertEqual(sc.estado("r1")["fails"], 2)
        sc.entregar(r, "ok")
        self.assertEqual(sc.estado("r1")["fails"], 0)

    def test_tick_cron_uma_vez_por_minuto(self):
        rs = {"r1": rot()}
        t = dt.datetime(2026, 10, 13, 9, 5)
        self.assertEqual(sc.tick(t, rs), ["r1"])
        self.assertEqual(sc.tick(t.replace(second=30), rs), [])
        self.assertEqual(sc.tick(t.replace(minute=6), rs), [])
        j = jobs.listar()[0]
        self.assertEqual((j["bot"], j["input"]["routine"]), ("atlas", "r1"))
        self.assertIn("Briefing", j["input"]["task"])

    def test_job_da_rotina_entrega(self):
        sc.iniciar_cb = None
        jobs.ao_terminar.append(sc._ao_terminar_job)
        try:
            sc.disparar(rot(), "manual")
            with mock.patch.object(sc, "carregar", return_value={"r1": rot()}):
                jobs.rodar_um("gpu", lambda j: "tem novidade")
                self.assertEqual(sc.notificacoes()[0]["corpo"], "tem novidade")
                sc.disparar(rot(), "manual")
                jobs.rodar_um("gpu", lambda j: "tem novidade")
            self.assertEqual(len(sc.notificacoes()), 1)        # mesmo resultado: quieto
        finally:
            jobs.ao_terminar.remove(sc._ao_terminar_job)

    def test_evento(self):
        rs = {"ev1": rot(id="ev1", cron=None, event={"type": "print_saved"}), "cr1": rot(id="cr1")}
        self.assertEqual(sc.fire_event("print_saved", {"arquivo": "a.jpg"}, rs), ["ev1"])
        self.assertEqual(sc.fire_event("outro", {}, rs), [])
        self.assertIn("a.jpg", jobs.listar()[0]["input"]["task"] + json.dumps(jobs.listar()[0]["input"]))

    def test_arquivo_alterado(self):
        pasta = os.path.join(self.tmp, "vigiada")
        os.makedirs(pasta)
        with mock.patch.object(sc, "BASE_DIR", self.tmp):
            rs = {"fw1": rot(id="fw1", cron=None, event={"type": "file_changed", "path": "vigiada"})}
            self.assertEqual(sc.checar_arquivos(rs), [])            # primeira vez só grava a assinatura
            with open(os.path.join(pasta, "novo.txt"), "w") as f:
                f.write("x")
            self.assertEqual(sc.checar_arquivos(rs), ["fw1"])
            self.assertEqual(sc.checar_arquivos(rs), [])

    def test_acao_falha_vira_falha(self):
        r = rot(prompt="nao_existe")
        sc.disparar(r)
        self.assertEqual(sc.estado("r1")["last_status"], "failed")


class TestResumoNoturno(u.Base):
    def setUp(self):
        super().setUp()
        self.bot(id="atlas")
        self.pn = mock.patch("skills.emitir")
        self.pn.start()

    def tearDown(self):
        self.pn.stop()
        super().tearDown()

    def test_diario_resumo_e_proposta(self):
        r = sc.validar({"id": "resumo_noturno", "bot": "atlas", "cron": "30 23 * * *", "action": "daily_summary",
                        "prompt": "resumo_diario", "propose_memory": True})
        self.assertIsNone(sc.disparar(r))                      # diário vazio: nada
        for i in range(4):
            obs.diario(f"fiz a tarefa {i}")
        jid = sc.disparar(r)
        self.assertIn("fiz a tarefa 3", jobs.get(jid)["input"]["task"])
        with mock.patch.object(sc, "carregar", return_value={"resumo_noturno": r}):
            jobs.ao_terminar.append(sc._ao_terminar_job)
            try:
                jobs.rodar_um("gpu", lambda j: "- terminou a fase 3 do Atlas")
            finally:
                jobs.ao_terminar.remove(sc._ao_terminar_job)
        pend = approvals.listar("pending")
        self.assertEqual(pend[0]["tool"], "memory_propose")      # não salvou sozinho
        with mock.patch("ferramentas.executar", return_value={"ok": True, "resultado": {"id": "m1"}}) as ex:
            a = approvals.decide(pend[0]["id"], True)
        self.assertEqual(a["result"], {"id": "m1"})
        self.assertEqual(ex.call_args[0][0], "save_memory")
        self.assertIn("fase 3", ex.call_args[0][1]["content"])

    def test_rejeitado_nao_salva(self):
        aid = approvals.request_approval(None, "memory_propose", {"content": "x"}, "x")
        with mock.patch("ferramentas.executar") as ex:
            approvals.decide(aid, False)
        ex.assert_not_called()


class TestVigia(u.Base):
    def test_checagens(self):
        agora = time.time()
        db.executar("INSERT INTO jobs(id, bot, kind, input, state, created, updated) VALUES('j1','dev','gpu','{}','running',?,?)",
                    (agora - 3600, agora - 3600))
        sc._init()
        db.executar("INSERT INTO routine_state(id, fails) VALUES('morning_brief', 3)")
        with mock.patch.object(core, "ollama_online", return_value=False), \
                mock.patch.object(router, "vram_mb", return_value=6000), \
                mock.patch.object(health, "_vram_total_mb", return_value=6141), \
                mock.patch.object(health, "discos", return_value=[{"disco": "C:", "livre_gb": 4.0, "total_gb": 475},
                                                                  {"disco": "D:", "livre_gb": 300.0, "total_gb": 833}]):
            h = health.checar()
        chaves = {a["chave"] for a in h["alertas"]}
        self.assertEqual(chaves, {"ollama", "vram", "disco_C:", "job_j1", "rotina_morning_brief"})
        self.assertFalse(h["ok"])

    def test_rotina_saude_quieta(self):
        r = sc.validar({"id": "vigia_saude", "cron": "*/10 * * * *", "action": "health"})
        base = {"ok": True, "alertas": [], "discos": [], "ollama": True, "vram_mb": 1, "vram_total_mb": 6}
        alerta = dict(base, ok=False, alertas=[{"nivel": "aviso", "chave": "disco_C:", "msg": "Disco C: com 9 GB"}])
        alerta2 = dict(alerta, alertas=[{"nivel": "aviso", "chave": "disco_C:", "msg": "Disco C: com 8 GB"}])
        with mock.patch("skills.emitir"):
            for h in (base, alerta, alerta2, base, base):
                with mock.patch.object(health, "checar", return_value=h):
                    sc.disparar(r)
        corpos = [n["corpo"] for n in reversed(sc.notificacoes())]
        self.assertEqual(corpos, ["[aviso] Disco C: com 9 GB", "Sistema normal de novo."])   # 8 GB não repete


class TestLoteERouter(u.Base):
    def test_lote_prefere_modelo_residente(self):
        self.bot(id="atlas", model={"local": "a:1b"})
        self.bot(id="dev", model={"local": "b:1b"})
        with mock.patch.object(core, "modelo_instalado", return_value=True):
            j1 = jobs.enqueue("dev", {"task": "1"})
            j2 = jobs.enqueue("atlas", {"task": "2"})
            router._estado["residente"] = "a:1b"
            try:
                self.assertEqual(jobs._pegar("gpu")["id"], j2)
                db.executar("UPDATE jobs SET created=created-999 WHERE id=?", (j1,))
                j3 = jobs.enqueue("atlas", {"task": "3"})
                self.assertEqual(jobs._pegar("gpu")["id"], j1)      # o antigo não passa fome
            finally:
                router._estado["residente"] = None

    def test_api_so_depois_de_duas_falhas(self):
        falha = {"ok": False, "message": {}, "modelo": "x", "erro": "x"}
        okr = {"ok": True, "message": {"content": "local"}, "modelo": "x", "erro": None}
        spec = {"local": "default", "fallback": "api:cheap"}
        with mock.patch.object(router.apimodel, "configurado", return_value=True), \
                mock.patch.object(router, "_via_api", return_value={"ok": True, "api": True, "message": {}}) as api:
            with mock.patch.object(router, "_chat_local", side_effect=[falha, okr]):
                self.assertEqual(router.chat(spec, [{"role": "user", "content": "oi"}])["message"]["content"], "local")
            api.assert_not_called()
            with mock.patch.object(router, "_chat_local", side_effect=[falha, falha]):
                self.assertTrue(router.chat(spec, [{"role": "user", "content": "oi"}])["api"])
            api.assert_called_once()


class TestBrowser(u.Base):
    def test_sem_playwright_e_ssrf(self):
        self.assertIn("error", browser.browse({"url": "http://127.0.0.1:5005"}, {}))
        with mock.patch.object(browser, "checar_url", side_effect=lambda x: x), \
                mock.patch.object(browser, "_sync_playwright", side_effect=ImportError()):
            self.assertIn("playwright", browser.browse({"url": "https://exemplo.com"}, {})["error"])
        self.assertIn("browse", orchestrator.reg.TOOLS)


class TestEndpoints(u.Base):
    def test_api(self):
        import server
        c = server.app.test_client()
        with mock.patch("skills.emitir"):
            sc.notificar("x", "Teste", "corpo")
        self.assertEqual(c.get("/api/notificacoes?nao_lidas=1").json["notificacoes"][0]["titulo"], "Teste")
        c.post("/api/notificacoes/lidas", json={})
        self.assertEqual(c.get("/api/notificacoes?nao_lidas=1").json["notificacoes"], [])
        self.assertEqual(c.get("/atividade").status_code, 200)
        self.assertIn("rotinas", c.get("/api/rotinas").json)
        with mock.patch.object(core, "ollama_online", return_value=True):
            self.assertIn("alertas", c.get("/api/health").json)
        self.assertEqual(c.post("/api/hooks/vigia_saude").status_code, 401)
        self.bot(id="atlas")
        jid = jobs.enqueue("atlas", {"task": "t"})
        jobs.salvar_checkpoint(jid, {"messages": [{"role": "system", "content": "s"}, {"role": "user", "content": "oi"}],
                                     "rodada": 0})
        t = c.get(f"/api/jobs/{jid}/trace").json
        self.assertEqual([m["role"] for m in t["mensagens"]], ["user"])


if __name__ == "__main__":
    unittest.main()
