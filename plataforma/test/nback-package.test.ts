// Story 3.8 — pacote N-back de letras: o experiment.json + SVGs de
// experiments/nback-letras são autorados à mão (sequência pseudo-aleatória
// gerada 1x com verificação de constraints); este teste guarda o contrato —
// documento válido, refs ↔ arquivos e INTEGRIDADE DA SEQUÊNCIA (alvo ⇔ letra
// igual à de n posições antes; sem lures 1-back no bloco 2-back).
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { collectExperimentRefs, validateExperimentDocument } from '@core/schema'
import type { ExperimentDocument } from '@core/schema'

const dir = join(import.meta.dirname, '..', 'experiments', 'nback-letras')
const doc = JSON.parse(readFileSync(join(dir, 'experiment.json'), 'utf8')) as ExperimentDocument
const files = readdirSync(dir).filter(f => f !== 'experiment.json')

const MATCH = 'nb-match.svg'
const NOMATCH = 'nb-nomatch.svg'
const nBackOf: Record<string, number> = { treino1back: 1, bloco1back: 1, bloco2back: 2 }
const expectedTrials: Record<string, number> = { treino1back: 12, bloco1back: 24, bloco2back: 24 }
const expectedTargets: Record<string, number> = { treino1back: 4, bloco1back: 8, bloco2back: 8 }

describe('pacote nback-letras', () => {
  it('experiment.json passa no contrato do documento', () => {
    const v = validateExperimentDocument(doc)
    expect(v.errors).toEqual([])
    expect(v.ok).toBe(true)
  })

  it('todo ref tem asset e todo asset é referenciado (como na submissão)', () => {
    const refs = collectExperimentRefs(doc)
    expect(refs.filter(r => !files.includes(r))).toEqual([])
    expect(files.filter(f => !refs.includes(f))).toEqual([])
  })

  it('3 blocos NBACK com ritmo fixo (500ms letra + 2000ms ISI) e espaço de ações binário', () => {
    expect(doc.experiment.blocks.map(b => b.name)).toEqual(['treino1back', 'bloco1back', 'bloco2back'])
    for (const block of doc.experiment.blocks) {
      expect(block.trials).toHaveLength(expectedTrials[block.name]!)
      expect(block.display).toEqual({ kind: 'NBACK', stimulusMs: 500, responseWindowMs: 2500 })
      for (const t of block.trials) {
        expect(t.comparisons).toEqual([MATCH, NOMATCH])
        expect(t.sample).toHaveLength(1)
      }
    }
  })

  it('integridade da sequência: correct = match ⇔ letra igual à de n posições antes', () => {
    for (const block of doc.experiment.blocks) {
      const n = nBackOf[block.name]!
      let targets = 0
      block.trials.forEach((t, i) => {
        const isTarget = i >= n && t.sample[0] === block.trials[i - n]!.sample[0]
        expect(t.correct).toBe(isTarget ? MATCH : NOMATCH)
        if (isTarget) targets += 1
      })
      expect(targets).toBe(expectedTargets[block.name]!)
    }
  })

  it('bloco 2-back sem lures 1-back (sem repetições adjacentes) e treino com feedback', () => {
    const doisback = doc.experiment.blocks[2]!
    doisback.trials.forEach((t, i) => {
      if (i >= 1) expect(t.sample[0]).not.toBe(doisback.trials[i - 1]!.sample[0])
    })
    const treino = doc.experiment.blocks[0]!
    expect(treino.criterion).toBe(8)
    expect(treino.maxRepetitions).toBe(2)
    expect(treino.trials[0]!.consequence.correct.imageRef).toBe('nb-certo.svg')
  })
})
