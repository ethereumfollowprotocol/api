import { database } from '#/database'
import type { DB } from '#/types'
import { decodeListLocationTypeV1 } from '#/types/list-location-type'
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

  async getListLocation(tokenId: bigint): Promise<string | undefined> {
    const result = await this.db
      .selectFrom('list_metadata')
      .select('value')
      .where('token_id', '=', tokenId.toString())
      .where('key', '=', 'efp.list.location')
      .executeTakeFirst()
    return result?.value
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

  async getFollowerCount(address: `0x${string}`): Promise<number> {
    const possibleDuplicates = await this.getFollowers(address)
    const uniqueUsers = new Set(possibleDuplicates.map(({ listUser }) => listUser))
    return uniqueUsers.size
  }

  async getFollowers(address: `0x${string}`): Promise<{ tokenId: number; listUser: string }[]> {
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

    const result = await subquery.execute()
    if (result === undefined) {
      return []
    }
    return result.map(({ token_id, list_user }) => ({
      tokenId: Number(token_id),
      listUser: list_user || ''
    }))
  }
}
