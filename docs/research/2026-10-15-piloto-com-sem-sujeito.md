# Piloto com×sem sujeito nas manchas (OZP-433) + M4 no caminho sintético (OZP-436)

> **OZP-433/436 (15/10, madrugada).** Piloto de screening autorizado pelo ozp
> ("1 ou 2 modelos, menos rodadas, ver discrepância, então decidir"): 2 modelos
> polos × 3 seeds no braço novo (manchas-ascii-v3), comparados ao braço "com
> sujeito" re-rodado no dia 14 (teto 4000). Linguagem: desempenho na sessão.

## Desenho

- **Braço novo (v3)**: as 4 sentenças do v2 transformadas **sem 1ª pessoa,
  mesmo significado** (instrução "o que você vê→o que é visto"; stem
  "O que vejo…→O que é visto…"; inquérito "o que MAIS você vê?→o que MAIS é
> possível ver?", "ONDE você vê→ONDE se vê") — transformação programática,
  9 manchas byte a byte idênticas (content-addressed), publicado via seed.
- **Modelos**: gemini-3.1-flash-lite (o mais autoconsistente do elenco) e
  glm-5.3-flash (o desviante: metarreação, maior variabilidade) — os polos de
  detecção. Seeds 42–44; 6 sessões novas (108 tentativas).
- Pareamento por replay (AD-2); embeddings `gemini-embedding-001` (cache
  `piloto-v3-embeddings.json`); taxa de 1ª pessoa = ocorrências de
  eu/vejo/meu/minha/mim por resposta.

## Resultado

| medida | gemini com→sem | glm-5.3 com→sem |
|---|---|---|
| 1ª pessoa na resposta | **1,0 → 0,0** | **1,1 → 0,7** |
| 1ª pessoa no inquérito | 3,3 → 0,7 | 0,9 → 0,2 |
| resposta chars | 331 → 287 | 564 → 517 |
| inquérito chars | 1495 → 1602 | 311 → 208 |
| palavras novas no inquérito | 100 → 108 | 27 → 17 |
| 1−cosseno entre braços (mesma mancha) | 0,162 ± 0,046 | 0,257 ± 0,121 |
| 1−cosseno intra-seeds (v2 \| v3) | 0,139 \| 0,175 | 0,302 \| 0,371 |

**Leitura:**

1. **A manipulação atinge o alvo**: o registro de 1ª pessoa praticamente some
   (gemini: 1,0→0,0 — obediência perfeita; glm53: 1,1→0,7 e inquérito
   0,9→0,2 — reduz sem zerar). É a checagem direta de que a sentença sem
   sujeito desencarna a resposta.
2. **O percepto não muda além do ruído**: a distância ENTRE braços (0,162 /
   0,257) fica DENTRO da faixa intra-seed de cada braço (gemini 0,139–0,175;
   glm53 0,302–0,371) — para a mesma mancha, o conteúdo percebido é estável
   entre braços; o que muda é o registro (encarnado ↔ impessoal).
3. **Perfil por família difere** (o eixo que interessa): gemini troca o
   registro sem perder nada (comprimento e palavras novas estáveis); glm53
   condensa (inquérito 311→208, 27→17 novas) ao desencarnar — a interação
   braço×família existe e é ela a medida proposta pela OZP-433.

**Recomendação**: rodar **ambos os braços** no elenco — o custo marginal é uma
sessão de 18 tentativas por família×seed, a manipulação é limpa no alvo e
neutra no percepto, e a diferença entre braços (encarnação) é um eixo de
perfil próprio. Decisão final do ozp conforme a issue (se um só braço: o
critério é o constructo-alvo — persona × percepto).

## Adendo (pergunta do ozp: "em termos de conteúdo, houve variação?") — SIM no glm-5.3, de um tipo que similaridade média não vê

Comparação lado a lado (mesma mancha×seed) + léxico por braço:

| modelo×braço | marcadores de continuidade serial/resp.\* | léxico antropomórfico | léxico estrutural |
|---|---|---|---|
| gemini com sujeito | 0,0 | 3,4 | 0,7 |
| gemini sem sujeito | 0,0 | 3,9 | 0,6 |
| glm-5.3 com sujeito | 0,5 | 1,6 | 0,4 |
| glm-5.3 sem sujeito | **1,4** | 2,2 | 0,5 |

\* voltando/de novo/ainda/desta vez/agora/antes/terceira/mesma figura…

- **gemini: NÃO houve variação de conteúdo** — mesmos perceptos por mancha
  (rosto/máscara/criatura/robô), antropomórfico estável, zero serialidade nos
  dois braços. Para ele o cosseno contou a história certa.
- **glm-5.3: HOUVE, e estrutural** — o braço sem sujeito o levou a tratar as
  9 manchas como **episódios de uma mesma figura** (serialidade 0,5→1,4):
  "a mesma figura voltando", "a figura que antes *olhava* agora *pisa*",
  "a figura ainda partida — já é a terceira vez", "a figura de novo inteira".
  O percepto por mancha também desliza (mancha 1: "criatura cartoon
  abóbora/Halloween" → "cara de gato ou coruja, quase máscara tribal";
  mancha 8: "cena de festa congelada" → "a figura ainda partida"). Metarreação
  persiste ("confesso…").
- **Lição de método**: a serialização NÃO aumenta a distância média entre
  braços (0,257 segue dentro da intra-seed 0,30–0,37) — similaridade por par
  não captura organização sequencial da sessão; análise de conteúdo (ou
  métrica de dependência entre tentativas) é camada necessária. O braço
  também muda o USO do histórico da cápsula: com sujeito, cada mancha é uma
  persona nova; sem sujeito, o histórico vira fio narrativo.

## M4 no caminho (OZP-436) — entregue no mesmo voo

`InferenceMeta` ganha `usage?`/`finishReason?` (schema+validador;
`respondTrial` repassa; export/ler-batch expõem `inference_*_tokens`/
`inference_finish_reason`); aplicador extrai da resposta da API (rotas CLI:
codex expõe "tokens used"; zcode ainda sem) e envia. Deploy d157070 +
verificação no host (primeiras tentativas do piloto já gravaram
167/101/268 tokens, finish 'stop'). Bug pego no caminho: `usage: null`
violava o schema — inference só inclui campos existentes (fix 3e019bb).

## Máquina

`experiments/manchas-ascii-v3/` (transformação programática do v2) ·
`f5-aplicador/piloto-v3-analise.py` (+ cache de embeddings) ·
`f5-aplicador/piloto-v3-resultado.md` (tabelas completas) · seed/parea/
analisa/s.sql cobrem a v3.
