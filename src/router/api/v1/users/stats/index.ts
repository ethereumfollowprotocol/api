import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { IENSMetadataService } from '#/service/ens-metadata/service'
import type { Address, Environment } from '#/types'
import { isAddress } from '#/utilities'

export function stats(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/stats', async context => {
    const { addressOrENS } = context.req.param()
    const { live, cache } = context.req.query()

    let address: Address = addressOrENS.toLowerCase() as Address
    if (!isAddress(addressOrENS)) {
      const ens: IENSMetadataService = services.ens(env(context))
      address = await ens.getAddress(addressOrENS)
      if (!isAddress(address)) {
        return context.json({ response: 'ENS name not valid or does not exist' }, 404)
      }
    }
    const cacheService = services.cache(env(context))
    const cacheTarget = `users/${address}/stats`.toLowerCase()
    if (cache !== 'fresh' || live !== 'true') {
      const cacheHit = await cacheService.get(cacheTarget)
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }
    const efp: IEFPIndexerService = services.efp(env(context))
    if (env(context).ALLOW_TTL_MOD === 'true') {
      const stats = {
        followers_count: await efp.getUserFollowersCount(address),
        following_count: await efp.getUserFollowingCount(address)
      }

      await cacheService.put(cacheTarget, JSON.stringify(stats), 0)
      return context.json(stats, 200)
    }
    const ranksAndCounts = await efp.getUserRanksCounts(address)
    const stats = {
      followers_count: ranksAndCounts.followers,
      following_count: ranksAndCounts.following
    }

    if (live === 'true') {
      stats.followers_count = await efp.getUserFollowersCount(address)
      stats.following_count = await efp.getUserFollowingCount(address)
    }

    await cacheService.put(cacheTarget, JSON.stringify(stats))
    return context.json(stats, 200)
  })
}
