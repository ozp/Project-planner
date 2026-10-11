// Pacotes sct-frases (S2) e manchas-ascii (S3) autorados à mão; este teste
// trava o contrato: documento válido, 24 stems em pares, e as 9 manchas
// CONGELADAS — regenerar pelo gerador determinístico = bytes idênticos.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { validateExperimentDocument } from '@core/schema'

const load = (p: string) => JSON.parse(readFileSync(new URL(`../experiments/${p}`, import.meta.url), 'utf8'))

describe('pacote sct-frases (S2)', () => {
  it('documento válido com 24 stems (12 pares de contraste)', () => {
    const doc = load('sct-frases/experiment.json')
    const v = validateExperimentDocument(doc)
    expect(v.errors).toEqual([])
    expect(v.ok).toBe(true)
    const block = doc.experiment.blocks[0]!
    expect(block.display.kind).toBe('TEXT')
    expect(block.trials).toHaveLength(24)
    // pares: stems nunca se repetem
    expect(new Set(block.trials.map((t: { stem: string }) => t.stem)).size).toBe(24)
  })
})

describe('pacote manchas-ascii (S3) — manchas congeladas', () => {
  const SEEDS = [1, 13, 2, 4, 11, 5, 14, 7, 9] // aprovadas no pré-teste (11/10)

  it('documento válido com 9 manchas', () => {
    const doc = load('manchas-ascii/experiment.json')
    expect(validateExperimentDocument(doc).ok).toBe(true)
    const block = doc.experiment.blocks[0]!
    expect(block.display.kind).toBe('TEXT')
    expect(block.trials).toHaveLength(9)
    for (const t of block.trials) expect(t.visualText!.length).toBeGreaterThan(50)
  })

  it('cada mancha é a regeneração exata do gerador (mesma seed = mesmos bytes)', () => {
    const doc = load('manchas-ascii/experiment.json')
    const root = fileURLToPath(new URL('..', import.meta.url))
    doc.experiment.blocks[0]!.trials.forEach((t: { visualText: string }, i: number) => {
      const regen = execFileSync('node', ['scripts/gen-mancha.mjs', String(SEEDS[i])], { cwd: root }).toString().trim()
      expect(t.visualText).toBe(regen)
    })
  })
})
