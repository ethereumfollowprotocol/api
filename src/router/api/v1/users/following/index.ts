import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { FollowingResponse, IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfileResponse } from '#/service/ens-metadata/service'
import type { Address, Environment } from '#/types'
import { type PrettyTaggedListRecord, hexlify, prettifyListRecord } from '#/types/list-record'

export type ENSFollowingResponse = PrettyTaggedListRecord & {
  ens?: ENSProfileResponse
}

/**
 * Enhanced to add ENS support
 */
export function following(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/following', async context => {
    const { addressOrENS } = context.req.param()

    const ensService = services.ens(env(context))
    const address: Address = await ensService.getAddress(addressOrENS)

    const efp: IEFPIndexerService = services.efp(env(context))
    const followingListRecords: FollowingResponse[] = await efp.getUserFollowing(address)

    let response: ENSFollowingResponse[]

    // Check if 'ens' information should be included
    if (context.req.query('include')?.includes('ens')) {
      // Filter for address records
      const addressRecords = followingListRecords.filter(record => record.recordType === 1)

      // Fetch ENS profiles in batch
      const addresses: Address[] = addressRecords.map(record => hexlify(record.data))
      const ensProfiles: ENSProfileResponse[] = await ensService.batchGetENSProfiles(addresses)
      console.log('ensprofiles', ensProfiles)
      // Collect ENS profiles into a lookup map by address
      const ensMap: Map<Address, ENSProfileResponse> = new Map(
        addresses.map((address, index) => {
          if (!ensProfiles[index]?.name) {
            return [address, { name: '', address: address, avatar: null } as unknown as ENSProfileResponse]
          }
          return [address, ensProfiles[index] as ENSProfileResponse]
        })
      )

      // Aggregate ENS profiles back into the full list
      response = followingListRecords.map(record => {
        return record.recordType !== 1
          ? prettifyListRecord(record)
          : { ...prettifyListRecord(record), ens: ensMap.get(hexlify(record.data)) as ENSProfileResponse }
      })
    } else {
      // If ENS is not included, just map the following list records to the pretty format
      response = followingListRecords.map(prettifyListRecord)
    }

    return context.json({ following: response }, 200)
  })
}
