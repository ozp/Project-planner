import { describe, expect, it } from 'vitest'
import { CORE_VERSION } from '@core/index'

// Story 1.1: sanity — aliases de import e núcleo puro presente
describe('scaffold', () => {
  it('expose a versão do núcleo via alias @core', () => {
    expect(CORE_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
