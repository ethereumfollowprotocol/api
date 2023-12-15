import { type Context, Hono } from 'hono'

import type { Address } from 'viem'
import { DOCS_URL } from '#/constant.ts'
import { database } from '#/database.ts'
import { apiLogger } from '#/logger.ts'
import { EFPIndexerService } from '#/service/efp-indexer/service'
import { ENSMetadataService } from '#/service/ens-metadata/service'
import type { Environment } from '#/types'

export const api = new Hono<{ Bindings: Environment }>().basePath('/api/v1')

const ensMetadataService = () => new ENSMetadataService()
const efpIndexerService = (
  context: Context<{
    Bindings: Environment
  }>
) => new EFPIndexerService(context.env)

async function primaryList(
  context: Context<{
    Bindings: Environment
  }>,
  ensOrAddress: string
): Promise<bigint | undefined> {
  if (!ensOrAddress.startsWith('0x') && !ensOrAddress.endsWith('.eth')) {
    return undefined
  }

  const address: Address = await ensMetadataService().getAddress(ensOrAddress)
  const primaryList: string | undefined = await efpIndexerService(context).getPrimaryList(address)
  if (!primaryList) {
    // address doesn't have a primary list set
    return undefined
  }

  // primaryList should be a 32-byte hex string
  if (!primaryList.startsWith('0x') || primaryList.length !== 66) {
    apiLogger.error(`invalid primary list: ${primaryList} for address: ${address}`)
    return undefined
  }

  // convert to bigint
  const asBytes: Buffer = Buffer.from(primaryList.slice(2), 'hex')
  // convert to bigint
  try {
    return asBytes.reduce((acc, cur) => acc * 256n + BigInt(cur), 0n)
  } catch (error) {
    apiLogger.error(`error while converting primary list: ${primaryList} for address: ${address}`)
    return undefined
  }
}

api.get('/', context => context.text(`Visit ${DOCS_URL} for documentation`))

api.get('/docs', context => context.redirect('https://docs.ethfollow.xyz/api', 301))

api.get('/database/health', async context => {
  const db = database(context.env)

  // do a simple query to check if the database is up
  try {
    await db.selectFrom('contracts').select('name').limit(1).execute()
  } catch (error) {
    apiLogger.error(`error while checking postgres health: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while checking postgres health', 500)
  }
  // database is up
  return context.text('ok', 200)
})

api.get('/health', context => context.text('ok'))

api.get('/users/:ensOrAddress/ens', async context => {
  const { ensOrAddress } = context.req.param()

  try {
    return context.json(await ensMetadataService().getENSProfile(ensOrAddress), 200)
  } catch (error) {
    apiLogger.error(`error while fetching ENS profile: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching ENS profile', 500)
  }
})

api.get('/users/:ensOrAddress/followers', async context => {
  const { ensOrAddress } = context.req.param()

  try {
    const address: Address = await ensMetadataService().getAddress(ensOrAddress)
    const followers: {
      token_id: number
      list_user: string
    }[] = await efpIndexerService(context).getFollowers(address)
    return context.json(followers, 200)
  } catch (error) {
    apiLogger.error(`error while fetching followers: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching followers', 500)
  }
})

api.get('/users/:ensOrAddress/following', async context => {
  const { ensOrAddress } = context.req.param()

  try {
    const primaryListTokenId: bigint | undefined = await primaryList(context, ensOrAddress)
    if (primaryListTokenId === undefined) {
      return context.json([], 200)
    }

    const listRecords: {
      version: number
      recordType: number
      data: `0x${string}`
    }[] = await efpIndexerService(context).getListRecords(primaryListTokenId)
    return context.json(listRecords, 200)
  } catch (error) {
    apiLogger.error(`error while fetching following: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching following', 500)
  }
})

api.get('/users/:ensOrAddress/following/tagged/:tag', async context => {
  const { ensOrAddress, tag } = context.req.param()

  try {
    const primaryListTokenId: bigint | undefined = await primaryList(context, ensOrAddress)
    if (primaryListTokenId === undefined) {
      return context.text('error while fetching following count', 500)
    }
    const taggedListRecords: any[] = await efpIndexerService(context).getListRecordsFilterByTags(
      primaryListTokenId,
      tag
    )
    return context.json(taggedListRecords, 200)
  } catch (error) {
    apiLogger.error(`error while fetching blocked by: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching blocked by', 500)
  }
})

api.get('/users/:ensOrAddress/following/tags', async context => {
  const { ensOrAddress } = context.req.param()

  try {
    const primaryListTokenId: bigint | undefined = await primaryList(context, ensOrAddress)
    if (primaryListTokenId === undefined) {
      return context.json([], 200)
    }
    const listRecords: {
      version: number
      recordType: number
      data: `0x${string}`
      tags: string[]
    }[] = await efpIndexerService(context).getListRecordsWithTags(primaryListTokenId)
    return context.json(listRecords, 200)
  } catch (error) {
    apiLogger.error(`error while fetching following with tags: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching following with tags', 500)
  }
})

api.get('/users/:ensOrAddress/primary-list', async context => {
  const { ensOrAddress } = context.req.param()

  try {
    const address: Address = await ensMetadataService().getAddress(ensOrAddress)
    const primaryListHex: string | undefined = await efpIndexerService(context).getPrimaryList(address)
    if (primaryListHex === undefined) {
      return context.json(undefined, 200)
    }
    const primaryList: number = parseInt(primaryListHex.replace('0x', '') as string, 16)
    return context.json(primaryList, 200)
  } catch (error) {
    apiLogger.error(`error while fetching primary list: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching primary list', 500)
  }
})

api.get('/users/:ensOrAddress/stats', async context => {
  const { ensOrAddress } = context.req.param()

  try {
    const address: Address = await ensMetadataService().getAddress(ensOrAddress)
    const followersCount: number = await efpIndexerService(context).getFollowersCount(address)
    const stats = {
      followersCount,
      followingCount: 0
    }

    const primaryListTokenId: bigint | undefined = await primaryList(context, address)
    if (primaryListTokenId === undefined) {
      return context.json(stats, 200)
    }

    stats.followingCount = await efpIndexerService(context).getListRecordCount(primaryListTokenId)
    return context.json(stats, 200)
  } catch (error) {
    apiLogger.error(`error while fetching stats: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching stats', 500)
  }
})

api.get('/users/:ensOrAddress/whoblocks', async context => {
  const { ensOrAddress } = context.req.param()

  try {
    const address: Address = await ensMetadataService().getAddress(ensOrAddress)
    const blockedBy: {
      token_id: number
      list_user: string
    }[] = await efpIndexerService(context).getWhoBlocks(address)
    return context.json(blockedBy, 200)
  } catch (error) {
    apiLogger.error(`error while fetching blocked by: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching blocked by', 500)
  }
})

api.get('/users/:ensOrAddress/whomutes', async context => {
  const { ensOrAddress } = context.req.param()

  try {
    const address: Address = await ensMetadataService().getAddress(ensOrAddress)
    const mutedBy: {
      token_id: number
      list_user: string
    }[] = await efpIndexerService(context).getWhoMutes(address)
    return context.json(mutedBy, 200)
  } catch (error) {
    apiLogger.error(`error while fetching muted by: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching muted by', 500)
  }
})
