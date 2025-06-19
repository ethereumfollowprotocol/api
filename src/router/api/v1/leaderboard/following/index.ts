import type { Hono } from 'hono'
import { env } from 'hono/adapter'

import type { Services } from '#/service'
import type { Environment } from '#/types'
import type { IncludeValidator, LimitValidator } from '../validators'

export function following(
  leaderboard: Hono<{ Bindings: Environment }>,
  services: Services,
  limitValidator: LimitValidator,
  includeValidator: IncludeValidator
) {
  leaderboard.get('/following', limitValidator, includeValidator, async context => {
    const { limit, offset, cache } = context.req.valid('query')
    const parsedLimit = Number.parseInt(limit?.toString() || '10', 10)
    const parsedOffset = Number.parseInt(offset?.toString() || '0', 10)

    const cacheService = services.cache(env(context))
    const cacheTarget = `leaderboard/following?limit=${parsedLimit}&offset=${parsedOffset}`
    if (cache !== 'fresh') {
      const cacheHit = await cacheService.get(cacheTarget)
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }
    
    let mostFollowing: { address: string; following_count: number }[] = await services
      .efp(env(context))
      .getLeaderboardFollowing(parsedLimit)

    const packagedResponse = mostFollowing
    await cacheService.put(cacheTarget, JSON.stringify(packagedResponse))
    return context.json(packagedResponse, 200)
  })
}
