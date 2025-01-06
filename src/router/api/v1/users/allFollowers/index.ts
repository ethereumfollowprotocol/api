import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { includeValidator } from '#/router/api/v1/leaderboard/validators'
import type { Services } from '#/service'
import type { FollowerResponse } from '#/service/efp-indexer/service'
import type { ENSProfileResponse } from '#/service/ens-metadata/service'
import type { Address, Environment } from '#/types'
import { isAddress, textOrEmojiPattern } from '#/utilities'

export type ENSFollowerResponse = FollowerResponse & { ens?: ENSProfileResponse }

export function allFollowers(users: Hono<{ Bindings: Environment }>, services: Services) {
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
  users.get('/:addressOrENS/allFollowers', includeValidator, async context => {
    const { addressOrENS } = context.req.param()
    const { cache } = context.req.query()
    let { include, offset, limit } = context.req.valid('query')
    if (!limit) limit = '10'
    if (!offset) offset = '0'

    let direction = 'latest'
    if (context.req.query('sort')?.toLowerCase() === 'followers') {
      direction = 'followers'
    } else if (context.req.query('sort')?.toLowerCase() === 'earliest') {
      direction = 'earliest'
    }

    const tagsQuery = context.req.query('tags')
    let tagsToSearch: string[] = []
    if (tagsQuery) {
      const tagsArray = tagsQuery.split(',')
      tagsToSearch = tagsArray.filter((tag: any) => tag.match(textOrEmojiPattern))
    }

    const cacheService = services.cache(env(context))
    const cacheTarget = `users/${addressOrENS}/allFollowers?limit=${limit}&offset=${offset}&sort=${direction}&tags=${tagsToSearch.join(',')}`
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

    const followers: FollowerResponse[] = await services
      .efp(env(context))
      .getAllUserFollowersByAddressTagSort(address, limit, offset, tagsToSearch, direction)
    let response: ENSFollowerResponse[] = followers

    if (include?.includes('ens')) {
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
    await cacheService.put(cacheTarget, JSON.stringify(packagedResponse))

    return context.json(packagedResponse, 200)
  })
}
