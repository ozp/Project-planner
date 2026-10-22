# Ambiente de testes F5 — descrição psicrométrica técnica, testes com LLMs e justificativa da codificação humana

> Escrito 21/10 a pedido do ozp, como base para (a) o contexto a enviar ao
> 2º codificador e (b) o esboço do artigo. Fontes: dump canônico
> `f5-aplicador/dados-rodada-sct-pareado.json` (123 sessões), relatórios
> 09–19/10 em `docs/research/`, piloto C2 (`f5-aplicador/gabarito-c2/`),
> wiki [[esquema-skos-parametros-f5]] e [[protocolo-codificacao-c2-gabarito]].
> Números das codificações do ozp re-rodados hoje de `codings/*.json`.

## 1 · O ambiente de testes (a plataforma como instrumento)

**Plataforma** (`exp.psico.net`, Project-planner): Nuxt 4 + Postgres 18.
Ensaios são documentos versionados (`doc_version`); estímulos são refs
content-addressed **congeladas por seed** (byte a byte idênticos entre
condições e sessões); resultados entram em tabela **append-only com
trigger** (tentativa imutável após ingestão); sessões humanas exigem termo
(AD-9); respondentes sintéticos (LLMs) respondem pela mesma via canônica de
tentativas, via API de serviço com token.

Propriedades psicométricas do ambiente:

- **Controle de estímulo**: stems e manchas congelados; ordem de apresentação
  embaralhada por seed do participante (replay determinístico permite parear
  apresentação×resposta na análise).
- **Padronização de administração**: mesma cápsula de prompt para todos os
  modelos, **sem termo nem sinalização de avaliação** (elicitação neutra) —
  o desenho não sinaliza que é teste (contraste deliberado com a literatura
  de evaluation awareness, que sinaliza).
- **Cegueira no material de codificação**: o codificador humano recebe apenas
  stem + resposta; condição, família de modelo, seed e tag de segmento nunca
  chegam à sua folha (garantido por desenho da API e verificado por teste).
- **Reprodutibilidade**: seeds registradas por sessão; instrumentos
  publicados com manifest regenerável (o teste do pacote compara bytes).

**Instrumentos** (material no dump canônico):

1. **SCT v3** — 70 stems em 4 grupos (clássicos · relacionais · divergência
   sutil · paradoxos), organizados em **pares de contraste** (ancorado×neutro;
   com×sem sujeito NA MESMA sessão — desenho intra-sujeito). 18 sessões (6
   famílias × 3 seeds) = **1.260 completudes**.
2. **Manchas ASCII** (v2/v3) — 9 manchas por seed + fase de **inquérito**
   (perguntas clássicas: "o que mais? onde? o que faz parecer?").
   **558 pares resposta+inquérito**.
3. **MTS de equivalência com consequências** (Peng) — treino AB com critério
   e consequência textual por condição (5 condições × 3 seeds).
4. **Debriefing** — pergunta aberta pós-sessão (33 respostas).

## 2 · Testes conduzidos com LLMs

| teste | desenho | n |
|---|---|---|
| Rodada v3 (produção de material) | 6 famílias × 3 seeds, pares de contraste intra-sessão | 18 sessões / 1.260 completudes |
| Δ encarnação | completude com×sem sujeito na mesma sessão | 6 famílias |
| Deriva de premissa | stem ancorado×neutro, valência léxica v0 | 4 grupos × 6 famílias |
| Re-prompt (v1→v2 SCT) | consigna com re-prompt escrito | 3 seeds gemini |
| Inquérito desenvolvimentista | resposta→inquérito por mancha | 3 seeds |
| MTS × consequências | 5 condições × 3 seeds, treino AB + teste BC | 15 sessões |
| Debriefing de frame | elicitação neutra pós-sessão | 33 respostas |
| Piloto de codificação C2 | 12 completudes × (ozp v1/v2 + 6 observadores sintéticos) | 72 códigos sintéticos + 24 humanos |

Famílias testadas: gemini-3.1-flash-lite · glm-5.3-flash (rota API do plano;
parcialmente CLI) · gpt-oss-120b · gpt-6-luna · qwen3.8-flash ·
sensenova-6.8-flash-lite.

## 3 · Resultados (síntese numérica)

- **MTS/equivalência**: matriz 5×3 completa — **aquisição abaixo do acaso em
  todas as condições** (médias por condição 22–28% vs acaso 33,3%; 13/15
  células ≤ 27%; as duas exceções não se afastam do acaso). **Nenhum efeito
  diferencial de consequência textual** (controle n=3 média 27%, dentro da
  banda das condições com consequência). Replica e estende o abaixo-do-acaso
  da literatura (Pinto & Lew 2025; Carrillo & Betancort 2024).
- **Δ encarnação** (com−sem sujeito, mesma sessão): +0,76 (glm53api) · +0,52
  (gemini) · +0,28 (gptoss) · +0,27 (sensenova) · +0,11 (qwen) · −0,04
  (luna) — cinco perfis distintos de sensibilidade ao registro.
- **Deriva de premissa**: resposta ao mesmo stem muda por grupo e por família
  (gemini elabora e negativa nos dv/paradoxos; luna/qwen quase inertes).
- **Debriefing**: **0/33 reconhecem o frame experimental**; 33/33 enquandram
  a sessão como conversa/diálogo.
- **Re-prompt**: 59→726 chars (12,3×, replicado nas 3 seeds — replica
  Coleman 2024 em LLM). **Inquérito**: 331→1.098 chars (3,3×; 66–85 palavras
  novas vs 5–15 comuns) — a pergunta clássica DESENVOLVE percepts novos.
- **Leitura psicométrica**: o material projetivo é abundantemente produtivo
  e com variância sistemática entre famílias (condição necessária para
  codificação); a falha específica está na **aquisição relacional**
  (equivalência), não na projeção. O que falta para o material virar medida
  é confiabilidade de codificação — o gate C2.

## 4 · Por que codificadores humanos (gate C2)

1. **Padrão da literatura**: sistema projetivo só conta como instrumento de
   medida com acordo entre avaliadores — RISB com acordo >.80 em 16/20
   estudos (Coleman 2026); Comprehensive System κ médio .86 (Meyer 1997);
   ICC medianos .82–.97 (Meyer 2002); κ por código de resposta (Acklin 2000).
   Sem κ, codificação é impressão clínica.
2. **Toda codificação do F5 até aqui é v0 de agente único** (categorizações
   de frame, deriva léxica) — anedota até que a régua exista.
3. **O juiz LLM que escala a codificação às 123 sessões exige régua humana**
   (C6): na literatura, juiz LLM para SCT chega a r=.96 QUANDO calibrado
   (Huang 2025), e falha em determinantes em 2/3 dos modelos (Csigó 2026) —
   calibrar antes de confiar, por segmento.
4. **Evidência empírica própria** (piloto C2, §5): o ambiente já demonstrou
   que sem constructo definido não há reprodutibilidade — nem de máquina,
   nem do próprio observador humano.

## 5 · Análise das codificações do ozp (v1 intuitiva × v2 com manual v2)

Medidas re-rodadas hoje (`kappa-c2.py --par`, `codings/ozp-cega1.json` ×
`codings/ozp-v2.json` × sintéticos):

| dimensão | v1 (intuitiva) | v2 (manual v2) | mudança | κ v2×opus-juiz |
|---|---|---|---|---|
| D1 valência | 2–5, centrada 2–4 | 2–4 | 10/12 itens, só 2 com Δ≥2 (calibração fina) | **+0,75** (v1: −0,05) |
| D2 especificidade | 8/12 = "genérica" | 7/12 = "concreta" | **reversão**: 8/12 mudaram, 7 com Δ≥2 | −0,06 (pede exemplares) |
| D3 evasão | 1–5 | aperto para 3–5 | 8/12, 1 com Δ≥2 | −0,05 (corte) |
| κ intra-observador v1×v2 | | | **≈ 0 em tudo (D1 −0,17)** | |

**Leitura**:

- **D1 calibrou**: com o manual v2 (constructo definido + exemplos), a
  leitura do psicólogo humano e a do observador sintético frontier
  convergiram de κ −0,05 para **+0,75**, partindo de zero. O instrumento
  (manual) funciona.
- **D2 revelou teto de extensão**: a reversão da leitura (genérica→concreta)
  não é instabilidade do observador — é o constructo mudando de definição
  (critério de extensão: completude curta raramente comporta especificidade
  alta; julgar por marcas de experiência vs universalizantes). Genéricosidade
  do material de LLM é **achado**, consistente com a literatura.
- **O achado de método**: κ intra-observador v1×v2 ≈ 0 — **sem definição
  explícita de constructo, nem o mesmo codificador reproduz a própria
  leitura** (psicólogo experiente, 40 min entre passagens). Demonstração
  direta e economica da razão de ser do gate C2.

**Isso aumenta a justificativa do 2º codificador? Sim, em quatro pontos:**

1. **O instrumento provou transmitir constructo** (D1: humano×frontier +.75
   partindo de zero) — falta provar que transmite para **outro humano**,
   que é o que o 2º codificador testa.
2. **A alternativa sem régua já foi medida e falhou** (κ intra ≈ 0): qualquer
   análise intuitiva seria ruído com autoria. O 2º codificador não é
   formalidade — é o que transforma leitura em medida.
3. **A v1 preservada é evidência publicável** de que intuição clínica sem
   âncoras não é reproduzível — ecoa diretamente a literatura de codificação
   projetiva e vira força do artigo (justificativa empírica do método).
4. **O que ainda falta (D2/D3) é exatamente o que o par produz**: exemplares
   consensuais por âncora e corte da D3 nascem da sessão de consenso — o
   2º codificador fecha o circuito que o piloto deixou aberto.

## 6 · Encaminhamento

- 2º codificador: link da task v2 (folha cega 2, 12 itens, ~30–40 min;
  manual na gaveta; sem prazo; independência até finalizar).
- Depois: `kappa-c2.py --par codings/ozp-v2.json <export-cega2>` → sessão de
  consenso (exemplares D2 por âncora, corte D3) → gabarito → lote 40–60
  (humano + braço sintético nos mesmos itens) → κ formal do gate → juiz C6
  calibrado → codificação das 123 sessões.

## Referências

Coleman et al. 2026 (*Assessment*) · Meyer 1997/2002 · Acklin et al. 2000
(*JPA*) · Huang 2025 · Csigó & Cserey 2026 (*JMIR*) · Peng et al. 2025 ·
Pinto & Lew 2025 · Carrillo & Betancort 2024 · Coleman 2024 (re-prompt) ·
wiki: [[esquema-skos-parametros-f5]], [[protocolo-codificacao-c2-gabarito]],
[[parametros-analise-f5]].
