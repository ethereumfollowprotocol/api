import type { Hono } from 'hono'
import { env } from 'hono/adapter'

import type { Services } from '#/service'
import type { Environment } from '#/types'

export function details(slots: Hono<{ Bindings: Environment }>, services: Services) {
  slots.get('/:chain_id/:contract/:slot/details', async context => {
    const { chain_id, contract, slot } = context.req.param()
    const { cache } = context.req.query()
    const cacheService = services.cache(env(context))
    const cacheTarget = `slots/${slot}/details`
    if (cache !== 'fresh') {
      const cacheHit = await cacheService.get(cacheTarget)
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }

    // const slotDetails: {}[] = ['details not implemented']
    const slotDetails = await services.efp(env(context)).getListDetailsBySlot(Number(chain_id), contract, slot)

    if (!slotDetails) {
      return context.json({ response: 'No List Found' }, 404)
    }

    const packagedResponse = { slotDetails }
    await cacheService.put(cacheTarget, JSON.stringify(packagedResponse))
    return context.json(packagedResponse, 200)
  })
}
