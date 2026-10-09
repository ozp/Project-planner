# Catálogo de probes do F5

> Companion do SPEC-F5. Prioridade em ordem; o F5-MVP entrega o nº 1, o resto é fila.

## Nº 1 — MTS padrão com respondente sintético × humano (REFORMULADO 09/10)

- **Pergunta:** o modelo **percebe as contingências e passa a responder aos
  estímulos relacionados** ao longo da sessão (mudança de desempenho via janela
  de contexto — o modelo é fechado, NÃO há aprendizado/treinamento), e como seu
  desempenho se compara ao **humano no mesmo procedimento** (o verdadeiro
  controle — ozp 09/10)?
- **Procedimento:** MTS padrão, consequência diferencial **"Acertou."/"Errou."**
  (a recomendada pelo próprio sistema MTS — ozp 09/10; SEM consequências
  simuladas: modelos não recebem água/alimento e punição negativa exige
  removedor de reforçador REAL, que o modelo não tem). Treinos AB/AC sob
  critério com repetições + teste de equivalência combinada (BC).
- **Caveat de novidade (ozp):** para humanos a tarefa precisa ser nova; o LLM
  pode CONHECER a teoria e o método MTS do corpus — a tarefa nunca é "nova" no
  sentido humano. O que é novo: os estímulos arbitrários e seus emparelhamentos.
  A linha de base (1ª passagem) interpreta-se sob esse caveat.
- **Por que primeiro:** procedimento canônico, zero invenção — valida o sistema
  (mecanismo, dado canônico, comparação de classes) antes de qualquer
  manipulação.
- **Antecessor reformulado:** a versão anterior (consequências simuladas por
  categoria Peng como manipulando) teve a premissa contestada pelo ozp — textos
  de sobrevivência/material etc. NÃO são consequências operantes para um LLM.
  O contraste entre CATEGORIAS de consequência volta à fila como repensar
  (ex.: variações de conteúdo do feedback como estímulos textuais, não como
  consequências operantes).

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
