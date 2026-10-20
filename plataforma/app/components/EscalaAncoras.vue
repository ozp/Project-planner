<script setup lang="ts">
// Escala 1–5 com âncora visível (modo foco/contínua) ou numérica com âncora
// no title (modo compacta). Radios nativos: teclado grátis.
defineProps<{ rotulo: string; ancoras: string[]; modelValue: number; compacta?: boolean; nome: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: number): void }>()
</script>

<template>
  <div class="escala" tabindex="0" :data-dim="nome">
    <h3>{{ rotulo }}</h3>
    <div v-if="!compacta" class="opts">
      <label v-for="(a, i) in ancoras" :key="i" class="opt" :class="{ sel: modelValue === i + 1 }">
        <input type="radio" :name="nome" :checked="modelValue === i + 1" @change="emit('update:modelValue', i + 1)">
        <span class="num">{{ i + 1 }}</span><span>{{ a }}</span>
      </label>
    </div>
    <div v-else class="seg">
      <button
        v-for="i in 5" :key="i" type="button" :class="{ sel: modelValue === i }"
        :title="ancoras[i - 1]" @click="emit('update:modelValue', i)"
      >{{ i }}</button>
    </div>
  </div>
</template>

<style scoped>
.escala { margin-top: 1.2rem; }
.escala:focus-visible { outline: 2px solid #7cb1ff; outline-offset: 4px; border-radius: 8px; }
h3 { font-size: .95rem; font-weight: 600; margin: 0 0 .35rem; color: #e8eaed; }
.opts { display: flex; flex-direction: column; gap: .25rem; }
.opt { display: flex; align-items: baseline; gap: .6rem; padding: .45rem .6rem; border: 1px solid transparent; border-radius: 8px; cursor: pointer; }
.opt:hover { border-color: #2a2d31; }
.opt.sel { border-color: #7ce05c; background: #16341f33; }
.opt input { position: absolute; opacity: 0; }
.opt .num { color: #9aa0a6; font-size: .85rem; min-width: 1rem; }
.opt.sel .num { color: #7ce05c; font-weight: 700; }
.seg { display: flex; gap: .4rem; }
.seg button { flex: 1; padding: .55rem 0; background: #1b1e22; color: #e8eaed; border: 1px solid #2a2d31; border-radius: 8px; font-size: 1.05rem; cursor: pointer; }
.seg button.sel { border-color: #7ce05c; background: #16341f; color: #7ce05c; font-weight: 700; }
</style>
