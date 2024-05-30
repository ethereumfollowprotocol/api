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
    const latestProfiles: ENSProfile[] = await Promise.all(
      latestFollows.map(async address => await ensService.getENSProfile(address))
    )

    return context.json({ discover: latestProfiles }, 200)
  })
  return discover
}
