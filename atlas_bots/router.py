"""router - fala com o Ollama garantindo UM modelo residente na GPU (6 GB de VRAM).

- trava de GPU: só uma geração por vez; antes de carregar o modelo B, descarrega o A
- modelo principal com keep_alive padrão ("5m"); especialistas trocados com keep_alive 0
- embeddings sempre na CPU (num_gpu 0), não competem pela VRAM
- num_ctx limitado (o KV cache conta nos 6 GB)
- registra VRAM depois de cada carga em logs/atlas.jsonl
"""
import os
import time
import threading
import subprocess

import requests

import core
from . import obs

CTX_MAX = 8192
CTX_PADRAO = 4096
KEEP_PRINCIPAL = "5m"
ENV_OLLAMA = {"OLLAMA_MAX_LOADED_MODELS": "1", "OLLAMA_NUM_PARALLEL": "1"}

gpu_lock = threading.RLock()
_estado = {"residente": None, "cargas": 0}


def env_ollama(env=None) -> dict:
    """Variáveis pro `ollama serve`: um modelo carregado, uma requisição por vez (não sobrescreve as do usuário)."""
    env = dict(os.environ if env is None else env)
    for k, v in ENV_OLLAMA.items():
        env.setdefault(k, v)
    return env


def principal() -> str:
    try:
        return core.modelo_atual()
    except Exception:
        return "qwen2.5:1.5b"


def resolver(model_spec) -> str:
    """bot.model -> tag do Ollama. Aceita str, {"local": ...} e "default" (= modelo escolhido na interface)."""
    if isinstance(model_spec, dict):
        model_spec = model_spec.get("local") or "default"
    if not model_spec or model_spec == "default":
        return principal()
    return str(model_spec)


def vram_mb():
    """VRAM usada em MB (nvidia-smi) ou None."""
    try:
        out = subprocess.run(["nvidia-smi", "--query-gpu=memory.used", "--format=csv,noheader,nounits"],
                             capture_output=True, text=True, timeout=4,
                             creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0)).stdout
        return int(float(out.strip().splitlines()[0]))
    except Exception:
        return None


def residente():
    return _estado["residente"]


def _trocar(modelo):
    """Chamado com gpu_lock: se outro modelo está residente, descarrega antes."""
    atual = _estado["residente"]
    if atual and not core.mesmo_modelo(atual, modelo):
        core.descarregar_modelos()
        obs.evento("modelo_descarregado", modelo=atual)
        _estado["residente"] = None


def chat(model_spec, messages, tools=None, gpu=True, options=None, timeout=300, keep_alive=None):
    """Uma resposta (sem stream). Devolve {"ok", "message", "modelo", "erro"}."""
    modelo = resolver(model_spec)
    opts = dict(options or {})
    opts["num_ctx"] = max(512, min(int(opts.get("num_ctx") or CTX_PADRAO), CTX_MAX))
    if not gpu:
        opts["num_gpu"] = 0
    if keep_alive is None:
        keep_alive = KEEP_PRINCIPAL if core.mesmo_modelo(modelo, principal()) else 0
    body = {"model": modelo, "messages": messages, "stream": False, "keep_alive": keep_alive, "options": opts}
    if tools:
        body["tools"] = tools

    def _post():
        return requests.post(f"{core.OLLAMA}/api/chat", json=body, timeout=timeout)

    t0 = time.time()
    try:
        if gpu:
            with gpu_lock:
                novo = not (_estado["residente"] and core.mesmo_modelo(_estado["residente"], modelo))
                _trocar(modelo)
                r = _post()
                if keep_alive == 0:
                    _estado["residente"] = None
                else:
                    _estado["residente"] = modelo
                if novo:
                    _estado["cargas"] += 1
                    obs.evento("modelo_carregado", modelo=modelo, vram_mb=vram_mb(), keep_alive=keep_alive)
        else:
            r = _post()
        d = r.json()
    except Exception as e:
        obs.evento("modelo_erro", modelo=modelo, erro=type(e).__name__)
        return {"ok": False, "message": {"role": "assistant", "content": ""}, "modelo": modelo,
                "erro": type(e).__name__}
    if d.get("error"):
        return {"ok": False, "message": {"role": "assistant", "content": ""}, "modelo": modelo,
                "erro": str(d["error"])[:300]}
    return {"ok": True, "message": d.get("message") or {"role": "assistant", "content": ""}, "modelo": modelo,
            "erro": None, "ms": int((time.time() - t0) * 1000)}


def embed(texto, modelo="nomic-embed-text", timeout=60):
    """Embedding na CPU (num_gpu 0), fora da trava de GPU."""
    try:
        r = requests.post(f"{core.OLLAMA}/api/embed", json={"model": modelo, "input": texto,
                                                           "options": {"num_gpu": 0}, "keep_alive": "5m"},
                          timeout=timeout)
        v = r.json().get("embeddings") or []
        return v[0] if v else None
    except Exception:
        return None


def status() -> dict:
    livre = gpu_lock.acquire(blocking=False)
    if livre:
        gpu_lock.release()
    return {"residente": _estado["residente"], "cargas": _estado["cargas"], "principal": principal(),
            "ocupado": not livre}
