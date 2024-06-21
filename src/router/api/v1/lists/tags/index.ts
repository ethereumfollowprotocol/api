import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { FollowingStateResponse, IEFPIndexerService, TagsResponse } from '#/service/efp-indexer/service'
import type { Address, Environment } from '#/types'
import { isAddress } from '#/utilities'

export function tags(lists: Hono<{ Bindings: Environment }>, services: Services) {
  lists.get('/:token_id/tags', async context => {
    const { token_id } = context.req.param()

    if (!token_id || Number.isNaN(token_id)) {
      return context.json({ response: 'invalid list id' }, 404)
    }
    const efp: IEFPIndexerService = services.efp(env(context))

    const tagsResponse: TagsResponse[] = await efp.getTaggedAddressesByList(token_id)
    const tags: string[] = []
    for (const tagResponse of tagsResponse) {
      if (!tags.includes(tagResponse.tag)) {
        tags.push(tagResponse.tag)
      }
    }
    return context.json({ token_id, tags, taggedAddresses: tagsResponse }, 200)
  })
}
