// Ponte nitro↔serviço (carregado só pelos endpoints; usa auto-imports do
// nitro — por isso não é importado por testes): valida o token e converte
// ServiceError em erro HTTP com statusMessage acionável (RFC 9457).
import type { H3Event } from 'h3'
import { ServiceError, SERVICE_TOKEN_HEADER, checkServiceToken } from './service-auth'

export function requireServiceToken(event: H3Event): void {
  const check = checkServiceToken(getHeader(event, SERVICE_TOKEN_HEADER), process.env.SERVICE_TOKEN)
  if (!check.ok) throw createError(check)
}

export function asServiceError(e: unknown): unknown {
  if (e instanceof ServiceError) {
    return createError({ statusCode: e.statusCode, statusMessage: e.statusMessage })
  }
  return e
}
