import { describe, expect, it } from 'vitest'
import { derivePseudonym } from './pseudonym'
import { publicSessionView } from './public-views'

// Story 2.2 — pseudonimização (AD-6) e PII scan (NFR8)
describe('derivePseudonym', () => {
  it('é determinístico para o par (usuário, experimento)', () => {
    expect(derivePseudonym('user-1', 'doc-a', 's')).toBe(derivePseudonym('user-1', 'doc-a', 's'))
  })

  it('difere entre experimentos (não correlacionável entre estudos)', () => {
    expect(derivePseudonym('user-1', 'doc-a', 's')).not.toBe(derivePseudonym('user-1', 'doc-b', 's'))
  })

  it('difere entre usuários no mesmo experimento', () => {
    expect(derivePseudonym('user-1', 'doc-a', 's')).not.toBe(derivePseudonym('user-2', 'doc-a', 's'))
  })

  it('produz formato estável de 24 hex', () => {
    expect(derivePseudonym('u', 'd', 's')).toMatch(/^[0-9a-f]{24}$/)
  })

  it('depende do segredo (dissociação futura = chave destruída)', () => {
    expect(derivePseudonym('u', 'd', 's1')).not.toBe(derivePseudonym('u', 'd', 's2'))
  })
})

// NFR8/AC 2.2: payloads de análise não carregam PII — o scan falha se achar
describe('PII scan nas visões públicas', () => {
  const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i

  it('visão pública de sessão não expõe e-mail nem user_id', () => {
    const view = publicSessionView({
      id: 'sess-1', pseudonym: 'abc123def456abc123def456', doc_version: 'doc-1',
      seed: 42, status: 'closed', created_at: new Date().toISOString(), closed_at: null,
      user_id: 'uuid-do-usuario', email: 'participante@exemplo.com', // campos privados presentes na linha
    })
    const serialized = JSON.stringify(view)
    expect(serialized).not.toMatch(EMAIL_RE)
    expect(serialized).not.toContain('uuid-do-usuario')
    expect(view.pseudonym).toMatch(/^[0-9a-f]{24}$/)
  })
})
