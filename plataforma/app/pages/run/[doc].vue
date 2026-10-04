<script setup lang="ts">
// F0/E2: jornada completa do participante (journeys.md):
// registro/login → consentimento vigente (AD-9) → execução → batch.
// jsPsych toca window no top-level: imports dinâmicos, só no browser.
import { onMounted, ref } from 'vue'
import { MtsEngine } from '@core/engine/engine'
import type { BatchBuilder } from '@core/adapters/jspsych/batch'

definePageMeta({ ssr: false })

type Phase = 'loading' | 'auth' | 'consent' | 'running' | 'done' | 'error'
const phase = ref<Phase>('loading')
const message = ref('')
const summary = ref('')
const sendResult = ref('')
const docTitle = ref('')

const email = ref('')
const password = ref('')
const term = ref<{ id: string, version: number, body: string } | null>(null)

interface RunPackage { document: import('@core/schema').ExperimentDocument, manifest: string[], assets: { ref: string, url: string }[] }
let pkg: RunPackage
let docVersion: string
let assetMap: Map<string, string> = new Map()

async function api(path: string, init?: RequestInit) {
  const r = await fetch(path, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } })
  const body = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`${r.status}: ${body.statusMessage ?? r.statusText}`)
  return body
}

onMounted(async () => {
  try {
    const route = useRoute()
    docVersion = String(route.params.doc ?? '')
    if (!docVersion) {
      message.value = 'Sem documento. Rode "node scripts/seed-local.mjs" e use a URL impressa.'
      phase.value = 'error'
      return
    }
    // autenticação antes da carga: o pacote exige login (journeys.md registro→termo→execução)
    const { user } = await api('/api/auth/me') as { user: { id: string } | null }
    if (user) await afterAuth()
    else phase.value = 'auth'
  } catch (e) {
    message.value = String(e)
    phase.value = 'error'
  }
})

async function register() {
  try {
    await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ email: email.value, password: password.value }) })
    await login()
  } catch (e) { message.value = String(e) }
}

async function login() {
  try {
    await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: email.value, password: password.value }) })
    await afterAuth()
  } catch (e) { message.value = String(e) }
}

async function afterAuth() {
  try {
    const loaded = await api(`/api/experiments/${docVersion}`) as RunPackage & { assets: { ref: string, url: string }[] }
    pkg = loaded
    docTitle.value = loaded.document.title
    assetMap = new Map((loaded.assets ?? []).map(a => [a.ref, a.url]))
    term.value = await api(`/api/experiments/${docVersion}/terms`) as { id: string, version: number, body: string }
    phase.value = 'consent'
  } catch (e) {
    message.value = String(e)
    phase.value = 'error'
  }
}

async function acceptAndRun() {
  try {
    await api('/api/consent/accept', { method: 'POST', body: JSON.stringify({ termId: term.value!.id }) })
    const session = await api('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ docVersion, seed: 42 }),
    }) as { sessionId: string, uploadToken: string }

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

    // pipeline (docs/research/2026-10-03-plugins-jspsych §4):
    // gate de dispositivo → demografia (classe protegida, POST próprio) →
    // fullscreen (gesto destrava áudio) → preload → sessão MTS
    jsPsych.run([
      {
        type: BrowserCheck,
        minimum_width: 720, minimum_height: 500,
        inclusion_function: (data: Record<string, unknown>) => data.webaudio !== false,
        exclusion_message: () => '<p>Este experimento requer uma tela maior com áudio funcionando (use um computador ou tablet).</p>',
      },
      {
        type: SurveyMultiChoice,
        questions: [
          { prompt: 'Qual a sua faixa de idade?', name: 'faixa_idade', options: ['18–24', '25–34', '35–44', '45–54', '55+'], required: true },
          { prompt: 'Qual o seu nível de escolaridade?', name: 'escolaridade', options: ['Fundamental', 'Médio', 'Superior incompleto', 'Superior completo', 'Pós-graduação'], required: true },
        ],
        on_finish: (data: { response: Record<string, string> }) => {
          void fetch(`/api/sessions/${session.sessionId}/demographics`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${session.uploadToken}` },
            body: JSON.stringify(data.response ?? {}),
          })
        },
      },
      { type: SurveyText, questions: [{ prompt: 'Como você se identifica (gênero)?', name: 'genero', placeholder: 'opcional', required: false }] },
      { type: Fullscreen, fullscreen_mode: true, button_label: 'Começar em tela cheia', delay_after: 400 },
      {
        type: PreloadPlugin,
        images: pkg.manifest.filter(u => !/\.(wav|mp3|ogg|m4a)$/i.test(u)),
        audio: pkg.manifest.filter(u => /\.(wav|mp3|ogg|m4a)$/i.test(u)),
        message: '<p>Preparando o experimento…</p>',
        max_load_time: 120000,
        continue_after_error: false,
        show_detailed_errors: true,
      },
      {
        type: MtsSessionPlugin,
        engine,
        document: pkg.document,
        sessionId: session.sessionId,
        assetBase: '/stimuli/',
        resolveAsset: (ref: string) => assetMap.get(ref) ?? `/stimuli/${ref}`,
        onFinish: async (batch: BatchBuilder, reason: string) => {
          summary.value = `Motivo: ${reason} · ${batch.size} tentativas registradas`
          const r = await fetch(`/api/sessions/${session.sessionId}/results`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${session.uploadToken}` },
            body: JSON.stringify(batch.build()),
          })
          const body = await r.json().catch(() => ({}))
          sendResult.value = r.ok
            ? `Batch ${body.status} — ${body.accepted} resultados aceitos`
            : `Erro ${r.status}: ${body.statusMessage ?? 'rejeitado'}`
        },
      },
    ])
  } catch (e) {
    message.value = String(e)
    phase.value = 'error'
  }
}
</script>

<template>
  <main style="font-family: system-ui, sans-serif; max-width: 760px; margin: 0 auto; padding: 1rem">
    <h1 style="font-size: 1.2rem">{{ docTitle || 'Experimento' }}</h1>
    <p v-if="phase === 'error'" style="color: #e74c3c">{{ message }}</p>

    <section v-if="phase === 'auth'" style="max-width: 360px; display: grid; gap: .5rem">
      <p>Crie sua conta (ou entre) para participar:</p>
      <input v-model="email" type="email" placeholder="seu@email.com" autocomplete="email">
      <input v-model="password" type="password" placeholder="senha (mín. 10 caracteres)" autocomplete="new-password">
      <button @click="register">Criar conta e participar</button>
      <button variant="outline" @click="login">Já tenho conta</button>
      <p v-if="message" style="color: #e67e22; font-size: .9rem">{{ message }}</p>
    </section>

    <section v-else-if="phase === 'consent'" style="display: grid; gap: 1rem">
      <h2 style="font-size: 1.05rem">Termo de consentimento (versão {{ term?.version }})</h2>
      <p style="white-space: pre-wrap; line-height: 1.6">{{ term?.body }}</p>
      <button @click="acceptAndRun">Aceito e inicio o experimento</button>
    </section>

    <div id="jspsych-target" />

    <p v-if="phase === 'done'" style="margin-top: 1rem">
      {{ summary }}<br>
      <strong>{{ sendResult }}</strong>
    </p>
  </main>
</template>
