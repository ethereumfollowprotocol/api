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
    const profiles: ENSProfile[] = []
    for (const address of latestFollows) {
      const profile = await ensService.getENSProfile(address)
      profiles.push(profile)
    }

    return context.json({ discover: profiles }, 200)
  })
  return discover
}
