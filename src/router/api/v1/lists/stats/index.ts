import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Address, Environment } from '#/types'

export function stats(lists: Hono<{ Bindings: Environment }>, services: Services) {
  lists.get('/:token_id/stats', async context => {
    const { token_id } = context.req.param()
    const { live } = context.req.query()

    const listUser: Address | undefined = await services.efp(env(context)).getAddressByList(token_id)
    if (!listUser) {
      return context.json({ response: 'No User Found' }, 404)
    }
    const address = listUser.toLowerCase() as Address
    const efp: IEFPIndexerService = services.efp(env(context))

    const ranksAndCounts = await efp.getUserRanksCounts(address)
    const stats = {
      followers_count: ranksAndCounts.followers,
      following_count: ranksAndCounts.following
    }

    if (live === 'true') {
      stats.following_count = await efp.getUserFollowingCount(address)
    }

    return context.json(stats, 200)
  })
}
