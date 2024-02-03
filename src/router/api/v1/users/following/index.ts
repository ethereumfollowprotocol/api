import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { FollowingResponse, IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfileResponse } from '#/service/ens-metadata/service'
import type { Address, Environment } from '#/types'
import type { TaggedListRecord } from '#/types/list-record'

export type PrettyFollowingResponse = {
  version: number
  record_type: string
  data: `0x${string}`
  tags: string[]
}

export type ENSFollowingResponse = PrettyFollowingResponse & {
  ens?: ENSProfileResponse
}

function prettify(record: TaggedListRecord): PrettyFollowingResponse {
  return {
    version: record.version,
    record_type: record.recordType === 1 ? 'address' : `${record.recordType}`,
    data: `0x${Buffer.from(record.data).toString('hex')}` as `0x${string}`,
    tags: record.tags
  }
}

/**
 * Enhanced to add ENS support
 */
export function following(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/following', async context => {
    const { addressOrENS } = context.req.param()

    const ensService = services.ens()
    const address: Address = await ensService.getAddress(addressOrENS)

    const efp: IEFPIndexerService = services.efp(env(context))
    const followingListRecords: FollowingResponse[] = await efp.getUserFollowing(address)

    let response: ENSFollowingResponse[]

    // Check if 'ens' information should be included
    if (context.req.query('include')?.includes('ens')) {
      // Filter for address records
      const addressRecords = followingListRecords.filter(record => record.recordType === 1)

      // Fetch ENS profiles in batch
      const addresses = addressRecords.map(record => `0x${Buffer.from(record.data).toString('hex')}`)
      const ensProfiles = await ensService.batchGetENSProfiles(addresses)

      // Create a lookup map by address
      const ensMap = new Map(addresses.map((address, index) => [address, ensProfiles[index]]))

      // Aggregate ENS profiles back into the full list
      response = followingListRecords.map(record => {
        const prettyRecord: ENSFollowingResponse = prettify(record)
        if (record.recordType === 1) {
          const ensProfile = ensMap.get(prettyRecord.data)
          if (ensProfile) {
            prettyRecord.ens = ensProfile
          }
        }

        return prettyRecord
      })
    } else {
      // If ENS is not included, just map the following list records to the pretty format
      response = followingListRecords.map(prettify)
    }

    return context.json({ following: response }, 200)
  })
}
