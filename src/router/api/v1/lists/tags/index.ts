import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService, TagResponse, TagsResponse } from '#/service/efp-indexer/service'
import type { Address, Environment } from '#/types'

const onlyLettersPattern = /^[A-Za-z]+$/

export function tags(lists: Hono<{ Bindings: Environment }>, services: Services) {
  lists.get('/:token_id/tags', async context => {
    const { token_id } = context.req.param()
    if (Number.isNaN(Number(token_id)) || Number(token_id) <= 0) {
      return context.json({ response: 'Invalid list id' }, 400)
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
      return context.json({ token_id, tagsToSearch, taggedAddresses: tagsResponse }, 200)
    }

    const tagsResponse: TagResponse[] = await efp.getTaggedAddressesByList(token_id)
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
