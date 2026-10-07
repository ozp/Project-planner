// Fase C (OZP-414): operações de serviço — as 4 tools do harness agno sobre
// o banco da instância. Template de protocolo = experimento publicado mais
// antigo com aquele protocolo (o seed semeia 1 por protocolo; a imagem de
// prod não carrega os pacotes — clonar do DB reutiliza os assets
// content-addressed e o termo). Echo-back (regra 1 do harness): validação
// estrita ANTES de agir; erros citam o valor real e as opções válidas.
import type postgres from 'postgres'
import { validateExperimentDocument } from '@core/schema'
import type { ExperimentDocument, TrialResult } from '@core/schema'
import { buildExportRow } from './export'
import type { ExportRow, ExportSessionMeta } from './export'
import { persistExperimentDoc } from './persist-experiment'
import { ServiceError } from './service-auth'

type Db = ReturnType<typeof postgres>

export const SERVICE_PROTOCOLS = ['mts', 'stroop', 'gng', 'nback'] as const
export type ServiceProtocol = typeof SERVICE_PROTOCOLS[number]

const KIND_TO_PROTOCOL: Record<string, ServiceProtocol> = {
  SMTS: 'mts', DMTS: 'mts', STROOP: 'stroop', GNG: 'gng', NBACK: 'nback',
}

/** Protocolo dominante do documento — null se blocos de protocolos mistos. */
export function protocolOfDocument(doc: ExperimentDocument): ServiceProtocol | null {
  const protocols = new Set(doc.experiment.blocks.map(b => KIND_TO_PROTOCOL[b.display.kind]))
  return protocols.size === 1 ? [...protocols][0]! : null
}

interface DocRow { v: string; document: ExperimentDocument }

/** Identidade de serviço: o admin mais antigo da instância (dev e prod têm 1). */
export async function serviceOwnerId(sql: Db): Promise<string> {
  const [admin] = await sql`SELECT id::text AS id FROM user_accounts WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1`
  if (!admin) throw new ServiceError(422, 'instância sem admin — rode o seed')
  return admin.id as string
}

async function templateOf(sql: Db, protocolo: ServiceProtocol): Promise<DocRow> {
  const rows = await sql`SELECT doc_version::text AS v, document FROM experiment_docs WHERE published ORDER BY created_at ASC`
  const tpl = (rows as unknown as DocRow[]).find(d => protocolOfDocument(d.document) === protocolo)
  if (!tpl) {
    throw new ServiceError(422, `nenhum template publicado do protocolo ${protocolo} nesta instância — rode o seed (scripts/seed-local.mjs)`)
  }
  return tpl
}

/** Resolve por docVersion OU título exato (colisão de título: o mais novo). */
async function resolveExperiment(sql: Db, ref: string): Promise<DocRow> {
  const rows = await sql`
    SELECT doc_version::text AS v, document FROM experiment_docs
    WHERE doc_version::text = ${ref}
       OR document->>'title' = ${ref}`
  const row = (rows as unknown as DocRow[])[0]
  if (!row) throw new ServiceError(404, `experimento "${ref}" não encontrado (título exato ou docVersion)`)
  return row
}

async function assetsOf(sql: Db, docVersion: string): Promise<Map<string, string>> {
  const rows = await sql`SELECT ref, sha1 FROM experiment_assets WHERE doc_version::text = ${docVersion}`
  return new Map(rows.map(r => [r.ref as string, r.sha1 as string]))
}

/** Termo clonado do template + publicado — só o que falta para participar. */
async function ensureTermAndPublished(sql: Db, docVersion: string, templateVersion: string): Promise<void> {
  const [term] = await sql`SELECT 1 FROM consent_terms WHERE doc_version::text = ${docVersion}`
  if (!term) {
    await sql`
      INSERT INTO consent_terms (doc_version, version, body)
      SELECT ${docVersion}::uuid, 1, body FROM consent_terms
      WHERE doc_version::text = ${templateVersion} ORDER BY version DESC LIMIT 1`
  }
  await sql`UPDATE experiment_docs SET published = true, published_at = now() WHERE doc_version::text = ${docVersion} AND NOT published`
}

function assertValid(doc: ExperimentDocument): void {
  const v = validateExperimentDocument(doc)
  if (!v.ok) throw new ServiceError(422, `documento inválido — ${v.errors.join(' | ')}`)
}

function isWindowed(b: ExperimentDocument['experiment']['blocks'][number]): boolean {
  return b.display.kind === 'GNG' || b.display.kind === 'NBACK'
}

export interface ServiceOpResult {
  docVersion: string
  status: 'created' | 'unchanged'
  protocolo: ServiceProtocol
  title: string
  ownerId: string
}

/** Tool criar_experimento: clone publicado do template do protocolo. */
export async function createExperimentFromTemplate(
  sql: Db,
  input: { ownerId: string; nome: string; protocolo: string; descricao?: string },
): Promise<ServiceOpResult> {
  const nome = input.nome?.trim()
  if (!nome) throw new ServiceError(422, 'nome ausente — informe o nome do experimento')
  if (!SERVICE_PROTOCOLS.includes(input.protocolo as ServiceProtocol)) {
    throw new ServiceError(422, `protocolo_display inválido "${input.protocolo}" — válidos: ${SERVICE_PROTOCOLS.join('|')}`)
  }
  const protocolo = input.protocolo as ServiceProtocol
  const tpl = await templateOf(sql, protocolo)
  const variant: ExperimentDocument = {
    ...tpl.document,
    docVersion: 'submission',
    title: nome,
    ...(input.descricao?.trim() ? { description: input.descricao.trim() } : {}),
  }
  assertValid(variant)
  const refToSha1 = await assetsOf(sql, tpl.v)
  const r = await persistExperimentDoc(sql, { doc: variant, refToSha1, ownerId: input.ownerId })
  await ensureTermAndPublished(sql, r.docVersion, tpl.v)
  return { ...r, protocolo, title: nome, ownerId: input.ownerId }
}

/** Tool listar_experimentos: publicados com protocolo e contagem de sessões. */
export async function listExperimentsForService(
  sql: Db,
  filtro?: string,
): Promise<Array<{ docVersion: string, title: string, protocolo: ServiceProtocol | null, sessionCount: number }>> {
  const rows = await sql`
    SELECT doc_version::text AS doc_version, document,
           (SELECT count(*)::int FROM sessions s WHERE s.doc_version = d.doc_version::text) AS session_count
    FROM experiment_docs d WHERE published ORDER BY created_at DESC`
  const list = (rows as unknown as Array<{ doc_version: string, document: ExperimentDocument, session_count: number }>)
    .map(r => ({ docVersion: r.doc_version, title: r.document.title, protocolo: protocolOfDocument(r.document), sessionCount: r.session_count }))
  const f = filtro?.trim().toLowerCase()
  if (!f) return list
  return list.filter(e => e.title.toLowerCase().includes(f) || e.protocolo === f)
}

/** Tool ler_batch: TrialResults canônicos da sessão, pseudonimizados (AD-6). */
export async function readBatch(sql: Db, experimento: string, batch: string): Promise<{ session: ExportSessionMeta, rows: ExportRow[] }> {
  const exp = await resolveExperiment(sql, experimento)
  const [s] = await sql`
    SELECT id::text AS id, seed, status, created_at::text AS created_at, pseudonym
    FROM sessions WHERE id::text = ${batch} AND doc_version::text = ${exp.v}`
  if (!s) throw new ServiceError(404, `batch ${batch} não encontrado no experimento "${experimento}"`)
  const trs = await sql`SELECT payload, ingested_at::text AS ingested_at FROM trial_results WHERE session_id = ${s.id}::uuid ORDER BY trial_seq`
  const meta: ExportSessionMeta = {
    sessionId: s.id as string,
    pseudonym: s.pseudonym as string,
    docVersion: exp.v,
    seed: s.seed as number,
    status: s.status as string,
    createdAt: s.created_at as string,
  }
  return {
    session: meta,
    rows: (trs as unknown as Array<{ payload: TrialResult, ingested_at: string }>)
      .map(t => buildExportRow(meta, t.payload, t.ingested_at)),
  }
}

/** Tool aplicar_instrumento: re-emite o experimento com janela sobrescrita
 *  (gng|nback); instrumento validado contra o protocolo real (echo-back).
 *  Sem janela → variante idêntica = no-op idempotente do próprio docVersion. */
export async function applyInstrument(
  sql: Db,
  input: { ownerId: string; experimento: string; instrumento: string; janelaMs?: number },
): Promise<ServiceOpResult> {
  const exp = await resolveExperiment(sql, input.experimento)
  const real = protocolOfDocument(exp.document)
  if (!SERVICE_PROTOCOLS.includes(input.instrumento as ServiceProtocol)) {
    throw new ServiceError(422, `instrumento inválido "${input.instrumento}" — válidos: ${SERVICE_PROTOCOLS.join('|')}`)
  }
  if (input.instrumento !== real) {
    throw new ServiceError(422, `instrumento "${input.instrumento}" ≠ protocolo real do experimento "${exp.document.title}" (${real ?? 'misto'})`)
  }
  if (input.janelaMs !== undefined) {
    if (!(input.janelaMs > 0)) throw new ServiceError(422, 'janela_ms deve ser > 0')
    if (!exp.document.experiment.blocks.some(isWindowed)) {
      throw new ServiceError(422, `protocolo ${real} não tem janela de resposta (só gng|nback aceitam janela_ms)`)
    }
  }
  const variant: ExperimentDocument = {
    ...exp.document,
    docVersion: 'submission',
    ...(input.janelaMs !== undefined && {
      experiment: {
        ...exp.document.experiment,
        blocks: exp.document.experiment.blocks.map(b =>
          isWindowed(b) ? { ...b, display: { ...b.display, responseWindowMs: input.janelaMs! } } : b),
      },
    }),
  }
  assertValid(variant)
  const refToSha1 = await assetsOf(sql, exp.v)
  const r = await persistExperimentDoc(sql, { doc: variant, refToSha1, ownerId: input.ownerId })
  await ensureTermAndPublished(sql, r.docVersion, exp.v)
  return { ...r, protocolo: real!, title: variant.title, ownerId: input.ownerId }
}
