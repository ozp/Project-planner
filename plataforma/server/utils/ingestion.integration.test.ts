// Integração da ingestão (Story 1.5) — exige o Postgres do compose:
//   docker compose -f deploy/compose.yaml up -d db && pnpm db:migrate
// Sem banco disponível, o teste é pulado (CI sem serviço ainda — F1).
import { afterAll, describe, expect, it } from 'vitest'
import postgres from 'postgres'
import { issueUploadToken } from '../../server/utils/upload-token'
import type { TrialResult } from '../../schema'

const DB_URL = process.env.DATABASE_URL_TESTS ?? 'postgres://plataforma:plataforma_dev@localhost:5543/experimentos'

let available = true
const sql = postgres(DB_URL, { max: 1, connect_timeout: 3 })
try {
  await sql`SELECT 1`
} catch {
  available = false
}

afterAll(async () => {
  if (available) await sql.end()
})

function humanResult(sessionId: string, seq: number): TrialResult {
  return {
    schemaVersion: 1,
    sessionId,
    respondentClass: 'human',
    trialSeq: seq,
    blockName: 'ABtraining',
    stimulusHashes: { sample: ['a1.svg'], comparisons: ['b1.svg', 'b2.svg'] },
    response: { selectedRef: seq % 2 === 0 ? 'b1.svg' : 'b2.svg' },
    correct: seq % 2 === 0,
    timing: { rtSampleMs: 100 + seq, rtComparisonMs: 200 + seq, trialMs: 400 + seq },
  }
}

describe.skipIf(!available)('ingestão append-only + idempotente (AD-4/AD-5)', () => {
  it('grava sessão e resultados; reenvio não duplica; update é bloqueado', async () => {
    const [session] = await sql`
      INSERT INTO sessions (doc_version, seed, respondent) VALUES ('test-doc', 7, 'human') RETURNING id`
    const sessionId = session.id as string
    const key = `${sessionId}:batch-v1`

    // primeira ingestão
    for (let i = 0; i < 3; i++) {
      await sql`
        INSERT INTO trial_results (session_id, trial_seq, payload)
        VALUES (${sessionId}, ${i}, ${sql.json(humanResult(sessionId, i))})
        ON CONFLICT (session_id, trial_seq) DO NOTHING`
    }
    await sql`INSERT INTO ingest_log (idempotency_key, session_id, accepted_count) VALUES (${key}, ${sessionId}, 3)`

    const count = await sql`SELECT count(*)::int AS n FROM trial_results WHERE session_id = ${sessionId}`
    expect(count[0]!.n).toBe(3)

    // reenvio dos mesmos trials: ON CONFLICT DO NOTHING — nada duplica
    for (let i = 0; i < 3; i++) {
      await sql`
        INSERT INTO trial_results (session_id, trial_seq, payload)
        VALUES (${sessionId}, ${i}, ${sql.json(humanResult(sessionId, i))})
        ON CONFLICT (session_id, trial_seq) DO NOTHING`
    }
    const count2 = await sql`SELECT count(*)::int AS n FROM trial_results WHERE session_id = ${sessionId}`
    expect(count2[0]!.n).toBe(3)

    // append-only (AD-4): UPDATE levanta exceção pelo trigger
    await expect(
      sql`UPDATE trial_results SET payload = '{}' WHERE session_id = ${sessionId} AND trial_seq = 0`,
    ).rejects.toThrow(/append-only/)

    // idempotência: a chave já foi aceita
    const dupe = await sql`SELECT 1 FROM ingest_log WHERE idempotency_key = ${key}`
    expect(dupe.length).toBe(1)

    // token (AD-11): emite e verifica contra a sessão criada
    const { token } = issueUploadToken(sessionId, 'dev-only-secret', 60)
    const importDynamic = await import('../../server/utils/upload-token')
    expect(importDynamic.verifyUploadToken(token, sessionId, 'dev-only-secret')).toEqual({ ok: true })

    await sql`DELETE FROM sessions WHERE id = ${sessionId}`.catch(async () => {
      // FK impede? trial_results referencia sessions — como o trigger bloqueia DELETE,
      // a limpeza de teste usa cascade manual nas filhas primeiro
      await sql`ALTER TABLE trial_results DISABLE TRIGGER trial_results_append_only`
      await sql`DELETE FROM ingest_log WHERE session_id = ${sessionId}`
      await sql`DELETE FROM trial_results WHERE session_id = ${sessionId}`
      await sql`ALTER TABLE trial_results ENABLE TRIGGER trial_results_append_only`
      await sql`DELETE FROM sessions WHERE id = ${sessionId}`
    })
  })
})
