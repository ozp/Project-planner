// Gate de consentimento no BANCO (Story 2.3, AD-9): a constraint
// sessions_human_requires_consent torna a sessão humana sem termo aceito
// impossível — nem bypass de aplicação grava. Skip se o db não está no ar.
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

describe.skipIf(!available)('gate de consentimento (AD-9)', () => {
  it('sessão humana sem user/termo/pseudônimo é rejeitada pela constraint', async () => {
    const [doc] = await sql`INSERT INTO experiment_docs (document, content_sha1)
      VALUES (${sql.json({ schemaVersion: 1, docVersion: 'x' })}, ${'gate-' + Math.random()}) RETURNING doc_version`
    await expect(
      sql`INSERT INTO sessions (doc_version, seed, respondent) VALUES (${doc.doc_version}, 1, 'human')`,
    ).rejects.toThrow(/sessions_human_requires_consent/)

    // com termo aceito + user + pseudônimo: grava
    const email = `gate-${Math.random()}@test.dev`
    const [user] = await sql`INSERT INTO user_accounts (email, password_hash)
      VALUES (${email}, 'x') RETURNING id`
    const [term] = await sql`INSERT INTO consent_terms (doc_version, version, body)
      VALUES (${doc.doc_version}, 1, ${'termo '.repeat(10)}) RETURNING id`
    await sql`INSERT INTO consent_acceptances (term_id, user_id) VALUES (${term.id}, ${user.id})`
    const rows = await sql`INSERT INTO sessions (doc_version, seed, respondent, user_id, consent_term_id, pseudonym)
      VALUES (${doc.doc_version}, 1, 'human', ${user.id}, ${term.id}, ${'a'.repeat(24)}) RETURNING id`
    expect(rows.length).toBe(1)

    // limpeza (desliga o trigger append-only só para o teardown)
    await sql`ALTER TABLE trial_results DISABLE TRIGGER trial_results_append_only`
    await sql`DELETE FROM trial_results WHERE session_id = ${rows[0]!.id}`
    await sql`DELETE FROM sessions WHERE id = ${rows[0]!.id}`
    await sql`DELETE FROM consent_acceptances WHERE term_id = ${term.id}`
    await sql`DELETE FROM consent_terms WHERE id = ${term.id}`
    await sql`DELETE FROM anonymized_ids WHERE user_id = ${user.id}`
    await sql`DELETE FROM user_sessions WHERE user_id = ${user.id}`
    await sql`DELETE FROM user_accounts WHERE id = ${user.id}`
    await sql`DELETE FROM experiment_assets WHERE doc_version = ${doc.doc_version}`
    await sql`DELETE FROM experiment_docs WHERE doc_version = ${doc.doc_version}`
    await sql`ALTER TABLE trial_results ENABLE TRIGGER trial_results_append_only`
  })
})
