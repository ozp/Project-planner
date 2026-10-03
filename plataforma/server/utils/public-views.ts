// Visões públicas de análise (AD-6/NFR8): exports e analytics só veem
// pseudônimos — nunca user_id, e-mail ou qualquer PII. Materializa a
// convenção que o export do E3 usará; o teste de PII scan vigia isto.
export interface PublicSessionView {
  sessionId: string
  pseudonym: string
  docVersion: string
  seed: number
  status: string
  createdAt: string
  closedAt: string | null
}

export function publicSessionView(row: Record<string, unknown>): PublicSessionView {
  return {
    sessionId: String(row.id),
    pseudonym: String(row.pseudonym),
    docVersion: String(row.doc_version),
    seed: Number(row.seed),
    status: String(row.status),
    createdAt: String(row.created_at),
    closedAt: row.closed_at == null ? null : String(row.closed_at),
  }
}
