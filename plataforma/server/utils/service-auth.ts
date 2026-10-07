// Fase C (OZP-414): autenticação de serviço — as tools do harness agno falam
// com a plataforma por token de serviço no AMBIENTE (env do Dokploy), nunca
// no repo. Puro (sem h3): a comparação nunca lança, devolve o problema;
// requireServiceToken/asServiceError (dependentes do nitro) vivem em
// service-guard.ts para os endpoints.
import { timingSafeEqual } from 'node:crypto'

export const SERVICE_TOKEN_HEADER = 'x-service-token'

export type ServiceTokenCheck =
  | { ok: true }
  | { ok: false; statusCode: 401 | 503; statusMessage: string }

export function checkServiceToken(provided: string | undefined, expected: string | undefined): ServiceTokenCheck {
  if (!expected) {
    return { ok: false, statusCode: 503, statusMessage: 'autenticação de serviço não configurada (SERVICE_TOKEN ausente no ambiente)' }
  }
  if (!provided) {
    return { ok: false, statusCode: 401, statusMessage: `header ${SERVICE_TOKEN_HEADER} ausente` }
  }
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, statusCode: 401, statusMessage: 'token de serviço inválido' }
  }
  return { ok: true }
}

/** Erro de domínio dos serviços — o endpoint converte em problem+json. */
export class ServiceError extends Error {
  constructor(readonly statusCode: number, readonly statusMessage: string) {
    super(statusMessage)
  }
}
