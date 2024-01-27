import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { validator } from 'hono/validator'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Environment } from '#/types'
import { ensureArray } from '#/utilities'

/**
 * TODO: Add ens support for following list
 */
export function profile(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get(
    '/:addressOrENS/profile',
    validator('query', value => {
      const allFilters = ['ens', 'primary-list', 'following', 'followers']
      // if only one include query param, type is string, if 2+ then type is array, if none then undefined
      const { include } = <Record<'include', string[] | string | undefined>>value
      // if no include query param, return all data
      if (!include) return { include: allFilters }
      // if include query param is an array, ensure all values are valid
      if (ensureArray(include).every(filter => allFilters.includes(filter))) return { include }
      return new Response(
        JSON.stringify({
          message: 'Accepted format: ?include=ens&include=primary-list&include=following&include=followers'
        }),
        { status: 400 }
      )
    }),
    async context => {
      const { addressOrENS } = context.req.param()

      const { include } = context.req.valid('query')
      const ensService = services.ens()

      const { address, ...ens }: ENSProfile = await ensService.getENSProfile(addressOrENS)
      const efp: IEFPIndexerService = services.efp(env(context))
      const [followers, following, primaryList] = await Promise.all([
        include.includes('followers') ? efp.getUserFollowers(address) : null,
        include.includes('following') ? efp.getUserFollowing(address) : null,
        include.includes('primary-list') ? efp.getUserPrimaryList(address) : undefined
      ])

      console.log('following', following)
      const followingENS =
        following !== null
          ? await ensService.batchGetENSProfiles(following.map(follow => `0x${follow.data.toString('hex')}`))
          : null

      const followingWithENS =
        following !== null
          ? following.map((follow, index) => ({ ...follow, ens: followingENS !== null ? followingENS[index] : null }))
          : null

      const followersENS =
        followers !== null ? await ensService.batchGetENSProfiles(followers.map(follower => follower.address)) : null

      const followersWithENS =
        followers !== null
          ? followers.map((follower, index) => ({
              ...follower,
              ens: followersENS !== null ? followersENS[index] : null
            }))
          : null

      const listRecordsLabeled: {
        version: number
        record_type: string
        data: `0x${string}`
      }[] = (followingWithENS !== null ? followingWithENS : []).map(({ version, recordType, data, tags, ens }) => ({
        version,
        record_type: recordType === 1 ? 'address' : `${recordType}`,
        data: `0x${data.toString('hex')}` as `0x${string}`,
        tags,
        ens
      }))
      return context.json(
        {
          address,
          ens,
          primary_list: primaryList !== undefined ? primaryList.toString() : null,
          following: listRecordsLabeled,
          followers: followersWithENS
        },
        200
      )
    }
  )
}
