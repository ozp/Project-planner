# Plataforma de Experimentos Psicológicos

## 📌 Informações Gerais

- **Status:** Pré-planejamento
- **Tipo:** Sistema web completo
- **Stack:** Nuxt + Supabase + jsPsych
- **Prioridade:** Alta
- **Complexidade:** Alta

## 🎯 Objetivos

### Principal
Disponibilizar jsPsych em VPS próprio com gestão completa de usuários (pesquisadores e participantes) via Supabase + Nuxt.

### Secundário (Futuro)
Integração com LLM (BYOK - Bring Your Own Key) para criação e análise assistida de experimentos.

### Adicionais
- Gestão administrativa do sistema
- Relatórios normativos e estatísticos
- Sistema dual de dados (SQL + Vetorial)

## 🏗️ Arquitetura Proposta

### Stack Tecnológico

| Camada | Tecnologia | Função |
|--------|------------|--------|
| **Frontend** | Nuxt 3 | Interface web, SSR, gestão de rotas |
| **Backend** | Supabase | Autenticação, banco de dados, API REST |
| **Experimentos** | jsPsych | Motor de experimentos psicológicos |
| **Banco SQL** | PostgreSQL | Dados transacionais e relacionais |
| **Banco Vetorial** | Pinecone/Qdrant/Weaviate | Embeddings e busca semântica |
| **Hospedagem** | VPS | Controle total do ambiente |

### Referências
- Nuxt: https://github.com/nuxt/nuxt
- Supabase: https://github.com/supabase/supabase
- jsPsych: https://github.com/jspsych/jsPsych

---

## 🗄️ Arquitetura de Dados

### 1. Base de Dados SQL (PostgreSQL via Supabase)

#### Tabelas Principais

**Usuários e Autenticação:**
```sql
CREATE TABLE user_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role ENUM('admin', 'researcher', 'participant'),
    status ENUM('pending', 'active', 'suspended', 'deleted'),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL
);

CREATE TABLE researcher_profiles (
    user_id UUID PRIMARY KEY REFERENCES user_accounts(id),
    institution VARCHAR(255),
    credentials TEXT,
    verification_status ENUM('pending', 'verified', 'rejected'),
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP NULL
);

CREATE TABLE participant_profiles (
    user_id UUID PRIMARY KEY REFERENCES user_accounts(id),
    birth_date DATE,
    gender VARCHAR(50),
    education_level VARCHAR(100),
    anonymized_id VARCHAR(64) UNIQUE
);
```

**Experimentos e Sessões:**
```sql
CREATE TABLE experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    researcher_id UUID REFERENCES researcher_profiles(user_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    jspsych_config JSONB NOT NULL,
    llm_metadata JSONB,
    status ENUM('draft', 'review', 'published', 'archived'),
    ethics_approval_code VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE experiment_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID REFERENCES experiments(id),
    participant_id UUID REFERENCES participant_profiles(user_id),
    researcher_id UUID REFERENCES researcher_profiles(user_id),
    session_data JSONB,
    results_summary JSONB,
    llm_analysis JSONB,
    status ENUM('invited', 'started', 'completed', 'abandoned', 'excluded'),
    ip_address INET,
    user_agent TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    excluded_reason TEXT
);
```

**Gestão Administrativa:**
```sql
CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES user_accounts(id),
    action_type VARCHAR(100),
    target_user_id UUID REFERENCES user_accounts(id),
    action_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE compliance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(100),
    severity ENUM('low', 'medium', 'high', 'critical'),
    experiment_id UUID REFERENCES experiments(id),
    session_id UUID REFERENCES experiment_sessions(id),
    description TEXT,
    detected_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES user_accounts(id)
);
```

### 2. Base de Dados Vetorial

**Collections para Embeddings:**
- `participant_profiles_vector`: Perfis demográficos e comportamentais
- `experiment_embeddings`: Conteúdo e configurações de experimentos
- `experiment_results_vector`: Padrões de resultados e anomalias

**Casos de Uso:**
- Recomendação de experimentos para participantes
- Detecção de anomalias em resultados
- Busca semântica de experimentos similares
- Análise de padrões comportamentais

---

## 👥 Gestão de Usuários

### Perfis e Permissões

| Perfil | Permissões |
|--------|-----------|
| **Admin** | Gerenciar todos usuários, aprovar pesquisadores, auditar sistema |
| **Pesquisador** | Criar experimentos, convidar participantes, analisar dados |
| **Participante** | Participar de experimentos, visualizar histórico próprio |

### Workflow de Aprovação

```
Registro Pesquisador → Envio Credenciais → Revisão Admin →
Verificação Background → Aprovação/Rejeição → Notificação
```

### Funções Administrativas

```typescript
interface AdminDashboard {
  // Gestão de contas
  listPendingResearchers(): ResearcherApplication[]
  approveResearcher(id: UUID, credentials: CredentialData): void
  suspendUser(id: UUID, reason: string): void
  transferExperimentOwnership(from: UUID, to: UUID): void

  // Monitoramento
  getSystemMetrics(): SystemHealth
  listActiveExperiments(): ExperimentSummary[]
  getEthicsComplianceReport(): EthicsReport

  // Auditoria
  getAuditTrail(userId?: UUID): AuditEntry[]
  exportDataCompliance(filters: ComplianceFilters): Blob
}
```

---

## 📊 Sistema de Relatórios

### Relatórios Estatísticos

**1. Taxa de Completude:**
```sql
CREATE VIEW experiment_completion_report AS
SELECT
    e.id as experiment_id,
    e.title,
    COUNT(DISTINCT s.id) as total_sessions,
    COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_sessions,
    ROUND(
        COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) * 100.0 /
        NULLIF(COUNT(DISTINCT s.id), 0),
        2
    ) as completion_rate
FROM experiments e
LEFT JOIN experiment_sessions s ON e.id = s.experiment_id
GROUP BY e.id, e.title;
```

**2. Qualidade de Dados:**
```sql
CREATE VIEW data_quality_report AS
SELECT
    e.id as experiment_id,
    COUNT(DISTINCT s.id) as total_sessions,
    COUNT(DISTINCT CASE
        WHEN s.session_data IS NOT NULL
        AND jsonb_array_length(s.session_data->'trials') > 0
        THEN s.id
    END) as valid_sessions,
    COUNT(DISTINCT s.ip_address) as unique_ips,
    COUNT(DISTINCT s.user_agent) as unique_user_agents
FROM experiments e
LEFT JOIN experiment_sessions s ON e.id = s.experiment_id
GROUP BY e.id;
```

**3. Detecção de Anomalias:**
```sql
CREATE FUNCTION detect_statistical_outliers(
    experiment_uuid UUID,
    threshold_factor FLOAT DEFAULT 2.5
) RETURNS TABLE (
    session_id UUID,
    metric_name VARCHAR,
    metric_value FLOAT,
    z_score FLOAT,
    is_outlier BOOLEAN
)
```

### Validações Normativas

```typescript
interface NormativeValidator {
  // Validação ética
  checkEthicsApproval(experiment: Experiment): EthicsStatus
  validateInformedConsent(session: Session): ConsentStatus

  // Validação estatística
  checkSampleSize(experimentId: UUID): SampleSizeStatus
  detectResponseBias(sessionId: UUID): BiasReport
  validateRandomization(experimentId: UUID): RandomizationReport

  // Validação de dados
  checkDataCompleteness(sessionId: UUID): CompletenessReport
  validateTimestamps(sessionId: UUID): TimestampValidation
}
```

---

## 🤖 Integração LLM (Fase Futura)

### BYOK - Bring Your Own Key

**Configuração:**
```typescript
interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'custom'
  apiKey: string // Armazenado de forma segura
  model: string
  maxTokens: number
  temperature: number
}
```

### Funcionalidades Assistidas

1. **Criação de Experimentos**
   - Sugestão de configurações jsPsych
   - Geração de descrições
   - Otimização de parâmetros

2. **Análise de Resultados**
   - Interpretação estatística
   - Identificação de padrões
   - Sugestões de visualizações

3. **Recomendações**
   - Experimentos similares
   - Participantes adequados
   - Literatura relevante

---

## 🚀 Roadmap de Implementação

### Fase 0: Auditoria e Preparação
- [ ] Revisão por especialista em ética
- [ ] Avaliação de segurança LGPD/GDPR
- [ ] Validação de modelo estatístico
- [ ] Definição de infraestrutura

### Fase 1: MVP Core (3-4 meses)
- [ ] Configurar Supabase
- [ ] Implementar autenticação
- [ ] Criar gestão de usuários básica
- [ ] Integrar jsPsych
- [ ] CRUD de experimentos
- [ ] Sistema de execução e armazenamento

### Fase 2: Gestão Administrativa (2-3 meses)
- [ ] Dashboard admin
- [ ] Sistema de aprovação de pesquisadores
- [ ] Auditoria de ações
- [ ] Gestão de permissões

### Fase 3: Analytics e Relatórios (2-3 meses)
- [ ] Relatórios estatísticos
- [ ] Detecção de anomalias
- [ ] Exportação de dados
- [ ] Visualizações interativas

### Fase 4: Preparação para IA (1-2 meses)
- [ ] Infraestrutura vetorial
- [ ] Sistema de embeddings
- [ ] Recomendações básicas

### Fase 5: Integração LLM (3-4 meses)
- [ ] Interface BYOK
- [ ] Geração assistida
- [ ] Análise contextual

---

## 📁 Estrutura do Projeto

```
plataforma-experimentos/
├── frontend/                    # Nuxt 3
│   ├── pages/
│   │   ├── admin/
│   │   ├── researcher/
│   │   ├── participant/
│   │   └── experiments/
│   ├── components/
│   ├── composables/
│   ├── middleware/
│   └── nuxt.config.ts
├── supabase/                    # Backend
│   ├── migrations/
│   ├── functions/
│   └── seed.sql
├── jspsych/                     # Configurações jsPsych
│   ├── plugins/
│   └── templates/
├── vector-db/                   # Configuração DB vetorial
│   └── collections/
├── docs/
│   ├── api/
│   ├── user-guides/
│   └── compliance/
└── tests/
```

---

## ⚠️ Considerações Importantes

### Compliance e Ética
- LGPD/GDPR compliance obrigatório
- Consentimento informado documentado
- Anonimização de dados sensíveis
- Auditoria completa de acessos

### Segurança
- Autenticação multifator
- Criptografia end-to-end
- Backup automatizado
- Política de retenção de dados

### Escalabilidade
- Suporte para milhares de usuários simultâneos
- CDN para assets jsPsych
- Cache inteligente
- Load balancing

---

## 📝 Critérios de Sucesso

### MVP
1. Pesquisadores podem criar e publicar experimentos
2. Participantes podem executar experimentos
3. Dados são armazenados de forma segura
4. Admin pode gerenciar usuários
5. Relatórios básicos funcionais

### Completo
1. Sistema de aprovação automatizado
2. Relatórios normativos completos
3. Detecção de anomalias em tempo real
4. Integração LLM funcional
5. Performance otimizada
6. Documentação completa

---

## 🔗 Próximos Passos

1. Validar arquitetura com stakeholders
2. Realizar auditoria de compliance
3. Definir cronograma detalhado
4. Configurar ambiente de desenvolvimento
5. Iniciar Fase 1 (MVP Core)

---

## ⚠️ Disclaimers

> Este documento é um pré-planejamento sujeito a:
> - Auditoria técnica de viabilidade
> - Revisão ética e legal
> - Validação de requisitos
> - Orçamento e prazos
> - Testes de segurança
