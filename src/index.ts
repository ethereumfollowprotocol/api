import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'

import { env } from 'hono/adapter'
import { DOCS_URL, SOURCE_CODE_URL } from '#/constant.ts'
import { demoRouter } from '#/demo'
import { apiLogger } from '#/logger.ts'
import { api } from '#/router/api/v1'
import { errorHandler, errorLogger } from '#/router/middleware'
import { MockEFPIndexerService } from '#/service/efp-indexer/mock/service'
import { EFPIndexerService } from '#/service/efp-indexer/service'
import { ENSMetadataService } from '#/service/ens-metadata/service'
import type { Environment } from '#/types'
import type { Services } from './service'

const app = new Hono<{ Bindings: Environment }>()

app.use('*', async (context, next) => {
  const { COMMIT_SHA } = env(context)
  context.res.headers.set('X-Commit-SHA', COMMIT_SHA)
  const start = Date.now()
  await next()
  const end = Date.now()
  context.res.headers.set('X-Response-Time', `${end - start}ms`)
})

app.use('*', logger())

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

app.get('/build-version', context => context.text(env(context).COMMIT_SHA))

app.get('/v1', context =>
  context.json({
    sha: env(context).COMMIT_SHA,
    name: 'efp-public-api',
    version: 'v1',
    docs: DOCS_URL,
    source: SOURCE_CODE_URL
  })
)

/** Logs all registered routes to the console. */
app.get('/routes', async context => {
  const verbose = context.req.query('verbose')
  const { ENVIRONMENT } = env(context)
  if (ENVIRONMENT === 'development') {
    const { showRoutes } = await import('hono/dev')
    showRoutes(app, { verbose: verbose === 'true' || verbose === '1' })
    return new Response(JSON.stringify([...new Set(app.routes.map(({ path }) => path))], null, 2))
  }
  return new Response(null, { status: 418 })
})

const services: Services = {
  ens: () => new ENSMetadataService(),
  efp: (env: Environment) => (env.IS_DEMO === 'true' ? new MockEFPIndexerService() : new EFPIndexerService(env))
}
app.route('/', api(services))

/** DEMO START */
app.route('/', demoRouter)
/** DEMO END */

// Error handling middleware should be at the end
app.use('*', errorLogger)
app.use('*', errorHandler)

const PORT = 8_787

apiLogger.box(`🚀 API running on http://localhost:${PORT}`)

export default {
  port: PORT,
  fetch: app.fetch
}
