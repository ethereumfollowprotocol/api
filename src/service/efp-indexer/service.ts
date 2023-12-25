import type { Address } from '#/types'
import { sql, type Kysely, type QueryResult } from 'kysely'

import { database } from '#/database'
import type { DB } from '#/types'
import { decodeListStorageLocation } from '#/types/list-location-type'
import type { ListRecord, TaggedListRecord } from '#/types/list-record'

export interface IEFPIndexerService {
  getFollowersCount(address: `0x${string}`): Promise<number>
  getFollowers(address: `0x${string}`): Promise<Address[]>
  getFollowingCount(address: `0x${string}`): Promise<number>
  getFollowing(address: `0x${string}`): Promise<TaggedListRecord[]>
  getLeaderboardFollowers(limit: number): Promise<{ address: Address; followers_count: number }[]>
  getLeaderboardFollowing(limit: number): Promise<{ address: Address; following_count: number }[]>
  getListStorageLocation(tokenId: bigint): Promise<`0x${string}` | undefined>
  getListRecordCount(tokenId: bigint): Promise<number>
  getListRecords(tokenId: bigint): Promise<ListRecord[]>
  getListRecordsWithTags(
    tokenId: bigint
  ): Promise<{ version: number; recordType: number; data: `0x${string}`; tags: string[] }[]>
  getPrimaryList(address: Address): Promise<bigint | undefined>
}

export class EFPIndexerService implements IEFPIndexerService {
  readonly #db: Kysely<DB>

  constructor(env: Env) {
    this.#db = database(env)
  }

  /////////////////////////////////////////////////////////////////////////////
  // Followers
  /////////////////////////////////////////////////////////////////////////////

  async getFollowersCount(address: Address): Promise<number> {
    return new Set(await this.getFollowers(address)).size
  }

  async getFollowers(address: Address): Promise<Address[]> {
    const query = sql`SELECT * FROM public.get_unique_followers(${address.toLowerCase()})`
    const result: QueryResult<unknown> = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: any) => row.list_user)
  }

  /////////////////////////////////////////////////////////////////////////////
  // Following
  /////////////////////////////////////////////////////////////////////////////

  async getFollowingCount(address: `0x${string}`): Promise<number> {
    return new Set(await this.getFollowing(address)).size
  }

  async getFollowing(address: `0x${string}`): Promise<TaggedListRecord[]> {
    const query = sql`SELECT * FROM public.get_following(${address.toLowerCase()})`
    const result: QueryResult<unknown> = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    type Row = {
      token_id: bigint
      version: number
      record_type: number
      data: string
      tags: string[]
    }
    const rows: Row[] = result.rows as {
      token_id: bigint
      version: number
      record_type: number
      data: string
      tags: string[]
    }[]

    return rows.map((row: Row) => ({
      version: row.version,
      recordType: row.record_type,
      data: Buffer.from(row.data.replace('0x', ''), 'hex'),
      tags: row.tags.sort()
    }))
  }

  /////////////////////////////////////////////////////////////////////////////
  // Leaderboard
  /////////////////////////////////////////////////////////////////////////////

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

  /////////////////////////////////////////////////////////////////////////////
  // List Storage Location
  /////////////////////////////////////////////////////////////////////////////

  async getListStorageLocation(tokenId: bigint): Promise<`0x${string}` | undefined> {
    const result = await this.#db
      .selectFrom('list_nfts')
      .select('list_storage_location')
      .where('token_id', '=', tokenId.toString())
      .executeTakeFirst()
    return (result?.list_storage_location as Address) || undefined
  }

  /////////////////////////////////////////////////////////////////////////////
  // List Records
  /////////////////////////////////////////////////////////////////////////////

  async getListRecords(tokenId: bigint): Promise<ListRecord[]> {
    const query = sql`SELECT * FROM public.get_list_records(${tokenId})`
    const result: QueryResult<unknown> = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    type Row = {
      version: number
      record_type: number
      data: `0x${string}`
    }

    return (result.rows as Row[]).map((row: Row) => ({
      version: row.version,
      recordType: row.record_type,
      data: Buffer.from(row.data.replace('0x', ''), 'hex')
    }))
  }

  async getListRecordCount(tokenId: bigint): Promise<number> {
    return (await this.getListRecords(tokenId)).length
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
        'lr.record_type',
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
    const filtered: { version: number; record_type: number; data: `0x${string}`; agg_tags: string[] }[] = result.filter(
      ({ version, record_type, data, agg_tags }) =>
        version !== null && record_type !== null && data !== null && agg_tags !== null
    ) as { version: number; record_type: number; data: `0x${string}`; agg_tags: string[] }[]
    return filtered.map(({ version, record_type, data, agg_tags }) => ({
      version,
      recordType: record_type,
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

  /////////////////////////////////////////////////////////////////////////////
  // Blocks
  /////////////////////////////////////////////////////////////////////////////

  async getBlocks(tokenId: bigint): Promise<{ version: number; recordType: number; data: `0x${string}` }[]> {
    return await this.getListRecordsFilterByTags(tokenId, 'block')
  }

  async getWhoBlocks(address: Address): Promise<{ token_id: number; list_user: string }[]> {
    const result = await this.#db
      .selectFrom('list_record_tags_extended_view')
      .select(['token_id', 'list_user'])
      .where('has_block_tag', '=', true)
      .where('version', '=', 1)
      .where('record_type', '=', 1)
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

  /////////////////////////////////////////////////////////////////////////////
  // Mutes
  /////////////////////////////////////////////////////////////////////////////

  async getMutes(tokenId: bigint): Promise<{ version: number; recordType: number; data: `0x${string}` }[]> {
    return await this.getListRecordsFilterByTags(tokenId, 'mute')
  }

  async getWhoMutes(address: Address): Promise<{ token_id: number; list_user: string }[]> {
    const result = await this.#db
      .selectFrom('list_record_tags_extended_view')
      .select(['token_id', 'list_user'])
      .where('has_mute_tag', '=', true)
      .where('version', '=', 1)
      .where('record_type', '=', 1)
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

  /////////////////////////////////////////////////////////////////////////////
  // Primary List
  /////////////////////////////////////////////////////////////////////////////

  async getPrimaryList(address: Address): Promise<bigint | undefined> {
    // Call the enhanced PostgreSQL function
    const query = sql`SELECT public.get_primary_list(${address.toLowerCase()}) AS primary_list`
    const result: QueryResult<unknown> = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return undefined
    }

    return (result.rows[0] as { primary_list: bigint }).primary_list
  }
}
