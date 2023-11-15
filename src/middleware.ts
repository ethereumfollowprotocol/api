import type { Hono } from 'hono'
import { cors } from 'hono/cors'
import { cache } from 'hono/cache'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { cacheHeader } from 'pretty-cache-header'
import { secureHeaders } from 'hono/secure-headers'
import { HTTPException } from 'hono/http-exception'

import { apiLogger } from '#/logger.ts'
import type { Environment } from '#/types'
import { parseBaseURL } from '#/utilities.ts'

/** middlewares */
export function middlewares(app: Hono<{ Bindings: Environment }>) {
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
    apiLogger.error(`[notFound: ${context.req.url}]: not found`)
    const routesUrl = `${parseBaseURL(context.req.url)}/v1/routes`
    return context.json(
      { error: `${context.req.url} not found. Visit ${routesUrl} to see available routes` },
      404
    )
  })

  app.onError((error, context) => {
    apiLogger.error(`[onError: ${context.req.url}]: ${error}`, context.error)

    if (error instanceof HTTPException) return error.getResponse()
    return context.json({ message: error.message }, 500)
  })
}
