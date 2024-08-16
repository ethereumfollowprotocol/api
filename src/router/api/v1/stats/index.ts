import { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { DiscoverRow, IEFPIndexerService, StatsRow } from '#/service/efp-indexer/service'
import type { Environment } from '#/types'
import type { Address } from '#/types/index'

export function stats(services: Services): Hono<{ Bindings: Environment }> {
  const stats = new Hono<{ Bindings: Environment }>()

  stats.get('/', async context => {
    const efp: IEFPIndexerService = services.efp(env(context))
    const stats: StatsRow = await efp.getStats()

    return context.json({ stats }, 200)
  })
  return stats
}
