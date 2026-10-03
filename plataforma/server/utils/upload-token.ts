// Token de upload efêmero (AD-11): o sessionId (UUIDv7) não é segredo —
// o batch só entra com token HMAC vinculado à sessão, com TTL.
import { createHmac, timingSafeEqual } from 'node:crypto'

const encoder = new TextEncoder()

function b64url(input: Uint8Array | string): string {
  const bytes = typeof input === 'string' ? encoder.encode(input) : input
  return Buffer.from(bytes).toString('base64url')
}

export interface UploadTokenPayload {
  sessionId: string
  exp: number // epoch ms
}

export function issueUploadToken(sessionId: string, secret: string, ttlSeconds: number): { token: string; expiresAt: number } {
  const exp = Date.now() + ttlSeconds * 1000
  const payload = b64url(JSON.stringify({ sessionId, exp } satisfies UploadTokenPayload))
  const mac = b64url(createHmac('sha256', secret).update(payload).digest())
  return { token: `${payload}.${mac}`, expiresAt: exp }
}

export type TokenCheck = { ok: true } | { ok: false; reason: 'malformed' | 'bad-signature' | 'wrong-session' | 'expired' }

export function verifyUploadToken(token: string, sessionId: string, secret: string): TokenCheck {
  const parts = token.split('.')
  if (parts.length !== 2) return { ok: false, reason: 'malformed' }
  const [payload, mac] = parts as [string, string]
  const expected = createHmac('sha256', secret).update(payload).digest()
  const given = Buffer.from(mac, 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return { ok: false, reason: 'bad-signature' }
  }
  let decoded: UploadTokenPayload
  try {
    decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as UploadTokenPayload
  } catch {
    return { ok: false, reason: 'malformed' }
  }
  if (decoded.sessionId !== sessionId) return { ok: false, reason: 'wrong-session' }
  if (Date.now() > decoded.exp) return { ok: false, reason: 'expired' }
  return { ok: true }
}
