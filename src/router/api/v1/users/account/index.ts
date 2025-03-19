import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Address, Environment } from '#/types'
import { isAddress } from '#/utilities'

export function account(lists: Hono<{ Bindings: Environment }>, services: Services) {
  lists.get('/:addressOrENS/account', async context => {
    const { addressOrENS } = context.req.param()
    const { cache } = context.req.query()

    const cacheService = services.cache(env(context))
    const cacheTarget = `users/${addressOrENS}/account`
    if (cache !== 'fresh') {
      const cacheHit = await cacheService.get(cacheTarget)
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }

    const ensService = services.ens(env(context))
    const { address, ...ens }: ENSProfile = await ensService.getENSProfile(addressOrENS)
    const response = { address } as Record<string, unknown>

    const packagedResponse = { ...response, ens }
    await cacheService.put(cacheTarget, JSON.stringify(packagedResponse))
    return context.json(packagedResponse, 200)
  })
}
