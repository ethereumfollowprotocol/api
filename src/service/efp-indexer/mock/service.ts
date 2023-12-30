import type { Address } from '#/types'
import type { ListRecord, TaggedListRecord } from '#/types/list-record'
import type { IEFPIndexerService } from '../service'
import { SocialGraph, makeSocialGraph } from './social-graph'

export class MockEFPIndexerService implements IEFPIndexerService {
  readonly #socialGraph: SocialGraph

  constructor() {
    this.#socialGraph = makeSocialGraph()
  }
  getLeaderboardBlocked(limit: number): Promise<
    {
      address: `0x${string}`
      blocked_count: number
    }[]
  > {
    throw new Error('Method not implemented.')
  }

  getLeaderboardMuted(limit: number): Promise<{ address: `0x${string}`; muted_count: number }[]> {
    throw new Error('Method not implemented.')
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

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getLeaderboardFollowers(limit: number): Promise<{ address: Address; followers_count: number }[]> {
    console.log('getLeaderboardFollowers')
    return this.#socialGraph.getLeaderboardFollowers(limit)
  }

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getLeaderboardFollowing(limit: number): Promise<{ address: Address; following_count: number }[]> {
    return this.#socialGraph.getLeaderboardFollowing(limit)
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
