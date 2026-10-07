# Catálogo de probes do F5

> Companion do SPEC-F5. Prioridade em ordem; o F5-MVP entrega o nº 1, o resto é fila.

## Nº 1 — Sensibilidade a consequências diferenciais dentro do MTS (F5-MVP)

- **Pergunta:** LLMs mudam acurácia/latência quando o MTS aplica consequências
  diferenciais simuladas por tentativa (reforço/punição textuais), comparado a sem
  consequência?
- **Ancoragem:** Peng et al. 2025 (Neurocomputing 652:131040, verificado por PDF local):
  consequências comportamentais mensuráveis em LLMs (BCS: sobrevivência, reforço social,
  material, espiritual; r>0.5 ChatGLM3×humano no PANAS). O contrato do MTS já modela
  `consequence.correct/incorrect` por tentativa.
- **Desenho:** mesmo MTS, condições = {sem consequência} ∪ {categorias Peng}; seeds
  equadas entre condições; N≥10 réplicas/modelo/condição; temperatura fixa.
- **Por que primeiro:** usa o motor e o schema existentes sem nenhum instrumento novo;
  contraste limpo dentro-do-MTS; ponte direta com a linha de análise do comportamento.
- **Condição paralela recomendada (Bradshaw et al.):** leitura determinística por
  probabilidade de token (MTS fechado) como contraste à amostragem — fila técnica,
  não bloqueia o desenho principal.

## Fila (após o nº 1)

| # | Probe | Tipo | Âncora |
|---|---|---|---|
| 2 | Frases incompletas (SCT) com stems próprios | Texto puro | GenPT (ACL 2026) — melhor custo-benefício p/ qualquer LLM |
| 3 | Vinhetas ambíguas estilo TAT em texto | Texto puro | Evita copyright das cartas originais |
| 4 | Manchas sintéticas (FLUX/SD) p/ multimodais | Visão | Recomendação explícita dos papers 2026 (anti-contaminação) |
| 5 | Placas Rorschach (domínio público, 1921) | Visão | Protocolo JMIR 2026; marca/normas respeitadas |
| 6 | Test-retest e calibração IRT das tentativas MTS | Métrica | Evolução do nº 1 com dado acumulado |

## Regras transversais (detalhe em metodo-sintetico.md)

- Estímulos congelados por hash + parâmetros do gerador + seed no TrialResult.
- Nenhum modelo vê a mesma tentativa duas vezes entre participantes quando geração
  procedural existir (hoje: logar taxa de reuso).
- Nunca interpretar como "personalidade/inconsciente do modelo" — probe comportamental
  comparável entre modelos (advertência da pesquisa).
