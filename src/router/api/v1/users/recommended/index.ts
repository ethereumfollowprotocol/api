import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { FollowingResponse, IEFPIndexerService, ENSProfile } from '#/service/efp-indexer/service'
import type { ENSProfileResponse } from '#/service/ens-metadata/service'
import type { Address, Environment } from '#/types'
import { type PrettyTaggedListRecord, hexlify, prettifyListRecord } from '#/types/list-record'

export type ENSFollowingResponse = PrettyTaggedListRecord & {
  ens?: ENSProfileResponse
}

/**
 * Enhanced to add ENS support
 */
export function recommended(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/recommended', async context => {
    const { addressOrENS } = context.req.param()

    const ensService = services.ens(env(context))
    const address: Address = await ensService.getAddress(addressOrENS)

    const efp: IEFPIndexerService = services.efp(env(context))
    const addresses: Address[] = await efp.getRecommended(address)

    const profiles: ENSProfile[] = await Promise.all(addresses.map( 
        async (address) => await ensService.getENSProfile(address) 
    ))
        console.log("profiles", profiles);
    return context.json({ recommended: profiles }, 200)
  })
}
