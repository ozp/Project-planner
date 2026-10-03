// Linhas do export (Story 3.4, AC 8): formato longo/tidy — uma linha por
// trial, íntegro do TrialResult canônico, ZERO PII (NFR8): só pseudônimo,
// nunca user_id/e-mail. Puro e testado — a rota só compõe.
import type { TrialResult } from '@core/schema'

export interface ExportSessionMeta {
  sessionId: string
  pseudonym: string
  docVersion: string
  seed: number
  status: string
  createdAt: string
}

export interface ExportRow {
  pseudonym: string
  session_id: string
  doc_version: string
  seed: number
  trial_seq: number
  block_name: string
  respondent_class: string
  correct: boolean | null
  selected_ref: string | null
  sample: string
  comparisons: string
  rt_sample_ms: number | null
  rt_comparison_ms: number | null
  trial_ms: number | null
  model_ref: string | null
  provider: string | null
  route: string | null
  inference_latency_ms: number | null
  ingested_at: string | null
}

export function buildExportRow(meta: ExportSessionMeta, tr: TrialResult, ingestedAt: string | null): ExportRow {
  return {
    pseudonym: meta.pseudonym,
    session_id: meta.sessionId,
    doc_version: meta.docVersion,
    seed: meta.seed,
    trial_seq: tr.trialSeq,
    block_name: tr.blockName,
    respondent_class: tr.respondentClass,
    correct: tr.correct ?? null,
    selected_ref: tr.response.selectedRef ?? tr.response.text ?? null,
    sample: tr.stimulusHashes.sample.join('|'),
    comparisons: tr.stimulusHashes.comparisons.join('|'),
    rt_sample_ms: tr.timing?.rtSampleMs ?? null,
    rt_comparison_ms: tr.timing?.rtComparisonMs ?? null,
    trial_ms: tr.timing?.trialMs ?? null,
    model_ref: tr.inference?.modelRef ?? null,
    provider: tr.inference?.provider ?? null,
    route: tr.inference?.route ?? null,
    inference_latency_ms: tr.inference?.latencyMs ?? null,
    ingested_at: ingestedAt,
  }
}

const CSV_COLUMNS: (keyof ExportRow)[] = [
  'pseudonym', 'session_id', 'doc_version', 'seed', 'trial_seq', 'block_name',
  'respondent_class', 'correct', 'selected_ref', 'sample', 'comparisons',
  'rt_sample_ms', 'rt_comparison_ms', 'trial_ms', 'model_ref', 'provider',
  'route', 'inference_latency_ms', 'ingested_at',
]

function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}

export function rowsToCsv(rows: ExportRow[]): string {
  const head = CSV_COLUMNS.join(',')
  const body = rows.map(r => CSV_COLUMNS.map(c => csvCell(r[c])).join(',')).join('\n')
  return body ? `${head}\n${body}\n` : `${head}\n`
}
