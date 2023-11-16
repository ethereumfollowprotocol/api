import { Hono } from 'hono'
import { validator } from 'hono/validator'

import { ensAddress } from '#/viem.ts'
import { apiLogger } from '#/logger.ts'
import { DOCS_URL } from '#/constant.ts'
import { supabaseClient } from '#/database.ts'
import { type Environment, type SortField, sortFields } from '#/types'

export const api = new Hono<{ Bindings: Environment }>().basePath('/v1')

api.get('/', context => context.text(`Visit ${DOCS_URL} for documentation`))

api.get('/postgres-health', async context => {
  const database = supabaseClient(context.env)
  const { error, data, status } = await database.rpc('health', {}).select('*')
  if (status === 200 && data) return context.text(`${data}`, 200)
  apiLogger.error(`error while checking postgres health: ${JSON.stringify(error, undefined, 2)}`)
  return context.text('error while checking postgres health', 500)
})

/**
 * Return followers and following counts for a user based on `id` provided (address or ENS name)
 */
api.get(
  '/stats/:id',
  validator('param', (value, context) => {
    const { id } = <{ id: string }>value
    if (!id) return context.json({ error: 'id path param is required' }, 400)
    return { id }
  }),
  async context => {
    try {
      const { id } = context.req.valid('param')
      const address = await ensAddress({ ensNameOrAddress: id.toLowerCase(), env: context.env })

      const database = supabaseClient(context.env)
      const [
        { count: followingCount, error: followingError, status: followingStatus },
        { count: followersCount, error: followersError, status: followersStatus }
      ] = await Promise.all([
        database.rpc('get_following', { actor_address: address }, { count: 'exact' }),
        database.rpc('get_followers', { target_address: address }, { count: 'exact' })
      ])

      if (followersError) {
        return context.json({ error: followersError }, followersStatus)
      }
      if (followingError) {
        return context.json({ error: followingError }, followingStatus)
      }

      return context.json({ data: { followersCount, followingCount } }, 200)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Encoutered an error: ${error}`
      apiLogger.error({ errorMessage })
      return context.json({ error: errorMessage }, 400)
    }
  }
)

/**
 * Return list of addresses that follow a user based on the `id` provided (address or ENS name)
 * where `id` is the `walletAddress` of the user.
 */
api.get(
  '/followers/:id',
  validator('param', (value, context) => {
    const { id } = <{ id: string }>value
    if (!id) return context.json({ error: 'id path param is required' }, 400)
    return { id }
  }),
  validator('query', (value, context) => {
    // default sort to ascending
    const { sort = 'ascending' } = <{ sort: SortField }>value
    if (!sortFields.includes(sort)) {
      const error = '`sort` must be one of: ascending, descending, asc, desc. Default: ascending'
      return context.json({ error }, 400)
    }
    return { sort }
  }),
  async context => {
    try {
      const { id } = context.req.valid('param')
      const { sort } = context.req.valid('query')

      const address = await ensAddress({ ensNameOrAddress: id.toLowerCase(), env: context.env })

      const database = supabaseClient(context.env)
      const { data, error, status } = await database
        .rpc('get_followers', { target_address: address })
        .order('action_timestamp', { ascending: sort === 'ascending' || sort === 'asc' })
        .select('actor_address,action_timestamp')

      if (error) return context.json({ error }, status)
      return context.json({ data }, status)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Encoutered an error: ${error}`
      apiLogger.error({ errorMessage })
      return context.json({ error: errorMessage }, 400)
    }
  }
)

/**
 * Return list of addresses that a user follows based on the `id` provided (address or ENS name)
 */
api.get(
  '/following/:id',
  validator('param', (value, context) => {
    const { id } = <{ id: string }>value
    if (!id) return context.json({ error: 'id path param is required' }, 400)
    return { id }
  }),
  validator('query', (value, context) => {
    // default sort to ascending
    const { sort = 'ascending' } = <{ sort: SortField }>value
    if (!sortFields.includes(sort)) {
      const error = '`sort` must be one of: ascending, descending, asc, desc. Default: ascending'
      return context.json({ error }, 400)
    }
    return { sort }
  }),
  async context => {
    try {
      const { id } = context.req.valid('param')
      const { sort } = context.req.valid('query')

      const address = await ensAddress({ ensNameOrAddress: id.toLowerCase(), env: context.env })

      const database = supabaseClient(context.env)
      const { data, error, status } = await database
        .rpc('get_following', { actor_address: address })
        .select('target_address,action_timestamp')
        .order('action_timestamp', { ascending: sort === 'ascending' || sort === 'asc' })

      if (error) return context.json({ error }, status)
      return context.json({ data }, status)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Encoutered an error: ${error}`
      apiLogger.error({ errorMessage })
      return context.json({ error: errorMessage }, 400)
    }
  }
)

/**
 * Return stats, followers, and following for a user based on the `id` provided (address or ENS name)
 */
api.get(
  '/all/:id',
  validator('param', (value, context) => {
    const { id } = <{ id: string }>value
    if (!id) return context.json({ error: 'id path param is required' }, 400)
    return { id }
  }),
  validator('query', (value, context) => {
    // default sort to ascending
    const { sort = 'ascending' } = <{ sort: SortField }>value
    if (!sortFields.includes(sort)) {
      const error = '`sort` must be one of: ascending, descending, asc, desc. Default: ascending'
      return context.json({ error }, 400)
    }
    return { sort }
  }),
  async context => {
    try {
      const { id } = context.req.valid('param')
      const { sort } = context.req.valid('query')

      const address = await ensAddress({ ensNameOrAddress: id.toLowerCase(), env: context.env })

      const database = supabaseClient(context.env)
      const [
        { data: following, count: followingCount, error: followingError, status: followingStatus },
        { data: followers, count: followersCount, error: followersError, status: followersStatus }
      ] = await Promise.all([
        database
          .rpc('get_following', { actor_address: address }, { count: 'exact' })
          .select('target_address,action_timestamp')
          .order('action_timestamp', { ascending: sort === 'ascending' || sort === 'asc' }),
        database
          .rpc('get_followers', { target_address: address }, { count: 'exact' })
          .select('actor_address,action_timestamp')
          .order('action_timestamp', { ascending: sort === 'ascending' || sort === 'asc' })
      ])

      if (followersError) {
        return context.json({ error: followersError }, followersStatus)
      }
      if (followingError) {
        return context.json({ error: followingError }, followingStatus)
      }

      return context.json({ data: { followersCount, followers, followingCount, following } }, 200)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Encoutered an error: ${error}`
      apiLogger.error({ errorMessage })
      return context.json({ error: errorMessage }, 400)
    }
  }
)

api.get('/health', context => context.text('ok'))

api.get('/docs', context => {
  return context.redirect('https://docs.ethfollow.xyz/api', 301)
})

api.get('/routes', context => {
  if (context.env.ENV === 'production') return context.notFound()
  return context.json(api.routes.filter(route => route.method !== 'ALL'))
})
