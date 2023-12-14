import { type InsertObject, Kysely } from 'kysely'
import { PostgresJSDialect } from 'kysely-postgres-js'
import postgres from 'postgres'
import type { DB } from '#/types/generated/index.ts'

export type Row<T extends keyof DB> = InsertObject<DB, T>

export function database(env: Env) {
  return new Kysely<DB>({
    dialect: new PostgresJSDialect({
      postgres: postgres(env.DATABASE_URL)
    })
  })
}
