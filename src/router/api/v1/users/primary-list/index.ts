import type { Hono } from 'hono'
import type { Services } from '#/service'
import type { Environment } from '#/types'

export function primaryList(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:ensOrAddress/primary-list', async context => {
    const { ensOrAddress } = context.req.param()

    const address = await services.ens().getAddress(ensOrAddress)
    const primaryList: bigint | undefined = await services.efp(context.env).getPrimaryList(address)
    return context.json(
      {
        primary_list: primaryList !== undefined ? primaryList.toString() : null
      },
      200
    )
  })
}
