# Proposta de extensão de contrato — TMT A/B e BART (5º/6º instrumentos)

> Decisão do ozp. Escrito em 2026-10-06, na esteira das stories 3.6–3.8 (Stroop, GNG,
> N-back — padrão drop-in). Motivo: ambos quebram o paradigma de escolha/binário do
> contrato atual e precisam de extensão de contrato ANTES de virar story (avaliado na
> sessão do N-back, 04/10).

## Contexto e restrições

O `TrialResult` canônico (AD-3/AD-4) tem `response = { selectedRef?, text? }` — cobre
escolha entre comparativos (MTS/Stroop) e espaço de ações binário (GNG/NBACK). Faltam:

- **TMT A/B**: uma "tentativa" é uma trilha inteira (clicar nós em ordem); o dado
  científico é o **caminho de cliques com tempo por clique** + tempo total + erros —
  não uma seleção única. Nós precisam de **posições** (x,y) no layout.
- **BART**: uma tentativa é um balão; o participante **bomba N vezes** e decide
  cash-out; o balão explode num ponto de ruptura oculto. Dado científico: **contagem
  de bombas** e evento terminal (cashout/explosão), por balão. Não existe resposta
  "correta".

Restrições preservadas: contrato canônico versionado e append-only; documento é a
verdade (AD-2 — determinismo por autoria, precedente da sequência NBACK); export
tidy continua genérico; campos novos **todos opcionais** → retrocompatíveis.

## Proposta TMT — `nodes` no documento + `sequence` na resposta

- `DisplayProtocol += { kind: 'TMT' }` — protocolo de ordem fixa (família
  STROOP/GNG/NBACK). Adapter: nós clicáveis; clique errado é sinalizado e NÃO avança
  (versão digital clássica); clique certo avança; trilha termina no último nó.
- `Trial.nodes?: { ref, x, y }[]` — posições normalizadas 0–100 (layout autoral).
- `trial.comparisons` = **ordem esperada dos cliques** (ordem do documento);
  `trial.correct` = último nó (convenção: "completar a trilha"). 1 tentativa = 1
  trilha; bloco = 1 trilha (A e B), criterion 1, sem consequências.
- `TrialResult.response.sequence?: { ref, atMs }[]` — **todos** os cliques emitidos
  (certos e errados) com tempo desde o onset; erros e o caminho derivam daqui na
  análise. `rtSampleMs=0`; `rtComparisonMs` = 1º clique; `trialMs` = trilha completa
  (a medida científica central).
- Semântica científica: TMT digital ≠ normas de papel (research 03/10 §TMT) —
  reportar como "TMT digital adaptado" com dados descritivos próprios.

## Proposta BART — `breakpoint` no documento + `count` na resposta

- `DisplayProtocol += { kind: 'BART' }` — ritmo dirigido pelo participante: botão
  "bombear" (balão cresce) e "coletar" (encerra o balão); explosão no breakpoint
  encerra com perda do acumulado do balão. Sem consequência programada além do jogo.
- `Trial.breakpoint?: number` — ponto de ruptura autoral **por balão** (determinismo
  total por autoria, precedente NBACK; nota: o documento já vai ao navegador com
  `correct` dos outros experimentos — mesmo status quo de piloto; mover decisão para
  o server é enduredcimento de F2, não de agora).
- `trial.comparisons = [ação-bombear, ação-coletar]` (padrão binário de ação
  TERMINAL observada); `response.count?` = bombas dadas; `response.selectedRef` =
  ação terminal (última ação: coletou ou bombear-que-explodiu); explosão derivável:
  `count >= breakpoint`.
- `correct`: BART não tem resposta certa. **Opção B1 (recomendada)**: convenção
  `correct = ação-coletar`, documentada e ignorada pela análise (menor mudança no
  schema). **Opção B2**: tornar `correct` opcional em blocos BART (regra semântica) —
  mais honesto, mexe no required do contrato.
- Nota ética/comercial: plataforma oficial do autor é acadêmica não-comercial; o
  paradigma é livre (research 03/10 §BART).

## Alternativas rejeitadas

- **TrialResult livre por instrumento** (blob JSON): quebra AD-3 e o export tidy — não.
- **TMT como N TrialResults** (1 por clique): incha o stream append-only, quebra a
  semântica de bloco/critério e trialSeq — não.

## Impacto e esforço (por instrumento)

- `core/schema`: `response += sequence?/count?`; `Trial += nodes?/breakpoint?`;
  validadores atualizados (campos opcionais → `schemaVersion` continua 1; decisão de
  contrato registrada no memlog do SPEC).
- `core/engine`: TMT/BART entram na família de ordem fixa; `respond()` inalterado
  (convenções acima).
- Adapter: branch de interação rica por instrumento (caminho clicável com feedback de
  erro; bomba/coleta com balão escalando).
- Ingestão/export/batch: **zero mudança**.
- Pacotes: `experiments/tmt-digital` (2 blocos A/B, nós numerados/alternados como
  SVGs posicionados) e `experiments/bart` (~20 balões, breakpoints autorais).
- Estimativa: 1 story por instrumento no padrão 3.6–3.8.

## Decisões pedidas ao ozp

1. TMT: aprovar `nodes` + `sequence` com a convenção `correct` = último nó?
2. BART: B1 (convenção `correct` = coletar) ou B2 (`correct` opcional em BART)?
3. Ordem de implementação: TMT primeiro (normas BR fortes, plugin jsPsych de
   referência) ou BART primeiro (interação mais simples)?
4. (Contexto de fila, não desta proposta): F5 — runner sintético não depende de TMT/BART;
   o probe nº 1 (MTS + consequências diferenciais, Peng et al.) usa o MTS que já existe.
