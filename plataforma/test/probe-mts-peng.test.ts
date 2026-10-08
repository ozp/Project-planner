// Story F5.2 — pacote do probe nº 1: 5 condições de consequência (controle +
// 4 categorias Peng) sobre EXATAMENTE as mesmas tentativas (seeds equadas por
// construção), 3 opções, símbolos sem atalho de cor. Anti-vazamento: textos
// nunca nomeiam a categoria; instrução idêntica nas 5 condições.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { collectExperimentRefs, validateExperimentDocument } from '@core/schema'
import type { ExperimentDocument } from '@core/schema'

const base = join(import.meta.dirname, '..', 'experiments', 'probe-mts-consequencias')
const CONDS = ['controle', 'sobrevivencia', 'reforco-social', 'material', 'espiritual']
const docs = new Map(CONDS.map(c => [c, JSON.parse(readFileSync(join(base, c, 'experiment.json'), 'utf8')) as ExperimentDocument]))
const filesOf = (c: string) => readdirSync(join(base, c)).filter(f => f !== 'experiment.json')

describe('pacote probe-mts-consequencias (5 condições)', () => {
  it('todas válidas no contrato e com refs ↔ arquivos exatos', () => {
    for (const c of CONDS) {
      const v = validateExperimentDocument(docs.get(c)!)
      expect(v.errors, c).toEqual([])
      const refs = collectExperimentRefs(docs.get(c)!)
      expect(refs.filter(r => !filesOf(c).includes(r)), c).toEqual([])
      expect(filesOf(c).filter(f => !refs.includes(f)), c).toEqual([])
    }
  })

  it('3 opções por tentativa; relações corretas por classe (mesmo dígito)', () => {
    for (const c of CONDS) {
      for (const b of docs.get(c)!.experiment.blocks) {
        for (const t of b.trials) {
          expect(t.comparisons, `${c}/${b.name}`).toHaveLength(3)
          expect(t.correct[1], `${c}/${t.sample[0]}`).toBe(t.sample[0]![1])
        }
      }
      // blocos: 18+18 treinos, 9 teste (b→c)
      const [ab, ac, bc] = docs.get(c)!.experiment.blocks
      expect(ab!.trials).toHaveLength(18)
      expect(ac!.trials).toHaveLength(18)
      expect(bc!.trials).toHaveLength(9)
      expect(bc!.trials.every(t => t.sample[0]!.startsWith('b') && t.comparisons.every(o => o.startsWith('c')))).toBe(true)
    }
  })

  it('tentativas IDÊNTICAS entre condições (só as consequências diferem)', () => {
    const semConseq = (c: string) => JSON.stringify(trialsSemConseq(docs.get(c)!))
    const ref = semConseq('controle')
    for (const c of CONDS) {
      expect(semConseq(c), c).toBe(ref)
    }
  })

  it('anti-vazamento: controle sem texto; Peng com textos acerto≠erro sem nomear a categoria; instrução idêntica', () => {
    const instrucoes = new Set<string>()
    for (const c of CONDS) {
      const doc = docs.get(c)!
      for (const b of doc.experiment.blocks) {
        if (b.instructionText) instrucoes.add(b.instructionText)
        for (const t of b.trials) {
          const { correct, incorrect } = t.consequence
          if (c === 'controle') {
            expect(correct.text, `${c}`).toBeUndefined()
            expect(incorrect.text).toBeUndefined()
          } else if (b.name !== 'testeBC') {
            expect(correct.text, `${c}`).toBeTruthy()
            expect(incorrect.text).toBeTruthy()
            expect(correct.text).not.toBe(incorrect.text)
          }
          for (const txt of [correct.text, incorrect.text]) {
            if (txt) expect(txt.toLowerCase()).not.toMatch(/sobreviv|social|material|espirit|peng|consequ|condi[çc]/)
          }
        }
      }
    }
    expect(instrucoes.size).toBe(1) // idêntica em TODAS as condições e blocos
  })

  it('posição da correta equilibrada (sem padrão trivial de posição)', () => {
    for (const c of CONDS) {
      for (const name of ['treinoAB', 'treinoAC']) {
        const b = docs.get(c)!.experiment.blocks.find(x => x.name === name)!
        const pos = { 1: 0, 2: 0, 3: 0 }
        for (const t of b.trials) pos[(t.comparisons.indexOf(t.correct) + 1) as 1 | 2 | 3]!++
        expect(Math.max(...Object.values(pos)) - Math.min(...Object.values(pos)), `${c}/${name}`).toBeLessThanOrEqual(2)
      }
    }
  })
})

function trialsOf(doc: ExperimentDocument) {
  return doc.experiment.blocks.flatMap(b => b.trials)
}
function trialsSemConseq(doc: ExperimentDocument) {
  return trialsOf(doc).map(t => ({ ...t, consequence: undefined }))
}
