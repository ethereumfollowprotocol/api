import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { includeValidator } from '#/router/api/v1/leaderboard/validators'
import type { Services } from '#/service'
import type { LatestFollowerResponse } from '#/service/efp-indexer/service'
import type { ENSProfileResponse } from '#/service/ens-metadata/service'
import type { Address, Environment } from '#/types'
import { isAddress, textOrEmojiPattern } from '#/utilities'

export type ENSFollowerResponse = LatestFollowerResponse & { ens?: ENSProfileResponse }

export function latestFollowers(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/latestFollowers', includeValidator, async context => {
    const { addressOrENS } = context.req.param()
    const { cache } = context.req.query()
    let { offset, limit } = context.req.valid('query')
    if (!limit) limit = '10'
    if (!offset) offset = '0'

    const cacheService = services.cache(env(context))
    const cacheTarget = `users/${addressOrENS}/latestFollowers?limit=${limit}&offset=${offset}`
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

    const followers: LatestFollowerResponse[] = await services
      .efp(env(context))
      .getLatestFollowersByAddress(address, limit as string, offset as string)

    const packagedResponse = { followers: followers }
    await cacheService.put(cacheTarget, JSON.stringify(packagedResponse))

    return context.json(packagedResponse, 200)
  })
}
