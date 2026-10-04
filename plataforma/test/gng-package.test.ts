// Story 3.7 — pacote Go/No-Go com estímulos compostos: o experiment.json +
// SVGs de experiments/gng-compostos são autorados à mão (gerados 1x); este
// teste guarda o contrato — documento válido e refs ↔ arquivos exatamente
// iguais (espelha as checagens do POST /api/experiments).
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { collectExperimentRefs, validateExperimentDocument } from '@core/schema'
import type { ExperimentDocument } from '@core/schema'

const dir = join(import.meta.dirname, '..', 'experiments', 'gng-compostos')
const doc = JSON.parse(readFileSync(join(dir, 'experiment.json'), 'utf8')) as ExperimentDocument
const files = readdirSync(dir).filter(f => f !== 'experiment.json')

const GO = 'gng-go.svg'
const NOGO = 'gng-nogo.svg'

describe('pacote gng-compostos', () => {
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

  it('3 blocos (treinoAB/treinoAC/testeBC) × 8 tentativas, protocolo GNG com janela', () => {
    expect(doc.experiment.blocks.map(b => b.name)).toEqual(['treinoAB', 'treinoAC', 'testeBC'])
    for (const block of doc.experiment.blocks) {
      expect(block.trials).toHaveLength(8)
      expect(block.display).toEqual({ kind: 'GNG', responseWindowMs: 1500 })
      for (const t of block.trials) {
        expect(t.comparisons).toEqual([GO, NOGO])
        expect(t.sample).toHaveLength(2) // estímulo composto: par de símbolos
      }
    }
  })

  it('semântica de equivalência: par da mesma classe → go; classes diferentes → no-go', () => {
    for (const block of doc.experiment.blocks) {
      for (const t of block.trials) {
        const [s1, s2] = t.sample as [string, string]
        const mesmaClasse = s1[1] === s2[1] // 'a1.svg' + 'b1.svg' → classe 1 relacionada
        expect(t.correct).toBe(mesmaClasse ? GO : NOGO)
      }
      // go/nogo balanceados 50/50 por bloco (prepotência pela relação, não pela frequência)
      const gos = block.trials.filter(t => t.correct === GO).length
      expect(gos).toBe(4)
    }
  })

  it('treinos têm consequência diferencial e critério 6/8; teste BC sem consequências', () => {
    for (const name of ['treinoAB', 'treinoAC']) {
      const block = doc.experiment.blocks.find(b => b.name === name)!
      expect(block.criterion).toBe(6)
      expect(block.maxRepetitions).toBe(3)
      expect(block.trials[0]!.consequence.correct.imageRef).toBe('gng-certo.svg')
    }
    const teste = doc.experiment.blocks[2]!
    expect(teste.criterion).toBe(1)
    expect(teste.maxRepetitions).toBe(1)
    for (const t of teste.trials) {
      expect(t.consequence).toEqual({ correct: { durationSeconds: 0 }, incorrect: { durationSeconds: 0 } })
    }
  })
})
