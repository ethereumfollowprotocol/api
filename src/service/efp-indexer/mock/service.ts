import type { ListRecord } from '#/types/list-record'
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
  async getFollowing(address: `0x${string}`): Promise<ListRecord[]> {
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

  async getListRecords(tokenId: bigint): Promise<{ version: number; recordType: number; data: `0x${string}` }[]> {
    const result: { version: number; recordType: number; data: `0x${string}` }[] = this.socialGraph
      .getListRecords(tokenId)
      .map(record => ({
        version: record.version,
        recordType: record.recordType,
        data: `0x${Buffer.from(record.data).toString('hex')}` as `0x${string}`
      }))
    return result
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
    const result: bigint | undefined = this.socialGraph.getPrimaryList(address)
    if (result === undefined) return undefined
    return result
  }
}
