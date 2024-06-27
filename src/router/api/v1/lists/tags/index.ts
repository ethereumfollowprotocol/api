import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService, TagResponse, TagsResponse } from '#/service/efp-indexer/service'
import type { Address, Environment } from '#/types'

const onlyLettersPattern = /^[A-Za-z]+$/

export function tags(lists: Hono<{ Bindings: Environment }>, services: Services) {
  lists.get('/:token_id/tags', async context => {
    const { token_id } = context.req.param()
    if (!token_id || Number.isNaN(token_id)) {
      return context.json({ response: 'invalid list id' }, 404)
    }
    const tagsQuery = context.req.query('include')
    let tagsToSearch: string[] = []
    if (tagsQuery) {
      const tagsArray = tagsQuery.split(',')
      tagsToSearch = tagsArray.filter(tag => tag.match(onlyLettersPattern))
    }
    const efp: IEFPIndexerService = services.efp(env(context))

    if (tagsToSearch.length > 0) {
      const tagsResponse: TagsResponse[] = await efp.getTaggedAddressesByTags(token_id, tagsToSearch)
      console.log('tagsResponse', tagsResponse)
      return context.json({ token_id, tagsToSearch, taggedAddresses: tagsResponse }, 200)
    }

    const tagsResponse: TagResponse[] = await efp.getTaggedAddressesByList(token_id)
    const tags: string[] = []
    for (const tagResponse of tagsResponse) {
      if (!tags.includes(tagResponse.tag)) {
        tags.push(tagResponse.tag)
      }
    }
    return context.json({ token_id, tags, taggedAddresses: tagsResponse }, 200)
  })
}
