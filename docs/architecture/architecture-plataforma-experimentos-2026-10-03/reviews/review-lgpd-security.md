# Review — Lente LGPD + Segurança de Aplicação

| Campo | Valor |
| --- | --- |
| Alvo | `docs/architecture/architecture-plataforma-experimentos-2026-10-03/ARCHITECTURE-SPINE.md` (status: draft, 2026-10-03) |
| Lente | Compliance LGPD (dado sensível de saúde, art. 5º II) + segurança de aplicação (AppSec) |
| Fontes cruzadas | `.memlog.md` (constraints adotadas), `projects/03-plataforma-experimentos.md` (spec original: SQL, BYOK, roadmap), `projects/03a-arquitetura-infraestrutura.md` (contexto VPS) |
| Severidades | **Crítica** (bloqueia dado real de participante), **Alta** (corrige antes de F1/F2), **Média** (planejar no spine), **Baixa** (convenção/checklist) |

---

## Veredito

**Reprovado para dado sensível real na forma atual — corrigível no nível do spine.** Os instintos de privacy-by-design são bons (AD-5 segregação, AD-6 gateway único, AD-8 consentimento versionado, LiteLLM pinado pós-incidente), mas três buracos estruturais impedem considerar o desenho LGPD-adequado: (1) a "anonimização" do AD-5 é, na verdade, **pseudonimização com mapping retido e consultável** — logo todo o pipeline (analytics, exports, prompts de LLM, providers externos) continua sendo tratamento de dado pessoal **sensível**; (2) **direitos do titular não têm desenho**, com a tensão AD-4 (imutabilidade científica) × direito de eliminação (art. 18 VI) não resolvida nem registrada; (3) a **transferência internacional via BYOK é silenciosa**, apesar de o roteamento BYOK > plataforma > local priorizar justamente a rota internacional. Em AppSec: submissão de resultados forjável, injeção de conteúdo via experimento→jsPsych sem restrição de schema/CSP, e cifração de chaves BYOK sem desenho de chave mestra. Nada disso exige repensar o paradigma — exige ~4 novos ADs e um punhado de open questions explícitas antes do scaffold F0.

Contagem: **2 críticas, 6 altas, 7 médias, 4 baixas** + 5 propostas de AD e 8 open questions.

---

## 1. Achados LGPD

### L-01 — "Anonimização" é pseudonimização com mapping retido — CRÍTICA

**Onde:** AD-5 (linhas 89–95); ERD `PARTICIPANT_PROFILE ||--o{ SESSION` (linhas 199); spec fonte `projects/03-plataforma-experimentos.md` linhas 71–77 (`anonymized_id VARCHAR(64) UNIQUE` **dentro** de `participant_profiles`, junto de `birth_date`, `gender`, `education_level`).

O `anonymized_id` é um identificador persistente, único, e o caminho de re-identificação existe por construção: o vínculo participante→sessão está no modelo (FK / ERD), e o próprio AD-5 admite que "o join PII×resultado não existe como consulta de aplicação — só como processo auditado de atendimento a direitos do titular". Ou seja: **existe, é executável, e alguém o executa**. Sob LGPD (art. 5º III), dado só é anonimizado quando o titular não puder ser identificado considerando meios técnicos razoáveis e disponíveis. Pseudônimo com chave retida pelo controlador = **dado pessoal, e sensível** (resultado de teste psicológico, art. 5º II).

Consequências em cadeia que o spine trata como resolvidas e não estão:
- Exports, analytics e views SQL sobre `anonymized_id` continuam sendo tratamento de dado sensível (não "escapam" da LGPD como o texto sugere).
- Enviar prompt contendo dado de sessão a provider externo (AD-6/BYOK) é **transferência internacional de dado pessoal sensível** — ver L-03.
- Deveres de eliminação/retenção aplicam-se também ao dataset pseudonimizado — ver L-02/L-06.

O spine também não diz **como o id é derivado**: se for hash determinístico de user_id/e-mail sem segredo, é brute-forceável no espaço de e-mails (rainbow) e permite linkage entre experimentos; se for UUID aleatório, não permite linkage — decisão invisível com impacto de privacidade direto.

**Correção sugerida (uma linha):** renomear o conceito para *pseudonimização* no AD-5, derivar o id com HMAC keyed + salt por experimento (impede linkage cross-estudo e brute force), guardar o mapping em role/schema PostgreSQL segregada (ou DB físico à parte) acessível apenas ao processo de direitos do titular, e definir o pipeline de dissociação irreversível ao fim do estudo (só então o dado vira anonimizado de verdade e sai do escopo LGPD).

### L-02 — Direitos do titular sem desenho; tensão AD-4 × eliminação não resolvida — CRÍTICA

**Onde:** AD-4 (linhas 81–87) × silêncio total sobre art. 18.

AD-4: resultados append-only, "após fechamento, imutáveis". LGPD art. 18 garante ao titular acesso, correção, anonimização, **eliminação** (VI), portabilidade (VII), informação sobre compartilhamento. O spine não descreve nenhum desses fluxos — só a menção difusa de "processo auditado" no AD-5. A tensão central que o próprio AD-4 cria (imutabilidade científica × eliminação) não aparece nem como open question. LGPD oferece a válvula (art. 16: eliminação ao fim do tratamento, admitindo manutenção/bloqueio quando a eliminação for impossível ou desproporcional, ou quando necessária a finalidade legítima — pesquisa), mas é o controlador quem deve desenhar e justificar isso; ignorá-la é achado crítico porque o primeiro pedido de eliminação já chega num sistema que arquiteturalmente "não sabe" deletar.

Ponto agravante: o participante nunca acessa o próprio dado no desenho atual (a permissão "visualizar histórico próprio" existe no spec fonte, mas não virou arquitetura), e portabilidade (export do titular em formato legível por máquina) não existe — exports são coisa de pesquisador.

**Correção sugerida:** novo **AD "Direitos do titular"**: eliminação = remoção de PII + chave/mapping de pseudonimização + bloqueio do registro, preservando os trials **apenas se** irreversivelmente dissociáveis (art. 16), com registro na trilha de auditoria; acesso/portabilidade = processo auditado operado **exclusivamente pelo módulo `identity`** (única fronteira legítima do join), com SLA e autoatendimento do histórico próprio.

### L-03 — Transferência internacional silenciosa no BYOK — ALTA

**Onde:** AD-6 (linhas 97–105) — roteamento "BYOK > plataforma > local"; diagrama `L -.-> EXT` (linhas 177–187); spec fonte linhas 268–279 (`provider: 'openai' | 'anthropic' | 'custom'`).

Providers externos via BYOK = dado enviado a EUA (OpenAI/Anthropic). Mesmo pseudonimizado, continua sendo dado pessoal (L-01) — logo: art. 33 (transferência internacional somente a países com grau de proteção adequado ou com garantias — cláusulas contratuais padrão aprovadas pela Resolução CD/ANPD 19/2024, ou dado genuinamente anonimizado). O consentimento versionado (AD-8) não menciona que deve conter: (a) a finalidade do processamento por LLM, (b) terceiros envolvidos (provedor contratado pelo **pesquisador**, não pela plataforma), (c) a transferência internacional — art. 9º exige que o consentimento refira-se a finalidades determinadas e informe compartilhamentos; art. 10 soma requisitos para dado sensível. A hierarquia de roteamento ainda prioriza a pior rota para privacidade (BYOK externo) sobre a melhor (modelo local no VPS) exatamente quando o dado é mais sensível.

Agravante operacional: provedores de API podem reter prompts por política própria — minimização antes do prompt (descartar `anonymized_id`, demografia) não é regra no spine.

**Correção sugerida:** AD de governança de inferência: o termo de consentimento versionado enumera processamento por LLM + provedor + transferência; por experimento, flag **local-only** que restringe o roteamento LiteLLM a modelos locais quando o prompt contém dado de sessão; regra de minimização pré-prompt no adapter sintético/agentes.

### L-04 — Papéis LGPD e base legal por finalidade não definidos — ALTA

**Onde:** silêncio global; spec fonte trata "LGPD compliance" como checkbox (linhas 374–384).

Quem é **controlador** do dado do participante — a plataforma (ozp), o pesquisador, ou a instituição do pesquisador? Quem é **operador**? A plataforma processa por conta e risco de quem? Isso muda o termo de consentimento, a responsabilidade sobre o BYOK (o pesquisador vira controlador dos dados que ele manda ao provedor dele?) e o regime de pesquisa científica (art. 7º IV / art. 11 II / art. 13 — pesquisa com anonimização sempre que possível). Nenhuma base legal está declarada por finalidade: coleta (consentimento específico e destacado, art. 8º/10 — plausível), análise por LLM (consentimento cobre? pesquisa cobre?), recomendações/demografia vetorial F4 (pgvector sobre `participant_profiles`! — spec fonte linhas 139–147 — finalidade adicional distinta, precisa de base própria).

**Correção sugerida:** open question explícita no spine ("papéis e bases legais por finalidade") resolvida com o jurídico antes do F2 (registro aberto); separar termo de uso da plataforma de termo de consentimento do experimento (o AD-8 versiona o segundo; o primeiro não existe).

### L-05 — Menores de idade: nenhum tratamento — ALTA

**Onde:** spec fonte `participant_profiles.birth_date DATE` (linha 73); AD-8 (linhas 114–119) só versiona termo único.

Teste psicológico com população infantil/adolescente é cenário central da psicologia (o F5 cita testes **projetivos**). O spine não tem: gate de idade no registro, fluxo de consentimento do responsável (art. 14 — melhor interesse da criança, consentimento por pai/mãe/responsável), assentimento do adolescente, nem regra de minimização (birth_date exata é coleta desnecessária quando faixa etária basta). Coleta de dado sensível de criança sem esse desenho é risco regulatório direto e a ANPD tem fiscalizado o tema.

**Correção sugerida:** decidir explicitamente: (a) MVP só adultos com declaração de idade no registro, ou (b) AD de consentimento em duas camadas (responsável + assentimento), com data de nascimento restrita a ano/faixa.

### L-06 — Retenção e ciclo de vida do dado ausentes — MÉDIA

**Onde:** silêncio; spec fonte menciona "Política de retenção de dados" como item de segurança (linha 384) sem detalhe; backup cifrado externo "B2 etc." (linha 186 do spine).

Nada define: prazo de retenção de PII de conta inativa, sessões abandonadas, provas de consentimento, backups. O backup externo duplica **todo** o banco (incluindo `identity`/PII) para provedor americano (Backblaze B2) — cifrado, mas continua sendo cópia internacional de dado sensível (L-03 aplica-se), e eliminação de titular não alcança backups (tensão com L-02 que precisa estar documentada como limitação aceita + ciclo de rotação de backup).

**Correção sugerida:** AD ou open question "Retenção": tabela de prazos por categoria de dado; chave do backup guardada fora do provedor (envelope), rotação definida; declarar o backup como exceção documentada ao pipeline de eliminação.

### L-07 — `ip_address` / `user_agent` na tabela de sessão contradiz o AD-5 — MÉDIA

**Onde:** spec fonte linhas 104–105 (`ip_address INET`, `user_agent TEXT` em `experiment_sessions`); usado em analytics de fraud-check (linhas 220–228).

IP é dado pessoal identificável (posição ANPD/EDPB); armazená-lo na sessão (fora do módulo `identity`) quebra exatamente a segregação que o AD-5 promete — e o modelo ER do spine herda dessa spec. Se o fraud-check precisa de IP, deve viver segregado, com prazo curto e dissociado.

**Correção sugerida:** mover IP/UA para `identity` (ou eliminá-los), prazo de retenção curto declarado; analytics usa só `anonymized_id`.

### L-08 — Encarregado, RIPD e resposta a incidentes silenciosos — MÉDIA

**Onde:** silêncio global.

Art. 41 (encarregado/DPO com canal público), RIPD (art. 5º XVII — tratamento de dado sensível em escala é hipótese típica de exigibilidade pela ANPD), e notificação de incidente à ANPD em até 3 dias úteis + comunicação aos titulares em caso de risco relevante (Resolução CD/ANPD 15/2024). Nada disso — nem como open question — num sistema auto-hospedado por um único operador (single dev = single point de resposta a incidente).

**Correção sugerida:** open question: canal do encarregado publicado no portal (privacy@/contato), playbook de incidente com prazos ANPD, e RIPD executado antes do registro aberto F2.

### L-09 — Prova de aceite de consentimento insuficiente — BAIXA

**Onde:** AD-8 (linhas 114–119) — "sessão nasce com referência obrigatória à versão do termo aceita".

Falta o evento de aceite como evidência: quem aceitou, quando (timestamp), hash do termo renderizado. A referência à versão prova qual termo vigorava, não que o titular o aceitou.

**Correção sugerida:** evento append-only de aceite (conta + timestamp + versão + hash do termo), no padrão do AD-4.

### L-10 — Regulamentação profissional (CFP/SATEPSI) não mencionada — MÉDIA

Plataforma brasileira que aplica testes psicológicos toca na Resolução CFP nº 11/2012 (avaliação psicológica é atividade privativa de psicólogo; testos aprovados no SATEPSI) e no fluxo de aprovação ética (CEP/CAAE — o spec fonte até tem `ethics_approval_code`, linha 90, que o spine **dropou**). Não é LGPD, mas é compliance do mesmo domínio e determina gate de conteúdo: quem pode publicar qual experimento.

**Correção sugerida:** restaurar o workflow de revisão/aprovação de experimento (status draft→review→published + código ético) como parte do AD de segurança de conteúdo (S-03) ou open question explícita.

---

## 2. Achados de segurança de aplicação

### S-01 — Chaves BYOK "cifradas em repouso" sem desenho de chave — ALTA

**Onde:** AD-6 linha 102; spec fonte "apiKey: string // Armazenado de forma segura" (linha 274).

Cifrar com quê? Em VPS único com Docker Compose, master key em env/file no mesmo host que o ciphertext e o processo que decifra = proteção decorativa contra comprometimento do host (o adversário real aqui). Faltam: onde vive a master key (passphrase em boot? KMS externo — que conflita com a postura self-host?), quem pode descriptografar BYOK alheio (admin? o gateway?), rotação, e se a aplicação alguma vez manipula a chave bruta ou usa **virtual keys** do LiteLLM (o mecanismo certo: proxy keys por pesquisador com spend caps, master key nunca saindo do gateway).

**Correção sugerida:** envelope encryption com master key provisionada fora do VPS de aplicação (passphrase do operador no deploy ou KMS consciente do trade-off), BYOK exposto à app apenas como virtual key LiteLLM com budget, validação test-call no cadastro, e proibição de log de chave.

### S-02 — Submissão batch de resultados forjável (integridade científica) — ALTA

**Onde:** AD-7 (linhas 106–112): carga única, batch no fim, zero contato entre trials.

Se o endpoint de batch autenticar apenas com o `session_id` (UUIDv7 é único mas **não é secreto**), qualquer parte que descubre/enumerar ids pode forjar ou inundar resultados — envenenando o dado científico, corrompendo benchmarks (inclusive os humanos que calibram o sintético F5) e gerando custo de storage. O desenho estático torna esse o único ponto de escrita, então é exatamente aqui que a integridade precisa ser forte.

**Correção sugerida:** token de upload efêmero emitido na carga (HMAC, expira no TTL esperado da sessão, vinculado a session+experimento), validação de tamanho/shape do batch, idempotência por checkpoint.

### S-03 — Injeção de conteúdo via experimento → timeline jsPsych — ALTA

**Onde:** AD-3 (linhas 72–79) + AD-9 (linhas 121–126) + ERD (nenhum estado de review/aprovação de experimento).

O schema valida **estrutura**, não **conteúdo**: plugins jsPsych renderizam HTML como estímulo por padrão → um pesquisador aprovado (ou conta de pesquisador comprometida — o workflow de aprovação do spec fonte não sobreviveu ao spine) injeta JS arbitrário no navegador do participante: roubo de sessão do portal, phishing, distorção silenciosa do estímulo (compromete a ciência sem deixar rastro). Agravado pelo AD-9: estímulo por **URL externa** permite beacon de rastreamento que vaza IP/horário do participante a terceiro (violação do AD-5 em letra) e mixed-content.

**Correção sugerida:** (a) o JSON Schema proíbe script/iframe/event-handler inline e URLs externas — estímulo referencia apenas asset interno content-addressed; (b) ilha jsPsych em iframe sandbox com CSP estrita; (c) sanitização server-side com allowlist de HTML; (d) restaurar o fluxo de review/aprovação de experimento (status + ethics gate) que o spec fonte tinha e o spine dropou.

### S-04 — SSRF via URL externa de estímulo — MÉDIA

**Onde:** AD-9 ("servidos como estáticos ou via URL assinada").

Qualquer fluxo server-side que busque/pré-visualize/valide URL externa (preview no builder, geração de URL assinada, runner sintético puxando estímulo F5) vira SSRF contra a rede interna do VPS: LiteLLM admin, Postgres, Traefik dashboard, metadata de cloud se um dia migrar.

**Correção sugerida:** nunca fetch externo (asset só por upload); se inevitável: allowlist de domínio + resolução DNS com bloqueio de faixas internas/loopback/link-local, sem redirects, timeout.

### S-05 — Autenticação e proteção de endpoint subespecificadas — MÉDIA

**Onde:** Conventions, linha 141: "auth por sessão httpOnly cookie (participante) e token curto (API pesquisador)".

O cookie httpOnly é bom, mas: nenhuma política SameSite/CSRF — o **batch de resultados é mutação state-changing autenticada por cookie** (S-02 agrava); "token curto" sem formato (JWT? opaco?), armazenamento (hash no DB?), revogação; MFA constava do spec fonte (linha 381, "autenticação multifator") e **sumiu do spine** — regressão silenciosa justamente para os papéis (admin/pesquisador) que manuseiam BYOK e PII; sem rate limit/lockout no login nem anti-enumeration nas mensagens de erro.

**Correção sugerida:** convenção de auth explícita (SameSite estrito + CSRF token no batch; tokens opacos hasheados com expiração/revogação; MFA TOTP para researcher/admin antes do F3/BYOK; mensagens de erro uniformes; rate limiting no edge — Traefik middleware ou Nitro — para /register, /login, /sessions/:id/batch).

### S-06 — Registro público (F2) sem rate limiting / anti-abuso — MÉDIA

**Onde:** assumption F2 registro aberto (memlog linha 32); nenhum controle mencionado.

Farming de contas, list-bombing via sender de e-mail (usar o convite/validação para spamar terceiros — dano reputacional ao domínio psico.net), e enumeration via registro/login.

**Correção sugerida:** double opt-in com verificação de e-mail, captcha leve ou proof-of-work, quota de e-mails por IP/domínio, warm-up de domínio.

### S-07 — Runner sintético com custo desgovernado e injeção de prompt estrutural — MÉDIA

**Onde:** F5 `core/adapters/synthetic` + runner batch (linha 232); AD-6.

Batch runner multiplica trials × prompts sobre chaves reais: um schema gigante (ou malicioso, ou apenas errado) pode estourar BYOK do pesquisador ou a chave da plataforma; e o conteúdo do JSON do experimento entra no prompt como instrução implícita (injeção de prompt do "dado" sobre o "system") — sem tools o dano principal é custo e distorção do benchmark.

**Correção sugerida:** orçamento por run (tokens/USD) + limite de trials + kill switch no runner; prompts do runner construídos com o schema delimitado como dados, nunca concatenado como instrução.

### S-08 — Integridade/segurança dos assets content-addressed — BAIXA

**Onde:** AD-9.

Hash no nome não se verifica sozinho: verificar hash server-side no upload, servir com Content-Type correto + `X-Content-Type-Options: nosniff`, rejeitar mimes executáveis, garantir imutabilidade real do path (hash colidindo/rewriting), URLs assinadas com expiração curta. Se assets forem públicos, a plataforma assume exposição como host de conteúdo arbitrário de pesquisadores aprovados (scan de malware é caro — pelo menos terms of use e traceback via audit log).

**Correção sugerida:** verificação de hash no upload, nosniff + CSP de asset, expiração curta em URLs assinadas, upload restrito a pesquisadores aprovados.

### S-09 — Superfície do VPS único — BAIXA

**Onde:** Structural Seed (linhas 162–187).

LiteLLM (admin UI + master key) e Postgres no mesmo host do Traefik: garantir LiteLLM sem porta pública (só rede docker interna), Postgres sem `ports:` publicados, Netdata/Glances do host atrás de auth, unattended-upgrades no Debian, segredos do compose fora do repo (o `deploy/` "config por env" precisa de `.env` ignorado). O gate Track C (reset VPS) já cobre parte; faltam esses itens como checklist.

### S-10 — Trilha de auditoria não é cidadã de primeira classe — MÉDIA

**Onde:** AD-5 ("processo auditado" difuso); spec fonte tinha `admin_actions` (linhas 114–121); spine não traz nada.

LGPD art. 37 (registro das operações de tratamento) **e** proveniência científica (quem exportou, quem aprovou, quem rodou o join PII×resultado, quando) exigem um audit log append-only próprio — o padrão já existe na casa (AD-4). Sem ele, o "processo auditado" do AD-5 é uma afirmação sem mecanismo.

**Correção sugerida:** AD ou convenção de audit log append-only cobrindo: acesso a dados de sessão, exports, execução do join de direitos do titular, uso de BYOK/inferência, aprovações de pesquisador/experimento, ações admin.

---

## 3. Tensões estruturais

| Tensão | Estado no spine | Resolução mínima exigida |
| --- | --- | --- |
| **AD-4 imutabilidade × art. 18 VI eliminação** | Silenciosa (a mais grave) | AD "Direitos do titular": eliminação de PII+mapping com preservação de trials **só se** irreversivelmente dissociáveis (art. 16); declarar backups como exceção documentada |
| **AD-7 caminho estático × integridade do dado** | Não percebida | Token de upload efêmero no batch (S-02) — o desenho que otimiza UX concentra todo o risco num endpoint |
| **AD-6 roteamento BYOK > plataforma > local × art. 33** | Silenciosa | Flag local-only por experimento quando prompt contém dado de sessão (L-03) |
| **AD-9 URL externa × AD-5 sem PII a terceiros** | Contraditória em tese | Schema proíbe URL externa de estímulo (S-03) |
| **AD-4 append-only × art. 37/auditoria** | Complementares, não conectadas | Reutilizar o padrão append-only para o audit log (S-10) |

---

## 4. Propostas de novos ADs (rascunhos)

- **AD-11 — Pseudonimização keyed com mapping segregado** (absorve correção da L-01): id derivado por HMAC com salt por experimento; mapping em role/schema isolada acessível só ao processo de direitos do titular; dissociação irreversível ao fim do estudo como estado terminal do dado.
- **AD-12 — Direitos do titular como fluxo de `identity`** (L-02/L-09): acesso, portabilidade e eliminação operados exclusivamente pelo módulo `identity` com audit log; aceite de consentimento como evento append-only com hash.
- **AD-13 — Governança de inferência e transferência** (L-03/S-01/S-07): termo enumera LLM/provedor/transferência; flag local-only por experimento; virtual keys LiteLLM com spend caps; orçamento por run sintético.
- **AD-14 — Conteúdo de experimento é dado não-confiável** (S-03/S-04): schema proíbe JS inline e URL externa; ilha jsPsych sandboxed com CSP; approval workflow de experimento (status + ethics gate) antes de publicar.
- **AD-15 — Trilha de auditoria append-only** (S-10): art. 37 + proveniência científica; reusa o padrão AD-4.

## 5. Open questions explícitas a registrar no spine

1. Retenção por categoria de dado (PII, sessões abandonadas, provas de consentimento, backups) — e ciclo do backup B2 (L-06).
2. Papéis LGPD (controlador/operador) por finalidade e termo de uso da plataforma vs termo de consentimento (L-04).
3. Menores de idade: suportar em qual fase e com qual consentimento duplo? (L-05).
4. Encarregado, RIPD e playbook de incidente ANPD (Res. 15/2024) antes do registro aberto F2 (L-08).
5. Gestão da master key das cifras (BYOK e backups) — passphrase de deploy vs KMS externo, aceitando o trade-off self-host (S-01/L-06).
6. Gate CFP/SATEPSI/CEP: quem pode publicar teste psicológico na plataforma (L-10).
7. MFA para researcher/admin — quando ligar (antes do F3/BYOK) (S-05).
8. Rate limiting/anti-abuso no edge: Traefik middleware vs Nitro, e orçamento de e-mail (S-05/S-06).

## 6. Checklist mínimo antes de dado real de participante (F1→F2)

- [ ] AD-5 reescrito: pseudonimização + HMAC + mapping segregado (L-01)
- [ ] AD de direitos do titular com resolução da tensão AD-4 × eliminação (L-02)
- [ ] Termo de consentimento v1 enumera LLM, provedor BYOK e transferência internacional (L-03)
- [ ] Token de upload efêmero no batch + CSRF/SameSite (S-02/S-05)
- [ ] JSON Schema proíbe script inline e URL externa; ilha jsPsych com CSP/sandbox (S-03)
- [ ] Virtual keys LiteLLM com spend caps; master key fora do repo/env (S-01)
- [ ] Audit log append-only cobrindo acesso a dado e aprovações (S-10)
- [ ] IP/user_agent fora da tabela de sessão (L-07)
- [ ] RIPD + canal do encarregado + playbook de incidente (L-08)
- [ ] Decisão registrada sobre menores de idade (L-05)
