import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { includeValidator } from '#/router/api/v1/leaderboard/validators'
import type { Services } from '#/service'
import type { FollowerResponse } from '#/service/efp-indexer/service'
import type { ENSProfileResponse } from '#/service/ens-metadata/service'
import type { Address, Environment } from '#/types'
import { isAddress, textOrEmojiPattern } from '#/utilities'

export type ENSFollowerResponse = FollowerResponse & { ens?: ENSProfileResponse }

export function searchFollowers(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/searchFollowers', includeValidator, async context => {
    const { addressOrENS } = context.req.param()
    let { offset, limit } = context.req.valid('query')
    if (!limit) limit = '10'
    if (!offset) offset = '0'
    const ensService = services.ens(env(context))
    const address: Address = await ensService.getAddress(addressOrENS)
    if (!isAddress(address)) {
      return context.json({ response: 'ENS name not valid or does not exist' }, 404)
    }

    let term = context.req.query('term')

    if (!term?.match(textOrEmojiPattern)) {
      return context.json({ results: [] }, 200)
    }
    if (!isAddress(term as string)) {
      term = term?.toLowerCase()
    }
    const followers: ENSFollowerResponse[] = await services
      .efp(env(context))
      .searchUserFollowersByAddress(address, limit as string, offset as string, term)
    const response: ENSFollowerResponse[] = followers

    return context.json({ followers: response }, 200)
  })
}
