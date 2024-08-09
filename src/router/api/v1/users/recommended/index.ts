import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { NETWORKED_WALLET } from '#/constant'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
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
export function recommended(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/recommended', async context => {
    const { addressOrENS } = context.req.param()

    const ensService = services.ens(env(context))
    const address: Address = await ensService.getAddress(addressOrENS)
    if (!isAddress(address)) {
      return context.json({ response: 'ENS name not valid or does not exist' }, 404)
    }

    const seed = context.req.query('seed') ? (context.req.query('seed') as Address) : (NETWORKED_WALLET as Address)
    const efp: IEFPIndexerService = services.efp(env(context))
    const recommendedAddresses: Address[] = await efp.getRecommended(address, seed)
    if (context.req.query('include')?.includes('ens')) {
      const profiles: ENSProfile[] = []
      for (const addr of recommendedAddresses) {
        const profile = await ensService.getENSProfile(addr)
        profiles.push(profile)
      }
      return context.json({ recommended: profiles }, 200)
    }

    return context.json({ recommended: recommendedAddresses }, 200)
  })
}
