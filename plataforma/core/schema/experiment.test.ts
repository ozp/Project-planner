import { describe, expect, it } from 'vitest'
import { fixtureExperiment, validateExperimentDocument } from './index'

// Story 1.2 — ACs do contrato do documento do experimento
describe('validateExperimentDocument', () => {
  it('aceita o documento MTS válido com schemaVersion e docVersion', () => {
    const result = validateExperimentDocument(fixtureExperiment)
    expect(result.ok).toBe(true)
    expect(fixtureExperiment.schemaVersion).toBe(1)
    expect(fixtureExperiment.docVersion).toBe('doc-0001')
  })

  it('rejeita estímulo com URL externa (AD-10)', () => {
    const doc = structuredClone(fixtureExperiment)
    doc.experiment.blocks[0]!.trials[0]!.sample = ['https://evil.example.com/x.svg']
    const result = validateExperimentDocument(doc)
    expect(result.ok).toBe(false)
    expect(result.errors.join('\n')).toMatch(/pattern|AD-10/)
  })

  it('rejeita estímulo com marcação de script (AD-10)', () => {
    const doc = structuredClone(fixtureExperiment)
    doc.experiment.blocks[0]!.trials[0]!.comparisons = ['<script>alert(1)</script>', 'b2.svg']
    const result = validateExperimentDocument(doc)
    expect(result.ok).toBe(false)
  })

  it('rejeita conteúdo ativo em texto (instructionText com <script>)', () => {
    const doc = structuredClone(fixtureExperiment)
    doc.experiment.blocks[2]!.instructionText = 'Clique <script>alert(1)</script> para começar'
    const result = validateExperimentDocument(doc)
    expect(result.ok).toBe(false)
    expect(result.errors.join('\n')).toMatch(/AD-10/)
  })

  it('rejeita conteúdo ativo no feedback', () => {
    const doc = structuredClone(fixtureExperiment)
    doc.feedback = { text: 'Veja http://tracker.example/x' }
    const result = validateExperimentDocument(doc)
    expect(result.ok).toBe(false)
  })

  it('feedback é opcional (com e sem passam)', () => {
    const sem = structuredClone(fixtureExperiment)
    delete sem.feedback
    expect(validateExperimentDocument(sem).ok).toBe(true)
    expect(validateExperimentDocument(fixtureExperiment).ok).toBe(true)
  })

  it('rejeita correct fora de comparisons com erro apontando o campo', () => {
    const doc = structuredClone(fixtureExperiment)
    doc.experiment.blocks[0]!.trials[0]!.correct = 'b3.svg'
    const result = validateExperimentDocument(doc)
    expect(result.ok).toBe(false)
    expect(result.errors.join('\n')).toMatch(/trials\[0\]\.correct/)
  })

  it('rejeita schemaVersion desconhecido', () => {
    const doc = structuredClone(fixtureExperiment) as unknown as { schemaVersion: number }
    doc.schemaVersion = 99
    expect(validateExperimentDocument(doc).ok).toBe(false)
  })

  it('rejeita startBlock além do número de blocos', () => {
    const doc = structuredClone(fixtureExperiment)
    doc.experiment.startBlock = 4
    const result = validateExperimentDocument(doc)
    expect(result.ok).toBe(false)
    expect(result.errors.join('\n')).toMatch(/startBlock/)
  })

  it('aceita DMTS com delay e rejeita delay negativo', () => {
    const ok = structuredClone(fixtureExperiment)
    expect(validateExperimentDocument(ok).ok).toBe(true) // fixture já tem DMTS no bloco 2
    const bad = structuredClone(fixtureExperiment)
    ;(bad.experiment.blocks[1]!.display as unknown as { delaySeconds: number }).delaySeconds = -1
    expect(validateExperimentDocument(bad).ok).toBe(false)
  })
})
