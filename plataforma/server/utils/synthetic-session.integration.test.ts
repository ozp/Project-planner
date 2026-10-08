// Story F5.1 — sessão sintética (OZP-415): abrir sem consentimento, plano
// sem vazar `correct`, pontuação SERVER-SIDE por tentativa (o manager nunca
// vê a resposta certa — só o certo/errado que um humano receberia), TrialResult
// canônico synthetic (inference, sem timing). Exige o Postgres do compose.
import type { Sql } from 'postgres'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { fixtureExperiment } from '@core/schema'
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

const DOC = structuredClone(fixtureExperiment)

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
    await sql`INSERT INTO stimulus_assets (sha1, content_type, size_bytes) VALUES (${'sh-' + Math.random()}, 'image/svg+xml', 10) ON CONFLICT DO NOTHING`
    const sha = (await sql`SELECT sha1 FROM stimulus_assets ORDER BY size_bytes DESC LIMIT 1`)[0]!.sha1
    await sql`INSERT INTO experiment_assets (doc_version, ref, sha1) VALUES (${docVersion}::uuid, ${ref}, ${sha}) ON CONFLICT DO NOTHING`
  }
})
afterAll(async () => { if (available) await sql.end() })

describe.skipIf(!available)('openSyntheticSession', () => {
  it('abre sem consentimento/usuário, com meta do modelo e pseudônimo estável', async () => {
    const a = await openSyntheticSession(sql, { docVersion, modelRef: 'gemini-3.1-flash-lite', temperature: 0, seed: 42 })
    const b = await openSyntheticSession(sql, { docVersion, modelRef: 'gemini-3.1-flash-lite', temperature: 0, seed: 42 })
    expect(a.sessionId).toBeTruthy()
    const [row] = await sql`SELECT respondent, user_id, consent_term_id, pseudonym, synthetic_meta
      FROM sessions WHERE id = ${a.sessionId}::uuid`
    expect(row.respondent).toBe('synthetic')
    expect(row.user_id).toBeNull()
    expect(row.consent_term_id).toBeNull()
    expect(row.pseudonym).toBe(b && (await sql`SELECT pseudonym FROM sessions WHERE id=${b.sessionId}::uuid`)[0]!.pseudonym)
    expect(row.synthetic_meta).toMatchObject({ modelRef: 'gemini-3.1-flash-lite', temperature: 0 })
  })

  it('plano determinístico por seed: sequência de tentativas + URLs, SEM correct', async () => {
    const a = await openSyntheticSession(sql, { docVersion, modelRef: 'm', seed: 7 })
    const b = await openSyntheticSession(sql, { docVersion, modelRef: 'm', seed: 7 })
    const c = await openSyntheticSession(sql, { docVersion, modelRef: 'm', seed: 8 })
    expect(a.plan.map(p => p.sampleRefs.join())).toEqual(b.plan.map(p => p.sampleRefs.join()))
    expect(a.plan.length).toBeGreaterThan(0)
    expect(JSON.stringify(a.plan)).not.toContain('correct')
    for (const p of a.plan) {
      expect(p.optionRefs.length).toBeGreaterThanOrEqual(2)
      for (const u of p.optionUrls) expect(u).toMatch(/\/api\/assets\//)
    }
    // a doc tem 5 tentativas na passagem perfeita (2 AB + 2 AC + 1 teste)
    expect(a.plan).toHaveLength(5)
    expect(a.plan.map(p => p.trialSeq)).toEqual([0, 1, 2, 3, 4])
    void c
  })
})

describe.skipIf(!available)('respondTrial — pontuação server-side', () => {
  it('responde certo/errado conforme o documento e grava TrialResult synthetic (inference, sem timing)', async () => {
    const s = await openSyntheticSession(sql, { docVersion, modelRef: 'glm-4.5v', seed: 42 })
    // seq 0 = ABtraining t0: sample a1 → correct b1.svg (fixture)
    const r0 = await respondTrial(sql, {
      sessionId: s.sessionId, trialSeq: 0, selectedRef: 'b1.svg',
      inference: { modelRef: 'glm-4.5v', provider: 'zhipu', route: 'byok', latencyMs: 1234 },
    })
    expect(r0.correct).toBe(true)
    // resposta errada numa sessão LIMPA (reenvio na mesma sessão devolve a 1ª — ver teste abaixo)
    const s2 = await openSyntheticSession(sql, { docVersion, modelRef: 'glm-4.5v', seed: 42 })
    const r0b = await respondTrial(sql, {
      sessionId: s2.sessionId, trialSeq: 0, selectedRef: 'b2.svg',
      inference: { modelRef: 'glm-4.5v', provider: 'zhipu', route: 'byok', latencyMs: 99 },
    })
    expect(r0b.correct).toBe(false)
    const [row] = await sql`SELECT payload FROM trial_results WHERE session_id=${s.sessionId}::uuid AND trial_seq=0`
    expect(row.payload).toMatchObject({ respondentClass: 'synthetic', correct: true })
    expect(row.payload.response).toEqual({ selectedRef: 'b1.svg' })
    expect(row.payload.timing).toBeUndefined()
    expect(row.payload.inference).toMatchObject({ modelRef: 'glm-4.5v', latencyMs: 1234 })
  })

  it('reenvio da mesma tentativa é idempotente (primeira resposta vale)', async () => {
    const s = await openSyntheticSession(sql, { docVersion, modelRef: 'm2', seed: 42 })
    const a = await respondTrial(sql, { sessionId: s.sessionId, trialSeq: 0, selectedRef: 'b1.svg',
      inference: { modelRef: 'm2', provider: 'x', route: 'byok', latencyMs: 1 } })
    const b = await respondTrial(sql, { sessionId: s.sessionId, trialSeq: 0, selectedRef: 'b2.svg',
      inference: { modelRef: 'm2', provider: 'x', route: 'byok', latencyMs: 2 } })
    expect(b.correct).toBe(a.correct)
    const n = await sql`SELECT count(*)::int AS n FROM trial_results WHERE session_id=${s.sessionId}::uuid`
    expect(n[0]!.n).toBe(1)
  })

  it('trial_seq fora do plano é rejeitado; última tentativa fecha a sessão', async () => {
    const s = await openSyntheticSession(sql, { docVersion, modelRef: 'm3', seed: 42 })
    await expect(respondTrial(sql, { sessionId: s.sessionId, trialSeq: 99, selectedRef: 'b1.svg',
      inference: { modelRef: 'm3', provider: 'x', route: 'byok', latencyMs: 1 } }))
      .rejects.toMatchObject({ statusCode: 422 })
    // responde com opções VÁLIDAS do plano (a 1ª opção de cada tentativa)
    const responder = s.plan.map(p => p.optionRefs[0]!)
    for (const seq of [0, 1, 2, 3, 4]) {
      await respondTrial(sql, { sessionId: s.sessionId, trialSeq: seq, selectedRef: responder[seq]!,
        inference: { modelRef: 'm3', provider: 'x', route: 'byok', latencyMs: 1 } })
    }
    const [row] = await sql`SELECT status FROM sessions WHERE id=${s.sessionId}::uuid`
    expect(row.status).toBe('closed')
  })
})

describe.skipIf(!available)('sessionsForExport — filtro por classe', () => {
  it('separa synthetic de human (CAP-4 mínimo)', async () => {
    const s = await openSyntheticSession(sql, { docVersion, modelRef: 'm4', seed: 1 })
    void s
    const syn = await sessionsForExport(sql, docVersion, 'synthetic')
    const hum = await sessionsForExport(sql, docVersion, 'human')
    expect(syn.length).toBeGreaterThanOrEqual(1)
    expect(hum).toHaveLength(0)
    const all = await sessionsForExport(sql, docVersion)
    expect(all.length).toBe(syn.length)
  })
})
