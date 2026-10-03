# Plataforma de Experimentos — Arquitetura & Infraestrutura (Quadro Geral)

> Documento de apoio à spec [03-plataforma-experimentos.md](03-plataforma-experimentos.md).
> **É um quadro geral** — o detalhamento item por item (documento de arquitetura formal,
> PRD, historias) será feito com as skills de planejamento (bmad-architecture, bmad-prd/bmad-spec)
> depois que as decisões do §8 forem tomadas.
> Escrito em 2026-10-03, ancorado no ambiente real medido ([vps-strategy], wiki).

---

## 1. Visão de blocos

```
                        Participante / Pesquisador / Admin (navegador)
                                        │  HTTPS
                                        ▼
                    ┌──────────────────────────────────────┐
                    │  Traefik (reverse proxy + Let's Encrypt)│
                    │  experimentos.psico.net               │
                    └──────────────┬───────────────────────┘
                                   ▼
                    ┌──────────────────────────────────────┐
                    │  Nuxt 4 (SSR + API do servidor)       │
                    │  · portal público / registro          │
                    │  · área do pesquisador (testes, dados)│
                    │  · painel admin (aprovações, LGPD)    │
                    └──────┬──────────────────┬────────────┘
                           │                  │
                           ▼                  ▼
              ┌─────────────────┐   ┌──────────────────────┐
              │  jsPsych 8.x    │   │  Camada de dados      │
              │  (roda NO       │   │  · Auth (registro/    │
              │   navegador —   │   │    sessões, papéis)   │
              │   plugin MTS do │   │  · PostgreSQL (dados  │
              │   projeto irmão)│   │    de teste)          │
              └─────────────────┘   │  · Storage (estímulos)│
                                    └──────────────────────┘
```

Princípio-chave: **o teste roda no navegador** (jsPsych é client-side). O servidor serve
definição do experimento e recebe o resultado consolidado — o banco não é consultado a cada
clique do participante. Isso molda tudo: latência, escala e privacidade.

## 2. Camadas funcionais (cada uma = um item a detalhar depois)

| # | Camada | Função | Tecnologia | Observação |
|---|--------|--------|------------|------------|
| 1 | **Portal público** | Landing, catálogo de testes, registro self-service ("acesso facilitado") | Nuxt 4 (SSR/SSG) | Registro leve: e-mail + consentimento; sem friction |
| 2 | **Identidade e papéis** | Participante / pesquisador / admin; aprovação de pesquisadores | Supabase Auth (ou equivalente) | Participante = auto-registro; pesquisador = aprovação manual |
| 3 | **Motor de experimentos** | Execução dos testes no navegador | jsPsych 8.x | O plugin MTS (projeto 02) é o primeiro bloco |
| 4 | **Autoria de experimentos** | Pesquisador cria/configura testes (formulário → timeline jsPsych) | Nuxt + schema JSON | Schema versionado (mesmo núcleo do projeto 02) |
| 5 | **Dados** | Sessões, resultados, perfis anonimizados | PostgreSQL (JSONB p/ trials) | Modelo já esboçado na spec 03 §Dados |
| 6 | **Resultados/relatórios** | Estatísticas p/ pesquisador; "resultados" p/ participante (futuro) | Views SQL + export CSV | Ver decisão ética §8.8 |
| 7 | **Operação** | Deploy, backups, monitoramento, logs | Docker/Dokploy, backups externos | Herda o padrão do ambiente (Traefik, fail2ban) |
| 8 | **Assistência por agentes** (decisão ozp 2026-10-03) | Chat p/ montar experimentos e conversar sobre resultados | Gateway LLM (LiteLLM do ambiente) + SSE | Ver §7b — BYOK e modelos locais básicos |
| 9 | **Participantes sintéticos** (objetivo futuro) | Rodar experimentos COM LLMs como respondentes — benchmark psicológico; prioridade testes projetivos | Adaptador LLM sobre o mesmo núcleo | Ver §7c — exige motor agnóstico ao respondente |

## 3. Infraestrutura física — âncoras do ambiente real

- **2 VPS netcup equivalentes** (4 vCPU EPYC, 7,8 GB RAM, 251 GB disco cada):
  `dash` (Virgínia/US, **154 ms** de Araraquara) e `labs` (Nuremberg/DE, 232 ms;
  inter-VPS 96 ms).
- **Alocação já validada pelo ozp (OZP-81, opção A)**: plataforma de experimentos
  (público BR) → **dash**; dados críticos/Postgres/Supabase → **labs**.
- **Tensão apontada pela review de 2026-08-06**: app no dash + banco no labs faz cada
  operação síncrona pagar ~96 ms de round-trip. Para o perfil desta plataforma (login,
  carregar experimento, salvar sessão — tudo em batch, nunca por clique) o impacto é
  **tolerável**, mas deve ser medido no piloto; a review recomenda app+banco no mesmo
  host salvo teste que valide o split.
- **RAM é o recurso apertado**: Supabase self-hosted completo ≈ 12 containers, 4–8 GB —
  sozinho consome um VPS inteiro. Postgres "puro" + auth enxuta cabem com folga.
- **Reset dos VPS pendente** (Track C, gate OZP-93: backup externo verificável + teste de
  restore antes de qualquer reset). A plataforma não depende do reset para **desenvolver**,
  mas o deploy de produção idealmente vem depois dele (ou num estado provisório aceito).
- **DNS**: psico.net no HostGator, criação de registro **manual** (decisão 2 da triagem);
  Dokploy (embute Traefik + Let's Encrypt) — labs registrado, dash a registrar.

## 4. Opções de alocação (decisão #1 do §8)

| Opção | Desenho | Prós | Contras |
|---|---|---|---|
| **A — Tudo no dash** | Nuxt + Postgres(+auth) no dash | Simples; 1 host; latência BR; sem 96 ms | 7,8 GB compartilha app+banco; dash também servirá outros apps públicos |
| **B — Split dash+labs** (como esboçado na vps-strategy) | App no dash, Supabase completo no labs | Segue papéis validados; dash leve; dados em host "de dados" | 96 ms por round-trip síncrono; 2 hosts p/ operar; Supabase come o labs |
| **C — App no dash + Supabase Cloud** | Banco gerenciado (free tier) | Mais rápido p/ começar; zero op de DB | **Dados sensíveis (LGPD) em terceiro/EUA**; dependência externa; custo ao crescer |
| **D — Enxuto no dash, evolui p/ B** | Piloto: Nuxt + Postgres único no dash; migrar/expandir p/ labs quando justificar | Barato p/ validar; migration path claro | Re-trabalho de migração (planejado, não improvisado) |

**Recomendação (quadro, decisão final é do ozp):** **D** para o piloto fechado → reavaliar
B quando houver: (i) mais de ~2–3 experimentos e pesquisadores ativos, (ii) necessidade
real dos módulos Supabase (storage, realtime, RLS granular), (iii) medição de latência
real do split. jsPsych client-side torna o piloto leve de banco; o que pesa cedo é
**estímulos (imagens/áudio)** — no piloto servidos como assets estáticos pelo próprio Nuxt.
**C** fica restrito a **ambiente de desenvolvimento** (já decidido em 2026-10-03) — dados
reais de participantes não vão para serviço externo.

## 4b. Frontend — re-validação (2026-10-03, a pedido do ozp: "Nuxt ainda? HTMX seria melhor?")

O que ESTA plataforma exige do frontend: portal público com SEO (catálogo), uma área
client-rich (builder de experimentos: formulário dinâmico, timeline, preview), chat com
streaming (agentes), jsPsych embutido (que já é uma ilha JS por natureza), e painéis de
dados. Estado de out/2026 dos candidatos:

| Candidato | Estado 2026 | Cabe aqui? |
|---|---|---|
| **Nuxt 4** (Vue) | Estável; SSR sólido; hybrid rendering (SSG portal + SPA app + API Nitro no mesmo repo) | ✅ **Sim — 1 framework cobre tudo** |
| **Next.js** (React) | Maior ecossistema/components; mais material de treino p/ agentes de código; RSC/Vercel-centric | ✅ Forte alternativa — faz sentido se o time preferir React |
| **SvelteKit 2** | Melhor razão performance/tamanho; ecossistema de componentes menor p/ builder | ⚠️ Viável; menos peças prontas |
| **Astro 5** (ilhas) | Excelente p/ conteúdo; app interativa exige ilhas React/Vue — 2 mundos | ⚠️ Só se o portal dominasse e a app fosse pequena |
| **HTMX + backend** (Go/Elixir/Laravel/FastAPI) | Server-first, mínimo JS; SSE dá conta de chat | ❌ **não para este perfil** — o builder rico (estado denso no cliente, preview ao vivo) e o chat empurram para client-rich; HTMX brilharia se a plataforma fosse majoritariamente formulários server-rendered sem builder |

**Decisão: Nuxt 4 mantido (re-validado).** Motivos: (1) um só framework para portal
(SSR/SSG p/ SEO e acesso facilitado) + aplicação (builder, painéis) + API (Nitro) +
SSE p/ chat de agentes; (2) jsPsych é agnóstico, não trava nada; (3) Vue tem adoção
forte no BR e DX/TypeScript madura; (4) sem vendor lock, self-host tranquilo.
**Gatilho de revisão**: se o MVP cortar o builder de experimentos (formulário simples
de config no lugar), HTMX+FastAPI/Laravel volta a ser opção legítima — registrar.

## 5. Jornada do participante (o "acesso facilitado")

```
1. Chega em experimentos.psico.net (mobile-friendly — público BR usa telefone)
2. Registro leve: e-mail + senha (ou magic link) → conta participante
3. Escolhe/é convidado a um teste → TERMO DE CONSENTIMENTO (LGPD) antes de anything
4. Dados demográficos MÍNIMOS (idade, escolaridade — só o que o estudo precisa)
5. Teste roda no navegador (jsPsych) — sem instalação, sem app
6. Ao final: resultado salvo (batch) + feedback ao participante (escopo futura — §8.8)
```

## 6. Dados & LGPD (transversal — não é fase, é restrição de todo o desenho)

- **Testes psicológicos de público = dado sensível** (saúde, art. 5º II LGPD): base legal =
  **consentimento explícito** coletado antes de cada experimento; registro do consentimento
  versionado junto à sessão.
- **Anonimização por padrão**: `anonymized_id` para análise; e-mail guardado à parte,
  com acesso restrito (deleção de conta ≠ perda do dado científico anonimizado — definir
  política e declarar no termo).
- **Segurança**: HTTPS everywhere (Traefik/LE), criptografia em repouso p/ colunas
  sensíveis, backups **cifrados e externos** (alinha com OZP-93), logs sem PII.
- **Retenção e portabilidade**: política escrita + export do próprio participante (direito
  de acesso) — itens do detalhamento.

## 7. Fases de implantação (cada fase = escopo fechado + gate)

| Fase | Ambiente | Escopo | Gate p/ próxima |
|---|---|---|---|
| **F0 — Dev** | Local (docker: Nuxt + Postgres; Supabase cloud só p/ dev) | Portal esqueleto, 1 experimento jsPsych de exemplo, schema do banco — **núcleo já desenhado agnóstico ao respondente (§7c)** | Spec validada; auth básica |
| **F1 — Piloto fechado** | **VPS próprio** (qual = decidir na F1, §8.2) | Registro **por convite**; 1–2 testes reais; coleta consentida; sem resultados ao público | Teste de coleta real + latência + LGPD revisada |
| **F2 — Público** | VPS (ou split, se medido) | Registro aberto ("acesso facilitado"), catálogo, painel do pesquisador, backups verificados | Operação estável ≥1 mês |
| **F3 — Resultados + agentes assistidos** | idem | Relatórios ao pesquisador; feedback ao participante (§8.8); **chat de montagem e de resultados (§7b) — BYOK primeiro, local depois** | — |
| **F4 — Analytics** | labs | Busca vetorial, recomendações (spec 03) | Escala justificar |
| **F5 — Participantes sintéticos** | onde couber (batch, sem público) | **Benchmark psicológico de LLMs (§7c): adapter sintético, prioritariamente testes projetivos; humano×modelo no mesmo banco** | Métrica de benchmark definida |

## 7b. Agentes integrados (decisão do ozp, 2026-10-03)

**Objetivo declarado:** agentes para (a) ajudar o **usuário a montar experimentos** e
(b) **conversar sobre os resultados** — tanto via **API key** quanto **rodando localmente
no VPS com modelos básicos**.

### Desenho

```
Nuxt (chat UI, SSE) ──► Camada de agentes (rotas Nitro: /api/agent/*)
                              │  prompt + contexto (schema do experimento / resultado anonimizado)
                              ▼
                    Gateway de inferência — LiteLLM (já existe no ambiente)
                       ├── rota 1: BYOK do pesquisador (chave própria, cifrada)
                       ├── rota 2: chave da plataforma (API externa, custos controlados)
                       └── rota 3: modelos LOCAIS no VPS (llama.cpp/Ollama, 1–4B quantizados)
```

- **Gateway**: o ambiente já roda **LiteLLM** (candidato a `litellm.psico.net` na
  vps-strategy) — a plataforma não precisa de outra camada de roteamento; consome via API.
- **Modelos locais "básicos"**: VPS de 4 vCPU/8 GB sem GPU → modelos **1–4B quantizados**
  (classe Qwen/Llama/Phi small) via llama.cpp/Ollama em CPU. Adequados para orientação de
  montagem ("qual bloco devo criar p/ treinar AB?") e resumo descritivo de resultados;
  análise interpretativa fica para BYOK/API. Nota: vps-strategy decidiu NÃO redeployar
  Ollama para a stack geral de IA — **reabrir exceção dedicada** só para o runtime dos
  agentes da plataforma (decisão §8.3).
- **Privacidade/LGPD (crítico)**: dado de participante só vai a LLM **anonimizado**
  (`anonymized_id`, sem PII no prompt); no modo local, nada sai do host. BYOK = chave do
  pesquisador, cifrada em repouso, nunca exposta ao front; responsabilidade de uso no termo.
- **Streaming**: SSE (Nitro suporta nativamente) — chat fluido sem WebSocket.

## 7c. Participantes sintéticos — LLM como respondente (objetivo futuro do ozp)

**Objetivo declarado:** adaptar parte dos experimentos para **rodar de forma sintética com
LLM** — ver como cada modelo responde a estímulos, **principalmente testes projetivos**, como
**benchmark psicológico de LLMs**.

### Implicação de desenho que vale JÁ (é o motivo de estar no quadro)

O **núcleo do experimento** (schema JSON versionado + lógica de apresentação/coleta — o mesmo
núcleo planejado no projeto irmão 02) deve ser **agnóstico ao respondente**:

```
Schema do experimento (fonte da verdade)
        ├── Adapter humano     → jsPsych no navegador (tentativa, latência, clique)
        └── Adapter sintético  → LLM (estímulo → prompt; resposta → mesmo formato de dados)
                                     · modelos de texto e VISION (estímulos de imagem!)
                                     · MTS: apresenta amostra/comparativos, coleta escolha
                                     · Projetivos: estímulo aberto → resposta livre → análise
```

Assim a MESMA definição de experimento roda com humanos (plataforma) e com N modelos LLM
(benchmark), e os resultados caem no mesmo banco — comparação humano×modelo vira uma query.

- **Sinergias existentes**: o programa de pesquisa **psicologia-dos-agentes** (wiki) já
  investiga probes de LLM — esta plataforma vira o **instrumento padronizado** dele; e o
  schema do projeto 02 (PyMTS) vira a primeira família de probes procedurais.
- **Testes projetivos**: estímulo aberto + resposta livre → dependem menos de engine
  temporal e mais de análise de conteúdo — natural para LLM; começar por eles no piloto
  sintético faz sentido.
- **Custo**: rodar bateria de N modelos × M trials via API externa sai caro → preferir
  BYOK/modelos locais p/ varreduras grandes; API paga só p/ benchmarks curtos de modelos
  frontier (registra custo por run no banco).
- **Métrica de benchmark** (o que é "acerto" num projetivo?) — questão científica em aberto;
  primeira abordagem: comparar distribuição de respostas do modelo vs. normas humanas.

## 8. Decisões (estado em 2026-10-03, após rodada do ozp)

| # | Decisão | Estado |
|---|---|---|
| 1 | **Frontend** | ✅ **Nuxt 4 mantido** (re-validado — análise no §4b). Gatilho de revisão: MVP sem builder → HTMX volta a ser opção |
| 2 | **Alocação** | 🔶 **VPS próprio confirmado**; **qual** fica em aberto — decidir na F1 (com a opção D do §4 como default: enxuto num host, split reavaliado com medição) |
| 3 | **Agentes integrados** (§7b) | ✅ Objetivo confirmado (montagem + resultados; BYOK e local). 🔶 Aberto: política de chaves da plataforma; runtime local (llama.cpp vs Ollama — exceção dedicada à decisão "não redeployar Ollama"); quando entra (fase F3) |
| 4 | **Participantes sintéticos** (§7c) | ✅ Objetivo futuro confirmado (benchmark psicológico, projetivos primeiro). 🔶 Aberto: métrica de benchmark (modelo vs normas humanas); orçamento de API vs BYOK/local |
| 5 | **Domínio** | ⬜ `experimentos.psico.net` — confirma? |
| 6 | **Banco no piloto** | ⬜ Postgres enxuto + auth própria vs Supabase self-hosted reduzido |
| 7 | **Abertura do registro** | ⬜ Piloto por convite (recomendado) ou público desde F1 |
| 8 | **"Resultados" ao participante** | ⬜ Score bruto ok; interpretação a leigo tem risco ético — sugestão: feedback descritivo/educativo, nunca diagnóstico |
| 9 | **Ordem vs Track C (reset VPS)** | ⬜ Recomendação: desenvolver F0 já; decidir quando F1 estiver pronta |

## 9. Próximo passo — plano detalhado com skills

Quando as decisões do §8 fecharem (mesmo que só 1, 4 e 6 — as de caminho), rodar:

1. **bmad-architecture** → documento de arquitetura formal (os itens do §2 viram decisões
   concretas com trade-offs registrados; valida o modelo de dados da spec 03);
2. **bmad-prd** ou **bmad-spec** → requisitos/escopo do MVP (F0–F2) com histórias;
3. epics/stories (bmad-create-epics-and-stories) → issues no Multica já na convenção.

Até lá, F0 (dev local) pode andar em paralelo — é independente das decisões de produção.
