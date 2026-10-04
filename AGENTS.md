# AGENTS.md — Project-planner (casa da linha de pesquisa experimental)

Mapa para qualquer agente retomar o trabalho. Atualizado em 2026-10-03.

## O que vive aqui

- `projects/` — specs dos 2 projetos ativos: **02-pymts-plugins** (+ `02a` mapeamento técnico) e **03-plataforma-experimentos** (+ `03a` quadro de arquitetura/infra com decisões do ozp no §8). `archive/` = descomissionados.
- `docs/architecture/` — **ARCHITECTURE-SPINE.md** (15 ADs vinculantes, gate 4 lentes aplicado) + memlog.
- `docs/specs/spec-plataforma-experimentos-mvp/` — **SPEC.md** do MVP (F0–F2): 10 CAPs, companions phases/journeys, memlog append-only (decisões posteriores entram lá).
- `docs/epics.md` — 4 épicos / 21 stories com AC Given-When-Then.
- `docs/research/` — 3 pesquisas (instrumentos candidatos, plugins jsPsych, avaliação de LLM como participante — esta última **cumpre a gate do F5**; adendo Peng et al. 2025 verificado por PDF local).
- `plataforma/` — código (Nuxt 4 monorepo: `app/`, `server/api`, `core/` puro, `db/migrations`, `deploy/`). Dev: `docker compose -f deploy/compose.yaml up -d db` → exportar `DATABASE_URL=postgres://plataforma:plataforma_dev@localhost:5543/experimentos` (db do compose) → `pnpm db:migrate` → `PORT=3312 pnpm dev`; ambiente completo de demo (2 experimentos: MTS + Stroop): `node scripts/seed-local.mjs`. Testes: `pnpm test` (integração pede o db do compose; suíte nova precisa de migration → rodar `db:migrate`). CI: lint+test a cada push.

## Estado (2026-10-03)

- **Done**: Epic 1 (OZP-397, walking skeleton F0), Epic 2 (OZP-398, identidade/consentimento/pseudonimização), E3 parcial (OZP-399: catálogo 3.3 + export 3.4 + painel; refinamentos OZP-402 + 4 plugins ao /run) e **Story 3.6 — Stroop digital adapt. Victoria (OZP-405)**: protocolo display `STROOP` (resposta única desde o onset, comparativos em ordem fixa) + pacote `plataforma/experiments/stroop-victoria` (3 blocos × 24) + seed com 2 experimentos. 69/69 testes, CI verde. E2E no navegador validou registro→termo→demografia→preload→tentativas (2 bugs pré-existentes corrigidos no caminho: ordem auth/carga do /run e content-type ausente em `/api/assets`).
- **Pendências do ozp** (bloqueiam E3 restante 3.1/3.2/3.5): qual VPS (recomendação: dash) e ordem vs reset Track C (OZP-93).
- **Próximo instrumento F1**: Go/No-Go (shortlist da pesquisa; depois N-back, TMT).
- **F5 (benchmark LLM)**: gate de pesquisa CUMPRIDA; probe nº 1 = sensibilidade a consequências diferenciais dentro do MTS (Peng et al. 2025, taxonomia de 4 categorias como fator). Spec do F5 ainda não escrita.

## Regras locais (herdadas do spine/SPEC — violar exige registrar no memlog)

- `core/` não importa de `app/`/`server/` nem de SDKs (AD-1); resultados são append-only (AD-4, trigger no banco); PII nunca em análise/export (AD-6, teste PII scan vigia); sessão humana exige consentimento (AD-9, constraint no banco); estímulo = ref interna content-addressed (AD-10).
- Código: ponytail (policy de código mínimo) — audit já feito (OZP-402); "modo lazy" em tarefas de código.
- Rastreio: status vive no Multica (issues OZP-395/396 + filhas); decisões duradouras → memlog do SPEC e/ou wiki ozp (log.md).
