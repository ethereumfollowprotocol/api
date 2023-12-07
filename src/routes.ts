import { Hono } from 'hono'

import { DOCS_URL } from '#/constant.ts'
import { database } from '#/database.ts'
import { apiLogger } from '#/logger.ts'
import type { Environment } from '#/types'
import { ENSMetadataService } from './service/ens-metadata/service'

export const api = new Hono<{ Bindings: Environment }>().basePath('/v1')

const ensMetadataService = new ENSMetadataService()

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
    return context.json(await ensMetadataService.getENSProfile(id), 200)
  } catch (error) {
    apiLogger.error(`error while fetching ENS profile: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while fetching ENS profile', 500)
  }
})

api.get('/health', context => context.text('ok'))

api.get('/docs', context => {
  return context.redirect('https://docs.ethfollow.xyz/api', 301)
})
