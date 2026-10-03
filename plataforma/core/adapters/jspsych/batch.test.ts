import { describe, expect, it } from 'vitest'
import type { TrialResult } from '../../schema'
import { validateTrialResult } from '../../schema'
import { BatchBuilder, idempotencyKeyFor } from './batch'

function humanResult(trialSeq: number): TrialResult {
  return {
    schemaVersion: 1,
    sessionId: 'sess-1',
    respondentClass: 'human',
    trialSeq,
    blockName: 'ABtraining',
    stimulusHashes: { sample: ['a1.svg'], comparisons: ['b1.svg', 'b2.svg'] },
    response: { selectedRef: trialSeq % 2 === 0 ? 'b1.svg' : 'b2.svg' },
    correct: trialSeq % 2 === 0,
    timing: { rtSampleMs: 500, rtComparisonMs: 800, trialMs: 1500 },
  }
}

// Story 1.4 — builder do batch (AD-5/AD-7)
describe('BatchBuilder', () => {
  it('produz payload ordenado com trialSeq contínuo e chave idempotente estável', () => {
    const b = new BatchBuilder('sess-1')
    b.add(humanResult(2))
    b.add(humanResult(0))
    b.add(humanResult(1))
    const payload = b.build()
    expect(payload.results.map(r => r.trialSeq)).toEqual([0, 1, 2])
    expect(payload.idempotencyKey).toBe(idempotencyKeyFor('sess-1'))
    expect(payload.sessionId).toBe('sess-1')
  })

  it('todos os resultados do batch passam no contrato canônico (AD-3)', () => {
    const b = new BatchBuilder('sess-1')
    for (let i = 0; i < 5; i++) b.add(humanResult(i))
    for (const r of b.build().results) {
      expect(validateTrialResult(r).ok).toBe(true)
    }
  })

  it('rejeita resultado de sessão estranha e trialSeq negativo', () => {
    const b = new BatchBuilder('sess-1')
    const estranho = { ...humanResult(0), sessionId: 'sess-2' } as TrialResult
    expect(() => b.add(estranho)).toThrow(/estranha/)
    const negativo = { ...humanResult(0), trialSeq: -1 } as TrialResult
    expect(() => b.add(negativo)).toThrow(/negativo/)
  })

  it('rejeita build com buracos na sequência', () => {
    const b = new BatchBuilder('sess-1')
    b.add(humanResult(0))
    b.add(humanResult(2))
    expect(() => b.build()).toThrow(/trialSeq/)
  })
})
