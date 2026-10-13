---
name: revisar_pr
description: revisão objetiva de um diff
bots: [dev, atlas]
tools: [read_file, grep, run_tests]
inputs: [titulo, diff]
---
Revise o PR "{{titulo}}". Diff:
{{diff}}

Aponte, em ordem de gravidade: bugs, riscos de segurança (segredos, dados pessoais), testes faltando e
melhorias pequenas. Seja específico (arquivo e linha). Se estiver bom, diga em uma frase.
