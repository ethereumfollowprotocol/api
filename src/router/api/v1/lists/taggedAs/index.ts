import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService, TagResponse, TagsResponse } from '#/service/efp-indexer/service'
import type { Address, Environment } from '#/types'
import { isAddress } from '#/utilities'

export function taggedAs(lists: Hono<{ Bindings: Environment }>, services: Services) {
  lists.get('/:token_id/taggedAs', async context => {
    const { token_id } = context.req.param()
    if (Number.isNaN(Number(token_id)) || Number(token_id) <= 0) {
      return context.json({ response: 'Invalid list id' }, 400)
    }
    const efp: IEFPIndexerService = services.efp(env(context))
    const address = await efp.getAddressByList(token_id)

    if (!(address && isAddress(address))) {
      return context.json({ response: 'Primary List Not Found' }, 404)
    }

    const tagsResponse: TagResponse[] = await efp.getListFollowerTags(token_id)

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
    return context.json({ token_id, tags, tagCounts, taggedAddresses: tagsResponse }, 200)
  })
}
