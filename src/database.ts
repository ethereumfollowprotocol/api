import { raise } from '#/utilities.ts'
import type { Database } from '#/types/generated/database.ts'

type Tables = Database['public']['Tables']
export type Functions = Omit<Database['public']['Functions'], 'generate_ulid'>

type DB = {
  [TableName in keyof Tables]: {
    [ColumnName in
      keyof Tables[TableName]['Insert']]-?: undefined extends Tables[TableName]['Insert'][ColumnName]
      ? Tables[TableName]['Insert'][ColumnName]
      : Tables[TableName]['Insert'][ColumnName]
  }
}

export async function database(env: Env) {
  const { Kysely } = await import('kysely')
  const { PostgresJSDialect } = await import('kysely-postgres-js')
  const { default: postgres } = await import('postgres')

  const { connectionString } = env['postgres-pooling']

  if (!connectionString) raise("`env.['postgres-pooling'].connectionString` is missing")

  return new Kysely<DB>({
    dialect: new PostgresJSDialect({
      postgres: postgres(connectionString)
    })
  })
}
