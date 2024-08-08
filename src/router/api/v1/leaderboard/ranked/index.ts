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
    const efp = services.efp(env(context))
    const results: LeaderBoardRow[] = await efp.getLeaderboardRanked(parsedLimit, offsetLimit, sort, direction)
    const last_updated = results.length > 0 ? results[0]?.updated_at : '0'

    return context.json({ last_updated, results }, 200)
  })
}
