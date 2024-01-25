import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { IENSMetadataService } from '#/service/ens-metadata/service'
import type { Address, Environment } from '#/types'

export function stats(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/stats', async context => {
    const { addressOrENS } = context.req.param()

    const ens: IENSMetadataService = services.ens()
    const efp: IEFPIndexerService = services.efp(env(context))
    const address: Address = await ens.getAddress(addressOrENS)
    const followersCount: number = await efp.getUserFollowersCount(address)
    const stats = {
      followers_count: followersCount,
      following_count: 0
    }

    const primaryList: bigint | undefined = await efp.getUserPrimaryList(address)
    if (primaryList === undefined) {
      return context.json(stats, 200)
    }

    stats.following_count = await efp.getListRecordCount(primaryList)
    return context.json(stats, 200)
  })
}
