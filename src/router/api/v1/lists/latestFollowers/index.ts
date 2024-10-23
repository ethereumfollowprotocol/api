import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { includeValidator } from '#/router/api/v1/leaderboard/validators'
import type { Services } from '#/service'
import type { LatestFollowerResponse } from '#/service/efp-indexer/service'
import type { ENSProfileResponse } from '#/service/ens-metadata/service'
import type { Address, Environment } from '#/types'
import { isAddress, textOrEmojiPattern } from '#/utilities'
import { lists } from '..'

export type ENSFollowerResponse = LatestFollowerResponse & { ens?: ENSProfileResponse }

export function latestFollowers(lists: Hono<{ Bindings: Environment }>, services: Services) {
  lists.get('/:token_id/latestFollowers', includeValidator, async context => {
    const { token_id } = context.req.param()
    const { cache } = context.req.query()
    let { offset, limit } = context.req.valid('query')
    if (!limit) limit = '10'
    if (!offset) offset = '0'

    const listUser: Address | undefined = await services.efp(env(context)).getAddressByList(token_id)
    if (!listUser) {
      return context.json({ response: 'No User Found' }, 404)
    }

    const cacheKV = context.env.EFP_DATA_CACHE
    const cacheTarget = `lists/${token_id}/latestFollowers?limit=${limit}&offset=${offset}`
    if (cache !== 'fresh') {
      const cacheHit = await cacheKV.get(cacheTarget, 'json')
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }

    const followers: LatestFollowerResponse[] = await services
      .efp(env(context))
      .getLatestFollowersByList(token_id, limit as string, offset as string)

    const packagedResponse = { followers: followers }
    await cacheKV.put(cacheTarget, JSON.stringify(packagedResponse), { expirationTtl: context.env.CACHE_TTL })

    return context.json(packagedResponse, 200)
  })
}
