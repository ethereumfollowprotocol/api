import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { includeValidator } from '#/router/api/v1/leaderboard/validators'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfileResponse } from '#/service/ens-metadata/service'
import type { Address, Environment } from '#/types'
import { type PrettyTaggedListRecord, hexlify, prettifyListRecord } from '#/types/list-record'
import { textOrEmojiPattern } from '#/utilities'

export type ENSFollowingResponse = PrettyTaggedListRecord & {
  ens?: ENSProfileResponse
}

/**
 * Enhanced to add ENS support
 */
export function allFollowingAddresses(lists: Hono<{ Bindings: Environment }>, services: Services) {
  lists.get('/:token_id/allFollowingAddresses', includeValidator, async context => {
    const { token_id } = context.req.param()
    if (Number.isNaN(Number(token_id)) || Number(token_id) <= 0) {
      return context.json({ response: 'Invalid list id' }, 400)
    }
    const { cache } = context.req.valid('query')
    const cacheKV = context.env.EFP_DATA_CACHE
    const cacheTarget = `lists/${token_id}/allFollowingAddresses`
    if (cache !== 'fresh') {
      const cacheHit = await cacheKV.get(cacheTarget, 'json')
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }
    const listUser: Address | undefined = await services.efp(env(context)).getAddressByList(token_id)
    if (!listUser) {
      return context.json({ response: 'No User Found' }, 404)
    }

    const efp: IEFPIndexerService = services.efp(env(context))
    const followingAddresses: Address[] = await efp.getAllUserFollowingAddresses(token_id)

    const packagedResponse = followingAddresses
    await cacheKV.put(cacheTarget, JSON.stringify(packagedResponse), { expirationTtl: context.env.CACHE_TTL })

    return context.json(packagedResponse, 200)
  })
}
