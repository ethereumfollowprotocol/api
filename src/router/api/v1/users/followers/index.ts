import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { Address, Environment } from '#/types'

export function followers(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/followers', async context => {
    const { addressOrENS } = context.req.param()

    const address: Address = await services.ens().getAddress(addressOrENS)
    const followers = await services.efp(env(context)).getUserFollowers(address)
    return context.json(
      {
        followers: followers.map(({ address, tags, is_following, is_blocked, is_muted }) => ({
          address,
          tags,
          is_following,
          is_blocked,
          is_muted
        }))
      },
      200
    )
  })
}
