---
name: morning_brief
description: briefing da manhã, só com o que mudou
bots: [vigia, atlas]
tools: [search_memories]
inputs: [data, pendencias]
---
Briefing de {{data}}. Pendências conhecidas: {{pendencias}}
Liste em até 6 tópicos: lembretes de hoje, tarefas em andamento, jobs que falharam e avisos do sistema
(disco, Ollama). Se nada mudou desde o último briefing, responda exatamente NO_CHANGE.
