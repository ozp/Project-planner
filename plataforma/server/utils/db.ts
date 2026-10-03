// Pool Postgres (server-only). Em F0 o dev usa o compose (DATABASE_URL).
import postgres from 'postgres'

let sql: ReturnType<typeof postgres> | null = null

export function useDb() {
  if (!sql) {
    const url = process.env.DATABASE_URL ?? useRuntimeConfig().databaseUrl
    if (!url) throw createError({ statusCode: 500, statusMessage: 'DATABASE_URL não configurado (ver .env.example / compose)' })
    sql = postgres(url, { max: 5 })
  }
  return sql
}
