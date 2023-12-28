import type { Hono } from 'hono'
import type { Services } from '#/service'
import type { Address, Environment } from '#/types'
import { env } from 'hono/adapter'

export function followers(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:ensOrAddress/followers', async context => {
    const { ensOrAddress } = context.req.param()

    const address: Address = await services.ens().getAddress(ensOrAddress)
    const followers: `0x${string}`[] = await services.efp(env(context)).getFollowers(address)
    return context.json({ followers }, 200)
  })
}
