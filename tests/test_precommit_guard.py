"""precommit_guard: bloqueia dados pessoais e segredos."""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts"))
import precommit_guard as g  # noqa: E402


class TestGuard(unittest.TestCase):
    def test_caminhos(self):
        for p in ("memorias.json", "config.json", "sub/conversas.json", "prints/a.png", "logs/atlas.jsonl",
                  ".env", "jobs.db", "jobs.db-wal", "grafo.json"):
            self.assertTrue(g.caminho_bloqueado(p), p)
        for p in ("server.py", "bots/atlas.json", "prints/.gitkeep", ".env.example", "web/aprovacoes.html"):
            self.assertFalse(g.caminho_bloqueado(p), p)

    def test_segredos(self):
        self.assertTrue(g.tem_segredo("x = 'ghp_" + "a" * 36 + "'"))
        self.assertFalse(g.tem_segredo("token = os.environ['X']"))


if __name__ == "__main__":
    unittest.main()
