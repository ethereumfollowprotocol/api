import { Hono } from 'hono';
import { validator } from 'hono/validator';

import { DOCS_URL } from '#/constant.ts';
import { kyselyDb, supabaseClient } from '#/database.ts';
import { apiLogger } from '#/logger.ts';
import { sortFields, type Environment, type SortField } from '#/types';
import { ensAddress } from '#/viem.ts';

export const api = new Hono<{ Bindings: Environment }>().basePath('/v1')

api.get('/', context => context.text(`Visit ${DOCS_URL} for documentation`))

api.get('/postgres-health', async context => {
  const database = supabaseClient(context.env)
  const { error, data, status } = await database.rpc('health', {}).select('*')
  if (status === 200 && data) return context.text(`${data}`, 200)
  apiLogger.error(`error while checking supabase health: ${JSON.stringify(error, undefined, 2)}`)
  return context.text('error while checking supabase health', 500)
})

// TODO: in progress need to consolidate db interface into service
api.get('/kysely-health', async context => {
  const database = kyselyDb(context.env)

  // do a simple query to check if the database is up
  try {
  await database
    .selectFrom('contracts')
    .select('name').limit(1)
    .execute()
  } catch (error) {
    apiLogger.error(`error while checking postgres health: ${JSON.stringify(error, undefined, 2)}`)
    return context.text('error while checking postgres health', 500)
  }
  // database is up
  return context.text('ok', 200)
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

/**
 * Fetch from ENS worker
 */
api.get('/ens/:type/:id', async context => {
  const { type, id } = context.req.param()
  const ensWorkerResponse = await fetch(`https://ens.ethfollow.xyz/${type}/${id}`)
  if (!ensWorkerResponse.ok) {
    return context.json({ error: await ensWorkerResponse.text() }, 500)
  }
  const ensProfileData = await ensWorkerResponse.json()
  return context.json(ensProfileData, 200)
})

api.get('/health', context => context.text('ok'))

api.get('/docs', context => {
  return context.redirect('https://docs.ethfollow.xyz/api', 301)
})

api.get('/routes', context => {
  return context.json(api.routes.filter(route => route.method !== 'ALL'))
})
