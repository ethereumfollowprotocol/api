import type { Hono } from 'hono'
import { env } from 'hono/adapter'

import type { Services } from '#/service'
import type { Environment } from '#/types'
import type { IncludeValidator, LimitValidator } from '../validators'

export function blocked(
  leaderboard: Hono<{ Bindings: Environment }>,
  services: Services,
  limitValidator: LimitValidator,
  includeValidator: IncludeValidator
) {
  /**
   * Same as /followers, but for blocked.
   */
  leaderboard.get('/blocked/:ensOrAddress?', limitValidator, includeValidator, async context => {
    const { ensOrAddress } = context.req.param()
    const { include, limit } = context.req.valid('query')
    const parsedLimit = Number.parseInt(limit?.toString() || '10', 10)
    const mostBlocked: { address: string; blocked_by_count: number }[] = await services
      .efp(env(context))
      .getLeaderboardBlocked(parsedLimit)
    return context.json(mostBlocked, 200)
  })
}
