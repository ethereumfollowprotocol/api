import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { NETWORKED_WALLET } from '#/constant'
import { includeValidator } from '#/router/api/v1/leaderboard/validators'
import type { Services } from '#/service'
import type { IEFPIndexerService, RecommendedDetailsRow, RecommendedRow } from '#/service/efp-indexer/service'
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

  users.get('/:addressOrENS/recommended/details', includeValidator, async context => {
    const { addressOrENS } = context.req.param()
    let { offset, limit } = context.req.valid('query')
    if (!limit) limit = '10'
    if (!offset) offset = '0'
    const ensService = services.ens(env(context))
    const address: Address = await ensService.getAddress(addressOrENS)
    if (!isAddress(address)) {
      return context.json({ response: 'ENS name not valid or does not exist' }, 404)
    }

    const efp: IEFPIndexerService = services.efp(env(context))
    const recommendedAddresses: RecommendedDetailsRow[] = await efp.getRecommendedStackByAddress(
      address,
      Number.parseInt(limit as string),
      Number.parseInt(offset as string)
    )
    const formattedRecommendations = recommendedAddresses.map(rec => {
      return {
        address: rec.address,
        ens: {
          name: rec.name,
          avatar: rec.avatar,
          records: JSON.parse(rec?.records) as string
        },
        stats: {
          followers_count: rec.followers,
          following_count: rec.following
        },
        ranks: {
          mutuals_rank: rec.mutuals_rank,
          followers_rank: rec.followers_rank,
          following_rank: rec.following_rank,
          top8_rank: rec.top8_rank,
          blocks_rank: rec.blocks_rank
        }
      }
    })

    return context.json({ recommended: formattedRecommendations }, 200)
  })
}
