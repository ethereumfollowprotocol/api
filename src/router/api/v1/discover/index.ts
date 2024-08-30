import { Hono } from 'hono'
import { env } from 'hono/adapter'
import { includeValidator } from '#/router/api/v1/leaderboard/validators'
import type { Services } from '#/service'
import type { DiscoverRow, IEFPIndexerService } from '#/service/efp-indexer/service'
import type { Environment } from '#/types'

export function discover(services: Services): Hono<{ Bindings: Environment }> {
  const discover = new Hono<{ Bindings: Environment }>()

  discover.get('/', includeValidator, async context => {
    let { offset, limit } = context.req.valid('query')
    if (!limit) limit = '10'
    if (!offset) offset = '0'
    const efp: IEFPIndexerService = services.efp(env(context))
    const latestFollows: DiscoverRow[] = await efp.getDiscoverAccounts(limit as string, offset as string)

    return context.json({ latestFollows }, 200)
  })
  return discover
}
