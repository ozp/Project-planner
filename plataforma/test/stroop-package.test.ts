// Story 3.6 — pacote Stroop Victoria digital: o experiment.json + SVGs de
// experiments/stroop-victoria são autorados à mão (gerados 1x); este teste
// guarda o contrato — documento válido e refs ↔ arquivos exatamente iguais
// (espelha as checagens do POST /api/experiments).
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { collectExperimentRefs, validateExperimentDocument } from '@core/schema'
import type { ExperimentDocument } from '@core/schema'

const dir = join(import.meta.dirname, '..', 'experiments', 'stroop-victoria')
const doc = JSON.parse(readFileSync(join(dir, 'experiment.json'), 'utf8')) as ExperimentDocument
const files = readdirSync(dir).filter(f => f !== 'experiment.json')

describe('pacote stroop-victoria', () => {
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

  it('3 blocos (neutro/congruente/incongruente) × 24 tentativas, comparativos fixos', () => {
    expect(doc.experiment.blocks.map(b => b.name)).toEqual(['neutro', 'congruente', 'incongruente'])
    for (const block of doc.experiment.blocks) {
      expect(block.trials).toHaveLength(24)
      expect(block.display).toEqual({ kind: 'STROOP' })
      expect(block.criterion).toBe(1)
      expect(block.maxRepetitions).toBe(1)
      for (const t of block.trials) {
        expect(t.comparisons).toEqual(['st-cor-vermelho.svg', 'st-cor-azul.svg', 'st-cor-verde.svg'])
      }
    }
  })

  it('incongruente: palavra ≠ tinta em todas as tentativas; correto = tinta', () => {
    for (const t of doc.experiment.blocks[2]!.trials) {
      const [palavra, tinta] = t.sample[0]!.replace('.svg', '').split('-').slice(1)
      expect(palavra).not.toBe(tinta)
      expect(t.correct).toBe(`st-cor-${tinta}.svg`)
    }
  })
})
