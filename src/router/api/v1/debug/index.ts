import { Hono } from 'hono'

import type { Services } from '#/service'
import type { Environment } from '#/types'
import { numEvents } from './num-events'
import { numListOps } from './num-list-ops'
import { totalSupply } from './total-supply'

export function debug(services: Services): Hono<{ Bindings: Environment }> {
  const debug = new Hono<{ Bindings: Environment }>()

  numEvents(debug, services)
  numListOps(debug, services)
  totalSupply(debug, services)

  return debug
}
