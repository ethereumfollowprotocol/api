import type { MiddlewareHandler } from 'hono'

import { apiLogger } from '#/logger'

export const errorLogger: MiddlewareHandler = async (_c, next) => {
  try {
    await next()
  } catch (error) {
    apiLogger.error(`Error: ${JSON.stringify(error, undefined, 2)}`)
    throw error // Rethrow the error to be handled by subsequent middleware
  }
}

export const errorHandler: MiddlewareHandler = async (c, next) => {
  try {
    await next()
  } catch (_error) {
    return c.text('Internal server error', 500)
  }
}
