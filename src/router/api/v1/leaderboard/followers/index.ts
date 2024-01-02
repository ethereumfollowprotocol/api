import type { Hono, MiddlewareHandler } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { Environment } from '#/types'

export function followers(
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
   * By default, only returns leaderboard with address and followers_count/following_count of each user.
   * If include=ens, also returns ens profile of each user.
   * If include=muted, also returns how many users each user has muted.
   * If include=blocked, also returns how many users each user has blocked.
   * If ensOrAddress path param is provided AND include=mutuals query param is provided, returns mutuals between ensOrAddress and each user.
   */
  leaderboard.get('/followers/:ensOrAddress?', limitValidator, includeValidator, async context => {
    const { ensOrAddress } = context.req.param()
    const { include, limit } = context.req.valid('query')
    const parsedLimit = Number.parseInt(limit?.toString() || '10', 10)
    const mostFollowers: { address: string; followers_count: number }[] = await services
      .efp(env(context))
      .getLeaderboardFollowers(parsedLimit)
    return context.json(mostFollowers, 200)
  })
}
