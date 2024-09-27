import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Address, Environment } from '#/types'

export function details(lists: Hono<{ Bindings: Environment }>, services: Services) {
  lists.get('/:token_id/details', async context => {
    const { token_id } = context.req.param()
    const { cache } = context.req.query()
    // const { live } = context.req.query()
    if (Number.isNaN(Number(token_id)) || Number(token_id) <= 0) {
      return context.json({ response: 'Invalid list id' }, 400)
    }

    const cacheKV = context.env.EFP_DATA_CACHE
    const cacheTarget = `lists/${token_id}/details`
    if (cache !== 'fresh') {
      const cacheHit = await cacheKV.get(cacheTarget, 'json')
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }
    const ensService = services.ens(env(context))
    const efp: IEFPIndexerService = services.efp(env(context))
    const listUser: Address | undefined = await services.efp(env(context)).getAddressByList(token_id)
    if (!listUser) {
      return context.json({ response: 'No User Found' }, 404)
    }
    const { address, ...ens }: ENSProfile = await ensService.getENSProfile(listUser.toLowerCase(), false)
    const primaryList = await efp.getUserPrimaryList(address)

    const ranksAndCounts = await efp.getUserRanksCounts(address)

    const ranks = {
      mutuals_rank: ranksAndCounts.mutuals_rank,
      followers_rank: ranksAndCounts.followers_rank,
      following_rank: ranksAndCounts.following_rank,
      top8_rank: ranksAndCounts.top8_rank,
      blocks_rank: ranksAndCounts.blocks_rank
    }
    const response = { address } as Record<string, unknown>
    const packagedResponse = { ...response, ens, ranks, primary_list: primaryList?.toString() ?? null }
    await cacheKV.put(cacheTarget, JSON.stringify(packagedResponse), { expirationTtl: context.env.CACHE_TTL })
    return context.json(packagedResponse, 200)
  })
}
