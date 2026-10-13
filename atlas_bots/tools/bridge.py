"""code_agent - ponte opcional para Aider/OpenHands em tarefas grandes de código (STUB, nada instalado).

Como ligar no futuro (manual, fora do C: se possível):
  1. instalar o Aider num venv próprio (ex.: D:\\tools\\aider) ou o OpenHands via Docker;
  2. no .env: ATLAS_CODE_AGENT=aider  e  ATLAS_CODE_AGENT_CMD=D:\\tools\\aider\\Scripts\\aider.exe
     (o modelo vem da API do .env, ex.: ATLAS_API_MODEL_CODER);
  3. implementar _rodar_aider abaixo: `aider --yes-always --no-auto-commits --message <tarefa> <arquivos>`
     dentro de ATLAS_DEV_ROOT, devolvendo o diff para revisão.
É outbound: mesmo ligado, cada execução passa pela aprovação dos args exatos.
"""
from . import tool
from .. import envfile


@tool("code_agent", "Delegate a large refactor to an external coding agent (Aider/OpenHands). Not enabled yet.",
      {"task": {"type": "string"}, "files": {"type": "array", "items": {"type": "string"}}}, ["task"], outbound=True)
def code_agent(a, ctx):
    qual = envfile.get("ATLAS_CODE_AGENT")
    return {"error": "code agent bridge is a stub (not installed)",
            "configured": bool(qual), "how": "see atlas_bots/tools/bridge.py docstring"}
