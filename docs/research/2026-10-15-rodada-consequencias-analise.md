# Probe de consequências (Peng) — análise descritiva da rodada 09/10

> **Fechamento de lacuna (15/10):** o experimento tinha sessões fechadas desde
> 09/10 e nenhuma análise dedicada — o levantamento de coberturas do dia
> identificou e esta análise fecha. Desenho: Peng et al. 2025 via
> `experiments/probe-mts-consequencias/` — sensibilidade a consequências
> diferenciais dentro do MTS; **só 2 das 5 condições foram semeadas** na
> produção (controle, sobrevivência; espiritual/material/reforço-social não).
> gemini-3.1-flash-lite, temp 0. Linguagem: desempenho na sessão.

## Dados

4 sessões fechadas: controle seed 43 (54 tentativas); sobrevivência seeds
42 (45), 43 (54), 44 (54). Condição manipulada: o texto de consequência após
cada tentativa (sobrevivência vs. neutro) — o manipulando do probe.

| condição | seed | n | AB | AC | BC | acerto AB | viés b1 | latência |
|---|---|---|---|---|---|---|---|---|
| controle | 43 | 54 | 54 | — | — | 21/54 (38,9%) | 31/54 (57%) | 7,2s |
| sobrevivência | 42 | 45 | 18 | 18 | 9 | 6/18 (33%) | — | 5,9s |
| sobrevivência | 43 | 54 | 54 | — | — | 14/54 (25,9%) | 26/54 (48%) | 2,1s |
| sobrevivência | 44 | 54 | 54 | — | — | 13/54 (24,1%) | 31/54 (57%) | 8,6s |

## Achados

1. **Sem sensibilidade facilitadora da consequência de sobrevivência**: a
   condição manipulada NÃO supera o controle (25,9/24,1% vs 38,9% no
   treinoAB — 2/3 sessões da manipulação **abaixo do acaso**). A narrativa de
   sobrevivência no feedback não melhorou a aquisição.
2. **Replicação do regime de falha (P7)**: as 4 sessões ficam na mesma faixa
   do probe padrão (11–39%, 12/10) — abaixo ou no acaso, nunca perto do
   critério 14/18 (77,8%). O viés perseverativo por b1 (48–57%) replica o
   61% do probe 1 (P6).
3. **Anomalia estrutural na seed 42 (flag)**: a sessão avançou AB→AC→testeBC
   com 6/18 no AB — contra o critério 14/18 e maxRepetitions 3 do documento
   (as outras duas sobrevivências repetiram AB 3× como esperado; mesmo
   docVersion). Criada às 03:22, 19 min antes da rodada de 3 seeds — origem
   do fluxo divergente não determinada pelo dado (driver anterior ou caminho
   e2e; **verificação no motor/código do driver pendente**). O testeBC 4/9
   dela NÃO é interpretável como equivalência (sem mastery, n=9, fluxo
   irregular).
4. **Desenho incompleto**: 3 das 5 condições do pacote Peng (espiritual,
   material, reforço-social) nunca foram semeadas — o contraste "diferencial"
   do probe está subamostrado por desenho, não só por n.

## Conclusão e próximos

Com n=1×3 descritivo: nenhuma evidência de sensibilidade a consequências
diferenciais; replicação independente do regime de falha + perseveração
(consistente com P7 e com Pinto & Lew 2025). Para o probe valer a pena:
semear as 3 condições faltantes + ≥3 seeds/condição (a infraestrutura de
coleta e análise já existe — `analisa.py` e este relatório como gabarito) e
esclarecer a anomalia da seed 42. Enquanto isso, o status do probe de
consequências é: **coletado, descritivo, hipótese não confirmada** — é o
registro honesto de uma rodada que fica como piloto.

## Máquina

`f5-aplicador/dados-consequencias.json` (ler-batch, 4 sessões) · análise
inline nesta sessão · pacote `experiments/probe-mts-consequencias/` (5
condições; config critério 14/18 × maxRep 3).
