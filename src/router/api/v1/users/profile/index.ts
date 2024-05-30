import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { validator } from 'hono/validator'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfileResponse } from '#/service/ens-metadata/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Address, Environment } from '#/types'
import { hexlify, prettifyListRecord } from '#/types/list-record'
import { ensureArray } from '#/utilities'
import type { ENSFollowerResponse } from '../followers'
import type { ENSFollowingResponse } from '../following'

export function profile(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get(
    '/:addressOrENS/profile',
    validator('query', value => {
      const allFilters = ['ens', 'primary-list', 'following', 'followers', 'stats']
      // if only one include query param, type is string, if 2+ then type is array, if none then undefined
      const { include } = <Record<'include', string[] | string | undefined>>value
      // if no include query param, return all data
      if (!include) return { include: allFilters }
      // if "include=ens" is the only query param, then also return all data
      if (include === 'ens') return { include: allFilters }
      // if include query param is an array, ensure all values are valid
      if (ensureArray(include).every(filter => allFilters.includes(filter))) return { include }
      return new Response(
        JSON.stringify({
          message: 'Accepted format: ?include=ens&include=primary-list&include=following&include=followers'
        }),
        { status: 400 }
      )
    }),
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
    async context => {
      const { addressOrENS } = context.req.param()

      const { include } = context.req.valid('query')
      const ensService = services.ens(env(context))

      const { address, ...ens }: ENSProfile = await ensService.getENSProfile(addressOrENS)
      const efp: IEFPIndexerService = services.efp(env(context))
      const [followers, following, primaryList] = await Promise.all([
        include.includes('followers') || include.includes('stats') ? efp.getUserFollowers(address) : undefined,
        include.includes('following') || include.includes('stats') ? efp.getUserFollowing(address) : undefined,
        include.includes('primary-list') ? efp.getUserPrimaryList(address) : undefined
      ])

      const stats = {
        followers_count: followers !== undefined ? followers.length : 0,
        following_count: following !== undefined ? following.length : 0
      }

      // prettify list records
      const followingReponse: ENSFollowingResponse[] | undefined = following?.map(prettifyListRecord)
      let followersResponse: ENSFollowerResponse[] | undefined = followers

      if (include.includes('ens')) {
        // collect address for followers and following so we can batch fetch ENS profiles
        const addressesToFetchENS: Address[] = [
          ...(followers?.map(follower => follower.address) ?? []),
          ...(following?.filter(follow => follow.recordType === 1).map(follow => hexlify(follow.data)) ?? [])
        ]

        const ensProfiles: ENSProfileResponse[] = await ensService.batchGetENSProfiles(addressesToFetchENS)
        const ensProfilesByAddress: Map<Address, ENSProfileResponse> = new Map(
          addressesToFetchENS.map((address, index) => {
            if (!ensProfiles[index]?.name) {
              return [address, { name: '', address: address, avatar: '' } as ENSProfileResponse]
            }
            return [address, ensProfiles[index] as ENSProfileResponse]
          })
        )

        // attach ENS profiles to followers
        followersResponse = followersResponse?.map(
          follower =>
            ({
              ...follower,
              ens: ensProfilesByAddress.get(follower.address) as ENSProfileResponse
            }) as ENSFollowerResponse
        )
        if (followingReponse) {
          for (const record of followingReponse) {
            if (record.record_type === 'address') {
              record.ens = ensProfilesByAddress.get(record.data) as ENSProfileResponse
            }
          }
        }
      }

      let response = { address } as Record<string, unknown>

      if (include.includes('ens')) {
        response = { ...response, ens }
      }
      if (include.includes('followers')) {
        response = { ...response, followers: followersResponse }
      }
      if (include.includes('following')) {
        response = { ...response, following: followingReponse }
      }
      if (include.includes('primary-list')) {
        response = { ...response, primary_list: primaryList?.toString() ?? null }
      }
      if (include.includes('stats')) {
        response = { ...response, stats }
      }
      return context.json(response, 200)
    }
  )
}
