// F5.1 — sessão sintética (OZP-417), dinâmica (revisão da story 4): o respondente
// é um LLM gerenciado por fora (decisão do ozp 07/10). A plataforma abre a sessão
// sem consentimento (AD-9 é gate de sessão HUMANA) e sem demografia, entrega a
// PRÓXIMA tentativa conforme o motor consome as respostas reais — blocos repetem
// até o critério de mastery exatamente como com um humano (aquisição = nº de
// passagens). O plano NUNCA vaza a resposta correta; a pontuação é server-side a
// cada tentativa (o manager só recebe certo/errado). TrialResult canônico: ramo
// synthetic com inference, jamais timing (AD-3).
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
  optionOrder: string[]
  correct: string
  consequencia: { acerto: string | null, erro: string | null }
}

export interface SyntheticPlanTrial {
  trialSeq: number
  blockName: string
  sampleRefs: string[]
  sampleUrls: string[]
  optionRefs: string[]
  optionUrls: string[]
  /** O manipulando (F5/Peng): textos de consequência da tentativa (sem a
   *  resposta correta — o manager aplica após receber certo/errado). */
  consequencia: { acerto: string | null, erro: string | null }
}

/** Replay com as respostas REAIS: o motor decide repetição/avanço/fim pelo
 *  critério. Retorna as apresentações até a próxima ainda sem resposta (ou o
 *  fim da sessão). A ordem não depende das respostas (rand só nas
 *  apresentações) — mas responder controla repetir/avançar/encerrar. */
function replayWith(doc: ExperimentDocument, seed: number, respostas: Map<number, string>): {
  apresentadas: Map<number, ReplayTrial>
  fim: false
} | {
  apresentadas: Map<number, ReplayTrial>
  fim: true
  motivo: 'completed' | 'maxRepetitions'
} {
  const engine = new MtsEngine(doc, seed)
  const apresentadas = new Map<number, ReplayTrial>()
  for (;;) {
    const ev = engine.next()
    if (ev.kind === 'sessionEnd') return { apresentadas, fim: true, motivo: ev.reason }
    if (ev.kind !== 'trial') continue
    const p = ev.presentation
    apresentadas.set(p.trialSeq, {
      blockName: p.blockName,
      sample: [...p.trial.sample],
      optionOrder: [...p.comparisonOrder],
      correct: p.trial.correct,
      consequencia: { acerto: p.trial.consequence.correct.text ?? null, erro: p.trial.consequence.incorrect.text ?? null },
    })
    const resposta = respostas.get(p.trialSeq)
    if (resposta === undefined) return { apresentadas, fim: false } // próxima a apresentar
    engine.respond(resposta)
  }
}

const assetUrl = (ref: string, docVersion: string) => `/api/assets/${ref}?doc=${docVersion}`

function planTrialOf(t: ReplayTrial, seq: number, docVersion: string): SyntheticPlanTrial {
  return {
    trialSeq: seq,
    blockName: t.blockName,
    sampleRefs: t.sample,
    sampleUrls: t.sample.map(r => assetUrl(r, docVersion)),
    optionRefs: t.optionOrder,
    optionUrls: t.optionOrder.map(r => assetUrl(r, docVersion)),
    consequencia: t.consequencia,
  }
}

interface SessionDocRow { document: ExperimentDocument }

async function loadSession(sql: Db, sessionId: string) {
  const [session] = await sql`
    SELECT s.doc_version::text AS doc_version, s.seed, s.status, s.respondent, d.document
    FROM sessions s JOIN experiment_docs d ON d.doc_version::text = s.doc_version
    WHERE s.id::text = ${sessionId} AND s.respondent = 'synthetic'`
  if (!session) throw new ServiceError(404, `sessão sintética ${sessionId} não encontrada`)
  return { ...session, document: (session as unknown as SessionDocRow).document } as {
    doc_version: string, seed: number, status: string, document: ExperimentDocument
  }
}

async function respostasIngeridas(sql: Db, sessionId: string): Promise<Map<number, string>> {
  const rows = await sql`SELECT trial_seq, payload FROM trial_results WHERE session_id = ${sessionId}::uuid ORDER BY trial_seq`
  return new Map((rows as unknown as Array<{ trial_seq: number, payload: TrialResult }>)
    .map(r => [r.trial_seq, r.payload.response.selectedRef ?? '']))
}

/** Tool F5: abrir sessão sintética — devolve a 1ª tentativa (a sessão cresce
 *  conforme o respondente responde; blocos repetem até o critério). */
export async function openSyntheticSession(
  sql: Db,
  input: { docVersion: string; modelRef: string; seed: number; temperature?: number },
): Promise<{ sessionId: string, primeira: SyntheticPlanTrial, instructions: Array<{ blockName: string, text: string }> }> {
  const [doc] = await sql`SELECT document FROM experiment_docs WHERE doc_version::text = ${input.docVersion}`
  if (!doc) throw new ServiceError(404, `documento ${input.docVersion} não encontrado`)
  const document = (doc as unknown as SessionDocRow).document

  // pseudônimo estável por modelo+experimento (export consistente, AD-6)
  const secret = process.env.PLATAFORMA_SECRET ?? 'dev-only-secret'
  const pseudonym = createHash('sha256').update(`syn:${input.modelRef}:${input.docVersion}:${secret}`).digest('hex').slice(0, 24)

  const [row] = await sql`
    INSERT INTO sessions (doc_version, seed, respondent, pseudonym, synthetic_meta)
    VALUES (${input.docVersion}, ${input.seed}, 'synthetic', ${pseudonym},
            ${sql.json({ modelRef: input.modelRef, temperature: input.temperature ?? null })})
    RETURNING id::text AS id`

  const { apresentadas, fim } = replayWith(document, input.seed, new Map())
  if (fim || apresentadas.size === 0) throw new ServiceError(422, 'documento sem tentativas')
  const primeira = [...apresentadas.entries()].sort((a, b) => b[0] - a[0])[0]!

  const instructions = document.experiment.blocks
    .filter(b => b.instructionText)
    .map(b => ({ blockName: b.name, text: b.instructionText! }))
  return { sessionId: row!.id as string, primeira: planTrialOf(primeira[1], primeira[0], input.docVersion), instructions }
}

/** Tool F5: resposta de UMA tentativa — pontua server-side, grava canônico e
 *  devolve a PRÓXIMA tentativa (ou fim, fechando a sessão). O manager alimenta
 *  o modelo com {correct} como feedback — o manipulando do probe. */
export async function respondTrial(
  sql: Db,
  input: {
    sessionId: string
    trialSeq: number
    selectedRef: string
    inference: { modelRef: string, provider: string, route: 'byok' | 'platform' | 'local', latencyMs: number, costUsd?: number }
  },
): Promise<{ trialSeq: number, correct: boolean, proxima: SyntheticPlanTrial | null, motivoFim?: 'completed' | 'maxRepetitions' }> {
  const session = await loadSession(sql, input.sessionId)
  const respostas = await respostasIngeridas(sql, input.sessionId)

  const { apresentadas } = replayWith(session.document, session.seed, respostas)
  const trial = apresentadas.get(input.trialSeq)
  if (!trial) {
    throw new ServiceError(422, `trial_seq ${input.trialSeq} fora do plano corrente da sessão`)
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
  })

  // próxima tentativa com TODAS as respostas (a recém-ingerida incluída)
  const respostasApos = await respostasIngeridas(sql, input.sessionId)
  const continuation = replayWith(session.document, session.seed, respostasApos)
  if (!continuation.fim) {
    const proxima = [...continuation.apresentadas.entries()].sort((a, b) => b[0] - a[0])[0]!
    return { trialSeq: input.trialSeq, correct: effectiveCorrect, proxima: planTrialOf(proxima[1], proxima[0], session.doc_version) }
  }
  await sql`UPDATE sessions SET status = 'closed', closed_at = now() WHERE id = ${input.sessionId}::uuid AND status = 'open'`
  return { trialSeq: input.trialSeq, correct: effectiveCorrect, proxima: null, motivoFim: continuation.motivo }
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
