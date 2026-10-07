// Fase C — operações de serviço (OZP-414): as 4 tools reais sobre o banco.
// Exige o Postgres do compose (padrão dos testes de integração): sem banco,
// pulado. Templates = experimentos publicados por protocolo (como o seed
// semeia); criar/aplicar clonam doc+assets+termo e publicam, idempotentes
// por conteúdo (persistExperimentDoc compartilhado com a submissão).
import type { Sql } from 'postgres'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { ExperimentDocument } from '@core/schema'
import { fixtureExperiment, fixtureGng, fixtureNback, fixtureStroop } from '@core/schema'
import type { ExportRow } from './export'
import {
  applyInstrument, createExperimentFromTemplate, listExperimentsForService,
  protocolOfDocument, readBatch,
} from './service-ops'

const DB_URL = process.env.DATABASE_URL_TESTS ?? 'postgres://plataforma:plataforma_dev@localhost:5543/experimentos'

let sql: Sql
let available = true
try {
  sql = postgres(DB_URL, { max: 1, connect_timeout: 3 })
  await sql`SELECT 1`
} catch {
  available = false
}

/** Semeia a instância como o seed: 1 template publicado por protocolo. */
async function seedTemplates(): Promise<string> {
  const [user] = await sql`INSERT INTO user_accounts (email, password_hash)
    VALUES (${`svc-${Math.random()}@test.dev`}, 'x') RETURNING id::text AS id`
  const templates: Array<[ExperimentDocument, string]> = [
    [fixtureExperiment, 'termo mts de pesquisa — ' + 'x'.repeat(30)],
    [fixtureStroop, 'termo stroop de pesquisa — ' + 'x'.repeat(30)],
    [fixtureGng, 'termo gng de pesquisa — ' + 'x'.repeat(30)],
    [fixtureNback, 'termo nback de pesquisa — ' + 'x'.repeat(30)],
  ]
  for (const [doc, termBody] of templates) {
    const [row] = await sql`INSERT INTO experiment_docs (document, content_sha1, owner_user_id, published)
      VALUES (${sql.json({ ...doc, docVersion: '' })}, ${`tpl-${Math.random()}`}, ${user.id}::uuid, true)
      RETURNING doc_version::text AS v`
    const refs = new Set<string>()
    for (const b of doc.experiment.blocks) for (const t of b.trials) {
      t.sample.forEach(r => refs.add(r)); t.comparisons.forEach(r => refs.add(r))
      if (t.consequence.correct.imageRef) refs.add(t.consequence.correct.imageRef)
      if (t.consequence.incorrect.imageRef) refs.add(t.consequence.incorrect.imageRef)
    }
    for (const ref of refs) {
      const sha1 = `sha-${Math.random().toString(36).slice(2)}`
      await sql`INSERT INTO stimulus_assets (sha1, content_type, size_bytes) VALUES (${sha1}, 'image/svg+xml', 10) ON CONFLICT DO NOTHING`
      await sql`INSERT INTO experiment_assets (doc_version, ref, sha1) VALUES (${row!.v}::uuid, ${ref}, ${sha1}) ON CONFLICT DO NOTHING`
    }
    await sql`INSERT INTO consent_terms (doc_version, version, body) VALUES (${row!.v}::uuid, 1, ${termBody})`
  }
  return user.id as string
}

/** Nomes únicos por execução: os testes persistem de verdade e a
 *  idempotência por conteúdo (comportamento certo) faria uma 2ª rodada
 *  devolver 'unchanged' para nomes repetidos. */
const uniq = (base: string) => `${base}-${Math.random().toString(36).slice(2, 8)}`

beforeAll(async () => {
  if (available) await seedTemplates()
})
afterAll(async () => { if (available) await sql.end() })

describe('protocolOfDocument', () => {
  it('mapeia display kinds → protocolo da tool', () => {
    expect(protocolOfDocument(fixtureExperiment)).toBe('mts')
    expect(protocolOfDocument(fixtureStroop)).toBe('stroop')
    expect(protocolOfDocument(fixtureGng)).toBe('gng')
    expect(protocolOfDocument(fixtureNback)).toBe('nback')
  })

  it('documento com blocos de protocolos mistos não é template válido', () => {
    const doc = structuredClone(fixtureGng)
    doc.experiment.blocks[1]!.display = { kind: 'STROOP' }
    expect(protocolOfDocument(doc)).toBeNull()
  })
})

describe.skipIf(!available)('createExperimentFromTemplate', () => {
  it('cria de template publicado: título novo, publicado, termo clonado, assets copiados', async () => {
    const nome = uniq('Stroop-Piloto')
    const r = await createExperimentFromTemplate(sql, { ownerId: (await seedTemplates()), nome, protocolo: 'stroop' })
    expect(r.status).toBe('created')
    expect(r.protocolo).toBe('stroop')
    const [doc] = await sql`SELECT document, published FROM experiment_docs WHERE doc_version::text = ${r.docVersion}`
    expect((doc.document as ExperimentDocument).title).toBe(nome)
    expect(doc.published).toBe(true)
    const [term] = await sql`SELECT count(*)::int AS n FROM consent_terms WHERE doc_version::text = ${r.docVersion}`
    expect(term.n).toBeGreaterThan(0)
    const [assets] = await sql`SELECT count(*)::int AS n FROM experiment_assets WHERE doc_version::text = ${r.docVersion}`
    expect(assets.n).toBeGreaterThan(0)
  })

  it('é idempotente por conteúdo: recriar devolve o mesmo docVersion (unchanged)', async () => {
    const ownerId = await seedTemplates()
    const a = await createExperimentFromTemplate(sql, { ownerId, nome: 'GNG-Repro', protocolo: 'gng' })
    const b = await createExperimentFromTemplate(sql, { ownerId, nome: 'GNG-Repro', protocolo: 'gng' })
    expect(b.status).toBe('unchanged')
    expect(b.docVersion).toBe(a.docVersion)
  })

  it('echo-back: protocolo inválido lista os válidos; nome vazio é rejeitado', async () => {
    await expect(createExperimentFromTemplate(sql, { ownerId: 'x', nome: 'X', protocolo: 'irap' as never }))
      .rejects.toMatchObject({ statusCode: 422 })
    await expect(createExperimentFromTemplate(sql, { ownerId: 'x', nome: '  ', protocolo: 'mts' }))
      .rejects.toMatchObject({ statusCode: 422 })
  })

  it('protocolo sem template publicado → erro acionável citando o seed', async () => {
    // despublica TODOS os nback (e restaura ao fim — estado compartilhado entre testes)
    await sql`UPDATE experiment_docs SET published = false
      WHERE published AND document->'experiment'->'blocks'->0->'display'->>'kind' = 'NBACK'`
    try {
      await expect(createExperimentFromTemplate(sql, { ownerId: 'x', nome: 'Sem-Tpl', protocolo: 'nback' }))
        .rejects.toMatchObject({ statusCode: 422 })
    } finally {
      await sql`UPDATE experiment_docs SET published = true, published_at = now()
        WHERE document->'experiment'->'blocks'->0->'display'->>'kind' = 'NBACK'`
    }
  })
})

describe.skipIf(!available)('listExperimentsForService + readBatch', () => {
  it('lista publicados com protocolo; filtro estreita por título/protocolo', async () => {
    const ownerId = await seedTemplates()
    const nome = uniq('NBack-Mem')
    await createExperimentFromTemplate(sql, { ownerId, nome, protocolo: 'nback' })
    const all = await listExperimentsForService(sql)
    expect(all.filter(e => e.title === nome)).toHaveLength(1)
    expect(all.find(e => e.title === nome)!.protocolo).toBe('nback')
    const filtro = await listExperimentsForService(sql, 'nback')
    expect(filtro.every(e => e.protocolo === 'nback' || /nback/i.test(e.title))).toBe(true)
    expect(await listExperimentsForService(sql, 'zzz-inexistente')).toEqual([])
  })

  it('ler_batch devolve TrialResults canônicos pseudonimizados, por título ou docVersion', async () => {
    const ownerId = await seedTemplates()
    const nome = uniq('Ler-Batch-MTS')
    const created = await createExperimentFromTemplate(sql, { ownerId, nome, protocolo: 'mts' })
    const [user] = await sql`INSERT INTO user_accounts (email, password_hash) VALUES (${`lb-${Math.random()}@t.dev`}, 'x') RETURNING id::text AS id`
    const [term] = await sql`SELECT id FROM consent_terms WHERE doc_version::text = ${created.docVersion} ORDER BY version DESC LIMIT 1`
    const [session] = await sql`INSERT INTO sessions (doc_version, seed, respondent, user_id, consent_term_id, pseudonym)
      VALUES (${created.docVersion}::uuid, 42, 'human', ${user.id}::uuid, ${term.id}, ${'p'.repeat(24)}) RETURNING id::text AS id`
    for (const seq of [0, 1]) {
      await sql`INSERT INTO trial_results (session_id, trial_seq, payload) VALUES (${session.id}::uuid, ${seq}, ${sql.json({
        schemaVersion: 1, sessionId: session.id, respondentClass: 'human', trialSeq: seq, blockName: 'ABtraining',
        stimulusHashes: { sample: ['a1.svg'], comparisons: ['b1.svg', 'b2.svg'] },
        response: { selectedRef: 'b1.svg' }, correct: true,
        timing: { rtSampleMs: 10, rtComparisonMs: 20, trialMs: 30 },
      }) })`
    }
    const byTitle = await readBatch(sql, nome, session.id)
    expect(byTitle.rows.map(r => r.trial_seq)).toEqual([0, 1])
    expect(byTitle.rows[0]).toMatchObject<Partial<ExportRow>>({ pseudonym: 'p'.repeat(24), selected_ref: 'b1.svg', correct: true })
    const byVersion = await readBatch(sql, created.docVersion, session.id)
    expect(byVersion.rows).toHaveLength(2)
  })

  it('batch inexistente → 404 acionável', async () => {
    const ownerId = await seedTemplates()
    const created = await createExperimentFromTemplate(sql, { ownerId, nome: uniq('Sem-Sessao'), protocolo: 'stroop' })
    await expect(readBatch(sql, created.docVersion, '00000000-0000-7000-8000-000000000000'))
      .rejects.toMatchObject({ statusCode: 404 })
  })
})

describe.skipIf(!available)('applyInstrument', () => {
  it('re-emite o experimento com janela sobrescrita (GNG) — idempotente', async () => {
    const ownerId = await seedTemplates()
    const nomeExp = uniq('GNG-Janela')
    const base = await createExperimentFromTemplate(sql, { ownerId, nome: nomeExp, protocolo: 'gng' })
    const r = await applyInstrument(sql, { ownerId: base.ownerId, experimento: nomeExp, instrumento: 'gng', janelaMs: 900 })
    expect(r.status).toBe('created')
    const [doc] = await sql`SELECT document, published FROM experiment_docs WHERE doc_version::text = ${r.docVersion}`
    for (const b of (doc.document as ExperimentDocument).experiment.blocks) {
      expect(b.display).toMatchObject({ kind: 'GNG', responseWindowMs: 900 })
    }
    expect(doc.published).toBe(true)
    const again = await applyInstrument(sql, { ownerId: base.ownerId, experimento: nomeExp, instrumento: 'gng', janelaMs: 900 })
    expect(again.status).toBe('unchanged')
    expect(again.docVersion).toBe(r.docVersion)
  })

  it('echo-back: instrumento ≠ protocolo real do experimento → erro cita o protocolo real', async () => {
    const ownerId = await seedTemplates()
    const nome = uniq('Echo-Stroop')
    await createExperimentFromTemplate(sql, { ownerId, nome, protocolo: 'stroop' })
    await expect(applyInstrument(sql, { ownerId, experimento: nome, instrumento: 'nback', janelaMs: 900 }))
      .rejects.toMatchObject({ statusCode: 422 })
  })

  it('janela em protocolo sem janela (mts) e janela inválida → rejeitados', async () => {
    const ownerId = await seedTemplates()
    const nome = uniq('MTS-Janela')
    await createExperimentFromTemplate(sql, { ownerId, nome, protocolo: 'mts' })
    await expect(applyInstrument(sql, { ownerId, experimento: nome, instrumento: 'mts', janelaMs: 900 }))
      .rejects.toMatchObject({ statusCode: 422 })
    await expect(applyInstrument(sql, { ownerId, experimento: nome, instrumento: 'mts', janelaMs: 0 }))
      .rejects.toMatchObject({ statusCode: 422 })
  })
})
