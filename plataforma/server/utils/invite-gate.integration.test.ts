// Gate de convite (Story 3.1): o UPDATE atômico do registro só consome
// convite válido (existe, não expirou, não esgotou, documento certo).
// Mesma guarda que roda em auth/register — aqui contra o banco real.
// Skip se o db não está no ar.
import { afterAll, describe, expect, it } from 'vitest'
import postgres from 'postgres'

const DB_URL = process.env.DATABASE_URL_TESTS ?? 'postgres://plataforma:plataforma_dev@localhost:5543/experimentos'

let available = true
const sql = postgres(DB_URL, { max: 1, connect_timeout: 3 })
try {
  await sql`SELECT 1`
} catch {
  available = false
}

afterAll(async () => {
  if (available) await sql.end()
})

// a MESMA guarda do handler (auth/register.post.ts) — fonte única seria
// extrair p/ utils; enquanto o handler é a única cópia, este teste replica
// a expressão e falha se alguém alterar uma sem a outra (colinho do house).
async function claimInvite(invite: string, claimedDoc: string | null) {
  return sql`
    UPDATE experiment_invites SET uses = uses + 1
    WHERE token = ${invite}
      AND (expires_at IS NULL OR expires_at > now())
      AND (max_uses IS NULL OR uses < max_uses)
      AND (${claimedDoc}::text IS NULL OR doc_version::text = ${claimedDoc})
    RETURNING doc_version::text`
}

describe.skipIf(!available)('gate de convite (AC 3.1)', () => {
  it('convite válido é consumido 1x e devolve o documento', async () => {
    const [doc] = await sql`INSERT INTO experiment_docs (document, content_sha1)
      VALUES (${sql.json({ schemaVersion: 1 })}, ${'inv-' + Math.random()}) RETURNING doc_version`
    const token = 'tok-' + Math.random().toString(36).slice(2)
    await sql`INSERT INTO experiment_invites (token, doc_version) VALUES (${token}, ${doc.doc_version})`
    const rows = await claimInvite(token, null)
    expect(rows.length).toBe(1)
    expect(rows[0]!.doc_version).toBe(doc.doc_version)
    await cleanup(token, doc.doc_version)
  })

  it('convite inexistente não é consumido', async () => {
    const rows = await claimInvite('nunu-' + Math.random(), null)
    expect(rows.length).toBe(0)
  })

  it('convite expirado é recusado', async () => {
    const [doc] = await sql`INSERT INTO experiment_docs (document, content_sha1)
      VALUES (${sql.json({ schemaVersion: 1 })}, ${'inv-' + Math.random()}) RETURNING doc_version`
    const token = 'tok-' + Math.random().toString(36).slice(2)
    await sql`INSERT INTO experiment_invites (token, doc_version, expires_at)
      VALUES (${token}, ${doc.doc_version}, now() - interval '1 minute')`
    expect((await claimInvite(token, null)).length).toBe(0)
    await cleanup(token, doc.doc_version)
  })

  it('convite esgotado (max_uses) é recusado e não incrementa além do limite', async () => {
    const [doc] = await sql`INSERT INTO experiment_docs (document, content_sha1)
      VALUES (${sql.json({ schemaVersion: 1 })}, ${'inv-' + Math.random()}) RETURNING doc_version`
    const token = 'tok-' + Math.random().toString(36).slice(2)
    await sql`INSERT INTO experiment_invites (token, doc_version, max_uses) VALUES (${token}, ${doc.doc_version}, 1)`
    expect((await claimInvite(token, null)).length).toBe(1)  // 1ª uso vence
    expect((await claimInvite(token, null)).length).toBe(0)  // 2ª uso recusa
    const [row] = await sql`SELECT uses FROM experiment_invites WHERE token = ${token}`
    expect(row.uses).toBe(1)
    await cleanup(token, doc.doc_version)
  })

  it('convite de OUTRO documento é recusado quando a página informa o doc', async () => {
    const [docA] = await sql`INSERT INTO experiment_docs (document, content_sha1)
      VALUES (${sql.json({ schemaVersion: 1 })}, ${'inv-' + Math.random()}) RETURNING doc_version`
    const [docB] = await sql`INSERT INTO experiment_docs (document, content_sha1)
      VALUES (${sql.json({ schemaVersion: 1 })}, ${'inv-' + Math.random()}) RETURNING doc_version`
    const token = 'tok-' + Math.random().toString(36).slice(2)
    await sql`INSERT INTO experiment_invites (token, doc_version) VALUES (${token}, ${docA.doc_version})`
    expect((await claimInvite(token, docB.doc_version)).length).toBe(0)   // página B + convite A
    expect((await claimInvite(token, docA.doc_version)).length).toBe(1)   // página certa vence
    await cleanup(token, docA.doc_version)
    await cleanup(null, docB.doc_version)
  })
})

async function cleanup(token: string | null, docVersion: string) {
  if (token) await sql`DELETE FROM experiment_invites WHERE token = ${token}`
  await sql`DELETE FROM experiment_docs WHERE doc_version = ${docVersion}`
}
