import { type Kysely, type QueryResult, sql } from 'kysely'

import { database } from '#/database'
import type { Address, DB } from '#/types'
import type { ListRecord, TaggedListRecord } from '#/types/list-record'

export interface IEFPIndexerService {
  getFollowersCount(address: Address): Promise<number>
  getFollowers(address: Address): Promise<
    {
      follower: Address
      tags: string[]
      isFollowing: boolean
      isBlocked: boolean
      isMuted: boolean
    }[]
  >
  getFollowingCount(address: Address): Promise<number>
  getFollowing(address: Address): Promise<TaggedListRecord[]>
  getLeaderboardBlocked(limit: number): Promise<{ rank: number; address: Address; blocked_by_count: number }[]>
  getLeaderboardBlocks(limit: number): Promise<{ rank: number; address: Address; blocks_count: number }[]>
  getLeaderboardFollowers(limit: number): Promise<{ rank: number; address: Address; followers_count: number }[]>
  getLeaderboardFollowing(limit: number): Promise<{ rank: number; address: Address; following_count: number }[]>
  getLeaderboardMuted(limit: number): Promise<{ rank: number; address: Address; muted_by_count: number }[]>
  getLeaderboardMutes(limit: number): Promise<{ rank: number; address: Address; mutes_count: number }[]>
  getDebugNumEvents(): Promise<number>
  getDebugNumListOps(): Promise<number>
  getDebugTotalSupply(): Promise<number>
  // getListStorageLocation(tokenId: bigint): Promise<`0x${string}` | undefined>
  getListRecordCount(tokenId: bigint): Promise<number>
  getListRecords(tokenId: bigint): Promise<ListRecord[]>
  getListRecordsWithTags(tokenId: bigint): Promise<TaggedListRecord[]>
  getPrimaryList(address: Address): Promise<bigint | undefined>
  // incoming relationship means another list has the given address tagged with the given tag
  getIncomingRelationships(
    address: Address,
    tag: string
  ): Promise<{ token_id: bigint; list_user: Address; tags: string[] }[]>
  // outgoing relationship means the given address has the given tag on another list
  getOutgoingRelationships(address: Address, tag: string): Promise<TaggedListRecord[]>
}

function bufferize(data: Uint8Array | string): Buffer {
  return typeof data === 'string' ? Buffer.from(data.replace('0x', ''), 'hex') : Buffer.from(data)
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

  async getFollowers(address: Address): Promise<
    {
      follower: Address
      tags: string[]
      isFollowing: boolean
      isBlocked: boolean
      isMuted: boolean
    }[]
  > {
    const query = sql`SELECT * FROM query.get_unique_followers(${address})`
    const result = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    type Row = {
      efp_list_token_id: bigint
      follower: Address
      tags: string[] | null
      is_following: boolean
      is_blocked: boolean
      is_muted: boolean
    }

    return result.rows.map((row: unknown) => ({
      follower: (row as Row).follower as Address,
      tags: (row as Row).tags?.sort() || [],
      isFollowing: (row as Row).is_following,
      isBlocked: (row as Row).is_blocked,
      isMuted: (row as Row).is_muted
    }))
  }

  /////////////////////////////////////////////////////////////////////////////
  // Following
  /////////////////////////////////////////////////////////////////////////////

  async getFollowingCount(address: Address): Promise<number> {
    return new Set(await this.getFollowing(address)).size
  }

  async getFollowing(address: Address): Promise<TaggedListRecord[]> {
    const query = sql<Row>`SELECT * FROM query.get_following__record_type_001(${address})`
    const result = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    type Row = {
      efp_list_nft_token_id: bigint
      record_version: number
      record_type: number
      following_address: `0x${string}`
      tags: string[]
    }

    return result.rows.map((row: Row) => ({
      version: row.record_version,
      recordType: row.record_type,
      data: bufferize(row.following_address),
      tags: row.tags.sort()
    }))
  }

  /////////////////////////////////////////////////////////////////////////////
  // Leaderboard
  /////////////////////////////////////////////////////////////////////////////
  async getLeaderboardBlocks(limit: number): Promise<{ rank: number; address: `0x${string}`; blocks_count: number }[]> {
    const query = sql`SELECT * FROM query.get_leaderboard_blocks(${limit})`
    const result: QueryResult<unknown> = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: any, index) => ({
      rank: index + 1,
      address: row.address,
      blocks_count: row.blocks_count
    }))
  }

  async getLeaderboardBlocked(
    limit: number
  ): Promise<{ rank: number; address: `0x${string}`; blocked_by_count: number }[]> {
    const query = sql`SELECT * FROM query.get_leaderboard_blocked(${limit})`
    const result: QueryResult<unknown> = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: any, index) => ({
      rank: index + 1,
      address: row.address,
      blocked_by_count: row.blocked_count
    }))
  }

  async getLeaderboardFollowers(limit: number): Promise<{ rank: number; address: Address; followers_count: number }[]> {
    const query = sql`SELECT * FROM query.get_leaderboard_followers(${limit})`
    const result: QueryResult<unknown> = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: any, index) => ({
      rank: index + 1,
      address: row.address,
      followers_count: row.followers_count
    }))
  }

  async getLeaderboardFollowing(limit: number): Promise<{ rank: number; address: Address; following_count: number }[]> {
    const query = sql`SELECT * FROM query.get_leaderboard_following(${limit})`
    const result: QueryResult<unknown> = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: any, index) => ({
      rank: index + 1,
      address: row.address,
      following_count: row.following_count
    }))
  }

  async getLeaderboardMuted(
    limit: number
  ): Promise<{ rank: number; address: `0x${string}`; muted_by_count: number }[]> {
    const query = sql`SELECT * FROM query.get_leaderboard_muted(${limit})`
    const result: QueryResult<unknown> = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: any, index) => ({
      rank: index + 1,
      address: row.address,
      muted_by_count: row.muted_count
    }))
  }

  async getLeaderboardMutes(limit: number): Promise<{ rank: number; address: `0x${string}`; mutes_count: number }[]> {
    const query = sql`SELECT * FROM query.get_leaderboard_mutes(${limit})`
    const result: QueryResult<unknown> = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: any, index) => ({
      rank: index + 1,
      address: row.address,
      mutes_count: row.mutes_count
    }))
  }

  /////////////////////////////////////////////////////////////////////////////
  // List Storage Location
  /////////////////////////////////////////////////////////////////////////////

  // async getListStorageLocation(tokenId: bigint): Promise<`0x${string}` | undefined> {
  //   const result = await this.#db
  //     .selectFrom('list_nfts')
  //     .select('list_storage_location')
  //     .where('token_id', '=', tokenId.toString())
  //     .executeTakeFirst()
  //   return (result?.list_storage_location as Address) || undefined
  // }

  /////////////////////////////////////////////////////////////////////////////
  // Debug
  /////////////////////////////////////////////////////////////////////////////

  async getDebugNumEvents(): Promise<number> {
    const query = sql<Row>`SELECT query.get_debug_num_events() AS num_events;`
    const result = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return 0
    }

    type Row = {
      num_events: number
    }

    return Number(result.rows[0]?.num_events)
  }

  async getDebugNumListOps(): Promise<number> {
    const query = sql<Row>`SELECT query.get_debug_num_list_ops() AS num_list_ops;`
    const result = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return 0
    }
    type Row = {
      num_list_ops: number
    }

    return Number(result.rows[0]?.num_list_ops)
  }

  async getDebugTotalSupply(): Promise<number> {
    const query = sql<Row>`SELECT query.get_debug_total_supply() AS total_supply;`
    const result = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return 0
    }

    type Row = {
      total_supply: number
    }

    return Number(result.rows[0]?.total_supply)
  }

  /////////////////////////////////////////////////////////////////////////////
  // List Records
  /////////////////////////////////////////////////////////////////////////////

  async getListRecords(tokenId: bigint): Promise<ListRecord[]> {
    const query = sql<Row>`SELECT * FROM query.get_list_records(${tokenId})`
    const result = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    type Row = {
      record_version: number
      record_type: number
      record_data: `0x${string}`
    }

    return result.rows.map((row: Row) => ({
      version: row.record_version,
      recordType: row.record_type,
      data: bufferize(row.record_data)
    }))
  }

  async getListRecordCount(tokenId: bigint): Promise<number> {
    return (await this.getListRecords(tokenId)).length
  }

  async getListRecordsWithTags(tokenId: bigint): Promise<TaggedListRecord[]> {
    const query = sql<Row>`SELECT * FROM query.get_list_record_tags(${tokenId})`
    const result = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    type Row = {
      record_version: number
      record_type: number
      record_data: `0x${string}` | Uint8Array
      tags: string[]
    }

    return result.rows.map((row: Row) => ({
      version: row.record_version,
      recordType: row.record_type,
      data: bufferize(row.record_data),
      tags: row.tags.sort()
    }))
  }

  async getListRecordsFilterByTags(tokenId: bigint, tag: string): Promise<ListRecord[]> {
    const all: TaggedListRecord[] = await this.getListRecordsWithTags(tokenId)
    return all.filter(record => record.tags.includes(tag))
  }

  /////////////////////////////////////////////////////////////////////////////
  // Relationships
  /////////////////////////////////////////////////////////////////////////////

  async getIncomingRelationships(
    address: `0x${string}`,
    tag: string
  ): Promise<{ token_id: bigint; list_user: `0x${string}`; tags: string[] }[]> {
    const query = sql<Row>`SELECT * FROM query.get_incoming_relationships(${address}, ${tag})`
    const result = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    type Row = {
      token_id: bigint
      list_user: Address
      tags: string[]
    }

    return result.rows.map((row: Row) => ({
      token_id: row.token_id,
      list_user: row.list_user,
      tags: row.tags.sort()
    }))
  }

  async getOutgoingRelationships(address: `0x${string}`, tag: string): Promise<TaggedListRecord[]> {
    const query = sql<Row>`SELECT * FROM query.get_outgoing_relationships(${address}, ${tag})`
    const result = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    type Row = {
      token_id: bigint
      list_user: Address
      version: number
      record_type: number
      data: `0x${string}`
      tags: string[]
    }

    return result.rows.map((row: Row) => ({
      version: row.version,
      recordType: row.record_type,
      data: bufferize(row.data),
      tags: row.tags.sort()
    }))
  }

  /////////////////////////////////////////////////////////////////////////////
  // Primary List
  /////////////////////////////////////////////////////////////////////////////

  async getPrimaryList(address: Address): Promise<bigint | undefined> {
    // Call the enhanced PostgreSQL function
    const query = sql<{
      primary_list: bigint
    }>`SELECT query.get_primary_list(${address}) AS primary_list`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return undefined
    }

    return result.rows[0]?.primary_list
  }
}
