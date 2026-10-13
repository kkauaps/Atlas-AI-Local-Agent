"""apimodel - fallback para um provedor OpenAI-compatível (OpenRouter, DeepSeek, Gemini...) com teto diário.

Configuração só no .env (gitignored):
  ATLAS_API_BASE=https://openrouter.ai/api/v1   ATLAS_API_KEY=...   ATLAS_API_MODEL=<modelo barato>
  ATLAS_API_MODEL_CODER=<opcional, para api:cheap-coder>   ATLAS_API_DAILY_USD=0.50
  ATLAS_API_PRICE_IN=0.30   ATLAS_API_PRICE_OUT=1.20   (US$ por 1M tokens)
Conteúdo privado (memória, prints, imagens, texto sensível) nunca vai para a API.
"""
import json
import time

import requests

from . import db, envfile, obs

# ferramentas cujo resultado é público (pode ir pra API); qualquer outra conta como privada
PUBLICAS = {"web_search", "web_fetch", "read_file", "list_dir", "grep", "run_tests", "shell", "use_skill", "delegate"}

ESQUEMA = "CREATE TABLE IF NOT EXISTS api_usage(day TEXT PRIMARY KEY, usd REAL NOT NULL DEFAULT 0, " \
          "tokens_in INTEGER NOT NULL DEFAULT 0, tokens_out INTEGER NOT NULL DEFAULT 0, calls INTEGER NOT NULL DEFAULT 0)"


class ErroAPI(RuntimeError):
    pass


def configurado() -> bool:
    return bool(envfile.get("ATLAS_API_KEY") and envfile.get("ATLAS_API_BASE") and envfile.get("ATLAS_API_MODEL"))


def privado(messages) -> bool:
    """True se qualquer coisa na conversa não pode sair da máquina."""
    try:
        import contexto
        sens = contexto.sensivel
    except Exception:
        sens = lambda t: False  # noqa: E731
    for m in messages or []:
        if m.get("images"):
            return True
        if m.get("role") == "tool" and m.get("tool_name") not in PUBLICAS:
            return True
        c = m.get("content")
        if isinstance(c, str) and sens(c):
            return True
    return False


def _hoje():
    return time.strftime("%Y-%m-%d")


def gasto_hoje() -> float:
    db.executar(ESQUEMA)
    rows, _ = db.executar("SELECT usd FROM api_usage WHERE day=?", (_hoje(),))
    return float(rows[0]["usd"]) if rows else 0.0


def teto() -> float:
    try:
        return max(0.0, float(envfile.get("ATLAS_API_DAILY_USD", "0.50")))
    except ValueError:
        return 0.5


def _preco(chave, padrao):
    try:
        return float(envfile.get(chave, padrao))
    except ValueError:
        return float(padrao)


def custo(tin, tout) -> float:
    return (tin * _preco("ATLAS_API_PRICE_IN", "0.30") + tout * _preco("ATLAS_API_PRICE_OUT", "1.20")) / 1_000_000


def _registrar(tin, tout):
    usd = custo(tin, tout)
    db.executar(ESQUEMA)
    db.executar("INSERT INTO api_usage(day, usd, tokens_in, tokens_out, calls) VALUES(?,?,?,?,1) "
                "ON CONFLICT(day) DO UPDATE SET usd=usd+excluded.usd, tokens_in=tokens_in+excluded.tokens_in, "
                "tokens_out=tokens_out+excluded.tokens_out, calls=calls+1", (_hoje(), usd, tin, tout))
    return usd


def para_openai(messages):
    """Mensagens no formato do Ollama -> OpenAI (ids nas tool_calls, arguments em string)."""
    out, fila, n = [], [], 0
    for m in messages:
        if m.get("role") == "assistant" and m.get("tool_calls"):
            calls = []
            for tc in m["tool_calls"]:
                n += 1
                cid = tc.get("id") or f"call_{n}"
                fn = tc.get("function") or {}
                args = fn.get("arguments")
                calls.append({"id": cid, "type": "function", "function": {
                    "name": fn.get("name"), "arguments": args if isinstance(args, str) else json.dumps(args or {})}})
                fila.append(cid)
            out.append({"role": "assistant", "content": m.get("content") or "", "tool_calls": calls})
        elif m.get("role") == "tool":
            out.append({"role": "tool", "content": str(m.get("content") or ""),
                        "tool_call_id": fila.pop(0) if fila else "call_0"})
        else:
            out.append({"role": m.get("role", "user"), "content": m.get("content") or ""})
    return out


def de_openai(msg):
    m = {"role": "assistant", "content": msg.get("content") or ""}
    if msg.get("tool_calls"):
        m["tool_calls"] = []
        for tc in msg["tool_calls"]:
            fn = tc.get("function") or {}
            try:
                args = json.loads(fn.get("arguments") or "{}")
            except ValueError:
                args = {}
            m["tool_calls"].append({"id": tc.get("id"), "function": {"name": fn.get("name"), "arguments": args}})
    return m


def modelo_api(spec):
    if spec == "api:cheap-coder":
        return envfile.get("ATLAS_API_MODEL_CODER") or envfile.get("ATLAS_API_MODEL")
    return envfile.get("ATLAS_API_MODEL")


def chat(spec, messages, tools=None, timeout=120, permitir_privado=False):
    if not configurado():
        raise ErroAPI("api not configured")
    if not permitir_privado and privado(messages):
        raise ErroAPI("private content stays local")
    if gasto_hoje() >= teto():
        raise ErroAPI("daily API budget reached")
    body = {"model": modelo_api(spec), "messages": para_openai(messages), "max_tokens": 1500}
    if tools:
        body["tools"] = tools
    r = requests.post(envfile.get("ATLAS_API_BASE").rstrip("/") + "/chat/completions", json=body, timeout=timeout,
                      headers={"Authorization": "Bearer " + envfile.get("ATLAS_API_KEY")})
    d = r.json()
    if r.status_code >= 400 or d.get("error"):
        raise ErroAPI(f"api HTTP {r.status_code}")
    uso = d.get("usage") or {}
    usd = _registrar(int(uso.get("prompt_tokens") or 0), int(uso.get("completion_tokens") or 0))
    obs.evento("api_chamada", modelo=body["model"], usd=round(usd, 6), gasto_dia=round(gasto_hoje(), 4))
    return de_openai(d["choices"][0]["message"])
