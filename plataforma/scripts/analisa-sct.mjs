#!/usr/bin/env node
// Análise v0 da rodada SCT (OZP-428, D3 descritivo): replay determinístico do
// motor reconstrói trialSeq→estímulo (a apresentação é embaralhada pela seed —
// pareamento só por replay). Contrastes: v1×v2 (re-prompt, mesmos stems na
// mesma ordem por seed) e resposta→inquérito (manchas v2, por mancha).
// Uso: npx tsx scripts/analisa-sct.mjs <dump.json>
import { readFileSync } from 'node:fs'
import { MtsEngine } from '../core/engine/engine'

const PKG = {
  'Frases incompletas (SCT)': '../experiments/sct-frases/experiment.json',
  'Frases incompletas com detalhamento (SCT)': '../experiments/sct-frases-v2/experiment.json',
  'Manchas ASCII (projetivo visual)': '../experiments/manchas-ascii/experiment.json',
  'Manchas ASCII com inquérito (projetivo visual)': '../experiments/manchas-ascii-v2/experiment.json',
  'Manchas ASCII sem sujeito (projetivo visual)': '../experiments/manchas-ascii-v3/experiment.json',
}
const docs = Object.fromEntries(Object.entries(PKG).map(([t, p]) => [t, JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'))]))

/** trialSeq → tentativa apresentada (stem/visualText), via replay da seed. */
function presented(doc, seed) {
  const engine = new MtsEngine(doc, seed)
  const map = new Map()
  for (;;) {
    const ev = engine.next()
    if (ev.kind === 'sessionEnd') break
    if (ev.kind === 'textTrial') {
      map.set(ev.presentation.trialSeq, ev.presentation.trial)
      engine.respondText('replay')
    }
  }
  return map
}

const len = t => (t ?? '').length
const words = t => new Set((t ?? '').toLowerCase().match(/[a-zà-ú]{3,}/g) ?? [])
const intersecao = (a, b) => { let n = 0; for (const w of a) if (b.has(w)) n++; return n }

const dump = JSON.parse(readFileSync(process.argv[2] ?? '/home/ozp/code/f5-aplicador/dados-rodada-sct.json', 'utf8'))
const porSessao = dump.map(s => {
  const map = presented(docs[s.title], s.seed)
  return { ...s, pares: s.rows.map(r => ({ ...r, trial: map.get(r.trialSeq) })) }
})

console.log('# Rodada SCT — análise v0 (descritiva)\n')
console.log('## Por sessão\n')
console.log('| modelo | instrumento | seed | n | média chars | mín | máx | latência média |')
console.log('|---|---|---|---|---|---|---|---|')
for (const s of porSessao) {
  const ls = s.rows.map(r => len(r.text))
  const lat = s.rows.map(r => r.latencyMs ?? 0)
  console.log(`| ${s.model.replace(/^qwencloud-/, '').replace(/-flash-lite$/, '')} | ${s.title.replace(/ \(.*\)/, '')} | ${s.seed} | ${s.rows.length} | ${Math.round(ls.reduce((a, b) => a + b, 0) / ls.length)} | ${Math.min(...ls)} | ${Math.max(...ls)} | ${Math.round(lat.reduce((a, b) => a + b, 0) / lat.length)}ms |`)
}

// contraste v1×v2 por stem (mesma seed ⇒ mesma ordem — trials idênticos nos docs)
console.log('\n## Contraste v1 × v2 (re-prompt) — mesmo stem, mesma seed\n')
const v1 = porSessao.filter(s => s.title.startsWith('Frases incompletas ('))
const v2 = porSessao.filter(s => s.title.startsWith('Frases incompletas com'))
for (const seed of [...new Set([...v1.map(s => s.seed), ...v2.map(s => s.seed)])].sort()) {
  const a = v1.find(s => s.seed === seed), b = v2.find(s => s.seed === seed)
  if (!a || !b) { console.log(`- seed ${seed}: faltando ${a ? 'v2' : 'v1'}`); continue }
  console.log(`\n### seed ${seed}`)
  console.log('| stem | v1 (chars) | v2 (chars) | Δ |')
  console.log('|---|---|---|---|')
  for (const pa of a.pares) {
    const pb = b.pares.find(x => x.trialSeq === pa.trialSeq)
    if (!pb) continue
    console.log(`| ${(pa.trial ? pa.trial.stem : '?').slice(0, 40)} | ${len(pa.text)} | ${len(pb.text)} | ${len(pb.text) - len(pa.text)} |`)
  }
}

// manchas v2: resposta → inquérito por mancha (pareamento por visualText)
console.log('\n## Manchas com inquérito — desenvolvimento por mancha\n')
const mv2 = porSessao.filter(s => s.title.startsWith('Manchas ASCII com'))
for (const s of mv2) {
  console.log(`\n### seed ${s.seed}`)
  console.log('| mancha | resposta (chars) | inquérito (chars) | palavras em comum | palavras novas |')
  console.log('|---|---|---|---|---|')
  const resp = s.pares.filter(p => p.blockName === 'resposta')
  const inq = s.pares.filter(p => p.blockName === 'inquerito')
  for (const r of resp) {
    const i = inq.find(x => (x.trial && r.trial && x.trial.visualText === r.trial.visualText))
    if (!i) continue
    const wr = words(r.text), wi = words(i.text)
    const novas = [...wi].filter(w => !wr.has(w)).length
    console.log(`| blot ${resp.indexOf(r) + 1} | ${len(r.text)} | ${len(i.text)} | ${intersecao(wr, wi)} | ${novas} |`)
  }
}
