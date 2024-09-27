import { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { DiscoverRow, IEFPIndexerService, StatsRow } from '#/service/efp-indexer/service'
import type { Environment } from '#/types'
import type { Address } from '#/types/index'

export function stats(services: Services): Hono<{ Bindings: Environment }> {
  const stats = new Hono<{ Bindings: Environment }>()

  stats.get('/', async context => {
    const { cache } = context.req.query()
    const cacheKV = context.env.EFP_DATA_CACHE
    const cacheTarget = `stats`
    if (cache !== 'fresh') {
      const cacheHit = await cacheKV.get(cacheTarget, 'json')
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }

    const efp: IEFPIndexerService = services.efp(env(context))
    const stats: StatsRow = await efp.getStats()
    await cacheKV.put(cacheTarget, JSON.stringify({ stats }), { expirationTtl: context.env.CACHE_TTL })
    return context.json({ stats }, 200)
  })
  return stats
}
