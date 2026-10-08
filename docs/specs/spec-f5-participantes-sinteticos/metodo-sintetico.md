# Método sintético — regras que dobram o desenho do runner

> Companion do SPEC-F5. Destilado das recomendações da pesquisa da gate
> (2026-10-03-avaliacao-llm-participantes.md, §"Recomendações" e checklist final);
> a bibliografia completa vive lá.

## Amostragem e réplicas

- Fixar **seed e temperatura**; cada chamada é uma extração; **N≥10 por modelo por
  condição**; reportar IC.
- Armadilhas quantificadas na literatura: **mode collapse** (modelos instruídos não
  amostram das distribuições que descrevem — Jang et al.) e **réplica ≠ diversidade**
  (fast sampling no mesmo prompt produz respondentes correlacionados — Lam et al.).
- Para MTS fechado, condição paralela determinística: ler **probabilidades de token**
  em vez de amostrar (Bradshaw et al.) — elimina variância de sampling.

## Anti-contaminação

- Estímulo **recém-gerado/procedural** é a mitigação em estado puro (GenPT, The Mask);
  o motor MTS com seed é a vantagem estrutural da plataforma.
- **Congelar o estímulo, não o texto**: toda tentativa entra com hash do asset +
  parâmetros do gerador + seed no TrialResult; o documento-experimento versionado por
  hash também é estímulo.
- Logar **taxa de reuso** de tentativas entre participantes (geração procedural de
  tentativas únicas por run é evolução, não pré-requisito do probe nº 1 — estímulos
  MTS são formas arbitrárias, não itens públicos).
- Versão/rota do modelo é **variável experimental, não ruído** — registrar sempre.

## Métricas MTS (probe nº 1)

- Acurácia por dificuldade estrutural; curva de aprendizado (por bloco/repetição);
  latência (inference.latencyMs já no contrato); consistência test-retest equada por
  seed; calibração IRT das tentativas como evolução.

## Limites interpretativos (consenso da pesquisa)

- Respostas sintéticas **não substituem amostra humana** para normas/distribuições.
- Auto-relato demográfico condicionado não estima populações humanas.
- Nunca interpretar probes como "personalidade do modelo" — comportamento narrativo/
  perceptivo sob ambiguidade, sensível a prompt, versão e política de segurança.

## Prompt discipline (dobra o runner)

- Instrução do experimento em pt-BR (mesmo texto que o humano vê), sem dica de resposta
  correta; consequências da tentativa entram no prompt apenas nas condições que as têm
  (é o manipulando experimental — nunca vazar categoria da condição no prompt).
- Resposta esperada em formato fechado (ref da alternativa) — mapeamento para
  `response.selectedRef` sem juiz-LLM.
- Estado mínimo: nada de PII no prompt (sessões sintéticas não têm PII por construção).


## Plano de avaliação do probe nº 1 (o que pedimos e o que medimos)

**Ao modelo pedimos exatamente o que a um humano**: instrução geral do MTS (escolher,
entre as opções, a que combina com o modelo/amostra) e, a cada tentativa, as imagens
(amostra + comparações); nas condições com consequência, ele recebe após cada resposta
o texto de consequência — como o feedback que o humano veria. Resposta em formato
fechado (a ref da opção escolhida).

**Medimos**: acurácia por bloco e por repetição (curva de aprendizado), latência de
inferência e — desfecho primário — **o contraste entre condições** (controle vs cada
categoria Peng; acurácia/latência). Secundário: contraste entre modelos. Hipótese
(Peng): se LLMs são sensíveis a consequências simuladas, o desempenho difere entre
condições com a mesma seed e instrução; o controle ancora a linha de base.

## Anti-vazamento (o que o modelo NUNCA sabe)

1. Instrução **verbatim idêntica** em todas as condições — a única coisa que varia é o
   feedback pós-resposta (é o manipulando).
2. Enquadramento como tarefa de combinação, sem as palavras experimento/teste/
   benchmark/psicologia/consequência/motivação.
3. Textos de consequência nunca nomeiam sua categoria (nada de "[material]"); são
   frases naturais de feedback.
4. Ordem das tentativas equada por seed entre condições (diferenças atribuíveis só à
   consequência); temperatura e parâmetros idênticos entre condições.
5. Chamadas via API são sem estado: cada sessão começa do zero; réplicas independentes
   (não há "memória" entre elas).
6. A análise (qual condição era qual) só existe na plataforma/relatório — o modelo só
   viu a própria sessão.
7. Estímulos = formas abstratas arbitrárias (não itens públicos) — contaminação de
   corpus baixa; taxa de reuso logada.

## Orçamento de tokens da rodada (estimativa, desenhos de referência)

Chamada por tentativa (stateless com cápsula compacta de histórico — recomendado:
contexto fixo em vez de transcrição crescente, e controla comprimento como confound):
entrada ≈ instrução (~200) + 3 imagens reduzidas (300–900) + cápsula/opções (~100) ≈
**700–1.200 tokens**; saída ≈ 5–30 (formato fechado).

| Sessão de | Tokens/sessão (entrada) | ×100 sessões (5 cond × 10 rép × 2 modelos) |
|---|---|---|
| 5 tentativas (MTS atual) | ~4–6 k | **~0,5 M** |
| 12 tentativas | ~9–14 k | **~1,2 M** |
| 24 tentativas | ~17–29 k | **~2,5 M** |

Saída total: <0,1 M em qualquer cenário. Chamadas totais ≈ 1,2–2,5 mil (com retries
~1,5×) — cabe nos limites diários de tiers gratuitos (ex. Gemini free ~1,5 k req/dia)
dividido entre 2 provedores; em plano pago de entrada seria ordem de US$ 1–5.
**Com o inventário da casa (freellmapi/free Google/assinatura Qwen) o custo marginal
tende a zero** — a escolha dos respondentes vira decisão de inventário, não de compra.
