# Project Planner — Pesquisa Experimental

Casa dos dois projetos ativos de pesquisa experimental em psicologia.
Este repositório concentra especificação, decisão e documentação de projeto;
o código nascerá aqui quando cada projeto entrar em desenvolvimento.

## 📋 Projetos Ativos

### 1. [PyMTS Plugins](projects/02-pymts-plugins.md)
**Status:** Planejado
**Tipo:** Desenvolvimento de plugins
**Tecnologias:** Python, JavaScript, PsychoPy, jsPsych

Transformação do [PyMTS](https://github.com/AlceuRegaco/PyMTS) (software de
matching-to-sample de Carvalho, Regaço & de Rose, 2023, UFSCar) em plugins para
PsychoPy (desktop/Python) e jsPsych (web/JavaScript), permitindo integração com
plataformas estabelecidas de experimentação psicológica.

- Primeira entrega: plugin PsychoPy (maior custo-benefício, mesmo ecossistema Python)
- Avaliação posterior: plugin jsPsych (habilita experimentos remotos)

### 2. [Plataforma de Experimentos Psicológicos](projects/03-plataforma-experimentos.md)
**Status:** Pré-planejamento (especificação avançada)
**Tipo:** Sistema web completo
**Stack:** Nuxt + Supabase + jsPsych

Plataforma web para criação, gestão e execução de experimentos psicológicos com
gestão de usuários (pesquisadores e participantes), relatórios estatísticos e
análise de dados. Previsão futura: integração LLM (BYOK) para criação e análise
assistida.

- Sinergia direta com o plugin jsPsych do projeto 1 (mesmo motor de experimentos)

## 📁 Estrutura do Repositório

```
Project-planner/
├── README.md                              # Este arquivo
├── projects/                              # Projetos ativos
│   ├── 02-pymts-plugins.md
│   └── 03-plataforma-experimentos.md
└── archive/                               # Projetos descomissionados (2026-10)
    ├── README.md
    ├── 01-desktop-mcp.md
    └── 04-autogroq.md
```

## 🎯 Relação entre os projetos

Os dois projetos formam uma linha única de pesquisa experimental:

1. **PyMTS Plugins** leva um paradigma validado (equivalência de estímulos) aos
   frameworks padrão da área — entrega valor de curto prazo com escopo contido.
2. **Plataforma de Experimentos** dá infraestrutura própria (hospedagem,
   participantes, dados) — escala o alcance, e o plugin jsPsych do projeto 1
   torna-se um bloco de construção natural dela.

## 📝 Notas

- A numeração original dos arquivos (02, 03) foi preservada para manter
  referências externas válidas (ex.: wiki pessoal).
- Registros no wiki pessoal: página "Plataforma de Experimentos Psicológicos +
  PyMTS Plugins"; execução rastreada no Multica.
