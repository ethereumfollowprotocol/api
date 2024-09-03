import { Hono } from 'hono'

import type { Services } from '#/service'
import type { Environment } from '#/types'
import { image } from './image'
import { metadata } from './metadata'

export function token(services: Services): Hono<{ Bindings: Environment }> {
  const token = new Hono<{ Bindings: Environment }>()

  image(token)
  metadata(token, services)

  token.get('/:token_id', context =>
    context.json(
      {
        message: `Not a valid endpoint. Available subpaths: ${['/image', '/metadata'].join(', ')}`
      },
      501
    )
  )

  return token
}
