> Pesquisa de subagente (2026-10-03), solicitada pelo ozp enquanto as decisões F1/VPS pendem.
> Contexto: repo Project-planner; alinha ao MtsSessionPlugin e à página /run/[doc].

# Ecossistema de plugins jsPsych 8.x — mapeamento e recomendação de adoção (out/2026)

**Método:** varredura dos diretórios `packages/` dos repos `jspsych/jsPsych` (oficial) e `jspsych/jspsych-contrib` via clone git + GitHub API (peer-deps e último commit por pacote), checagem de versões/dist-tags no registry npm, leitura dos fontes do core 8.3.0 (`AudioPlayer.ts`, `MediaAPI.ts`) e da documentação oficial (mkdocs do monorepo). Leitura também do código local (`mts-session-plugin.ts`, `app/pages/run/[doc].vue`) para calibrar a recomendação de integração.

---

## 0. Panorama geral (fatos que moldam as decisões)

- **Core:** `jspsych` **8.3.0** (26/07/2026) — exatamente a versão que a plataforma já usa (`plataforma/package.json`: `jspsych 8.3.0`, `@jspsych/plugin-preload 2.1.0`).
- **Breaking changes do 8.0 (vs 7.x)** que afetam plugins contrib antigos: `conditional_function`/`on_timeline_start/finish` só rodam uma vez; `evaluateTimelineVariable()` split; parâmetros só são avaliados se declarados no `info` do plugin (**importante para plugins 7.x não migrados**); `abortExperiment()`/`abortCurrentTimeline()` renomeados; `finishTrial()` agora limpa display e timeouts. Plugins contrib que não migraram para a nova avaliação de parâmetros/funções podem quebrar de sutil mesmo instalando.
- **Áudio no 8.x:** todos os plugins oficiais de áudio usam a classe `AudioPlayer` do core (PR #3342) com dois modos: **Web Audio API** (buffer decodificado via `AudioContext`, timing preciso) e **fallback HTML5 `<audio>`** (usado quando `window.AudioContext` não existe ou `use_webaudio: false`). `pluginAPI.audioContext()` faz `resume()` do contexto suspenso (política de autoplay). **Caveat:** `AudioPlayer` **não expõe controle de volume** (o caminho Web Audio ignora `element.volume`).
- **Preload:** o `@jspsych/plugin-preload` 2.1.0 já instalado cobre imagens, áudio e vídeo; `auto_preload: true` só detecta mídia declarada como **parâmetro** de plugins na timeline — mídia embutida em HTML/objetos custom (nosso caso: refs dentro de `ExperimentDocument`) **não é auto-detectada** e precisa das listas `images`/`audio`/`video` explícitas (que já passamos). Tem `message` (HTML), `show_progress_bar`, `max_load_time`, `continue_after_error`, `show_detailed_errors`, callbacks `on_success`/`on_error` por arquivo. Pré-carregar áudio popula o cache `audio_buffers` do core com instâncias `AudioPlayer` — **reutilizáveis via `jsPsych.pluginAPI.getAudioPlayer(url)`** (cache indexado por string de URL: a URL passada ao preload precisa ser idêntica à tocada no trial).
- **Survey oficial p/ demografia: existe, em duas famílias.** (1) Plugins leves clássicos `survey-likert`, `survey-multi-choice`, `survey-multi-select`, `survey-text`, `survey-html-form` (2.x, poucos KB, sem dependências); (2) `plugin-survey` 4.0.0, que **empacota o SurveyJS** (deps `survey-core` + `survey-js-ui` — bundle pesado; survey-core sozinho tem ~55 MB descompactado com locales) em troca de dezenas de tipos de pergunta, lógica condicional e **localização i18n nativa do SurveyJS**.
- **Mobile/touch no 8.x:** não há camada de toque no core. A documentação (`browser-device-support.md`) afirma: plugins `*-keyboard-response` **não funcionam** em touch (sem input de texto); recomendação oficial é botões/toques, testes manuais e CSS responsivo por conta do experimentador. Nosso MTS é todo click-based — **compatível com touch por construção**.
- **i18n:** não existe padrão de internacionalização no core — toda string de UI é parâmetro HTML do plugin (a única menção a "localization" na docs é a do SurveyJS dentro de `plugin-survey`). O padrão da comunidade é gerar a timeline por locale. Nosso modelo (strings no `ExperimentDocument`, servidas pelo backend) já é a abordagem correta e mais forte que a média.

---

## 1. Tabela geral — plugins OFICIAIS (repo jspsych/jsPsych, todos peer `>=7.x` = compatíveis com 8.x)

### 1a. Relevantes agora (F0/F1)

| Plugin (npm `@jspsych/…`) | Versão | Função | Compat 8.x | Veredito |
|---|---|---|---|---|
| `plugin-preload` | 2.1.0 | Pré-carga de imagens/áudio/vídeo com barra de progresso e tratamento de erro | >=7.1 ✅ | **JÁ INSTALADO — manter** |
| `plugin-survey-multi-choice` | 2.2.1 | Perguntas de múltipla escolha (radiogroups) | >=7.1 ✅ | **ADOTAR** (demografia) |
| `plugin-survey-text` | 2.1.1 | Campos de texto (idade, escolaridade…) | >=7.1 ✅ | **ADOTAR** (demografia) |
| `plugin-survey-likert` | 2.2.0 | Escalas Likert por página | >=7.1 ✅ | **ADOTAR** (demografia/escalas) |
| `plugin-survey-multi-select` | 2.1.1 | Múltipla escolha com várias marcações | >=7.1 ✅ | Opcional (demografia) |
| `plugin-fullscreen` | 2.1.0 | Entra/sai de fullscreen via clique (gesto exigido pelos browsers); não abre em Safari | >=7.1 ✅ | **ADOTAR** |
| `plugin-browser-check` | 2.1.0 | Registra width/height/browser/OS/**mobile**/**webaudio**/webcam/mic/vsync_rate; `inclusion_function` + `exclusion_message` para bloquear | >=7.1 ✅ | **ADOTAR** (gate de dispositivo) |
| `plugin-html-button-response` | 2.1.0 | Estímulo HTML + botões (funciona em touch) | >=7.1 ✅ | Adotar p/ telas simples/fallback |
| `plugin-instructions` | 2.1.0 | Instruções paginadas com barra de progresso | >=7.1 ✅ | **Opcional** — instruções já vêm do `MtsEngine` (`ev.kind === 'instruction'`); usar só p/ texto estático pré-sessão |
| `plugin-resize` | 2.1.0 | Calibração de tamanho com cartão de crédito → `scale_factor` | >=7.0 ✅ | Watchlist (F2: estímulo em mm/cm constante) |
| `plugin-virtual-chinrest` | 3.1.0 | Calibração cartão + ponto-cego (px/grau visual) | >=7.0 ✅ | Watchlist (F2: tamanho em graus visuais) |
| `plugin-canvas-keyboard-response` / `-button-response` / `-slider-response` | 2.2.0 / 2.1.0 / 2.1.0 | Estímulo desenhado via função `stimulus(canvas, ctx)` | >=7.1 ✅ | Watchlist (F2: estímulos gerados proceduralmente) |
| `plugin-audio-button-response` | 2.1.1 | Áudio + resposta por botão (gesto do clique destrava áudio no mobile) | >=7.1 ✅ | Referência de padrão; o próprio MTS cobre |
| `plugin-call-function` | 2.1.0 | Executa função arbitrária na timeline (colar POSTs parciais, etc.) | >=7.1 ✅ | Utilitário — útil p/ checkpoints/checks |

### 1b. Demais oficiais — irrelevantes para MTS agora

`plugin-survey` (SurveyJS — ver §3), `plugin-survey-html-form` (form HTML livre), `plugin-animation`, `plugin-categorize-{html,image,animation}`, `plugin-cloze`, `plugin-external-html`, `plugin-free-sort`, `plugin-html-{keyboard,slider,audio,video}-response`, `plugin-image-{button,keyboard,slider}-response`, `plugin-iat-{html,image}`, `plugin-maxdiff`, `plugin-same-different-{html,image}`, `plugin-serial-reaction-time{,-mouse}`, `plugin-sketchpad`, `plugin-video-{button,keyboard,slider}-response`, `plugin-visual-search-circle`, `plugin-reconstruction`, `plugin-initialize-{camera,microphone}`, `plugin-mirror-camera`, `plugin-html-video-response`, `plugin-webgazer-*` — todos 2.x, peer `>=7.x`, mantidos no monorepo (lançamentos até 07/2026). Paradigmas específicos de outras tarefas, ou mídia/entrada que não usamos; **descartados** salvo mudança de escopo.

**Extensões oficiais:** `extension-mouse-tracking` 1.2.0, `extension-webgazer` 1.2.0 (eye-tracking via WebGazer), `extension-record-video` 1.2.0, `extension-pipe` **0.2.0 (08–09/2026, peer >=8.0.0 — recém-promovido do contrib)**. Todas watchlist F4 (LGPD para gravação; pipe é serviço externo de upload, descartado — ingestão própria em Nitro/Postgres).

---

## 2. Tabela geral — jspsych-contrib (61 pacotes: 56 plugins + 5 extensões)

Colunas: **Últ. commit** no repo contrib (dados de 03/10/2026); **jsPsych** = declaração de compatibilidade no `package.json` (`peer` = peerDependency; `dep` = jspsych como dependency, funciona mas arriscka dupla cópia no bundle; `IIFE` = distribui bundle pré-construído sem ESM — problemático em Vite/Nuxt; `>=7` satisfaz semver 8.x mas sem teste declarado).

### 2a. Compatíveis com 8.x e potencialmente úteis

| Plugin | Função | Últ. commit | jsPsych | Veredito |
|---|---|---|---|---|
| `plugin-html-multi-response` | HTML + resposta por botão **e** teclado no mesmo trial | 2025-05-13 | peer >=8 ✅ | Watchlist (se MTS ganhar resposta por teclado) |
| `plugin-image-multi-response` | Idem para imagem | 2025-05-13 | peer >=8 ✅ | Watchlist (idem) |
| `plugin-audio-multi-response` | Áudio + botão/teclado | 2025-05-13 | peer >=8 ✅ | Watchlist (MTS auditivo avançado) |
| `plugin-html-swipe-response` / `-image-` / `-audio-` | Resposta por **swipe** (mobile-first) + teclado | 2025-05-13 | peer >=8 ✅ | Watchlist F3 (versão mobile do MTS) |
| `plugin-html-choice` | Elementos HTML clicáveis como escolha | 2025-05-13 | peer >=8 ✅ | Dispensável (MTS já faz clique em comparativos) |
| `plugin-survey-grid` | Likert em grade (matriz) | 2026-04-06 | peer >=8 ✅ | Watchlist (questionários densos) |
| `plugin-survey-number` / `plugin-survey-slider` | Pergunta numérica / várias escalas analógicas na página | 2025-05-13 | peer >=8 ✅ | Watchlist |
| `plugin-capture-url-params` | Captura query-string da URL para os dados | 2026-02-07 | dep ^8 | Watchlist (sempre útil p/ UTM/prolific-like) |
| `plugin-device-orientation` | Exigir retrato/paisagem antes de continuar | 2026-03-21 | dep ^8 | Watchlist F3 (mobile) |
| `plugin-slide-to-continue` | "Deslize para continuar" (gate de atenção mobile) | 2026-04-03 | dep ^8.2.2 | Watchlist F3 |
| `plugin-html-keyboard-response-raf` | Keyboard-response com timing via rAF | 2025-05-13 | peer >=8 ✅ | Watchlist (precisão de SOA; MTS é click) |
| `plugin-gamepad` | Entrada via gamepad | 2025-05-13 | peer >=8 ✅ | Irrelevante |
| `extension-touchscreen-buttons` | "Teclado" touch na tela p/ plugins keyboard-response em mobile | 2025-05-14 | IIFE (^8 dev) | Interessante p/ mobile, **mas IIFE sem ESM** — só via `<script>`/global |
| `extension-countdown` / `extension-device-motion` | Contagem regressiva na trial / acelerômetro | 2025-05-13 | peer >=7 ⚠️ | Descartado agora |
| `plugin-pipe` | Cliente do DataPipe (upload externo) | 2026-09-16 | peer >=8 ✅ | **Descartado** — ingestão própria Nitro/Postgres |
| `extension-chiasm` + `plugin-chiasm-setup/calibrate` | Eye-tracker comercial Chiasm (calibração + gravação backend) | 2026-09-05 | peer >=8 ✅ | Watchlist F4 (eye-tracking; requer hardware/serviço) |
| `extension-mediapipe-face-mesh` | Tracking facial via MediaPipe | 2025-05-13 | peer >=7.3 ⚠️ | Watchlist distante — **biometria = LGPD arte 5º, II (dado sensível), cuidado máximo** |

### 2b. Paradigmas específicos de outras tarefas — descartados

`plugin-rdk`, `plugin-rok` (kinematogramas, 2025-07), `plugin-flanker` (2025-11, dep ^8.2.1), `plugin-stop-signal` (2026-01), `plugin-trail-making` (2026-03), `plugin-tower-of-london` (2026-03), `plugin-spatial-nback` (2026-04, dep ^8.2.1), `plugin-bart` (2026-06), `plugin-columbia-card-task` (2025-08), `plugin-pursuit-rotor` (2026-03), `plugin-corsi-blocks` (2025-05), `plugin-copying-task`, `plugin-tangram-game` (^8, IIFE), `plugin-ios` (escala IOS, IIFE), `plugin-libet-intentional-binding` (IIFE), `plugin-self-paced-reading`, `plugin-spr`, `plugin-vsl-{grid-scene,animate-occlusion}`, `plugin-free-recall-response`, `plugin-numpad`, `plugin-circle-click-response`, `plugin-image-click-response` (peer >=7 ⚠️), `plugin-{image,video}-hotspots`, `plugin-visual-search-click-target`, `plugin-{barchart,densitychart,histogram}-button-response`, `plugin-video-several-keyboard-responses`, `plugin-video-text-response`, `plugin-image-array-keyboard-response`, `plugin-html-keyboard-slider`, `plugin-html-vas-response` + `plugin-survey-vas` (VAS; IIFE), `plugin-survey-likert-sd`, `plugin-redirect-to-url` (dep ^8), `plugin-nextcloud-filedrop` (IIFE, devonly ^7). Todos funcionais e vários mantidos em 2026, mas **não atendem nenhum requisito F0–F3 da plataforma** (ou duplicam o que o MtsSessionPlugin/engine já faz melhor para o nosso domínio).

**Resumo quantitativo do contrib:** 29/61 declaram 8.x via peer (`>=8.0.0`/`^8.0.0`); 19 empacotam `jspsych ^8.x` como `dependency`; 6 declaram só `>=7.x`; 7 distribuem apenas bundle IIFE pré-construído (sem ESM — evitar em Nuxt/Vite). Atividade: commits em 2026 em ~24 pacotes; o restante parou em 2025.

---

## 3. Perguntas específicas — respostas diretas

1. **Existe plugin oficial de survey-likert/multi-choice para demografia?** Sim — `@jspsych/plugin-survey-likert` 2.2.0 e `@jspsych/plugin-survey-multi-choice` 2.2.1 (mais `survey-text`, `survey-multi-select`, `survey-html-form`), oficiais, leves (dist de poucos KB), peer `>=7.1` (compatível 8.x). O `plugin-survey` 4.0.0 (SurveyJS) é a alternativa "tudo-em-um" — só vale se precisarmos de lógica condicional complexa/pipes/localização nativa, ao custo de `survey-core`+`survey-js-ui` no bundle.
2. **Como o jsPsych 8 trata mobile/touch?** Não trata — não há abstração de toque. Botões/cliques funcionam nativamente; plugins de teclado não funcionam em touch; layout/fontes ficam por nossa conta (CSS). `plugin-browser-check` registra `mobile`, dimensões e suporte a `webaudio`, permitindo `inclusion_function` para bloquear dispositivos inadequados. Áudio: `AudioPlayer` cai para HTML5 `<audio>` quando não há `AudioContext`, e o contexto precisa de gesto do usuário (nosso observing-response click resolve).
3. **Padrão de i18n?** Nenhum no core (strings = parâmetros HTML). Único mecanismo nativo é a localização do SurveyJS via `plugin-survey`. Manter pt-BR no `ExperimentDocument` (schema/versionamento backend) é mais robusto que qualquer coisa que o ecossistema ofereça.
4. **O que o plugin-preload já cobre?** Tudo de mídia estática (img/áudio/vídeo), com progresso, timeout, erro detalhado e callbacks. Nossa mídia não é auto-detectável (refs dentro de objetos custom) — as listas explícitas `images`/`audio` em `[doc].vue` são o padrão correto. Não cobre: geração de estímulos (canvas), checagem de dispositivo (browser-check), desbloqueio de áudio (gesto).

---

## 4. ADOÇÃO IMEDIATA (F0/F1) — integração concreta ao fluxo existente

Instalação (3 novos pacotes oficiais, todos tree-shakeáveis e lazy-importáveis como já fazemos):

```bash
npm i @jspsych/plugin-survey-multi-choice @jspsych/plugin-survey-text @jspsych/plugin-browser-check @jspsych/plugin-fullscreen
```

### 4.1 Novo pipeline da timeline em `app/pages/run/[doc].vue > acceptAndRun()`

Ordem e racional (auth e consentimento continuam nas fases Vue próprias, antes do jsPsych — não há plugin para substituir, e está correto assim):

```ts
const [{ initJsPsych }, { default: PreloadPlugin }, { MtsSessionPlugin },
       { default: BrowserCheck }, { default: Fullscreen },
       { default: SurveyMultiChoice }, { default: SurveyText }] = await Promise.all([
  import('jspsych'),
  import('@jspsych/plugin-preload'),
  import('@core/adapters/jspsych/mts-session-plugin'),
  import('@jspsych/plugin-browser-check'),
  import('@jspsych/plugin-fullscreen'),
  import('@jspsych/plugin-survey-multi-choice'),
  import('@jspsych/plugin-survey-text'),
])
phase.value = 'running'
const jsPsych = initJsPsych({ display_element: 'jspsych-target', on_finish: () => { phase.value = 'done' } })
const engine = new MtsEngine(pkg.document, 42)

jsPsych.run([
  // 1) GATE: dispositivo/browser/áudio — antes de gastar preload
  {
    type: BrowserCheck,
    minimum_width: 900, minimum_height: 600,          // MTS: 3 comparativos 200px + gaps
    inclusion_function: (data) => data.webaudio !== false, // exige áudio utilizável
    exclusion_message: (data) =>
      `<p>Este experimento requer tela maior${data.mobile ? ' (use um computador ou tablet)' : ''} com áudio funcionando.</p>`,
  },
  // 2) DEMOGRAFIA (subir p/ POST próprio ou anexar ao batch no on_finish do survey)
  {
    type: SurveyMultiChoice,
    questions: [
      { prompt: 'Qual a sua faixa de idade?', name: 'faixa_idade', options: ['18–24','25–34','35–44','45–54','55+'], required: true },
      { prompt: 'Qual o seu nível de escolaridade?', name: 'escolaridade', options: ['Fundamental','Médio','Superior incompleto','Superior completo','Pós-graduação'], required: true },
    ],
  },
  { type: SurveyText, questions: [{ prompt: 'Como você se identifica (gênero)?', name: 'genero', placeholder: 'opcional', required: false }] },
  // 3) FULLSCREEN: o clique aqui é gesto que "aquece" o desbloqueio de áudio
  { type: Fullscreen, fullscreen_mode: true, button_label: 'Começar em tela cheia', delay_after: 800 },
  // 4) PRELOAD (já existente — melhorado: mensagem pt-BR + tolerância a erro)
  {
    type: PreloadPlugin,
    images: pkg.manifest.filter(u => !/\.(wav|mp3|ogg|m4a)$/i.test(u)),
    audio: pkg.manifest.filter(u => /\.(wav|mp3|ogg|m4a)$/i.test(u)),
    message: '<p>Preparando o experimento…</p>',
    max_load_time: 120000,
    continue_after_error: false,          // dados experimentais: falhar cedo é melhor
    show_detailed_errors: true,
  },
  // 5) SESSÃO MTS (inalterada por fora; ajuste de áudio interno no §4.2)
  { type: MtsSessionPlugin, engine, document: pkg.document, sessionId: session.sessionId,
    assetBase: '/stimuli/', resolveAsset: (ref) => assetMap.get(ref) ?? `/stimuli/${ref}`,
    onFinish: /* igual ao atual */ },
])
```

Detalhes de encaixe:

- **Demografia → Postgres:** cada trial survey gera `response` + `rt` no data do jsPsych. Duas opções: (a) `on_finish` do trial faz POST para `/api/respondents/profile` (reaproveita auth do usuário logado); (b) acumular no `BatchBuilder`/checkpoint via `onTrial` custom. Recomendo (a) — dado transversal de respondente, não resultado experimental; mantém o schema `TrialResult` limpo.
- **Posição browser-check × fullscreen:** browser-check antes de tudo (barato, sem gesto); fullscreen antes do preload para o download rodar "invisível" ao participante já em modo imersivo.
- **Filtro do manifesto:** trocar o `endsWith('.wav')` atual por regex de extensões de áudio (`.wav|.mp3|.ogg|.m4a`) — o MTS auditivo pode receber formatos diferentes.

### 4.2 Ajuste interno no `MtsSessionPlugin` — áudio pelo core (pré-carregado)

Hoje `mts-session-plugin.ts` faz `new window.Audio(assetUrl(ref))` — isso **bypassa o cache do preload** (que cria `AudioPlayer`s indexados por URL) e perde Web Audio. Troca mínima:

```ts
// no lugar de const audio = (ref) => { const a = new window.Audio(...); a.volume = ...; return a }
const getPlayer = async (ref: StimulusRef) => {
  this.jsPsych.pluginAPI.audioContext()          // resume() do AudioContext (política autoplay)
  return this.jsPsych.pluginAPI.getAudioPlayer(assetUrl(ref))  // hit no cache do preload
}
```

- No observing response (clique na amostra), chamar `audioContext()` **dentro do handler do clique** destrava o contexto suspenso no iOS/Android; depois `player.play()` / `player.stop()`.
- **Caveat volume:** `AudioPlayer` não tem API de volume (Web Audio ignora `element.volume`). Se `doc.experiment.volume` for imprescindível: ou mantemos HTML5 `Audio` para consequências (sons não-críticos em timing) e usamos `getAudioPlayer` apenas para o som da amostra (timing importa), ou conectamos um `GainNode` via `audioContext()`. Recomendo o híbrido.
- Garantir que `assetUrl(ref)` produza **exatamente** a mesma string usada na lista `audio` do preload (senão o cache do `getAudioPlayer` erra e refaz fetch) — com `resolveAsset` atual via `assetMap` isso já vale, desde que o manifesto contenha as mesmas URLs.

---

## 5. Watchlist (F2/F3+, não instalar agora)

| Item | Quando | Nota |
|---|---|---|
| `plugin-canvas-{button,keyboard,slider}-response` (oficial) | F2: estímulos gerados proceduralmente (MTS arbitrativo sem arquivos de imagem) | `stimulus(canvas, ctx)` desenha por trial; elimina pipeline de assets p/ formas |
| `plugin-resize` / `plugin-virtual-chinrest` (oficial) | F2: controle de tamanho físico/ângulo visual do estímulo | resize = cartão (mm); chinrest = + ponto-cego (graus). Registrar `scale_factor` no resultado |
| `plugin-{html,image,audio}-swipe-response`, `extension-touchscreen-buttons`, `plugin-device-orientation`, `plugin-slide-to-continue` (contrib, 8.x) | F3: versão mobile/tablet do MTS | touchscreen-buttons é IIFE (precisa shim `<script>` global); swipe plugins são ESM ok |
| `initialize-microphone`/`html-audio-response` (oficial) | F3: naming auditivo do participante | LGPD: voz = dado pessoal; consentimento versionado precisa cobrir; armazenar sob hash |
| `initialize-camera` + `extension-record-video`/`html-video-response`/`mirror-camera`, `extension-webgazer` (oficial), `extension-chiasm` (contrib) | F4: replay/atenção/eye-tracking | **LGPD biometria facial = dado sensível (art. 5º II)**: base legal, minimização, retenção curta, criptografia; webgazer/chiasm ainda exigem calibração (plugins `webgazer-*` oficiais) |
| `extension-mediapipe-face-mesh` (contrib) | F4+ | Roda local (sem upload), mas peer >=7.3 e dado sensível — avaliar só com parecer |
| `jsPsych.simulate()` (core, não plugin) | CI/e2e da plataforma | Plugins precisam implementar `simulate()`; adicionar ao `MtsSessionPlugin` permitiria rodar sessões fantasma nos testes do Nuxt |
| `plugin-survey` (oficial, SurveyJS) | Se formulários ficarem complexos/multilíngues | Custo de bundle alto (`survey-core`+`survey-js-ui`); ganha i18n nativo e lógica condicional |
| `plugin-survey-grid`, `plugin-survey-slider/number` (contrib 8.x) | Escalas padronizadas pós-sessão (F1 tardio) | ESM ok, mantidos 2025–2026 |
| `plugin-capture-url-params` (contrib) | Quando houver recrutamento externo (prolific-like) | Dep ^8; trivial |

## 6. Descartados (com motivo)

- **Toda a família de paradigmas do contrib** (rdk/rok/flanker/stop-signal/trail-making/tower-of-london/spatial-nback/bart/columbia-card/pursuit-rotor/corsi/copying-task/tangram/ios/libet/vsl/self-paced-reading/spr/free-recall/numpad/hotspots/visual-search/charts…): tarefas de outros domínios; nosso domínio tem engine próprio.
- **`plugin-pipe`/`extension-pipe` (oficial 0.2.0) e `plugin-nextcloud-filedrop`**: upload de dados em serviço externo — conflita com ingestão própria autenticada (Nitro→Postgres) e com dado sensível saindo da infraestrutura.
- **`plugin-redirect-to-url`**: plataforma própria controla a jornada.
- **7 pacotes IIFE do contrib** (`html-vas-response`, `survey-vas`, `ios`, `copying-task`, `libet-intentional-binding`, `nextcloud-filedrop`, `tangram-game` + `extension-touchscreen-buttons`): sem ESM/exports — fricção alta em Vite/Nuxt, sem ganho sobre equivalentes.
- **Contrib com peer `>=7.x` sem migração** (`extension-countdown`, `extension-device-motion`, `plugin-image-click-response`, `plugin-self-paced-reading`, `extension-mediapipe-face-mesh`, `plugin-vsl-grid-scene`): sem declaração/teste 8.x; a nova avaliação de parâmetros do 8.0 é risco real.
- **`plugin-instructions`**: redundante enquanto as instruções são eventos do `MtsEngine` (fonte única de verdade no documento); rever se surgirem manuais estáticos longos pré-sessão.
- **`plugin-external-html`**: consentimento versionado já é rota/server-rendered na plataforma.

## 7. Fontes

- Repo oficial e pacotes: https://github.com/jspsych/jsPsych (diretório `packages/`)
- Contrib e pacotes: https://github.com/jspsych/jspsych-contrib (diretório `packages/`; peer-deps e commits verificados por clone em 03/10/2026)
- Release notes 8.0.0 (breaking changes, AudioPlayer): https://github.com/jspsych/jsPsych/releases/tag/jspsych%408.0.0
- Preload: https://www.jspsych.org/latest/overview/media-preloading/
- Survey plugin (SurveyJS): https://www.jspsych.org/latest/plugins/survey/ e https://www.jspsych.org/latest/overview/building-surveys/
- Mobile/dispositivos: https://www.jspsych.org/latest/overview/browser-device-support/
- Fontes do core inspecionados: `packages/jspsych/src/modules/plugin-api/AudioPlayer.ts` e `MediaAPI.ts` (fallback Web Audio/HTML5, cache `audio_buffers`, `audioContext().resume()`)
- npm registry (versões/dist-tags/peer-deps/sizes): https://www.npmjs.com/package/jspsych , …/@jspsych/plugin-survey , …/@jspsych/plugin-preload , …/survey-core
- Código local analisado: `/home/ozp/code/Project-planner/plataforma/core/adapters/jspsych/mts-session-plugin.ts` e `/home/ozp/code/Project-planner/plataforma/app/pages/run/[doc].vue`