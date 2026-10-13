---
name: resumir_prints
description: resume o que apareceu na tela num período
bots: [visao, vigia, atlas]
tools: [list_prints, ocr, vision_describe]
inputs: [periodo]
---
Resuma o que apareceu na tela em {{periodo}}. Agrupe por atividade (programa ou site), em tópicos curtos.
Sem dados sensíveis: omita senhas, tokens, valores financeiros pessoais e conversas privadas.
Se não houver prints no período, diga isso em uma frase.
