import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService, TagResponse } from '#/service/efp-indexer/service'
import type { Address, Environment } from '#/types'
import { isAddress } from '#/utilities'

export function tags(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/tags', async context => {
    const { addressOrENS } = context.req.param()
    const ensService = services.ens(env(context))
    const address: Address = await ensService.getAddress(addressOrENS)
    if (!isAddress(address)) {
      return context.json({ response: 'ENS name not valid or does not exist' }, 404)
    }

    const efp: IEFPIndexerService = services.efp(env(context))

    const tagsResponse: TagResponse[] = await efp.getUserFollowerTags(address)
    // return context.json({ address, taggedAddresses: tagsResponse }, 200)

    const tags: string[] = []
    for (const tagResponse of tagsResponse) {
      if (!tags.includes(tagResponse.tag)) {
        tags.push(tagResponse.tag)
      }
    }
    return context.json({ address, tags, taggedAddresses: tagsResponse }, 200)
  })
}
