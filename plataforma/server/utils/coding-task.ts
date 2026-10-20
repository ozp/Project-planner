// Módulo do gabarito C2 (plano plataforma-PLANO-codificacao-c2-gabarito):
// folhas de codificação cegas por token (padrão invite) + consenso + export
// admin. Cegueira por desenho: getSheet devolve só itemIndex/stem/responseText
// — a re-ligação científica (session_id/trial_seq/segment_tag) só sai no
// export admin. A ordem dos itens é embaralhada NO SERVIDOR por token
// (determinística): as duas folhas cegas veem ordens diferentes.
import { createHash, randomBytes } from 'node:crypto'
import type { postgres } from 'postgres'

export type Modo = 'foco' | 'compacta' | 'contínua'
export type Papel = 'cega1' | 'cega2' | 'consenso'

export interface NovoItem {
  session_id: string
  trial_seq: number
  segment_tag?: string | null
  stem: string
  response_text: string
}

export interface NovaTask {
  titulo: string
  docEscopo?: string | null
  modo?: Modo
  expiresInDays?: number | null
  itens: NovoItem[]
}

export interface FolhaItem {
  itemIndex: number
  stem: string
  responseText: string
  d1: number
  d2: number
  d3: number
  naoCodificavel: boolean
  nota: string
  par1: { d1: number; d2: number; d3: number; naoCodificavel: boolean } | null
  par2: { d1: number; d2: number; d3: number; naoCodificavel: boolean } | null
}

export interface Folha {
  papel: Papel | null
  titulo: string
  modo: Modo
  status: string
  expirada: boolean
  finalizada: boolean
  aguardando: boolean // consenso antes das 2 cegas fecharem
  itens: FolhaItem[]
}

// PRNG determinística a partir do token (mulberry32 sobre sha256) — a ordem
// é estável por token e diferente entre tokens com probabilidade esmagadora.
export function ordemPorToken(token: string, n: number): number[] {
  const h = createHash('sha256').update(token).digest()
  let s = h.readUInt32LE(0)
  const idx = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[idx[i], idx[j]] = [idx[j]!, idx[i]!]
  }
  return idx
}

const PAPEIS: Papel[] = ['cega1', 'cega2', 'consenso']

export async function criarCodingTask(
  sql: ReturnType<typeof postgres>,
  input: NovaTask,
): Promise<{ taskId: string; sheets: { papel: Papel; token: string }[] }> {
  if (!Array.isArray(input.itens) || input.itens.length === 0) {
    throw Object.assign(new Error('task sem itens'), { statusCode: 422 })
  }
  const expiresAt = input.expiresInDays && input.expiresInDays > 0
    ? new Date(Date.now() + input.expiresInDays * 86400000) : null
  const [task] = await sql`
    INSERT INTO coding_tasks (titulo, doc_escopo, modo, expires_at)
    VALUES (${input.titulo}, ${input.docEscopo ?? null}, ${input.modo ?? 'foco'}, ${expiresAt})
    RETURNING id::text AS id`
  await sql`
    INSERT INTO coding_items ${sql(input.itens.map((it, i) => ({
      task_id: task!.id,
      item_index: i + 1,
      session_id: it.session_id,
      trial_seq: it.trial_seq,
      segment_tag: it.segment_tag ?? null,
      stem: it.stem,
      response_text: it.response_text,
    })))}`
  const sheets = PAPEIS.map(papel => ({
    papel,
    token: randomBytes(16).toString('hex'),
  }))
  await sql`
    INSERT INTO coding_sheets ${sql(sheets.map(s => ({ task_id: task!.id, token: s.token, papel: s.papel })))}`
  return { taskId: task!.id, sheets }
}

async function tarefaEFolha(sql: ReturnType<typeof postgres>, token: string) {
  const [row] = await sql`
    SELECT s.token, s.papel, s.finalizada, s.task_id::text AS task_id,
           t.titulo, t.modo, t.status, t.expires_at
    FROM coding_sheets s JOIN coding_tasks t ON t.id = s.task_id
    WHERE s.token = ${token}
      AND (t.expires_at IS NULL OR t.expires_at > now())`
  return row ?? null
}

export async function getFolha(sql: ReturnType<typeof postgres>, token: string): Promise<Folha | null> {
  const row = await tarefaEFolha(sql, token)
  if (!row) return null
  const itens = await sql`
    SELECT i.item_index, i.stem, i.response_text,
           r.d1, r.d2, r.d3, r.nao_codificavel, r.nota
    FROM coding_items i
    LEFT JOIN coding_responses r ON r.item_id = i.id AND r.sheet_token = ${token}
    WHERE i.task_id = ${row.task_id}::uuid
    ORDER BY i.item_index`
  const ordem = row.papel === 'consenso'
    ? itens.map((_, i) => i) // consenso na ordem canônica (lado a lado já alinha)
    : ordemPorToken(token, itens.length)
  const fechadas = await sql`
    SELECT count(*)::int AS n FROM coding_sheets
    WHERE task_id = ${row.task_id}::uuid AND papel IN ('cega1','cega2') AND finalizada IS NOT NULL`
  // no consenso, cada item carrega o par cego (lado a lado na tela)
  const par = new Map<string, { d1: number; d2: number; d3: number; naoCodificavel: boolean }>()
  if (row.papel === 'consenso' && fechadas[0]!.n === 2) {
    const pares = await sql`
      SELECT i.item_index, s.papel, r.d1, r.d2, r.d3, r.nao_codificavel
      FROM coding_responses r
      JOIN coding_sheets s ON s.token = r.sheet_token
      JOIN coding_items i ON i.id = r.item_id
      WHERE s.task_id = ${row.task_id}::uuid AND s.papel IN ('cega1','cega2')`
    for (const p of pares) {
      const k = p.item_index + ':' + p.papel
      par.set(k, { d1: p.d1, d2: p.d2, d3: p.d3, naoCodificavel: p.nao_codificavel })
    }
  }
  return {
    papel: row.papel as Papel,
    titulo: row.titulo,
    modo: row.modo as Modo,
    status: row.status,
    expirada: false,
    finalizada: row.finalizada !== null,
    aguardando: row.papel === 'consenso' && fechadas[0]!.n < 2,
    itens: ordem.map(i => ({
      itemIndex: itens[i]!.item_index,
      stem: itens[i]!.stem,
      responseText: itens[i]!.response_text,
      d1: itens[i]!.d1 ?? 0,
      d2: itens[i]!.d2 ?? 0,
      d3: itens[i]!.d3 ?? 0,
      naoCodificavel: itens[i]!.nao_codificavel ?? false,
      nota: itens[i]!.nota ?? '',
      par1: par.get(itens[i]!.item_index + ':cega1') ?? null,
      par2: par.get(itens[i]!.item_index + ':cega2') ?? null,
    })),
  }
}

export interface PatchItem { itemIndex: number; d1?: number; d2?: number; d3?: number; naoCodificavel?: boolean; nota?: string }

const valida = (v: number | undefined) => v === undefined || (Number.isInteger(v) && v >= 0 && v <= 5)

export async function salvarRespostas(
  sql: ReturnType<typeof postgres>,
  token: string,
  patches: PatchItem[],
): Promise<number> {
  const row = await tarefaEFolha(sql, token)
  if (!row) throw Object.assign(new Error('folha não encontrada'), { statusCode: 404 })
  if (row.finalizada) throw Object.assign(new Error('folha finalizada — somente leitura'), { statusCode: 409 })
  if (row.status === 'travada') throw Object.assign(new Error('task travada'), { statusCode: 409 })
  for (const p of patches) {
    if (!valida(p.d1) || !valida(p.d2) || !valida(p.d3)) {
      throw Object.assign(new Error('dimensão fora de 0–5'), { statusCode: 422 })
    }
  }
  const indexes = patches.map(p => p.itemIndex)
  const items = await sql`
    SELECT id, item_index FROM coding_items
    WHERE task_id = ${row.task_id}::uuid AND item_index = ANY(${indexes})`
  const porIndex = new Map(items.map(i => [i.item_index, i.id]))
  let n = 0
  for (const p of patches) {
    const id = porIndex.get(p.itemIndex)
    if (!id) throw Object.assign(new Error(`item ${p.itemIndex} não pertence à task`), { statusCode: 422 })
    // INSERT com defaults; no conflito, merge — campo não enviado preserva o valor
    await sql`
      INSERT INTO coding_responses (sheet_token, item_id, d1, d2, d3, nao_codificavel, nota, updated_at)
      VALUES (${token}, ${id}::uuid, ${p.d1 ?? 0}, ${p.d2 ?? 0}, ${p.d3 ?? 0},
              ${p.naoCodificavel ?? false}, ${p.nota ?? ''}, now())
      ON CONFLICT (sheet_token, item_id) DO UPDATE SET
        d1 = COALESCE(${p.d1 ?? null}, coding_responses.d1),
        d2 = COALESCE(${p.d2 ?? null}, coding_responses.d2),
        d3 = COALESCE(${p.d3 ?? null}, coding_responses.d3),
        nao_codificavel = COALESCE(${p.naoCodificavel ?? null}, coding_responses.nao_codificavel),
        nota = COALESCE(${p.nota === undefined ? null : p.nota}, coding_responses.nota),
        updated_at = now()`
    n++
  }
  return n
}

export async function finalizarFolha(sql: ReturnType<typeof postgres>, token: string): Promise<{ status: string }> {
  const row = await tarefaEFolha(sql, token)
  if (!row) throw Object.assign(new Error('folha não encontrada'), { statusCode: 404 })
  if (row.finalizada) return { status: row.status }
  if (row.papel === 'consenso' && row.status !== 'consenso') {
    throw Object.assign(new Error('consenso aguardando as folhas cegas'), { statusCode: 409 })
  }
  await sql`UPDATE coding_sheets SET finalizada = now() WHERE token = ${token}`
  if (row.papel === 'consenso') {
    await sql`UPDATE coding_tasks SET status = 'travada' WHERE id = ${row.task_id}::uuid AND status = 'consenso'`
    return { status: 'travada' }
  }
  const fechadas = await sql`
    SELECT count(*)::int AS n FROM coding_sheets
    WHERE task_id = ${row.task_id}::uuid AND papel IN ('cega1','cega2') AND finalizada IS NOT NULL`
  if (fechadas[0]!.n === 2) {
    await sql`UPDATE coding_tasks SET status = 'consenso' WHERE id = ${row.task_id}::uuid AND status = 'codificando'`
    return { status: 'consenso' }
  }
  return { status: row.status }
}

export interface ExportRowAdmin {
  itemIndex: number
  sessionId: string
  trialSeq: number
  segmentTag: string | null
  stem: string
  responseText: string
  cega1: { d1: number; d2: number; d3: number; naoCodificavel: boolean; nota: string } | null
  cega2: { d1: number; d2: number; d3: number; naoCodificavel: boolean; nota: string } | null
  consenso: { d1: number; d2: number; d3: number; naoCodificavel: boolean; nota: string } | null
  divergente: boolean
}

// Export ADMIN (re-ligação científica incluída; AD-6: nada de PII aqui —
// itens vêm de sessões sintéticas, conferido pelo importador).
export async function exportarTask(sql: ReturnType<typeof postgres>, taskId: string): Promise<ExportRowAdmin[]> {
  const itens = await sql`
    SELECT i.id::text AS id, i.item_index, i.session_id, i.trial_seq, i.segment_tag,
           i.stem, i.response_text
    FROM coding_items i WHERE i.task_id = ${taskId}::uuid ORDER BY i.item_index`
  const resps = await sql`
    SELECT r.item_id::text AS item_id, s.papel, r.d1, r.d2, r.d3, r.nao_codificavel, r.nota
    FROM coding_responses r JOIN coding_sheets s ON s.token = r.sheet_token
    WHERE s.task_id = ${taskId}::uuid`
  const porItem = new Map<string, Record<string, ExportRowAdmin['cega1']>>()
  for (const r of resps) {
    const m = porItem.get(r.item_id) ?? {}
    m[r.papel] = { d1: r.d1, d2: r.d2, d3: r.d3, naoCodificavel: r.nao_codificavel, nota: r.nota }
    porItem.set(r.item_id, m)
  }
  const cod = (c: ExportRowAdmin['cega1']) => `${c?.d1 ?? 0}|${c?.d2 ?? 0}|${c?.d3 ?? 0}|${c?.naoCodificavel ?? false}`
  return itens.map(i => {
    const m = porItem.get(i.id) ?? {}
    const c1 = m.cega1 ?? null
    const c2 = m.cega2 ?? null
    return {
      itemIndex: i.item_index,
      sessionId: i.session_id,
      trialSeq: i.trial_seq,
      segmentTag: i.segment_tag,
      stem: i.stem,
      responseText: i.response_text,
      cega1: c1,
      cega2: c2,
      consenso: m.consenso ?? null,
      divergente: Boolean(c1 && c2 && cod(c1) !== cod(c2)),
    }
  })
}
