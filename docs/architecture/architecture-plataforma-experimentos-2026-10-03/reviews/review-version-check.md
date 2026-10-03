# Review — Verificação de versões/tecnologias (lente: version-check)

- **Alvo:** `ARCHITECTURE-SPINE.md` (seção Stack + menções de tecnologia no documento inteiro)
- **Data da revisão:** 2026-10-03
- **Revisor:** lente version-check (busca web em 2026-10-03/04)
- **Base:** `.memlog.md` consultado — itens já verificados com fonte em 2026-10-03 **não** foram re-verificados; esta revisão cobre exatamente o que o memlog **não** tinha fonte: pgvector↔PG18, RFC 9457, UUIDv7 nativo em PG18, plugin API do jsPsych 8.3, estado atual de llama.cpp/Ollama, Traefik v3 corrente, saúde do LiteLLM pós-incidente.

## Veredito

**APROVADO com ressalvas menores.** Nenhuma tecnologia nomeada está desatualizada, descontinuada ou fora de papel. Todas as lacunas de verificação apontadas (pgvector/PG18, RFC 9457, UUIDv7, plugin API jsPsych 8) foram **confirmadas positivamente** nesta revisão. Um único erro factual de timing (Node 26 LTS) e duas observações de baixa severidade (Debian 12, data de GA do PG18 no memlog) — nenhum bloqueia o spine.

## Tabela-resumo

| Tecnologia (afirmação no doc) | Existe/mantida? | Versão afirmada corrente/plausível? | Encaixa no papel? | Severidade |
| --- | --- | --- | --- | --- |
| Nuxt 4.x estável | Sim (memlog: nuxt.com, 2026-10-03) | Sim | Sim (app + Nitro monolito) | OK — memlog |
| Node 22 LTS / "26 virou LTS out/2026" | Sim | **Parcial** — 26 vira LTS em **2026-10-28**, não ainda em 03/10 | Sim | LOW |
| jsPsych 8.3.0 | Sim (memlog: releases 26/jul/2026) | Sim | Sim — plugin API v8 confirmada, ver abaixo | OK |
| PostgreSQL 18 (17 ainda suportada) | Sim (memlog) | Sim | Sim | OK — memlog |
| UUIDv7 (convenção de IDs) | Sim | n/a | **Sim — nativo em PG18** (`uuidv7()`), ver A-2 | OK (positivo) |
| pgvector "quando F4" | Sim | **v0.8.7** corrente | Sim — suporta PG13–18, ver A-3 | OK |
| LiteLLM pinado auditado | Sim — saudável pós-incidente | **1.103.2** (01/out/2026) | Sim — ver A-4 | OK |
| Runtime local: llama.cpp vs Ollama (F3) | Ambos mantidos | Ollama ~0.22.x (mai/2026) | Sim — ambos expõem API OpenAI-compatible p/ LiteLLM | OK |
| Traefik v3 | Sim | v3.7.x é a linha corrente (3.7.13 latest no Docker Hub) | Sim | OK |
| RFC 9457 `application/problem+json` | Sim — RFC corrente | n/a (padrão IETF) | Sim — ver A-5 | OK |
| Debian 12 / Docker Compose / VPS 8 GB | Sim (ambiente) | Debian 12 = oldstable desde ago/2025, LTS até ~2028 | Plausível | LOW (obs.) |

## Achados detalhados

### A-1 (LOW) — Node 26: "virou LTS out/2026" está ~3,5 semanas adiantado

O doc (Stack) e o memlog (linha "version — Node.js 22 LTS…") afirmam que Node 26 **virou** LTS em out/2026. O schedule oficial do Node.js (`nodejs/release`, `schedule.json`) marca o início do LTS do Node 26 em **2026-10-28** — ou seja, na data do documento (2026-10-03) o Node 26 ainda é *Current*, não LTS. A direção prática do doc está correta (22 LTS até 30/abr/2027; decidir 22 vs 26 no scaffold F0, quando 26 já terá sido promovido e "assentado" algumas semanas). Correção sugerida: trocar "26 virou LTS out/2026" por "26 vira LTS em 28/out/2026". O mesmo ajuste vale no memlog.

- Fonte: `https://raw.githubusercontent.com/nodejs/release/master/schedule.json` (v. 26: `lts: 2026-10-28`, `end: 2029-04-30`; v. 22: fim em `2027-04-30`).

### A-2 (OK, achado positivo) — UUIDv7 é nativo no PostgreSQL 18

A convenção "IDs UUIDv7" (Consistency Conventions) pode ser implementada **direto no banco** sem extensão nem geração em aplicação: o PG18 introduziu as funções nativas `uuidv7()` e `uuidv7_interval()` (docs oficiais §9.14 "UUID Functions"), com carimbo de época Unix + componente sub-milissegundo de 12 bits (+ aleatoriedade). Além de eliminar dependência de lib de ID no `core/`, UUIDv7 como PK melhora localidade de índice B-tree vs UUIDv4 — coerente com sessões/trials append-only (AD-4). Sugestão: registrar no spine ou no F0 que o default de PK pode ser `uuidv7()` nativo do PG18.

- Fontes: `https://www.postgresql.org/docs/18/functions-uuid.html`; Aiven, "Exploring PostgreSQL 18's new UUIDv7 support" (out/2025); thenile.dev (mai/2025).

### A-3 (OK) — pgvector suporta PostgreSQL 18; versão corrente 0.8.7

Lacuna apontada (compat pgvector↔PG18) **confirmada**: o README oficial declara suporte a Postgres 13+ (13–18) e publica imagem Docker com tag por versão (`pgvector/pgvector:pg18`). Versão corrente: **v0.8.7**. O projeto segue ativo (iterative index scans p/ HNSW/IVFFlat desde 0.8.0, imagens por tag no lugar de `latest`). O AD-10 (vetorial dentro do Postgres, "quando F4") está correto e viável; quando F4 chegar, pinar versão específica (≥0.8.7) como o resto da stack.

- Fontes: `https://github.com/pgvector/pgvector` (README + instruções de instalação/tags); Percona Distribution for PostgreSQL 18 inclui pgvector.

### A-4 (OK) — LiteLLM saudável pós-incidente; política de pin do AD-6 é viável e adequada

Estado atual (não coberto pelo memlog, que só registrava o incidente): o projeto seguenta ativo e com release cadence alta — estável **1.103.2 em 01/out/2026** (1.103.1 em 29/set, 1.103.0 em 27/set; dev 1.105.0.dev2 em 02/out), com **trusted publishing no PyPI e imagens Docker assinadas** adotadas pós-incidente. O incidente de supply-chain (24/mar/2026, releases 1.82.7/.8 com credential harvesting, ~95M downloads, divulgado pela JFrog) é real e a resposta do projeto foi adequada. O AD-6 (pin com auditoria, nunca `latest`, chaves cifradas, BYOK>plataforma>local) é a postura correta. Reforço sugerido para o F0: além de pinar a versão, fixar **digest** da imagem e registrar checksum — e re-verificar a instância existente do ambiente antes de integrar (já anotado no memlog).

- Fontes: `https://pypi.org/project/litellm/`; Trend Micro/JFrog (análises do incidente, mar–abr/2026); Autodesk security notice (ago/2026).

### A-5 (OK) — RFC 9457 é o problem-details correto e corrente

Lacuna apontada confirmada: **RFC 9457** ("Problem Details for HTTP APIs", IETF, abr/2025) é o padrão corrente e **obsoleta a RFC 7807**; o media type permanece `application/problem+json`, exatamente como escrito na convenção do spine. A indústria está migrando referências de 7807→9457 (3GPP/ETSI incluídas). Nada a corrigir — o doc já cita o RFC certo.

- Fontes: `https://datatracker.ietf.org/doc/html/rfc9457`; guias de API 2026 (WSO2) recomendando 9457.

### A-6 (OK) — jsPsych 8: plugin API confirmada nas docs v8 (default)

A pergunta em aberto ("jsPsych 8.3 plugin API?") está respondida: a documentação canônica (`jspsych.org/v8/…`, v8 é o default do site) documenta a API de plugins vigente — classe JS com `constructor(jsPsych)`, membro estático `info` (`name`, `version`, `parameters` com tipos `DATA`/`FUNCTION`/etc. e declaração de `data` gerado), `trial(display_element, trial, on_load)`, e o padrão v8 de `trial()` **async retornando o objeto de dados**; `jsPsych.finishTrial(data)` segue válido e limpa o display automaticamente; há API de simulação (`simulate()` com modos) nos plugins oficiais. Duas implicações para o spine:

1. Escrever plugins customizados para tentativas estilo PyMTS (delays SMTS/DMTS, consequências diferenciais por bloco) contra essa API é direto — encaixa no `core/adapters/jspsych` (AD-2/AD-3) sem gambiarras.
2. O padrão recente de `pluginInfo`/declaração de `data` está sendo rolling-out nos plugins oficiais — **pinar também as versões dos pacotes de plugin** (`@jspsych/plugin-*`), não só o core, já que o formato de metadata evoluiu dentro da linha 8.x.

Nota metodológica: buscas genéricas de "jsPsych 8" ainda retornam índice velho da era v7 ("não existe v8") — falso; confirmado pelas docs canônicas em `/v8/` + releases GitHub (memlog). Não se deixe enganar por cache de buscador.

- Fontes: `https://www.jspsych.org/v8/developers/plugin-development/` (canonical, consultado 2026-10-03); `https://www.jspsych.org/` (seletor v8 default); releases GitHub (memlog).

### A-7 (OK) — Traefik v3: v3.7 é a linha corrente

"v3 (stack do ambiente)" segue correto: sem v4; a linha ativa em out/2026 é a **v3.7** (v3.7.13 marcada `latest` no Docker Hub), com manutenção de segurança paralela para 3.6.x e 2.11.x (ex.: CVE-2026-33433 corrigida em mar/2026). Papel (edge router + Let's Encrypt por app) inalterado. Sugestão: no `deploy/`, pinar minor (ex.: `v3.7.x` com digest) em vez de `v3` flutuante, acompanhando advisories — mesma disciplina de pin do resto da stack.

- Fontes: Docker Hub (`hub.docker.com/r/library/traefik` tags); fórum Traefik (security update 19/mar/2026).

### A-8 (OK) — llama.cpp e Ollama: ambos mantidos; decisão F3 continua aberta e válida

Ambos ativos em out/2026: Ollama em ~**v0.22.x** (0.22.1 em mai/2026) com desenvolvimento contínuo; llama.cpp segue como motor local de referência — foi nomeado engine recomendado quando a Hugging Face colocou o TGI em maintenance mode (mar/2026). Ambos expõem API compatível com OpenAI que o LiteLLM roteia como provider "local", encaixando na rota BYOK>plataforma>**local** do AD-6. O doc decide corretamente deixar a escolha para F3 (com a exceção OZP-81 "não redeployar Ollama").

- Fontes: mayhemcode.com (Ollama setup 2026, v0.22.1 mai/2026); radar.elyadata.com (TGI maintenance mode 21/mar/2026, engines recomendadas).

### A-9 (LOW, observação) — Debian 12 como SO/alvo

Debian 12 segue suportado (LTS de segurança até meados de 2028), mas é oldstable desde Debian 13 (ago/2025). Para um projeto novo cujo F0 pode demorar meses, vale conferir na hora do scaffold se o ambiente-alvo (dash/labs) já não estará em 13 — mantendo, claro, o alinhamento com o host real do ozp. Não verificado por busca nesta rodada (conhecimento estável; risco baixo).

### A-10 (INFO, higiene de memlog) — "PG18 GA 2026" no memlog

O memlog (linha "version — PostgreSQL 18") registra "GA 2026"; o GA foi **2025-09-25**. O spine em si não afirma data de GA, então nada a corrigir no doc — apenas ajustar o memlog se ele for promovido a fonte duradoura.

## Itens já cobertos pelo memlog (não re-verificados nesta revisão)

- Nuxt 4 estável (nuxt.com) — seção Stack e AD-1.
- jsPsych 8.3.0 existente (releases GitHub, 26/jul/2026).
- PostgreSQL 18 GA / linha 17 suportada (17.11 ago/2026).
- Incidente LiteLLM 1.82.7/.8 (fontes orcarouter/respan registradas).

## Correções sugeridas ao documento (nenhuma bloqueante)

1. **Stack / Node.js:** "26 virou LTS out/2026" → "26 vira LTS em 28/out/2026 (decidir 22 vs 26 no scaffold F0)". [LOW]
2. **Consistency Conventions ou F0:** anotar que UUIDv7 pode ser default de PK nativo do PG18 (`uuidv7()`), sem lib de ID no core. [ganho de simplicidade]
3. **Stack / pgvector:** trocar "quando F4" por "quando F4 (≥0.8.7, tag pg18)" — versão mínima com suporte PG18 confirmado. [INFO]
4. **AD-6 / deploy:** estender a disciplina de pin do LiteLLM para digest de imagem + checksum, e aplicar pin de minor+digest também ao Traefik. [INFO]

## Fontes desta revisão

- Node.js release schedule (schedule.json, nodejs/release no GitHub)
- PostgreSQL 18 docs — UUID Functions (§9.14) e Aiven/thenile.dev sobre uuidv7 no PG18
- pgvector — GitHub (README, v0.8.7, Postgres 13–18, tags Docker)
- PyPI — litellm 1.103.2 (01/out/2026) e histórico recente; análises do incidente (Trend Micro/JFrog, Autodesk)
- IETF — RFC 9457 (Problem Details for HTTP APIs; obsoleta RFC 7807) e datatracker
- jsPsych — docs canônicas v8 (Plugin Development; seletor de versão default)
- Traefik — Docker Hub tags (v3.7.13 latest) e fórum oficial (security updates mar/2026)
- Ollama/llama.cpp — guias e radar 2026 (Ollama 0.22.x; TGI maintenance mar/2026)
