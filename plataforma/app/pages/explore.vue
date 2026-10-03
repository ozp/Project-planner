<script setup lang="ts">
// Catálogo (AC 3.3): experimentos disponíveis para o usuário logado.
const { data, error } = await useFetch('/api/experiments')
const experiments = computed(() => (data.value as { experiments: Array<Record<string, unknown>> } | null)?.experiments ?? [])
</script>

<template>
  <main class="catalog">
    <h1>Experimentos</h1>
    <p style="font-size:.9rem"><NuxtLink to="/painel">Área do pesquisador</NuxtLink></p>
    <p v-if="error" style="color: #e74c3c">
      <NuxtLink to="/login?redirect=/explore">Entrar</NuxtLink> para ver os experimentos disponíveis.
    </p>
    <p v-else-if="experiments.length === 0">Nenhum experimento disponível no momento.</p>
    <ul class="cards">
      <li v-for="exp in experiments" :key="String(exp.doc_version)" class="card">
        <h2>{{ exp.title }}</h2>
        <p>{{ exp.description }}</p>
        <p class="meta">
          <span v-if="exp.published" class="badge ok">aberto</span>
          <span v-else class="badge draft">rascunho</span>
          {{ exp.session_count }} sessões
        </p>
        <NuxtLink v-if="exp.published" :to="`/run/${exp.doc_version}`" class="cta">Participar</NuxtLink>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.catalog { max-width: 720px; margin: 0 auto; padding: 1rem; font-family: system-ui, sans-serif; }
.cards { list-style: none; padding: 0; display: grid; gap: 1rem; }
.card { border: 1px solid #333; border-radius: 12px; padding: 1rem; }
.card h2 { font-size: 1.1rem; margin: 0 0 .25rem; }
.card p { margin: .25rem 0; color: #ccc; }
.meta { font-size: .85rem; color: #999; display: flex; gap: .5rem; align-items: center; }
.badge { padding: .1rem .5rem; border-radius: 99px; font-size: .75rem; }
.badge.ok { background: #16341f; color: #7ce05c; }
.badge.draft { background: #333; color: #aaa; }
.cta { display: inline-block; margin-top: .5rem; padding: .5rem 1.2rem; border-radius: 8px; background: #2451b3; color: #fff; text-decoration: none; }
</style>
