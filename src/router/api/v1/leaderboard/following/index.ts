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
  /**
   * Same as /followers, but for following.
   */
  leaderboard.get('/following/:addressOrENS?', limitValidator, includeValidator, async context => {
    const { addressOrENS } = context.req.param()
    const { include, limit } = context.req.valid('query')
    const parsedLimit = Number.parseInt(limit as string, 10)
    let mostFollowing: { address: string; following_count: number }[] = await services
      .efp(env(context))
      .getLeaderboardFollowing(parsedLimit)
    if (include?.includes('ens')) {
      const ens = services.ens()
      const ensProfiles = await Promise.all(mostFollowing.map(user => ens.getENSProfile(user.address)))
      mostFollowing = mostFollowing.map((user, index) => ({
        ...user,
        ens: ensProfiles[index]
      }))
    }
    return context.json(mostFollowing, 200)
  })
}
