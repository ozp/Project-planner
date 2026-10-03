---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - docs/specs/spec-plataforma-experimentos-mvp/SPEC.md
  - docs/specs/spec-plataforma-experimentos-mvp/phases.md
  - docs/specs/spec-plataforma-experimentos-mvp/journeys.md
  - docs/architecture/architecture-plataforma-experimentos-2026-10-03/ARCHITECTURE-SPINE.md
reviewNote: "Run em modo delegado (ozp: 'continue') — confirmações interativas dos steps viram marcos de revisão: validar este doc antes de despachar stories para agentes."
---

# Plataforma de Experimentos Psicológicos (MVP F0–F2) - Epic Breakdown

## Overview

Breakdown do MVP (F0–F2) em épicos e stories, decompondo o SPEC.md (kernel + companions) e os requisitos técnicos do ARCHITECTURE-SPINE.md (15 ADs vinculantes). Fontes: SPEC como PRD; spine como Architecture; UX ainda não existe (pré-requisito opcional — camada de UX deve preceder o Epic 4).

## Requirements Inventory

### Functional Requirements

FR1 (CAP-1): Participante cria conta e autentica (F1 convite / F2 aberto); pesquisador autentica após aprovação — sessão httpOnly.
FR2 (CAP-2): Nenhum dado coletado sem aceite registrado da versão vigente do termo; troca de termo invalida só novas sessões humanas (AD-9).
FR3 (CAP-3): Visitante encontra experimentos abertos e inicia participação em ≤3 toques, mobile-friendly, sem instalação.
FR4 (CAP-4): Experimento roda no navegador com carga única e gravação batch no fim (AD-7), autenticada por token efêmero (AD-11).
FR5 (CAP-5): Pesquisador aprovado registra experimento via documento JSON (schemaVersion) + estímulos; aceito vira docVersion imutável (AD-4); builder visual fora do escopo.
FR6 (CAP-6): Admin aprova/rejeita pesquisadores, suspende contas, com trilha de auditoria; acesso admin exige MFA (AD-12).
FR7 (CAP-7): Resultados chegam como TrialResult canônico append-only; batch idempotente; trial fora do contrato rejeitado na ingestão (AD-3/AD-5).
FR8 (CAP-8): Pesquisador exporta sessões dos seus experimentos em CSV/JSON pseudonimizado, zero PII (AD-6).
FR9 (CAP-9): Deploy compose no VPS com Traefik/HTTPS, backup cifrado client-side, restore testado (<1h); dev local espelha prod (AD-15).
FR10 (CAP-10): Participante solicita acesso aos próprios dados e eliminação da conta; eliminação remove PII+mapping e preserva trials só se irreversivelmente dissociados (AD-13).

### NonFunctional Requirements

NFR1: LGPD transversal — dado sensível de saúde; consentimento explícito versionado; pseudonimização com dissociação programada; classe protegida inclui demográficos e texto livre (AD-6/AD-13).
NFR2: Dado sensível nunca em cloud de terceiro em claro; backup externo só cifrado client-side (AD-15).
NFR3: Privacy-by-default na coleta: sem IP/user-agent nas sessões (decisão divergente da spec 03 original).
NFR4: Stack seed vinculante: Nuxt 4/Nitro, PostgreSQL 18, jsPsych 8.3.0 pinado, Traefik v3, Node 22 LTS (AD-1).
NFR5: Simplicidade operacional: 1 dev + agentes de código; monolith deploy único; sem serviços extras sem limite medido.
NFR6: UI pt-BR, mobile-first.
NFR7: Feedback a participante descritivo/educativo, nunca diagnóstico.
NFR8: Zero PII em logs, exports e prompts (testável por suíte automatizada).

### Additional Requirements

- Starter/scaffold (impacta Epic 1 Story 1): monorepo Nuxt 4 (app/ + server/api + core/ + db/ + deploy/) conforme árvore do spine; docker compose local espelhando prod desde o dia 1 (AD-15).
- Motor procedural no núcleo com seed registrada na sessão (AD-2) — adapters só renderizam/coletam.
- Contrato TrialResult versionado em core/schema com respondent_class, trial_seq, hash do estímulo; timing human / inference synthetic (AD-3).
- Owner único de escrita de sessão (sessions); runner sintético NÃO existe no MVP mas o contrato já o prevê (AD-5).
- Estímulos: assets internos content-addressed; schema proíbe script inline e URL externa; ilha jsPsych com CSP restritiva (AD-10).
- Tokens: upload efêmero HMAC TTL da sessão; pesquisador token curto escopado (AD-11).
- UUIDv7 nativo PG18; RFC 9457 problem+json; logs sem classe protegida (Conventions).
- CI: lint + testes a cada push (AD-15); experimento MTS de exemplo como fixture canônica dos testes.

### UX Design Requirements

_(não aplicável — contrato de UX ainda não existe; requisito de processo: rodar bmad-ux antes do Epic 4/F2)_

### FR Coverage Map

FR1: Epic 2 (conta+auth) · Epic 4 (abertura self-service)
FR2: Epic 2 (consentimento versionado)
FR3: Epic 3 (catálogo com convite) · Epic 4 (catálogo público ≤3 toques)
FR4: Epic 1 (execução batch + token)
FR5: Epic 1 (autoria por documento)
FR6: Epic 2 (aprovação/auditoria/MFA)
FR7: Epic 1 (ingestão canônica idempotente)
FR8: Epic 3 (export pseudonimizado)
FR9: Epic 3 (deploy/backup/restore)
FR10: Epic 4 (direitos do titular)

## Epic List

### Epic 1: Primeiro experimento de ponta a ponta (F0)
Pesquisador-desenvolvedor submete um experimento MTS definido em documento JSON e o vê rodar no navegador; o resultado canônico cai íntegro no Postgres local. Walking skeleton com o núcleo (schema, motor, adapters, ingestão) — sem auth ainda (participante local implícito).
**FRs covered:** FR4, FR5, FR7 (+ NFR4, NFR5 parcial)

### Epic 2: Identidade, papéis e consentimento (F0→F1)
Pessoas têm contas com papéis (participante/pesquisador/admin) e nenhum dado é coletado sem consentimento versionado aceito; admin aprova pesquisadores com auditoria e MFA.
**FRs covered:** FR1, FR2, FR6 (+ NFR1, NFR8)

### Epic 3: Piloto fechado no VPS — coleta real (F1)
O ozp conduz uma coleta real: plataforma no ar em VPS próprio com HTTPS, participantes convidados executam o experimento, e o pesquisador exporta os dados pseudonimizados.
**FRs covered:** FR3 (catálogo logado), FR8, FR9 (+ NFR2, NFR3, NFR6)

### Epic 4: Abertura pública e direitos do titular (F2)
Qualquer pessoa participa sozinha pelo celular (registro aberto, catálogo público) e qualquer participante exerce seus direitos LGPD (acesso/eliminação) sem intervenção manual.
**FRs covered:** FR1 (self-service), FR3 (público), FR10 (+ NFR1, NFR6, NFR7)

---

## Epic 1: Primeiro experimento de ponta a ponta (F0)

Valor: demonstrar o produto mínimo vivo — documento JSON vira experimento executável cujo dado canônico está seguro no banco. É a fundação que todos os demais épicos usam; standalone (roda local, sem auth).

### Story 1.1: Scaffold do monorepo com ambiente dev espelhando prod

As a desenvolvedor,
I want o monorepo Nuxt 4 (app/, server/api/, core/, db/, deploy/) com docker compose (Postgres 18 + app) e CI lint+testes,
So que todo story seguinte nasce no lugar certo e o dev local já é um espelho do prod.

**Acceptance Criteria:**

**Given** o repo clonado em máquina com Docker
**When** `docker compose up` é executado
**Then** Postgres 18 e a app sobrem saudáveis
**And** `pnpm test` roda lint+suíte no CI a cada push (GitHub Actions)
**And** a árvore segue o Structural Seed do spine (core/ sem imports de app/server)

### Story 1.2: Contrato core/schema v1 — documento do experimento e TrialResult

As a desenvolvedora do núcleo,
I want o JSON Schema versionado do documento do experimento (blocos, tentativas, critérios, consequências, SMTS/DMTS, estímulos por referência-hash) e o tipo TrialResult canônico (respondent_class, trial_seq, hash, timing human / inference synthetic),
So que autor, execução e ingestão compartilham um único contrato (AD-3/AD-4) e o F5 futuro já está previsto sem implementação.

**Acceptance Criteria:**

**Given** um documento de experimento MTS válido (fixture)
**When** validado pelo schema
**Then** passa, e carrega `schemaVersion` e `docVersion`
**And** documento com script inline ou URL externa em estímulo é REJEITADO (AD-10)
**And** campo opcional `feedback` (texto descritivo/educativo por experimento — usado no Story 4.3) faz parte do contrato desde v1
**And** TrialResult de humano com timing completo valida; synthetic com `inference` valida; mistos rejeitam

### Story 1.3: Motor procedural respondente-agnóstico

As a desenvolvedora do núcleo,
I want o motor que executa blocos com critério de mastery, repetições, re-embaralhamento e RNG com seed registrada,
So que a mesma definição+seed produz a mesma sequência para qualquer respondente (AD-2) e a semântica PyMTS é fiel.

**Acceptance Criteria:**

**Given** o documento fixture com 2 blocos (ABtraining com critério 3, testEq) e seed fixa
**When** o motor gera a sequência de tentativas
**Then** a sequência é determinística para a mesma seed
**And** bloco reprovado repete até `repetitions`; aprovado avança; fim mostra end_text
**And** comparativos são embaralhados entre posições a cada tentativa

### Story 1.4: Adapter jsPsych — experimento MTS executável no navegador

As a participante local,
I want executar o experimento no navegador com carga única (documento + manifest de estímulos) e gravação em batch no fim,
So que a experiência é fluida (sem chamadas entre trials — AD-7) e funciona no celular.

**Acceptance Criteria:**

**Given** um experimento publicado localmente
**When** a página abre
**Then** uma única carga traz documento pinado + manifest com URLs geradas pelo servidor
**And** entre trials zero chamadas de rede (verificável no teste)
**And** ao concluir, o batch é enviado com idempotency key

### Story 1.5: Ingestão canônica idempotente com token efêmero

As a plataforma,
I want aceitar batches de TrialResults somente com token HMAC de sessão válido (TTL) e escrevê-los append-only por sessão com owner único,
So que dado forjado não entra (AD-11) e reenvio não duplica (AD-5).

**Acceptance Criteria:**

**Given** sessão criada com token efêmero
**When** batch válido chega
**Then** trials ficam append-only na sessão, imutáveis pós-fechamento
**And** o MESMO batch reenviado (mesma idempotency key) não duplica registros
**And** batch sem token / token expirado / trial fora do contrato → 401/422 problem+json (RFC 9457)

### Story 1.6: Autoria mínima — submeter documento e estímulos

As a pesquisador-desenvolvedor,
I want submeter documento JSON + pacote de estímulos e receber validação com erro acionável,
So que um experimento aceito fica imutável como docVersion e pronto para execução (FR5).

**Acceptance Criteria:**

**Given** documento + estímulos submetidos via CLI/script local
**When** o documento é inválido
**Then** a resposta aponta o caminho/linha do erro de forma acionável
**And** aceito: estímulos viram assets content-addressed (hash) e o documento vira docVersion imutável
**And** reenvio do mesmo conteúdo é idempotente (mesmo docVersion)

---

## Epic 2: Identidade, papéis e consentimento (F0→F1)

Valor: pessoas reais com papéis; consentimento como porta obrigatória da coleta; admin com alçada e auditoria. Usa Epic 1 (sessões existem).

### Story 2.1: Contas e autenticação (participante e pesquisador pendente)

As a visitante,
I want criar conta com e-mail+senha e entrar,
So que posso participar de experimentos e ver meu histórico (FR1).

**Acceptance Criteria:**

**Given** e-mail não usado
**When** registro + login
**Then** sessão httpOnly emitida; hash de senha com algoritmo atual (argon2id/bcrypt)
**And** pesquisador recém-registrado fica `pending` — sem acesso à área de pesquisa
**And** rate limiting no registro/login

### Story 2.2: Pseudonimização e emissão de anonymized_id

As a plataforma,
I want que identity emita anonymized_id por HMAC keyed + salt por experimento, com mapping segregado por role,
So que análise/export/prompts nunca toquem PII (AD-6/NFR8) e a dissociação futura seja possível.

**Acceptance Criteria:**

**Given** participante inicia sessão num experimento
**When** a sessão é criada
**Then** ela referencia anonymized_id derivado por experimento (não global)
**And** nenhuma view/query de análise expõe e-mail
**And** teste automatizado varre logs/exports por PII e falha se achar

### Story 2.3: Consentimento versionado como gate

As a participante,
I want ver e aceitar o termo de consentimento vigente do experimento antes de qualquer coleta,
So que meus dados só são coletados com meu aceite registrado (FR2/AD-9).

**Acceptance Criteria:**

**Given** experimento com termo v2 vigente
**When** participante tenta iniciar sessão sem aceitar
**Then** a API recusa a criação de sessão
**And** aceite registra (participante, termo, timestamp)
**And** publicação de termo v3 invalida apenas novas sessões; sessões antigas preservadas

### Story 2.4: Admin — aprovação de pesquisadores, suspensão, auditoria, MFA

As a admin,
I want aprovar/rejeitar pesquisadores, suspender contas e ver a trilha do que fiz, com MFA no meu login,
So que a autoria de experimentos seja privilégio auditado (FR6/AD-12).

**Acceptance Criteria:**

**Given** pesquisador pendente
**When** admin aprova
**Then** pesquisador ganha acesso à autoria; ação registrada em admin_actions
**And** login admin sem segundo fator (TOTP) é recusado
**And** suspensão de conta bloqueia novas sessões imediatamente

---

## Epic 3: Piloto fechado no VPS — coleta real (F1)

Valor: primeira coleta científica real na plataforma própria, com participantes convidados e dado exportável. Usa Epics 1–2.

### Story 3.1: Deploy no VPS com HTTPS e convites

As a ozp (operador),
I want a plataforma no ar no VPS via compose+Traefik com Let's Encrypt e registro por convite (link único por experimento),
So que o piloto começa fechado e controlado (FR3/FR9, assumption F1-dash).

**Acceptance Criteria:**

**Given** VPS preparado (Debian 12)
**When** o pipeline de deploy roda
**Then** experimentos.psico.net responde com HTTPS válido
**And** registro exige convite válido; convite não aceito → recusa
**And** segredos fora do repo (deploy/, .env gerenciado)

### Story 3.2: Backup cifrado client-side e restore testado

As a ozp,
I want backup diário cifrado (chave fora do provedor) e um restore já testado,
So que o dado científico sobrevive a perda do VPS sem expor nada em claro (FR9/AD-15).

**Acceptance Criteria:**

**Given** backup diário configurado
**When** restore é executado em ambiente limpo
**Then** dados voltam íntegros (checksum) e o provedor só possui ciphertext
**And** o teste de restore fica documentado com data/resultado

### Story 3.3: Catálogo logado e acompanhamento básico

As a participante convidado,
I want ver os experimentos abertos para mim e iniciar em ≤3 toques,
So que a participação é simples no celular (FR3/NFR6).

**Acceptance Criteria:**

**Given** participante logado com convite
**When** abre a home
**Then** lista experimentos disponíveis a ele com descrição pt-BR acessível
**And** fluxo home→experimento rodando em ≤3 toques, mobile-first

### Story 3.4: Exportação pseudonimizada para o pesquisador

As a pesquisador,
I want exportar CSV/JSON das sessões dos meus experimentos,
So que analiso os dados no meu ambiente (FR8/NFR8).

**Acceptance Criteria:**

**Given** experimento com N sessões fechadas
**When** exporto
**Then** CSV/JSON contém todos os TrialResults íntegros em formato longo/tidy
**And** zero PII (verificado por teste automatizado)
**And** export só do próprio experimento do pesquisador (RBAC server-side)

### Story 3.5: Coleta piloto de 10 participantes (validação de campo)

As a pesquisador (ozp),
I want conduzir a coleta real com ≥10 convidados,
So que a plataforma valida end-to-end com dado científico de verdade.

**Acceptance Criteria:**

**Given** 1 experimento MTS real publicado
**When** ≥10 convidados completam
**Then** todas as sessões fecham com TrialResults completos e consentimentos registrados
**And** export final íntegro; incidentes/latências anotados no relatório do piloto

---

## Epic 4: Abertura pública e direitos do titular (F2)

Valor: a plataforma fica pública de verdade — desconhecido participa sozinho; participante tem autonomia sobre seus dados. Usa Epics 1–3. **Pré-requisito de processo: rodar bmad-ux antes deste épico.**

### Story 4.1: Registro aberto self-service com rate limiting

As a qualquer pessoa,
I want criar conta sozinha,
So que participo sem depender de convite (FR1-F2).

**Acceptance Criteria:**

**Given** visitante anônimo
**When** registra-se
**Then** conta criada com verificação de e-mail; abuso contido por rate limiting + captcha suave
**And** nenhum dado além do mínimo é pedido

### Story 4.2: Catálogo público com landing (SEO/aceso facilitado)

As a visitante,
I want entender o que é e começar rápido,
So que a barreira de entrada é mínima (FR3).

**Acceptance Criteria:**

**Given** landing pública (SSG/SSR)
**When** visitante chega de busca/celular
**Then** encontra experimentos abertos e chega rodando em ≤3 toques
**And** Lighthouse mobile ≥90 nas páginas públicas

### Story 4.3: Feedback descritivo ao participante

As a participante,
I want receber um retorno educativo ao fim do teste,
So que a participação tem sentido (NFR7 — nunca diagnóstico).

**Acceptance Criteria:**

**Given** experimento com feedback configurado pelo pesquisador
**When** sessão fecha
**Then** participante vê o conteúdo descritivo/educativo definido
**And** o sistema não gera interpretação própria — só o texto do pesquisador

### Story 4.4: Direitos do titular — acesso e eliminação self-service

As a participante,
I want baixar meus dados e eliminar minha conta,
So que exerço meus direitos LGPD sem pedir a ninguém (FR10/AD-13).

**Acceptance Criteria:**

**Given** participante logado
**When** solicita acesso
**Then** recebe pacote com seus dados em formato legível
**And** ao eliminar: PII + mapping destruídos; trials preservados somente se irreversivelmente dissociados (chave HMAC do experimento destruída quando aplicável)
**And** evento de auditoria registrado; fluxo executável end-to-end no mesmo dia

### Story 4.5: Endurecimento público (rate limit global, monitoramento)

As a plataforma pública,
I want proteção e visibilidade de operação,
So que o público não derruba nem abusa do serviço.

**Acceptance Criteria:**

**Given** tráfego público
**When** picos/abuso ocorrem
**Then** rate limit global por IP/conta segura o serviço; erros monitorados com alerta
**And** painel mínimo de sessões/dia disponível ao admin
