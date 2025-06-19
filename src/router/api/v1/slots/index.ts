import { Hono } from 'hono'

import type { Services } from '#/service'
import type { Environment } from '#/types'

import { details } from './details'

export function slots(services: Services): Hono<{ Bindings: Environment }> {
  const slots = new Hono<{ Bindings: Environment }>()
  details(slots, services)

  return slots
}
