import { database } from '#/database'
import type { DB } from '#/types'
import type { Kysely } from 'kysely'
import type { Address } from 'viem'

export interface IEFPIndexerService {
  getPrimaryList(address: Address): Promise<string | undefined>
}

export class EFPIndexerService implements IEFPIndexerService {
  private readonly db: Kysely<DB>

  constructor(env: Env) {
    this.db = database(env)
  }

  async getPrimaryList(address: Address): Promise<string | undefined> {
    const result = await this.db
      .selectFrom('account_metadata')
      .select('value')
      .where('address', '=', address)
      .where('key', '=', 'efp.list.primary')
      .executeTakeFirst()
    return result?.value
  }
}
