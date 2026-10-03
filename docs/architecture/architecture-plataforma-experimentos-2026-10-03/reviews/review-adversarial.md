# Review adversarial — Architecture Spine "Plataforma de Experimentos Psicológicos"

- **Alvo:** `docs/architecture/architecture-plataforma-experimentos-2026-10-03/ARCHITECTURE-SPINE.md` (status draft, 2026-10-03)
- **Método:** construir DUAS unidades um nível abaixo (features/módulos), cada uma obedecendo os 10 ADs **à letra**, e deixá-las se encontrarem nos pontos de integração que o próprio spine declara — mesmo port (AD-2), mesmo schema (AD-3), mesmo banco/sessão (AD-4), mesma segregação (AD-5), mesmo gateway (AD-6), mesmo caminho de gravação (AD-7). Toda colisão que sobrevive à conformidade literal é um buraco do spine.
- **Data:** 2026-10-03

---

## 1. As duas unidades

### Unidade A — "Execução de experimentos (humano)"

Time A constrói a linha do mapa: `app/` ilha jsPsych + `core/adapters/jspsych` + o caminho de
gravação em batch no módulo `sessions`. Entregáveis: carga do experimento (1 request),
execução client-side offline-durante-execução, gravação do lote no fim com checkpoints por
bloco, adapter que traduz dados nativos do jsPsych (`rt`, `response`, `trial_type`,
strings de estímulo) para "o formato canônico".

### Unidade B — "Participantes sintéticos (F5)"

Time B constrói a linha do mapa: `core/adapters/synthetic` + runner batch. Entregáveis:
runner server-side que itera o schema, monta prompts (texto e visão), chama o LiteLLM,
parseia respostas para "o formato canônico" e grava sessões sintéticas para N modelos,
de modo que "humano×modelo no mesmo banco vira uma query" (03a §7c, objetivo declarado).

### Prova de conformidade literal (como cada time lê cada AD)

| AD | Leitura do Time A (humano) | Leitura do Time B (sintético) | Ambas à letra? |
|---|---|---|---|
| AD-1 | Ilha importa `core/` (borda→centro); `core/` sem imports de `server/` | Adapter em `core/adapters/synthetic` (conforme árvore literal); runner fora de `core/` — "runner batch" não tem casa na árvore, então B escolhe sozinho | Sim (a letra não diz onde o runner vive) |
| AD-2 | Consume "definição de trial", emite "resultado de trial" — seu mapeamento próprio dos dados jsPsych | Monta prompts, parseia respostas para "o formato canônico" — seu mapeamento próprio | Sim (a letra nunca define o formato nem o port) |
| AD-3 | Valida schema na autoria; timeline gerada, nunca armazenada | Lê o schema versionado; não participa de autoria | Sim (a letra não diz onde/onde-se valida) |
| AD-4 | Grava via módulo `sessions` (POST do lote) | Não está nos binds de AD-4 (`dados-sessoes` apenas) nem na coluna de governança do mapa para sintéticos (AD-2, AD-3, AD-6) | Sim (B literalmente não é alcançado pela AD) |
| AD-5 | Sem PII no payload; só id de sessão | Sintético não tem PII; prompts sem PII por construção | Sim |
| AD-6 | N/A | Tudo via LiteLLM; roteamento BYOK > plataforma > local | Sim |
| AD-7 | 1 request de carga, batch no fim + "checkpoints explícitos" (formato que A mesmo inventa) | "Caminho do participante" e "jsPsych" — B lê como fora de escopo; grava como lhe convier | Sim (binds de AD-7 não incluem sintéticos) |
| AD-8 | Sessão nasce com aceite do termo vigente (NOT NULL semântico) | Sessão sintética via módulo `sessions`: B cadastra aceite-fantasma OU contorna com referência sem evento de aceite | **Não dá para obedecer** — ver H3 |
| AD-9 | Manifest de estímulos por referência (URL/hash) | Resolve estímulos por referência para enviar bytes ao modelo | Sim (a letra não diz como cada consumer resolve) |
| AD-10 | N/A (F4) | N/A (F5) | Sim |

Duas unidades maximamente conformes. A seguir, o que acontece quando elas se encontram.

---

## 2. Colisões (cada uma = um buraco a fechar)

### H1 — CRITICAL — O porto compartilhado e o formato canônico não existem como artefato

AD-2 promete que jsPsych e sintético são "plugados no mesmo port" e que o núcleo só
emite/consome "o formato canônico de tentativa" — mas **nenhum AD, convenção ou entidade
define o port ou o formato**. Não há nome de interface, não há assinatura, não há campo
obrigatório, não há dono do tipo.

O que cada time constrói em conformidade:

- **A** emite `{ trial_index, block, stimulus: <URL apresentada>, response: "B1.png", rt_ms: 843, correct: true, client_ts }` — `rt` é latência motora humana; estímulo identificado pela URL que o navegador viu; timestamp do relógio do cliente.
- **B** emite `{ trial_index, block, stimulus: <hash do asset>, response: "B1", inference_ms: 2100, correct: null, model_ref }` — sem `rt`; latência de inferência de GPU (semântica diferente); corretude ausente em projetivos (a métrica de benchmark é questão científica aberta — Deferred do spine); estímulo por hash (única coisa estável no server-side, já que URL assinada expira — AD-9).

Colisões concretas quando os dados caem "no mesmo banco":

1. **`rt_ms` vs `inference_ms`**: se B reutiliza o campo de latência, a comparação
   humano×modelo mistura latência motora com tempo de fila de inferência; se omite,
   toda view de analytics precisa saber qual ramo do union está lendo. A promessa
   central do F5 ("comparação vira uma query") quebra na primeira query.
2. **Estímulo por URL vs por hash**: URLs assinadas expiram e variam por sessão; hashes
   são estáveis. Sem regra "resultado referencia estímulo por hash", joins
   stimulus-level entre humano e sintético são impossíveis ou apodrecem.
3. **Relógio e ordem**: convenção diz ISO-8601 UTC mas não diz relógio de quem, nem quem
   atribui sequência no append-only; resultados jsPsych chegam com skew de relógio de
   cliente, sintéticos com relógio de servidor.
4. **O porto em si**: "plugados no mesmo port" sem port definido. B pode inclusive fazer
   `fetch()` direto ao LiteLLM de dentro de `core/adapters/synthetic` sem importar SDK
   nenhum — literalmente dentro da letra de AD-1 ("não importa SDKs de infra") e AD-6
   ("tudo passa pelo LiteLLM") — enquanto A assume que o núcleo declara um port de
   inferência implementado na borda. Dois desenhos que o texto autoriza e que não se
   encaixam.

**Por que nenhum AD impede:** AD-2 nomeia o formato mas não o especifica; nenhuma
convenção ou entidade o possui.

**Correção:** apertar AD-2 — `core/engine` define a interface `RespondentPort`
(`present(trialDef) → TrialResult`) e `core/schema` define `TrialResult` versionado
(`resultSchemaVersion`) com discriminador `respondent_class: human | synthetic`,
`trial_seq` sequencial por sessão, estímulo sempre por hash, e latência/timing confinados
ao ramo `human`; chamada a LLM só via port de inferência injetado na borda; validação do
TrialResult na ingestão do módulo `sessions`.

---

### H2 — CRITICAL — O runner sintético não tem casa no desenho nem caminho de escrita definido (AD-1 × AD-4)

O mapa diz "Participantes sintéticos (F5) | `core/adapters/synthetic` + **runner batch**".
Mas: (a) `core/` não pode importar SDKs de infra (AD-1) — o adapter sintético em `core/`
não escreve no banco; (b) a árvore mínima lista `server/api/` com exatamente
`identity, sessions, agents, analytics` — **não há `server/jobs/` nem qualquer casa para o
runner**; (c) a convenção de auth define só "cookie httpOnly (participante) e token curto
(API pesquisador)" — **não existe credencial de serviço** para um runner batch.

Dois builds conformes:

- **B1** coloca o runner em `server/jobs/synthetic-runner`, importa a interface interna do módulo `sessions` e grava direto.
- **B2** faz o runner como cliente HTTP da API pública com um token de pesquisador emprestado.

Colisões: B1 exige do módulo `sessions` uma interface interna que o spine não pede
(a rota de batch foi desenhada para a ilha cliente); B2 faz um componente server-side
chamar o próprio servidor por HTTP com credencial de humano — e nenhuma convenção de
auth cobre isso. Pior: **AD-4 não binda `participantes-sinteticos`** (binds: apenas
`dados-sessoes`) e a coluna de governança do mapa para sintéticos omite AD-4 — a regra
"owner único / nenhum outro módulo escreve resultados" literalmente não alcança quem mais
precisa escrever resultados. A pergunta do enunciado — "a sessão tem owner claro quando o
runner sintético escreve?" — responde: **não no texto**.

**Correção:** apertar AD-1/AD-4 — criar home explícita (`server/jobs/`), declarar que o
módulo `sessions` expõe um port de escrita único usado tanto pela rota HTTP quanto pelo
runner, adicionar credencial de serviço à convenção de auth, e bindar
`participantes-sinteticos` em AD-4.

---

### H3 — HIGH — AD-8 é insatisfazível para sessão sintética (gate sem carve-out)

AD-8: "sessão nasce com referência **obrigatória à versão do termo aceita**" e "nova
versão de termo invalida a criação de novas sessões". O ER do spine permite sessão
sintética (`SESSION }o--o| SYNTH_CONFIG`), e todo nascimento de sessão passa pelo módulo
`sessions` — que para obedecer AD-8 à letra exige um **evento de aceite** que não existe
para respondente sem titular. E a invalidação por mudança de termo **bloquearia corridas
de benchmark** quando o texto do termo muda — efeito sem sentido para quem não é sujeito
de dados.

Divergência inevitável: A implementa aceite NOT NULL (B não consegue criar sessão); B
inventa um aceite-fantasma do runner ou referencia o termo sem aceite (A audita isso como
vitação). Dois construtores conformes chegam a esquemas de consentimento incompatíveis no
mesmo banco.

**Correção:** apertar AD-8 — sessão sintética referencia o termo vigente como metadado de
conformidade (sem evento de aceite); a invalidação por nova versão aplica-se somente a
sessões humanas.

---

### H4 — HIGH — `schemaVersion`/EXPERIMENT_VERSION/termo: três versões conflatas, sessão sem regra de pin, validação sem ponto definido (AD-3)

AD-3 diz "experimento = documento JSON validado por JSON Schema versionado" e "mudanças
incompatíveis = nova versão de schema + migração explícita". Não separa: **versão do
contrato de schema** × **revisão do documento do experimento** × **versão do termo** (o ER
pendura `CONSENT_TERM` em `EXPERIMENT_VERSION` — "exige versão vigente" — logo, mudança de
termo força nova versão de experimento?). Não diz **quem valida e onde** (autoria? publish?
criação de sessão? carga da ilha? runner?). E não diz **o que a sessão pina**.

Dois builds conformes:

- **A**: `schemaVersion` = revisão do documento; edita o experimento in-place (bump a cada save, sem migração — "mudança compatível").
- **B**: `schemaVersion` = versão do contrato; `EXPERIMENT_VERSION` = snapshot imutável por publicação.

Colisões: sessões em voo (AD-7: estático após carga) referenciam documento mutável em A →
resultado irremissível/irreproduzível, burlando o espírito de AD-4 sem violar a letra;
benchmark sintético re-roda contra documento diferente do que o humano rodou e a comparação
perde o sentido. A "migração explícita" vive em `db/migrations` (SQL) mas migra documento
JSONB é job de aplicação — dono indefinido. Validador novo no deploy pode rejeitar
documento pinado antigo no meio do caminho estático de AD-7.

**Correção:** apertar AD-3 — separar `schemaVersion` (contrato, com migração de documentos
de propriedade definida) de `docVersion` (snapshot `EXPERIMENT_VERSION` imutável com hash
de conteúdo); sessão pina `docVersion` exata; validação obrigatória na criação da sessão e
na carga (autoria valida antes, mas não é suficiente); desacoplar versão de termo de
versão de experimento.

---

### H5 — HIGH — `anonymized_id`: sem dono, sem algoritmo, sem escopo; demográficos sensíveis fora da classe protegida (AD-5)

AD-5 protege "identidade (e-mail, credenciais)" e promete que "análise, exports e prompts
enxergam apenas `anonymized_id`". Não diz **quem emite** o `anonymized_id`, **com que
algoritmo**, nem **escopo** (global estável vs pseudônimo por experimento). A spec 03
(rascunho) o coloca em `participant_profiles` — estável e global, lado do identity.

Dois builds conformes:

- **A (identity)** emite UUID aleatório na registro, estável para sempre.
- **B (analytics)**, por limitação de propósito (LGPD), deriva `HMAC(experiment_id, participant_id)` — pseudônimo por experimento.

Ambos "enxergam apenas anonymized_id"; exports dos dois módulos **não joineiam** — ou,
no build A, um id estável permite rastrear dado sensível de saúde mental da mesma pessoa
across estudos (pior para LGPD). O "processo auditado" de direitos do titular precisa de
um caminho de re-identificação definido — com duas derivações, exclusão de titular tem
semântica diferente por módulo. E: **demográficos** (birth_date, gender, escolaridade —
coletados na jornada, art. 5º II) não são "e-mail, credenciais", então a letra de AD-5
não os coloca em lugar nenhum — um builder pode guardá-los junto aos resultados, keyed by
`anonymized_id`, e **todo export leva quasi-identificadores sensíveis sem violar a letra**.

**Correção:** apertar AD-5 — `anonymized_id` emitido exclusivamente pelo `identity`, com
algoritmo e escopo definidos (recomendação: pseudônimo por experimento); demográficos
sensíveis entram na classe protegida (acesso só via módulo identity/consulta auditada).

---

### H6 — HIGH — Batch/append sem contrato de idempotência; checkpoint "explícito" sem dono de formato (AD-7 × AD-4)

AD-7: "resultado gravado em batch no fim (**ou checkpoints explícitos**)". Quem define o
envelope do batch e o formato do checkpoint? O schema (autoria declara checkpoints por
bloco)? A ilha (A decide)? O módulo `sessions` (contrato de ingestão)? Não dito. E nada
sobre **idempotência**: público-alvo é BR mobile (03a §5); POST do lote final falha por
rede, a ilha retenta → **append duplicado, imutável para sempre** (AD-4). Dedupe
server-side posterior exige chave que o cliente tem de mandar — mudança de contrato com
dado append-only já gravado. Também indefinido: checkpoint parcial é visível a analytics
antes do fechamento?

**Correção:** apertar AD-7 — envelope de batch com `idempotency_key` por checkpoint
(dedupe na ingestão do `sessions`); dono do formato = módulo `sessions` (contrato de
ingestão único); resultados parciais visíveis a analytics só após fechamento.

---

### H7 — MEDIUM — Fallback de roteamento (AD-6) corrói a provenance do benchmark sem registro obrigatório

AD-6: roteamento "BYOK > plataforma > local". Num benchmark F5 com N modelos, fallback
significa que `model_ref` pedido ≠ modelo efetivamente servido (BYOK expira → cai para
plataforma → cai para 3B local). O ER grava só `model_ref`. Nenhuma regra exige registrar
o **modelo servido**, parâmetros de amostragem e versão do template de prompt no
resultado. A registra o que pediu; B registra o que o LiteLLM reporta — ou nada. Dado de
benchmark silenciosamente corrompido (você acha que testou o modelo X; testou o 3B local).

**Correção:** apertar AD-6 — toda resposta sintética grava provenance obrigatória (modelo
efetivamente servido, parâmetros, hash do template de prompt); fallback mid-run proibido
em corridas de benchmark (ou registrado por trial).

---

### H8 — MEDIUM — Binds dos ADs ≠ mapa Capability→Architecture: duas superfícies de enforcement que discordam

Exemplos verificados: AD-3 binds `autoria, motor-experimentos`, mas o mapa governa
sintéticos com AD-3; AD-4 binds `dados-sessoes`, mas o mapa aplica AD-4 a
`resultados` (leitor) e o mapa **omite** AD-4 para sintéticos (o escritor!); AD-7 binds
`motor-experimentos, operacao`, mas o mapa adiciona `dados-sessoes`; AD-8 e AD-9 não
alcançam `participantes-sinteticos` em nenhuma das duas superfícies, embora ambos sejam
atingidos por eles via módulo `sessions` e via consumo de estímulos. É exatamente por
essas frestas de bind que H2, H3 e H9 escapam ilesos: **bind é a superfície de
enforcement e ela não bate com o mapa**.

**Correção:** normalizar — tabela única (AD ↔ módulos) declarando que bind = superfície de
enforcement; sintéticos bindam AD-3, AD-4, AD-7, AD-8, AD-9.

---

### H9 — LOW — Estímulo: "estáticos **ou** URL assinada" deixa dois modos de resolução; bytes para provider externo sem política

AD-9 autoriza dois modos de servir; consumers diferentes resolvem diferente (ilha usa URL;
runner vision precisa dos bytes para mandar ao provider via LiteLLM). Além disso: estímulo
de pesquisa inédita indo a provider externo sob chave de plataforma não é PII (AD-5/AD-6
não cobrem) mas é material de pesquisa confidencial — política ausente. (A regra
"resultado referencia por hash" fecha a parte de dados — ver H1.)

**Correção:** complementar AD-9 — resolução de asset **por hash** para qualquer adapter
(ilha e runner); política explícita para estímulo em provider externo em corridas
sintéticas/BYOK.

---

### H10 — MEDIUM — Texto livre de projetivo: PII de conteúdo fora do modelo de segregação

AD-5 segrega **identidade**; não diz nada sobre PII **voluntariamente revelada dentro do
conteúdo** ("meu nome é..., moro em..."). Resposta projetiva em texto livre é o caso central
do F5 e vira: export de analytics (keyed por `anonymized_id` — letra ok) e contexto de
prompt dos agentes F3 (letra ok: "enxergam apenas anonymized_id"). Identificadores diretos
vazam por conteúdo com o AD-5 intacto.

**Correção:** apertar AD-5 — conteúdo textual com potencial identificador passa por
triação/anonimização (ou garantia contratual explícita no termo) antes de export e antes
de prompt de LLM.

---

## 3. Notas de higiene

- **"Sessão" sobrecarregada**: a convenção de auth usa "sessão" (cookie httpOnly de participante) e AD-4 usa "sessão" (unidade experimental). Dois builders, dois significados — renomear um (ex.: `auth_session` vs `experiment_session`/`session`).
- **Terminologia do formato canônico**: memlog chama "evento de resultado", spine chama "resultado de trial" — evidência adicional de que H1 precisa de um artefato nomeado.
- Stack: pgvector "quando F4" e LiteLLM pinado — ok; sem achado.

---

## 4. Resumo

| # | Severidade | Buraco | AD | Correção (1 linha) |
|---|---|---|---|---|
| H1 | **critical** | Port + formato canônico de tentativa não existem como artefato | AD-2 | Definir `RespondentPort` + `TrialResult` versionado em `core/schema` com `respondent_class`, `trial_seq`, estímulo por hash, timing só no ramo human, validado na ingestão |
| H2 | **critical** | Runner sintético sem casa nem caminho de escrita/credencial; AD-4 não o binda | AD-1, AD-4 | Casa explícita (`server/jobs/`), port de escrita único do `sessions`, credencial de serviço, bind de sintéticos em AD-4 |
| H3 | **high** | AD-8 insatisfazível p/ sessão sintética (gate sem carve-out) | AD-8 | Sessão sintética referencia termo como metadado sem aceite; invalidação só para humanas |
| H4 | **high** | schemaVersion/docVersion/termo conflatos; sessão sem pin; validação sem ponto | AD-3 | Separar contrato de documento (snapshot imutável), sessão pina `docVersion`, validar na criação/carga |
| H5 | **high** | `anonymized_id` sem dono/algoritmo/escopo; demográficos fora da classe protegida | AD-5 | Emissão exclusiva pelo `identity` com escopo definido (pseudônimo por experimento); demográficos na classe protegida |
| H6 | **high** | Batch sem idempotência; checkpoint sem dono de formato | AD-7 | `idempotency_key` por checkpoint, contrato de ingestão do `sessions`, parcial invisível a analytics |
| H7 | medium | Fallback de roteamento corrompe provenance do benchmark | AD-6 | Registrar modelo servido + parâmetros + hash do template; sem fallback mid-run |
| H8 | medium | Binds ≠ mapa de governança (enforcement ambíguo) | todos | Tabela única AD↔módulo como superfície de enforcement |
| H9 | low | Dois modos de servir estímulo; bytes a provider sem política | AD-9 | Resolução por hash para qualquer adapter; política p/ estímulo em provider externo |
| H10 | medium | PII em texto livre de projetivo fora da segregação | AD-5 | Triagem/anonimização de conteúdo antes de export/prompt |

## 5. Veredito

**Aprovado com ressalvas — bloqueante para o scaffold do `core/` na F0.** As fronteiras
estruturais (AD-1, AD-6 deploy, AD-9 storage, AD-10) estão sólidas; mas as duas unidades
que o paradigma declara compatíveis — humano e sintético no mesmo port e no mesmo banco —
**não têm contrato compartilhado suficiente para serem construídas de forma
interoperável** a partir do texto atual: 2 buracos críticos (H1, H2) e 4 altos (H3–H6).
Condição para detalhar `core/engine`, `core/schema` e adapters: fechar H1 e H2 (contratos)
e H3/H4 (gates de sessão); H5–H7 podem fechar junto, no mesmo aperto de redação.
