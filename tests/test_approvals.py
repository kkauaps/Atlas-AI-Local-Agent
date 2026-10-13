"""approvals: pedido, decisão, hash dos args, uso único, e o job pausa/retoma pela aprovação."""
import unittest
from unittest import mock

import bots_util as u
from atlas_bots import approvals, jobs, orchestrator


class TestApprovals(u.Base):
    def test_guard_exige_aprovacao_dos_args_exatos(self):
        aid = approvals.request_approval(None, "x_post_draft", {"text": "oi"}, "oi")
        self.assertFalse(approvals.guard("x_post_draft", {"text": "oi"}, aid))     # pendente
        approvals.decide(aid, True)
        self.assertFalse(approvals.guard("x_post_draft", {"text": "outro"}, aid))  # args mudaram
        self.assertFalse(approvals.guard("email_draft", {"text": "oi"}, aid))      # outra ferramenta
        self.assertTrue(approvals.guard("x_post_draft", {"text": "oi"}, aid))
        self.assertFalse(approvals.guard("x_post_draft", {"text": "oi"}, aid))     # uso único

    def test_rejeitar_e_nao_decidir_duas_vezes(self):
        aid = approvals.request_approval(None, "git_push", {}, "")
        self.assertEqual(approvals.decide(aid, False)["state"], "rejected")
        with self.assertRaises(ValueError):
            approvals.decide(aid, True)
        self.assertFalse(approvals.guard("git_push", {}, aid))

    def test_precisa(self):
        self.assertTrue(approvals.precisa("git_push"))
        self.assertTrue(approvals.precisa("mcp.github.create_issue"))
        self.assertTrue(approvals.precisa("qualquer", {"approval": ["qualquer"]}))
        self.assertFalse(approvals.precisa("search_memories", {"approval": []}))

    def test_job_pausa_e_retoma(self):
        self.bot(id="social", approval=["x_post_draft"])
        executado = []
        orchestrator.EXECUTORES["x_post_draft"] = {
            "schema": {"type": "function", "function": {"name": "x_post_draft", "parameters": {}}},
            "fn": lambda a, c: executado.append(a) or {"ok": True}}
        try:
            chat = u.FakeChat(u.resp(tool_calls=[u.call("x_post_draft", text="KKKK")]), u.resp("postado"))
            jid = jobs.enqueue("social", {"task": "posta"})
            run = lambda j: orchestrator.runner(j, chat_fn=chat)
            self.assertTrue(jobs.rodar_um("gpu", run))
            j = jobs.get(jid)
            self.assertEqual(j["state"], "waiting_approval")
            self.assertEqual(executado, [])
            pend = approvals.listar("pending")
            self.assertEqual(len(pend), 1)
            self.assertEqual(pend[0]["args"], {"text": "KKKK"})
            approvals.decide(pend[0]["id"], True)                 # volta pra fila
            self.assertEqual(jobs.get(jid)["state"], "queued")
            self.assertTrue(jobs.rodar_um("gpu", run))
            self.assertEqual(executado, [{"text": "KKKK"}])
            j = jobs.get(jid)
            self.assertEqual(j["state"], "done")
            self.assertEqual(j["result"], "postado")
            self.assertEqual(len(chat.chamadas), 2)               # não chamou o modelo de novo para a mesma tool
        finally:
            orchestrator.EXECUTORES.pop("x_post_draft", None)

    def test_job_rejeitado_recebe_rejected(self):
        self.bot(id="dev", approval=["git_push"])
        chat = u.FakeChat(u.resp(tool_calls=[u.call("git_push", branch="main")]), u.resp("ok, não fiz push"))
        jid = jobs.enqueue("dev", {"task": "push"})
        run = lambda j: orchestrator.runner(j, chat_fn=chat)
        jobs.rodar_um("gpu", run)
        approvals.decide(approvals.listar("pending")[0]["id"], False)
        jobs.rodar_um("gpu", run)
        self.assertEqual(jobs.get(jid)["state"], "done")
        self.assertIn("rejected", chat.chamadas[-1]["msgs"][-1]["content"])

    def test_sem_job_so_cria_pedido(self):
        self.bot(id="social", approval=["x_post_draft"])
        chat = u.FakeChat(u.resp(tool_calls=[u.call("x_post_draft", text="a")]), u.resp("pedi aprovação"))
        r = orchestrator.run_bot("social", [{"role": "user", "content": "x"}], chat_fn=chat)
        self.assertTrue(r["ok"])
        self.assertIn("pending_approval", chat.chamadas[-1]["msgs"][-1]["content"])


if __name__ == "__main__":
    unittest.main()
