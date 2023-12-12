import { database } from '#/database'
import type { DB } from '#/types'
import { decodeListStorageLocation } from '#/types/list-location-type'
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

  async getListStorageLocation(tokenId: bigint): Promise<`0x${string}` | undefined> {
    const result = await this.db
      .selectFrom('list_nfts')
      .select('list_storage_location')
      .where('token_id', '=', tokenId.toString())
      .executeTakeFirst()
    return result?.list_storage_location || undefined
  }

  async getFollowingCount(tokenId: bigint): Promise<number> {
    const listStorageLocation: `0x${string}` | undefined = await this.getListStorageLocation(tokenId)
    if (listStorageLocation === undefined || listStorageLocation.length !== 2 + (1 + 1 + 32 + 20 + 32) * 2) {
      return 0
    }
    const { version, locationType, chainId, contractAddress, nonce } = decodeListStorageLocation(listStorageLocation)
    console.log({ version, locationType, chainId, contractAddress, nonce })

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
    return Number(countResult?.count ?? 0)
  }

  async getFollowing(tokenId: bigint): Promise<{ version: number; recordType: number; data: `0x${string}` }[]> {
    const listStorageLocation = (await this.getListStorageLocation(tokenId)) as `0x${string}`
    if (listStorageLocation === undefined || listStorageLocation.length !== 2 + (1 + 1 + 32 + 20 + 32) * 2) {
      return []
    }
    const { version, locationType, chainId, contractAddress, nonce } = decodeListStorageLocation(listStorageLocation)
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

  async getFollowerCount(address: `0x${string}`): Promise<number> {
    const possibleDuplicates = await this.getFollowers(address)
    const uniqueUsers = new Set(possibleDuplicates.map(({ listUser }) => listUser))
    return uniqueUsers.size
  }

  async getFollowers(address: `0x${string}`): Promise<{ token_id: number; list_user: string }[]> {
    // TODO: implement below query
    // SELECT DISTINCT subquery.list_user
    // FROM (
    //   SELECT
    //       lr.chain_id,
    //       lr.contract_address,
    //       lr.nonce,
    //       nft.chain_id,
    //       nft.contract_address,
    //       nft.token_id,
    //       nft.list_user
    //   FROM
    //       list_records lr
    //   LEFT JOIN
    //       list_nfts nft ON nft.list_storage_location_chain_id = lr.chain_id
    //                    AND nft.list_storage_location_contract_address = lr.contract_address
    //                    AND nft.list_storage_location_nonce = lr.nonce
    //   WHERE
    //       lr.version = 1
    //       AND lr.type = 1
    //       AND lr.data = '0x0000000000000000000000000000000000000004'
    // ) AS subquery;
    // Define the subquery
    const subquery = this.db
      .selectFrom('list_records as lr')
      .innerJoin('list_nfts as nft', join =>
        join
          .onRef('nft.list_storage_location_chain_id', '=', 'lr.chain_id')
          .onRef('nft.list_storage_location_contract_address', '=', 'lr.contract_address')
          .onRef('nft.list_storage_location_nonce', '=', 'lr.nonce')
      )
      .select(['lr.chain_id', 'lr.contract_address', 'lr.nonce', 'nft.token_id', 'nft.list_user'])
      .where('version', '=', 1)
      .where('type', '=', 1)
      .where('data', '=', address)
      .orderBy('nft.token_id', 'asc')

    const result = await subquery.execute()
    if (result === undefined) {
      return []
    }
    return result.map(({ token_id, list_user }) => ({
      token_id: Number(token_id),
      list_user: list_user || ''
    }))
  }
}
