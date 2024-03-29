import { Hono } from 'hono'

import type { Services } from '#/service'
import type { Environment } from '#/types'
import { ens } from './ens'
import { followers } from './followers'
import { following } from './following'
import { listRecords } from './list-records'
import { primaryList } from './primary-list'
import { profile } from './profile'
import { relationships } from './relationships'
import { stats } from './stats'

export function users(services: Services): Hono<{ Bindings: Environment }> {
  const users = new Hono<{ Bindings: Environment }>()

  // ENS profile metadata
  ens(users, services)
  followers(users, services)
  following(users, services)
  listRecords(users, services)
  primaryList(users, services)
  profile(users, services)
  relationships(users, services)
  stats(users, services)

  users.get('/:addressOrENS', context =>
    context.json(
      {
        message: `Not a valid endpoint. Available subpaths: ${[
          '/ens',
          '/followers',
          '/following',
          '/primary-list',
          '/profile',
          '/relationships',
          '/stats'
        ].join(', ')}`
      },
      501
    )
  )

  // Blocked by user
  // biome-ignore lint/nursery/useAwait: <explanation>
  users.get('/:addressOrENS/blocks', async context => {
    return context.text('Not implemented', 501)
  })

  // Muted by user
  // biome-ignore lint/nursery/useAwait: <explanation>
  users.get('/:addressOrENS/mutes', async context => {
    return context.text('Not implemented', 501)
  })

  // Mutuals with users
  // biome-ignore lint/nursery/useAwait: <explanation>
  users.get('/:addressOrENS/mutuals', async context => {
    return context.text('Not implemented', 501)
  })

  return users
}
