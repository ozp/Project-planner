// TOTP do admin (AC 2.4, AD-12): secret cifrado em repouso (AES-256-GCM com
// chave do runtimeConfig — nunca plaintext no banco).
import * as OTPAuth from 'otpauth'
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

function keyFrom(secret: string): Buffer {
  return createHash('sha256').update(`totp:v1:${secret}`).digest()
}

export function encryptSecret(plain: string, secret: string): Buffer {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', keyFrom(secret), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), enc])
}

export function decryptSecret(boxed: Buffer, secret: string): string {
  const iv = boxed.subarray(0, 12)
  const tag = boxed.subarray(12, 28)
  const data = boxed.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', keyFrom(secret), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

export function newTotp(email: string): { secret: string, otpauthUrl: string } {
  const totp = new OTPAuth.TOTP({ issuer: 'plataforma-experimentos', label: email, algorithm: 'SHA1', digits: 6, period: 30 })
  return { secret: totp.secret.base32, otpauthUrl: totp.toString() }
}

export function verifyTotp(secretBase32: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({ algorithm: 'SHA1', digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(secretBase32) })
  // janela ±1 período (relógios dessincronizados)
  return totp.validate({ token: code, window: 1 }) !== null
}
