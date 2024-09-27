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
    let { limit, offset, cache } = context.req.valid('query')

    if (!limit) limit = '50'
    if (!offset) offset = '0'
    const sort = context.req.query('sort') ? context.req.query('sort') : 'mutuals'
    const direction = context.req.query('direction') ? context.req.query('direction') : 'DESC'

    const demoKV = context.env.EFP_DATA_CACHE
    const cacheTarget = `leaderboard/ranked?limit=${limit}&offset=${offset}&sort=${sort}&direction=${direction}`
    if (cache !== 'fresh') {
      const cacheHit = await demoKV.get(cacheTarget, 'json')
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }

    const parsedLimit = Number.parseInt(limit as string, 10)
    const offsetLimit = Number.parseInt(offset as string, 10)
    const efp = services.efp(env(context))
    const results: LeaderBoardRow[] = await efp.getLeaderboardRanked(parsedLimit, offsetLimit, sort, direction)
    const last_updated = results.length > 0 ? results[0]?.updated_at : '0'

    const packagedResponse = { last_updated, results }
    await demoKV.put(cacheTarget, JSON.stringify(packagedResponse), { expirationTtl: context.env.CACHE_TTL })
    return context.json(packagedResponse, 200)
  })
}
