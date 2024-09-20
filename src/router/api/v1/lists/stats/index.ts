import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Address, Environment } from '#/types'

export function stats(lists: Hono<{ Bindings: Environment }>, services: Services) {
  lists.get('/:token_id/stats', async context => {
    const { token_id } = context.req.param()

    if (!token_id) {
      return context.json({ response: 'Invalid List Id' }, 404)
    }

    const efp: IEFPIndexerService = services.efp(env(context))

    const stats = {
      followers_count: await efp.getUserFollowersCountByList(token_id),
      following_count: await efp.getUserFollowingCountByList(token_id)
    }

    return context.json(stats, 200)
  })
}
