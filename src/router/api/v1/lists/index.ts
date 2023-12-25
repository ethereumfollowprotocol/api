import { Hono } from 'hono'

import type { Services } from '#/service'
import type { Environment } from '#/types'
import { records } from './records'

export function lists(services: Services): Hono<{ Bindings: Environment }> {
  const lists = new Hono<{ Bindings: Environment }>()

  records(lists, services)

  return lists
}
