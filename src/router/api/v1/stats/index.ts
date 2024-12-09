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
    const cacheService = services.cache(env(context))
    const cacheTarget = `stats`

    if (cache !== 'fresh') {
      const cacheHit = await cacheService.get(cacheTarget)
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }

    const efp: IEFPIndexerService = services.efp(env(context))
    const stats: StatsRow = await efp.getStats()
    await cacheService.put(cacheTarget, JSON.stringify({ stats }))
    return context.json({ stats }, 200)
  })
  return stats
}
