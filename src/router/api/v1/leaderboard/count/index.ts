import type { Hono } from 'hono'
import { env } from 'hono/adapter'

import type { Services } from '#/service'
import type { LeaderBoardRow } from '#/service/efp-indexer/service'
import type { Environment } from '#/types'
import type { IncludeValidator, LimitValidator } from '../validators'

/**
 * TODO: add support for whether :addressOrENS is followed, is following, is muting, is blocking, is blocked by
 */
export function count(
  leaderboard: Hono<{ Bindings: Environment }>,
  services: Services,
  limitValidator: LimitValidator,
  includeValidator: IncludeValidator
) {
  /**
   * Same as /followers, but for following.
   */
  leaderboard.get('/count', limitValidator, includeValidator, async context => {
    const efp = await services.efp(env(context))
    const leaderboardCount: number = await efp.getLeaderboardCount()

    return context.json({ leaderboardCount }, 200)
  })
}
