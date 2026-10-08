#!/usr/bin/env node
// Seed do ambiente de dev: promove admin, submete o experimento de exemplo
// (assets de public/stimuli), publica o termo v1 e imprime a URL pronta.
// Uso: node scripts/seed-local.mjs [baseUrl]
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import postgres from 'postgres'
import { hash } from '@node-rs/argon2'

const base = process.argv[2] ?? 'http://localhost:3312'
const dbUrl = process.env.DATABASE_URL ?? 'postgres://plataforma:plataforma_dev@localhost:5543/experimentos'
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@local.dev'
// contra instância remota (prod): exporte SEED_ADMIN_PASSWORD e SEED_SKIP_DB=1
// (admin já bootstrapado por outro meio; o upsert local não deve rodar lá)
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'dev-admin-password'

const doc = {
  schemaVersion: 1,
  docVersion: '',
  title: 'Equivalência de estímulos AB/AC (piloto local)',
  description: 'Treino AB e AC com teste de equivalência — adaptado do exemplo PyMTS.',
  language: 'pt-BR',
  feedback: { text: 'Obrigado por participar: suas respostas foram registradas para pesquisa.' },
  experiment: {
    screenColor: [0, 0, 0], itiSeconds: 0, volume: 0.5, startBlock: 1, endTextRef: 'right.svg',
    blocks: [
      { name: 'ABtraining', display: { kind: 'SMTS' }, criterion: 2, maxRepetitions: 3, trials: [
        { sample: ['a1.svg'], sampleSoundRef: 'a1s.wav', comparisons: ['b1.svg', 'b2.svg'], correct: 'b1.svg',
          consequence: { correct: { imageRef: 'right.svg', durationSeconds: 0.5 }, incorrect: { imageRef: 'wrong.svg', durationSeconds: 0.5 } } },
        { sample: ['a2.svg'], sampleSoundRef: 'a2s.wav', comparisons: ['b1.svg', 'b2.svg'], correct: 'b2.svg',
          consequence: { correct: { imageRef: 'right.svg', durationSeconds: 0.5 }, incorrect: { imageRef: 'wrong.svg', durationSeconds: 0.5 } } },
      ] },
      { name: 'ACtraining', display: { kind: 'DMTS', delaySeconds: 2 }, criterion: 2, maxRepetitions: 3, trials: [
        { sample: ['a1.svg'], comparisons: ['c1.svg', 'c2.svg'], correct: 'c1.svg',
          consequence: { correct: { soundRef: 'ding.wav', durationSeconds: 0.8 }, incorrect: { durationSeconds: 0.8 } } },
        { sample: ['a2.svg'], comparisons: ['c1.svg', 'c2.svg'], correct: 'c2.svg',
          consequence: { correct: { soundRef: 'ding.wav', durationSeconds: 0.8 }, incorrect: { durationSeconds: 0.8 } } },
      ] },
      { name: 'testEq', instructionText: 'A partir de agora, as respostas não terão consequências.', display: { kind: 'SMTS' }, criterion: 1, maxRepetitions: 1, trials: [
        { sample: ['ctx1.svg', 'a1.svg'], comparisons: ['b1.svg', 'c1.svg'], correct: 'b1.svg',
          consequence: { correct: { durationSeconds: 0 }, incorrect: { durationSeconds: 0 } } },
      ] },
    ],
  },
}

// 1) admin de dev direto no banco (bootstrap, senha conhecida de dev)
const sql = process.env.SEED_SKIP_DB ? null : postgres(dbUrl, { max: 1 })
if (sql) {
  const adminHash = await hash(ADMIN_PASSWORD)
  // dev-only: reseta senha e remove MFA do admin local para o seed ser idempotente
  await sql`INSERT INTO user_accounts (email, password_hash, role, status)
    VALUES (${ADMIN_EMAIL}, ${adminHash}, 'admin', 'active')
    ON CONFLICT (email) DO UPDATE SET role = 'admin', status = 'active', password_hash = ${adminHash}, totp_secret_enc = NULL`
  await sql.end()
}
console.log(`admin garantido: ${ADMIN_EMAIL}${process.env.SEED_SKIP_DB ? ' (remoto — SEED_SKIP_DB)' : ''}`)

// 2) login (sem MFA — conta nova não tem TOTP)
const login = await fetch(`${base}/api/auth/login`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
})
if (login.ok) {
  const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0]
  await seedRest(cookie)
} else {
  // senha não é a do bootstrap: registra admin de dev com senha conhecida
  console.log('senha do admin não é a padrão — ajuste manual necessário (ou recrie a conta)')
  process.exit(1)
}

async function seedRest(cookie) {
  // submete e publica cada experimento (doc + pasta de estímulos)
  await seedExperiment(cookie, {
    doc,
    dir: new URL('../public/stimuli', import.meta.url).pathname,
    termo: 'Você participará de um experimento de equivalência de estímulos (pesquisa). Não há riscos previstos; dados pseudonimizados; participação voluntária, interrompível a qualquer momento. Ambiente de desenvolvimento local.',
  })
  // Stroop (Story 3.6): pacote autorado em experiments/stroop-victoria
  await seedExperiment(cookie, {
    doc: JSON.parse(readFileSync(new URL('../experiments/stroop-victoria/experiment.json', import.meta.url), 'utf8')),
    dir: new URL('../experiments/stroop-victoria', import.meta.url).pathname,
    termo: 'Você participará de uma tarefa de atenção (Stroop) de pesquisa: verá palavras coloridas e tocará na cor da tinta. Não há riscos previstos; dados pseudonimizados; participação voluntária, interrompível a qualquer momento. Ambiente de desenvolvimento local.',
  })
  // Go/No-Go compostos (Story 3.7): pacote autorado em experiments/gng-compostos
  await seedExperiment(cookie, {
    doc: JSON.parse(readFileSync(new URL('../experiments/gng-compostos/experiment.json', import.meta.url), 'utf8')),
    dir: new URL('../experiments/gng-compostos', import.meta.url).pathname,
    termo: 'Você participará de uma tarefa de pesquisa com pares de símbolos: deverá tocar na tela quando os símbolos forem relacionados e aguardar quando não forem. Não há riscos previstos; dados pseudonimizados; participação voluntária, interrompível a qualquer momento. Ambiente de desenvolvimento local.',
  })
  // N-back de letras (Story 3.8): pacote autorado em experiments/nback-letras
  await seedExperiment(cookie, {
    doc: JSON.parse(readFileSync(new URL('../experiments/nback-letras/experiment.json', import.meta.url), 'utf8')),
    dir: new URL('../experiments/nback-letras', import.meta.url).pathname,
    termo: 'Você participará de uma tarefa de memória de pesquisa: letras aparecerão uma a uma e você tocará quando uma letra se repetir conforme instruído. Não há riscos previstos; dados pseudonimizados; participação voluntária, interrompível a qualquer momento. Ambiente de desenvolvimento local.',
  })
  // Probe nº 1 do F5 (Story F5.2): 5 condições de consequência, mesmas tentativas
  for (const cond of ['controle', 'sobrevivencia', 'reforco-social', 'material', 'espiritual']) {
    await seedExperiment(cookie, {
      doc: JSON.parse(readFileSync(new URL(`../experiments/probe-mts-consequencias/${cond}/experiment.json`, import.meta.url), 'utf8')),
      dir: new URL(`../experiments/probe-mts-consequencias/${cond}`, import.meta.url).pathname,
      termo: `Você participará de uma tarefa de pesquisa de combinação de símbolos abstratos (condição ${cond}), com ou sem mensagens de feedback após suas respostas. Não há riscos previstos; dados pseudonimizados; participação voluntária, interrompível a qualquer momento. Ambiente de desenvolvimento local.`,
    })
  }
}

async function seedExperiment(cookie, { doc, dir, termo }) {
  const form = new FormData()
  form.append('document', new Blob([JSON.stringify(doc)], { type: 'application/json' }), 'experiment.json')
  for (const f of readdirSync(dir)) {
    if (f === 'experiment.json') continue // pacotes autorados trazem o doc na própria pasta
    form.append(f, new Blob([readFileSync(join(dir, f))]), f)
  }
  const sub = await fetch(`${base}/api/experiments`, { method: 'POST', headers: { cookie }, body: form })
  const subBody = await sub.json()
  if (!sub.ok) throw new Error(`submissão: ${sub.status} ${subBody.statusMessage}`)
  console.log(`experimento ${subBody.status}: ${subBody.docVersion}`)

  // publica o termo (idempotente por versão nova — executa 1x por run)
  const term = await fetch(`${base}/api/experiments/${subBody.docVersion}/terms`, {
    method: 'POST', headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ body: termo }),
  })
  const termBody = await term.json()
  if (!term.ok) throw new Error(`termo: ${term.status} ${termBody.statusMessage}`)
  console.log(`termo v${termBody.version} publicado`)

  const pub = await fetch(`${base}/api/experiments/${subBody.docVersion}/publish`, { method: 'POST', headers: { cookie } })
  if (!pub.ok) throw new Error(`publicação: ${pub.status}`)
  console.log('experimento publicado no catálogo')

  // convite (Story 3.1): registro fechado — o seed emite um link por experimento
  const inv = await fetch(`${base}/api/admin/invites`, {
    method: 'POST', headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ docVersion: subBody.docVersion }),
  })
  const invBody = await inv.json()
  if (!inv.ok) throw new Error(`convite: ${inv.status} ${invBody.statusMessage}`)

  console.log(`\nURL do experimento: ${base}/run/${subBody.docVersion}`)
  console.log(`URL com convite:     ${base}${invBody.inviteUrl}`)
}
