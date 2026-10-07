// Fase C — autenticação de serviço (OZP-414): X-Service-Token vs SERVICE_TOKEN
// do ambiente. Puro: a função de comparação nunca lança — devolve o problema.
import { describe, expect, it } from 'vitest'
import { checkServiceToken } from './service-auth'

describe('checkServiceToken', () => {
  it('aceita token correto', () => {
    expect(checkServiceToken('segredo-de-servico', 'segredo-de-servico')).toEqual({ ok: true })
  })

  it('SERVICE_TOKEN ausente no ambiente → 503 (endpoints inertes)', () => {
    const r = checkServiceToken('qualquer', undefined)
    expect(r).toMatchObject({ ok: false, statusCode: 503 })
    if (!r.ok) expect(r.statusMessage).toMatch(/SERVICE_TOKEN/)
  })

  it('header ausente → 401', () => {
    const r = checkServiceToken(undefined, 'segredo')
    expect(r).toMatchObject({ ok: false, statusCode: 401, })
  })

  it('token errado → 401 (nunca diz quanto difere)', () => {
    const r = checkServiceToken('errado', 'segredo')
    expect(r).toMatchObject({ ok: false, statusCode: 401 })
    if (!r.ok) expect(r.statusMessage).not.toMatch(/errado|segredo/)
  })
})
