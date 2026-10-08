// F5.1 — sessão sintética (OZP-415): o respondente é um LLM gerenciado por
// fora (decisão do ozp 07/10). A plataforma abre a sessão sem consentimento
// (AD-9 é gate de sessão HUMANA) e sem demografia, entrega o PLANO de
// tentativas determinístico pela seed SEM vazar a resposta correta, e pontua
// SERVER-SIDE a cada resposta (o manager só recebe certo/errado — o mesmo
// feedback que um humano veria). TrialResult canônico: ramo synthetic com
// inference, jamais timing (AD-3).
import { createHash } from 'node:crypto'
import type postgres from 'postgres'
import { MtsEngine } from '@core/engine/engine'
import type { ExperimentDocument, TrialResult } from '@core/schema'
import { validateTrialResult } from '@core/schema'
import { ServiceError } from './service-auth'

type Db = ReturnType<typeof postgres>

interface ReplayTrial {
  blockName: string
  sample: string[]
  optionOrder: string[] // ordem de apresentação (comparisonOrder do motor)
  correct: string
}

export interface SyntheticPlanTrial {
  trialSeq: number
  blockName: string
  sampleRefs: string[]
  sampleUrls: string[]
  optionRefs: string[]
  optionUrls: string[]
}

/** Replay determinístico do motor: trialSeq → apresentação (amostra, ordem, correta).
 *  As respostas do replay não influenciam a sequência — o rand só é consumido
 *  nos embaralhamentos de apresentação, nunca por respond(). */
function replay(doc: ExperimentDocument, seed: number): Map<number, ReplayTrial> {
  const engine = new MtsEngine(doc, seed)
  const map = new Map<number, ReplayTrial>()
  for (;;) {
    const ev = engine.next()
    if (ev.kind === 'sessionEnd') break
    if (ev.kind !== 'trial') continue
    const p = ev.presentation
    map.set(p.trialSeq, {
      blockName: p.blockName,
      sample: [...p.trial.sample],
      optionOrder: [...p.comparisonOrder],
      correct: p.trial.correct,
    })
    engine.respond(p.trial.correct)
  }
  return map
}

const assetUrl = (ref: string, docVersion: string) => `/api/assets/${ref}?doc=${docVersion}`

/** Tool F5: abrir sessão sintética + plano sem `correct`. */
export async function openSyntheticSession(
  sql: Db,
  input: { docVersion: string; modelRef: string; seed: number; temperature?: number },
): Promise<{ sessionId: string, plan: SyntheticPlanTrial[] }> {
  const [doc] = await sql`SELECT document FROM experiment_docs WHERE doc_version::text = ${input.docVersion}`
  if (!doc) throw new ServiceError(404, `documento ${input.docVersion} não encontrado`)
  const document = doc.document as ExperimentDocument

  // pseudônimo estável por modelo+experimento (export consistente, AD-6)
  const secret = process.env.PLATAFORMA_SECRET ?? 'dev-only-secret'
  const pseudonym = createHash('sha256').update(`syn:${input.modelRef}:${input.docVersion}:${secret}`).digest('hex').slice(0, 24)

  const [row] = await sql`
    INSERT INTO sessions (doc_version, seed, respondent, pseudonym, synthetic_meta)
    VALUES (${input.docVersion}, ${input.seed}, 'synthetic', ${pseudonym},
            ${sql.json({ modelRef: input.modelRef, temperature: input.temperature ?? null })})
    RETURNING id::text AS id`

  const replayed = replay(document, input.seed)
  const plan = [...replayed.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([seq, t]) => ({
      trialSeq: seq,
      blockName: t.blockName,
      sampleRefs: t.sample,
      sampleUrls: t.sample.map(r => assetUrl(r, input.docVersion)),
      optionRefs: t.optionOrder,
      optionUrls: t.optionOrder.map(r => assetUrl(r, input.docVersion)),
    }))
  return { sessionId: row!.id as string, plan }
}

/** Tool F5: resposta de UMA tentativa — plataforma pontua e grava canônico. */
export async function respondTrial(
  sql: Db,
  input: {
    sessionId: string
    trialSeq: number
    selectedRef: string
    inference: { modelRef: string, provider: string, route: 'byok' | 'platform' | 'local', latencyMs: number, costUsd?: number }
  },
): Promise<{ trialSeq: number, correct: boolean }> {
  const [session] = await sql`
    SELECT s.doc_version::text AS doc_version, s.seed, d.document
    FROM sessions s JOIN experiment_docs d ON d.doc_version::text = s.doc_version
    WHERE s.id::text = ${input.sessionId} AND s.respondent = 'synthetic'`
  if (!session) throw new ServiceError(404, `sessão sintética ${input.sessionId} não encontrada`)

  const replayed = replay(session.document as ExperimentDocument, session.seed as number)
  const trial = replayed.get(input.trialSeq)
  if (!trial) {
    throw new ServiceError(422, `trial_seq ${input.trialSeq} fora do plano da sessão (${replayed.size} tentativas)`)
  }
  const correct = input.selectedRef === trial.correct

  const result: TrialResult = {
    schemaVersion: 1,
    sessionId: input.sessionId,
    respondentClass: 'synthetic',
    trialSeq: input.trialSeq,
    blockName: trial.blockName,
    stimulusHashes: { sample: trial.sample, comparisons: trial.optionOrder },
    response: { selectedRef: input.selectedRef },
    correct,
    inference: {
      modelRef: input.inference.modelRef,
      provider: input.inference.provider,
      route: input.inference.route,
      latencyMs: input.inference.latencyMs,
      ...(input.inference.costUsd !== undefined ? { costUsd: input.inference.costUsd } : {}),
    },
  }
  const v = validateTrialResult(result)
  if (!v.ok) throw new ServiceError(422, `resultado sintético inválido — ${v.errors.join(' | ')}`)

  let effectiveCorrect = correct
  await sql.begin(async tx => {
    // idempotente por tentativa: a 1ª resposta vale (inclusive no retorno)
    const existing = await tx`SELECT payload->>'correct' AS correct
      FROM trial_results WHERE session_id = ${input.sessionId}::uuid AND trial_seq = ${input.trialSeq}`
    if (existing.length > 0) {
      effectiveCorrect = existing[0]!.correct === 'true'
    } else {
      await tx`
        INSERT INTO trial_results (session_id, trial_seq, payload)
        VALUES (${input.sessionId}::uuid, ${input.trialSeq}, ${sql.json(result)})`
    }
    const [{ total }] = await tx`SELECT count(*)::int AS total FROM trial_results WHERE session_id = ${input.sessionId}::uuid`
    if (total >= replayed.size) {
      await tx`UPDATE sessions SET status = 'closed', closed_at = now() WHERE id = ${input.sessionId}::uuid`
    }
  })
  return { trialSeq: input.trialSeq, correct: effectiveCorrect }
}

/** CAP-4 mínimo: sessões por classe para o export. */
export async function sessionsForExport(sql: Db, docVersion: string, respondentClass?: 'human' | 'synthetic') {
  const rows = await sql`
    SELECT id::text AS id, seed, status, created_at::text AS created_at, pseudonym, respondent
    FROM sessions
    WHERE doc_version::text = ${docVersion}
      ${respondentClass ? sql`AND respondent = ${respondentClass}` : sql``}
    ORDER BY created_at ASC`
  return rows as unknown as Array<{ id: string, seed: number, status: string, created_at: string, pseudonym: string | null, respondent: string }>
}
