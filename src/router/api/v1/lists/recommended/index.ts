import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { NETWORKED_WALLET } from '#/constant'
import { includeValidator } from '#/router/api/v1/leaderboard/validators'
import type { Services } from '#/service'
import type { IEFPIndexerService, RecommendedRow, RecommendedStackRow } from '#/service/efp-indexer/service'
import type { ENSProfileResponse } from '#/service/ens-metadata/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Address, Environment } from '#/types'
import { type PrettyTaggedListRecord, hexlify, prettifyListRecord } from '#/types/list-record'
import { isAddress } from '#/utilities'

export type ENSFollowingResponse = PrettyTaggedListRecord & {
  ens?: ENSProfileResponse
}

export function recommended(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:token_id/recommended', includeValidator, async context => {
    const { token_id } = context.req.param()
    if (Number.isNaN(Number(token_id)) || Number(token_id) <= 0) {
      return context.json({ response: 'Invalid list id' }, 400)
    }
    let { offset, limit } = context.req.valid('query')
    if (!limit) limit = '10'
    if (!offset) offset = '0'

    const seed = context.req.query('seed') ? (context.req.query('seed') as Address) : (NETWORKED_WALLET as Address)
    const efp: IEFPIndexerService = services.efp(env(context))
    const recommendedAddresses: RecommendedRow[] = await efp.getRecommendedByList(
      token_id,
      seed,
      limit as string,
      offset as string
    )

    return context.json({ recommended: recommendedAddresses }, 200)
  })

  users.get('/:token_id/recommended/stack', includeValidator, async context => {
    const { token_id } = context.req.param()
    if (Number.isNaN(Number(token_id)) || Number(token_id) <= 0) {
      return context.json({ response: 'Invalid list id' }, 400)
    }
    let { offset, limit } = context.req.valid('query')
    if (!limit) limit = '10'
    if (!offset) offset = '0'

    const efp: IEFPIndexerService = services.efp(env(context))
    const recommendedAddresses: RecommendedStackRow[] = await efp.getRecommendedStackByList(
      token_id,
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
          followers: rec.followers,
          following: rec.following
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
