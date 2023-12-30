import { Hono } from 'hono'
import { validator } from 'hono/validator'

import type { Services } from '#/service'
import type { Environment } from '#/types'
import { ensureArray } from '#/utilities'
import { blocked } from './blocked'
import { followers } from './followers'
import { following } from './following'
import { muted } from './muted'

const limitValidator = validator('query', value => {
  const { limit } = value

  if (limit !== undefined && !Number.isSafeInteger(Number.parseInt(limit as string, 10))) {
    return new Response(JSON.stringify({ message: 'Accepted format for limit: ?limit=50' }), { status: 400 })
  }
  return value
})

const includeValidator = validator('query', value => {
  const allFilters = ['ens', 'mutuals', 'blocked', 'muted']
  // if only one include query param, type is string, if 2+ then type is array, if none then undefined
  const { include } = <Record<'include', string | string[] | undefined>>value
  // if no include query param, return minimal data
  if (!include) return { include: [] }
  if (ensureArray(include).every(filter => allFilters.includes(filter))) return { include }
  return new Response(
    JSON.stringify({
      message: 'Accepted format for include: ?limit=50&include=ens&include=mutuals&include=blocked&include=muted'
    }),
    { status: 400 }
  )
})

export function leaderboard(services: Services): Hono<{ Bindings: Environment }> {
  const leaderboard = new Hono<{ Bindings: Environment }>()

  blocked(leaderboard, services, limitValidator, includeValidator)
  followers(leaderboard, services, limitValidator, includeValidator)
  following(leaderboard, services, limitValidator, includeValidator)
  muted(leaderboard, services, limitValidator, includeValidator)

  return leaderboard
}
