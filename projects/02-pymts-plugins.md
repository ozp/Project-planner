# PyMTS Plugins - Integração com PsychoPy e jsPsych

## 📌 Informações Gerais

- **Status:** Planejado
- **Tipo:** Desenvolvimento de plugins
- **Tecnologias:** Python, JavaScript, PsychoPy, jsPsych
- **Prioridade:** Alta

## 🎯 Objetivo

Transformar o PyMTS em plugins para PsychoPy e jsPsych, permitindo integração com plataformas estabelecidas de experimentação psicológica.

## 📊 Análise Comparativa

### PsychoPy vs jsPsych

| Aspecto | PsychoPy | jsPsych |
|---------|----------|---------|
| **Linguagem** | Python (desktop) | JavaScript (web) |
| **Plugins** | Sistema Python com importação dinâmica | Plugins modulares via NPM/CDN |
| **Interface** | Builder (GUI) + Coder | Programação JavaScript |
| **Execução** | Aplicação desktop | Navegador web |
| **Dados** | Arquivos locais (CSV, Excel) | JSON, CSV via navegador |

### Similaridades
- Experimentos visuais com precisão temporal
- Sistemas de plugins extensíveis
- Suporte para múltiplos formatos de estímulos
- Estruturas de dados experimentais robustas

## ✅ Viabilidade

### PsychoPy: **Alta Viabilidade** ✅

**Pontos Fortes:**
- Arquitetura de plugins Python nativa
- Sistema Builder permite componentes visuais
- API bem documentada
- Suporte para componentes customizados

**Desafios:**
- PyMTS usa Tkinter, PsychoPy usa OpenGL/visual
- Adaptação de sistema de coordenadas necessária
- Migrar de CSV para sistema de parâmetros do PsychoPy

### jsPsych: **Viabilidade Moderada** ⚠️

**Pontos Fortes:**
- Sistema de plugins JavaScript maduro
- Grande comunidade e ecossistema
- Suporte para experimentos web escaláveis

**Desafios:**
- Reescrita completa de Python para JavaScript
- Diferenças fundamentais na arquitetura
- Adaptação de sistema de arquivos para web

## 🗺️ Estratégia de Implementação

### Fase 1: Plugin PsychoPy (Prioridade Alta)

**Estrutura Proposta:**
```python
class PyMTSComponent(BaseComponent):
    def __init__(self, exp, parentName, name='PyMTS',
                 configFile='configData.json',
                 stimuliFolder='stimuli/',
                 dataFolder='data/'):

        super(PyMTSComponent, self).__init__(
            exp, parentName, name
        )

        # Parâmetros do plugin
        self.params['configFile'] = configFile
        self.params['stimuliFolder'] = stimuliFolder
        self.params['matchingType'] = matchingType

    def writeInitCode(self, buff):
        code = """
        # PyMTS Plugin Initialization
        from pymts_plugin.core import PyMTSExperiment
        pymts_exp = PyMTSExperiment(
            config_file=%(configFile)s,
            stimuli_folder=%(stimuliFolder)s,
            win=win
        )
        """
        buff.writeIndentedLines(code % self.params)
```

**Estrutura de Diretórios:**
```
pymts-psychopy-plugin/
├── pymts_plugin/
│   ├── __init__.py
│   ├── core.py          # Motor do PyMTS adaptado
│   ├── components.py    # Componentes Builder
│   └── data_handler.py  # Gerenciamento de dados
├── examples/
├── tests/
└── setup.py
```

**Tempo Estimado:** 2-3 meses

---

### Fase 2: Plugin jsPsych (Opcional)

**Estrutura Proposta:**
```javascript
class PyMTSPlugin {
  constructor(jsPsych) {
    this.jsPsych = jsPsych;
    this.name = 'pymts-matching';
    this.version = '1.0.0';
  }

  trial(display_element, trial) {
    this.setupTrial(trial);
    this.presentSample();
  }

  setupTrial(trial) {
    // Configurar estímulos e parâmetros
  }

  presentSample() {
    // Apresentar estímulo amostra
  }
}
```

**Estrutura de Diretórios:**
```
pymts-jspsych-plugin/
├── src/
│   ├── index.js
│   ├── pymts-plugin.js
│   └── utils/
├── examples/
├── tests/
└── package.json
```

**Repositório de Plugins jsPsych:**
- https://github.com/jspsych/jspsych-contrib (plugins de terceiros)

**Tempo Estimado:** 4-6 meses

---

## 📋 Roadmap de Desenvolvimento

### Etapa 1: Análise e Prototipagem
- [ ] Estudar arquitetura de plugins PsychoPy
- [ ] Mapear funcionalidades PyMTS → PsychoPy
- [ ] Criar protótipo básico de plugin PsychoPy
- [ ] Validar com usuários PyMTS existentes

### Etapa 2: Desenvolvimento PsychoPy
- [ ] Adaptar motor PyMTS para OpenGL
- [ ] Implementar componentes Builder
- [ ] Criar sistema de importação de configurações
- [ ] Desenvolver gerenciador de dados
- [ ] Testes unitários e de integração

### Etapa 3: Documentação e Distribuição
- [ ] Escrever documentação completa
- [ ] Criar tutoriais de migração
- [ ] Publicar no repositório PsychoPy
- [ ] Preparar exemplos de uso

### Etapa 4: Avaliação jsPsych (Opcional)
- [ ] Avaliar demanda da comunidade
- [ ] Prototipar versão JavaScript
- [ ] Decidir sobre implementação completa

---

## 🔧 Tecnologias Envolvidas

### PsychoPy Plugin
- Python 3.11+ (obrigatório desde PsychoPy 2026.2.0)
- PsychoPy 2026.2+ (lib GPLv3; split library/Studio/App — ver mapeamento)
- Plugin pip via `psychopy-plugin-template` (entry points `psychopy.experiment.*`)

### jsPsych Plugin
- TypeScript
- jsPsych **8.x** (atual: 8.3.0 — API muda da v7 assumida originalmente; `info.version`/`info.data` serão obrigatórios na v9)
- Node.js/NPM; distribuição via jspsych-contrib ou pacote próprio

---

## 📚 Referências

- Documentação PsychoPy: https://www.psychopy.org/
- Documentação jsPsych: https://www.jspsych.org/
- jsPsych Contrib: https://github.com/jspsych/jspsych-contrib
- PyMTS (original): https://github.com/AlceuRegaco/PyMTS — Carvalho, Regaço & de Rose (2023), UFSCar

---

## 🗒️ Registro de decisões

- **2026-10-03** — Este repositório passa a ser a casa oficial do projeto (decisão do ozp).
  Projetos descomissionados (`01-desktop-mcp`, `04-autogroq`) movidos para `archive/`.
  Repriorização: o projeto sai da incubadora (Onda 5 do plano consolidado) e entra
  na fila ativa de execução (Multica `OZP-395`).
- **2026-10-03 (Etapa 1 executada)** — Mapeamento técnico completo em
  [02a-mapeamento-psychopy-jspsych.md](02a-mapeamento-psychopy-jspsych.md). Achados que mudam a spec:
  1. **LICENÇA (corrigida após 2ª verificação):** o repo não tem arquivo LICENSE, mas o artigo que
     publica o software (Carvalho, Regaço & de Rose, 2024, REBAC 20(1), 132–136,
     DOI 10.18542/rebac.v20i1.16401) declara o PyMTS **open-source, livre para uso e modificação**,
     com atribuição por citação; o artigo é CC BY-NC 4.0. **Derivação/port é permitido** com citação
     e uso não-comercial; pedir LICENSE formal aos autores fica como pendência de higiene, não gate.
  2. **jsPsych está na 8.3** (não 7): plugin nasce na API 8.x.
  3. **Motor do PyMTS é pygame** (Tkinter só na tela inicial) — correção da premissa original.
  4. **Nicho aberto**: não existe plugin MTS/equivalência dedicado em nenhum dos dois ecossistemas.
  5. Arquitetura alvo: schema JSON versionado (superset do formato PyMTS) como núcleo compartilhado;
     PsychoPy = Standalone Routine "MTS Block" via plugin pip; jsPsych = plugin de tentativa + helper de bloco.
- **2026-10-03 (decisão do ozp sobre distribuição/licença)** — **Não há objetivo de distribuir nada
  ainda.** Contato com os autores do PyMTS fica **condicionado a uma futura disponibilização pública**
  (não é pendência ativa). O objetivo agora é **desenvolver o projeto e observar onde o PyMTS se
  encaixa — de forma original ou transformada**; utilizar a lógica para desenvolver outro software
  e/ou **melhorar o próprio PyMTS e submeter PR** são caminhos válidos. Consequência: nenhuma rota
  de desenvolvimento está travada por licença (uso/modificação privados + PR upstream não são
  distribuição); a questão de licença só renasce no dia da disponibilização pública.

---

## 🎯 Critérios de Sucesso

### Plugin PsychoPy
1. Compatibilidade total com experimentos PyMTS existentes
2. Integração nativa com Builder
3. Performance equivalente ao PyMTS standalone
4. Documentação completa e exemplos funcionais
5. Testes com cobertura > 80%

### Plugin jsPsych (se implementado)
1. Funcionalidades core replicadas
2. Publicado em jspsych-contrib
3. Documentação e exemplos completos
4. Suporte a experimentos remotos

---

## 📝 Próximos Passos

1. Desenvolver protótipo do plugin PsychoPy
2. Testar com usuários PyMTS existentes
3. Avaliar demanda para versão jsPsych
4. Criar documentação e tutoriais de migração

---

## ⚠️ Considerações

- Plugin PsychoPy oferece melhor relação custo-benefício
- Mantém familiaridade com Python
- Plugin jsPsych abre possibilidades para experimentos remotos
- Ambos plugins podem coexistir no ecossistema
