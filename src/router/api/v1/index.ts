import { Hono } from 'hono'

import { env } from 'hono/adapter'
// api/v1/index.ts
import { database } from '#/database'
import { apiLogger } from '#/logger'
import type { Services } from '#/service'
import type { Environment } from '#/types'
import { debug } from './debug'
import { leaderboard } from './leaderboard'
import { lists } from './lists'
import { users } from './users'

export function api(services: Services): Hono<{ Bindings: Environment }> {
  const api = new Hono<{ Bindings: Environment }>().basePath('/api/v1')

  api.get('/docs', context => context.redirect('https://docs.ethfollow.xyz/api', 301))

  api.get('/database/health', async context => {
    const db = database(env(context))

    // do a simple query to check if the database is up
    try {
      await db.selectFrom('events').select('event_name').limit(1).execute()
    } catch (error) {
      apiLogger.error(`error while checking postgres health: ${JSON.stringify(error, undefined, 2)}`)
      return context.text('error while checking postgres health', 500)
    }
    // database is up
    return context.text('ok', 200)
  })

  api.get('/health', context => context.text('ok'))

  api.route('/debug', debug(services))
  api.route('/leaderboard', leaderboard(services))
  api.route('/lists', lists(services))
  api.route('/users', users(services))

  return api
}
