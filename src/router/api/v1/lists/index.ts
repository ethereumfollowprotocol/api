import { Hono } from 'hono'

import type { Services } from '#/service'
import type { Environment } from '#/types'
import { details } from './details'
import { followers } from './followers'
import { following } from './following'
import { records } from './records'

export function lists(services: Services): Hono<{ Bindings: Environment }> {
  const lists = new Hono<{ Bindings: Environment }>()

  details(lists, services)
  followers(lists, services)
  following(lists, services)
  records(lists, services)

  return lists
}
