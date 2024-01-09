import { apiLogger } from '#/logger'
import type { Address } from '#/types'
import type { ListRecord, TaggedListRecord } from '#/types/list-record'
import type { IEFPIndexerService } from '../service'
import { type SocialGraph, makeSocialGraph } from './social-graph'

export class MockEFPIndexerService implements IEFPIndexerService {
  readonly #socialGraph: SocialGraph

  constructor() {
    apiLogger.info('Using MockEFPIndexerService')
    this.#socialGraph = makeSocialGraph()
  }

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getFollowersCount(address: Address): Promise<number> {
    return this.#socialGraph.getFollowersCount(address)
  }

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getFollowers(address: Address): Promise<Address[]> {
    return this.#socialGraph.getFollowers(address)
  }

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getFollowingCount(address: Address): Promise<number> {
    return this.#socialGraph.getFollowingCount(address)
  }

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getFollowing(address: Address): Promise<TaggedListRecord[]> {
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

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getListStorageLocation(tokenId: bigint): Promise<Address | undefined> {
    throw new Error('MockEFPIndexerService::getListStorageLocation not implemented.')
  }

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getListRecordCount(tokenId: bigint): Promise<number> {
    return this.#socialGraph.getListRecords(tokenId).length
  }

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getListRecords(tokenId: bigint): Promise<ListRecord[]> {
    return this.#socialGraph.getListRecords(tokenId)
  }

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getListRecordsWithTags(tokenId: bigint): Promise<TaggedListRecord[]> {
    return this.#socialGraph.getListRecordTags(tokenId)
  }

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getPrimaryList(address: Address): Promise<bigint | undefined> {
    return this.#socialGraph.getPrimaryList(address)
  }

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getIncomingRelationships(
    address: `0x${string}`,
    tag: string
  ): Promise<{ token_id: bigint; list_user: `0x${string}`; tags: string[] }[]> {
    throw new Error('Method not implemented.')
  }

  async getOutgoingRelationships(address: `0x${string}`, tag: string): Promise<TaggedListRecord[]> {
    const primaryList = await this.getPrimaryList(address)
    if (!primaryList) return []
    return (await this.getListRecordsWithTags(primaryList)).filter(r => r.tags.includes(tag))
  }
}
