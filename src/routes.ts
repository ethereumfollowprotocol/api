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

async function inputToTokenId(
  context: Context<{
    Bindings: Environment
  }>,
  id: string
): Promise<bigint | undefined> {
  let tokenId: bigint | undefined
  if (id.startsWith('0x') || id.endsWith('.eth')) {
    const address: Address = await ensMetadataService().getAddress(id)
    const primaryList: string | undefined = await efpIndexerService(context).getPrimaryList(address)
    if (!primaryList) {
      // user doesn't have a primary list
      return undefined
    }
    // convert to bigint
    const asBytes: Buffer = Buffer.from(primaryList.slice(2), 'hex')
    // 32-byte
    tokenId = asBytes.reduce((acc, cur) => acc * 256n + BigInt(cur), 0n)
  } else {
    // id is a token id
    tokenId = BigInt(id)
  }

  return tokenId
}

/**
 * Home Endpoint
 * Purpose: Provides information about the API's documentation location.
 * Request Parameters: None.
 * Response: Plain text message with the URL of the documentation.
 */
api.get('/', context => context.text(`Visit ${DOCS_URL} for documentation`))

/**
 * Documentation Redirect
 * Purpose: Redirects to the external API documentation page.
 * Request Parameters: None.
 * Response: HTTP 301 redirect to the external documentation URL.
 */
api.get('/docs', context => context.redirect('https://docs.ethfollow.xyz/api', 301))

/**
 * Database Health Check
 * Purpose: Checks the health of the database by performing a simple query.
 * Request Parameters: None.
 * Response: Text response indicating the health status of the database.
 * Error Handling: Returns an error message and a 500 status code if the database check fails.
 */
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
 * API Health Check
 * Purpose: Provides a simple health check for the API.
 * Request Parameters: None.
 * Response: Plain text response "ok".
 */
api.get('/health', context => context.text('ok'))

/**
 * Fetch ENS Metadata
 * Purpose: Retrieves ENS (Ethereum Name Service) profile information based on the given identifier.
 * Request Parameters: `id` - The identifier for the ENS profile.
 * Response: JSON object containing ENS profile information.
 * Error Handling: Returns an error message and a 500 status code in case of failure.
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

/**
 * Fetch Primary List from EFP
 * Purpose: Retrieves the primary list associated with a given ID from the EFP indexer service.
 * Request Parameters: `id` - The identifier to query the primary list.
 * Response: JSON object containing the primary list information.
 * Error Handling: Returns an error message and a 500 status code if fetching fails.
 */
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

/**
 * Get Followers Count
 * Purpose: Retrieves the count of followers for a given address.
 * Request Parameters: `id` - The identifier (address) to query the followers count.
 * Response: JSON object containing the number of followers.
 * Error Handling: Returns an error message and a 500 status code in case of failure.
 */
api.get('/efp/followersCount/:id', async context => {
  const { id } = context.req.param()

  try {
    const address: Address = await ensMetadataService().getAddress(id)
    const followersCount: number = await efpIndexerService(context).getFollowerCount(address)
    return context.json(followersCount, 200)
  } catch (error) {
    apiLogger.error(`error while fetching follower count: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching follower count', 500)
  }
})

/**
 * Fetch Followers
 * Purpose: Retrieves a list of followers for a given address.
 * Request Parameters: `id` - The identifier (address) to query the list of followers.
 * Response: JSON array containing follower details.
 * Error Handling: Returns an error message and a 500 status code if fetching fails.
 */
api.get('/efp/followers/:id', async context => {
  const { id } = context.req.param()

  try {
    const address: Address = await ensMetadataService().getAddress(id)
    const followers = await efpIndexerService(context).getFollowers(address)
    return context.json(followers, 200)
  } catch (error) {
    apiLogger.error(`error while fetching followers: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching followers', 500)
  }
})

/**
 * Fetch Following
 * Purpose: Retrieves a list of list records that a given ID is following.
 * Request Parameters: `id` - The identifier to query the following list.
 * Response: JSON array containing the list of followed list records.
 * Error Handling: Returns an error message and a 500 status code in case of failure.
 */
api.get('/efp/following/:id', async context => {
  const { id } = context.req.param()

  try {
    const tokenId: bigint | undefined = await inputToTokenId(context, id)
    if (tokenId === undefined) {
      return context.json([], 200)
    }

    const listRecords: {
      version: number
      recordType: number
      data: `0x${string}`
    }[] = await efpIndexerService(context).getListRecords(tokenId as bigint)
    return context.json(listRecords, 200)
  } catch (error) {
    apiLogger.error(`2 error while fetching following: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('3 error while fetching following', 500)
  }
})

/**
 * Fetch Following by Tag
 * Purpose: Retrieves a list of list records that a given ID is following, filtered by a specified tag.
 * Request Parameters:
 *  - `id` - The identifier to query the following list.
 *  - `tag` - The tag to filter the list.
 * Response: JSON array containing the filtered list of followed list records.
 * Error Handling: Returns an error message and a 500 status code if fetching fails.
 */
api.get('/efp/following/:id/:tag', async context => {
  const { id, tag } = context.req.param()

  try {
    const tokenId: bigint | undefined = await inputToTokenId(context, id)
    if (tokenId === undefined) {
      return context.text('error while fetching following count', 500)
    }
    const taggedListRecords: any[] = await efpIndexerService(context).getListRecordsFilterByTags(tokenId as bigint, tag)
    return context.json(taggedListRecords, 200)
  } catch (error) {
    apiLogger.error(`error while fetching blocked by: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching blocked by', 500)
  }
})

/**
 * Get Following Count
 * Purpose: Retrieves the count of list records a given ID is following.
 * Request Parameters: `id` - The identifier to query the following count.
 * Response: A number representing the count of followed list records.
 * Error Handling: Returns an error message and a 500 status code if fetching fails.
 */
api.get('/efp/followingCount/:id', async context => {
  const { id } = context.req.param()

  try {
    const tokenId: bigint | undefined = await inputToTokenId(context, id)
    if (tokenId === undefined) {
      return context.json(0, 200)
    }

    const listRecordCount: number = await efpIndexerService(context).getListRecordCount(tokenId as bigint)
    return context.json(listRecordCount, 200)
  } catch (error) {
    apiLogger.error(`error while fetching following count: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching following count', 500)
  }
})

/**
 * Fetch Following with Tags
 * Purpose: Retrieves a list of list records that a given ID is following, along with the tags associated with each followed list record.
 * Request Parameters: `id` - The identifier to query the following list with tags.
 * Response: JSON array containing the list of followed list records and their associated tags.
 * Error Handling: Returns an error message and a 500 status code if fetching fails.
 */
api.get('efp/followingWithTags/:id', async context => {
  const { id } = context.req.param()

  try {
    const tokenId: bigint | undefined = await inputToTokenId(context, id)
    if (tokenId === undefined) {
      return context.json([], 200)
    }
    const listRecords: {
      version: number
      recordType: number
      data: `0x${string}`
      tags: string[]
    }[] = await efpIndexerService(context).getListRecordsWithTags(tokenId as bigint)
    return context.json(listRecords, 200)
  } catch (error) {
    apiLogger.error(`error while fetching following with tags: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching following with tags', 500)
  }
})

/**
 * Fetch Stats
 * Purpose: Retrieves statistical data such as the number of followers and following count for a given ID.
 * Request Parameters: `id` - The identifier to query statistical data.
 * Response: JSON object containing statistical data like followers and following count.
 * Error Handling: Returns an error message and a 500 status code if fetching fails.
 */
api.get('/efp/stats/:id', async context => {
  const { id } = context.req.param()

  try {
    const address: Address = await ensMetadataService().getAddress(id)
    const followersCount: number = await efpIndexerService(context).getFollowerCount(address)
    const stats = {
      followersCount,
      followingCount: 0
    }

    const tokenId: bigint | undefined = await inputToTokenId(context, id)
    if (tokenId === undefined) {
      return context.json(stats, 200)
    }

    const listRecordCount: number = await efpIndexerService(context).getListRecordCount(tokenId as bigint)
    stats.followingCount = listRecordCount
    return context.json(stats, 200)
  } catch (error) {
    apiLogger.error(`error while fetching stats: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching stats', 500)
  }
})

/**
 * Who Blocks
 * Purpose: Retrieves a list of accounts that have blocked the given ID.
 * Request Parameters: `id` - The identifier to query the list of accounts that have blocked it.
 * Response: JSON array containing the details of accounts that have blocked the given ID.
 * Error Handling: Returns an error message and a 500 status code if fetching fails.
 */
api.get('/efp/whoblocks/:id', async context => {
  const { id } = context.req.param()

  try {
    const address: Address = await ensMetadataService().getAddress(id)
    const blockedBy: any[] = await efpIndexerService(context).getWhoBlocks(address)
    return context.json(blockedBy, 200)
  } catch (error) {
    apiLogger.error(`error while fetching blocked by: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching blocked by', 500)
  }
})

/**
 * Who Mutes
 * Purpose: Retrieves a list of accounts that have muted the given ID.
 * Request Parameters: `id` - The identifier to query the list of accounts that have muted it.
 * Response: JSON array containing the details of accounts that have muted the given ID.
 * Error Handling: Returns an error message and a 500 status code if fetching fails.
 */
api.get('/efp/whomutes/:id', async context => {
  const { id } = context.req.param()

  try {
    const address: Address = await ensMetadataService().getAddress(id)
    const mutedBy: any[] = await efpIndexerService(context).getWhoMutes(address)
    return context.json(mutedBy, 200)
  } catch (error) {
    apiLogger.error(`error while fetching muted by: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching muted by', 500)
  }
})
