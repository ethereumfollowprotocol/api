import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { includeValidator } from '#/router/api/v1/leaderboard/validators'
import type { Services } from '#/service'
import type { FollowerResponse } from '#/service/efp-indexer/service'
import type { ENSProfileResponse } from '#/service/ens-metadata/service'
import type { Address, Environment } from '#/types'

export type ENSFollowerResponse = FollowerResponse & { ens?: ENSProfileResponse }

export function followers(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/followers', includeValidator, async context => {
    const { addressOrENS } = context.req.param()
    const { include } = context.req.valid('query')
    const ensService = services.ens(env(context))
    const address: Address = await ensService.getAddress(addressOrENS)
    const followers: FollowerResponse[] = await services.efp(env(context)).getUserFollowers(address)

    let response: ENSFollowerResponse[] = followers

    if (include?.includes('ens')) {
      const ensProfilesForFollowers: ENSProfileResponse[] = await ensService.batchGetENSProfiles(
        followers.map(follower => follower.address)
      )

      response = followers.map((follower, index) => {
        const ens: ENSProfileResponse = ensProfilesForFollowers[index] as ENSProfileResponse
        const ensFollowerResponse: ENSFollowerResponse = {
          ...follower,
          ens
        }
        return ensFollowerResponse
      })
    }

    return context.json({ followers: response }, 200)
  })
}
