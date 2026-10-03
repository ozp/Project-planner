<script setup lang="ts">
// Painel do pesquisador: meus experimentos, sessões, export e publicação.
interface Row {
  doc_version: string
  title: string
  published: boolean
  sessions_total: number
  sessions_closed: number
  trials: number
  term_version: number | null
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
</style>
