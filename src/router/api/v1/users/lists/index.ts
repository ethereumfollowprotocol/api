import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { Address, Environment } from '#/types'
import type { TaggedListRecord } from '#/types/list-record'
import { isAddress } from '#/utilities'

export function lists(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/lists', async context => {
    const { addressOrENS } = context.req.param()
    const address: Address = await services.ens(env(context)).getAddress(addressOrENS)
    if (!isAddress(address)) {
      return context.json({ response: 'ENS name not valid or does not exist' }, 404)
    }
    const efp: IEFPIndexerService = services.efp(env(context))
    const primaryList = await efp.getUserPrimaryList(address)
    const lists: number[] = await efp.getUserLists(address)

    return context.json({ primary_list: primaryList?.toString() ?? null, lists }, 200)
  })
}
