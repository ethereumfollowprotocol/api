import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { Address, Environment } from '#/types'

export function poap(lists: Hono<{ Bindings: Environment }>, services: Services) {
  lists.get('/:token_id/badges', async context => {
    const { token_id } = context.req.param()
    const { cache } = context.req.query()

    if (Number.isNaN(Number(token_id)) || Number(token_id) <= 0) {
      return context.json({ response: 'Invalid list id' }, 400)
    }

    const cacheService = services.cache(env(context))
    const cacheTarget = `lists/${token_id}/badges`
    if (cache !== 'fresh') {
      const cacheHit = await cacheService.get(cacheTarget)
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }

    const efp: IEFPIndexerService = services.efp(env(context))
    const listUser: Address | undefined = await efp.getAddressByList(token_id)
    if (!listUser) {
      return context.json({ response: 'No User Found' }, 404)
    }

    const headers = {
      method: 'GET',
      headers: {
        'X-API-Key': `${context.env.POAP_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }

    const collections = ['177709', '178064', '178065', '178066']
    const data = await Promise.all(
      collections.map(async collection => {
        const response = await fetch(`https://api.poap.tech/actions/scan/${listUser}/${collection}`, headers)
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
