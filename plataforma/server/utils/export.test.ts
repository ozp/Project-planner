import { describe, expect, it } from 'vitest'
import type { TrialResult } from '@core/schema'
import { buildExportRow, rowsToCsv } from './export'

const meta = {
  sessionId: 'sess-1',
  pseudonym: 'a'.repeat(24),
  docVersion: 'doc-1',
  seed: 42,
  status: 'closed',
  createdAt: '2026-10-03T00:00:00.000Z',
}

const human: TrialResult = {
  schemaVersion: 1,
  sessionId: 'sess-1',
  respondentClass: 'human',
  trialSeq: 0,
  blockName: 'ABtraining',
  stimulusHashes: { sample: ['a1.svg'], comparisons: ['b1.svg', 'b2.svg'] },
  response: { selectedRef: 'b1.svg' },
  correct: true,
  timing: { rtSampleMs: 120, rtComparisonMs: 300, trialMs: 500 },
}

// Story 3.4 — export longo/tidy, íntegro e sem PII (NFR8)
describe('export', () => {
  it('linha humana carrega timing completo e referências', () => {
    const row = buildExportRow(meta, human, '2026-10-03T01:00:00.000Z')
    expect(row).toMatchObject({
      pseudonym: meta.pseudonym,
      trial_seq: 0,
      respondent_class: 'human',
      correct: true,
      selected_ref: 'b1.svg',
      sample: 'a1.svg',
      comparisons: 'b1.svg|b2.svg',
      rt_sample_ms: 120,
      rt_comparison_ms: 300,
      trial_ms: 500,
      model_ref: null,
    })
  })

  it('linha sintética carrega inference; CSV é longo (uma linha por trial)', () => {
    const synth: TrialResult = {
      ...human,
      respondentClass: 'synthetic',
      timing: undefined,
      inference: { modelRef: 'qwen3-4b', provider: 'llamacpp', route: 'local', latencyMs: 900 },
    }
    const rows = [buildExportRow(meta, human, null), buildExportRow(meta, synth, null)]
    const csv = rowsToCsv(rows)
    const lines = csv.trim().split('\n')
    expect(lines).toHaveLength(3) // header + 2 trials
    expect(csv).toContain('qwen3-4b,llamacpp,local,900')
    expect(csv).not.toContain('undefined')
  })

  it('CSV escapa vírgulas/aspas (tidy seguro)', () => {
    const weird: TrialResult = { ...human, blockName: 'bloco, "especial"' }
    const csv = rowsToCsv([buildExportRow(meta, weird, null)])
    expect(csv).toContain('"bloco, ""especial"""')
    expect(csv.trim().split('\n')).toHaveLength(2)
  })

  it('PII scan: nenhuma linha expõe e-mail ou user_id (NFR8)', () => {
    const rows = [buildExportRow(meta, human, null)]
    const serialized = JSON.stringify(rows) + rowsToCsv(rows)
    const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i
    expect(serialized).not.toMatch(EMAIL_RE)
    expect(serialized).not.toContain('user_id')
  })
})
