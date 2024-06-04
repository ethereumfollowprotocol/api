import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Environment } from '#/types'

export function details(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/details', async context => {
    const { addressOrENS } = context.req.param()
    const ensService = services.ens(env(context))
    const { address, ...ens }: ENSProfile = await ensService.getENSProfile(addressOrENS.toLowerCase())

    const efp: IEFPIndexerService = services.efp(env(context))
    const primaryList = await efp.getUserPrimaryList(address)

    const response = { address } as Record<string, unknown>
    return context.json({ ...response, ens, primary_list: primaryList?.toString() ?? null }, 200)
  })
}
