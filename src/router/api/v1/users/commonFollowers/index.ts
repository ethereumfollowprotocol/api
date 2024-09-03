import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { NETWORKED_WALLET } from '#/constant'
import type { Services } from '#/service'
import type { CommonFollowers, IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfileResponse } from '#/service/ens-metadata/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Address, Environment } from '#/types'
import { type PrettyTaggedListRecord, hexlify, prettifyListRecord } from '#/types/list-record'
import { isAddress } from '#/utilities'

export type ENSFollowingResponse = PrettyTaggedListRecord & {
  ens?: ENSProfileResponse
}

/**
 * Enhanced to add ENS support
 */
export function commonFollowers(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/commonFollowers', async context => {
    const { addressOrENS } = context.req.param()

    const ensService = services.ens(env(context))
    const address: Address = await ensService.getAddress(addressOrENS)
    if (!isAddress(address)) {
      return context.json({ response: 'ENS name not valid or does not exist' }, 404) // return error if address is not valid
    }

    const leader = context.req.query('leader')
    if (!(isAddress(leader as Address) && leader)) {
      return context.json({ response: 'Invalid query address' }, 404)
    }
    const efp: IEFPIndexerService = services.efp(env(context)) // efp is the service to get common followers
    const common: CommonFollowers[] = await efp.getCommonFollowers(
      address.toLowerCase() as Address,
      leader.toLowerCase() as Address
    ) // get common followers

    return context.json({ results: common, length: common.length }, 200) // return the common followers
  })
}
