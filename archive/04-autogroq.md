# AutoGroq - Sistema de Orquestração de Agentes IA Multi-Framework

## 📌 Informações Gerais

- **Status:** Pré-planejamento
- **Tipo:** Orquestração de Agentes IA
- **Repositório:** https://github.com/jgravelle/AutoGroq
- **Tecnologias:** Python, Streamlit, Multi-LLM (Groq, Anthropic, OpenAI, Ollama, LM Studio)
- **Frameworks Suportados:** AutoGen, CrewAI
- **Prioridade:** Média-Alta

## 🎯 Objetivo

Criar e gerenciar sistemas multi-agentes de IA de forma dinâmica, invertendo a abordagem tradicional de construção de agentes. Em vez de construir agentes antecipadamente, o AutoGroq utiliza a necessidade do usuário como base para construir dinamicamente a equipe (workflow) de IA ideal.

## 💡 Tese Central

**Construção Dinâmica baseada em Necessidade**

> "Em vez de construir agentes antecipadamente, utilizar a syntax do usuário como base para construir dinamicamente a equipe (workflow) de IA ideal."

### Mérito da Tese

Esta abordagem é extremamente útil porque:

1. **Reduz Complexidade**: A configuração manual de sistemas multi-agentes (AutoGen, CrewAI) é complexa
2. **Abstração Inteligente**: Automatiza a configuração de equipes, fluxos de trabalho e ferramentas (skills) com base em uma única solicitação
3. **Baixa Barreira de Entrada**: Torna sistemas multi-agentes acessíveis a mais usuários
4. **Adaptação Contextual**: A equipe de agentes é construída especificamente para a tarefa em questão

## 🏗️ Arquitetura Técnica

### Modularidade e Abstração

```
AutoGroq/
├── agents/               # Lógica de agentes
├── models/              # Modelos base (AgentBaseModel, ToolBaseModel, WorkflowBaseModel)
├── llm_providers/       # Provedores de LLM (Groq, Anthropic, OpenAI, Ollama, LM Studio)
├── workflows/           # Gerenciamento de workflows
├── skills/              # Ferramentas/skills dos agentes
├── current_project.py   # Gerenciamento de projetos estruturados
├── db_utils.py         # Utilitários de persistência (SQLite)
└── config.py           # Configurações
```

### Componentes Principais

#### 1. Modelos Base
- **AgentBaseModel**: Classe base para todos os agentes
- **ToolBaseModel**: Classe base para ferramentas/skills
- **WorkflowBaseModel**: Classe base para workflows

#### 2. Sistema de Provedores LLM
- **BaseLLMProvider**: Interface plugável para múltiplos provedores
- Suporte para:
  - Groq (foco principal)
  - Anthropic Claude
  - OpenAI GPT
  - Ollama (modelos locais)
  - LM Studio (modelos locais)

#### 3. Exportação Multi-Framework
- Configurações exportáveis para **AutoGen**
- Configurações exportáveis para **CrewAI**
- Abstração que protege contra obsolescência de frameworks específicos

#### 4. Gerenciamento de Projetos
- **Current_Project**: Gerencia entregáveis (deliverables)
- Fases de implementação estruturadas:
  - Planning
  - Development
  - Testing
  - Deployment

### Fluxo de Trabalho

```
[Solicitação do Usuário]
         ↓
[Análise de Necessidades]
         ↓
[Construção Dinâmica de Equipe]
         ↓
[Configuração de Workflow]
         ↓
[Seleção de LLM Provider]
         ↓
[Execução do Workflow]
         ↓
[Exportação para Framework (AutoGen/CrewAI)]
```

## 🔧 Tecnologias Envolvidas

### Core
- **Python 3.8+**
- **Streamlit** (Interface web)
- **SQLite** (Persistência de dados)

### Frameworks Multi-Agentes
- **AutoGen** (Microsoft)
- **CrewAI**

### Provedores LLM
- **Groq** (velocidade)
- **Anthropic** (raciocínio)
- **OpenAI** (versatilidade)
- **Ollama** (local)
- **LM Studio** (local)

### Bibliotecas Python (a atualizar)
- `openai` (atualmente 0.27.10 → requer atualização para v1.x)
- `anthropic` (atualmente 0.29.0 → requer atualização)
- `streamlit`
- `pydantic` (para modelos base)

## 📊 Pontos de Mérito

### 1. Design Orientado a Objetos
✅ **Classes Base Bem Definidas**
- Separação clara de responsabilidades
- Facilita substituição e adaptação de componentes
- Código modular e testável

### 2. Flexibilidade de LLMs
✅ **Múltiplos Provedores Plugáveis**
- Permite otimização de custo vs. desempenho
- Não fica preso a um único provedor
- Suporte para modelos locais (privacidade)

### 3. Abstração Multi-Framework
✅ **Proteção contra Obsolescência**
- Exportação para AutoGen e CrewAI
- Facilita migração entre frameworks
- Mantém compatibilidade com ecossistema mais amplo

### 4. Workflow Estruturado
✅ **Gerenciamento de Projetos Integrado**
- Transforma chatbot em ferramenta de desenvolvimento estruturado
- Fases definidas (Planning → Development → Testing → Deployment)
- Rastreamento de entregáveis

## ⚠️ Pontos para Correção/Adaptação

### 1. Atualização de Dependências (URGENTE) 🔴

**Problema:**
```python
# requirements.txt (versões antigas)
openai==0.27.10      # API mudou significativamente (v1.x é muito diferente)
anthropic==0.29.0    # API desatualizada
```

**Impacto:**
- Incompatibilidade com APIs atuais
- Perda de novos recursos (Tool Calling melhorado)
- Riscos de segurança

**Ação Necessária:**
- Atualizar para `openai>=1.0.0`
- Atualizar para `anthropic>=0.40.0`
- Revisar todo código que usa essas APIs
- Atualizar para novos padrões de Tool Calling

### 2. Desacoplamento da Interface (RECOMENDADO) 🟡

**Problema:**
- Lógica fortemente acoplada ao `streamlit.session_state`
- Dificulta uso em outros contextos (CLI, API, outras UIs)

**Impacto:**
- Reduz reusabilidade do código core
- Dificulta testes automatizados
- Limita casos de uso

**Ação Necessária:**
- Isolar lógica core em SDK/biblioteca separada
- Estrutura proposta:
```
autogroq/
├── core/              # SDK isolado (sem Streamlit)
│   ├── agents/
│   ├── models/
│   ├── llm_providers/
│   └── workflows/
├── cli/               # Interface de linha de comando
├── api/               # API REST (FastAPI)
└── ui/                # Interface Streamlit
```

### 3. Sistema de Persistência Incompleto (EXPANSÃO) 🟢

**Problema:**
- `db_utils.py` tem funções comentadas
- Persistência de agentes/skills/workflows não ativada

**Impacto:**
- Perda de configurações entre sessões
- Não é possível reutilizar equipes criadas
- Falta gerenciamento de histórico

**Ação Necessária:**
- Descomentar e completar funções de persistência
- Implementar SQLite para armazenamento
- Adicionar recursos:
  - Salvar equipes de agentes
  - Carregar workflows predefinidos
  - Histórico de projetos
  - Versionamento de configurações

### 4. Sistema de Testes (NOVO) 🟢

**Problema:**
- Aparentemente sem cobertura de testes

**Ação Necessária:**
- Implementar testes unitários (pytest)
- Testes de integração para workflows
- Testes para cada provedor LLM
- Mocks para APIs externas

### 5. Documentação (MELHORIA) 🟢

**Ação Necessária:**
- Documentar arquitetura de forma detalhada
- Exemplos de uso para cada framework
- Guias de migração de versões antigas
- API reference completa

## 🗺️ Roadmap de Desenvolvimento

### Fase 1: Modernização e Estabilização (Prioridade Alta)
- [ ] Analisar código atual e mapear dependências
- [ ] Atualizar `openai` para v1.x
- [ ] Atualizar `anthropic` para versão recente
- [ ] Corrigir breaking changes das APIs
- [ ] Validar funcionamento com cada provedor LLM
- [ ] Criar suite básica de testes

**Duração Estimada:** 2-3 semanas

### Fase 2: Desacoplamento e Arquitetura (Prioridade Média)
- [ ] Extrair lógica core para SDK independente
- [ ] Remover dependências Streamlit do core
- [ ] Criar camada de abstração de estado
- [ ] Implementar CLI robusto
- [ ] Preparar base para API REST

**Duração Estimada:** 3-4 semanas

### Fase 3: Sistema de Persistência (Prioridade Média)
- [ ] Completar implementação SQLite
- [ ] Criar esquema de banco de dados
- [ ] Implementar CRUD para agentes, skills, workflows
- [ ] Adicionar sistema de templates
- [ ] Implementar versionamento de configurações
- [ ] Criar interface de gerenciamento de histórico

**Duração Estimada:** 2-3 semanas

### Fase 4: Testes e Qualidade (Prioridade Alta)
- [ ] Implementar testes unitários (pytest)
- [ ] Criar mocks para APIs LLM
- [ ] Testes de integração para workflows
- [ ] Testes end-to-end
- [ ] Configurar CI/CD
- [ ] Atingir cobertura > 70%

**Duração Estimada:** 2-3 semanas

### Fase 5: Expansão e Otimização (Prioridade Baixa)
- [ ] Implementar API REST (FastAPI)
- [ ] Criar dashboard de monitoramento
- [ ] Adicionar métricas de performance
- [ ] Otimizar custos de API
- [ ] Implementar cache inteligente
- [ ] Adicionar suporte para mais frameworks

**Duração Estimada:** 4-6 semanas

### Fase 6: Documentação e Distribuição (Prioridade Média)
- [ ] Documentação completa da arquitetura
- [ ] Guias de uso por framework (AutoGen, CrewAI)
- [ ] Tutoriais e exemplos práticos
- [ ] API reference completa
- [ ] Vídeos demonstrativos
- [ ] Preparar para publicação (PyPI)

**Duração Estimada:** 2-3 semanas

## 📋 Tarefas Técnicas Detalhadas

### 1. Atualização OpenAI API v1.x

**Mudanças Principais:**
```python
# Antigo (v0.27.10)
import openai
openai.api_key = "sk-..."
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[...]
)

# Novo (v1.x)
from openai import OpenAI
client = OpenAI(api_key="sk-...")
response = client.chat.completions.create(
    model="gpt-4",
    messages=[...]
)
```

**Arquivos a Modificar:**
- `llm_providers/openai_provider.py`
- Qualquer código que importe `openai`

### 2. Atualização Anthropic API

**Mudanças Principais:**
```python
# Antigo
import anthropic
client = anthropic.Client(api_key="...")
response = client.completion(...)

# Novo
from anthropic import Anthropic
client = Anthropic(api_key="...")
response = client.messages.create(...)
```

**Arquivos a Modificar:**
- `llm_providers/anthropic_provider.py`

### 3. Desacoplamento Streamlit

**Criar Camada de Abstração:**
```python
# core/state_manager.py
class StateManager:
    """Gerenciador de estado agnóstico de framework"""

    def __init__(self, backend='memory'):
        self.backend = backend
        self._state = {}

    def get(self, key, default=None):
        return self._state.get(key, default)

    def set(self, key, value):
        self._state[key] = value

# ui/streamlit_adapter.py
class StreamlitStateAdapter(StateManager):
    """Adaptador para Streamlit"""

    def get(self, key, default=None):
        return st.session_state.get(key, default)

    def set(self, key, value):
        st.session_state[key] = value
```

## 🎯 Critérios de Sucesso

### Fase 1: Modernização
1. ✅ Todas as APIs atualizadas e funcionando
2. ✅ Zero breaking changes para usuários finais
3. ✅ Testes básicos passando
4. ✅ Documentação de mudanças completa

### Fase 2: Desacoplamento
1. ✅ Core completamente independente de Streamlit
2. ✅ CLI funcional e testado
3. ✅ Código core reutilizável em qualquer contexto
4. ✅ Camada de abstração de estado funcionando

### Fase 3: Persistência
1. ✅ Salvar e carregar agentes funcionando
2. ✅ Sistema de templates implementado
3. ✅ Histórico de projetos acessível
4. ✅ Backup e restore funcionando

### Fase 4: Qualidade
1. ✅ Cobertura de testes > 70%
2. ✅ CI/CD configurado e funcionando
3. ✅ Zero erros em linting
4. ✅ Performance aceitável (< 2s para operações básicas)

### Geral
1. ✅ Suporte para pelo menos 3 provedores LLM funcionando perfeitamente
2. ✅ Exportação para AutoGen e CrewAI testada e validada
3. ✅ Documentação completa e atualizada
4. ✅ Pelo menos 5 exemplos de uso funcionando
5. ✅ Sistema estável para uso em produção

## 📚 Referências

### Projeto Original
- **Repositório:** https://github.com/jgravelle/AutoGroq
- **Documentação:** (verificar no repositório)

### Frameworks Multi-Agentes
- **AutoGen:** https://github.com/microsoft/autogen
- **CrewAI:** https://github.com/joaomdmoura/crewAI

### APIs LLM
- **Groq:** https://console.groq.com/docs
- **Anthropic:** https://docs.anthropic.com/
- **OpenAI:** https://platform.openai.com/docs
- **Ollama:** https://ollama.ai/
- **LM Studio:** https://lmstudio.ai/

### Tecnologias
- **Streamlit:** https://docs.streamlit.io/
- **Pydantic:** https://docs.pydantic.dev/
- **SQLite:** https://www.sqlite.org/docs.html

## 📝 Próximos Passos

### Imediatos (Esta Semana)
1. Clonar repositório e analisar código completo
2. Mapear todas as dependências e versões atuais
3. Criar ambiente de desenvolvimento
4. Testar estado atual do projeto

### Curto Prazo (Próximo Mês)
1. Iniciar Fase 1: Atualização de APIs
2. Configurar sistema de testes básico
3. Documentar arquitetura atual
4. Criar issues para tracking no GitHub

### Médio Prazo (Próximos 3 Meses)
1. Completar Fases 1-3 do roadmap
2. Sistema core desacoplado e funcionando
3. Persistência implementada
4. Cobertura de testes adequada

### Longo Prazo (6+ Meses)
1. API REST funcionando
2. Dashboard de monitoramento
3. Publicação em PyPI
4. Comunidade ativa de usuários

## 💡 Valor e Potencial

### Por que AutoGroq é Valioso

1. **Democratização de Multi-Agentes**: Torna sistemas complexos acessíveis
2. **Flexibilidade**: Suporte a múltiplos LLMs e frameworks
3. **Adaptabilidade**: Construção dinâmica baseada em necessidade real
4. **Modularidade**: Arquitetura bem pensada e extensível
5. **Independência de Vendor**: Não fica preso a um único provedor

### Casos de Uso Potenciais

1. **Desenvolvimento de Software**: Equipes de agentes para code review, testing, documentation
2. **Pesquisa**: Agentes especializados para diferentes aspectos de pesquisa
3. **Análise de Dados**: Workflows multi-agentes para ETL, análise, visualização
4. **Customer Support**: Sistemas de suporte com especialização dinâmica
5. **Educação**: Tutores adaptativos com múltiplos agentes especializados

### Diferenciais Competitivos

1. ✅ **Construção Dinâmica**: Único em sua abordagem de criar equipes sob demanda
2. ✅ **Multi-Framework**: Exporta para AutoGen e CrewAI (flexibilidade única)
3. ✅ **Multi-LLM**: Suporta 5+ provedores diferentes
4. ✅ **Workflow Estruturado**: Gerenciamento de projetos integrado
5. ✅ **Open Source**: Código aberto e adaptável

## ⚠️ Considerações e Riscos

### Riscos Técnicos

1. **Dependências Desatualizadas**: Pode haver mais código quebrado do que aparente
2. **Complexidade de Manutenção**: Suportar múltiplos frameworks e LLMs é custoso
3. **APIs em Mudança**: Provedores LLM atualizam APIs frequentemente

### Riscos de Projeto

1. **Documentação Limitada**: Projeto pode ter documentação insuficiente
2. **Atividade do Repositório**: Verificar se projeto está ativo ou abandonado
3. **Comunidade**: Projeto pode não ter comunidade ativa

### Mitigações

1. ✅ **Análise Inicial Profunda**: Dedicar tempo para entender código completamente
2. ✅ **Testes Abrangentes**: Criar suite de testes antes de mudanças grandes
3. ✅ **Documentação Contínua**: Documentar enquanto aprende/modifica
4. ✅ **Versionamento Semântico**: Releases bem documentadas
5. ✅ **Feedback de Usuários**: Testar com usuários reais desde cedo

---

**Última atualização:** 2025-11-24
**Status:** Documentação inicial completa - Aguardando início de desenvolvimento
