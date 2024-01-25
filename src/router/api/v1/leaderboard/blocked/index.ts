import type { Hono } from 'hono'
import { env } from 'hono/adapter'

import type { Services } from '#/service'
import type { Environment } from '#/types'
import type { IncludeValidator, LimitValidator } from '../validators'

/**
 * TODO: add support for whether :addressOrENS is followed, is following, is muting, is blocking, is blocked by
 */
export function blocked(
  leaderboard: Hono<{ Bindings: Environment }>,
  services: Services,
  limitValidator: LimitValidator,
  includeValidator: IncludeValidator
) {
  /**
   * Same as /followers, but for blocked.
   */
  leaderboard.get('/blocked/:addressOrENS?', limitValidator, includeValidator, async context => {
    const { addressOrENS } = context.req.param()
    const { include, limit } = context.req.valid('query')
    const parsedLimit = Number.parseInt(limit?.toString() || '10', 10)
    let mostBlocked: { address: string; blocked_by_count: number }[] = await services
      .efp(env(context))
      .getLeaderboardBlocked(parsedLimit)
    if (include?.includes('ens')) {
      const ens = services.ens()
      const ensProfiles = await Promise.all(mostBlocked.map(user => ens.getENSProfile(user.address)))
      mostBlocked = mostBlocked.map((user, index) => ({
        ...user,
        ens: ensProfiles[index]
      }))
    }
    return context.json(mostBlocked, 200)
  })
}
