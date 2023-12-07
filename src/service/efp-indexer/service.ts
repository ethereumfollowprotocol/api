import { database } from '#/database'
import type { DB } from '#/types'
import { decodeListLocationTypeV1 } from '#/types/list-location-type'
import type { Kysely } from 'kysely'
import { type Address } from 'viem'

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

  async getListLocation(tokenId: bigint): Promise<string | undefined> {
    const result = await this.db
      .selectFrom('list_metadata')
      .select('value')
      .where('token_id', '=', tokenId.toString())
      .where('key', '=', 'efp.list.location')
      .executeTakeFirst()
    return result?.value
  }

  decodeNonce(listLocation: string): { contract_address: `0x${string}`; nonce: bigint } | undefined {
    // read bytes 2-21 as address
    const asBytes = Buffer.from(listLocation.slice(2), 'hex')
    const nonceBytes: Buffer = asBytes.subarray(2 + 20, 2 + 20 + 32)
    const nonce: bigint = nonceBytes.reduce((acc, cur) => acc * 256n + BigInt(cur), 0n)
    return nonce
  }

  async getFollowingCount(tokenId: bigint): Promise<number> {
    const listLocation = (await this.getListLocation(tokenId)) as `0x${string}`
    if (listLocation === undefined || listLocation.length !== 2 + (1 + 1 + 20 + 32) * 2) {
      return 0
    }
    const { version, locationType, chainId, contractAddress, nonce } = decodeListLocationTypeV1(listLocation)

    const countResult = await this.db
      .selectFrom('list_records')
      .select(({ fn, val, ref }) => [
        // The `fn` module contains the most common
        // functions.
        fn
          .count<number>('record')
          .as('count')
      ])
      .where('contract_address', '=', contractAddress)
      .where('nonce', '=', nonce.toString())
      .groupBy('contract_address')
      .groupBy('nonce')
      .executeTakeFirst()
    return countResult?.count ?? 0
  }

  async getFollowing(tokenId: bigint): Promise<{ version: number; recordType: number; data: `0x${string}` }[]> {
    const listLocation = (await this.getListLocation(tokenId)) as `0x${string}`
    if (listLocation === undefined || listLocation.length !== 2 + (1 + 1 + 20 + 32) * 2) {
      return []
    }
    const { version, locationType, chainId, contractAddress, nonce } = decodeListLocationTypeV1(listLocation)
    const result = await this.db
      .selectFrom('list_records')
      .select(['version', 'type', 'data'])
      .where('contract_address', '=', contractAddress)
      .where('nonce', '=', nonce.toString())
      .execute()
    return result.map(({ version, type, data }) => ({
      version,
      recordType: type,
      data: data as `0x${string}`
    }))
  }
}
