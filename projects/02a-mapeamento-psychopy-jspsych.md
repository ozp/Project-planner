# Mapeamento técnico — PyMTS → PsychoPy / jsPsych

> Documento de apoio à spec [02-pymts-plugins.md](02-pymts-plugins.md) — Etapa 1 do roadmap
> (análise e prototipagem). Levantamento feito em **2026-10-03** sobre clone do
> [AlceuRegaco/PyMTS](https://github.com/AlceuRegaco/PyMTS) (`main`, commit `0abf047`).

---

## 1. Perfil técnico do PyMTS (v2.08)

### Estrutura e tamanho

```
main.py            72 LOC  → tela inicial (Tkinter): participante, experimentador, bloco inicial
stimuli.py         93 LOC  → classes Image / Sound / Text (wrappers pygame)
trial_vs9_04.py   339 LOC  → MOTOR: Trial (instrução → sample → comparação → consequência → ITI → critério)
configData.json            → configuração global do experimento
config/*.csv               → 1 arquivo por bloco, 1 linha por tentativa (ABtraining, ACtraining, testEq)
stimuli/                   → 16 arquivos (PNG/JPG/WAV: A1/A2/B1/B2/C1/C2, sons, consequências, instruções)
data/data_example.csv      → exemplo de saída
executable/*.zip           → executáveis Windows 2.07/2.08 (auto-py-to-exe, ~44 MB)
```

**Total: 504 LOC de Python.** Correção de premissa da spec original: a UI do experimento
**não é Tkinter** — Tkinter só abre a tela de coleta de dados. O motor de apresentação e
resposta é **pygame** (janela fullscreen, mouse). Branches `points` (economia de fichas) e
`stag_video` (vídeo) são variações de laboratório, não merged.

**Dependências:** `pygame`, `pandas`, `numpy` + stdlib. Não há `requirements.txt`, `setup.py` nem CI.

### Licença — situação real (corrigida em 2026-10-03, 2ª verificação)

**Primeira leitura (errada por incompleta):** "o repo não tem licença → derivação bloqueada".
**Correção após leitura do artigo-fonte:** o repositório de fato **não tem arquivo LICENSE** e o
README não menciona licença — mas o artigo que publica o software declara formalmente o
licenciamento:

> Carvalho, F. C., Regaço, A., & de Rose, J. C. (2024). PYMTS: A Python matching-to-sample
> software. *Revista Brasileira de Análise do Comportamento*, 20(1), 132–136.
> DOI [10.18542/rebac.v20i1.16401](https://periodicos.ufpa.br/index.php/rebac/article/view/16401)

Destaques do artigo (verificados no PDF):

- **"PyMTS is an open-source software, which means the script can be downloaded and it is free
  to be used and changed"** — os autores declaram, em publicação revisada por pares, que o código
  é livre para uso e modificação e convidam outros pesquisadores a "contribute and help to
  further develop and modify the software".
- **Atribuição pedida pelos autores: citação ao trabalho** (a citação APA está no README do repo).
- O artigo é publicado em **CC BY-NC 4.0** ("reproduzido livremente, distribuído, transmitido ou
  modificado... desde que usado sem fins comerciais") — formalmente essa licença cobre o artigo;
  aplicá-la ao software é a leitura mais conservadora coerente com a declaração dos autores.

**Consequência prática:** derivar/portar é autorizado pelos titulares — a estratégia de
**reimplementação limpa deixa de ser obrigatória** (continua sendo opção). Condições prudentes:
atribuição via citação do artigo/software em qualquer distribuição derivada; uso não-comercial
(BY-NC); e, como o repo não tem LICENSE formal, **abrir uma issue/e-mail pedindo aos autores um
arquivo de licença explícito** (ou confirmação expressa para o plugin) elimina a ambiguidade
residual — 1 interação de custo.

Nota adicional do artigo: "PyMTS... developed **based on PsychoPy**" — inspiração metodológica
(as dependências reais são pygame/pandas/numpy, sem psychopy), o que reforça a aderência do
plugin PsychoPy ao espírito do projeto original.

### Configuração — 2 camadas

**Camada 1 — `configData.json` (global):** `screen_color`, `ITI`, `volume`, `start_block`,
`blocks` (nomes → arquivos CSV), `instructions` (por bloco: `"n"` ou imagem, mínimo 4 s),
`comp display` (`"SMTS"` = simultâneo, ou **número** = segundos de delay = DMTS),
`repetitions` (máx. repetições do bloco ao reprovar critério), `criteria` (acertos p/ aprovar),
`pos_sample`, `pos_comps` (offsets x,y), `stimulus_size`, `consequence_size`,
`instructions_size`, `end_text`.

```json
{
    "screen_color": [0, 0, 0],
    "ITI": 0,
    "volume": 0.5,
    "start_block": 1,
    "blocks": ["ABtraining", "ACtraining", "testEq"],
    "instructions": ["n", "n", "inst2.jpg"],
    "comp display": ["SMTS", "SMTS", "SMTS"],
    "repetitions": [3, 3, 1],
    "criteria": [3, 3, 12],
    "pos_sample": [[0, 200], [350, 250]],
    "pos_comps": [[-350, -200], [350, -200]],
    "stimulus_size": [200, 200],
    "consequence_size": [1800, 900],
    "instructions_size": [1200, 900],
    "end_text": "end_text.png"
}
```

**Camada 2 — CSV por bloco (1 linha = 1 tentativa):**
`sample;sample_sound;comp;correct_comp;img_right;img_wrong;sound_right;sound_wrong;time_right;time_wrong`
(extrato real de `config/ABtraining.csv`):

```
sound_image.png;A1s.wav;B1.png:B2.png;B1.png;img_right.png;img_wrong.png;n;n;1;1
sound_image.png;A2s.wav;B1.png:B2.png;B2.png;img_right.png;img_wrong.png;n;n;1;1
```

Convenções: `"n"` = ausente; campos múltiplos por `:` (`B1.png:B2.png` = 2 comparativos;
sample múltiplo = **estímulo contextual**, v2.08; `sample_sound` ≠ `n` = **MTS auditivo-visual**
— sample clicável toca o som e comparativos só respondem após o fim). Consequências
**diferenciais por tentativa** (imagem/som/duração distintos para acerto/erro).

### O que o motor suporta (verificado no código)

- **Blocos com critério de mastery**: bloco termina quando o CSV acaba; acurácia ≥ `criteria`
  avança, senão repete (até `repetitions`); ao final, `end_text`.
- **SMTS vs DMTS**: `"SMTS"` mostra comparativos sempre; número = delay em segundos.
- **Embaralhamento**: linhas re-embaralhadas a cada passagem; comparativos `shuffle()`ados
  entre posições fixas a cada tentativa.
- **Latências**: tempo até clicar no sample, no comparativo, total da tentativa.
- **NÃO há**: correção de erros (comportamental), deadline de resposta, registro de posição clicada.

### Formato de dados (saída)

CSV `sep=;` em `data/<Participante>.csv` com metadados nas primeiras linhas (Participant,
Experimenter, Date) + colunas por tentativa: `Total_Trial;Block;Block_Trial;Accuracy;
Total_Correct;Sample;Sample_Sound;Comps;Selcted_Comp;Time_Click_Sample;Time_Click_Comp;
Time_Trial` (`Selcted_Comp` é typo do original). Não é tidy/long; listas gravadas como string.

### Qualidade do código (relevante para reescrita)

- Paths relativos ao cwd e **separador Windows hard-coded** — roda só no Windows.
- `trial_vs9_04.py` roda `main()` no fim do módulo; `main.py` dispara via `import` — UI e motor
  acoplados. Loop `while 1` sem clock/fps; timing com `time.time()`.

---

## 2. PsychoPy em out/2026 — o split é real, transição em curso

| Repo | O que é | Status |
|---|---|---|
| [psychopy/psychopy](https://github.com/psychopy/psychopy) | **Somente a biblioteca** (GPLv3) | Ativo; [PyPI 2026.2.4 (14/set/2026)](https://pypi.org/project/psychopy/); **Python 3.11 obrigatório desde 2026.2.0** |
| [psychopy/psychopy-app](https://github.com/psychopy/psychopy-app) | App legado wxPython ("Standalone") | Ainda é o download **estável recomendado** ([página](https://psychopy.org/download.html)) |
| [psychopy/psychopy-studio](https://github.com/psychopy/psychopy-studio) | **PsychoPy Studio** — reescrita Node/Svelte/Electron (MIT), executa experimentos chamando a lib Python | **Beta**; Standalone segue até o Studio estabilizar |

**Como se distribui componente custom hoje:** plugin pip com entry points, via template oficial
[psychopy-plugin-template](https://github.com/psychopy/psychopy-plugin-template) ("para PsychoPy
**e** PsychoJS"). Pacote `psychopy-*` no PyPI aparece no painel de busca do app. Entry points
relevantes (do template):

```toml
[project.entry-points."psychopy.experiment.components"]  # Component no Builder
[project.entry-points."psychopy.experiment.routines"]    # Standalone Routine no Builder
[project.entry-points."psychopy.visual"]                 # estímulo em psychopy.visual
[project.entry-points."psychopy.hardware"]               # dispositivos
[project.entry-points."psychopy.app.builder"]            # ribbon custom (app wx LEGADO — evitar)
```

O Studio já tem **Plugin Manager** que instala plugins pip — o ecossistema entry points
`psychopy.*` continua sendo a via de extensão na nova GUI. Diretório oficial:
[plugins.psychopy.org](https://plugins.psychopy.org); devdocs:
[devdocs.psychopy.org](https://devdocs.psychopy.org).

**Recomendação:** construir `psychopy-mts` na camada `psychopy.experiment.*` (independente de
GUI), gerando código Python **e** JS (PsychoJS/Pavlovia). Evitar `psychopy.app.*` (amarrado ao
wx legado). Testar no Standalone estável e no Studio beta.

---

## 3. jsPsych em out/2026

- **Versão atual: 8.3.0 (26/jul/2026)** ([releases](https://github.com/jspsych/jsPsych/releases)).
  Linha: v7.0 out/2021 → **v8.0 jul/2024** → 8.1 (nov/24) → 8.2 (jan/25) → 8.3.0 (jul/26).
  **A spec original ("jsPsych 7+") está 2 gerações defasada.**
- **Mudanças v7→v8 relevantes** ([migration-v8](https://github.com/jspsych/jsPsych/blob/main/docs/support/migration-v8.md)):
  tipos de parâmetro estritos; todos os parâmetros declarados no `info`; `info.version`/`info.data`
  recomendados (obrigatórios na v9); `getAudioBuffer()` → `getAudioPlayer()` (async — necessário
  para o sample auditivo do MTS); `finishTrial()` limpa display/timeouts; renames
  `endExperiment`→`abortExperiment`, `endCurrentTimeline`→`abortCurrentTimeline`.
- **Estrutura de plugin**: classe com `info = {name, version, parameters, data}` + `trial()`
  assíncrono; `ParameterType.*`. Doc:
  [plugin-development](https://github.com/jspsych/jsPsych/blob/main/docs/developers/plugin-development.md).
- **Contribuição**: [jspsych-contrib](https://github.com/jspsych/jspsych-contrib) (monorepo,
  61 packages, TypeScript via `npx @jspsych/new-plugin`, changesets, PR). Alternativa: pacote
  npm próprio.

---

## 4. Concorrência — nicho aberto

- **jsPsych: NÃO existe plugin dedicado de MTS/equivalência de estímulos.** Verificados os 61
  packages do contrib — os mais próximos são genéricos (`visual-search-circle`,
  `image-button-response`, `same-different-image`). Prática corrente: MTS montado à mão com
  `timeline_variables` (ref. metodológica: Cummins et al. 2020).
- **PsychoPy: também nada dedicado.** O diretório de plugins é dominado por hardware/device.
  Buscas GitHub: zero repos relevantes de MTS/equivalência.
- **Conclusão:** o nicho está aberto nos dois ecossistemas. O "concorrente" é o fluxo artesanal
  e o PyMTS desktop original.

---

## 5. Recomendações

### Gate de licença — resolvido pela 2ª verificação (2026-10-03)

O artigo-fonte (REBAC 2024) declara o PyMTS open-source, livre para uso e modificação, com
atribuição por citação; o artigo é CC BY-NC 4.0 (ver §1). Portanto:

- **Derivação/port permitido** com **atribuição por citação** (Carvalho, Regaço & de Rose, 2024)
  e **uso não-comercial** — coberto pela leitura BY-NC.
- Pendência de higiene (não bloqueante): o repo não tem arquivo LICENSE → pedir aos autores
  (issue/e-mail) licença explícita no repositório ou confirmação expressa para o plugin. Até lá,
  registrar a citação em README e docs do plugin.
- A **reimplementação limpa** permanece opção (motor = 339 LOC; o valor está no modelo de
  configuração e na fidelidade procedimental), mas é escolha de engenharia, não requisito jurídico.
- Nota: a lib PsychoPy é **GPLv3** — plugin PsychoPy distribuído precisará de licença compatível
  (decidir cedo; para distribuição acadêmica o copyleft é neutro).

### O que preservar do PyMTS (portar o design, não o código)

1. **Configuração em 2 camadas** (JSON global + CSV por bloco) — mapeia 1:1 para
   `timeline_variables` (jsPsych) e conditions/loops (PsychoPy). Um **importador
   `pymts-config → plugin`** é diferencial real (pesquisadores já têm experimentos no formato).
2. **Semântica de bloco**: critério de acertos, repetições máximas, re-embaralhamento, bloco inicial.
3. **Tentativa MTS completa**: sample clicável (múltiplo = contextual; som que bloqueia resposta),
   delay opcional (DMTS), N comparativos embaralhados, consequências diferenciais, ITI.
4. **Colunas de dados** (latências, acerto acumulado) — mas em formato **tidy/long** limpo.

### O que reescrever / adicionar

- Motor `while 1` → estrutura event-based dos frameworks; UI Tkinter → diálogos padrão;
  paths Windows → portáveis; `time.time()` → clocks dos frameworks.
- **Adicionar** (padrão na literatura, ausentes no PyMTS): correção de erros (reapresentação),
  deadline de resposta, registro da posição clicada, MTS 0s-delay (sample some).

### Arquitetura

- **PsychoPy** — `psychopy-mts` (plugin pip): **Standalone Routine "MTS Block"** encapsulando o
  bloco inteiro (sample→comparação→consequência→ITI + critério); Componentes atômicos forçariam
  o usuário a remontar o paradigma à mão. Gerar Python + PsychoJS.
- **jsPsych** — `plugin-mts` (TypeScript, API 8.x): plugin de tentativa + módulo helper para o
  loop de bloco com critério (`abortCurrentTimeline` + contadores). Submeter ao jspsych-contrib.
- **Núcleo compartilhado**: **schema JSON versionado** (superset do formato PyMTS) + conversores
  — fonte da verdade dos dois plugins e via de migração de experimentos existentes.

### Riscos

1. ~~Licença do PyMTS ausente (bloqueador)~~ **Resolvido pela 2ª verificação (2026-10-03):** artigo
   REBAC 2024 declara open-source, uso/modificação livres com citação; repo sem LICENSE formal →
   pendência de higiene (pedir aos autores), não bloqueio. Leitura conservadora: CC BY-NC 4.0
   (não-comercial + atribuição).
2. PsychoPy Studio em beta (mitigar: só entry points `psychopy.experiment.*`).
3. Timing online limitado (Pavlovia/cognition.run) — documentar limitações de precisão.
4. Spec original defasada (jsPsych 7 → nascer já na 8.x).

---

## Fontes principais

- PyMTS: https://github.com/AlceuRegaco/PyMTS
- PsychoPy: https://pypi.org/project/psychopy/ · https://psychopy.org/download.html ·
  https://github.com/psychopy/psychopy-plugin-template · https://plugins.psychopy.org ·
  https://devdocs.psychopy.org
- jsPsych: https://github.com/jspsych/jsPsych/releases ·
  https://github.com/jspsych/jsPsych/blob/main/docs/support/migration-v8.md ·
  https://github.com/jspsych/jspsych-contrib · https://www.jspsych.org/plugins
