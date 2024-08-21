import { Hono } from 'hono'

import type { Services } from '#/service'
import type { Environment } from '#/types'
import { account } from './account'
import { allFollowers } from './allFollowers'
import { allFollowing } from './allFollowing'
import { allFollowingAddresses } from './allFollowingAddresses'
import { buttonState } from './buttonState'
import { details } from './details'
import { followerState } from './followerState'
import { followers } from './followers'
import { following } from './following'
import { recommended } from './recommended'
import { records } from './records'
import { searchFollowers } from './searchFollowers'
import { searchFollowing } from './searchFollowing'
import { taggedAs } from './taggedAs'
import { tags } from './tags'

export function lists(services: Services): Hono<{ Bindings: Environment }> {
  const lists = new Hono<{ Bindings: Environment }>()
  account(lists, services)
  allFollowers(lists, services)
  allFollowing(lists, services)
  allFollowingAddresses(lists, services)
  buttonState(lists, services)
  details(lists, services)
  followers(lists, services)
  followerState(lists, services)
  following(lists, services)
  recommended(lists, services)
  records(lists, services)
  searchFollowers(lists, services)
  searchFollowing(lists, services)
  taggedAs(lists, services)
  tags(lists, services)

  return lists
}
