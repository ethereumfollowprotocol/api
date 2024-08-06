import { Hono } from 'hono'

import type { Services } from '#/service'
import type { Environment } from '#/types'
import { blocked } from './blocked'
import { blocks } from './blocks'
import { count } from './count'
import { followers } from './followers'
import { following } from './following'
import { muted } from './muted'
import { mutes } from './mutes'
import { ranked } from './ranked'
import { includeValidator, limitValidator } from './validators'

export function leaderboard(services: Services): Hono<{ Bindings: Environment }> {
  const leaderboard = new Hono<{ Bindings: Environment }>()

  blocked(leaderboard, services, limitValidator, includeValidator)
  blocks(leaderboard, services, limitValidator, includeValidator)
  count(leaderboard, services, limitValidator, includeValidator)
  followers(leaderboard, services, limitValidator, includeValidator)
  following(leaderboard, services, limitValidator, includeValidator)
  muted(leaderboard, services, limitValidator, includeValidator)
  mutes(leaderboard, services, limitValidator, includeValidator)
  ranked(leaderboard, services, limitValidator, includeValidator)

  return leaderboard
}
