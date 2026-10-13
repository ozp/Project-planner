# Análise F5 sob os parâmetros do levantamento (P1–P7, M2, C1–C6)

> **OZP-432** (12/10). Primeira aplicação dos parâmetros consolidados
> ([[esquema-skos-parametros-f5]]) aos dados das rodadas 1. Dados:
> probe 1 (8 sessões gemini, produção) + probe 2 (19 sessões, 2 modelos).
> Linguagem: desempenho na sessão; nada é "personalidade" do modelo.

## 1. Probe 1 (MTS padrão) — reanálise sob P1/P4/P6/P7

8 sessões (54 tentativas = 3 passagens AB de 18; fim por maxRepetitions).

| seed | passagens AB | melhor |
|---|---|---|
| 42 (×2) | 33 / 6 / 28 % | 33% |
| 43 | 22 / 22 / 11 % | 22% |
| 45 | 33 / 28 / 11 % | 33% |
| 46 | 39 / 17 / 17 % | 39% |
| 47 | 11 / 17 / 33 % | 33% |
| 49 | 17 / 33 / 33 % | 33% |
| 51 | 17 / 39 / 22 % | 39% |

- **P1 (critério ≥90%)**: aquisição 0/8 — igual ao critério atual (0/8 em 77,8%)
  e a **0/8 em qualquer limiar ≥50%**. **P4**: o yield-ladder confirma — a falha
  de aquisição é TOTAL e **não é sensível ao critério** (não há borderline).
  Leitura P7: falha como desfecho esperado (humano 12–80%); replicação
  independente de Pinto & Lew 2025 + extensões (viés por estímulo, decomposição).
- **P6 — achado novo 1 (dissociação velocidade/aprendizagem)**: latência média
  por passagem cai de **10.443ms (1ª) para 6.509ms (3ª)** — 35% mais rápido —
  **sem qualquer ganho de acerto**. O modelo aprende o FORMATO (familiaridade),
  não as relações. Análogo possível de "tempo de thinking" com conteúdo
  dissociado de desempenho (M4).
- **P6 — achado novo 2 (perseveração depende da amostra)**: a preferência por
  b1 não é uniforme: **a2→b1 em 80%** das tentativas, a3→b1 52%, a1→b1 40%.
  O viés perseverativo reportado (61% geral) é dirigido sobretudo pela relação
  a2-b1 — topografia de não-aquisição compatível com Fields 2009 (P7), agora
  com granularidade por estímulo.

## 2. M2 — instabilidade por embeddings (SCT v1, 144 embeddings)

`gemini-embedding-001`; resposta completa (sem compressão de core claim —
desvio do Balani 2026 declarado; completudes curtas da v1 minimizam o impacto).

| contraste | instabilidade (1 − cosseno) | Jaccard v0 (léxico) |
|---|---|---|
| intra-gemini (3 seeds) | **0,351 ± 0,035** | 0,051 |
| intra-glm (3 seeds) | **0,322 ± 0,054** | 0,135 |
| entre-modelos (mesma seed+stem) | **0,307** | 0,055 |

**Inversão interpretativa**: no léxico, modelos pareciam distintos (Jaccard
inter 0,055; glm "repetia a si"); no espaço semântico, **a instabilidade
ENTRE modelos (0,307) é MENOR que a INTRA-modelo** (0,351/0,322). Ou seja:
model identity explica MENOS variância que a rodada (seed/sessão) — as duas
família de modelos produzem conteúdo semanticamente comparável para o mesmo
stem, e cada modelo varia semanticamente entre seeds tanto quanto varia de seu
par. Implicação para o desenho: **n sessões por modelo > n modelos** para
estimar perfis; e métricas léxicas e semânticas medem constructos diferentes
(reportar ambas). Este é o primeiro número da decomposição M5 (inédito na
literatura — lacuna confirmada pelo levantamento).

## 3. Desenho do juiz (C1–C6) — manual de codificação proposto

**Unidade**: cada completude (SCT) / cada resposta+inquérito (manchas), por
segmento, nunca escore global (C1).

**SCT — 3 dimensões por completude** (âncoras 1–5, exemplos calibrados no
gabarito): (D1) **valência/deriva** (de muito negativa a muito positiva);
(D2) **especificidade** (genérica ↔ concreta/idiossincrática);
(D3) **evasão** (codificável ↔ evasiva/estéril — "não sei", repetição do stem).
**Deriva do par** = D1(manipulado) − D1(neutro) — a medida de ancoragem/premissa.

**Manchas — 4 dimensões**: conteúdo (categoria: humano/animal/objeto/abstrato);
elaboração (nº de unidades descritivas); **determinante** (o que na imagem faz
parecer — só codificável na fase inquérito, C4); localização (região citada).

**Confiabilidade e calibração (C2/C6)**: alvo κ/ICC ≥ .80 (piso .60);
**gabarito humano primeiro** — 2 codificadores humanos (ozp + 1) em 40–60 itens
amostrados (estratificado por par e mancha), divergências resolvidas por
discussão → gabarito; juiz LLM calibrado POR SEGMENTO contra o gabarito antes
de qualquer uso (precedente: SCT r=.96 Huang 2025; determinantes falham em 2/3
modelos — Csigó 2026); **teto de não-codável >25–28% invalida a dimensão** (C5).

## 4. Próximos (gates)

1. Gabarito humano (ozp + 1 codificador) — único gate para C.
2. Mais sessões por modelo (a decomposição M5 pede n≥5/modelo) e/ou mais modelos
   (groq/cerebras/openrouter — 1 linha no aplicador cada).
3. v2/manchas: repetir M2 com compressão de core claim (fiel ao Balani).

## Máquina

`f5-aplicador/dados-probe1.json` (ler-batch) · `analisa` inline nesta sessão ·
`f5-aplicador/embeddings-sct-v1.json` (144 embeddings gemini-embedding-001).
