import { Hono } from 'hono'
import { validator } from 'hono/validator'

import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { IENSMetadataService } from '#/service/ens-metadata/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Address, Environment } from '#/types'
import { ensureArray } from '#/utilities.ts'

async function getPrimaryList(
  ens: IENSMetadataService,
  efp: IEFPIndexerService,
  ensOrAddress: string
): Promise<bigint | undefined> {
  const address: Address = await ens.getAddress(ensOrAddress)
  const primaryList: bigint | undefined = await efp.getPrimaryList(address)
  return primaryList
}

function label(
  listRecords: {
    version: number
    recordType: number
    data: `0x${string}`
  }[]
): {
  version: number
  record_type: string
  data: `0x${string}`
}[] {
  return listRecords.map(({ version, recordType, data }) => ({
    version,
    record_type: recordType === 1 ? 'address' : `${recordType}`,
    data
  }))
}

function labelWithTags(
  listRecords: {
    version: number
    recordType: number
    data: `0x${string}`
    tags: string[]
  }[]
): {
  version: number
  record_type: string
  data: `0x${string}`
  tags: string[]
}[] {
  return listRecords.map(({ version, recordType, data, tags }) => ({
    version,
    record_type: recordType === 1 ? 'address' : `${recordType}`,
    data,
    tags
  }))
}

export function users(services: Services): Hono<{ Bindings: Environment }> {
  const users = new Hono<{ Bindings: Environment }>()

  // Blocked by user
  // biome-ignore lint/nursery/useAwait: <explanation>
  users.get('/:ensOrAddress/blocks', async context => {
    return context.text('Not implemented', 501)
  })

  // ENS profile metadata
  users.get('/:ensOrAddress/ens', async context => {
    const { ensOrAddress } = context.req.param()
    console.log(JSON.stringify(ensOrAddress, undefined, 2))

    const ensProfile: ENSProfile = await services.ens().getENSProfile(ensOrAddress)
    return context.json({ ens: ensProfile }, 200)
  })

  /**
   * /dr3a.eth/profile
   *
   * no query parameters -> return all data
   * query parameters -> return only data requested:
   *  - /dr3a.eth/profile?include=ens&include=primary-list&include=following-list&include=followers-list
   */
  users.get(
    '/:ensOrAddress/profile',
    validator('query', (value, context) => {
      const allFilters = ['ens', 'primary-list', 'following-list', 'followers-list']
      // if only one include query param, type is string, if 2+ then type is array, if none then undefined
      const { include } = <Record<'include', Array<string> | string | undefined>>value
      // if no include query param, return all data
      if (!include) return { include: allFilters }
      // if include query param is an array, ensure all values are valid
      if (ensureArray(include).every(filter => allFilters.includes(filter))) return { include }
      return new Response(
        JSON.stringify({
          message: 'Accepted format: ?include=ens&include=primary-list&include=following-list&include=followers-list'
        }),
        { status: 400 }
      )
    }),
    async context => {
      const { ensOrAddress } = context.req.param()
      const { include } = context.req.valid('query')

      const { address, ...ens }: ENSProfile = await services.ens().getENSProfile(ensOrAddress)
      const efp: IEFPIndexerService = services.efp(context.env)
      const [followers, following, primaryList] = await Promise.all([
        include.includes('followers-list') ? efp.getFollowers(address) : null,
        /**
         * TODO: need to implement getFollowing in EFPIndexerService. `null` placeholder for now.
         */
        include.includes('following-list') ? null : null,
        include.includes('primary-list') ? getPrimaryList(services.ens(), efp, address) : undefined
      ])

      const listRecords: {
        version: number
        recordType: number
        data: `0x${string}`
      }[] = primaryList === undefined ? [] : await efp.getListRecords(primaryList)

      const listRecordsLabeled: {
        version: number
        record_type: string
        data: `0x${string}`
      }[] = label(listRecords)
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

  // Followers list
  users.get('/:ensOrAddress/followers', async context => {
    const { ensOrAddress } = context.req.param()

    const address: Address = await services.ens().getAddress(ensOrAddress)
    const followers: `0x${string}`[] = await services.efp(context.env).getFollowers(address)
    return context.json({ followers }, 200)
  })

  // Following list
  // TODO: - "tags" query param to filter
  users.get('/:ensOrAddress/following', async context => {
    const { ensOrAddress } = context.req.param()

    const efp: IEFPIndexerService = services.efp(context.env)
    const primaryList: bigint | undefined = await getPrimaryList(services.ens(), efp, ensOrAddress)
    if (primaryList === undefined) {
      return context.json([], 200)
    }

    const listRecords: {
      version: number
      recordType: number
      data: `0x${string}`
    }[] = await efp.getListRecords(primaryList)
    const listRecordsLabeled: {
      version: number
      record_type: string
      data: `0x${string}`
    }[] = label(listRecords)
    return context.json({ following: listRecordsLabeled }, 200)
  })

  // Following list with tags included in response json
  users.get('/:ensOrAddress/following/tags', async context => {
    const { ensOrAddress } = context.req.param()

    const efp: IEFPIndexerService = services.efp(context.env)
    console.log(context.req.param())
    const primaryList: bigint | undefined = await getPrimaryList(services.ens(), efp, ensOrAddress)
    if (primaryList === undefined) {
      return context.json([], 200)
    }

    const listRecords: {
      version: number
      recordType: number
      data: `0x${string}`
      tags: string[]
    }[] = await efp.getListRecordsWithTags(primaryList)
    const listRecordsLabeled: {
      version: number
      record_type: string
      data: `0x${string}`
      tags: string[]
    }[] = labelWithTags(listRecords)
    return context.json({ following: listRecordsLabeled }, 200)
  })

  // Primary list
  users.get('/:ensOrAddress/primary-list', async context => {
    const { ensOrAddress } = context.req.param()

    const primaryList: bigint | undefined = await getPrimaryList(
      services.ens(),
      services.efp(context.env),
      ensOrAddress
    )
    return context.json(
      {
        primary_list: primaryList !== undefined ? primaryList.toString() : null
      },
      200
    )
  })

  // Muted by user
  // biome-ignore lint/nursery/useAwait: <explanation>
  users.get('/:ensOrAddress/mutes', async context => {
    return context.text('Not implemented', 501)
  })

  // Mutuals with users
  // biome-ignore lint/nursery/useAwait: <explanation>
  users.get('/:ensOrAddress/mutuals', async context => {
    return context.text('Not implemented', 501)
  })

  // Incoming/Outgoing tagged relationships
  // biome-ignore lint/nursery/useAwait: <explanation>
  users.get('/:ensOrAddress/relationships', async context => {
    return context.text('Not implemented', 501)
  })

  // Stats
  users.get('/:ensOrAddress/stats', async context => {
    const { ensOrAddress } = context.req.param()

    const ens: IENSMetadataService = services.ens()
    const efp: IEFPIndexerService = services.efp(context.env)
    const address: Address = await ens.getAddress(ensOrAddress)
    const followersCount: number = await efp.getFollowersCount(address)
    const stats = {
      followers_count: followersCount,
      following_count: 0
    }

    const primaryList: bigint | undefined = await getPrimaryList(
      services.ens(),
      services.efp(context.env),
      ensOrAddress
    )
    if (primaryList === undefined) {
      return context.json(stats, 200)
    }

    stats.following_count = await efp.getListRecordCount(primaryList)
    return context.json(stats, 200)
  })

  users.get('/top-followed', async context => {
    const limit = context.req.query('limit') ? parseInt(context.req.query('limit') as string, 10) : 10
    const mostFollowers: { address: string; followers_count: number }[] = await services
      .efp(context.env)
      .getLeaderboardFollowers(limit)
    return context.json(mostFollowers, 200)
  })

  users.get('/top-following', async context => {
    const limit = context.req.query('limit') ? parseInt(context.req.query('limit') as string, 10) : 10
    const mostFollowing: { address: string; following_count: number }[] = await services
      .efp(context.env)
      .getLeaderboardFollowing(limit)
    return context.json(mostFollowing, 200)
  })

  return users
}
