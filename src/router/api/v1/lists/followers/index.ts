import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { includeValidator } from '#/router/api/v1/leaderboard/validators'
import type { Services } from '#/service'
import type { FollowerResponse, IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfileResponse } from '#/service/ens-metadata/service'
import type { Address, Environment } from '#/types'
import { textOrEmojiPattern } from '#/utilities'

export type ENSFollowerResponse = FollowerResponse & { ens?: ENSProfileResponse }

export function followers(lists: Hono<{ Bindings: Environment }>, services: Services) {
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
  lists.get('/:token_id/followers', includeValidator, async context => {
    const { token_id } = context.req.param()

    if (Number.isNaN(Number(token_id)) || Number(token_id) <= 0) {
      return context.json({ response: 'Invalid list id' }, 400)
    }

    let { include, offset, limit, cache } = context.req.valid('query')

    if (!limit) limit = '10'
    if (!offset) offset = '0'
    let direction = 'latest'
    if (context.req.query('sort')?.toLowerCase() === 'followers') {
      direction = 'followers'
    } else if (context.req.query('sort')?.toLowerCase() === 'earliest') {
      direction = 'earliest'
    }

    const cacheKV = context.env.EFP_DATA_CACHE
    const cacheTarget = `lists/${token_id}/followers?limit=${limit}&offset=${offset}&sort=${direction}`
    if (cache !== 'fresh') {
      const cacheHit = await cacheKV.get(cacheTarget, 'json')
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }

    const listUser: Address | undefined = await services.efp(env(context)).getAddressByList(token_id)
    // const address: Address = await ensService.getAddress(addressOrENS)
    if (!listUser) {
      return context.json({ response: 'No User Found' }, 404)
    }

    const tagsQuery = context.req.query('tags')
    let tagsToSearch: string[] = []
    if (tagsQuery) {
      const tagsArray = tagsQuery.split(',')
      tagsToSearch = tagsArray.filter((tag: any) => tag.match(textOrEmojiPattern))
    }

    const efp: IEFPIndexerService = services.efp(env(context))
    const followers: FollowerResponse[] = await efp.getUserFollowersByListTagSort(
      token_id,
      limit,
      offset,
      tagsToSearch,
      direction
    )

    let response: ENSFollowerResponse[] = followers

    if (include?.includes('ens')) {
      const ensService = services.ens(env(context))
      const ensProfilesForFollowers: ENSProfileResponse[] = await ensService.batchGetENSProfiles(
        followers.map(follower => follower.address)
      )

      response = followers.map((follower, index) => {
        const ens: ENSProfileResponse = ensProfilesForFollowers[index] as ENSProfileResponse
        const ensFollowerResponse: ENSFollowerResponse = {
          ...follower,
          ens
        }
        return ensFollowerResponse
      })
    }
    const packagedResponse = { followers: response }
    await cacheKV.put(cacheTarget, JSON.stringify(packagedResponse), { expirationTtl: context.env.CACHE_TTL })

    return context.json(packagedResponse, 200)
  })
}
