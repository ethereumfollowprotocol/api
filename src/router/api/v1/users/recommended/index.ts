import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { NETWORKED_WALLET } from '#/constant'
import { includeValidator } from '#/router/api/v1/leaderboard/validators'
import type { Services } from '#/service'
import type { IEFPIndexerService, RecommendedRow } from '#/service/efp-indexer/service'
import type { ENSProfileResponse } from '#/service/ens-metadata/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Address, Environment } from '#/types'
import { type PrettyTaggedListRecord, hexlify, prettifyListRecord } from '#/types/list-record'
import { isAddress } from '#/utilities'

export type ENSFollowingResponse = PrettyTaggedListRecord & {
  ens?: ENSProfileResponse
}

export function recommended(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/recommended', includeValidator, async context => {
    const { addressOrENS } = context.req.param()
    let { offset, limit } = context.req.valid('query')
    if (!limit) limit = '10'
    if (!offset) offset = '0'
    const ensService = services.ens(env(context))
    const address: Address = await ensService.getAddress(addressOrENS)
    if (!isAddress(address)) {
      return context.json({ response: 'ENS name not valid or does not exist' }, 404)
    }

    const seed = context.req.query('seed') ? (context.req.query('seed') as Address) : (NETWORKED_WALLET as Address)
    const efp: IEFPIndexerService = services.efp(env(context))
    const recommendedAddresses: RecommendedRow[] = await efp.getRecommendedByAddress(
      address,
      seed,
      limit as string,
      offset as string
    )

    return context.json({ recommended: recommendedAddresses }, 200)
  })
}
