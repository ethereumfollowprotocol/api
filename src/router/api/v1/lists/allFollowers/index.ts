import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { includeValidator } from '#/router/api/v1/leaderboard/validators'
import type { Services } from '#/service'
import type { FollowerResponse, IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfileResponse } from '#/service/ens-metadata/service'
import type { Address, Environment } from '#/types'
import { isAddress } from '#/utilities'

export type ENSFollowerResponse = FollowerResponse & { ens?: ENSProfileResponse }

const onlyLettersPattern = /^[A-Za-z]+$/

export function allFollowers(lists: Hono<{ Bindings: Environment }>, services: Services) {
  lists.get('/:token_id/allFollowers', includeValidator, async context => {
    const { token_id } = context.req.param()
    let { include, offset, limit } = context.req.valid('query')
    if (!limit) limit = '10'
    if (!offset) offset = '0'

    const listUser: Address | undefined = await services.efp(env(context)).getAddressByList(token_id)
    // const address: Address = await ensService.getAddress(addressOrENS)
    if (!listUser) {
      return context.json({ response: 'No User Found' }, 404)
    }

    const tagsQuery = context.req.query('tags')
    let tagsToSearch: string[] = []
    if (tagsQuery) {
      const tagsArray = tagsQuery.split(',')
      tagsToSearch = tagsArray.filter((tag: any) => tag.match(onlyLettersPattern))
    }

    const direction = context.req.query('sort') === 'latest' ? 'DESC' : 'ASC'

    const efp: IEFPIndexerService = services.efp(env(context))

    const followers: FollowerResponse[] = await efp.getUserFollowersByListTagSort(
      token_id,
      limit,
      offset,
      tagsToSearch,
      direction
    )

    let response: ENSFollowerResponse[] = followers

    if (include?.includes('ens')) {
      const ensService = services.ens(env(context))
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
