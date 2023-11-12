import { Hono } from 'hono'
import { validator } from 'hono/validator'

import { ensAddress } from '#/viem.ts'
import { apiLogger } from '#/logger.ts'
import type { Environment } from '#/types'
import { supabaseClient } from '#/database.ts'

export const api = new Hono<{ Bindings: Environment }>().basePath('/v1')

api.get('/', context => {
  return context.text(`Visit https://docs.ethfollow.xyz/api for documentation`)
})

/**
 * Return followers and following counts for a user based on `id` provided (address or ENS name)
 */
api.get(
  '/stats/:id',
  validator('param', value => {
    const { id } = <{ id: string }>value
    if (id) return { id }
    return Response.json({ error: 'id path param is required' }, { status: 400 })
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
        return Response.json({ error: followersError }, { status: followersStatus })
      }
      if (followingError) {
        return Response.json({ error: followingError }, { status: followingStatus })
      }

      return Response.json({ data: { followersCount, followingCount } }, { status: 200 })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Encoutered an error: ${error}`
      apiLogger.error({ errorMessage })
      return Response.json({ error: errorMessage }, { status: 400 })
    }
  }
)

/**
 * Return list of addresses that follow a user based on the `id` provided (address or ENS name)
 * where `id` is the `walletAddress` of the user.
 */
api.get(
  '/followers/:id',
  validator('param', value => {
    const { id } = <{ id: string }>value
    if (id) return { id }
    return Response.json({ error: 'id path param is required' }, { status: 400 })
  }),
  async context => {
    try {
      const { id } = context.req.valid('param')
      const address = await ensAddress({ ensNameOrAddress: id.toLowerCase(), env: context.env })

      const database = supabaseClient(context.env)
      const { data, error, status } = await database
        .rpc('get_followers', {
          target_address: address
        })
        .order('action_timestamp', { ascending: true })
        .select('actor_address,action_timestamp')

      if (error) return Response.json({ error }, { status })
      return Response.json({ data }, { status })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Encoutered an error: ${error}`
      apiLogger.error({ errorMessage })
      return Response.json({ error: errorMessage }, { status: 400 })
    }
  }
)

/**
 * Return list of addresses that a user follows based on the `id` provided (address or ENS name)
 */
api.get(
  '/following/:id',
  validator('param', value => {
    const { id } = <{ id: string }>value
    if (id) return { id }
    return Response.json({ error: 'id path param is required' }, { status: 400 })
  }),
  async context => {
    try {
      const { id } = context.req.valid('param')
      const address = await ensAddress({ ensNameOrAddress: id.toLowerCase(), env: context.env })

      const database = supabaseClient(context.env)
      const { data, error, status } = await database
        .rpc('get_following', {
          actor_address: address
        })
        .select('target_address,action_timestamp')

      if (error) return Response.json({ error }, { status })
      return Response.json({ data }, { status })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Encoutered an error: ${error}`
      apiLogger.error({ errorMessage })
      return Response.json({ error: errorMessage }, { status: 400 })
    }
  }
)

/**
 * Return stats, followers, and following for a user based on the `id` provided (address or ENS name)
 */
api.get(
  '/all/:id',
  validator('param', value => {
    const { id } = <{ id: string }>value
    if (id) return { id }
    return Response.json({ error: 'id path param is required' }, { status: 400 })
  }),
  async context => {
    try {
      const { id } = context.req.valid('param')
      const address = await ensAddress({ ensNameOrAddress: id.toLowerCase(), env: context.env })

      const database = supabaseClient(context.env)
      const [
        { data: following, count: followingCount, error: followingError, status: followingStatus },
        { data: followers, count: followersCount, error: followersError, status: followersStatus }
      ] = await Promise.all([
        database
          .rpc('get_following', { actor_address: address }, { count: 'exact' })
          .select('target_address,action_timestamp'),
        database
          .rpc('get_followers', { target_address: address }, { count: 'exact' })
          .select('actor_address,action_timestamp')
      ])

      if (followersError) {
        return Response.json({ error: followersError }, { status: followersStatus })
      }
      if (followingError) {
        return Response.json({ error: followingError }, { status: followingStatus })
      }

      return Response.json(
        { data: { followersCount, followers, followingCount, following } },
        { status: 200 }
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Encoutered an error: ${error}`
      apiLogger.error({ errorMessage })
      return Response.json({ error: errorMessage }, { status: 400 })
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
