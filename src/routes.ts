import { Hono, type Context } from 'hono'

import { DOCS_URL } from '#/constant.ts'
import { database } from '#/database.ts'
import { apiLogger } from '#/logger.ts'
import { EFPIndexerService } from '#/service/efp-indexer/service'
import { ENSMetadataService } from '#/service/ens-metadata/service'
import type { Environment } from '#/types'
import type { Address } from 'viem'

export const api = new Hono<{ Bindings: Environment }>().basePath('/v1')

const ensMetadataService = () => new ENSMetadataService()
const efpIndexerService = (
  context: Context<{
    Bindings: Environment
  }>
) => new EFPIndexerService(context.env)

api.get('/', context => context.text(`Visit ${DOCS_URL} for documentation`))

// TODO: in progress need to consolidate db interface into service
api.get('/database-health', async context => {
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

/**
 * Fetch from ENS metadata service
 */
api.get('/ens/:id', async context => {
  const { id } = context.req.param()

  try {
    return context.json(await ensMetadataService().getENSProfile(id), 200)
  } catch (error) {
    apiLogger.error(`error while fetching ENS profile: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching ENS profile', 500)
  }
})

api.get('/efp/primaryList/:id', async context => {
  const { id } = context.req.param()

  try {
    const address: Address = await ensMetadataService().getAddress(id)
    const primaryList: string | undefined = await efpIndexerService(context).getPrimaryList(address)
    return context.json(`${primaryList}`, 200)
  } catch (error) {
    apiLogger.error(`error while fetching primary list: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching primary list', 500)
  }
})

api.get('/efp/followingCount/:id', async context => {
  const { id } = context.req.param()

  try {
    // three cases:
    // 1. id is an address
    // 2. id is an ENS name
    // 3. id is a token id

    // we want to determine the token id to query the indexer
    // if token id is provided, use that
    // else if address/ens, then use user's primary list

    let tokenId: bigint | undefined
    if (id.startsWith('0x') || id.endsWith('.eth')) {
      const address: Address = await ensMetadataService().getAddress(id)
      const primaryList: string | undefined = await efpIndexerService(context).getPrimaryList(address)
      if (!primaryList) {
        // user doesn't have a primary list, so return 0?
        // TODO: we could check if the own a list, and if so, return the count of that list
        return context.json(0, 200)
      }
      // convert to bigint
      const asBytes: Buffer = Buffer.from(primaryList.slice(2), 'hex')
      // 32-byte
      tokenId = asBytes.reduce((acc, cur) => acc * 256n + BigInt(cur), 0n)
    } else {
      // id is a token id
      tokenId = BigInt(id)
    }

    if (tokenId === undefined) {
      return context.text('error while fetching following count', 500)
    }

    const followingCount: number = await efpIndexerService(context).getFollowingCount(tokenId as bigint)
    return context.json(followingCount, 200)
  } catch (error) {
    apiLogger.error(`error while fetching following count: $JSON.stringify(error, undefined, 2)`)
    return context.text('error while fetching following count', 500)
  }
})

api.get('/efp/following/:id', async context => {
  const { id } = context.req.param()

  try {
    // three cases:
    // 1. id is an address
    // 2. id is an ENS name
    // 3. id is a token id

    // we want to determine the token id to query the indexer
    // if token id is provided, use that
    // else if address/ens, then use user's primary list

    let tokenId: bigint | undefined
    if (id.startsWith('0x') || id.endsWith('.eth')) {
      const address: Address = await ensMetadataService().getAddress(id)
      const primaryList: string | undefined = await efpIndexerService(context).getPrimaryList(address)
      if (!primaryList) {
        // user doesn't have a primary list, so return 0?
        // TODO: we could check if the own a list, and if so, return the count of that list
        return context.json(0, 200)
      }
      // convert to bigint
      const asBytes: Buffer = Buffer.from(primaryList.slice(2), 'hex')
      // 32-byte
      tokenId = asBytes.reduce((acc, cur) => acc * 256n + BigInt(cur), 0n)
    } else {
      // id is a token id
      tokenId = BigInt(id)
    }

    if (tokenId === undefined) {
      return context.text('error while fetching following count', 500)
    }

    const following: any[] = await efpIndexerService(context).getFollowing(tokenId as bigint)
    return context.json(following, 200)
  } catch (error) {
    apiLogger.error(`error while fetching following: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching following', 500)
  }
})

api.get('/efp/followerCount/:id', async context => {
  const { id } = context.req.param()

  try {
    const address: Address = await ensMetadataService().getAddress(id)
    const followerCount: number = await efpIndexerService(context).getFollowerCount(address)
    return context.json(followerCount, 200)
  } catch (error) {
    apiLogger.error(`error while fetching follower count: $JSON.stringify(error, undefined, 2)`)
    return context.text('error while fetching follower count', 500)
  }
})

api.get('/efp/followers/:id', async context => {
  const { id } = context.req.param()

  try {
    const address: Address = await ensMetadataService().getAddress(id)
    const followers: any[] = await efpIndexerService(context).getFollowers(address)
    return context.json(followers, 200)
  } catch (error) {
    apiLogger.error(`error while fetching followers: $JSON.stringify(error, undefined, 2)`)
    return context.text('error while fetching followers', 500)
  }
})

api.get('/health', context => context.text('ok'))

api.get('/docs', context => context.redirect('https://docs.ethfollow.xyz/api', 301))
