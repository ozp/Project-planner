import { describe, expect, it } from 'vitest'
import { fixtureExperiment, fixtureGng, fixtureNback, fixtureStroop, validateExperimentDocument } from './index'

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

// Story 3.6 — protocolo STROOP (Stroop digital, adapt. Victoria)
describe('validateExperimentDocument — STROOP', () => {
  it('aceita documento Stroop válido', () => {
    expect(validateExperimentDocument(fixtureStroop).ok).toBe(true)
  })

  it('rejeita STROOP com propriedade extra (delaySeconds)', () => {
    const doc = structuredClone(fixtureStroop)
    ;(doc.experiment.blocks[0]!.display as unknown as { delaySeconds: number }).delaySeconds = 1
    expect(validateExperimentDocument(doc).ok).toBe(false)
  })

  it('rejeita kind de display desconhecido', () => {
    const doc = structuredClone(fixtureStroop)
    ;(doc.experiment.blocks[0]!.display as unknown as { kind: string }).kind = 'IRAP'
    expect(validateExperimentDocument(doc).ok).toBe(false)
  })
})

// Story 3.7 — protocolo GNG (Go/No-Go com estímulos compostos)
describe('validateExperimentDocument — GNG', () => {
  it('aceita documento GNG válido (com responseWindowMs)', () => {
    expect(validateExperimentDocument(fixtureGng).ok).toBe(true)
  })

  it('rejeita GNG sem responseWindowMs', () => {
    const doc = structuredClone(fixtureGng)
    delete (doc.experiment.blocks[0]!.display as { responseWindowMs?: number }).responseWindowMs
    expect(validateExperimentDocument(doc).ok).toBe(false)
  })

  it('rejeita GNG com responseWindowMs <= 0', () => {
    const doc = structuredClone(fixtureGng)
    ;(doc.experiment.blocks[0]!.display as { responseWindowMs: number }).responseWindowMs = 0
    expect(validateExperimentDocument(doc).ok).toBe(false)
  })

  it('rejeita bloco GNG com espaço de ações não binário (3 comparativos)', () => {
    const doc = structuredClone(fixtureGng)
    for (const t of doc.experiment.blocks[0]!.trials) t.comparisons = ['gng-go.svg', 'gng-nogo.svg', 'gng-talvez.svg']
    const v = validateExperimentDocument(doc)
    expect(v.ok).toBe(false)
    expect(v.errors.join('\n')).toMatch(/comparativos/)
  })

  it('rejeita GNG com propriedade extra (delaySeconds) — oneOf estrito', () => {
    const doc = structuredClone(fixtureGng)
    ;(doc.experiment.blocks[0]!.display as unknown as { delaySeconds: number }).delaySeconds = 1
    expect(validateExperimentDocument(doc).ok).toBe(false)
  })
})

// Story 3.8 — protocolo NBACK (N-back de letras)
describe('validateExperimentDocument — NBACK', () => {
  it('aceita documento NBACK válido (stimulusMs + responseWindowMs)', () => {
    expect(validateExperimentDocument(fixtureNback).ok).toBe(true)
  })

  it('rejeita NBACK sem stimulusMs', () => {
    const doc = structuredClone(fixtureNback)
    delete (doc.experiment.blocks[0]!.display as { stimulusMs?: number }).stimulusMs
    expect(validateExperimentDocument(doc).ok).toBe(false)
  })

  it('rejeita NBACK com janela menor ou igual ao estímulo (ISI inexistente)', () => {
    const doc = structuredClone(fixtureNback)
    ;(doc.experiment.blocks[0]!.display as { responseWindowMs: number }).responseWindowMs = 500
    const v = validateExperimentDocument(doc)
    expect(v.ok).toBe(false)
    expect(v.errors.join('\n')).toMatch(/janela/)
  })

  it('rejeita NBACK com espaço de ações não binário (3 comparativos)', () => {
    const doc = structuredClone(fixtureNback)
    for (const t of doc.experiment.blocks[0]!.trials) t.comparisons = ['nb-match.svg', 'nb-nomatch.svg', 'nb-talvez.svg']
    const v = validateExperimentDocument(doc)
    expect(v.ok).toBe(false)
    expect(v.errors.join('\n')).toMatch(/comparativos/)
  })
})
