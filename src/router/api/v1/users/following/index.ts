import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { includeValidator } from '#/router/api/v1/leaderboard/validators'
import type { Services } from '#/service'
import type { FollowingResponse, IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfileResponse } from '#/service/ens-metadata/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Address, Environment } from '#/types'
import { type PrettyTaggedListRecord, hexlify, prettifyListRecord } from '#/types/list-record'
import { isAddress, textOrEmojiPattern } from '#/utilities'

export type ENSFollowingResponse = PrettyTaggedListRecord & {
  ens?: ENSProfileResponse
}

/**
 * Enhanced to add ENS support
 */
export function following(users: Hono<{ Bindings: Environment }>, services: Services) {
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
  users.get('/:addressOrENS/following', includeValidator, async context => {
    const { addressOrENS } = context.req.param()
    let { offset, limit, cache } = context.req.valid('query')
    if (!limit) limit = '10'
    if (!offset) offset = '0'

    let direction = 'latest'
    if (context.req.query('sort')?.toLowerCase() === 'followers') {
      direction = 'followers'
    } else if (context.req.query('sort')?.toLowerCase() === 'earliest') {
      direction = 'earliest'
    }

    const tagsQuery = context.req.query('tags')
    let tagsToSearch: string[] = []
    if (tagsQuery) {
      const tagsArray = tagsQuery.split(',')
      tagsToSearch = tagsArray.filter((tag: any) => tag.match(textOrEmojiPattern))
    }

    const cacheKV = context.env.EFP_DATA_CACHE
    const cacheTarget = `users/${addressOrENS}/following?limit=${limit}&offset=${offset}&sort=${direction}&tags=${tagsToSearch.join(',')}`
    if (cache !== 'fresh') {
      const cacheHit = await cacheKV.get(cacheTarget, 'json')
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }

    const ensService = services.ens(env(context))
    const address: Address = await ensService.getAddress(addressOrENS)
    if (!isAddress(address)) {
      return context.json({ response: 'ENS name not valid or does not exist' }, 404)
    }

    const efp: IEFPIndexerService = services.efp(env(context))
    const followingListRecords: FollowingResponse[] = await efp.getUserFollowingByAddressTagSort(
      address,
      limit,
      offset,
      tagsToSearch,
      direction
    )

    let response: ENSFollowingResponse[]
    // Check if 'ens' information should be included
    if (context.req.query('include')?.includes('ens')) {
      // Filter for address records
      const addressRecords = followingListRecords.filter(record => record.recordType === 1)

      // Fetch ENS profiles in batch
      const addresses: Address[] = addressRecords.map(record => hexlify(record.data))
      const ensProfiles: ENSProfile[] = []
      for (const address of addresses) {
        const profile = await ensService.getENSProfile(address)
        ensProfiles.push(profile)
      }
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
    const packagedResponse = { following: response }
    await cacheKV.put(cacheTarget, JSON.stringify(packagedResponse), { expirationTtl: context.env.CACHE_TTL })

    return context.json(packagedResponse, 200)
  })
}
