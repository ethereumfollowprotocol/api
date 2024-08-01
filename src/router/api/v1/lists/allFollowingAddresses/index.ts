import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { includeValidator } from '#/router/api/v1/leaderboard/validators'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfileResponse } from '#/service/ens-metadata/service'
import type { Address, Environment } from '#/types'
import { type PrettyTaggedListRecord, hexlify, prettifyListRecord } from '#/types/list-record'
import { textOrEmojiPattern } from '#/utilities'

export type ENSFollowingResponse = PrettyTaggedListRecord & {
  ens?: ENSProfileResponse
}

/**
 * Enhanced to add ENS support
 */
export function allFollowingAddresses(lists: Hono<{ Bindings: Environment }>, services: Services) {
  lists.get('/:token_id/allFollowingAddresses', includeValidator, async context => {
    const { token_id } = context.req.param()

    const listUser: Address | undefined = await services.efp(env(context)).getAddressByList(token_id)
    if (!listUser) {
      return context.json({ response: 'No User Found' }, 404)
    }

    const efp: IEFPIndexerService = services.efp(env(context))
    const followingAddresses: Address[] = await efp.getAllUserFollowingAddresses(token_id)

    return context.json(followingAddresses, 200)
  })
}
