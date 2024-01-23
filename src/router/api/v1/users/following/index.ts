import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { Address, Environment } from '#/types'
import type { TaggedListRecord } from '#/types/list-record'

export function following(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:ensOrAddress/following', async context => {
    const { ensOrAddress } = context.req.param()

    const address: Address = await services.ens().getAddress(ensOrAddress)

    const efp: IEFPIndexerService = services.efp(env(context))
    const followingListRecords: TaggedListRecord[] = await efp.getUserFollowing(address)
    const prettyFollowingListRecords: {
      version: number
      record_type: string
      data: `0x${string}`
      tags: string[]
    }[] = followingListRecords.map(({ version, recordType, data, tags }) => ({
      version,
      record_type: recordType === 1 ? 'address' : `${recordType}`,
      data: `0x${Buffer.from(data).toString('hex')}` as `0x${string}`,
      tags
    }))
    return context.json({ following: prettyFollowingListRecords }, 200)
  })
}
