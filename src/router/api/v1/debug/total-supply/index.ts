import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { Environment } from '#/types'

export function totalSupply(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/total-supply', async context => {
    const totalSupply = await services.efp(env(context)).getDebugTotalSupply()

    return context.json({ total_supply: totalSupply }, 200)
  })
}
