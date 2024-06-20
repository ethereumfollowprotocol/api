import { Hono } from 'hono'

import type { Services } from '#/service'
import type { Environment } from '#/types'
import { buttonState } from './buttonState'
import { details } from './details'
import { followerState } from './followerState'
import { followers } from './followers'
import { following } from './following'
import { records } from './records'

export function lists(services: Services): Hono<{ Bindings: Environment }> {
  const lists = new Hono<{ Bindings: Environment }>()

  buttonState(lists, services)
  details(lists, services)
  followers(lists, services)
  followerState(lists, services)
  following(lists, services)
  records(lists, services)

  return lists
}
