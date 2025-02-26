import type { Hono } from 'hono'
import { env } from 'hono/adapter'

import type { Services } from '#/service'
import type { LeaderBoardRow } from '#/service/efp-indexer/service'
import type { Environment } from '#/types'

export function all(leaderboard: Hono<{ Bindings: Environment }>, services: Services) {
  leaderboard.get('/all', async context => {
    const cache = context.req.query('cache')

    const cacheService = services.cache(env(context))
    const cacheTarget = `leaderboard/all`
    if (cache !== 'fresh') {
      const cacheHit = await cacheService.get(cacheTarget)
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }

    const efp = services.efp(env(context))
    const results: { address: `0x${string}`; name: string }[] = await efp.getLeaderboardAll()

    const packagedResponse = { results }
    await cacheService.put(cacheTarget, JSON.stringify(packagedResponse))
    return context.json(packagedResponse, 200)
  })
}
