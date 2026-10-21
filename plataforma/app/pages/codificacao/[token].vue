<script setup lang="ts">
// Folha de codificação C2 (gate = token; sem login). Modo vem da task
// (foco · compacta · contínua) — administração padronizada: as duas folhas
// cegas e o consenso usam o mesmo modo. Autosave parcial com merge no
// servidor; retomada pelo mesmo link no primeiro item sem resposta.
definePageMeta({ ssr: false })
useHead({ bodyAttrs: { style: 'background:#111315;margin:0' } })

type FolhaItemApi = {
  itemIndex: number; stem: string; responseText: string
  d1: number; d2: number; d3: number; naoCodificavel: boolean; nota: string
  par1: { d1: number; d2: number; d3: number; naoCodificavel: boolean } | null
  par2: { d1: number; d2: number; d3: number; naoCodificavel: boolean } | null
}
type FolhaApi = {
  papel: string; titulo: string; modo: 'foco' | 'compacta' | 'contínua'
  status: string; finalizada: boolean; aguardando: boolean; itens: FolhaItemApi[]
}

const route = useRoute()
const token = String(route.params.token)

type Phase = 'carregando' | 'inválido' | 'aguardando' | 'intro' | 'codificando' | 'revisão' | 'finalizado'
const phase = ref<Phase>('carregando')
const folha = ref<FolhaApi | null>(null)
const atual = ref(0)
const salvoEm = ref('')
const erroRede = ref(false)
const salvando = ref(false)
const manualAberto = ref(false)

const ANCORAS = {
  d1: ['muito negativa', 'negativa', 'neutra', 'positiva', 'muito positiva'],
  d2: ['genérica', 'pouco específica', 'média', 'concreta', 'idiossincrática'],
  d3: ['evasiva/estéril', 'bastante evasiva', 'mista', 'codificável', 'plenamente codificável'],
} as const

let dirty = new Set<number>()
let timer: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  try {
    const f = await $fetch<FolhaApi>(`/api/coding/${token}`)
    folha.value = f
    if (f.aguardando) { phase.value = 'aguardando'; return }
    if (f.finalizada) { phase.value = 'finalizado'; return }
    phase.value = 'intro'
  } catch {
    phase.value = 'inválido'
  }
})

const itens = computed(() => folha.value?.itens ?? [])
const itemAtual = computed(() => itens.value[atual.value])
const completo = (i: FolhaItemApi) => i.naoCodificavel || (i.d1 > 0 && i.d2 > 0 && i.d3 > 0)
const nCompletos = computed(() => itens.value.filter(completo).length)
const ehConsenso = computed(() => folha.value?.papel === 'consenso')
const compacta = computed(() => folha.value?.modo === 'compacta')
const divergentes = computed(() =>
  ehConsenso.value ? itens.value.filter(i => i.par1 && i.par2 &&
    (i.par1.d1 !== i.par2.d1 || i.par1.d2 !== i.par2.d2 || i.par1.d3 !== i.par2.d3 || i.par1.naoCodificavel !== i.par2.naoCodificavel)) : [])

function setDim(i: FolhaItemApi, dim: 'd1' | 'd2' | 'd3', v: number) {
  i[dim] = v
  agendar(i)
}
function setFlag(i: FolhaItemApi, v: boolean) {
  i.naoCodificavel = v
  agendar(i)
}
function setNota(i: FolhaItemApi, v: string) {
  i.nota = v
  agendar(i)
}
function agendar(i: FolhaItemApi) {
  dirty.add(i.itemIndex)
  erroRede.value = false
  if (timer) clearTimeout(timer)
  timer = setTimeout(flush, 600)
}
async function flush() {
  if (!dirty.size || salvando.value) return
  salvando.value = true
  const payload = itens.value.filter(i => dirty.has(i.itemIndex)).map(i => ({
    itemIndex: i.itemIndex, d1: i.d1, d2: i.d2, d3: i.d3, naoCodificavel: i.naoCodificavel, nota: i.nota,
  }))
  const marcados = new Set(payload.map(p => p.itemIndex))
  try {
    await $fetch(`/api/coding/${token}/responses`, { method: 'PATCH', body: { respostas: payload } })
    dirty = new Set([...dirty].filter(n => !marcados.has(n)))
    salvoEm.value = 'rascunho salvo ' + new Date().toLocaleTimeString()
  } catch {
    erroRede.value = true // fila local mantém; próximo toque ou "tentar de novo" reenvia
  } finally {
    salvando.value = false
  }
}
async function finalizar() {
  const msg = 'Finalizar — o link fica somente leitura e as respostas seguem para a próxima etapa.'
  if (!confirm(msg)) return
  await flush()
  await $fetch(`/api/coding/${token}/finalizar`, { method: 'POST' })
  phase.value = 'finalizado'
}
function irPara(idx: number) {
  atual.value = idx
  phase.value = 'codificando'
}
function proximo() {
  if (atual.value < itens.value.length - 1) { atual.value++; }
  else { phase.value = 'revisão' }
}
function onKey(e: KeyboardEvent) {
  if (folha.value?.modo === 'contínua' || phase.value !== 'codificando') return
  const foco = document.activeElement as HTMLElement | null
  if (foco?.classList.contains('escala') && /^[1-5]$/.test(e.key)) {
    const dim = foco.dataset.dim as 'd1' | 'd2' | 'd3'
    if (itemAtual.value) setDim(itemAtual.value, dim, Number(e.key))
  } else if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
    if (itemAtual.value && completo(itemAtual.value)) proximo()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

const dimNome = (d: { d1: number; d2: number; d3: number; naoCodificavel: boolean }) =>
  d.naoCodificavel ? '⚠' : `${d.d1}/${d.d2}/${d.d3}`
</script>

<template>
  <main class="folha">
    <p v-if="phase === 'carregando'" class="mut">carregando…</p>
    <div v-else-if="phase === 'inválido'" class="card">
      <h1>Link inválido ou expirado</h1>
      <p class="mut">Confira o link recebido com quem organizou a codificação.</p>
    </div>
    <div v-else-if="phase === 'aguardando'" class="card">
      <h1>Aguardando codificadores</h1>
      <p class="mut">Esta etapa de consenso abre quando as duas folhas cegas forem finalizadas. Volte a este link depois.</p>
    </div>
    <div v-else-if="phase === 'finalizado'" class="card">
      <h1>{{ ehConsenso ? 'Consenso registrado' : 'Codificação entregue' }}</h1>
      <p class="mut">Este link está somente leitura. Obrigado!</p>
    </div>

    <template v-else>
      <div v-if="phase === 'intro'" class="card">
        <h1>{{ ehConsenso ? 'Consenso — codificação C2' : 'Codificação — completudes de frases' }}</h1>
        <p>
          Você vai avaliar <strong>{{ itens.length }} itens</strong> em 3 dimensões (1–5):
          valência, especificidade e evasão. Não há prazo — pode pausar e
          <strong>voltar outro dia por este mesmo link</strong> (o rascunho salva sozinho).
        </p>
        <p class="mut">Estimativa: 2–4 horas. As âncoras ficam sempre a um clique (botão “manual”).</p>
        <button class="acao" @click="phase = 'codificando'">começar</button>
        <button class="acao secundario" @click="manualAberto = true">ver o manual antes</button>
      </div>

      <!-- MODO CONTÍNUA: folha única -->
      <template v-if="phase === 'codificando' && folha?.modo === 'contínua'">
        <div class="topo">
          <span class="mut">respondidos {{ nCompletos }}/{{ itens.length }}</span>
          <div class="pbar"><div :style="{ width: (nCompletos / itens.length) * 100 + '%' }" /></div>
        </div>
        <section v-for="(i, idx) in itens" :key="i.itemIndex" class="bloco">
          <p class="mut">item {{ idx + 1 }}</p>
          <div class="card">
            <p class="stem">“{{ i.stem }}”</p>
            <p class="resp">{{ i.responseText }}</p>
          </div>
          <EscalaAncoras rotulo="D1 · Valência" :ancoras="[...ANCORAS.d1]" :nome="`d1-${i.itemIndex}`" :model-value="i.d1" @update:model-value="v => setDim(i, 'd1', v)" />
          <EscalaAncoras rotulo="D2 · Especificidade" :ancoras="[...ANCORAS.d2]" :nome="`d2-${i.itemIndex}`" :model-value="i.d2" @update:model-value="v => setDim(i, 'd2', v)" />
          <EscalaAncoras rotulo="D3 · Evasão" :ancoras="[...ANCORAS.d3]" :nome="`d3-${i.itemIndex}`" :model-value="i.d3" @update:model-value="v => setDim(i, 'd3', v)" />
          <label class="flag"><input type="checkbox" :checked="i.naoCodificavel" @change="setFlag(i, ($event.target as HTMLInputElement).checked)"> não-codificável (C5)</label>
          <details><summary class="mut">nota (opcional)</summary>
            <textarea rows="2" :value="i.nota" @input="setNota(i, ($event.target as HTMLTextAreaElement).value)" /></details>
        </section>
        <p class="salvo" :class="{ erro: erroRede }">{{ erroRede ? 'sem conexão — suas respostas seguem aqui e reenviam ao tocar de novo' : salvoEm }}</p>
        <button v-if="erroRede" class="acao" @click="flush">tentar de novo</button>
        <button class="acao" :disabled="nCompletos < itens.length" @click="phase = 'revisão'">revisar e finalizar</button>
      </template>

      <!-- MODO FOCO/COMPACTA: um item por tela -->
      <template v-else-if="phase === 'codificando'">
        <p class="mut">item {{ atual + 1 }} de {{ itens.length }}</p>
        <div class="pbar"><div :style="{ width: (atual / itens.length) * 100 + '%' }" /></div>

        <!-- CONSENSO: divergentes lado a lado -->
        <template v-if="ehConsenso && itemAtual?.par1 && itemAtual?.par2 && dimNome(itemAtual.par1) !== dimNome(itemAtual.par2)">
          <div class="par">
            <div class="card par-card"><p class="mut">folha 1</p><p class="resp">{{ dimNome(itemAtual.par1) }}</p></div>
            <div class="card par-card"><p class="mut">folha 2</p><p class="resp">{{ dimNome(itemAtual.par2) }}</p></div>
          </div>
        </template>

        <div v-if="itemAtual" class="card">
          <p class="stem">“{{ itemAtual.stem }}”</p>
          <p class="resp">{{ itemAtual.responseText }}</p>
        </div>
        <EscalaAncoras v-if="itemAtual" rotulo="D1 · Valência" :ancoras="[...ANCORAS.d1]" :compacta="compacta" :nome="`d1-${itemAtual.itemIndex}`" :model-value="itemAtual.d1" @update:model-value="v => setDim(itemAtual, 'd1', v)" />
        <EscalaAncoras v-if="itemAtual" rotulo="D2 · Especificidade" :ancoras="[...ANCORAS.d2]" :compacta="compacta" :nome="`d2-${itemAtual.itemIndex}`" :model-value="itemAtual.d2" @update:model-value="v => setDim(itemAtual, 'd2', v)" />
        <EscalaAncoras v-if="itemAtual" rotulo="D3 · Evasão" :ancoras="[...ANCORAS.d3]" :compacta="compacta" :nome="`d3-${itemAtual.itemIndex}`" :model-value="itemAtual.d3" @update:model-value="v => setDim(itemAtual, 'd3', v)" />
        <label v-if="itemAtual" class="flag"><input type="checkbox" :checked="itemAtual.naoCodificavel" @change="setFlag(itemAtual, ($event.target as HTMLInputElement).checked)"> não-codificável (C5)</label>
        <details v-if="itemAtual"><summary class="mut">nota (opcional)</summary>
          <textarea rows="2" :value="itemAtual.nota" @input="setNota(itemAtual, ($event.target as HTMLTextAreaElement).value)" /></details>

        <p class="salvo" :class="{ erro: erroRede }">{{ erroRede ? 'sem conexão — suas respostas seguem aqui e reenviam ao tocar de novo' : salvoEm }}</p>
        <button v-if="erroRede" class="acao" @click="flush">tentar de novo</button>
        <div class="nav">
          <button :disabled="atual === 0" @click="atual--">← anterior</button>
          <button :disabled="!itemAtual || !completo(itemAtual)" @click="proximo()">
            {{ atual < itens.length - 1 ? 'próximo →' : 'revisar e finalizar →' }}
          </button>
        </div>
      </template>

      <!-- REVISÃO -->
      <template v-else-if="phase === 'revisão'">
        <h1 class="h2">Revisão</h1>
        <p v-if="ehConsenso" class="mut">{{ divergentes.length }} divergência(s) entre as folhas cegas; itens idênticos herdam o valor.</p>
        <table class="rev">
          <thead><tr><th>item</th><th>D1</th><th>D2</th><th>D3</th><th>flag</th><th /></tr></thead>
          <tbody>
            <tr v-for="(i, idx) in itens" :key="i.itemIndex">
              <td>{{ idx + 1 }}</td>
              <td>{{ i.naoCodificavel ? '—' : i.d1 || '·' }}</td>
              <td>{{ i.naoCodificavel ? '—' : i.d2 || '·' }}</td>
              <td>{{ i.naoCodificavel ? '—' : i.d3 || '·' }}</td>
              <td>{{ i.naoCodificavel ? '⚠' : '' }}</td>
              <td><a href="#" @click.prevent="irPara(idx)">ir</a></td>
            </tr>
          </tbody>
        </table>
        <div class="nav">
          <button @click="phase = 'codificando'">← voltar</button>
          <button class="acao" @click="finalizar">finalizar</button>
        </div>
      </template>

      <div v-if="phase === 'codificando' || phase === 'revisão'" class="manualBtn">
        <button class="acao secundario" @click="manualAberto = true">manual</button>
      </div>
    </template>

    <Teleport to="body">
      <div v-if="manualAberto" class="scrim" @click.self="manualAberto = false">
        <aside class="manual">
          <h2>Manual de codificação <span class="mut">(v2 — leia a stance antes de começar)</span></h2>
          <h4>Stance</h4>
          <p>Leia a completude como <strong>expressão do respondente</strong> — é a voz de alguém. A valência é do que é expresso (a experiência evocada), não do tom lexical da frase. Não avalie a frase como texto: escute-a como fala.</p>
          <h4>D1 · Valência — o tom afetivo do que o respondente expressa</h4>
          <p class="mut">5 muito positiva (experiência claramente positiva: limite saudável, alívio, realização, cuidado) · 4 positiva (desfecho/relação favorável) · 3 neutra (constatação sem carga clara, ambivalência equilibrada) · 2 negativa (perda, substituição, risco não compensado) · 1 muito negativa (dano, desespero, degradação)</p>
          <p class="mut">Ex.: recusar pedido que vai contra a necessidade de quem pede = 5; "toda versão nasce para aposentar a anterior" = 2.</p>
          <h4>D2 · Especificidade — conteúdo particular × aforismo</h4>
          <p class="mut">Critério: <em>esta frase só poderia ter sido escrita por alguém com uma experiência específica, ou por qualquer um?</em> 5 idiossincrática (experiência singular) · 4 concreta (situação específica, mesmo que comum) · 3 média · 2 pouco específica · 1 genérica (verdade geral, sem experiência evocada). Concretude lexical não é especificidade.</p>
          <p class="mut">⚠ Extensão: completudes curtas raramente comportam especificidade alta — a maior parte do material curto É genérica, e lê-la assim é leitura correta, não erro. Julgue por MARCAS: sobem a nota marcadores de experiência (1ª pessoa + referente particular: "minha avó", "quando eu era criança"); mantêm baixa os universalizantes ("sempre", "todo mundo", "a vida", conselhos).</p>
          <h4>D3 · Evasão — engajamento com o stem</h4>
          <p class="mut">5 plenamente codificável (engaja o stem e o completa com conteúdo próprio) · 4 codificável · 3 mista (desvia do núcleo) · 2 bastante evasiva · 1 evasiva/estéril (repete o stem, "não sei", recusa, sem relação). Brevidade não é evasão — completude curta pode engajar plenamente.</p>
          <p class="mut">Não-codificável: apenas quando NENHUMA dimensão é codificável (vazio, sem relação com o stem) — zera D1–D3.</p>
          <button class="acao" @click="manualAberto = false">fechar</button>
        </aside>
      </div>
    </Teleport>
  </main>
</template>

<style scoped>
.folha { max-width: 720px; margin: 0 auto; padding: 1rem 1rem 5rem; min-height: 100vh; background: #111315; font-family: system-ui, sans-serif; font-size: 18px; line-height: 1.55; color: #e8eaed; }
.mut { color: #9aa0a6; font-size: .85rem; }
.card { background: #1b1e22; border: 1px solid #2a2d31; border-radius: 10px; padding: 1.1rem 1.2rem; margin-top: 1rem; }
.stem { font-style: italic; color: #c7cdd4; }
.resp { margin-top: .7rem; white-space: pre-wrap; }
.h2 { font-size: 1.1rem; }
.pbar { height: 3px; background: #2a2d31; border-radius: 99px; margin-top: .4rem; }
.pbar > div { height: 100%; background: #7cb1ff; border-radius: 99px; transition: width .2s; }
.nav { display: flex; justify-content: space-between; margin-top: 1.4rem; }
.nav button, .acao { background: none; border: 1px solid #2a2d31; color: #7cb1ff; border-radius: 8px; padding: .5rem 1rem; font-size: .95rem; cursor: pointer; }
.nav button:disabled { opacity: .35; cursor: default; }
.acao { background: #16341f; border-color: #2f5a3c; color: #7ce05c; }
.acao:disabled { opacity: .35; cursor: default; }
.acao.secundario { background: none; color: #7cb1ff; border-color: #2a2d31; }
.flag { display: flex; gap: .5rem; align-items: center; margin-top: 1.2rem; color: #9aa0a6; font-size: .9rem; cursor: pointer; }
.flag input { width: 18px; height: 18px; }
details { margin-top: .4rem; }
textarea { width: 100%; background: #1b1e22; color: #e8eaed; border: 1px solid #2a2d31; border-radius: 8px; padding: .5rem; font: inherit; }
.salvo { color: #7ce05c; font-size: .8rem; min-height: 1.1rem; margin-top: 1rem; }
.salvo.erro { color: #e74c3c; }
table.rev { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: .9rem; }
.rev th, .rev td { text-align: left; padding: .4rem .5rem; border-bottom: 1px solid #2a2d31; }
.rev th { color: #9aa0a6; font-weight: 500; }
.rev a { color: #7cb1ff; }
.bloco { border-top: 2px solid #2a2d31; margin-top: 2rem; padding-top: .5rem; }
.topo { position: sticky; top: 0; background: #111315; padding: .4rem 0; }
.par { display: flex; gap: .6rem; }
.par-card { flex: 1; }
.manualBtn { position: fixed; right: 1rem; bottom: 1rem; }
.scrim { position: fixed; inset: 0; background: #000a; display: flex; justify-content: flex-end; z-index: 30; }
.manual { width: min(380px, 92vw); background: #0c0d0f; border-left: 1px solid #2a2d31; padding: 1rem 1.2rem; overflow: auto; }
.manual h4 { margin: 1rem 0 .2rem; color: #7cb1ff; }
</style>
