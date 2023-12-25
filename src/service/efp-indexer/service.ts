import type { Address, MaybePromise } from '#/types'
import { sql, type Kysely, type QueryResult } from 'kysely'

import { database } from '#/database'
import type { DB } from '#/types'
import { decodeListStorageLocation } from '#/types/list-location-type'

function decodePrimaryList(hexstringUint256: string): number | undefined {
  if (!hexstringUint256.startsWith('0x') || hexstringUint256.length !== 66) {
    return undefined
  }
  const tokenId = BigInt(hexstringUint256.slice(2))
  if (tokenId > Number.MAX_SAFE_INTEGER) {
    return undefined
  }
  return Number(tokenId)
}

export interface IEFPIndexerService {
  getFollowersCount(address: `0x${string}`): Promise<number>
  getFollowers(address: `0x${string}`): Promise<Address[]>
  getFollowingCount(address: `0x${string}`): Promise<number>
  getFollowing(address: `0x${string}`): Promise<Address[]>
  getLeaderboardFollowers(limit: number): Promise<{ address: Address; followers_count: number }[]>
  getLeaderboardFollowing(limit: number): Promise<{ address: Address; following_count: number }[]>
  getListStorageLocation(tokenId: bigint): Promise<`0x${string}` | undefined>
  getListRecordCount(tokenId: bigint): MaybePromise<number>
  getListRecords(tokenId: bigint): Promise<{ version: number; recordType: number; data: `0x${string}` }[]>
  getListRecordsWithTags(
    tokenId: bigint
  ): Promise<{ version: number; recordType: number; data: `0x${string}`; tags: string[] }[]>
  getPrimaryList(address: Address): Promise<number | undefined>
}

export class EFPIndexerService implements IEFPIndexerService {
  readonly #db: Kysely<DB>

  constructor(env: Env) {
    this.#db = database(env)
  }

  async getPrimaryList(address: Address): Promise<number | undefined> {
    const result1 = await this.#db
      .selectFrom('account_metadata')
      .select('value')
      .where('address', '=', address)
      .where('key', '=', 'efp.list.primary')
      .executeTakeFirst()

    const accountMetadataPrimaryList = result1?.value as string | undefined

    if (accountMetadataPrimaryList?.startsWith('0x')) {
      return decodePrimaryList(accountMetadataPrimaryList)
    }

    // console.log("didn't find account metadata primary list for address: ", address)
    // else try and look for an EFP List NFT where
    // the user is set to the address
    // try looking for a list_nft_view WHERE list_user = address
    const result2 = await this.#db
      .selectFrom('list_nfts_view')
      .select('token_id')
      .where('list_user', '=', address)
      .execute()
    const tokenIds = result2.map(({ token_id }) => token_id)
    if (tokenIds.length === 0) {
      // console.log("didn't find any list nft for address: ", address)
      return undefined
    }
    // else choose the lowest token id
    const lowestTokenId: string | null | undefined = tokenIds.sort((a, b) => {
      if (a === null || b === null) {
        return 0
      }
      return Number(a) - Number(b)
    })[0]
    if (lowestTokenId === undefined || lowestTokenId === null) {
      return undefined
    }
    const val: number = Number(lowestTokenId)
    return val
  }

  async getListStorageLocation(tokenId: bigint): Promise<`0x${string}` | undefined> {
    const result = await this.#db
      .selectFrom('list_nfts')
      .select('list_storage_location')
      .where('token_id', '=', tokenId.toString())
      .executeTakeFirst()
    return (result?.list_storage_location as Address) || undefined
  }

  async getListRecordCount(tokenId: bigint): Promise<number> {
    const listStorageLocation: Address | undefined = await this.getListStorageLocation(tokenId)
    if (listStorageLocation === undefined || listStorageLocation.length !== 2 + (1 + 1 + 32 + 20 + 32) * 2) {
      return 0
    }
    const { version, locationType, chainId, contractAddress, nonce } = decodeListStorageLocation(listStorageLocation)
    console.log({ version, locationType, chainId, contractAddress, nonce })

    const countResult = await this.#db
      .selectFrom('list_records')
      .select(({ fn, val, ref }) => [
        // The `fn` module contains the most common
        // functions.
        fn
          .count<number>('record')
          .as('count')
      ])
      // TODO: WHERE chain id
      .where('contract_address', '=', contractAddress)
      .where('nonce', '=', nonce.toString())
      // TODO: GROUP BY chain id
      .groupBy('contract_address')
      .groupBy('nonce')
      .executeTakeFirst()
    return Number(countResult?.count ?? 0)
  }

  async getListRecords(tokenId: bigint): Promise<{ version: number; recordType: number; data: `0x${string}` }[]> {
    const listStorageLocation = (await this.getListStorageLocation(tokenId)) as Address
    if (listStorageLocation === undefined || listStorageLocation.length !== 2 + (1 + 1 + 32 + 20 + 32) * 2) {
      return []
    }
    const { version, locationType, chainId, contractAddress, nonce } = decodeListStorageLocation(listStorageLocation)
    const result = await this.#db
      .selectFrom('list_records')
      .select(['version', 'type', 'data'])
      // TODO: WHERE chain id
      .where('contract_address', '=', contractAddress)
      .where('nonce', '=', nonce.toString())
      .execute()
    return result.map(({ version, type, data }) => ({
      version,
      recordType: type,
      data: data as Address
    }))
  }

  getFollowingCount(address: `0x${string}`): Promise<number> {
    throw new Error('Method not implemented.')
  }

  getFollowing(address: `0x${string}`): Promise<`0x${string}`[]> {
    throw new Error('Method not implemented.')
  }

  async getListRecordsWithTags(
    tokenId: bigint
  ): Promise<{ version: number; recordType: number; data: `0x${string}`; tags: string[] }[]> {
    const listStorageLocation = (await this.getListStorageLocation(tokenId)) as Address
    if (listStorageLocation === undefined || listStorageLocation.length !== 2 + (1 + 1 + 32 + 20 + 32) * 2) {
      return []
    }
    const { version, locationType, chainId, contractAddress, nonce } = decodeListStorageLocation(listStorageLocation)
    const result = await this.#db
      .selectFrom('list_record_tags as tags')
      .fullJoin('list_records as lr', join =>
        join
          .onRef('tags.chain_id', '=', 'lr.chain_id')
          .onRef('tags.contract_address', '=', 'lr.contract_address')
          .onRef('tags.nonce', '=', 'lr.nonce')
          .onRef('tags.record', '=', 'lr.record')
      )
      .select(({ fn, ref }) => [
        'lr.version',
        'lr.type',
        'lr.data',

        // Using fn.agg to aggregate tags into an array
        fn
          .agg<string[]>('array_agg', ['tags.tag'])
          .as('agg_tags')
      ])
      .where('lr.chain_id', '=', chainId.toString())
      .where('lr.contract_address', '=', contractAddress.toLowerCase())
      .where('lr.nonce', '=', nonce.toString())
      .groupBy(['lr.chain_id', 'lr.contract_address', 'lr.nonce', 'lr.record'])
      .execute()
    // filter nulls
    const filtered: { version: number; type: number; data: `0x${string}`; agg_tags: string[] }[] = result.filter(
      ({ version, type, data, agg_tags }) => version !== null && type !== null && data !== null && agg_tags !== null
    ) as { version: number; type: number; data: `0x${string}`; agg_tags: string[] }[]
    return filtered.map(({ version, type, data, agg_tags }) => ({
      version,
      recordType: type,
      data: data as Address,
      tags: agg_tags as string[]
    }))
  }

  async getListRecordsFilterByTags(
    tokenId: bigint,
    tag: string
  ): Promise<{ version: number; recordType: number; data: `0x${string}` }[]> {
    const listStorageLocation = (await this.getListStorageLocation(tokenId)) as Address
    if (listStorageLocation === undefined || listStorageLocation.length !== 2 + (1 + 1 + 32 + 20 + 32) * 2) {
      return []
    }
    const { version, locationType, chainId, contractAddress, nonce } = decodeListStorageLocation(listStorageLocation)
    const result = await this.#db
      .selectFrom('list_record_tags')
      .select(['record'])
      .where('chain_id', '=', chainId.toString())
      .where('contract_address', '=', contractAddress)
      .where('nonce', '=', nonce.toString())
      .where('tag', '=', tag)
      .execute()
    // record will be a string 0x1234567890abcdef...
    // the first byte is version
    // the second byte is recordType
    // the rest is data
    // need to decode and convert to correct format
    return result.map(({ record }) => {
      const version: number = Number(`0x${record.slice(2, 4)}`)
      const recordType = Number(`0x${record.slice(4, 6)}`)
      const data: Address = `0x${record.slice(6)}` as Address
      return {
        version,
        recordType,
        data
      }
    })
  }

  async getFollowersCount(address: Address): Promise<number> {
    const possibleDuplicates = await this.getFollowers(address)
    const uniqueUsers = new Set(possibleDuplicates)
    return uniqueUsers.size
  }

  async getFollowers(address: Address): Promise<Address[]> {
    const query = sql`SELECT * FROM public.get_unique_followers(${address.toLowerCase()})`
    const result: QueryResult<unknown> = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: any) => row.list_user)
  }

  async getWhoBlocks(address: Address): Promise<{ token_id: number; list_user: string }[]> {
    const result = await this.#db
      .selectFrom('list_record_tags_extended_view')
      .select(['token_id', 'list_user'])
      .where('has_block_tag', '=', true)
      .where('version', '=', 1)
      .where('type', '=', 1)
      .where('data', '=', address)
      .execute()

    const filtered: { token_id: number; list_user: string }[] = []
    for (const row of result) {
      if (row.token_id === null || row.list_user === null) {
        continue
      }
      filtered.push({
        token_id: Number(row.token_id),
        list_user: row.list_user
      })
    }

    return filtered.map(row => ({
      token_id: Number(row.token_id),
      list_user: row.list_user
    }))
  }

  async getWhoMutes(address: Address): Promise<{ token_id: number; list_user: string }[]> {
    const result = await this.#db
      .selectFrom('list_record_tags_extended_view')
      .select(['token_id', 'list_user'])
      .where('has_mute_tag', '=', true)
      .where('version', '=', 1)
      .where('type', '=', 1)
      .where('data', '=', address)
      .execute()

    const filtered: { token_id: number; list_user: string }[] = []
    for (const row of result) {
      if (row.token_id === null || row.list_user === null) {
        continue
      }
      filtered.push({
        token_id: Number(row.token_id),
        list_user: row.list_user
      })
    }

    return filtered.map(row => ({
      token_id: Number(row.token_id),
      list_user: row.list_user
    }))
  }

  async getBlocks(tokenId: bigint): Promise<{ version: number; recordType: number; data: `0x${string}` }[]> {
    return await this.getListRecordsFilterByTags(tokenId, 'block')
  }

  async getMutes(tokenId: bigint): Promise<{ version: number; recordType: number; data: `0x${string}` }[]> {
    return await this.getListRecordsFilterByTags(tokenId, 'mute')
  }

  async getLeaderboardFollowers(limit: number): Promise<{ address: Address; followers_count: number }[]> {
    const query = sql`SELECT * FROM public.count_unique_followers_by_address(${limit})`
    const result: QueryResult<unknown> = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: any) => ({
      address: row.address,
      followers_count: row.followers_count
    }))
  }

  async getLeaderboardFollowing(limit: number): Promise<{ address: Address; following_count: number }[]> {
    const query = sql`SELECT * FROM public.count_unique_following_by_address(${limit})`
    const result: QueryResult<unknown> = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: any) => ({
      address: row.address,
      following_count: row.following_count
    }))
  }
}
