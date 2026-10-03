# Review — Rubric Walker (good-spine checklist)

- **Artefato:** `ARCHITECTURE-SPINE.md` — Plataforma de Experimentos Psicológicos (altitude: initiative; purpose: build-substrate)
- **Contexto de apoio:** `projects/03a-arquitetura-infraestrutura.md`, `projects/03-plataforma-experimentos.md`, `projects/02a-mapeamento-psychopy-jspsych.md`, `.memlog.md`
- **Data:** 2026-10-03
- **Veredito:** **PASS com concerns** — o spine é sólido (ADs com Prevents reais, binds explícitos, stack verificada com data, envelope operacional presente), mas tem 1 achado high e 4 medium que devem ser endereçados antes/até o desdobramento em epics.

---

## 1. Pontos de divergência fixados para o nível abaixo — falta algum?

**Julgamento: bom, com 1 lacuna high e 2 médias.**

O que está bem fixado (duas unidades construindo independentemente não divergem):

| Ponto de divergência | Onde fixa |
| --- | --- |
| Split de serviços / duplicação front-back | AD-1 (1 unidade deployável; direção de dependências borda→centro) |
| Formato do dado de tentativa (humano vs sintético) | AD-2 (formato canônico; nenhum tipo do núcleo menciona jsPsych/DOM/provider) |
| Formato primário do experimento | AD-3 (schema JSON versionado; timeline jsPsych gerada, nunca armazenada) |
| Caminho de mutação do dado científico | AD-4 (owner único `sessions`; append-only pós-fechamento) |
| Vazamento de PII | AD-5 + convenção "logs sem PII" |
| Chamadas a LLM / chaves | AD-6 (gateway único; routing BYOK > plataforma > local) |
| Acoplamento latência-banco no trial | AD-7 (1 request de carga; zero chamadas entre trials; batch/checkpoint) |
| Termo de consentimento | AD-8 (gate na criação da sessão) |
| Estímulos | AD-9 (content-addressed, referência) |
| Serviço vetorial | AD-10 (pgvector até evidência medida) |
| Mecanismo de sessão/auth, envelope de erro, IDs, datas, naming | Consistency Conventions (cookie httpOnly + token curto; RFC 9457; UUIDv7; ISO-8601) |

**Lacunas (achados):**

1. **[HIGH] Semântica procedimental sem dono pinado — agendamento de blocos, loops de critério e randomização.** AD-2 fixa o *formato* da tentativa, mas não fixa *quem executa* a semântica procedimental: o loop "bloco repete até critério, com re-embaralhamento por passagem" (herança PyMTS documentada no 02a §"O que o motor suporta") vive no `core/engine` ou em cada adapter? A rule de AD-3 lista "blocos, tentativas, critérios, consequências, delays" no *schema*, mas schema descreve; não executa. Se o adapter jsPsych e o runner sintético implementarem cada um o loop de critério e a política de shuffle (e o seeding de RNG), os resultados humano×modelo não são comparáveis — exatamente o fork que AD-2 declara prevenir ("o benchmark sintético virar um fork do produto"), só que procedural em vez de tipológico. A convenção "unidade procedimental = bloco com critério" reafirma a semântica mas não o dono.
   **Fix sugerido:** estender a rule de AD-2 (ou acrescentar convenção): `core/engine` é o único dono do sequenciamento (emite a próxima definição de trial, avalia critério de bloco, controla shuffle com RNG semeado e registrado na sessão); adapters apenas renderizam/coletam.
2. **[MEDIUM] Enforcement de autorização (RBAC) não pinado.** As convenções fixam o *mecanismo de sessão* (cookie/token), mas não o padrão de checagem de papéis (middleware central vs por-rota; quem define participante/pesquisador/admin). `sessions`, `analytics` e `identity` poderiam enforcing divergentes.
3. **[MEDIUM] Formato/destino de auditoria não pinado** (ver achado de cobertura §6 sobre a capability admin da spec 03).

## 2. Cada AD tem Rule que realmente previne o "Prevents" declarado?

**Julgamento: 8/10 plenos; AD-2 e AD-6 parciais.**

| AD | Rule enforceable? | Previne o declarado? |
| --- | --- | --- |
| AD-1 | Sim (lint de importações; 1 serviço no compose) | Sim |
| AD-2 | Sim (import/type lint) | **Parcial** — previne vazamento de tipos, não divergência procedural (achado 1 acima) |
| AD-3 | Sim (validação por schema; proibição de persistir timeline) | Sim |
| AD-4 | Sim (grants/DB, owner único) | Sim |
| AD-5 | Sim (grants por schema; join só em processo auditado) | Sim |
| AD-6 | Parcial | **Parcial** — previne chaves espalhadas e PII externo, mas "custo desgovernado" não tem elemento correspondente na rule (sem registro de custo por run nem teto/orçamento no gateway). O 03a §7c planeja "registra custo por run no banco" — a rule deveria carregar isso. |
| AD-7 | Sim (revisável por desenho; sem chamadas entre trials) | Sim |
| AD-8 | Sim (FK obrigatória + gate na criação) | Sim |
| AD-9 | Sim (referência; blob não entra no banco) | Sim |
| AD-10 | Sim (regra de decisão com evidência) | Sim |

**Fix AD-6:** acrescentar à rule "toda chamada registra custo por run (model, tokens, rota BYOK/plataforma/local) no banco; orçamento/teto configurável no gateway".

## 3. Algo sob "Deferred" permite divergência na construção independente?

**Julgamento: aceitável, com uma tensão não reconciliada (média) e um item de paradigma (baixa).**

- **Qual VPS (F1)** — sem risco: deploy é uma unidade só (AD-1), nenhuma feature diverge por causa disso. OK.
- **Auth própria vs Supabase** — tem default marcado `[ASSUMPTION]` e o *contrato* (cookie/token) está nas convenções, então as unidades podem construir contra o contrato. OK. Nota: typo "Nituro" → "Nitro".
- **Runtime local (F3)** — isolado atrás do gateway (AD-6 torna a escolha invisível aos consumidores). OK — este é o modelo de bom defer.
- **Métrica do benchmark (F5)** — questão científica; os resultados já caem no mesmo formato (AD-2/AD-4). OK.
- **UI de builder / gatilho HTMX [MEDIUM-LOW]** — o item defer um *paradigma de frontend* inteiro ("se cortar o builder, HTMX volta a ser opção"). O default é adotado e o gatilho registrado (03a §4b), mas o spine deveria dizer explicitamente que acionar esse gatilho é **revisão de spine** (reabre AD-1 e a Stack), não escolha de feature — senão uma unidade de `app/` pode tratar como decisão local.
- **Admin/observabilidade** — ver §6: conflita ops-monitoring com capability admin de usuário.
- **[MEDIUM] Tensão não escrita em nenhum lugar do spine: residência de dados vs backup.** O memlog carrega a constraint adotada "dado sensível de participante NUNCA em serviço cloud de terceiro (cloud só ambiente de dev)" (linha 7) e, ao mesmo tempo, o diagrama de deploy mostra "backup cifrado externo (B2 etc.)" — Backblaze B2 é cloud de terceiro (EUA). As duas coisas podem coexistir (backup cifrado com chave só no VPS é a exceção aceita, alinhada a OZP-93/03a §6), mas o spine não reconcilia: a unidade de ops lê o diagrama e manda backup pra B2; quem lê a constraint entende "nada em terceiro, nunca". É exatamente uma divergência permitida entre unidades.
  **Fix:** uma linha em AD-5 ou nas convenções: "backup externo cifrado é a única exceção aceita à residência própria; chave de cifra só no VPS; dado em claro nunca sai do host" (ou a política que o ozp decidir — mas escrita).

## 4. Tecnologia nomeada está verificada-corrente (memlog 2026-10-03)?

**Julgamento: PASS.**

O Stack declara "SEED — verificado em 2026-10-03" e o memlog sustenta: evento de verificação web na mesma data (linha 39) + entradas `version` para Node 22/26, Nuxt 4, jsPsych 8.3.0, PostgreSQL 18, LiteLLM (com o incidente supply-chain 1.82.7/.8 documentado e política de pin — exemplar), Traefik v3. Itens deliberadamente sem versão são defensáveis: LiteLLM (política pós-incidente com auditoria explícita em AD-6), runtime local (questão aberta F3 marcada como tal), pgvector ("quando F4").

Notas menores (low):
- **pgvector**: compatibilidade da versão com PostgreSQL 18 não foi objeto de entrada no memlog — quando F4 chegar, verificar antes de assumir.
- **SO/alvo "Debian 12"**: afirmado como fato do ambiente sem entrada de verificação no memlog (Debian 13 é estável desde 2025); herdado do ambiente, mas o spine nomeia a versão — ou o ambiente confirma, ou o spine diz "SO do host".

## 5. Cobertura de dimensões estruturais — alguma dimensão inteira em silêncio?

**Julgamento: envelope operacional coberto no nível seed; as dimensões mais fracas são *ambientes* e *pipeline/CI*.**

Decidido: paradigma (AD-1), dados (ER + AD-3/4/8/9/10), segurança de dado (AD-5), estilo de API (convenções), deploy (diagrama de containers: Traefik, Nuxt/Nitro, Postgres, LiteLLM, runtime local, assets, backup externo), escala (AD-7, AD-10 — postura "VPS único até prova contrária"), observabilidade (deferida com dono e data — herda Netdata/Glances). Isso é mais envelope operacional do que muitos spines carregam — positivo.

Silêncios parciais:

- **[MEDIUM] Ambientes**: nada sobre a matriz dev→prod. Onde roda o dev (03a diz "docker local; Supabase cloud só p/ dev" — e isso interage com o default "auth própria no Nitro" do Deferred), se existe staging, paridade dev/prod. Uma unidade pode assumir dev=compose local, outra dev=algum host. Fix: 2 linhas no Structural Seed ("F0: docker compose local (Nuxt+Postgres); produção só a partir de F1 no VPS; sem staging dedicado até F2").
- **[MEDIUM-LOW] CI/pipeline**: árvore mínima e convenções não mencionam build/test/CI em lugar nenhum. Para um purpose=build-substrate que vai alimentar F0–F5, é dimensão estrutural em silêncio (não precisa decidir a ferramenta; precisa declarar "decidido na F0" ou questão aberta).
- **[LOW] Ciclo de vida do experimento**: a spec 03 traz `status ENUM('draft','review','published','archived')` + `ethics_approval_code`; o ER do spine tem `EXPERIMENT_VERSION` mas nenhum estado/ciclo de publicação nem gate de aprovação ética. Risco de a unidade de autoria e a de portal divergirem sobre "o que é um experimento publicável".
- **[LOW] Retenção/deleção LGPD**: 03a §6 deixa "política de retenção + deleção de conta ≠ perda do dado anonimizado — definir"; o spine fica em silêncio (AD-5 cobre o join auditado, não a política). Deveria constar como questão aberta com dono (F2).

## 6. Capability → Architecture cobre a spec de origem?

**Julgamento: 9/12 linhas boas; 2 capabilities ausentes, 1 fraca.**

Coberto: portal+registro, identidade/papéis, execução humana, autoria, dados/sessões, resultados/relatórios, agentes assistidos, participantes sintéticos, operação. Cada linha com `Lives in` + `Governed by` — bom formato.

- **[MEDIUM] Gestão administrativa/auditoria ausente.** A spec 03 tem uma camada inteira (§"Funções Administrativas": aprovação de pesquisadores, `admin_actions`, `compliance_alerts`, suspensão, transferência de ownership, export de compliance — roadmap Fase 2 inteira). O mapa não tem linha; "Identidade e papéis" cobre papéis, não auditoria; e o item Deferred "Admin/observabilidade" congela tudo como "detalhe de ops na F1", conflatando admin *de usuário* (capability de produto) com monitoring *de infra*. Duas unidades (identity, analytics) podem inventar cada uma seu formato de log de auditoria.
  **Fix:** linha no mapa (ex.: "Admin, aprovação e auditoria | `server/api/identity` + tabela de audit | AD-5; formato de audit como convenção") e separar o deferred em "observabilidade (ops)" vs "admin UI (produto)".
- **[MEDIUM] "Resultados" ao participante (§8.8) ausente do spine inteiro.** O 03a coloca feedback ao participante no escopo da F3; o memlog carrega a assumption aprovável "descritivo/educativo, nunca diagnóstico/interpretação clínica" — um guardrail ético — e nem AD, nem convenção, nem mapa, nem Deferred mencionam. É silêncio sobre uma dimensão com constraint já conhecida.
  **Fix:** convenção ("output voltado ao participante = descritivo/educativo, nunca diagnóstico") + linha no mapa em `app/` + `server/api/analytics`.
- **[LOW] Recomendações/anomalias (casos de uso vetoriais da spec 03)** — cobertos apenas implicitamente via AD-10/F4; aceitável a esta altitude, mas uma linha "Analytics vetorial (F4) | `server/api/analytics` + pgvector | AD-10" fecharia o mapa.

---

## Tabela-resumo de achados

| # | Severidade | Achado | Fix |
| --- | --- | --- | --- |
| 1 | **High** | Semântica procedimental (loop de critério, shuffle, RNG) sem dono: AD-2 previne fork de tipos, não fork procedural; benchmark humano×modelo pode não ser comparável | Rule de AD-2: `core/engine` dono único do sequenciamento/critério/RNG semeado e registrado |
| 2 | **Medium** | Capability admin/auditoria da spec 03 fora do mapa; deferred conflata admin de produto com ops | Linha no mapa + convenção de formato de audit + separar o deferred |
| 3 | **Medium** | Feedback ao participante (§8.8) e seu guardrail ético (memlog) ausentes do spine | Convenção "nunca diagnóstico" + linha no mapa |
| 4 | **Medium** | Tensão residência de dados vs backup B2 não reconciliada no spine (constraint só no memlog) | Linha em AD-5/convenções definindo a exceção do backup cifrado |
| 5 | **Medium** | AD-6 declara prevenir "custo desgovernado" sem elemento de custo na rule | Registrar custo por run + teto no gateway |
| 6 | Medium | Ambientes (dev/prod) e CI/pipeline em silêncio | 2 linhas no Structural Seed + deferred/questão aberta para CI |
| 7 | Medium | RBAC enforcement pattern não pinado | Convenção de cross-cutting |
| 8 | Low | Gatilho HTMX deve ser marcado como revisão de spine, não escolha de feature | Nota no Deferred |
| 9 | Low | Ciclo de vida/publicação de experimento (status, ética) ausente do ER | Estado no ER ou questão aberta |
| 10 | Low | Retenção/deleção LGPD sem questão aberta registrada no spine | Questão aberta com dono (F2) |
| 11 | Low | pgvector×PG18 e Debian 12 sem verificação no memlog; typo "Nituro" | Verificar em F4 / confirmar ambiente / typo |

## Pontos fortes (para o registro)

- ADs com `Binds` explícitos e Prevents que são divergências reais (não genéricas) — AD-4, AD-7 e AD-8 são exemplos de regras baratas que eliminam classes inteiras de briga entre unidades.
- Disciplina de memlog exemplar: versões datadas, incidente LiteLLM transformado em rule (pin + auditoria), constraints adotadas vs assumptions marcadas.
- O mapa Capability→Architecture com `Governed by` ligando cada capability aos ADs é exatamente a amarra que evita "feature órfã de arquitetura".
- Envelope operacional presente já no seed (deploy, backup, escala) — o ponto cego usual de spines de iniciativa.

## Recomendação

Endereçar o achado 1 (high) **antes** do desdobramento em epics/stories — ele é a condição de comparabilidade do programa sintético inteiro. Achados 2–5 cabem como patch curto no próprio spine (linhas de mapa, convenções, 1 sentence em AD-5/AD-6). O resto pode entrar como questões abertas datadas.
