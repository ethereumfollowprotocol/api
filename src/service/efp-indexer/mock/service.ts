import type { Address } from '#/types'
import type { ListRecord, TaggedListRecord } from '#/types/list-record'
import type { FollowStateResponse, FollowerResponse, IEFPIndexerService, TagResponse, TagsResponse } from '../service'
import { type SocialGraph, makeSocialGraph } from './social-graph'

export class MockEFPIndexerService implements IEFPIndexerService {
  readonly #socialGraph: SocialGraph

  constructor() {
    // apiLogger.info('Using MockEFPIndexerService')
    this.#socialGraph = makeSocialGraph()
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

  async getDiscoverAccounts(): Promise<Address[]> {
    return (await []) as Address[]
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

  getUserFollowersByListTagSort(
    _token_id: string,
    _limit: string,
    _offset: string,
    _tags: string[],
    _sort: string
  ): Promise<FollowerResponse[]> {
    throw new Error('Method not implemented.')
  }

  getUserFollowingCountByList(_token_id: string): Promise<number> {
    throw new Error('Method not implemented.')
  }

  getUserFollowingByList(_token_id: string, _limit: string, _offset: string): Promise<TaggedListRecord[]> {
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

  async getListFollowingState(_tokenId: string, _address: Address): Promise<FollowStateResponse> {
    return await {
      follow: false,
      block: false,
      mute: false
    }
  }

  async getRecommended(_address: Address): Promise<Address[]> {
    return (await []) as Address[]
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
}
