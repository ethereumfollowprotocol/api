import { Hono } from 'hono'

import { cache } from 'hono/cache'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { cacheHeader } from 'pretty-cache-header'

import { DOCS_URL } from '#/constant.ts'
import { apiLogger } from '#/logger.ts'
import { api } from '#/routes.ts'
import type { Environment } from '#/types'

const app = new Hono<{ Bindings: Environment }>()

app.use('*', async (context, next) => {
  await next()
  context.header('X-Powered-By', 'Ethereum Follow Protocol')
})

app.use('*', logger())

/**
 * @link https://hono.dev/middleware/builtin/cache
 * - super heavy caching during demo period since data is dummy atm
 * - cache is disabled in development mode
 */
app.use('*', async (context, next) => {
  const { ENV } = context.env
  await next()
  if (ENV === 'development') return
  cache({
    cacheName: 'efp-api',
    cacheControl: cacheHeader({
      maxAge: '60days',
      sMaxage: '60days',
      staleWhileRevalidate: '7days'
    })
  })
})

app.use('*', cors({ origin: '*', allowMethods: ['GET', 'HEAD', 'OPTIONS'] }))

/* append `?pretty` to any request to get prettified JSON */
app.use('*', prettyJSON({ space: 2 }))

/** @docs https://hono.dev/middleware/builtin/secure-headers */
app.use(
  '*',
  secureHeaders({
    xXssProtection: '1',
    xFrameOptions: 'DENY',
    strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload'
  })
)

app.notFound(context => {
  const errorMessage = `${context.req.url} is not a valid path. Visit ${DOCS_URL} for documentation`
  apiLogger.error(errorMessage)
  return context.json({ error: errorMessage }, 404)
})

app.onError((error, context) => {
  apiLogger.error(`[onError: ${context.req.url}]: ${error}`, context.error)
  if (error instanceof HTTPException) return error.getResponse()
  return context.json({ message: error.message }, 500)
})

app.get('/', context => context.redirect('/v1'))

app.get('/health', context => context.text('ok'))

app.get('/docs', context => context.redirect('https://docs.ethfollow.xyz/api', 301))

/** Logs all registered routes to the console. */
app.get('/routes', async () => {
  const { showRoutes } = await import('hono/dev')
  showRoutes(app, { verbose: false })
  return new Response(null, { status: 418 })
})

app.route('/', api)

const PORT = 8_787

apiLogger.box(`🚀 API running on http://localhost:${PORT}`)

export default {
  port: PORT,
  fetch: app.fetch
}
