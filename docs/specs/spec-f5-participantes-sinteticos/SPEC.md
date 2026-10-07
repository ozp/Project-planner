---
id: SPEC-f5-participantes-sinteticos
companions:
  - papeis-dos-modelos.md          # mapa dos 3 papéis de LLM no projeto (gerente/assistente/participante)
  - probes.md                      # catálogo de probes: nº 1 (Peng/MTS) + backlog projetivos
  - metodo-sintetico.md            # regras metodológicas (réplicas, temperatura, anti-contaminação, métricas)
  - ../../architecture/architecture-plataforma-experimentos-2026-10-03/ARCHITECTURE-SPINE.md  # ADs vinculantes (adotado)
  - ../spec-plataforma-experimentos-mvp/SPEC.md                                                # CAPs do MVP hospedeiro (adotado)
  - ../../research/2026-10-03-avaliacao-llm-participantes.md                                  # pesquisa da gate, com bibliografia (adotado)
sources: []
---

> **Contrato canônico.** Este SPEC e os arquivos em `companions:` formam o contrato completo do F5. A fonte primária de decisões é o `.memlog.md` (append-only); este arquivo é derivado.

# F5 — Participantes sintéticos (LLM como respondente)

## Why

**Visão a realizar.** A plataforma nasceu respondente-agnóstica: o contrato `TrialResult` prevê desde a Story 1.2 o ramo `synthetic` (com `inference`: modelo, rota, latência, custo), e o motor nunca soube quem responde. A gate de pesquisa do F5 está cumprida (deep research 03/10 + adendo Peng et al. 2025 verificado por PDF local), o ambiente de modelos existe (labs: qwen3.5:2b executor com visão, spark:4b batch, Jev gate) e a Fase C entregou a ponte de serviço. O que falta é a peça que responde à pergunta de pesquisa do ozp: **LLMs são sensíveis a consequências diferenciais simuladas dentro de um MTS?** (Peng et al. mostram consequências comportamentais mensuráveis em LLMs; o MTS modela consequência por tentativa no schema desde o início). Beneficiário: o ozp como pesquisador — probe comportamental de modelos com dado canônico no mesmo banco das sessões humanas, e piloto barato de instrumentos antes de qualquer humano.

## Capabilities

- **CAP-1 — Runner sintético**
  - **intent:** O pesquisador executa um experimento existente com um respondente LLM, gravando a sessão e os TrialResults canônicos (ramo synthetic com `inference`) no mesmo banco das sessões humanas.
  - **success:** Uma sessão sintética do MTS aparece no export com `respondent_class=synthetic`, `inference` preenchido (modelo/rota/latência/custo) e `timing` humano ausente; a ingestão idempotente aceita o batch.

- **CAP-2 — Probe nº 1: consequências diferenciais no MTS**
  - **intent:** O pesquisador contrasta condições de consequência (sem consequência vs. consequências das categorias Peng — sobrevivência, reforço social, material, espiritual) dentro do mesmo MTS, com seeds equadas entre condições.
  - **success:** Uma rodada do probe com ≥2 condições produz acurácia e latência sintéticas comparáveis por condição; o contraste (ou sua ausência) fica registrado em dado exportável.

- **CAP-3 — Rotação de respondentes e réplicas**
  - **intent:** O pesquisador roda o mesmo protocolo com múltiplos modelos e múltiplas réplicas por condição, com temperatura fixa e registrada.
  - **success:** ≥2 modelos distintos × N≥10 extrações por condição executados com metadados corretos por sessão; réplicas com mesma seed reprodutíveis.

- **CAP-4 — Comparação humano×sintético**
  - **intent:** O pesquisador consulta e compara dados por classe de respondente (humano vs. sintético) nos mesmos experimentos.
  - **success:** Export/consulta separa as classes e apresenta acurácia por bloco lado a lado, usando dado humano existente quando houver.

- **CAP-5 — Administração no formato do modelo**
  - **intent:** O respondente LLM recebe o estímulo no formato que o modelo processa — modelos com visão recebem o asset real (imagem); modelos de texto puro são elegíveis apenas para instrumentos textuais futuros.
  - **success:** Sessão MTS respondida por modelo vision-capable via gateway com os mesmos assets que o humano vê; nenhuma tradução/descrição de estímulo no caminho do dado.

## Constraints

- Toda inferência via **gateway único LiteLLM pinado por digest** (AD-8); chaves nunca no repo; custo por sessão registrado em `inference`.
- **TrialResult canônico inalterado** (AD-3): ramo synthetic mutuamente exclusivo com timing humano (validação vigia); o acerto continua sendo identidade computada no core — **o LLM nunca pontua o próprio resultado**.
- Sessão sintética: **sem consentimento** (AD-9 é gate de sessão humana) e sem demografia; qualquer ajuste de schema entra por migration.
- **Nada de modelo executando no dash**: o runner chama modelos via rede/gateway; a topologia é open question (ver abaixo).
- Método (dobra o desenho do runner): seed e temperatura fixas e registradas por run; estímulo congelado por hash; taxa de reuso de tentativas logada.
- Estado mínimo ao prompt: nada de PII sai para nenhum modelo (sessões sintéticas não têm PII por construção).
- **Decisão do ozp (07/10)**: respondentes = **LLMs externos ao ambiente** (alvo do benchmark; chaves BYOK na estação/labs, nunca na plataforma); **modelos locais gerenciam** — aplicam os prompts e coletam as respostas (harness agno + API de serviço). Runner off-platform; a plataforma permanece cofre determinístico. `core/adapters/synthetic` (tentativa→prompt, resposta→TrialResult) continua em core/ puro; a orquestração prevista em `server/jobs/` no spine migra para o harness local — desvio registrado no memlog.
- Parâmetros de sampling (temperatura, seed) gravados nos metadados do run e visíveis no export.

## Non-goals

- **F5 não é o assistente/gerente do pesquisador** (montar experimentos por chat, explicar resultados) — esse é o papel F3, escopo distinto (ver `papeis-dos-modelos.md`).
- Não reusa o harness agno: o runner é **pipeline determinístico, não agente**; o gate Jev permanece na Fase C (orquestração agêntica), não no runner.
- Não substitui amostra humana para normas ou distribuições (consenso da pesquisa da gate).
- Sem juiz-LLM no loop de mensuração (MTS tem acerto objetivo; juiz só em análise secundária futura).
- Projetivos (GenPT/Rorschach sintético/SCT) ficam na fila **após** o probe nº 1 (backlog em `probes.md`).
- Nenhum instrumento novo no escopo do F5-MVP — usa o MTS existente.

## Success signal

O primeiro resultado científico do F5: probe nº 1 executado (≥2 condições de consequência × ≥2 modelos × ≥10 réplicas) com o contraste de **sensibilidade a consequências diferenciais** reportado — em dado canônico, exportável junto às sessões humanas, sem nenhuma peça nova de instrumento.

## Assumptions

- O export atual já distingue `respondent_class` (verdadeiro — `ExportRow`), então CAP-4 nasce como filtro no existente; painel comparativo fica para depois do primeiro resultado.
- Probe nº 1 usa os estímulos fixos do MTS + log de taxa de reuso; geração procedural de tentativas únicas é fase 2 do F5.

## Open Questions

(nenhuma — as 5 originais foram resolvidas em 07/10: 2 por decisão do ozp, 3 por recomendação aceita; ver memlog)
