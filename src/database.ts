import { raise } from '#/utilities.ts'
import * as schema from '#/types/generated/database.ts'

export async function database(env: Env) {
  const { Pool } = await import('pg')
  const { drizzle } = await import('drizzle-orm/node-postgres')
  const { connectionString } = env['postgres-pooling']
  if (!connectionString) raise("`env.['postgres-pooling'].connectionString` is missing")

  const pool = new Pool({ connectionString })
  return drizzle(pool, { schema })
}
