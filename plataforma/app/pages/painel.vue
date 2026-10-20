<script setup lang="ts">
// Painel do pesquisador: meus experimentos, sessões, export e publicação
// + seção Codificação C2 (gabarito humano).
interface Row {
  doc_version: string
  title: string
  published: boolean
  sessions_total: number
  sessions_closed: number
  trials: number
  term_version: number | null
}
interface CodRow {
  id: string
  titulo: string
  modo: string
  status: string
  itens: number
  cegas_fechadas: number
  consenso_fechado: number
}

const { data, error } = await useFetch('/api/my/experiments')
const rows = computed(() => (data.value as { experiments: Row[] } | null)?.experiments ?? [])
const busy = ref('')

async function publish(doc: string) {
  busy.value = doc
  await $fetch(`/api/experiments/${doc}/publish`, { method: 'POST' })
  await refreshNuxtData()
  busy.value = ''
}

// — Codificação C2 —
const cod = ref<{ tasks: CodRow[] } | null>(null)
const codErro = ref('')
const novaTitulo = ref('')
const novaModo = ref('foco')
const novaItens = ref('') // JSON da amostra (importador gera)
const criada = ref<{ taskId: string; links: { papel: string; url: string }[] } | null>(null)

async function carregarCod() {
  try { cod.value = await $fetch('/api/admin/coding-tasks') } catch (e) { codErro.value = msg(e) }
}
onMounted(carregarCod)

async function criarTask() {
  codErro.value = ''
  try {
    const itens = JSON.parse(novaItens.value)
    criada.value = await $fetch('/api/admin/coding-tasks', {
      method: 'POST',
      body: { titulo: novaTitulo.value, modo: novaModo.value, itens },
    })
    novaTitulo.value = ''
    novaItens.value = ''
    await carregarCod()
  } catch (e) { codErro.value = msg(e) + ' — confira o JSON da amostra' }
}
function msg(e: unknown): string {
  return (typeof e === 'object' && e !== null && 'statusMessage' in e && typeof e.statusMessage === 'string') ? e.statusMessage : 'erro'
}
const copiar = (t: string) => navigator.clipboard?.writeText(location.origin + t)
</script>

<template>
  <main class="panel">
    <h1>Meus experimentos</h1>
    <p v-if="error" style="color: #e74c3c">{{ error.statusMessage }}</p>
    <p v-else-if="rows.length === 0">Nenhum experimento submetido ainda (use <code>scripts/submit-experiment.mjs</code>).</p>
    <table v-else>
      <thead>
        <tr><th>Título</th><th>Status</th><th>Sessões</th><th>Trials</th><th>Ações</th></tr>
      </thead>
      <tbody>
        <tr v-for="r in rows" :key="r.doc_version">
          <td>{{ r.title }}</td>
          <td>
            <span class="badge" :class="r.published ? 'ok' : 'draft'">{{ r.published ? 'publicado' : 'rascunho' }}</span>
          </td>
          <td>{{ r.sessions_closed }}/{{ r.sessions_total }}</td>
          <td>{{ r.trials }}</td>
          <td class="actions">
            <NuxtLink v-if="r.published" :to="`/run/${r.doc_version}`">ver</NuxtLink>
            <button v-else :disabled="busy === r.doc_version" @click="publish(r.doc_version)">publicar</button>
            <a :href="`/api/experiments/${r.doc_version}/export?format=csv`">export CSV</a>
            <a :href="`/api/experiments/${r.doc_version}/export?format=json`">JSON</a>
          </td>
        </tr>
      </tbody>
    </table>

    <h2 style="margin-top: 3rem">Codificação C2 — gabarito humano</h2>
    <p v-if="codErro" style="color: #e74c3c">{{ codErro }}</p>
    <details style="margin: .6rem 0 1rem">
      <summary style="cursor: pointer; color: #7cb1ff">nova task de codificação</summary>
      <div style="display: flex; flex-direction: column; gap: .5rem; max-width: 560px; margin-top: .6rem">
        <input v-model="novaTitulo" placeholder="título (ex.: gabarito sct-v3 — piloto)" style="padding: .5rem">
        <select v-model="novaModo">
          <option value="foco">modo foco (âncoras visíveis)</option>
          <option value="compacta">modo compacta (números)</option>
          <option value="contínua">modo contínua (folha única)</option>
        </select>
        <textarea v-model="novaItens" rows="6" placeholder='JSON da amostra: [{"session_id":"…","trial_seq":1,"segment_tag":"…","stem":"…","response_text":"…"}] — o importador gera' style="padding: .5rem" />
        <button :disabled="!novaTitulo || !novaItens" @click="criarTask">criar (3 links)</button>
      </div>
    </details>
    <div v-if="criada" class="card">
      <p v-for="l in criada.links" :key="l.papel">
        <strong>{{ l.papel }}</strong> — <a :href="l.url">{{ l.url }}</a>
        <button @click="copiar(l.url)">copiar</button>
      </p>
    </div>
    <table v-if="cod?.tasks?.length">
      <thead>
        <tr><th>Tarefa</th><th>Modo</th><th>Status</th><th>Itens</th><th>Cegas</th><th>Consenso</th><th>Ações</th></tr>
      </thead>
      <tbody>
        <tr v-for="t in cod.tasks" :key="t.id">
          <td>{{ t.titulo }}</td>
          <td>{{ t.modo }}</td>
          <td><span class="badge" :class="t.status === 'travada' ? 'ok' : 'draft'">{{ t.status }}</span></td>
          <td>{{ t.itens }}</td>
          <td>{{ t.cegas_fechadas }}/2</td>
          <td>{{ t.consenso_fechado ? 'fechado' : '—' }}</td>
          <td class="actions"><a :href="`/api/admin/coding-tasks/${t.id}/export`">export JSON</a></td>
        </tr>
      </tbody>
    </table>
    <p v-else class="mut">Nenhuma task de codificação ainda.</p>
  </main>
</template>

<style scoped>
.panel { max-width: 900px; margin: 0 auto; padding: 1rem; font-family: system-ui, sans-serif; }
table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
th, td { text-align: left; padding: .5rem .6rem; border-bottom: 1px solid #2a2a2a; }
th { color: #999; font-weight: 500; font-size: .85rem; }
.badge { padding: .1rem .5rem; border-radius: 99px; font-size: .75rem; }
.badge.ok { background: #16341f; color: #7ce05c; }
.badge.draft { background: #333; color: #aaa; }
.actions { display: flex; gap: .8rem; }
.actions a, .actions button { color: #7cb1ff; background: none; border: none; cursor: pointer; font-size: .9rem; }
.card { border: 1px solid #2a2d31; border-radius: 10px; padding: .8rem 1rem; margin-top: .8rem; }
.card button { color: #7cb1ff; background: none; border: 1px solid #2a2d31; border-radius: 6px; padding: .15rem .5rem; cursor: pointer; margin-left: .5rem; }
.mut { color: #999; font-size: .85rem; }
input, select, textarea { background: #1b1e22; color: #e8eaed; border: 1px solid #2a2d31; border-radius: 8px; font: inherit; }
</style>
