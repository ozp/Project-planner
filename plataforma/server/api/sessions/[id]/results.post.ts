// Ingestão do batch em Postgres (AD-5): token efêmero (AD-11) + contrato
// TrialResult (AD-3) + append-only (AD-4, trigger no banco) + idempotência
// por chave (uma aceitação por batch; trials reenviados não duplicam).
import { validateTrialResult } from '@core/schema'
import type { BatchPayload } from '@core/adapters/jspsych/batch'
import { idempotencyKeyFor } from '@core/adapters/jspsych/batch'

export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, 'id')!
  const auth = getHeader(event, 'authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : String(getQuery(event).token ?? '')

  const config = useRuntimeConfig()
  const secret = config.uploadTokenSecret ?? 'dev-only-secret'
  const check = verifyUploadToken(token, sessionId, secret)
  if (!check.ok) {
    throw createError({ statusCode: 401, statusMessage: `token de upload inválido (${check.reason})` })
  }

  const body = await readValidatedBody<BatchPayload>(event, b =>
    typeof b === 'object' && b !== null && Array.isArray((b as Record<string, unknown>).results))

  const expectedKey = idempotencyKeyFor(sessionId)
  if (body.idempotencyKey !== expectedKey) {
    throw createError({ statusCode: 422, statusMessage: `idempotencyKey inválida (esperado ${expectedKey})` })
  }

  const errors: string[] = []
  body.results.forEach((r, i) => {
    const v = validateTrialResult(r)
    if (!v.ok) errors.push(...v.errors.map(e => `results[${i}]: ${e}`))
    if (r.sessionId !== sessionId) errors.push(`results[${i}]: sessionId divergente`)
  })
  if (errors.length > 0) throw createError({ statusCode: 422, statusMessage: errors.join(' | ') })

  const sql = useDb()
  // transação: dedup da chave + insert append-only + fechamento da sessão
  const outcome = await sql.begin(async tx => {
    const dupe = await tx`SELECT 1 FROM ingest_log WHERE idempotency_key = ${expectedKey}`
    if (dupe.length > 0) return { status: 'duplicate' as const, accepted: 0 }

    for (const r of body.results) {
      await tx`
        INSERT INTO trial_results (session_id, trial_seq, payload)
        VALUES (${sessionId}::uuid, ${r.trialSeq}, ${sql.json(r)})
        ON CONFLICT (session_id, trial_seq) DO NOTHING`
    }
    await tx`
      INSERT INTO ingest_log (idempotency_key, session_id, accepted_count)
      VALUES (${expectedKey}, ${sessionId}::uuid, ${body.results.length})`
    await tx`UPDATE sessions SET status = 'closed', closed_at = now() WHERE id = ${sessionId}::uuid`
    return { status: 'accepted' as const, accepted: body.results.length }
  })

  return outcome
})
