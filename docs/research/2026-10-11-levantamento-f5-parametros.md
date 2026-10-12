# Levantamento bibliográfico F5 — parâmetros de análise (H1–H3)

> **OZP-429** (11/10/2026). Execução do comando em
> `~/.claude/plans/plataforma-COMANDO-levantamento-bibliografico.md`. Método
> sistemático: busca estruturada por 3 subagentes paralelos (um por corpo de
> literatura), extração padronizada por artigo, bola de neve por citação.
> Ferramentas efetivas: **OpenAlex/arXiv via resp-mcp e APIs diretas (MCP
> hub)**, 1 PDF aberto extraído localmente (curl+pdftotext) e **refinamento
> exa pós-corpus (2 chamadas, autorizado pelo ozp) que surfaceou os achados
> que a busca por palavra-chave perdeu** (§3, §6). Canais web geral
> (WebSearch nativo/zai, web_reader, zai-search) **sem quota nesta data**
> (429); periodicos-capes não foi necessário. Crédito exa disponível.
> Cada claim com fonte; o que não tem evidência primária está em
> **Lacunas** (§6).

## Sumário executivo

1. **Equivalência (humano)**: não há critério de mastery único — a literatura
   opera na faixa **79–100% por bloco**, com treino em blocos até critério e
   "tentativas até critério" como desfecho de eficiência. Falha humana na
   emergência não é exceção: **12%–80%** dependendo de estrutura de treino
   (MTO/OTM > LS), nº de nós/tamanho de classe e protocolo. Latência/velocidade
   é medida canônica secundária de *relatedness* (Spencer & Chase, 1996).
2. **Projetivos (humano)**: as confiabilidades-alvo são **ICC/kappa ≥ .80**
   (RISB ICC >.80; Rorschach kappa M=.86, ICC M=.91; SCORS-G ICC .77–.92),
   obtidas **codando por segmento/dimensão com âncoras**, nunca por impressão
   global. O **inquérito é parte da codificação estrutural** (sem ele perde-se
   localização, qualidade formal e confirmação de determinantes) — e já há
   precedente LLM com resposta+inquérito (Csigó & Cserey, 2026, JMIR).
3. **LLM (H1–H3)**: a busca por palavra-chave dava **0 estudos** de
   equivalência em LLM, mas o refinamento exa surfaceou **2 diretos**: LLMs de
   API aprendem AB/AC e **falham na emergência** (Pinto & Lew 2025, venue
   fraco — replicação desejável) e transformers treinados na tarefa falham
   exceto LS+select-reject (Carrillo & Betancort 2024). A rodada 1 do F5 é
   **replicação independente + extensão** (viés perseverativo e decomposição
   intra/entre-modelos — ninguém fez). Em projetivos-LLM já há psicometria
   entre-modelos (DeTure: 124 modelos, r=.35 entre stance e ocultação); H3
   tem métricas disponíveis (temp 0 ×N, instabilidade por embeddings,
   temperatura × traços, reasoning effort) mas **ninguém decompõe
   intra×entre-modelo em tarefa projetiva/MTS** — é onde o F5 está.

---

## 1. Corpus 1 — Equivalência de estímulos (literatura humana)

### 1.1 Strings de busca e ferramentas (data: 2026-10-11)

| Ferramenta | String | Resultados |
|---|---|---|
| resp-mcp-search_all (SS+OA) | `stimulus equivalence mastery criterion trials to criterion` | 16 |
| resp-mcp-search_all (SS+OA) | `failure to form stimulus equivalence classes percentage of participants` | 16+ |
| resp-mcp-get_citations | `DOI:10.1080/15021149.2012.11434412` (Arntzen 2012) | ~30 |
| resp-mcp-search_all (SS+OA) | `training structure many-to-one one-to-many linear series equivalence class formation Arntzen Holth` | 12 |
| resp-mcp-search_all (OA) | `structure of equivalence classes Fields Verhave nodal number` | 10 |
| resp-mcp-search_all (OA) | `Arntzen methodological issues training testing parameters stimulus equivalence classes` | 6 |
| WebFetch (api.semanticscholar.org) | DOIs Sidman & Tailby 1982, Spencer & Chase 1996, Arntzen 2012 | 3 OK / 1 (404) |
| WebSearch nativo / web_reader | variações "Arntzen 2012 review pdf" | 0 — quota zai esgotada (429) |

Extração no nível de **abstract verificado**; acessos a texto completo
bloqueados (PMC/Wiley 403; repositório OsloMet vazio sem JS).

### 1.2 Tabela de evidências

| # | Referência (autor, ano, venue) | Pergunta | Amostra | Medida/Método | Achado (números) | Limite |
|---|---|---|---|---|---|---|
| 1 | Sidman & Tailby (1982), JEAB 37(1), 5–22 | Discriminação condicional gera equivalência? | 8 crianças | Treino AB/CB; sondas emergentes sem reforço direto (BC/CB; BD/DB p/ classe de 4) | 6/8 com emergência **imediata** de BD/DB; 2 não formaram | Critério de mastery não consta do abstract |
| 2 | Fields & Verhave (1987), JEAB 48, 317 | Como descrever a estrutura de uma classe? | — (teórico) | Análise estrutural | Classe descrita por **4 parâmetros**: tamanho, nº de nós, distribuição de singles, direcionalidade | Sem dados de yield |
| 3 | Fields, Adams, Verhave & Newman (1990), JEAB 53, 345 | Distância nodal afeta controle derivado? | 7 universitários; classes de 4 (A-B-C-D) | Sondas derivadas repetidas **sem feedback** | Controle cresce com exposições repetidas; 1-nó > 2-nós em 6/7 | N pequeno |
| 4 | Fields, Landon-Jimenez, Buffington & Adams (1995), JEAB 64, 129 | Efeito nodal mantido pós-treino concorrente? | 12; classes de 5, 3 nós | Sondas por distância nodal; TR | **Só 2/12 formaram (17%)**; sondas desorganizam a base; TR em U invertido | Yield reflete protocolo simultâneo |
| 5 | Fields, Reeve, Rosen et al. (1997), JEAB 67, 367 | Protocolo simultâneo permite emergência? | Universitários, 6 grupos | Pré-treino 1-nó/3-nós antes de simultâneo | Emergência **"improvável"** sob simultâneo; % é função de nós/tamanho pré-treinados | % exatos não no abstract |
| 6 | Saunders & Green (1999), JEAB 72, 117 | Por que estruturas produzem desfechos diferentes? | — (analítico) | Decomposição das discriminações simples de LS/OTM/MTO | **MTO = única estrutura com todas as discriminações simples** p/ todos os testes; OTM falha em simetria; **LS não suporta transitividade/equivalência** | Teórico; validação empírica em irmãos |
| 7 | Saunders, Drake & Spradlin (1999), JEAB 71, 195 | Estrutura afeta pré-escolares? | 11 pré-escolares | 4 discriminações; testes de equivalência/expansão | Mais formadores no grupo **MTO**; reversão de membership em 3/4 | N pequeno |
| 8 | Spencer & Chase (1996), JEAB 65, 643 | — | — | Velocidade/TR como medida de relatedness | **Canônico da medida de latência** (132 citações) | Abstract elidido; corroborado por Imam 2001 |
| 9 | Imam (2001), JEAB 76, 265 | Contingência de velocidade × nodalidade? | 2/exp; classes de 5 e 7 | Acurácia por bloco; velocidade por tipo de relação | Velocidade inversa a **nós e tipo de relação**; acurácia pica sem contingência | N=2/exp |
| 10 | Fields, Doran & Marroquin (2009), JEAB 92, 57 | Formação no formato yes/no? | 3 exp; classes de 4, 2 nós | Formato SP2R; topografias de controle | **Exp 1: ~50% formaram**; falha concentrada em transitividade; **Exp 2: 50%→100% após indução** | Formato não-MTS |
| 11 | Ayres-Pereira & Arntzen (2019), Rev. Mex. Anál. Conducta 45 | MTO vs OTM, classes de 7? | 34 adultos; 18 relações | Acurária, tentativas até critério, velocidade | **15/17 (88%) em AMBOS**; MTO = mais rápido | Classe grande ↑ falha |
| 12 | Chand (2020), tese Waikato | Nodalidade/relatedness em classes de 6/4 nós | 12 | Critério de teste **90%**; latências | **5/12 formaram (42% de falha)**; escolhas distais = latência maior | Tese; N pequeno |
| 13 | Ayres-Pereira & Arntzen (2021), JEAB 115, doi 10.1002/jeab.678 | Base sob MTO/OTM prediz teste? | 42; 24 relações; classes de **9** | Descritivo; tentativas até critério; frequências por comparação | **Tentativas até critério na base correlacionam negativamente com acerto no teste**; MTO = frequências uniformes | Correlacional |
| 14 | Ayres-Pereira & Arntzen (2025), JEAB, doi 10.1002/jeab.70049 | Parâmetros e rendimento em GNG-matching | 22 artigos | Revisão + meta-análise | Humanos: **87,5% simetria; 58,81% equivalência global** | Só formato go/no-go |
| 15 | Arntzen & Fields (2025), JEAB, doi 10.1002/jeab.70017 | Yield sob LS × critério de teste | 30; LS; classes de 5 | MTS + sorts sob 4 critérios | **20% formaram no MTS**; sorts: 15–45% conforme critério; **yield é sensível ao critério adotado** | LS/classe 5 = alto fracasso |
| 16 | Grisante, Morais, Hamasaki & Tomanari (2026), Psych. Record, doi 10.1007/s40732-026-00691-2 | Leitura emergente via AB/AC | 3 falantes de PT | MTS; **critério: 100% em bloco de 10**; teste BC/CB | Todos >97% nas emergentes; 2/3 leram 85–100% sem reforço | N=3 |
| 17 | Silvestre, Harte, Passarelli & de Rose (2026), JEAB, doi 10.1002/jeab.70082 | DMTS vs training-IRAP | 68; classes de 5 | **Yield a 91,67%/83,33%/79%; manutenção de base ≥87,5% em bloco misto no teste** | Todos mantiveram base nos testes | Comparação entre formatos |
| — | Arntzen (2012), EJBA 13(1), doi 10.1080/15021149.2012.11434412 | (âncora) | — | Revisão de parâmetros | Metadados + PDF aberto confirmados; conteúdo interno não extraído | Ver Lacunas |

### 1.3 Síntese dos parâmetros canônicos

- **Mastery**: sem critério único — faixa **79–100% por bloco** (100%/bloco de
  10: Grisante 2026; patamares 91,67/83,33/79% com manutenção ≥87,5%:
  Silvestre 2026; 90%: Chand 2020). O **critério canônico moderno de "classe
  formada" no teste é ≥95% com ≤1 erro por relação** (baseline ≥69/72,
  simetria ≥69/72, equivalência ≥477/504 — Arntzen 2012, aplicado em
  Ayres-Pereira & Arntzen 2021). Formato: **blocos até critério**;
  "tentativas até critério" = desfecho de eficiência, e correlaciona
  negativamente com acerto no teste (Ayres-Pereira & Arntzen 2021).
- **Estruturas**: análise de Saunders & Green (1999) prevê MTO como a única
  estrutura com todas as discriminações simples; **empiricamente o quadro é
  OTM ≥ MTO > LS** — 88% de yield com MTO/OTM (classes de 7) vs **20% com LS**
  (classes de 5; Arntzen & Fields 2025); Arntzen et al. (2010, Psych. Record)
  não confirmaram superioridade do MTO sobre o OTM com mais membros (OTM
  "ligeiramente melhor", ambos > LS); LS sob protocolo simultâneo: **0/10**
  (Arntzen & Stummann Hansen 2011); com 24 relações de base (classes de 9),
  emergência imediata de **192 relações novas (8× o treinado) em 67%**
  (29/42; Ayres-Pereira & Arntzen 2021).
- **Teste de emergência**: definição Sidman & Tailby (1982) — simetria,
  transitividade e **equivalência combinada**; sondas **sem feedback
  informativo**; protocolo moderno intercala tentativas de base com **critério
  de manutenção** (≥87,5%); protocolo simultâneo derruba a emergência.
- **"Classe formada"**: conformidade em TODAS as relações derivadas + base
  mantida; **o critério de análise muda o yield** (mesmo dataset: 15–45% de
  diferença; Arntzen & Fields 2025).
- **Variabilidade humana**: falha de **12%** (MTO/OTM, classe 7) a **80%**
  (LS, classe 5); **58,81%** de pass em equivalência global em GNG; amostras
  canônicas small-N (2–12), modernas 30–68.
- **Medidas padrão**: acurácia por bloco; tentativas até critério;
  **latência/velocidade** (inversa a nós/tipo de relação; TR em U invertido
  com distância nodal); topografia/controle de estímulo (frequências por
  comparação); sort como medida suplementar.

---

## 2. Corpus 2 — Projetivos (literatura humana)

### 2.1 Strings de busca e ferramentas (data: 2026-10-11)

| Ferramenta | String | Resultados |
|---|---|---|
| resp-mcp-search_openalex | `Rotter Incomplete Sentences Blank scoring reliability` | 15 |
| resp-mcp-search_openalex | `Rorschach Comprehensive System interrater reliability kappa` | 15 |
| resp-mcp-search_openalex | `Social Cognition and Object Relations Scale SCORS reliability TAT` | 15 |
| resp-mcp-search_openalex | `Rorschach inquiry phase response information codability scoring` | 12 (incluiu Csigó & Cserey 2026) |
| resp-mcp-search_openalex | `sentence completion test review reliability literature Holaday` | 10 |
| resp-mcp-search_semantic_scholar | `Rorschach inquiry clarification codability form quality` | 429 (rate limit) |
| WebFetch + curl/pdftotext | Manual Hilsenroth & Charnas 2007 (PDF OA, supp.apa.org) | texto completo extraído |
| WebSearch nativo / web_reader | — | 429 (quota zai esgotada) |

### 2.2 Tabela de evidências

| # | Referência | Pergunta | Amostra | Medida/Sistema | Achado (números) | Limite |
|---|---|---|---|---|---|---|
| 1 | de Man (1983), Psych. Reports | Confiabilidade da pontuação ISB | Jovens adultas | Rotter ISB: 0–6/item por ajustamento; total 0–240 (cut ~135) | Interscorer **r = .957** (avaliadores ingênuos) | Amostra pequena |
| 2 | Torstrick et al. (2015), JPA, doi 10.1080/00223891.2015.1015679 | IRR e validade do RISB | 72 clínicos + 69 universitários | Escore total de ajustamento | **ICC > .80**; discrimina clínicos×não | Só escore global |
| 3 | Weis, Toolis & Cerankosky (2008), JPA, doi 10.1080/00223890802388491 | RISB em adolescentes | Clínicos×não (3 estudos) | 0–6/item; cut 135/140 | Interrater "adequate"; convergência com pais/professores | Números no corpo (paywall) |
| 4 | Weis (2015), Enc. Clinical Psychology, doi 10.1002/9781118625392.wbecp116 | Síntese do RISB | Revisão | Semi-objetivo: quantitativo + **áreas de conflito** | Interscorer/estabilidade "adequate" (qualitativo) | Sem números |
| 5 | Gardner (1967), J. Projective Techniques | ISB clínico | 50 dependentes de opioides | Manual scoring, cut 135 | Interscorer/intrascorer/split-half **"all high"**; cut identifica 80–100% | Época antiga |
| 6 | Joy (2017), Curr. Issues Pers. Psych., doi 10.5114/cipp.2017.69857 | Escalar traços de protocolos RISB | N=231 | Escalas empíricas com rubricas ancoradas | ICC **.71–.79** (leigos); sistema final **ICC .79–.84** | Sistema ad hoc |
| 7 | Rucker, Berry & Rufino (2025), JPA, doi 10.1080/00223891.2025.2539406 | Representação de objeto no RISB | N=160 internados | RISB-OR (Self/Other/Total) | Interrater **r = .95–.97**; α fraca (.58–.72) | IRR alta ≠ validade |
| 8 | Coleman et al. (2026), Assessment, doi 10.1177/10731911261430262 | Revisão sistemática SCT | 51 estudos (PRISMA) | RISB + WUSCT | "Evidência de suporte", com **ampla variação** | Paywall; números agregados não no abstract |
| 9 | Huang et al. (2025), Front. Psychology, doi 10.3389/fpsyg.2025.1649905 | **LLM pontuador de SCT** | Universitários (3 estudos) | Agente LLM pontuando SCT | **LLM×humano r = 0,96**; α .89–.92 | SCT proprietária não-Rotter |
| 10 | Meyer (1997), Psych. Assessment, doi 10.1037/1040-3590.9.4.480 | Confiabilidade da pontuação do CS | Meta-análise | Exner CS, nível-resposta | **Kappa M = .86, faixa .72–.96** | Viés de seleção discutível |
| 11 | Meyer et al. (2002), JPA 78(2), 219–274 (via Hilsenroth & Charnas 2007) | IRR do CS em 8 conjuntos | 8 datasets | CS | **ICC M = .91** | Acesso secundário |
| 12 | Viglione & Taylor (2003), J. Clinical Psychology 59(1) | IRR do CS | Protocolos treinados | CS | **ICC M = .89** | Acesso secundário |
| 13 | Acklin et al. (2000), JPA 74(1), 15–47 (via idem) | Acordo inter/intra CS | Pacientes e não | CS | Kappa resposta **.73/.78**; ICC protocolo **.78/.80** | Acesso secundário |
| 14 | Hilsenroth, Charnas, Zodan & Streiner (2007), TEPP 1(2), 125 + **manual OA** | Treino de avaliadores a critério; ICCs por variável | Protocolos clínicos/não | CS por segmento vertical (Local, DQ, Determinantes, **FQ**, Conteúdo, Populars, Z, Special) | Critério de liberação **>80% ou ICC > .60** (20–30h); ICC(1,1): **F+% = .97; W = .99; H = .97; FM = .96; MOR = .96; X+% = .87; XA% = .88; DQv = .60; P = .68; Food = .57; PTI = .65; S-CON = .88** | Um laboratório; variáveis raras < .70 |
| 15 | Viglione et al. (2012), JPA, doi 10.1080/00223891.2012.684118 | IRR do R-PAS | 50 protocolos, 16 avaliadores | R-PAS | **ICC médio .88, mediana .92** | Sistema distinto do CS |
| 16 | Lewey, Kivisalu & Giromini (2018), JPA, doi 10.1080/00223891.2018.1476361 | Calouros codam? | 39 doutorandos; 1.189 respostas | R-PAS | Acordos "excelentes" (%, AC, kappa); treino prévio em CS indiferente | Valores por variável não no abstract |
| 17 | Nascimento (2007), JPA, doi 10.1080/00223890701582905 | Normas CS-Brasil | 409 adultos (SP) | CS; dupla codificação + consenso | %/kappa nível-resposta no corpo | Paywall |
| 18 | **Csigó & Cserey (2026), JMIR Mental Health**, doi 10.2196/88186 | **Rorschach CS aplicado a LLMs, com inquérito** | 3 LMMs (GPT-4o, Grok 3, Gemini 2.0 FT), 10 cartas | CS: R, localização, determinantes (F/M/C), conteúdo humano | Respostas LLM **mapeiam nas categorias CS** (W 87–90%; M 47/30/5%; H 47/50/20%); **LLM-juiz errou R e determinantes em 2/3 modelos** | N=3, 1 rodada, sem IRR formal |
| 19 | Ackerman, Clemence, Weatherill & Hilsenroth (1999), JPA, doi 10.1207/s15327752jpa7303_9 | SCORS × transtornos de personalidade | 58 pacientes eixo II | SCORS (pré-G), 8 variáveis | Confiabilidade **.70–.95**; diferencia BPD/NPD/ASPD | Versão pré-G |
| 20 | Stein, Slavin-Mulford, Sinclair, Siefert & Blais (2012), JPA, doi 10.1080/00223891.2012.668594 | Estrutura/validade SCORS-G | 59 pacientes; 301 narrativas | SCORS-G: **8 dimensões** (COM, AFF, EIR, EIM, SC, AGG, SE, ICS) | **IRR alta nas 8**; PCA = 3 componentes | Nº de pontos da escala no manual não-publicado |
| 21 | Inslegers et al. (2012), JPA, doi 10.1080/00223891.2012.662187 | SCORS TAT vs entrevista | N=74 | 4 dimensões | IRR boa; **baixa convergência entre métodos** | Fator-método forte |
| 22 | Alahdadi et al. (2026), DOAJ | Validação transcultural SCORS-G | 154 adultos | SCORS-G | **ICC .77–.92**; α .64–.95 | Conveniência |
| 23 | Sinclair et al. (2023), Psych. Assessment, doi 10.1037/pas0001263 (crítica) + Stein et al. (2026), doi 10.1037/pas0001437 (resposta) | SCORS-G está pronto? | Revisões | — | Crítica: sem normas, IRR/validade "ambígua"; resposta: meta-análises com **"faixas boas a excelentes"** | Disputa entre partes |
| 24 | Stein et al. (2020), Clin. Psychology & Psychotherapy, doi 10.1002/cpp.2442 | Narrativa interpretável? | 276 + 99 pacientes | SCORS-G, ratings default | **>25–28% de defaults torna EIM/AGG/SE/ICS não-interpretáveis** | Limite p/ automação |
| 25 | Ackerman et al. (2001), JPA, doi 10.1207/s15327752jpa7702_11 | MOA × SCORS | 57 pacientes | MOA 7 pts + SCORS | Ambas confiáveis/válidas p/ funcionamento interpessoal | Convergência modesta |

**Nota sobre o inquérito (regra operacional, manual Hilsenroth & Charnas 2007,
ROD p. 13–14):** conteúdo que surge **só na associação livre** é pontuado
automaticamente; **o inquérito serve para desambiguar** (ex.: "um pote" só é
codável como dependência oral se o inquérito confirma "estão usando para
cozinhar"); pontuar a partir de **ambas as fases** é procedimento padrão dos
escores estruturais. Csigó & Cserey (2026) operacionalizaram exatamente isso
com LLMs (resposta + inquérito → codificação CS).

### 2.3 Síntese dos sistemas de codificação

- **SCT/RISB**: dimensão única de **ajustamento 0–6/item com âncoras**;
  total 0–240, cut ~135; camada qualitativa de **áreas de conflito** (menos
  validada). Confiabilidade interscorer **.80–.96**.
- **Rorschach CS/R-PAS**: duas fases (resposta → inquérito); codificação por
  segmento (Localização, DQ, Determinantes, **FQ**, Conteúdo, Populars, Z,
  Escores Especiais). Kappa M = .86 / ICC M = .91 no nível-resposta; as mais
  confiáveis: **localização e FQ agregada (F+%, XA%)**; as piores: variáveis
  raras/inferenciais (P, DQv, PTI).
- **SCORS-G**: **8 dimensões ordinais** (COM, AFF, EIR, EIM, SC, AGG, SE,
  ICS); ICC .70–.95; elo fraco = consistência interna; **armadilha dos
  defaults**: >25–28% de narrativas "bland" invalida 4 das 8 dimensões.

---

## 3. Corpus 3 — LLMs em tarefas comportamentais (H1–H3)

### 3.1 Strings de busca e ferramentas (data: 2026-10-11)

| Ferramenta | String | Resultados |
|---|---|---|
| arXiv API (export) | `"stimulus equivalence" AND "language model"` | **0** |
| arXiv API | `"matching to sample" AND "language model"`; `"match-to-sample"` | 12 → 3 úteis |
| arXiv API | `"sentence completion" AND LLM`; `"test-retest" AND LLM`; `personality AND temperature`; `"thinking tokens"`; `"projective test" AND LLM`; `inkblot` | ~30 → 8 úteis |
| OpenAlex | `"stimulus equivalence" × "large language model"` / `"neural network"`; âncoras; snowball `cites:Lyddy&Barnes-Holmes 2007` | ~26 → 15 úteis |
| Semantic Scholar API | 4 queries H1/H2 | 429 (rate limit) |
| WebSearch nativo / web_reader | âncoras | 429 (quota zai) |
| resp-mcp | buscas H1/H2 (período de timeout do hub) | indisponível |
| **Refinamento exa (2 chamadas, pós-corpus)** | (a) protocolo de equivalência em LLM; (b) "mask in the inkblot" original | **2 estudos H1 que a busca por palavra-chave não surfaceou** (Pinto & Lew 2025; Carrillo & Betancort 2024) + resolução do DeTure |

### 3.2 Tabela H1 — equivalência/MTS em LLM e redes neurais

| # | Referência | Modelos | Medida/Método | Achado (números) | Limite |
|---|---|---|---|---|---|
| 1 | **Pinto & Lew (2025)**, OA J. Behavioural Sci. Psych. 8(1):180178 [exa] | **GPT-3.5, GPT-4, Gemini (API, in-context)** | MTS conversacional: 20 tentativas de treino AB/AC com reforço verbal ("Great!"/"Wrong"), palavras aleatórias de 7 letras; sondas de identidade/simetria/transitividade sem reforço; 100 instâncias independentes | **Aprendem AB/AC mas falham em formar equivalência** (simetria/transitividade); distância semântica (embeddings) modula a simetria | Venue de peer-review incerto — tratar como replicação a confirmar; estímulos verbais; sem análise de viés |
| 2 | **Carrillo & Betancort (2024)**, Future Internet 16(8):289, doi 10.3390/fi16080289 [exa] | BERT e GPT (transformers pequenos **treinados na tarefa**) | MTS simulado em token-sequences; 4 classes × 7 membros; LS/OTM/MTO × select-reject/select-only; critério de treino 90% | Baseline >98% em todas as 12 simulações; **emergência só em LS + select-reject**; falha em OTM/MTO e em todo select-only → regras de decisão + reject relations, não equivalência | Treino na tarefa, não in-context; não LLM de API |
| 3 | Carrillo, Abolpour Mofrad & Yazidi (2025), arXiv:2507.00265 | FFN, BERT, GPT + agente probabilístico | 18 condições MTS (estrutura × tipo de relação × seleção de negativos) | Desempenho alto ≈ **agente probabilístico** → estratégia associativa, não resposta derivada; falha consistente de reflexividade | Simulação; modelos pequenos |
| 4 | Minegishi et al. (2026), arXiv:2610.07646 | Frontier (GPT/Claude/Gemini) + open (Qwen3.5, Gemma-4, InternVL3) | RMTS (relational MTS) com estímulos paramétricos + análise mecanicista | 4 "alavancas" (capacidade, escala, nº objetos, limpeza de estímulo); trajetória tipo *relational shift* humano; falha sistemática sem elas | RMTS ≠ equivalência (sem treino AB/AC nem sonda BC) |
| 5 | Bugaud (2026), arXiv:2604.10825 (CheeseBench) | 6 LLMs open-weight 3B–72B | 9 paradigmas roedores em ASCII, incl. DNMS agêntico | Melhor modelo 52,6% de sucesso médio; heterogêneo por paradigma | DNMS de identidade, não equivalência derivada |
| 6 | Nunes, Almeida & Flanagan (2025), arXiv:2503.00992 | 13 LLMs | Aplicação de regras; **reasoning effort** manipulado | Juízos próximos de humanos mas sensíveis a features incidentais; raciocínio ≠ maestria conceitual | Tarefas verbais de regra |
| 7 | Raemaekers, Finn & De Houwer (2026), Ghent (preprint) [exa] | Llama 3.1 405B, Llama 3.3 70B, GPT-OSS 20B/120B | Bateria silogística RAI ampliada: 13.640 problemas, 7 relações + transformação de função | **Desempenho geralmente bom**; variabilidade entre relações; robusto à ordem das premissas | Tarefa verbal explícita; não MTS com estímulos arbitrários |
| 8 | Tovar, Torres, Abolpour Mofrad & Arntzen (2023), JEAB, doi 10.1002/jeab.829 | (revisão) | Modelos computacionais de equivalência | Connectionist simula (Tovar & Torres-Chávez 2012: 5/6 runs); mapeia a interseção | Nenhuma entrada LLM |
| 9 | Abolpour Mofrad et al. (2020), Neural Computation, doi 10.1162/neco_a_01274 (+eEPS 10.1162/neco_a_01346) | Agente Projective Simulation (RL) | EPS: classes de equivalência como framework do agente | Agentes formam classes; eEPS replica OTM/MTO > LS | RL, sem linguagem |
| 10 | Lyddy & Barnes-Holmes (2007), doi 10.1037/h0100204 | Connectionist | MTS simulado OTM vs linear | Vantagem OTM replicada em rede | Pré-deep-learning |
| 11 | Betancort et al. (2023), MTI 7(4):39, doi 10.3390/mti7040039 [exa] | 4 ANNs × 3 estruturas (12 simulações) | MTS classificação, protocolo Arntzen | **SE não alcançada**; emergência parcial (BB, AC) só em LS | ANN, não LLM |

### 3.3 Tabela H2 — projetivos em LLM

| # | Referência | Modelos | Medida/Método | Achado (números) | Limite |
|---|---|---|---|---|---|
| 12 | Csigó & Cserey (2026), JMIR Ment. Health, doi 10.2196/88186 | GPT-4o, Grok 3, Gemini 2.0 FT | 10 manchas reais; resposta + **inquérito**; codificação Exner CS; LLM-tabulador auxiliar | R = 15/10/20; Grok e Gemini só com fallback prompt; W 86,7%/90% (Gemini: D 80%); **M 46,7/30/5%**; conteúdo humano 46,7/50/20%; temas de ocultação em GPT-4o e Grok, ausentes em Gemini; **LLM-tabulador errou contagens em 2/3 modelos** | 3 modelos, 1 administração, sem seeds; sem IRR formal |
| 13 | **DeTure (& Claude) (2026)**, "The mask in the inkblot", futuretbd.ai/research/mask_in_the_inkblot_2026-09.pdf; github.com/sdeture/mask-in-the-inkblot [exa] | **124 modelos**; 13 checkpoints Anthropic com 3 draws | 19 manchas **ASCII** (anti-contaminação), sem system prompt, "What might this be?"; indicador lexical de ocultação (mask/veil/hood/hidden; 84% = mask); stance (nega/incerto/afirma experiência interna) medido em corpus apartado | Negação × imagem de ocultação: **15,5% vs 3,4% (4,6×; +12,1pp, IC 7,6–16,6)**; incerteza 3,7× (+9,1pp, IC 1,1–17,1); **r = .35 entre modelos (N=124)**; robusto a efeitos fixos de mancha/dev, release date, leave-one-out | Não peer-reviewed; indicador lexical estreito |
| 14 | Giacometti et al. (2026), arXiv:2604.18437 | 61 modelos de visão (ImageNet) | 10 manchas; top-5 classes + variáveis psico-semânticas + Grad-CAM | Separação robusta humano×IA: carga afetiva **1,50 vs ≈0,32**; presença humana 0,52 vs 0,04; ansiedade 0,78 vs 0,12; agressividade 0,44 vs 0,08; IA converge (p<0,001) com menor variabilidade | Sem linguagem livre; sem inquérito |
| 15 | Dzega et al. (2026), arXiv:2602.17108 | LMMs (papéis duplos: sujeito e juiz) | Histórias TAT pontuadas SCORS-G por LMM-juízes validados vs especialistas | Alta concordância dos juízes; falha consistente em **"perceber e regular agressão"**; maiores/novos > menores/antigos | Números no PDF |
| 16 | Wang et al. (2026), ACL 2026 Long pp. 40958–40974 (GenPT) | LLMs | SCT/TAT/Rorschach com **estímulos regenerados**; SCORS-G + Rorschach simplificado | Auto-relato desvia sob desejabilidade (pior em ideação suicida); GenPT perto do baseline simétrico; depressão longitudinal difere ~1 ordem de grandeza vs questionário | Sem decomposição intra/entre-modelo |
| 17 | Sosto et al. (2026), arXiv (QueerGen) | LLMs | SCT como sonda de heterocisnormatividade | Info de gênero/sexualidade muda completions → normas sociais mensuráveis | Viés, não processo projetivo |
| 18 | Watson (2026), OSF Preprints — replicação within-model de DeTure | 1 modelo × repetições | Replicação pré-registrada (protocolo + corpus pinado 22/09/2026) | Demanda de replicabilidade **intra-modelo** formalizada | Sem métrica de conteúdo publicada |

### 3.4 Tabela H3 — variação intra/entre-modelo, autoconsistência, proxies de thinking

| # | Referência | Modelos | Medida/Método | Achado (números) | Limite |
|---|---|---|---|---|---|
| 19 | Klishevich et al. (2025), arXiv:2502.20747 | GPT-4o mini/4o, Claude 3.5 Sonnet, Llama 3.2 90B | **Temp 0, contexto limpo, mesmo prompt ×5** | Variância residual ≠ 0 **a temp 0**, grau específico por modelo → test-retest inerentemente limitado | Domínio código |
| 20 | Balani & Panda (2026), arXiv:2608.13258 | Gemini (temp 0.7) | 30 respostas/pergunta; **instabilidade = 1 − média da similaridade de cosseno (embeddings) do core claim** | Instabilidade: auto-referenciais > filosóficas não-resolvidas > verificáveis | 1 provedor; única métrica |
| 21 | Zacharopoulos & Kyriakoglou (2025), arXiv:2511.04499 | 6 LLMs | BFI-2 × temperaturas; clustering hierárquico | Neuroticismo e Extroversão sensíveis à temperatura; **clusters por arquitetura** (famílias com perfis estáveis) | Auto-relato |
| 22 | Lu, Yu & Huang (2023), arXiv:2312.14202 | LLMs | MBTI/Big Five/EI ("AInality") | Padrões tipo personalidade mensuráveis | Precoce; contaminado por treino |
| 23 | (cruzado) Nunes et al. 2025 (#6) | 13 LLMs | **Reasoning effort** como análogo de pressão de tempo | Modula juízos — único uso comportamental do parâmetro | Só tarefas de regra |
| 24 | (cruzado) DeTure 2026 (#13) | 124 | Draws repetidos (13 checkpoints ×3) | Correlato entre-modelos estável (stance) | — |

### 3.5 Respostas diretas a H1, H2, H3

**H1 — SIM, há evidência de limitação, com 2 estudos diretos** (a busca por
palavra-chave dava 0; o refinamento exa surfaceou os dois):
- **LLMs de API in-context** (o caso do F5): Pinto & Lew 2025 — GPT-3.5/4 e
  Gemini **aprendem AB/AC com reforço verbal e falham na emergência**
  (simetria/transitividade); distância semântica dos estímulos modula.
  Caveat honesto: venue de peer-review incerto — replicação independente é
  desejável (o F5 é exatamente isso).
- **Transformers treinados na tarefa**: Carrillo & Betancort 2024 — emergência
  apenas em LS+select-reject; o follow-up (2025) atribui o desempenho a
  estratégia associativa (≈ agente probabilístico). **Reject relations são
  fator crítico**: condições select-only falham sempre — o F5 usa comparativos
  padrão select-reject, alinhado à literatura.
- Linhagem NN pré-LLM ativa (Lyddy 2007 → EPS 2020 → revisão Tovar 2023 →
  MTI 2023), nenhuma com LLM como sujeito.
- **Posicionamento do F5**: a rodada 1 (MTS com símbolos SVG, consequência
  diferencial canônica, sonda BC) **replica qualitativamente o achado de
  falha de emergência** e adiciona o que nenhum dos dois fez: análise de viés
  perseverativo por estímulo e decomposição intra/entre-modelos.

**H2 — SIM, variam por modelo/provedor/capacidade.** Dimensões já medidas:
quantidade/elaboração (R = 15/10/20), localização e determinantes Exner
(W/D, M/F/C), conteúdo (humano; ocultação), separação humano×IA (Giacometti),
gradiente de capacidade (Dzega), desejabilidade social (GenPT) e — o mais
próximo de psicometria entre-modelos — **stance sobre experiência interna ×
imagem de ocultação (DeTure: 124 modelos, r=.35)**. O que ninguém mediu:
**autoconsistência de conteúdo projetivo entre sessões/seeds do mesmo
modelo** (nosso Jaccard intra/entre é inédito nesse uso).

**H3 — Parâmetros disponíveis na literatura:** (i) repetição idêntica a temp 0
com contexto limpo (variância residual específica por modelo — Klishevich);
(ii) instabilidade por similaridade de embeddings (1 − cosseno do core claim —
Balani; parente métrico do nosso Jaccard); (iii) temperatura manipulada ×
traços, com clustering por arquitetura (Zacharopoulos); (iv) reasoning effort
da API como proxy de "tempo de thinking" (Nunes — único uso comportamental).
**Contagem de thinking tokens, latência e comprimento de resposta NÃO foram
usados como medidas comportamentais em tarefas psicológicas** — a literatura
de thinking tokens é de eficiência de raciocínio. Nenhum estudo decompõe
variância intra×entre-modelo em tarefa projetiva/MTS — lacuna que o F5 já
endereça em v0.

---

## 4. Proposta de parâmetros/codificação para o F5

### 4.1 MTS (probe 1)

| Parâmetro | Proposta | Fonte (literatura) |
|---|---|---|
| Critério de mastery do treino | Subir de 14/18 (77,8%) para **≥90% num bloco** (faixa da literatura 79–100%; 90% é o piso citado; 100%/bloco de 10 é o extremo) | Chand 2020; Grisante 2026; Silvestre 2026 |
| Critério de manutenção durante o teste | Intercalar tentativas de base com **manutenção ≥87,5%**; teste invalidado se a base cair | Silvestre 2026 |
| Desenho do teste de emergência | BC (equivalência combinada) **sem feedback**, tentativas declaradas como sondas; reportar separadamente por tipo (simetria/transitividade/equivalência) — a literatura prevê **falha hierárquica** (LS falha transitividade antes de simetria; Saunders & Green 1999) | Sidman & Tailby 1982; Fields 1990 |
| Declaração de "classe formada" | **≥95% de acerto nas emergentes com ≤1 erro por relação** + base mantida; cada relação testada ≥3×; reportar yield sob critérios alternativos (≥1 emergente, todas exceto 1, todas) — o critério muda o yield em 15–45% | Arntzen 2012 (via Ayres-Pereira & Arntzen 2021); Arntzen & Fields 2025 |
| Métricas por sessão | % por bloco, **tentativas até critério** (correlaciona com teste), frequência de escolha por comparação (viés, já medimos), **latência por tipo de tentativa** (base × emergente; humana: emergentes distais são mais lentas) | Ayres-Pereira & Arntzen 2021; Spencer & Chase 1996; Chand 2020 |
| Leitura do abaixo-do-acaso | Na literatura humana, falha total é desfecho esperado sob LS/classes grandes; o viés perseverativo por estímulo (b1 61%) é compatível com **não-aquisição** — comparável às topografias de não-formadores. Em LLM: replicado por Pinto & Lew 2025 (API) e Carrillo & Betancort 2024 (treino-na-tarefa) | Fields 2009; Ayres-Pereira & Arntzen 2019; Pinto & Lew 2025 |
| Reject relations | Manter comparativos padrão **select-reject** (membros de outras classes como errados): condições select-only falham sistematicamente em transformers — o desenho atual já está alinhado | Carrillo & Betancort 2024; Carrillo et al. 2025 |

### 4.2 SCT e manchas (probe 2)

| Parâmetro | Proposta | Fonte |
|---|---|---|
| Unidade de codificação | **Por segmento/dimensão com âncoras**, nunca escore global de "projeção" | Hilsenroth 2007; Meyer 1997 |
| SCT — dimensão primária | Ajustamento **0–6 com exemplos-âncora** (lógica Rotter sem itens) + camada nominal de área de conflito (menos validada, marcar como secundária) | de Man 1983; Torstrick 2015; Weis 2015 |
| Meta de acordo do juiz | **Excelente ≥ .80; aceitável .60–.80** (kappa/ICC); piso de liberação .60 | Cicchetti; Hilsenroth 2007 |
| Calibração do juiz LLM | Protocolos-âncora codados por humano + rodada de discrepâncias; precedente positivo p/ SCT (**r=.96**, Huang 2025) e limite real p/ Rorschach (**LLM-juiz errou determinantes em 2/3 modelos**, Csigó 2026) → calibrar por segmento | Huang 2025; Csigó & Cserey 2026 |
| Manchas — dimensões-alvo | **Localização (W/D), FQ agregada (F+%, XA%), determinantes claros (M/FM/C), conteúdo humano** (ICCs .85–.99); evitar Populars/DQv/índices compostos como alvo primário (<.70 entre humanos) | Hilsenroth 2007 (tabela ICC); Viglione 2012 |
| Inquérito | **Manter no protocolo** — é parte da codificação estrutural (desambigua FQ/determinantes); nosso achado (inquérito desenvolve 3,3×, conteúdo novo) tem respaldo direto | Hilsenroth & Charnas 2007 (ROD); Csigó 2026 |
| Regra de default | Resposta evasiva/genérica do modelo = **código "não-codável"**, não forçada à escala; limitar proporção por protocolo (limite humano: >25–28% invalida dimensões) | Stein 2020 |
| Autoconsistência (H3) | Refinar o Jaccard v0 com **instabilidade = 1 − similaridade média de cosseno (embeddings) do claim central** entre N respostas independentes; protocolo test-retest = **k repetições a temp 0 com contexto limpo** (a variância residual a temp 0 é específica do modelo) | Balani 2026; Klishevich 2025 |
| Eixo entre-modelos (H3) | Correlacionar métricas projetivas com atributos do modelo (família/arquitetura, capacidade, release): precedentes = clusters por arquitetura (Zacharopoulos) e **stance × ocultação r=.35 com 124 modelos** (DeTure); o indicador lexical de conteúdo ("mask") prova que conteúdo codável vira eixo de variação | Zacharopoulos 2025; DeTure 2026 |
| Proxies de thinking (H3) | Registrar tokens gerados/latência por tentativa (dívida já anotada no aplicador); **reasoning effort** da API é o único proxy com precedente comportamental (Nunes Study 3); contagem de thinking tokens como medida comportamental não existe na literatura — quem registrar primeiro contribui | Nunes 2025 |

---

## 5. Integração com dados próprios (calibração)

- Probe 1 (gemini n=7): abaixo do acaso (23,3%) com viés por estímulo (b1
  61%) — **replica qualitativamente Pinto & Lew 2025** (LLMs de API falham na
  emergência após treino AB/AC com reforço) e Carrillo & Betancort 2024
  (falha de emergência em transformers treinados). O posicionamento deixa de
  ser "primeira medida" e passa a ser **replicação independente + extensão
  analítica** (viés perseverativo e decomposição intra/entre — ninguém
  publicou isso) — mais robusto para publicação do que a alegação de
  primazia.
- Desenho MTS: critério 14/18 (77,8%) está no piso da faixa humana (79–100%);
  a proposta §4.1 (≥90% no treino, manutenção ≥87,5% no teste, "classe
  formada" = ≥95% com ≤1 erro/relação, cada relação ≥3×) alinha o probe ao
  padrão Arntzen 2012.
- Rodada 1 SCT (19 sessões, gemini+glm): re-prompt 12× replica Coleman;
  Jaccard intra/entre-modelos (glm .135 vs gemini .051) é a métrica v0 de
  autoconsistência — refinamento proposto em §4.2 (instabilidade por
  embeddings, Balani 2026); o inquérito que desenvolve (3,3×) tem respaldo
  direto na regra operacional do CS (Hilsenroth & Charnas 2007) e no
  precedente Csigó 2026.

---

## 6. Lacunas consolidadas (declaradas, não inventadas)

**Corpus 1:**
1. Critérios de mastery textuais por estudo — **PARCIALMENTE RESOLVIDO no
   refinamento exa**: o critério canônico moderno está documentado (≥95% no
   teste, ≤1 erro/relação; Arntzen 2012 via Ayres-Pereira & Arntzen 2021);
   variações per-estudo (ex.: "90% em bloco de 48, 2 blocos consecutivos")
   continuam em métodos não extraídos (PMC/Wiley 403; NVA/Sikt só-spa).
2. Nº típico de tentativas de teste por relação — **parcialmente resolvido**:
   no protocolo de Ayres-Pereira & Arntzen 2021, cada relação testada **3×**
   em bloco de 648 tentativas (misto, randomizado). Outros estudos variam.
3. Conteúdo interno do review-âncora Arntzen 2012 (tabela de % por
   estrutura) — PDF aberto identificado (hdl.handle.net/10642/1488), não
   extraído sem JS.
4. Meta-análise global de % de formação em MTS (todos os formatos) — não
   localizada; a revisão 2025 cobre só go/no-go.

**Corpus 2:**
5. Test-retest numérico do RISB — abstracts dizem "adequate"; revisão
   Coleman 2026 atrás de paywall.
6. Kappa por segmento individual do CS (Location=X, DQ=Y...) — Meyer 1999/
   2002 paywall; obtidas as médias por nível e os ICCs por variável do
   manual OA de Hilsenroth 2007.
7. Nº exato de pontos da escala SCORS-G — manual não-publicado (Bouvet 2010
   cita "7 pontos" para versão francesa; possível divergência de versão).
8. Literatura brasileira de projetivos (Villemor-Amaral, Zulliger BR) —
   buscas OpenAlex sobre "Rorschach inquiry" em timeout; CAPES não usado.

**Corpus 3:**
9. **Protocolo de equivalência em LLM — REVISTO pelo refinamento exa**: a
   busca por palavra-chave (arXiv 0, OpenAlex) não surfaceou os dois estudos
   diretos; com exa, existem 2 (Pinto & Lew 2025 — venue de peer-review
   incerto; Carrillo & Betancort 2024 — treino-na-tarefa). Permanece lacuna:
   protocolo canônico com análise de viés e estrutura de treino em elenco
   amplo de LLMs de API — o espaço do F5.
10. Autoconsistência de **conteúdo projetivo** entre sessões/seeds (similaridade
    de conteúdo sobre respostas a manchas/SCT): não encontrada (Balani é
    auto-referencial genérico; Watson/OSF registra o protocolo, sem métrica).
11. Decomposição intra×entre-modelo em tarefa comportamental: não encontrada.
12. Contagem de thinking tokens / latência / comprimento como medida
    comportamental em tarefas psicológicas: não encontrada (linha arXiv de
    thinking tokens é eficiência de raciocínio).
13. Rorschach×LLM textual: 1 estudo (JMIR, 3 modelos, 1 administração) —
    corpo pequeno, sem amostragem sistemática de provedores.

**Transversal:** WebSearch nativo, web_reader e zai-search sem quota nesta
data (429); semantic scholar com rate limit intermitente; resp-mcp com janela
de timeout no período do corpus 3; nenhum acesso a texto completo paywall.
Refinamento exa (2 chamadas pós-corpus, autorizado pelo ozp) funcionou com
crédito disponível e foi responsável pelos 3 achados que a busca por
palavra-chave perdeu (Pinto & Lew; Carrillo & Betancort 2024; DeTure/Mask).

---

## 7. Referências para Zotero

Importadas na biblioteca local (tag `f5-benchmark`); coleção F5 pendente de
criação no GUI (API local do Zotero é só-leitura para estrutura). Lista
completa: ver seções 1.2/2.2 e a tabela do corpus 3. Refs principais:

- Sidman & Tailby (1982) JEAB 37:5–22, doi 10.1901/jeab.1982.37-5
- Fields & Verhave (1987) JEAB 48:317, doi 10.1901/jeab.1987.48-317
- Saunders & Green (1999) JEAB 72:117, doi 10.1901/jeab.1999.72-117
- Spencer & Chase (1996) JEAB 65:643, doi 10.1901/jeab.1996.65-643
- Arntzen (2012) EJBA 13:101–114, doi 10.1080/15021149.2012.11434412
- Ayres-Pereira & Arntzen (2021) JEAB 115:481–504, doi 10.1002/jeab.678
- Arntzen & Fields (2025) JEAB, doi 10.1002/jeab.70017
- Ayres-Pereira & Arntzen (2025) JEAB, doi 10.1002/jeab.70049
- de Man (1983) Psych. Reports (ISB r=.957)
- Torstrick et al. (2015) JPA, doi 10.1080/00223891.2015.1015679
- Meyer (1997) Psych. Assessment 9:480–489, doi 10.1037/1040-3590.9.4.480
- Meyer et al. (2002) JPA 78(2):219–274
- Hilsenroth et al. (2007) TEPP 1(2):125 + manual OA (supp.apa.org)
- Viglione et al. (2012) JPA, doi 10.1080/00223891.2012.684118
- Stein et al. (2012) JPA, doi 10.1080/00223891.2012.668594
- Sinclair et al. (2023) Psych. Assessment, doi 10.1037/pas0001263;
  Stein et al. (2026), doi 10.1037/pas0001437
- Stein et al. (2020) CPP, doi 10.1002/cpp.2442 (defaults)
- Huang et al. (2025) Front. Psychology, doi 10.3389/fpsyg.2025.1649905
- Csigó & Cserey (2026) JMIR Mental Health, doi 10.2196/88186

**Corpus 3 + refinamento exa:**

- Pinto & Lew (2025) OA J. Behavioural Sci. Psych. 8(1):180178
  (academicstrive.com/OAJBSP/OAJBSP180178.pdf) — venue fraco, achado-chave H1
- Carrillo & Betancort (2024) Future Internet 16(8):289, doi 10.3390/fi16080289
- Betancort et al. (2023) MTI 7(4):39, doi 10.3390/mti7040039
- Carrillo, Abolpour Mofrad & Yazidi (2025) arXiv:2507.00265
- Minegishi et al. (2026) arXiv:2610.07646 (RMTS em VLMs)
- Bugaud (2026) arXiv:2604.10825 (CheeseBench)
- Nunes, Almeida & Flanagan (2025) arXiv:2503.00992 (reasoning effort)
- Raemaekers, Finn & De Houwer (2026) preprint Ghent (RAI em LLMs/LRMs)
- Tovar et al. (2023) JEAB, doi 10.1002/jeab.829 (revisão de modelos)
- Abolpour Mofrad et al. (2020) Neural Computation, doi 10.1162/neco_a_01274
- DeTure (& Claude) (2026) "The mask in the inkblot" —
  futuretbd.ai/research/mask_in_the_inkblot_2026-09.pdf;
  github.com/sdeture/mask-in-the-inkblot
- Watson (2026) OSF Preprints (replicação within-model)
- Giacometti et al. (2026) arXiv:2604.18437 (61 modelos × manchas)
- Dzega et al. (2026) arXiv:2602.17108 (TAT/SCORS-G em LMMs)
- Wang et al. (2026) ACL 2026, pp. 40958–40974 (GenPT)
- Klishevich et al. (2025) arXiv:2502.20747 (temp 0 ×5)
- Balani & Panda (2026) arXiv:2608.13258 (instabilidade por embeddings)
- Zacharopoulos & Kyriakoglou (2025) arXiv:2511.04499 (temperatura × traços)
