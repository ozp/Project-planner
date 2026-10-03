// Ingestão do batch (AD-5): valida cada TrialResult contra o contrato (AD-3)
// e a idempotência por chave. F0: ack em memória — a persistência append-only
// em Postgres + token efêmero HMAC chegam no Story 1.5.
import { validateTrialResult } from '@core/schema'
import type { BatchPayload } from '@core/adapters/jspsych/batch'
import { idempotencyKeyFor } from '@core/adapters/jspsych/batch'

const seen = new Set<string>()

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody<BatchPayload>(event, b => typeof b === 'object' && b !== null && Array.isArray(b.results) && typeof b.sessionId === 'string')

  const expectedKey = idempotencyKeyFor(body.sessionId)
  if (body.idempotencyKey !== expectedKey) {
    throw createError({ statusCode: 422, statusMessage: `idempotencyKey inválida (esperado ${expectedKey})` })
  }

  if (seen.has(body.idempotencyKey)) {
    return { status: 'duplicate', accepted: 0 } // reenvio não duplica (AD-5)
  }

  const errors: string[] = []
  body.results.forEach((r, i) => {
    const v = validateTrialResult(r)
    if (!v.ok) errors.push(...v.errors.map(e => `results[${i}]: ${e}`))
  })
  if (errors.length > 0) {
    throw createError({ statusCode: 422, statusMessage: errors.join(' | ') })
  }

  seen.add(body.idempotencyKey)
  return { status: 'accepted', accepted: body.results.length }
})
