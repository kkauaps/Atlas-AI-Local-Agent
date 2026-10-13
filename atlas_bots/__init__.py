"""atlas_bots - sistema multi-bot local do Atlas (fase 1: núcleo).

Bots como config (bots/*.json), orquestrador com delegate, fila SQLite com workers,
roteador de modelos (um modelo residente na GPU), fila de aprovações e skills em markdown.
Nada aqui fala com a rede além do Ollama local.
"""
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
