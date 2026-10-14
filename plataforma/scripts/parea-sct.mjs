#!/usr/bin/env node
// Pareamento determinístico da rodada do elenco (OZP-428/433): replay da seed
// reconstrói trialSeq→estímulo (AD-2) e anexa stem/blotId a cada row do dump
// do banco — base para embeddings, M2/M3/M5 e análise de conteúdo.
// Uso: npx tsx scripts/parea-sct.mjs <dump.json> [saída-pareado.json]
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { MtsEngine } from '../core/engine/engine'

const PKG = {
  'Frases incompletas (SCT)': '../experiments/sct-frases/experiment.json',
  'Frases incompletas com detalhamento (SCT)': '../experiments/sct-frases-v2/experiment.json',
  'Manchas ASCII (projetivo visual)': '../experiments/manchas-ascii/experiment.json',
  'Manchas ASCII com inquérito (projetivo visual)': '../experiments/manchas-ascii-v2/experiment.json',
}
const docs = Object.fromEntries(Object.entries(PKG).map(([t, p]) => [t, JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'))]))

// nome curto de família (as duas primeiras preservam as chaves de embeddings-sct-v1)
const FAM = {
  'gemini-3.1-flash-lite': 'gemini',
  'z-ai/glm-4.5v': 'glm',
  'glm-5.3-flash': 'glm53',
  'gpt-6-luna': 'luna',
  'gpt-oss-120b': 'gptoss',
  'qwencloud-qwen3.8-flash': 'qwen',
  'sensenova-6.8-flash-lite': 'sensenova',
}
const fam = m => FAM[m] ?? m.replace(/[^a-z0-9]/gi, '').toLowerCase()

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

const dump = JSON.parse(readFileSync(process.argv[2] ?? '/home/ozp/code/f5-aplicador/dados-rodada-sct.json', 'utf8'))
const out = []
for (const s of dump) {
  if (!docs[s.title]) throw new Error(`instrumento fora do escopo: ${s.title}`)
  const map = presented(docs[s.title], s.seed)
  out.push({
    fam: fam(s.model), model: s.model, seed: s.seed, title: s.title, sessionId: s.sessionId,
    rows: s.rows.map(r => {
      const t = map.get(r.trialSeq) ?? {}
      return {
        ...r,
        stem: t.stem ?? null,
        blotId: t.visualText ? createHash('sha1').update(t.visualText).digest('hex').slice(0, 8) : null,
      }
    }),
  })
}

const dest = process.argv[3] ?? '/home/ozp/code/f5-aplicador/dados-rodada-sct-pareado.json'
writeFileSync(dest, JSON.stringify(out))

// resumo de cobertura (verificação)
const cov = new Map()
for (const s of out) {
  const k = `${s.fam}|${s.title.replace(/ \(.*\)/, '')}|${s.seed}`
  cov.set(k, (cov.get(k) ?? 0) + s.rows.length)
}
console.log(`# ${out.length} sessões pareadas → ${dest}\n`)
for (const [k, n] of [...cov.entries()].sort()) console.log(`${k.padEnd(38)} ${n} rows`)
