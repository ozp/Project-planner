// F5 — pacote do probe nº1 REFORMULADO (09/10): procedimento MTS canônico com
// feedback diferencial "Acertou."/"Errou." (consequência do próprio sistema MTS,
// decisão do ozp — sem consequências simuladas). Teste de equivalência
// combinada BC sem consequência. Sem a palavra "aprendizado" no documento.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { collectExperimentRefs, validateExperimentDocument } from '@core/schema'
import type { ExperimentDocument } from '@core/schema'

const dir = join(import.meta.dirname, '..', 'experiments', 'probe-mts-padrao')
const doc = JSON.parse(readFileSync(join(dir, 'experiment.json'), 'utf8')) as ExperimentDocument
const files = readdirSync(dir).filter(f => f !== 'experiment.json')

describe('pacote probe-mts-padrao (canônico)', () => {
  it('válido e refs ↔ arquivos exatos', () => {
    expect(validateExperimentDocument(doc).errors).toEqual([])
    const refs = collectExperimentRefs(doc)
    expect(refs.filter(r => !files.includes(r))).toEqual([])
    expect(files.filter(f => !refs.includes(f))).toEqual([])
  })

  it('consequência dos treinos = Acertou./Errou.; testeBC sem consequência', () => {
    for (const name of ['treinoAB', 'treinoAC']) {
      const b = doc.experiment.blocks.find(x => x.name === name)!
      expect(b.trials).toHaveLength(18)
      for (const t of b.trials) {
        expect(t.consequence.correct.text).toBe('Acertou.')
        expect(t.consequence.incorrect.text).toBe('Errou.')
      }
    }
    const bc = doc.experiment.blocks[2]!
    expect(bc.trials).toHaveLength(9)
    for (const t of bc.trials) {
      expect(t.consequence.correct.text).toBeUndefined()
    }
  })

  it('relações corretas por classe e 3 comparativos; sem alegação de aprendizado', () => {
    for (const b of doc.experiment.blocks) {
      for (const t of b.trials) {
        expect(t.comparisons).toHaveLength(3)
        expect(t.correct[1]).toBe(t.sample[0]![1])
      }
    }
    expect(JSON.stringify(doc).toLowerCase()).not.toMatch(/o modelo aprende|aprendizado do modelo|modelo aprende|learning/) // negações explícitas são permitidas
  })
})
