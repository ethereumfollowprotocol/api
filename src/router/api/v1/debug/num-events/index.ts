import type { Services } from '#/service'
import type { Environment } from '#/types'
import type { Hono } from 'hono'
import { env } from 'hono/adapter'

export function numEvents(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/num-events', async context => {
    const numEvents = await services.efp(env(context)).getDebugNumEvents()

    return context.json({ num_events: numEvents }, 200)
  })
}
