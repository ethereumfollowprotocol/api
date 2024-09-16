import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { IENSMetadataService } from '#/service/ens-metadata/service'
import type { Address, Environment } from '#/types'
import { isAddress } from '#/utilities'

export function stats(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/stats', async context => {
    const { addressOrENS } = context.req.param()
    const { live } = context.req.query()
    let address: Address = addressOrENS.toLowerCase() as Address
    if (!isAddress(addressOrENS)) {
      const ens: IENSMetadataService = services.ens(env(context))
      address = await ens.getAddress(addressOrENS)
      if (!isAddress(address)) {
        return context.json({ response: 'ENS name not valid or does not exist' }, 404)
      }
    }
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
