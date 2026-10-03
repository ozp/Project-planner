#!/usr/bin/env node
// Submete um experimento: pasta com experiment.json + arquivos de estímulo.
// Uso: node scripts/submit-experiment.mjs ./caminho/da/pasta [http://localhost:3312]
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const [dir, base = 'http://localhost:3312'] = process.argv.slice(2)
if (!dir) {
  console.error('uso: node scripts/submit-experiment.mjs <pasta com experiment.json> [baseUrl]')
  process.exit(1)
}

const files = readdirSync(dir).filter(f => f !== 'experiment.json')
const form = new FormData()
form.append('document', new Blob([readFileSync(join(dir, 'experiment.json'))], { type: 'application/json' }), 'experiment.json')
for (const f of files) {
  const buf = readFileSync(join(dir, f))
  form.append(f, new Blob([buf]), f)
}

const res = await fetch(`${base}/api/experiments`, { method: 'POST', body: form })
const body = await res.json().catch(() => ({}))
if (!res.ok) {
  console.error(`erro ${res.status}: ${body.statusMessage ?? res.statusText}`)
  process.exit(1)
}
console.log(`${body.status} — docVersion: ${body.docVersion}`)
console.log(`carga: ${base}/api/experiments/${body.docVersion}`)
