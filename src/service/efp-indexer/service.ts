import { type Kysely, type QueryResult, sql } from 'kysely'

import { database } from '#/database'
import type { Address, DB } from '#/types'
import type { ListRecord, TaggedListRecord } from '#/types/list-record'

export type FollowerResponse = {
  address: `0x${string}`
  tags: string[]
  is_following: boolean
  is_blocked: boolean
  is_muted: boolean
}

export type ENSProfile = {
  name: string
  address: `0x${string}`
  avatar: string
}

export type FollowingResponse = TaggedListRecord

export interface IEFPIndexerService {
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
  // incoming relationship means another list has the given address tagged with the given tag
  getIncomingRelationships(
    address: Address,
    tag: string
  ): Promise<{ token_id: bigint; list_user: Address; tags: string[] }[]>
  // outgoing relationship means the given address has the given tag on another list
  getOutgoingRelationships(address: Address, tag: string): Promise<TaggedListRecord[]>
  getRecommended(address: Address): Promise<Address[]>
  getUserFollowersCount(address: Address): Promise<number>
  getUserFollowers(address: Address): Promise<FollowerResponse[]>
  getUserFollowingCount(address: Address): Promise<number>
  getUserFollowing(address: Address): Promise<FollowingResponse[]>
  getUserListRecords(address: Address): Promise<TaggedListRecord[]>
  getUserPrimaryList(address: Address): Promise<bigint | undefined>
}

function bufferize(data: Uint8Array | string): Buffer {
  return typeof data === 'string' ? Buffer.from(data.replace('0x', ''), 'hex') : Buffer.from(data)
}

export class EFPIndexerService implements IEFPIndexerService {
  readonly #db: Kysely<DB>
  readonly env: Env

  // biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
  constructor(env: Env) {
    this.#db = database(env)
    this.env = env;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Followers
  /////////////////////////////////////////////////////////////////////////////

  async getUserFollowersCount(address: Address): Promise<number> {
    return new Set(await this.getUserFollowers(address)).size
  }

  async getUserFollowers(address: Address): Promise<
    {
      address: Address
      tags: string[]
      is_following: boolean
      is_blocked: boolean
      is_muted: boolean
    }[]
  > {
    type Row = {
      efp_list_nft_token_id: bigint
      follower: Address
      tags: string[] | null
      is_following: boolean
      is_blocked: boolean
      is_muted: boolean
    }
    const query = sql<Row>`SELECT * FROM query.get_unique_followers(${address})`
    const result = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map(row => ({
      efp_list_nft_token_id: row.efp_list_nft_token_id,
      address: row.follower,
      tags: row.tags?.sort() || [],
      is_following: row.is_following,
      is_blocked: row.is_blocked,
      is_muted: row.is_muted
    }))
  }

  /////////////////////////////////////////////////////////////////////////////
  // Following
  /////////////////////////////////////////////////////////////////////////////

  async getUserFollowingCount(address: Address): Promise<number> {
    return new Set(await this.getUserFollowing(address)).size
  }

  async getUserFollowing(address: Address): Promise<TaggedListRecord[]> {
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
      tags: row.tags ? row.tags.sort() : row.tags
    }))
  }

  /////////////////////////////////////////////////////////////////////////////
  // /user list records
  /////////////////////////////////////////////////////////////////////////////

  async getUserListRecords(address: Address): Promise<TaggedListRecord[]> {
    const query = sql<Row>`SELECT * FROM query.get_list_records__record_type_001(${address})`
    const result = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    type Row = {
      efp_list_nft_token_id: bigint
      record_version: number
      record_type: number
      address: `0x${string}`
      tags: string[]
    }

    return result.rows.map((row: Row) => ({
      version: row.record_version,
      recordType: row.record_type,
      data: bufferize(row.address),
      tags: row.tags ? row.tags.sort() : row.tags
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
      tags: row.tags ? row.tags.sort() : row.tags
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
      tags: row.tags ? row.tags.sort() : row.tags
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
      tags: row.tags ? row.tags.sort() : row.tags
    }))
  }

  /////////////////////////////////////////////////////////////////////////////
  // Recommendations
  /////////////////////////////////////////////////////////////////////////////

  async getRecommended(address: Address): Promise<Address[]> {

    interface QueryResponse {
      data: Data;
    }
    
    interface Data {
    //   Wallet: Wallet;
      ethereum: Ethereum
    }
    
    interface Ethereum {
        TokenBalance: TokenBalance
        TokenNft: TokenNFT
    }

    interface TokenNFT {
        tokenBalances: Owner[]
    }

    interface Owner {

    }

    interface TokenBalance {
        tokenAddress: Address
    }

    interface Error {
      message: string;
    }
    
    const AIRSTACK_API_URL = "https://api.airstack.xyz/graphql";
    const AIRSTACK_API_KEY = this.env.AIRSTACK_API_KEY;
    if (!AIRSTACK_API_KEY) throw new Error("AIRSTACK_API_KEY not set");

    let query = `query GetNFTs {
        ethereum: TokenBalances(
          input: {
            filter: {
              owner: { _in: ["${address}"] }
              tokenType: { _in: [ ERC721] }
            }
            blockchain: ethereum
            limit: 200
          }
        ) {
          TokenBalance {
            tokenAddress
          }
        }
      }`;

    const res = await fetch(AIRSTACK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: AIRSTACK_API_KEY,
      },
      body: JSON.stringify({ query }),
    });
       
    const json = (await res?.json()) as QueryResponse;
    const data = json?.data;

    const formatted = data?.ethereum?.TokenBalance.map(({tokenAddress})=> tokenAddress)
    const queryFormattedTokens = formatted.filter( (address, index) => formatted.indexOf(address) === index );

    query = `query GetNFTHoldersAndImages($queryFormattedTokens: [Address!]!) {
        ethereum: TokenNfts(
          input: {
            filter: {
              address: {
                _in: $queryFormattedTokens
              }
            }
            blockchain: ethereum
          }
        ) {
          TokenNft {
            tokenBalances {
              owner {
                identity
                socials(input: { filter: { dappName: { _eq: farcaster } } }) {
                  profileName
                  userId
                }
              }
            }
          }
        }
      }`;
    const holderRes = await fetch(AIRSTACK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: AIRSTACK_API_KEY,
      },
      body: JSON.stringify({ query, variables: {queryFormattedTokens: queryFormattedTokens}}),
    });
       
    const holderJson = (await holderRes?.json()) as QueryResponse;
    const holderData = holderJson?.data;

    const holders = holderData.ethereum.TokenNft.map(
        data => data.tokenBalances.map(
            data => data.owner.identity
        )
    ).flat();
    const dedupedHolders = holders.filter( (address, index) => holders.indexOf(address) === index );
    const accountList = dedupedHolders.slice(0,10);

    return accountList
  }

  /////////////////////////////////////////////////////////////////////////////
  // Primary List
  /////////////////////////////////////////////////////////////////////////////

  async getUserPrimaryList(address: Address): Promise<bigint | undefined> {
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
