// Emissão de convite (Story 3.1): admin gera o link único por experimento.
// O piloto é fechado — participante só entra com convite válido (gate no
// registro). Auditado em admin_actions como invite.create. allowWithoutMfa:
// criar convite libera ENTRADA de participante (não lê/altera dados) e o
// seed de dev precisa funcionar sem TOTP — AD-12 cabe nas ações sensíveis.
import { randomBytes } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event, { allowWithoutMfa: true })
  const body = await readValidatedBody(event, b =>
    typeof b === 'object' && b !== null && typeof (b as Record<string, unknown>).docVersion === 'string')
  const { docVersion } = body as { docVersion: string }
  const expiresInDays = Number((body as Record<string, unknown>).expiresInDays ?? 0)
  const maxUses = Number((body as Record<string, unknown>).maxUses ?? 0)

  const sql = useDb()
  const doc = await sql`SELECT 1 FROM experiment_docs WHERE doc_version::text = ${docVersion}`
  if (doc.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'documento não encontrado' })
  }

  const token = randomBytes(16).toString('hex')
  const expiresAt = Number.isFinite(expiresInDays) && expiresInDays > 0
    ? new Date(Date.now() + expiresInDays * 86400000) : null
  await sql`
    INSERT INTO experiment_invites (token, doc_version, expires_at, max_uses)
    VALUES (${token}, ${docVersion}::uuid, ${expiresAt}, ${Number.isFinite(maxUses) && maxUses > 0 ? maxUses : null})`
  await sql`
    INSERT INTO admin_actions (admin_id, action_type, detail)
    VALUES (${admin.id}::uuid, 'invite.create', ${sql.json({ docVersion, maxUses: maxUses || null, expiresInDays: expiresInDays || null })})`
  return { token, docVersion, inviteUrl: `/run/${docVersion}?invite=${token}` }
})
