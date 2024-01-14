import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { Environment } from '#/types'

export function numListOps(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/num-list-ops', async context => {
    const numListOps = await services.efp(env(context)).getDebugNumListOps()

    return context.json({ num_list_ops: numListOps }, 200)
  })
}
