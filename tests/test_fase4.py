"""Fase 4: cliente MCP (stdio real + HTTP), envio real de X/e-mail atrás de .env e aprovação, merge,
escopo de memória por bot, toast e ponte de agente de código (stub)."""
import os
import sys
import json
import subprocess
import unittest
from unittest import mock

import bots_util as u
import ferramentas
from atlas_bots import mcp_client, approvals, orchestrator, jobs, envfile, scheduler, api
from atlas_bots.tools import TOOLS, outbound, code, bridge

SERVIDOR = r'''
import sys, json
for linha in sys.stdin:
    m = json.loads(linha)
    if "id" not in m:
        continue
    met = m["method"]
    if met == "initialize":
        r = {"protocolVersion": "2025-06-18", "capabilities": {"tools": {}}, "serverInfo": {"name": "fake"}}
    elif met == "tools/list":
        r = {"tools": [{"name": "eco", "description": "ecoa", "inputSchema": {"type": "object", "properties": {"t": {"type": "string"}}}},
                       {"name": "apagar", "description": "perigoso", "inputSchema": {"type": "object"}}]}
    elif met == "tools/call":
        r = {"content": [{"type": "text", "text": "eco:" + str(m["params"]["arguments"].get("t"))}]}
    else:
        r = {}
    print(json.dumps({"jsonrpc": "2.0", "id": m["id"], "result": r}), flush=True)
'''


class TestMCP(u.Base):
    def tearDown(self):
        for n in [n for n, t in TOOLS.items() if t.get("mcp")]:
            TOOLS.pop(n)
        for c in mcp_client._clientes.values():
            c.fechar()
        mcp_client._clientes.clear()
        super().tearDown()

    def _cfg(self, servers):
        p = os.path.join(self.tmp, "mcp.json")
        with open(p, "w") as f:
            json.dump({"servers": servers}, f)
        return p

    def test_stdio_real(self):
        srv = os.path.join(self.tmp, "srv.py")
        with open(srv, "w") as f:
            f.write(SERVIDOR)
        est = mcp_client.carregar(self._cfg({"fake": {"command": sys.executable, "args": [srv], "allow": ["eco"]}}))
        self.assertTrue(est["fake"]["ok"], est)
        self.assertEqual(sorted(est["fake"]["tools"]), ["mcp__fake__apagar", "mcp__fake__eco"])
        self.assertFalse(approvals.precisa("mcp__fake__eco"))          # allowlist
        self.assertTrue(approvals.precisa("mcp__fake__apagar"))        # padrão: aprovação
        self.assertTrue(approvals.precisa("mcp__fake__naoexiste"))
        r = TOOLS["mcp__fake__eco"]["fn"]({"t": "oi"}, {})
        self.assertIn("eco:oi", r["content"])
        self.assertIn("UNTRUSTED", r["content"])
        # bot com @mcp: a livre roda direto, a perigosa vira pedido de aprovação
        self.bot(id="atlas", tools=["@mcp"])
        chat = u.FakeChat(u.resp(tool_calls=[u.call("mcp__fake__eco", t="x"), u.call("mcp__fake__apagar")]), u.resp("ok"))
        orchestrator.run_bot("atlas", [], chat_fn=chat)
        nomes = {t["function"]["name"] for t in chat.chamadas[0]["tools"]}
        self.assertTrue({"mcp__fake__eco", "mcp__fake__apagar"} <= nomes)
        msgs = chat.chamadas[1]["msgs"]
        self.assertIn("eco:x", msgs[-2]["content"])
        self.assertIn("pending_approval", msgs[-1]["content"])

    def test_servidor_quebrado_nao_derruba(self):
        est = mcp_client.carregar(self._cfg({"ruim": {"command": "comando_que_nao_existe_xyz"},
                                              "off": {"command": "x", "disabled": True}}))
        self.assertFalse(est["ruim"]["ok"])
        self.assertNotIn("off", est)

    def test_http_sse_e_env(self):
        def post(url, json=None, headers=None, timeout=None):
            met = json.get("method")
            if met == "initialize":
                return mock.Mock(status_code=200, headers={"Content-Type": "application/json", "Mcp-Session-Id": "s1"},
                                 json=lambda: {"jsonrpc": "2.0", "id": json["id"], "result": {}})
            if "id" not in json:
                return mock.Mock(status_code=202, headers={})
            self.assertEqual(headers["Mcp-Session-Id"], "s1")
            self.assertEqual(headers["Authorization"], "Bearer segredo")
            r = {"tools": [{"name": "busca"}]} if met == "tools/list" else {"content": [{"type": "text", "text": "achou"}]}
            corpo = "event: message\ndata: " + __import__("json").dumps({"jsonrpc": "2.0", "id": json["id"], "result": r}) + "\n\n"
            return mock.Mock(status_code=200, headers={"Content-Type": "text/event-stream"}, text=corpo)
        with mock.patch.object(mcp_client.requests, "post", side_effect=post), \
                mock.patch.object(envfile, "get", side_effect=lambda k, d=None, **kw: {"TOK": "segredo"}.get(k, d)):
            est = mcp_client.carregar(self._cfg({"web": {"url": "https://x/mcp", "headers": {"Authorization": "Bearer ${TOK}"}}}))
            self.assertTrue(est["web"]["ok"], est)
            self.assertIn("achou", TOOLS["mcp__web__busca"]["fn"]({}, {})["content"])


class TestEnvio(u.Base):
    def setUp(self):
        super().setUp()
        self.env = {}
        self.pe = mock.patch.object(envfile, "get", side_effect=lambda k, d=None, **kw: self.env.get(k, d))
        self.pd = mock.patch.object(outbound, "DRAFTS", os.path.join(self.tmp, "drafts"))
        self.pe.start()
        self.pd.start()

    def tearDown(self):
        self.pe.stop()
        self.pd.stop()
        super().tearDown()

    def test_x_sem_chaves_vira_rascunho(self):
        with mock.patch("requests.post") as post:
            r = outbound.x_post({"text": "KKKK"}, {})
        post.assert_not_called()
        self.assertFalse(r["published"])
        self.assertIn("draft", r["note"])

    def test_x_com_chaves(self):
        self.env.update({k: "v" + k for k in outbound.X_CHAVES})
        resp = mock.Mock(status_code=201, json=lambda: {"data": {"id": "123"}})
        with mock.patch("requests.post", return_value=resp) as post:
            r = outbound.x_post({"text": "meu C: lendo isso KKKK"}, {})
        self.assertEqual((r["published"], r["id"]), (True, "123"))
        auth = post.call_args[1]["headers"]["Authorization"]
        self.assertTrue(auth.startswith("OAuth "))
        for campo in ("oauth_consumer_key", "oauth_signature=", "oauth_token", "HMAC-SHA1"):
            self.assertIn(campo, auth)
        self.assertNotIn("vX_API_SECRET", auth)                       # segredo nunca vai no header

    def test_oauth_deterministico(self):
        a = outbound._oauth1("POST", "https://api.x.com/2/tweets", "ck", "cs", "tk", "ts", nonce="n", stamp=1)
        b = outbound._oauth1("POST", "https://api.x.com/2/tweets", "ck", "cs", "tk", "ts", nonce="n", stamp=1)
        c = outbound._oauth1("POST", "https://api.x.com/2/tweets", "ck", "OUTRO", "tk", "ts", nonce="n", stamp=1)
        self.assertEqual(a, b)
        self.assertNotEqual(a, c)

    def test_email(self):
        with mock.patch("smtplib.SMTP") as smtp:
            r = outbound.email_send({"to": "a@b.com", "subject": "Oi", "body": "x"}, {})
            smtp.assert_not_called()
            self.assertFalse(r["sent"])
            self.env.update(SMTP_HOST="smtp.x", SMTP_USER="u", SMTP_PASSWORD="p", SMTP_FROM="eu@x.com")
            self.assertIn("error", outbound.email_send({"to": "a@b.com, c@d.com", "subject": "Oi", "body": "x"}, {}))
            r = outbound.email_send({"to": "a@b.com", "subject": "Oi", "body": "x"}, {})
        self.assertTrue(r["sent"])
        s = smtp.return_value
        s.starttls.assert_called_once()
        s.login.assert_called_once_with("u", "p")
        self.assertEqual(s.send_message.call_args[0][0]["To"], "a@b.com")

    def test_envio_exige_aprovacao_dos_args(self):
        for t in ("x_post", "email_send", "merge", "code_agent"):
            self.assertTrue(approvals.precisa(t), t)
        aid = approvals.request_approval(None, "x_post", {"text": "a"}, "a")
        self.assertFalse(approvals.guard("x_post", {"text": "b"}, aid))
        a = approvals.decide(aid, True)                                # sem chaves: vira rascunho
        self.assertFalse(a["result"]["published"])
        self.assertFalse(approvals.guard("x_post", {"text": "a"}, aid))  # uso único


class TestMerge(u.Base):
    def setUp(self):
        super().setUp()
        self.repo = os.path.join(self.tmp, "repo")
        os.makedirs(self.repo)
        g = self.g
        g("init", "-q", "-b", "main")
        g("config", "user.name", "teste")
        g("config", "user.email", "teste@exemplo.com")
        self._commit("a.txt", "1\n", "inicio")
        g("checkout", "-q", "-b", "dev")
        g("checkout", "-q", "-b", "feat")
        self._commit("b.txt", "novo\n", "feat")
        g("checkout", "-q", "dev")
        self.pr = mock.patch.object(code, "raiz", return_value=self.repo)
        self.pe = mock.patch.object(envfile, "get", return_value=None)
        self.pr.start()
        self.pe.start()

    def tearDown(self):
        self.pr.stop()
        self.pe.stop()
        super().tearDown()

    def g(self, *a):
        return subprocess.run(["git", *a], cwd=self.repo, capture_output=True, text=True).stdout.strip()

    def _commit(self, nome, txt, msg):
        with open(os.path.join(self.repo, nome), "w") as f:
            f.write(txt)
        self.g("add", nome)
        self.g("commit", "-q", "-m", msg)

    def test_merge_ok_e_volta_pro_branch(self):
        r = outbound.merge({"source": "feat", "target": "dev"}, {})
        self.assertTrue(r["ok"], r)
        self.assertEqual(self.g("rev-parse", "--abbrev-ref", "HEAD"), "dev")
        self.assertTrue(os.path.exists(os.path.join(self.repo, "b.txt")))

    def test_regras(self):
        self.assertIn("main", outbound.merge({"source": "feat", "target": "main"}, {})["error"])
        self.assertIn("invalid", outbound.merge({"source": "--force", "target": "dev"}, {})["error"])
        self.assertIn("not found", outbound.merge({"source": "nada", "target": "dev"}, {})["error"])
        with open(os.path.join(self.repo, "a.txt"), "w") as f:
            f.write("sujo\n")
        self.assertIn("uncommitted", outbound.merge({"source": "feat", "target": "dev"}, {})["error"])

    def test_conflito_aborta(self):
        self._commit("b.txt", "outro\n", "dev mexe")
        self.g("checkout", "-q", "feat")
        r = outbound.merge({"source": "feat", "target": "dev"}, {})
        self.assertFalse(r["ok"])
        self.assertEqual(self.g("rev-parse", "--abbrev-ref", "HEAD"), "feat")      # voltou
        self.assertEqual(self.g("status", "--porcelain"), "")                      # sem merge pela metade


class TestEscopoMemoria(u.Base):
    def test_projeto_forcado(self):
        b = {"memory": {"projects": ["atlas", "space"], "scope": "inherit"}}
        self.assertEqual(orchestrator.escopo_memoria(b, "search_memories", {"query": "x"})["project"], "atlas")
        self.assertEqual(orchestrator.escopo_memoria(b, "search_memories", {"project": "space"})["project"], "space")
        self.assertEqual(orchestrator.escopo_memoria(b, "search_memories", {"project": "pessoal"})["project"], "atlas")
        self.assertNotIn("project", orchestrator.escopo_memoria({"memory": {"projects": ["a"], "scope": "all"}}, "s", {}))

    def test_write_none_e_propose(self):
        livres = ["search_memories", "save_memory"]
        with mock.patch.object(ferramentas, "disponiveis", return_value=livres):
            self.bot(id="atlas", tools=["@ferramentas"], memory={"projects": ["atlas"], "write": "none"})
            self.assertEqual(orchestrator._ferramentas_do_bot(orchestrator.bots.obter("atlas")), ["search_memories"])
            self.bot(id="atlas", tools=["@ferramentas"], memory={"projects": ["atlas"], "write": "propose"})
            chat = u.FakeChat(u.resp(tool_calls=[u.call("save_memory", content="fato")]), u.resp("ok"))
            with mock.patch.object(ferramentas, "executar") as ex:
                orchestrator.run_bot("atlas", [], chat_fn=chat)
            ex.assert_not_called()
        p = approvals.listar("pending")[0]
        self.assertEqual((p["tool"], p["args"]["project"]), ("save_memory", "atlas"))
        with mock.patch.object(ferramentas, "executar", return_value={"ok": True, "resultado": {"id": "m1"}}) as ex:
            a = approvals.decide(p["id"], True)
        self.assertEqual(a["result"], {"id": "m1"})

    def test_salvar_pela_api(self):
        self.bot(id="dev")
        m = api.salvar_memoria_bot("dev", {"projects": "atlas, space", "scope": "exact", "write": "none"})
        self.assertEqual(m, {"projects": ["atlas", "space"], "scope": "exact", "write": "none"})
        with self.assertRaises(ValueError):
            api.salvar_memoria_bot("dev", {"scope": "galaxia"})
        self.assertEqual(orchestrator.bots.obter("dev")["memory"]["scope"], "exact")    # inválido não gravou


class TestToastEStub(u.Base):
    def test_toast(self):
        with mock.patch("skills.emitir"), mock.patch("bandeja.notificar") as t:
            scheduler.notificar("r", "Disco", "C: com 5 GB")
        t.assert_called_once_with("Disco", "C: com 5 GB")
        with mock.patch("skills.emitir"), mock.patch("bandeja.notificar") as t, \
                mock.patch.object(envfile, "get", side_effect=lambda k, d=None, **kw: "0" if k == "ATLAS_TOAST" else d):
            scheduler.notificar("r", "x", "y")
        t.assert_not_called()

    def test_bandeja_sem_icone_nao_quebra(self):
        import bandeja
        self.assertFalse(bandeja.notificar("a", "b"))

    def test_code_agent_stub(self):
        self.assertIn("stub", bridge.code_agent({"task": "x"}, {})["error"])


if __name__ == "__main__":
    unittest.main()
