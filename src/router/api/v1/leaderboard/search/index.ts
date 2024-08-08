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
      return context.json({ searchResults: [] }, 200)
    }
    if (!isAddress(term as string)) {
      term = term?.toLowerCase()
    }
    const efp = services.efp(env(context))
    const searchResults: LeaderBoardRow[] = await efp.searchLeaderboard(term as string)

    return context.json({ searchResults }, 200)
  })
}
