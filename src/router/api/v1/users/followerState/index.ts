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

    const cacheService = services.cache(env(context))
    const cacheTarget = `users/${addressOrENS}/${addressOrENS2}/followerState`
    if (cache !== 'fresh') {
      const cacheHit = await cacheService.get(cacheTarget)
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
    if (env(context).ALLOW_TTL_MOD === 'true') {
      await cacheService.put(cacheTarget, JSON.stringify(packagedResponse), 0)
    } else {
      await cacheService.put(cacheTarget, JSON.stringify(packagedResponse))
    }
    return context.json(packagedResponse, 200)
  })
}
