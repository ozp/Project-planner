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
