import type { Services } from '#/service'
import type { Environment } from '#/types'
import type { Hono, MiddlewareHandler } from 'hono'

export function muted(
  leaderboard: Hono<{ Bindings: Environment }>,
  services: Services,
  limitValidator: MiddlewareHandler<
    any,
    string,
    {
      in: {
        query: Record<string, string | string[]>
      }
      out: {
        query: Record<string, string | string[]>
      }
    }
  >,
  includeValidator: MiddlewareHandler<
    any,
    string,
    {
      in: {
        query: {
          include: string | string[]
        }
      }
      out: {
        query: {
          include: string | string[]
        }
      }
    }
  >
) {
  /**
   * Same as /followers, but for primary list.
   */
  leaderboard.get('/muted/:ensOrAddress?', limitValidator, includeValidator, context => {
    return context.text('Not implemented', 501)
  })
}
