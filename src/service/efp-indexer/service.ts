import { type Kysely, type QueryResult, sql } from 'kysely'

import { resize_img_browser } from 'node_modules/@cf-wasm/photon/dist/dts/lib/photon_rs'
import { NETWORKED_WALLET, TEAM_BRANTLY, TEAM_ENCRYPTEDDEGEN, TEAM_THROW } from '#/constant'
import { database } from '#/database'
import type { Address, DB } from '#/types'
import type { Environment } from '#/types/index'
import { type ListRecord, type TaggedListRecord, hexlify } from '#/types/list-record'

export type CommonFollowers = {
  address: Address
  name: string
  avatar: string
  mutuals_rank: number
}

export type FollowerResponse = {
  address: `0x${string}`
  tags: string[]
  is_following: boolean
  is_blocked: boolean
  is_muted: boolean
}

export type FollowStateResponse = {
  follow: boolean
  block: boolean
  mute: boolean
}

export type TagResponse = {
  address: Address
  tag: string
}
export type TagsResponse = {
  address: Address
  tags: string[]
}

export type FollowingRow = {
  efp_list_nft_token_id: bigint
  record_version: number
  record_type: number
  following_address: `0x${string}`
  tags: string[]
}

export type SearchFollowingRow = FollowingRow & {
  name: string | null
  avatar: string | null
}

export type FollowerRow = {
  efp_list_nft_token_id: bigint
  follower: Address
  tags: string[] | null
  is_following: boolean
  is_blocked: boolean
  is_muted: boolean
}

export type SearchFollowerRow = FollowerRow & {
  name: string | null
  avatar: string | null
}

export type LeaderBoardRow = {
  address: Address
  name: string | undefined
  avatar: string | undefined
  mutuals_rank: number
  followers_rank: number
  following_rank: number
  blocks_rank: number
  top8_rank: number
  mutuals: number
  following: number
  followers: number
  blocks: number
  top8: number
  updated_at: string
}

export type RankRow = {
  mutuals_rank: number
  followers_rank: number
  following_rank: number
  top8_rank: number
  blocks_rank: number
}

export type RankCountsRow = RankRow & {
  mutuals: number
  followers: number
  following: number
  top8: number
  blocks: number
}

export type DiscoverRow = {
  address: Address
  name: string
  avatar: string
  followers: number
  following: number
  _index?: number
}

export type RecommendedRow = {
  address: Address
  name: string
  avatar: string
}

export type StatsRow = {
  address_count: number
  list_count: number
  list_op_count: number
  user_count: number
}

export type FollowingResponse = TaggedListRecord

export type ENSTaggedListRecord = TaggedListRecord & {
  ens?: {
    name: string | null
    avatar: string | null
  }
}

export interface IEFPIndexerService {
  claimPoapLink(address: Address): Promise<string>
  getAddressByList(token_id: string): Promise<Address | undefined>
  getCommonFollowers(user: Address, target: Address): Promise<CommonFollowers[]>
  getLeaderboardBlocked(limit: number): Promise<{ rank: number; address: Address; blocked_by_count: number }[]>
  getLeaderboardBlocks(limit: number): Promise<{ rank: number; address: Address; blocks_count: number }[]>
  getLeaderboardFollowers(limit: number): Promise<{ rank: number; address: Address; followers_count: number }[]>
  getLeaderboardFollowing(limit: number): Promise<{ rank: number; address: Address; following_count: number }[]>
  getLeaderboardMuted(limit: number): Promise<{ rank: number; address: Address; muted_by_count: number }[]>
  getLeaderboardMutes(limit: number): Promise<{ rank: number; address: Address; mutes_count: number }[]>
  getLeaderboardRanked(
    limit: number,
    offset: number,
    sort: string | undefined,
    direction: string | undefined
  ): Promise<LeaderBoardRow[]>
  getLeaderboardCount(): Promise<number>
  getUserRanks(address: Address): Promise<RankRow>
  getUserRanksCounts(address: Address): Promise<RankCountsRow>
  searchLeaderboard(term: string): Promise<LeaderBoardRow[]>
  getDebugNumEvents(): Promise<number>
  getDebugNumListOps(): Promise<number>
  getDebugTotalSupply(): Promise<number>
  getDiscoverAccounts(limit: string, offset: string): Promise<DiscoverRow[]>
  // getListStorageLocation(tokenId: bigint): Promise<`0x${string}` | undefined>
  getListRecordCount(tokenId: bigint): Promise<number>
  getListRecords(tokenId: bigint): Promise<ListRecord[]>
  getListRecordsWithTags(tokenId: bigint): Promise<TaggedListRecord[]>
  getListFollowerState(tokenId: string, address: Address): Promise<FollowStateResponse>
  getListFollowingState(tokenId: string, address: Address): Promise<FollowStateResponse>
  // incoming relationship means another list has the given address tagged with the given tag
  getIncomingRelationships(
    address: Address,
    tag: string
  ): Promise<{ token_id: bigint; list_user: Address; tags: string[] }[]>
  // outgoing relationship means the given address has the given tag on another list
  getOutgoingRelationships(address: Address, tag: string): Promise<TaggedListRecord[]>
  getRecommended(address: Address, seed: Address | undefined, limit: string, offset: string): Promise<RecommendedRow[]>
  getRecommendedByAddress(
    address: `0x${string}`,
    _seed: `0x${string}`,
    _limit: string,
    _offset: string
  ): Promise<RecommendedRow[]>
  getRecommendedByList(list: string, _seed: `0x${string}`, _limit: string, _offset: string): Promise<RecommendedRow[]>
  getStats(): Promise<StatsRow>
  getTaggedAddressesByList(token_id: string): Promise<TagResponse[]>
  getTaggedAddressesByTags(token_id: string, tags: string[] | undefined): Promise<TagsResponse[]>
  getUserFollowersCount(address: Address): Promise<number>
  getUserFollowersCountByList(token_id: string): Promise<number>
  getUserFollowers(
    address: Address,
    limit: string[] | string | undefined,
    offset: string[] | string | undefined
  ): Promise<FollowerResponse[]>
  getAllUserFollowersByAddressTagSort(
    address: Address,
    limit: string[] | string | undefined,
    offset: string[] | string | undefined,
    tags: string[] | undefined,
    sort: string | undefined
  ): Promise<FollowerResponse[]>
  getUserFollowersByAddressTagSort(
    address: Address,
    limit: string[] | string | undefined,
    offset: string[] | string | undefined,
    tags: string[] | undefined,
    sort: string | undefined
  ): Promise<FollowerResponse[]>
  getUserFollowersByList(
    token_id: string,
    limit: string[] | string | undefined,
    offset: string[] | string | undefined
  ): Promise<FollowerResponse[]>
  getAllUserFollowersByListTagSort(
    token_id: string,
    limit: string[] | string | undefined,
    offset: string[] | string | undefined,
    tags: string[] | undefined,
    sort: string | undefined
  ): Promise<FollowerResponse[]>
  getUserFollowersByListTagSort(
    token_id: string,
    limit: string[] | string | undefined,
    offset: string[] | string | undefined,
    tags: string[] | undefined,
    sort: string | undefined
  ): Promise<FollowerResponse[]>
  getUserFollowerState(addressUser: Address, addressFollower: Address): Promise<FollowStateResponse>
  getUserFollowerTags(address: Address): Promise<TagResponse[]>
  getListFollowerTags(list: string): Promise<TagResponse[]>
  getUserFollowingCount(address: Address): Promise<number>
  getUserFollowingByListRaw(token_id: string): Promise<TaggedListRecord[]>
  getUserFollowingCountByList(token_id: string): Promise<number>
  getUserFollowingRaw(address: Address): Promise<TaggedListRecord[]>
  getUserFollowing(
    address: Address,
    limit: string[] | string | undefined,
    offset: string[] | string | undefined
  ): Promise<FollowingResponse[]>
  getAllUserFollowingAddresses(token_id: string): Promise<Address[]>
  getUserFollowingByAddressTagSort(
    address: Address,
    limit: string[] | string | undefined,
    offset: string[] | string | undefined,
    tags: string[] | undefined,
    sort: string | undefined
  ): Promise<TaggedListRecord[]>
  getAllUserFollowingByAddressTagSort(
    address: Address,
    limit: string[] | string | undefined,
    offset: string[] | string | undefined,
    tags: string[] | undefined,
    sort: string | undefined
  ): Promise<TaggedListRecord[]>
  getUserFollowingByList(
    token_id: string,
    limit: string[] | string | undefined,
    offset: string[] | string | undefined
  ): Promise<FollowingResponse[]>
  getAllUserFollowingByListTagSort(
    token_id: string,
    limit: string,
    offset: string,
    tags: string[],
    sort: string
  ): Promise<TaggedListRecord[]>
  getUserFollowingByListTagSort(
    token_id: string,
    limit: string,
    offset: string,
    tags: string[],
    sort: string
  ): Promise<TaggedListRecord[]>
  getUserListRecords(address: Address): Promise<TaggedListRecord[]>
  getUserLists(address: Address): Promise<number[]>
  getUserPrimaryList(address: Address): Promise<bigint | undefined>
  searchUserFollowersByAddress(
    address: Address,
    limit: string,
    offset: string,
    term: string
  ): Promise<FollowerResponse[]>
  searchUserFollowersByList(list: string, limit: string, offset: string, term: string): Promise<FollowerResponse[]>
  searchUserFollowingByAddress(
    address: Address,
    limit: string,
    offset: string,
    term: string
  ): Promise<ENSTaggedListRecord[]>
  searchUserFollowingByList(list: string, limit: string, offset: string, term: string): Promise<ENSTaggedListRecord[]>
}

function bufferize(data: Uint8Array | string): Buffer {
  return typeof data === 'string' ? Buffer.from(data.replace('0x', ''), 'hex') : Buffer.from(data)
}

export class EFPIndexerService implements IEFPIndexerService {
  readonly #db: Kysely<DB>
  readonly #env: Environment

  // biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
  constructor(env: Env) {
    this.#db = database(env)
    this.#env = env
  }

  /////////////////////////////////////////////////////////////////////////////
  // Followers
  /////////////////////////////////////////////////////////////////////////////

  async getUserFollowersCount(address: Address): Promise<number> {
    // return new Set(await this.getUserFollowers(address)).size
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

    return result?.rows.length
  }

  async getUserFollowers(address: Address, limit: string, offset: string): Promise<FollowerResponse[]> {
    const query = sql<FollowerRow>`SELECT * FROM query.get_unique_followers_page(${address}, ${limit}, ${offset})`
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

  async getAllUserFollowersByAddressTagSort(
    address: Address,
    limit: string,
    offset: string,
    tags: string[],
    sort: string
  ): Promise<FollowerResponse[]> {
    const query = sql<FollowerRow>`SELECT * FROM query.get_all_sorted_followers_by_address_tags(${address}, ${tags}, ${sort}) LIMIT ${limit} OFFSET ${offset}`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: FollowerRow) => ({
      efp_list_nft_token_id: row.efp_list_nft_token_id,
      address: row.follower,
      tags: row.tags?.sort() || [],
      is_following: row.is_following,
      is_blocked: row.is_blocked,
      is_muted: row.is_muted
    }))
  }

  async getUserFollowersByAddressTagSort(
    address: Address,
    limit: string,
    offset: string,
    tags: string[],
    sort: string
  ): Promise<FollowerResponse[]> {
    const query = sql<FollowerRow>`SELECT * FROM query.get_sorted_followers_by_address_tags(${address}, ${tags}, ${sort}) LIMIT ${limit} OFFSET ${offset}`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: FollowerRow) => ({
      efp_list_nft_token_id: row.efp_list_nft_token_id,
      address: row.follower,
      tags: row.tags?.sort() || [],
      is_following: row.is_following,
      is_blocked: row.is_blocked,
      is_muted: row.is_muted
    }))
  }

  async searchUserFollowersByAddress(
    address: Address,
    limit: string,
    offset: string,
    term: string
  ): Promise<FollowerResponse[]> {
    const query = sql<SearchFollowerRow>`SELECT * FROM query.search_followers_by_address(${address}, ${term}, ${limit}, ${offset})`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: SearchFollowerRow) => ({
      efp_list_nft_token_id: row.efp_list_nft_token_id,
      address: row.follower,
      ens: {
        name: row.name,
        avatar: row.avatar
      },
      tags: row.tags?.sort() || [],
      is_following: row.is_following,
      is_blocked: row.is_blocked,
      is_muted: row.is_muted
    }))
  }

  async searchUserFollowersByList(
    list: string,
    limit: string,
    offset: string,
    term: string
  ): Promise<FollowerResponse[]> {
    const query = sql<SearchFollowerRow>`SELECT * FROM query.search_followers_by_list(${list}, ${term}, ${limit}, ${offset})`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: SearchFollowerRow) => ({
      efp_list_nft_token_id: row.efp_list_nft_token_id,
      address: row.follower,
      ens: {
        name: row.name,
        avatar: row.avatar
      },
      tags: row.tags?.sort() || [],
      is_following: row.is_following,
      is_blocked: row.is_blocked,
      is_muted: row.is_muted
    }))
  }
  async getUserFollowersCountByList(token_id: string): Promise<number> {
    type Row = {
      efp_list_nft_token_id: bigint
      follower: Address
      tags: string[] | null
      is_following: boolean
      is_blocked: boolean
      is_muted: boolean
    }
    const query = sql<Row>`SELECT * FROM query.get_unique_followers_by_list(${token_id})`
    const result = await query.execute(this.#db)

    return result?.rows.length
  }

  async getUserFollowersByList(
    token_id: string,
    limit: string,
    offset: string
  ): Promise<
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
    const query = sql<Row>`SELECT * FROM query.get_unique_followers_page_by_list(${token_id}, ${limit}, ${offset})`
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

  async getAllUserFollowersByListTagSort(
    token_id: string,
    limit: string,
    offset: string,
    tags: string[],
    sort: string
  ): Promise<FollowerResponse[]> {
    const query = sql<FollowerRow>`SELECT * FROM query.get_all_sorted_followers_by_list_tags(${token_id}, ${tags}, ${sort}) LIMIT ${limit} OFFSET ${offset}`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: FollowerRow) => ({
      efp_list_nft_token_id: row.efp_list_nft_token_id,
      address: row.follower,
      tags: row.tags?.sort() || [],
      is_following: row.is_following,
      is_blocked: row.is_blocked,
      is_muted: row.is_muted
    }))
  }

  async getUserFollowersByListTagSort(
    token_id: string,
    limit: string,
    offset: string,
    tags: string[],
    sort: string
  ): Promise<FollowerResponse[]> {
    const query = sql<FollowerRow>`SELECT * FROM query.get_sorted_followers_by_list_tags(${token_id}, ${tags}, ${sort}) LIMIT ${limit} OFFSET ${offset}`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: FollowerRow) => ({
      efp_list_nft_token_id: row.efp_list_nft_token_id,
      address: row.follower,
      tags: row.tags?.sort() || [],
      is_following: row.is_following,
      is_blocked: row.is_blocked,
      is_muted: row.is_muted
    }))
  }

  async getUserFollowerTags(address: Address): Promise<TagResponse[]> {
    const query = sql<{
      address: Address
      tag: string
    }>`SELECT follower as address, UNNEST(tags) as tag FROM query.get_sorted_followers_by_address_tags(${address}, null, 'DESC') WHERE cardinality(tags) > 0`
    const result = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows
  }

  async getListFollowerTags(list: string): Promise<TagResponse[]> {
    const query = sql<{
      address: Address
      tag: string
    }>`SELECT follower as address, UNNEST(tags) as tag FROM query.get_all_sorted_followers_by_list_tags(${list}, null, 'DESC') WHERE cardinality(tags) > 0`
    const result = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows
  }
  /////////////////////////////////////////////////////////////////////////////
  // Following
  /////////////////////////////////////////////////////////////////////////////

  async getUserFollowingCount(address: Address): Promise<number> {
    const query = sql<FollowingRow>`SELECT * FROM query.get_following__record_type_001(${address})`
    const result = await query.execute(this.#db)

    return result?.rows.length
  }

  async getUserFollowing(address: Address, limit: string, offset: string): Promise<TaggedListRecord[]> {
    const query = sql<FollowingRow>`SELECT * FROM query.get_following__record_type_page(${address}, ${limit}, ${offset})`
    const result = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: FollowingRow) => ({
      version: row.record_version,
      recordType: row.record_type,
      data: bufferize(row.following_address),
      address: bufferize(row.following_address),
      tags: row.tags ? row.tags.sort() : row.tags
    }))
  }

  async getAllUserFollowingAddresses(token_id: string): Promise<Address[]> {
    const query = sql<{
      address: Address
    }>`SELECT following_address as address FROM query.get_all_following_by_list(${token_id})`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return []
    }
    return result.rows.map((row: { address: Address }) => row.address)
  }

  async getCommonFollowers(user: Address, target: Address): Promise<CommonFollowers[]> {
    const query = sql<CommonFollowers>`SELECT * FROM query.get_common_followers_by_address(${user}, ${target})`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return []
    }
    // return result.rows.map((row: { address: Address }) => row.address)
    return result.rows
  }

  async getAllUserFollowingByAddressTagSort(
    address: Address,
    limit: string,
    offset: string,
    tags: string[],
    sort: string
  ): Promise<TaggedListRecord[]> {
    const query = sql<FollowingRow>`SELECT * FROM query.get_all_sorted_following_by_address_tags(${address}, ${tags}, ${sort}) LIMIT ${limit} OFFSET ${offset}`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: FollowingRow) => ({
      version: row.record_version,
      recordType: row.record_type,
      data: bufferize(row.following_address),
      address: bufferize(row.following_address),
      tags: row.tags ? row.tags.sort() : row.tags
    }))
  }

  async getUserFollowingByAddressTagSort(
    address: Address,
    limit: string,
    offset: string,
    tags: string[],
    sort: string
  ): Promise<TaggedListRecord[]> {
    const query = sql<FollowingRow>`SELECT * FROM query.get_sorted_following_by_address_tags(${address}, ${tags}, ${sort}) LIMIT ${limit} OFFSET ${offset}`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: FollowingRow) => ({
      version: row.record_version,
      recordType: row.record_type,
      data: bufferize(row.following_address),
      address: bufferize(row.following_address),
      tags: row.tags ? row.tags.sort() : row.tags
    }))
  }

  async searchUserFollowingByAddress(
    address: Address,
    limit: string,
    offset: string,
    term: string
  ): Promise<ENSTaggedListRecord[]> {
    const query = sql<SearchFollowingRow>`SELECT * FROM query.search_following_by_address(${address}, ${term}, ${limit}, ${offset})`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: SearchFollowingRow) => ({
      version: row.record_version,
      recordType: row.record_type,
      data: bufferize(row.following_address),
      address: bufferize(row.following_address),
      ens: {
        name: row.name,
        avatar: row.avatar
      },
      tags: row.tags ? row.tags.sort() : row.tags
    }))
  }

  async searchUserFollowingByList(
    list: string,
    limit: string,
    offset: string,
    term: string
  ): Promise<ENSTaggedListRecord[]> {
    const query = sql<SearchFollowingRow>`SELECT * FROM query.search_following_by_list(${list}, ${term}, ${limit}, ${offset})`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: SearchFollowingRow) => ({
      version: row.record_version,
      recordType: row.record_type,
      data: bufferize(row.following_address),
      address: bufferize(row.following_address),
      ens: {
        name: row.name,
        avatar: row.avatar
      },
      tags: row.tags ? row.tags.sort() : row.tags
    }))
  }

  async getUserFollowingRaw(address: Address): Promise<TaggedListRecord[]> {
    const query = sql<FollowingRow>`SELECT * FROM query.get_following__record_type_001(${address})`
    const result = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: FollowingRow) => ({
      version: row.record_version,
      recordType: row.record_type,
      data: bufferize(row.following_address),
      address: bufferize(row.following_address),
      tags: row.tags ? row.tags.sort() : row.tags
    }))
  }

  async getUserFollowingCountByList(token_id: string): Promise<number> {
    const query = sql<FollowingRow>`SELECT * FROM query.get_following_by_list(${token_id})`
    const result = await query.execute(this.#db)

    return result?.rows.length
  }

  async getUserFollowingByList(token_id: string, limit: string, offset: string): Promise<TaggedListRecord[]> {
    const query = sql<FollowingRow>`SELECT * FROM query.get_following_page_by_list(${token_id}, ${limit}, ${offset})`
    const result = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: FollowingRow) => ({
      version: row.record_version,
      recordType: row.record_type,
      data: bufferize(row.following_address),
      address: bufferize(row.following_address),
      tags: row.tags ? row.tags.sort() : row.tags
    }))
  }

  async getUserFollowingByListRaw(token_id: string): Promise<TaggedListRecord[]> {
    const query = sql<FollowingRow>`SELECT * FROM query.get_all_following_by_list(${token_id})`
    const result = await query.execute(this.#db)

    return result.rows.map((row: FollowingRow) => ({
      version: row.record_version,
      recordType: row.record_type,
      data: bufferize(row.following_address),
      address: bufferize(row.following_address),
      tags: row.tags ? row.tags.sort() : row.tags
    }))
  }

  async getAllUserFollowingByListTagSort(
    token_id: string,
    limit: string,
    offset: string,
    tags: string[],
    sort: string
  ): Promise<TaggedListRecord[]> {
    const query = sql<FollowingRow>`SELECT * FROM query.get_all_sorted_following_by_list_tags(${token_id}, ${tags}, ${sort}) LIMIT ${limit} OFFSET ${offset}`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: FollowingRow) => ({
      version: row.record_version,
      recordType: row.record_type,
      data: bufferize(row.following_address),
      address: bufferize(row.following_address),
      tags: row.tags ? row.tags.sort() : row.tags
    }))
  }

  async getUserFollowingByListTagSort(
    token_id: string,
    limit: string,
    offset: string,
    tags: string[],
    sort: string
  ): Promise<TaggedListRecord[]> {
    const query = sql<FollowingRow>`SELECT * FROM query.get_sorted_following_by_list_tags(${token_id}, ${tags}, ${sort}) LIMIT ${limit} OFFSET ${offset}`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: FollowingRow) => ({
      version: row.record_version,
      recordType: row.record_type,
      data: bufferize(row.following_address),
      address: bufferize(row.following_address),
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
      address: bufferize(row.address),
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

  async getLeaderboardRanked(
    limit: number,
    offset: number,
    sort: string | undefined,
    direction: string
  ): Promise<LeaderBoardRow[]> {
    const query = sql<LeaderBoardRow>`SELECT * FROM query.get_leaderboard_ranked(${limit}, ${offset}, ${sort}, ${direction})`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: LeaderBoardRow) => ({
      address: row.address,
      name: row.name,
      avatar: row.avatar,
      mutuals_rank: row.mutuals_rank,
      followers_rank: row.followers_rank,
      following_rank: row.following_rank,
      blocks_rank: row.blocks_rank,
      top8_rank: row.top8_rank,
      mutuals: row.mutuals,
      following: row.following,
      followers: row.followers,
      blocks: row.blocks,
      top8: row.top8,
      updated_at: row.updated_at
    }))
  }

  async getLeaderboardCount(): Promise<number> {
    const query = sql<{ count: number }>`SELECT COUNT(*) FROM public.efp_leaderboard`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return 0
    }

    return result.rows[0] ? result.rows[0]?.count : 0
  }

  async getUserRanks(address: Address): Promise<RankRow> {
    const query = sql<RankRow>`SELECT * FROM query.get_user_ranks(${address})`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return {
        mutuals_rank: 0,
        followers_rank: 0,
        following_rank: 0,
        top8_rank: 0,
        blocks_rank: 0
      }
    }

    return {
      mutuals_rank: result.rows[0] ? result.rows[0]?.mutuals_rank : 0,
      followers_rank: result.rows[0] ? result.rows[0]?.followers_rank : 0,
      following_rank: result.rows[0] ? result.rows[0]?.following_rank : 0,
      top8_rank: result.rows[0] ? result.rows[0]?.top8_rank : 0,
      blocks_rank: result.rows[0] ? result.rows[0]?.blocks_rank : 0
    }
  }

  async getUserRanksCounts(address: Address): Promise<RankCountsRow> {
    const query = sql<RankCountsRow>`SELECT * FROM query.get_user_ranks_and_counts(${address})`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return {
        mutuals_rank: 0,
        followers_rank: 0,
        following_rank: 0,
        top8_rank: 0,
        blocks_rank: 0,
        mutuals: 0,
        following: 0,
        followers: 0,
        top8: 0,
        blocks: 0
      }
    }

    return {
      mutuals_rank: result.rows[0]?.mutuals_rank || 0,
      followers_rank: result.rows[0]?.followers_rank || 0,
      following_rank: result.rows[0]?.following_rank || 0,
      top8_rank: result.rows[0]?.top8_rank || 0,
      blocks_rank: result.rows[0]?.blocks_rank || 0,
      mutuals: result.rows[0]?.mutuals || 0,
      following: result.rows[0]?.following || 0,
      followers: result.rows[0]?.followers || 0,
      top8: result.rows[0]?.top8 || 0,
      blocks: result.rows[0]?.blocks || 0
    }
  }

  async searchLeaderboard(term: string): Promise<LeaderBoardRow[]> {
    const query = sql<LeaderBoardRow>`SELECT * FROM query.search_leaderboard(${term})`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: LeaderBoardRow) => ({
      address: row.address,
      name: row.name,
      avatar: row.avatar,
      mutuals_rank: row.mutuals_rank,
      followers_rank: row.followers_rank,
      following_rank: row.following_rank,
      blocks_rank: row.blocks_rank,
      top8_rank: row.top8_rank,
      mutuals: row.mutuals,
      following: row.following,
      followers: row.followers,
      blocks: row.blocks,
      top8: row.top8,
      updated_at: row.updated_at
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

  async getDiscoverAccounts(limit: string, offset: string): Promise<DiscoverRow[]> {
    const query = sql<DiscoverRow>`SELECT * FROM public.efp_recent_activity LIMIT ${limit} OFFSET ${offset};`
    const result = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows.map((row: DiscoverRow) => ({
      address: row.address,
      name: row.name,
      avatar: row.avatar,
      followers: row.followers,
      following: row.following
    }))
  }
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
      address: bufferize(row.record_data),
      tags: row.tags ? row.tags.sort() : row.tags
    }))
  }

  async getListRecordsFilterByTags(tokenId: bigint, tag: string): Promise<ListRecord[]> {
    const all: TaggedListRecord[] = await this.getListRecordsWithTags(tokenId)
    return all.filter(record => record.tags.includes(tag))
  }

  async getListFollowingState(tokenId: string, address: Address): Promise<FollowStateResponse> {
    const query = sql<Row>`SELECT * FROM query.get_list_following_state(${tokenId}, ${address})`
    const result = await query.execute(this.#db)

    type Row = {
      is_following: boolean
      is_blocked: boolean
      is_muted: boolean
    }

    if (!result || result.rows.length === 0) {
      return {
        follow: false,
        block: false,
        mute: false
      }
    }

    return {
      follow: result.rows[0]?.is_following ?? false,
      block: result.rows[0]?.is_blocked ?? false,
      mute: result.rows[0]?.is_muted ?? false
    }
  }

  async getListFollowerState(tokenId: string, address: Address): Promise<FollowStateResponse> {
    const query = sql<Row>`SELECT * FROM query.get_list_follower_state(${tokenId}, ${address})`
    const result = await query.execute(this.#db)

    type Row = {
      is_follower: boolean
      is_blocking: boolean
      is_muting: boolean
    }

    if (!result || result.rows.length === 0) {
      return {
        follow: false,
        block: false,
        mute: false
      }
    }

    return {
      follow: result.rows[0]?.is_follower ?? false,
      block: result.rows[0]?.is_blocking ?? false,
      mute: result.rows[0]?.is_muting ?? false
    }
  }

  async getUserFollowerState(addressUser: Address, addressFollower: Address): Promise<FollowStateResponse> {
    const query = sql<Row>`SELECT * FROM query.get_user_follower_state(${addressUser}, ${addressFollower})`
    const result = await query.execute(this.#db)

    type Row = {
      is_follower: boolean
      is_blocking: boolean
      is_muting: boolean
    }

    if (!result || result.rows.length === 0) {
      return {
        follow: false,
        block: false,
        mute: false
      }
    }

    return {
      follow: result.rows[0]?.is_follower ?? false,
      block: result.rows[0]?.is_blocking ?? false,
      mute: result.rows[0]?.is_muting ?? false
    }
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
      address: bufferize(row.data),
      tags: row.tags ? row.tags.sort() : row.tags
    }))
  }

  /////////////////////////////////////////////////////////////////////////////
  // Recommendations
  /////////////////////////////////////////////////////////////////////////////
  async getStats(): Promise<StatsRow> {
    const query = sql<StatsRow>`SELECT * FROM public.view__efp_stats`
    const result = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return {
        address_count: 0,
        list_count: 0,
        list_op_count: 0,
        user_count: 0
      }
    }
    return {
      address_count: result.rows[0]?.address_count as number,
      list_count: result.rows[0]?.list_count as number,
      list_op_count: result.rows[0]?.list_op_count as number,
      user_count: result.rows[0]?.user_count as number
    }
  }

  async getRecommended(
    _address: `0x${string}`,
    _seed: `0x${string}`,
    _limit: string,
    _offset: string
  ): Promise<RecommendedRow[]> {
    const query = sql<RecommendedRow>`SELECT * FROM public.view__events__efp_recommended`
    const result = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }
    return result.rows
  }

  async getRecommendedByAddress(
    address: `0x${string}`,
    _seed: `0x${string}`,
    limit: string,
    offset: string
  ): Promise<RecommendedRow[]> {
    const query = sql<RecommendedRow>`SELECT * FROM query.get_recommended_by_address(${address}, ${limit}, ${offset})`
    const result = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }
    return result.rows
  }

  async getRecommendedByList(
    list: string,
    _seed: `0x${string}`,
    limit: string,
    offset: string
  ): Promise<RecommendedRow[]> {
    const query = sql<RecommendedRow>`SELECT * FROM query.get_recommended_by_list(${list}, ${limit}, ${offset})`
    const result = await query.execute(this.#db)

    if (!result || result.rows.length === 0) {
      return []
    }
    return result.rows
  }

  async getRecommendedFallback(
    address: Address,
    seed: Address | undefined,
    limit: string,
    offset: string
  ): Promise<Address[]> {
    interface QueryResponse {
      data: Data
    }

    interface Data {
      //   Wallet: Wallet;
      ethereum: Ethereum
    }

    interface Ethereum {
      TokenBalance: TokenBalance[]
      TokenNft: TokenNFT[]
    }

    interface TokenNFT {
      tokenBalances: TokenBalances[]
      //   flatMap(data: TokenNFT): any[]
    }

    interface Owner {
      identity: string
    }

    interface TokenBalance {
      tokenAddress: string
    }

    interface TokenBalances {
      owner: Owner
      tokenAddress: string[]
    }

    const AIRSTACK_API_URL = 'https://api.airstack.xyz/graphql'
    const AIRSTACK_API_KEY = this.#env.AIRSTACK_API_KEY
    if (!AIRSTACK_API_KEY) throw new Error('AIRSTACK_API_KEY not set')
    const seedAddress = seed ? seed : NETWORKED_WALLET
    let query = `query GetNFTs {
        ethereum: TokenBalances(
          input: {
            filter: {
              owner: { _in: ["${address}", "${seedAddress}"] }
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
      }`

    const res = await fetch(AIRSTACK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: AIRSTACK_API_KEY
      },
      body: JSON.stringify({ query })
    })

    const json = (await res?.json()) as QueryResponse
    const data = json?.data
    if (!data?.ethereum?.TokenBalance) {
      return [TEAM_BRANTLY, TEAM_ENCRYPTEDDEGEN, TEAM_THROW] as Address[]
    }
    const formatted = data?.ethereum?.TokenBalance?.map((value: TokenBalance) => value.tokenAddress)
    const queryFormattedTokens = formatted?.filter(
      (address: string, index: Number) => formatted.indexOf(address) === index
    )

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
      }`
    const holderRes = await fetch(AIRSTACK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: AIRSTACK_API_KEY
      },
      body: JSON.stringify({ query, variables: { queryFormattedTokens: queryFormattedTokens } })
    })

    const holderJson = (await holderRes?.json()) as QueryResponse
    const holderData = holderJson?.data
    const holders = holderData.ethereum?.TokenNft?.flatMap(data => data.tokenBalances?.map(data => data.owner.identity))
    const dedupedHolders = holders?.filter((address: string, index: number) => holders.indexOf(address) === index)
    const paramFilteredAddresses = dedupedHolders.filter(
      addr => addr.toLowerCase() !== address.toLowerCase() && addr.toLowerCase() !== seed?.toLowerCase()
    )

    const following = await this.getUserFollowingRaw(address)
    const addresses: Address[] = following.map(record => hexlify(record.data))
    const followingFiltered = paramFilteredAddresses.filter(addr => !addresses.includes(addr))
    const accountList = followingFiltered?.slice(Number.parseInt(offset), Number.parseInt(limit))

    const rand = Math.floor(Math.random() * 100)
    if (rand < 10) {
      const team = [TEAM_BRANTLY, TEAM_ENCRYPTEDDEGEN, TEAM_THROW]
      const member = team.length > 0 ? team[Math.floor(Math.random() * team.length)] : TEAM_BRANTLY
      accountList.unshift(member as string)
    }

    if (accountList.length === 0) {
      return [TEAM_BRANTLY, TEAM_ENCRYPTEDDEGEN, TEAM_THROW] as Address[]
    }

    return accountList as Address[]
  }

  async getUserLists(address: Address): Promise<number[]> {
    type Row = {
      efp_list_nft_token_id: number
    }
    const query = sql<Row>`SELECT * FROM query.get_user_lists(${address});`
    const result = await query.execute(this.#db)
    const lists: number[] = result.rows.map((record: Row) => record.efp_list_nft_token_id)
    return lists
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

  async getAddressByList(token_id: string): Promise<Address | undefined> {
    const query = sql<{
      primary_list_address: Address
    }>`SELECT query.get_address_by_list(${token_id}) AS primary_list_address`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return undefined
    }

    return result.rows[0]?.primary_list_address
  }

  /////////////////////////////////////////////////////////////////////////////
  // Tags
  /////////////////////////////////////////////////////////////////////////////

  async getTaggedAddressesByList(token_id: string): Promise<TagResponse[]> {
    const query = sql<{
      address: Address
      tag: string
    }>`SELECT hexlify(record_data) as address, UNNEST(tags) as tag FROM query.get_list_record_tags(${token_id}) WHERE tags IS NOT NULL;`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows
  }

  async getTaggedAddressesByTags(token_id: string, tags: string[] | undefined): Promise<TagsResponse[]> {
    const query = sql<{
      address: Address
      tags: string[]
    }>`SELECT address, utags as tags FROM query.get_list_record_tags_by_tags(${token_id}, ${tags})`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return []
    }

    return result.rows
  }

  async claimPoapLink(address: Address): Promise<string> {
    const query = sql<{
      link: string
    }>`SELECT link FROM public.efp_poap_links WHERE claimed = 'false' LIMIT 1;`
    const result = await query.execute(this.#db)
    if (!result || result.rows.length === 0) {
      return ''
    }

    const link = result.rows[0]?.link as string
    const _update = await this.#db
      .updateTable('efp_poap_links')
      .set({
        claimant: address,
        claimed: true
      })
      .where('link', '=', link)
      .execute()

    return link
  }
}
