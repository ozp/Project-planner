// Rate limit em memória por chave (janela fixa). Single-process (F0/F1);
// multi-instância pede store compartilhado — registrado como follow-up F2.
const buckets = new Map<string, { count: number, resetAt: number }>()

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean, retryAfterSec: number } {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterSec: 0 }
  }
  b.count += 1
  if (b.count > limit) {
    return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) }
  }
  return { ok: true, retryAfterSec: 0 }
}

/** Chave por IP de cliente (proxy-aware no Traefik via x-forwarded-for). */
export function clientIp(event: Parameters<typeof getHeader>[0]): string {
  const fwd = getHeader(event, 'x-forwarded-for')
  return (fwd?.split(',')[0] ?? 'local').trim()
}
