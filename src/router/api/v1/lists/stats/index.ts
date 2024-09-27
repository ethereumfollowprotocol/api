import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Address, Environment } from '#/types'

export function stats(lists: Hono<{ Bindings: Environment }>, services: Services) {
  lists.get('/:token_id/stats', async context => {
    const { token_id } = context.req.param()
    const { cache } = context.req.query()
    if (Number.isNaN(Number(token_id)) || Number(token_id) <= 0) {
      return context.json({ response: 'Invalid list id' }, 400)
    }
    const cacheKV = context.env.EFP_DATA_CACHE
    const cacheTarget = `lists/${token_id}/stats`
    if (cache !== 'fresh') {
      const cacheHit = await cacheKV.get(cacheTarget, 'json')
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }
    const efp: IEFPIndexerService = services.efp(env(context))

    const stats = {
      followers_count: await efp.getUserFollowersCountByList(token_id),
      following_count: await efp.getUserFollowingCountByList(token_id)
    }

    await cacheKV.put(cacheTarget, JSON.stringify(stats), { expirationTtl: context.env.CACHE_TTL })
    return context.json(stats, 200)
  })
}
