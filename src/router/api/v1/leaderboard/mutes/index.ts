import type { Hono } from 'hono'
import { env } from 'hono/adapter'

import type { Services } from '#/service'
import type { Environment } from '#/types'
import type { IncludeValidator, LimitValidator } from '../validators'

/**
 * TODO: add support for whether :addressOrENS is followed, is following, is muting, is blocking, is blocked by
 */
export function mutes(
  leaderboard: Hono<{ Bindings: Environment }>,
  services: Services,
  limitValidator: LimitValidator,
  includeValidator: IncludeValidator
) {
  /**
   * Same as /followers, but for following.
   */
  leaderboard.get('/mutes/:addressOrENS?', limitValidator, includeValidator, async context => {
    const { include, limit } = context.req.valid('query')
    const parsedLimit = Number.parseInt(limit as string, 10)
    let mostMutes: { address: string; mutes_count: number }[] = await services
      .efp(env(context))
      .getLeaderboardMutes(parsedLimit)
    if (include?.includes('ens')) {
      const ens = services.ens(env(context))
      const ensProfiles = await Promise.all(mostMutes.map(user => ens.getENSProfile(user.address)))
      mostMutes = mostMutes.map((user, index) => ({
        ...user,
        ens: ensProfiles[index]
      }))
    }
    return context.json(mostMutes, 200)
  })
}
