import type { Hono } from 'hono'
import { env } from 'hono/adapter'

import type { Services } from '#/service'
import type { LeaderBoardRow } from '#/service/efp-indexer/service'
import type { Environment } from '#/types'
import type { IncludeValidator, LimitValidator } from '../validators'

export function ranked(
  leaderboard: Hono<{ Bindings: Environment }>,
  services: Services,
  limitValidator: LimitValidator,
  includeValidator: IncludeValidator
) {
  leaderboard.get('/ranked', limitValidator, includeValidator, async context => {
    let { limit, offset } = context.req.valid('query')

    if (!limit) limit = '50'
    if (!offset) offset = '0'
    const sort = context.req.query('sort') ? context.req.query('sort') : 'mutuals'
    const direction = context.req.query('direction') ? context.req.query('direction') : 'DESC'

    const parsedLimit = Number.parseInt(limit as string, 10)
    const offsetLimit = Number.parseInt(offset as string, 10)
    const ranked: LeaderBoardRow[] = await services
      .efp(env(context))
      .getLeaderboardRanked(parsedLimit, offsetLimit, sort, direction)

    return context.json(ranked, 200)
  })
}
