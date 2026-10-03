<script setup lang="ts">
// F0: execução local do experimento de exemplo (OZP-397 Story 1.4).
// Carga única (AD-7): 1 GET (documento+manifest) + preload → zero rede
// entre trials → 1 POST (batch) no fim.
// jsPsych toca window no top-level: imports dinâmicos, só no browser.
import { onMounted, ref } from 'vue'
import type { RunPackage } from '~/../server/api/experiments/local.get'
import { MtsEngine } from '@core/engine/engine'
import type { BatchBuilder } from '@core/adapters/jspsych/batch'

definePageMeta({ ssr: false })

const phase = ref<'loading' | 'running' | 'done' | 'error'>('loading')
const summary = ref('')
const sendResult = ref('')

onMounted(async () => {
  try {
    const res = await fetch('/api/experiments/local')
    const pkg = (await res.json()) as RunPackage
    const [{ initJsPsych }, { default: PreloadPlugin }, { MtsSessionPlugin }] = await Promise.all([
      import('jspsych'),
      import('@jspsych/plugin-preload'),
      import('@core/adapters/jspsych/mts-session-plugin'),
    ])

    const jsPsych = initJsPsych({
      display_element: 'jspsych-target',
      on_finish: () => {
        phase.value = 'done'
      },
    })

    const sessionId = `local-${crypto.randomUUID()}`
    const engine = new MtsEngine(pkg.document, 42) // seed registrada na sessão (AD-2)

    jsPsych.run([
      {
        type: PreloadPlugin,
        images: pkg.manifest.filter(u => !u.endsWith('.wav')),
        audio: pkg.manifest.filter(u => u.endsWith('.wav')),
      },
      {
        type: MtsSessionPlugin,
        engine,
        document: pkg.document,
        sessionId,
        assetBase: '/stimuli/',
        onFinish: async (batch: BatchBuilder, reason: string) => {
          summary.value = `Motivo: ${reason} · ${batch.size} tentativas registradas`
          // único tráfego de dados da sessão: o batch final (AD-7)
          const payload = batch.build()
          const r = await fetch('/api/sessions/local/results', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          })
          const body = await r.json().catch(() => ({}))
          sendResult.value = r.ok
            ? `Batch ${body.status} — ${body.accepted} resultados aceitos`
            : `Erro ${r.status}: ${body.statusMessage ?? 'rejeitado'}`
        },
      },
    ])
    phase.value = 'running'
  } catch (e) {
    summary.value = String(e)
    phase.value = 'error'
  }
})
</script>

<template>
  <main style="font-family: system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 1rem">
    <h1 style="font-size: 1.2rem">Execução local — experimento de exemplo</h1>
    <p v-if="phase === 'loading'">Carregando experimento…</p>
    <p v-if="phase === 'error'" style="color: #e74c3c">{{ summary }}</p>
    <div id="jspsych-target" />
    <p v-if="phase === 'done'" style="margin-top: 1rem">
      {{ summary }}<br>
      <strong>{{ sendResult }}</strong>
    </p>
  </main>
</template>
