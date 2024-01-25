import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { Environment } from '#/types'

export function primaryList(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/primary-list', async context => {
    const { addressOrENS } = context.req.param()

    const address = await services.ens().getAddress(addressOrENS)
    const primaryList: bigint | undefined = await services.efp(env(context)).getUserPrimaryList(address)
    return context.json(
      {
        primary_list: primaryList !== undefined ? primaryList.toString() : null
      },
      200
    )
  })
}
