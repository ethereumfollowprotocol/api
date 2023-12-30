import type { Services } from '#/service'
import type { Environment } from '#/types'
import type { Hono, MiddlewareHandler } from 'hono'
import { env } from 'hono/adapter'

export function blocked(
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
   * Same as /followers, but for blocked.
   */
  leaderboard.get('/blocked/:ensOrAddress?', limitValidator, includeValidator, async context => {
    console.log('CALLED/ blocked')
    const { ensOrAddress } = context.req.param()
    const { include, limit } = context.req.valid('query')
    const parsedLimit = Number.parseInt(limit?.toString() || '10', 10)
    const mostBlocked: { address: string; blocked_count: number }[] = await services
      .efp(env(context))
      .getLeaderboardBlocked(parsedLimit)
    return context.json(mostBlocked, 200)
  })
}
