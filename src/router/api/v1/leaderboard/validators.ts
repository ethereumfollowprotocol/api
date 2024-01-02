import { validator } from 'hono/validator'
import { ensureArray } from '#/utilities'

export const limitValidator = validator('query', value => {
  const { limit } = value
  if (limit !== undefined && !Number.isSafeInteger(Number.parseInt(limit as string, 10))) {
    return new Response(JSON.stringify({ message: 'Accepted format for limit: ?limit=50' }), { status: 400 })
  }
  return value
})

export type LimitValidator = typeof limitValidator

export const includeValidator = validator('query', value => {
  const allFilters = ['ens', 'mutuals', 'blocked', 'muted']
  // if only one include query param, type is string, if 2+ then type is array, if none then undefined
  const { include } = <Record<'include', string | string[] | undefined>>value
  // if no include query param, return minimal data
  if (!include) return value
  if (ensureArray(include).every(filter => allFilters.includes(filter))) {
    return value
  }
  return new Response(
    JSON.stringify({
      message: 'Accepted format for include: ?include=ens&include=mutuals&include=blocked&include=muted'
    }),
    { status: 400 }
  )
})

export type IncludeValidator = typeof includeValidator
