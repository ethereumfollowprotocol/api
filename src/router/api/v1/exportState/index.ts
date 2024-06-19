import { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { FollowingResponse, IEFPIndexerService } from '#/service/efp-indexer/service'
import type { Environment } from '#/types'
import { prettifyListRecord } from '#/types/list-record'

export function exportState(services: Services): Hono<{ Bindings: Environment }> {
  const exportState = new Hono<{ Bindings: Environment }>()

  exportState.get('/:token_id', async context => {
    const { token_id } = context.req.param()
    if (!token_id || Number.isNaN(token_id)) {
      return context.json({ response: 'Invalid Token Id' }, 404)
    }
    const efp: IEFPIndexerService = services.efp(env(context))
    const followingListRecords: FollowingResponse[] = await efp.getUserFollowingByListRaw(token_id)
    const response = followingListRecords.map(prettifyListRecord)
    return context.json({ following: response }, 200)
  })
  return exportState
}
