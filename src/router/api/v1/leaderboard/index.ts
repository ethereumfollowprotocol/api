import { Hono } from 'hono'

import type { Services } from '#/service'
import type { Environment } from '#/types'

export function leaderboard(services: Services): Hono<{ Bindings: Environment }> {
  const users = new Hono<{ Bindings: Environment }>()

  users.get('/followers', async context => {
    const limit = context.req.query('limit') ? parseInt(context.req.query('limit') as string, 10) : 10
    const mostFollowers: { address: string; followers_count: number }[] = await services
      .efp(context.env)
      .getTopFollowed(limit)
    return context.json(mostFollowers, 200)
  })

  users.get('/following', async context => {
    const limit = context.req.query('limit') ? parseInt(context.req.query('limit') as string, 10) : 10
    const mostFollowing: { address: string; following_count: number }[] = await services
      .efp(context.env)
      .getTopFollowing(limit)
    return context.json(mostFollowing, 200)
  })

  return users
}
