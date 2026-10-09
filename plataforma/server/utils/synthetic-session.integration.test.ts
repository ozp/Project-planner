// Story F5.1/F5.4 — sessão sintética DINÂMICA: o motor consome as respostas
// reais e blocos repetem até o critério (aquisição = nº de passagens até o
// mastery, como com humanos). Sem vazamento de `correct`; pontuação server-side;
// TrialResult synthetic (inference, sem timing). Exige o Postgres do compose.
import type { Sql } from 'postgres'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { fixtureExperiment } from '@core/schema'
import { MtsEngine } from '@core/engine/engine'
import { openSyntheticSession, respondTrial, sessionsForExport } from './synthetic-session'

const DB_URL = process.env.DATABASE_URL_TESTS ?? 'postgres://plataforma:plataforma_dev@localhost:5543/experimentos'

let sql: Sql
let available = true
try {
  sql = postgres(DB_URL, { max: 1, connect_timeout: 3 })
  await sql`SELECT 1`
} catch {
  available = false
}

const DOC = structuredClone(fixtureExperiment) // AB crit 2/2 maxRep 3; AC idem; teste 1/1
let docVersion = ''
beforeAll(async () => {
  if (!available) return
  const [row] = await sql`INSERT INTO experiment_docs (document, content_sha1, published)
    VALUES (${sql.json(DOC)}, ${`syn-${Math.random()}`}, true) RETURNING doc_version::text AS v`
  docVersion = row!.v as string
  const refs = new Set<string>()
  for (const b of DOC.experiment.blocks) for (const t of b.trials) {
    t.sample.forEach(r => refs.add(r)); t.comparisons.forEach(r => refs.add(r))
  }
  for (const ref of refs) {
    const sha1 = `sh-${Math.random().toString(36).slice(2)}`
    await sql`INSERT INTO stimulus_assets (sha1, content_type, size_bytes) VALUES (${sha1}, 'image/svg+xml', 10) ON CONFLICT DO NOTHING`
    await sql`INSERT INTO experiment_assets (doc_version, ref, sha1) VALUES (${docVersion}::uuid, ${ref}, ${sha1}) ON CONFLICT DO NOTHING`
  }
})
afterAll(async () => { if (available) await sql.end() })

const INF = { modelRef: 'teste', provider: 'x', route: 'byok' as const, latencyMs: 7 }

describe.skipIf(!available)('sessão sintética dinâmica', () => {
  it('abre sem consentimento com a 1ª tentativa (sem correct) e instruções', async () => {
    const s = await openSyntheticSession(sql, { docVersion, modelRef: 'm', seed: 42 })
    expect(s.sessionId).toBeTruthy()
    expect(s.primeira.trialSeq).toBe(0)
    expect(s.primeira.optionRefs.length).toBeGreaterThanOrEqual(2)
    expect(JSON.stringify(s.primeira)).not.toContain('correct')
    expect(s.instructions.length).toBeGreaterThan(0)
    const [row] = await sql`SELECT respondent, user_id, consent_term_id, synthetic_meta FROM sessions WHERE id = ${s.sessionId}::uuid`
    expect(row.respondent).toBe('synthetic')
    expect(row.user_id).toBeNull()
    expect(row.consent_term_id).toBeNull()
    expect(row.synthetic_meta).toMatchObject({ modelRef: 'm' })
  })

  it('respondente PERFEITO: 5 tentativas e fim (critério na 1ª passagem)', async () => {
    // chave de respostas legítima no teste: o motor é determinístico — o teste
    // o replaya alimentando as respostas certas (papel do pesquisador)
    const engine = new MtsEngine(DOC, 42)
    const chave = new Map<number, string>()
    for (;;) {
      const ev = engine.next()
      if (ev.kind === 'sessionEnd') break
      if (ev.kind !== 'trial') continue
      chave.set(ev.presentation.trialSeq, ev.presentation.trial.correct)
      engine.respond(ev.presentation.trial.correct)
    }
    const s = await openSyntheticSession(sql, { docVersion, modelRef: 'ok', seed: 42 })
    let atual: typeof s.primeira | null = s.primeira
    const seq: number[] = []
    let fim = ''
    for (let i = 0; i < 10 && atual; i++) {
      seq.push(atual.trialSeq)
      const r = await respondTrial(sql, { sessionId: s.sessionId, trialSeq: atual.trialSeq,
        selectedRef: chave.get(atual.trialSeq)!, inference: INF })
      expect(r.correct).toBe(true)
      atual = r.proxima
      fim = r.motivoFim ?? ''
    }
    expect(seq).toEqual([0, 1, 2, 3, 4])
    expect(atual).toBeNull()
    expect(fim).toBe('completed')
    const [row] = await sql`SELECT status FROM sessions WHERE id = ${s.sessionId}::uuid`
    expect(row.status).toBe('closed')
  })

  it('respondente NO ACASO: blocos REPETEM até maxRepetitions e a sessão termina com motivo', async () => {
    const s = await openSyntheticSession(sql, { docVersion, modelRef: 'azarado', seed: 42 })
    let atual: typeof s.primeira | null = s.primeira
    let respostas = 0
    let fim: string | undefined
    // erra SEMPRE (escolhe a 1ª opção quando ela NÃO é a correta… sem saber qual é:
    // tenta 1ª; se correta, tenta a 2ª para errar por idempotência… simplesmente
    // responde sempre a 1ª opção — na fixture isso erra ~metade; o critério 2/2
    // não será atingido em AB → repete até 3 → sessão termina por maxRepetitions
    for (let i = 0; i < 30 && atual; i++) {
      const r = await respondTrial(sql, { sessionId: s.sessionId, trialSeq: atual.trialSeq, selectedRef: atual.optionRefs[0]!, inference: INF })
      respostas++
      atual = r.proxima
      fim = r.motivoFim
    }
    // AB com 2 tentativas, critério 2, maxRep 3: se a 1ª opção não é a correta em
    // ambas → 0 acertos por passagem → 3 passagens = 6 respostas e fim
    expect(respostas).toBeGreaterThan(5) // repetiu bloco
    expect(atual).toBeNull()
    expect(fim).toBeTruthy()
    const [row] = await sql`SELECT status FROM sessions WHERE id = ${s.sessionId}::uuid`
    expect(row.status).toBe('closed')
  })

  it('trial_seq fora do plano corrente é rejeitado', async () => {
    const s = await openSyntheticSession(sql, { docVersion, modelRef: 'x', seed: 42 })
    await expect(respondTrial(sql, { sessionId: s.sessionId, trialSeq: 99, selectedRef: 'b1.svg', inference: INF }))
      .rejects.toMatchObject({ statusCode: 422 })
  })

  it('TrialResult canônico: synthetic com inference, sem timing; filtro por classe', async () => {
    const s = await openSyntheticSession(sql, { docVersion, modelRef: 'chk', seed: 42 })
    await respondTrial(sql, { sessionId: s.sessionId, trialSeq: 0, selectedRef: s.primeira.optionRefs[0]!,
      inference: { modelRef: 'chk', provider: 'x', route: 'byok', latencyMs: 1 } })
    const [row] = await sql`SELECT payload FROM trial_results WHERE session_id = ${s.sessionId}::uuid AND trial_seq = 0`
    expect(row.payload).toMatchObject({ respondentClass: 'synthetic' })
    expect(row.payload.timing).toBeUndefined()
    expect(row.payload.inference).toMatchObject({ modelRef: 'chk' })
    const syn = await sessionsForExport(sql, docVersion, 'synthetic')
    const hum = await sessionsForExport(sql, docVersion, 'human')
    expect(syn.length).toBeGreaterThanOrEqual(1)
    expect(hum).toHaveLength(0)
  })
})
