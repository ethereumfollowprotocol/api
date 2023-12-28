import { Hono } from 'hono'
import { validator } from 'hono/validator'

import type { Services } from '#/service'
import type { Environment } from '#/types'
import { ensureArray } from '#/utilities'

const limitValidator = validator('query', value => {
  const { limit } = value

  if (limit !== undefined && !Number.isSafeInteger(Number.parseInt(limit as string, 10))) {
    return new Response(JSON.stringify({ message: 'Accepted format for limit: ?limit=50' }), { status: 400 })
  }
  return value
})

const includeValidator = validator('query', value => {
  const allFilters = ['ens', 'mutuals', 'blocked', 'muted']
  // if only one include query param, type is string, if 2+ then type is array, if none then undefined
  const { include } = <Record<'include', string | string[] | undefined>>value
  // if no include query param, return minimal data
  if (!include) return { include: [] }
  if (ensureArray(include).every(filter => allFilters.includes(filter))) return { include }
  return new Response(
    JSON.stringify({
      message: 'Accepted format for include: ?limit=50&include=ens&include=mutuals&include=blocked&include=muted'
    }),
    { status: 400 }
  )
})

export function leaderboard(services: Services): Hono<{ Bindings: Environment }> {
  const users = new Hono<{ Bindings: Environment }>()

  /**
   * By default, only returns leaderboard with address and followers_count/following_count of each user.
   * If include=ens, also returns ens profile of each user.
   * If include=muted, also returns how many users each user has muted.
   * If include=blocked, also returns how many users each user has blocked.
   * If ensOrAddress path param is provided AND include=mutuals query param is provided, returns mutuals between ensOrAddress and each user.
   */
  users.get(
    '/followers/:ensOrAddress?',
    //
    limitValidator,
    includeValidator,
    async context => {
      const { ensOrAddress } = context.req.param()
      const { include, limit } = context.req.valid('query')
      const parsedLimit = Number.parseInt(limit?.toString() || '10', 10)
      console.log({ parsedLimit })
      const mostFollowers: { address: string; followers_count: number }[] = await services
        .efp(context.env)
        .getLeaderboardFollowers(100)
      return context.json(mostFollowers, 200)
    }
  )

  /**
   * Same as /followers, but for following.
   */
  users.get('/following/:ensOrAddress?', limitValidator, includeValidator, async context => {
    const { ensOrAddress } = context.req.param()
    const { include, limit } = context.req.valid('query')
    const parsedLimit = Number.parseInt(limit as string, 10)
    const mostFollowing: { address: string; following_count: number }[] = await services
      .efp(context.env)
      .getLeaderboardFollowing(parsedLimit)
    return context.json(mostFollowing, 200)
  })

  /**
   * Same as /followers, but for primary list.
   */
  users.get('/blocked/:ensOrAddress?', limitValidator, includeValidator, context => {
    return context.text('Not implemented', 501)
  })

  /**
   * Same as /followers, but for primary list.
   */
  users.get('/muted/:ensOrAddress?', limitValidator, includeValidator, context => {
    return context.text('Not implemented', 501)
  })

  return users
}
