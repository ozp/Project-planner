# Estratégia de publicação do F5 — 1 ou 2 artigos, lacunas e esqueletos

> Escrito 21/10 a pedido do ozp, enquanto o 2º codificador não chega.
> Decisão técnica do agente com recomendação (publicação externa = palavra
> final do dono). Base: wiki [[artigo-f5-projetivos-llm]] (F0 fechada
> 18/10), relatórios 09–21/10, piloto C2. Correção incorporada: o gate
> "Peng 7/9" da página do wiki está RESOLVIDO (matriz 5×3 fechada 15/15 em
> 19/10 — ver §Artigo A).

## 1 · Recomendação: **2 publicações**

| | Artigo A — MTS/equivalência | Artigo B — projetivos + método de medida |
|---|---|---|
| Pergunta | LLMs adquirem relações de equivalência? O tipo de consequência textual importa? | Participantes sintéticos produzem material projetivo codificável? Como medir isso com confiabilidade? |
| Achado central | Aquisição **abaixo do acaso em todas as condições** (22–28% vs 33,3%; 13/15 células ≤27%), **sem efeito diferencial de consequência** | Produtividade abundante + Δ encarnação (+0,76 a −0,04) + deriva por grupo + debriefing 0/33 + **framework de medida C2/C6** (gabarito humano κ, juiz LLM calibrado) |
| Natureza | Replicação + extensão (Pinto & Lew 2025; Carrillo & Betancort 2024) | Método + decomposição (M5 η² 0,469 intra×entre) |
| Literatura/veículo | Machine psychology / comportamental (EN; PRC A1 possível — Springer, 1ª decisão ~11 dias) | Avaliação psicológica (BR: Avaliação Psicológica A1; EN: PRC/Psico-USF — matriz F0 já fechada no wiki) |
| Bloqueio hoje | **nenhum bloqueio humano** — faltam dados complementares (§3) | **2º codificador** → gabarito → juiz C6 → corpus codificado |

Por que 2 e não 1: literaturas distintas, claims distintos, e o desacoplamento
de tempo (A anda agora, B espera o codificador). Juntar tudo diluiria o
achado negativo crisp de A numa seção de um artigo ancorado noutro lugar.
Não é salami: duas perguntas, dois métodos, dois públicos.

## 2 · Esqueleto — Artigo A (MTS/equivalência)

Título de trabalho: *"Aquisição de equivalência por LLMs permanece abaixo do
acaso sob cinco condições de consequência textual"* (EN se veículo
internacional).

1. **Intro** — equivalência como marca de linguagem simbólica; MTS padrão-ouro;
   relatos recentes de abaixo-do-acaso (Pinto & Lew; Carrillo & Betancort);
   questão aberta: sensibilidade ao tipo de consequência (yield-ladder).
2. **Método** — plataforma (estímulos congelados por seed, sessão com critério,
   feedback Acertou/Errou); 5 condições de consequência + controle; blocos
   com critério de passagem; scoring %AB (3 passagens de 18) + teste BC;
   famílias × 3 seeds.
3. **Resultados** — matriz 5×3 (todas abaixo do acaso; sem efeito de
   consequência; teste de sinal através das sessões); viés perseverativo
   (61% das escolhas no mesmo comparador, rodada 1); humano no mesmo
   procedimento como contraste (se o braço humano rodar — §3).
4. **Discussão** — replicação + extensão; "texto não é consequência"
   ([[consequencias-no-mts-e-o-respondente-sintetico]]); limites.
5. **Lacunas a fechar antes de submeter** — ver §3 coluna A.

## 3 · Inventário de experimentos/lacuras por publicação

**Artigo A (MTS):**
1. **Família única (crítico)**: a matriz 15/15 é só gemini-3.1-flash-lite.
   Para artigo solo, ≥1–2 famílias adicionais × 3 seeds (aplicador pronto,
   rotas: glm53api do plano + gptoss/sensenova via freellmapi; ~15 sessões
   de 54 tentativas por família — sem depender da quota gemini).
2. **Braço humano (fortalecedor, não obrigatório)**: o desenho reformulado
   09/10 prevê "controle = humano no mesmo procedimento". Plataforma pronta
   (jornada validada no ensaio geral); falta recrutar (coleta 3.5, ≥10
   convidados por convite) e **submissão ao CEP** — único item do F5 que
   envolve seres humanos como participantes (os codificadores do C2 são
   colaboradores, não participantes).
3. **Tratamento estatístico formal**: binomial por sessão + teste de sinal
   entre sessões (scripts a partir do dump; trivial).
4. **Tabela de replicação** contra Peng et al. 2025 (PDF no Zotero).

**Artigo B (projetivos + medida):**
1. **C2**: 2º codificador → κ do sistema → consenso (exemplares D2, corte
   D3) → gabarito → lote 40–60 (+ braço sintético nos mesmos itens).
2. **C6**: juiz LLM calibrado por segmento contra o gabarito → codificação
   das 123 sessões → análises por segmento (valência por grupo/família etc.).
3. **Fases F1–F6 do wiki** (matriz de evidências, figuras, related work,
   redação, verificação, pacote) — F0 já fechada.
4. Nota: com o A desacoplado, o gate "Peng" SAI da página do artigo B.

## 4 · Encaminhamento proposto (enquanto o codificador não vem)

1. **Agora (agente)**: rodar MTS na 2ª família (glm53api) — desbloqueia o
   item mais crítico do A sem depender de humano nem quota gemini.
2. **Decisão do dono**: (a) aprovar 2 publicações; (b) braço humano do A —
   sim/não (define CEP + recrutamento); (c) idioma/veículo do A (EN/PRC vs
   BR — a matriz F0 existente serve B; A pede consulta própria rápida).
3. **Depois**: F1 do B (matriz de evidências claim→número→script) pode
   adiantar sem o C2 — claims quantitativos (M5, Δ, debriefing) já têm dado.
