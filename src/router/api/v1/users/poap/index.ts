import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { Address, Environment } from '#/types'
import { isAddress } from '#/utilities'

export function poap(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/poap', async context => {
    const { addressOrENS } = context.req.param()
    const address: Address = await services.ens(env(context)).getAddress(addressOrENS)
    if (!isAddress(address)) {
      return context.json({ response: 'ENS name not valid or does not exist' }, 404)
    }
    const efp: IEFPIndexerService = services.efp(env(context))
    const link = await efp.claimPoapLink(address)

    return context.json({ link }, 200)
  })

  users.get('/:addressOrENS/badges', async context => {
    const { addressOrENS } = context.req.param()
    const { cache } = context.req.query()

    const cacheService = services.cache(env(context))
    const cacheTarget = `users/${addressOrENS}/badges`
    if (cache !== 'fresh') {
      const cacheHit = await cacheService.get(cacheTarget)
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }

    const address: Address = await services.ens(env(context)).getAddress(addressOrENS)
    if (!isAddress(address)) {
      return context.json({ response: 'ENS name not valid or does not exist' }, 404)
    }

    const headers = {
      method: 'GET',
      headers: {
        'X-API-Key': `${context.env.POAP_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }

    const collections = ['177709', '178064', '178065', '178066', '183182']
    const data = await Promise.all(
      collections.map(async collection => {
        const response = await fetch(`https://api.poap.tech/actions/scan/${address}/${collection}`, headers)
        return response.json()
      })
    )
    const poaps = data.map((_collection, index) => {
      return {
        eventId: collections[index],
        participated: !!(data[index] as any).tokenId,
        collection: (data[index] as any).tokenId ? data[index] : null
      }
    })

    const packagedResponse = { poaps }
    await cacheService.put(cacheTarget, JSON.stringify(packagedResponse))
    return context.json(packagedResponse, 200)
  })
}
