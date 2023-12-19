import { Hono } from 'hono'
import type { Address } from 'viem'

import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { IENSMetadataService } from '#/service/ens-metadata/service'
import type { ENSProfile } from '#/service/ens-metadata/types'
import type { Environment } from '#/types'

async function getPrimaryList(
  ens: IENSMetadataService,
  efp: IEFPIndexerService,
  ensOrAddress: string
): Promise<number | undefined> {
  const address: Address = await ens.getAddress(ensOrAddress)
  const primaryList: number | undefined = await efp.getPrimaryList(address)
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

    const ensProfile: ENSProfile = await services.ens().getENSProfile(ensOrAddress)
    return context.json({ ens: ensProfile }, 200)
  })

  // Followers list
  users.get('/:ensOrAddress/followers', async context => {
    const { ensOrAddress } = context.req.param()

    const address: Address = await services.ens().getAddress(ensOrAddress)
    const followers: {
      token_id: number
      list_user: string
    }[] = await services.efp(context.env).getFollowers(address)
    return context.json(
      {
        followers
      },
      200
    )
  })

  // Following list
  // TODO: - "tags" query param to filter
  users.get('/:ensOrAddress/following', async context => {
    const { ensOrAddress } = context.req.param()

    const efp: IEFPIndexerService = services.efp(context.env)
    const primaryList: number | undefined = await getPrimaryList(
      services.ens(),
      services.efp(context.env),
      ensOrAddress
    )
    if (primaryList === undefined) {
      return context.json([], 200)
    }

    const listRecords: {
      version: number
      recordType: number
      data: `0x${string}`
    }[] = await efp.getListRecords(BigInt(primaryList))
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
    const primaryList: number | undefined = await getPrimaryList(
      services.ens(),
      services.efp(context.env),
      ensOrAddress
    )
    if (primaryList === undefined) {
      return context.json([], 200)
    }
    const listRecords: {
      version: number
      recordType: number
      data: `0x${string}`
      tags: string[]
    }[] = await efp.getListRecordsWithTags(BigInt(primaryList))
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

    const primaryList: number | undefined = await getPrimaryList(
      services.ens(),
      services.efp(context.env),
      ensOrAddress
    )
    return context.json(
      {
        primary_list: primaryList ?? null
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

    const primaryList: number | undefined = await getPrimaryList(
      services.ens(),
      services.efp(context.env),
      ensOrAddress
    )
    if (primaryList === undefined) {
      return context.json(stats, 200)
    }

    stats.following_count = await efp.getListRecordCount(BigInt(primaryList))
    return context.json(stats, 200)
  })

  return users
}
