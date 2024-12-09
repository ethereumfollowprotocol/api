import { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { DiscoverRow, IEFPIndexerService, MintersRow } from '#/service/efp-indexer/service'
import type { Environment } from '#/types'
import type { Address } from '#/types/index'

export function minters(services: Services): Hono<{ Bindings: Environment }> {
  const minters = new Hono<{ Bindings: Environment }>()

  minters.get('/', async context => {
    let { cache, limit, offset } = context.req.query()

    if (!limit) limit = '10'
    if (!offset) offset = '0'
    const cacheService = services.cache(env(context))
    const cacheTarget = `minters?limit=${limit}&offset=${offset}`
    if (cache !== 'fresh') {
      const cacheHit = await cacheService.get(cacheTarget)
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }

    const efp: IEFPIndexerService = services.efp(env(context))
    const minters: MintersRow[] = await efp.getUniqueMinters(Number.parseInt(limit), Number.parseInt(offset))
    await cacheService.put(cacheTarget, JSON.stringify({ minters }))
    return context.json({ minters }, 200)
  })
  return minters
}
