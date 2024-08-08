import type { Hono } from 'hono'
import { env } from 'hono/adapter'

import type { Services } from '#/service'
import type { LeaderBoardRow } from '#/service/efp-indexer/service'
import type { Environment } from '#/types'
import { isAddress, textOrEmojiPattern } from '#/utilities'
import type { IncludeValidator, LimitValidator } from '../validators'

export function search(
  leaderboard: Hono<{ Bindings: Environment }>,
  services: Services,
  limitValidator: LimitValidator,
  includeValidator: IncludeValidator
) {
  leaderboard.get('/search', limitValidator, includeValidator, async context => {
    let term = context.req.query('term')

    if (!term?.match(textOrEmojiPattern)) {
      return context.json({ results: [] }, 200)
    }
    if (!isAddress(term as string)) {
      term = term?.toLowerCase()
    }
    const efp = services.efp(env(context))
    const results: LeaderBoardRow[] = await efp.searchLeaderboard(term as string)
    const last_updated = results.length > 0 ? results[0]?.updated_at : '0'

    return context.json({ last_updated, results }, 200)
  })
}
