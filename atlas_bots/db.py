"""db - conexão SQLite compartilhada (jobs.db, gitignored) para fila, checkpoints e aprovações."""
import os
import sqlite3
import threading

from . import BASE_DIR

_lock = threading.RLock()
_caminho = {"db": os.path.join(BASE_DIR, "jobs.db")}

ESQUEMA = """
CREATE TABLE IF NOT EXISTS jobs(
  id TEXT PRIMARY KEY, bot TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'gpu', input TEXT NOT NULL,
  state TEXT NOT NULL, result TEXT, checkpoint TEXT, parent_id TEXT,
  created REAL NOT NULL, updated REAL NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, cancel INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS jobs_state ON jobs(state, kind, created);
CREATE TABLE IF NOT EXISTS approvals(
  id TEXT PRIMARY KEY, job_id TEXT, tool TEXT NOT NULL, args_json TEXT NOT NULL, args_hash TEXT NOT NULL,
  preview TEXT, state TEXT NOT NULL, created REAL NOT NULL, decided REAL, used INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS approvals_state ON approvals(state, created);
"""


def configurar(caminho):
    """Troca o arquivo (testes usam pasta temporária)."""
    with _lock:
        _caminho["db"] = caminho


def caminho():
    return _caminho["db"]


def conectar():
    con = sqlite3.connect(_caminho["db"], timeout=10, isolation_level=None)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode=WAL")
    con.executescript(ESQUEMA)
    return con


def executar(sql, params=()):
    with _lock:
        con = conectar()
        try:
            cur = con.execute(sql, params)
            return [dict(r) for r in cur.fetchall()], cur.rowcount
        finally:
            con.close()
