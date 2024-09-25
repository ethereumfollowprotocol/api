import { type InsertObject, Kysely } from 'kysely'
import { PostgresJSDialect } from 'kysely-postgres-js'
import postgres from 'postgres'

import type { DB, Environment } from '#/types'

export type Row<T extends keyof DB> = InsertObject<DB, T>

export function database(env: Environment) {
  return new Kysely<DB>({
    dialect: new PostgresJSDialect({
      postgres: postgres(env.DATABASE_URL)
    })
  })
}

// export function database(env: Environment) {
//     return new Kysely<DB>({
//         dialect: new PostgresJSDialect({
//             postgres: postgres(env.DATABASE_URL, {
//                 connectionTimeoutMillis: 5000 // Set the connection timeout to 5 seconds
//             })
//         })
//     })
// }
