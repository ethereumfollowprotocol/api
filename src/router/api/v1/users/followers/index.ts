import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { includeValidator } from '#/router/api/v1/leaderboard/validators'
import type { Services } from '#/service'
import type { Address, Environment } from '#/types'

export function followers(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/followers', includeValidator, async context => {
    const { addressOrENS } = context.req.param()
    const { include } = context.req.valid('query')
    const includeENS = include?.includes('ens')
    const ensService = services.ens()
    const address: Address = await ensService.getAddress(addressOrENS)
    const followers = await services.efp(env(context)).getUserFollowers(address)
    const followersENS = includeENS
      ? await ensService.batchGetENSProfiles(followers.map(follower => follower.address))
      : null

    const followersWithENS =
      followers !== null
        ? followers.map((follower, index) => ({ ...follower, ens: followersENS !== null ? followersENS[index] : null }))
        : null

    return context.json({ data: followersWithENS || followers }, 200)
  })
}
