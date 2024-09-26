import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { FollowStateResponse, IEFPIndexerService } from '#/service/efp-indexer/service'
import type { Address, Environment } from '#/types'
import { isAddress } from '#/utilities'

export function followerState(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/:addressOrENS2/followerState', async context => {
    const { addressOrENS, addressOrENS2 } = context.req.param()
    const { cache } = context.req.query()

    const cacheKV = context.env.EFP_DATA_CACHE
    const cacheTarget = `users/${addressOrENS}/${addressOrENS2}/followerState`
    if (cache !== 'fresh') {
      const cacheHit = await cacheKV.get(cacheTarget, 'json')
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }
    const ensService = services.ens(env(context))
    const addressUser: Address = await ensService.getAddress(addressOrENS)
    if (!isAddress(addressUser)) {
      return context.json({ response: 'ENS name not valid or does not exist' }, 404)
    }
    const addressFollower: Address = await ensService.getAddress(addressOrENS2)
    if (!isAddress(addressFollower)) {
      return context.json({ response: 'ENS name not valid or does not exist' }, 404)
    }
    const efp: IEFPIndexerService = services.efp(env(context))
    const state: FollowStateResponse = await efp.getUserFollowerState(addressUser, addressFollower)
    const packagedResponse = { addressUser, addressFollower, state }
    await cacheKV.put(cacheTarget, JSON.stringify(packagedResponse), { expirationTtl: 120 })
    return context.json(packagedResponse, 200)
  })
}
