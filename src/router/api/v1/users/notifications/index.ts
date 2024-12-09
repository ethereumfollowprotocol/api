import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import { includeValidator } from '#/router/api/v1/leaderboard/validators'
import type { Services } from '#/service'
import type { NotificationRow } from '#/service/efp-indexer/service'
import type { Address, Environment } from '#/types'
import { isAddress } from '#/utilities'

export function notifications(users: Hono<{ Bindings: Environment }>, services: Services) {
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
  users.get('/:addressOrENS/notifications', includeValidator, async context => {
    const { addressOrENS } = context.req.param()
    const { cache } = context.req.query()
    let { offset, limit, opcode, interval, tag } = context.req.valid('query')
    if (!limit) limit = '10'
    if (!offset) offset = '0'
    if (!(opcode && [1, 2, 3, 4].includes(Number(opcode)))) opcode = '0'
    if (!tag || tag === '') tag = 'p_tag_empty'
    if (interval === 'hour') interval = '1:00:00'
    else if (interval === 'day') interval = '24:00:00'
    else if (interval === 'week') interval = '168:00:00'
    else if (interval === 'month') interval = '720:00:00'
    else if (interval === 'all') interval = '999:00:00'
    else interval = '168:00:00'

    const cacheService = services.cache(env(context))
    const cacheTarget = `users/${addressOrENS}/notifications?opcode=${opcode}&interval=${interval}&tag=${tag}&limit=${limit}&offset=${offset}`

    if (cache !== 'fresh') {
      const cacheHit = await cacheService.get(cacheTarget)
      if (cacheHit) {
        return context.json({ ...cacheHit }, 200)
      }
    }

    const ensService = services.ens(env(context))
    const address: Address = await ensService.getAddress(addressOrENS)
    if (!isAddress(address)) {
      return context.json({ response: 'ENS name not valid or does not exist' }, 404)
    }

    const notifications: NotificationRow[] = await services
      .efp(env(context))
      .getNotificationsByAddress(address, opcode as string, interval, tag as string, limit as string, offset as string)

    const response = notifications.map(notification => {
      return {
        address: notification.address,
        name: notification.name,
        avatar: notification.avatar,
        token_id: notification.token_id,
        action:
          Number(notification.opcode) === 1
            ? 'follow'
            : Number(notification.opcode) === 2
              ? 'unfollow'
              : Number(notification.opcode) === 3
                ? 'tag'
                : Number(notification.opcode) === 4
                  ? 'untag'
                  : '',
        opcode: notification.opcode,
        op: notification.op,
        tag: notification.tag,
        updated_at: notification.updated_at
      }
    })
    const summary = {
      interval: `${interval}(hrs)`,
      opcode: opcode === '0' ? 'all' : opcode,
      total: response.length,
      total_follows: response.filter(notification => Number(notification.opcode) === 1).length,
      total_unfollows: response.filter(notification => Number(notification.opcode) === 2).length,
      total_tags: response.filter(notification => Number(notification.opcode) === 3).length,
      total_untags: response.filter(notification => Number(notification.opcode) === 4).length
    }

    const packagedResponse = { summary: summary, notifications: response }

    await cacheService.put(cacheTarget, JSON.stringify(packagedResponse))

    return context.json(packagedResponse, 200)
  })
}
