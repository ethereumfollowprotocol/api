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
    const { cache } = context.req.query()

    const cacheKV = context.env.EFP_DATA_CACHE
    const cacheTarget = `users/${addressOrENS}/lists`
    if (cache !== 'fresh') {
      const cacheHit = await cacheKV.get(cacheTarget, 'json')
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }

    let address: Address
    if (isAddress(addressOrENS)) {
      address = addressOrENS.toLowerCase() as Address
    } else {
      address = await services.ens(env(context)).getAddress(addressOrENS)
      if (!isAddress(address)) {
        return context.json({ response: 'ENS name not valid or does not exist' }, 404)
      }
    }
    const efp: IEFPIndexerService = services.efp(env(context))
    const primaryList = await efp.getUserPrimaryList(address)
    const lists: number[] = await efp.getUserLists(address)

    const packagedResponse = { primary_list: primaryList?.toString() ?? null, lists }
    await cacheKV.put(cacheTarget, JSON.stringify(packagedResponse), { expirationTtl: 120 })

    return context.json(packagedResponse, 200)
  })
}
