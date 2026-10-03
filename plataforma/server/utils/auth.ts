// Identidade e sessão (Epic 2, AD-5): argon2id, cookie httpOnly com token
// opaco (só o hash no banco), suspensão revoga no próximo request.
import { hash, verify } from '@node-rs/argon2'
import { createHash, randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'

export interface PublicUser {
  id: string
  email: string
  role: 'participant' | 'researcher' | 'admin'
  status: 'active' | 'pending_researcher' | 'suspended'
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password) // argon2id default
}

export async function verifyPassword(hashValue: string, password: string): Promise<boolean> {
  return verify(hashValue, password)
}

export function newSessionToken(): { token: string, tokenHash: string } {
  const token = randomBytes(32).toString('base64url')
  return { token, tokenHash: hashSessionToken(token) }
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export const SESSION_COOKIE = 'plataforma_session'
export const SESSION_TTL_DAYS = 30

export function setSessionCookie(event: H3Event, token: string, expiresAt: Date) {
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  })
}

export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

/** Usuário corrente (ou null). Contas suspensas não autenticam. */
export async function currentUser(event: H3Event): Promise<PublicUser | null> {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return null
  const sql = useDb()
  const rows = await sql`
    SELECT u.id, u.email, u.role, u.status
    FROM user_sessions s JOIN user_accounts u ON u.id = s.user_id
    WHERE s.token_hash = ${hashSessionToken(token)}
      AND s.expires_at > now() AND s.revoked_at IS NULL`
  if (rows.length === 0) return null
  const u = rows[0]!
  if (u.status === 'suspended') return null
  return { id: u.id as string, email: u.email as string, role: u.role as PublicUser['role'], status: u.status as PublicUser['status'] }
}

/** Guard: exige usuário com papel/estado — lança 401/403 (problem+json). */
export async function requireUser(event: H3Event, opts?: { role?: PublicUser['role'], activeResearcher?: boolean }): Promise<PublicUser> {
  const user = await currentUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'autenticação necessária' })
  if (opts?.role && user.role !== opts.role) {
    throw createError({ statusCode: 403, statusMessage: `requer papel ${opts.role}` })
  }
  if (opts?.activeResearcher && !(user.role === 'researcher' && user.status === 'active')) {
    throw createError({ statusCode: 403, statusMessage: 'requer pesquisador aprovado' })
  }
  return user
}
