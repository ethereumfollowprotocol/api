import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { includeValidator } from '#/router/api/v1/leaderboard/validators'
import type { Services } from '#/service'
import type { ENSTaggedListRecord, FollowingResponse, IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfileResponse } from '#/service/ens-metadata/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Address, Environment } from '#/types'
import { type PrettyTaggedListRecord, hexlify, prettifyListRecord } from '#/types/list-record'
import { isAddress, textOrEmojiPattern } from '#/utilities'

export type ENSFollowingResponse = PrettyTaggedListRecord & {
  ens?: ENSProfileResponse
}

export function searchFollowing(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:token_id/searchFollowing', includeValidator, async context => {
    const { token_id } = context.req.param()
    let { offset, limit } = context.req.valid('query')
    if (!limit) limit = '10'
    if (!offset) offset = '0'

    let term = context.req.query('term')

    if (!term?.match(textOrEmojiPattern)) {
      return context.json({ results: [] }, 200)
    }
    if (!isAddress(term as string)) {
      term = term?.toLowerCase()
    }
    const efp: IEFPIndexerService = services.efp(env(context))
    const followingListRecords: ENSTaggedListRecord[] = await efp.searchUserFollowingByList(
      token_id,
      limit as string,
      offset as string,
      term
    )

    const response = followingListRecords.map(record => {
      return { ...prettifyListRecord(record), ens: { name: record.ens?.name, avatar: record.ens?.avatar } }
    })

    return context.json({ following: response }, 200)
  })
}
