// Módulo C2 (coding-task): cegueira por desenho, ordem por token, ciclo de
// vida (codificar → consenso → travada) e export admin. Contra o banco real
// do compose; skip se o db não está no ar (padrão invite-gate).
import { afterAll, describe, expect, it } from 'vitest'
import postgres from 'postgres'
import {
  criarCodingTask, salvarRespostas, getFolha, finalizarFolha, exportarTask, ordemPorToken,
  type NovoItem,
} from './coding-task'

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

const item = (n: number): NovoItem => ({
  session_id: '01a00000-test-' + n,
  trial_seq: n,
  segment_tag: `r${n}.dom.reg.sem`,
  stem: `stem de teste ${n}`,
  response_text: `resposta ${n}`,
})

async function taskLimpa(nItens = 4) {
  const { taskId, sheets } = await criarCodingTask(sql, {
    titulo: 'teste-vitest-' + Math.random().toString(36).slice(2, 8),
    itens: Array.from({ length: nItens }, (_, i) => item(i + 1)),
  })
  return { taskId, sheets }
}

describe.skipIf(!available)('módulo de codificação C2', () => {
  it('ordemPorToken é determinística por token e muda entre tokens', () => {
    const a = ordemPorToken('tok-a', 10)
    const a2 = ordemPorToken('tok-a', 10)
    expect(a).toEqual(a2)
    expect(a).not.toEqual(ordemPorToken('tok-b', 10))
    expect([...a].sort((x, y) => x - y)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('cria task com 3 folhas e o GET cego NÃO devolve tag/session_id', async () => {
    const { taskId, sheets } = await taskLimpa()
    expect(sheets.map(s => s.papel).sort()).toEqual(['cega1', 'cega2', 'consenso'])
    const folha = await getFolha(sql, sheets[0]!.token)
    expect(folha!.itens).toHaveLength(4)
    const vazio = JSON.stringify(folha)
    expect(vazio).not.toContain('segment_tag')
    expect(vazio).not.toContain('session_id')
    expect(vazio).not.toContain('01a00000')
    expect(folha!.status).toBe('codificando')
    await sql`DELETE FROM coding_tasks WHERE id = ${taskId}::uuid`
  })

  it('as duas folhas cegas veem ordens diferentes (embaralho por token)', async () => {
    const { taskId, sheets } = await taskLimpa(8)
    const f1 = await getFolha(sql, sheets[0]!.token)
    const f2 = await getFolha(sql, sheets[1]!.token)
    const o1 = f1!.itens.map(i => i.itemIndex).join(',')
    const o2 = f2!.itens.map(i => i.itemIndex).join(',')
    expect(o1).not.toEqual(o2)
    expect(new Set(f1!.itens.map(i => i.itemIndex)).size).toBe(8)
    await sql`DELETE FROM coding_tasks WHERE id = ${taskId}::uuid`
  })

  it('salva respostas (upsert), recusa d>5 e patch pós-finalizar', async () => {
    const { taskId, sheets } = await taskLimpa()
    const t = sheets[0]!.token
    expect(await salvarRespostas(sql, t, [{ itemIndex: 1, d1: 3, d2: 1, d3: 5 }])).toBe(1)
    expect(await salvarRespostas(sql, t, [{ itemIndex: 1, d1: 4, nota: 'revi' }])).toBe(1)
    const folha = await getFolha(sql, t)
    expect(folha!.itens.find(i => i.itemIndex === 1)).toMatchObject({ d1: 4, d2: 1, d3: 5, nota: 'revi' })
    await expect(salvarRespostas(sql, t, [{ itemIndex: 2, d1: 6 }])).rejects.toMatchObject({ statusCode: 422 })
    await expect(salvarRespostas(sql, t, [{ itemIndex: 99, d1: 1 }])).rejects.toMatchObject({ statusCode: 422 })
    await finalizarFolha(sql, t)
    await expect(salvarRespostas(sql, t, [{ itemIndex: 2, d1: 1 }])).rejects.toMatchObject({ statusCode: 409 })
    await sql`DELETE FROM coding_tasks WHERE id = ${taskId}::uuid`
  })

  it('consenso só abre com as 2 cegas fechadas; finalizar consenso trava a task', async () => {
    const { taskId, sheets } = await taskLimpa()
    const cega1 = sheets.find(s => s.papel === 'cega1')!
    const cega2 = sheets.find(s => s.papel === 'cega2')!
    const consenso = sheets.find(s => s.papel === 'consenso')!
    expect((await getFolha(sql, consenso.token))!.aguardando).toBe(true)
    await finalizarFolha(sql, cega1.token)
    expect((await getFolha(sql, consenso.token))!.aguardando).toBe(true)
    const { status } = await finalizarFolha(sql, cega2.token)
    expect(status).toBe('consenso')
    expect((await getFolha(sql, consenso.token))!.aguardando).toBe(false)
    // antes das respostas do consenso, finalizar é permitido mas a task só trava AGORA
    await salvarRespostas(sql, consenso.token, [{ itemIndex: 1, d1: 2 }])
    expect((await finalizarFolha(sql, consenso.token)).status).toBe('travada')
    await expect(salvarRespostas(sql, consenso.token, [{ itemIndex: 2, d1: 1 }])).rejects.toMatchObject({ statusCode: 409 })
    await sql`DELETE FROM coding_tasks WHERE id = ${taskId}::uuid`
  })

  it('export admin devolve re-ligação científica e marca divergências', async () => {
    const { taskId, sheets } = await taskLimpa()
    const cega1 = sheets.find(s => s.papel === 'cega1')!
    const cega2 = sheets.find(s => s.papel === 'cega2')!
    await salvarRespostas(sql, cega1.token, [
      { itemIndex: 1, d1: 3, d2: 3, d3: 3 },
      { itemIndex: 2, d1: 5, d2: 5, d3: 5 },
    ])
    await salvarRespostas(sql, cega2.token, [
      { itemIndex: 1, d1: 3, d2: 3, d3: 3 },
      { itemIndex: 2, d1: 1, d2: 5, d3: 5 },
    ])
    const rows = await exportarTask(sql, taskId)
    expect(rows).toHaveLength(4)
    const r1 = rows.find(r => r.itemIndex === 1)!
    const r2 = rows.find(r => r.itemIndex === 2)!
    expect(r1.sessionId).toContain('01a00000')
    expect(r1.segmentTag).toContain('r1.')
    expect(r1.divergente).toBe(false)
    expect(r2.divergente).toBe(true)
    await sql`DELETE FROM coding_tasks WHERE id = ${taskId}::uuid`
  })
})
