import { describe, expect, it } from 'vitest'
import { collectExperimentRefs } from './refs'
import { fixtureExperiment } from './fixtures'

describe('collectExperimentRefs', () => {
  it('coleta todas as refs usadas, sem duplicar', () => {
    const refs = collectExperimentRefs(fixtureExperiment)
    // fixture: samples a1,a2,ctx1; sons a1s,a2s; comps b1,b2,c1,c2; consequências right,wrong,ding
    expect(refs).toEqual(expect.arrayContaining(['a1.svg', 'a2.svg', 'ctx1.svg', 'a1s.wav', 'a2s.wav', 'b1.svg', 'b2.svg', 'c1.svg', 'c2.svg', 'right.svg', 'wrong.svg', 'ding.wav']))
    expect(new Set(refs).size).toBe(refs.length)
  })
})
