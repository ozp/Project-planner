---
id: SPEC-plataforma-experimentos-mvp
companions:
  - phases.md
  - journeys.md
  - ../../architecture/architecture-plataforma-experimentos-2026-10-03/ARCHITECTURE-SPINE.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Escopo: **MVP = F0 (dev local) + F1 (piloto fechado) + F2 (público)**. O `ARCHITECTURE-SPINE.md` (adopted) é vinculante: seus 15 ADs são citados por ID estável e devem ser obedecidos por todo downstream.

# Plataforma de Experimentos Psicológicos — MVP (F0–F2)

## Why

Pesquisas com testes psicológicos (a começar pelo paradigma matching-to-sample do projeto
irmão PyMTS) dependem hoje de software desktop Windows (PyMTS) ou de plataformas
terceiras de hospedagem. Queremos uma **plataforma web própria, pública e de acesso
facilitado**: participante registra-se, consente, executa o teste no navegador e o dado
científico cai num banco próprio — sob LGPD desde a primeira linha de código. É ao mesmo
tempo **dor a resolver** (coleta dependente de terceiros/executável desktop) e **visão a
realizar** (infraestrutura própria da linha de pesquisa, com caminho evolutivo já
arquitetado para agentes assistidos F3 e benchmark sintético de LLMs F5 — fora deste MVP).

## Capabilities

- **CAP-1 — Registro e autenticação**
  - **intent:** Participante cria conta e autentica-se (F1 por convite; F2 aberto); pesquisador autentica após aprovação.
  - **success:** Conta criada com e-mail+senha, sessão httpOnly emitida; pesquisador não-aprovado não acessa área de pesquisa (testável por rota).

- **CAP-2 — Consentimento informado versionado**
  - **intent:** Nenhum dado de participante é coletado sem aceite registrado da versão vigente do termo do experimento.
  - **success:** Tentativa de criar sessão humana sem evento de aceite é recusada pela API (AD-9); troca de termo invalida só novas sessões.

- **CAP-3 — Catálogo público**
  - **intent:** Visitante encontra experimentos abertos com descrição acessível e inicia a participação sem barreira.
  - **success:** Fluxo anônimo landing→experimento em execução em ≤3 toques, mobile-friendly, sem instalação.

- **CAP-4 — Execução no navegador**
  - **intent:** O experimento roda no browser do participante com uma única carga e gravação em batch no fim.
  - **success:** Experimento MTS completo executado ponta-a-ponta (carga 1×, zero chamadas entre trials, batch com token efêmero aceito — AD-7/AD-11).

- **CAP-5 — Autoria por documento**
  - **intent:** Pesquisador aprovado registra um experimento submetendo documento JSON (schemaVersion do spine) + estímulos; o documento aceito torna-se imutável (docVersion).
  - **success:** Documento inválido é rejeitado com erro acionável apontando a linha do schema; documento aceito nunca muda (AD-4); builder visual NÃO faz parte do MVP.

- **CAP-6 — Aprovação e papéis (admin)**
  - **intent:** Admin aprova/rejeita pesquisadores e suspende contas, com trilha de auditoria.
  - **success:** Pesquisador pendente não cria experimento; toda ação de admin gera registro auditável; acesso admin exige MFA (AD-12).

- **CAP-7 — Coleta e armazenamento canônicos**
  - **intent:** Resultados chegam como TrialResults canônicos, append-only na sessão, qualquer que seja o respondente (contrato prepara o F5 sem implementá-lo).
  - **success:** Batch reenviado não duplica dados (idempotência — AD-5); trial fora do contrato é rejeitado na ingestão (AD-3).

- **CAP-8 — Exportação para pesquisa**
  - **intent:** Pesquisador exporta os dados das sessões dos seus experimentos em CSV/JSON pseudonimizado.
  - **success:** Export reproduz integralmente os trials íntegros e contém zero PII (verificável por teste automatizado — AD-6).

- **CAP-9 — Operação self-hosted**
  - **intent:** A plataforma opera em VPS próprio com HTTPS, backup cifrado client-side e restauração testada.
  - **success:** Reinstalação do zero via pipeline (compose + Traefik) em <1h com dados restaurados de backup (AD-15); dev local espelha prod.

- **CAP-10 — Direitos do titular (LGPD)**
  - **intent:** Participante solicita acesso aos seus dados e a eliminação da conta pelo próprio fluxo.
  - **success:** Eliminação remove PII+mapping e preserva trials somente se irreversivelmente dissociados (AD-13), com evento de auditoria; execução end-to-end demonstrável.

## Constraints

- **LGPD é transversal, não fase**: dado sensível de saúde de público; consentimento explícito versionado; pseudonimização com dissociação programada (AD-6, AD-13); classe protegida inclui demográficos e texto livre.
- **Dado sensível nunca em cloud de terceiro em claro** — self-hosted em VPS próprio; backup externo só cifrado client-side (AD-15).
- **Spine vinculante**: os 15 ADs do `ARCHITECTURE-SPINE.md` regem toda implementação (paradigma, contrato TrialResult, gateway, segurança de coleta).
- **Stack seed** (do spine, web-verificado 2026-10-03): Nuxt 4/Nitro, PostgreSQL 18, jsPsych 8.3.0 (plugins pinados), Traefik v3, Node 22 LTS, LiteLLM pin com digest (só quando F3).
- **Simplicidade operacional**: 1 desenvolvedor + agentes de código; monolith deploy único; nenhum serviço extra sem limite medido.
- **UI pt-BR, mobile-first** (público brasileiro usa telefone).
- **Feedback a participante é descritivo/educativo — nunca diagnóstico** (conteúdo definido pelo pesquisador dono do experimento).
- **Privacy-by-default na coleta**: sem IP/user-agent nas sessões (diverge da spec 03 original, que previa `ip_address`/`user_agent` — dados pessoais com custo LGPD); qualidade de dados é assegurada por token de sessão, idempotência e contrato TrialResult, não por fingerprinting.

## Non-goals

- F3 agentes assistidos por LLM (chat de montagem/resultados) — arquitetado (AD-8), não implementado no MVP.
- F4 analytics vetorial (pgvector) e recomendações.
- F5 participantes sintéticos / benchmark psicológico de LLMs (contrato TrialResult já o prepara).
- Builder visual drag-and-drop de experimentos (autoria no MVP é por documento JSON; gatilho de revisão HTMX no 03a §4b depende disto).
- Interpretação clínica/diagnóstica de resultados ao participante.
- Relatórios estatísticos avançados (views de completude, qualidade de dados, detecção de anomalias) e `compliance_alerts` — F3 (no MVP o pesquisador tem export + contagem básica de sessões).
- App mobile nativo; multi-tenant institucional; Supabase self-hosted completo (reavaliar pós-MVP); integração PsychoPy (projeto irmão OZP-395).

## Success signal

Piloto F1: um experimento MTS real coletado com ≥10 participantes convidados —
consentimento registrado, TrialResults íntegros, export pseudonimizado sem PII no
pesquisador. F2: um participante que ninguém conhece, sozinho, no celular: registra →
consente → executa → recebe feedback descritivo; e um pedido de eliminação LGPD
executado end-to-end no mesmo dia.

## Assumptions

- Domínio `experimentos.psico.net` (confirmação pendente).
- F1 por convite; registro aberto só na F2.
- Piloto F1 no `dash` (latência BR); qual VPS confirmado na F1.
- Postgres + auth própria no Nitro (sem Supabase) para todo o MVP.
- Ordem F1 vs reset Track C (gate OZP-93) decidida quando F1 estiver pronta.

## Open Questions

- Política de retenção detalhada (prazo por classe de dado) — precisa revisão jurídica na F1 (AD-13 deixa em aberto).
- Mecânica do convite F1: código por pesquisador, link único, ou aprovação manual de cada participante?
- MFA do admin no MVP: TOTP desde a F1 ou só na F2 (AD-12 exige; formato em aberto)?
