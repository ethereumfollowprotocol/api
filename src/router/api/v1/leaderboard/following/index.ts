import type { Hono, MiddlewareHandler } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { Environment } from '#/types'

export function following(
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
   * Same as /followers, but for following.
   */
  leaderboard.get('/following/:ensOrAddress?', limitValidator, includeValidator, async context => {
    const { ensOrAddress } = context.req.param()
    const { include, limit } = context.req.valid('query')
    const parsedLimit = Number.parseInt(limit as string, 10)
    const mostFollowing: { address: string; following_count: number }[] = await services
      .efp(env(context))
      .getLeaderboardFollowing(parsedLimit)
    return context.json(mostFollowing, 200)
  })
}
