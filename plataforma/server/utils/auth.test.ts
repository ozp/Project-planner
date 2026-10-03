import { describe, expect, it } from 'vitest'
import * as OTPAuth from 'otpauth'
import { hashPassword, verifyPassword, newSessionToken, hashSessionToken } from './auth'
import { rateLimit } from './rate-limit'
import { decryptSecret, encryptSecret, newTotp, verifyTotp } from './totp'

// Story 2.1 — credenciais e sessão
describe('auth utils', () => {
  it('argon2id: hash verifica a senha e rejeita errada', async () => {
    const h = await hashPassword('senha-muito-segura-123')
    expect(h.startsWith('$argon2id$')).toBe(true)
    expect(await verifyPassword(h, 'senha-muito-segura-123')).toBe(true)
    expect(await verifyPassword(h, 'errada')).toBe(false)
  })

  it('token de sessão: opaco, e o banco guarda só o hash', () => {
    const { token, tokenHash } = newSessionToken()
    expect(token.length).toBeGreaterThanOrEqual(40)
    expect(tokenHash).toBe(hashSessionToken(token))
    expect(tokenHash).not.toBe(token)
  })
})

describe('rateLimit', () => {
  it('limita dentro da janela e reseta depois', async () => {
    const key = `t-${Math.random()}`
    expect(rateLimit(key, 2, 50).ok).toBe(true)
    expect(rateLimit(key, 2, 50).ok).toBe(true)
    const blocked = rateLimit(key, 2, 50)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfterSec).toBeGreaterThan(0)
    await new Promise(r => setTimeout(r, 60))
    expect(rateLimit(key, 2, 50).ok).toBe(true)
  })
})

// Story 2.4 — TOTP cifrado
describe('totp', () => {
  it('roundtrip: secret cifrado decifra igual', () => {
    const boxed = encryptSecret('JBSWY3DPEHPK3PXP', 'segredo')
    expect(boxed).not.toContain('JBSWY3DPEHPK3PXP' as never)
    expect(decryptSecret(boxed, 'segredo')).toBe('JBSWY3DPEHPK3PXP')
  })

  it('cifra autenticada: segredo errado falha', () => {
    const boxed = encryptSecret('JBSWY3DPEHPK3PXP', 's1')
    expect(() => decryptSecret(boxed, 's2')).toThrow()
  })

  it('código gerado pelo próprio TOTP verifica (window ±1)', () => {
    const { secret } = newTotp('admin@local.dev')
    const totp = new OTPAuth.TOTP({ algorithm: 'SHA1', digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(secret) })
    const code = totp.generate()
    expect(verifyTotp(secret, code)).toBe(true)
    expect(verifyTotp(secret, '000000')).toBe(false)
  })
})
