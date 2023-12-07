import { Hono } from 'hono'

import { DOCS_URL } from '#/constant.ts'
import { database } from '#/database.ts'
import { apiLogger } from '#/logger.ts'
import type { Environment } from '#/types'

export const api = new Hono<{ Bindings: Environment }>().basePath('/v1')

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
 * Fetch from ENS worker
 */
api.get('/ens/:type/:id', async context => {
  const { type, id } = context.req.param()
  const ensWorkerResponse = await fetch(`https://ens.ethfollow.xyz/${type}/${id}`)
  if (!ensWorkerResponse.ok) {
    return context.json({ error: await ensWorkerResponse.text() }, 500)
  }
  const ensProfileData = await ensWorkerResponse.json()
  return context.json(ensProfileData, 200)
})

api.get('/health', context => context.text('ok'))

api.get('/docs', context => {
  return context.redirect('https://docs.ethfollow.xyz/api', 301)
})
