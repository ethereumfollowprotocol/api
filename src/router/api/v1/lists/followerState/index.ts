import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { FollowStateResponse, IEFPIndexerService } from '#/service/efp-indexer/service'
import type { Address, Environment } from '#/types'
import { isAddress } from '#/utilities'

export function followerState(lists: Hono<{ Bindings: Environment }>, services: Services) {
  lists.get('/:token_id/:addressOrENS/followerState', async context => {
    const { token_id, addressOrENS } = context.req.param()
    const { cache } = context.req.query()
    if (Number.isNaN(Number(token_id)) || Number(token_id) <= 0) {
      return context.json({ response: 'Invalid list id' }, 400)
    }
    const cacheKV = context.env.EFP_DATA_CACHE
    const cacheTarget = `lists/${token_id}/${addressOrENS}/followerState`
    if (cache !== 'fresh') {
      const cacheHit = await cacheKV.get(cacheTarget, 'json')
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }

    const ensService = services.ens(env(context))
    const address: Address = await ensService.getAddress(addressOrENS)
    if (!isAddress(address)) {
      return context.json({ response: 'ENS name not valid or does not exist' }, 404)
    }
    const efp: IEFPIndexerService = services.efp(env(context))
    const state: FollowStateResponse = await efp.getListFollowerState(token_id, address)
    const packagedResponse = { token_id, address, state }
    await cacheKV.put(cacheTarget, JSON.stringify(packagedResponse), { expirationTtl: context.env.CACHE_TTL })
    return context.json(packagedResponse, 200)
  })
}
