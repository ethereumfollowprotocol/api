import postgres from 'postgres'
import { Kysely, type InsertObject } from 'kysely'
import type { DB } from '#/types/generated/index.ts'
import { PostgresJSDialect } from 'kysely-postgres-js'

export type Row<T extends keyof DB> = InsertObject<DB, T>

export function database(env: Env) {
  return new Kysely<DB>({
    dialect: new PostgresJSDialect({
      postgres: postgres(env.DATABASE_URL)
    })
  })
}
