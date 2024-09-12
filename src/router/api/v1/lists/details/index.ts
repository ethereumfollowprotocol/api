import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Address, Environment } from '#/types'

export function details(lists: Hono<{ Bindings: Environment }>, services: Services) {
  lists.get('/:token_id/details', async context => {
    const { token_id } = context.req.param()
    const { live } = context.req.query()

    const ensService = services.ens(env(context))
    const efp: IEFPIndexerService = services.efp(env(context))
    const listUser: Address | undefined = await services.efp(env(context)).getAddressByList(token_id)
    if (!listUser) {
      return context.json({ response: 'No User Found' }, 404)
    }
    const { address, ...ens }: ENSProfile = await ensService.getENSProfile(listUser.toLowerCase(), true)
    const primaryList = await efp.getUserPrimaryList(address)
    if (live === 'true') {
      const ranks = await efp.getUserRanks(address)
      const stats = {
        followers_count: await efp.getUserFollowersCountByList(token_id),
        following_count: await efp.getUserFollowingCountByList(token_id)
      }

      const response = { address } as Record<string, unknown>
      return context.json({ ...response, ens, ranks, stats, primary_list: primaryList?.toString() ?? null }, 200)
    }
    const ranks = await efp.getUserRanksCounts(address)
    const stats = {
      followers_count: ranks.followers,
      following_count: ranks.following
    }
    const ranksOnly = {
      mutuals_rank: ranks.mutuals_rank,
      followers_rank: ranks.followers_rank,
      following_rank: ranks.following_rank,
      top8_rank: ranks.top8_rank,
      blocks_rank: ranks.blocks_rank
    }
    const response = { address } as Record<string, unknown>
    return context.json({ ...response, ens, ranksOnly, stats, primary_list: primaryList?.toString() ?? null }, 200)
  })
}
