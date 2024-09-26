import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Address, Environment } from '#/types'
import { isAddress } from '#/utilities'

export function details(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/details', async context => {
    const { addressOrENS } = context.req.param()
    const { cache } = context.req.query()

    const cacheKV = context.env.EFP_DATA_CACHE
    const cacheTarget = `users/${addressOrENS}/details`
    if (cache !== 'fresh') {
      const cacheHit = await cacheKV.get(cacheTarget, 'json')
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }
    const ensService = services.ens(env(context))
    const { address, ...ens }: ENSProfile = await ensService.getENSProfile(addressOrENS.toLowerCase(), false)
    if (!isAddress(address)) {
      return context.json({ response: 'ENS name not valid or does not exist' }, 404)
    }

    const normalizedAddress: Address = address.toLowerCase() as `0x${string}`
    const efp: IEFPIndexerService = services.efp(env(context))
    const primaryList = await efp.getUserPrimaryList(normalizedAddress)

    const ranksAndCounts = await efp.getUserRanksCounts(address)

    const ranks = {
      mutuals_rank: ranksAndCounts.mutuals_rank,
      followers_rank: ranksAndCounts.followers_rank,
      following_rank: ranksAndCounts.following_rank,
      top8_rank: ranksAndCounts.top8_rank,
      blocks_rank: ranksAndCounts.blocks_rank
    }
    const response = { address } as Record<string, unknown>
    const packagedResponse = { ...response, ens, ranks, primary_list: primaryList?.toString() ?? null }
    await cacheKV.put(cacheTarget, JSON.stringify(packagedResponse), { expirationTtl: 180 })
    return context.json(packagedResponse, 200)
  })
}
