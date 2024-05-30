import type { Address } from '#/types'
import type { ListRecord, TaggedListRecord } from '#/types/list-record'
import type { IEFPIndexerService } from '../service'
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

  async getRecommended(_address: Address): Promise<Address[]> {
    return (await []) as Address[]
  }

  // biome-ignore lint/suspicious/useAwait: <explanation>
  async getListRecordsWithTags(tokenId: bigint): Promise<TaggedListRecord[]> {
    return this.#socialGraph.getListRecordTags(tokenId)
  }

  // biome-ignore lint/suspicious/useAwait: <explanation>
  async getUserPrimaryList(address: Address): Promise<bigint | undefined> {
    return this.#socialGraph.getPrimaryList(address)
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
}
