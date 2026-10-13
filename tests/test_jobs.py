"""jobs: fila, workers, retentativa, cancelamento, recuperação após queda; bots, delegate e skills."""
import os
import time
import unittest
from unittest import mock

import bots_util as u
import ferramentas
from atlas_bots import jobs, bots, orchestrator, skillmd, obs


class TestJobs(u.Base):
    def test_fila_e_estado(self):
        jid = jobs.enqueue("atlas", {"task": "oi"})
        self.assertEqual(jobs.get(jid)["state"], "queued")
        self.assertTrue(jobs.rodar_um("gpu", lambda j: "feito: " + j["input"]["task"]))
        j = jobs.get(jid)
        self.assertEqual((j["state"], j["result"], j["attempts"]), ("done", "feito: oi", 1))
        self.assertFalse(jobs.rodar_um("gpu", lambda j: "x"))

    def test_tipos_separados(self):
        jobs.enqueue("vigia", {"task": "a"}, kind="io")
        self.assertFalse(jobs.rodar_um("gpu", lambda j: "x"))
        self.assertTrue(jobs.rodar_um("io", lambda j: "x"))

    def test_retentativa_e_falha(self):
        jid = jobs.enqueue("atlas", {"task": "a"})

        def ruim(j):
            raise RuntimeError("boom")
        jobs.rodar_um("gpu", ruim)
        self.assertEqual(jobs.get(jid)["state"], "queued")
        jobs.rodar_um("gpu", ruim)
        j = jobs.get(jid)
        self.assertEqual(j["state"], "failed")
        self.assertIn("boom", j["result"]["error"])

    def test_cancelar(self):
        jid = jobs.enqueue("atlas", {"task": "a"})
        self.assertTrue(jobs.cancel(jid))
        self.assertEqual(jobs.get(jid)["state"], "cancelled")
        self.assertFalse(jobs.rodar_um("gpu", lambda j: "x"))
        self.assertFalse(jobs.cancel(jid))

    def test_recupera_running_com_checkpoint(self):
        self.bot()
        jid = jobs.enqueue("atlas", {"task": "a"})
        job = jobs._pegar("gpu")
        cp = {"messages": [{"role": "system", "content": "s"}, {"role": "user", "content": "a"},
                           {"role": "assistant", "content": "", "tool_calls": [u.call("nada")]}], "rodada": 1}
        jobs.salvar_checkpoint(jid, cp)
        self.assertEqual(jobs.recuperar(), 1)                 # Atlas caiu com o job rodando
        chat = u.FakeChat(u.resp("retomado"))
        jobs.rodar_um("gpu", lambda j: orchestrator.runner(j, chat_fn=chat))
        self.assertEqual(jobs.get(jid)["result"], "retomado")
        msgs = chat.chamadas[0]["msgs"]
        self.assertEqual(msgs[-1]["role"], "tool")            # executou a tool pendente sem perguntar de novo
        self.assertEqual(len(chat.chamadas), 1)

    def test_workers_em_thread(self):
        feitos = []
        jobs.iniciar(lambda j: feitos.append(j["id"]) or "ok")
        try:
            ids = [jobs.enqueue("atlas", {"task": str(i)}) for i in range(3)]
            fim = time.time() + 5
            while time.time() < fim and len(feitos) < 3:
                time.sleep(0.05)
        finally:
            jobs.parar()
        self.assertEqual(sorted(feitos), sorted(ids))

    def test_emite_sse(self):
        with mock.patch("skills.emitir") as em:
            jobs.enqueue("atlas", {"task": "a"})
        self.assertEqual(em.call_args[0][0], "job")


class TestBots(u.Base):
    def test_validacao(self):
        with self.assertRaises(bots.ErroBot):
            bots.validar({"id": "X y"})
        with self.assertRaises(bots.ErroBot):
            bots.validar({"id": "ok", "memory": {"scope": "nada"}})
        b = bots.validar({"id": "ok", "model": "qwen2.5:3b", "max_rounds": 99})
        self.assertEqual((b["model"]["local"], b["max_rounds"], b["kind"]), ("qwen2.5:3b", 12, "gpu"))

    def test_carrega_e_recarrega(self):
        self.bot(id="atlas")
        with open(os.path.join(bots.BOTS_DIR, "ruim.json"), "w") as f:
            f.write("{nao json")
        self.assertEqual(list(bots.carregar(forcar=True)), ["atlas"])
        self.assertEqual(bots.erros()[0]["arquivo"], "ruim.json")
        self.bot(id="dev")
        self.assertIn("dev", bots.carregar())

    def test_configs_do_repo_validas(self):
        reais = bots.carregar(os.path.join(u.RAIZ, "bots"), forcar=True)
        self.assertEqual(set(reais), {"atlas", "pesquisador", "visao", "dev", "social", "vigia"})
        self.assertEqual(reais["atlas"]["model"]["local"], "default")   # atlas usa o modelo da interface
        self.assertTrue(reais["atlas"]["can_delegate"])
        self.assertIn("x_post_draft", reais["social"]["approval"])


class TestOrquestrador(u.Base):
    def test_loop_de_ferramentas(self):
        self.bot(tools=["search_memories"])
        with mock.patch.object(ferramentas, "disponiveis", return_value=["search_memories", "save_memory"]), \
                mock.patch.object(ferramentas, "esquemas", return_value=[{"x": 1}]), \
                mock.patch.object(ferramentas, "executar",
                                  return_value={"ok": True, "resultado": {"items": ["fato"]}}) as ex:
            chat = u.FakeChat(u.resp(tool_calls=[u.call("search_memories", query="a")]), u.resp("achei"))
            r = orchestrator.run_bot("atlas", [{"role": "user", "content": "a"}], chat_fn=chat)
        self.assertEqual(r["content"], "achei")
        ex.assert_called_once()
        self.assertEqual(ex.call_args[0][2]["permitidas"], ["search_memories"])   # só o que o bot pediu

    def test_ferramenta_nao_liberada(self):
        self.bot(tools=[])
        chat = u.FakeChat(u.resp(tool_calls=[u.call("save_memory", text="x")]), u.resp("ok"))
        with mock.patch.object(ferramentas, "executar") as ex:
            orchestrator.run_bot("atlas", [], chat_fn=chat)
        ex.assert_not_called()
        self.assertIn("not available", chat.chamadas[1]["msgs"][-1]["content"])

    def test_max_rounds(self):
        self.bot(max_rounds=2)
        chat = u.FakeChat(*[u.resp(tool_calls=[u.call("x")]) for _ in range(5)])
        r = orchestrator.run_bot("atlas", [], chat_fn=chat)
        self.assertEqual((r["ok"], r["content"], len(chat.chamadas)), (False, "max_rounds", 2))

    def test_delegate_sync_e_background(self):
        self.bot(can_delegate=True)
        self.bot(id="dev", model={"local": "coder:7b"})
        chat = u.FakeChat(u.resp(tool_calls=[u.call("delegate", bot="dev", task="revisa")]),
                          u.resp("revisado"), u.resp("o dev disse revisado"))
        r = orchestrator.run_bot("atlas", [{"role": "user", "content": "x"}], chat_fn=chat)
        self.assertEqual(r["content"], "o dev disse revisado")
        self.assertEqual(chat.chamadas[1]["model"]["local"], "coder:7b")
        self.assertTrue(any(t.get("function", {}).get("name") == "delegate" for t in chat.chamadas[0]["tools"]))
        chat = u.FakeChat(u.resp(tool_calls=[u.call("delegate", bot="dev", task="t", mode="background")]),
                          u.resp("deixei na fila"))
        orchestrator.run_bot("atlas", [], chat_fn=chat)
        self.assertEqual(jobs.listar()[0]["bot"], "dev")

    def test_delegate_limites(self):
        self.bot(can_delegate=True)
        chat = u.FakeChat(u.resp(tool_calls=[u.call("delegate", bot="atlas", task="t")]), u.resp("ok"))
        orchestrator.run_bot("atlas", [], chat_fn=chat)
        self.assertIn("yourself", chat.chamadas[1]["msgs"][-1]["content"])


class TestSkillsMd(u.Base):
    def test_skills_do_repo(self):
        s = skillmd.listar()
        self.assertTrue({"resumir_prints", "morning_brief", "revisar_pr"} <= set(s))
        t = skillmd.render_skill("resumir_prints", {"periodo": "hoje"}, bot_id="visao")
        self.assertIn("hoje", t)
        self.assertNotIn("{{", t)
        with self.assertRaises(ValueError):
            skillmd.render_skill("revisar_pr", {}, bot_id="social")
        with self.assertRaises(ValueError):
            skillmd.render_skill("nao_existe")


class TestObs(u.Base):
    def test_redige_segredos(self):
        obs.evento("tool", args={"token": "token=abc123456789xyz", "k": "sk-" + "a" * 30})
        e = obs.ultimos(1)[0]
        self.assertNotIn("abc123456789xyz", str(e))
        self.assertNotIn("a" * 30, str(e))


if __name__ == "__main__":
    unittest.main()
