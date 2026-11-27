# Pergunta Cósmica — guia de estilo

## NOVO FLUXO (a partir de dez/2026): Grok gera, Claude edita
- **Grok (usuário):** gera as cenas (imagens e clipes de vídeo) a partir dos prompts numerados.
- **Claude:** pesquisa + roteiro + prompts de cena, narração (ElevenLabs), edição em Remotion (cortes no ritmo da fala, legendas, números/gráficos, SFX, música, mixagem), thumbs, títulos/descrições, fontes.
- Clipes recebidos: nomear `cena_01.mp4`, `cena_02.mp4`… (16:9 no longo, 9:16 nos Shorts). Pasta: `episodios/<nome>/clipes/`.
- Não criar mais personagem/cenário por código (testes 3D e 2D por código foram reprovados).


## Shorts (seg / qua / sex)
- **Referência visual:** os Shorts 01–05 (`01_e_se_o_sol_sumisse.mp4` … `05_buraco_atravessando_a_terra.mp4`). Código em `projeto/src_buraco`, `projeto/src_lua`, `projeto/src_napo`.
- Feitos **nativamente na vertical**, com cenas pensadas pro 9:16. **Não** adaptar cenas do vídeo longo (o feedback foi que os Shorts recortados do longo ficaram menos legais).
- Manter o mesmo ritmo, legendas, transições e paleta dos 01–05. Mudanças de animação: pequenas e uma de cada vez, mostrando prévia antes de aplicar em tudo.
- Assunto **diferente** do longo da semana.

## Vídeo longo (quarta)
- Estilo aprovado: personagem 3D animada (Michelle), céu/ambiente HDRI real, luz de contorno + sombra, câmera com leve movimento de mão, sons de ambiente por cena (ElevenLabs).
- Bloom desligado (custo de render alto demais na nuvem).
- Faixas/caixas de texto acima da área da legenda (top ≥ ~740 px em 1080p).

## Processo
1. Tema → 2. buscar fontes (NASA/ESA/artigos) → 3. roteiro em cima das fontes → 4. narração (ElevenLabs, mesma voz) → 5. prévia de um trecho → 6. render completo.
- Lista de fontes vai no fim da descrição do YouTube.
