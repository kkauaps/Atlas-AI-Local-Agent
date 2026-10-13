"""router: um modelo residente, troca descarrega o anterior, embeddings na CPU, ctx limitado."""
import unittest
from unittest import mock

import bots_util as u
import core
from atlas_bots import router


class FakeR:
    def __init__(self, d):
        self.d = d

    def json(self):
        return self.d


class TestRouter(u.Base):
    def setUp(self):
        super().setUp()
        router._estado.update(residente=None, cargas=0)
        self.posts = []

        def post(url, json=None, timeout=None):
            self.posts.append((url, json))
            if url.endswith("/api/embed"):
                return FakeR({"embeddings": [[0.1, 0.2]]})
            return FakeR({"message": {"role": "assistant", "content": "oi"}})

        self.p = [mock.patch.object(router.requests, "post", side_effect=post),
                  mock.patch.object(router, "vram_mb", return_value=4000),
                  mock.patch.object(router, "principal", return_value="qwen2.5:7b"),
                  mock.patch.object(core, "descarregar_modelos"),
                  mock.patch.object(core, "modelo_instalado", return_value=True)]
        for x in self.p:
            x.start()
        self.descarregar = core.descarregar_modelos

    def tearDown(self):
        for x in self.p:
            x.stop()
        super().tearDown()

    def test_principal_fica_residente(self):
        r = router.chat("default", [{"role": "user", "content": "oi"}])
        self.assertTrue(r["ok"])
        self.assertEqual(r["message"]["content"], "oi")
        body = self.posts[0][1]
        self.assertEqual(body["model"], "qwen2.5:7b")
        self.assertEqual(body["keep_alive"], "5m")
        self.assertEqual(router.residente(), "qwen2.5:7b")
        router.chat({"local": "default"}, [])
        self.descarregar.assert_not_called()
        self.assertEqual(router._estado["cargas"], 1)

    def test_especialista_troca_e_nao_fica(self):
        router.chat("default", [])
        router.chat({"local": "qwen2.5vl:3b"}, [])
        self.descarregar.assert_called_once()
        self.assertEqual(self.posts[-1][1]["keep_alive"], 0)
        self.assertIsNone(router.residente())

    def test_ctx_limitado_e_cpu(self):
        router.chat("default", [], options={"num_ctx": 32768})
        self.assertEqual(self.posts[-1][1]["options"]["num_ctx"], router.CTX_MAX)
        router.chat("default", [], gpu=False)
        self.assertEqual(self.posts[-1][1]["options"]["num_gpu"], 0)

    def test_embed_na_cpu(self):
        self.assertEqual(router.embed("x"), [0.1, 0.2])
        self.assertEqual(self.posts[-1][1]["options"]["num_gpu"], 0)

    def test_erro_ollama(self):
        with mock.patch.object(router.requests, "post", side_effect=ConnectionError()):
            r = router.chat("default", [])
        self.assertFalse(r["ok"])
        self.assertEqual(r["erro"], "ConnectionError")

    def test_env_um_modelo(self):
        env = router.env_ollama({"OLLAMA_NUM_PARALLEL": "3"})
        self.assertEqual(env["OLLAMA_MAX_LOADED_MODELS"], "1")
        self.assertEqual(env["OLLAMA_NUM_PARALLEL"], "3")      # respeita o do usuário

    def test_status_livre(self):
        self.assertFalse(router.status()["ocupado"])


if __name__ == "__main__":
    unittest.main()
