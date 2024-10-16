import type { Hono } from 'hono'
import { env } from 'hono/adapter'
import type { Services } from '#/service'
import type { IEFPIndexerService } from '#/service/efp-indexer/service'
import type { Address, Environment } from '#/types'
import type { TaggedListRecord } from '#/types/list-record'
import { isAddress } from '#/utilities'

export function listRecords(users: Hono<{ Bindings: Environment }>, services: Services) {
  users.get('/:addressOrENS/list-records', async context => {
    const { addressOrENS } = context.req.param()

    const address: Address = await services.ens(env(context)).getAddress(addressOrENS)
    if (!isAddress(address)) {
      return context.json({ response: 'ENS name not valid or does not exist' }, 404)
    }
    const efp: IEFPIndexerService = services.efp(env(context))
    const listRecords: TaggedListRecord[] = await efp.getUserListRecords(address)
    return context.json(
      {
        records: listRecords.map(({ version, recordType, data, tags }) => ({
          version,
          record_type: recordType === 1 ? 'address' : `${recordType}`,
          data: `0x${Buffer.from(data).toString('hex')}` as `0x${string}`,
          tags
        }))
      },
      200
    )
  })
}
