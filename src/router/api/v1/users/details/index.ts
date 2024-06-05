import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Environment } from '#/types'
import { isAddress } from '#/utilities'

export function details(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/details', async context => {
    const { addressOrENS } = context.req.param()
    const ensService = services.ens(env(context))
    const { address, ...ens }: ENSProfile = await ensService.getENSProfile(addressOrENS.toLowerCase())
    if (!isAddress(address)) {
      return context.json({ response: 'ENS name not valid or does not exist' }, 404)
    }
    const efp: IEFPIndexerService = services.efp(env(context))
    const primaryList = await efp.getUserPrimaryList(address)

    const stats = {
      followers_count: await efp.getUserFollowersCount(address),
      following_count: await efp.getUserFollowingCount(address)
    }

    const response = { address } as Record<string, unknown>
    return context.json({ ...response, ens, stats, primary_list: primaryList?.toString() ?? null }, 200)
  })
}
