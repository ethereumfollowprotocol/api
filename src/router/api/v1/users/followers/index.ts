import type { Services } from '#/service'
import type { Address, Environment } from '#/types'
import type { Hono } from 'hono'
import { env } from 'hono/adapter'

export function followers(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/followers', async context => {
    const { addressOrENS } = context.req.param()

    const address: Address = await services.ens().getAddress(addressOrENS)
    const followers = await services.efp(env(context)).getUserFollowers(address)
    return context.json(
      {
        followers: followers.map(({ follower, tags, isFollowing, isBlocked, isMuted }) => ({
          follower,
          tags,
          is_following: isFollowing,
          is_blocked: isBlocked,
          is_muted: isMuted
        }))
      },
      200
    )
  })
}
