import { Hono } from 'hono'

import { api } from '#/routes.ts'
import { apiLogger } from '#/logger.ts'
import { runtime } from '#/utilities.ts'
import type { Environment } from '#/types'
import { middlewares } from '#/middleware.ts'

const app = new Hono<{ Bindings: Environment }>()

middlewares(app)

app.get('/', context => context.redirect('/v1'))

app.get('/health', context => context.text('ok'))

app.route('/', api)

const PORT = runtime === 'workerd' ? 8_787 : Bun.env.PORT

apiLogger.box(`🚀 API running on http://localhost:${PORT}`)

export default {
  port: PORT,
  fetch: app.fetch
}
