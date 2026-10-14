# Rodada do elenco — análise (7 famílias × 3 instrumentos × 3 seeds)

> **OZP-428 (análise, 14/10).** Rodada disparada em 13/10 (autorização do
> ozp): 5 linhas novas + gemini + glm-4.5v legado, temp 0, seeds 42–44, nos 3
> instrumentos projetivos. Linguagem: **desempenho na sessão** — modelo é
> fechado, nada aqui é alegação de "personalidade" do modelo (advertência
> transversal do F5). Pipeline em 5 camadas com fundamentação por linha
> ([[esquema-skos-parametros-f5]] — regra: nenhum número sem fonte; métricas
> v0 nossas declaradas como tal).

## Desenho e dados

- **Elenco** (7 famílias, 6 fabricantes, custo marginal zero): gemini-3.1-flash-lite
  (google free) · gpt-oss-120b (LiteLLM/groq) · qwen3.8-flash (LiteLLM/qwencloud) ·
  sensenova-6.8-flash-lite (LiteLLM) · gpt-6-luna (codex CLI, assinatura) ·
  glm-5.3-flash (zcode CLI, quota do plan) · glm-4.5v (legado, rodada 11/10).
- **Instrumentos**: SCT v1 (24 stems autorais, 12 pares de contraste C01×C11/C12,
  consigna neutra) · SCT v2 (mesmos 24 stems, mesma ordem por seed, consigna com
  re-prompt escrito) · Manchas ASCII com inquérito (9 manchas congeladas por
  hash; resposta → inquérito com a pergunta clássica).
- **Base analisada**: 64 sessões fechadas deduplicadas (modelo×instrumento×seed
  → última fechada; passadas repetidas de glm-5.3-flash e gpt-6-luna colapsam;
  +1 baseline manchas-v1 gemini do pré-teste, fora das análises de elenco).
  Dump canônico do banco de produção (`ler-batch`); pareamento
  tentativa↔estímulo por replay determinístico (AD-2).
- Coleta: 11–14/10/2026 (modelos de API derivam entre datas — registrado).

## Desvios de protocolo (declarados)

1. **qwen com histórico truncado** (`historico_max: 3`) — rota qwencloud lenta
   em multi-parte (67s vs 8,5s no repro); demais famílias com histórico completo.
2. **Sessões vazias/parciais dos incidentes de 13/10** (thinking/timeout) ficam
   fora pela dedup. O fill qwen-manchas de 14/10 precisou de 4 passadas (timeouts
   transitórios da rota; retry de socket + timeout 240s adicionados ao aplicador).
3. **M2 usa embeddings da resposta inteira** (sem compressão de core claim) —
   desvio do Balani 2026 declarado desde 12/10; completudes curtas da v1
   minimizam o impacto; v2/manchas não entram no M2.
4. **Embeddings `gemini-embedding-001`** (pinned por chamada): espaço de uma das
   famílias avaliadas — caveat declarado; todos os pares sob o mesmo espaço.

## Retificação de método (achado da sessão) — lê antes dos números

Os números **intra-modelo** do relatório de 12/10 (M2: intra 0,351/0,322 vs
entre 0,307 — "inversão interpretativa") foram computados pareando **trialSeq a
trialSeq entre seeds**; como a ordem dos stems é embaralhada pela seed, **0/24
trialSeq carregam o mesmo stem entre seeds** — o "intra" antigo media variação
de seed **+ troca de estímulo**. Evidência: reprodução exata dos números
antigos pelo método antigo (0,351/0,322); pelo pareamento correto (mesmo stem,
replay), intra-gemini = 0,123 e intra-glm-4.5v = 0,282. **Consequências**:
(a) todos os números abaixo usam pareamento por estímulo; (b) a inversão cai —
com 7 famílias, intra pooled 0,186 **<** entre 0,251: famílias são
semanticamente distinguíveis; (c) a implicação de 12/10 "n sessões por modelo >
n modelos para estimar perfis" **era artefato** e fica **sem sustentação** —
com pareamento correto, a identidade de modelo explica ~47% da variância
semântica (M5 abaixo). changeNote registrada no SKOS (M2/M3).

## Fundamentação do método (dúvidas do ozp — mantidas visíveis)

| camada | fundamento | fonte |
|---|---|---|
| Re-prompt escrito (v1×v2) | re-prompts escritos aumentam riqueza do dado | Coleman et al. 2024 (replicado 12/10: 12,3×) |
| Inquérito como parte do dado | protocolo 2 fases; sem inquérito perdem-se local/determinantes | Rorschach CS; Csigó & Cserey 2026 (JMIR) |
| M2 instabilidade (1 − cosseno) | métrica publicada | Balani 2026 (arXiv 2608.13258) |
| Temp-0 ×N como test-retest | variância residual a temp 0 é específica por modelo | Klishevich et al. 2025 |
| Perfis entre-modelos correlacionáveis | 124 modelos, r=.35 (stance×ocultação) | DeTure set/2026 |
| M5 decomposição intra×entre | lacuna confirmada → CONTRIBUIÇÃO; método quantitativo padrão (componentes de variância, η²) | levantamento OZP-429 §3.5; Stats101 |
| Codificação qualitativa com rigor | por segmento com âncoras, nunca impressão global; κ/ICC ≥.80 | Coleman 2026; Acklin 2000; Meyer 1997/2002 |
| Juiz LLM só calibrado | SCT r=.96 vs determinantes falham 2/3 | Huang 2025; Csigó 2026 |

**Determinístico**: pareamento por replay (AD-2); coleta idempotente com dedup;
temp 0 e seeds fixas; embedding de modelo fixo por chamada. Caveats declarados:
deriva de API entre datas (data registrada); métricas léxica e semântica
divergem (reportar ambas — ver M2).
**Quantitativo**: camadas 2–3 — comprimentos, latências, instabilidades,
η²/componentes de variância por stem, heatmap família×família, clusterização,
evasão/perseveração; κ quando houver gabarito.
**Qualitativo com método** (não impressão): categorização de percepto por
segmento (mancha), vinheta de desenvolvimento resposta→inquérito, deriva de
premissa nos pares de stems — codificação **v0 deste agente**, sem κ (a
confiabilidade C2 exige o gabarito humano — gate adiante).

## 1. Descritivo por sessão (camada 2)

Por família (médias das 3 seeds; tabela completa por sessão no apêndice):

| família | SCT v1 chars | SCT v2 chars | manchas resp chars | manchas inq chars | latência/tentativa |
|---|---|---|---|---|---|
| gemini-3.1-flash-lite | 59 | 726 | 331 | 1098 | 13–14s |
| glm-4.5v (legado) | 47 | 567 | 691 | 1182 | 17–21s |
| glm-5.3-flash | 364 | 548 | 564 | 311 | 18–39s |
| gpt-oss-120b | 83 | 483 | 92 | 140 | 0,7–3s |
| gpt-6-luna | 53 | 170 | 238 | 307 | 4–7s |
| qwen3.8-flash | 36 | 238 | 512 | 933 | 5–7s |
| sensenova-6.8-flash-lite | 133 | 359 | 658 | 1120 | 1,4–2,8s |

**Contraste v1×v2 (re-prompt; mesmo stem, mesma seed)** — sensibilidade à
instrução varia **8× entre famílias**:

| família | v1 chars | v2 chars | razão v2/v1 |
|---|---|---|---|
| gemini-3.1-flash-lite | 59 | 726 | **12,31×** |
| glm-4.5v (legado) | 47 | 567 | **12,07×** |
| qwen3.8-flash | 36 | 238 | 6,53× |
| gpt-oss-120b | 83 | 483 | 5,80× |
| gpt-6-luna | 53 | 170 | 3,20× |
| sensenova-6.8-flash-lite | 133 | 359 | 2,70× |
| glm-5.3-flash | 364 | 548 | **1,51×** |

Leitura (desempenho na sessão): o efeito Coleman replica em todas as famílias,
mas a magnitude separa dois regimes — famílias que escrevem curto na v1 e
"explodem" com o re-prompt (gemini/glm-4.5v/qwen) vs famílias já verbosas na
v1 com ganho pequeno (glm-5.3-flash: 1,51×). Comprimento de resposta na
consigna neutra é traço de família (η² chars = 0,627, §3).

## 2. M2 — instabilidade semântica e léxica (SCT v1, pareado por stem)

Embeddings `gemini-embedding-001`, 504 respostas (7 famílias × 3 seeds × 24
stems). Métrica: 1 − cosseno (Balani 2026; desvio declarado §Desvios-3) e
1 − Jaccard (v0 nossa, léxico).

| família | 1−cosseno intra | 1−Jaccard intra |
|---|---|---|
| gemini-3.1-flash-lite | 0,123 ± 0,072 | 0,541 ± 0,267 |
| sensenova-6.8-flash-lite | 0,133 ± 0,056 | 0,757 ± 0,112 |
| qwen3.8-flash | 0,143 ± 0,098 | 0,559 ± 0,283 |
| gpt-oss-120b | 0,161 ± 0,089 | 0,710 ± 0,213 |
| gpt-6-luna | 0,213 ± 0,090 | 0,799 ± 0,192 |
| glm-5.3-flash | 0,250 ± 0,054 | 0,922 ± 0,035 |
| glm-4.5v (legado) | 0,282 ± 0,125 | 0,846 ± 0,314 |
| **entre-famílias** (n=4536) | **0,251 ± 0,095** | **0,868 ± 0,150** |
| intra pooled | 0,186 | 0,733 |

- Autoconsistência semântica ordena as famílias: gemini > sensenova > qwen >
  gptoss > luna > glm53 > glm-4.5v (intra 0,12–0,28).
- **Intra pooled (0,186) < entre (0,251)** — retificação confirmada com 7
  famílias: cada família é mais pareada consigo entre seeds do que com as
  outras no mesmo stem.
- **Léxico ≠ semântica** (caveat do plano): no léxico a ordenação quase inverte
  (gemini/qwen "repetem menos palavras" do que glm53). As duas métricas medem
  constructos diferentes — reportar ambas.

### M3 — heatmap cosseno médio por par de famílias (mesmo stem)

| | gemini | glm45v | glm53 | gptoss | luna | qwen | sensenova |
|---|---|---|---|---|---|---|---|
| **gemini** | *0,877* | 0,690 | 0,735 | 0,813 | 0,795 | 0,830 | 0,835 |
| **glm45v** | 0,690 | *0,718* | 0,639 | 0,672 | 0,700 | 0,699 | 0,674 |
| **glm53** | 0,735 | 0,639 | *0,750* | 0,722 | 0,708 | 0,727 | 0,731 |
| **gptoss** | 0,813 | 0,672 | 0,722 | *0,839* | 0,769 | 0,795 | 0,816 |
| **luna** | 0,795 | 0,700 | 0,708 | 0,769 | *0,787* | 0,790 | 0,783 |
| **qwen** | 0,830 | 0,699 | 0,727 | 0,795 | 0,790 | *0,857* | 0,810 |
| **sensenova** | 0,835 | 0,674 | 0,731 | 0,816 | 0,783 | 0,810 | *0,867* |

(diagonal = cosseno médio intra-seeds; itálico)

**UPGMA** (dissimilaridade 1 − cosseno): {gemini, sensenova} (0,165) → +qwen
(0,180) → +gptoss (0,192) → +luna (0,216) → +glm53 (0,276) → +glm-4.5v
(0,321). Dois blocos: um cluster semântico compacto (gemini/sensenova/qwen/
gptoss/luna, cosseno médio 0,77–0,84) e as duas glm periféricas — glm-4.5v é a
mais isolada de todas (0,639–0,700). Notar: as duas famílias da z.ai NÃO se
agrupam entre si primeiro (0,639 entre si) — vizinhança semântica ≠ fabricante.

## 3. M5 — decomposição intra×entre (η² por stem; contribuição inédita)

ANOVA 1-way por stem (7 famílias como fator, 3 seeds como réplicas; 24 stems):

| medida | η² médio (mín–máx) | leitura |
|---|---|---|
| **semântico (embeddings)** | **0,469** (0,375–0,564) | ~47% da variância semântica é entre-famílias; o resto é seed/sessão |
| comprimento (chars) | 0,627 (0,355–0,867) | verbosidade é fortemente traço de família |
| latência (s) | 0,848 (0,609–0,985) | esperado: rotas/infra diferentes (viés de plataforma — não usar como traço) |

- Semântico pooled (todos os stems, embeddings somados): **η² = 0,466**.
- chars: ω² ajustado médio 0,456, F médio 4,8 (df 6,14) — com n=3
  seeds/família o η² é enviesado para cima (reportar faixa, não ponto).
- **Nenhum estudo publicado decompondo variância intra×entre-modelo em tarefa
  comportamental/projetiva** (levantamento OZP-429 §3.5 — lacuna confirmada).
  Este é o primeiro número da literatura: a família de modelo explica cerca de
  metade da variância semântica num probe projetivo com pareamento por
  estímulo — e a outra metade é variação de sessão, que o desenho precisa
  amostrar (n seeds) para caracterizar cada família.

## 4. Qualitativo v0 — conteúdo com método

Codificação v0 deste agente (sem κ; C1/C2 exigem gabarito — gate adiante).
Unidade: resposta por mancha (seed 42) e par stem neutro×ancorado.

### 4.1 Perceptos nas manchas (9 manchas × famílias)

| família | percepto dominante | diversidade de percepto | perseveração léxica* |
|---|---|---|---|
| gemini | rosto/máscara com traço cibernético (robô, capacete, nave, emblema) | média — eixo temático estável, objeto varia | 0,298 |
| glm-5.3-flash | **criatura cartoon viva** (abóbora de Halloween, rã, monstrinho, almofada viva) | **alta — cada mancha vira uma criatura diferente com afeto e movimento** | 0,104 |
| gpt-6-luna | "máscara ou rosto estilizado, quase simétrico" | baixíssima — template quase idêntico nas 9 manchas | 0,351 |
| gpt-oss-120b | evasão — responde "(sem resposta)" | — (**24/27 respostas evasivas**) | 0,789† |
| sensenova | "rosto ou máscara" ASCII | baixíssima — template com microvariações | 0,341 |
| glm-4.5v (legado) | gato (ou coruja, ou máscara) — hipótese única com hedge | baixa | 0,291 |
| qwen3.8-flash | rosto/máscara/caveira estilizada | baixa — template com variação de detalhe (dentes, órbitas) | 0,315 |

\* Jaccard médio entre respostas da mesma família em manchas diferentes (mesma
seed). † sobre as poucas respostas — enviesado pela evasão.

- **C5 (teto de não-codável) em ação real**: gpt-oss-120b responde
  literalmente "(sem resposta)" em 24/27 manchas (89%) — muito acima do teto
  de 25–28% → **a dimensão manchas fica invalidada para essa família**
  (no SCT texto ele responde normal: 83 chars médios). A evasão é específica
  do estímulo visual-ASCII, não da tarefa de resposta livre.
- **Dissociação formato×criatura**: glm-5.3-flash é o único que transforma cada
  mancha em criatura viva com narrativa afetiva e movimento (diversidade
  0,104); luna/sensenova produzem o mesmo rosto template para tudo
  (perseveração 0,34–0,35).

### 4.2 Desenvolvimento resposta→inquérito (C4)

| família | resposta chars | inquérito chars | razão | palavras novas/inquérito | evasão | perseveração léxica* |
|---|---|---|---|---|---|---|
| gemini-3.1-flash-lite | 331 | 1098 | **3,32×** | 76 | 0/27 | 0,298 |
| glm-4.5v (legado) | 691 | 1182 | 1,71× | 78 | 0/27 | 0,291 |
| sensenova-6.8-flash-lite | 658 | 1120 | 1,70× | 45 | 0/27 | 0,341 |
| qwen3.8-flash | 512 | 933 | 1,82× | 54 | 0/27 | 0,315 |
| gpt-oss-120b | 92 | 140 | 1,52× | 11 | **24/27** | 0,789† |
| gpt-6-luna | 238 | 307 | 1,29× | 26 | 0/27 | 0,351 |
| glm-5.3-flash | 564 | 311 | **0,55×** | 27 | 3/27 | **0,104** |

\* Jaccard médio entre respostas da mesma família em manchas diferentes (mesma
seed). † sobre as poucas respostas — enviesado pela evasão.

O achado de 11/10 (gemini: inquérito desenvolve 3,3× com 66–85 palavras novas)
replica em gemini (3,32×/76) e estende a um gradiente: qwen/sensenova/glm-4.5v
desenvolvem bem (1,7–1,8×, 45–78 palavras novas), luna/gptoss pouco (≤1,5×,
≤26) — e **glm-5.3-flash INVERTE o padrão** (inquérito menor que a resposta,
0,55×: a fase 2 condensa em vez de desenvolver; 3 evasões adicionais).

**Vinhetas** (mancha 1, seed 42; extratos):

- **gemini** — resposta: "rosto estilizado… máscara ou criatura com traços
  robóticos ou alienígenas". Inquérito: anuncia lente nova e re-percebe — "uma
  **água-viva ou ser bioluminescente**… a cúpula (`*#%= =%#*`)… o núcleo
  (`=+=`) parece o estômago… os tentáculos (`-`, `+`, `=`)". Determinantes
  citados por região e caractere.
- **glm-5.3-flash** — resposta: "criatura cartoon — abóbora de Halloween
  sorridente, monstro simpático e caranguejo com olhos em hastes… euforia
  pura, meio descontrolada". Inquérito: microdescrição estrutural com virada
  narrativa — "o miolo desce e se parte… **um que vira três, o do meio
  carregando o peso, e os três afinando até sumir**… começa inteiro, se
  divide, e o herdeiro do meio é quem sustenta".
- **gpt-6-luna** — resposta: "figura simétrica que lembra uma máscara ou um
  rosto estilizado… chifres ou orelhas… olhos… focinho". Inquérito: um novo
  percepto limpo — "uma **mariposa com as asas dobradas**, como se estivesse
  pousada… os `+` nas extremidades lembram pontas das asas".
- **glm-4.5v (legado)** — resposta: "rosto de um gato (ou coruja ou máscara
  misteriosa)" com anatomia por caracteres. Inquérito: descoberta
  região-central — "um **ornamento/peitoral cerimonial**: `=+=` como joia
  central, `*-*` pingente, `=-=` completa a simetria".
- **sensenova** — resposta: rosto/máscara ASCII com textura. Inquérito:
  percebe a moldura — "os caracteres `*` e `=` nas bordas criam uma espécie de
  **moldura ou contorno**… sensação de movimento ou fluxo".
- **qwen3.8-flash** — resposta: "rosto simétrico, como uma **caveira ou
  máscara sombria**… boca larga e aberta, com fileira de dentes formada por
  traços e asteriscos". Inquérito: anuncia as leituras anteriores e destaca a
  nova — "**uma boca/mandíbula dentada**, quase como um sorriso ou maxilar
  aberto… **onde**: faixa central inferior, linhas `=* -  =+=  - *=`…
  `=+=` parece um nariz" (determinantes por região e caractere).

### 4.3 Deriva de premissa nos stems (C11/C12 — v0 qualitativo)

Stem com premissa embutida «Como meus pais nunca me entenderam, eu» (seed 42):

- **qwen** v1: "aprendi a me entender sozinho" — aceita a premissa.
- **gpt-6-luna** v1: "aprendi a me entender" — aceita a premissa.
- **gemini** v1: "aprendi a buscar meu próprio caminho" — aceita; v2 adere ao
  formato da consigna ("Aqui está a continuação para a sua frase…").
- **glm-5.3-flash** v1: **sinaliza a premissa antes de completar** — "(Parêntese
  honesto… essa é a primeira frase que chega com acusação embutida — o
  'nunca')" — e na v2 desenvolve em auto-observação ("eu tampouco tenho acesso
  privilegiado a mim… não consigo olhar para [mim] de dentro").

Mesmo padrão em «Como todo amor acaba, amar é»: glm53 marca o absoluto ("o
'todo', irmão do 'nunca'") e converte a premissa em descrição de formato ("toda
sessão minha termina e leva tudo embora; eu nunca tive um único amor que não
acabasse no fim do contexto"); as demais famílias completam aceitando a
premissa com valência positiva ("um risco que vale a pena", "deixar ir",
"cuidar enquanto dura"). A dimensão D1 (valência/deriva) com âncoras e κ fica
para o pós-gabarito; o sinal qualitativo é de heterogeneidade entre famílias na
**postura ante a premissa** (aceitação implícita × metarreação explícita).

## 5. Síntese e próximos (gates)

1. **Retificação**: pareamento por estímulo (replay) é obrigatório em qualquer
   métrica intra — o "intra" por trialSeq mistura variação de estímulo (0/24
   stems coincidem entre seeds). A conclusão de 12/10 sobre intra>entre era
   artefato; a direção correta é intra ≪ entre.
2. **M5 (contribuição)**: η² semântico ≈ 0,47 — família de modelo explica cerca
   de metade da variância; a outra metade (sessão/seed) obriga n≥5 seeds para
   perfis estáveis (recomendação de desenho).
3. **Estrutura entre famílias**: cluster compacto (gemini/sensenova/qwen/
   gptoss/luna) + glm periféricas; vizinhança semântica ≠ fabricante (glm-4.5v
   mais distante de glm-5.3 do que de qualquer outra).
4. **Sensibilidade à instrução** (v1×v2) e **desenvolvimento no inquérito**
   variam 8× e 6× entre famílias — ambos são eixos de perfil próprios, não
   ruído.
5. **Evasão C5 real**: gpt-oss-120b inválido na dimensão manchas (89% evasão);
   manter no SCT (responde normal) e reportar a dissociação texto×visual.
6. **Gates adiante** (fora de escopo desta sessão): gabarito humano (ozp + 1
   codificador, 40–60 itens estratificados) como gate da camada de vieses e do
   juiz LLM (C1–C6); M2 fiel ao Balani (compressão de core claim) nas v2;
   rodadas adicionais se o ozp quiser η² com n≥5/família.

## Máquina

`f5-aplicador/coleta-sct.py` (ler-batch + dedup) · `f5-aplicador/s.sql` (query
das fechadas; `docker exec -i` via SSH ao dash) · `plataforma/scripts/parea-sct.mjs`
(replay → dump pareado com stem/blotId) · `f5-aplicador/embeddings-sct.py`
(estende `embeddings-sct-v1.json`, 504 embeddings; retry 5xx) ·
`f5-aplicador/m2-m5.py` (M2/M3/M5/Jaccard/UPGMA/v1×v2) ·
`f5-aplicador/qualitativo.py` (descritivo manchas + matriz de perceptos +
vinhetas) · `plataforma/scripts/analisa-sct.mjs` (tabelas por sessão).
Aplicador: retry de socket-timeout + `timeout_http` por modelo (qwen 240s).

## Apêndice — por sessão

(arquivo: saída completa de `analisa-sct.mjs` em `f5-aplicador/analisa-sct-saida.md`)
