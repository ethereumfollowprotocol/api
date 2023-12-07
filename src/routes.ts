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

/**
 * Fetch from ENS metadata service
 */
api.get('/efp/primaryList/:id', async context => {
  const { id } = context.req.param()

  try {
    const address: Address = await ensMetadataService().getAddress(id)
    const primaryList: string | undefined = await efpIndexerService(context).getPrimaryList(address)
    return context.json(`${primaryList}`, 200)
  } catch (error) {
    apiLogger.error(`error while fetching ENS profile: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching ENS profile', 500)
  }
})

api.get('/health', context => context.text('ok'))

api.get('/docs', context => {
  return context.redirect('https://docs.ethfollow.xyz/api', 301)
})
