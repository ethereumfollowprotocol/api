import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { validator } from 'hono/validator'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Environment } from '#/types'
import { ensureArray } from '#/utilities'

export function profile(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get(
    '/:ensOrAddress/profile',
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
      const { ensOrAddress } = context.req.param()
      const { include } = context.req.valid('query')

      const { address, ...ens }: ENSProfile = await services.ens().getENSProfile(ensOrAddress)
      const efp: IEFPIndexerService = services.efp(env(context))
      const [followers, following, primaryList] = await Promise.all([
        include.includes('followers') ? efp.getFollowers(address) : null,
        include.includes('following') ? efp.getFollowing(address) : null,
        include.includes('primary-list') ? efp.getPrimaryList(address) : undefined
      ])

      const listRecordsLabeled: {
        version: number
        record_type: string
        data: `0x${string}`
      }[] = (following !== null ? following : []).map(({ version, recordType, data, tags }) => ({
        version,
        record_type: recordType === 1 ? 'address' : `${recordType}`,
        data: `0x${Buffer.from(data).toString('hex')}` as `0x${string}`,
        tags
      }))
      return context.json(
        {
          address,
          ens,
          primary_list: primaryList !== undefined ? primaryList.toString() : null,
          following: listRecordsLabeled,
          followers
        },
        200
      )
    }
  )
}
