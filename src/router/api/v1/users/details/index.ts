import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Address, Environment } from '#/types'
import { isAddress } from '#/utilities'

export function details(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/details', async context => {
    const { addressOrENS } = context.req.param()
    const { live } = context.req.query()

    const ensService = services.ens(env(context))
    const { address, ...ens }: ENSProfile = await ensService.getENSProfile(addressOrENS.toLowerCase(), false)
    if (!isAddress(address)) {
      return context.json({ response: 'ENS name not valid or does not exist' }, 404)
    }

    const normalizedAddress: Address = address.toLowerCase() as `0x${string}`
    const efp: IEFPIndexerService = services.efp(env(context))
    const primaryList = await efp.getUserPrimaryList(normalizedAddress)
    if (live === 'true') {
      const ranks = await efp.getUserRanks(normalizedAddress)
      const stats = {
        followers_count: await efp.getUserFollowersCount(normalizedAddress),
        following_count: await efp.getUserFollowingCount(normalizedAddress)
      }

      const response = { address } as Record<string, unknown>
      return context.json({ ...response, ens, ranks, stats, primary_list: primaryList?.toString() ?? null }, 200)
    }
    const ranksAndCounts = await efp.getUserRanksCounts(address)
    const stats = {
      followers_count: ranksAndCounts.followers,
      following_count: ranksAndCounts.following
    }
    const ranks = {
      mutuals_rank: ranksAndCounts.mutuals_rank,
      followers_rank: ranksAndCounts.followers_rank,
      following_rank: ranksAndCounts.following_rank,
      top8_rank: ranksAndCounts.top8_rank,
      blocks_rank: ranksAndCounts.blocks_rank
    }
    const response = { address } as Record<string, unknown>
    return context.json({ ...response, ens, ranks, stats, primary_list: primaryList?.toString() ?? null }, 200)
  })
}
