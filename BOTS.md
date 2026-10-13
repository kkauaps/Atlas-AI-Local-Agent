# Atlas Bots

Sistema multi-bot local do Atlas (`atlas_bots/`). Um modelo residente na GPU (6 GB), os demais trocados sob demanda.

## Páginas
- `/atividade`: alertas, jobs (com trace), rotinas, sistema, eventos
- `/aprovacoes`: tudo que sai do Atlas espera aqui (aprovação vale só para os argumentos exatos, uma vez)
- `/bots`: projetos de memória, escopo e modo de escrita de cada bot; status do MCP

## Configuração (arquivos gitignored)
- `.env`: copie de `.env.example`. Chaves de API, X, SMTP. Sem a chave, X e e-mail só geram rascunho em `drafts/`.
- `mcp.json`: copie de `mcp.example.json`. Segredos via `${VAR}` lidos do `.env`. Ferramentas MCP pedem
  aprovação, exceto as listadas em `allow`. Recarregue em `/bots` (botão) ou `POST /api/mcp`.
- `bots/*.json`, `routines/*.json`, `skills/*.md`: versionados, sem segredos.

## Regras de segurança
- Nada sai (post, e-mail, push, merge, shell de escrita, edit, MCP não liberado, memória no modo propose) sem
  aprovação na fila. Push/merge em main/master bloqueados, a menos que `ATLAS_ALLOW_PUSH_MAIN=1`. Nunca force.
- Conteúdo de web, prints, arquivos e MCP volta marcado como não confiável.
- Conteúdo privado nunca vai para a API de fallback; teto diário em `ATLAS_API_DAILY_USD`.
- `python scripts/precommit_guard.py --instalar` instala o hook que bloqueia dados pessoais e segredos.

## Modelos
- `OLLAMA_MODELS=D:\ollama\models` (variável de usuário). Visão: `qwen2.5vl:3b`.
- Teste de troca: `python scripts/vram_swap_test.py qwen3.5:4b`.

## Ponte Aider/OpenHands
Stub em `atlas_bots/tools/bridge.py` (nada instalado); instruções no docstring.
