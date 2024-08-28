import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { includeValidator } from '#/router/api/v1/leaderboard/validators'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Address, Environment } from '#/types'
import { isAddress } from '#/utilities'

export function account(lists: Hono<{ Bindings: Environment }>, services: Services) {
  lists.get('/:addressOrENS/account', includeValidator, async context => {
    const { addressOrENS } = context.req.param()
    const { include } = context.req.valid('query')
    const ensService = services.ens(env(context))
    const efp: IEFPIndexerService = services.efp(env(context))
    const returnedAddress: Address = await ensService.getAddress(addressOrENS)
    if (!isAddress(returnedAddress)) {
      return context.json({ response: 'ENS name not valid or does not exist' }, 404) // return error if address is not valid
    }
    const { address, ...ens }: ENSProfile = await ensService.getENSProfile(returnedAddress.toLowerCase())
    const response = { address } as Record<string, unknown>

    if (include === 'full') {
      const primaryList = await efp.getUserPrimaryList(address)
      return context.json({ ...response, ens, primary_list: primaryList?.toString() ?? null }, 200)
    }

    return context.json({ ...response, ens }, 200)
  })
}
