import type { Hono } from 'hono'
import { env } from 'hono/adapter'

import type { Services } from '#/service'
import type { LeaderBoardRow } from '#/service/efp-indexer/service'
import type { Environment } from '#/types'
import type { IncludeValidator, LimitValidator } from '../validators'

export function count(
  leaderboard: Hono<{ Bindings: Environment }>,
  services: Services,
  limitValidator: LimitValidator,
  includeValidator: IncludeValidator
) {
    
  leaderboard.get('/count', limitValidator, includeValidator, async context => {
    const efp = await services.efp(env(context))
    const leaderboardCount: number = await efp.getLeaderboardCount()

    return context.json({ leaderboardCount }, 200)
  })
}
