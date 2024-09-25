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
  users.get('/:token_id/recommended', includeValidator, async context => {
    const { token_id } = context.req.param()
    if (Number.isNaN(Number(token_id))) {
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
}
