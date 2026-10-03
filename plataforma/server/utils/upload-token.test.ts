import { describe, expect, it } from 'vitest'
import { issueUploadToken, verifyUploadToken } from '../../server/utils/upload-token'

const SECRET = 'test-secret'

// Story 1.5 — token de upload efêmero (AD-11)
describe('uploadToken', () => {
  it('emite token que verifica para a sessão correta', () => {
    const { token } = issueUploadToken('sess-1', SECRET, 60)
    expect(verifyUploadToken(token, 'sess-1', SECRET)).toEqual({ ok: true })
  })

  it('rejeita token de outra sessão (wrong-session)', () => {
    const { token } = issueUploadToken('sess-1', SECRET, 60)
    expect(verifyUploadToken(token, 'sess-2', SECRET)).toEqual({ ok: false, reason: 'wrong-session' })
  })

  it('rejeita assinatura adulterada (bad-signature)', () => {
    const { token } = issueUploadToken('sess-1', SECRET, 60)
    const [payload] = token.split('.')
    const forged = `${payload}.FORGEDMAC`
    expect(verifyUploadToken(forged, 'sess-1', SECRET)).toEqual({ ok: false, reason: 'bad-signature' })
  })

  it('rejeita segredo diferente (bad-signature)', () => {
    const { token } = issueUploadToken('sess-1', SECRET, 60)
    expect(verifyUploadToken(token, 'sess-1', 'outro')).toEqual({ ok: false, reason: 'bad-signature' })
  })

  it('expira após o TTL (expired)', async () => {
    const { token } = issueUploadToken('sess-1', SECRET, 0)
    await new Promise(r => setTimeout(r, 5))
    expect(verifyUploadToken(token, 'sess-1', SECRET)).toEqual({ ok: false, reason: 'expired' })
  })

  it('rejeita formato malformado', () => {
    expect(verifyUploadToken('sem-ponto', 'sess-1', SECRET)).toEqual({ ok: false, reason: 'malformed' })
  })
})
