import type { Address } from '#/types'
import type { ListRecord, TaggedListRecord } from '#/types/list-record'
import type {
  CommonFollowers,
  DiscoverRow,
  FollowStateResponse,
  FollowerResponse,
  IEFPIndexerService,
  LatestFollowerResponse,
  LeaderBoardRow,
  MintersRow,
  RankCountsRow,
  RankRow,
  RecommendedDetailsRow,
  RecommendedRow,
  StatsRow,
  TagResponse,
  TagsResponse
} from '../service'
import { type SocialGraph, makeSocialGraph } from './social-graph'

export class MockEFPIndexerService implements IEFPIndexerService {
  readonly #socialGraph: SocialGraph

  constructor() {
    // apiLogger.info('Using MockEFPIndexerService')
    this.#socialGraph = makeSocialGraph()
  }

  claimPoapLink(_address: Address): Promise<string> {
    throw new Error('Method not implemented.')
  }
  getCommonFollowers(_user: Address, _target: Address): Promise<CommonFollowers[]> {
    throw new Error('Method not implemented.')
  }
  getDebugNumEvents(): Promise<number> {
    throw new Error('Method not implemented.')
  }
  getDebugNumListOps(): Promise<number> {
    throw new Error('Method not implemented.')
  }
  getDebugTotalSupply(): Promise<number> {
    throw new Error('Method not implemented.')
  }

  getAddressByList(_token_id: string): Promise<Address | undefined> {
    throw new Error('Method not implemented.')
  }

  async getDiscoverAccounts(_limit: string, _offset: string): Promise<DiscoverRow[]> {
    return (await []) as DiscoverRow[]
  }

  // biome-ignore lint/suspicious/useAwait: <explanation>
  async getUserFollowersCount(address: Address): Promise<number> {
    return this.#socialGraph.getFollowersCount(address)
  }

  // biome-ignore lint/suspicious/useAwait: <explanation>
  async getUserFollowers(address: Address): Promise<
    {
      address: Address
      tags: string[]
      is_following: boolean
      is_blocked: boolean
      is_muted: boolean
    }[]
  > {
    return this.#socialGraph.getFollowers(address)
  }

  getUserFollowersCountByList(_token_id: string): Promise<number> {
    throw new Error('Method not implemented.')
  }

  getUserFollowersByList(
    _token_id: string,
    _limit: string,
    _offset: string
  ): Promise<
    {
      address: Address
      tags: string[]
      is_following: boolean
      is_blocked: boolean
      is_muted: boolean
    }[]
  > {
    throw new Error('Method not implemented.')
  }

  getAllUserFollowersByAddressTagSort(
    _address: Address,
    _limit: string,
    _offset: string,
    _tags: string[],
    _sort: string
  ): Promise<
    {
      address: Address
      tags: string[]
      is_following: boolean
      is_blocked: boolean
      is_muted: boolean
    }[]
  > {
    throw new Error('Method not implemented.')
  }

  getUserFollowersByAddressTagSort(
    _address: Address,
    _limit: string,
    _offset: string,
    _tags: string[],
    _sort: string
  ): Promise<
    {
      address: Address
      tags: string[]
      is_following: boolean
      is_blocked: boolean
      is_muted: boolean
    }[]
  > {
    throw new Error('Method not implemented.')
  }

  getLatestFollowersByAddress(_address: Address, _limit: string, _offset: string): Promise<LatestFollowerResponse[]> {
    throw new Error('Method not implemented.')
  }

  getAllUserFollowersByListTagSort(
    _token_id: string,
    _limit: string,
    _offset: string,
    _tags: string[],
    _sort: string
  ): Promise<FollowerResponse[]> {
    throw new Error('Method not implemented.')
  }

  getUserFollowersByListTagSort(
    _token_id: string,
    _limit: string,
    _offset: string,
    _tags: string[],
    _sort: string
  ): Promise<FollowerResponse[]> {
    throw new Error('Method not implemented.')
  }

  getLatestFollowersByList(_token_id: string, _limit: string, _offset: string): Promise<LatestFollowerResponse[]> {
    throw new Error('Method not implemented.')
  }

  getUserFollowerTags(_address: Address): Promise<TagResponse[]> {
    throw new Error('Method not implemented.')
  }

  getListFollowerTags(_list: string): Promise<TagResponse[]> {
    throw new Error('Method not implemented.')
  }

  getUserFollowingCountByList(_token_id: string): Promise<number> {
    throw new Error('Method not implemented.')
  }

  getUserFollowingByList(_token_id: string, _limit: string, _offset: string): Promise<TaggedListRecord[]> {
    throw new Error('Method not implemented.')
  }

  getAllUserFollowingAddresses(_token_id: string): Promise<Address[]> {
    throw new Error('Method not implemented.')
  }

  getAllUserFollowingByListTagSort(
    _token_id: string,
    _limit: string,
    _offset: string,
    _tags: string[],
    _sort: string
  ): Promise<TaggedListRecord[]> {
    throw new Error('Method not implemented.')
  }

  getUserFollowingByListTagSort(
    _token_id: string,
    _limit: string,
    _offset: string,
    _tags: string[],
    _sort: string
  ): Promise<TaggedListRecord[]> {
    throw new Error('Method not implemented.')
  }

  getAllUserFollowingByAddressTagSort(
    _address: Address,
    _limit: string,
    _offset: string,
    _tags: string[],
    _sort: string
  ): Promise<TaggedListRecord[]> {
    throw new Error('Method not implemented.')
  }

  getUserFollowingByAddressTagSort(
    _address: Address,
    _limit: string,
    _offset: string,
    _tags: string[],
    _sort: string
  ): Promise<TaggedListRecord[]> {
    throw new Error('Method not implemented.')
  }

  async getUserListRecords(address: Address): Promise<TaggedListRecord[]> {
    const primaryList = await this.getUserPrimaryList(address)
    if (!primaryList) return []
    return this.getListRecordsWithTags(primaryList)
  }

  // biome-ignore lint/suspicious/useAwait: <explanation>
  async getUserFollowingCount(address: Address): Promise<number> {
    return this.#socialGraph.getFollowingCount(address)
  }

  // biome-ignore lint/suspicious/useAwait: <explanation>
  async getUserFollowing(address: Address): Promise<TaggedListRecord[]> {
    return this.#socialGraph.getFollowing(address)
  }

  async getLeaderboardBlocked(
    limit: number
  ): Promise<{ rank: number; address: `0x${string}`; blocked_by_count: number }[]> {
    return (await this.#socialGraph.getLeaderboardBlockedBy(limit)).map((item, index) => ({ rank: index + 1, ...item }))
  }

  async getLeaderboardBlocks(limit: number): Promise<{ rank: number; address: `0x${string}`; blocks_count: number }[]> {
    return (await this.#socialGraph.getLeaderboardBlocks(limit)).map((item, index) => ({ rank: index + 1, ...item }))
  }

  async getLeaderboardMuted(
    limit: number
  ): Promise<{ rank: number; address: `0x${string}`; muted_by_count: number }[]> {
    return (await this.#socialGraph.getLeaderboardMutedBy(limit)).map((item, index) => ({ rank: index + 1, ...item }))
  }

  async getLeaderboardMutes(limit: number): Promise<{ rank: number; address: `0x${string}`; mutes_count: number }[]> {
    return (await this.#socialGraph.getLeaderboardMutes(limit)).map((item, index) => ({ rank: index + 1, ...item }))
  }

  async getLeaderboardFollowers(limit: number): Promise<{ rank: number; address: Address; followers_count: number }[]> {
    return (await this.#socialGraph.getLeaderboardFollowers(limit)).map((item, index) => ({ rank: index + 1, ...item }))
  }

  async getLeaderboardFollowing(limit: number): Promise<{ rank: number; address: Address; following_count: number }[]> {
    return (await this.#socialGraph.getLeaderboardFollowing(limit)).map((item, index) => ({ rank: index + 1, ...item }))
  }

  getLeaderboardRanked(_limit: number, _offset: number, _sort: string, _direction: string): Promise<LeaderBoardRow[]> {
    throw new Error('Method not implemented.')
  }

  getUserRanks(_address: Address): Promise<RankRow> {
    throw new Error('Method not implemented.')
  }

  getUserRanksCounts(_address: Address): Promise<RankCountsRow> {
    throw new Error('Method not implemented.')
  }

  getLeaderboardCount(): Promise<number> {
    throw new Error('Method not implemented.')
  }

  searchLeaderboard(_term: string): Promise<LeaderBoardRow[]> {
    throw new Error('Method not implemented.')
  }

  // biome-ignore lint/suspicious/useAwait: <explanation>
  async getListStorageLocation(_tokenId: bigint): Promise<Address | undefined> {
    throw new Error('MockEFPIndexerService::getListStorageLocation not implemented.')
  }

  // biome-ignore lint/suspicious/useAwait: <explanation>
  async getListRecordCount(tokenId: bigint): Promise<number> {
    return this.#socialGraph.getListRecords(tokenId).length
  }

  // biome-ignore lint/suspicious/useAwait: <explanation>
  async getListRecords(tokenId: bigint): Promise<ListRecord[]> {
    return this.#socialGraph.getListRecords(tokenId)
  }

  // biome-ignore lint/suspicious/useAwait: <explanation>
  async getListRecordsWithTags(tokenId: bigint): Promise<TaggedListRecord[]> {
    return this.#socialGraph.getListRecordTags(tokenId)
  }

  async getListFollowerState(_tokenId: string, _address: Address): Promise<FollowStateResponse> {
    return await {
      follow: false,
      block: false,
      mute: false
    }
  }

  async getUserFollowerState(_addressUser: Address, _addressFollower: Address): Promise<FollowStateResponse> {
    return await {
      follow: false,
      block: false,
      mute: false
    }
  }

  async getListFollowingState(_tokenId: string, _address: Address): Promise<FollowStateResponse> {
    return await {
      follow: false,
      block: false,
      mute: false
    }
  }

  getStats(): Promise<StatsRow> {
    throw new Error('Method not implemented.')
  }
  getUniqueMinters(_limit: number, _offset: number): Promise<MintersRow[]> {
    throw new Error('Method not implemented.')
  }

  async getRecommended(
    _address: `0x${string}`,
    _seed: `0x${string}`,
    _limit: string,
    _offset: string
  ): Promise<RecommendedRow[]> {
    return (await []) as RecommendedRow[]
  }

  async getRecommendedByAddress(
    _address: `0x${string}`,
    _seed: `0x${string}`,
    _limit: string,
    _offset: string
  ): Promise<RecommendedRow[]> {
    return (await []) as RecommendedRow[]
  }

  async getRecommendedStackByAddress(
    _address: `0x${string}`,
    _limit: number,
    _offset: number
  ): Promise<RecommendedDetailsRow[]> {
    return (await []) as RecommendedDetailsRow[]
  }

  async getRecommendedByList(
    _list: `0x${string}`,
    _seed: `0x${string}`,
    _limit: string,
    _offset: string
  ): Promise<RecommendedRow[]> {
    return (await []) as RecommendedRow[]
  }

  async getRecommendedStackByList(
    _list: `0x${string}`,
    _limit: number,
    _offset: number
  ): Promise<RecommendedDetailsRow[]> {
    return (await []) as RecommendedDetailsRow[]
  }

  // biome-ignore lint/suspicious/useAwait: <explanation>
  async getUserPrimaryList(address: Address): Promise<bigint | undefined> {
    return this.#socialGraph.getPrimaryList(address)
  }

  async getUserLists(_address: Address): Promise<number[]> {
    return (await []) as number[]
  }

  async getUserFollowingByListRaw(_token_id: string): Promise<TaggedListRecord[]> {
    return (await []) as TaggedListRecord[]
  }

  async getUserFollowingRaw(_address: Address): Promise<TaggedListRecord[]> {
    return (await []) as TaggedListRecord[]
  }

  // biome-ignore lint/suspicious/useAwait: <explanation>
  async getIncomingRelationships(
    _address: `0x${string}`,
    _tag: string
  ): Promise<{ token_id: bigint; list_user: `0x${string}`; tags: string[] }[]> {
    throw new Error('Method not implemented.')
  }

  async getOutgoingRelationships(address: `0x${string}`, tag: string): Promise<TaggedListRecord[]> {
    const primaryList = await this.getUserPrimaryList(address)
    if (!primaryList) return []
    return (await this.getListRecordsWithTags(primaryList)).filter(r => r.tags.includes(tag))
  }

  async getTaggedAddressesByList(_token_id: string): Promise<TagResponse[]> {
    return await []
  }

  async getTaggedAddressesByTags(_token_id: string, _tags: string[] | undefined): Promise<TagsResponse[]> {
    return await []
  }

  searchUserFollowersByAddress(
    _address: Address,
    _limit: string,
    _offset: string,
    _term: string
  ): Promise<FollowerResponse[]> {
    throw new Error('Method not implemented.')
  }

  searchUserFollowersByList(
    _list: string,
    _limit: string,
    _offset: string,
    _term: string
  ): Promise<FollowerResponse[]> {
    throw new Error('Method not implemented.')
  }

  searchUserFollowingByAddress(
    _address: Address,
    _limit: string,
    _offset: string,
    _term: string
  ): Promise<TaggedListRecord[]> {
    throw new Error('Method not implemented.')
  }

  searchUserFollowingByList(
    _list: string,
    _limit: string,
    _offset: string,
    _term: string
  ): Promise<TaggedListRecord[]> {
    throw new Error('Method not implemented.')
  }
}
