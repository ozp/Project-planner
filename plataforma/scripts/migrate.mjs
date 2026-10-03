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
for (const f of files) {
  console.log(`aplicando ${f}…`)
  await sql.unsafe(`BEGIN;\n${readFileSync(join(dir, f), 'utf8')}\nCOMMIT;`)
}
console.log(`ok — ${files.length} migração(ões)`)
await sql.end()
