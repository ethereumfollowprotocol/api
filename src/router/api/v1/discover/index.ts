import { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Environment } from '#/types'
import type { Address } from '#/types/index'

export function discover(services: Services): Hono<{ Bindings: Environment }> {
  const discover = new Hono<{ Bindings: Environment }>()

  discover.get('/', async context => {
    const efp: IEFPIndexerService = services.efp(env(context))
    const latestFollows: Address[] = await efp.getDiscoverAccounts()

    const ensService = services.ens(env(context))
    if (context.req.query('include')?.includes('ens')) {
      const profiles: ENSProfile[] = []
      for (const address of latestFollows) {
        const profile = await ensService.getENSProfile(address)
        profiles.push(profile)
      }
      return context.json({ discover: profiles }, 200)
    }
    if (context.req.query('include')?.includes('counts')) {
      const discoverAccounts: { address: Address; followingCount: number; followersCount: number }[] = []
      for (const address of latestFollows) {
        const followersCount: number = await efp.getUserFollowersCount(address)
        let followingCount = 0
        const primaryList = await efp.getUserPrimaryList(address)
        if (primaryList === undefined) {
          followingCount = 0
        } else {
          followingCount = await efp.getUserFollowingCountByList(primaryList as unknown as string)
        }
        discoverAccounts.push({ address, followersCount, followingCount })
      }

      return context.json({ discover: discoverAccounts }, 200)
    }
    return context.json(
      {
        discover: latestFollows.map(address => {
          return { address }
        })
      },
      200
    )
  })
  return discover
}
