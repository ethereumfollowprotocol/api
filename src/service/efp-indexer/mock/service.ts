import type { ListRecord, TaggedListRecord } from '#/types/list-record'
import type { IEFPIndexerService } from '../service'
import { SocialGraph, makeSocialGraph } from './social-graph'

export class MockEFPIndexerService implements IEFPIndexerService {
  private readonly socialGraph: SocialGraph

  constructor() {
    this.socialGraph = makeSocialGraph()
  }

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getFollowersCount(address: `0x${string}`): Promise<number> {
    return this.socialGraph.getFollowersCount(address)
  }

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getFollowers(address: `0x${string}`): Promise<`0x${string}`[]> {
    return this.socialGraph.getFollowers(address)
  }

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getFollowingCount(address: `0x${string}`): Promise<number> {
    return this.socialGraph.getFollowingCount(address)
  }

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getFollowing(address: `0x${string}`): Promise<TaggedListRecord[]> {
    return this.socialGraph.getFollowing(address)
  }

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getLeaderboardFollowers(limit: number): Promise<{ address: `0x${string}`; followers_count: number }[]> {
    return this.socialGraph.getLeaderboardFollowers(limit)
  }

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getLeaderboardFollowing(limit: number): Promise<{ address: `0x${string}`; following_count: number }[]> {
    return this.socialGraph.getLeaderboardFollowing(limit)
  }

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getListStorageLocation(tokenId: bigint): Promise<`0x${string}` | undefined> {
    throw new Error('MockEFPIndexerService::getListStorageLocation not implemented.')
  }

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getListRecordCount(tokenId: bigint): Promise<number> {
    return this.socialGraph.getListRecords(tokenId).length
  }

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getListRecords(tokenId: bigint): Promise<ListRecord[]> {
    return this.socialGraph.getListRecords(tokenId)
  }

  async getListRecordsWithTags(
    tokenId: bigint
  ): Promise<{ version: number; recordType: number; data: `0x${string}`; tags: string[] }[]> {
    return this.socialGraph.getListRecordTags(tokenId).map(obj => ({
      version: obj.record.version,
      recordType: obj.record.recordType,
      data: `0x${Buffer.from(obj.record.data).toString('hex')}` as `0x${string}`,
      tags: Array.from(obj.tags).sort()
    }))
  }

  // biome-ignore lint/nursery/useAwait: <explanation>
  async getPrimaryList(address: `0x${string}`): Promise<bigint | undefined> {
    return this.socialGraph.getPrimaryList(address)
  }
}
