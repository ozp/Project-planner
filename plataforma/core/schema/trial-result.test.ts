import { describe, expect, it } from 'vitest'
import type { HumanTiming, TrialResult } from './types'
import { validateTrialResult } from './trial-result'

const baseHuman: TrialResult = {
  schemaVersion: 1,
  sessionId: 'sess-0001',
  respondentClass: 'human',
  trialSeq: 3,
  blockName: 'ABtraining',
  stimulusHashes: { sample: ['sha1-abc'], comparisons: ['sha1-b1', 'sha1-b2'] },
  response: { selectedRef: 'sha1-b1' },
  correct: true,
  timing: { rtSampleMs: 812, rtComparisonMs: 1103, trialMs: 2010 },
}

const baseSynthetic: TrialResult = {
  schemaVersion: 1,
  sessionId: 'sess-0002',
  respondentClass: 'synthetic',
  trialSeq: 0,
  blockName: 'ABtraining',
  stimulusHashes: { sample: ['sha1-abc'], comparisons: ['sha1-b1', 'sha1-b2'] },
  response: { selectedRef: 'sha1-b2' },
  correct: false,
  inference: { modelRef: 'qwen3-4b-q4', provider: 'llamacpp', route: 'local', latencyMs: 1450 },
}

// Story 1.2 — ACs do contrato TrialResult (AD-3)
describe('validateTrialResult', () => {
  it('aceita humano com timing completo', () => {
    expect(validateTrialResult(baseHuman).ok).toBe(true)
  })

  it('rejeita humano sem timing', () => {
    const tr = structuredClone(baseHuman)
    delete tr.timing
    expect(validateTrialResult(tr).ok).toBe(false)
  })

  it('rejeita humano com timing incompleto', () => {
    const tr = structuredClone(baseHuman) as unknown as { timing: Partial<HumanTiming> }
    delete tr.timing.rtComparisonMs
    expect(validateTrialResult(tr).ok).toBe(false)
  })

  it('aceita sintético com inference', () => {
    expect(validateTrialResult(baseSynthetic).ok).toBe(true)
  })

  it('rejeita sintético sem inference', () => {
    const tr = structuredClone(baseSynthetic)
    delete tr.inference
    expect(validateTrialResult(tr).ok).toBe(false)
  })

  it('rejeita misto (human com inference)', () => {
    const tr = structuredClone(baseHuman)
    tr.inference = baseSynthetic.inference
    expect(validateTrialResult(tr).ok).toBe(false)
  })

  it('rejeita misto (synthetic com timing)', () => {
    const tr = structuredClone(baseSynthetic)
    tr.timing = baseHuman.timing
    expect(validateTrialResult(tr).ok).toBe(false)
  })

  it('rejeita resposta fora dos comparativos apresentados', () => {
    const tr = structuredClone(baseHuman)
    tr.response = { selectedRef: 'sha1-x9' }
    const result = validateTrialResult(tr)
    expect(result.ok).toBe(false)
    expect(result.errors.join('\n')).toMatch(/selectedRef/)
  })

  it('aceita resposta textual (projetivo, F5) em sintético', () => {
    const tr = structuredClone(baseSynthetic)
    delete tr.correct
    tr.response = { text: 'Vejo uma máscara cobrindo o rosto.' }
    expect(validateTrialResult(tr).ok).toBe(true)
  })

  it('rejeita rota de inference desconhecida', () => {
    const tr = structuredClone(baseSynthetic) as unknown as { inference: { route: string } }
    tr.inference.route = 'mystery'
    expect(validateTrialResult(tr).ok).toBe(false)
  })
})
