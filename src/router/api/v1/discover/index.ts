import { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { DiscoverRow, IEFPIndexerService } from '#/service/efp-indexer/service'
import type { Environment } from '#/types'
import type { Address } from '#/types/index'

export function discover(services: Services): Hono<{ Bindings: Environment }> {
  const discover = new Hono<{ Bindings: Environment }>()

  discover.get('/', async context => {
    const efp: IEFPIndexerService = services.efp(env(context))
    const latestFollows: DiscoverRow[] = await efp.getDiscoverAccounts()

    return context.json({ latestFollows }, 200)
  })
  return discover
}
