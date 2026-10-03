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
| 6 | **Resultados/relatórios** | Estatísticas p/ pesquisador; "resultados" p/ participante (futuro) | Views SQL + export CSV | Ver decisão ética §8.5 |
| 7 | **Operação** | Deploy, backups, monitoramento, logs | Docker/Dokploy, backups externos | Herda o padrão do ambiente (Traefik, fail2ban) |

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

## 5. Jornada do participante (o "acesso facilitado")

```
1. Chega em experimentos.psico.net (mobile-friendly — público BR usa telefone)
2. Registro leve: e-mail + senha (ou magic link) → conta participante
3. Escolhe/é convidado a um teste → TERMO DE CONSENTIMENTO (LGPD) antes de anything
4. Dados demográficos MÍNIMOS (idade, escolaridade — só o que o estudo precisa)
5. Teste roda no navegador (jsPsych) — sem instalação, sem app
6. Ao final: resultado salvo (batch) + feedback ao participante (escopo futura — §8.5)
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
| **F0 — Dev** | Local (docker: Nuxt + Postgres; Supabase cloud só p/ dev) | Portal esqueleto, 1 experimento jsPsych de exemplo, schema do banco | Spec validada; auth básica |
| **F1 — Piloto fechado** | **dash** (provisório, pós ou pré-reset conforme §8.6) | Registro **por convite**; 1–2 testes reais; coleta consentida; sem resultados ao público | Teste de coleta real + latência + LGPD revisada |
| **F2 — Público** | dash (ou split B, se medido) | Registro aberto ("acesso facilitado"), catálogo, painel do pesquisador, backups verificados | Operação estável ≥1 mês |
| **F3 — Resultados** | idem | Relatórios ao pesquisador; feedback ao participante (decisão ética §8.5) | — |
| **F4 — Analytics/IA** | labs | Busca vetorial, recomendações, LLM assistido (já na spec 03) | Escala justificar |

## 8. Decisões em aberto (para o ozp — nada disso bloqueia F0/F1)

1. **Alocação**: aceitar recomendação D (enxuto no dash → reavaliar split) ou outra opção do §4?
2. **Domínio**: `experimentos.psico.net` (registro manual no HostGator) — confirma?
3. **Banco no piloto**: Postgres enxuto + auth própria vs Supabase self-hosted reduzido desde o início?
4. **Abertura do registro**: piloto por convite (recomendado) ou público desde o F1?
5. **"Resultados" ao participante**: até onde devolver? (score bruto ok; **interpretação**
   de teste psicológico a leigo tem risco ético — sugestão: feedback descritivo/
   educativo, nunca diagnóstico; pesquisador decide o que publica)
6. **Ordem vs Track C (reset VPS)**: deploy do piloto antes do reset (aceita retrabalho de
   reinstall) ou depois (espera o gate de backup/restore)? Recomendação: **desenvolver F0
   já; decidir quando F1 estiver pronta** — a distância entre as duas pode ser curta.

## 9. Próximo passo — plano detalhado com skills

Quando as decisões do §8 fecharem (mesmo que só 1, 4 e 6 — as de caminho), rodar:

1. **bmad-architecture** → documento de arquitetura formal (os itens do §2 viram decisões
   concretas com trade-offs registrados; valida o modelo de dados da spec 03);
2. **bmad-prd** ou **bmad-spec** → requisitos/escopo do MVP (F0–F2) com histórias;
3. epics/stories (bmad-create-epics-and-stories) → issues no Multica já na convenção.

Até lá, F0 (dev local) pode andar em paralelo — é independente das decisões de produção.
