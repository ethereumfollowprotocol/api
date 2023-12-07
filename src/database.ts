import type { Database } from '#/types/generated/database.ts'
import { createClient } from '@supabase/supabase-js'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { DB } from 'src/generated/index.ts'

export function supabaseClient(environment: Env) {
  return createClient<Database>(environment.SUPABASE_URL, environment.SUPABASE_SECRET_KEY)
}

// TODO: in progress need to consolidate db interface into service
export function kyselyDb(environment: Env) {
  return new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: environment.DATABASE_URL
      })
    })
  })
}
