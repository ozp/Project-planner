#!/usr/bin/env node
// Aplica db/migrations/*.sql em ordem (AD-15: dev espelha prod).
// Uso: DATABASE_URL=... node scripts/migrate.mjs
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Defina DATABASE_URL (ex.: postgres://plataforma:plataforma_dev@localhost:5543/experimentos)')
  process.exit(1)
}
const sql = postgres(url, { max: 1 })
const dir = new URL('../db/migrations', import.meta.url).pathname
const files = readdirSync(dir).filter(f => f.endsWith('.sql')).sort()
await sql.unsafe(`CREATE TABLE IF NOT EXISTS _migrations (name text PRIMARY KEY, applied_at timestamptz DEFAULT now())`)
let applied = 0
for (const f of files) {
  const done = await sql`SELECT 1 FROM _migrations WHERE name = ${f}`
  if (done.length > 0) continue
  console.log(`aplicando ${f}…`)
  await sql.unsafe(`BEGIN;\n${readFileSync(join(dir, f), 'utf8')}\nCOMMIT;`)
  await sql`INSERT INTO _migrations (name) VALUES (${f})`
  applied++
}
console.log(`ok — ${applied} migração(ões) aplicadas, ${files.length} no total`)
await sql.end()
