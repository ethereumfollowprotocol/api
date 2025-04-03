import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService, TagResponse } from '#/service/efp-indexer/service'
import type { Address, Environment } from '#/types'
import { isAddress } from '#/utilities'

export function tags(users: Hono<{ Bindings: Environment }>, services: Services) {
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
  users.get('/:addressOrENS/tags', async context => {
    const { addressOrENS } = context.req.param()
    const { cache } = context.req.query()
    const cacheService = services.cache(env(context))
    const cacheTarget = `lists/${addressOrENS}/tags`.toLowerCase()
    if (cache !== 'fresh') {
      const cacheHit = await cacheService.get(cacheTarget)
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
    const list_id = await efp.getUserPrimaryList(address)
    if (!list_id) {
      return context.json({ response: 'Primary List Not Found' }, 404)
    }
    const tagsResponse: TagResponse[] = await efp.getTaggedAddressesByList(list_id as unknown as string)

    const tags: string[] = []
    const counts: any[] = []
    for (const tagResponse of tagsResponse) {
      if (!tags.includes(tagResponse.tag)) {
        tags.push(tagResponse.tag)
        ;(counts as any)[tagResponse.tag] = 0
      }
      ;(counts as any)[tagResponse.tag]++
    }
    const tagCounts = tags.map(tag => {
      return { tag: tag, count: (counts as any)[tag] }
    })
    const packagedResponse = { address, tags, tagCounts, taggedAddresses: tagsResponse }
    if (env(context).ALLOW_TTL_MOD === 'true') {
      await cacheService.put(cacheTarget, JSON.stringify(packagedResponse), 0)
    } else {
      await cacheService.put(cacheTarget, JSON.stringify(packagedResponse))
    }
    return context.json(packagedResponse, 200)
  })
}
