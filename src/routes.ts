import { Hono } from 'hono'
import { sql } from 'drizzle-orm'
import { validator } from 'hono/validator'

import { ensAddress } from '#/viem.ts'
import { apiLogger } from '#/logger.ts'
import { DOCS_URL } from '#/constant.ts'
import { database } from '#/database.ts'
import { sortFields, type Bindings, type SortField } from '#/types'

export const api = new Hono<{ Bindings: Bindings }>().basePath('/v1')

api.get('/', context => context.text(`Visit ${DOCS_URL} for documentation`))

api.get('/postgres-health', async context => {
  const db = await database(context.env)
  const {
    rows: [result]
  } = await db.execute(sql`SELECT * FROM health()`)
  if (result) return context.text(`${Object.values(result)}`, 200)
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

      const db = await database(context.env)
      const [
        {
          // @ts-expect-error
          rows: [{ count: followersCount }]
        },
        {
          // @ts-expect-error
          rows: [{ count: followingCount }]
        }
      ] = await Promise.all([
        db.execute(sql /*sql*/`
          SELECT COUNT(*) FROM get_followers('${sql.raw(address)}');
        `),
        db.execute(sql /*sql*/`
          SELECT COUNT(*) FROM get_following('${sql.raw(address)}');
        `)
      ])

      return context.json(
        { data: { followers: { count: followersCount }, following: { count: followingCount } } },
        200
      )
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

      const db = await database(context.env)
      const { rows, rowCount: count } = await db.execute(sql /*sql*/`
        SELECT
          actor_address,
          action_timestamp
        FROM
          get_followers('${sql.raw(address)}')
        ORDER BY
          action_timestamp ${sql.raw(sort === 'descending' || sort === 'desc' ? 'DESC' : 'ASC')};
      `)

      return context.json({ data: { count, rows } }, 200)
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

      const db = await database(context.env)
      const { rows, rowCount: count } = await db.execute(sql /*sql*/`
        SELECT
          target_address,
          action_timestamp
        FROM
          get_following('${sql.raw(address)}')
        ORDER BY
          action_timestamp ${sql.raw(sort === 'descending' || sort === 'desc' ? 'DESC' : 'ASC')};
      `)

      return context.json({ data: { count, rows } }, 200)
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

      const db = await database(context.env)
      const [
        { rows: followingRows, rowCount: followingCount },
        { rows: followersRows, rowCount: followersCount }
      ] = await Promise.all([
        db.execute(sql /*sql*/`
          SELECT
            target_address,
            action_timestamp
          FROM
            get_following('${sql.raw(address)}')
          ORDER BY
            action_timestamp ${sql.raw(sort === 'descending' || sort === 'desc' ? 'DESC' : 'ASC')};
        `),
        db.execute(sql /*sql*/`
          SELECT
            actor_address,
            action_timestamp
          FROM
            get_followers('${sql.raw(address)}')
          ORDER BY
            action_timestamp ${sql.raw(sort === 'descending' || sort === 'desc' ? 'DESC' : 'ASC')};
        `)
      ])

      return context.json(
        {
          data: {
            followers: { count: followersCount, rows: followersRows },
            following: { count: followingCount, rows: followingRows }
          }
        },
        200
      )
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
