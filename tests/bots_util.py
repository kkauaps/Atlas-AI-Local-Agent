"""Apoio dos testes do atlas_bots: tudo em pasta temporária, sem Ollama e sem GPU."""
import os
import sys
import json
import shutil
import tempfile
import unittest

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, RAIZ)

from atlas_bots import db, obs, bots  # noqa: E402


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="atlasbots_")
        self._orig = (db.caminho(), obs.LOG_DIR, bots.BOTS_DIR)
        db.configurar(os.path.join(self.tmp, "jobs.db"))
        obs.LOG_DIR = os.path.join(self.tmp, "logs")
        bots.BOTS_DIR = os.path.join(self.tmp, "bots")
        os.makedirs(bots.BOTS_DIR)
        bots.carregar(forcar=True)

    def tearDown(self):
        db.configurar(self._orig[0])
        obs.LOG_DIR, bots.BOTS_DIR = self._orig[1], self._orig[2]
        bots._cache.update(assin=None, bots={})
        shutil.rmtree(self.tmp, ignore_errors=True)

    def bot(self, **d):
        base = {"id": "atlas", "model": {"local": "fake:1b"}, "tools": [], "max_rounds": 4}
        base.update(d)
        with open(os.path.join(bots.BOTS_DIR, base["id"] + ".json"), "w", encoding="utf-8") as f:
            json.dump(base, f)
        bots.carregar(forcar=True)
        return base


def resp(content="", tool_calls=None):
    m = {"role": "assistant", "content": content}
    if tool_calls:
        m["tool_calls"] = tool_calls
    return {"ok": True, "message": m, "modelo": "fake:1b", "erro": None}


def call(nome, **args):
    return {"function": {"name": nome, "arguments": args}}


class FakeChat:
    """chat_fn roteirizado: devolve as respostas em ordem e guarda as chamadas."""

    def __init__(self, *respostas):
        self.respostas = list(respostas)
        self.chamadas = []

    def __call__(self, model, msgs, tools=None, gpu=True):
        self.chamadas.append({"model": model, "msgs": [dict(m) for m in msgs], "tools": tools, "gpu": gpu})
        return self.respostas.pop(0) if self.respostas else resp("fim")
